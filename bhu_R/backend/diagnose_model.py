from pathlib import Path
import pandas as pd
import joblib
import traceback

print("\n" + "=" * 60)
print("LANDSLIDE MODEL DIAGNOSTIC")
print("=" * 60)

# Find project directory
BASE_DIR = Path(__file__).resolve().parent.parent

MODEL_PATH = BASE_DIR / "model" / "landslide_model_v2.joblib"

print("\nModel path:")
print(MODEL_PATH)

print("\nModel exists:")
print(MODEL_PATH.exists())


# ---------------------------------------------------------
# LOAD MODEL
# ---------------------------------------------------------

try:

    model = joblib.load(MODEL_PATH)

    print("\n✅ MODEL LOADED")
    print("Model type:", type(model))

except Exception as e:

    print("\n❌ MODEL LOADING FAILED")
    print(type(e).__name__)
    print(str(e))

    traceback.print_exc()

    raise


# ---------------------------------------------------------
# MODEL DETAILS
# ---------------------------------------------------------

print("\n" + "=" * 60)
print("MODEL DETAILS")
print("=" * 60)

if hasattr(model, "named_steps"):

    print("\nPipeline detected.")

    print("\nPipeline steps:")

    for name, step in model.named_steps.items():

        print(
            f"  {name} -> {type(step).__name__}"
        )

else:

    print("\nModel is not a Pipeline.")


# ---------------------------------------------------------
# TEST INPUT
# ---------------------------------------------------------

input_data = pd.DataFrame({
    "state": ["ASSAM"],
    "year": [2020],
    "month": [6],
    "rainfall": [390.0],
    "rainfall_anomaly": [120.0],
    "rainfall_anomaly_pct": [45.0],
    "temperature": [27.5]
})


print("\n" + "=" * 60)
print("TEST INPUT")
print("=" * 60)

print(input_data)

print("\nColumns:")
print(input_data.columns.tolist())


# ---------------------------------------------------------
# PREDICT
# ---------------------------------------------------------

print("\n" + "=" * 60)
print("TESTING model.predict()")
print("=" * 60)

try:

    prediction = model.predict(input_data)

    print("\n✅ model.predict() WORKED")

    print("Prediction:", prediction)

except Exception as e:

    print("\n❌ model.predict() FAILED")

    print("Error:", type(e).__name__)
    print(str(e))

    traceback.print_exc()

    raise


# ---------------------------------------------------------
# PREDICT PROBABILITY
# ---------------------------------------------------------

print("\n" + "=" * 60)
print("TESTING model.predict_proba()")
print("=" * 60)

try:

    probabilities = model.predict_proba(input_data)

    print("\n✅ model.predict_proba() WORKED")

    print("Probabilities:")
    print(probabilities)

except Exception as e:

    print("\n❌ model.predict_proba() FAILED")

    print("Error:", type(e).__name__)
    print(str(e))

    traceback.print_exc()

    raise


# ---------------------------------------------------------
# CLASSES
# ---------------------------------------------------------

print("\n" + "=" * 60)
print("CHECKING MODEL CLASSES")
print("=" * 60)

try:

    if hasattr(model, "classes_"):

        classes = model.classes_

    elif hasattr(model, "named_steps"):

        last_step = list(model.named_steps.values())[-1]

        classes = last_step.classes_

    else:

        classes = None


    print("Classes:", classes)


except Exception as e:

    print("\n❌ CLASS CHECK FAILED")

    print(type(e).__name__)
    print(str(e))

    traceback.print_exc()

    raise


# ---------------------------------------------------------
# FINAL
# ---------------------------------------------------------

print("\n" + "=" * 60)
print("DIAGNOSTIC FINISHED")
print("=" * 60)

print("\nPrediction:", int(prediction[0]))

if len(probabilities[0]) >= 2:

    landslide_probability = float(probabilities[0][1])

    print(
        "Landslide probability:",
        round(landslide_probability * 100, 2),
        "%"
    )

print("\n✅ MODEL IS WORKING")