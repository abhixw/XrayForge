import { useState } from 'react';
import ThemeToggle from '../components/ThemeToggle';

function Doctor() {
    const [view, setView] = useState('analyze');
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [explanation, setExplanation] = useState(null);
    const [explaining, setExplaining] = useState(false);
    const [shareLink, setShareLink] = useState("");

    const [patientName, setPatientName] = useState("");
    const [patientId, setPatientId] = useState("");
    const [notes, setNotes] = useState("");

    const [cases, setCases] = useState([]);
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState("all");

    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            const selected = e.target.files[0];
            setFile(selected);
            setPreview(URL.createObjectURL(selected));
            setResult(null);
            setExplanation(null);
            setShareLink("");
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        setLoading(true);
        setResult(null);
        setExplanation(null);
        setShareLink("");

        const formData = new FormData();
        formData.append("file", file);
        formData.append("patient_name", patientName || "Anonymous");
        formData.append("patient_id", patientId || "N/A");

        try {
            const resp = await fetch(`${API_BASE_URL}/api/predict`, {
                method: "POST",
                body: formData,
            });

            const data = await resp.json();
            setResult(data);

            const link = `${window.location.origin}/patient/${data.case_id}`;
            setShareLink(link);

            handleExplain(data.probability, data.diagnosis, data.risk_level);

        } catch (err) {
            console.error(err);
            alert("Error contacting backend");
        } finally {
            setLoading(false);
        }
    };

    const handleExplain = async (probability, diagnosis, risk_level) => {
        setExplaining(true);

        try {
            const resp = await fetch(`${API_BASE_URL}/api/explain`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ probability, diagnosis, risk_level }),
            });

            const data = await resp.json();
            setExplanation(data);

        } catch (err) {
            console.error(err);
        } finally {
            setExplaining(false);
        }
    };

    // ✅ Override (doctor decision)
    const handleOverride = async (newLabel) => {
        if (!result?.case_id) return;

        try {
            await fetch(`${API_BASE_URL}/api/override/${result.case_id}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ label: newLabel, notes }),
            });

            setResult({
                ...result,
                diagnosis: newLabel,
                isValidated: true
            });

        } catch (err) {
            console.error(err);
        }
    };

    // 🔥 NEW: Feedback API
    const handleFeedback = async (correctLabel) => {
        if (!result?.case_id) return;

        try {
            await fetch(`${API_BASE_URL}/api/feedback`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    case_id: result.case_id,
                    model_prediction: result.initial_prediction || result.diagnosis,
                    correct_label: correctLabel,
                    confidence: result.probability,
                    image_path: "uploaded_image.png"
                })
            });

            alert("Feedback saved!");

        } catch (err) {
            console.error(err);
            alert("Feedback failed");
        }
    };

    return (
        <div className="doctor-page">
            <ThemeToggle />

            <h1>⚕️ Physician Dashboard</h1>

            <div className="upload-section">
                <input type="file" onChange={handleFileChange} />

                {file && (
                    <button onClick={handleUpload}>
                        {loading ? "Analyzing..." : "Analyze"}
                    </button>
                )}
            </div>

            {result && (
                <div className="results-section">

                    <h2>{result.diagnosis}</h2>
                    <p>Confidence: {(result.probability * 100).toFixed(1)}%</p>

                    <img src={result.heatmap_base64} alt="Heatmap" />

                    <textarea
                        placeholder="Doctor Notes"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                    />

                    <div className="validation-controls">

                        {/* ✔ Approve */}
                        <button onClick={() => handleOverride(result.diagnosis)}>
                            Approve
                        </button>

                        {/* ✖ Override */}
                        <button onClick={() => handleOverride(
                            result.diagnosis === "Normal"
                                ? "Fracture Detected"
                                : "Normal"
                        )}>
                            Override
                        </button>

                        {/* 🔥 NEW: Feedback */}
                        <button onClick={() => handleFeedback(
                            result.diagnosis === "Normal"
                                ? "Fracture Detected"
                                : "Normal"
                        )}>
                            Mark Incorrect
                        </button>

                    </div>

                    {explanation && (
                        <div className="explanation-box">
                            <h3>Clinical Insights</h3>
                            <p>{explanation.explanation}</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default Doctor;
