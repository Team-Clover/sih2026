import joblib
import pandas as pd


# Load trained model
model = joblib.load("../model/landslide_model.joblib")


def predict_risk(
    rainfall_24h,
    rainfall_7d,
    soil_moisture,
    slope,
    elevation,
    historical_landslides
):

    data = pd.DataFrame([{
        "rainfall_24h": rainfall_24h,
        "rainfall_7d": rainfall_7d,
        "soil_moisture": soil_moisture,
        "slope": slope,
        "elevation": elevation,
        "historical_landslides": historical_landslides
    }])

    probability = model.predict_proba(data)[0][1]

    risk_percentage = probability * 100

    if risk_percentage < 30:
        risk_level = "LOW"

    elif risk_percentage < 60:
        risk_level = "MODERATE"

    elif risk_percentage < 80:
        risk_level = "HIGH"

    else:
        risk_level = "CRITICAL"

    return {
        "risk_probability": round(risk_percentage, 2),
        "risk_level": risk_level
    }