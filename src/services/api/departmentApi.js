import { API_BASE, apiFetch } from './baseApi';

export const departmentApi = {
  async getHierarchy() {
    try {
      const res = await fetch(`${API_BASE}/hierarchy`);
      if (!res.ok) throw new Error('Network error');
      const json = await res.json();
      const list = Array.isArray(json) ? json : (json.departments || json.data || []);
      console.log(`%c📡 [DB FETCH] Successfully loaded ${list.length} Departments/Hierarchy from PostgreSQL DB:`, 'color: #8B5CF6; font-weight: bold; font-size: 12px;', list);
      return list;
    } catch (e) {
      console.warn('API error, using local fallback for hierarchy:', e);
      return null;
    }
  },

  async createDepartment(name, icon = 'folder', created_by = 'Department Manager') {
    return await apiFetch('/departments', {
      method: 'POST',
      body: JSON.stringify({ name, icon, created_by })
    });
  }
};
