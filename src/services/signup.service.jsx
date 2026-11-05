const API_URL = 'http://localhost:5000/api';


export const requestOtpApi = async ({ user_email, user_name }) => {
    const response = await fetch(`${API_URL}/signup/request-otp`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user_email, user_name }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to send verification code.');
    }

    return data;
};

 
export const verifyOtpApi = async ({ user_email, otp }) => {
    const response = await fetch(`${API_URL}/signup/verify-otp`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user_email, otp }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
        throw new Error(data.message || 'Invalid or expired verification code.');
    }

    return data;
};

 
export const resendOtpApi = async ({ user_email, user_name }) => {
    const response = await fetch(`${API_URL}/signup/resend-otp`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user_email, user_name }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to resend verification code.');
    }

    return data;
};
