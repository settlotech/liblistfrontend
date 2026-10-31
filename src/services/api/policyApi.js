import { API_BASE, apiFetch } from './baseApi';

export const policyApi = {
  async getPolicies(departmentId = 'all', search = '', userRole = 'employee') {
    try {
      const url = new URL(`${API_BASE}/policies`);
      if (departmentId && departmentId !== 'all') url.searchParams.append('department_id', departmentId);
      if (search) url.searchParams.append('search', search);
      url.searchParams.append('user_role', userRole);

      const res = await fetch(url);
      if (!res.ok) throw new Error('Network error');
      const data = await res.json();
      console.log(`%c📡 [DB FETCH] Successfully loaded ${data.length} policies from PostgreSQL DB:`, 'color: #0057B8; font-weight: bold; font-size: 12px;', data);
      return data;
    } catch (e) {
      console.warn('API error, using local fallback for policies:', e);
      return null;
    }
  },

  async getPolicyDetails(id, userRole = 'employee') {
    try {
      const res = await fetch(`${API_BASE}/policies/${id}?user_role=${userRole}`);
      if (!res.ok) throw new Error('Network error');
      const data = await res.json();
      console.log(`%c📡 [DB FETCH] Policy Full Details lazy-loaded from DB for ID "${id}":`, 'color: #10B981; font-weight: bold; font-size: 12px;', data);
      return data;
    } catch (e) {
      console.warn('API error for policy details:', e);
      return null;
    }
  },

  async createPolicy(policyData) {
    return await apiFetch('/policies', {
      method: 'POST',
      body: JSON.stringify(policyData)
    });
  },

  async updatePolicy(id, updateData) {
    return await apiFetch(`/policies/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updateData)
    });
  },

  async togglePolicyStatus(id, status, userName) {
    return await apiFetch(`/policies/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, user_name: userName })
    });
  },

  async publishDraft(id, userName = 'Marcus Vance (Bank Owner)') {
    return await apiFetch(`/policies/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'active', user_name: userName })
    });
  },

  async togglePolicyMasking(id, is_masked, userName) {
    return await apiFetch(`/policies/${id}/mask`, {
      method: 'PATCH',
      body: JSON.stringify({ is_masked, user_name: userName })
    });
  },

  async deletePolicy(id) {
    return await apiFetch(`/policies/${id}`, {
      method: 'DELETE'
    });
  },

  async addPolicyArtifact(id, artifactData) {
    return await apiFetch(`/policies/${id}/artifacts`, {
      method: 'POST',
      body: JSON.stringify(artifactData)
    });
  },

  async getPolicyArtifacts(id, tabType = '') {
    try {
      const url = new URL(`${API_BASE}/policies/${id}/artifacts`);
      if (tabType) url.searchParams.append('tab_type', tabType);
      const res = await fetch(url);
      if (!res.ok) throw new Error('Network error');
      return await res.json();
    } catch (e) {
      console.warn('API error fetching policy artifacts:', e);
      return [];
    }
  }
};

