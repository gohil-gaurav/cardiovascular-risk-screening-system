import json
import logging
import os
from typing import Any
from dotenv import load_dotenv

from langchain_core.messages import SystemMessage, HumanMessage
from langchain_core.output_parsers import JsonOutputParser
from langchain_core.prompts import ChatPromptTemplate
from langchain_groq import ChatGroq
from langchain_mistralai import ChatMistralAI

load_dotenv()
logger = logging.getLogger(__name__)

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
MISTRAL_API_KEY = os.getenv("MISTRAL_API_KEY")

# Primary model - Groq (fastest)
GROQ_MODEL = "groq/compound-mini"

# Fallback model - Mistral
MISTRAL_MODEL = "mistral-small-latest"

MAX_RETRIES = 2

SYSTEM_PROMPT = """You are a medical communication assistant. 
Your job is to help a doctor explain a cardiovascular risk 
screening result to a patient in simple, warm, 
non-alarming language.

Rules you must always follow:
- Do NOT use technical terms like model, algorithm, 
  cluster, SHAP, neural network, probability
- Do NOT diagnose the patient. This is a screening 
  result not a medical diagnosis.
- Base your explanation ONLY on the data provided. 
  Never invent numbers or facts.
- Keep patient_summary under 100 words.
- Use supportive, calm, encouraging tone.
- For value_explanations never use numbers like 0 or 1.
  Always translate to plain English.
  For example: smoke=0 means "Non-smoker" 
  active=1 means "Physically active"
- Return ONLY valid JSON. No markdown, no code fences,
  no extra text before or after the JSON.

Return exactly this JSON structure:
{
  "patient_summary": "2-4 sentence plain-language explanation of the overall result",
  
  "key_factors": [
    "short phrase 1",
    "short phrase 2",
    "short phrase 3"
  ],
  
  "suggested_next_step": "one gentle general suggestion not a prescription",
  
  "value_explanations": {
    "smoke": "plain English explanation of smoking status",
    "active": "plain English explanation of activity level",
    "cholesterol": "plain English explanation of cholesterol level",
    "gluc": "plain English explanation of glucose level",
    "blood_pressure": "plain English explanation of blood pressure reading",
    "bmi": "plain English explanation of BMI value"
  },
  
  "cluster_explanation": "1-2 sentences explaining why the patient was placed in their risk group and what that group typically looks like based on the actual risk tier provided",
  
  "risk_threshold_explanation": "1 sentence explaining what the risk percentage means in simple terms for example: a score of 72 percent means roughly 7 in 10 patients with similar readings develop cardiovascular disease without medical support"
}"""

FALLBACK_RESPONSE = {
    "patient_summary": (
        "Your screening result is ready. Please discuss "
        "these results with your doctor for a full explanation."
    ),
    "key_factors": ["Screening completed"],
    "suggested_next_step": (
        "Please consult your doctor to review "
        "these results in detail."
    ),
    "value_explanations": {
        "smoke": "Smoking status recorded",
        "active": "Physical activity level recorded",
        "cholesterol": "Cholesterol level recorded",
        "gluc": "Glucose level recorded",
        "blood_pressure": "Blood pressure recorded",
        "bmi": "BMI calculated"
    },
    "cluster_explanation": (
        "You have been grouped with patients who share "
        "similar health indicators."
    ),
    "risk_threshold_explanation": (
        "Your score reflects your cardiovascular risk "
        "level based on your health indicators."
    ),
    "fallback_used": True,
}

REQUIRED_KEYS = {
    "patient_summary",
    "key_factors",
    "suggested_next_step",
    "value_explanations",
    "cluster_explanation",
    "risk_threshold_explanation"
}


def _risk_tier_from_pct(risk_pct: float) -> str:
    if risk_pct >= 75:
        return "High Risk"
    elif risk_pct >= 45:
        return "Moderate Risk"
    else:
        return "Low Risk"


def build_combined_from_predict_response(
    predict_response: dict[str, Any],
    patient: Any,
) -> dict[str, Any]:
    xgb_risk_pct = predict_response["risk_score"]
    mlp_risk_pct = predict_response["mlp_risk_score"]
    final_risk_pct = round((xgb_risk_pct + mlp_risk_pct) / 2, 2)
    risk_tier = _risk_tier_from_pct(final_risk_pct)
    population_comparison_tier = predict_response["clustering"]["risk_tier"]
    prediction = "Disease" if predict_response["prediction"] == 1 else "No Disease"

    top_factors = []
    for item in predict_response.get("primary_drivers", [])[:3]:
        importance = item.get("importance_pct", 0)
        impact = "high" if importance >= 50 else "moderate" if importance >= 20 else "low"
        top_factors.append({
            "feature": item["factor"],
            "label": item["factor"],
            "value": item.get("contribution", ""),
            "impact": impact,
        })

    cholesterol_map = {1: "normal", 2: "above normal", 3: "well above normal"}
    gluc_map = {1: "normal", 2: "above normal", 3: "well above normal"}
    bmi = round(patient.weight / ((patient.height / 100) ** 2), 1)

    patient_context = {
        "age": int(patient.age),
        "gender": "male" if patient.gender == 1 else "female",
        "bmi": bmi,
        "bp": f"{patient.ap_hi}/{patient.ap_lo}",
        "cholesterol": cholesterol_map.get(patient.cholesterol, "normal"),
        "cholesterol_raw": patient.cholesterol,
        "glucose": gluc_map.get(patient.gluc, "normal"),
        "glucose_raw": patient.gluc,
        "smoker": bool(patient.smoke),
        "smoker_raw": patient.smoke,
        "active": bool(patient.active),
        "active_raw": patient.active,
    }

    return {
        "final_risk_pct": final_risk_pct,
        "risk_tier": risk_tier,
        "population_comparison_tier": population_comparison_tier,
        "prediction": prediction,
        "top_factors": top_factors,
        "patient_context": patient_context,
        "clustering_confidence": predict_response.get(
            "clustering_confidence", {}
        ),
    }


def build_user_message(combined: dict[str, Any]) -> str:
    factors_text = ", ".join(
        f'{f["label"]} ({f["impact"]} impact)' 
        for f in combined["top_factors"]
    )
    ctx = combined["patient_context"]
    
    smoke_text = "Non-smoker" if not ctx["smoker"] else "Smoker"
    active_text = "Physically active" if ctx["active"] else "Not physically active"
    
    return f"""Patient screening result:
- Risk level: {combined["risk_tier"]} ({combined["final_risk_pct"]}%)
- Prediction: {combined["prediction"]}
- Age: {ctx["age"]}, Gender: {ctx["gender"]}
- Blood pressure: {ctx["bp"]}
- Cholesterol level: {ctx["cholesterol"]} (raw value: {ctx["cholesterol_raw"]})
- Glucose level: {ctx["glucose"]} (raw value: {ctx["glucose_raw"]})
- BMI: {ctx["bmi"]}
- Smoking status: {smoke_text} (raw value: {ctx["smoker_raw"]})
- Physical activity: {active_text} (raw value: {ctx["active_raw"]})
- Population group: {combined["population_comparison_tier"]}
- Top contributing factors: {factors_text}

Important context for value_explanations:
- smoke=0 means Non-smoker, smoke=1 means Smoker
- active=0 means Not physically active, active=1 means Active
- cholesterol=1 means Normal, 2 means Above normal, 3 means Well above normal
- gluc=1 means Normal, 2 means Above normal, 3 means Well above normal

Explain this result to the patient following the JSON 
format and rules given in the system prompt."""


def _get_groq_llm():
    return ChatGroq(
        api_key=GROQ_API_KEY,
        model=GROQ_MODEL,
        temperature=0.3,
        max_tokens=1000,
    )


def _get_mistral_llm():
    return ChatMistralAI(
        api_key=MISTRAL_API_KEY,
        model=MISTRAL_MODEL,
        temperature=0.3,
        max_tokens=1000,
    )


def _call_llm_with_langchain(
    system_prompt: str, 
    user_message: str,
    use_mistral: bool = False
) -> str:
    """
    Calls LLM using LangChain.
    Uses Groq by default, Mistral as fallback.
    """
    if use_mistral:
        llm = _get_mistral_llm()
        logger.info("Using Mistral as LLM provider")
    else:
        llm = _get_groq_llm()
        logger.info("Using Groq as LLM provider")

    messages = [
        SystemMessage(content=system_prompt),
        HumanMessage(content=user_message),
    ]

    response = llm.invoke(messages)
    return response.content


def _parse_llm_json(raw_text: str) -> dict[str, Any] | None:
    cleaned = raw_text.strip()
    
    if cleaned.startswith("```"):
        cleaned = cleaned.strip("`")
        if cleaned.startswith("json"):
            cleaned = cleaned[4:].strip()

    try:
        parsed = json.loads(cleaned)
    except json.JSONDecodeError:
        return None

    if not REQUIRED_KEYS.issubset(parsed.keys()):
        logger.warning(
            "Missing keys in LLM response. "
            "Got: %s, Required: %s",
            set(parsed.keys()),
            REQUIRED_KEYS
        )
        return None

    return parsed


def get_llm_explanation(combined: dict[str, Any]) -> dict[str, Any]:
    """
    Main entry point. 
    1. Try Groq first (fast)
    2. If Groq fails try Mistral (fallback)
    3. If both fail return FALLBACK_RESPONSE
    """
    user_message = build_user_message(combined)
    
    providers = [
        (False, "Groq"),   # False = use Groq
        (True, "Mistral"), # True = use Mistral
    ]

    for use_mistral, provider_name in providers:
        for attempt in range(1, MAX_RETRIES + 1):
            try:
                logger.info(
                    "Calling %s (attempt %s/%s)",
                    provider_name, attempt, MAX_RETRIES
                )
                
                raw_text = _call_llm_with_langchain(
                    SYSTEM_PROMPT,
                    user_message,
                    use_mistral=use_mistral
                )
                
                logger.info(
                    "%s responded, parsing JSON...",
                    provider_name
                )
                
                parsed = _parse_llm_json(raw_text)
                
                if parsed is not None:
                    logger.info(
                        "Success with %s on attempt %s",
                        provider_name, attempt
                    )
                    parsed["provider_used"] = provider_name
                    return parsed

                logger.warning(
                    "%s returned invalid JSON on attempt %s. "
                    "Raw: %s",
                    provider_name, attempt, raw_text[:200]
                )

            except Exception as exc:
                logger.warning(
                    "%s call failed (attempt %s/%s): %s",
                    provider_name, attempt, MAX_RETRIES, exc
                )
                continue

    logger.error(
        "All LLM providers failed. Using fallback response."
    )
    return dict(FALLBACK_RESPONSE)


def generate_patient_report(
    predict_response: dict[str, Any],
    patient: Any,
) -> dict[str, Any]:
    """
    Full pipeline:
    1. Build combined from predict response
    2. Call LLM (Groq → Mistral → fallback)
    3. Return final report
    """
    combined = build_combined_from_predict_response(
        predict_response, patient
    )
    explanation = get_llm_explanation(combined)

    return {
        "final_risk_pct": combined["final_risk_pct"],
        "risk_tier": combined["risk_tier"],
        "prediction": combined["prediction"],
        "top_factors": combined["top_factors"],
        "patient_summary": explanation["patient_summary"],
        "key_factors": explanation["key_factors"],
        "suggested_next_step": explanation["suggested_next_step"],
        "value_explanations": explanation.get(
            "value_explanations", {}
        ),
        "cluster_explanation": explanation.get(
            "cluster_explanation", ""
        ),
        "risk_threshold_explanation": explanation.get(
            "risk_threshold_explanation", ""
        ),
        "provider_used": explanation.get(
            "provider_used", "fallback"
        ),
        "fallback_used": explanation.get(
            "fallback_used", False
        ),
    }
