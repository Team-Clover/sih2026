import pandas as pd
from pathlib import Path


# ============================================================
# PATHS
# ============================================================

BASE_DIR = Path(__file__).resolve().parent.parent

RAW_DIR = BASE_DIR / "data" / "raw"
PROCESSED_DIR = BASE_DIR / "data" / "processed"

PROCESSED_DIR.mkdir(parents=True, exist_ok=True)


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
# 1. LOAD TEMPERATURE
# ============================================================

print("\nLoading temperature data...")

temperature_file = RAW_DIR / "temperature.csv"

temperature = pd.read_csv(temperature_file)

print("Temperature shape:", temperature.shape)
print("Temperature columns:")
print(temperature.columns.tolist())


# Rename first column to state
temperature = temperature.rename(
    columns={
        temperature.columns[0]: "state"
    }
)


# Clean state names
temperature["state"] = (
    temperature["state"]
    .astype(str)
    .str.strip()
    .str.upper()
)


# Keep only North-East
temperature = temperature[
    temperature["state"].isin(NE_STATES)
].copy()


# ============================================================
# TEMPERATURE: WIDE → LONG
# ============================================================

month_mapping = {
    "Jan": 1,
    "Feb": 2,
    "Mar": 3,
    "Apr": 4,
    "May": 5,
    "June": 6,
    "July": 7,
    "Aug": 8,
    "Sep": 9,
    "Oct": 10,
    "Nov": 11,
    "Dec": 12
}


temperature.columns = [
    str(col).strip()
    for col in temperature.columns
]


temperature = temperature.melt(
    id_vars=["state"],
    var_name="month_name",
    value_name="temperature"
)


temperature["month"] = (
    temperature["month_name"]
    .map(month_mapping)
)


temperature["temperature"] = pd.to_numeric(
    temperature["temperature"],
    errors="coerce"
)


temperature = temperature.dropna(
    subset=["month", "temperature"]
)


temperature = temperature[
    [
        "state",
        "month",
        "temperature"
    ]
]


print("\nTemperature processed:")
print(temperature.head())


# ============================================================
# 2. LOAD DISTRICT RAINFALL NORMAL
# ============================================================

print("\nLoading rainfall normal data...")

rainfall_file = (
    RAW_DIR /
    "district_wise_rainfall_normal.csv"
)

rainfall = pd.read_csv(rainfall_file)

print("Rainfall shape:", rainfall.shape)

print("Rainfall columns:")
print(rainfall.columns.tolist())


# Clean column names
rainfall.columns = [
    str(col).strip().upper()
    for col in rainfall.columns
]


# Clean state names
rainfall["STATE_UT_NAME"] = (
    rainfall["STATE_UT_NAME"]
    .astype(str)
    .str.strip()
    .str.upper()
)


# Keep NE states
rainfall = rainfall[
    rainfall["STATE_UT_NAME"].isin(NE_STATES)
].copy()


# ============================================================
# MONTHLY RAINFALL
# ============================================================

rainfall_months = [
    "JAN",
    "FEB",
    "MAR",
    "APR",
    "MAY",
    "JUN",
    "JUL",
    "AUG",
    "SEP",
    "OCT",
    "NOV",
    "DEC"
]


for month in rainfall_months:

    rainfall[month] = pd.to_numeric(
        rainfall[month],
        errors="coerce"
    )


# ============================================================
# DISTRICT → STATE
# ============================================================

state_rainfall = (
    rainfall
    .groupby("STATE_UT_NAME")[rainfall_months]
    .mean()
    .reset_index()
)


# ============================================================
# RAINFALL WIDE → LONG
# ============================================================

rainfall_long = state_rainfall.melt(
    id_vars=["STATE_UT_NAME"],
    value_vars=rainfall_months,
    var_name="month_name",
    value_name="rainfall_normal"
)


rainfall_month_mapping = {
    "JAN": 1,
    "FEB": 2,
    "MAR": 3,
    "APR": 4,
    "MAY": 5,
    "JUN": 6,
    "JUL": 7,
    "AUG": 8,
    "SEP": 9,
    "OCT": 10,
    "NOV": 11,
    "DEC": 12
}


rainfall_long["month"] = (
    rainfall_long["month_name"]
    .map(rainfall_month_mapping)
)


rainfall_long = rainfall_long.rename(
    columns={
        "STATE_UT_NAME": "state"
    }
)


rainfall_long = rainfall_long[
    [
        "state",
        "month",
        "rainfall_normal"
    ]
]


print("\nRainfall processed:")
print(rainfall_long.head())


# ============================================================
# 3. CREATE STATE × MONTH GRID
# ============================================================

grid = pd.MultiIndex.from_product(
    [
        NE_STATES,
        range(1, 13)
    ],
    names=[
        "state",
        "month"
    ]
).to_frame(index=False)


# ============================================================
# 4. MERGE RAINFALL + TEMPERATURE
# ============================================================

dataset = grid.merge(
    rainfall_long,
    on=[
        "state",
        "month"
    ],
    how="left"
)


dataset = dataset.merge(
    temperature,
    on=[
        "state",
        "month"
    ],
    how="left"
)


# ============================================================
# 5. SAVE
# ============================================================

output_file = (
    PROCESSED_DIR /
    "ne_environmental_data.csv"
)


dataset.to_csv(
    output_file,
    index=False
)


# ============================================================
# 6. RESULTS
# ============================================================

print("\n========================================")
print("ENVIRONMENTAL DATA CREATED")
print("========================================")

print("\nShape:")
print(dataset.shape)

print("\nColumns:")
print(dataset.columns.tolist())

print("\nMissing values:")
print(dataset.isnull().sum())

print("\nFirst 20 rows:")
print(dataset.head(20))

print("\nSaved to:")
print(output_file)