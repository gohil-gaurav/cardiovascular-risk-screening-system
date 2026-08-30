"""
records.py

Doctor/Clinician-Only Patient Records Management API endpoints.
Provides paginated browsing of historical screening records, detailed inspection,
outcome confirmation ("Disease" / "No Disease"), and intake correction capabilities.

SECURITY NOTE:
In a production deployment, these endpoints MUST be protected by authentication
and Role-Based Access Control (RBAC, e.g. JWT with clinician role) to restrict access
to Protected Health Information (PHI).
"""

import math
import logging
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel, Field
from sqlalchemy import desc
from sqlalchemy.orm import Session

from app.database import get_db
from app.models_db import ScreeningRecord

logger = logging.getLogger(__name__)
router = APIRouter()


class UpdateRecordRequest(BaseModel):
    """
    Schema for clinician edits to patient intake metrics and outcome confirmation.
    All fields are optional to allow partial updates.
    """
    age: Optional[float] = Field(None, ge=1, le=120, description="Age in years")
    gender: Optional[int] = Field(None, ge=1, le=2, description="Biological sex (1: male, 2: female)")
    height: Optional[float] = Field(None, ge=50, le=250, description="Height in cm")
    weight: Optional[float] = Field(None, ge=10, le=300, description="Weight in kg")
    ap_hi: Optional[int] = Field(None, ge=50, le=300, description="Systolic blood pressure (mmHg)")
    ap_lo: Optional[int] = Field(None, ge=30, le=200, description="Diastolic blood pressure (mmHg)")
    cholesterol: Optional[int] = Field(None, ge=1, le=3, description="Cholesterol level (1: normal, 2: above normal, 3: well above normal)")
    gluc: Optional[int] = Field(None, ge=1, le=3, description="Glucose level (1: normal, 2: above normal, 3: well above normal)")
    smoke: Optional[int] = Field(None, ge=0, le=1, description="Smoking status (0: no, 1: yes)")
    alco: Optional[int] = Field(None, ge=0, le=1, description="Alcohol intake (0: no, 1: yes)")
    active: Optional[int] = Field(None, ge=0, le=1, description="Physical activity (0: no, 1: yes)")
    doctor_confirmed_label: Optional[str] = Field(None, description="Clinician confirmed diagnosis ('Disease' or 'No Disease')")


def serialize_record(r: ScreeningRecord) -> dict:
    """Helper function to serialize a ScreeningRecord ORM instance to a clean dictionary."""
    return {
        "id": r.id,
        "created_at": r.created_at.isoformat() if r.created_at else None,
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
        "bmi": round(r.bmi, 2) if r.bmi else None,
        "predicted_risk_score": r.predicted_risk_score,
        "predicted_label": r.predicted_label,
        "model_version": r.model_version,
        "doctor_confirmed_label": r.doctor_confirmed_label,
        "confirmed_at": r.confirmed_at.isoformat() if r.confirmed_at else None,
    }


@router.get("/records")
def list_screening_records(
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Items per page"),
    confirmed: Optional[bool] = Query(None, description="Filter by confirmation status: true for confirmed, false for unconfirmed review queue"),
    db: Session = Depends(get_db)
):
    """
    [DOCTOR/CLINICIAN ONLY]
    Returns a paginated list of patient screening records, most recent first.
    Allows filtering by confirmation status (?confirmed=false for pending review queue).
    """
    query = db.query(ScreeningRecord)

    if confirmed is True:
        query = query.filter(ScreeningRecord.doctor_confirmed_label.isnot(None))
    elif confirmed is False:
        query = query.filter(ScreeningRecord.doctor_confirmed_label.is_(None))

    total = query.count()
    pages = math.ceil(total / limit) if total > 0 else 1

    records = query.order_by(desc(ScreeningRecord.created_at)).offset((page - 1) * limit).limit(limit).all()

    return {
        "status": "success",
        "total": total,
        "page": page,
        "limit": limit,
        "pages": pages,
        "records": [serialize_record(r) for r in records]
    }


@router.get("/records/{record_id}")
def get_screening_record(record_id: int, db: Session = Depends(get_db)):
    """
    [DOCTOR/CLINICIAN ONLY]
    Retrieves full details for a single screening record by ID.
    Returns 404 if record does not exist.
    """
    record = db.query(ScreeningRecord).filter(ScreeningRecord.id == record_id).first()
    if not record:
        raise HTTPException(
            status_code=404,
            detail=f"Screening record with ID {record_id} not found."
        )

    return {
        "status": "success",
        "record": serialize_record(record)
    }


@router.patch("/records/{record_id}")
def update_screening_record(
    record_id: int,
    payload: UpdateRecordRequest,
    db: Session = Depends(get_db)
):
    """
    [DOCTOR/CLINICIAN ONLY]
    Allows a doctor to correct mistyped patient intake metrics (e.g., blood pressure, weight)
    and/or confirm the actual diagnosis label ('Disease' or 'No Disease').

    IMPORTANT DESIGN PRINCIPLE:
    Editing patient details after the fact does NOT retroactively alter predicted_risk_score
    or predicted_label. Those fields represent the historical output of the model at the
    exact time of screening, which is essential for evaluating model accuracy honestly.
    """
    record = db.query(ScreeningRecord).filter(ScreeningRecord.id == record_id).first()
    if not record:
        raise HTTPException(
            status_code=404,
            detail=f"Screening record with ID {record_id} not found."
        )

    update_dict = payload.model_dump(exclude_unset=True)

    # Validate doctor_confirmed_label if provided
    if "doctor_confirmed_label" in update_dict and update_dict["doctor_confirmed_label"] is not None:
        val = update_dict["doctor_confirmed_label"]
        if val not in ["Disease", "No Disease"]:
            raise HTTPException(
                status_code=400,
                detail="Invalid doctor_confirmed_label. Must be 'Disease' or 'No Disease'."
            )
        record.doctor_confirmed_label = val
        record.confirmed_at = datetime.utcnow()

    # Update patient features if provided
    patient_fields = ["age", "gender", "height", "weight", "ap_hi", "ap_lo", "cholesterol", "gluc", "smoke", "alco", "active"]
    height_or_weight_changed = False

    for field in patient_fields:
        if field in update_dict and update_dict[field] is not None:
            setattr(record, field, update_dict[field])
            if field in ["height", "weight"]:
                height_or_weight_changed = True

    # Recompute BMI if height or weight were modified
    if height_or_weight_changed and record.height and record.height > 0:
        height_m = record.height / 100.0
        record.bmi = round(record.weight / (height_m ** 2), 2)

    db.commit()
    db.refresh(record)

    logger.info(f"Screening record {record_id} updated by clinician. Confirmed label: {record.doctor_confirmed_label}")

    return {
        "status": "success",
        "message": "Screening record updated successfully.",
        "record": serialize_record(record)
    }


@router.delete("/records/{record_id}")
def delete_screening_record(record_id: int, db: Session = Depends(get_db)):
    """
    [DOCTOR/CLINICIAN ONLY]
    Permanently deletes a patient screening record from the database.

    SECURITY NOTE: In production, this endpoint must be protected by RBAC
    and require explicit clinician authentication before allowing deletion.
    """
    record = db.query(ScreeningRecord).filter(ScreeningRecord.id == record_id).first()
    if not record:
        raise HTTPException(
            status_code=404,
            detail=f"Screening record with ID {record_id} not found."
        )

    db.delete(record)
    db.commit()

    logger.info(f"Screening record {record_id} permanently deleted by clinician.")

    return {
        "status": "success",
        "message": f"Screening record #{record_id} has been permanently deleted."
    }


class BulkDeleteRequest(BaseModel):
    """Schema for bulk deletion of multiple screening records."""
    ids: list[int] = Field(..., min_length=1, description="List of record IDs to permanently delete")


@router.post("/records/bulk-delete")
def bulk_delete_screening_records(payload: BulkDeleteRequest, db: Session = Depends(get_db)):
    """
    [DOCTOR/CLINICIAN ONLY]
    Permanently deletes multiple patient screening records in a single transaction.

    Returns a summary of how many records were deleted and any IDs that were not found.
    """
    requested_ids = list(set(payload.ids))  # deduplicate

    records = db.query(ScreeningRecord).filter(ScreeningRecord.id.in_(requested_ids)).all()
    found_ids = {r.id for r in records}
    not_found_ids = [i for i in requested_ids if i not in found_ids]

    for record in records:
        db.delete(record)

    db.commit()

    logger.info(
        f"Bulk delete: {len(found_ids)} screening records deleted by clinician. "
        f"IDs: {sorted(found_ids)}. Not found: {not_found_ids}"
    )

    return {
        "status": "success",
        "deleted_count": len(found_ids),
        "deleted_ids": sorted(found_ids),
        "not_found_ids": not_found_ids,
        "message": f"{len(found_ids)} screening record(s) permanently deleted."
    }

