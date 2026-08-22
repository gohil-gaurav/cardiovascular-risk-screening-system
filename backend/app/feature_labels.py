"""
feature_labels.py

Shared value-decoding dictionaries mapping raw encoded numeric values 
to human-readable string labels across the cardiovascular risk screening system.
"""

SMOKE_LABELS = {0: "Non-smoker", 1: "Active smoker"}
ALCOHOL_LABELS = {0: "Does not drink alcohol", 1: "Drinks alcohol"}
ACTIVITY_LABELS = {0: "Not physically active", 1: "Physically active"}
CHOLESTEROL_LABELS = {1: "Normal", 2: "Above normal", 3: "Well above normal"}
GLUCOSE_LABELS = {1: "Normal", 2: "Above normal", 3: "Well above normal"}
GENDER_LABELS = {1: "Male", 2: "Female"}
