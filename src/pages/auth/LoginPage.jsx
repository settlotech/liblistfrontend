import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  User,
  Lock,
  Sparkles,
  CheckCircle2,
  ShieldCheck,
  Building2,
  Users,
  X,
  Mail,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import FormInput from '../../components/ui/FormInput';
import Alert from '../../components/ui/Alert';
import Spinner from '../../components/ui/Spinner';
import LoginSlideshow from '../../components/auth/LoginSlideshow';
import styles from './LoginPage.module.css';
import { BriefcaseBusiness } from "lucide-react";

// ── Demo Personas ─────────────────────────────────────────────────────────────
const DEMO_PERSONAS = [
  {
    role: 'Super Admin',
    email: 'settlo@gmail.com',
    password: '123456',
    icon: <ShieldCheck size={16} strokeWidth={2} color="#2563eb" />,
    bg: '#eff6ff',
  },
  {
    role: 'Admin',
    email: 'k.tamilmani1234@gmail.com',
    password: '123456',
    icon: <Building2 size={16} strokeWidth={2} color="#d97706" />,
    bg: '#fef3c7',
  },
  {
    role: 'Department Admin',
    email: 'tamilmanik2006@gmail.com',
    password: '123456',
    icon: <BriefcaseBusiness size={16} strokeWidth={2} color="#059669" />,
    bg: '#ecfdf5',
  },
  {
    role: 'User alias Employee',
    email: 'settlotamilmani@gmail.com',
    password: '123456',
    icon: <Users size={16} strokeWidth={2} color="#059669" />,
    bg: '#ecfdf5',
  },
];

// ── Component ─────────────────────────────────────────────────────────────────
const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, user, initializing, checkuserEmailAvailability } = useAuth();

  const from = location.state?.from?.pathname || '/dashboard';

  useEffect(() => {
    if (user && !initializing) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, initializing, navigate]);

  const [form, setForm] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });
  const [selectedPersona, setSelectedPersona] = useState(null);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);

  // Forgot password modal state
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState(null);
  const [forgotError, setForgotError] = useState(null);
  const [isSendingReset, setIsSendingReset] = useState(false);

  const validate = () => {
    const errs = {};
    if (!form.email.trim()) {
      errs.email = 'Email Id or Mobile number is required.';
    }
    if (!form.password) {
      errs.password = 'Password is required.';
    }
    return errs;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
    setApiError('');
  };

  const handleSelectPersona = (persona) => {
    setSelectedPersona(persona.role);
    setForm((prev) => ({
      ...prev,
      email: persona.email,
      password: persona.password,
    }));
    setErrors({});
    setApiError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    setApiError('');
    const result = await login(form);
    setLoading(false);

    if (result.success) {
      navigate(from, { replace: true });
    } else {
      setApiError(result.message);
    }
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    if (!forgotEmail.trim()) return;
    setForgotError(null);
    setIsSendingReset(true);
    try {
      const result = await checkuserEmailAvailability(forgotEmail.trim());
      if (result?.success || result?.data) {
        setForgotSuccess(result?.message || `Password reset instructions have been dispatched to ${forgotEmail.trim()}`);
        setTimeout(() => {
          setForgotModalOpen(false);
          setForgotSuccess(null);
          setForgotError(null);
          setForgotEmail('');
        }, 3000);
      } else {
        setForgotError(result?.message || 'Failed to send reset email. Please try again.');
      }
    } catch (err) {
      setForgotError(err?.response?.data?.message || err.message || 'Failed to send reset email. Please try again.');
    } finally {
      setIsSendingReset(false);
    }
  };

  return (
    <div className={styles.page}>
      {/* ── LEFT PANEL (60%) ── */}
      <div className={styles.leftPanel}>
        <LoginSlideshow autoPlayInterval={5000} />
      </div>

      {/* ── RIGHT PANEL (40%) ── */}
      <div className={styles.rightPanel}>
        {/* Top Sign Up Nav */}
        <div className={styles.rightTopNav}>
          {/* <span className={styles.signupPrompt}>Don't have an account?</span> */}
          <button
            type="button"
            className="btn-outline-pill"
            onClick={() => navigate('/request')}
          >
            Request for LibList Access
          </button>
        </div>

        {/* Form Container */}
        <div className={styles.formContentWrap}>
          {/* Avatar Icon */}
          <div className={styles.avatarBadge}>
            <User size={20} strokeWidth={2} />
          </div>

          <h1 className={styles.loginTitle}>Login to your Liblist.</h1>
          <p className={styles.loginSubtitle}>Welcome back, you've been missed!</p>

          {/* Select Demo Persona */}
          <div className={styles.personaSection}>
            <div className={styles.personaHeader}>
              <Sparkles size={14} strokeWidth={2.5} />
              <span>SELECT DEMO PERSONA TO LOG IN:</span>
            </div>
            <div className={styles.personaGrid}>
              {DEMO_PERSONAS.map((p) => {
                const isActive = selectedPersona === p.role;
                return (
                  <button
                    key={p.role}
                    type="button"
                    className={`${styles.personaCard} ${isActive ? styles.activePersona : ''
                      }`}
                    onClick={() => handleSelectPersona(p)}
                  >
                    <div
                      className={styles.personaIcon}
                      style={{ background: p.bg }}
                    >
                      {p.icon}
                    </div>
                    <div className={styles.personaInfo}>
                      <span className={styles.personaRole}>{p.role}</span>
                      {/* <span className={styles.personaEmail}>{p.email}</span> */}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Error Banner */}
          {apiError && <Alert type="error" message={apiError} />}

          {/* Login Form */}
          <form onSubmit={handleSubmit} noValidate className={styles.loginForm}>
            <FormInput
              label="Email Id or Mobile number"
              id="email"
              type="text"
              value={form.email}
              onChange={handleChange}
              placeholder="Enter your email"
              error={errors.email}
              leftIcon={<User size={18} strokeWidth={2} />}
              required
            />

            <FormInput
              label="Enter Password"
              id="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Enter password"
              error={errors.password}
              leftIcon={<Lock size={18} strokeWidth={2} />}
              required
            />

            {/* Remember Me & Forgot Password */}
            <div className={styles.formMetaRow}>
              <label className="checkbox-wrapper">
                <input
                  type="checkbox"
                  name="rememberMe"
                  checked={form.rememberMe}
                  onChange={handleChange}
                />
                <span className="checkbox-label">Remember Me</span>
              </label>

              <button
                type="button"
                className={styles.forgotLink}
                onClick={() => setForgotModalOpen(true)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                Forgot Password ?
              </button>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className={`btn btn-primary btn-full ${styles.submitBtn}`}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Spinner /> Logging In…
                </>
              ) : (
                'Log In'
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {forgotModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.45)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '16px'
          }}
          onClick={() => setForgotModalOpen(false)}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              maxWidth: '440px',
              width: '100%',
              boxShadow: '0 20px 40px -15px rgba(0,0,0,0.2)',
              overflow: 'hidden'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                padding: '24px 24px 16px',
                borderBottom: '1px solid #f1f5f9'
              }}
            >
              <div>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#0f172a', margin: 0 }}>Reset Password</h3>
                <p style={{ fontSize: '0.8125rem', color: '#64748b', margin: '4px 0 0' }}>Enter your registered email to receive recovery instructions</p>
              </div>
              <button
                type="button"
                onClick={() => setForgotModalOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#94a3b8',
                  padding: '4px'
                }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleForgotSubmit}>
              <div style={{ padding: '24px' }}>
                {forgotSuccess ? (
                  <div
                    style={{
                      background: '#ecfdf5',
                      border: '1px solid #a7f3d0',
                      color: '#065f46',
                      padding: '12px 16px',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '0.875rem'
                    }}
                  >
                    <CheckCircle2 size={18} />
                    <span>{forgotSuccess}</span>
                  </div>
                ) : (
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                      Registered Email
                    </label>
                    <div style={{ position: 'relative' }}>
                      <Mail
                        size={18}
                        style={{
                          position: 'absolute',
                          left: '12px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          color: '#94a3b8'
                        }}
                      />
                      <input
                        type="email"
                        placeholder="Enter your registered email"
                        value={forgotEmail}
                        onChange={(e) => {
                          setForgotEmail(e.target.value);
                          setForgotError(null);
                        }}
                        style={{
                          width: '100%',
                          padding: '10px 14px 10px 38px',
                          border: '1px solid #cbd5e1',
                          borderRadius: '8px',
                          fontSize: '0.875rem',
                          outline: 'none'
                        }}
                        required
                      />
                    </div>
                    {forgotError && (
                      <div
                        style={{
                          background: '#fef2f2',
                          border: '1px solid #fecaca',
                          color: '#991b1b',
                          padding: '10px 14px',
                          borderRadius: '8px',
                          marginTop: '10px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          fontSize: '0.8125rem'
                        }}
                      >
                        <AlertCircle size={16} />
                        <span>{forgotError}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div
                style={{
                  padding: '16px 24px',
                  background: '#f8fafc',
                  borderTop: '1px solid #f1f5f9',
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '10px'
                }}
              >
                <button
                  type="button"
                  onClick={() => setForgotModalOpen(false)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    color: '#475569',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                {!forgotSuccess && (
                  <button
                    type="submit"
                    disabled={isSendingReset}
                    style={{
                      padding: '8px 18px',
                      borderRadius: '8px',
                      border: 'none',
                      background: '#18458b',
                      color: '#ffffff',
                      fontSize: '0.875rem',
                      fontWeight: 500,
                      cursor: 'pointer'
                    }}
                  >
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
};

export default LoginPage;
