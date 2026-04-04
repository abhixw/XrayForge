import { useState, useRef, useEffect } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export default function Doctor() {
    const [activeTab, setActiveTab] = useState('analyze');

    const [patients, setPatients] = useState([]);
    const [selectedPatientId, setSelectedPatientId] = useState('');
    const [selectedPatientName, setSelectedPatientName] = useState('');

    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [notes, setNotes] = useState('');

    const [stats, setStats] = useState({
        total_cases: 0,
        fractures_detected: 0,
        model_accuracy: 0,
        feedback_records: 0,
    });

    const fileInputRef = useRef(null);

    // Load data when page opens
    useEffect(() => {
        fetchStats();
        fetchPatients();
    }, []);

    const fetchStats = async () => {
        try {
            const token = localStorage.getItem('token');
            const resp = await fetch(`${API_BASE_URL}/api/stats`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (resp.ok) {
                const data = await resp.json();
                setStats(data);
            }
        } catch (err) {
            console.error('Stats fetch failed');
        }
    };

    const fetchPatients = async () => {
        try {
            const token = localStorage.getItem('token');
            const resp = await fetch(`${API_BASE_URL}/api/admin/patients`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (resp.ok) {
                const data = await resp.json();
                setPatients(data);
            }
        } catch (err) {
            console.error('Failed to load patients');
        }
    };

    const handlePatientSelect = (e) => {
        const patientId = e.target.value;
        setSelectedPatientId(patientId);

        const patient = patients.find(p => p.patient_id === patientId);
        if (patient) {
            setSelectedPatientName(patient.name);
        }
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            const selected = e.target.files[0];
            setFile(selected);
            setPreview(URL.createObjectURL(selected));
            setResult(null);
            setNotes('');
        }
    };

    const handleUpload = async () => {
        if (!file || !selectedPatientId) {
            alert("Please select a patient first");
            return;
        }

        setLoading(true);
        setResult(null);

        const formData = new FormData();
        formData.append('file', file);
        formData.append('patient_name', selectedPatientName);
        formData.append('patient_id', selectedPatientId);

        try {
            const token = localStorage.getItem('token');
            const resp = await fetch(`${API_BASE_URL}/api/predict`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
                body: formData
            });

            const data = await resp.json();
            setResult(data);
        } catch (err) {
            alert('Error uploading X-ray');
        } finally {
            setLoading(false);
        }
    };

    const isFracture = result?.diagnosis === 'Fracture Detected';

    const handleApprove = () => alert("✅ Case Approved!");
    const handleOverride = () => alert("↔ Diagnosis Overridden!");
    const handleMarkIncorrect = () => alert("✖ Feedback saved! Thank you for improving the model.");

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Space+Grotesk:wght@400;500;600;700&display=swap');
                * { box-sizing: border-box; margin: 0; padding: 0; }
                body { font-family: 'DM Sans', sans-serif; background: #f8fafc; color: #1a2236; }

                .doctor-layout { display: flex; min-height: 100vh; }
                .sidebar { width: 260px; background: #0f172a; color: white; padding: 28px 20px; position: fixed; height: 100vh; }
                .logo { display: flex; align-items: center; gap: 12px; margin-bottom: 50px; }
                .logo-icon { width: 48px; height: 48px; background: linear-gradient(135deg, #1a6fd4, #2d9e5f); border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 24px; }
                .logo-text { font-family: 'Space Grotesk', sans-serif; font-weight: 700; font-size: 22px; }

                .nav-item { 
                    padding: 14px 18px; margin-bottom: 8px; border-radius: 10px; 
                    display: flex; align-items: center; gap: 12px; font-size: 15px; 
                    cursor: pointer; transition: 0.2s;
                }
                .nav-item:hover { background: rgba(255,255,255,0.1); }
                .nav-item.active { background: rgba(26,111,212,0.25); color: #60a5fa; font-weight: 500; }

                .main-content { margin-left: 260px; flex: 1; padding: 40px; }
                .top-bar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px; }
                .page-title { font-family: 'Space Grotesk', sans-serif; font-size: 28px; font-weight: 700; }

                .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 20px; margin-bottom: 40px; }
                .stat-card { background: white; border-radius: 16px; padding: 24px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); border: 1px solid #e2e8f2; }
                .stat-value { font-size: 32px; font-weight: 700; }
                .stat-label { font-size: 13px; color: #64748b; margin-top: 4px; }

                .analyze-card { background: white; border-radius: 16px; padding: 32px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); }
                .tabs { display: flex; border-bottom: 2px solid #e2e8f2; margin-bottom: 24px; }
                .tab { padding: 12px 28px; font-weight: 600; cursor: pointer; border-bottom: 3px solid transparent; }
                .tab.active { border-bottom: 3px solid #1a6fd4; color: #1a6fd4; }

                .field-label { font-size: 12px; font-weight: 600; color: #64748b; margin-bottom: 8px; }
                select, .field-input { width: 100%; padding: 14px 16px; border: 1px solid #e2e8f2; border-radius: 10px; font-size: 15px; }

                .upload-zone { 
                    border: 2px dashed #cbd5e1; border-radius: 16px; height: 260px; 
                    display: flex; flex-direction: column; align-items: center; justify-content: center; 
                    cursor: pointer; margin: 24px 0; 
                }
                .upload-zone:hover { border-color: #1a6fd4; }

                .result-section { margin-top: 30px; padding: 24px; background: #f8fafc; border-radius: 16px; }
                .diagnosis-badge { padding: 10px 24px; border-radius: 30px; font-weight: 700; font-size: 19px; display: inline-block; margin-bottom: 16px; }
                .badge-fracture { background: #fee2e2; color: #ef4444; }
                .badge-normal { background: #ecfdf5; color: #10b981; }

                .action-buttons { display: flex; gap: 12px; margin-top: 24px; }
                .btn { padding: 14px 28px; border: none; border-radius: 12px; font-weight: 600; cursor: pointer; font-size: 15px; }
                .btn-approve { background: #10b981; color: white; }
                .btn-override { background: #f59e0b; color: white; }
                .btn-incorrect { background: #ef4444; color: white; }
            `}</style>

            <div className="doctor-layout">

                {/* Sidebar */}
                <div className="sidebar">
                    <div className="logo">
                        <div className="logo-icon">🩻</div>
                        <div className="logo-text">FractureAI</div>
                    </div>
                    <div className="nav-item active"><span>🏠</span> Dashboard</div>
                    <div className="nav-item"><span>🔬</span> Analyze X-Ray</div>
                    <div className="nav-item"><span>📋</span> All Cases</div>
                    <div className="nav-item"><span>📊</span> Analytics</div>
                </div>

                {/* Main Content */}
                <div className="main-content">
                    <div className="top-bar">
                        <div>
                            <div className="page-title">Physician Dashboard</div>
                            <div className="page-sub">
                                {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                            </div>
                        </div>
                        <button
                            className="btn"
                            style={{ background: '#1a6fd4', color: 'white', padding: '12px 24px', borderRadius: '12px' }}
                            onClick={() => { setFile(null); setPreview(null); setResult(null); setSelectedPatientId(''); }}
                        >
                            + New Analysis
                        </button>
                    </div>

                    {/* Stats */}
                    <div className="stats-grid">
                        <div className="stat-card"><div className="stat-value">{stats.total_cases}</div><div className="stat-label">X-RAYS ANALYZED</div></div>
                        <div className="stat-card"><div className="stat-value">{stats.fractures_detected}</div><div className="stat-label">FRACTURES DETECTED</div></div>
                        <div className="stat-card"><div className="stat-value">{stats.model_accuracy}%</div><div className="stat-label">MODEL ACCURACY</div></div>
                        <div className="stat-card"><div className="stat-value">{stats.feedback_records}</div><div className="stat-label">FEEDBACK RECORDS</div></div>
                    </div>

                    {/* Analyze Section */}
                    <div className="analyze-card">
                        <div className="tabs">
                            <div className={`tab ${activeTab === 'analyze' ? 'active' : ''}`} onClick={() => setActiveTab('analyze')}>Analyze X-Ray</div>
                            <div className={`tab ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>Case History</div>
                        </div>

                        {activeTab === 'analyze' && (
                            <div>
                                <div className="field-label">Select Patient</div>
                                <select
                                    className="field-input"
                                    value={selectedPatientId}
                                    onChange={handlePatientSelect}
                                >
                                    <option value="">-- Select Patient from Hospital List --</option>
                                    {patients.map(p => (
                                        <option key={p.patient_id} value={p.patient_id}>
                                            {p.name} — {p.patient_id}
                                        </option>
                                    ))}
                                </select>

                                <div className="upload-zone" onClick={() => fileInputRef.current?.click()}>
                                    <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
                                    {preview ? (
                                        <img src={preview} alt="preview" style={{ maxHeight: '200px', borderRadius: '12px' }} />
                                    ) : (
                                        <>
                                            <div style={{ fontSize: '60px', marginBottom: '16px' }}>🩻</div>
                                            <div style={{ fontSize: '18px', fontWeight: '600' }}>Drop X-Ray image here</div>
                                        </>
                                    )}
                                </div>

                                <button
                                    className="btn-primary"
                                    onClick={handleUpload}
                                    disabled={!file || loading || !selectedPatientId}
                                >
                                    {loading ? 'Analyzing...' : 'Analyze X-Ray'}
                                </button>

                                {result && (
                                    <div className="result-section">
                                        <div className="diagnosis-badge" style={{ background: isFracture ? '#fee2e2' : '#ecfdf5', color: isFracture ? '#ef4444' : '#10b981' }}>
                                            {isFracture ? '🦴 Fracture Detected' : '✓ Normal'}
                                        </div>

                                        <p style={{ margin: '16px 0', fontSize: '18px' }}>
                                            Confidence: <strong>{(result.probability * 100).toFixed(1)}%</strong>
                                        </p>

                                        {result.heatmap_base64 && (
                                            <img src={result.heatmap_base64} alt="Heatmap" style={{ width: '100%', borderRadius: '12px', marginBottom: '20px' }} />
                                        )}

                                        <div className="field-label">Doctor Notes</div>
                                        <textarea
                                            className="field-input"
                                            rows="3"
                                            placeholder="Add your observations..."
                                            value={notes}
                                            onChange={(e) => setNotes(e.target.value)}
                                        />

                                        <div className="action-buttons">
                                            <button className="btn btn-approve" onClick={handleApprove}>✔ Approve</button>
                                            <button className="btn btn-override" onClick={handleOverride}>↔ Override</button>
                                            <button className="btn btn-incorrect" onClick={handleMarkIncorrect}>✖ Mark Incorrect</button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}