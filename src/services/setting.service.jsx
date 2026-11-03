import { apiFetch } from './auth.service';

/**
 * ====================================================
 * THEME & BUTTON SETTINGS APIS
 * ====================================================
 */

export const getUserSettingsApi = async () => {
    const response = await apiFetch('/settings');
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch user settings');
    }
    return data.data;
};

export const updateUserSettingsApi = async ({ theme, button_color }) => {
    const response = await apiFetch('/settings', {
        method: 'PUT',
        body: JSON.stringify({ theme, button_color })
    });
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || 'Failed to update user settings');
    }
    return data.data;
};

 
//ROLE BASED ACCESS CONTROL (RBAC) APIS 
// Fetch all roles
export const fetchRolesApi = async () => {
    const response = await apiFetch('/roles');
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch roles');
    }
    return data.data || [];
};

// Fetch single role with its permissions
export const fetchRoleByIdApi = async (id) => {
    const response = await apiFetch(`/roles/${id}`);
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch role details');
    }
    return data.data;
};

// Create a new role
export const createRoleApi = async ({ role_name, description, is_active = true }) => {
    const response = await apiFetch('/roles', {
        method: 'POST',
        body: JSON.stringify({ role_name, description, is_active })
    });
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || 'Failed to create role');
    }
    return data.data;
};

// Update an existing role
export const updateRoleApi = async (id, { role_name, description, is_active }) => {
    const response = await apiFetch(`/roles/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ role_name, description, is_active })
    });
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || 'Failed to update role');
    }
    return data.data;
};

// Delete a role
export const deleteRoleApi = async (id) => {
    const response = await apiFetch(`/roles/${id}`, {
        method: 'DELETE'
    });
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || 'Failed to delete role');
    }
    return data;
};

// Fetch permissions assigned to a role
export const fetchRolePermissionsApi = async (roleId) => {
    const response = await apiFetch(`/roles/${roleId}/permissions`);
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch role permissions');
    }
    return data.data || [];
};

// Assign/sync permissions to a role
export const assignRolePermissionsApi = async (roleId, permissions) => {
    const response = await apiFetch(`/roles/${roleId}/permissions`, {
        method: 'POST',
        body: JSON.stringify({ permissions })
    });
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || 'Failed to assign role permissions');
    }
    return data.data;
};

// Fetch full permission matrix
export const fetchPermissionMatrixApi = async () => {
    const response = await apiFetch('/roles/permissions-matrix');
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch permission matrix');
    }
    return data.data || {};
};

// Fetch modules
export const fetchModulesApi = async () => {
    const response = await apiFetch('/roles/modules');
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch modules');
    }
    return data.data || [];
};

// Fetch operations
export const fetchOperationsApi = async () => {
    const response = await apiFetch('/roles/operations');
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch operations');
    }
    return data.data || [];
};

/**
 * ====================================================
 * USER MANAGEMENT & ROLES APIS (CRUD)
 * ====================================================
 */

// Fetch users with their assigned roles
export const fetchUsersWithRolesApi = async ({ page = 1, limit = 50 } = {}) => {
    const response = await apiFetch(`/users?page=${page}&limit=${limit}`);
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch users');
    }
    return data.data || [];
};

// Fetch single user by ID
export const getUserByIdApi = async (userId) => {
    const response = await apiFetch(`/users/${userId}`);
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch user details');
    }
    return data.data;
};

// Create new user (with optional initial roleIds)
export const createUserApi = async ({ name, email, password, is_active = true, roleIds = [] }) => {
    const response = await apiFetch('/users', {
        method: 'POST',
        body: JSON.stringify({ name, email, password, is_active, roleIds })
    });
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || 'Failed to create user');
    }
    return data.data;
};

// Update user details, active status, optional new password, and roleIds
export const updateUserApi = async (userId, { name, email, password, is_active, roleIds }) => {
    const response = await apiFetch(`/users/${userId}`, {
        method: 'PUT',
        body: JSON.stringify({ name, email, password, is_active, roleIds })
    });
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || 'Failed to update user');
    }
    return data.data;
};

// Delete user
export const deleteUserApi = async (userId) => {
    const response = await apiFetch(`/users/${userId}`, {
        method: 'DELETE'
    });
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || 'Failed to delete user');
    }
    return data;
};

// Fetch roles for a specific user
export const getUserRolesApi = async (userId) => {
    const response = await apiFetch(`/users/${userId}/roles`);
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch user roles');
    }
    return data.data;
};

// Assign roles to a user
export const assignUserRolesApi = async (userId, roleIds) => {
    const response = await apiFetch(`/users/${userId}/roles`, {
        method: 'POST',
        body: JSON.stringify({ roleIds })
    });
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || 'Failed to assign user roles');
    }
    return data.data;
};
