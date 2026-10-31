const API_URL = 'http://localhost:5000/api';

 
let accessToken = null;
let refreshPromise = null;

export const setAccessToken = (token) => {
    accessToken = token;
};

export const getAccessToken = () => {
    return accessToken;
};

export const clearAccessToken = () => {
    accessToken = null;
};

const setUser = (user) => {
    if (user) {
        sessionStorage.setItem('user', JSON.stringify(user));
    }
};

export const getUser = () => {
    try {
        return JSON.parse(sessionStorage.getItem('user'));
    } catch {
        return null;
    }
};

const clearUser = () => {
    sessionStorage.removeItem('user');
};

export const clearAuth = () => {
    clearAccessToken();
    clearUser();
};

export const refreshSession = async () => {
    // Prevent multiple simultaneous refresh requests 
    if (refreshPromise) {
        return refreshPromise;
    }

    refreshPromise = (async () => {
        try {
            const response = await fetch(`${API_URL}/auth/refresh`, {
                method: 'POST',
                credentials: 'include'
            });

            if (response.status === 401) {
                clearAuth();
                return false;
            }

            if (!response.ok) {
                clearAuth();
                return false;
            }

            const data = await response.json();
            const token = data?.data?.accessToken || data?.accessToken;
            const user = data?.data?.user || data?.user;

            if (token) {
                setAccessToken(token);
            }

            if (user) {
                setUser(user);
            }

            return true;

        } catch {
            clearAuth();
            return false;
        } finally {
            refreshPromise = null;
        }
    })();

    return refreshPromise;
};

 
export const loginApi = async (payload) => {
    const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
        throw new Error(data.message || 'Login failed');
    }

    const token = data?.data?.accessToken || data?.accessToken;
    const user = data?.data?.user || data?.user;

    setAccessToken(token);
    setUser(user);

    return data;
};

export const registerApi = async (payload) => {
    const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
        throw new Error(data.message || 'Registration failed');
    }

    return data;
};

export const apiFetch = async (endpoint, options = {}) => {
    const makeRequest = () => {
        const headers = new Headers(options.headers || {});

        if (accessToken) {
            headers.set(
                'Authorization',
                `Bearer ${accessToken}`
            );
        }

        if (options.body && !(options.body instanceof FormData) && !headers.has('Content-Type')) {
            headers.set('Content-Type', 'application/json');
        }

        return fetch(`${API_URL}${endpoint}`, {
            ...options,
            headers,
            credentials: 'include'
        });
    };

    let response = await makeRequest();

    // Access token expired
    if (response.status === 401) {
        const refreshed = await refreshSession();

        if (refreshed) {
            // Retry original API request
            response = await makeRequest();
        } else {
            clearAuth();
        }
    }

    return response;
};

export const getProfileApi = async () => {
    const response = await apiFetch('/auth/profile'); 
    const data = await response.json(); 
    if (!response.ok) {
        throw new Error(data.message || 'Unable to get profile');
    } 
    const user = data?.data?.user || data?.user;
    if (user) {
        setUser(user);
    }
    return data;
};

export const updateProfileApi = async (payload) => {
    const response = await apiFetch('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'Profile update failed');
    }

    const user = data?.data?.user || data?.user;
    if (user) {
        setUser(user);
    }

    return data;
};

// ================================
// CHANGE PASSWORD API
// ================================

export const changePasswordApi = async (payload) => {
    const response = await apiFetch('/auth/change-password', {
        method: 'PATCH',
        body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'Password change failed');
    }

    clearAuth();

    return data;
};

export const logoutApi = async () => {
    try {
        const response = await fetch(`${API_URL}/auth/logout`, {
            method: 'POST',
            credentials: 'include'
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            throw new Error(data.message || 'Logout failed');
        }

        return data;

    } finally {
        clearAuth();
    }
};

export const logoutAllApi = async () => {
    try {
        const response = await apiFetch('/auth/logout-all', {
            method: 'POST'
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            throw new Error(data.message || 'Logout all failed');
        }

        return data;

    } finally {
        clearAuth();
    }
};
