import { apiFetch } from './auth.service';
 
export const fetchDashboardOverview = async ({ department_id = 'all', time_range = '30d' } = {}) => {
    const params = new URLSearchParams();
    if (department_id && department_id !== 'all') {
        params.append('department_id', department_id);
    }
    if (time_range) {
        params.append('time_range', time_range);
    }

    const queryStr = params.toString() ? `?${params.toString()}` : '';
    const response = await apiFetch(`/dashboard/overview${queryStr}`);
    const result = await response.json();

    if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to fetch dashboard overview');
    }

    return result.data;
};

export const fetchMakerCheckerAnalytics = async (department_id) => {
    const query = department_id && department_id !== 'all' ? `?department_id=${department_id}` : '';
    const response = await apiFetch(`/dashboard/maker-checker${query}`);
    const result = await response.json();

    if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to fetch maker-checker analytics');
    }

    return result.data;
};

export const fetchActivityTimeline = async (days = 14) => {
    const response = await apiFetch(`/dashboard/activity-timeline?days=${days}`);
    const result = await response.json();

    if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to fetch activity timeline');
    }

    return result.data;
};
