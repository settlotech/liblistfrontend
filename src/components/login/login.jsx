import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import liblistLogo from '../../assets/liblist-logo.png';
import loginIllustration from '../../assets/login-illustration.jpg';
import {
    User,
    Mail,
    Lock,
    Eye,
    EyeOff,
    CheckCircle2,
    ShieldCheck,
    AlertCircle,
    X,
    Sparkles
} from 'lucide-react';
import './login.css';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Forgot Password Modal State
    const [forgotModalOpen, setForgotModalOpen] = useState(false);
    const [forgotEmail, setForgotEmail] = useState('');
    const [forgotSuccess, setForgotSuccess] = useState(null);
    const [forgotError, setForgotError] = useState(null);
    const [isSendingReset, setIsSendingReset] = useState(false);

    // Signup Notice Modal State
    const [signupNoticeOpen, setSignupNoticeOpen] = useState(false);

    const { login, checkuserEmailAvailability } = useAuth();
    const navigate = useNavigate();

    const version = 'v0.0.1'
    const about = ['Multi-bank master policy', 'Real-time Maker-Checker auditing & change management'];
    // Fill Super Admin credentials
    const handleFillSuperAdmin = () => {
        setEmail('settlo@gmail.com');
        setPassword('123456');
        setErrors({});
    };

    // Handle Login Submit
    const handleLoginSubmit = async (e) => {
        e.preventDefault();
        const newErrors = {};

        if (!email.trim()) {
            newErrors.email = 'Email address is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
            newErrors.email = 'Enter a valid email address';
        }

        if (!password.trim()) {
            newErrors.password = 'Password is required';
        } else if (password.length < 6) {
            newErrors.password = 'Password must be at least 6 characters';
        }

        setErrors(newErrors);

        if (Object.keys(newErrors).length === 0) {
            setIsSubmitting(true);
            try {
                const res = await login({ email: email.trim(), password });
                if (res?.success) {
                    navigate('/home', { replace: true });
                }
            } catch (err) {
                setErrors({ general: err.message || 'Login failed. Please check your credentials.' });
            } finally {
                setIsSubmitting(false);
            }
        }
    };

    // Handle Forgot Password Submit
    const handleForgotSubmit = async (e) => {
        e.preventDefault();
        if (!forgotEmail.trim()) return;
        setForgotError(null);
        setIsSendingReset(true);
        try {
            const result = await checkuserEmailAvailability(forgotEmail.trim());
            setForgotSuccess(result?.message || `Password reset instructions have been dispatched to ${forgotEmail.trim()}`);
            setTimeout(() => {
                setForgotModalOpen(false);
                setForgotSuccess(null);
                setForgotError(null);
                setForgotEmail('');
            }, 3000);
        } catch (err) {
            setForgotError(err.message || 'Failed to send reset email. Please try again.');
        } finally {
            setIsSendingReset(false);
        }
    };

    return (
        <div className="login-page-root">
            <div className="login-split-card">

                <div className="login-left-pane">
                    <div className="left-pane-header">
                        <img src={liblistLogo} alt="Liblist Logo" className="liblist-brand-logo" />
                        <span className="product-version-text">{version}</span>
                    </div>
                    <div className="left-pane-desc-box">
                        <span className="desc-title">Banking & Policy Governance Platform</span>
                        <p className="desc-text">
                            Centralized policy oversight , multi-bank compliance registry.
                        </p>
                    </div>
                    <div className="left-pane-illustration-wrap">
                        <img
                            src={loginIllustration}
                            alt="Liblist Platform Illustration"
                            className="login-side-illustration"
                        />
                    </div>
                    <div className="why-liblist-section">
                        <h3 className="why-liblist-heading">Why Liblist</h3>
                        <ul className="why-features-list">
                            {
                                about.map((val) => 
                                    <li>
                                        <CheckCircle2 size={16} className="feature-check-icon" />
                                        <span>{val}</span>
                                    </li>
                                )
                            } 
                        </ul>
                    </div>
                </div>

                <div className="login-right-pane">

                    <div className="right-pane-top-bar">
                        <div className="top-switch-prompt">
                            <span>Don't have an account?</span>
                            <button
                                type="button"
                                className="btn-switch-pill"
                                onClick={() => setSignupNoticeOpen(true)}
                            >
                                Sign up
                            </button>
                        </div>
                    </div>

                    <div className="right-pane-center-box">
                        <form onSubmit={handleLoginSubmit} className="auth-form-body">

                            <div className="user-icon-circle-badge">
                                <User size={24} className="user-avatar-icon" />
                            </div>

                            <h2 className="auth-form-title">Login to your Liblist portal</h2>
                            <p className="auth-form-subtitle">Welcome back, you've been missed!</p>

                            {errors.general && (
                                <div className="login-error-banner">
                                    <AlertCircle size={15} />
                                    <span>{errors.general}</span>
                                </div>
                            )}

                            <div
                                className="quick-superadmin-card"
                                onClick={handleFillSuperAdmin}
                                title="Click to auto-fill Super Admin credentials"
                            >
                                <div className="quick-superadmin-left">
                                    <div className="quick-icon-wrap">
                                        <ShieldCheck size={16} />
                                    </div>
                                    <div>
                                        <div className="quick-admin-label">
                                            <strong>Default Super Admin</strong>
                                            <span className="auto-pill">1-Click Fill</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Email Field */}
                            <div className="input-group-row">
                                <label className="input-field-label">Email Id or Mobile number</label>
                                <div className={`input-field-wrapper ${errors.email ? 'error' : ''}`}>
                                    <User size={18} className="field-prefix-icon" />
                                    <input
                                        type="text"
                                        placeholder="Enter your email"
                                        value={email}
                                        onChange={(e) => {
                                            setEmail(e.target.value);
                                            if (errors.email || errors.general) {
                                                setErrors((prev) => ({ ...prev, email: '', general: '' }));
                                            }
                                        }}
                                        className="auth-text-input"
                                        autoComplete="email"
                                    />
                                </div>
                                {errors.email && <span className="field-error-text">{errors.email}</span>}
                            </div>

                            {/* Password Field */}
                            <div className="input-group-row">
                                <label className="input-field-label">Enter Password</label>
                                <div className={`input-field-wrapper ${errors.password ? 'error' : ''}`}>
                                    <Lock size={18} className="field-prefix-icon" />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="Enter password"
                                        value={password}
                                        onChange={(e) => {
                                            setPassword(e.target.value);
                                            if (errors.password || errors.general) {
                                                setErrors((prev) => ({ ...prev, password: '', general: '' }));
                                            }
                                        }}
                                        className="auth-text-input"
                                        autoComplete="current-password"
                                    />
                                    <button
                                        type="button"
                                        className="toggle-password-btn"
                                        onClick={() => setShowPassword(!showPassword)}
                                        tabIndex={-1}
                                        title={showPassword ? 'Hide password' : 'Show password'}
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                                {errors.password && <span className="field-error-text">{errors.password}</span>}
                            </div>

                            {/* Remember Me & Forgot Password Row */}
                            <div className="auth-options-row">
                                <label className="remember-me-checkbox">
                                    <input
                                        type="checkbox"
                                        checked={rememberMe}
                                        onChange={(e) => setRememberMe(e.target.checked)}
                                    />
                                    <span>Remember Me</span>
                                </label>

                                <button
                                    type="button"
                                    className="forgot-password-link"
                                    onClick={() => {
                                        setForgotEmail(email);
                                        setForgotModalOpen(true);
                                    }}
                                >
                                    Forgot Password ?
                                </button>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                className="btn-auth-submit"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? 'Logging In...' : 'Log In'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>


            {forgotModalOpen && (
                <div className="forgot-modal-overlay" onClick={() => setForgotModalOpen(false)}>
                    <div className="forgot-modal-card" onClick={(e) => e.stopPropagation()}>
                        <div className="forgot-modal-header">
                            <div>
                                <h3>Reset Password</h3>
                                <p>Enter your registered email to receive recovery instructions</p>
                            </div>
                            <button className="forgot-close-btn" onClick={() => setForgotModalOpen(false)}>
                                <X size={16} />
                            </button>
                        </div>
                        <form onSubmit={handleForgotSubmit}>
                            <div className="forgot-modal-body">
                                {forgotSuccess ? (
                                    <div className="login-success-banner">
                                        <CheckCircle2 size={16} />
                                        <span>{forgotSuccess}</span>
                                    </div>
                                ) : (
                                    <div className="input-group-row">
                                        <label className="input-field-label">Registered Email</label>
                                        <div className="input-field-wrapper">
                                            <Mail size={18} className="field-prefix-icon" />
                                            <input
                                                type="email"
                                                placeholder="Enter your registered email"
                                                value={forgotEmail}
                                                onChange={(e) => {
                                                    setForgotEmail(e.target.value);
                                                    setForgotError(null);
                                                }}
                                                className="auth-text-input"
                                                required
                                            />
                                        </div>
                                        {forgotError && (
                                            <div className="login-error-banner" style={{ marginTop: '8px' }}>
                                                <AlertCircle size={15} />
                                                <span>{forgotError}</span>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                            <div className="forgot-modal-footer">
                                <button
                                    type="button"
                                    className="btn-modal-secondary"
                                    onClick={() => setForgotModalOpen(false)}
                                >
                                    Cancel
                                </button>
                                {!forgotSuccess && (
                                    <button type="submit" className="btn-modal-primary" disabled={isSendingReset}>
                                        {isSendingReset ? 'Sending...' : 'Send Reset Link'}
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
