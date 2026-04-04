import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export default function PatientHome() {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    const [cases, setCases] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!user || user.role !== 'patient') {
            navigate('/login');
            return;
        }
        fetchCases();
    }, [user, navigate]);

    const fetchCases = async () => {
        try {
            const token = localStorage.getItem('token');
            const resp = await fetch(`${API_BASE_URL}/api/cases`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!resp.ok) {
                if (resp.status === 401) throw new Error("Session expired. Please login again.");
                throw new Error("Failed to load reports.");
            }

            const data = await resp.json();
            setCases(data);
        } catch (err) {
            console.error(err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.clear();
        navigate('/login');
    };

    if (error) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#f4f7fc', fontFamily: 'DM Sans, sans-serif' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
                <div style={{ fontSize: '18px', fontWeight: 600, color: '#1a2236', marginBottom: '12px' }}>{error}</div>
                <button onClick={handleLogout} style={{ padding: '10px 24px', background: '#1a6fd4', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
                    Go to Login
                </button>
            </div>
        );
    }

    return (
        <>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Space+Grotesk:wght@400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'DM Sans', sans-serif; background: #f4f7fc; color: #1a2236; min-height: 100vh; }

        .patient-home { max-width: 860px; margin: 0 auto; padding: 40px 24px; }

        .ph-header {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 28px; background: #fff;
          padding: 18px 24px; border-radius: 16px; border: 1px solid #e2e8f2;
        }

        .ph-logo { display: flex; align-items: center; gap: 10px; }

        .ph-logo-icon {
          width: 40px; height: 40px;
          background: linear-gradient(135deg, #1a6fd4, #2d9e5f);
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          font-size: 20px;
        }

        .ph-logo-text {
          font-family: 'Space Grotesk', sans-serif;
          font-weight: 700; font-size: 18px; color: #1a2236;
        }

        .ph-user { display: flex; align-items: center; gap: 12px; }

        .ph-avatar {
          width: 36px; height: 36px; border-radius: 50%;
          background: linear-gradient(135deg, #1a6fd4, #2d9e5f);
          display: flex; align-items: center; justify-content: center;
          font-size: 13px; font-weight: 700; color: #fff;
        }

        .ph-username { font-size: 14px; font-weight: 600; color: #1a2236; }
        .ph-role { font-size: 11px; color: #6b7a99; }

        .logout-btn {
          padding: 7px 14px; border: 1.5px solid #e2e8f2;
          border-radius: 8px; background: #fff; color: #d63c3c;
          font-size: 12px; font-weight: 600; cursor: pointer;
        }
        .logout-btn:hover { background: #fef0f0; border-color: #f5c2c2; }

        .welcome-box {
          background: linear-gradient(135deg, #0f1e3d, #1a3a6d);
          border-radius: 16px; padding: 28px; margin-bottom: 28px; color: #fff;
        }

        .welcome-title { font-family: 'Space Grotesk', sans-serif; font-size: 22px; font-weight: 700; margin-bottom: 6px; }
        .welcome-sub { font-size: 14px; color: rgba(255,255,255,0.6); }

        .section-title { font-family: 'Space Grotesk', sans-serif; font-size: 16px; font-weight: 600; color: #1a2236; margin-bottom: 16px; }

        .cases-list { display: flex; flex-direction: column; gap: 12px; }

        .case-card {
          background: #fff; border-radius: 14px;
          padding: 18px 22px; border: 1px solid #e2e8f2;
          display: flex; align-items: center; justify-content: space-between;
          transition: all 0.18s; cursor: pointer;
        }

        .case-card:hover { border-color: #1a6fd4; box-shadow: 0 4px 16px rgba(26,111,212,0.1); }

        .case-left { display: flex; flex-direction: column; gap: 5px; }
        .case-patient { font-size: 14px; font-weight: 600; color: #1a2236; }
        .case-id { font-size: 11px; font-family: monospace; color: #6b7a99; }
        .case-date { font-size: 12px; color: #94a3b8; }

        .case-right { display: flex; align-items: center; gap: 12px; }

        .diag-pill {
          display: inline-flex; align-items: center; gap: 4px;
          padding: 5px 12px; border-radius: 20px;
          font-size: 12px; font-weight: 700;
        }
        .diag-fracture { background: #fef0f0; color: #d63c3c; border: 1px solid #f5c2c2; }
        .diag-normal { background: #eaf7f0; color: #2d9e5f; border: 1px solid #b8e8cf; }

        .risk-tag { font-size: 11px; font-weight: 600; padding: 4px 10px; border-radius: 20px; }
        .risk-high { background: #fef0f0; color: #d63c3c; }
        .risk-moderate { background: #fff4e6; color: #e8820c; }
        .risk-low { background: #eaf7f0; color: #2d9e5f; }

        .approved-tag { background: #e8f2fd; color: #1a6fd4; padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 700; }
        .pending-tag { background: #fff4e6; color: #e8820c; padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 700; }

        .view-btn {
          padding: 7px 16px; background: #1a6fd4; color: #fff; border: none; border-radius: 8px;
          font-size: 12px; font-weight: 600; cursor: pointer;
        }
        .view-btn:hover { background: #155db8; }

        .empty-state {
          text-align: center; padding: 56px 24px; color: #6b7a99; font-size: 14px;
          background: #fff; border-radius: 16px; border: 1px solid #e2e8f2;
        }
      `}</style>

            <div className="patient-home">

                <div className="ph-header">
                    <div className="ph-logo">
                        <div className="ph-logo-icon">🩻</div>
                        <div className="ph-logo-text">FractureAI</div>
                    </div>
                    <div className="ph-user">
                        <div className="ph-avatar">
                            {(user?.username || 'P').slice(0, 1).toUpperCase()}
                        </div>
                        <div>
                            <div className="ph-username">{user?.username || 'Patient'}</div>
                            <div className="ph-role">Patient Portal</div>
                        </div>
                        <button className="logout-btn" onClick={() => { localStorage.clear(); navigate('/login'); }}>Logout</button>
                    </div>
                </div>

                <div className="welcome-box">
                    <div className="welcome-title">Welcome, {user?.username || 'Patient'} 👋</div>
                    <div className="welcome-sub">Your approved medical reports are listed below.</div>
                </div>

                <div className="section-title">
                    My Medical Reports {!loading && `(${cases.length})`}
                </div>

                {loading ? (
                    <div className="empty-state">Loading your reports...</div>
                ) : cases.length === 0 ? (
                    <div className="empty-state">
                        <div style={{ fontSize: '44px', marginBottom: '14px' }}>📋</div>
                        <div className="empty-title">No reports yet</div>
                        Your doctor hasn't generated any approved reports yet.
                    </div>
                ) : (
                    <div className="cases-list">
                        {cases.map((c) => (
                            <div key={c.id} className="case-card" onClick={() => navigate(`/patient/${c.id}`)}>
                                <div className="case-left">
                                    <div className="case-patient">{c.patient_name || 'Anonymous'}</div>
                                    <div className="case-id">Case ID: {c.id?.slice(0, 8)}</div>
                                    <div className="case-date">
                                        {c.created_at ? new Date(c.created_at).toLocaleDateString() : 'Date unavailable'}
                                    </div>
                                </div>

                                <div className="case-right">
                                    <span className={`diag-pill ${c.prediction === 'Fracture Detected' ? 'diag-fracture' : 'diag-normal'}`}>
                                        {c.prediction === 'Fracture Detected' ? '🦴 Fracture' : '✓ Normal'}
                                    </span>
                                    <span className={`risk-tag ${c.risk_level === 'High' ? 'risk-high' : c.risk_level === 'Moderate' ? 'risk-moderate' : 'risk-low'}`}>
                                        {c.risk_level} Risk
                                    </span>
                                    <span className={c.approved ? 'approved-tag' : 'pending-tag'}>
                                        {c.approved ? '✓ Verified' : '⏳ Pending'}
                                    </span>
                                    <button className="view-btn" onClick={(e) => { e.stopPropagation(); navigate(`/patient/${c.id}`); }}>
                                        View Report
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}