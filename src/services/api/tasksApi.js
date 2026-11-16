import { apiFetch } from './baseApi';

// Backward compatible task API facade. Requests always go to the backend so
// API and authorization failures are surfaced instead of appearing successful.
export const tasksApi = {
  async getTasks(assignedTo = 'all', status = 'all') {
    const response = await apiFetch('/tasks?page=1&limit=100');
    let tasks = Array.isArray(response?.data) ? response.data : [];
    if (assignedTo && assignedTo !== 'all') {
      tasks = tasks.filter(task => String(task.assigned_to) === String(assignedTo));
    }
    if (status && status !== 'all') {
      tasks = tasks.filter(task => String(task.status).toLowerCase() === String(status).toLowerCase());
    }
    return tasks;
  },

  async createTask(taskData) {
    const response = await apiFetch('/tasks', {
      method: 'POST',
      body: JSON.stringify(taskData),
    });
    return response?.data || response;
  },

  updateTask(id, updateData) {
    return apiFetch(`/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
  },

  deleteTask(id) {
    return apiFetch(`/tasks/${id}`, { method: 'DELETE' });
  },
};
