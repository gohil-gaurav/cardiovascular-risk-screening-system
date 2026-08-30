from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import sys
from pathlib import Path


# ============================================================
# PROJECT PATH
# ============================================================

PROJECT_ROOT = Path(__file__).resolve().parent.parent

# Allow Python to import src/prediction.py
sys.path.append(str(PROJECT_ROOT))

from src.prediction import predict_cardiovascular_risk


# ============================================================
# FASTAPI APP
# ============================================================

app = FastAPI(
    title="Cardiovascular Risk Prediction API",
    description="ML-powered cardiovascular disease risk prediction",
    version="1.0.0"
)


# ============================================================
# INPUT SCHEMA
# ============================================================

class PatientData(BaseModel):

    age_years: float
    gender: int
    height: float
    weight: float
    ap_hi: int
    ap_lo: int
    cholesterol: int
    gluc: int
    smoke: int
    alco: int
    active: int
    BMI: float


# ============================================================
# HEALTH CHECK
# ============================================================

@app.get("/")
def root():
    return {
        "message": "Cardiovascular Risk Prediction API is running"
    }


# ============================================================
# PREDICTION ENDPOINT
# ============================================================

@app.post("/predict")
def predict(patient: PatientData):

    try:

        # Convert Pydantic object → dictionary
        patient_data = patient.model_dump()

        # Call trained ML predictor
        result = predict_cardiovascular_risk(patient_data)

        return result

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )










        # in browser  post this to see  backend o/p
        # http://127.0.0.1:8000/docs#/default/predict_predict_post