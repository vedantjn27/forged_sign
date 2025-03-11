
from flask import Flask, request, jsonify
import numpy as np
import cv2
import tensorflow as tf
from tensorflow.keras.preprocessing.image import img_to_array
import mysql.connector
import os

app = Flask(__name__)

# Load the trained model
model = tf.keras.models.load_model(r"C:\Users\vedan\Documents\My_Projects\forged_sign\backend\model\signature_model.h5")
model.compile(optimizer='adam', loss='categorical_crossentropy', metrics=['accuracy'])


# Database connection
db = mysql.connector.connect(
    host="localhost",
    user="root",
    password="P@ssw0rd27",
    database="signaturedb"
)
cursor = db.cursor()

# Define image size
IMG_SIZE = (128, 128)

def preprocess_image(image_path):
    img = cv2.imread(image_path, cv2.IMREAD_GRAYSCALE)
    if img is None:
        return None
    img = cv2.resize(img, IMG_SIZE)
    img = img_to_array(img) / 255.0
    img = np.expand_dims(img, axis=0)
    return img

@app.get("/")
def home():
    return {"message": "Signature forgery detection API is running"}


@app.route('/predict', methods=['POST'])
def predict():
    data = request.get_json()
    genuine_path = data.get('genuine_path')
    forged_path = data.get('forged_path')

    genuine_img = preprocess_image(genuine_path)
    forged_img = preprocess_image(forged_path)

    if genuine_img is None or forged_img is None:
        return jsonify({'error': 'Invalid image path'}), 400

    # Get predictions
    genuine_pred = model.predict(genuine_img)[0]
    forged_pred = model.predict(forged_img)[0]

    # Convert to labels
    genuine_label = "Genuine" if np.argmax(genuine_pred) == 0 else "Forged"
    forged_label = "Genuine" if np.argmax(forged_pred) == 0 else "Forged"

    # Confidence score
    confidence = max(genuine_pred) * 100

    # Insert into database
    cursor.execute(
        "INSERT INTO predictions (genuine_path, forged_path, predicted_label, confidence) VALUES (%s, %s, %s, %s)",
        (genuine_path, forged_path, genuine_label, confidence)
    )
    db.commit()

    return jsonify({
        'genuine_label': genuine_label,
        'forged_label': forged_label,
        'confidence': confidence
    })

if __name__ == '__main__':
    app.run(debug=True)
