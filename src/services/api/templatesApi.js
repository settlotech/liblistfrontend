import { API_BASE, apiFetch } from './baseApi';

export const templatesApi = {
  async getTemplates(departmentId = 'all') {
    try {
      const url = new URL(`${API_BASE}/templates`);
      if (departmentId && departmentId !== 'all') url.searchParams.append('department_id', departmentId);

      const res = await fetch(url);
      if (!res.ok) throw new Error('Network error');
      const data = await res.json();
      console.log(`%c📡 [DB FETCH] Successfully loaded ${data.length} Dynamic Policy Templates from PostgreSQL DB:`, 'color: #D97706; font-weight: bold; font-size: 12px;', data);
      return data;
    } catch (e) {
      console.warn('API error fetching templates, using client fallback:', e);
      return [];
    }
  },

  async getTemplateById(id) {
    return await apiFetch(`/templates/${id}`);
  },

  async createTemplate(templateData) {
    return await apiFetch('/templates', {
      method: 'POST',
      body: JSON.stringify(templateData)
    });
  }
};

