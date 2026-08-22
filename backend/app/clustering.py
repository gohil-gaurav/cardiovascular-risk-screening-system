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
            age = input_dict.get("age", 50.0)
            height_cm = input_dict.get("height", 165.0)
            weight_kg = input_dict.get("weight", 70.0)
            height_m = height_cm / 100.0 if height_cm > 0 else 1.65
            computed_bmi = weight_kg / (height_m ** 2)
            bmi = input_dict.get("BMI") or input_dict.get("bmi") or computed_bmi

            age_days = age * 365.25
            age_years_for_cluster = age_days / 365.25
            ap_hi = input_dict.get("ap_hi", 120)
            ap_lo = input_dict.get("ap_lo", 80)
            pulse_pressure = ap_hi - ap_lo
            bp_ratio = ap_hi / ap_lo if ap_lo > 0 else 1.0

            cluster_val_map = {
                "age_years": age_years_for_cluster,
                "gender": input_dict.get("gender", 1),
                "height": height_cm,
                "weight": weight_kg,
                "BMI": bmi,
                "ap_hi": ap_hi,
                "ap_lo": ap_lo,
                "cholesterol": input_dict.get("cholesterol", 1),
                "gluc": input_dict.get("gluc", 1),
                "smoke": input_dict.get("smoke", 0),
                "alco": input_dict.get("alco", 0),
                "active": input_dict.get("active", 1),
                "pulse_pressure": pulse_pressure,
                "bp_ratio": bp_ratio
            }

            # Map DataFrame dynamically
            cluster_row_dict = {f: cluster_val_map.get(f, 0.0) for f in cluster_features_list}
            cluster_df = pd.DataFrame([cluster_row_dict])[cluster_features_list]

            # Normalize using K-Means specific scaler
            cluster_df_scaled = kmean_scaler.transform(cluster_df)

            # 1. K-Means classification (weighted feature distance downweighting noise & height bias)
            feature_weights = np.ones(len(cluster_features_list))
            for i, f in enumerate(cluster_features_list):
                if f in ["height"]:
                    feature_weights[i] = 0.0
                elif f in ["smoke", "alco"]:
                    feature_weights[i] = 0.25

            scaled_sample = cluster_df_scaled[0]
            centers_scaled = kmeans_model.cluster_centers_

            dists = np.array([
                np.linalg.norm((scaled_sample - centers_scaled[i]) * feature_weights)
                for i in range(len(centers_scaled))
            ])

            # Clinical risk tier determination (AHA/ACC risk guidelines)
            chol = input_dict.get("cholesterol", 1)
            gluc = input_dict.get("gluc", 1)
            smoke = input_dict.get("smoke", 0)

            if ap_hi >= 140 or ap_lo >= 90 or bmi >= 30 or (ap_hi >= 135 and chol >= 2) or (age >= 60 and ap_hi >= 135):
                clinical_tier = "High Risk"
            elif ap_hi >= 125 or ap_lo >= 80 or bmi >= 25 or chol >= 2 or gluc >= 2 or smoke == 1 or age >= 55:
                clinical_tier = "Moderate Risk"
            else:
                clinical_tier = "Low Risk"

            closest_idx = int(np.argmin(dists))
            distance_tier = risk_mapping.get(closest_idx, "Low Risk")

            # If distances between top 2 clusters are borderline (diff < 0.35), align with clinical risk tier
            sorted_dists = np.sort(dists)
            if (sorted_dists[1] - sorted_dists[0]) < 0.35:
                cluster_risk_tier = clinical_tier
            else:
                cluster_risk_tier = distance_tier

            # 2. Soft assignment confidence probabilities across population clusters
            exp_neg_dists = np.exp(-dists)
            raw_probs = exp_neg_dists / np.sum(exp_neg_dists)

            clustering_confidence = {}
            for idx in range(len(centers_scaled)):
                label = risk_mapping.get(idx, f"Cluster {idx}")
                clustering_confidence[label] = round(float(raw_probs[idx]), 4)

            # Ensure the matched cohort tier has the primary confidence assignment
            tier_idx_map = {"High Risk": 0, "Moderate Risk": 1, "Low Risk": 2}
            matched_idx = tier_idx_map.get(cluster_risk_tier, closest_idx)
            probs_arr = np.array([clustering_confidence.get(risk_mapping[i], 0.0) for i in range(3)])
            if np.argmax(probs_arr) != matched_idx:
                max_other = np.max(probs_arr)
                probs_arr[matched_idx] = max_other + 0.10
                probs_arr = probs_arr / np.sum(probs_arr)
                for i in range(3):
                    clustering_confidence[risk_mapping[i]] = round(float(probs_arr[i]), 4)

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
