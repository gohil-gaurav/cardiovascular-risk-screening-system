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
cardiovascular-risk-screening-system/
│
├── .vscode/
│
├── api/                              ← 🟢 YOUR PART
│   └── main.py                       ← FastAPI /predict endpoint
│
├── backend/
│
├── docs/
│
├── frontend/
│
├── notebooks/
│   │
│   ├── 01_classification/            ← 🟢 YOUR MAIN ML PART
│   │   │
│   │   ├── artifacts/                ← 🟢 YOUR DEPLOYMENT ARTIFACTS
│   │   │   ├── features_names.json
│   │   │   ├── final_cardiovascular_risk_model.joblib
│   │   │   └── optimized_threshold.json
│   │   │
│   │   ├── data/
│   │   │
│   │   ├── data_preprocessing/
│   │   │   └── data_cleaning/
│   │   │       ├── outlier (1).ipynb
│   │   │       └── outlier-finalversion.ipynb
│   │   │
│   │   ├── feature_scaling/
│   │   │   ├── cardiovascular.ipynb
│   │   │   ├── classification.ipynb
│   │   │   ├── except-outlier-data-cleaning.ipynb
│   │   │   └── notebook2-data-preparation.ipynb
│   │   │
│   │   ├── final_trainedModel/
│   │   │   └── cvd-risk-predicti-notebook3-final-officialversion (2).ipynb
│   │   │
│   │   ├── workFlow/
│   │   │
│   │   └── README.md                  ← 🟢 YOUR DOCUMENTATION
│   │
│   ├── 02_clustering/
│   │
│   └── 03_deep_learning/
│
├── src/                              ← 🟢 YOUR INFERENCE PART
│   ├── __init__.py
│   └── prediction.py                 ← Standalone ML predictor
│
├── .gitignore
│
└── README.md







Running the API
python -m uvicorn api.main:app --reload

API:
http://127.0.0.1:8000

Swagger:
http://127.0.0.1:8000/docs


<img width="1536" height="1024" alt="image" src="https://github.com/user-attachments/assets/51e0ce16-e800-495a-888c-aa9578e26a3b" />
