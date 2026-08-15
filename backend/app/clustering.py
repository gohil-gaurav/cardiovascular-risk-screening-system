"""
clustering.py

Unsupervised clustering module for the cardiovascular risk screening system.
Handles loading of K-Means and GMM model pipelines, performs feature engineering,
and infers hard-clustering and GMM soft-clustering confidence scores.
"""

import os
import joblib
import pandas as pd
import numpy as np

# Global variables for 5-file clustering package
cluster_features_list = None
kmean_scaler = None
kmeans_model = None
gmm_model = None
risk_mapping = None

# Fallback old kmeans pkl file loading global references
kmeans_model_data = None

def load_clustering_models(models_dir: str):
    """
    Loads K-Means feature schemas, scaling parameters, model binaries, GMM models,
    and standardized mappings from the models directory.
    
    Args:
        models_dir (str): Absolute path to the directory containing model assets.
    """
    global cluster_features_list, kmean_scaler, kmeans_model, gmm_model, risk_mapping, kmeans_model_data

    # Load KMeans Risk Clustering model package (OLD - Commented out for rollback safety)
    # kmeans_path = os.path.join(models_dir, "kmeans.pkl")
    # try:
    #     if os.path.exists(kmeans_path):
    #         kmeans_model_data = joblib.load(kmeans_path)
    #         print(f"KMeans Risk Clustering model loaded successfully from: {kmeans_path}")
    #     else:
    #         print(f"Warning: KMeans Risk Clustering model not found at: {kmeans_path}")
    # except Exception as e:
    #     print(f"Error loading KMeans Risk Clustering model: {e}")

    print("=" * 60)
    print("Loading 5-file clustering models inside clustering.py...")
    print("=" * 60)

    # 1. Load cluster_features.pkl
    cluster_features_path = os.path.join(models_dir, "cluster_features.pkl")
    try:
        if os.path.exists(cluster_features_path):
            cluster_features_list = joblib.load(cluster_features_path)
            print(f"Cluster features list loaded successfully from: {cluster_features_path}")
        else:
            print(f"Warning: Cluster features list not found at: {cluster_features_path}")
    except Exception as e:
        print(f"Error loading cluster features list: {e}")

    # 2. Load kmean_scaler.pkl (StandardScaler specifically for clustering)
    kmean_scaler_path = os.path.join(models_dir, "kmean_scaler.pkl")
    try:
        if os.path.exists(kmean_scaler_path):
            kmean_scaler = joblib.load(kmean_scaler_path)
            print(f"K-Means Scaler loaded successfully from: {kmean_scaler_path}")
        else:
            print(f"Warning: K-Means Scaler not found at: {kmean_scaler_path}")
    except Exception as e:
        print(f"Error loading K-Means Scaler: {e}")

    # 3. Load kmeans_model.pkl (K-Means model)
    kmeans_model_path = os.path.join(models_dir, "kmeans_model.pkl")
    try:
        if os.path.exists(kmeans_model_path):
            loaded_data = joblib.load(kmeans_model_path)
            # Check if it's a raw KMeans object, a dict, or a tuple
            if isinstance(loaded_data, dict):
                kmeans_model = loaded_data.get("kmeans", None)
                if kmeans_model is None:
                    # Fallback
                    for v in loaded_data.values():
                        if hasattr(v, "cluster_centers_"):
                            kmeans_model = v
                            break
            elif isinstance(loaded_data, tuple):
                for item in loaded_data:
                    if hasattr(item, "cluster_centers_"):
                        kmeans_model = item
                        break
            else:
                kmeans_model = loaded_data
            
            if kmeans_model is not None and hasattr(kmeans_model, "cluster_centers_"):
                print(f"K-Means Model loaded successfully from: {kmeans_model_path}")
            else:
                print(f"Warning: Loaded object from {kmeans_model_path} does not appear to contain a valid K-Means model")
        else:
            print(f"Warning: K-Means Model not found at: {kmeans_model_path}")
    except Exception as e:
        print(f"Error loading K-Means Model: {e}")

    # 4. Load gmm_model.pkl (Gaussian Mixture Model)
    gmm_model_path = os.path.join(models_dir, "gmm_model.pkl")
    try:
        if os.path.exists(gmm_model_path):
            gmm_model = joblib.load(gmm_model_path)
            print(f"GMM Model loaded successfully from: {gmm_model_path}")
        else:
            print(f"Warning: GMM Model not found at: {gmm_model_path}")
    except Exception as e:
        print(f"Error loading GMM Model: {e}")

    # 5. Load risk_mapping.pkl (dictionary lookups)
    risk_mapping_path = os.path.join(models_dir, "risk_mapping.pkl")
    try:
        if os.path.exists(risk_mapping_path):
            risk_mapping = joblib.load(risk_mapping_path)
            print(f"Risk Mapping loaded successfully from: {risk_mapping_path}")
            print("=" * 60)
        else:
            print(f"Warning: Risk Mapping not found at: {risk_mapping_path}")
    except Exception as e:
        print(f"Error loading Risk Mapping: {e}")

def predict_clustering(input_dict: dict, df_scaled: np.ndarray) -> dict:
    """
    Computes derived variables, orders columns dynamically by schema, normalizes
    via clustering Standard Scaler, runs K-Means & GMM, and returns risk mappings.
    
    Args:
        input_dict (dict): Raw input feature values dict.
        df_scaled (np.ndarray): Scaled classification array for old fallback prediction.
        
    Returns:
        dict: Dictionary containing the K-Means 'clustering' details and GMM
              'clustering_confidence' probability breakdowns.
    """
    cluster_risk_tier = "Low Risk"
    clustering_confidence = {"Low Risk": 1.0, "Moderate Risk": 0.0, "High Risk": 0.0}
    cluster_percentages = {
        "Low Risk": 58.27,
        "Moderate Risk": 9.74,
        "High Risk": 31.99
    }

    new_clustering_available = (
        cluster_features_list is not None and
        kmean_scaler is not None and
        kmeans_model is not None and
        gmm_model is not None and
        risk_mapping is not None
    )

    if new_clustering_available:
        try:
            # Derived features computation
            # TODO: confirm with clustering owner whether age is in days or years
            age_days = input_dict["age"] * 365.25
            age_years_for_cluster = age_days / 365.25
            pulse_pressure = input_dict["ap_hi"] - input_dict["ap_lo"]
            bp_ratio = input_dict["ap_hi"] / input_dict["ap_lo"] if input_dict["ap_lo"] > 0 else 1.0

            cluster_val_map = {
                "age_years": age_years_for_cluster,
                "gender": input_dict["gender"],
                "height": input_dict["height"],
                "weight": input_dict["weight"],
                "BMI": input_dict["BMI"],
                "ap_hi": input_dict["ap_hi"],
                "ap_lo": input_dict["ap_lo"],
                "cholesterol": input_dict["cholesterol"],
                "gluc": input_dict["gluc"],
                "smoke": input_dict["smoke"],
                "alco": input_dict["alco"],
                "active": input_dict["active"],
                "pulse_pressure": pulse_pressure,
                "bp_ratio": bp_ratio
            }

            # Map DataFrame dynamically
            cluster_row_dict = {f: cluster_val_map.get(f, 0.0) for f in cluster_features_list}
            cluster_df = pd.DataFrame([cluster_row_dict])[cluster_features_list]

            # Normalize using K-Means specific scaler
            cluster_df_scaled = kmean_scaler.transform(cluster_df)

            # 1. K-Means classification
            kmeans_idx = int(kmeans_model.predict(cluster_df_scaled)[0])
            cluster_risk_tier = risk_mapping.get(kmeans_idx, "Low Risk")

            # 2. GMM soft assignment probabilities
            gmm_probs = gmm_model.predict_proba(cluster_df_scaled)[0]
            clustering_confidence = {}
            for idx, prob in enumerate(gmm_probs):
                label = risk_mapping.get(idx, f"Cluster {idx}")
                clustering_confidence[label] = round(float(prob), 4)

            # Centroids reconstruction
            standardized_centroids = {}
            if hasattr(kmeans_model, "cluster_centers_") and kmean_scaler is not None:
                try:
                    centers_scaled = kmeans_model.cluster_centers_
                    centers_orig = kmean_scaler.inverse_transform(centers_scaled)
                    f_list = list(cluster_features_list)
                    age_f_idx = f_list.index("age_years") if "age_years" in f_list else 0
                    bmi_f_idx = f_list.index("BMI") if "BMI" in f_list else 3
                    ap_hi_f_idx = f_list.index("ap_hi") if "ap_hi" in f_list else 4
                    ap_lo_f_idx = f_list.index("ap_lo") if "ap_lo" in f_list else 5
                    chol_f_idx = f_list.index("cholesterol") if "cholesterol" in f_list else 6
                    gluc_f_idx = f_list.index("gluc") if "gluc" in f_list else 7

                    for raw_idx, label in risk_mapping.items():
                        c_vals = centers_orig[raw_idx]
                        standardized_centroids[label] = {
                            "age": round(float(c_vals[age_f_idx]), 1),
                            "BMI": round(float(c_vals[bmi_f_idx]), 1),
                            "ap_hi": round(float(c_vals[ap_hi_f_idx]), 1),
                            "ap_lo": round(float(c_vals[ap_lo_f_idx]), 1),
                            "cholesterol": round(float(c_vals[chol_f_idx]), 2),
                            "gluc": round(float(c_vals[gluc_f_idx]), 2)
                        }
                except Exception as cent_err:
                    print(f"Error computing centroids from model centers: {cent_err}")
                    standardized_centroids = {
                        "High Risk": {"age": 55.2, "BMI": 31.8, "ap_hi": 139.2, "ap_lo": 87.9, "cholesterol": 1.81, "gluc": 1.51},
                        "Moderate Risk": {"age": 51.8, "BMI": 26.7, "ap_hi": 127.7, "ap_lo": 82.1, "cholesterol": 1.37, "gluc": 1.20},
                        "Low Risk": {"age": 51.7, "BMI": 25.2, "ap_hi": 119.5, "ap_lo": 77.7, "cholesterol": 1.12, "gluc": 1.08}
                    }
            else:
                standardized_centroids = {
                    "High Risk": {"age": 55.2, "BMI": 31.8, "ap_hi": 139.2, "ap_lo": 87.9, "cholesterol": 1.81, "gluc": 1.51},
                    "Moderate Risk": {"age": 51.8, "BMI": 26.7, "ap_hi": 127.7, "ap_lo": 82.1, "cholesterol": 1.37, "gluc": 1.20},
                    "Low Risk": {"age": 51.7, "BMI": 25.2, "ap_hi": 119.5, "ap_lo": 77.7, "cholesterol": 1.12, "gluc": 1.08}
                }
        except Exception as cluster_err:
            print(f"Error during new clustering pipeline inference: {cluster_err}")
            new_clustering_available = False

    if not new_clustering_available:
        standardized_centroids = {
            "High Risk": {"age": 55.2, "BMI": 31.8, "ap_hi": 139.2, "ap_lo": 87.9, "cholesterol": 1.81, "gluc": 1.51},
            "Moderate Risk": {"age": 51.8, "BMI": 26.7, "ap_hi": 127.7, "ap_lo": 82.1, "cholesterol": 1.37, "gluc": 1.20},
            "Low Risk": {"age": 51.7, "BMI": 25.2, "ap_hi": 119.5, "ap_lo": 77.7, "cholesterol": 1.12, "gluc": 1.08}
        }
        if kmeans_model_data is not None:
            try:
                old_kmeans = kmeans_model_data["kmeans"]
                old_mapping = kmeans_model_data["cluster_mapping"]
                old_centroids = kmeans_model_data["centroids_orig"]
                old_cluster_idx = int(old_kmeans.predict(df_scaled)[0])
                old_mapped_idx = old_mapping[old_cluster_idx]
                
                risk_tiers_map = {0: "High Risk", 1: "Moderate Risk", 2: "Low Risk"}
                cluster_risk_tier = risk_tiers_map[old_mapped_idx]
                
                standardized_centroids = {}
                for raw_idx, std_idx in old_mapping.items():
                    std_tier = risk_tiers_map[std_idx]
                    c_vals = old_centroids[raw_idx]
                    standardized_centroids[std_tier] = {
                        "age": round(float(c_vals[0]), 1),
                        "BMI": round(float(c_vals[11]), 1),
                        "ap_hi": round(float(c_vals[4]), 1),
                        "ap_lo": round(float(c_vals[5]), 1),
                        "cholesterol": round(float(c_vals[6]), 2),
                        "gluc": round(float(c_vals[7]), 2)
                    }
            except Exception as old_err:
                print(f"Error during old fallback clustering: {old_err}")

    return {
        "clustering": {
            "risk_tier": cluster_risk_tier,
            "centroids": standardized_centroids,
            "distribution": cluster_percentages
        },
        "clustering_confidence": clustering_confidence
    }
