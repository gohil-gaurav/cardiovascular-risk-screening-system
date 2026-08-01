import os
import joblib
import pandas as pd
import numpy as np
from sklearn.cluster import KMeans

def train_kmeans():
    print("Training unsupervised KMeans risk clustering model...")
    csv_path = r"c:\Users\GAURAV\Desktop\cardiovascular-risk-screening-system\data\raw\cardio_train.csv"
    models_dir = r"c:\Users\GAURAV\Desktop\cardiovascular-risk-screening-system\backend\models"
    scaler_path = os.path.join(models_dir, "scaler.pkl")
    kmeans_path = os.path.join(models_dir, "kmeans.pkl")
    
    if not os.path.exists(csv_path):
        print(f"Dataset not found at: {csv_path}")
        return
        
    if not os.path.exists(scaler_path):
        print(f"Scaler not found at: {scaler_path}. Running train_mlp first or fit custom scaler.")
        return

    # 1. Load dataset
    df = pd.read_csv(csv_path, sep=";")
    
    # 2. Preprocess (matching train_mlp.py)
    df_clean = df.copy()
    df_clean.drop(columns=["id"], inplace=True, errors="ignore")
    df_clean["age"] = (df_clean["age"] / 365).round(1)
    df_clean = df_clean[(df_clean["ap_hi"] > 60) & (df_clean["ap_hi"] < 250)]
    df_clean = df_clean[(df_clean["ap_lo"] > 40) & (df_clean["ap_lo"] < 200)]
    df_clean = df_clean[df_clean["ap_hi"] >= df_clean["ap_lo"]]
    
    for col in ["height", "weight"]:
        q1, q2 = df_clean[col].quantile([0.01, 0.99])
        df_clean = df_clean[(df_clean[col] >= q1) & (df_clean[col] <= q2)]
        
    df_clean["BMI"] = df_clean["weight"] / ((df_clean["height"] / 100) ** 2)
    df_clean.reset_index(drop=True, inplace=True)
    
    X = df_clean.drop("cardio", axis=1, errors="ignore")
    
    # Feature order expected by the models
    feature_order = [
        'age', 'gender', 'height', 'weight', 'ap_hi', 'ap_lo',
        'cholesterol', 'gluc', 'smoke', 'alco', 'active', 'BMI'
    ]
    X = X[feature_order]

    # 3. Scale features using fit scaler
    scaler = joblib.load(scaler_path)
    X_scaled = scaler.transform(X)

    # 4. Train K-Means
    kmeans = KMeans(n_clusters=3, random_state=42, n_init=10)
    kmeans.fit(X_scaled)
    
    # 5. Determine mapping based on centroids (Low -> Moderate -> High)
    # We will use ap_hi (Systolic BP) centroid coordinate to order clusters
    centroids = kmeans.cluster_centers_
    # Inverse transform centroids to original space to inspect clinical values
    centroids_orig = scaler.inverse_transform(centroids)
    
    # Get index of ap_hi in feature list (ap_hi is index 4 in feature_order)
    ap_hi_idx = feature_order.index('ap_hi')
    ap_hi_centroids = centroids_orig[:, ap_hi_idx]
    
    # Sort indices based on ap_hi centroids in ascending order
    sorted_cluster_indices = np.argsort(ap_hi_centroids)
    
    mapping = {
        sorted_cluster_indices[0]: 2,  # lowest BP -> Cluster 2: Low Risk
        sorted_cluster_indices[1]: 1,  # middle BP -> Cluster 1: Moderate Risk
        sorted_cluster_indices[2]: 0   # highest BP -> Cluster 0: High Risk
    }
    
    # Save the model and the mapping info
    model_data = {
        "kmeans": kmeans,
        "cluster_mapping": mapping,
        "centroids_orig": centroids_orig.tolist(),
        "feature_order": feature_order
    }
    
    joblib.dump(model_data, kmeans_path)
    print("=" * 60)
    print(f"KMeans model trained and saved successfully to: {kmeans_path}")
    print("Cluster index mapping (Original -> Standardized):", mapping)
    print("Low Risk centroid ap_hi:", ap_hi_centroids[sorted_cluster_indices[0]])
    print("Moderate Risk centroid ap_hi:", ap_hi_centroids[sorted_cluster_indices[1]])
    print("High Risk centroid ap_hi:", ap_hi_centroids[sorted_cluster_indices[2]])
    print("=" * 60)

if __name__ == "__main__":
    train_kmeans()
