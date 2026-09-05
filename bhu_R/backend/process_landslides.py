import pandas as pd
import re
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
# LOAD
# ============================================================

file_path = (
    RAW_DIR /
    "LandslideIncidences.csv"
)

df = pd.read_csv(file_path)


print("Original shape:")
print(df.shape)

print("\nColumns:")
print(df.columns.tolist())


# ============================================================
# COMBINE TEXT
# ============================================================

df["text"] = (
    df["Title"].fillna("").astype(str)
    + " "
    + df["LandslideIncidence"].fillna("").astype(str)
)


# ============================================================
# STATE DETECTION
# ============================================================

state_patterns = {
    "ARUNACHAL PRADESH": "Arunachal Pradesh",
    "ASSAM": "Assam",
    "MEGHALAYA": "Meghalaya",
    "MANIPUR": "Manipur",
    "MIZORAM": "Mizoram",
    "NAGALAND": "Nagaland",
    "SIKKIM": "Sikkim",
    "TRIPURA": "Tripura"
}


def find_state(text):

    for state, pattern in state_patterns.items():

        if re.search(
            pattern,
            text,
            re.IGNORECASE
        ):
            return state

    return None


df["state"] = df["text"].apply(find_state)


# ============================================================
# MONTH DETECTION
# ============================================================

months = {
    "january": 1,
    "february": 2,
    "march": 3,
    "april": 4,
    "may": 5,
    "june": 6,
    "july": 7,
    "august": 8,
    "september": 9,
    "october": 10,
    "november": 11,
    "december": 12
}


def find_month(text):

    text = text.lower()

    for month, number in months.items():

        if month in text:
            return number

    return None


df["month"] = df["text"].apply(
    find_month
)


# ============================================================
# YEAR DETECTION
# ============================================================

def find_year(text):

    matches = re.findall(
        r"\b(19\d{2}|20\d{2})\b",
        text
    )

    if matches:
        return int(matches[0])

    return None


df["year"] = df["text"].apply(
    find_year
)


# ============================================================
# KEEP NORTH-EAST
# ============================================================

df = df[
    df["state"].notna()
].copy()


df = df[
    df["month"].notna()
].copy()


# ============================================================
# LANDSLIDE = 1
# ============================================================

df["landslide"] = 1


# ============================================================
# RESULT
# ============================================================

result = df[
    [
        "state",
        "year",
        "month",
        "landslide"
    ]
].copy()


result["year"] = pd.to_numeric(
    result["year"],
    errors="coerce"
)


result["month"] = pd.to_numeric(
    result["month"],
    errors="coerce"
)


result = result.dropna(
    subset=[
        "state",
        "month"
    ]
)


# ============================================================
# SAVE
# ============================================================

output_file = (
    PROCESSED_DIR /
    "ne_landslide_events.csv"
)


result.to_csv(
    output_file,
    index=False
)


# ============================================================
# DISPLAY
# ============================================================

print("\n========================================")
print("LANDSLIDE DATA CREATED")
print("========================================")

print("\nRecords:")
print(len(result))

print("\nState distribution:")
print(
    result["state"]
    .value_counts()
)

print("\nMonth distribution:")
print(
    result["month"]
    .value_counts()
    .sort_index()
)

print("\nData:")
print(result)

print("\nSaved to:")
print(output_file)