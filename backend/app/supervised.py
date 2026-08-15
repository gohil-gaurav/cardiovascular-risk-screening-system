"""
supervised.py

Supervised learning module for the cardiovascular risk screening system.
Loads the XGBoost classifier and SHAP explainer, performs inference,
computes local SHAP feature importance, and provides recommendations.
"""

import os
import joblib
import shap
import numpy as np

# Global model variables
xgb_model = None
explainer = None

def load_supervised_model(models_dir: str):
    """
    Loads the trained XGBoost model and initializes the SHAP TreeExplainer.
    
    Args:
        models_dir (str): Absolute path to the directory containing model assets.
    """
    global xgb_model, explainer
    xgb_path = os.path.join(models_dir, "best_model.pkl")
    try:
        if os.path.exists(xgb_path):
            xgb_model = joblib.load(xgb_path)
            print(f"XGBoost loaded successfully from: {xgb_path}")
            explainer = shap.TreeExplainer(xgb_model)
            print("SHAP TreeExplainer initialized successfully.")
        else:
            print(f"Warning: XGBoost model file not found at: {xgb_path}")
    except Exception as e:
        print(f"Error loading XGBoost model: {e}")

def predict_supervised(df, input_dict: dict, height_m: float, bmi: float) -> dict:
    """
    Runs XGBoost classification, calculates SHAP feature importance, 
    and generates risk-specific clinical recommendations.
    
    Args:
        df (pd.DataFrame): 1-row DataFrame containing scaled classification features.
        input_dict (dict): Raw input feature values dict.
        height_m (float): Patient height in meters.
        bmi (float): Patient BMI value.
        
    Returns:
        dict: Dictionary containing prediction result, risk score percentage,
              mapped risk tier, SHAP baseline probabilities, feature drivers lists,
              and clinical recommendations.
    """
    if xgb_model is None or explainer is None:
        return {}

    # Run XGBoost inference
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

    # Compute patient-level SHAP values
    shap_vals = explainer.shap_values(df)
    shap_expected = float(explainer.expected_value)
    
    # Base probability
    base_prob = 1 / (1 + np.exp(-shap_expected))

    feature_order = [
        'age', 'gender', 'height', 'weight', 'ap_hi', 'ap_lo',
        'cholesterol', 'gluc', 'smoke', 'alco', 'active', 'BMI'
    ]

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

    # Sort risk drivers vs protective drivers
    top_risk_drivers = sorted([s for s in shap_list if s["shap_value"] > 0], key=lambda x: x["shap_value"], reverse=True)
    top_protective_drivers = sorted([s for s in shap_list if s["shap_value"] < 0], key=lambda x: x["shap_value"])

    # Format primary drivers
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

        weight = abs(item["shap_value"])
        primary_drivers.append({
            "factor": desc,
            "contribution": "+" + f"{weight:.2f}",
            "importance_pct": min(100, round(weight * 100, 1)),
            "raw_val": item["shap_value"]
        })

    # Format protective factors
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

    # Clinical Recommendations
    recommendations = []
    if input_dict["ap_hi"] > 130 or input_dict["ap_lo"] > 80:
        recommendations.append({"icon": "sodium", "text": "Reduce sodium intake below 2,000 mg/day."})
        recommendations.append({"icon": "bp", "text": "Monitor blood pressure weekly at home and log it."})
        recommendations.append({"icon": "doctor", "text": "Consult a cardiologist for blood pressure management."})
    else:
        recommendations.append({"icon": "bp", "text": "Maintain current healthy blood pressure monitoring."})
        
    if bmi > 25:
        recommendations.append({"icon": "weight", "text": f"Maintain BMI below 25. Aim for a target weight of {round(24.9 * (height_m ** 2), 1)} kg."})
    else:
        recommendations.append({"icon": "weight", "text": "Maintain current healthy weight and body composition."})
        
    if input_dict["active"] == 0:
        recommendations.append({"icon": "activity", "text": "Exercise at least 30 minutes daily (e.g. brisk walking)."})
    else:
        recommendations.append({"icon": "activity", "text": "Continue with regular physical activity (150+ minutes/week)."})
        
    if input_dict["cholesterol"] >= 2:
        recommendations.append({"icon": "cholesterol", "text": "Follow a low-cholesterol diet and check lipid profile in 3 months."})
    else:
        recommendations.append({"icon": "cholesterol", "text": "Maintain healthy dietary habits to support optimal lipids."})
        
    if input_dict["smoke"] == 1:
        recommendations.append({"icon": "smoke", "text": "Initiate tobacco cessation counseling and support groups."})
        
    if not recommendations:
        recommendations.append({"icon": "doctor", "text": "Schedule regular annual cardiovascular screenings."})

    return {
        "prediction": xgb_pred,
        "risk_score": round(xgb_risk_pct, 2),
        "risk_level": risk_level,
        "shap_base_value": round(base_prob * 100, 2),
        "shap_base_value_logodds": shap_expected,
        "shap_values": shap_list,
        "primary_drivers": primary_drivers,
        "protective_factors": protective_factors,
        "recommendations": recommendations,
        "xgb_risk_pct": xgb_risk_pct
    }
