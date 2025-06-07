
from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
import cv2
import tensorflow as tf
from tensorflow.keras.preprocessing.image import img_to_array
import mysql.connector
import sys
sys.stdout.reconfigure(encoding='utf-8')

app = Flask(__name__)
CORS(app)

# Load the trained model
model = tf.keras.models.load_model(r"C:\Users\vedan\Documents\My_Projects\FORGED_SIGNATURE_DETECTION\backend\model\signature_model.h5")
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

def preprocess_image(file):
    file_bytes = np.frombuffer(file.read(), np.uint8)
    img = cv2.imdecode(file_bytes, cv2.IMREAD_GRAYSCALE)
    if img is None:
        return None
    img = cv2.resize(img, IMG_SIZE)
    img = img_to_array(img) / 255.0
    img = np.expand_dims(img, axis=0)
    return img

@app.get("/")
def home():
    return {"message": "Signature forgery detection API is running"}

@app.post('/predict')
def predict():
    if 'genuine' not in request.files or 'forged' not in request.files:
        return jsonify({'error': 'Both genuine and forged files are required'}), 400

    genuine_file = request.files['genuine']
    forged_file = request.files['forged']

    genuine_img = preprocess_image(genuine_file)
    forged_img = preprocess_image(forged_file)

    if genuine_img is None or forged_img is None:
        return jsonify({'error': 'Invalid image format'}), 400

    # Get predictions
    genuine_pred = model.predict(genuine_img)[0]
    forged_pred = model.predict(forged_img)[0]

    # Convert to labels
    genuine_label = "Genuine" if np.argmax(genuine_pred) == 0 else "Forged"
    forged_label = "Genuine" if np.argmax(forged_pred) == 0 else "Forged"

    # Determine the final label based on both predictions
    if np.argmax(genuine_pred) == np.argmax(forged_pred):
        final_label = "Genuine"
    else:
        final_label = "Forged"

    # Confidence score (average of both predictions)
    confidence = float((max(genuine_pred) + max(forged_pred)) / 2 * 100)

    # Insert into database with final label
    try:
        cursor.execute(
            "INSERT INTO predictions (genuine_path, forged_path, predicted_label, confidence) VALUES (%s, %s, %s, %s)",
            (genuine_file.filename, forged_file.filename, final_label, confidence)
        )
        db.commit()
    except Exception as e:
        db.rollback()
        return jsonify({'error': f"Database error: {str(e)}"}), 500

    # Return response
    return jsonify({
        'success': True,
        'genuine_label': genuine_label,
        'forged_label': forged_label,
        'final_label': final_label,  # Final decision based on both predictions
        'confidence': confidence
    }), 200, {'Content-Type': 'application/json; charset=utf-8'}

if __name__ == '__main__':
    app.run(debug=True)
