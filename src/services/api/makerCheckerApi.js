import { API_BASE, apiFetch } from './baseApi';

export const makerCheckerApi = {
  async getMakerCheckerItems() {
    try {
      const res = await fetch(`${API_BASE}/maker-checker`);
      if (!res.ok) throw new Error('Network error');
      const data = await res.json();
      console.log(`%c📡 [DB FETCH] Maker-Checker Queue (${data.pending?.length || 0} in review, ${data.drafts?.length || 0} drafts) from PostgreSQL DB:`, 'color: #EF4444; font-weight: bold; font-size: 12px;', data);
      return data;
    } catch (e) {
      console.warn('API error for maker-checker:', e);
      return { pendingCount: 0, pending: [], history: [] };
    }
  },

  async createMakerCheckerItem(itemData) {
    return await apiFetch('/maker-checker', {
      method: 'POST',
      body: JSON.stringify(itemData)
    });
  },

  async actionMakerChecker(id, action, checkerName, comments) {
    return await apiFetch(`/maker-checker/${id}/action`, {
      method: 'POST',
      body: JSON.stringify({ action, checker_name: checkerName, comments })
    });
  },

  async closeMakerCheckerItem(id) {
    return await apiFetch(`/maker-checker/${id}/close`, {
      method: 'PATCH',
      body: JSON.stringify({ is_closed: true })
    });
  }
};

