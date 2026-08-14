import os
import joblib
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import accuracy_score, roc_auc_score, precision_score, recall_score, f1_score

# Set environment variable to avoid OpenMP duplicate runtime initialization error
os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"

import torch
import torch.nn as nn

def train_mlp_model():
    print("Starting training of Deep Learning MLP Model...")
    
    # Paths
    csv_path = r"c:\Users\GAURAV\Desktop\cardiovascular-risk-screening-system\data\raw\cardio_train.csv"
    models_dir = r"c:\Users\GAURAV\Desktop\cardiovascular-risk-screening-system\backend\models"
    
    if not os.path.exists(csv_path):
        print(f"Dataset not found at {csv_path}!")
        return
        
    os.makedirs(models_dir, exist_ok=True)
    
    # Load dataset
    df = pd.read_csv(csv_path, sep=";")
    
    # Clean dataset (as in DL notebook)
    df_clean = df.copy()
    df_clean.drop(columns=["id"], inplace=True, errors="ignore")
    
    # Age in years
    df_clean["age"] = (df_clean["age"] / 365).round(1)
    
    # Blood pressure clean
    df_clean = df_clean[(df_clean["ap_hi"] > 60) & (df_clean["ap_hi"] < 250)]
    df_clean = df_clean[(df_clean["ap_lo"] > 40) & (df_clean["ap_lo"] < 200)]
    df_clean = df_clean[df_clean["ap_hi"] >= df_clean["ap_lo"]]
    
    # Height/weight outliers (top/bottom 1%)
    for col in ["height", "weight"]:
        q1, q2 = df_clean[col].quantile([0.01, 0.99])
        df_clean = df_clean[(df_clean[col] >= q1) & (df_clean[col] <= q2)]
        
    # Calculate BMI
    df_clean["BMI"] = df_clean["weight"] / ((df_clean["height"] / 100) ** 2)
    df_clean.reset_index(drop=True, inplace=True)
    
    # Split
    X = df_clean.drop("cardio", axis=1)
    y = df_clean["cardio"]
    
    X_train, X_test, y_train, y_test = train_test_split(
        X, y,
        test_size=0.2,
        stratify=y,
        random_state=42
    )
    
    # Scale
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    
    # Convert to PyTorch Tensors
    X_train_t = torch.tensor(X_train_scaled, dtype=torch.float32)
    X_test_t = torch.tensor(X_test_scaled, dtype=torch.float32)
    y_train_t = torch.tensor(y_train.values, dtype=torch.float32)
    y_test_t = torch.tensor(y_test.values, dtype=torch.float32)
    
    # MLP definition
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
            
    # Initialize model
    torch.manual_seed(42)
    model = CVDRiskMLP(input_dim=X_train_scaled.shape[1])
    criterion = nn.BCEWithLogitsLoss()
    optimizer = torch.optim.Adam(model.parameters(), lr=1e-3)
    
    # Train
    epochs = 50
    batch_size = 256
    n = X_train_t.shape[0]
    
    print(f"Training on {n} samples for {epochs} epochs...")
    for epoch in range(epochs):
        model.train()
        perm = torch.randperm(n)
        for i in range(0, n, batch_size):
            idx = perm[i:i + batch_size]
            xb, yb = X_train_t[idx], y_train_t[idx]
            optimizer.zero_grad()
            logits = model(xb)
            loss = criterion(logits, yb)
            loss.backward()
            optimizer.step()
            
    # Evaluate
    model.eval()
    with torch.no_grad():
        test_logits = model(X_test_t)
        probs = torch.sigmoid(test_logits).numpy()
    preds = (probs >= 0.5).astype(int)
    
    acc = accuracy_score(y_test, preds)
    auc = roc_auc_score(y_test, probs)
    print(f"Training completed successfully!")
    print(f"Test Accuracy: {acc*100:.3f}%")
    print(f"Test ROC-AUC: {auc*100:.3f}%")
    
    # Save
    model_save_path = os.path.join(models_dir, "mlp_best.pt")
    scaler_save_path = os.path.join(models_dir, "scaler.pkl")
    
    torch.save(model.state_dict(), model_save_path)
    joblib.dump(scaler, scaler_save_path)
    
    print(f"Saved PyTorch weights to: {model_save_path}")
    print(f"Saved fitted scaler to: {scaler_save_path}")
    print("=" * 50)

if __name__ == "__main__":
    train_mlp_model()
