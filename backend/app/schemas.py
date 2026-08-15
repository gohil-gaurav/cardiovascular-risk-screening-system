"""
schemas.py

Response contract for the /api/screen endpoint.

Note: patient input reuses the existing `PatientData` model already
defined in main.py - no need to duplicate it here.
"""

from pydantic import BaseModel


class TopFactor(BaseModel):
    feature: str
    label: str
    value: str
    impact: str  # "low" | "moderate" | "high"


class ScreeningReport(BaseModel):
    # doctor-facing technical detail
    final_risk_pct: float
    risk_tier: str
    prediction: str
    top_factors: list[TopFactor]
    # patient-facing plain language
    patient_summary: str
    key_factors: list[str]
    suggested_next_step: str
    fallback_used: bool = False
