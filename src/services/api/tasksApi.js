import { API_BASE, apiFetch } from './baseApi';

const DEFAULT_MOCK_TASKS = [
  {
    id: 1,
    title: 'Complete Commercial Equipment Finance SOP Clauses',
    description: 'Review asset classes benchmarks, equipment depreciation tables, and underwriting delegation caps under APRA CPS 230.',
    assigned_to: 'Sarah Jenkins',
    assigned_by: 'Marcus Vance (Bank Administrator)',
    priority: 'high',
    status: 'in_progress',
    due_date: 'Tomorrow, 5:00 PM',
    category: 'Policy Drafting',
    linked_policy_id: 'commercial-equipment-finance-sop',
    created_at: new Date().toISOString()
  },
  {
    id: 2,
    title: 'APRA CPS 234 Annual Digital MFA Verification',
    description: 'Perform institutional audit of customer onboarding DVS biometrics and officer two-factor clearance protocols.',
    assigned_to: 'Sarah Jenkins',
    assigned_by: 'Marcus Vance (Bank Administrator)',
    priority: 'high',
    status: 'pending',
    due_date: 'Friday, 3 Nov 2026',
    category: 'APRA CPS 234 Audit',
    linked_policy_id: 'remote-access-security-policy',
    created_at: new Date().toISOString()
  },
  {
    id: 3,
    title: 'Revolving Credit Cards SLA Turnaround Review',
    description: 'Validate proposed 4-hour SLA with Operations squad and cross-check with Tier-1 card limits policy.',
    assigned_to: 'Marcus Vance',
    assigned_by: 'Marcus Vance (Bank Administrator)',
    priority: 'medium',
    status: 'pending',
    due_date: '10 Nov 2026',
    category: 'Maker-Checker Review',
    linked_policy_id: 'credit-card-limits-policy',
    created_at: new Date().toISOString()
  }
];

export const tasksApi = {
  async getTasks(assignedTo = 'all', status = 'all') {
    try {
      const params = new URLSearchParams();
      if (assignedTo && assignedTo !== 'all') params.append('assigned_to', assignedTo);
      if (status && status !== 'all') params.append('status', status);
      const qs = params.toString();
      const endpoint = qs ? `/tasks?${qs}` : '/tasks';

      const res = await apiFetch(endpoint);
      const list = res?.data?.tasks || res?.data || (Array.isArray(res) ? res : []);
      if (Array.isArray(list) && list.length > 0) {
        console.log(`%c📋 [DB FETCH] Loaded ${list.length} Tasks from Database:`, 'color: #0057B8; font-weight: bold; font-size: 12px;', list);
        return list;
      }
      throw new Error('No remote tasks returned');
    } catch (e) {
      console.warn('API error fetching tasks, using cached fallback:', e);
      const local = localStorage.getItem('libtrak_tasks');
      if (local) {
        try { return JSON.parse(local); } catch (_) {}
      }
      return DEFAULT_MOCK_TASKS;
    }
  },

  async createTask(taskData) {
    try {
      const res = await apiFetch('/tasks', {
        method: 'POST',
        body: JSON.stringify(taskData)
      });
      return res?.data || res;
    } catch (e) {
      console.warn('API error creating task, saving locally:', e);
      const newTask = {
        id: Date.now(),
        ...taskData,
        created_at: new Date().toISOString()
      };
      const local = localStorage.getItem('libtrak_tasks');
      const list = local ? JSON.parse(local) : DEFAULT_MOCK_TASKS;
      const updated = [newTask, ...list];
      localStorage.setItem('libtrak_tasks', JSON.stringify(updated));
      return newTask;
    }
  },

  async updateTask(id, updateData) {
    try {
      return await apiFetch(`/tasks/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updateData)
      });
    } catch (e) {
      console.warn('API error updating task, updating locally:', e);
      const local = localStorage.getItem('libtrak_tasks');
      const list = local ? JSON.parse(local) : DEFAULT_MOCK_TASKS;
      const updated = list.map(t => t.id === id ? { ...t, ...updateData, updated_at: new Date().toISOString() } : t);
      localStorage.setItem('libtrak_tasks', JSON.stringify(updated));
      return updated.find(t => t.id === id);
    }
  },

  async deleteTask(id) {
    try {
      return await apiFetch(`/tasks/${id}`, {
        method: 'DELETE'
      });
    } catch (e) {
      console.warn('API error deleting task, removing locally:', e);
      const local = localStorage.getItem('libtrak_tasks');
      const list = local ? JSON.parse(local) : DEFAULT_MOCK_TASKS;
      const updated = list.filter(t => t.id !== id);
      localStorage.setItem('libtrak_tasks', JSON.stringify(updated));
      return { success: true };
    }
  }
};
