import { API_BASE, apiFetch } from './baseApi';

export const aiApi = {
  async ingestDocuments(payload) {
    return await apiFetch('/ai/ingest-documents', {
      method: 'POST',
      body: payload
    });
  },

  async queryRag(question, departmentId = 'all') {
    try {
      return await apiFetch('/ai/rag-query', {
        method: 'POST',
        body: JSON.stringify({ question, department_id: departmentId })
      });
    } catch (e) {
      console.warn('RAG query error:', e);
      return null;
    }
  },

  async getVectors(departmentId = 'all') {
    try {
      const url = new URL(`${API_BASE}/vectors`);
      if (departmentId && departmentId !== 'all') url.searchParams.append('department_id', departmentId);
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch vectors');
      return await res.json();
    } catch (e) {
      console.warn('Vectors fetch error, using client fallback:', e);
      return [];
    }
  }
};

