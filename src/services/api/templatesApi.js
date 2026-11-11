import { apiFetch } from './baseApi';

export const templatesApi = {
  async getTemplates(departmentId = 'all') {
    try {
      const url = departmentId && departmentId !== 'all' 
        ? `/templates?department_id=${encodeURIComponent(departmentId)}` 
        : '/templates';
      const data = await apiFetch(url);
      return Array.isArray(data) ? data : [];
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
