from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import pandas as pd
import joblib
from pathlib import Path
import traceback
import os

ENV_PATH = Path(__file__).resolve().parent / ".env"
if ENV_PATH.exists():
    for line in ENV_PATH.read_text(encoding="utf-8").splitlines():
        key, separator, value = line.partition("=")
        if separator and key.strip() and not key.lstrip().startswith("#"):
            os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))

try:
    from citizen_sync import publish_prediction
except ImportError:
    from backend.citizen_sync import publish_prediction


# ============================================================
# APP
# ============================================================

app = FastAPI(
    title="Landslide Risk Prediction API",
    description="AI-based landslide risk prediction for Northeast India",
    version="2.0"
)


# ============================================================
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# PATHS
# ============================================================

BASE_DIR = Path(__file__).resolve().parent.parent

MODEL_PATH = BASE_DIR / "model" / "landslide_model_v2.joblib"


# ============================================================
# LOAD MODEL
# ============================================================

model = None

try:
    model = joblib.load(MODEL_PATH)

    print("\n====================================")
    print("MODEL LOADED SUCCESSFULLY")
    print("====================================")
    print("Model:", type(model))
    print("Path:", MODEL_PATH)
    print("====================================\n")

except Exception as e:

    print("\n====================================")
    print("MODEL LOADING FAILED")
    print("====================================")
    print(e)
    traceback.print_exc()
    print("====================================\n")


# ============================================================
# REQUEST SCHEMA
# ============================================================

class PredictionRequest(BaseModel):

    state: str

    year: int = Field(..., ge=2016, le=2100)

    month: int = Field(..., ge=1, le=12)

    rainfall: float = Field(..., ge=0)

    rainfall_anomaly: float

    rainfall_anomaly_pct: float

    temperature: float

    # Optional metadata used by the citizen alert bridge. These fields are
    # deliberately excluded from the ML dataframe above.
    district: str | None = None
    slope: float | None = Field(default=None, ge=0, le=90)
    elevation: float | None = Field(default=None, ge=0)
    source_id: str | None = None


# ============================================================
# ROOT
# ============================================================

@app.get("/")
def root():

    return {
        "message": "Landslide Risk Prediction API",
        "status": "running",
        "model_loaded": model is not None
    }


# ============================================================
# HEALTH
# ============================================================

@app.get("/health")
def health():

    return {
        "status": "healthy",
        "model_loaded": model is not None
    }


# ============================================================
# PREDICT
# ============================================================

@app.post("/predict")
def predict(request: PredictionRequest):

    try:

        # ----------------------------------------------------
        # 1. Check model
        # ----------------------------------------------------

        if model is None:

            raise Exception(
                "Model was not loaded. Check model/landslide_model_v2.joblib"
            )


        # ----------------------------------------------------
        # 2. Valid states
        # ----------------------------------------------------

        valid_states = [
            "ARUNACHAL PRADESH",
            "ASSAM",
            "MEGHALAYA",
            "MANIPUR",
            "MIZORAM",
            "NAGALAND",
            "SIKKIM",
            "TRIPURA"
        ]


        state = request.state.strip().upper()


        if state not in valid_states:

            raise HTTPException(
                status_code=400,
                detail=f"Invalid state: {state}"
            )


        # ----------------------------------------------------
        # 3. Create DataFrame
        # ----------------------------------------------------

        input_data = pd.DataFrame({
            "state": [state],
            "year": [request.year],
            "month": [request.month],
            "rainfall": [request.rainfall],
            "rainfall_anomaly": [request.rainfall_anomaly],
            "rainfall_anomaly_pct": [request.rainfall_anomaly_pct],
            "temperature": [request.temperature]
        })


        print("\n====================================")
        print("INPUT DATA")
        print("====================================")
        print(input_data)
        print("\nColumns:")
        print(input_data.columns.tolist())
        print("====================================")


        # ----------------------------------------------------
        # 4. MODEL PREDICTION
        # ----------------------------------------------------

        print("\nRunning model.predict()...")

        prediction = model.predict(input_data)[0]

        print("Prediction:", prediction)


        # ----------------------------------------------------
        # 5. MODEL PROBABILITY
        # ----------------------------------------------------

        print("\nRunning model.predict_proba()...")

        probabilities = model.predict_proba(input_data)[0]

        print("Probabilities:", probabilities)


        # ----------------------------------------------------
        # 6. Landslide probability
        # ----------------------------------------------------

        # Your model is a binary classifier:
        # 0 = No landslide
        # 1 = Landslide
        #
        # Therefore probability at index 1 is the
        # landslide probability.

        model_classes = list(getattr(model, "classes_", []))
        positive_class_index = model_classes.index(1) if 1 in model_classes else None
        landslide_probability = (
            float(probabilities[positive_class_index])
            if positive_class_index is not None
            else 0.0
        )


        risk_percentage = round(
            landslide_probability * 100,
            2
        )

        slope_adjustment = 0
        elevation_adjustment = 0
        if request.slope is not None:
            slope_adjustment = 0 if request.slope < 15 else 2 if request.slope < 25 else 5 if request.slope < 35 else 8 if request.slope < 45 else 12
        if request.elevation is not None:
            elevation_adjustment = 0 if request.elevation < 500 else 1 if request.elevation < 1500 else 3 if request.elevation < 2500 else 4
        terrain_adjustment = slope_adjustment + elevation_adjustment
        final_percentage = round(min(100, max(0, risk_percentage + terrain_adjustment)), 2)


        # ----------------------------------------------------
        # 7. Risk level
        # ----------------------------------------------------

        if final_percentage < 30:

            risk_level = "LOW"

        elif final_percentage < 60:

            risk_level = "MODERATE"

        elif final_percentage < 80:

            risk_level = "HIGH"

        else:

            risk_level = "VERY HIGH"


        # ----------------------------------------------------
        # 8. Response
        # ----------------------------------------------------

        result = {
            "prediction": int(prediction),

            "landslide_probability": risk_percentage,

            "risk_level": risk_level,

            "terrain_adjustment": {
                "slope_adjustment": slope_adjustment,
                "elevation_adjustment": elevation_adjustment,
                "total_adjustment": terrain_adjustment,
                "final_probability": final_percentage,
            },

            "input": {
                "state": state,
                "year": request.year,
                "month": request.month,
                "rainfall": request.rainfall,
                "rainfall_anomaly": request.rainfall_anomaly,
                "rainfall_anomaly_pct": request.rainfall_anomaly_pct,
                "temperature": request.temperature
            }
        }

        if request.slope is not None and request.elevation is not None:
            result["citizen_sync"] = publish_prediction({
                "sourceId": request.source_id,
                "state": state,
                "district": request.district,
                "year": request.year,
                "month": request.month,
                "rainfall": request.rainfall,
                "rainfallAnomaly": request.rainfall_anomaly,
                "rainfallAnomalyPct": request.rainfall_anomaly_pct,
                "temperature": request.temperature,
                "slope": request.slope,
                "elevation": request.elevation,
                "aiProbability": risk_percentage,
                "slopeAdjustment": slope_adjustment,
                "elevationAdjustment": elevation_adjustment,
                "terrainAdjustment": terrain_adjustment,
                "finalProbability": final_percentage,
                "riskLevel": risk_level,
                "source": "admin",
            })


        print("\n====================================")
        print("SUCCESS")
        print("====================================")
        print(result)
        print("====================================\n")


        return result


    # ========================================================
    # HTTP ERRORS
    # ========================================================

    except HTTPException:

        raise


    # ========================================================
    # ANY OTHER ERROR
    # ========================================================

    except Exception as e:

        print("\n\n====================================")
        print("❌ PREDICTION ERROR")
        print("====================================")

        print("Error type:")
        print(type(e))

        print("\nError:")
        print(str(e))

        print("\nFull traceback:")
        traceback.print_exc()

        print("====================================\n")


        raise HTTPException(
            status_code=500,
            detail=f"Prediction failed: {type(e).__name__}: {str(e)}"
        )