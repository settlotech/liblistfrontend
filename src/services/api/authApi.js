import { API_BASE, apiFetch } from './baseApi';

export const authApi = {
  /**
   * Log in user with email & password via /api/auth/login
   */
  async login(credentials) {
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(credentials)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error || 'Authentication failed');
      }

      if (data.data?.accessToken) {
        localStorage.setItem('libtrak_access_token', data.data.accessToken);
        localStorage.setItem('libtrak_authenticated_user', JSON.stringify(data.data.user));
      }

      console.log('%c🔐 [AUTH LOGIN SUCCESS]', 'color: #0057B8; font-weight: bold; font-size: 12px;', data.data.user);
      return data.data;
    } catch (err) {
      console.warn('API error during auth/login:', err.message);
      throw err;
    }
  },

  /**
   * Register new institutional user via /api/auth/register
   */
  async register(userData) {
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(userData)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error || 'Registration failed');
      }

      console.log('%c📝 [AUTH REGISTER SUCCESS]', 'color: #0057B8; font-weight: bold; font-size: 12px;', data.data);
      return data.data;
    } catch (err) {
      console.warn('API error during auth/register:', err.message);
      throw err;
    }
  },

  /**
   * Fetch authenticated user profile via /api/auth/profile
   */
  async getProfile() {
    try {
      const token = localStorage.getItem('libtrak_access_token');
      const res = await fetch(`${API_BASE}/auth/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include'
      });
      if (!res.ok) throw new Error('Failed to fetch profile');
      const data = await res.json();
      return data.data?.user;
    } catch (err) {
      console.warn('API error fetching profile:', err.message);
      return null;
    }
  },

  /**
   * Log out via /api/auth/logout
   */
  async logout() {
    try {
      const token = localStorage.getItem('libtrak_access_token');
      await fetch(`${API_BASE}/auth/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include'
      });
    } catch (_) {
      // Ignore network errors on logout
    } finally {
      localStorage.removeItem('libtrak_access_token');
      localStorage.removeItem('libtrak_authenticated_user');
    }
  }
};

