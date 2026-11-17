import { apiFetch } from './baseApi';

export const privateChatApi = {
  async getAiMessages(policyId = null) {
    const qs = policyId ? `?policy_id=${encodeURIComponent(policyId)}` : '';
    const response = await apiFetch(`/chats/ai/messages${qs}`);
    return response?.data || { messages: [] };
  },

  async sendAiMessage(contentOrPayload, policyIdArg = null, policyTitleArg = null, policyContextArg = null) {
    const payload = typeof contentOrPayload === 'object' && contentOrPayload !== null
      ? contentOrPayload
      : {
          content: contentOrPayload,
          policy_id: policyIdArg,
          policy_title: policyTitleArg,
          policy_context: policyContextArg,
        };
    const response = await apiFetch('/chats/ai/messages', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return response?.data;
  },
};

export default privateChatApi;
