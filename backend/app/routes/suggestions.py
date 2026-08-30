"""
suggestions.py

AI Lifestyle Suggestions endpoint.
Accepts basic patient risk context and generates a personalized, 
bullet-point daily lifestyle action plan via the existing LLM service.

Groq is the primary provider. Mistral is the fallback.
A safe hardcoded response is used if both fail.
"""

import logging
import json
import os

from fastapi import APIRouter
from pydantic import BaseModel, Field
from typing import Optional

from langchain_core.messages import SystemMessage, HumanMessage
from langchain_groq import ChatGroq
from langchain_mistralai import ChatMistralAI

logger = logging.getLogger(__name__)
router = APIRouter()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
MISTRAL_API_KEY = os.getenv("MISTRAL_API_KEY")

SUGGESTIONS_SYSTEM_PROMPT = """You are a compassionate, practical health advisor.
A patient has just received their cardiovascular risk screening result.
Your task is to generate a SHORT, actionable, friendly daily lifestyle action plan.

STRICT RULES:
- Write in simple, warm, encouraging language. No jargon, no fear-mongering.
- Do NOT mention the model, algorithm, SHAP, probability, or any technical term.
- Do NOT diagnose. This is guidance, not a prescription.
- Each suggestion must be concrete and doable today.
- Tailor tips to the risk level: be more urgent for high risk, more encouraging for low risk.
- Return ONLY valid JSON. No markdown fences, no extra text.

Return exactly this JSON structure:
{
  "title": "short friendly section title e.g. 'Your Daily Heart Health Plan'",
  "intro": "1 warm sentence introducing the suggestions based on their risk level",
  "suggestions": [
    {
      "icon": "one of: heart, walk, food, sleep, stress, doctor, water, smoke, alcohol",
      "text": "concise actionable tip (max 15 words)"
    }
  ]
}

Always return exactly 6 suggestions. Choose the most relevant icons from the allowed list.
"""


class SuggestionsRequest(BaseModel):
    """Patient context for generating AI lifestyle suggestions."""
    risk_tier: str = Field(..., description="'High Risk' | 'Moderate Risk' | 'Low Risk'")
    risk_score: float = Field(..., description="Numeric risk percentage 0-100")
    age: Optional[int] = Field(None, description="Patient age in years")
    bmi: Optional[float] = Field(None, description="Patient BMI")
    smoker: Optional[bool] = Field(None, description="Whether patient smokes")
    active: Optional[bool] = Field(None, description="Whether patient is physically active")
    cholesterol: Optional[int] = Field(None, description="Cholesterol level 1=normal 2=above 3=well above")
    glucose: Optional[int] = Field(None, description="Glucose level 1=normal 2=above 3=well above")
    ap_hi: Optional[int] = Field(None, description="Systolic blood pressure")
    ap_lo: Optional[int] = Field(None, description="Diastolic blood pressure")
    primary_driver: Optional[str] = Field(None, description="Top SHAP risk driver label")


FALLBACK_SUGGESTIONS = {
    "High Risk": {
        "title": "Your Daily Heart Health Plan",
        "intro": "Here are some important steps that can help protect your heart starting today.",
        "suggestions": [
            {"icon": "doctor", "text": "Schedule a cardiology consultation within 2 weeks."},
            {"icon": "walk", "text": "Start with 20-minute gentle walks each morning."},
            {"icon": "food", "text": "Reduce salt and fried food — choose grilled or steamed."},
            {"icon": "stress", "text": "Practice 10 minutes of breathing exercises daily."},
            {"icon": "smoke", "text": "If you smoke, talk to your doctor about quitting support."},
            {"icon": "sleep", "text": "Aim for 7-8 hours of quality sleep each night."},
        ],
    },
    "Moderate Risk": {
        "title": "Your Heart Wellness Routine",
        "intro": "Small daily habits can make a real difference for your heart health.",
        "suggestions": [
            {"icon": "walk", "text": "Walk briskly for 30 minutes at least 5 days a week."},
            {"icon": "food", "text": "Add more vegetables, fruits, and whole grains to meals."},
            {"icon": "water", "text": "Drink at least 8 glasses of water throughout the day."},
            {"icon": "stress", "text": "Try meditation or yoga to keep stress in check."},
            {"icon": "sleep", "text": "Maintain a consistent bedtime for better heart recovery."},
            {"icon": "doctor", "text": "Get your blood pressure checked every 3 months."},
        ],
    },
    "Low Risk": {
        "title": "Keep Your Heart Thriving",
        "intro": "Great news — keep up these healthy habits to stay in excellent shape.",
        "suggestions": [
            {"icon": "walk", "text": "Continue 150+ minutes of moderate exercise per week."},
            {"icon": "food", "text": "Keep up your balanced diet rich in fruits and vegetables."},
            {"icon": "sleep", "text": "Protect your sleep schedule — it's vital for heart health."},
            {"icon": "water", "text": "Stay well hydrated throughout your day."},
            {"icon": "stress", "text": "Practice a mindfulness activity you enjoy regularly."},
            {"icon": "doctor", "text": "Keep your annual cardiovascular check-up on schedule."},
        ],
    },
}


def _build_suggestion_prompt(req: SuggestionsRequest) -> str:
    chol_map = {1: "normal", 2: "above normal", 3: "well above normal"}
    gluc_map = {1: "normal", 2: "above normal", 3: "well above normal"}
    smoke_text = "Smoker" if req.smoker else "Non-smoker"
    active_text = "Physically active" if req.active else "Not physically active"

    return f"""Patient cardiovascular screening summary:
- Risk level: {req.risk_tier} ({round(req.risk_score, 1)}%)
- Age: {req.age or 'unknown'}
- BMI: {req.bmi or 'unknown'}
- Blood pressure: {req.ap_hi or '?'}/{req.ap_lo or '?'} mmHg
- Cholesterol: {chol_map.get(req.cholesterol, 'unknown')}
- Glucose: {gluc_map.get(req.glucose, 'unknown')}
- Smoking: {smoke_text}
- Activity: {active_text}
- Primary risk driver: {req.primary_driver or 'not specified'}

Generate a personalised daily lifestyle action plan for this patient.
Follow the JSON format in the system prompt exactly.
Make tips realistic, gentle, and specific to their risk level and profile."""


def _call_llm(system: str, user: str, use_mistral: bool = False) -> str:
    if use_mistral:
        llm = ChatMistralAI(api_key=MISTRAL_API_KEY, model="mistral-small-latest", temperature=0.4, max_tokens=600)
    else:
        llm = ChatGroq(api_key=GROQ_API_KEY, model="groq/compound-mini", temperature=0.4, max_tokens=600)
    response = llm.invoke([SystemMessage(content=system), HumanMessage(content=user)])
    return response.content


def _parse_suggestions(raw: str) -> dict | None:
    cleaned = raw.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.strip("`")
        if cleaned.startswith("json"):
            cleaned = cleaned[4:].strip()
    try:
        parsed = json.loads(cleaned)
        if "suggestions" in parsed and "title" in parsed:
            return parsed
    except Exception:
        pass
    return None


@router.post("/ai-suggestions")
def get_ai_suggestions(req: SuggestionsRequest):
    """
    Generates a personalised AI lifestyle suggestion plan using the LLM pipeline.
    Groq is primary; Mistral is fallback; hardcoded safe response if both fail.
    """
    user_msg = _build_suggestion_prompt(req)

    for use_mistral, provider_name in [(False, "Groq"), (True, "Mistral")]:
        for attempt in range(1, 3):
            try:
                logger.info(f"AI Suggestions: calling {provider_name} (attempt {attempt})")
                raw = _call_llm(SUGGESTIONS_SYSTEM_PROMPT, user_msg, use_mistral=use_mistral)
                parsed = _parse_suggestions(raw)
                if parsed:
                    parsed["provider_used"] = provider_name
                    parsed["fallback_used"] = False
                    return parsed
                logger.warning(f"{provider_name} returned invalid JSON on attempt {attempt}")
            except Exception as exc:
                logger.warning(f"{provider_name} attempt {attempt} failed: {exc}")

    # Safe hardcoded fallback
    tier = req.risk_tier if req.risk_tier in FALLBACK_SUGGESTIONS else "Moderate Risk"
    result = dict(FALLBACK_SUGGESTIONS[tier])
    result["provider_used"] = "fallback"
    result["fallback_used"] = True
    return result
