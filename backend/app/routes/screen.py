"""
screen.py

Orchestrator endpoint - Student D's integration work.

Instead of calling three separate model services, this reuses the
already-combined output of main.py's predict_risk() (which merges
XGBoost, KMeans clustering, and PyTorch MLP + SHAP), adapts it into the
LLM's input format, and returns one unified patient-facing report.

Mount this router at the BOTTOM of main.py (after predict_risk is defined):
    from app.routes.screen import router as screen_router
    app.include_router(screen_router, prefix="/api")
"""

import logging

from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from app.database import get_db

from app.schemas import ScreeningReport
from app import llm_service

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/screen", response_model=ScreeningReport)
def screen_patient(patient: dict, db: Session = Depends(get_db)) -> ScreeningReport:
    """
    1. Run the patient through the existing predict_risk() pipeline
       (XGBoost + MLP + SHAP + KMeans clustering, already combined)
    2. Adapt that response into the LLM's input format
    3. Get a plain-language explanation from the local LLM
    4. Return one unified report (technical fields + patient-friendly fields)
    """
    from app.main import PatientData, predict_risk

    try:
        if isinstance(patient, dict):
            patient_obj = PatientData(**patient)
        else:
            patient_obj = patient
        predict_response = predict_risk(patient_obj, db=db)

    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Prediction pipeline failed")
        raise HTTPException(status_code=502, detail="Risk models unavailable") from exc

    if predict_response.get("status") != "success":
        raise HTTPException(status_code=502, detail="Prediction pipeline returned an error")

    combined = llm_service.build_combined_from_predict_response(predict_response, patient_obj)
    try:
        explanation = llm_service.get_llm_explanation(combined)
    except Exception as e:
        logger.error(f"Groq API error: {e}")
        explanation = dict(llm_service.FALLBACK_RESPONSE)

    return ScreeningReport(
        final_risk_pct=combined["final_risk_pct"],
        risk_tier=combined["risk_tier"],
        population_comparison_tier=combined["population_comparison_tier"],
        prediction=combined["prediction"],
        top_factors=combined["top_factors"],
        secondary_model_comparison=combined.get("secondary_model_comparison"),
        patient_summary=explanation["patient_summary"],
        key_factors=explanation["key_factors"],
        suggested_next_step=explanation["suggested_next_step"],
        clinician_note=explanation.get("clinician_note", ""),
        group_context=explanation.get("group_context", ""),
        cohort_traits=explanation.get("cohort_traits", []),
        value_explanations=explanation.get("value_explanations", {}),
        cluster_explanation=explanation.get("cluster_explanation", ""),
        risk_threshold_explanation=explanation.get("risk_threshold_explanation", ""),
        provider_used=explanation.get("provider_used", "fallback"),
        fallback_used=explanation.get("fallback_used", False),
        clustering_confidence=combined["clustering_confidence"],
        screening_id=predict_response.get("screening_id"),
        mlp_risk_score=predict_response.get("mlp_risk_score"),
        mlp_risk_level=predict_response.get("mlp_risk_level"),
        mlp_prediction=predict_response.get("mlp_prediction"),
        mlp_primary_drivers=predict_response.get("mlp_primary_drivers"),
        mlp_protective_factors=predict_response.get("mlp_protective_factors"),
        mlp_shap_values=predict_response.get("mlp_shap_values"),
        xgb_raw_probability=predict_response.get("xgb_raw_probability"),
        xgb_decision_threshold=predict_response.get("xgb_decision_threshold"),
        xgb_probability_pct=predict_response.get("xgb_probability_pct"),
        threshold_margin=predict_response.get("threshold_margin"),
        is_above_threshold=predict_response.get("is_above_threshold"),
        threshold_proximity=predict_response.get("threshold_proximity"),
    )

