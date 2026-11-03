import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, CheckCircle2 } from 'lucide-react';
import './resetpassword.css';

const OTP_LENGTH = 6;
const RESEND_SECONDS = 27;

export default function Resetpassword() {
    const { id } = useParams();
    const navigate = useNavigate();

    // Step state: 'otp' | 'new_password' | 'success'
    const [step, setStep] = useState('otp');
    const [userEmail, setUserEmail] = useState('');
    const [resetToken, setResetToken] = useState('');

    // OTP form states
    const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(''));
    const [countdown, setCountdown] = useState(RESEND_SECONDS);
    const [canResend, setCanResend] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);
    const [isResending, setIsResending] = useState(false);
    const [status, setStatus] = useState(null);

    // Password form states
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isResetting, setIsResetting] = useState(false);
    const [passwordErrors, setPasswordErrors] = useState({});

    const inputRefs = useRef([]);

    // Fetch user email if available
    useEffect(() => {
        if (!id) return;
        fetch(`http://localhost:5000/api/users/resetinfo/${id}`)
            .then((res) => res.json())
            .then((data) => {
                if (data?.success && data?.email) {
                    setUserEmail(data.email);
                }
            })
            .catch(() => {});
    }, [id]);

    // Resend Countdown Timer
    useEffect(() => {
        if (step !== 'otp') return;
        if (countdown <= 0) {
            setCanResend(true);
            return;
        }
        const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
        return () => clearTimeout(timer);
    }, [countdown, step]);

    const startCountdown = () => {
        setCountdown(RESEND_SECONDS);
        setCanResend(false);
    };

    // OTP Handlers
    const handleOtpChange = (index, value) => {
        const digit = value.replace(/\D/g, '').slice(-1);
        const next = [...otp];
        next[index] = digit;
        setOtp(next);
        setStatus(null);

        if (digit && index < OTP_LENGTH - 1) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleOtpKeyDown = (index, e) => {
        if (e.key === 'Backspace') {
            if (otp[index]) {
                const next = [...otp];
                next[index] = '';
                setOtp(next);
            } else if (index > 0) {
                inputRefs.current[index - 1]?.focus();
            }
        } else if (e.key === 'ArrowLeft' && index > 0) {
            inputRefs.current[index - 1]?.focus();
        } else if (e.key === 'ArrowRight' && index < OTP_LENGTH - 1) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleOtpPaste = (e) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
        if (!pasted) return;
        const next = Array(OTP_LENGTH).fill('');
        pasted.split('').forEach((ch, i) => {
            next[i] = ch;
        });
        setOtp(next);
        const focusIdx = Math.min(pasted.length, OTP_LENGTH - 1);
        inputRefs.current[focusIdx]?.focus();
    };

    // Step 1: Verify OTP
    const handleVerifyOtp = useCallback(
        async (e) => {
            e?.preventDefault();
            const code = otp.join('');
            if (code.length < OTP_LENGTH) {
                setStatus({ type: 'error', message: 'Please enter all 6 digits.' });
                return;
            }
            setIsVerifying(true);
            setStatus(null);
            try {
                const res = await fetch(`http://localhost:5000/api/users/verifyotp/${id}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ otp: code }),
                });
                const data = await res.json();
                if (!res.ok || !data.success) {
                    throw new Error(data.message || 'Invalid or expired verification code.');
                }
                setResetToken(data.resetToken);
                setStatus({ type: 'success', message: 'Email verified! Please set your new password.' });
                setTimeout(() => {
                    setStatus(null);
                    setStep('new_password');
                }, 800);
            } catch (err) {
                setStatus({ type: 'error', message: err.message });
            } finally {
                setIsVerifying(false);
            }
        },
        [otp, id]
    );

    // Resend OTP
    const handleResend = useCallback(async () => {
        if (!canResend || isResending) return;
        setIsResending(true);
        setStatus(null);
        try {
            const res = await fetch(`http://localhost:5000/api/users/resendotp/${id}`, {
                method: 'POST',
            });
            const data = await res.json();
            if (!res.ok || !data.success) {
                throw new Error(data.message || 'Failed to resend code.');
            }
            setOtp(Array(OTP_LENGTH).fill(''));
            inputRefs.current[0]?.focus();
            startCountdown();
            setStatus({ type: 'success', message: 'A new security code has been sent!' });
        } catch (err) {
            setStatus({ type: 'error', message: err.message });
        } finally {
            setIsResending(false);
        }
    }, [canResend, isResending, id]);

    // Step 2: Reset Password Submit
    const handleResetPassword = async (e) => {
        e.preventDefault();
        const errors = {};
        if (!newPassword.trim()) {
            errors.newPassword = 'New password is required';
        } else if (newPassword.length < 6) {
            errors.newPassword = 'Password must be at least 6 characters';
        }

        if (!confirmPassword.trim()) {
            errors.confirmPassword = 'Confirm your password';
        } else if (newPassword !== confirmPassword) {
            errors.confirmPassword = 'Passwords do not match';
        }

        setPasswordErrors(errors);
        if (Object.keys(errors).length > 0) return;

        setIsResetting(true);
        setStatus(null);
        try {
            const res = await fetch(`http://localhost:5000/api/users/resetpassword/${id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ resetToken, newPassword: newPassword.trim() }),
            });
            const data = await res.json();
            if (!res.ok || !data.success) {
                throw new Error(data.message || 'Failed to reset password. Please try again.');
            }
            setStep('success');
            setTimeout(() => {
                navigate('/login', { replace: true });
            }, 3000);
        } catch (err) {
            setStatus({ type: 'error', message: err.message });
        } finally {
            setIsResetting(false);
        }
    };

    return (
        <div className="verify-screen-container">
            <div className="verify-card"> 
                {step === 'otp' && (
                    <>
                        <h1 className="verify-heading">Verify your email</h1>

                        <p className="verify-instruction">
                            We&apos;ve emailed a one time security code to{' '}
                            <strong className="verify-target-email">{userEmail || 'your email'}</strong>. It should
                            arrive in the next few minutes. If you don&apos;t see it in your inbox, please check
                            your spam/junk folder. Please enter it below:
                        </p>

                        {status && (
                            <div className={`verify-alert verify-alert--${status.type}`}>
                                {status.message}
                            </div>
                        )}

                        <form onSubmit={handleVerifyOtp} className="verify-form" noValidate>
                            {/* OTP 3 - 3 Segmented Boxes */}
                            <div className="verify-otp-cluster" onPaste={handleOtpPaste}>
                                <div className="verify-box-triad">
                                    {otp.slice(0, 3).map((digit, i) => (
                                        <input
                                            key={i}
                                            ref={(el) => (inputRefs.current[i] = el)}
                                            type="text"
                                            inputMode="numeric"
                                            maxLength={1}
                                            value={digit}
                                            onChange={(e) => handleOtpChange(i, e.target.value)}
                                            onKeyDown={(e) => handleOtpKeyDown(i, e)}
                                            className="verify-otp-digit"
                                            autoFocus={i === 0}
                                            disabled={isVerifying}
                                        />
                                    ))}
                                </div>

                                <span className="verify-dash" aria-hidden="true">
                                    —
                                </span>

                                <div className="verify-box-triad">
                                    {otp.slice(3).map((digit, i) => {
                                        const idx = i + 3;
                                        return (
                                            <input
                                                key={idx}
                                                ref={(el) => (inputRefs.current[idx] = el)}
                                                type="text"
                                                inputMode="numeric"
                                                maxLength={1}
                                                value={digit}
                                                onChange={(e) => handleOtpChange(idx, e.target.value)}
                                                onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                                                className="verify-otp-digit"
                                                disabled={isVerifying}
                                            />
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Resend row */}
                            <div className="verify-resend-row">
                                <span>Didn&apos;t receive a code?&nbsp;</span>
                                {canResend ? (
                                    <button
                                        type="button"
                                        className="verify-resend-btn"
                                        onClick={handleResend}
                                        disabled={isResending}
                                    >
                                        {isResending ? 'Resending...' : 'Resend'}
                                    </button>
                                ) : (
                                    <span className="verify-resend-timer">Resend ({countdown})</span>
                                )}
                            </div>

                            {/* Actions */}
                            <button
                                type="submit"
                                className="verify-btn-confirm"
                                disabled={isVerifying}
                            >
                                {isVerifying ? 'Confirming...' : 'Confirm email'}
                            </button>

                            <button
                                type="button"
                                className="verify-btn-back"
                                onClick={() => navigate('/login', { replace: true })}
                            >
                                Go back
                            </button>
                        </form>
                    </>
                )}
 
                {step === 'new_password' && (
                    <>
                        <h1 className="verify-heading">Reset your password</h1>
                        <p className="verify-instruction">
                            Choose a strong, new password for <strong className="verify-target-email">{userEmail}</strong>.
                        </p>

                        {status && (
                            <div className={`verify-alert verify-alert--${status.type}`}>
                                {status.message}
                            </div>
                        )}

                        <form onSubmit={handleResetPassword} className="verify-form" noValidate>
                            {/* New Password */}
                            <div className="verify-input-group">
                                <label className="verify-field-label">New Password</label>
                                <div className={`verify-field-wrap ${passwordErrors.newPassword ? 'error' : ''}`}>
                                    <Lock size={17} className="verify-prefix-icon" />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="Enter at least 6 characters"
                                        value={newPassword}
                                        onChange={(e) => {
                                            setNewPassword(e.target.value);
                                            if (passwordErrors.newPassword) {
                                                setPasswordErrors((prev) => ({ ...prev, newPassword: '' }));
                                            }
                                        }}
                                        className="verify-text-input"
                                        autoComplete="new-password"
                                        autoFocus
                                    />
                                    <button
                                        type="button"
                                        className="verify-eye-btn"
                                        onClick={() => setShowPassword(!showPassword)}
                                        tabIndex={-1}
                                    >
                                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                                {passwordErrors.newPassword && (
                                    <span className="verify-field-error">{passwordErrors.newPassword}</span>
                                )}
                            </div>

                            {/* Confirm Password */}
                            <div className="verify-input-group">
                                <label className="verify-field-label">Confirm New Password</label>
                                <div className={`verify-field-wrap ${passwordErrors.confirmPassword ? 'error' : ''}`}>
                                    <Lock size={17} className="verify-prefix-icon" />
                                    <input
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        placeholder="Re-enter your new password"
                                        value={confirmPassword}
                                        onChange={(e) => {
                                            setConfirmPassword(e.target.value);
                                            if (passwordErrors.confirmPassword) {
                                                setPasswordErrors((prev) => ({ ...prev, confirmPassword: '' }));
                                            }
                                        }}
                                        className="verify-text-input"
                                        autoComplete="new-password"
                                    />
                                    <button
                                        type="button"
                                        className="verify-eye-btn"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        tabIndex={-1}
                                    >
                                        {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                                {passwordErrors.confirmPassword && (
                                    <span className="verify-field-error">{passwordErrors.confirmPassword}</span>
                                )}
                            </div>

                            {/* Submit New Password */}
                            <button
                                type="submit"
                                className="verify-btn-confirm"
                                disabled={isResetting}
                            >
                                {isResetting ? 'Saving new password...' : 'Update Password'}
                            </button>

                            <button
                                type="button"
                                className="verify-btn-back"
                                onClick={() => setStep('otp')}
                            >
                                Back to verification
                            </button>
                        </form>
                    </>
                )}
 
                {step === 'success' && (
                    <div className="verify-success-wrap">
                        <div className="verify-success-icon-badge">
                            <CheckCircle2 size={44} color="#16a34a" />
                        </div>
                        <h1 className="verify-heading">Password updated!</h1>
                        <p className="verify-instruction">
                            Your password has been successfully reset. Redirecting you to the login screen...
                        </p>
                        <button
                            type="button"
                            className="verify-btn-confirm"
                            onClick={() => navigate('/login', { replace: true })}
                        >
                            Log in now
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
