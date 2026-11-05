import { API_BASE, apiFetch } from './baseApi';

export const usersApi = {
  async getUsers(bankId = 'all', roleType = '') {
    try {
      const params = new URLSearchParams();
      if (bankId && bankId !== 'all') params.append('bank_id', bankId);
      if (roleType) params.append('role_type', roleType);
      const qs = params.toString();
      const endpoint = qs ? `/users?${qs}` : '/users';

      const res = await apiFetch(endpoint);
      const data = res?.data || res || [];
      return Array.isArray(data) ? data : [];
    } catch (e) {
      console.warn('API error fetching users, using fallback:', e);
      return [];
    }
  },

  async getUserById(id) {
    return await apiFetch(`/users/${id}`);
  },

  async createUser(userData) {
    return await apiFetch('/users', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  },

  async updateUser(id, userData) {
    return await apiFetch(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData)
    });
  },

  async deleteUser(id, deletedBy = 'Admin') {
    return await apiFetch(`/users/${id}?deleted_by=${encodeURIComponent(deletedBy)}`, {
      method: 'DELETE'
    });
  }
};
