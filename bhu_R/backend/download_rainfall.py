import requests
import pandas as pd
from pathlib import Path
from io import StringIO

# ============================================================
# PATHS
# ============================================================

BASE_DIR = Path(__file__).resolve().parent.parent
RAW_DIR = BASE_DIR / "data" / "raw"

OUTPUT_FILE = RAW_DIR / "rainfall_2016_2020.csv"

RAW_DIR.mkdir(parents=True, exist_ok=True)


# ============================================================
# NORTH-EAST STATES
# Representative coordinates
# ============================================================

STATE_COORDINATES = {
    "ARUNACHAL PRADESH": (28.0, 94.0),
    "ASSAM": (26.2, 92.9),
    "MEGHALAYA": (25.5, 91.3),
    "MANIPUR": (24.7, 93.9),
    "MIZORAM": (23.2, 92.9),
    "NAGALAND": (26.0, 94.1),
    "SIKKIM": (27.5, 88.5),
    "TRIPURA": (23.8, 91.3),
}


# ============================================================
# CHIRPS ERDDAP
# ============================================================

BASE_URL = (
    "https://coastwatch.pfeg.noaa.gov/"
    "erddap/griddap/"
    "chirps20GlobalMonthlyP05.csv"
)


# ============================================================
# DOWNLOAD ONE STATE
# ============================================================

def download_state(state, latitude, longitude):

    print()
    print("=" * 70)
    print(f"Downloading rainfall: {state}")
    print(f"Coordinate: {latitude}, {longitude}")
    print("=" * 70)

    # IMPORTANT:
    # ERDDAP syntax is:
    #
    # precip[(time_start):stride:(time_end)]
    #        [(latitude)]
    #        [(longitude)]
    #
    # We request January 2016 through December 2020.

    query = (
        f"precip"
        f"[(2016-01-01T00:00:00Z):1:"
        f"(2020-12-01T00:00:00Z)]"
        f"[({latitude})]"
        f"[({longitude})]"
    )

    url = BASE_URL + "?" + query

    try:

        response = requests.get(
            url,
            timeout=120
        )

        print("HTTP status:", response.status_code)

        if response.status_code != 200:

            print("Server returned an error:")
            print(response.text[:1000])

            return None

        df = pd.read_csv(
            StringIO(response.text)
        )

        print("Rows downloaded:", len(df))

        if df.empty:
            print("No data returned.")
            return None

        print("Columns:", df.columns.tolist())

        # ----------------------------------------------------
        # Find precipitation column
        # ----------------------------------------------------

        precip_column = None

        for column in df.columns:

            if column.lower() == "precip":

                precip_column = column
                break

        if precip_column is None:

            print("ERROR: precip column not found.")

            return None

        # ----------------------------------------------------
        # Convert time
        # ----------------------------------------------------

        if "time" not in df.columns:

            print("ERROR: time column not found.")

            return None

        df["time"] = pd.to_datetime(
            df["time"],
            errors="coerce"
        )

        # ----------------------------------------------------
        # Create required columns
        # ----------------------------------------------------

        df["state"] = state

        df["year"] = df["time"].dt.year

        df["month"] = df["time"].dt.month

        df["rainfall"] = pd.to_numeric(
            df[precip_column],
            errors="coerce"
        )

        # ----------------------------------------------------
        # Remove missing values
        # ----------------------------------------------------

        df = df.dropna(
            subset=[
                "year",
                "month",
                "rainfall"
            ]
        )

        # Remove invalid CHIRPS fill values
        df = df[
            df["rainfall"] >= 0
        ]

        result = df[
            [
                "state",
                "year",
                "month",
                "rainfall"
            ]
        ].copy()

        return result

    except requests.exceptions.Timeout:

        print("ERROR: Request timed out.")

        return None

    except requests.exceptions.RequestException as e:

        print("REQUEST ERROR:", e)

        return None

    except Exception as e:

        print("UNEXPECTED ERROR:", e)

        return None


# ============================================================
# MAIN
# ============================================================

def main():

    print()
    print("=" * 70)
    print("CHIRPS RAINFALL DOWNLOADER")
    print("2016 - 2020")
    print("=" * 70)

    all_data = []

    # --------------------------------------------------------
    # Download each state
    # --------------------------------------------------------

    for state, coordinates in STATE_COORDINATES.items():

        latitude, longitude = coordinates

        data = download_state(
            state,
            latitude,
            longitude
        )

        if data is not None and not data.empty:

            all_data.append(data)

            print(
                f"SUCCESS: {state} -> "
                f"{len(data)} rows"
            )

        else:

            print(
                f"FAILED: {state}"
            )

    # --------------------------------------------------------
    # Check whether anything downloaded
    # --------------------------------------------------------

    if not all_data:

        raise RuntimeError(
            "\nNo rainfall data was downloaded.\n"
            "Check your internet connection or CHIRPS server."
        )

    # --------------------------------------------------------
    # Combine states
    # --------------------------------------------------------

    rainfall = pd.concat(
        all_data,
        ignore_index=True
    )

    # --------------------------------------------------------
    # Clean
    # --------------------------------------------------------

    rainfall["year"] = rainfall[
        "year"
    ].astype(int)

    rainfall["month"] = rainfall[
        "month"
    ].astype(int)

    rainfall["rainfall"] = rainfall[
        "rainfall"
    ].astype(float)

    rainfall = rainfall.sort_values(
        [
            "state",
            "year",
            "month"
        ]
    )

    # --------------------------------------------------------
    # Remove duplicates
    # --------------------------------------------------------

    rainfall = rainfall.drop_duplicates(
        subset=[
            "state",
            "year",
            "month"
        ]
    )

    # --------------------------------------------------------
    # Save
    # --------------------------------------------------------

    rainfall.to_csv(
        OUTPUT_FILE,
        index=False
    )

    # ========================================================
    # FINAL REPORT
    # ========================================================

    print()
    print("=" * 70)
    print("DOWNLOAD COMPLETED")
    print("=" * 70)

    print()
    print("File:")
    print(OUTPUT_FILE)

    print()
    print("Shape:")
    print(rainfall.shape)

    print()
    print("States:")
    print(
        rainfall["state"]
        .value_counts()
        .sort_index()
    )

    print()
    print("Years:")
    print(
        sorted(
            rainfall["year"].unique()
        )
    )

    print()
    print("Months:")
    print(
        sorted(
            rainfall["month"].unique()
        )
    )

    print()
    print("Missing values:")
    print(
        rainfall.isnull().sum()
    )

    print()
    print("First 20 rows:")
    print(
        rainfall.head(20).to_string(
            index=False
        )
    )

    print()
    print("=" * 70)
    print("SUCCESS")
    print("=" * 70)


# ============================================================
# RUN
# ============================================================

if __name__ == "__main__":
    main()