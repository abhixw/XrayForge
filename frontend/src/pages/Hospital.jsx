// import { useState, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';

// const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

// export default function Hospital() {
//     const navigate = useNavigate();
//     const [activeTab, setActiveTab] = useState('patients');

//     // Patient Management
//     const [patients, setPatients] = useState([]);
//     const [newPatientName, setNewPatientName] = useState('');
//     const [message, setMessage] = useState('');
//     const [loading, setLoading] = useState(false);

//     // All Cases
//     const [cases, setCases] = useState([]);
//     const [casesLoading, setCasesLoading] = useState(false);

//     // Doctors
//     const [doctors, setDoctors] = useState([]);
//     const [doctorsLoading, setDoctorsLoading] = useState(false);

//     // Model Performance / Stats
//     const [stats, setStats] = useState(null);
//     const [statsLoading, setStatsLoading] = useState(false);

//     const token = localStorage.getItem('token');
//     const user = JSON.parse(localStorage.getItem('user') || '{}');

//     useEffect(() => {
//         if (!token || user.role !== 'admin') {
//             navigate('/login');
//         } else {
//             fetchPatients();
//         }
//     }, []);

//     const fetchPatients = async () => {
//         setLoading(true);
//         try {
//             const res = await fetch(`${API_BASE_URL}/api/admin/patients`, {
//                 headers: { Authorization: `Bearer ${token}` }
//             });
//             if (res.ok) setPatients(await res.json());
//         } catch (err) { console.error(err); }
//         finally { setLoading(false); }
//     };

//     const fetchCases = async () => {
//         setCasesLoading(true);
//         try {
//             const res = await fetch(`${API_BASE_URL}/api/admin/cases`, {
//                 headers: { Authorization: `Bearer ${token}` }
//             });
//             if (res.ok) setCases(await res.json());
//         } catch (err) { console.error(err); }
//         finally { setCasesLoading(false); }
//     };

//     const fetchDoctors = async () => {
//         setDoctorsLoading(true);
//         try {
//             const res = await fetch(`${API_BASE_URL}/api/admin/doctors`, {
//                 headers: { Authorization: `Bearer ${token}` }
//             });
//             if (res.ok) setDoctors(await res.json());
//         } catch (err) { console.error(err); }
//         finally { setDoctorsLoading(false); }
//     };

//     const fetchStats = async () => {
//         setStatsLoading(true);
//         try {
//             const res = await fetch(`${API_BASE_URL}/api/admin/stats`, {
//                 headers: { Authorization: `Bearer ${token}` }
//             });
//             if (res.ok) setStats(await res.json());
//         } catch (err) { console.error(err); }
//         finally { setStatsLoading(false); }
//     };

//     const handleTabChange = (tab) => {
//         setActiveTab(tab);
//         if (tab === 'patients') fetchPatients();
//         if (tab === 'cases') fetchCases();
//         if (tab === 'doctors') fetchDoctors();
//         if (tab === 'performance') fetchStats();
//     };

//     const registerPatient = async () => {
//         if (!newPatientName.trim()) { setMessage("Please enter patient name"); return; }
//         try {
//             const res = await fetch(`${API_BASE_URL}/api/admin/register-patient`, {
//                 method: 'POST',
//                 headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
//                 body: JSON.stringify({ name: newPatientName.trim() })
//             });
//             const data = await res.json();
//             if (res.ok) {
//                 setMessage(`✅ Patient registered! ID: ${data.patient_id}`);
//                 setNewPatientName('');
//                 fetchPatients();
//             } else {
//                 setMessage(data.detail || "Failed to register patient");
//             }
//         } catch (err) { setMessage("Server error. Please try again."); }
//     };

//     const logout = () => { localStorage.clear(); navigate('/login'); };

//     const navItems = [
//         { id: 'patients', icon: '👥', label: 'Patient Management' },
//         { id: 'cases', icon: '📋', label: 'All Cases' },
//         { id: 'doctors', icon: '👨‍⚕️', label: 'Doctors' },
//         { id: 'performance', icon: '📈', label: 'Model Performance' },
//     ];

//     const predictionColor = (p) => {
//         if (!p) return '#64748b';
//         return p.toLowerCase().includes('fracture') ? '#ef4444' : '#22c55e';
//     };

//     return (
//         <>
//             <style>{`
//                 @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Space+Grotesk:wght@400;500;600;700&display=swap');
//                 * { box-sizing: border-box; margin: 0; padding: 0; }
//                 body { font-family: 'DM Sans', sans-serif; background: #f4f7fc; color: #1a2236; }
//                 .hospital-layout { display: flex; min-height: 100vh; }
//                 .sidebar { width: 260px; background: #0f172a; color: white; padding: 28px 20px; position: fixed; height: 100vh; display: flex; flex-direction: column; }
//                 .logo { display: flex; align-items: center; gap: 12px; margin-bottom: 40px; }
//                 .logo-icon { width: 48px; height: 48px; background: linear-gradient(135deg, #1a6fd4, #2d9e5f); border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 24px; }
//                 .logo-text { font-family: 'Space Grotesk', sans-serif; font-weight: 700; font-size: 22px; }
//                 .nav-item { padding: 14px 16px; margin-bottom: 6px; border-radius: 10px; display: flex; align-items: center; gap: 12px; font-size: 14.5px; cursor: pointer; transition: 0.2s; color: rgba(255,255,255,0.7); }
//                 .nav-item:hover { background: rgba(255,255,255,0.1); color: white; }
//                 .nav-item.active { background: rgba(26,111,212,0.3); color: #60a5fa; }
//                 .logout-btn { margin-top: auto; padding: 12px 16px; border-radius: 10px; display: flex; align-items: center; gap: 12px; font-size: 14px; cursor: pointer; color: rgba(255,255,255,0.5); background: transparent; border: none; width: 100%; transition: 0.2s; }
//                 .logout-btn:hover { background: rgba(239,68,68,0.2); color: #fca5a5; }
//                 .main-content { margin-left: 260px; flex: 1; padding: 40px; }
//                 .card { background: white; border-radius: 16px; padding: 24px; margin-bottom: 24px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); }
//                 .btn-primary { padding: 12px 24px; background: #1a6fd4; color: white; border: none; border-radius: 10px; cursor: pointer; font-size: 15px; font-weight: 500; transition: 0.2s; }
//                 .btn-primary:hover { background: #1558b0; }
//                 table { width: 100%; border-collapse: collapse; margin-top: 16px; }
//                 th { padding: 12px 16px; text-align: left; background: #f8fafc; font-size: 13px; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
//                 td { padding: 14px 16px; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
//                 tr:last-child td { border-bottom: none; }
//                 tr:hover td { background: #fafbfc; }
//                 .badge { display: inline-block; padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: 600; }
//                 .badge-fracture { background: #fee2e2; color: #dc2626; }
//                 .badge-normal { background: #dcfce7; color: #16a34a; }
//                 .badge-approved { background: #dbeafe; color: #1d4ed8; }
//                 .stat-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 24px; }
//                 .stat-card { background: white; border-radius: 16px; padding: 24px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); }
//                 .stat-value { font-family: 'Space Grotesk', sans-serif; font-size: 36px; font-weight: 700; margin: 8px 0 4px; }
//                 .stat-label { font-size: 13px; color: #64748b; }
//                 .empty-state { text-align: center; padding: 60px 20px; color: #94a3b8; }
//                 .empty-icon { font-size: 48px; margin-bottom: 12px; }
//                 input[type="text"] { padding: 14px; border: 1px solid #e2e8f2; border-radius: 10px; font-size: 15px; font-family: 'DM Sans', sans-serif; outline: none; transition: 0.2s; }
//                 input[type="text"]:focus { border-color: #1a6fd4; box-shadow: 0 0 0 3px rgba(26,111,212,0.1); }
//                 .progress-bar { height: 8px; background: #f1f5f9; border-radius: 4px; overflow: hidden; margin-top: 8px; }
//                 .progress-fill { height: 100%; border-radius: 4px; transition: width 0.5s; }
//             `}</style>

//             <div className="hospital-layout">
//                 {/* Sidebar */}
//                 <div className="sidebar">
//                     <div className="logo">
//                         <div className="logo-icon">🏥</div>
//                         <div className="logo-text">Hospital Control</div>
//                     </div>
//                     {navItems.map(item => (
//                         <div
//                             key={item.id}
//                             className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
//                             onClick={() => handleTabChange(item.id)}
//                         >
//                             <span>{item.icon}</span> {item.label}
//                         </div>
//                     ))}
//                     <button className="logout-btn" onClick={logout}>
//                         <span>🚪</span> Logout
//                     </button>
//                 </div>

//                 {/* Main Content */}
//                 <div className="main-content">

//                     {/* ── PATIENT MANAGEMENT ── */}
//                     {activeTab === 'patients' && (
//                         <>
//                             <h1 style={{ fontFamily: 'Space Grotesk', fontSize: '28px', fontWeight: '700' }}>Patient Management</h1>
//                             <p style={{ color: '#64748b', marginBottom: '32px' }}>Register new patients and manage records</p>

//                             <div className="card">
//                                 <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '4px' }}>Register New Patient</h2>
//                                 <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '20px' }}>A unique Hospital ID will be auto-generated</p>
//                                 <div style={{ display: 'flex', gap: '12px' }}>
//                                     <input
//                                         type="text"
//                                         placeholder="Enter Full Patient Name"
//                                         value={newPatientName}
//                                         onChange={(e) => setNewPatientName(e.target.value)}
//                                         onKeyDown={(e) => e.key === 'Enter' && registerPatient()}
//                                         style={{ flex: 1 }}
//                                     />
//                                     <button onClick={registerPatient} className="btn-primary">Register Patient</button>
//                                 </div>
//                                 {message && (
//                                     <p style={{ marginTop: '12px', color: message.includes('✅') ? '#16a34a' : '#dc2626', fontWeight: '500' }}>
//                                         {message}
//                                     </p>
//                                 )}
//                             </div>

//                             <div className="card">
//                                 <h2 style={{ fontSize: '18px', fontWeight: '600' }}>All Registered Patients ({patients.length})</h2>
//                                 {loading ? (
//                                     <div className="empty-state"><div className="empty-icon">⏳</div><p>Loading patients...</p></div>
//                                 ) : patients.length === 0 ? (
//                                     <div className="empty-state"><div className="empty-icon">👥</div><p>No patients registered yet</p></div>
//                                 ) : (
//                                     <table>
//                                         <thead>
//                                             <tr>
//                                                 <th>Hospital ID</th>
//                                                 <th>Patient Name</th>
//                                                 <th>Registered On</th>
//                                             </tr>
//                                         </thead>
//                                         <tbody>
//                                             {patients.map(p => (
//                                                 <tr key={p.patient_id}>
//                                                     <td><span style={{ fontFamily: 'monospace', background: '#f1f5f9', padding: '4px 8px', borderRadius: '6px' }}>{p.patient_id}</span></td>
//                                                     <td style={{ fontWeight: '500' }}>{p.name}</td>
//                                                     <td style={{ color: '#64748b' }}>{new Date(p.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
//                                                 </tr>
//                                             ))}
//                                         </tbody>
//                                     </table>
//                                 )}
//                             </div>
//                         </>
//                     )}

//                     {/* ── ALL CASES ── */}
//                     {activeTab === 'cases' && (
//                         <>
//                             <h1 style={{ fontFamily: 'Space Grotesk', fontSize: '28px', fontWeight: '700' }}>All Cases</h1>
//                             <p style={{ color: '#64748b', marginBottom: '32px' }}>Every X-ray analysis across all doctors</p>

//                             <div className="card">
//                                 {casesLoading ? (
//                                     <div className="empty-state"><div className="empty-icon">⏳</div><p>Loading cases...</p></div>
//                                 ) : cases.length === 0 ? (
//                                     <div className="empty-state"><div className="empty-icon">📋</div><p>No cases found</p></div>
//                                 ) : (
//                                     <table>
//                                         <thead>
//                                             <tr>
//                                                 <th>Patient</th>
//                                                 <th>Patient ID</th>
//                                                 <th>Prediction</th>
//                                                 <th>Confidence</th>
//                                                 <th>Risk</th>
//                                                 <th>Status</th>
//                                                 <th>Date</th>
//                                             </tr>
//                                         </thead>
//                                         <tbody>
//                                             {cases.map(c => (
//                                                 <tr key={c.id}>
//                                                     <td style={{ fontWeight: '500' }}>{c.patient_name || '—'}</td>
//                                                     <td><span style={{ fontFamily: 'monospace', background: '#f1f5f9', padding: '3px 7px', borderRadius: '5px', fontSize: '13px' }}>{c.patient_id || '—'}</span></td>
//                                                     <td>
//                                                         <span className={`badge ${c.prediction?.toLowerCase().includes('fracture') ? 'badge-fracture' : 'badge-normal'}`}>
//                                                             {c.prediction || '—'}
//                                                         </span>
//                                                     </td>
//                                                     <td>{c.confidence ? `${(c.confidence * 100).toFixed(1)}%` : '—'}</td>
//                                                     <td style={{ color: c.risk_level === 'High' ? '#dc2626' : c.risk_level === 'Moderate' ? '#f97316' : '#16a34a', fontWeight: '500' }}>
//                                                         {c.risk_level || '—'}
//                                                     </td>
//                                                     <td>
//                                                         <span className={`badge ${c.approved ? 'badge-approved' : ''}`} style={!c.approved ? { background: '#fef9c3', color: '#854d0e' } : {}}>
//                                                             {c.approved ? 'Approved' : 'Pending'}
//                                                         </span>
//                                                     </td>
//                                                     <td style={{ color: '#64748b', fontSize: '13px' }}>{c.created_at ? new Date(c.created_at).toLocaleDateString('en-IN') : '—'}</td>
//                                                 </tr>
//                                             ))}
//                                         </tbody>
//                                     </table>
//                                 )}
//                             </div>
//                         </>
//                     )}

//                     {/* ── DOCTORS ── */}
//                     {activeTab === 'doctors' && (
//                         <>
//                             <h1 style={{ fontFamily: 'Space Grotesk', fontSize: '28px', fontWeight: '700' }}>Doctors</h1>
//                             <p style={{ color: '#64748b', marginBottom: '32px' }}>All registered doctors on the platform</p>

//                             <div className="card">
//                                 {doctorsLoading ? (
//                                     <div className="empty-state"><div className="empty-icon">⏳</div><p>Loading doctors...</p></div>
//                                 ) : doctors.length === 0 ? (
//                                     <div className="empty-state"><div className="empty-icon">👨‍⚕️</div><p>No doctors registered yet</p></div>
//                                 ) : (
//                                     <table>
//                                         <thead>
//                                             <tr>
//                                                 <th>#</th>
//                                                 <th>Name</th>
//                                                 <th>Email</th>
//                                                 <th>Joined</th>
//                                             </tr>
//                                         </thead>
//                                         <tbody>
//                                             {doctors.map((d, i) => (
//                                                 <tr key={d.id}>
//                                                     <td style={{ color: '#94a3b8' }}>{i + 1}</td>
//                                                     <td style={{ fontWeight: '500' }}>
//                                                         <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
//                                                             <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg, #1a6fd4, #2d9e5f)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '700', fontSize: '14px' }}>
//                                                                 {(d.username || d.name || 'D')[0].toUpperCase()}
//                                                             </div>
//                                                             {d.username || d.name}
//                                                         </div>
//                                                     </td>
//                                                     <td style={{ color: '#64748b' }}>{d.email}</td>
//                                                     <td style={{ color: '#64748b', fontSize: '13px' }}>{d.created_at ? new Date(d.created_at).toLocaleDateString('en-IN') : '—'}</td>
//                                                 </tr>
//                                             ))}
//                                         </tbody>
//                                     </table>
//                                 )}
//                             </div>
//                         </>
//                     )}

//                     {/* ── MODEL PERFORMANCE ── */}
//                     {activeTab === 'performance' && (
//                         <>
//                             <h1 style={{ fontFamily: 'Space Grotesk', fontSize: '28px', fontWeight: '700' }}>Model Performance</h1>
//                             <p style={{ color: '#64748b', marginBottom: '32px' }}>AI model accuracy and usage statistics</p>

//                             {statsLoading ? (
//                                 <div className="card"><div className="empty-state"><div className="empty-icon">⏳</div><p>Loading stats...</p></div></div>
//                             ) : !stats ? (
//                                 <div className="card"><div className="empty-state"><div className="empty-icon">📈</div><p>No stats available</p></div></div>
//                             ) : (
//                                 <>
//                                     <div className="stat-grid">
//                                         {[
//                                             { label: 'Total Cases', value: stats.total_cases, icon: '📊', color: '#1a6fd4' },
//                                             { label: 'Fractures Detected', value: stats.fractures_detected, icon: '🦴', color: '#ef4444' },
//                                             { label: 'Approved Cases', value: stats.approved_cases, icon: '✅', color: '#22c55e' },
//                                             { label: 'Doctor Overrides', value: stats.overrides, icon: '🔄', color: '#f97316' },
//                                             { label: 'Feedback Records', value: stats.feedback_records, icon: '💬', color: '#8b5cf6' },
//                                             { label: 'Model Accuracy', value: `${stats.model_accuracy}%`, icon: '🎯', color: '#0ea5e9' },
//                                         ].map(s => (
//                                             <div className="stat-card" key={s.label}>
//                                                 <div style={{ fontSize: '28px' }}>{s.icon}</div>
//                                                 <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
//                                                 <div className="stat-label">{s.label}</div>
//                                             </div>
//                                         ))}
//                                     </div>

//                                     <div className="card">
//                                         <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px' }}>Detection Breakdown</h2>
//                                         {[
//                                             { label: 'Fracture Detection Rate', value: stats.total_cases > 0 ? Math.round(stats.fractures_detected / stats.total_cases * 100) : 0, color: '#ef4444' },
//                                             { label: 'Approval Rate', value: stats.total_cases > 0 ? Math.round(stats.approved_cases / stats.total_cases * 100) : 0, color: '#22c55e' },
//                                             { label: 'Override Rate', value: stats.total_cases > 0 ? Math.round(stats.overrides / stats.total_cases * 100) : 0, color: '#f97316' },
//                                             { label: 'Model Accuracy', value: stats.model_accuracy, color: '#1a6fd4' },
//                                         ].map(bar => (
//                                             <div key={bar.label} style={{ marginBottom: '20px' }}>
//                                                 <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
//                                                     <span style={{ fontSize: '14px', fontWeight: '500' }}>{bar.label}</span>
//                                                     <span style={{ fontSize: '14px', fontWeight: '700', color: bar.color }}>{bar.value}%</span>
//                                                 </div>
//                                                 <div className="progress-bar">
//                                                     <div className="progress-fill" style={{ width: `${bar.value}%`, background: bar.color }} />
//                                                 </div>
//                                             </div>
//                                         ))}
//                                     </div>
//                                 </>
//                             )}
//                         </>
//                     )}

//                 </div>
//             </div>
//         </>
//     );
// }

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export default function Hospital() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('patients');

    // Patient Management
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    // Registration form
    const [form, setForm] = useState({ name: '', phone: '', age: '', gender: '', address: '' });

    // All Cases
    const [cases, setCases] = useState([]);
    const [casesLoading, setCasesLoading] = useState(false);

    // Doctors
    const [doctors, setDoctors] = useState([]);
    const [doctorsLoading, setDoctorsLoading] = useState(false);

    // Stats
    const [stats, setStats] = useState(null);
    const [statsLoading, setStatsLoading] = useState(false);

    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    useEffect(() => {
        if (!token || user.role !== 'admin') { navigate('/login'); return; }
        fetchPatients();
    }, []);

    const fetchPatients = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/admin/patients`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) setPatients(await res.json());
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const fetchCases = async () => {
        setCasesLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/admin/cases`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) setCases(await res.json());
        } catch (err) { console.error(err); }
        finally { setCasesLoading(false); }
    };

    const fetchDoctors = async () => {
        setDoctorsLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/admin/doctors`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) setDoctors(await res.json());
        } catch (err) { console.error(err); }
        finally { setDoctorsLoading(false); }
    };

    const fetchStats = async () => {
        setStatsLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/admin/stats`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) setStats(await res.json());
        } catch (err) { console.error(err); }
        finally { setStatsLoading(false); }
    };

    const handleTabChange = (tab) => {
        setActiveTab(tab);
        if (tab === 'patients') fetchPatients();
        if (tab === 'cases') fetchCases();
        if (tab === 'doctors') fetchDoctors();
        if (tab === 'performance') fetchStats();
    };

    const handleFormChange = (e) => {
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const registerPatient = async () => {
        if (!form.name.trim() || !form.phone.trim()) {
            setMessage('❌ Name and Phone are required');
            return;
        }
        try {
            const res = await fetch(`${API_BASE_URL}/api/admin/register-patient`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ ...form, age: form.age ? parseInt(form.age) : null })
            });
            const data = await res.json();
            if (res.ok) {
                setMessage(`✅ Patient registered! ID: ${data.patient_id}`);
                setForm({ name: '', phone: '', age: '', gender: '', address: '' });
                fetchPatients();
            } else {
                setMessage(`❌ ${data.detail || 'Registration failed'}`);
            }
        } catch {
            setMessage('❌ Server error. Please try again.');
        }
    };

    const logout = () => { localStorage.clear(); navigate('/login'); };

    const navItems = [
        { id: 'patients', icon: '👥', label: 'Patient Management' },
        { id: 'cases', icon: '📋', label: 'All Cases' },
        { id: 'doctors', icon: '👨‍⚕️', label: 'Doctors' },
        { id: 'performance', icon: '📈', label: 'Model Performance' },
    ];

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Space+Grotesk:wght@400;500;600;700&display=swap');
                * { box-sizing: border-box; margin: 0; padding: 0; }
                body { font-family: 'DM Sans', sans-serif; background: #f4f7fc; color: #1a2236; }
                .layout { display: flex; min-height: 100vh; }
                .sidebar { width: 260px; background: #0f172a; color: white; padding: 28px 20px; position: fixed; height: 100vh; display: flex; flex-direction: column; }
                .logo { display: flex; align-items: center; gap: 12px; margin-bottom: 40px; }
                .logo-icon { width: 48px; height: 48px; background: linear-gradient(135deg, #1a6fd4, #2d9e5f); border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 24px; }
                .logo-text { font-family: 'Space Grotesk', sans-serif; font-weight: 700; font-size: 22px; }
                .nav-item { padding: 14px 16px; margin-bottom: 6px; border-radius: 10px; display: flex; align-items: center; gap: 12px; font-size: 14.5px; cursor: pointer; transition: 0.2s; color: rgba(255,255,255,0.7); }
                .nav-item:hover { background: rgba(255,255,255,0.1); color: white; }
                .nav-item.active { background: rgba(26,111,212,0.3); color: #60a5fa; }
                .logout-btn { margin-top: auto; padding: 12px 16px; border-radius: 10px; display: flex; align-items: center; gap: 12px; font-size: 14px; cursor: pointer; color: rgba(255,255,255,0.5); background: transparent; border: none; width: 100%; transition: 0.2s; }
                .logout-btn:hover { background: rgba(239,68,68,0.2); color: #fca5a5; }
                .main { margin-left: 260px; flex: 1; padding: 40px; }
                .card { background: white; border-radius: 16px; padding: 28px; margin-bottom: 24px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); }
                .page-title { font-family: 'Space Grotesk', sans-serif; font-size: 28px; font-weight: 700; margin-bottom: 6px; }
                .page-sub { color: #64748b; font-size: 14px; margin-bottom: 32px; }
                .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 20px; }
                .form-field { display: flex; flex-direction: column; gap: 8px; }
                .form-field.full { grid-column: 1 / -1; }
                .form-field label { font-size: 13px; font-weight: 600; color: #374151; }
                .form-field input, .form-field select, .form-field textarea { padding: 12px 14px; border: 1.5px solid #e2e8f2; border-radius: 10px; font-size: 14px; font-family: 'DM Sans', sans-serif; outline: none; background: #fafbfc; transition: 0.2s; }
                .form-field input:focus, .form-field select:focus, .form-field textarea:focus { border-color: #1a6fd4; background: white; box-shadow: 0 0 0 3px rgba(26,111,212,0.08); }
                .btn-primary { padding: 13px 28px; background: #1a6fd4; color: white; border: none; border-radius: 10px; cursor: pointer; font-size: 15px; font-weight: 600; transition: 0.2s; font-family: 'DM Sans', sans-serif; }
                .btn-primary:hover { background: #1558b0; }
                table { width: 100%; border-collapse: collapse; margin-top: 16px; }
                th { padding: 12px 16px; text-align: left; background: #f8fafc; font-size: 12px; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
                td { padding: 13px 16px; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
                tr:last-child td { border-bottom: none; }
                tr:hover td { background: #fafbfc; }
                .badge { display: inline-block; padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: 600; }
                .badge-fracture { background: #fee2e2; color: #dc2626; }
                .badge-normal { background: #dcfce7; color: #16a34a; }
                .badge-approved { background: #dbeafe; color: #1d4ed8; }
                .badge-pending { background: #fef9c3; color: #854d0e; }
                .pill { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 12px; background: #f1f5f9; color: #475569; font-weight: 500; }
                .empty-state { text-align: center; padding: 60px 20px; color: #94a3b8; }
                .stat-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 24px; }
                .stat-card { background: white; border-radius: 16px; padding: 24px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); }
                .stat-value { font-family: 'Space Grotesk', sans-serif; font-size: 36px; font-weight: 700; margin: 8px 0 4px; }
                .stat-label { font-size: 13px; color: #64748b; }
                .progress-bar { height: 8px; background: #f1f5f9; border-radius: 4px; overflow: hidden; margin-top: 8px; }
                .progress-fill { height: 100%; border-radius: 4px; }
                .msg-success { color: #16a34a; font-weight: 500; margin-top: 14px; padding: 10px 14px; background: #f0fdf4; border-radius: 8px; border: 1px solid #bbf7d0; }
                .msg-error { color: #dc2626; font-weight: 500; margin-top: 14px; padding: 10px 14px; background: #fef2f2; border-radius: 8px; border: 1px solid #fecaca; }
            `}</style>

            <div className="layout">
                <div className="sidebar">
                    <div className="logo">
                        <div className="logo-icon">🏥</div>
                        <div className="logo-text">Hospital Control</div>
                    </div>
                    {navItems.map(item => (
                        <div key={item.id} className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
                            onClick={() => handleTabChange(item.id)}>
                            <span>{item.icon}</span> {item.label}
                        </div>
                    ))}
                    <button className="logout-btn" onClick={logout}><span>🚪</span> Logout</button>
                </div>

                <div className="main">

                    {/* ── PATIENT MANAGEMENT ── */}
                    {activeTab === 'patients' && (
                        <>
                            <div className="page-title">Patient Management</div>
                            <div className="page-sub">Register new patients with their details for hospital records</div>

                            <div className="card">
                                <h2 style={{ fontSize: '18px', fontWeight: '600' }}>Register New Patient</h2>
                                <p style={{ color: '#64748b', fontSize: '13px', marginTop: '4px' }}>A unique Hospital ID (PT-XXX) will be auto-generated</p>

                                <div className="form-grid">
                                    <div className="form-field">
                                        <label>Full Name *</label>
                                        <input name="name" placeholder="Patient's full name" value={form.name} onChange={handleFormChange} />
                                    </div>
                                    <div className="form-field">
                                        <label>Phone Number *</label>
                                        <input name="phone" type="tel" placeholder="10-digit mobile number" value={form.phone} onChange={handleFormChange} />
                                    </div>
                                    <div className="form-field">
                                        <label>Age</label>
                                        <input name="age" type="number" placeholder="e.g. 35" min="0" max="120" value={form.age} onChange={handleFormChange} />
                                    </div>
                                    <div className="form-field">
                                        <label>Gender</label>
                                        <select name="gender" value={form.gender} onChange={handleFormChange}>
                                            <option value="">Select gender</option>
                                            <option value="Male">Male</option>
                                            <option value="Female">Female</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                    <div className="form-field full">
                                        <label>Address</label>
                                        <input name="address" placeholder="Street, City, State" value={form.address} onChange={handleFormChange} />
                                    </div>
                                </div>

                                <div style={{ marginTop: '20px' }}>
                                    <button className="btn-primary" onClick={registerPatient}>Register Patient</button>
                                </div>

                                {message && (
                                    <div className={message.includes('✅') ? 'msg-success' : 'msg-error'}>{message}</div>
                                )}
                            </div>

                            <div className="card">
                                <h2 style={{ fontSize: '18px', fontWeight: '600' }}>Registered Patients ({patients.length})</h2>
                                {loading ? (
                                    <div className="empty-state">⏳ Loading...</div>
                                ) : patients.length === 0 ? (
                                    <div className="empty-state"><div style={{ fontSize: '40px', marginBottom: '12px' }}>👥</div><p>No patients registered yet</p></div>
                                ) : (
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>Hospital ID</th>
                                                <th>Name</th>
                                                <th>Phone</th>
                                                <th>Age</th>
                                                <th>Gender</th>
                                                <th>Address</th>
                                                <th>Registered</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {patients.map(p => (
                                                <tr key={p.patient_id}>
                                                    <td><span style={{ fontFamily: 'monospace', background: '#f1f5f9', padding: '4px 8px', borderRadius: '6px', fontWeight: '600' }}>{p.patient_id}</span></td>
                                                    <td style={{ fontWeight: '500' }}>{p.name}</td>
                                                    <td>{p.phone || '—'}</td>
                                                    <td>{p.age || '—'}</td>
                                                    <td>{p.gender ? <span className="pill">{p.gender}</span> : '—'}</td>
                                                    <td style={{ color: '#64748b', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.address || '—'}</td>
                                                    <td style={{ color: '#64748b', fontSize: '13px' }}>{p.created_at ? new Date(p.created_at).toLocaleDateString('en-IN') : '—'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </>
                    )}

                    {/* ── ALL CASES ── */}
                    {activeTab === 'cases' && (
                        <>
                            <div className="page-title">All Cases</div>
                            <div className="page-sub">Every X-ray analysis across all doctors</div>
                            <div className="card" style={{ padding: 0 }}>
                                {casesLoading ? (
                                    <div className="empty-state">⏳ Loading cases...</div>
                                ) : cases.length === 0 ? (
                                    <div className="empty-state"><div style={{ fontSize: '40px', marginBottom: '12px' }}>📋</div><p>No cases found</p></div>
                                ) : (
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>Patient</th><th>Patient ID</th><th>Prediction</th>
                                                <th>Confidence</th><th>Risk</th><th>Status</th><th>Date</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {cases.map(c => (
                                                <tr key={c.id}>
                                                    <td style={{ fontWeight: '500' }}>{c.patient_name || '—'}</td>
                                                    <td><span style={{ fontFamily: 'monospace', background: '#f1f5f9', padding: '3px 8px', borderRadius: '5px', fontSize: '13px' }}>{c.patient_id || '—'}</span></td>
                                                    <td><span className={`badge ${c.prediction?.toLowerCase().includes('fracture') ? 'badge-fracture' : 'badge-normal'}`}>{c.prediction || '—'}</span></td>
                                                    <td>{c.confidence ? `${(c.confidence * 100).toFixed(1)}%` : '—'}</td>
                                                    <td style={{ color: c.risk_level === 'High' ? '#ef4444' : c.risk_level === 'Moderate' ? '#f97316' : '#16a34a', fontWeight: '500' }}>{c.risk_level || '—'}</td>
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

                    {/* ── DOCTORS ── */}
                    {activeTab === 'doctors' && (
                        <>
                            <div className="page-title">Doctors</div>
                            <div className="page-sub">All registered doctors on the platform</div>
                            <div className="card" style={{ padding: 0 }}>
                                {doctorsLoading ? (
                                    <div className="empty-state">⏳ Loading...</div>
                                ) : doctors.length === 0 ? (
                                    <div className="empty-state"><div style={{ fontSize: '40px', marginBottom: '12px' }}>👨‍⚕️</div><p>No doctors registered yet</p></div>
                                ) : (
                                    <table>
                                        <thead><tr><th>#</th><th>Name</th><th>Email</th><th>Joined</th></tr></thead>
                                        <tbody>
                                            {doctors.map((d, i) => (
                                                <tr key={d.id}>
                                                    <td style={{ color: '#94a3b8' }}>{i + 1}</td>
                                                    <td style={{ fontWeight: '500' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg, #1a6fd4, #2d9e5f)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '700', fontSize: '14px', flexShrink: 0 }}>
                                                                {(d.name || 'D')[0].toUpperCase()}
                                                            </div>
                                                            {d.name}
                                                        </div>
                                                    </td>
                                                    <td style={{ color: '#64748b' }}>{d.email}</td>
                                                    <td style={{ color: '#64748b', fontSize: '13px' }}>{d.created_at ? new Date(d.created_at).toLocaleDateString('en-IN') : '—'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </>
                    )}

                    {/* ── MODEL PERFORMANCE ── */}
                    {activeTab === 'performance' && (
                        <>
                            <div className="page-title">Model Performance</div>
                            <div className="page-sub">AI model accuracy and usage statistics</div>
                            {statsLoading ? (
                                <div className="card"><div className="empty-state">⏳ Loading stats...</div></div>
                            ) : !stats ? (
                                <div className="card"><div className="empty-state">No stats available</div></div>
                            ) : (
                                <>
                                    <div className="stat-grid">
                                        {[
                                            { label: 'Total Cases', value: stats.total_cases, color: '#1a6fd4', icon: '📊' },
                                            { label: 'Fractures Detected', value: stats.fractures_detected, color: '#ef4444', icon: '🦴' },
                                            { label: 'Approved Cases', value: stats.approved_cases, color: '#22c55e', icon: '✅' },
                                            { label: 'Doctor Overrides', value: stats.overrides, color: '#f97316', icon: '🔄' },
                                            { label: 'Feedback Records', value: stats.feedback_records, color: '#8b5cf6', icon: '💬' },
                                            { label: 'Model Accuracy', value: `${stats.model_accuracy}%`, color: '#0ea5e9', icon: '🎯' },
                                        ].map(s => (
                                            <div className="stat-card" key={s.label}>
                                                <div style={{ fontSize: '28px' }}>{s.icon}</div>
                                                <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
                                                <div className="stat-label">{s.label}</div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="card">
                                        <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px' }}>Detection Breakdown</h2>
                                        {[
                                            { label: 'Fracture Detection Rate', value: stats.total_cases > 0 ? Math.round(stats.fractures_detected / stats.total_cases * 100) : 0, color: '#ef4444' },
                                            { label: 'Approval Rate', value: stats.total_cases > 0 ? Math.round(stats.approved_cases / stats.total_cases * 100) : 0, color: '#22c55e' },
                                            { label: 'Override Rate', value: stats.total_cases > 0 ? Math.round(stats.overrides / stats.total_cases * 100) : 0, color: '#f97316' },
                                            { label: 'Model Accuracy', value: stats.model_accuracy, color: '#1a6fd4' },
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
                        </>
                    )}
                </div>
            </div>
        </>
    );
}