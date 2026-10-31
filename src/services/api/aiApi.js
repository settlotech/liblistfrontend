import { API_BASE, apiFetch } from './baseApi';

export const aiApi = {
  async ingestDocuments(payload) {
    let headers = {};
    let body = payload;

    if (!(payload instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
      body = JSON.stringify(payload);
    }

    const res = await fetch(`${API_BASE}/ai/ingest-documents`, {
      method: 'POST',
      headers,
      body
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Upload failed' }));
      throw new Error(err.error || 'Failed to ingest documents');
    }
    return await res.json();
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

