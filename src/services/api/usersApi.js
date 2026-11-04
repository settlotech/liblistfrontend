import { API_BASE, apiFetch } from './baseApi';

export const usersApi = {
  async getUsers(bankId = 'all', roleType = '') {
    try {
      const url = new URL(`${API_BASE}/users`);
      if (bankId && bankId !== 'all') url.searchParams.append('bank_id', bankId);
      if (roleType) url.searchParams.append('role_type', roleType);

      const res = await fetch(url);
      if (!res.ok) throw new Error('Network error');
      const data = await res.json();
      console.log(`%c📡 [DB FETCH] Successfully loaded ${data.length} Institutional Bank Users from PostgreSQL DB:`, 'color: #06B6D4; font-weight: bold; font-size: 12px;', data);
      return data;
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

