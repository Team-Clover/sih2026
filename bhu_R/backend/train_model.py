import pandas as pd
import joblib

from pathlib import Path

from sklearn.model_selection import train_test_split
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    classification_report,
    confusion_matrix,
    accuracy_score,
    roc_auc_score
)


# ============================================================
# PATHS
# ============================================================

BASE_DIR = Path(__file__).resolve().parent.parent

DATA_DIR = BASE_DIR / "data" / "processed"
MODEL_DIR = BASE_DIR / "model"

MODEL_DIR.mkdir(
    parents=True,
    exist_ok=True
)


# ============================================================
# LOAD DATA
# ============================================================

print("\n==============================================")
print("LOADING TRAINING DATA")
print("==============================================")


data_file = DATA_DIR / "landslide_training_v2.csv"

print("\nLoading:")
print(data_file)


if not data_file.exists():

    raise FileNotFoundError(
        f"Training dataset not found:\n{data_file}"
    )


df = pd.read_csv(
    data_file
)


print("\nShape:")
print(df.shape)

print("\nColumns:")
print(df.columns.tolist())


# ============================================================
# TARGET CHECK
# ============================================================

print("\n==============================================")
print("TARGET CHECK")
print("==============================================")


if "landslide" not in df.columns:

    raise ValueError(
        "Target column 'landslide' is missing."
    )


print("\nTarget distribution:")

print(
    df["landslide"].value_counts()
)


print("\nTarget percentage:")

print(
    df["landslide"]
    .value_counts(normalize=True)
    * 100
)


# ============================================================
# CHECK NUMBER OF CLASSES
# ============================================================

unique_classes = df["landslide"].dropna().unique()

print("\nUnique target classes:")
print(unique_classes)


if len(unique_classes) < 2:

    print("\n❌ MODEL TRAINING STOPPED")

    print(
        "\nYour dataset contains only ONE target class."
    )

    print(
        "\nA binary landslide model needs:"
    )

    print(
        "  0 = No landslide"
    )

    print(
        "  1 = Landslide"
    )

    print(
        "\nYour current dataset contains:"
    )

    print(
        df["landslide"].value_counts()
    )

    print(
        "\nThe problem is therefore in the LANDSLIDE TARGET "
        "CREATION / LANDSLIDE EVENT DATA."
    )

    raise ValueError(
        "Training cannot continue because the target "
        "contains only one class."
    )


# ============================================================
# FEATURES
# ============================================================

features = [
    "state",
    "year",
    "month",
    "rainfall",
    "rainfall_anomaly",
    "rainfall_anomaly_pct",
    "temperature"
]


missing_features = [
    feature
    for feature in features
    if feature not in df.columns
]


if missing_features:

    raise ValueError(
        f"Missing features: {missing_features}"
    )


X = df[features].copy()

y = df["landslide"].copy()


# ============================================================
# CLEAN TARGET
# ============================================================

y = pd.to_numeric(
    y,
    errors="coerce"
)


valid_rows = y.notna()

X = X.loc[valid_rows].copy()

y = y.loc[valid_rows].astype(int)


# ============================================================
# FEATURE TYPES
# ============================================================

categorical_features = [
    "state"
]


numeric_features = [
    "year",
    "month",
    "rainfall",
    "rainfall_anomaly",
    "rainfall_anomaly_pct",
    "temperature"
]


# ============================================================
# PREPROCESSING
# ============================================================

preprocessor = ColumnTransformer(

    transformers=[

        (
            "state",
            OneHotEncoder(
                handle_unknown="ignore"
            ),
            categorical_features
        ),

        (
            "numeric",
            StandardScaler(),
            numeric_features
        )

    ]

)


# ============================================================
# CLASS-BALANCED LOGISTIC MODEL
# ============================================================

model = LogisticRegression(
    C=0.5,
    class_weight="balanced",
    max_iter=3000,
    random_state=42
)


# ============================================================
# PIPELINE
# ============================================================

pipeline = Pipeline(

    steps=[

        (
            "preprocessor",
            preprocessor
        ),

        (
            "model",
            model
        )

    ]

)


# ============================================================
# TRAIN / TEST SPLIT
# ============================================================

print("\n==============================================")
print("TRAIN / TEST SPLIT")
print("==============================================")


X_train, X_test, y_train, y_test = train_test_split(

    X,

    y,

    test_size=0.20,

    random_state=42,

    stratify=y

)


print("\nTraining samples:")
print(len(X_train))


print("\nTesting samples:")
print(len(X_test))


print("\nTraining target:")
print(
    y_train.value_counts()
)


print("\nTesting target:")
print(
    y_test.value_counts()
)


# ============================================================
# TRAIN
# ============================================================

print("\n==============================================")
print("TRAINING CLASS-BALANCED LOGISTIC MODEL")
print("==============================================")


pipeline.fit(
    X_train,
    y_train
)


print("\n✅ Training completed.")


# ============================================================
# PREDICTIONS
# ============================================================

predictions = pipeline.predict(
    X_test
)


# ============================================================
# PROBABILITY
# ============================================================

probabilities = pipeline.predict_proba(
    X_test
)


# Find probability of positive class safely

model_classes = pipeline.named_steps[
    "model"
].classes_


print("\nModel classes:")
print(model_classes)


if 1 in model_classes:

    positive_class_index = list(
        model_classes
    ).index(1)

    y_probability = probabilities[
        :,
        positive_class_index
    ]

else:

    y_probability = [0.0] * len(X_test)


# ============================================================
# EVALUATION
# ============================================================

print("\n==============================================")
print("MODEL EVALUATION")
print("==============================================")


accuracy = accuracy_score(
    y_test,
    predictions
)


print("\nAccuracy:")
print(
    round(accuracy, 4)
)


print("\nClassification Report:")

print(
    classification_report(
        y_test,
        predictions,
        zero_division=0
    )
)


print("\nConfusion Matrix:")

print(
    confusion_matrix(
        y_test,
        predictions
    )
)


# ============================================================
# ROC AUC
# ============================================================

if len(set(y_test)) == 2:

    auc = roc_auc_score(
        y_test,
        y_probability
    )

    print("\nROC-AUC:")
    print(
        round(auc, 4)
    )

else:

    print(
        "\nROC-AUC cannot be calculated because "
        "the test set contains only one class."
    )


# ============================================================
# SAVE MODEL
# ============================================================

model_file = (
    MODEL_DIR /
    "landslide_model_v2.joblib"
)


joblib.dump(
    pipeline,
    model_file
)


print("\n==============================================")
print("MODEL SAVED")
print("==============================================")


print("\nModel:")
print(model_file)


print("\n==============================================")
print("TRAINING COMPLETE")
print("==============================================")