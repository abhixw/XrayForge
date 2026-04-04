import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export default function Hospital() {
    const navigate = useNavigate();
    const [patients, setPatients] = useState([]);
    const [newPatientName, setNewPatientName] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    useEffect(() => {
        if (!token || user.role !== 'admin') {
            navigate('/login');
        } else {
            fetchPatients();
        }
    }, [token, user.role, navigate]);

    const fetchPatients = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/admin/patients`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setPatients(data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const registerPatient = async () => {
        if (!newPatientName.trim()) {
            setMessage("Please enter patient name");
            return;
        }

        try {
            const res = await fetch(`${API_BASE_URL}/api/admin/register-patient`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ name: newPatientName.trim() })
            });

            const data = await res.json();

            if (res.ok) {
                setMessage(`✅ Patient registered! ID: ${data.patient_id}`);
                setNewPatientName('');
                fetchPatients();        // ← This refreshes the list
            } else {
                setMessage(data.detail || "Failed to register patient");
            }
        } catch (err) {
            setMessage("Server error. Please try again.");
        }
    };

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Space+Grotesk:wght@400;500;600;700&display=swap');
                * { box-sizing: border-box; margin: 0; padding: 0; }
                body { font-family: 'DM Sans', sans-serif; background: #f4f7fc; color: #1a2236; }

                .hospital-layout { display: flex; min-height: 100vh; }
                .sidebar { width: 260px; background: #0f172a; color: white; padding: 28px 20px; position: fixed; height: 100vh; }
                .logo { display: flex; align-items: center; gap: 12px; margin-bottom: 40px; }
                .logo-icon { width: 48px; height: 48px; background: linear-gradient(135deg, #1a6fd4, #2d9e5f); border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 24px; }
                .logo-text { font-family: 'Space Grotesk', sans-serif; font-weight: 700; font-size: 22px; }

                .nav-item { padding: 14px 16px; margin-bottom: 6px; border-radius: 10px; display: flex; align-items: center; gap: 12px; font-size: 14.5px; cursor: pointer; transition: 0.2s; }
                .nav-item:hover { background: rgba(255,255,255,0.1); }
                .nav-item.active { background: rgba(26,111,212,0.3); color: #60a5fa; }

                .main-content { margin-left: 260px; flex: 1; padding: 40px; }
                .card { background: white; border-radius: 16px; padding: 24px; margin-bottom: 24px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); }
                .btn-primary { padding: 12px 24px; background: #1a6fd4; color: white; border: none; border-radius: 10px; cursor: pointer; }
            `}</style>

            <div className="hospital-layout">
                {/* Sidebar */}
                <div className="sidebar">
                    <div className="logo">
                        <div className="logo-icon">🏥</div>
                        <div className="logo-text">Hospital Control</div>
                    </div>
                    <div className="nav-item active"><span>👥</span> Patient Management</div>
                    <div className="nav-item"><span>📋</span> All Cases</div>
                    <div className="nav-item"><span>👨‍⚕️</span> Doctors</div>
                    <div className="nav-item"><span>📈</span> Model Performance</div>
                </div>

                {/* Main Content */}
                <div className="main-content">
                    <h1 style={{ fontFamily: 'Space Grotesk', fontSize: '28px', fontWeight: '700' }}>Patient Management</h1>
                    <p style={{ color: '#64748b', marginBottom: '32px' }}>Register new patients and manage records</p>

                    {/* Register New Patient */}
                    <div className="card">
                        <h2>Register New Patient</h2>
                        <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                            <input
                                type="text"
                                placeholder="Enter Full Patient Name"
                                value={newPatientName}
                                onChange={(e) => setNewPatientName(e.target.value)}
                                style={{ flex: 1, padding: '14px', border: '1px solid #e2e8f2', borderRadius: '10px', fontSize: '15px' }}
                            />
                            <button onClick={registerPatient} className="btn-primary">
                                Register Patient
                            </button>
                        </div>
                        {message && <p style={{ marginTop: '12px', color: message.includes('✅') ? 'green' : 'red' }}>{message}</p>}
                    </div>

                    {/* Patients List */}
                    <div className="card">
                        <h2>All Registered Patients ({patients.length})</h2>
                        {patients.length === 0 ? (
                            <p style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>No patients registered yet</p>
                        ) : (
                            <table style={{ width: '100%', marginTop: '16px', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ background: '#f8fafc' }}>
                                        <th style={{ padding: '12px', textAlign: 'left' }}>Patient ID</th>
                                        <th style={{ padding: '12px', textAlign: 'left' }}>Name</th>
                                        <th style={{ padding: '12px', textAlign: 'left' }}>Registered On</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {patients.map(p => (
                                        <tr key={p.patient_id} style={{ borderBottom: '1px solid #e2e8f2' }}>
                                            <td style={{ padding: '12px', fontFamily: 'monospace' }}>{p.patient_id}</td>
                                            <td style={{ padding: '12px' }}>{p.name}</td>
                                            <td style={{ padding: '12px', color: '#64748b' }}>{new Date(p.created_at).toLocaleDateString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}