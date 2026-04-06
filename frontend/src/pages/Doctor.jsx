import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export default function Doctor() {
    const navigate = useNavigate();
    const [activeNav, setActiveNav] = useState('dashboard');
    const [activeTab, setActiveTab] = useState('analyze');

    const [patients, setPatients] = useState([]);
    const [selectedPatientId, setSelectedPatientId] = useState('');
    const [selectedPatientName, setSelectedPatientName] = useState('');

    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [notes, setNotes] = useState('');
    const [explanation, setExplanation] = useState('');
    const [explainLoading, setExplainLoading] = useState(false);
    const [actionMsg, setActionMsg] = useState('');

    // All Cases
    const [cases, setCases] = useState([]);
    const [casesLoading, setCasesLoading] = useState(false);

    // Analytics
    const [stats, setStats] = useState({
        total_cases: 0,
        fractures_detected: 0,
        model_accuracy: 0,
        feedback_records: 0,
    });

    const fileInputRef = useRef(null);
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    useEffect(() => {
        if (!token || user.role !== 'doctor') {
            navigate('/login');
            return;
        }
        fetchStats();
        fetchPatients();
    }, []);

    const fetchStats = async () => {
        try {
            const resp = await fetch(`${API_BASE_URL}/api/stats`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (resp.ok) setStats(await resp.json());
        } catch (err) { console.error('Stats fetch failed'); }
    };

    const fetchPatients = async () => {
        try {
            const resp = await fetch(`${API_BASE_URL}/api/admin/patients`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (resp.ok) setPatients(await resp.json());
        } catch (err) { console.error('Failed to load patients'); }
    };

    const fetchCases = async () => {
        setCasesLoading(true);
        try {
            const resp = await fetch(`${API_BASE_URL}/api/cases`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (resp.ok) setCases(await resp.json());
        } catch (err) { console.error('Failed to load cases'); }
        finally { setCasesLoading(false); }
    };

    const handleNavClick = (nav) => {
        setActiveNav(nav);
        if (nav === 'cases') fetchCases();
        if (nav === 'analytics') fetchStats();
    };

    const handlePatientSelect = (e) => {
        const patientId = e.target.value;
        setSelectedPatientId(patientId);
        const patient = patients.find(p => p.patient_id === patientId);
        if (patient) setSelectedPatientName(patient.name);
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            const selected = e.target.files[0];
            setFile(selected);
            setPreview(URL.createObjectURL(selected));
            setResult(null);
            setNotes('');
            setExplanation('');
            setActionMsg('');
        }
    };

    const handleUpload = async () => {
        if (!file) { alert("Please select an X-ray image"); return; }
        if (!selectedPatientId) { alert("Please select a patient first"); return; }

        setLoading(true);
        setResult(null);
        setExplanation('');
        setActionMsg('');

        const formData = new FormData();
        formData.append('file', file);
        formData.append('patient_id', selectedPatientId);

        try {
            const resp = await fetch(`${API_BASE_URL}/api/predict`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
                body: formData
            });
            const data = await resp.json();
            if (resp.ok) {
                setResult(data);
                fetchStats();
                // Auto-fetch clinical explanation
                fetchExplanation(data);
            } else {
                alert(data.detail || 'Prediction failed');
            }
        } catch (err) {
            alert('Error uploading X-ray. Is the backend running?');
        } finally {
            setLoading(false);
        }
    };

    const fetchExplanation = async (data) => {
        setExplainLoading(true);
        try {
            const resp = await fetch(`${API_BASE_URL}/api/explain`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    diagnosis: data.diagnosis,
                    probability: data.probability,
                    risk_level: data.risk_level || 'Low'
                })
            });
            if (resp.ok) {
                const d = await resp.json();
                setExplanation(d.explanation);
            }
        } catch (err) { console.error('Explanation failed'); }
        finally { setExplainLoading(false); }
    };

    const handleApprove = async () => {
        if (!result?.case_id) return;

        try {
            const resp = await fetch(`${API_BASE_URL}/api/approve/${result.case_id}`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` }
            });

            if (resp.ok) {
                setActionMsg('✅ Case approved successfully!');
                fetchStats();
            }
        } catch (err) {
            setActionMsg('Error approving case');
        }
    };

    const handleOverride = async () => {
        if (!result?.case_id) return;
        const newLabel = result.diagnosis === 'Fracture Detected' ? 'Normal' : 'Fracture Detected';
        try {
            const resp = await fetch(`${API_BASE_URL}/api/override/${result.case_id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ label: newLabel, notes })
            });
            if (resp.ok) {
                setResult(prev => ({ ...prev, diagnosis: newLabel })); // 🔥 important
                setActionMsg(`↔ Overridden to: ${newLabel}`);
                fetchStats();
            }
        } catch (err) { setActionMsg('Error overriding case'); }
    };

    const handleMarkIncorrect = async () => {
        if (!result?.case_id) return;
        try {
            const resp = await fetch(`${API_BASE_URL}/api/feedback`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    case_id: result.case_id,
                    model_prediction: result.diagnosis,
                    correct_label: result.diagnosis === 'Fracture Detected' ? 'Normal' : 'Fracture Detected',
                    confidence: result.probability,
                    image_path: result.image_path || ''
                })
            });
            if (resp.ok) { setActionMsg('✖ Feedback saved! Model will improve.'); fetchStats(); }
        } catch (err) { setActionMsg('Error saving feedback'); }
    };

    const logout = () => { localStorage.clear(); navigate('/login'); };

    const isFracture = result?.diagnosis === 'Fracture Detected';

    const navItems = [
        { id: 'dashboard', icon: '🏠', label: 'Dashboard' },
        { id: 'analyze', icon: '🔬', label: 'Analyze X-Ray' },
        { id: 'cases', icon: '📋', label: 'All Cases' },
        { id: 'analytics', icon: '📊', label: 'Analytics' },
    ];

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Space+Grotesk:wght@400;500;600;700&display=swap');
                * { box-sizing: border-box; margin: 0; padding: 0; }
                body { font-family: 'DM Sans', sans-serif; background: #f8fafc; color: #1a2236; }
                .doctor-layout { display: flex; min-height: 100vh; }
                .sidebar { width: 260px; background: #0f172a; color: white; padding: 28px 20px; position: fixed; height: 100vh; display: flex; flex-direction: column; }
                .logo { display: flex; align-items: center; gap: 12px; margin-bottom: 50px; }
                .logo-icon { width: 48px; height: 48px; background: linear-gradient(135deg, #1a6fd4, #2d9e5f); border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 24px; }
                .logo-text { font-family: 'Space Grotesk', sans-serif; font-weight: 700; font-size: 22px; }
                .nav-item { padding: 14px 18px; margin-bottom: 8px; border-radius: 10px; display: flex; align-items: center; gap: 12px; font-size: 15px; cursor: pointer; transition: 0.2s; color: rgba(255,255,255,0.7); }
                .nav-item:hover { background: rgba(255,255,255,0.1); color: white; }
                .nav-item.active { background: rgba(26,111,212,0.25); color: #60a5fa; font-weight: 500; }
                .logout-btn { margin-top: auto; padding: 12px 16px; border-radius: 10px; display: flex; align-items: center; gap: 12px; font-size: 14px; cursor: pointer; color: rgba(255,255,255,0.5); background: transparent; border: none; width: 100%; transition: 0.2s; }
                .logout-btn:hover { background: rgba(239,68,68,0.2); color: #fca5a5; }
                .main-content { margin-left: 260px; flex: 1; padding: 40px; }
                .top-bar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px; }
                .page-title { font-family: 'Space Grotesk', sans-serif; font-size: 28px; font-weight: 700; }
                .page-sub { color: #64748b; font-size: 14px; margin-top: 4px; }
                .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 32px; }
                .stat-card { background: white; border-radius: 16px; padding: 24px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); border: 1px solid #e2e8f2; }
                .stat-value { font-family: 'Space Grotesk', sans-serif; font-size: 32px; font-weight: 700; }
                .stat-label { font-size: 12px; color: #64748b; margin-top: 4px; letter-spacing: 0.5px; }
                .card { background: white; border-radius: 16px; padding: 32px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); margin-bottom: 24px; }
                .tabs { display: flex; border-bottom: 2px solid #e2e8f2; margin-bottom: 24px; }
                .tab { padding: 12px 28px; font-weight: 600; cursor: pointer; border-bottom: 3px solid transparent; color: #64748b; transition: 0.2s; }
                .tab.active { border-bottom: 3px solid #1a6fd4; color: #1a6fd4; }
                .field-label { font-size: 12px; font-weight: 600; color: #64748b; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px; }
                select, textarea { width: 100%; padding: 14px 16px; border: 1px solid #e2e8f2; border-radius: 10px; font-size: 15px; font-family: 'DM Sans', sans-serif; outline: none; background: white; }
                select:focus, textarea:focus { border-color: #1a6fd4; box-shadow: 0 0 0 3px rgba(26,111,212,0.1); }
                .upload-zone { border: 2px dashed #cbd5e1; border-radius: 16px; min-height: 220px; display: flex; flex-direction: column; align-items: center; justify-content: center; cursor: pointer; margin: 20px 0; transition: 0.2s; }
                .upload-zone:hover { border-color: #1a6fd4; background: #f0f7ff; }
                .result-section { margin-top: 28px; padding: 24px; background: #f8fafc; border-radius: 16px; border: 1px solid #e2e8f2; }
                .diagnosis-badge { padding: 10px 24px; border-radius: 30px; font-weight: 700; font-size: 18px; display: inline-block; margin-bottom: 16px; }
                .action-buttons { display: flex; gap: 12px; margin-top: 20px; flex-wrap: wrap; }
                .btn { padding: 13px 24px; border: none; border-radius: 12px; font-weight: 600; cursor: pointer; font-size: 14px; transition: 0.2s; }
                .btn-primary { background: #1a6fd4; color: white; }
                .btn-primary:hover { background: #1558b0; }
                .btn-primary:disabled { background: #cbd5e1; cursor: not-allowed; }
                .btn-approve { background: #10b981; color: white; }
                .btn-approve:hover { background: #059669; }
                .btn-override { background: #f59e0b; color: white; }
                .btn-override:hover { background: #d97706; }
                .btn-incorrect { background: #ef4444; color: white; }
                .btn-incorrect:hover { background: #dc2626; }
                table { width: 100%; border-collapse: collapse; }
                th { padding: 12px 16px; text-align: left; background: #f8fafc; font-size: 12px; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
                td { padding: 14px 16px; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
                tr:last-child td { border-bottom: none; }
                tr:hover td { background: #fafbfc; }
                .badge { display: inline-block; padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: 600; }
                .badge-fracture { background: #fee2e2; color: #dc2626; }
                .badge-normal { background: #dcfce7; color: #16a34a; }
                .badge-approved { background: #dbeafe; color: #1d4ed8; }
                .badge-pending { background: #fef9c3; color: #854d0e; }
                .empty-state { text-align: center; padding: 60px 20px; color: #94a3b8; }
                .progress-bar { height: 8px; background: #f1f5f9; border-radius: 4px; overflow: hidden; margin-top: 8px; }
                .progress-fill { height: 100%; border-radius: 4px; }
                .action-msg { margin-top: 16px; padding: 12px 16px; border-radius: 10px; background: #f0fdf4; color: #15803d; font-weight: 500; border: 1px solid #bbf7d0; }
            `}</style>

            <div className="doctor-layout">
                {/* Sidebar */}
                <div className="sidebar">
                    <div className="logo">
                        <div className="logo-icon">🩻</div>
                        <div className="logo-text">FractureAI</div>
                    </div>
                    {navItems.map(item => (
                        <div
                            key={item.id}
                            className={`nav-item ${activeNav === item.id ? 'active' : ''}`}
                            onClick={() => handleNavClick(item.id)}
                        >
                            <span>{item.icon}</span> {item.label}
                        </div>
                    ))}
                    <button className="logout-btn" onClick={logout}>
                        <span>🚪</span> Logout
                    </button>
                </div>

                {/* Main Content */}
                <div className="main-content">

                    {/* ── DASHBOARD ── */}
                    {activeNav === 'dashboard' && (
                        <>
                            <div className="top-bar">
                                <div>
                                    <div className="page-title">Physician Dashboard</div>
                                    <div className="page-sub">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
                                </div>
                                <button className="btn btn-primary" onClick={() => handleNavClick('analyze')}>+ New Analysis</button>
                            </div>
                            <div className="stats-grid">
                                <div className="stat-card" style={{ borderTop: '4px solid #1a6fd4' }}>
                                    <div className="stat-value" style={{ color: '#1a6fd4' }}>{stats.total_cases}</div>
                                    <div className="stat-label">X-RAYS ANALYZED</div>
                                </div>
                                <div className="stat-card" style={{ borderTop: '4px solid #ef4444' }}>
                                    <div className="stat-value" style={{ color: '#ef4444' }}>{stats.fractures_detected}</div>
                                    <div className="stat-label">FRACTURES DETECTED</div>
                                </div>
                                <div className="stat-card" style={{ borderTop: '4px solid #10b981' }}>
                                    <div className="stat-value" style={{ color: '#10b981' }}>{stats.model_accuracy}%</div>
                                    <div className="stat-label">MODEL ACCURACY</div>
                                </div>
                                <div className="stat-card" style={{ borderTop: '4px solid #f59e0b' }}>
                                    <div className="stat-value" style={{ color: '#f59e0b' }}>{stats.feedback_records}</div>
                                    <div className="stat-label">FEEDBACK RECORDS</div>
                                </div>
                            </div>
                            <div className="card">
                                <h2 style={{ fontFamily: 'Space Grotesk', fontSize: '18px', marginBottom: '8px' }}>Quick Actions</h2>
                                <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                                    <button className="btn btn-primary" onClick={() => handleNavClick('analyze')}>🔬 Analyze X-Ray</button>
                                    <button className="btn" style={{ background: '#f1f5f9', color: '#1a2236' }} onClick={() => handleNavClick('cases')}>📋 View All Cases</button>
                                    <button className="btn" style={{ background: '#f1f5f9', color: '#1a2236' }} onClick={() => handleNavClick('analytics')}>📊 View Analytics</button>
                                </div>
                            </div>
                        </>
                    )}

                    {/* ── ANALYZE X-RAY ── */}
                    {(activeNav === 'analyze' || activeNav === 'dashboard') && activeNav === 'analyze' && (
                        <div className="card">
                            <div className="page-title" style={{ marginBottom: '24px' }}>Analyze X-Ray</div>

                            <div className="field-label">Select Patient</div>
                            <select value={selectedPatientId} onChange={handlePatientSelect}>
                                <option value="">-- Select Patient from Hospital List --</option>
                                {patients.map(p => (
                                    <option key={p.patient_id} value={p.patient_id}>
                                        {p.name} — {p.patient_id}
                                    </option>
                                ))}
                            </select>

                            <div className="upload-zone" style={{ marginTop: '20px' }} onClick={() => fileInputRef.current?.click()}>
                                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
                                {preview ? (
                                    <img src={preview} alt="preview" style={{ maxHeight: '200px', borderRadius: '12px' }} />
                                ) : (
                                    <>
                                        <div style={{ fontSize: '56px', marginBottom: '12px' }}>🩻</div>
                                        <div style={{ fontSize: '17px', fontWeight: '600', color: '#475569' }}>Click to upload X-Ray image</div>
                                        <div style={{ fontSize: '13px', color: '#94a3b8', marginTop: '6px' }}>PNG, JPG supported</div>
                                    </>
                                )}
                            </div>

                            <button
                                className="btn btn-primary"
                                onClick={handleUpload}
                                disabled={!file || loading || !selectedPatientId}
                                style={{ width: '100%', padding: '16px', fontSize: '16px', marginTop: '4px' }}
                            >
                                {loading ? '⏳ Analyzing...' : '🔬 Analyze X-Ray'}
                            </button>

                            {result && (
                                <div className="result-section">
                                    <span className="diagnosis-badge" style={{ background: isFracture ? '#fee2e2' : '#ecfdf5', color: isFracture ? '#ef4444' : '#10b981' }}>
                                        {isFracture ? '🦴 Fracture Detected' : '✓ Normal — No Fracture'}
                                    </span>

                                    <p style={{ fontSize: '16px', marginBottom: '8px' }}>
                                        Confidence: <strong>
                                            {result.probability != null
                                                ? `${(result.probability * 100).toFixed(1)}%`
                                                : 'N/A'}
                                        </strong>
                                        &nbsp;&nbsp;|&nbsp;&nbsp;
                                        Risk: <strong style={{ color: result.risk_level === 'High' ? '#ef4444' : result.risk_level === 'Moderate' ? '#f59e0b' : '#10b981' }}>{result.risk_level || 'Low'}</strong>
                                    </p>

                                    {result.heatmap_base64 && (
                                        <img src={result.heatmap_base64} alt="Grad-CAM Heatmap" style={{ width: '100%', borderRadius: '12px', margin: '16px 0' }} />
                                    )}

                                    {explanation && (
                                        <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '12px', padding: '16px', marginBottom: '16px' }}>
                                            <div style={{ fontSize: '12px', fontWeight: '600', color: '#1d4ed8', marginBottom: '8px' }}>🤖 AI CLINICAL INSIGHTS</div>
                                            <p style={{ fontSize: '14px', lineHeight: '1.7', color: '#1e3a5f' }}>{explanation}</p>
                                        </div>
                                    )}
                                    {explainLoading && <p style={{ color: '#64748b', fontSize: '14px' }}>Loading clinical insights...</p>}

                                    <div className="field-label" style={{ marginTop: '16px' }}>Doctor Notes</div>
                                    <textarea rows="3" placeholder="Add your observations..." value={notes} onChange={(e) => setNotes(e.target.value)} />

                                    <div className="action-buttons">
                                        <button className="btn btn-approve" onClick={handleApprove}>✔ Approve</button>
                                        <button className="btn btn-override" onClick={handleOverride}>↔ Override</button>
                                        <button className="btn btn-incorrect" onClick={handleMarkIncorrect}>✖ Mark Incorrect</button>
                                    </div>

                                    {actionMsg && <div className="action-msg">{actionMsg}</div>}
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── ALL CASES ── */}
                    {activeNav === 'cases' && (
                        <>
                            <div className="page-title" style={{ marginBottom: '24px' }}>All Cases</div>
                            <div className="card" style={{ padding: '0' }}>
                                {casesLoading ? (
                                    <div className="empty-state">⏳ Loading cases...</div>
                                ) : cases.length === 0 ? (
                                    <div className="empty-state">
                                        <div style={{ fontSize: '48px', marginBottom: '12px' }}>📋</div>
                                        <p>No cases found. Analyze an X-ray to get started.</p>
                                    </div>
                                ) : (
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>Patient</th>
                                                <th>Patient ID</th>
                                                <th>Prediction</th>
                                                <th>Confidence</th>
                                                <th>Risk</th>
                                                <th>Status</th>
                                                <th>Date</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {cases.map(c => (
                                                <tr key={c.id}>
                                                    <td style={{ fontWeight: '500' }}>{c.patient_name || '—'}</td>
                                                    <td><span style={{ fontFamily: 'monospace', background: '#f1f5f9', padding: '3px 8px', borderRadius: '5px', fontSize: '13px' }}>{c.patient_id || '—'}</span></td>
                                                    <td><span className={`badge ${c.prediction?.toLowerCase().includes('fracture') ? 'badge-fracture' : 'badge-normal'}`}>{c.prediction || '—'}</span></td>
                                                    <td>
                                                        {c.confidence != null
                                                            ? `${(c.confidence * 100).toFixed(1)}%`
                                                            : '—'}
                                                    </td>
                                                    <td style={{ color: c.risk_level === 'High' ? '#ef4444' : c.risk_level === 'Moderate' ? '#f59e0b' : '#10b981', fontWeight: '500' }}>{c.risk_level || '—'}</td>
                                                    <td><span className={`badge ${c.approved ? 'badge-approved' : 'badge-pending'}`}>{c.approved ? 'Approved' : 'Pending'}</span></td>
                                                    <td style={{ color: '#64748b', fontSize: '13px' }}>{c.created_at ? new Date(c.created_at).toLocaleDateString('en-IN') : '—'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </>
                    )}

                    {/* ── ANALYTICS ── */}
                    {activeNav === 'analytics' && (
                        <>
                            <div className="page-title" style={{ marginBottom: '24px' }}>Analytics</div>
                            <div className="stats-grid">
                                {[
                                    { label: 'Total X-Rays', value: stats.total_cases, color: '#1a6fd4', icon: '📊' },
                                    { label: 'Fractures Detected', value: stats.fractures_detected, color: '#ef4444', icon: '🦴' },
                                    { label: 'Model Accuracy', value: `${stats.model_accuracy}%`, color: '#10b981', icon: '🎯' },
                                    { label: 'Feedback Records', value: stats.feedback_records, color: '#f59e0b', icon: '💬' },
                                ].map(s => (
                                    <div className="stat-card" key={s.label} style={{ borderTop: `4px solid ${s.color}` }}>
                                        <div style={{ fontSize: '28px' }}>{s.icon}</div>
                                        <div className="stat-value" style={{ color: s.color, marginTop: '8px' }}>{s.value}</div>
                                        <div className="stat-label">{s.label}</div>
                                    </div>
                                ))}
                            </div>
                            <div className="card">
                                <h2 style={{ fontFamily: 'Space Grotesk', fontSize: '18px', fontWeight: '600', marginBottom: '20px' }}>Detection Breakdown</h2>
                                {[
                                    { label: 'Fracture Detection Rate', value: stats.total_cases > 0 ? Math.round(stats.fractures_detected / stats.total_cases * 100) : 0, color: '#ef4444' },
                                    { label: 'Model Accuracy', value: stats.model_accuracy, color: '#10b981' },
                                ].map(bar => (
                                    <div key={bar.label} style={{ marginBottom: '20px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                            <span style={{ fontSize: '14px', fontWeight: '500' }}>{bar.label}</span>
                                            <span style={{ fontSize: '14px', fontWeight: '700', color: bar.color }}>{bar.value}%</span>
                                        </div>
                                        <div className="progress-bar">
                                            <div className="progress-fill" style={{ width: `${bar.value}%`, background: bar.color }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}

                </div>
            </div>
        </>
    );
}