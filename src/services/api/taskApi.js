import { apiFetch } from './baseApi';

/**
 * Task Management API – Full RBAC-aware task module.
 * All requests attach the JWT Bearer token automatically via apiFetch.
 */
export const taskApi = {

    // ── USERS FOR ASSIGNMENT & PARTICIPANTS ────────────────────────────────
    async getAssignableUsers() {
        const res = await apiFetch('/tasks/users');
        return res?.data || res || [];
    },

    // ── ALL TASKS (paginated, grouped) ──────────────────────────────────────
    async getTasks({ search = '', page = 1, limit = 20 } = {}) {
        const params = new URLSearchParams({ search, page, limit }).toString();
        return apiFetch(`/tasks?${params}`);
    },

    // ── CATEGORY ENDPOINTS ───────────────────────────────────────────────────
    async getCommonTasks({ search = '', page = 1, limit = 20 } = {}) {
        const params = new URLSearchParams({ search, page, limit }).toString();
        return apiFetch(`/tasks/common?${params}`);
    },

    async getPinnedTasks({ search = '', page = 1, limit = 20 } = {}) {
        const params = new URLSearchParams({ search, page, limit }).toString();
        return apiFetch(`/tasks/pinned?${params}`);
    },

    async getGeneralTasks({ search = '', page = 1, limit = 20 } = {}) {
        const params = new URLSearchParams({ search, page, limit }).toString();
        return apiFetch(`/tasks/general?${params}`);
    },

    // ── SINGLE TASK ──────────────────────────────────────────────────────────
    async getTaskById(taskId) {
        return apiFetch(`/tasks/${taskId}`);
    },

    // ── CREATE ───────────────────────────────────────────────────────────────
    /**
     * Create a task. Must only be called from the right-click context menu.
     * @param {Object} taskData
     * @param {string} taskData.title
     * @param {string} [taskData.description]
     * @param {'common'|'general'} [taskData.category]
     * @param {string} [taskData.assigned_to]  UUID
     * @param {string} [taskData.library_id]
     * @param {string} [taskData.section_id]
     * @param {Array}  [taskData.participants]  [{user_id, role}]
     */
    async createTask(taskData) {
        return apiFetch('/tasks', {
            method: 'POST',
            body: JSON.stringify(taskData)
        });
    },

    // ── UPDATE ───────────────────────────────────────────────────────────────
    async updateTask(taskId, updates) {
        return apiFetch(`/tasks/${taskId}`, {
            method: 'PUT',
            body: JSON.stringify(updates)
        });
    },

    async deleteTask(taskId) {
        return apiFetch(`/tasks/${taskId}`, { method: 'DELETE' });
    },

    // ── ASSIGNMENT ───────────────────────────────────────────────────────────
    async assignTask(taskId, assignedTo) {
        return apiFetch(`/tasks/${taskId}/assign`, {
            method: 'PUT',
            body: JSON.stringify({ assigned_to: assignedTo })
        });
    },

    async reassignTask(taskId, assignedTo) {
        return apiFetch(`/tasks/${taskId}/reassign`, {
            method: 'PUT',
            body: JSON.stringify({ assigned_to: assignedTo })
        });
    },

    // ── STATUS ───────────────────────────────────────────────────────────────
    async updateStatus(taskId, status, comment = null) {
        return apiFetch(`/tasks/${taskId}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status, comment })
        });
    },

    async approveTask(taskId, comment = null) {
        return apiFetch(`/tasks/${taskId}/approve`, {
            method: 'PUT',
            body: JSON.stringify({ comment })
        });
    },

    async cancelTask(taskId, comment = null) {
        return apiFetch(`/tasks/${taskId}/cancel`, {
            method: 'PUT',
            body: JSON.stringify({ comment })
        });
    },

    // ── PARTICIPANTS ─────────────────────────────────────────────────────────
    async getParticipants(taskId) {
        return apiFetch(`/tasks/${taskId}/participants`);
    },

    async addParticipant(taskId, userId, role) {
        return apiFetch(`/tasks/${taskId}/participants`, {
            method: 'POST',
            body: JSON.stringify({ user_id: userId, role })
        });
    },

    async removeParticipant(taskId, participantId) {
        return apiFetch(`/tasks/${taskId}/participants/${participantId}`, { method: 'DELETE' });
    },

    // ── PINS ─────────────────────────────────────────────────────────────────
    async pinTask(taskId) {
        return apiFetch(`/tasks/${taskId}/pin`, { method: 'POST' });
    },

    async unpinTask(taskId) {
        return apiFetch(`/tasks/${taskId}/pin`, { method: 'DELETE' });
    },

    // ── LOGS & COMMENTS ──────────────────────────────────────────────────────
    async getTaskLogs(taskId) {
        return apiFetch(`/tasks/${taskId}/logs`);
    },

    async addComment(taskId, comment) {
        return apiFetch(`/tasks/${taskId}/comments`, {
            method: 'POST',
            body: JSON.stringify({ comment })
        });
    }
};

export default taskApi;
