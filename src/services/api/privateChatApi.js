import { apiFetch } from './baseApi';

export const privateChatApi = {
  async getChats() {
    const response = await apiFetch('/chats');
    return response?.data || [];
  },

  async getAiMessages(policyId = null) {
    const query = policyId ? `?policy_id=${encodeURIComponent(policyId)}` : '';
    const response = await apiFetch(`/chats/ai/messages${query}`);
    return response?.data || { messages: [] };
  },

  async sendAiMessage(content, policy_id = null) {
    const response = await apiFetch('/chats/ai/messages', {
      method: 'POST',
      body: JSON.stringify({ content, policy_id }),
    });
    return response?.data;
  },

  async getDirectMessages(userId) {
    const response = await apiFetch(`/chats/direct/${encodeURIComponent(userId)}/messages`);
    return response?.data || { messages: [] };
  },

  async sendDirectMessage(userId, content) {
    const response = await apiFetch(`/chats/direct/${encodeURIComponent(userId)}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
    return response?.data;
  },
};

export default privateChatApi;
