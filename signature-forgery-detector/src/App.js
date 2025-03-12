//cd project path
//npm start
//to start the project
//also start flask first
import React, { useState } from "react";
import axios from "axios";

const App = () => {
  const [genuineFile, setGenuineFile] = useState(null);
  const [forgedFile, setForgedFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!genuineFile || !forgedFile) {
      alert("Please upload both files");
      return;
    }

    const formData = new FormData();
    formData.append("genuine", genuineFile);
    formData.append("forged", forgedFile);

    try {
      setLoading(true);
      const response = await axios.post(
        "http://127.0.0.1:5000/predict",
        formData
      );

      setResult(response.data);
    } catch (error) {
      console.error("Error during prediction:", error);
      alert("Failed to predict. Check console for more details.");
    } finally {
      setLoading(false);
    }
  };

  const handleGenuineUpload = (e) => {
    const file = e.target.files[0];
    setGenuineFile(file);
  };

  const handleForgedUpload = (e) => {
    const file = e.target.files[0];
    setForgedFile(file);
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Signature Forgery Detector</h1>
        <form onSubmit={handleSubmit} style={styles.form}>
          {/* Genuine Signature Upload */}
          <div style={styles.uploadContainer}>
            <input
              type="file"
              onChange={handleGenuineUpload}
              accept="image/*"
              style={styles.input}
              required
            />
            {genuineFile && (
              <img
                src={URL.createObjectURL(genuineFile)}
                alt="Genuine Signature"
                style={styles.preview}
              />
            )}
          </div>

          {/* Forged Signature Upload */}
          <div style={styles.uploadContainer}>
            <input
              type="file"
              onChange={handleForgedUpload}
              accept="image/*"
              style={styles.input}
              required
            />
            {forgedFile && (
              <img
                src={URL.createObjectURL(forgedFile)}
                alt="Forged Signature"
                style={styles.preview}
              />
            )}
          </div>

          {/* Submit Button */}
          <button type="submit" style={styles.button} disabled={loading}>
            {loading ? (
              <div style={styles.loader}></div>
            ) : (
              "Submit"
            )}
          </button>
        </form>

        {/* Prediction Result */}
        {result && (
          <div style={styles.result}>
            <h2 style={styles.resultTitle}>Prediction Result:</h2>
            <div style={styles.resultItem}>
              <span style={styles.resultLabel}>Genuine Label:</span>
              <span
                style={{
                  ...styles.resultValue,
                  color:
                    result.genuine_label === "Genuine"
                      ? "#4CAF50"
                      : "#f44336",
                }}
              >
                {result.genuine_label}
              </span>
            </div>
            <div style={styles.resultItem}>
              <span style={styles.resultLabel}>Forged Label:</span>
              <span
                style={{
                  ...styles.resultValue,
                  color:
                    result.forged_label === "Forged"
                      ? "#f44336"
                      : "#4CAF50",
                }}
              >
                {result.forged_label}
              </span>
            </div>
            <div style={styles.resultItem}>
              <span style={styles.resultLabel}>Confidence:</span>
              <span style={styles.confidenceValue}>
                {result.confidence.toFixed(2)}%
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: {
    fontFamily: "Arial, sans-serif",
    padding: "20px",
    backgroundColor: "#f9f9f9",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "100vh",
    boxSizing: "border-box",
  },
  card: {
    backgroundColor: "#ffffff",
    padding: "30px",
    borderRadius: "12px",
    boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)",
    width: "100%",
    maxWidth: "600px",
    boxSizing: "border-box",
  },
  title: {
    fontSize: "28px",
    color: "#333",
    marginBottom: "20px",
    textAlign: "center",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  uploadContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    alignItems: "center",
  },
  input: {
    padding: "12px",
    border: "1px solid #ddd",
    borderRadius: "8px",
    fontSize: "16px",
    transition: "border-color 0.2s",
    outline: "none",
    width: "100%",
  },
  preview: {
    width: "100%",
    maxHeight: "180px",
    objectFit: "contain",
    borderRadius: "8px",
    border: "1px solid #ddd",
  },
  button: {
    padding: "14px",
    backgroundColor: "#4CAF50",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "18px",
    transition: "background 0.3s",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  loader: {
    width: "20px",
    height: "20px",
    border: "2px solid #fff",
    borderTop: "2px solid transparent",
    borderRadius: "50%",
    animation: "spin 0.6s linear infinite",
  },
  result: {
    marginTop: "20px",
    padding: "20px",
    border: "1px solid #ddd",
    borderRadius: "12px",
    backgroundColor: "#fafafa",
    textAlign: "center",
    boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
  },
  resultTitle: {
    fontSize: "22px",
    fontWeight: "bold",
    marginBottom: "12px",
    color: "#333",
  },
  resultItem: {
    display: "flex",
    justifyContent: "space-between",
    padding: "8px 0",
    borderBottom: "1px solid #eee",
  },
  resultLabel: {
    fontSize: "16px",
    fontWeight: "500",
    color: "#555",
  },
  resultValue: {
    fontSize: "16px",
    fontWeight: "bold",
  },
  confidenceValue: {
    fontSize: "16px",
    fontWeight: "bold",
    color: "#2196F3",
  },
};

export default App;
