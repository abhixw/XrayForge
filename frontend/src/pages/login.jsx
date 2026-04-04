import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export default function Login() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        if (!email || !password) {
            setError('Please enter email and password');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const resp = await fetch(`${API_BASE_URL}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const data = await resp.json();

            if (!resp.ok) {
                setError(data.detail || 'Login failed. Please check your credentials.');
                return;
            }

            // Save token and user info
            localStorage.setItem('token', data.access_token);
            localStorage.setItem('user', JSON.stringify(data.user));

            // Redirect based on role from backend
            if (data.user.role === 'admin') {
                navigate('/hospital');
            } else if (data.user.role === 'doctor') {
                navigate('/doctor');
            } else if (data.user.role === 'patient') {
                navigate('/patient-home');
            } else {
                navigate('/login');
            }

        } catch (err) {
            setError('Cannot connect to server. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Space+Grotesk:wght@400;500;600;700&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        body {
          font-family: 'DM Sans', sans-serif;
          background: #f4f7fc;
          min-height: 100vh;
        }

        .auth-layout {
          min-height: 100vh;
          display: grid;
          grid-template-columns: 1fr 1fr;
        }

        /* LEFT PANEL */
        .auth-left {
          background: #0f1e3d;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 60px 48px;
          position: relative;
          overflow: hidden;
        }

        .brand-logo {
          width: 64px; height: 64px;
          background: linear-gradient(135deg, #1a6fd4, #2d9e5f);
          border-radius: 18px;
          display: flex; align-items: center; justify-content: center;
          font-size: 30px;
          margin: 0 auto 24px;
        }

        .brand-name {
          font-family: 'Space Grotesk', sans-serif;
          font-size: 32px;
          font-weight: 700;
          color: #fff;
          margin-bottom: 8px;
        }

        .brand-sub {
          font-size: 14px;
          color: rgba(255,255,255,0.5);
          margin-bottom: 48px;
          line-height: 1.6;
        }

        /* RIGHT PANEL */
        .auth-right {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 48px 32px;
          background: #f4f7fc;
        }

        .auth-card {
          background: #fff;
          border-radius: 20px;
          padding: 40px;
          width: 100%;
          max-width: 420px;
          border: 1px solid #e2e8f2;
          box-shadow: 0 4px 24px rgba(0,0,0,0.06);
        }

        .auth-title {
          font-family: 'Space Grotesk', sans-serif;
          font-size: 24px;
          font-weight: 700;
          color: #1a2236;
          margin-bottom: 6px;
        }

        .auth-sub {
          font-size: 14px;
          color: #6b7a99;
          margin-bottom: 32px;
        }

        .field-group {
          margin-bottom: 16px;
        }

        .field-label {
          font-size: 12px;
          font-weight: 600;
          color: #6b7a99;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 6px;
        }

        .field-input {
          width: 100%;
          padding: 12px 16px;
          border: 1.5px solid #e2e8f2;
          border-radius: 10px;
          font-size: 14px;
          font-family: 'DM Sans', sans-serif;
          color: #1a2236;
          background: #fff;
          outline: none;
        }

        .field-input:focus { border-color: #1a6fd4; }

        .submit-btn {
          width: 100%;
          padding: 13px;
          background: #1a6fd4;
          color: #fff;
          border: none;
          border-radius: 10px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          margin-top: 8px;
        }

        .submit-btn:hover { background: #155db8; }
        .submit-btn:disabled { background: #b0c4de; cursor: not-allowed; }

        .error-box {
          background: #fef0f0;
          border: 1px solid #f5c2c2;
          border-radius: 10px;
          padding: 10px 14px;
          font-size: 13px;
          color: #d63c3c;
          margin: 12px 0;
        }

        .auth-footer {
          text-align: center;
          margin-top: 24px;
          font-size: 13px;
          color: #6b7a99;
        }

        .auth-footer a {
          color: #1a6fd4;
          font-weight: 600;
          text-decoration: none;
        }
      `}</style>

            <div className="auth-layout">

                {/* Left Branding Panel */}
                <div className="auth-left">
                    <div className="left-content">
                        <div className="brand-logo">🩻</div>
                        <div className="brand-name">XrayForge</div>
                        <div className="brand-sub">
                            AI-powered Clinical Decision Support System for fracture detection and diagnosis.
                        </div>
                    </div>
                </div>

                {/* Right Login Form */}
                <div className="auth-right">
                    <div className="auth-card">
                        <div className="auth-title">Welcome back</div>
                        <div className="auth-sub">Sign in to your account to continue</div>

                        {error && <div className="error-box">{error}</div>}

                        <form onSubmit={handleLogin}>
                            <div className="field-group">
                                <div className="field-label">EMAIL ADDRESS</div>
                                <input
                                    className="field-input"
                                    type="email"
                                    placeholder="Enter your email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="field-group">
                                <div className="field-label">PASSWORD</div>
                                <input
                                    className="field-input"
                                    type="password"
                                    placeholder="Enter your password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                className="submit-btn"
                                disabled={loading}
                            >
                                {loading ? 'Signing in...' : 'Sign In'}
                            </button>
                        </form>

                        <div className="auth-footer">
                            Don't have an account?{' '}
                            <Link to="/signup">Create one here</Link>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}