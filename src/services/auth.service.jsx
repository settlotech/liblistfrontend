// const rawApiUrl = 'http://localhost:5000/api'.trim(); 
const rawApiUrl = (import.meta.env.VITE_API_URL || 'https://liblistbackend.vercel.app/api').trim();
const API_URL = rawApiUrl.endsWith('/api') ? rawApiUrl : `${rawApiUrl.replace(/\/+$/, '')}/api`;

let accessToken = null;
let refreshPromise = null;

 
let _rememberMe = typeof localStorage !== 'undefined' ? localStorage.getItem('libtrak_remember_me') === '1': false;

export const setRememberMe = (val) => {
    _rememberMe = Boolean(val);
    if (typeof localStorage !== 'undefined') {
        if (_rememberMe) {
            localStorage.setItem('libtrak_remember_me', '1');
        } else {
            localStorage.removeItem('libtrak_remember_me');
        }
    }
};

export const getRememberMe = () => {
    if (typeof localStorage !== 'undefined') {
        return localStorage.getItem('libtrak_remember_me') === '1';
    }
    return false;
};

// --- Access Token ------------------------------------------------------------
export const setAccessToken = (token) => {
    accessToken = token;
    if (token) {
        if (_rememberMe) {
            localStorage.setItem('libtrak_access_token', token);
            sessionStorage.removeItem('libtrak_access_token');
        } else {
            sessionStorage.setItem('libtrak_access_token', token);
            localStorage.removeItem('libtrak_access_token');
        }
    } else {
        localStorage.removeItem('libtrak_access_token');
        sessionStorage.removeItem('libtrak_access_token');
    }
};

export const getAccessToken = () => {
    if (!accessToken) {
        // sessionStorage first (tab-local), then localStorage (remembered session)
        accessToken = sessionStorage.getItem('libtrak_access_token')
            || localStorage.getItem('libtrak_access_token')
            || null;
    }
    return accessToken;
};

export const clearAccessToken = () => {
    accessToken = null;
    localStorage.removeItem('libtrak_access_token');
    sessionStorage.removeItem('libtrak_access_token');
};

// --- User -------------------------------------------------------------------
const setUser = (user) => {
    if (user) {
        const json = JSON.stringify(user);
        if (_rememberMe) {
            localStorage.setItem('libtrak_authenticated_user', json);
            sessionStorage.removeItem('libtrak_authenticated_user');
        } else {
            sessionStorage.setItem('libtrak_authenticated_user', json);
            localStorage.removeItem('libtrak_authenticated_user');
        }
    }
};

export const getUser = () => {
    try {
        const sessionUser = sessionStorage.getItem('libtrak_authenticated_user');
        if (sessionUser) return JSON.parse(sessionUser);
        const localUser = typeof localStorage !== 'undefined'
            ? localStorage.getItem('libtrak_authenticated_user')
            : null;
        if (localUser) return JSON.parse(localUser);
        return null;
    } catch {
        return null;
    }
};

const clearUser = () => {
    sessionStorage.removeItem('libtrak_authenticated_user');
    localStorage.removeItem('libtrak_authenticated_user');
};

export const clearAuth = () => {
    clearAccessToken();
    clearUser();
    // Clear the remember-me flag on explicit logout
    localStorage.removeItem('libtrak_remember_me');
    _rememberMe = false;
};
export const refreshSession = async () => {
    // Prevent multiple simultaneous refresh requests 
    if (refreshPromise) {
        return refreshPromise;
    }

    refreshPromise = (async () => {
        try {
            const storedRefreshToken = typeof localStorage !== 'undefined' ? localStorage.getItem('libtrak_refresh_token') : null;
            const headers = { 'Content-Type': 'application/json' };
            if (storedRefreshToken) {
                headers['x-refresh-token'] = storedRefreshToken;
            }

            const response = await fetch(`${API_URL}/auth/refresh`, {
                method: 'POST',
                headers,
                credentials: 'include',
                body: JSON.stringify({ refreshToken: storedRefreshToken })
            });

            if (response.status === 401 || !response.ok) {
                clearAuth();
                return false;
            }

            const data = await response.json();
            const token = data?.data?.accessToken || data?.accessToken;
        const refreshToken = data?.data?.refreshToken || data?.refreshToken;
        if (refreshToken && typeof localStorage !== 'undefined') {
            localStorage.setItem('libtrak_refresh_token', refreshToken);
        }
            const newRefreshToken = data?.data?.refreshToken || data?.refreshToken;
            const user = data?.data?.user || data?.user;

            if (token) {
                setAccessToken(token);
            }
            if (newRefreshToken && typeof localStorage !== 'undefined') {
                localStorage.setItem('libtrak_refresh_token', newRefreshToken);
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

    // Set rememberMe flag BEFORE storing tokens so storage destination is correct
    setRememberMe(payload.rememberMe);
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
        const token = getAccessToken();

        if (token) {
            headers.set(
                'Authorization',
                `Bearer ${token}`
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
        method: 'PATCH',
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

export const checkemailavailability = async (email) => {
    const response = await apiFetch('/users/checkemailid', {
        method: 'POST',
        body: JSON.stringify({ email })
    });
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || 'Failed to send reset email');
    }
    return data;
};
