"""
scheduler.py

Background scheduler using APScheduler to periodically check for new doctor-confirmed
screening records and trigger model retraining & automatic promotion when threshold is met.

Can be safely disabled for local development via environment variable:
    ENABLE_AUTO_RETRAIN=false (default: false)
    RETRAIN_THRESHOLD=1000 (default: 1000)
"""

import os
import logging
from datetime import datetime
from apscheduler.schedulers.background import BackgroundScheduler
from sqlalchemy import desc

from app.database import SessionLocal
from app.models_db import ScreeningRecord, RetrainLog

logger = logging.getLogger(__name__)

# Global scheduler instance
scheduler = None


def check_and_trigger_retrain():
    """
    Background job function executed by APScheduler.
    Queries the database for new confirmed records since the last successful retrain.
    If count meets or exceeds RETRAIN_THRESHOLD, invokes retrain_xgboost pipeline.
    """
    enable_auto = os.getenv("ENABLE_AUTO_RETRAIN", "false").lower() in ("true", "1", "yes")
    if not enable_auto:
        logger.info("[Scheduler] Auto-retraining is disabled (ENABLE_AUTO_RETRAIN=false). Skipping check.")
        return

    threshold = int(os.getenv("RETRAIN_THRESHOLD", "1000"))

    db = SessionLocal()
    try:
        # Find last promoted retraining log entry
        last_promoted = db.query(RetrainLog).filter(RetrainLog.status == "promoted").order_by(desc(RetrainLog.timestamp)).first()
        last_timestamp = last_promoted.timestamp if last_promoted else datetime(2000, 1, 1)

        # Count new confirmed records created after last retrain timestamp
        new_records_query = db.query(ScreeningRecord).filter(
            ScreeningRecord.doctor_confirmed_label.isnot(None),
            ScreeningRecord.created_at > last_timestamp
        )
        new_records_count = new_records_query.count()

        logger.info(f"[Scheduler] Found {new_records_count} new confirmed records since last retrain (Threshold: {threshold}).")

        if new_records_count >= threshold:
            logger.info(f"[Scheduler] Threshold met ({new_records_count} >= {threshold}). Triggering automated retraining pipeline...")
            from scripts.retrain_xgboost import run_retraining_pipeline
            run_retraining_pipeline(dry_run=False, min_records=threshold, force=True, auto_promote=True)
            
            # Reload models live in FastAPI app
            from app.main import load_models
            load_models()
            logger.info("[Scheduler] Automated retraining & live model reload completed successfully.")
        else:
            logger.info("[Scheduler] Record threshold not met. No retraining required.")

    except Exception as exc:
        logger.exception(f"[Scheduler] Error during scheduled retraining check: {exc}")
    finally:
        db.close()


def start_scheduler():
    """
    Initializes and starts the APScheduler background scheduler on FastAPI startup.
    Runs check_and_trigger_retrain once daily (or interval configured via RETRAIN_INTERVAL_HOURS).
    """
    global scheduler

    enable_auto = os.getenv("ENABLE_AUTO_RETRAIN", "false").lower() in ("true", "1", "yes")
    if not enable_auto:
        logger.info("[Scheduler] ENABLE_AUTO_RETRAIN=false (default). Background retraining scheduler will NOT run.")
        return

    if scheduler is not None and scheduler.running:
        logger.info("[Scheduler] Scheduler is already running.")
        return

    interval_hours = int(os.getenv("RETRAIN_INTERVAL_HOURS", "24"))
    scheduler = BackgroundScheduler()
    scheduler.add_job(
        check_and_trigger_retrain,
        trigger="interval",
        hours=interval_hours,
        id="auto_retrain_job",
        replace_existing=True
    )
    scheduler.start()
    logger.info(f"[Scheduler] APScheduler background job started. Checking every {interval_hours} hours.")


def stop_scheduler():
    """
    Stops the APScheduler background scheduler gracefully on FastAPI shutdown.
    """
    global scheduler
    if scheduler is not None and scheduler.running:
        scheduler.shutdown(wait=False)
        logger.info("[Scheduler] Background scheduler shut down successfully.")
