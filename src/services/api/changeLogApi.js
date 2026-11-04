import { API_BASE } from './baseApi';

export const changeLogApi = {
  async getChangeLogs(entityType = '') {
    try {
      const url = new URL(`${API_BASE}/change-logs`);
      if (entityType) url.searchParams.append('entity_type', entityType);
      const res = await fetch(url);
      if (!res.ok) throw new Error('Network error');
      return await res.json();
    } catch (e) {
      console.warn('API error for change logs:', e);
      return [];
    }
  }
};

