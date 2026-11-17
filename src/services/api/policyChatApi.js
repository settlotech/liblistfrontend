import { apiFetch } from './baseApi';

export const policyChatApi = {
  async getMessages(policyId) {
    const response = await apiFetch(`/policies/${encodeURIComponent(policyId)}/chat`);
    return response?.data || { messages: [], tasks: [] };
  },

  async saveMessage(policyId, payload) {
    const body = typeof payload === 'string' ? { content: payload } : (payload || {});
    const response = await apiFetch(`/policies/${encodeURIComponent(policyId)}/chat`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
    return response?.data;
  },

  async toggleLike(policyId, messageId) {
    const response = await apiFetch(
      `/policies/${encodeURIComponent(policyId)}/chat/${encodeURIComponent(messageId)}/like`,
      { method: 'PUT' }
    );
    return response?.data;
  },

  async updateTaskStatus(policyId, messageId, status) {
    const response = await apiFetch(
      `/policies/${encodeURIComponent(policyId)}/chat/${encodeURIComponent(messageId)}/status`,
      {
        method: 'PUT',
        body: JSON.stringify({ status }),
      }
    );
    return response?.data;
  },

  async askShidney(policyId, message, policyContext = null) {
    const response = await apiFetch(`/policies/${encodeURIComponent(policyId)}/chat/ask`, {
      method: 'POST',
      body: JSON.stringify({ message, policy_context: policyContext }),
    });
    return response?.data;
  },
};

export default policyChatApi;
