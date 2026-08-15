"""
deep_learning.py

Deep learning module for the cardiovascular risk screening system.
Defines the CVDRiskMLP PyTorch Neural Network and houses loading and inference logic.
"""

import os
import joblib
import torch
import torch.nn as nn

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

# Global variables for deep learning models
mlp_model = None
scaler = None

def load_deep_learning_model(models_dir: str):
    """
    Loads standard scaler (scaler.pkl) and PyTorch MLP weights (mlp_best.pt).
    
    Args:
        models_dir (str): Absolute path to the directory containing model assets.
    """
    global mlp_model, scaler
    
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

    # Load PyTorch MLP weights
    mlp_path = os.path.join(models_dir, "mlp_best.pt")
    try:
        if os.path.exists(mlp_path):
            mlp_model = CVDRiskMLP(input_dim=12)
            mlp_model.load_state_dict(torch.load(mlp_path))
            mlp_model.eval()
            print(f"PyTorch MLP loaded successfully from: {mlp_path}")
        else:
            print(f"Warning: PyTorch MLP weights not found at: {mlp_path}")
    except Exception as e:
        print(f"Error loading PyTorch MLP model: {e}")

def predict_deep_learning(df) -> dict:
    """
    Normalizes features using scaler.pkl and runs PyTorch MLP neural inference.
    
    Args:
        df (pd.DataFrame): 1-row DataFrame containing scaled classification features.
        
    Returns:
        dict: Dictionary containing mlp_prediction, mlp_risk_score, mlp_risk_level,
              mlp_risk_pct, and the scaled DataFrame array df_scaled.
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

    return {
        "mlp_prediction": mlp_pred,
        "mlp_risk_score": round(mlp_risk_pct, 2),
        "mlp_risk_level": mlp_risk_level,
        "mlp_risk_pct": mlp_risk_pct,
        "df_scaled": df_scaled
    }
