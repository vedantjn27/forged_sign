import os
import sys
import locale
import cv2
import pandas as pd
import numpy as np
import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Conv2D, MaxPooling2D, Flatten, Dense, Dropout
from tensorflow.keras.preprocessing.image import img_to_array
from sklearn.model_selection import train_test_split
from tensorflow.keras.utils import to_categorical
from tensorflow.keras.preprocessing.image import ImageDataGenerator

# Ensure UTF-8 encoding
sys.stdout.reconfigure(encoding='utf-8')
locale.setlocale(locale.LC_ALL, 'en_US.UTF-8')

# Define dataset path
DATASET_PATH = "CEDAR_Signatures"

# Define image size
IMG_SIZE = (128, 128)

def load_images(dataframe, dataset_name="Train"):
    images, labels = [], []
    missing_files = []

    for _, row in dataframe.iterrows():
        genuine_path = os.path.join(DATASET_PATH, row['genuine_path'])
        forged_path = os.path.join(DATASET_PATH, row['forged_path'])

        # Skip non-image files like Thumbs.db
        if genuine_path.endswith(".db") or forged_path.endswith(".db"):
            continue
        
        # Load and check genuine image
        genuine_img = cv2.imread(genuine_path, cv2.IMREAD_GRAYSCALE)
        if genuine_img is None:
            missing_files.append(genuine_path)
            continue

        # Load and check forged image
        forged_img = cv2.imread(forged_path, cv2.IMREAD_GRAYSCALE)
        if forged_img is None:
            missing_files.append(forged_path)
            continue

        # Resize images
        genuine_img = cv2.resize(genuine_img, IMG_SIZE)
        forged_img = cv2.resize(forged_img, IMG_SIZE)

        # Normalize and convert to array
        images.append(img_to_array(genuine_img) / 255.0)
        labels.append(0)  # Genuine label

        images.append(img_to_array(forged_img) / 255.0)
        labels.append(1)  # Forged label

    if missing_files:
        print(f"{len(missing_files)} missing images detected in {dataset_name} dataset.")
        print("First 5 missing files:", missing_files[:5])

    print(f"Loaded {len(images)} images from {dataset_name} dataset.")
    return np.array(images), np.array(labels)

# Load dataset CSV files
train_df = pd.read_csv("train_data_utf8.csv", encoding="utf-8")
test_df = pd.read_csv("test_data_utf8.csv", encoding="utf-8")

# Clean and normalize paths to avoid encoding errors
train_df['genuine_path'] = train_df['genuine_path'].astype(str).apply(lambda x: x.encode('utf-8', 'ignore').decode('utf-8'))
train_df['forged_path'] = train_df['forged_path'].astype(str).apply(lambda x: x.encode('utf-8', 'ignore').decode('utf-8'))

test_df['genuine_path'] = test_df['genuine_path'].astype(str).apply(lambda x: x.encode('utf-8', 'ignore').decode('utf-8'))
test_df['forged_path'] = test_df['forged_path'].astype(str).apply(lambda x: x.encode('utf-8', 'ignore').decode('utf-8'))

# Load training and testing data
X_train, y_train = load_images(train_df, dataset_name="Train")
X_test, y_test = load_images(test_df, dataset_name="Test")

# Convert labels to categorical (if using categorical_crossentropy loss)
y_train = to_categorical(y_train, num_classes=2)
y_test = to_categorical(y_test, num_classes=2)

# Split Train set into Training & Validation sets
X_train, X_val, y_train, y_val = train_test_split(X_train, y_train, test_size=0.2, random_state=42, shuffle=True)

print(f"Final Data Shapes:")
print(f"X_train: {X_train.shape}, y_train: {y_train.shape}")
print(f"X_val: {X_val.shape}, y_val: {y_val.shape}")
print(f"X_test: {X_test.shape}, y_test: {y_test.shape}")

# Ensure labels are float32
y_train = y_train.astype("float32")
y_val = y_val.astype("float32")
y_test = y_test.astype("float32")

# Define CNN model
model = Sequential([
    Conv2D(32, (3, 3), activation='relu', input_shape=(128, 128, 1)),
    MaxPooling2D(2, 2),

    Conv2D(64, (3, 3), activation='relu'),
    MaxPooling2D(2, 2),

    Flatten(),
    Dense(128, activation='relu'),
    Dropout(0.5),
    Dense(2, activation='softmax')  # Output two probabilities
])

# Compile model
model.compile(optimizer='adam', loss='categorical_crossentropy', metrics=['accuracy'])

# Train model
model.fit(X_train, y_train, epochs=10, validation_data=(X_val, y_val))

# Save model
model.save("backend/model/signature_model.h5")

# Evaluate on Test Set
test_loss, test_acc = model.evaluate(X_test, y_test)
print(f"Test Accuracy: {test_acc * 100:.2f}%")
