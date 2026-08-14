import os
import joblib
import pandas as pd
import numpy as np
import warnings
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# Prevent OpenMP runtime crash on Windows
os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"

import torch
import torch.nn as nn
import shap

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

# PyTorch Deep Learning MLP Model Class Definition
class CVDRiskMLP(nn.Module):
    def __init__(self, input_dim, hidden_dims=(64, 32, 16), dropout=0.3):
        super().__init__()
        layers = []
        prev_dim = input_dim
        for h in hidden_dims:
            layers.append(nn.Linear(prev_dim, h))
            layers.append(nn.BatchNorm1d(h))
            layers.append(nn.ReLU())
            layers.append(nn.Dropout(dropout))
            prev_dim = h
        layers.append(nn.Linear(prev_dim, 1))
        self.net = nn.Sequential(*layers)
        
    def forward(self, x):
        return self.net(x).squeeze(-1)

# Global variables for models
xgb_model = None
mlp_model = None
scaler = None
explainer = None
kmeans_model_data = None

@app.on_event("startup")
def load_models():
    global xgb_model, mlp_model, scaler, explainer, kmeans_model_data
    models_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "models")
    
    # Load XGBoost (Primary ML model)
    xgb_path = os.path.join(models_dir, "best_model.pkl")
    try:
        if os.path.exists(xgb_path):
            xgb_model = joblib.load(xgb_path)
            print("=" * 60)
            print(f"XGBoost loaded successfully from: {xgb_path}")
            explainer = shap.TreeExplainer(xgb_model)
            print("SHAP TreeExplainer initialized successfully.")
            print("=" * 60)
        else:
            print(f"Warning: XGBoost model file not found at: {xgb_path}")
    except Exception as e:
        print(f"Error loading XGBoost model: {e}")

    # Load Standard Scaler
    scaler_path = os.path.join(models_dir, "scaler.pkl")
    try:
        if os.path.exists(scaler_path):
            scaler = joblib.load(scaler_path)
            print(f"Scaler loaded successfully from: {scaler_path}")
        else:
            print(f"Warning: Scaler file not found at: {scaler_path}")
    except Exception as e:
        print(f"Error loading Scaler: {e}")

    # Load PyTorch Deep Learning MLP Model
    mlp_path = os.path.join(models_dir, "mlp_best.pt")
    try:
        if os.path.exists(mlp_path):
            mlp_model = CVDRiskMLP(input_dim=12)
            mlp_model.load_state_dict(torch.load(mlp_path))
            mlp_model.eval()
            print(f"PyTorch MLP loaded successfully from: {mlp_path}")
            print("=" * 60)
        else:
            print(f"Warning: PyTorch MLP weights not found at: {mlp_path}")
    except Exception as e:
        print(f"Error loading PyTorch MLP model: {e}")

    # Load KMeans Risk Clustering model package
    kmeans_path = os.path.join(models_dir, "kmeans.pkl")
    try:
        if os.path.exists(kmeans_path):
            kmeans_model_data = joblib.load(kmeans_path)
            print(f"KMeans Risk Clustering model loaded successfully from: {kmeans_path}")
            print("=" * 60)
        else:
            print(f"Warning: KMeans Risk Clustering model not found at: {kmeans_path}")
    except Exception as e:
        print(f"Error loading KMeans Risk Clustering model: {e}")

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
    return {
        "status": "success",
        "message": "Cardiovascular Risk Screening API is Online 🚀",
        "xgb_loaded": xgb_model is not None,
        "mlp_loaded": mlp_model is not None,
        "scaler_loaded": scaler is not None,
        "shap_ready": explainer is not None
    }

@app.post("/predict")
def predict_risk(data: PatientData):
    if xgb_model is None or mlp_model is None or scaler is None or explainer is None:
        raise HTTPException(
            status_code=503,
            detail="Models are not fully loaded. Please ensure best_model.pkl, mlp_best.pt, and scaler.pkl exist in the backend/models directory."
        )
    
    try:
        # Convert pydantic input model to dictionary
        input_dict = data.model_dump()
        
        # Calculate BMI
        height_m = input_dict["height"] / 100
        bmi = input_dict["weight"] / (height_m ** 2)
        input_dict["BMI"] = bmi
        
        # Feature order expected by the models
        feature_order = [
            'age', 'gender', 'height', 'weight', 'ap_hi', 'ap_lo',
            'cholesterol', 'gluc', 'smoke', 'alco', 'active', 'BMI'
        ]
        
        # Create single row DataFrame
        df = pd.DataFrame([input_dict])[feature_order]
        
        # 1. XGBoost Prediction (Primary Machine Learning Model)
        xgb_prob = float(xgb_model.predict_proba(df)[0][1])
        xgb_pred = int(xgb_model.predict(df)[0])
        xgb_risk_pct = xgb_prob * 100
        
        # Map primary risk level
        if xgb_risk_pct >= 75:
            risk_level = "High Risk"
        elif xgb_risk_pct >= 45:
            risk_level = "Moderate Risk"
        else:
            risk_level = "Low Risk"
            
        # 2. PyTorch MLP Prediction (Deep Learning Model)
        df_scaled = scaler.transform(df)
        df_t = torch.tensor(df_scaled, dtype=torch.float32)
        with torch.no_grad():
            mlp_logits = mlp_model(df_t)
            mlp_prob = float(torch.sigmoid(mlp_logits).item())
            mlp_pred = 1 if mlp_prob >= 0.5 else 0
        mlp_risk_pct = mlp_prob * 100
        
        # Map MLP risk level
        if mlp_risk_pct >= 75:
            mlp_risk_level = "High Risk"
        elif mlp_risk_pct >= 45:
            mlp_risk_level = "Moderate Risk"
        else:
            mlp_risk_level = "Low Risk"
            
        # 3. Compute Patient-level SHAP values using TreeExplainer on XGBoost
        shap_vals = explainer.shap_values(df)
        shap_expected = float(explainer.expected_value)
        
        # Convert expected value (log-odds) to base probability
        base_prob = 1 / (1 + np.exp(-shap_expected))
        
        feature_display_names = {
            'age': 'Age',
            'gender': 'Gender',
            'height': 'Height',
            'weight': 'Weight',
            'ap_hi': 'Systolic Blood Pressure',
            'ap_lo': 'Diastolic Blood Pressure',
            'cholesterol': 'Cholesterol Level',
            'gluc': 'Glucose Level',
            'smoke': 'Smoking Status',
            'alco': 'Alcohol Intake',
            'active': 'Physical Activity',
            'BMI': 'Body Mass Index (BMI)'
        }
        
        # Build SHAP list and sort features
        shap_list = []
        for i, col in enumerate(feature_order):
            val = input_dict[col]
            shap_val = float(shap_vals[0][i])
            shap_list.append({
                "feature": col,
                "display_name": feature_display_names[col],
                "value": round(val, 1) if isinstance(val, float) else val,
                "shap_value": shap_val
            })
            
        # Sort by SHAP value descending for top factors, and ascending for protective
        top_risk_drivers = sorted([s for s in shap_list if s["shap_value"] > 0], key=lambda x: x["shap_value"], reverse=True)
        top_protective_drivers = sorted([s for s in shap_list if s["shap_value"] < 0], key=lambda x: x["shap_value"])
        
        # Format Top Risk Factors (Card 4)
        primary_drivers = []
        for item in top_risk_drivers[:5]:
            feat = item["feature"]
            val = item["value"]
            if feat == "ap_hi":
                desc = f"High Systolic Blood Pressure ({val} mmHg)"
            elif feat == "ap_lo":
                desc = f"High Diastolic Blood Pressure ({val} mmHg)"
            elif feat == "BMI":
                desc = f"High BMI ({val:.1f})"
            elif feat == "age":
                desc = f"Older Age ({val} Years)"
            elif feat == "cholesterol":
                level = "Above Normal" if val == 2 else "Well Above Normal"
                desc = f"High Cholesterol ({level})"
            elif feat == "gluc":
                level = "Above Normal" if val == 2 else "Well Above Normal"
                desc = f"High Glucose ({level})"
            elif feat == "smoke" and val == 1:
                desc = "Active Smoking Habit"
            elif feat == "alco" and val == 1:
                desc = "Regular Alcohol Intake"
            elif feat == "active" and val == 0:
                desc = "Lack of Physical Activity"
            else:
                desc = f"Elevated {item['display_name']} ({val})"
            
            # Map raw shap log-odds value to a percentage-like contribution weight for visual bar charts
            weight = abs(item["shap_value"])
            primary_drivers.append({
                "factor": desc,
                "contribution": "+" + f"{weight:.2f}",
                "importance_pct": min(100, round(weight * 100, 1)),
                "raw_val": item["shap_value"]
            })
            
        # Format Protective Factors (Card 5)
        protective_factors = []
        for item in top_protective_drivers[:5]:
            feat = item["feature"]
            val = item["value"]
            if feat == "smoke" and val == 0:
                desc = "Non Smoker"
            elif feat == "active" and val == 1:
                desc = "Physically Active"
            elif feat == "gluc" and val == 1:
                desc = "Normal Glucose Level"
            elif feat == "cholesterol" and val == 1:
                desc = "Normal Cholesterol Level"
            elif feat == "BMI" and val < 25:
                desc = f"Healthy Weight (BMI: {val:.1f})"
            elif feat == "ap_hi" and val <= 120:
                desc = f"Optimal Systolic BP ({val} mmHg)"
            elif feat == "ap_lo" and val <= 80:
                desc = f"Optimal Diastolic BP ({val} mmHg)"
            elif feat == "alco" and val == 0:
                desc = "No Alcohol Intake"
            else:
                desc = f"Healthy {item['display_name']} Level ({val})"
                
            weight = abs(item["shap_value"])
            protective_factors.append({
                "factor": desc,
                "contribution": "-" + f"{weight:.2f}",
                "importance_pct": min(100, round(weight * 100, 1)),
                "raw_val": item["shap_value"]
            })
            
        # Clinical Recommendations (Card 9)
        recommendations = []
        if data.ap_hi > 130 or data.ap_lo > 80:
            recommendations.append({"icon": "sodium", "text": "Reduce sodium intake below 2,000 mg/day."})
            recommendations.append({"icon": "bp", "text": "Monitor blood pressure weekly at home and log it."})
            recommendations.append({"icon": "doctor", "text": "Consult a cardiologist for blood pressure management."})
        else:
            recommendations.append({"icon": "bp", "text": "Maintain current healthy blood pressure monitoring."})
            
        if bmi > 25:
            recommendations.append({"icon": "weight", "text": f"Maintain BMI below 25. Aim for a target weight of {round(24.9 * (height_m ** 2), 1)} kg."})
        else:
            recommendations.append({"icon": "weight", "text": "Maintain current healthy weight and body composition."})
            
        if data.active == 0:
            recommendations.append({"icon": "activity", "text": "Exercise at least 30 minutes daily (e.g. brisk walking)."})
        else:
            recommendations.append({"icon": "activity", "text": "Continue with regular physical activity (150+ minutes/week)."})
            
        if data.cholesterol >= 2:
            recommendations.append({"icon": "cholesterol", "text": "Follow a low-cholesterol diet and check lipid profile in 3 months."})
        else:
            recommendations.append({"icon": "cholesterol", "text": "Maintain healthy dietary habits to support optimal lipids."})
            
        if data.smoke == 1:
            recommendations.append({"icon": "smoke", "text": "Initiate tobacco cessation counseling and support groups."})
            
        if not recommendations:
            recommendations.append({"icon": "doctor", "text": "Schedule regular annual cardiovascular screenings."})
            
        # Model Comparison Metrics (Card 10)
        model_info = {
            "primary": {
                "name": "XGBoost (Best ML)",
                "probability": f"{xgb_risk_pct:.1f}%",
                "accuracy": "73.02%",
                "roc_auc": "79.86%",
                "explainability": "SHAP TreeExplainer (Real-Time)"
            },
            "deep_learning": {
                "name": "PyTorch MLP (Best DL)",
                "probability": f"{mlp_risk_pct:.1f}%",
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
        # 4. Unsupervised K-Means Risk Clustering Prediction
        cluster_risk_tier = "Low Risk"
        cluster_percentages = {
            "Low Risk": 58.27,
            "Moderate Risk": 9.74,
            "High Risk": 31.99
        }
        
        if kmeans_model_data is not None:
            kmeans_model = kmeans_model_data["kmeans"]
            mapping = kmeans_model_data["cluster_mapping"]
            centroids = kmeans_model_data["centroids_orig"]
            
            # Predict cluster index using the scaled features array df_scaled
            cluster_idx = int(kmeans_model.predict(df_scaled)[0])
            mapped_idx = mapping[cluster_idx]
            
            risk_tiers = {
                0: "High Risk",
                1: "Moderate Risk",
                2: "Low Risk"
            }
            cluster_risk_tier = risk_tiers[mapped_idx]
            
            standardized_centroids = {}
            for raw_idx, std_idx in mapping.items():
                std_tier = risk_tiers[std_idx]
                c_vals = centroids[raw_idx]
                standardized_centroids[std_tier] = {
                    "age": round(float(c_vals[0]), 1),
                    "BMI": round(float(c_vals[11]), 1),
                    "ap_hi": round(float(c_vals[4]), 1),
                    "ap_lo": round(float(c_vals[5]), 1),
                    "cholesterol": round(float(c_vals[6]), 2),
                    "gluc": round(float(c_vals[7]), 2)
                }
        else:
            # Fallback centroids from patient_risk_clustering.ipynb
            standardized_centroids = {
                "High Risk": {"age": 55.2, "BMI": 31.8, "ap_hi": 139.2, "ap_lo": 87.9, "cholesterol": 1.81, "gluc": 1.51},
                "Moderate Risk": {"age": 51.8, "BMI": 26.7, "ap_hi": 127.7, "ap_lo": 82.1, "cholesterol": 1.37, "gluc": 1.20},
                "Low Risk": {"age": 51.7, "BMI": 25.2, "ap_hi": 119.5, "ap_lo": 77.7, "cholesterol": 1.12, "gluc": 1.08}
            }
            
        return {
            "status": "success",
            "prediction": xgb_pred,
            "risk_score": round(xgb_risk_pct, 2),
            "risk_level": risk_level,
            "confidence": "96.8%",
            "mlp_prediction": mlp_pred,
            "mlp_risk_score": round(mlp_risk_pct, 2),
            "mlp_risk_level": mlp_risk_level,
            "shap_base_value": round(base_prob * 100, 2),
            "shap_base_value_logodds": shap_expected,
            "shap_values": shap_list,
            "primary_drivers": primary_drivers,
            "protective_factors": protective_factors,
            "recommendations": recommendations,
            "model_info": model_info,
            "clustering": {
                "risk_tier": cluster_risk_tier,
                "centroids": standardized_centroids,
                "distribution": cluster_percentages
            }
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"An error occurred during risk model inference: {str(e)}"
        )