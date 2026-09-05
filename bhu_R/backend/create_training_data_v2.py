import pandas as pd
import numpy as np
from pathlib import Path


# ============================================================
# PATHS
# ============================================================

BASE_DIR = Path(__file__).resolve().parent.parent

RAW_DIR = BASE_DIR / "data" / "raw"
PROCESSED_DIR = BASE_DIR / "data" / "processed"

PROCESSED_DIR.mkdir(
    parents=True,
    exist_ok=True
)


# ============================================================
# FILES
# ============================================================

RAINFALL_FILE = (
    RAW_DIR / "rainfall_2016_2020.csv"
)

TEMPERATURE_FILE = (
    RAW_DIR / "temperature.csv"
)

LANDSLIDE_FILE = (
    PROCESSED_DIR / "ne_landslide_events.csv"
)

OUTPUT_FILE = (
    PROCESSED_DIR / "landslide_training_v2.csv"
)


# ============================================================
# NORTH EAST STATES
# ============================================================

NE_STATES = [
    "ARUNACHAL PRADESH",
    "ASSAM",
    "MEGHALAYA",
    "MANIPUR",
    "MIZORAM",
    "NAGALAND",
    "SIKKIM",
    "TRIPURA"
]


# ============================================================
# LOAD RAINFALL
# ============================================================

print()
print("=" * 70)
print("1. LOADING RAINFALL")
print("=" * 70)

rainfall = pd.read_csv(
    RAINFALL_FILE
)

print(
    "Rainfall shape:",
    rainfall.shape
)

print(
    "Rainfall columns:",
    rainfall.columns.tolist()
)


# ------------------------------------------------------------
# Clean rainfall
# ------------------------------------------------------------

rainfall["state"] = (
    rainfall["state"]
    .astype(str)
    .str.strip()
    .str.upper()
)

rainfall["year"] = pd.to_numeric(
    rainfall["year"],
    errors="coerce"
)

rainfall["month"] = pd.to_numeric(
    rainfall["month"],
    errors="coerce"
)

rainfall["rainfall"] = pd.to_numeric(
    rainfall["rainfall"],
    errors="coerce"
)

rainfall = rainfall.dropna(
    subset=[
        "state",
        "year",
        "month",
        "rainfall"
    ]
)

rainfall["year"] = rainfall[
    "year"
].astype(int)

rainfall["month"] = rainfall[
    "month"
].astype(int)


# Only North-East states
rainfall = rainfall[
    rainfall["state"].isin(NE_STATES)
].copy()


# ============================================================
# RAINFALL FEATURES
# ============================================================

print()
print("=" * 70)
print("2. CREATING RAINFALL FEATURES")
print("=" * 70)


# Historical average rainfall for each state/month
state_month_normal = (
    rainfall
    .groupby(
        ["state", "month"]
    )["rainfall"]
    .mean()
    .reset_index()
)

state_month_normal = (
    state_month_normal
    .rename(
        columns={
            "rainfall":
            "historical_monthly_rainfall"
        }
    )
)


rainfall = rainfall.merge(
    state_month_normal,
    on=["state", "month"],
    how="left"
)


# ------------------------------------------------------------
# Rainfall anomaly
# ------------------------------------------------------------

rainfall["rainfall_anomaly"] = (
    rainfall["rainfall"]
    -
    rainfall["historical_monthly_rainfall"]
)


# ------------------------------------------------------------
# Percentage anomaly
# ------------------------------------------------------------

rainfall["rainfall_anomaly_pct"] = np.where(
    rainfall["historical_monthly_rainfall"] > 0,

    (
        rainfall["rainfall_anomaly"]
        /
        rainfall["historical_monthly_rainfall"]
    ) * 100,

    0
)


# ============================================================
# LOAD TEMPERATURE
# ============================================================

print()
print("=" * 70)
print("3. LOADING TEMPERATURE")
print("=" * 70)

temperature = pd.read_csv(
    TEMPERATURE_FILE
)

print(
    "Temperature shape:",
    temperature.shape
)

print(
    "Temperature columns:",
    temperature.columns.tolist()
)


# ------------------------------------------------------------
# Rename first column to state
# ------------------------------------------------------------

temperature = temperature.rename(
    columns={
        temperature.columns[0]: "state"
    }
)


temperature["state"] = (
    temperature["state"]
    .astype(str)
    .str.strip()
    .str.upper()
)


temperature = temperature[
    temperature["state"].isin(NE_STATES)
].copy()


# ============================================================
# CONVERT TEMPERATURE TO LONG FORMAT
# ============================================================

print()
print("=" * 70)
print("4. PROCESSING TEMPERATURE")
print("=" * 70)


month_mapping = {
    "Jan": 1,
    "Feb": 2,
    "Mar": 3,
    "Apr": 4,
    "May": 5,
    "June": 6,
    "Jul": 7,
    "July": 7,
    "Aug": 8,
    "Sep": 9,
    "Oct": 10,
    "Nov": 11,
    "Dec": 12
}


temperature_rows = []


for _, row in temperature.iterrows():

    state = row["state"]

    for column, month in month_mapping.items():

        if column not in temperature.columns:
            continue

        value = pd.to_numeric(
            row[column],
            errors="coerce"
        )

        if pd.notna(value):

            temperature_rows.append(
                {
                    "state": state,
                    "month": month,
                    "temperature": float(value)
                }
            )


temperature_long = pd.DataFrame(
    temperature_rows
)


print(
    "Temperature processed:",
    temperature_long.shape
)


# ============================================================
# LOAD LANDSLIDE EVENTS
# ============================================================

print()
print("=" * 70)
print("5. LOADING REAL LANDSLIDE EVENTS")
print("=" * 70)


landslides = pd.read_csv(
    LANDSLIDE_FILE
)

print(
    "Landslide shape:",
    landslides.shape
)

print(
    "Landslide columns:",
    landslides.columns.tolist()
)

print()
print(
    landslides.head(10).to_string(
        index=False
    )
)


# ============================================================
# CLEAN LANDSLIDE EVENTS
# ============================================================

landslides["state"] = (
    landslides["state"]
    .astype(str)
    .str.strip()
    .str.upper()
)

landslides["year"] = pd.to_numeric(
    landslides["year"],
    errors="coerce"
)

landslides["month"] = pd.to_numeric(
    landslides["month"],
    errors="coerce"
)


landslides = landslides.dropna(
    subset=[
        "state",
        "year",
        "month"
    ]
)


landslides["year"] = landslides[
    "year"
].astype(int)

landslides["month"] = landslides[
    "month"
].astype(int)


# Keep only NE states
landslides = landslides[
    landslides["state"].isin(NE_STATES)
].copy()


# ============================================================
# CREATE LANDSLIDE LABELS
# ============================================================

print()
print("=" * 70)
print("6. CREATING LANDSLIDE LABELS")
print("=" * 70)


# Every state/year/month containing an actual
# documented landslide becomes 1.

landslide_labels = (
    landslides[
        [
            "state",
            "year",
            "month"
        ]
    ]
    .drop_duplicates()
    .copy()
)

landslide_labels["landslide"] = 1


print(
    "Actual event months:",
    len(landslide_labels)
)


# ============================================================
# MERGE EVERYTHING
# ============================================================

print()
print("=" * 70)
print("7. MERGING DATASETS")
print("=" * 70)


dataset = rainfall.merge(
    temperature_long,
    on=[
        "state",
        "month"
    ],
    how="left"
)


dataset = dataset.merge(
    landslide_labels,
    on=[
        "state",
        "year",
        "month"
    ],
    how="left"
)


# Months without documented landslides = 0
dataset["landslide"] = (
    dataset["landslide"]
    .fillna(0)
    .astype(int)
)


# ============================================================
# REMOVE UNNECESSARY COLUMN
# ============================================================

dataset = dataset[
    [
        "state",
        "year",
        "month",
        "rainfall",
        "rainfall_anomaly",
        "rainfall_anomaly_pct",
        "temperature",
        "landslide"
    ]
].copy()


# ============================================================
# FINAL CLEANING
# ============================================================

dataset["rainfall"] = pd.to_numeric(
    dataset["rainfall"],
    errors="coerce"
)

dataset["rainfall_anomaly"] = pd.to_numeric(
    dataset["rainfall_anomaly"],
    errors="coerce"
)

dataset["rainfall_anomaly_pct"] = pd.to_numeric(
    dataset["rainfall_anomaly_pct"],
    errors="coerce"
)

dataset["temperature"] = pd.to_numeric(
    dataset["temperature"],
    errors="coerce"
)


# Remove rows with missing environmental data

dataset = dataset.dropna(
    subset=[
        "rainfall",
        "temperature"
    ]
)


# ============================================================
# SAVE
# ============================================================

dataset.to_csv(
    OUTPUT_FILE,
    index=False
)


# ============================================================
# REPORT
# ============================================================

print()
print("=" * 70)
print("TRAINING DATA CREATED")
print("=" * 70)

print()
print("Output:")
print(OUTPUT_FILE)

print()
print("Shape:")
print(dataset.shape)

print()
print("Target distribution:")
print(
    dataset["landslide"]
    .value_counts()
    .sort_index()
)

print()
print("Actual landslide rows:")
print(
    dataset[
        dataset["landslide"] == 1
    ]
    .to_string(index=False)
)

print()
print("=" * 70)
print("SUCCESS")
print("=" * 70)