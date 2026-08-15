

import json
import logging
from typing import Any

import requests

logger = logging.getLogger(__name__)

# Config

OLLAMA_URL = "http://localhost:11434/api/chat"
MODEL_NAME = "llama3.2:3b"  # change to match whichever model is pulled on the deployment machine
REQUEST_TIMEOUT_SECONDS = 30
MAX_RETRIES = 2

SYSTEM_PROMPT = """You are a medical communication assistant. Your job is to help a doctor \
explain a cardiovascular risk screening result to a patient in simple, warm, non-alarming language.

Rules you must always follow:
- Do NOT use technical terms like "model", "algorithm", "cluster", "SHAP", "neural network", "probability"
- Do NOT diagnose the patient. This is a screening result, not a medical diagnosis.
- Base your explanation ONLY on the data provided. Never invent numbers or facts.
- Keep the patient_summary under 100 words.
- Use a supportive, calm, encouraging tone. Avoid alarming or clinical language.
- Return ONLY valid JSON. No markdown, no code fences, no extra text before or after the JSON.

Return exactly this JSON structure:
{
  "patient_summary": "2-4 sentence plain-language explanation of the result",
  "key_factors": ["short phrase 1", "short phrase 2", "short phrase 3"],
  "suggested_next_step": "one gentle, general suggestion (not a prescription)"
}
"""

FALLBACK_RESPONSE = {
    "patient_summary": (
        "Your screening result is ready. Please discuss these results with "
        "your doctor for a full explanation."
    ),
    "key_factors": ["Screening completed"],
    "suggested_next_step": "Please consult your doctor to review these results in detail.",
    "fallback_used": True,
}

REQUIRED_KEYS = {"patient_summary", "key_factors", "suggested_next_step"}


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


def build_combined_from_predict_response(
    predict_response: dict[str, Any],
    patient: Any,  # the PatientData instance passed into predict_risk()
) -> dict[str, Any]:
    """
    Takes the dict returned by main.py's predict_risk() and the original
    PatientData request, and produces the combined object used to build
    the LLM prompt.

    IMPORTANT: risk_tier here is derived from the averaged risk percentage
    (same thresholds as the XGBoost model), NOT from Student B's KMeans
    cluster. The cluster groups patients by overall feature similarity,
    which can legitimately disagree with the disease-probability score
    (e.g. a patient can score 82% risk from the classifiers while still
    landing in a "Moderate" cluster). Showing the cluster label as the
    primary risk tier creates a contradiction like "82% risk - Moderate
    Risk", which is confusing and unsafe to show a patient. The cluster's
    tier is kept separately as `population_comparison_tier` for the
    doctor-facing technical view instead.
    """
    xgb_risk_pct = predict_response["risk_score"]
    mlp_risk_pct = predict_response["mlp_risk_score"]
    final_risk_pct = round((xgb_risk_pct + mlp_risk_pct) / 2, 2)

    risk_tier = _risk_tier_from_pct(final_risk_pct)
    population_comparison_tier = predict_response["clustering"]["risk_tier"]  # B's cluster label, kept separately
    prediction = "Disease" if predict_response["prediction"] == 1 else "No Disease"

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

    cholesterol_map = {1: "normal", 2: "above normal", 3: "well above normal"}
    gluc_map = {1: "normal", 2: "above normal", 3: "well above normal"}
    bmi = round(patient.weight / ((patient.height / 100) ** 2), 1)

    patient_context = {
        "age": int(patient.age),
        "gender": "male" if patient.gender == 1 else "female",
        "bmi": bmi,
        "bp": f"{patient.ap_hi}/{patient.ap_lo}",
        "cholesterol": cholesterol_map.get(patient.cholesterol, "normal"),
        "glucose": gluc_map.get(patient.gluc, "normal"),
        "smoker": bool(patient.smoke),
        "active": bool(patient.active),
    }

    return {
        "final_risk_pct": final_risk_pct,
        "risk_tier": risk_tier,
        "population_comparison_tier": population_comparison_tier,
        "prediction": prediction,
        "top_factors": top_factors,
        "patient_context": patient_context,
        "clustering_confidence": predict_response.get("clustering_confidence", {}),
    }


# ---------------------------------------------------------------------------
# Step 2 — Build the user message sent to the LLM
# ---------------------------------------------------------------------------

def build_user_message(combined: dict[str, Any]) -> str:
    factors_text = ", ".join(
        f'{f["label"]} ({f["impact"]} impact)' for f in combined["top_factors"]
    )
    ctx = combined["patient_context"]

    # Note: intentionally uses combined["risk_tier"] (derived from final_risk_pct),
    # not the raw KMeans cluster label, so the LLM never sees a contradictory
    # tier/percentage pairing like "82% - Moderate Risk".
    return f"""Patient screening result:
- Risk level: {combined["risk_tier"]} ({combined["final_risk_pct"]}%)
- Age: {ctx["age"]}, Gender: {ctx["gender"]}
- Blood pressure: {ctx["bp"]}
- Cholesterol: {ctx["cholesterol"]}
- BMI: {ctx["bmi"]}
- Physically active: {"Yes" if ctx["active"] else "No"}
- Top contributing factors: {factors_text}

Explain this result to the patient following the JSON format and rules given."""


# ---------------------------------------------------------------------------
# Step 3 — Call the local LLM (Ollama)
# ---------------------------------------------------------------------------

def _call_local_llm(system_prompt: str, user_message: str) -> str:
    """Calls a local Ollama model and returns the raw text response."""
    payload = {
        "model": MODEL_NAME,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_message},
        ],
        "stream": False,
        "options": {"temperature": 0.3},
    }

    response = requests.post(url=OLLAMA_URL, json=payload, timeout=REQUEST_TIMEOUT_SECONDS)
    response.raise_for_status()
    return response.json()["message"]["content"]


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
            raw_text = _call_local_llm(SYSTEM_PROMPT, user_message)
        except requests.RequestException as exc:
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
