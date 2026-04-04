import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export default function Signup() {
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [role, setRole] = useState('doctor');   // default doctor
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleSignup = async (e) => {
        e.preventDefault();

        if (!username || !email || !password || !confirmPassword) {
            setError('Please fill in all fields.');
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters long.');
            return;
        }

        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const resp = await fetch(`${API_BASE_URL}/api/auth/signup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username,
                    email,
                    password,
                    role
                })
            });

            const data = await resp.json();

            if (!resp.ok) {
                setError(data.detail || 'Signup failed. Please try again.');
                return;
            }

            setSuccess('Account created successfully! Redirecting to login...');

            // Auto redirect after success
            setTimeout(() => {
                navigate('/login');
            }, 1800);

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
          margin-bottom: 28px;
        }

        /* ROLE SELECTOR */
        .role-selector {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-bottom: 24px;
        }

        .role-btn {
          padding: 14px 12px;
          border-radius: 12px;
          border: 2px solid #e2e8f2;
          background: #fff;
          cursor: pointer;
          transition: all 0.18s;
          text-align: center;
        }

        .role-btn:hover { border-color: #1a6fd4; }

        .role-btn.active {
          border-color: #1a6fd4;
          background: #e8f2fd;
        }

        .role-emoji { font-size: 26px; margin-bottom: 6px; }

        .role-label {
          font-size: 14px;
          font-weight: 600;
          color: #1a2236;
        }

        .role-desc {
          font-size: 11px;
          color: #6b7a99;
        }

        /* FIELDS */
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

        /* ERROR / SUCCESS */
        .error-box {
          background: #fef0f0;
          border: 1px solid #f5c2c2;
          border-radius: 10px;
          padding: 10px 14px;
          font-size: 13px;
          color: #d63c3c;
          margin-bottom: 14px;
        }

        .success-box {
          background: #eaf7f0;
          border: 1px solid #b8e8cf;
          border-radius: 10px;
          padding: 10px 14px;
          font-size: 13px;
          color: #2d9e5f;
          margin-bottom: 14px;
        }

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
          transition: all 0.18s;
          margin-top: 8px;
        }

        .submit-btn:hover { background: #155db8; }
        .submit-btn:disabled { background: #b0c4de; cursor: not-allowed; }

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

                {/* LEFT PANEL */}
                <div className="auth-left">
                    <div className="left-content">
                        <div className="brand-logo">🩻</div>
                        <div className="brand-name">XrayForge</div>
                        <div className="brand-sub">
                            Join the AI-powered clinical platform for fracture detection and diagnosis.
                        </div>
                    </div>
                </div>

                {/* RIGHT PANEL - SIGNUP FORM */}
                <div className="auth-right">
                    <div className="auth-card">
                        <div className="auth-title">Create your account</div>
                        <div className="auth-sub">Choose your role and get started</div>

                        {/* ROLE SELECTOR */}
                        <div className="role-selector">
                            <div
                                className={`role-btn ${role === 'doctor' ? 'active' : ''}`}
                                onClick={() => setRole('doctor')}
                            >
                                <div className="role-emoji">👨‍⚕️</div>
                                <div className="role-label">Doctor</div>
                                <div className="role-desc">Access dashboard</div>
                            </div>

                            <div
                                className={`role-btn ${role === 'patient' ? 'active' : ''}`}
                                onClick={() => setRole('patient')}
                            >
                                <div className="role-emoji">🧑</div>
                                <div className="role-label">Patient</div>
                                <div className="role-desc">View your report</div>
                            </div>

                            <div
                                className={`role-btn ${role === 'admin' ? 'active' : ''}`}
                                onClick={() => setRole('admin')}
                                style={{ gridColumn: '1 / -1' }}
                            >
                                <div className="role-emoji">🏥</div>
                                <div className="role-label">Hospital Admin</div>
                                <div className="role-desc">Monitor entire system</div>
                            </div>
                        </div>

                        {error && <div className="error-box">{error}</div>}
                        {success && <div className="success-box">✓ {success}</div>}

                        <form onSubmit={handleSignup}>
                            <div className="field-group">
                                <div className="field-label">USERNAME</div>
                                <input
                                    className="field-input"
                                    type="text"
                                    placeholder="Choose a username"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    required
                                />
                            </div>

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
                                    placeholder="Minimum 6 characters"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="field-group">
                                <div className="field-label">CONFIRM PASSWORD</div>
                                <input
                                    className="field-input"
                                    type="password"
                                    placeholder="Re-enter password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                className="submit-btn"
                                disabled={loading}
                            >
                                {loading ? 'Creating Account...' : `Create ${role === 'admin' ? 'Admin' : role === 'doctor' ? 'Doctor' : 'Patient'} Account`}
                            </button>
                        </form>

                        <div className="auth-footer">
                            Already have an account?{' '}
                            <Link to="/login">Sign in here</Link>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}