import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
    fetchUsersWithRolesApi,
    fetchRolesApi,
    createUserApi,
    updateUserApi,
    deleteUserApi,
    assignUserRolesApi
} from '../../services/setting.service';
import {
    Users,
    Search,
    Shield,
    CheckCircle,
    XCircle,
    X,
    Check,
    AlertCircle,
    RefreshCw,
    UserCheck,
    Plus,
    Edit3,
    Trash2,
    Lock,
    Mail,
    User as UserIcon,
    Calendar,
    Crown
} from 'lucide-react';

export default function UserManagement() {
    const { user: currentUser, hasPermission } = useAuth();
    const canReadUsers = hasPermission('users', 'read');
    const canCreateUser = hasPermission('users', 'create');
    const canUpdateUser = hasPermission('users', 'update');
    const canDeleteUser = hasPermission('users', 'delete');
    const canReadRoles = hasPermission('roles', 'read');
    const canManageRoles = hasPermission('roles', 'update') || hasPermission('userrole', 'update');

    if (!canReadUsers) {
        return null;
    }

    // Data states
    const [users, setUsers] = useState([]);
    const [allRoles, setAllRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [successNotice, setSuccessNotice] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    // Create User Modal
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [createForm, setCreateForm] = useState({
        name: '',
        email: '',
        password: '',
        is_active: true,
        roleIds: []
    });
    const [createLoading, setCreateLoading] = useState(false);
    const [createError, setCreateError] = useState(null);

    // Edit User Modal
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [editForm, setEditForm] = useState({
        name: '',
        email: '',
        password: '',
        is_active: true,
        roleIds: []
    });
    const [editLoading, setEditLoading] = useState(false);
    const [editError, setEditError] = useState(null);

    // Quick Assign Roles Modal
    const [isAssignOpen, setIsAssignOpen] = useState(false);
    const [assigningUser, setAssigningUser] = useState(null);
    const [assignRoleIds, setAssignRoleIds] = useState([]);
    const [assignLoading, setAssignLoading] = useState(false);
    const [assignError, setAssignError] = useState(null);

    // Delete User Modal
    const [deleteUserTarget, setDeleteUserTarget] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [deleteError, setDeleteError] = useState(null);

    // Fetch users and roles from database
    const loadData = async () => {
        setLoading(true);
        setError(null);
        try {
            const usersPromise = fetchUsersWithRolesApi();
            const rolesPromise = canReadRoles
                ? fetchRolesApi().catch(() => [])
                : Promise.resolve([]);

            const [usersData, rolesData] = await Promise.all([
                usersPromise,
                rolesPromise
            ]);
            setUsers(usersData || []);
            setAllRoles(rolesData || []);
        } catch (err) {
            setError(err.message || 'Failed to load user and role assignments');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (canReadUsers) {
            loadData();
        }
    }, [canReadUsers]);

    const showSuccess = (msg) => {
        setSuccessNotice(msg);
        setTimeout(() => setSuccessNotice(null), 4000);
    };

    // ── CREATE USER HANDLERS ──
    const handleOpenCreate = () => {
        setCreateForm({
            name: '',
            email: '',
            password: '',
            is_active: true,
            roleIds: []
        });
        setCreateError(null);
        setIsCreateOpen(true);
    };

    const handleToggleCreateRole = (roleId) => {
        setCreateForm((prev) => {
            const exists = prev.roleIds.includes(roleId);
            return {
                ...prev,
                roleIds: exists
                    ? prev.roleIds.filter(id => id !== roleId)
                    : [...prev.roleIds, roleId]
            };
        });
    };

    const handleCreateSubmit = async (e) => {
        e.preventDefault();
        if (!createForm.name.trim()) {
            setCreateError('Full name is required');
            return;
        }
        if (!createForm.email.trim()) {
            setCreateError('Email address is required');
            return;
        }
        if (!createForm.password || createForm.password.length < 6) {
            setCreateError('Password must contain at least 6 characters');
            return;
        }

        setCreateLoading(true);
        setCreateError(null);
        try {
            await createUserApi({
                name: createForm.name.trim(),
                email: createForm.email.trim().toLowerCase(),
                password: createForm.password,
                is_active: createForm.is_active,
                roleIds: createForm.roleIds
            });
            setIsCreateOpen(false);
            showSuccess(`User "${createForm.name}" created successfully`);
            loadData();
        } catch (err) {
            setCreateError(err.message || 'Failed to create user');
        } finally {
            setCreateLoading(false);
        }
    };

    // ── EDIT USER HANDLERS ──
    const handleOpenEdit = (user) => {
        setEditingUser(user);
        setEditForm({
            name: user.name || '',
            email: user.email || '',
            password: '',
            is_active: user.is_active !== false,
            roleIds: (user.roles || []).map(r => r.id)
        });
        setEditError(null);
        setIsEditOpen(true);
    };

    const handleToggleEditRole = (roleId) => {
        setEditForm((prev) => {
            const exists = prev.roleIds.includes(roleId);
            return {
                ...prev,
                roleIds: exists
                    ? prev.roleIds.filter(id => id !== roleId)
                    : [...prev.roleIds, roleId]
            };
        });
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        if (!editForm.name.trim()) {
            setEditError('Full name is required');
            return;
        }
        if (!editForm.email.trim()) {
            setEditError('Email address is required');
            return;
        }
        if (editForm.password && editForm.password.trim().length > 0 && editForm.password.trim().length < 6) {
            setEditError('New password must contain at least 6 characters');
            return;
        }

        setEditLoading(true);
        setEditError(null);
        try {
            await updateUserApi(editingUser.id, {
                name: editForm.name.trim(),
                email: editForm.email.trim().toLowerCase(),
                password: editForm.password.trim() ? editForm.password.trim() : undefined,
                is_active: editForm.is_active,
                roleIds: editForm.roleIds
            });
            setIsEditOpen(false);
            showSuccess(`User "${editForm.name}" updated successfully`);
            loadData();
        } catch (err) {
            setEditError(err.message || 'Failed to update user');
        } finally {
            setEditLoading(false);
        }
    };

    // ── QUICK ASSIGN ROLES HANDLERS ──
    const handleOpenAssign = (user) => {
        setAssigningUser(user);
        setAssignRoleIds((user.roles || []).map(r => r.id));
        setAssignError(null);
        setIsAssignOpen(true);
    };

    const handleToggleAssignRole = (roleId) => {
        setAssignRoleIds((prev) =>
            prev.includes(roleId) ? prev.filter(id => id !== roleId) : [...prev, roleId]
        );
    };

    const handleAssignSubmit = async (e) => {
        e.preventDefault();
        if (!assigningUser) return;

        setAssignLoading(true);
        setAssignError(null);
        try {
            await assignUserRolesApi(assigningUser.id, assignRoleIds);
            setIsAssignOpen(false);
            showSuccess(`Roles updated for ${assigningUser.name}`);
            loadData();
        } catch (err) {
            setAssignError(err.message || 'Failed to assign roles');
        } finally {
            setAssignLoading(false);
        }
    };

    // ── DELETE USER HANDLERS ──
    const handleOpenDelete = (user) => {
        setDeleteUserTarget(user);
        setDeleteError(null);
    };

    const handleDeleteSubmit = async () => {
        if (!deleteUserTarget) return;

        setDeleteLoading(true);
        setDeleteError(null);
        try {
            await deleteUserApi(deleteUserTarget.id);
            const deletedName = deleteUserTarget.name;
            setDeleteUserTarget(null);
            showSuccess(`User "${deletedName}" deleted successfully`);
            loadData();
        } catch (err) {
            setDeleteError(err.message || 'Failed to delete user');
        } finally {
            setDeleteLoading(false);
        }
    };

    // Search filter
    const filteredUsers = users.filter((u) => {
        const query = searchQuery.toLowerCase();
        return (
            (u.name && u.name.toLowerCase().includes(query)) ||
            (u.email && u.email.toLowerCase().includes(query)) ||
            (u.roles && u.roles.some(r => r.role_name.toLowerCase().includes(query)))
        );
    });

    return (
        <div className="setting-subtab-container">
            {/* Header */}
            <div className="setting-section-header">
                <div>
                    <h3 className="setting-section-title">User Management & Role Assignment</h3>
                    <p className="setting-section-desc">
                        Create, update, manage user accounts and configure role-based access permissions.
                    </p>
                </div>
                <div className="setting-header-actions">
                    <button
                        className="btn btn-secondary btn-sm"
                        onClick={loadData}
                        disabled={loading}
                    >
                        <RefreshCw size={13} className={loading ? 'spin' : ''} /> Refresh
                    </button>
                    {canCreateUser && (
                        <button
                            className="btn btn-primary btn-sm"
                            onClick={handleOpenCreate}
                        >
                            <Plus size={14} /> Add User
                        </button>
                    )}
                </div>
            </div>

            {/* Notifications */}
            {successNotice && (
                <div className="setting-alert-success">
                    <Check size={16} />
                    <span>{successNotice}</span>
                </div>
            )}
            {error && (
                <div className="setting-alert-error">
                    <AlertCircle size={16} />
                    <span>{error}</span>
                </div>
            )}

            {/* Filter Bar */}
            <div className="setting-filter-bar">
                <div className="setting-search-box">
                    <Search size={15} className="search-icon" />
                    <input
                        type="text"
                        placeholder="Search users by name, email, or assigned role..."
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
                    Showing <strong>{filteredUsers.length}</strong> of {users.length} users
                </div>
            </div>

            {/* Users Table */}
            <div className="setting-table-container">
                <table className="setting-data-table">
                    <thead>
                        <tr>
                            <th>User Profile</th>
                            <th>Status</th>
                            <th>Assigned Roles</th>
                            <th>Created Date</th>
                            <th className="text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={5} className="table-empty-row">
                                    <div className="loading-spinner-row">
                                        <RefreshCw size={18} className="spin" />
                                        <span>Loading users from database...</span>
                                    </div>
                                </td>
                            </tr>
                        ) : filteredUsers.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="table-empty-row">
                                    <Users size={32} className="empty-icon" />
                                    <p>No users found matching your search.</p>
                                </td>
                            </tr>
                        ) : (
                            filteredUsers.map((user) => {
                                const initials = user.name
                                    ? user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
                                    : 'U';
                                const isDefaultSuperAdmin = user.email?.toLowerCase() === 'settlo@gmail.com';
                                const isSelf = currentUser && currentUser.id === user.id;

                                const formattedDate = user.created_at
                                    ? new Date(user.created_at).toLocaleDateString('en-US', {
                                          month: 'short',
                                          day: 'numeric',
                                          year: 'numeric'
                                      })
                                    : '—';

                                return (
                                    <tr key={user.id}>
                                        <td>
                                            <div className="user-profile-cell">
                                                <div className="user-avatar-sm">{initials}</div>
                                                <div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                        <span className="user-name-title">{user.name}</span>
                                                        {isDefaultSuperAdmin && (
                                                            <span
                                                                className="system-pill"
                                                                style={{
                                                                    display: 'inline-flex',
                                                                    alignItems: 'center',
                                                                    gap: '3px',
                                                                    background: '#fef3c7',
                                                                    color: '#92400e',
                                                                    border: '1px solid #fde68a'
                                                                }}
                                                            >
                                                                <Crown size={11} /> Root Admin
                                                            </span>
                                                        )}
                                                        {isSelf && (
                                                            <span className="system-pill">You</span>
                                                        )}
                                                    </div>
                                                    <span className="user-email-sub">{user.email}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            {user.is_active ? (
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
                                            <div className="role-chips-wrap">
                                                {user.roles && user.roles.length > 0 ? (
                                                    user.roles.map((r) => (
                                                        <span key={r.id} className="role-chip">
                                                            <Shield size={11} />
                                                            <span>{r.role_name}</span>
                                                        </span>
                                                    ))
                                                ) : (
                                                    <span className="no-role-text">No roles assigned</span>
                                                )}
                                            </div>
                                        </td>
                                        <td>
                                            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                                                {formattedDate}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="table-actions-cell">
                                                {canManageRoles && (
                                                    <button
                                                        className="btn btn-secondary btn-xs"
                                                        onClick={() => handleOpenAssign(user)}
                                                        title="Assign Roles"
                                                    >
                                                        <UserCheck size={13} />
                                                        <span>Roles</span>
                                                    </button>
                                                )}
                                                {canUpdateUser && (
                                                    <button
                                                        className="btn-icon"
                                                        onClick={() => handleOpenEdit(user)}
                                                        title="Edit User Details"
                                                    >
                                                        <Edit3 size={15} />
                                                    </button>
                                                )}
                                                {canDeleteUser && (
                                                    <button
                                                        className="btn-icon"
                                                        onClick={() => handleOpenDelete(user)}
                                                        disabled={isDefaultSuperAdmin || isSelf}
                                                        title={
                                                            isDefaultSuperAdmin
                                                                ? 'Default Super Admin cannot be deleted'
                                                                : isSelf
                                                                ? 'Cannot delete your own account'
                                                                : 'Delete User'
                                                        }
                                                        style={{
                                                            color: isDefaultSuperAdmin || isSelf ? 'var(--text-muted)' : '#ef4444',
                                                            opacity: isDefaultSuperAdmin || isSelf ? 0.4 : 1,
                                                            cursor: isDefaultSuperAdmin || isSelf ? 'not-allowed' : 'pointer'
                                                        }}
                                                    >
                                                        <Trash2 size={15} />
                                                    </button>
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

            {/* ── CREATE USER MODAL ── */}
            {isCreateOpen && (
                <div className="modal-overlay" onClick={() => setIsCreateOpen(false)}>
                    <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '540px' }}>
                        <div className="modal-header">
                            <div>
                                <h4>Add New User</h4>
                                <p className="modal-subtitle">Create a user account and assign platform roles</p>
                            </div>
                            <button className="modal-close-btn" onClick={() => setIsCreateOpen(false)}>
                                <X size={16} />
                            </button>
                        </div>
                        <form onSubmit={handleCreateSubmit}>
                            <div className="modal-body">
                                {createError && (
                                    <div className="setting-alert-error mb-3">
                                        <AlertCircle size={14} />
                                        <span>{createError}</span>
                                    </div>
                                )}

                                <div className="form-group">
                                    <label className="form-label">Full Name *</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="e.g. John Doe"
                                        value={createForm.name}
                                        onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Email Address *</label>
                                    <input
                                        type="email"
                                        className="form-input"
                                        placeholder="e.g. user@company.com"
                                        value={createForm.email}
                                        onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Password *</label>
                                    <input
                                        type="password"
                                        className="form-input"
                                        placeholder="Minimum 6 characters"
                                        value={createForm.password}
                                        onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px' }}>
                                        <input
                                            type="checkbox"
                                            checked={createForm.is_active}
                                            onChange={(e) => setCreateForm({ ...createForm, is_active: e.target.checked })}
                                        />
                                        <span>Active Account (User can log in)</span>
                                    </label>
                                </div>

                                {canReadRoles && allRoles.length > 0 && (
                                    <div className="form-group" style={{ marginTop: '6px' }}>
                                        <label className="form-label">Assign Initial Roles</label>
                                        <div className="roles-checklist-grid" style={{ maxHeight: '180px', overflowY: 'auto' }}>
                                            {allRoles.map((role) => {
                                                const isChecked = createForm.roleIds.includes(role.id);
                                                return (
                                                    <div
                                                        key={role.id}
                                                        className={`role-check-card ${isChecked ? 'selected' : ''}`}
                                                        onClick={() => handleToggleCreateRole(role.id)}
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={isChecked}
                                                            onChange={() => handleToggleCreateRole(role.id)}
                                                            className="role-native-checkbox"
                                                            onClick={(e) => e.stopPropagation()}
                                                        />
                                                        <div className="role-card-text">
                                                            <span className="role-card-name">{role.role_name}</span>
                                                            <span className="role-card-desc">{role.description || 'No description'}</span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => setIsCreateOpen(false)}
                                    disabled={createLoading}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={createLoading}
                                >
                                    {createLoading ? 'Creating User...' : 'Create User'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── EDIT USER MODAL ── */}
            {isEditOpen && editingUser && (
                <div className="modal-overlay" onClick={() => setIsEditOpen(false)}>
                    <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '540px' }}>
                        <div className="modal-header">
                            <div>
                                <h4>Edit User Details</h4>
                                <p className="modal-subtitle">Update profile information, password, and roles for <strong>{editingUser.name}</strong></p>
                            </div>
                            <button className="modal-close-btn" onClick={() => setIsEditOpen(false)}>
                                <X size={16} />
                            </button>
                        </div>
                        <form onSubmit={handleEditSubmit}>
                            <div className="modal-body">
                                {editError && (
                                    <div className="setting-alert-error mb-3">
                                        <AlertCircle size={14} />
                                        <span>{editError}</span>
                                    </div>
                                )}

                                <div className="form-group">
                                    <label className="form-label">Full Name *</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={editForm.name}
                                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Email Address *</label>
                                    <input
                                        type="email"
                                        className="form-input"
                                        value={editForm.email}
                                        onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                                        disabled={editingUser.email?.toLowerCase() === 'settlo@gmail.com'}
                                        required
                                    />
                                    {editingUser.email?.toLowerCase() === 'settlo@gmail.com' && (
                                        <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                                            Primary Super Admin email cannot be modified.
                                        </span>
                                    )}
                                </div>

                                <div className="form-group">
                                    <label className="form-label">New Password (optional)</label>
                                    <input
                                        type="password"
                                        className="form-input"
                                        placeholder="Leave blank to keep current password"
                                        value={editForm.password}
                                        onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px' }}>
                                        <input
                                            type="checkbox"
                                            checked={editForm.is_active}
                                            disabled={editingUser.email?.toLowerCase() === 'settlo@gmail.com'}
                                            onChange={(e) => setEditForm({ ...editForm, is_active: e.target.checked })}
                                        />
                                        <span>Active Account (User can log in)</span>
                                    </label>
                                </div>

                                {canReadRoles && allRoles.length > 0 && (
                                    <div className="form-group" style={{ marginTop: '6px' }}>
                                        <label className="form-label">Assigned Roles</label>
                                        <div className="roles-checklist-grid" style={{ maxHeight: '180px', overflowY: 'auto' }}>
                                            {allRoles.map((role) => {
                                                const isChecked = editForm.roleIds.includes(role.id);
                                                return (
                                                    <div
                                                        key={role.id}
                                                        className={`role-check-card ${isChecked ? 'selected' : ''}`}
                                                        onClick={() => handleToggleEditRole(role.id)}
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={isChecked}
                                                            onChange={() => handleToggleEditRole(role.id)}
                                                            className="role-native-checkbox"
                                                            onClick={(e) => e.stopPropagation()}
                                                        />
                                                        <div className="role-card-text">
                                                            <span className="role-card-name">{role.role_name}</span>
                                                            <span className="role-card-desc">{role.description || 'No description'}</span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => setIsEditOpen(false)}
                                    disabled={editLoading}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={editLoading}
                                >
                                    {editLoading ? 'Saving Changes...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── QUICK ASSIGN ROLES MODAL ── */}
            {isAssignOpen && assigningUser && (
                <div className="modal-overlay" onClick={() => setIsAssignOpen(false)}>
                    <div className="modal-card" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <div>
                                <h4>Assign User Roles</h4>
                                <p className="modal-subtitle">Configure roles for <strong>{assigningUser.name}</strong> ({assigningUser.email})</p>
                            </div>
                            <button className="modal-close-btn" onClick={() => setIsAssignOpen(false)}>
                                <X size={16} />
                            </button>
                        </div>
                        <form onSubmit={handleAssignSubmit}>
                            <div className="modal-body">
                                {assignError && (
                                    <div className="setting-alert-error mb-3">
                                        <AlertCircle size={14} />
                                        <span>{assignError}</span>
                                    </div>
                                )}

                                <p className="form-sub-label">Select one or more roles to assign:</p>
                                <div className="roles-checklist-grid">
                                    {allRoles.map((role) => {
                                        const isChecked = assignRoleIds.includes(role.id);
                                        return (
                                            <div
                                                key={role.id}
                                                className={`role-check-card ${isChecked ? 'selected' : ''}`}
                                                onClick={() => handleToggleAssignRole(role.id)}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={isChecked}
                                                    onChange={() => handleToggleAssignRole(role.id)}
                                                    className="role-native-checkbox"
                                                    onClick={(e) => e.stopPropagation()}
                                                />
                                                <div className="role-card-text">
                                                    <span className="role-card-name">{role.role_name}</span>
                                                    <span className="role-card-desc">{role.description || 'No description'}</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => setIsAssignOpen(false)}
                                    disabled={assignLoading}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={assignLoading}
                                >
                                    {assignLoading ? 'Updating Roles...' : 'Update Roles'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── DELETE USER CONFIRMATION MODAL ── */}
            {deleteUserTarget && (
                <div className="modal-overlay" onClick={() => setDeleteUserTarget(null)}>
                    <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
                        <div className="modal-header">
                            <div>
                                <h4 style={{ color: '#ef4444' }}>Delete User Account</h4>
                                <p className="modal-subtitle">Permanent database removal confirmation</p>
                            </div>
                            <button className="modal-close-btn" onClick={() => setDeleteUserTarget(null)}>
                                <X size={16} />
                            </button>
                        </div>
                        <div className="modal-body">
                            {deleteError && (
                                <div className="setting-alert-error mb-3">
                                    <AlertCircle size={14} />
                                    <span>{deleteError}</span>
                                </div>
                            )}
                            <p style={{ fontSize: '13px', color: 'var(--text-primary)', margin: 0 }}>
                                Are you sure you want to permanently delete user{' '}
                                <strong>{deleteUserTarget.name}</strong> (<em>{deleteUserTarget.email}</em>)?
                            </p>
                            <div
                                style={{
                                    background: '#fef2f2',
                                    border: '1px solid #fecaca',
                                    borderRadius: '8px',
                                    padding: '10px 12px',
                                    fontSize: '12px',
                                    color: '#991b1b',
                                    display: 'flex',
                                    gap: '8px',
                                    alignItems: 'flex-start'
                                }}
                            >
                                <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                                <span>
                                    This action will permanently delete the user account, terminate all active sessions, and remove their assigned roles from the database. This action cannot be undone.
                                </span>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={() => setDeleteUserTarget(null)}
                                disabled={deleteLoading}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="btn btn-danger"
                                onClick={handleDeleteSubmit}
                                disabled={deleteLoading}
                                style={{
                                    backgroundColor: '#ef4444',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '6px',
                                    padding: '8px 16px',
                                    fontWeight: 600,
                                    cursor: 'pointer'
                                }}
                            >
                                {deleteLoading ? 'Deleting...' : 'Delete User'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
