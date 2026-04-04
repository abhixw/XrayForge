// import { useState } from 'react';
// import ThemeToggle from '../components/ThemeToggle';

// function Doctor() {
//     const [view, setView] = useState('analyze');
//     const [file, setFile] = useState(null);
//     const [preview, setPreview] = useState(null);
//     const [loading, setLoading] = useState(false);
//     const [result, setResult] = useState(null);
//     const [explanation, setExplanation] = useState(null);
//     const [explaining, setExplaining] = useState(false);
//     const [shareLink, setShareLink] = useState("");

//     const [patientName, setPatientName] = useState("");
//     const [patientId, setPatientId] = useState("");
//     const [notes, setNotes] = useState("");

//     const [cases, setCases] = useState([]);
//     const [search, setSearch] = useState("");
//     const [filter, setFilter] = useState("all");

//     const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

//     const handleFileChange = (e) => {
//         if (e.target.files && e.target.files[0]) {
//             const selected = e.target.files[0];
//             setFile(selected);
//             setPreview(URL.createObjectURL(selected));
//             setResult(null);
//             setExplanation(null);
//             setShareLink("");
//         }
//     };

//     const handleUpload = async () => {
//         if (!file) return;

//         setLoading(true);
//         setResult(null);
//         setExplanation(null);
//         setShareLink("");

//         const formData = new FormData();
//         formData.append("file", file);
//         formData.append("patient_name", patientName || "Anonymous");
//         formData.append("patient_id", patientId || "N/A");

//         try {
//             const resp = await fetch(`${API_BASE_URL}/api/predict`, {
//                 method: "POST",
//                 body: formData,
//             });

//             const data = await resp.json();
//             setResult(data);

//             const link = `${window.location.origin}/patient/${data.case_id}`;
//             setShareLink(link);

//             handleExplain(data.probability, data.diagnosis, data.risk_level);

//         } catch (err) {
//             console.error(err);
//             alert("Error contacting backend");
//         } finally {
//             setLoading(false);
//         }
//     };

//     const handleExplain = async (probability, diagnosis, risk_level) => {
//         setExplaining(true);

//         try {
//             const resp = await fetch(`${API_BASE_URL}/api/explain`, {
//                 method: "POST",
//                 headers: { "Content-Type": "application/json" },
//                 body: JSON.stringify({ probability, diagnosis, risk_level }),
//             });

//             const data = await resp.json();
//             setExplanation(data);

//         } catch (err) {
//             console.error(err);
//         } finally {
//             setExplaining(false);
//         }
//     };

//     // ✅ Override (doctor decision)
//     const handleOverride = async (newLabel) => {
//         if (!result?.case_id) return;

//         try {
//             await fetch(`${API_BASE_URL}/api/override/${result.case_id}`, {
//                 method: "POST",
//                 headers: { "Content-Type": "application/json" },
//                 body: JSON.stringify({ label: newLabel, notes }),
//             });

//             setResult({
//                 ...result,
//                 diagnosis: newLabel,
//                 isValidated: true
//             });

//         } catch (err) {
//             console.error(err);
//         }
//     };

//     // 🔥 NEW: Feedback API
//     const handleFeedback = async (correctLabel) => {
//         if (!result?.case_id) return;

//         try {
//             await fetch(`${API_BASE_URL}/api/feedback`, {
//                 method: "POST",
//                 headers: { "Content-Type": "application/json" },
//                 body: JSON.stringify({
//                     case_id: result.case_id,
//                     model_prediction: result.initial_prediction || result.diagnosis,
//                     correct_label: correctLabel,
//                     confidence: result.probability,
//                     image_path: result.image_path  // ✅ REAL PATH from API response
//                 })
//             });

//             alert("Feedback saved!");

//         } catch (err) {
//             console.error(err);
//             alert("Feedback failed");
//         }
//     };

//     return (
//         <div className="doctor-page">
//             <ThemeToggle />

//             <h1>⚕️ Physician Dashboard</h1>

//             <div className="upload-section">
//                 <input type="file" onChange={handleFileChange} />

//                 {file && (
//                     <button onClick={handleUpload}>
//                         {loading ? "Analyzing..." : "Analyze"}
//                     </button>
//                 )}
//             </div>

//             {result && (
//                 <div className="results-section">

//                     <h2>{result.diagnosis}</h2>
//                     <p>Confidence: {(result.probability * 100).toFixed(1)}%</p>

//                     <img src={result.heatmap_base64} alt="Heatmap" />

//                     <textarea
//                         placeholder="Doctor Notes"
//                         value={notes}
//                         onChange={(e) => setNotes(e.target.value)}
//                     />

//                     <div className="validation-controls">

//                         {/* ✔ Approve */}
//                         <button onClick={() => handleOverride(result.diagnosis)}>
//                             Approve
//                         </button>

//                         {/* ✖ Override */}
//                         <button onClick={() => handleOverride(
//                             result.diagnosis === "Normal"
//                                 ? "Fracture Detected"
//                                 : "Normal"
//                         )}>
//                             Override
//                         </button>

//                         {/* 🔥 NEW: Feedback */}
//                         <button onClick={() => handleFeedback(
//                             result.diagnosis === "Normal"
//                                 ? "Fracture Detected"
//                                 : "Normal"
//                         )}>
//                             Mark Incorrect
//                         </button>

//                     </div>

//                     {explanation && (
//                         <div className="explanation-box">
//                             <h3>Clinical Insights</h3>
//                             <p>{explanation.explanation}</p>
//                         </div>
//                     )}
//                 </div>
//             )}
//         </div>
//     );
// }

// export default Doctor;


import { useState, useRef, useEffect } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

function NavItem({ icon, label, badge, active, onClick }) {
    return (
        <div className={`nav-item ${active ? 'active' : ''}`} onClick={onClick}>
            <span className="nav-icon">{icon}</span>
            {label}
            {badge !== undefined && <span className="nav-badge">{badge}</span>}
        </div>
    );
}

function StatCard({ icon, value, label, sub, color }) {
    return (
        <div className={`stat-card ${color}`}>
            <div className={`stat-icon ${color}`}>{icon}</div>
            <div className="stat-value">{value}</div>
            <div className="stat-label">{label}</div>
            {sub && <div className="stat-sub">{sub}</div>}
        </div>
    );
}

export default function Doctor() {
    const [activeNav, setActiveNav] = useState('dashboard');
    const [activeTab, setActiveTab] = useState('analyze');

    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [explanation, setExplanation] = useState(null);
    const [explaining, setExplaining] = useState(false);
    const [notes, setNotes] = useState('');
    const [patientName, setPatientName] = useState('');
    const [patientId, setPatientId] = useState('');
    const [shareLink, setShareLink] = useState('');
    const [copied, setCopied] = useState(false);

    const [cases, setCases] = useState([]);
    const [loadingCases, setLoadingCases] = useState(false);
    const [filterChip, setFilterChip] = useState('all');
    const [search, setSearch] = useState('');

    const [stats, setStats] = useState({
        total_cases: null,
        fractures_detected: null,
        model_accuracy: null,
        feedback_records: null,
    });
    const [statsLoading, setStatsLoading] = useState(true);

    const fileInputRef = useRef(null);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const resp = await fetch(`${API_BASE_URL}/api/stats`);
            const data = await resp.json();
            setStats(data);
        } catch (err) {
            console.error('Stats fetch failed:', err);
        } finally {
            setStatsLoading(false);
        }
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            const selected = e.target.files[0];
            setFile(selected);
            setPreview(URL.createObjectURL(selected));
            setResult(null);
            setExplanation(null);
            setShareLink('');
            setNotes('');
        }
    };

    const handleUpload = async () => {
        if (!file) return;
        setLoading(true);
        setResult(null);
        setExplanation(null);
        setShareLink('');
        const formData = new FormData();
        formData.append('file', file);
        formData.append('patient_name', patientName || 'Anonymous');
        formData.append('patient_id', patientId || 'N/A');
        try {
            const resp = await fetch(`${API_BASE_URL}/api/predict`, { method: 'POST', body: formData });
            const data = await resp.json();
            setResult(data);
            setShareLink(`${window.location.origin}/patient/${data.case_id}`);
            handleExplain(data.probability, data.diagnosis, data.risk_level);
            fetchStats();
        } catch (err) {
            console.error(err);
            alert('Error contacting backend');
        } finally {
            setLoading(false);
        }
    };

    const handleExplain = async (probability, diagnosis, risk_level) => {
        setExplaining(true);
        try {
            const resp = await fetch(`${API_BASE_URL}/api/explain`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
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
            await fetch(`${API_BASE_URL}/api/override/${result.case_id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ label: newLabel, notes }),
            });
            setResult({ ...result, diagnosis: newLabel, isValidated: true });
            fetchStats();
        } catch (err) {
            console.error(err);
        }
    };

    const handleFeedback = async (correctLabel) => {
        if (!result?.case_id) return;
        try {
            await fetch(`${API_BASE_URL}/api/feedback`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    case_id: result.case_id,
                    model_prediction: result.initial_prediction || result.diagnosis,
                    correct_label: correctLabel,
                    confidence: result.probability,
                    image_path: result.image_path,
                }),
            });
            alert('Feedback saved! Thank you for improving the model.');
            fetchStats();
        } catch (err) {
            console.error(err);
            alert('Feedback failed');
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(shareLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const loadCases = async () => {
        setLoadingCases(true);
        try {
            const resp = await fetch(`${API_BASE_URL}/api/cases`);
            const data = await resp.json();
            setCases(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingCases(false);
        }
    };

    const handleTabChange = (tab) => {
        setActiveTab(tab);
        if (tab === 'history') loadCases();
    };

    const filteredCases = cases.filter((c) => {
        const matchSearch =
            search === '' ||
            (c.patient_name || '').toLowerCase().includes(search.toLowerCase()) ||
            (c.id || '').toLowerCase().includes(search.toLowerCase());
        const matchFilter =
            filterChip === 'all' ||
            (filterChip === 'fracture' && c.prediction === 'Fracture Detected') ||
            (filterChip === 'normal' && c.prediction === 'Normal') ||
            (filterChip === 'pending' && !c.approved);
        return matchSearch && matchFilter;
    });

    const isFracture = result?.diagnosis === 'Fracture Detected';
    const sv = (val) => (statsLoading ? '...' : val ?? 0);

    return (
        <>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Space+Grotesk:wght@400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
          --blue: #1a6fd4; --blue-light: #e8f2fd;
          --green: #2d9e5f; --green-light: #eaf7f0;
          --orange: #e8820c; --orange-light: #fff4e6;
          --bg: #f4f7fc; --card: #ffffff; --border: #e2e8f2;
          --text: #1a2236; --muted: #6b7a99;
          --danger: #d63c3c; --danger-light: #fef0f0;
          --sidebar-w: 220px; --radius: 14px; --radius-sm: 8px;
        }
        body { font-family: 'DM Sans', sans-serif; background: var(--bg); color: var(--text); min-height: 100vh; }
        .cdss-layout { display: flex; min-height: 100vh; }

        .sidebar { width: var(--sidebar-w); background: #0f1e3d; min-height: 100vh; display: flex; flex-direction: column; position: fixed; left: 0; top: 0; z-index: 100; }
        .sidebar-logo { padding: 24px 20px 20px; border-bottom: 1px solid rgba(255,255,255,0.08); }
        .logo-mark { display: flex; align-items: center; gap: 10px; }
        .logo-icon { width: 36px; height: 36px; background: linear-gradient(135deg, #1a6fd4, #2d9e5f); border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 18px; }
        .logo-text { font-family: 'Space Grotesk', sans-serif; font-weight: 700; font-size: 17px; color: #fff; line-height: 1.1; }
        .logo-sub { font-size: 10px; color: rgba(255,255,255,0.4); letter-spacing: 0.5px; }
        .sidebar-nav { padding: 16px 12px; flex: 1; }
        .nav-section-label { font-size: 10px; font-weight: 600; letter-spacing: 1px; color: rgba(255,255,255,0.3); text-transform: uppercase; padding: 0 8px; margin: 16px 0 8px; }
        .nav-item { display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-radius: var(--radius-sm); color: rgba(255,255,255,0.55); font-size: 14px; font-weight: 500; cursor: pointer; transition: all 0.18s; margin-bottom: 2px; border-left: 3px solid transparent; }
        .nav-item:hover { background: rgba(255,255,255,0.07); color: #fff; }
        .nav-item.active { background: rgba(26,111,212,0.25); color: #60a5fa; border-left-color: #1a6fd4; padding-left: 9px; }
        .nav-icon { font-size: 16px; width: 20px; text-align: center; }
        .nav-badge { margin-left: auto; background: var(--orange); color: #fff; font-size: 10px; font-weight: 700; padding: 2px 7px; border-radius: 20px; }
        .sidebar-footer { padding: 16px 12px; border-top: 1px solid rgba(255,255,255,0.08); }
        .doctor-card { display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-radius: var(--radius-sm); background: rgba(255,255,255,0.06); }
        .doctor-avatar { width: 34px; height: 34px; border-radius: 50%; background: linear-gradient(135deg, #1a6fd4, #2d9e5f); display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 700; color: #fff; flex-shrink: 0; }
        .doctor-name { font-size: 13px; font-weight: 600; color: #fff; }
        .doctor-role { font-size: 11px; color: rgba(255,255,255,0.4); }

        .main { margin-left: var(--sidebar-w); flex: 1; padding: 28px 32px; min-height: 100vh; }
        .topbar { display: flex; align-items: center; justify-content: space-between; margin-bottom: 28px; }
        .page-title { font-family: 'Space Grotesk', sans-serif; font-size: 22px; font-weight: 700; color: var(--text); }
        .page-sub { font-size: 13px; color: var(--muted); margin-top: 2px; }
        .topbar-actions { display: flex; align-items: center; gap: 12px; }
        .model-badge { display: inline-flex; align-items: center; gap: 6px; background: #0f1e3d; color: #60a5fa; font-size: 11px; font-weight: 700; padding: 6px 14px; border-radius: 20px; letter-spacing: 0.5px; }
        .model-dot { width: 7px; height: 7px; border-radius: 50%; background: #4ade80; animation: pulse-dot 2s infinite; }
        @keyframes pulse-dot { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }

        .btn { display: inline-flex; align-items: center; gap: 7px; padding: 9px 18px; border-radius: var(--radius-sm); font-size: 13px; font-weight: 600; border: none; cursor: pointer; transition: all 0.18s; font-family: 'DM Sans', sans-serif; }
        .btn-primary { background: var(--blue); color: #fff; }
        .btn-primary:hover { background: #155db8; transform: translateY(-1px); }
        .btn-primary:disabled { background: #b0c4de; cursor: not-allowed; transform: none; }
        .btn-outline { background: #fff; color: var(--text); border: 1.5px solid var(--border); }
        .btn-outline:hover { border-color: var(--blue); color: var(--blue); }
        .btn-green { background: var(--green); color: #fff; }
        .btn-green:hover { background: #247a4a; }
        .btn-orange { background: var(--orange); color: #fff; }
        .btn-orange:hover { background: #c9700a; }
        .btn-danger { background: #fff; color: var(--danger); border: 1.5px solid #f5c2c2; }
        .btn-danger:hover { background: var(--danger-light); }
        .btn-full { width: 100%; justify-content: center; padding: 12px; font-size: 14px; }

        .stats-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
        .stat-card { background: var(--card); border-radius: var(--radius); padding: 20px; border: 1px solid var(--border); position: relative; overflow: hidden; }
        .stat-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px; }
        .stat-card.blue::before { background: var(--blue); }
        .stat-card.green::before { background: var(--green); }
        .stat-card.orange::before { background: var(--orange); }
        .stat-card.gray::before { background: #94a3b8; }
        .stat-icon { width: 38px; height: 38px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 18px; margin-bottom: 14px; }
        .stat-icon.blue { background: var(--blue-light); }
        .stat-icon.green { background: var(--green-light); }
        .stat-icon.orange { background: var(--orange-light); }
        .stat-icon.gray { background: #f1f5f9; }
        .stat-value { font-family: 'Space Grotesk', sans-serif; font-size: 28px; font-weight: 700; color: var(--text); line-height: 1; margin-bottom: 4px; }
        .stat-label { font-size: 12px; color: var(--muted); font-weight: 500; }
        .stat-sub { font-size: 11px; font-weight: 600; margin-top: 8px; padding: 3px 7px; border-radius: 20px; display: inline-flex; background: var(--green-light); color: var(--green); }

        .content-grid { display: grid; grid-template-columns: 1fr 360px; gap: 20px; margin-bottom: 20px; }
        .card { background: var(--card); border-radius: var(--radius); border: 1px solid var(--border); overflow: hidden; }
        .card-body { padding: 22px; }
        .tabs { display: flex; border-bottom: 1px solid var(--border); padding: 0 22px; }
        .tab { padding: 14px 18px; font-size: 13px; font-weight: 600; color: var(--muted); cursor: pointer; border-bottom: 2.5px solid transparent; transition: all 0.15s; margin-bottom: -1px; }
        .tab.active { color: var(--blue); border-bottom-color: var(--blue); }
        .tab:hover { color: var(--text); }

        .upload-zone { border: 2px dashed #c5d5ea; border-radius: 12px; padding: 36px 24px; text-align: center; background: #f8fafd; cursor: pointer; transition: all 0.2s; margin-bottom: 16px; }
        .upload-zone:hover { border-color: var(--blue); background: var(--blue-light); }
        .upload-zone input { display: none; }
        .upload-icon { font-size: 36px; margin-bottom: 10px; }
        .upload-title { font-weight: 600; font-size: 15px; color: var(--text); margin-bottom: 4px; }
        .upload-sub { font-size: 12px; color: var(--muted); }
        .preview-img { width: 100%; max-height: 200px; object-fit: contain; border-radius: 10px; }

        .field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px; }
        .field-group { display: flex; flex-direction: column; gap: 5px; }
        .field-label { font-size: 11px; font-weight: 600; color: var(--muted); text-transform: uppercase; letter-spacing: 0.5px; }
        .field-input { padding: 9px 12px; border: 1.5px solid var(--border); border-radius: var(--radius-sm); font-size: 13px; font-family: 'DM Sans', sans-serif; color: var(--text); background: #fff; transition: border 0.18s; outline: none; }
        .field-input:focus { border-color: var(--blue); }
        textarea.field-input { resize: vertical; line-height: 1.5; }

        .result-section { background: #f8fafd; border-radius: 12px; padding: 18px; border: 1px solid #e2eaf5; margin-top: 16px; animation: slide-up 0.4s ease-out; }
        @keyframes slide-up { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        .result-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 14px; }
        .diagnosis-badge { display: inline-flex; align-items: center; gap: 6px; padding: 7px 16px; border-radius: 20px; font-size: 13px; font-weight: 700; }
        .badge-fracture { background: var(--danger-light); color: var(--danger); border: 1.5px solid #f5c2c2; }
        .badge-normal { background: var(--green-light); color: var(--green); border: 1.5px solid #b8e8cf; }

        .confidence-row { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
        .confidence-label { font-size: 12px; color: var(--muted); font-weight: 500; width: 86px; flex-shrink: 0; }
        .confidence-bar { flex: 1; height: 8px; background: #e2e8f2; border-radius: 4px; overflow: hidden; }
        .confidence-fill { height: 100%; border-radius: 4px; transition: width 1.2s cubic-bezier(0.16,1,0.3,1); }
        .fill-blue { background: var(--blue); }
        .fill-orange { background: var(--orange); }
        .confidence-pct { font-size: 12px; font-weight: 700; color: var(--text); width: 36px; text-align: right; }

        .heatmap-wrap { width: 100%; border-radius: 10px; overflow: hidden; margin-bottom: 10px; border: 1px solid var(--border); }
        .heatmap-wrap img { width: 100%; display: block; }
        .heatmap-legend { display: flex; gap: 14px; justify-content: center; margin-bottom: 14px; }
        .legend-item { display: flex; align-items: center; gap: 5px; font-size: 11px; color: var(--muted); font-weight: 500; }
        .legend-dot { width: 8px; height: 8px; border-radius: 50%; }

        .action-row { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; margin-top: 14px; }
        .action-row .btn { justify-content: center; font-size: 12px; padding: 9px 8px; }

        .share-box { margin-top: 14px; padding-top: 14px; border-top: 1px solid var(--border); }
        .share-label { font-size: 11px; font-weight: 600; color: var(--muted); margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px; }
        .share-row { display: flex; gap: 8px; }
        .share-input { flex: 1; padding: 8px 12px; border: 1.5px solid var(--border); border-radius: var(--radius-sm); font-size: 11px; font-family: monospace; color: var(--muted); background: #f8fafd; outline: none; }

        .insights-panel { display: flex; flex-direction: column; gap: 16px; }
        .risk-card { background: var(--card); border-radius: var(--radius); border: 1px solid var(--border); padding: 20px; }
        .panel-section-label { font-size: 11px; font-weight: 600; color: var(--muted); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 14px; }
        .risk-score-big { font-family: 'Space Grotesk', sans-serif; font-size: 52px; font-weight: 700; line-height: 1; margin-bottom: 4px; }
        .risk-level-text { font-size: 13px; font-weight: 600; margin-bottom: 16px; }
        .risk-bar { height: 10px; background: #e2e8f2; border-radius: 5px; overflow: hidden; margin-bottom: 8px; }
        .risk-fill { height: 100%; border-radius: 5px; background: linear-gradient(90deg, #2d9e5f, #1a6fd4, #e8820c, #d63c3c); transition: width 1.2s cubic-bezier(0.16,1,0.3,1); }
        .risk-markers { display: flex; justify-content: space-between; font-size: 10px; color: var(--muted); font-weight: 500; }

        .insights-box { background: var(--card); border-radius: var(--radius); border: 1px solid var(--border); padding: 20px; }
        .insights-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
        .insights-title { font-family: 'Space Grotesk', sans-serif; font-weight: 600; font-size: 14px; color: var(--text); }
        .ai-badge { display: inline-flex; align-items: center; gap: 5px; background: var(--blue-light); color: var(--blue); font-size: 10px; font-weight: 700; padding: 3px 8px; border-radius: 20px; letter-spacing: 0.5px; }
        .insight-text { font-size: 13px; color: var(--muted); line-height: 1.7; white-space: pre-wrap; }

        .model-info-row { display: flex; justify-content: space-between; font-size: 12px; padding: 6px 0; border-bottom: 1px solid var(--border); }
        .model-info-row:last-child { border-bottom: none; }
        .model-info-key { color: var(--muted); }
        .model-info-val { font-weight: 600; }

        .table-filters { display: flex; gap: 10px; padding: 14px 22px; border-bottom: 1px solid var(--border); align-items: center; flex-wrap: wrap; }
        .search-box { display: flex; align-items: center; gap: 8px; background: #f4f7fc; border: 1.5px solid var(--border); border-radius: var(--radius-sm); padding: 8px 12px; flex: 1; max-width: 260px; }
        .search-box input { border: none; background: transparent; font-size: 13px; color: var(--text); outline: none; font-family: 'DM Sans', sans-serif; width: 100%; }
        .filter-chip { padding: 6px 14px; border-radius: 20px; font-size: 12px; font-weight: 600; cursor: pointer; border: 1.5px solid var(--border); background: #fff; color: var(--muted); transition: all 0.15s; font-family: 'DM Sans', sans-serif; }
        .filter-chip.active { background: var(--blue); color: #fff; border-color: var(--blue); }

        .cases-table { width: 100%; border-collapse: collapse; }
        .cases-table th { padding: 11px 20px; text-align: left; font-size: 11px; font-weight: 600; color: var(--muted); text-transform: uppercase; letter-spacing: 0.5px; background: #f8fafd; border-bottom: 1px solid var(--border); }
        .cases-table td { padding: 13px 20px; font-size: 13px; color: var(--text); border-bottom: 1px solid var(--border); vertical-align: middle; }
        .cases-table tr:hover td { background: #f8fafd; }
        .cases-table tr:last-child td { border-bottom: none; }

        .status-pill { display: inline-flex; align-items: center; gap: 4px; padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 700; }
        .pill-fracture { background: var(--danger-light); color: var(--danger); }
        .pill-normal { background: var(--green-light); color: var(--green); }
        .pill-pending { background: var(--orange-light); color: var(--orange); }
        .pill-verified { background: var(--blue-light); color: var(--blue); }

        .patient-info { display: flex; align-items: center; gap: 10px; }
        .p-avatar { width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; color: #fff; flex-shrink: 0; background: linear-gradient(135deg, #1a6fd4, #2d9e5f); }
        .p-name { font-weight: 600; font-size: 13px; }
        .p-id { font-size: 11px; color: var(--muted); }

        .tbl-btn { padding: 5px 12px; border-radius: 6px; font-size: 11px; font-weight: 600; border: 1.5px solid #c5d5ea; background: #fff; cursor: pointer; color: var(--blue); transition: all 0.15s; font-family: 'DM Sans', sans-serif; }
        .tbl-btn:hover { background: var(--blue); color: #fff; border-color: var(--blue); }

        .empty-state { text-align: center; padding: 40px; color: var(--muted); font-size: 14px; }
        .validated-badge { display: inline-flex; align-items: center; gap: 5px; background: var(--green-light); color: var(--green); font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 20px; margin-bottom: 8px; }
        .loading-spinner { display: inline-block; width: 14px; height: 14px; border: 2px solid rgba(255,255,255,0.4); border-top-color: #fff; border-radius: 50%; animation: spin 0.7s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

            <div className="cdss-layout">

                {/* SIDEBAR */}
                <aside className="sidebar">
                    <div className="sidebar-logo">
                        <div className="logo-mark">
                            <div className="logo-icon">🩻</div>
                            <div>
                                <div className="logo-text">FractureAI</div>
                                <div className="logo-sub">CDSS v2.0</div>
                            </div>
                        </div>
                    </div>
                    <nav className="sidebar-nav">
                        <div className="nav-section-label">Main</div>
                        <NavItem icon="🏥" label="Dashboard" active={activeNav === 'dashboard'} onClick={() => setActiveNav('dashboard')} />
                        <NavItem icon="🔬" label="Analyze X-Ray" active={activeNav === 'analyze'} onClick={() => { setActiveNav('analyze'); setActiveTab('analyze'); }} />
                        <NavItem icon="📋" label="All Cases" badge={sv(stats.total_cases)} active={activeNav === 'cases'} onClick={() => { setActiveNav('cases'); handleTabChange('history'); }} />
                        <NavItem icon="📊" label="Analytics" active={activeNav === 'analytics'} onClick={() => setActiveNav('analytics')} />
                        <div className="nav-section-label">System</div>
                        <NavItem icon="🔁" label="Feedback Log" badge={sv(stats.feedback_records)} active={activeNav === 'feedback'} onClick={() => setActiveNav('feedback')} />
                        <NavItem icon="⚙️" label="Model Settings" active={activeNav === 'settings'} onClick={() => setActiveNav('settings')} />
                    </nav>
                    <div className="sidebar-footer">
                        <div className="doctor-card">
                            <div className="doctor-avatar">DR</div>
                            <div>
                                <div className="doctor-name">Physician</div>
                                <div className="doctor-role">Radiologist</div>
                            </div>
                        </div>
                    </div>
                </aside>

                {/* MAIN */}
                <main className="main">

                    {/* TOPBAR */}
                    <div className="topbar">
                        <div>
                            <div className="page-title">Physician Dashboard</div>
                            <div className="page-sub">
                                {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                            </div>
                        </div>
                        <div className="topbar-actions">
                            <div className="model-badge"><span className="model-dot"></span> Model v2 Active</div>
                            <button className="btn btn-primary" onClick={() => { setActiveTab('analyze'); setFile(null); setPreview(null); setResult(null); setNotes(''); }}>
                                + New Analysis
                            </button>
                        </div>
                    </div>

                    {/* REAL STATS */}
                    <div className="stats-row">
                        <StatCard icon="🩻" value={sv(stats.total_cases)} label="X-Rays Analyzed"
                            sub={stats.total_cases > 0 ? `${stats.total_cases} total cases` : null} color="blue" />
                        <StatCard icon="🦴" value={sv(stats.fractures_detected)} label="Fractures Detected"
                            sub={stats.total_cases > 0 ? `${Math.round((stats.fractures_detected / stats.total_cases) * 100)}% of cases` : null} color="green" />
                        <StatCard icon="✅" value={statsLoading ? '...' : `${stats.model_accuracy}%`} label="Model Accuracy"
                            sub={stats.model_accuracy > 0 ? 'Based on doctor approvals' : 'No approvals yet'} color="orange" />
                        <StatCard icon="🔁" value={sv(stats.feedback_records)} label="Feedback Records"
                            sub="Used for retraining" color="gray" />
                    </div>

                    {/* CONTENT GRID */}
                    <div className="content-grid">

                        {/* LEFT */}
                        <div className="card">
                            <div className="tabs">
                                <div className={`tab ${activeTab === 'analyze' ? 'active' : ''}`} onClick={() => setActiveTab('analyze')}>Analyze X-Ray</div>
                                <div className={`tab ${activeTab === 'history' ? 'active' : ''}`} onClick={() => handleTabChange('history')}>Case History</div>
                            </div>

                            {activeTab === 'analyze' && (
                                <div className="card-body">
                                    <div className="field-row">
                                        <div className="field-group">
                                            <div className="field-label">Patient Name</div>
                                            <input className="field-input" type="text" placeholder="e.g. Rahul Mehta" value={patientName} onChange={e => setPatientName(e.target.value)} />
                                        </div>
                                        <div className="field-group">
                                            <div className="field-label">Patient ID</div>
                                            <input className="field-input" type="text" placeholder="e.g. PT-0042" value={patientId} onChange={e => setPatientId(e.target.value)} />
                                        </div>
                                    </div>

                                    <div className="upload-zone" onClick={() => fileInputRef.current?.click()}>
                                        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} />
                                        {preview ? <img src={preview} alt="Preview" className="preview-img" /> : (
                                            <>
                                                <div className="upload-icon">🩻</div>
                                                <div className="upload-title">Drop X-Ray image here</div>
                                                <div className="upload-sub">Supports JPG, PNG, WEBP · Max 20MB</div>
                                                <div style={{ marginTop: '14px' }}>
                                                    <button className="btn btn-outline" style={{ fontSize: '12px', padding: '7px 16px' }}>Choose File</button>
                                                </div>
                                            </>
                                        )}
                                    </div>

                                    <button className="btn btn-primary btn-full" onClick={handleUpload} disabled={!file || loading}>
                                        {loading ? <><span className="loading-spinner"></span> Analyzing...</> : '🔬 Analyze X-Ray'}
                                    </button>

                                    {result && (
                                        <div className="result-section">
                                            <div className="result-header">
                                                <div>
                                                    <div style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>AI Diagnosis</div>
                                                    {result.isValidated && <div className="validated-badge">✓ Physician Validated</div>}
                                                    <span className={`diagnosis-badge ${isFracture ? 'badge-fracture' : 'badge-normal'}`}>
                                                        {isFracture ? '🦴 Fracture Detected' : '✓ Normal'}
                                                    </span>
                                                </div>
                                                <div style={{ textAlign: 'right' }}>
                                                    <div style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 600, marginBottom: '4px' }}>Case ID</div>
                                                    <div style={{ fontSize: '12px', fontFamily: 'monospace', fontWeight: 600 }}>{result.case_id?.slice(0, 8)}</div>
                                                </div>
                                            </div>

                                            <div className="confidence-row">
                                                <div className="confidence-label">Confidence</div>
                                                <div className="confidence-bar"><div className="confidence-fill fill-blue" style={{ width: `${(result.probability * 100).toFixed(0)}%` }}></div></div>
                                                <div className="confidence-pct">{(result.probability * 100).toFixed(0)}%</div>
                                            </div>
                                            <div className="confidence-row">
                                                <div className="confidence-label">Risk Score</div>
                                                <div className="confidence-bar"><div className="confidence-fill fill-orange" style={{ width: `${result.risk_score}%` }}></div></div>
                                                <div className="confidence-pct">{result.risk_score}</div>
                                            </div>

                                            <div className="heatmap-wrap"><img src={result.heatmap_base64} alt="Grad-CAM Heatmap" /></div>

                                            <div className="heatmap-legend">
                                                <div className="legend-item"><div className="legend-dot" style={{ background: '#d63c3c' }}></div> High Focus</div>
                                                <div className="legend-item"><div className="legend-dot" style={{ background: '#e8820c' }}></div> Medium</div>
                                                <div className="legend-item"><div className="legend-dot" style={{ background: '#1a6fd4' }}></div> Low</div>
                                            </div>

                                            <div className="field-group" style={{ marginBottom: '14px' }}>
                                                <div className="field-label">Doctor Notes</div>
                                                <textarea className="field-input" rows={2} placeholder="Add clinical observations..." value={notes} onChange={e => setNotes(e.target.value)} />
                                            </div>

                                            <div className="action-row">
                                                <button className="btn btn-green" onClick={() => handleOverride(result.diagnosis)}>✔ Approve</button>
                                                <button className="btn btn-orange" onClick={() => handleOverride(result.diagnosis === 'Normal' ? 'Fracture Detected' : 'Normal')}>↔ Override</button>
                                                <button className="btn btn-danger" onClick={() => handleFeedback(result.diagnosis === 'Normal' ? 'Fracture Detected' : 'Normal')}>✖ Mark Incorrect</button>
                                            </div>

                                            {shareLink && (
                                                <div className="share-box">
                                                    <div className="share-label">Patient Share Link</div>
                                                    <div className="share-row">
                                                        <input className="share-input" value={shareLink} readOnly />
                                                        <button className="btn btn-outline" style={{ fontSize: '12px', padding: '7px 12px' }} onClick={handleCopy}>
                                                            {copied ? '✓ Copied' : 'Copy'}
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'history' && (
                                <div>
                                    <div className="table-filters">
                                        <div className="search-box">
                                            <span style={{ fontSize: '14px' }}>🔍</span>
                                            <input type="text" placeholder="Search patient or case ID..." value={search} onChange={e => setSearch(e.target.value)} />
                                        </div>
                                        {['all', 'fracture', 'normal', 'pending'].map(chip => (
                                            <div key={chip} className={`filter-chip ${filterChip === chip ? 'active' : ''}`} onClick={() => setFilterChip(chip)}>
                                                {chip.charAt(0).toUpperCase() + chip.slice(1)}
                                            </div>
                                        ))}
                                    </div>
                                    {loadingCases ? (
                                        <div className="empty-state">Loading cases...</div>
                                    ) : filteredCases.length === 0 ? (
                                        <div className="empty-state">No cases found.</div>
                                    ) : (
                                        <table className="cases-table">
                                            <thead>
                                                <tr>
                                                    <th>Patient</th><th>Diagnosis</th><th>Confidence</th><th>Risk</th><th>Status</th><th>Action</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {filteredCases.map((c) => (
                                                    <tr key={c.id}>
                                                        <td>
                                                            <div className="patient-info">
                                                                <div className="p-avatar">{(c.patient_name || 'AN').slice(0, 2).toUpperCase()}</div>
                                                                <div>
                                                                    <div className="p-name">{c.patient_name || 'Anonymous'}</div>
                                                                    <div className="p-id">{c.id?.slice(0, 8)}</div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <span className={`status-pill ${c.prediction === 'Fracture Detected' ? 'pill-fracture' : 'pill-normal'}`}>
                                                                {c.prediction === 'Fracture Detected' ? '🦴 Fracture' : '✓ Normal'}
                                                            </span>
                                                        </td>
                                                        <td style={{ fontWeight: 600, color: 'var(--blue)' }}>{(c.confidence * 100).toFixed(0)}%</td>
                                                        <td style={{ fontWeight: 600, color: c.risk_level === 'High' ? 'var(--danger)' : c.risk_level === 'Moderate' ? 'var(--orange)' : 'var(--green)' }}>
                                                            {c.risk_level}
                                                        </td>
                                                        <td>
                                                            <span className={`status-pill ${c.approved ? 'pill-verified' : 'pill-pending'}`}>
                                                                {c.approved ? '✓ Verified' : '⏳ Pending'}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <button className="tbl-btn" onClick={() => window.open(`/patient/${c.id}`, '_blank')}>View</button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* RIGHT */}
                        <div className="insights-panel">

                            <div className="risk-card">
                                <div className="panel-section-label">Severity Indicator</div>
                                {result ? (
                                    <>
                                        <div className="risk-score-big" style={{ color: result.risk_level === 'High' ? 'var(--danger)' : result.risk_level === 'Moderate' ? 'var(--orange)' : 'var(--green)' }}>
                                            {result.risk_score}
                                        </div>
                                        <div className="risk-level-text" style={{ color: result.risk_level === 'High' ? 'var(--danger)' : result.risk_level === 'Moderate' ? 'var(--orange)' : 'var(--green)' }}>
                                            {result.risk_level === 'High' ? '🔴' : result.risk_level === 'Moderate' ? '⚠' : '✓'} {result.risk_level} Risk
                                        </div>
                                        <div className="risk-bar"><div className="risk-fill" style={{ width: `${result.risk_score}%` }}></div></div>
                                        <div className="risk-markers"><span>Low</span><span>Moderate</span><span>High</span><span>Critical</span></div>
                                    </>
                                ) : (
                                    <div style={{ color: 'var(--muted)', fontSize: '13px', textAlign: 'center', padding: '16px 0' }}>
                                        Analyze an X-ray to see risk score
                                    </div>
                                )}
                            </div>

                            <div className="insights-box">
                                <div className="insights-header">
                                    <div className="insights-title">Clinical Insights</div>
                                    <div className="ai-badge">✦ AI</div>
                                </div>
                                {explaining && <div style={{ color: 'var(--muted)', fontSize: '13px' }}>Generating insights...</div>}
                                {explanation && <div className="insight-text">{explanation.explanation}</div>}
                                {!explaining && !explanation && (
                                    <div style={{ color: 'var(--muted)', fontSize: '13px' }}>AI clinical insights will appear here after analysis.</div>
                                )}
                            </div>

                            <div className="risk-card">
                                <div className="panel-section-label">Model Information</div>
                                <div className="model-info-row"><span className="model-info-key">Architecture</span><span className="model-info-val">DenseNet-121</span></div>
                                <div className="model-info-row"><span className="model-info-key">Dataset</span><span className="model-info-val">MURA</span></div>
                                <div className="model-info-row"><span className="model-info-key">Version</span><span className="model-info-val" style={{ color: 'var(--green)' }}>v2 (Fine-tuned)</span></div>
                                <div className="model-info-row"><span className="model-info-key">Explainability</span><span className="model-info-val" style={{ color: 'var(--blue)' }}>Grad-CAM</span></div>
                                <div className="model-info-row"><span className="model-info-key">LLM Insights</span><span className="model-info-val" style={{ color: 'var(--blue)' }}>LLaMA 3.1</span></div>
                                <div className="model-info-row">
                                    <span className="model-info-key">Feedback Records</span>
                                    <span className="model-info-val" style={{ color: 'var(--orange)' }}>{sv(stats.feedback_records)} collected</span>
                                </div>
                                <div className="model-info-row">
                                    <span className="model-info-key">Total Cases</span>
                                    <span className="model-info-val">{sv(stats.total_cases)}</span>
                                </div>
                            </div>

                        </div>
                    </div>
                </main>
            </div>
        </>
    );
}
