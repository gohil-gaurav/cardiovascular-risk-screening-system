"""
database.py

SQLAlchemy database setup for the cardiovascular risk screening system.
Reads connection string from DATABASE_URL env var, falling back to local SQLite database.
"""

import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# Read DATABASE_URL from environment variable (Render managed PostgreSQL)
# Fallback to local SQLite file for development
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    DATABASE_URL = "sqlite:///./dev_screenings.db"

# SQLite requires check_same_thread=False for multi-threaded FastAPI access
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    """
    FastAPI dependency function that provides a database session to routes and closes it afterwards.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
