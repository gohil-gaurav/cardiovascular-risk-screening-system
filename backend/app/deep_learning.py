"""
deep_learning.py

Deep learning module for the cardiovascular risk screening system.
Defines the CVDRiskMLP PyTorch Neural Network and houses loading and inference logic.
"""

import os
import joblib
import shap
import torch
import torch.nn as nn
import numpy as np

# Define the MLP model structure
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

class DeepExplainerWrapper(nn.Module):
    """
    Wrapper for CVDRiskMLP to ensure output is 2D shape (N, 1) rather than squeezed 1D.
    Required by SHAP DeepExplainer for PyTorch models.
    """
    def __init__(self, model):
        super().__init__()
        self.model = model

    def forward(self, x):
        out = self.model(x)
        if out.dim() == 1:
            out = out.unsqueeze(1)
        return out

# Global variables for deep learning models
mlp_model = None
scaler = None
mlp_explainer = None

def load_deep_learning_model(models_dir: str):
    """
    Loads standard scaler (scaler.pkl), PyTorch MLP weights (mlp_best.pt),
    and initializes SHAP DeepExplainer using background dataset (mlp_shap_background.pkl).
    
    Args:
        models_dir (str): Absolute path to the directory containing model assets.
    """
    global mlp_model, scaler, mlp_explainer
    
    # Load Scaler
    scaler_path = os.path.join(models_dir, "scaler.pkl")
    try:
        if os.path.exists(scaler_path):
            scaler = joblib.load(scaler_path)
            print(f"Scaler loaded successfully from: {scaler_path}")
        else:
            print(f"Warning: Scaler file not found at: {scaler_path}")
    except Exception as e:
        print(f"Error loading Scaler: {e}")

    # Load PyTorch MLP weights and DeepExplainer
    mlp_path = os.path.join(models_dir, "mlp_best.pt")
    try:
        if os.path.exists(mlp_path):
            mlp_model = CVDRiskMLP(input_dim=12)
            mlp_model.load_state_dict(torch.load(mlp_path))
            mlp_model.eval()
            print(f"PyTorch MLP loaded successfully from: {mlp_path}")

            # Note: mlp_shap_background.pkl needs to be generated and provided by Student C
            # from their training notebook, since they have access to the original training data.
            bg_path = os.path.join(models_dir, "mlp_shap_background.pkl")
            try:
                if os.path.exists(bg_path):
                    bg_data = joblib.load(bg_path)
                    if not isinstance(bg_data, torch.Tensor):
                        bg_data = torch.tensor(bg_data, dtype=torch.float32)
                    wrapped_mlp = DeepExplainerWrapper(mlp_model)
                    mlp_explainer = shap.DeepExplainer(wrapped_mlp, bg_data)
                    print(f"SHAP DeepExplainer for PyTorch MLP initialized successfully from: {bg_path}")
                else:
                    print(f"Warning: MLP SHAP background file not found at: {bg_path}")
            except Exception as e:
                print(f"Error initializing SHAP DeepExplainer for PyTorch MLP: {e}")
        else:
            print(f"Warning: PyTorch MLP weights not found at: {mlp_path}")
    except Exception as e:
        print(f"Error loading PyTorch MLP model: {e}")

def predict_deep_learning(df, input_dict: dict = None) -> dict:
    """
    Normalizes features using scaler.pkl and runs PyTorch MLP neural inference.
    If mlp_explainer is available and input_dict is provided, calculates MLP SHAP values.
    
    Args:
        df (pd.DataFrame): 1-row DataFrame containing scaled classification features.
        input_dict (dict, optional): Raw input feature values dict.
        
    Returns:
        dict: Dictionary containing mlp_prediction, mlp_risk_score, mlp_risk_level,
              mlp_risk_pct, df_scaled, and optionally mlp_shap_values,
              mlp_primary_drivers, mlp_protective_factors.
    """
    if mlp_model is None or scaler is None:
        return {}

    # Scale the classification DataFrame
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

    res = {
        "mlp_prediction": mlp_pred,
        "mlp_risk_score": round(mlp_risk_pct, 2),
        "mlp_risk_level": mlp_risk_level,
        "mlp_risk_pct": mlp_risk_pct,
        "df_scaled": df_scaled
    }

    # Compute MLP SHAP values if explainer is available
    if mlp_explainer is not None and input_dict is not None:
        try:
            from app.supervised import format_shap_explanation
            raw_shap = mlp_explainer.shap_values(df_t)
            mlp_shap_values, mlp_primary_drivers, mlp_protective_factors = format_shap_explanation(raw_shap, input_dict)
            res["mlp_shap_values"] = mlp_shap_values
            res["mlp_primary_drivers"] = mlp_primary_drivers
            res["mlp_protective_factors"] = mlp_protective_factors
        except Exception as e:
            print(f"Error computing MLP SHAP values: {e}")

    return res

