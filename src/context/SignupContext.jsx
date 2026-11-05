/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect } from 'react';
import {
    requestOtpApi,
    verifyOtpApi,
    resendOtpApi
} from '../services/signup.service';

export const SignupContext = createContext(null);

const OTP_LENGTH = 6;
const COUNTDOWN_INITIAL = 600; // 10:00 minutes

export const SignupProvider = ({ children }) => {
    // Stepper state: 1 = Enter Email, 2 = Verify Email, 3 = Status
    const [currentStep, setCurrentStep] = useState(1);

    // Step 1: User Details
    const [email, setEmail] = useState('');
    const [fullName, setFullName] = useState('');
    const [emailError, setEmailError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Step 2: OTP State
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [secondsLeft, setSecondsLeft] = useState(COUNTDOWN_INITIAL);
    const [isResending, setIsResending] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);
    const [resendToast, setResendToast] = useState('');
    const [otpError, setOtpError] = useState('');

    // Step 3: Verified Request Details
    const [requestId, setRequestId] = useState(null);

    // Countdown timer for Step 2
    useEffect(() => {
        if (currentStep !== 2) return;
        if (secondsLeft <= 0) return;

        const timer = setInterval(() => {
            setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
        }, 1000);

        return () => clearInterval(timer);
    }, [currentStep, secondsLeft]);

    // Format seconds into MM:SS
    const formatTime = (totalSeconds) => {
        const mins = Math.floor(totalSeconds / 60);
        const secs = totalSeconds % 60;
        return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    };

    // Can resend only when countdown reaches 0 and not currently resending
    const canResend = secondsLeft === 0 && !isResending;

    // ── Action: Step 1 Submit Email ─────────────────────────────
    const submitEmail = async (overrideEmail, overrideName) => {
        const targetEmail = (overrideEmail !== undefined ? overrideEmail : email).trim();
        const targetName = (overrideName !== undefined ? overrideName : fullName).trim();

        if (!targetEmail) {
            setEmailError('Please enter your company email address.');
            return false;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(targetEmail)) {
            setEmailError('Please enter a valid company email address.');
            return false;
        }

        setEmailError('');
        setIsSubmitting(true);

        try {
            const res = await requestOtpApi({
                user_email: targetEmail,
                user_name: targetName || undefined,
            });

            setRequestId(res.data?.request_id || null);
            setOtp(['', '', '', '', '', '']);
            setSecondsLeft(COUNTDOWN_INITIAL);
            setOtpError('');
            setCurrentStep(2);
            return true;
        } catch (err) {
            setEmailError(err.message || 'Failed to send verification code. Please try again.');
            return false;
        } finally {
            setIsSubmitting(false);
        }
    };

    // ── Action: Step 2 Verify OTP ───────────────────────────────
    const verifyOtp = async (codeToVerify) => {
        const enteredCode = (codeToVerify || otp.join('')).trim();

        if (enteredCode.length < OTP_LENGTH) {
            setOtpError('Please enter all 6 digits of the verification code.');
            return false;
        }

        setIsVerifying(true);
        setOtpError('');

        try {
            const res = await verifyOtpApi({
                user_email: email.trim(),
                otp: enteredCode,
            });

            setRequestId(res.data?.request_id || requestId);
            setCurrentStep(3);
            return true;
        } catch (err) {
            setOtpError(err.message || 'Invalid or expired code. Please try again.');
            setOtp(['', '', '', '', '', '']);
            return false;
        } finally {
            setIsVerifying(false);
        }
    };

    // ── Action: Resend OTP Code ─────────────────────────────────
    const resendOtp = async () => {
        if (!canResend) return false;

        setIsResending(true);
        setOtpError('');

        try {
            const res = await resendOtpApi({
                user_email: email.trim(),
                user_name: fullName.trim() || undefined,
            });

            setRequestId(res.data?.request_id || null);
            setOtp(['', '', '', '', '', '']);
            setSecondsLeft(COUNTDOWN_INITIAL);
            setResendToast(`A fresh verification code was sent to ${email}`);
            setTimeout(() => setResendToast(''), 5000);
            return true;
        } catch (err) {
            setOtpError(err.message || 'Failed to resend code. Please try again.');
            return false;
        } finally {
            setIsResending(false);
        }
    };

    // ── Action: Reset Flow ───────────────────────────────────────
    const resetSignup = () => {
        setEmail('');
        setFullName('');
        setEmailError('');
        setOtp(['', '', '', '', '', '']);
        setOtpError('');
        setSecondsLeft(COUNTDOWN_INITIAL);
        setRequestId(null);
        setResendToast('');
        setCurrentStep(1);
    };

    return (
        <SignupContext.Provider
            value={{
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
                setSecondsLeft,
                isResending,
                isVerifying,
                resendToast,
                setResendToast,
                otpError,
                setOtpError,
                requestId,
                setRequestId,
                canResend,
                formatTime,
                submitEmail,
                verifyOtp,
                resendOtp,
                resetSignup,
            }}
        >
            {children}
        </SignupContext.Provider>
    );
};

export const useSignup = () => {
    const context = useContext(SignupContext);
    if (!context) {
        throw new Error('useSignup must be used within a SignupProvider');
    }
    return context;
};
