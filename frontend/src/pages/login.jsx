import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export default function Login() {
    const navigate = useNavigate();
    const [role, setRole] = useState('doctor');

    // Doctor / Admin fields
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    // Patient fields
    const [patientName, setPatientName] = useState('');
    const [patientId, setPatientId] = useState('');
    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState('');
    const [otpSent, setOtpSent] = useState(false);
    const [demoOtp, setDemoOtp] = useState('');

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSendOtp = async () => {
        if (!patientName.trim() || !patientId.trim() || !phone.trim()) {
            setError('Please fill in all fields');
            return;
        }
        setLoading(true);
        setError('');
        try {
            const res = await fetch(`${API_BASE_URL}/api/auth/patient/send-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: patientName, patient_id: patientId, phone })
            });
            const data = await res.json();
            if (res.ok) {
                setOtpSent(true);
                setDemoOtp(data.otp); // demo only
            } else {
                setError(data.detail || 'Patient not found. Please check your details.');
            }
        } catch {
            setError('Server error. Is the backend running?');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async () => {
        if (!otp.trim()) { setError('Please enter the OTP'); return; }
        setLoading(true);
        setError('');
        try {
            const res = await fetch(`${API_BASE_URL}/api/auth/patient/verify-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone, otp })
            });
            const data = await res.json();
            if (res.ok) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                navigate('/patient-home');
            } else {
                setError(data.detail || 'Invalid OTP');
            }
        } catch {
            setError('Server error.');
        } finally {
            setLoading(false);
        }
    };

    const handleLogin = async () => {
        if (!email.trim() || !password.trim()) { setError('Please fill in all fields'); return; }
        setLoading(true);
        setError('');
        try {
            const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, role })
            });
            const data = await res.json();
            if (res.ok) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                if (data.user.role === 'doctor') navigate('/doctor');
                else if (data.user.role === 'admin') navigate('/hospital');
            } else {
                setError(data.detail || 'Invalid credentials');
            }
        } catch {
            setError('Server error. Is the backend running?');
        } finally {
            setLoading(false);
        }
    };

    const roleColors = {
        doctor: '#1a6fd4',
        admin: '#2d9e5f',
        patient: '#7c3aed'
    };
    const color = roleColors[role];

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Space+Grotesk:wght@400;500;600;700&display=swap');
                * { box-sizing: border-box; margin: 0; padding: 0; }
                body { font-family: 'DM Sans', sans-serif; background: #f4f7fc; }
                .login-wrap { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 24px; }
                .login-card { background: white; border-radius: 24px; padding: 48px; width: 100%; max-width: 460px; box-shadow: 0 20px 60px rgba(0,0,0,0.08); }
                .brand { text-align: center; margin-bottom: 36px; }
                .brand-icon { width: 64px; height: 64px; border-radius: 18px; display: flex; align-items: center; justify-content: center; font-size: 32px; margin: 0 auto 16px; }
                .brand-title { font-family: 'Space Grotesk', sans-serif; font-size: 26px; font-weight: 700; color: #1a2236; }
                .brand-sub { color: #64748b; font-size: 14px; margin-top: 6px; }
                .role-tabs { display: flex; background: #f1f5f9; border-radius: 12px; padding: 4px; margin-bottom: 28px; gap: 4px; }
                .role-tab { flex: 1; padding: 10px; border-radius: 10px; border: none; cursor: pointer; font-size: 13px; font-weight: 600; background: transparent; color: #64748b; transition: 0.2s; font-family: 'DM Sans', sans-serif; }
                .role-tab.active { background: white; color: #1a2236; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
                .field { margin-bottom: 18px; }
                .field label { display: block; font-size: 13px; font-weight: 600; color: #374151; margin-bottom: 8px; }
                .field input { width: 100%; padding: 14px 16px; border: 1.5px solid #e2e8f2; border-radius: 10px; font-size: 15px; font-family: 'DM Sans', sans-serif; outline: none; transition: 0.2s; background: #fafbfc; }
                .field input:focus { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(var(--accent-rgb), 0.1); background: white; }
                .btn-main { width: 100%; padding: 15px; border: none; border-radius: 12px; font-size: 16px; font-weight: 600; cursor: pointer; transition: 0.2s; font-family: 'DM Sans', sans-serif; color: white; }
                .btn-main:hover { opacity: 0.9; transform: translateY(-1px); }
                .btn-main:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
                .btn-outline { width: 100%; padding: 14px; border-radius: 12px; font-size: 15px; font-weight: 600; cursor: pointer; font-family: 'DM Sans', sans-serif; background: transparent; transition: 0.2s; margin-bottom: 12px; }
                .error-box { background: #fef2f2; border: 1px solid #fecaca; color: #dc2626; padding: 12px 16px; border-radius: 10px; font-size: 14px; margin-bottom: 16px; }
                .otp-demo { background: #fef9c3; border: 1px solid #fde047; color: #854d0e; padding: 12px 16px; border-radius: 10px; font-size: 14px; margin-bottom: 16px; text-align: center; }
                .otp-demo strong { font-size: 24px; display: block; margin-top: 4px; letter-spacing: 6px; }
                .divider { text-align: center; color: #94a3b8; font-size: 13px; margin: 20px 0; }
                .signup-link { text-align: center; font-size: 14px; color: #64748b; margin-top: 20px; }
                .signup-link a { color: #1a6fd4; font-weight: 600; cursor: pointer; text-decoration: none; }
            `}</style>

            <div className="login-wrap" style={{ '--accent': color, '--accent-rgb': role === 'doctor' ? '26,111,212' : role === 'admin' ? '45,158,95' : '124,58,237' }}>
                <div className="login-card">
                    <div className="brand">
                        <div className="brand-icon" style={{ background: `${color}20` }}>
                            {role === 'doctor' ? '👨‍⚕️' : role === 'admin' ? '🏥' : '🧑‍💼'}
                        </div>
                        <div className="brand-title">FractureAI</div>
                        <div className="brand-sub">AI-Powered Fracture Detection System</div>
                    </div>

                    {/* Role Tabs */}
                    <div className="role-tabs">
                        {[{ id: 'doctor', label: '👨‍⚕️ Doctor' }, { id: 'admin', label: '🏥 Hospital' }, { id: 'patient', label: '🧑‍💼 Patient' }].map(r => (
                            <button key={r.id} className={`role-tab ${role === r.id ? 'active' : ''}`}
                                onClick={() => { setRole(r.id); setError(''); setOtpSent(false); setDemoOtp(''); }}>
                                {r.label}
                            </button>
                        ))}
                    </div>

                    {error && <div className="error-box">{error}</div>}

                    {/* Doctor / Admin Login */}
                    {(role === 'doctor' || role === 'admin') && (
                        <>
                            <div className="field">
                                <label>Email Address</label>
                                <input type="email" placeholder="your@email.com" value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleLogin()} />
                            </div>
                            <div className="field">
                                <label>Password</label>
                                <input type="password" placeholder="••••••••" value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleLogin()} />
                            </div>
                            <button className="btn-main" style={{ background: color }} onClick={handleLogin} disabled={loading}>
                                {loading ? 'Signing in...' : `Sign in as ${role === 'doctor' ? 'Doctor' : 'Hospital Admin'}`}
                            </button>
                            <div className="signup-link">
                                Don't have an account? <a onClick={() => navigate('/signup')}>Create one here</a>
                            </div>
                        </>
                    )}

                    {/* Patient Login */}
                    {role === 'patient' && !otpSent && (
                        <>
                            <div className="field">
                                <label>Full Name</label>
                                <input type="text" placeholder="As registered by hospital" value={patientName}
                                    onChange={e => setPatientName(e.target.value)} />
                            </div>
                            <div className="field">
                                <label>Patient ID</label>
                                <input type="text" placeholder="e.g. PT-001" value={patientId}
                                    onChange={e => setPatientId(e.target.value)} />
                            </div>
                            <div className="field">
                                <label>Registered Phone Number</label>
                                <input type="tel" placeholder="e.g. 9876543210" value={phone}
                                    onChange={e => setPhone(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleSendOtp()} />
                            </div>
                            <button className="btn-main" style={{ background: color }} onClick={handleSendOtp} disabled={loading}>
                                {loading ? 'Verifying...' : 'Send OTP'}
                            </button>
                        </>
                    )}

                    {role === 'patient' && otpSent && (
                        <>
                            {demoOtp && (
                                <div className="otp-demo">
                                    🔐 Demo OTP (would be sent via SMS in production)
                                    <strong>{demoOtp}</strong>
                                </div>
                            )}
                            <div className="field">
                                <label>Enter OTP</label>
                                <input type="text" placeholder="6-digit OTP" value={otp}
                                    onChange={e => setOtp(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleVerifyOtp()}
                                    maxLength={6} style={{ letterSpacing: '6px', fontSize: '20px', textAlign: 'center' }} />
                            </div>
                            <button className="btn-main" style={{ background: color }} onClick={handleVerifyOtp} disabled={loading}>
                                {loading ? 'Verifying...' : 'Verify OTP & Login'}
                            </button>
                            <div className="divider">
                                Wrong number? <span style={{ color, cursor: 'pointer', fontWeight: 600 }}
                                    onClick={() => { setOtpSent(false); setOtp(''); setDemoOtp(''); setError(''); }}>
                                    Go back
                                </span>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </>
    );
}