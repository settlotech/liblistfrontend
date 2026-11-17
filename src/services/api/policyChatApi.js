import { apiFetch } from './baseApi';

export const policyChatApi = {
  async getMessages(policyId) {
    const response = await apiFetch(`/policies/${encodeURIComponent(policyId)}/chat`);
    return response?.data || { messages: [], tasks: [] };
  },

  async saveMessage(policyId, { content, task_id = null }) {
    const response = await apiFetch(`/policies/${encodeURIComponent(policyId)}/chat`, {
      method: 'POST',
      body: JSON.stringify({ content, task_id }),
    });
    return response?.data;
  },

  async askShidney(policyId, message) {
    const response = await apiFetch(`/policies/${encodeURIComponent(policyId)}/chat/ask`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
    return response?.data;
  },
};

export default policyChatApi;
