import axios from 'axios';
import { API_BASE } from '../config/apiConfig';
import { getAccessToken, setAccessToken } from '../services/auth.service';

const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

// ── Request Interceptor: Attach Access Token ──────────────────────────────────
api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

// ── Response Interceptor: Silent Token Refresh (No Hard Reloads) ─────────────
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => (error ? prom.reject(error) : prom.resolve(token)));
  failedQueue = [];
};

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;

    // Do NOT attempt refresh on login, refresh, or logout endpoints
    const isAuthRoute =
      original?.url?.includes('/auth/login') ||
      original?.url?.includes('/auth/refresh') ||
      original?.url?.includes('/auth/logout');

    if (err.response?.status === 401 && !original?._retry && !isAuthRoute) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            original.headers['Authorization'] = `Bearer ${token}`;
            return api(original);
          })
          .catch((e) => Promise.reject(e));
      }

      original._retry = true;
      isRefreshing = true;

      try {
        // Use plain axios to avoid interceptor recursion
        const { data } = await axios.post(
          `${API_BASE}/auth/refresh`,
          {},
          { withCredentials: true }
        );

        const newToken = data?.data?.accessToken;
        if (!newToken) throw new Error('No new token returned');

        setAccessToken(newToken);
        processQueue(null, newToken);

        original.headers['Authorization'] = `Bearer ${newToken}`;
        return api(original);
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        // Clear tokens without triggering window.location reload loop
        sessionStorage.removeItem('accessToken');
        sessionStorage.removeItem('user');
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(err);
  }
);

export default api;
