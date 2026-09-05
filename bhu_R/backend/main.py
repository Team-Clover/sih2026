from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from predict import predict_risk


app = FastAPI(
    title="Landslide Risk Prediction API"
)


# --------------------------------
# CORS
# --------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --------------------------------
# Home
# --------------------------------

@app.get("/")
def home():

    return {
        "message": "Landslide Risk Prediction API is running"
    }


# --------------------------------
# Prediction endpoint
# --------------------------------

@app.post("/predict")
def prediction(data: dict):

    result = predict_risk(
        rainfall_24h=data["rainfall_24h"],
        rainfall_7d=data["rainfall_7d"],
        soil_moisture=data["soil_moisture"],
        slope=data["slope"],
        elevation=data["elevation"],
        historical_landslides=data["historical_landslides"]
    )

    return result