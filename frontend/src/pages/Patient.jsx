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

    if (loading) {
        return <div className="loading-screen"><p>Loading medical report...</p></div>;
    }

    if (error) {
        return <div className="error-screen"><h2>Error</h2><p>{error}</p></div>;
    }

    return (
        <div className="patient-page">
            <ThemeToggle />

            <header className="header">
                <h1>⚕️ Patient Health Portal</h1>
                <p>AI-assisted X-Ray Diagnostic Report</p>
            </header>

            <main className="main-content">
                <div className="results-section">

                    {/* VISUALS */}
                    <div className="visuals">
                        <div className="image-card">
                            <h3>Original X-Ray</h3>
                            <p className="no-preview">
                                Image not available (stored on server)
                            </p>
                        </div>

                        <div className="image-card">
                            <h3>Diagnostic Overlay (Heatmap)</h3>
                            <img src={data.heatmap_base64} alt="Heatmap Result" />

                            <div className="heatmap-legend">
                                <div className="legend-item">
                                    <span className="dot hot"></span> Primary Focus
                                </div>
                                <div className="legend-item">
                                    <span className="dot mid"></span> Supporting Region
                                </div>
                                <div className="legend-item">
                                    <span className="dot cold"></span> Minimal Significance
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* DIAGNOSIS */}
                    <div className="diagnosis-panel">

                        <div className="panel-header">
                            <h2>Diagnostic Summary</h2>

                            {data.approved && (
                                <span className="verified-badge">
                                    ✓ Physician Validated
                                </span>
                            )}
                        </div>

                        {!data.approved && (
                            <p className="warning-text">
                                ⚠️ Awaiting doctor validation
                            </p>
                        )}

                        <div className={`diagnosis-badge ${data.prediction === 'Normal' ? 'normal' : 'fracture'}`}>
                            {data.prediction}
                        </div>

                        <p>
                            Confidence Level: {(data.confidence * 100).toFixed(1)}%
                        </p>

                        {/* RISK */}
                        <div className="risk-meter">
                            <h4>
                                Severity Indicator: {data.risk_level} ({data.risk_score}/100)
                            </h4>

                            <div className="progress-bar">
                                <div
                                    className="progress-fill"
                                    style={{ width: `${data.risk_score}%` }}
                                ></div>
                            </div>
                        </div>

                        {/* DOCTOR NOTES */}
                        {data.notes && (
                            <div className="explanation-box" style={{ marginTop: '2rem', borderLeftColor: '#10b981' }}>
                                <h3>Physician Notes</h3>
                                <p className="exp-text">
                                    "{data.notes}"
                                </p>
                            </div>
                        )}

                        {/* INFO */}
                        <div className="explanation-box" style={{ marginTop: '2rem' }}>
                            <h3>Important Note</h3>
                            <p className="exp-text">
                                This report was generated using AI-assisted diagnostic tools and{" "}
                                {data.approved
                                    ? "has been reviewed by a doctor."
                                    : "is pending doctor verification."}
                            </p>
                        </div>

                    </div>
                </div>
            </main>
        </div>
    );
}

export default Patient;
