import { getAccessToken, refreshSession } from '../auth.service';

 
const rawApiUrl = (import.meta.env.VITE_API_URL || 'https://liblistbackend.vercel.app/api').trim(); 
export const API_BASE = rawApiUrl.endsWith('/api') ? rawApiUrl : `${rawApiUrl.replace(/\/+$/, '')}/api`;

/**
 * Resolve access token from in-memory, sessionStorage, or localStorage
 */
function resolveToken() {
  try {
    const memToken = getAccessToken();
    if (memToken) return memToken;
  } catch (_) {}

  if (typeof window !== 'undefined') {
    try {
      return (
        window.sessionStorage?.getItem('libtrak_access_token') ||
        window.localStorage?.getItem('libtrak_access_token') ||
        null
      );
    } catch (_) {}
  }
  return null;
}

/**
 * Standard fetch helper with error handling, full storage token lookup, and auto-refresh
 */
export async function apiFetch(endpoint, options = {}) {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
  
  const buildHeaders = () => {
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    };

    if (options.body instanceof FormData) {
      delete headers['Content-Type'];
    }

    const token = resolveToken();
    if (token && !headers['Authorization']) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  };

  let response = await fetch(url, {
    credentials: 'include',
    ...options,
    headers: buildHeaders()
  });

  // If unauthorized (token expired), attempt silent refresh and retry once
  if (response.status === 401) {
    try {
      const refreshed = await refreshSession();
      if (refreshed) {
        response = await fetch(url, {
          credentials: 'include',
          ...options,
          headers: buildHeaders()
        });
      }
    } catch (_) {}
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: response.statusText }));
    const error = new Error(errorData.error || errorData.message || `Request failed with status ${response.status}`);
    error.status = response.status;
    error.data = errorData;
    throw error;
  }

  return await response.json();
}
