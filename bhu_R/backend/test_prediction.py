import joblib
import pandas as pd
from pathlib import Path


# ============================================================
# LOAD MODEL
# ============================================================

BASE_DIR = Path(__file__).resolve().parent.parent

MODEL_FILE = (
    BASE_DIR / "model" / "landslide_model_v2.joblib"
)

print("Loading model...")
pipeline = joblib.load(MODEL_FILE)

print("Model loaded successfully.")


# ============================================================
# TEST INPUT
# ============================================================

data = pd.DataFrame([
    {
        "state": "ASSAM",
        "year": 2020,
        "month": 6,
        "rainfall": 390.0,
        "rainfall_anomaly": 120.0,
        "rainfall_anomaly_pct": 45.0,
        "temperature": 27.5
    }
])


# ============================================================
# PREDICTION
# ============================================================

prediction = pipeline.predict(data)[0]

probability = pipeline.predict_proba(data)[0]

classes = pipeline.classes_

class_probabilities = dict(
    zip(classes, probability)
)

landslide_probability = (
    class_probabilities.get(1, 0) * 100
)


# ============================================================
# RESULT
# ============================================================

print()
print("=" * 60)
print("LANDSLIDE PREDICTION")
print("=" * 60)

print(
    f"State: {data.iloc[0]['state']}"
)

print(
    f"Rainfall: {data.iloc[0]['rainfall']} mm"
)

print(
    f"Temperature: {data.iloc[0]['temperature']} °C"
)

print(
    f"Prediction: {prediction}"
)

print(
    f"Landslide probability: "
    f"{landslide_probability:.2f}%"
)

if landslide_probability < 30:

    risk = "LOW"

elif landslide_probability < 60:

    risk = "MODERATE"

elif landslide_probability < 80:

    risk = "HIGH"

else:

    risk = "VERY HIGH"


print(
    f"Risk level: {risk}"
)

print("=" * 60)