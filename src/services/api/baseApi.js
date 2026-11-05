const rawApiUrl = (import.meta.env.VITE_API_URL || 'https://liblistbackend.vercel.app/api').trim();
export const API_BASE = rawApiUrl.endsWith('/api') ? rawApiUrl : `${rawApiUrl.replace(/\/+$/, '')}/api`;

/**
 * Standard fetch helper with error handling and JSON parsing
 */
export async function apiFetch(endpoint, options = {}) {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
  
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  // If payload is FormData, do not set application/json
  if (options.body instanceof FormData) {
    delete headers['Content-Type'];
  }

  // Attach Authorization Bearer token from stored session
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('libtrak_access_token') : null;
  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    credentials: 'include',
    ...options,
    headers
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: response.statusText }));
    const error = new Error(errorData.error || `Request failed with status ${response.status}`);
    error.status = response.status;
    error.data = errorData;
    throw error;
  }

  return await response.json();
}

