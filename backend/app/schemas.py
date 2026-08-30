"""
schemas.py

Response contract for the /api/screen endpoint.

Note: patient input reuses the existing `PatientData` model already
defined in main.py - no need to duplicate it here.
"""

from typing import Any
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
    population_comparison_tier: str  # B's KMeans cluster label, kept separate for technical/doctor view
    prediction: str
    top_factors: list[TopFactor]
    secondary_model_comparison: dict[str, Any] | None = None
    clustering_confidence: dict[str, float] = None
    # patient-facing plain language
    patient_summary: str
    key_factors: list[str]
    suggested_next_step: str
    clinician_note: str
    group_context: str
    cohort_traits: list[str] = []
    value_explanations: dict[str, str] = {}
    cluster_explanation: str = ""
    risk_threshold_explanation: str = ""
    provider_used: str = "fallback"
    fallback_used: bool = False
    screening_id: int | None = None

    # PyTorch MLP Deep Learning SHAP & Risk metrics
    mlp_risk_score: float | None = None
    mlp_risk_level: str | None = None
    mlp_prediction: int | None = None
    mlp_primary_drivers: list | None = None
    mlp_protective_factors: list | None = None
    mlp_shap_values: list | None = None

    # XGBoost threshold metrics
    xgb_raw_probability: float | None = None
    xgb_decision_threshold: float | None = None
    xgb_probability_pct: float | None = None
    threshold_margin: float | None = None
    is_above_threshold: bool | None = None
    threshold_proximity: str | None = None

    # XGBoost SHAP human-readable drivers (from TreeExplainer)
    primary_drivers: list | None = None
    protective_factors: list | None = None
    risk_score: float | None = None
    risk_level: str | None = None
    shap_values: list | None = None
    shap_base_value: float | None = None
    shap_base_value_logodds: float | None = None

