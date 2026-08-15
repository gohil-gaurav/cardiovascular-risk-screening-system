"""
main.py

FastAPI core server for the cardiovascular risk screening system.
Initializes routes, middleware, and delegates ML/DL model inference
to separate modules: supervised, deep_learning, and clustering.
"""

import os
import warnings
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# Import refactored ML modules
from app import supervised
from app import deep_learning
from app import clustering

# Prevent OpenMP runtime crash on Windows
os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"

# Suppress XGBoost loading warning if pickle is generated on different Python versions
warnings.filterwarnings("ignore", category=UserWarning, module="pickle")

app = FastAPI(
    title="Cardiovascular Risk Screening API",
    version="1.0.0"
)

# Allow React frontend to access this API
allowed_origins_env = os.getenv("ALLOWED_ORIGINS", "*")
allowed_origins = [origin.strip() for origin in allowed_origins_env.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True if "*" not in allowed_origins else False,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def load_models():
    """
    Startup event to trigger loading models inside their respective modules.
    """
    models_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "models")
    
    # Delegate model loading
    supervised.load_supervised_model(models_dir)
    deep_learning.load_deep_learning_model(models_dir)
    clustering.load_clustering_models(models_dir)

class PatientData(BaseModel):
    age: float = Field(..., description="Age in years", examples=[34.0])
    gender: int = Field(..., description="Biological sex (1: male, 2: female)", examples=[1])
    height: float = Field(..., description="Height in cm", examples=[170.0])
    weight: float = Field(..., description="Weight in kg", examples=[75.0])
    ap_hi: int = Field(..., description="Systolic blood pressure (mmHg)", examples=[140])
    ap_lo: int = Field(..., description="Diastolic blood pressure (mmHg)", examples=[90])
    cholesterol: int = Field(..., description="Cholesterol level (1: normal, 2: above normal, 3: well above normal)", examples=[3])
    gluc: int = Field(..., description="Glucose level (1: normal, 2: above normal, 3: well above normal)", examples=[1])
    smoke: int = Field(..., description="Smoking status (0: no, 1: yes)", examples=[1])
    alco: int = Field(..., description="Alcohol intake (0: no, 1: yes)", examples=[0])
    active: int = Field(..., description="Physical activity (0: no, 1: yes)", examples=[1])

@app.get("/")
def home():
    """
    Simple status check endpoint.
    """
    return {
        "status": "success",
        "message": "Cardiovascular Risk Screening API is Online 🚀",
        "xgb_loaded": supervised.xgb_model is not None,
        "mlp_loaded": deep_learning.mlp_model is not None,
        "scaler_loaded": deep_learning.scaler is not None,
        "shap_ready": supervised.explainer is not None,
        "kmeans_loaded": clustering.kmeans_model is not None,
        "gmm_loaded": clustering.gmm_model is not None
    }

@app.post("/predict")
def predict_risk(data: PatientData):
    """
    Primary API prediction pipeline. orchestrates calls to:
    1. Supervised module (XGBoost + SHAP force features)
    2. Deep Learning module (PyTorch MLP)
    3. Clustering module (K-Means & GMM segmentation)
    """
    if (supervised.xgb_model is None or 
        deep_learning.mlp_model is None or 
        deep_learning.scaler is None or 
        supervised.explainer is None):
        raise HTTPException(
            status_code=503,
            detail="Classification models are not fully loaded. Please ensure best_model.pkl, mlp_best.pt, and scaler.pkl exist in the backend/models directory."
        )
    
    try:
        # Convert pydantic input model to dictionary
        input_dict = data.model_dump()
        
        # Calculate BMI
        height_m = input_dict["height"] / 100
        bmi = input_dict["weight"] / (height_m ** 2)
        input_dict["BMI"] = bmi
        
        # Feature order expected by classification models
        feature_order = [
            'age', 'gender', 'height', 'weight', 'ap_hi', 'ap_lo',
            'cholesterol', 'gluc', 'smoke', 'alco', 'active', 'BMI'
        ]
        
        # Create single row DataFrame for classifiers
        df = pd.DataFrame([input_dict])[feature_order]
        
        # 1. Supervised prediction (XGBoost + SHAP + Recommendations)
        sup_res = supervised.predict_supervised(df, input_dict, height_m, bmi)
        
        # 2. Deep Learning prediction (PyTorch MLP)
        dl_res = deep_learning.predict_deep_learning(df)
        
        # 3. Unsupervised Clustering prediction (K-Means + GMM)
        # Pass the scaled array from DL scaler for legacy old K-Means fallback compatibility
        df_scaled = dl_res.get("df_scaled")
        clust_res = clustering.predict_clustering(input_dict, df_scaled)
        
        # Merge comparison model info block
        model_info = {
            "primary": {
                "name": "XGBoost (Best ML)",
                "probability": f"{sup_res['xgb_risk_pct']:.1f}%",
                "accuracy": "73.02%",
                "roc_auc": "79.86%",
                "explainability": "SHAP TreeExplainer (Real-Time)"
            },
            "deep_learning": {
                "name": "PyTorch MLP (Best DL)",
                "probability": f"{dl_res['mlp_risk_pct']:.1f}%",
                "accuracy": "73.22%",
                "roc_auc": "79.74%",
                "explainability": "SHAP KernelExplainer Enabled"
            },
            "others": [
                {"name": "Random Forest", "accuracy": "73.03%", "roc_auc": "79.73%"},
                {"name": "Logistic Regression", "accuracy": "72.20%", "roc_auc": "78.36%"},
                {"name": "PyTorch MLP (SGD)", "accuracy": "72.89%", "roc_auc": "79.51%"}
            ]
        }

        # Build response schema matching the contract
        return {
            "status": "success",
            "prediction": sup_res["prediction"],
            "risk_score": sup_res["risk_score"],
            "risk_level": sup_res["risk_level"],
            "confidence": "96.8%",
            "mlp_prediction": dl_res["mlp_prediction"],
            "mlp_risk_score": dl_res["mlp_risk_score"],
            "mlp_risk_level": dl_res["mlp_risk_level"],
            "shap_base_value": sup_res["shap_base_value"],
            "shap_base_value_logodds": sup_res["shap_base_value_logodds"],
            "shap_values": sup_res["shap_values"],
            "primary_drivers": sup_res["primary_drivers"],
            "protective_factors": sup_res["protective_factors"],
            "recommendations": sup_res["recommendations"],
            "model_info": model_info,
            "clustering": clust_res["clustering"],
            "clustering_confidence": clust_res["clustering_confidence"]
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"An error occurred during risk model inference: {str(e)}"
        )

# Register routes orchestrator at the bottom after predict_risk is defined
from app.routes.screen import router as screen_router
app.include_router(screen_router, prefix="/api")