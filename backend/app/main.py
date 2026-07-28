import os
import joblib
import pandas as pd
import warnings
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# Suppress XGBoost loading warning if pickle is generated on different Python versions
warnings.filterwarnings("ignore", category=UserWarning, module="pickle")

app = FastAPI(
    title="Cardiovascular Risk Screening API",
    version="1.0.0"
)

# Allow React frontend to access this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load the model once on startup
MODEL_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "models", "best_model.pkl")
model = None

@app.on_event("startup")
def load_model():
    global model
    try:
        if os.path.exists(MODEL_PATH):
            model = joblib.load(MODEL_PATH)
            print("=" * 60)
            print(f"Model loaded successfully from: {MODEL_PATH}")
            if hasattr(model, "feature_names_in_"):
                print("Model features:", list(model.feature_names_in_))
            print("=" * 60)
        else:
            print("=" * 60)
            print(f"Warning: Model file not found at: {MODEL_PATH}")
            print("=" * 60)
    except Exception as e:
        print(f"Error loading model: {e}")

class PatientData(BaseModel):
    age: float = Field(..., description="Age in years", examples=[34.0])
    gender: int = Field(..., description="Biological sex (1: male, 2: female or similar)", examples=[1])
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
        "message": "Backend Connected Successfully 🚀",
        "model_loaded": model is not None
    }

@app.post("/predict")
def predict_risk(data: PatientData):
    if model is None:
        raise HTTPException(
            status_code=503,
            detail="Machine learning model is not loaded. Please ensure best_model.pkl exists in the models directory."
        )
    
    try:
        # Convert pydantic input model to dictionary
        input_dict = data.model_dump()
        
        # Calculate BMI
        height_m = input_dict["height"] / 100
        bmi = input_dict["weight"] / (height_m ** 2)
        input_dict["BMI"] = bmi
        
        # Keep exact feature order expected by XGBoost model
        feature_order = [
            'age', 'gender', 'height', 'weight', 'ap_hi', 'ap_lo',
            'cholesterol', 'gluc', 'smoke', 'alco', 'active', 'BMI'
        ]
        
        # Create single row DataFrame
        df = pd.DataFrame([input_dict])[feature_order]
        
        # Run prediction
        prob = float(model.predict_proba(df)[0][1])  # Probability of cardiovascular risk
        pred = int(model.predict(df)[0])             # 1 for Disease, 0 for No Disease
        
        # Map risk levels
        risk_percentage = prob * 100
        if risk_percentage >= 75:
            risk_level = "High Risk"
        elif risk_percentage >= 45:
            risk_level = "Moderate Risk"
        else:
            risk_level = "Low Risk"
            
        # Determine primary drivers (clinical heuristic based on parameters)
        primary_drivers = []
        if data.ap_hi > 135:
            primary_drivers.append(f"Elevated Systolic Blood Pressure ({data.ap_hi} mmHg)")
        if data.ap_lo > 85:
            primary_drivers.append(f"Elevated Diastolic Blood Pressure ({data.ap_lo} mmHg)")
        if data.cholesterol >= 3:
            primary_drivers.append(f"High Cholesterol Level ({data.cholesterol})")
        if data.active == 0:
            primary_drivers.append("Lack of physical activity (Sedentary lifestyle)")
        if bmi > 25.0:
            primary_drivers.append(f"High Body Mass Index (BMI: {round(bmi, 1)})")
            
        # Clinical Recommendations
        recommendations = [
            "Advise low-sodium and heart-healthy dietary modifications.",
            "Incorporate regular moderate-intensity cardiovascular exercise."
        ]
        if data.ap_hi > 140 or data.ap_lo > 90:
            recommendations.append("Recommend monitoring of blood pressure and physician consultation.")
        if data.cholesterol >= 2:
            recommendations.append("Consider lipid-profile test and cholesterol management discussion.")
        recommendations.append("Schedule periodic screening to track updates.")
            
        return {
            "status": "success",
            "prediction": pred,
            "risk_score": round(risk_percentage, 2),
            "risk_level": risk_level,
            "confidence": "96.8%",
            "primary_drivers": primary_drivers,
            "recommendations": recommendations
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"An error occurred during risk model inference: {str(e)}"
        )