import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
    fetchRolesApi,
    createRoleApi,
    updateRoleApi,
    deleteRoleApi
} from '../../services/setting.service';
import {
    Shield,
    Plus,
    Search,
    Edit3,
    Trash2,
    Users,
    KeyRound,
    CheckCircle,
    XCircle,
    X,
    AlertCircle,
    RefreshCw
} from 'lucide-react';

export default function RoleManagement({ onSelectRoleForPermissions }) {
    const { hasPermission } = useAuth();
    const canReadRoles = hasPermission('roles', 'read');
    const canCreateRole = hasPermission('roles', 'create');
    const canUpdateRole = hasPermission('roles', 'update');
    const canDeleteRole = hasPermission('roles', 'delete');

    if (!canReadRoles) {
        return null;
    }

    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    // Modal States
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [currentRole, setCurrentRole] = useState(null);

    // Form States
    const [formData, setFormData] = useState({
        role_name: '',
        description: '',
        is_active: true
    });
    const [formLoading, setFormLoading] = useState(false);
    const [formError, setFormError] = useState(null);
    const [deleteConfirmId, setDeleteConfirmId] = useState(null);

    const loadRoles = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await fetchRolesApi();
            setRoles(data);
        } catch (err) {
            setError(err.message || 'Failed to load roles');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (canReadRoles) {
            loadRoles();
        }
    }, [canReadRoles]);

    const handleOpenCreate = () => {
        setFormData({ role_name: '', description: '', is_active: true });
        setFormError(null);
        setIsCreateOpen(true);
    };

    const handleOpenEdit = (role) => {
        setCurrentRole(role);
        setFormData({
            role_name: role.role_name,
            description: role.description || '',
            is_active: role.is_active
        });
        setFormError(null);
        setIsEditOpen(true);
    };

    const handleCreateSubmit = async (e) => {
        e.preventDefault();
        if (!formData.role_name.trim()) {
            setFormError('Role name is required');
            return;
        }

        setFormLoading(true);
        setFormError(null);
        try {
            await createRoleApi({
                role_name: formData.role_name.trim(),
                description: formData.description.trim(),
                is_active: formData.is_active
            });
            setIsCreateOpen(false);
            loadRoles();
        } catch (err) {
            setFormError(err.message || 'Error creating role');
        } finally {
            setFormLoading(false);
        }
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        if (!formData.role_name.trim()) {
            setFormError('Role name is required');
            return;
        }

        setFormLoading(true);
        setFormError(null);
        try {
            await updateRoleApi(currentRole.id, {
                role_name: formData.role_name.trim(),
                description: formData.description.trim(),
                is_active: formData.is_active
            });
            setIsEditOpen(false);
            loadRoles();
        } catch (err) {
            setFormError(err.message || 'Error updating role');
        } finally {
            setFormLoading(false);
        }
    };

    const handleDeleteRole = async (id) => {
        try {
            await deleteRoleApi(id);
            setDeleteConfirmId(null);
            loadRoles();
        } catch (err) {
            alert(err.message || 'Failed to delete role');
        }
    };

    const filteredRoles = roles.filter(r =>
        r.role_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.description && r.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <div className="setting-subtab-container">
            {/* Header & Controls */}
            <div className="setting-section-header">
                <div>
                    <h3 className="setting-section-title">Roles Management</h3>
                    <p className="setting-section-desc">
                        Define roles and their privileges. Roles can be assigned to users to regulate access across modules.
                    </p>
                </div>
                <div className="setting-header-actions">
                    <button
                        className="btn btn-secondary btn-sm"
                        onClick={loadRoles}
                        disabled={loading}
                        title="Refresh Roles"
                    >
                        <RefreshCw size={13} className={loading ? 'spin' : ''} /> Refresh
                    </button>
                    {canCreateRole && (
                        <button className="btn btn-primary btn-sm" onClick={handleOpenCreate}>
                            <Plus size={14} /> Create Role
                        </button>
                    )}
                </div>
            </div>

            {/* Filter Bar */}
            <div className="setting-filter-bar">
                <div className="setting-search-box">
                    <Search size={15} className="search-icon" />
                    <input
                        type="text"
                        placeholder="Search roles by name or description..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="setting-search-input"
                    />
                    {searchQuery && (
                        <button className="clear-search-btn" onClick={() => setSearchQuery('')}>
                            <X size={13} />
                        </button>
                    )}
                </div>
                <div className="roles-count-label">
                    Showing <strong>{filteredRoles.length}</strong> of {roles.length} roles
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="setting-alert-error">
                    <AlertCircle size={16} />
                    <span>{error}</span>
                </div>
            )}

            {/* Roles Table */}
            <div className="setting-table-container">
                <table className="setting-data-table">
                    <thead>
                        <tr>
                            <th>Role Details</th>
                            <th>Status</th>
                            <th>Assigned Users</th>
                            <th>Active Permissions</th>
                            <th className="text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={5} className="table-empty-row">
                                    <div className="loading-spinner-row">
                                        <RefreshCw size={18} className="spin" />
                                        <span>Loading roles from database...</span>
                                    </div>
                                </td>
                            </tr>
                        ) : filteredRoles.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="table-empty-row">
                                    <Shield size={32} className="empty-icon" />
                                    <p>No roles found matching your search.</p>
                                </td>
                            </tr>
                        ) : (
                            filteredRoles.map((role) => {
                                const isSuperAdmin =
                                    role.role_name.toLowerCase() === 'super admin' ||
                                    role.role_name.toLowerCase() === 'super_admin';

                                return (
                                    <tr key={role.id}>
                                        <td>
                                            <div className="role-cell-title">
                                                <div className="role-icon-box">
                                                    <Shield size={16} className="role-badge-icon" />
                                                </div>
                                                <div>
                                                    <div className="role-title-row">
                                                        <span className="role-name-text">{role.role_name}</span>
                                                        {isSuperAdmin && (
                                                            <span className="system-pill">System Role</span>
                                                        )}
                                                    </div>
                                                    <p className="role-desc-text">
                                                        {role.description || 'No description provided.'}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            {role.is_active ? (
                                                <span className="status-pill active">
                                                    <CheckCircle size={12} /> Active
                                                </span>
                                            ) : (
                                                <span className="status-pill inactive">
                                                    <XCircle size={12} /> Inactive
                                                </span>
                                            )}
                                        </td>
                                        <td>
                                            <div className="badge-metric">
                                                <Users size={13} />
                                                <span>{role.user_count ?? 0} Users</span>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="badge-metric">
                                                <KeyRound size={13} />
                                                <span>{role.permission_count ?? 0} Permissions</span>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="table-actions-cell">
                                                <button
                                                    className="btn-icon"
                                                    title="Configure Permissions"
                                                    onClick={() => onSelectRoleForPermissions && onSelectRoleForPermissions(role.id)}
                                                >
                                                    <KeyRound size={14} />
                                                </button>

                                                {canUpdateRole && (
                                                    <button
                                                        className="btn-icon"
                                                        title="Edit Role"
                                                        onClick={() => handleOpenEdit(role)}
                                                    >
                                                        <Edit3 size={14} />
                                                    </button>
                                                )}

                                                {!isSuperAdmin && canDeleteRole && (
                                                    deleteConfirmId === role.id ? (
                                                        <div className="inline-delete-confirm">
                                                            <button
                                                                className="btn btn-danger btn-xs"
                                                                onClick={() => handleDeleteRole(role.id)}
                                                            >
                                                                Confirm
                                                            </button>
                                                            <button
                                                                className="btn btn-secondary btn-xs"
                                                                onClick={() => setDeleteConfirmId(null)}
                                                            >
                                                                Cancel
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <button
                                                            className="btn-icon text-danger"
                                                            title="Delete Role"
                                                            onClick={() => setDeleteConfirmId(role.id)}
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    )
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Create Role Modal */}
            {isCreateOpen && (
                <div className="modal-overlay" onClick={() => setIsCreateOpen(false)}>
                    <div className="modal-card" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h4>Create New Role</h4>
                            <button className="modal-close-btn" onClick={() => setIsCreateOpen(false)}>
                                <X size={16} />
                            </button>
                        </div>
                        <form onSubmit={handleCreateSubmit}>
                            <div className="modal-body">
                                {formError && (
                                    <div className="setting-alert-error mb-3">
                                        <AlertCircle size={14} />
                                        <span>{formError}</span>
                                    </div>
                                )}
                                <div className="form-group">
                                    <label className="form-label">Role Name *</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Branch Auditor, Content Manager"
                                        className="form-input"
                                        value={formData.role_name}
                                        onChange={(e) => setFormData({ ...formData, role_name: e.target.value })}
                                        required
                                        autoFocus
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Description</label>
                                    <textarea
                                        placeholder="Describe the duties or restrictions associated with this role..."
                                        className="form-textarea"
                                        rows={3}
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    />
                                </div>
                                <div className="form-checkbox-row">
                                    <label className="checkbox-label">
                                        <input
                                            type="checkbox"
                                            checked={formData.is_active}
                                            onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                        />
                                        <span>Role is Active</span>
                                    </label>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => setIsCreateOpen(false)}
                                    disabled={formLoading}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={formLoading}
                                >
                                    {formLoading ? 'Creating...' : 'Create Role'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Role Modal */}
            {isEditOpen && (
                <div className="modal-overlay" onClick={() => setIsEditOpen(false)}>
                    <div className="modal-card" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h4>Edit Role: {currentRole?.role_name}</h4>
                            <button className="modal-close-btn" onClick={() => setIsEditOpen(false)}>
                                <X size={16} />
                            </button>
                        </div>
                        <form onSubmit={handleEditSubmit}>
                            <div className="modal-body">
                                {formError && (
                                    <div className="setting-alert-error mb-3">
                                        <AlertCircle size={14} />
                                        <span>{formError}</span>
                                    </div>
                                )}
                                <div className="form-group">
                                    <label className="form-label">Role Name *</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={formData.role_name}
                                        onChange={(e) => setFormData({ ...formData, role_name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Description</label>
                                    <textarea
                                        className="form-textarea"
                                        rows={3}
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    />
                                </div>
                                <div className="form-checkbox-row">
                                    <label className="checkbox-label">
                                        <input
                                            type="checkbox"
                                            checked={formData.is_active}
                                            onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                        />
                                        <span>Role is Active</span>
                                    </label>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => setIsEditOpen(false)}
                                    disabled={formLoading}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={formLoading}
                                >
                                    {formLoading ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
