# Cardiovascular Risk Screening System

AI-powered cardiovascular disease risk screening system using supervised machine learning.

## ML Deployment Pipeline

The trained supervised-learning model was converted into a reusable, API-ready inference pipeline.

```text
                    TRAINING PHASE
                         │
                         ▼
              Prepared Cardiovascular Data
                         │
                         ▼
              Feature Preparation / Scaling
                         │
                         ▼
        ┌────────────────┼─────────────────┐
        ▼                ▼                 ▼
   Logistic          Random Forest       XGBoost
   Regression
        │                │                 │
        ▼                ▼                 ▼
     Metrics          Metrics           Metrics
        └────────────────┼─────────────────┘
                         ▼
                  Model Comparison
                         │
                         ▼
                  Best Model Selected
                         │
                         ▼
                 Final XGBoost Model
                         │
                         ▼
              Serialized Model Artifact
                 (.joblib)
                         │
                         ▼
        ┌─────────────────────────────────┐
        │       SAVED ARTIFACTS           │
        │                                 │
        │ final_cardiovascular_risk_      │
        │ model.joblib                    │
        │                                 │
        │ features_names.json             │
        │                                 │
        │ optimized_threshold.json        │
        │ threshold = 0.37                │
        └─────────────────────────────────┘
                         │
                         ▼
                   INFERENCE PHASE
                         │
                         ▼
              Raw Patient JSON Input
                         │
                         ▼
              Validate Required Features
                         │
                         ▼
             Arrange Features in Exact
                  Training Order
                         │
                         ▼
              Load Saved XGBoost Model
                         │
                         ▼
                  predict_proba()
                         │
                         ▼
                 Risk Probability
                         │
                         ▼
              Apply Optimized Threshold
                    (0.37)
                         │
                   ┌─────┴─────┐
                   ▼           ▼
                0 / 1       Probability
              Prediction       (%)
                   │           │
                   └─────┬─────┘
                         ▼
                    JSON Response
                         │
                         ▼
                   FastAPI /predict
                         │
                         ▼
                 Swagger API Testing









## API Response

Example response:

{
  "prediction": 0,
  "risk_label": "No Disease",
  "risk_probability": 0.311,
  "risk_percentage": 31.1,
  "threshold_used": 0.37
}

## Project Structure

```text
src/
└── prediction.py

api/
└── main.py

artifacts/
├── final_cardiovascular_risk_model.joblib
├── features_names.json
└── optimized_threshold.json
