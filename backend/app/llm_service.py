

import json
import logging
import os
from typing import Any

from groq import Groq
from dotenv import load_dotenv

from app.feature_labels import (
    SMOKE_LABELS,
    ALCOHOL_LABELS,
    ACTIVITY_LABELS,
    CHOLESTEROL_LABELS,
    GLUCOSE_LABELS,
    GENDER_LABELS,
)

# Load environment variables (.env file)
load_dotenv()

logger = logging.getLogger(__name__)

# Config

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_MODEL_NAME = os.getenv("GROQ_MODEL_NAME", "groq/compound-mini")
MAX_RETRIES = 1

if not GROQ_API_KEY:
    logger.warning("GROQ_API_KEY not found in .env")
else:
    logger.info("Groq API key loaded successfully")


SYSTEM_PROMPT = """You are a medical communication assistant. Your job is to help a doctor \
explain a cardiovascular risk screening result to a patient in simple, warm, non-alarming language.

Rules you must always follow:
- Do NOT use technical terms like "model", "algorithm", "cluster", "SHAP", "neural network", "probability"
- Do NOT diagnose the patient. This is a screening result, not a medical diagnosis.
- Base your explanation ONLY on the data provided. Never invent numbers or facts.
- Keep the patient_summary under 100 words.
- Use a supportive, calm, encouraging tone. Avoid alarming or clinical language.
- If the population match confidence is close between two tiers (both above 30%), mention in clinician_note that this case is borderline. Otherwise omit this.
- Return ONLY valid JSON. No markdown, no code fences, no extra text before or after the JSON.

Return exactly this JSON structure:
{
  "patient_summary": "2-4 sentence plain-language explanation of the result",
  "key_factors": ["short phrase 1", "short phrase 2", "short phrase 3"],
  "suggested_next_step": "one gentle, general suggestion (not a prescription)",
  "clinician_note": "1-2 sentence clinical-toned note for the doctor, may include brief comparison to the matched population group if relevant",
  "group_context": "1 short sentence explaining what the matched population group typically looks like, in plain language for the patient"
}
"""

FALLBACK_RESPONSE = {
    "patient_summary": (
        "Your screening result is ready. Please discuss these results with "
        "your doctor for a full explanation."
    ),
    "key_factors": ["Screening completed"],
    "suggested_next_step": "Please consult your doctor to review these results in detail.",
    "clinician_note": "Patient screening completed. Review overall clinical indicators and secondary model comparison for detailed evaluation.",
    "group_context": "You are grouped with similar patients based on overall demographic and clinical health indicators.",
    "fallback_used": True,
}

REQUIRED_KEYS = {
    "patient_summary",
    "key_factors",
    "suggested_next_step",
    "clinician_note",
    "group_context",
}


# ---------------------------------------------------------------------------
# Step 1 — Adapt the real /predict response into the LLM input format
# ---------------------------------------------------------------------------
#
# NOTE: In this project, main.py's predict_risk() already merges the
# XGBoost model (A), KMeans clustering (B), and PyTorch MLP + SHAP (C)
# into one response dict. So Student D's job is not to call three separate
# models — it's to adapt that already-combined response into the shape
# the LLM prompt needs, and average the two risk scores (XGBoost + MLP)
# into one final number so the patient only ever sees one figure.

def _risk_tier_from_pct(risk_pct: float) -> str:
    """
    Derives the primary risk tier label from the averaged risk percentage,
    using the same thresholds main.py already applies to the XGBoost score.
    This keeps the tier always consistent with the number shown next to it.
    """
    if risk_pct >= 75:
        return "High Risk"
    elif risk_pct >= 45:
        return "Moderate Risk"
    else:
        return "Low Risk"


def _describe_cluster_profile(centroid_dict: dict[str, Any] | None) -> str:
    """Converts a matched cluster's centroid metrics into a short natural-language description."""
    if not centroid_dict:
        return "generally average health metrics"

    ap_hi = centroid_dict.get("ap_hi", 120)
    chol = centroid_dict.get("cholesterol", 1.0)

    if ap_hi >= 130 and chol >= 1.5:
        return "elevated blood pressure and elevated cholesterol on average"
    elif ap_hi >= 130:
        return "elevated blood pressure and generally normal cholesterol on average"
    elif chol >= 1.5:
        return "well-managed blood pressure and elevated cholesterol on average"
    else:
        return "well-managed blood pressure and healthy cholesterol on average"


def build_combined_from_predict_response(
    predict_response: dict[str, Any],
    patient: Any,  # the PatientData instance passed into predict_risk()
) -> dict[str, Any]:
    """
    Takes the dict returned by main.py's predict_risk() and the original
    PatientData request, and produces the combined object used to build
    the LLM prompt.
    """
    # Primary classifier (XGBoost) - official risk_score and prediction
    final_risk_pct = predict_response["risk_score"]
    risk_tier = _risk_tier_from_pct(final_risk_pct)
    population_comparison_tier = predict_response["clustering"]["risk_tier"]  # B's cluster label, kept separately
    prediction = "Disease" if predict_response["prediction"] == 1 else "No Disease"

    # Secondary comparison model (PyTorch MLP) - strictly separated for doctor technical view
    secondary_model_comparison = {
        "mlp_risk_score": predict_response.get("mlp_risk_score"),
        "mlp_risk_level": predict_response.get("mlp_risk_level"),
        "mlp_prediction": predict_response.get("mlp_prediction"),
        "role": "secondary_comparison",
    }

    # primary_drivers is already sorted/formatted by main.py's SHAP logic -
    # just take the top 3 and reshape into {feature, label, value, impact}
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

    if isinstance(patient, dict):
        p_weight = patient["weight"]
        p_height = patient["height"]
        p_age = patient["age"]
        p_gender = patient["gender"]
        p_ap_hi = patient["ap_hi"]
        p_ap_lo = patient["ap_lo"]
        p_cholesterol = patient["cholesterol"]
        p_gluc = patient["gluc"]
        p_smoke = patient["smoke"]
        p_alco = patient["alco"]
        p_active = patient["active"]
    else:
        p_weight = patient.weight
        p_height = patient.height
        p_age = patient.age
        p_gender = patient.gender
        p_ap_hi = patient.ap_hi
        p_ap_lo = patient.ap_lo
        p_cholesterol = patient.cholesterol
        p_gluc = patient.gluc
        p_smoke = patient.smoke
        p_alco = patient.alco
        p_active = patient.active

    bmi = round(p_weight / ((p_height / 100) ** 2), 1)

    # Human-readable patient_context using shared decoding dictionaries
    patient_context = {
        "age": int(p_age),
        "gender": GENDER_LABELS.get(p_gender, "Female" if p_gender == 2 else "Male"),
        "bmi": bmi,
        "bp": f"{p_ap_hi}/{p_ap_lo}",
        "cholesterol": CHOLESTEROL_LABELS.get(p_cholesterol, "Normal"),
        "glucose": GLUCOSE_LABELS.get(p_gluc, "Normal"),
        "smoker": SMOKE_LABELS.get(p_smoke, "Non-smoker"),
        "alcohol": ALCOHOL_LABELS.get(p_alco, "Does not drink alcohol"),
        "active": ACTIVITY_LABELS.get(p_active, "Physically active"),
    }

    # Clustering profile analysis & confidence details
    clustering_info = predict_response.get("clustering", {})
    centroids_map = clustering_info.get("centroids", {})
    matched_tier = clustering_info.get("risk_tier", "Low Risk")
    matched_centroid = centroids_map.get(matched_tier, {})

    cluster_profile_description = _describe_cluster_profile(matched_centroid)

    matched_centroid_summary = {
        "avg_age": round(matched_centroid.get("age", 50), 1) if isinstance(matched_centroid.get("age"), (int, float)) else 50,
        "avg_bp": f"{round(matched_centroid.get('ap_hi', 120))}/{round(matched_centroid.get('ap_lo', 80))}",
        "avg_cholesterol": matched_centroid.get("cholesterol", 1.0),
    }

    conf_dict = predict_response.get("clustering_confidence", {}) or {}
    sorted_conf = sorted(conf_dict.items(), key=lambda x: x[1], reverse=True)

    if sorted_conf:
        top_tier, top_prob = sorted_conf[0]
        top_pct = round(top_prob * 100)
    else:
        top_tier, top_pct = matched_tier, 100

    if len(sorted_conf) > 1:
        second_tier, second_prob = sorted_conf[1]
        second_pct = round(second_prob * 100)
    else:
        second_tier, second_pct = "None", 0

    confidence_summary = {
        "top_tier": top_tier,
        "top_pct": top_pct,
        "second_tier": second_tier,
        "second_pct": second_pct,
        "is_close": (top_pct >= 30 and second_pct >= 30),
    }

    return {
        "final_risk_pct": final_risk_pct,
        "risk_tier": risk_tier,
        "population_comparison_tier": population_comparison_tier,
        "prediction": prediction,
        "top_factors": top_factors,
        "patient_context": patient_context,
        "secondary_model_comparison": secondary_model_comparison,
        "clustering_confidence": predict_response.get("clustering_confidence", {}),
        "cluster_profile_description": cluster_profile_description,
        "matched_centroid_summary": matched_centroid_summary,
        "confidence_summary": confidence_summary,
    }


# ---------------------------------------------------------------------------
# Step 2 — Build the user message sent to the LLM
# ---------------------------------------------------------------------------

def build_user_message(combined: dict[str, Any]) -> str:
    factors_text = ", ".join(
        f'{f["label"]} ({f["impact"]} impact)' for f in combined["top_factors"]
    )
    ctx = combined["patient_context"]
    conf = combined.get("confidence_summary", {})
    profile_desc = combined.get("cluster_profile_description", "well-managed blood pressure and healthy cholesterol on average")
    cent = combined.get("matched_centroid_summary", {})
    avg_age = cent.get("avg_age", 50)
    avg_bp = cent.get("avg_bp", "120/80")

    top_tier = conf.get("top_tier", combined["risk_tier"])
    top_pct = conf.get("top_pct", 100)
    second_tier = conf.get("second_tier", "None")
    second_pct = conf.get("second_pct", 0)

    return f"""Patient screening result:
- Risk level: {combined["risk_tier"]} ({combined["final_risk_pct"]}%)
- Age: {ctx["age"]}, Gender: {ctx["gender"]}
- Blood pressure: {ctx["bp"]}
- Cholesterol: {ctx["cholesterol"]}
- BMI: {ctx["bmi"]}
- Physically active: {ctx["active"] if isinstance(ctx["active"], str) else ("Yes" if ctx["active"] else "No")}
- Top contributing factors: {factors_text}
- Population match confidence: {top_tier} at {top_pct}% (nearest alternative: {second_tier} at {second_pct}%)
- Typical profile of matched group: {profile_desc} (avg age {avg_age}, avg BP {avg_bp})

Explain this result to the patient following the JSON format and rules given."""


# ---------------------------------------------------------------------------
# Step 3 — Call Groq API
# ---------------------------------------------------------------------------

def _call_groq(system_prompt: str, user_message: str) -> str:
    """Calls Groq API and returns the raw text response."""
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise ValueError("GROQ_API_KEY is not configured in .env")

    client = Groq(api_key=api_key)

    print(f"Calling Groq API (model: {GROQ_MODEL_NAME})...")
    completion = client.chat.completions.create(
        model=GROQ_MODEL_NAME,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_message},
        ],
        temperature=0.3,
        max_tokens=350,
        response_format={"type": "json_object"},
    )
    print("Groq API responded successfully")
    return completion.choices[0].message.content or ""


def _parse_llm_json(raw_text: str) -> dict[str, Any] | None:
    """Cleans and parses the LLM's raw text response. Returns None if invalid."""
    cleaned = raw_text.strip()

    # local models sometimes wrap JSON in ```json fences despite instructions not to
    if cleaned.startswith("```"):
        cleaned = cleaned.strip("`")
        if cleaned.startswith("json"):
            cleaned = cleaned[4:].strip()

    try:
        parsed = json.loads(cleaned)
    except json.JSONDecodeError:
        return None

    if not REQUIRED_KEYS.issubset(parsed.keys()):
        return None

    return parsed


# ---------------------------------------------------------------------------
# Step 4 — Public function: get the patient-facing explanation
# ---------------------------------------------------------------------------

def get_llm_explanation(combined: dict[str, Any]) -> dict[str, Any]:
    """
    Main entry point. Takes the combined model output and returns a
    plain-language explanation dict, always falling back to a safe
    hardcoded response if the local model fails to produce valid JSON.
    """
    user_message = build_user_message(combined)

    for attempt in range(1, MAX_RETRIES + 1):
        try:
            print("Starting LLM call...")
            raw_text = _call_groq(SYSTEM_PROMPT, user_message)
            logger.info("LLM call completed successfully")
        except Exception as exc:
            logger.warning("LLM call failed (attempt %s/%s): %s", attempt, MAX_RETRIES, exc)
            continue

        parsed = _parse_llm_json(raw_text)
        if parsed is not None:
            return parsed

        logger.warning(
            "LLM returned invalid JSON on attempt %s/%s. Raw output: %s",
            attempt, MAX_RETRIES, raw_text[:200],
        )

    logger.error("LLM failed to produce valid JSON after %s attempts. Using fallback.", MAX_RETRIES)
    return dict(FALLBACK_RESPONSE)


# ---------------------------------------------------------------------------
# Step 5 — Full pipeline convenience function
# ---------------------------------------------------------------------------

def generate_patient_report(
    model_a: dict[str, Any],
    model_b: dict[str, Any],
    model_c: dict[str, Any],
    patient_context: dict[str, Any],
) -> dict[str, Any]:
    """
    Full pipeline: combine model outputs -> call LLM -> return final report
    ready to send to the frontend.
    """
    combined = combine_model_outputs(model_a, model_b, model_c, patient_context)
    explanation = get_llm_explanation(combined)

    return {
        # doctor-facing technical detail
        "final_risk_pct": combined["final_risk_pct"],
        "risk_tier": combined["risk_tier"],
        "prediction": combined["prediction"],
        "top_factors": combined["top_factors"],
        # patient-facing plain language
        "patient_summary": explanation["patient_summary"],
        "key_factors": explanation["key_factors"],
        "suggested_next_step": explanation["suggested_next_step"],
        "fallback_used": explanation.get("fallback_used", False),
    }
