import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import ThemeToggle from '../components/ThemeToggle';

function Patient() {
    const { id } = useParams();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

    useEffect(() => {
        const fetchCase = async () => {
            try {
                const resp = await fetch(`${API_BASE_URL}/api/case/${id}`);
                if (!resp.ok) throw new Error("Case not found or expired.");
                const result = await resp.json();
                setData(result);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchCase();
    }, [id, API_BASE_URL]);

    if (loading) return <div className="loading-screen"><p>Loading medical report...</p></div>;
    if (error) return <div className="error-screen"><h2>Error</h2><p>{error}</p></div>;

    return (
        <div className="patient-page">
            <ThemeToggle />
            <header className="header">
                <h1>⚕️ Patient Health Portal</h1>
                <p>Official X-Ray Analysis & Fracture Diagnostics Report</p>
            </header>

            <main className="main-content">
                <div className="results-section">
                    <div className="visuals">
                        <div className="image-card">
                            <h3>Original X-Ray</h3>
                            <img src={data.image_base64} alt="Original X-Ray" />
                        </div>
                        <div className="image-card">
                            <h3>Diagnostic Overlay (Heatmap)</h3>
                            <img src={data.heatmap_base64} alt="Heatmap Result" />
                            <div className="heatmap-legend">
                                <div className="legend-item">
                                    <span className="dot hot"></span> <span>Pathology Focus</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="diagnosis-panel">
                        <div className="patient-identity-box">
                            <div className="id-item">
                                <span className="label">Patient Name:</span>
                                <span className="val">{data.patient_name}</span>
                            </div>
                            <div className="id-item">
                                <span className="label">Patient ID:</span>
                                <span className="val">#{data.patient_id}</span>
                            </div>
                            <div className="id-item">
                                <span className="label">Record Date:</span>
                                <span className="val">{data.timestamp}</span>
                            </div>
                        </div>

                        <div className="panel-header" style={{ marginTop: '1.5rem' }}>
                            <h2>Diagnostic Summary</h2>
                            {data.approved && <span className="verified-badge">✓ Physician Validated</span>}
                        </div>

                        <div className={`diagnosis-badge ${data.diagnosis === 'Normal' ? 'normal' : 'fracture'}`}>
                            {data.diagnosis}
                        </div>

                        <p>Confidence Level: {(data.probability * 100).toFixed(1)}%</p>

                        <div className="risk-meter">
                            <h4>Recovery Risk: {data.risk_level}</h4>
                            <div className="progress-bar">
                                <div className="progress-fill" style={{ width: `${data.risk_score}%` }}></div>
                            </div>
                        </div>

                        {data.doctor_notes && (
                            <div className="explanation-box" style={{ marginTop: '2rem', borderLeftColor: '#10b981' }}>
                                <h3>Physician Recommendations</h3>
                                <p className="exp-text" style={{ fontStyle: 'italic', color: '#1e293b' }}>
                                    "{data.doctor_notes}"
                                </p>
                            </div>
                        )}

                        <div className="explanation-box" style={{ marginTop: '2rem' }}>
                            <h3>Patient Instructions</h3>
                            <p className="exp-text">
                                This report was generated using AI-assisted diagnostic tools and {data.approved ? "has been validated by a licensed physician" : "is currently awaiting physician review"}.
                            </p>
                        </div>
                    </div>
                </div>


            </main>
        </div>
    );
}

export default Patient;
