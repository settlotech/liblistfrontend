const configuredApiUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1').trim();
const withoutVersion = configuredApiUrl.replace(/\/v\d+\/?$/, '');

export const API_BASE = withoutVersion.endsWith('/api')
  ? withoutVersion.replace(/\/+$/, '')
  : `${withoutVersion.replace(/\/+$/, '')}/api`;
