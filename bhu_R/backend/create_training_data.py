import pandas as pd
from pathlib import Path


# ============================================================
# PATHS
# ============================================================

BASE_DIR = Path(__file__).resolve().parent.parent

PROCESSED_DIR = (
    BASE_DIR /
    "data" /
    "processed"
)


# ============================================================
# LOAD ENVIRONMENTAL DATA
# ============================================================

environment = pd.read_csv(
    PROCESSED_DIR /
    "ne_environmental_data.csv"
)


# ============================================================
# LOAD LANDSLIDES
# ============================================================

landslides = pd.read_csv(
    PROCESSED_DIR /
    "ne_landslide_events.csv"
)


# ============================================================
# COUNT DOCUMENTED LANDSLIDES
# BY STATE + MONTH
# ============================================================

history = (
    landslides
    .groupby(
        [
            "state",
            "month"
        ]
    )
    .size()
    .reset_index(
        name="historical_landslides"
    )
)


# ============================================================
# MERGE
# ============================================================

dataset = environment.merge(
    history,
    on=[
        "state",
        "month"
    ],
    how="left"
)


# No documented event = 0
dataset["historical_landslides"] = (
    dataset["historical_landslides"]
    .fillna(0)
)


# ============================================================
# CREATE TARGET
# ============================================================

dataset["landslide"] = (
    dataset["historical_landslides"] > 0
).astype(int)


# ============================================================
# CLEAN
# ============================================================

dataset["rainfall_normal"] = pd.to_numeric(
    dataset["rainfall_normal"],
    errors="coerce"
)


dataset["temperature"] = pd.to_numeric(
    dataset["temperature"],
    errors="coerce"
)


dataset["historical_landslides"] = pd.to_numeric(
    dataset["historical_landslides"],
    errors="coerce"
)


dataset = dataset.dropna()


# ============================================================
# SAVE
# ============================================================

output_file = (
    PROCESSED_DIR /
    "landslide_training_v1.csv"
)


dataset.to_csv(
    output_file,
    index=False
)


# ============================================================
# DISPLAY
# ============================================================

print("\n========================================")
print("TRAINING DATASET CREATED")
print("========================================")

print("\nShape:")
print(dataset.shape)

print("\nColumns:")
print(dataset.columns.tolist())

print("\nTarget distribution:")
print(
    dataset["landslide"]
    .value_counts()
)

print("\nDataset:")
print(dataset)

print("\nSaved to:")
print(output_file)