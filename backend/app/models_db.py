"""
models_db.py

SQLAlchemy database models for screening records and outcome confirmation.
Named models_db.py to avoid collision with backend/models folder containing .pkl/.pt files.
"""

from datetime import datetime
from sqlalchemy import Column, Integer, Float, String, DateTime
from app.database import Base


class ScreeningRecord(Base):
    """
    SQLAlchemy table storing input data, computed BMI, predictions, model version,
    and eventual doctor-confirmed outcome labels for future retraining pipelines.
    """
    __tablename__ = "screening_records"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Patient features matching PatientData input schema exactly
    age = Column(Float, nullable=False)
    gender = Column(Integer, nullable=False)
    height = Column(Float, nullable=False)
    weight = Column(Float, nullable=False)
    ap_hi = Column(Integer, nullable=False)
    ap_lo = Column(Integer, nullable=False)
    cholesterol = Column(Integer, nullable=False)
    gluc = Column(Integer, nullable=False)
    smoke = Column(Integer, nullable=False)
    alco = Column(Integer, nullable=False)
    active = Column(Integer, nullable=False)
    bmi = Column(Float, nullable=False)

    # Prediction outputs
    predicted_risk_score = Column(Float, nullable=False)
    predicted_label = Column(String, nullable=False)
    model_version = Column(String, default="v1", nullable=False)

    # Doctor confirmation fields for future model retraining
    doctor_confirmed_label = Column(String, nullable=True, default=None)
    confirmed_at = Column(DateTime, nullable=True, default=None)


class RetrainLog(Base):
    """
    SQLAlchemy table tracking model retraining history, timestamps, records used,
    evaluation metrics, and promotion/rejection/rollback status.
    """
    __tablename__ = "retrain_logs"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)
    version = Column(String, nullable=False)
    records_used = Column(Integer, nullable=False)
    new_records_added = Column(Integer, nullable=False)
    status = Column(String, nullable=False)  # "promoted" | "rejected" | "aborted" | "rolled_back"
    roc_auc = Column(Float, nullable=True)
    accuracy = Column(Float, nullable=True)
    details = Column(String, nullable=True)

