import { useState } from 'react';
import './App.css';

function App() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [explanation, setExplanation] = useState(null);
  const [explaining, setExplaining] = useState(false);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      setPreview(URL.createObjectURL(selected));
      setResult(null);
      setExplanation(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setResult(null);
    setExplanation(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const resp = await fetch(`${API_BASE_URL}/api/predict`, {
        method: "POST",
        body: formData,
      });
      const data = await resp.json();
      setResult(data);

      handleExplain(data.probability, data.diagnosis);
    } catch (err) {
      console.error(err);
      alert("Error contacting the CNN prediction API.");
    } finally {
      setLoading(false);
    }
  };

  const handleExplain = async (probability, diagnosis) => {
    setExplaining(true);
    try {
      const resp = await fetch(`${API_BASE_URL}/api/explain`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ probability, diagnosis }),
      });
      const data = await resp.json();
      setExplanation(data);
    } catch (err) {
      console.error(err);
    } finally {
      setExplaining(false);
    }
  };

  return (
    <div className="app-container">
      <header className="header">
        <h1>⚕️ CDSS Fracture AI System</h1>
        <p>Diagnostic Analysis with Explainable AI Heatmaps and Insights</p>
      </header>

      <main className="main-content">
        <div className="upload-section">
          <label className="upload-box">
            <input type="file" accept="image/*" onChange={handleFileChange} />
            {preview ? (
              <img src={preview} alt="Upload Preview" className="preview-image" />
            ) : (
              <div className="upload-placeholder">
                <span className="icon">📁</span>
                <p>Click or drag X-Ray image here to analyze</p>
              </div>
            )}
          </label>
          {file && (
            <button className="analyze-btn" onClick={handleUpload} disabled={loading}>
              {loading ? "Analyzing X-Ray..." : "Run AI Diagnostics"}
            </button>
          )}
        </div>

        {result && (
          <div className="results-section">
            <div className="visuals">
              <div className="image-card">
                <h3>Original X-Ray</h3>
                <img src={preview} alt="Original" />
              </div>
              <div className="image-card">
                <h3>Grad-CAM Explainability</h3>
                <img src={result.heatmap_base64} alt="Heatmap" />
              </div>
            </div>

            <div className="diagnosis-panel">
              <h2>Diagnostic Result</h2>
              <div className={`diagnosis-badge ${result.diagnosis === 'Normal' ? 'normal' : 'fracture'}`}>
                {result.diagnosis}
              </div>
              <p>Fracture Probability: {(result.probability * 100).toFixed(1)}%</p>

              <div className="risk-meter">
                <h4>Recovery Risk: {result.risk_level} ({result.risk_score}/100)</h4>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${result.risk_score}%` }}></div>
                </div>
              </div>

              {explaining && <p className="loading-text">Generating Clinical Explanation...</p>}

              {explanation && (
                <div className="explanation-box">
                  <h3>Clinical Insights</h3>
                  <p className="exp-text">{explanation.explanation}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
