import { useState } from 'react';
import ThemeToggle from '../components/ThemeToggle';

function Doctor() {
    const [view, setView] = useState('analyze'); // 'analyze' or 'history'
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [explanation, setExplanation] = useState(null);
    const [explaining, setExplaining] = useState(false);
    const [shareLink, setShareLink] = useState("");

    // Patient details
    const [patientName, setPatientName] = useState("");
    const [patientId, setPatientId] = useState("");
    const [notes, setNotes] = useState("");

    // Case history states
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
            // Clear inputs
            setPatientName("");
            setPatientId("");

            const link = `${window.location.origin}/patient/${data.case_id}`;
            setShareLink(link);
            handleExplain(data.probability, data.diagnosis, data.risk_level);
        } catch (err) {
            console.error(err);
            alert("Error contacting the CNN prediction API.");
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

    const handleOverride = async (newLabel) => {
        if (!result?.case_id) return;
        try {
            const resp = await fetch(`${API_BASE_URL}/api/override/${result.case_id}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ label: newLabel, notes }),
            });
            if (resp.ok) {
                setResult({ ...result, diagnosis: newLabel, isValidated: true, doctor_notes: notes });
            }
        } catch (err) {
            console.error(err);
        }
    };

    const copyLink = () => {
        navigator.clipboard.writeText(shareLink);
        alert("Patient link copied to clipboard!");
    };

    const fetchCases = async () => {
        try {
            const resp = await fetch(`${API_BASE_URL}/api/cases`);
            const data = await resp.json();
            setCases(data);
        } catch (err) {
            console.error("Error fetching history:", err);
        }
    };

    const loadCase = (caseData) => {
        setResult(caseData);
        setPreview(null);
        setShareLink(`${window.location.origin}/patient/${caseData.case_id}`);
        setView('analyze');
        setExplanation(null);
        setNotes(caseData.doctor_notes || "");
    };

    const filteredCases = cases.filter(c => {
        const matchesSearch =
            c.case_id.toLowerCase().includes(search.toLowerCase()) ||
            c.patient_name.toLowerCase().includes(search.toLowerCase());
        const matchesFilter =
            filter === 'all' ||
            (filter === 'fracture' && c.diagnosis === 'Fracture Detected') ||
            (filter === 'normal' && c.diagnosis === 'Normal') ||
            (filter === 'overridden' && c.approved);
        return matchesSearch && matchesFilter;
    });

    return (
        <div className="doctor-page">
            <ThemeToggle />
            <header className="header">
                <h1>⚕️ Physician Dashboard</h1>
                <div className="nav-tabs">
                    <button className={view === 'analyze' ? 'active' : ''} onClick={() => setView('analyze')}>New Analysis</button>
                    <button className={view === 'history' ? 'active' : ''} onClick={() => { setView('history'); fetchCases(); }}>Case History</button>
                    <button className={view === 'analytics' ? 'active' : ''} onClick={() => { setView('analytics'); fetchCases(); }}>Analytics</button>
                </div>
            </header>

            <main className="main-content">
                {view === 'analytics' && (
                    <div className="analytics-dashboard">
                        <div className="stats-grid">
                            <div className="stat-card">
                                <span className="stat-label">Total Cases</span>
                                <span className="stat-val">{cases.length}</span>
                            </div>
                            <div className="stat-card">
                                <span className="stat-label">Fracture Rate</span>
                                <span className="stat-val">
                                    {cases.length > 0 ? ((cases.filter(c => c.diagnosis === 'Fracture Detected').length / cases.length) * 100).toFixed(1) : 0}%
                                </span>
                            </div>
                            <div className="stat-card">
                                <span className="stat-label">Override Rate</span>
                                <span className="stat-val">
                                    {cases.length > 0 ? ((cases.filter(c => c.initial_prediction !== c.diagnosis).length / cases.length) * 100).toFixed(1) : 0}%
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                {view === 'analyze' ? (
                    <>
                        {result && (
                            <div className="timeline-container">
                                <div className="timeline-step done"><span>Uploaded</span></div>
                                <div className="timeline-step done"><span>AI Analyzed</span></div>
                                <div className={`timeline-step ${result.isValidated ? 'done' : 'current'}`}><span>Reviewed</span></div>
                                <div className={`timeline-step ${result.isValidated ? 'done' : ''}`}><span>Validated</span></div>
                            </div>
                        )}
                        <div className="patient-info-inputs">
                            <input
                                type="text"
                                placeholder="Patient Name"
                                value={patientName}
                                onChange={(e) => setPatientName(e.target.value)}
                            />
                            <input
                                type="text"
                                placeholder="Patient ID (e.g. PX-99)"
                                value={patientId}
                                onChange={(e) => setPatientId(e.target.value)}
                            />
                        </div>
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
                                        {preview ? <img src={preview} alt="Original" /> : <p className="no-preview">Historical data (Image not stored locally)</p>}
                                    </div>
                                    <div className="image-card">
                                        <h3>Grad-CAM Explainability</h3>
                                        <img src={result.heatmap_base64} alt="Heatmap" />
                                        <div className="heatmap-legend">
                                            <div className="legend-item"><span className="dot hot"></span> Primary Focus</div>
                                            <div className="legend-item"><span className="dot mid"></span> Supporting Region</div>
                                            <div className="legend-item"><span className="dot cold"></span> Minimal Significance</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="diagnosis-panel">
                                    <div className="panel-header">
                                        <h2>Diagnostic Result</h2>
                                        {result.isValidated && <span className="verified-badge">✓ Doctor Verified</span>}
                                    </div>
                                    <div className={`diagnosis-badge ${result.diagnosis === 'Normal' ? 'normal' : 'fracture'}`}>
                                        {result.diagnosis}
                                    </div>

                                    {result.initial_prediction && result.initial_prediction !== result.diagnosis && (
                                        <div className="override-track">
                                            <span>🤖 AI: {result.initial_prediction}</span>
                                            <span className="arrow">→</span>
                                            <span>👨‍⚕️ MD: {result.diagnosis}</span>
                                        </div>
                                    )}

                                    <p>Fracture Probability: {(result.probability * 100).toFixed(1)}%</p>

                                    <div className="notes-section">
                                        <h4>Physician Notes (Optional)</h4>
                                        <textarea
                                            placeholder="Add clinical observations, recommendations, or follow-up instructions..."
                                            value={notes}
                                            onChange={(e) => setNotes(e.target.value)}
                                            className="notes-area"
                                        />
                                    </div>

                                    <div className="validation-controls">
                                        <button className="v-btn approve" onClick={() => handleOverride(result.diagnosis)}>Approve</button>
                                        <button className="v-btn correct" onClick={() => handleOverride(result.diagnosis === 'Normal' ? 'Fracture Detected' : 'Normal')}>Override</button>
                                    </div>

                                    {shareLink && (
                                        <div className="share-box">
                                            <p>Share with patient:</p>
                                            <div className="link-container">
                                                <input type="text" readOnly value={shareLink} />
                                                <button onClick={copyLink}>Copy</button>
                                            </div>
                                        </div>
                                    )}

                                    <div className="risk-meter">
                                        <h4>Recovery Risk: {result.risk_level} ({result.risk_score}/100)</h4>
                                        <div className="progress-bar">
                                            <div className="progress-fill" style={{ width: `${result.risk_score}%` }}></div>
                                        </div>
                                    </div>

                                    {explaining && <p className="loading-text">Generating Explanation...</p>}
                                    {explanation && (
                                        <div className="explanation-box">
                                            <h3>Clinical Insights</h3>
                                            <p className="exp-text">{explanation.explanation}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="history-section">
                        <div className="history-filters">
                            <input type="text" placeholder="Search by ID..." value={search} onChange={(e) => setSearch(e.target.value)} className="search-input" />
                            <select value={filter} onChange={(e) => setFilter(e.target.value)} className="filter-select">
                                <option value="all">All</option>
                                <option value="fracture">Fractures</option>
                                <option value="normal">Normal</option>
                                <option value="overridden">Overridden</option>
                            </select>
                        </div>
                        <div className="history-table-container">
                            <table className="history-table">
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Patient</th>
                                        <th>Case ID</th>
                                        <th>AI Result</th>
                                        <th>Status</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredCases.map((c) => (
                                        <tr key={c.case_id}>
                                            <td>{c.timestamp}</td>
                                            <td><strong>{c.patient_name}</strong></td>
                                            <td>{c.case_id.substring(0, 8)}...</td>
                                            <td><span className={`status-small ${c.diagnosis === 'Normal' ? 'normal' : 'fracture'}`}>{c.diagnosis}</span></td>
                                            <td>
                                                <div className="status-flags">
                                                    {c.approved ? (
                                                        <span className="badge-verified">Verified</span>
                                                    ) : (
                                                        <span className="pending-small">AI Only</span>
                                                    )}
                                                    {c.initial_prediction && c.initial_prediction !== c.diagnosis && <span className="flag-icon" title="Overridden">⚖️</span>}
                                                    {!c.approved && c.probability < 0.6 && <span className="flag-icon" title="Low Confidence">⚠️</span>}
                                                </div>
                                            </td>

                                            <td><button className="view-link-btn" onClick={() => loadCase(c)}>Explore</button></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

export default Doctor;
