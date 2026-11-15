import { apiFetch } from './auth.service';
export { createUserApi, fetchRolesApi } from './setting.service';

/**
 * Fetch all user signup requests with optional status filter ('pending', 'approved', 'rejected')
 * @param {string} [status] - Optional status filter
 * @returns {Promise<Array>} List of requests
 */
export const fetchUserRequestsApi = async (status = '') => {
    const query = status ? `?status=${encodeURIComponent(status)}` : '';
    const response = await apiFetch(`/signup/requests${query}`);
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch user requests');
    }
    return data?.data?.requests || [];
};

/**
 * Review a signup request (approve or reject)
 * @param {string} id - Request UUID
 * @param {Object} options - { status: 'approved' | 'rejected', rejection_reason?: string }
 * @returns {Promise<Object>} Updated request data
 */
export const reviewUserRequestApi = async (id, { status, rejection_reason = '', password = '' }) => {
    const payload = {
        status,
        ...(status === 'rejected' && rejection_reason ? { rejection_reason } : {}),
        ...(status === 'approved' && password ? { password } : {})
    };

    const response = await apiFetch(`/signup/requests/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
    });

    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || `Failed to ${status} user request`);
    }
    return data?.data?.request || data;
};
