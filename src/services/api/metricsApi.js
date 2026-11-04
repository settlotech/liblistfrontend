import { API_BASE } from './baseApi';

export const metricsApi = {
  async getDashboardMetrics(departmentId = 'all') {
    try {
      const res = await fetch(`${API_BASE}/dashboard-metrics?department_id=${departmentId}`);
      if (!res.ok) throw new Error('Network error');
      return await res.json();
    } catch (e) {
      console.warn('API error for metrics:', e);
      return [];
    }
  }
};

