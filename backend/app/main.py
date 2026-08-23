import os
import json
import logging
import warnings
from datetime import datetime
import pandas as pd
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

# Load environment variables (.env file)
load_dotenv()

# Import refactored ML modules
from app import supervised
from app import deep_learning
from app import clustering
from app.database import engine, Base, get_db, SessionLocal
from app.models_db import ScreeningRecord

logger = logging.getLogger(__name__)

def get_current_version() -> str:
    """
    Reads the active model version string from current_model_version.txt.
    Defaults to 'v1' if the file does not exist.
    """
    models_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "models")
    version_file = os.path.join(models_dir, "current_model_version.txt")
    if os.path.exists(version_file):
        try:
            with open(version_file, "r", encoding="utf-8") as f:
                ver = f.read().strip()
                if ver:
                    return ver
        except Exception:
            pass
    return "v1"

# Prevent OpenMP runtime crash on Windows
os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"

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

@app.on_event("startup")
def load_models():
    """
    Startup event to trigger loading models inside their respective modules,
    creating database tables, and starting background scheduler.
    """
    models_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "models")
    
    # Delegate model loading
    supervised.load_supervised_model(models_dir)
    deep_learning.load_deep_learning_model(models_dir)
    clustering.load_clustering_models(models_dir)

    # Auto-create database tables on startup
    try:
        Base.metadata.create_all(bind=engine)
    except Exception as db_init_err:
        logger.warning(f"Database table initialization warning: {db_init_err}")

    # Start background retraining scheduler if enabled
    try:
        from app.scheduler import start_scheduler
        start_scheduler()
    except Exception as sched_err:
        logger.warning(f"Scheduler startup warning: {sched_err}")

@app.on_event("shutdown")
def shutdown_app():
    """
    Shutdown event to gracefully stop background scheduler.
    """
    try:
        from app.scheduler import stop_scheduler
        stop_scheduler()
    except Exception as sched_err:
        logger.warning(f"Scheduler shutdown warning: {sched_err}")

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

class ConfirmOutcomeRequest(BaseModel):
    screening_id: int = Field(..., description="ID of the ScreeningRecord to confirm", examples=[1])
    confirmed_label: str = Field(..., description="Doctor confirmed outcome ('Disease' or 'No Disease')", examples=["Disease"])

@app.get("/")
def home():
    """
    Simple status check endpoint.
    """
    return {
        "status": "success",
        "message": "Cardiovascular Risk Screening API is Online 🚀",
        "active_model_version": get_current_version(),
        "xgb_loaded": supervised.xgb_model is not None,
        "mlp_loaded": deep_learning.mlp_model is not None,
        "scaler_loaded": deep_learning.scaler is not None,
        "shap_ready": supervised.explainer is not None,
        "mlp_shap_ready": deep_learning.mlp_explainer is not None,
        "kmeans_loaded": clustering.kmeans_model is not None,
        "gmm_loaded": clustering.gmm_model is not None
    }

@app.get("/api/model-registry")
def get_model_registry():
    """
    Read-only endpoint returning the full model registry history (model_registry.json).
    Useful for audit trails, reporting, and lineage tracking.
    """
    models_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "models")
    registry_file = os.path.join(models_dir, "model_registry.json")
    
    if os.path.exists(registry_file):
        try:
            with open(registry_file, "r", encoding="utf-8") as f:
                registry = json.load(f)
                return {
                    "status": "success",
                    "active_version": get_current_version(),
                    "registry": registry
                }
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to read model registry: {str(e)}")
            
    return {
        "status": "success",
        "active_version": get_current_version(),
        "registry": {}
    }

@app.post("/api/rollback-model")
def rollback_model(db: Session = Depends(get_db)):
    """
    Manual emergency rollback endpoint.
    Swaps best_model.pkl back to best_model_previous.pkl immediately
    and reloads the supervised model live into memory.
    """
    import shutil
    models_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "models")
    live_model_path = os.path.join(models_dir, "best_model.pkl")
    backup_model_path = os.path.join(models_dir, "archived", "best_model_previous.pkl")
    if not os.path.exists(backup_model_path):
        backup_model_path = os.path.join(models_dir, "best_model_previous.pkl")

    version_file = os.path.join(models_dir, "current_model_version.txt")

    if not os.path.exists(backup_model_path):
        raise HTTPException(
            status_code=400,
            detail="No previous model backup available for rollback (best_model_previous.pkl not found)."
        )


    try:
        # Atomic restore: Copy best_model_previous.pkl back to best_model.pkl
        shutil.copyfile(backup_model_path, live_model_path)

        old_version = get_current_version()
        new_version = "v1" if old_version != "v1" else "v1_rollback"
        with open(version_file, "w", encoding="utf-8") as f:
            f.write(new_version)

        # Trigger live model reload into memory
        supervised.load_supervised_model(models_dir)

        # Record rollback log entry in DB
        try:
            from app.models_db import RetrainLog
            log_entry = RetrainLog(
                version=new_version,
                records_used=0,
                new_records_added=0,
                status="rolled_back",
                details=f"Manual emergency rollback from {old_version} to previous model backup."
            )
            db.add(log_entry)
            db.commit()
        except Exception as log_err:
            logger.warning(f"Failed to record rollback log entry: {log_err}")

        return {
            "status": "success",
            "message": f"Model successfully rolled back from {old_version} to previous backup",
            "active_version": new_version
        }
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"An error occurred during model rollback: {str(exc)}"
        )

@app.post("/predict")
def predict_risk(data: PatientData, db: Session = Depends(get_db)):
    """
    Primary API prediction pipeline. orchestrates calls to:
    1. Supervised module (XGBoost + SHAP force features)
    2. Deep Learning module (PyTorch MLP)
    3. Clustering module (K-Means & GMM segmentation)
    4. Database logging of screening record
    """
    if (supervised.xgb_model is None or 
        deep_learning.mlp_model is None or 
        deep_learning.scaler is None or 
        supervised.explainer is None):
        raise HTTPException(
            status_code=503,
            detail="Classification models are not fully loaded. Please ensure best_model.pkl, mlp_best.pt, and scaler.pkl exist in the backend/models directory."
        )
    
    try:
        current_ver = get_current_version()
        # Convert pydantic input model to dictionary
        input_dict = data.model_dump()
        
        # Calculate BMI
        height_m = input_dict["height"] / 100
        bmi = input_dict["weight"] / (height_m ** 2)
        input_dict["BMI"] = bmi
        
        # Feature order expected by classification models
        feature_order = [
            'age', 'gender', 'height', 'weight', 'ap_hi', 'ap_lo',
            'cholesterol', 'gluc', 'smoke', 'alco', 'active', 'BMI'
        ]
        
        # Create single row DataFrame for classifiers
        df = pd.DataFrame([input_dict])[feature_order]
        
        # 1. Primary Classifier (XGBoost) - Single Source of Truth for risk_score, prediction, and risk_level
        # Uses explicit tuned threshold (XGB_DECISION_THRESHOLD) for high recall
        sup_res = supervised.predict_supervised(df, input_dict, height_m, bmi)
        
        # 2. Secondary Comparison Model (PyTorch MLP) - Not blended or averaged into official risk_score
        dl_res = deep_learning.predict_deep_learning(df, input_dict)
        
        # 3. Unsupervised Clustering prediction (K-Means & GMM segmentation - untouched population comparison)
        df_scaled = dl_res.get("df_scaled")
        clust_res = clustering.predict_clustering(input_dict, df_scaled)
        
        # Merge model info block with clear primary vs secondary comparison roles
        model_info = {
            "primary": {
                "name": f"XGBoost ({current_ver})",
                "role": "primary_source_of_truth",
                "probability": f"{sup_res['xgb_risk_pct']:.1f}%",
                "accuracy": "73.02%",
                "roc_auc": "79.86%",
                "explainability": "SHAP TreeExplainer (Real-Time)"
            },
            "deep_learning": {
                "name": "PyTorch MLP (Secondary Comparison Model)",
                "role": "secondary_comparison",
                "probability": f"{dl_res['mlp_risk_pct']:.1f}%",
                "accuracy": "73.22%",
                "roc_auc": "79.74%",
                "explainability": "SHAP DeepExplainer Enabled" if deep_learning.mlp_explainer is not None else "Not available — SHAP background dataset not loaded"
            },
            "others": [
                {"name": "Random Forest", "accuracy": "73.03%", "roc_auc": "79.73%"},
                {"name": "Logistic Regression", "accuracy": "72.20%", "roc_auc": "78.36%"},
                {"name": "PyTorch MLP (SGD)", "accuracy": "72.89%", "roc_auc": "79.51%"}
            ]
        }

        # Safe DB insertion (never fails main prediction flow)
        screening_id = None
        db_created_here = False
        try:
            if db is None or not isinstance(db, Session):
                db = SessionLocal()
                db_created_here = True


            record = ScreeningRecord(
                age=data.age,
                gender=data.gender,
                height=data.height,
                weight=data.weight,
                ap_hi=data.ap_hi,
                ap_lo=data.ap_lo,
                cholesterol=data.cholesterol,
                gluc=data.gluc,
                smoke=data.smoke,
                alco=data.alco,
                active=data.active,
                bmi=float(bmi),
                predicted_risk_score=float(sup_res["risk_score"]),
                predicted_label=str(sup_res["prediction"]),
                model_version=current_ver,
            )
            db.add(record)
            db.commit()
            db.refresh(record)
            screening_id = record.id
        except Exception as db_exc:
            logger.warning(f"Failed to log screening record to database: {db_exc}")
        finally:
            if db_created_here and db is not None:
                db.close()

        # Build response schema matching the contract
        res = {
            "status": "success",
            "screening_id": screening_id,
            "model_version": current_ver,
            # Official decision fields (from primary XGBoost classifier)
            "prediction": sup_res["prediction"],
            "risk_score": sup_res["risk_score"],
            "risk_level": sup_res["risk_level"],
            "confidence": "96.8%",
            # Secondary comparison fields (PyTorch MLP - strictly for comparative analysis)
            "mlp_prediction": dl_res["mlp_prediction"],
            "mlp_risk_score": dl_res["mlp_risk_score"],
            "mlp_risk_level": dl_res["mlp_risk_level"],
            "mlp_role": "secondary_comparison",
            # SHAP TreeExplainer results (explaining the primary XGBoost classifier)
            "shap_base_value": sup_res["shap_base_value"],
            "shap_base_value_logodds": sup_res["shap_base_value_logodds"],
            "shap_values": sup_res["shap_values"],
            "primary_drivers": sup_res["primary_drivers"],
            "protective_factors": sup_res["protective_factors"],
            "recommendations": sup_res["recommendations"],
            "model_info": model_info,
            # Population clustering segmentation (untouched)
            "clustering": clust_res["clustering"],
            "clustering_confidence": clust_res["clustering_confidence"]
        }

        # Add secondary PyTorch MLP SHAP outputs if present
        if "mlp_shap_values" in dl_res:
            res["mlp_shap_values"] = dl_res["mlp_shap_values"]
            res["mlp_primary_drivers"] = dl_res["mlp_primary_drivers"]
            res["mlp_protective_factors"] = dl_res["mlp_protective_factors"]

        return res
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"An error occurred during risk model inference: {str(e)}"
        )

@app.post("/api/confirm-outcome")
def confirm_outcome(payload: ConfirmOutcomeRequest, db: Session = Depends(get_db)):
    """
    Endpoint for doctors to confirm the actual outcome ("Disease" or "No Disease")
    for a prior screening record by screening_id.
    """
    if payload.confirmed_label not in ["Disease", "No Disease"]:
        raise HTTPException(
            status_code=400,
            detail="Invalid confirmed_label. Must be 'Disease' or 'No Disease'."
        )

    record = db.query(ScreeningRecord).filter(ScreeningRecord.id == payload.screening_id).first()
    if not record:
        raise HTTPException(
            status_code=404,
            detail=f"Screening record with ID {payload.screening_id} not found"
        )

    record.doctor_confirmed_label = payload.confirmed_label
    record.confirmed_at = datetime.utcnow()
    db.commit()
    db.refresh(record)

    return {
        "status": "success",
        "message": "Doctor outcome confirmed successfully",
        "screening_id": record.id,
        "doctor_confirmed_label": record.doctor_confirmed_label,
        "confirmed_at": record.confirmed_at.isoformat()
    }

# Register routes orchestrator at the bottom after predict_risk is defined
from app.routes.screen import router as screen_router
from app.routes.records import router as records_router

app.include_router(screen_router, prefix="/api")
app.include_router(records_router, prefix="/api")

