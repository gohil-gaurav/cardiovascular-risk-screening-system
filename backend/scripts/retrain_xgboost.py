"""
retrain_xgboost.py

Standalone automated retraining pipeline for the primary XGBoost cardiovascular risk classifier.
Pulls doctor-confirmed patient records from the database, combines them with the original
training dataset, retrains the model using GridSearchCV, evaluates performance on a held-out
test set against stored baseline metrics, updates the model registry (model_registry.json),
and automatically promotes winning models with atomic backup to best_model_previous.pkl.

Usage:
    python backend/scripts/retrain_xgboost.py [--dry-run] [--min-records 100] [--force] [--no-promote]
"""

import os
import re
import sys
import json
import shutil
import argparse
import datetime
import pandas as pd
import numpy as np
import joblib

# Resolve backend and project root directory paths
BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PROJECT_ROOT = os.path.dirname(BACKEND_DIR)

if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from sklearn.model_selection import GridSearchCV
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score
from xgboost import XGBClassifier

from app.database import SessionLocal
from app.models_db import ScreeningRecord, RetrainLog
from app.supervised import FEATURE_ORDER

# Configurable constants
MIN_NEW_RECORDS_FOR_RETRAIN = int(os.getenv("RETRAIN_THRESHOLD", 1000))

MODELS_DIR = os.path.join(BACKEND_DIR, "models")
ARCHIVE_DIR = os.path.join(MODELS_DIR, "archived")
REGISTRY_FILE = os.path.join(MODELS_DIR, "model_registry.json")
VERSION_FILE = os.path.join(MODELS_DIR, "current_model_version.txt")
LOG_FILE = os.path.join(MODELS_DIR, "retraining_log.txt")

# Hyperparameter search grid (matching Student A's original classification notebook tuning)
XGB_PARAM_GRID = {
    "n_estimators": [100, 200],
    "learning_rate": [0.05, 0.1],
    "max_depth": [3, 5]
}


def get_current_model_version() -> str:
    """
    Reads the active model version string from current_model_version.txt.
    Defaults to 'v1' if the file does not exist.
    """
    if os.path.exists(VERSION_FILE):
        try:
            with open(VERSION_FILE, "r", encoding="utf-8") as f:
                ver = f.read().strip()
                if ver:
                    return ver
        except Exception:
            pass
    return "v1"


def get_confirmed_records_from_db():
    """
    Connects to the database and queries all ScreeningRecord rows where
    doctor_confirmed_label is NOT NULL.

    Returns:
        pd.DataFrame: DataFrame containing confirmed screening records.
    """
    print("[1/5] Querying doctor-confirmed screening records from database...")
    db = SessionLocal()
    try:
        query = db.query(ScreeningRecord).filter(ScreeningRecord.doctor_confirmed_label.isnot(None))
        records = query.all()
        
        if not records:
            print("Found 0 confirmed records in database.")
            return pd.DataFrame()
            
        data = []
        for r in records:
            data.append({
                "age": r.age,
                "gender": r.gender,
                "height": r.height,
                "weight": r.weight,
                "ap_hi": r.ap_hi,
                "ap_lo": r.ap_lo,
                "cholesterol": r.cholesterol,
                "gluc": r.gluc,
                "smoke": r.smoke,
                "alco": r.alco,
                "active": r.active,
                "BMI": r.bmi,
                "doctor_confirmed_label": r.doctor_confirmed_label
            })
            
        df_confirmed = pd.DataFrame(data)
        print(f"Found {len(df_confirmed)} confirmed records since last training.")
        return df_confirmed
    finally:
        db.close()


def load_original_datasets():
    """
    Loads original processed train.csv and test.csv datasets.

    Returns:
        tuple[pd.DataFrame, pd.DataFrame]: (train_df, test_df)
    """
    train_path = os.path.join(PROJECT_ROOT, "data", "processed", "train.csv")
    test_path = os.path.join(PROJECT_ROOT, "data", "processed", "test.csv")

    if not os.path.exists(train_path) or not os.path.exists(test_path):
        raise FileNotFoundError(
            f"Original processed dataset files not found at {train_path} or {test_path}."
        )

    train_df = pd.read_csv(train_path)
    test_df = pd.read_csv(test_path)
    return train_df, test_df


def prepare_combined_data(train_df, df_confirmed):
    """
    Combines original training dataset with newly confirmed database records.

    IMPORTANT REASONING:
    We use doctor_confirmed_label (true clinical outcome verified by a clinician)
    as the ground-truth target label ('cardio'), converting "Disease" -> 1 and "No Disease" -> 0.
    We NEVER use predicted_label for retraining because training a model on its own past
    predictions would create a self-reinforcing feedback loop that perpetuates and exacerbates
    historical prediction errors rather than correcting them.
    """
    if df_confirmed.empty:
        return train_df

    print("[2/5] Combining original dataset with doctor-confirmed records...")
    
    # Map string confirmed labels to binary integer targets matching original dataset
    df_confirmed["cardio"] = df_confirmed["doctor_confirmed_label"].map({
        "Disease": 1,
        "No Disease": 0
    })
    
    # Drop rows with unmapped/invalid labels if any
    df_confirmed = df_confirmed.dropna(subset=["cardio"])
    df_confirmed["cardio"] = df_confirmed["cardio"].astype(int)

    # Ensure feature column order matches FEATURE_ORDER exactly
    columns_order = FEATURE_ORDER + ["cardio"]
    df_confirmed_aligned = df_confirmed[columns_order]
    train_aligned = train_df[columns_order]

    combined_df = pd.concat([train_aligned, df_confirmed_aligned], ignore_index=True)
    print(f"Combined Training Set: {len(train_df)} original + {len(df_confirmed_aligned)} confirmed = {len(combined_df)} total records.")
    return combined_df


def get_next_version_number(models_dir: str) -> int:
    """
    Auto-detects the next model version integer by scanning files matching best_model_v*.pkl
    in both models_dir and models_dir/archived.
    """
    max_ver = 1
    archive_dir = os.path.join(models_dir, "archived")
    dirs_to_check = [d for d in [models_dir, archive_dir] if os.path.exists(d)]
    for d in dirs_to_check:
        for fname in os.listdir(d):
            match = re.match(r"^best_model_v(\d+)\.pkl$", fname)
            if match:
                ver = int(match.group(1))
                if ver > max_ver:
                    max_ver = ver
    return max_ver + 1


def load_model_registry() -> dict:
    """
    Loads model registry dictionary from model_registry.json.
    Initializes default v1 entry if file does not exist.
    """
    if os.path.exists(REGISTRY_FILE):
        try:
            with open(REGISTRY_FILE, "r", encoding="utf-8") as f:
                registry = json.load(f)
                if isinstance(registry, dict) and len(registry) > 0:
                    return registry
        except Exception as e:
            print(f"Warning: Could not read model registry from {REGISTRY_FILE}: {e}")

    # Default fallback registry
    default_registry = {
        "v1": {
            "version": "v1",
            "model_file": "best_model.pkl",
            "trained_at": "2026-08-01T00:00:00Z",
            "accuracy": 73.02,
            "roc_auc": 79.86,
            "num_training_records": 46342,
            "num_new_confirmed_records": 0,
            "status": "promoted",
            "promoted_at": "2026-08-01T00:00:00Z",
            "rejected_reason": None
        }
    }
    return default_registry


def save_model_registry(registry: dict):
    """
    Saves model registry dictionary to model_registry.json.
    """
    os.makedirs(MODELS_DIR, exist_ok=True)
    with open(REGISTRY_FILE, "w", encoding="utf-8") as f:
        json.dump(registry, f, indent=2)


def get_current_live_baseline(registry: dict) -> tuple[str, float, float]:
    """
    Returns (active_version_str, active_roc_auc, active_accuracy) for the current live model.
    """
    active_ver = get_current_model_version()
    if active_ver in registry:
        entry = registry[active_ver]
        return active_ver, float(entry.get("roc_auc", 79.86)), float(entry.get("accuracy", 73.02))

    # Look for latest promoted version
    promoted_entries = [v for k, v in registry.items() if v.get("status") == "promoted"]
    if promoted_entries:
        latest = promoted_entries[-1]
        return latest.get("version", "v1"), float(latest.get("roc_auc", 79.86)), float(latest.get("accuracy", 73.02))

    return "v1", 79.86, 73.02


def write_log(entry: str):
    """
    Appends a timestamped entry to retraining_log.txt.
    """
    os.makedirs(MODELS_DIR, exist_ok=True)
    timestamp = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
    log_line = f"[{timestamp}] {entry}\n"
    with open(LOG_FILE, "a", encoding="utf-8") as f:
        f.write(log_line)


def record_db_retrain_log(version: str, records_used: int, new_records: int, status: str, roc_auc: float, accuracy: float, details: str):
    """
    Inserts a row into the retrain_logs table in the database for auditing.
    """
    db = SessionLocal()
    try:
        log_rec = RetrainLog(
            version=version,
            records_used=records_used,
            new_records_added=new_records,
            status=status,
            roc_auc=roc_auc,
            accuracy=accuracy,
            details=details
        )
        db.add(log_rec)
        db.commit()
    except Exception as exc:
        print(f"Warning: Could not record DB RetrainLog entry: {exc}")
    finally:
        db.close()


def run_retraining_pipeline(
    dry_run: bool = False,
    min_records: int = MIN_NEW_RECORDS_FOR_RETRAIN,
    force: bool = False,
    auto_promote: bool = True
):
    """
    Main orchestration logic for retraining XGBoost classifier.
    """
    print("=" * 70)
    print("      NOVUSAI XGBOOST AUTOMATED MODEL RETRAINING PIPELINE      ")
    print("=" * 70)
    if dry_run:
        print(">>> DRY RUN MODE ACTIVE — No model files or metrics will be written. <<<\n")

    os.makedirs(ARCHIVE_DIR, exist_ok=True)

    # Step 1: Pull database records
    df_confirmed = get_confirmed_records_from_db()
    num_new_records = len(df_confirmed)

    if num_new_records < min_records and not force:
        msg = f"Insufficient new confirmed records for retraining (found {num_new_records}, required minimum {min_records}). Exiting early."
        print(f"\n[ABORTED] {msg}")
        print("To bypass this check for testing, pass the --force flag.")
        return

    # Step 2: Load original dataset & combine
    train_df, test_df = load_original_datasets()
    combined_train_df = prepare_combined_data(train_df, df_confirmed)

    X_train = combined_train_df[FEATURE_ORDER]
    y_train = combined_train_df["cardio"]

    X_test = test_df[FEATURE_ORDER]
    y_test = test_df["cardio"]

    # Step 3: Retrain with GridSearchCV
    print(f"\n[3/5] Training XGBoost classifier using 5-fold GridSearchCV...")
    grid_search = GridSearchCV(
        estimator=XGBClassifier(
            random_state=42,
            eval_metric="logloss"
        ),
        param_grid=XGB_PARAM_GRID,
        cv=5,
        scoring="roc_auc",
        n_jobs=-1
    )

    grid_search.fit(X_train, y_train)
    best_model = grid_search.best_estimator_
    print(f"[OK] Grid Search Completed. Best Hyperparameters: {grid_search.best_params_}")
    print(f"[OK] Best Cross-Validation ROC-AUC: {grid_search.best_score_:.4f}")

    # Step 4: Evaluate on held-out test set
    print("\n[4/5] Evaluating newly trained model on held-out test dataset...")
    y_pred_prob = best_model.predict_proba(X_test)[:, 1]
    y_pred = (y_pred_prob >= 0.45).astype(int)  # Tuned decision threshold

    new_acc_pct = round(float(accuracy_score(y_test, y_pred)) * 100, 2)
    new_roc_auc_pct = round(float(roc_auc_score(y_test, y_pred_prob)) * 100, 2)
    new_precision = float(precision_score(y_test, y_pred))
    new_recall = float(recall_score(y_test, y_pred))
    new_f1 = float(f1_score(y_test, y_pred))

    registry = load_model_registry()
    baseline_ver, baseline_roc_auc_pct, baseline_acc_pct = get_current_live_baseline(registry)

    print("\n" + "-" * 50)
    print("           MODEL EVALUATION SUMMARY           ")
    print("-" * 50)
    print(f"Current Live Baseline ({baseline_ver}) : ROC-AUC = {baseline_roc_auc_pct:.2f}% | Accuracy = {baseline_acc_pct:.2f}%")
    print(f"New Candidate Model        : ROC-AUC = {new_roc_auc_pct:.2f}% | Accuracy = {new_acc_pct:.2f}%")
    print(f"Additional Metrics         : Precision = {new_precision:.4f} | Recall = {new_recall:.4f} | F1 = {new_f1:.4f}")
    print("-" * 50)

    next_ver_num = get_next_version_number(MODELS_DIR)
    new_version_str = f"v{next_ver_num}"
    new_model_filename = f"best_model_{new_version_str}.pkl"
    new_model_path = os.path.join(ARCHIVE_DIR, new_model_filename)
    now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()

    # Acceptance criterion: new ROC-AUC >= baseline ROC-AUC
    accepted = new_roc_auc_pct >= baseline_roc_auc_pct

    if not accepted:
        reject_reason = (
            f"ROC-AUC {new_roc_auc_pct:.2f}% below current live model's {baseline_roc_auc_pct:.2f}%"
        )
        print(f"\n[WARNING] REJECTED: {reject_reason}. Model will NOT be promoted.")
        
        if not dry_run:
            # Record entry in registry
            registry[new_version_str] = {
                "version": new_version_str,
                "model_file": f"archived/{new_model_filename}",
                "trained_at": now_iso,
                "accuracy": new_acc_pct,
                "roc_auc": new_roc_auc_pct,
                "num_training_records": len(combined_train_df),
                "num_new_confirmed_records": num_new_records,
                "status": "rejected",
                "promoted_at": None,
                "rejected_reason": reject_reason
            }
            save_model_registry(registry)
            write_log(f"REJECTED - Version: {new_version_str} - Records: {num_new_records} - Old ROC-AUC: {baseline_roc_auc_pct:.2f}% vs New: {new_roc_auc_pct:.2f}% - Reason: {reject_reason}")
            record_db_retrain_log(new_version_str, len(combined_train_df), num_new_records, "rejected", new_roc_auc_pct, new_acc_pct, reject_reason)

        return

    print("\n[5/5] Candidate model PASSED evaluation check (ROC-AUC >= baseline).")

    if dry_run:
        print(f"\n[DRY RUN COMPLETE] Retraining pipeline succeeded!")
        print(f"Would have saved new versioned model to: {new_model_path}")
        print(f"Would have updated {REGISTRY_FILE} with version '{new_version_str}' (status: promoted).")
        return

    # Save versioned model file inside archived/ directory
    joblib.dump(best_model, new_model_path)
    print(f"\n[OK] Saved new versioned model artifact to: {new_model_path}")

    # Automatic Promotion
    live_model_path = os.path.join(MODELS_DIR, "best_model.pkl")
    backup_model_path = os.path.join(ARCHIVE_DIR, "best_model_previous.pkl")

    if auto_promote:
        # Atomic Backup: Copy current best_model.pkl to archived/best_model_previous.pkl
        if os.path.exists(live_model_path):
            shutil.copyfile(live_model_path, backup_model_path)
            print(f"[OK] Atomic Backup: Backed up previous live model to {backup_model_path}")

        # Promote: Copy archived/best_model_v{N}.pkl to models/best_model.pkl
        shutil.copyfile(new_model_path, live_model_path)
        print(f"[OK] Promotion: Promoted {new_model_filename} to become live best_model.pkl")

        # Update current_model_version.txt
        with open(VERSION_FILE, "w", encoding="utf-8") as f:
            f.write(new_version_str)
        print(f"[OK] Active version file updated to: {new_version_str}")
        status_str = "promoted"
        promoted_at_val = now_iso
    else:
        status_str = "saved_unpromoted"
        promoted_at_val = None

    # Update model_registry.json
    registry[new_version_str] = {
        "version": new_version_str,
        "model_file": f"archived/{new_model_filename}",
        "trained_at": now_iso,
        "accuracy": new_acc_pct,
        "roc_auc": new_roc_auc_pct,
        "num_training_records": len(combined_train_df),
        "num_new_confirmed_records": num_new_records,
        "status": status_str,
        "promoted_at": promoted_at_val,
        "rejected_reason": None
    }
    save_model_registry(registry)
    print(f"[OK] Updated model registry: {REGISTRY_FILE}")


    # Write text log & DB RetrainLog
    log_msg = (
        f"PROMOTED - Version: {new_version_str} ({new_model_filename}) - "
        f"New Records: {num_new_records} - "
        f"ROC-AUC: {baseline_roc_auc_pct:.2f}% -> {new_roc_auc_pct:.2f}% - "
        f"Acc: {baseline_acc_pct:.2f}% -> {new_acc_pct:.2f}%"
    )
    write_log(log_msg)
    record_db_retrain_log(new_version_str, len(combined_train_df), num_new_records, status_str, new_roc_auc_pct, new_acc_pct, "Successfully promoted to production")
    print(f"[OK] Recorded retraining audit log in: {LOG_FILE}")

    # In-process live reload if app is running
    try:
        from app.supervised import load_supervised_model
        load_supervised_model(MODELS_DIR)
        print("[OK] Live In-Memory Reload: Triggered load_supervised_model() successfully.")
    except Exception as reload_err:
        print(f"Notice: Live model reload skipped/unsupported in CLI context: {reload_err}")

    print("\n" + "=" * 70)
    print(f"SUCCESS: XGBoost model successfully retrained and PROMOTED as '{new_version_str}'!")
    print(f"Live Model File : {live_model_path}")
    print(f"Version Artifact: {new_model_path}")
    print(f"ROC-AUC Score   : {baseline_roc_auc_pct:.2f}% -> {new_roc_auc_pct:.2f}%")
    print(f"Accuracy Score  : {baseline_acc_pct:.2f}% -> {new_acc_pct:.2f}%")
    print("=" * 70)


def main():
    parser = argparse.ArgumentParser(
        description="Retrain XGBoost Primary Classifier with Doctor-Confirmed Records."
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Run retraining and evaluation pipeline without saving model or updating metrics files."
    )
    parser.add_argument(
        "--min-records",
        type=int,
        default=MIN_NEW_RECORDS_FOR_RETRAIN,
        help=f"Minimum new confirmed records required to trigger retraining (default: {MIN_NEW_RECORDS_FOR_RETRAIN})."
    )
    parser.add_argument(
        "--force",
        action="store_true",
        help="Force execution even if new confirmed records count is below --min-records."
    )
    parser.add_argument(
        "--no-promote",
        action="store_true",
        help="Save new versioned model artifact without promoting it to live best_model.pkl."
    )

    args = parser.parse_args()
    run_retraining_pipeline(
        dry_run=args.dry_run,
        min_records=args.min_records,
        force=args.force,
        auto_promote=not args.no_promote
    )


if __name__ == "__main__":
    main()
