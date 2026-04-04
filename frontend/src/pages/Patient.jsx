import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export default function Patient() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchCase = async () => {
            try {
                const token = localStorage.getItem('token');
                const resp = await fetch(`${API_BASE_URL}/api/case/${id}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (!resp.ok) {
                    if (resp.status === 401) throw new Error("Session expired. Please login again.");
                    throw new Error("Case not found or expired.");
                }

                const result = await resp.json();
                setData(result);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchCase();
    }, [id]);

    if (loading) {
        return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#f4f7fc' }}>Loading medical report...</div>;
    }

    if (error) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#f4f7fc' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
                <div style={{ fontSize: '18px', fontWeight: 600, marginBottom: '12px' }}>Report Not Found</div>
                <div style={{ color: '#6b7a99', marginBottom: '32px' }}>{error}</div>
                <button onClick={() => navigate('/patient-home')} style={{ padding: '12px 28px', background: '#1a6fd4', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer' }}>
                    ← Back to My Reports
                </button>
            </div>
        );
    }

    const isFracture = data.prediction === 'Fracture Detected';

    return (
        <>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Space+Grotesk:wght@400;500;600;700&display=swap');
        body { font-family: 'DM Sans', sans-serif; background: #f4f7fc; color: #1a2236; min-height: 100vh; }

        .report-page { max-width: 960px; margin: 0 auto; padding: 40px 24px; }

        .report-header {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 28px; background: #fff; padding: 18px 24px; border-radius: 16px; border: 1px solid #e2e8f2;
        }

        .logo-wrap { display: flex; align-items: center; gap: 10px; }

        .logo-icon {
          width: 40px; height: 40px;
          background: linear-gradient(135deg, #1a6fd4, #2d9e5f);
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          font-size: 20px;
        }

        .logo-text { font-family: 'Space Grotesk', sans-serif; font-weight: 700; font-size: 18px; color: #1a2236; }

        .back-btn {
          padding: 8px 18px; border: 1.5px solid #e2e8f2; border-radius: 8px; background: #fff; color: #1a6fd4;
          font-size: 13px; font-weight: 600; cursor: pointer;
        }
        .back-btn:hover { background: #e8f2fd; }

        .report-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }

        .card { background: #fff; border-radius: 16px; border: 1px solid #e2e8f2; overflow: hidden; }

        .card-header { padding: 16px 20px; border-bottom: 1px solid #e2e8f2; font-weight: 600; }

        .card-body { padding: 20px; }

        .heatmap-img { width: 100%; border-radius: 10px; display: block; }

        .diag-badge {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 10px 20px; border-radius: 20px; font-size: 15px; font-weight: 700;
        }
        .badge-fracture { background: #fef0f0; color: #d63c3c; border: 1.5px solid #f5c2c2; }
        .badge-normal { background: #eaf7f0; color: #2d9e5f; border: 1.5px solid #b8e8cf; }

        .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e2e8f2; font-size: 13px; }
        .info-row:last-child { border-bottom: none; }
        .info-key { color: #6b7a99; }
        .info-val { font-weight: 600; }

        .risk-bar { height: 10px; background: #e2e8f2; border-radius: 5px; overflow: hidden; margin: 8px 0; }
        .risk-fill { height: 100%; border-radius: 5px; background: linear-gradient(90deg, #2d9e5f, #1a6fd4, #e8820c, #d63c3c); }

        .notes-box { background: #f8fafd; border-radius: 10px; padding: 14px 16px; border-left: 3px solid #2d9e5f; font-style: italic; }
      `}</style>

            <div className="report-page">

                <div className="report-header">
                    <div className="logo-wrap">
                        <div className="logo-icon">🩻</div>
                        <div className="logo-text">FractureAI — Medical Report</div>
                    </div>
                    <button className="back-btn" onClick={() => navigate('/patient-home')}>
                        ← Back to Reports
                    </button>
                </div>

                <div className="report-grid">

                    <div className="card">
                        <div className="card-header">Diagnostic Heatmap</div>
                        <div className="card-body">
                            <img src={data.heatmap_base64} alt="Grad-CAM" className="heatmap-img" />
                        </div>
                    </div>

                    <div className="card">
                        <div className="card-header">Diagnostic Summary</div>
                        <div className="card-body">
                            <div className="diag-badge" style={{ background: isFracture ? '#fef0f0' : '#eaf7f0', color: isFracture ? '#d63c3c' : '#2d9e5f' }}>
                                {isFracture ? '🦴 Fracture Detected' : '✓ Normal'}
                            </div>

                            <div className="info-row"><span className="info-key">Confidence</span><span className="info-val">{(data.confidence * 100).toFixed(1)}%</span></div>
                            <div className="info-row"><span className="info-key">Risk Level</span><span className="info-val">{data.risk_level}</span></div>
                            <div className="info-row"><span className="info-key">Risk Score</span><span className="info-val">{data.risk_score}</span></div>
                            <div className="info-row"><span className="info-key">Patient</span><span className="info-val">{data.patient_name || 'Anonymous'}</span></div>

                            <div className="risk-bar"><div className="risk-fill" style={{ width: `${data.risk_score}%` }}></div></div>
                        </div>
                    </div>

                    {data.notes && (
                        <div className="card">
                            <div className="card-header">Physician Notes</div>
                            <div className="card-body">
                                <div className="notes-box">"{data.notes}"</div>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </>
    );
}
