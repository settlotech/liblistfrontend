import { useRef } from "react";
import { useNavigate } from "react-router-dom";
import liblistLogo from "../../assets/liblist-logo.png";
import {
    Mail,
    ArrowRight,
    ArrowLeft,
    RotateCcw,
    CheckCircle2,
    Info,
    Check,
    Edit2,
    AlertCircle,
    User
} from "lucide-react";
import { useSignup } from "../../context/SignupContext";
import "./signup.css";

const OTP_LENGTH = 6;

export default function Signup() {
    const navigate = useNavigate();

    const {
        currentStep,
        setCurrentStep,
        email,
        setEmail,
        fullName,
        setFullName,
        emailError,
        setEmailError,
        isSubmitting,
        otp,
        setOtp,
        secondsLeft,
        canResend,
        isResending,
        isVerifying,
        resendToast,
        otpError,
        setOtpError,
        requestId,
        formatTime,
        submitEmail,
        verifyOtp,
        resendOtp,
        resetSignup,
    } = useSignup();

    const otpInputRefs = useRef([]);

    // Stepper definitions
    const steps = [
        { id: 1, title: "Enter Email" },
        { id: 2, title: "Verify Email" },
        { id: 3, title: "Status" }
    ];

    // Step 1: Submit email
    const onEmailSubmit = async (e) => {
        if (e) e.preventDefault();
        await submitEmail();
    };

    // Step 2: OTP input keystroke handlers
    const handleOtpChange = (index, value) => {
        setOtpError("");
        const cleanDigit = value.replace(/\D/g, "").slice(-1);

        const newOtp = [...otp];
        newOtp[index] = cleanDigit;
        setOtp(newOtp);

        // Advance to next digit box
        if (cleanDigit && index < OTP_LENGTH - 1) {
            otpInputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index, e) => {
        if (e.key === "Backspace" && !otp[index] && index > 0) {
            otpInputRefs.current[index - 1]?.focus();
        } else if (e.key === "ArrowLeft" && index > 0) {
            otpInputRefs.current[index - 1]?.focus();
        } else if (e.key === "ArrowRight" && index < OTP_LENGTH - 1) {
            otpInputRefs.current[index + 1]?.focus();
        }
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
        if (!pastedData) return;

        const newOtp = [...otp];
        for (let i = 0; i < pastedData.length; i++) {
            newOtp[i] = pastedData[i];
        }
        setOtp(newOtp);

        const nextFocusIndex = Math.min(pastedData.length, OTP_LENGTH - 1);
        otpInputRefs.current[nextFocusIndex]?.focus();
    };

    // Step 2: Verify OTP
    const onVerifySubmit = async (e) => {
        if (e) e.preventDefault();
        const success = await verifyOtp();
        if (!success) {
            otpInputRefs.current[0]?.focus();
        }
    };

    // Step 2: Resend OTP
    const onResendClick = async () => {
        const success = await resendOtp();
        if (success) {
            otpInputRefs.current[0]?.focus();
        }
    };

    // Progress percentage
    const progressPercentage = ((currentStep - 1) / (steps.length - 1)) * 100;

    return (
        <div className="signup-page-container">
            {/* Top Brand Header */}
            <header className="signup-top-header">
                <img
                    src={liblistLogo}
                    alt="Liblist Logo"
                    className="signup-brand-logo"
                    onClick={() => navigate("/login")}
                />
                <div className="signup-header-actions">
                    <span className="signup-login-prompt">
                        Already have an account?
                        <button
                            type="button"
                            className="btn-link-login"
                            onClick={() => navigate("/login")}
                        >
                            Log In
                        </button>
                    </span>
                </div>
            </header>

            {/* Stepper Main Content (Unboxed, full-screen canvas, no box-shadow) */}
            <main className="signup-main-content">
                {/* Stepper Header (matches reference image) */}
                <div className="signup-stepper-wrapper">
                    <div className="signup-stepper-track-bg" />
                    <div
                        className="signup-stepper-track-fill"
                        style={{ width: `calc((100% - 76px) * ${progressPercentage / 100})` }}
                    />

                    {/* Stepper Nodes */}
                    <div className="signup-stepper-nodes">
                        {steps.map((s) => {
                            const isCompleted = currentStep > s.id;
                            const isActive = currentStep === s.id;
                            const statusClass = isCompleted ? "completed" : isActive ? "active" : "upcoming";

                            return (
                                <button
                                    key={s.id}
                                    type="button"
                                    className={`signup-step-node ${statusClass}`}
                                    onClick={() => setCurrentStep(s.id)}
                                    title={`Go to ${s.title}`}
                                >
                                    <div className="signup-step-circle">
                                        {isCompleted ? <Check size={16} strokeWidth={2.6} /> : s.id}
                                    </div>
                                    <span className="signup-step-title">{s.title}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

           
                {currentStep === 1 && (
                    <div className="signup-step-content-anim" key="step-1">
                        <h1 className="signup-card-heading">Enter Your Email</h1>
                        <p className="signup-card-subheading">
                            Please provide your official company email address to start the verification process.
                        </p>

                        <form onSubmit={onEmailSubmit} className="form-grid-2">
                            <div className="input-group-row">
                                <label className="input-field-label">
                                    Company Email Address <span className="otp-required-star">*</span>
                                </label>
                                <div className={`input-field-wrapper ${emailError ? "error" : ""}`}>
                                    <Mail size={16} className="field-prefix-icon" />
                                    <input
                                        type="email"
                                        placeholder="e.g. developer.settlo@gmail.com"
                                        className="auth-text-input"
                                        value={email}
                                        onChange={(e) => {
                                            setEmail(e.target.value);
                                            setEmailError("");
                                        }}
                                        autoFocus
                                    />
                                </div>
                                {emailError && (
                                    <span className="field-error-text">{emailError}</span>
                                )}
                            </div>

                            <div className="input-group-row">
                                <label className="input-field-label">Full Name (Optional)</label>
                                <div className="input-field-wrapper">
                                    <User size={16} className="field-prefix-icon" />
                                    <input
                                        type="text"
                                        placeholder="e.g. Developer"
                                        className="auth-text-input"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="step-note-box grid-col-full">
                                A 6-digit one-time verification passcode will be sent to this email address to verify your identity.
                            </div>

                            <div className="grid-col-full">
                                <button
                                    type="submit"
                                    className="btn-auth-submit"
                                    disabled={isSubmitting}
                                    style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "8px", height: "42px", padding: "0 18px" }}
                                >
                                    <span>{isSubmitting ? "Sending..." : "Continue"}</span>
                                    <ArrowRight size={16} />
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* ══════════════════════════════════════════════════
                    STEP 2: OTP Verification (Exact match to uploaded image)
                   ══════════════════════════════════════════════════ */}
                {currentStep === 2 && (
                    <div className="signup-step-content-anim" key="step-2">
                        <h1 className="signup-card-heading">Verify Your Email</h1>
                        <p className="signup-card-subheading">
                            We have sent a verification code to your company email address.
                        </p>

                        {/* Optional Resend Toast */}
                        {resendToast && (
                            <div className="signup-toast-msg">
                                <CheckCircle2 size={16} />
                                <span>{resendToast}</span>
                            </div>
                        )}

                        {/* Email Chip Banner (matches screenshot) */}
                        <div className="email-banner-chip">
                            <div className="email-banner-left">
                                <div className="email-icon-box">
                                    <Mail size={17} />
                                </div>
                                <span className="email-address-text" title={email}>
                                    {email}
                                </span>
                                <button
                                    type="button"
                                    className="email-edit-btn"
                                    onClick={() => setCurrentStep(1)}
                                    title="Edit Email Address"
                                >
                                    <Edit2 size={13} />
                                </button>
                            </div>

                            <div className="email-banner-divider" />

                            <div className="email-banner-right">
                                {secondsLeft > 0 ? (
                                    <>
                                        <span>Code expires in:</span>
                                        <strong className="code-expiry-timer">{formatTime(secondsLeft)}</strong>
                                    </>
                                ) : (
                                    <strong className="code-expiry-timer" style={{ color: "#dc2626" }}>
                                        Code expired
                                    </strong>
                                )}
                            </div>
                        </div>

                        {/* Verification Code Input Section */}
                        <form onSubmit={onVerifySubmit}>
                            <div className="otp-section-wrapper">
                                <label className="otp-field-label">
                                    Enter Verification Code <span className="otp-required-star">*</span>
                                </label>

                                <div className="otp-boxes-row" onPaste={handlePaste}>
                                    {otp.map((digit, idx) => (
                                        <input
                                            key={idx}
                                            ref={(el) => (otpInputRefs.current[idx] = el)}
                                            type="text"
                                            inputMode="numeric"
                                            maxLength={1}
                                            value={digit}
                                            onChange={(e) => handleOtpChange(idx, e.target.value)}
                                            onKeyDown={(e) => handleKeyDown(idx, e)}
                                            className={`otp-digit-input ${digit ? "filled" : ""}`}
                                            autoFocus={idx === 0}
                                        />
                                    ))}
                                </div>

                                {otpError && (
                                    <div className="step-field-error" style={{ marginTop: "4px" }}>
                                        <AlertCircle size={14} />
                                        <span>{otpError}</span>
                                    </div>
                                )}
                            </div>

                            {/* Buttons Row: Resend Code + Verify Email */}
                            <div className="signup-buttons-row">
                                <button
                                    type="button"
                                    className="btn-otp-resend"
                                    onClick={onResendClick}
                                    disabled={!canResend}
                                    title={secondsLeft > 0 ? `Available in ${formatTime(secondsLeft)}` : "Resend verification code"}
                                >
                                    <RotateCcw
                                        size={17}
                                        className={isResending ? "animate-spin" : ""}
                                    />
                                    <span>
                                        {isResending
                                            ? "Sending..."
                                            : secondsLeft > 0
                                                ? `Resend in ${formatTime(secondsLeft)}`
                                                : "Resend Code"}
                                    </span>
                                </button>

                                <button type="submit" className="btn-otp-verify" disabled={isVerifying}>
                                    <span>{isVerifying ? "Verifying..." : "Verify Email"}</span>
                                    <ArrowRight size={17} />
                                </button>
                            </div>
                        </form>

                        {/* Bottom Info Banner (matches screenshot) */}
                        <div className="signup-info-banner">
                            <div className="signup-info-icon-wrapper">
                                <Info size={19} />
                            </div>
                            <p className="signup-info-text">
                                If you do not receive the code, please check your spam folder or click "Resend Code" after a few minutes.
                            </p>
                        </div>
                    </div>
                )}

                {/* ══════════════════════════════════════════════════
                    STEP 3: Email Verified & Admin Approval Status
                   ══════════════════════════════════════════════════ */}
                {currentStep === 3 && (
                    <div className="signup-step-content-anim" key="step-3">
                        <div className="success-view-container">
                            <div className="success-badge-circle">
                                <CheckCircle2 size={40} />
                            </div>

                            <h1 className="success-heading">Email Verified Successfully!</h1>
                            <p className="success-lead-text">
                                Your email address has been verified successfully. Your request has been forwarded for admin approval. Once approved, your credentials will be shared with you via email.
                            </p>

                            {requestId && (
                                <p style={{ fontSize: "12px", color: "#64748b", fontFamily: "monospace", margin: "0 0 20px" }}>
                                    Request ID: {requestId}
                                </p>
                            )}

                            {/* Action Buttons */}
                            <div className="success-action-row" style={{ marginTop: "16px" }}>
                                <button
                                    type="button"
                                    className="btn-back-login"
                                    onClick={() => navigate("/login")}
                                >
                                    <span>Back to Login</span>
                                    <ArrowRight size={17} />
                                </button>
                                <button
                                    type="button"
                                    className="btn-reset-flow"
                                    onClick={resetSignup}
                                >
                                    <ArrowLeft size={15} />
                                    <span>Register Another</span>
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
