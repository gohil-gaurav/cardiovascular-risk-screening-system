# Patient JSON
#      ↓
# predict_cardiovascular_risk()
#      ↓
# Validate 13 features
#      ↓
# Arrange features in training order
#      ↓
# Load final XGBoost .joblib
#      ↓
# predict_proba()
#      ↓
# optimized_threshold.json
#      ↓
# 0 / 1 prediction
#      ↓
# Risk probability %
#      ↓
# JSON response









import json
from pathlib import Path

import joblib
import pandas as pd


# ============================================================
# PATHS
# ============================================================

BASE_DIR = Path(__file__).resolve().parents[1]

ARTIFACTS_DIR = (
    BASE_DIR
    / "notebooks"
    / "01_classification"
    / "artifacts"
)

MODEL_PATH = ARTIFACTS_DIR / "final_cardiovascular_risk_model.joblib"
FEATURES_PATH = ARTIFACTS_DIR / "features_names.json"
THRESHOLD_PATH = ARTIFACTS_DIR / "optimized_threshold.json"

# ============================================================
# LOAD SAVED ML ARTIFACTS
# ============================================================

model = joblib.load(MODEL_PATH)

with open(FEATURES_PATH, "r") as file:
    feature_names = json.load(file)

with open(THRESHOLD_PATH, "r") as file:
    threshold_data = json.load(file)


# ============================================================
# GET OPTIMIZED THRESHOLD
# ============================================================

if isinstance(threshold_data, dict):
    threshold = threshold_data.get("optimal_threshold")

    if threshold is None:
        raise ValueError(
            "optimal_threshold key not found in optimized_threshold.json"
        )
else:
    threshold = float(threshold_data)


# ============================================================
# PREDICTION FUNCTION
# ============================================================

def predict_cardiovascular_risk(patient_data: dict) -> dict:
    """
    Takes raw patient feature values and returns
    cardiovascular risk prediction.
    """

    # --------------------------------------------------------
    # 1. Validate required features
    # --------------------------------------------------------

    missing_features = [
        feature
        for feature in feature_names
        if feature not in patient_data
    ]

    if missing_features:
        raise ValueError(
            f"Missing required features: {missing_features}"
        )

    # --------------------------------------------------------
    # 2. Create DataFrame in EXACT training feature order
    # --------------------------------------------------------

    input_data = {
        feature: patient_data[feature]
        for feature in feature_names
    }

    X_patient = pd.DataFrame(
        [input_data],
        columns=feature_names
    )

    # --------------------------------------------------------
    # 3. Generate probability
    # --------------------------------------------------------

    probability = float(
        model.predict_proba(X_patient)[0][1]
    )

    # --------------------------------------------------------
    # 4. Apply optimized threshold
    # --------------------------------------------------------

    prediction = int(
        probability >= threshold
    )

    # --------------------------------------------------------
    # 5. Human-readable result
    # --------------------------------------------------------

    risk_label = (
        "Disease"
        if prediction == 1
        else "No Disease"
    )

    return {
        "prediction": prediction,
        "risk_label": risk_label,
        "risk_probability": round(probability, 4),
        "risk_percentage": round(probability * 100, 2),
        "threshold_used": threshold
    }
# ============================================================
# TEST PREDICTION
# ============================================================

sample_patient = {
    "age_years": 50.4,
    "gender": 2,
    "height": 168,
    "weight": 62.0,
    "ap_hi": 110,
    "ap_lo": 80,
    "cholesterol": 1,
    "gluc": 1,
    "smoke": 0,
    "alco": 0,
    "active": 1,
    "BMI": 22.0
}

result = predict_cardiovascular_risk(sample_patient)

print("\nPrediction Result:")
print(result)















# Patient Data
#      ↓
# Feature validation
#      ↓
# Feature ordering
#      ↓
# Saved XGBoost model
#      ↓
# predict_proba()
#      ↓
# Probability = 31.1%
#      ↓
# Threshold = 0.37
#      ↓
# 31.1% < 37%
#      ↓
# Prediction = 0
#      ↓
# "No Disease"


# o/p
# Prediction Result:
# {
#     'prediction': 0,
#     'risk_label': 'No Disease',
#     'risk_probability': 0.311,
#     'risk_percentage': 31.1,
#     'threshold_used': 0.37
# }