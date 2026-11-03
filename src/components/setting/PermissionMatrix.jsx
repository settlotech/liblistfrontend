import { useState, useEffect } from 'react';
import {
    fetchPermissionMatrixApi,
    assignRolePermissionsApi
} from '../../services/setting.service';
import {
    KeyRound,
    Check,
    RefreshCw,
    Shield,
    AlertCircle,
    CheckSquare,
    Square
} from 'lucide-react';

export default function PermissionMatrix({ initialRoleId }) {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);

    const [roles, setRoles] = useState([]);
    const [modules, setModules] = useState([]);
    const [operations, setOperations] = useState([]);
    const [selectedRoleId, setSelectedRoleId] = useState(null);

    // Selected permissions for current role: Set of "moduleId_operationId"
    const [selectedPermissions, setSelectedPermissions] = useState(new Set());
    const [originalPermissions, setOriginalPermissions] = useState(new Set());

    const loadMatrix = async (targetRoleId) => {
        setLoading(true);
        setError(null);
        try {
            const data = await fetchPermissionMatrixApi();
            setRoles(data.roles || []);
            setModules(data.modules || []);
            setOperations(data.operations || []);

            // Determine active role
            const roleIdToUse = targetRoleId || (data.roles && data.roles[0]?.id);
            setSelectedRoleId(roleIdToUse);

            // Filter assignments for selected role
            if (roleIdToUse && data.assignments) {
                const initialSet = new Set();
                data.assignments.forEach(item => {
                    if (Number(item.role_id) === Number(roleIdToUse)) {
                        initialSet.add(`${item.module_id}_${item.operation_id}`);
                    }
                });
                setSelectedPermissions(new Set(initialSet));
                setOriginalPermissions(new Set(initialSet));
            }
        } catch (err) {
            setError(err.message || 'Failed to load permission matrix');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadMatrix(initialRoleId);
    }, [initialRoleId]);

    // When user changes role in dropdown
    const handleRoleChange = (newRoleId) => {
        const roleIdNum = Number(newRoleId);
        setSelectedRoleId(roleIdNum);
        loadMatrix(roleIdNum);
    };

    const togglePermission = (moduleId, operationId) => {
        const key = `${moduleId}_${operationId}`;
        const newSet = new Set(selectedPermissions);
        if (newSet.has(key)) {
            newSet.delete(key);
        } else {
            newSet.add(key);
        }
        setSelectedPermissions(newSet);
    };

    const toggleModuleAll = (moduleId) => {
        const newSet = new Set(selectedPermissions);
        const allModuleKeys = operations.map(op => `${moduleId}_${op.id}`);
        const allChecked = allModuleKeys.every(k => newSet.has(k));

        if (allChecked) {
            allModuleKeys.forEach(k => newSet.delete(k));
        } else {
            allModuleKeys.forEach(k => newSet.add(k));
        }
        setSelectedPermissions(newSet);
    };

    const handleSelectAll = () => {
        const newSet = new Set();
        modules.forEach(m => {
            operations.forEach(op => {
                newSet.add(`${m.id}_${op.id}`);
            });
        });
        setSelectedPermissions(newSet);
    };

    const handleClearAll = () => {
        setSelectedPermissions(new Set());
    };

    const handleReset = () => {
        setSelectedPermissions(new Set(originalPermissions));
    };

    const handleSavePermissions = async () => {
        if (!selectedRoleId) return;

        setSaving(true);
        setError(null);
        setSuccessMessage(null);

        try {
            // Transform Set of "moduleId_operationId" into [{ moduleId, operationId }]
            const permissionsList = Array.from(selectedPermissions).map(str => {
                const [moduleId, operationId] = str.split('_').map(Number);
                return { moduleId, operationId };
            });

            await assignRolePermissionsApi(selectedRoleId, permissionsList);
            setOriginalPermissions(new Set(selectedPermissions));
            setSuccessMessage('Permissions successfully updated and applied in real-time!');
            setTimeout(() => setSuccessMessage(null), 3500);
        } catch (err) {
            setError(err.message || 'Failed to save permissions');
        } finally {
            setSaving(false);
        }
    };

    const isDirty = () => {
        if (selectedPermissions.size !== originalPermissions.size) return true;
        for (const item of selectedPermissions) {
            if (!originalPermissions.has(item)) return true;
        }
        return false;
    };

    const currentRole = roles.find(r => r.id === selectedRoleId);
    const isSuperAdmin =
        currentRole?.role_name?.toLowerCase() === 'super admin' ||
        currentRole?.role_name?.toLowerCase() === 'super_admin';

    return (
        <div className="setting-subtab-container">
            {/* Header & Role Picker */}
            <div className="setting-section-header">
                <div>
                    <h3 className="setting-section-title">Role Permission Matrix</h3>
                    <p className="setting-section-desc">
                        Configure granular module and operation permissions for each role. Changes take effect across the backend dynamically.
                    </p>
                </div>
                <div className="setting-header-actions">
                    <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => loadMatrix(selectedRoleId)}
                        disabled={loading || saving}
                    >
                        <RefreshCw size={13} className={loading ? 'spin' : ''} /> Reload
                    </button>
                    <button
                        className="btn btn-primary btn-sm"
                        onClick={handleSavePermissions}
                        disabled={saving || !isDirty()}
                    >
                        {saving ? (
                            <>
                                <RefreshCw size={13} className="spin" /> Saving...
                            </>
                        ) : (
                            <>
                                <Check size={14} /> Save Permissions
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Notifications */}
            {successMessage && (
                <div className="setting-alert-success">
                    <Check size={16} />
                    <span>{successMessage}</span>
                </div>
            )}
            {error && (
                <div className="setting-alert-error">
                    <AlertCircle size={16} />
                    <span>{error}</span>
                </div>
            )}

            {/* Role Selector Card */}
            <div className="matrix-control-bar">
                <div className="role-selector-box">
                    <label className="selector-label">
                        <Shield size={14} /> Select Role to Configure:
                    </label>
                    <select
                        className="role-select-input"
                        value={selectedRoleId || ''}
                        onChange={(e) => handleRoleChange(e.target.value)}
                        disabled={loading || saving}
                    >
                        {roles.map((r) => (
                            <option key={r.id} value={r.id}>
                                {r.role_name} {r.is_active ? '' : '(Inactive)'}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="matrix-quick-actions">
                    <button
                        className="btn btn-secondary btn-xs"
                        onClick={handleSelectAll}
                        disabled={loading || isSuperAdmin}
                    >
                        Select All
                    </button>
                    <button
                        className="btn btn-secondary btn-xs"
                        onClick={handleClearAll}
                        disabled={loading || isSuperAdmin}
                    >
                        Clear All
                    </button>
                    {isDirty() && (
                        <button
                            className="btn btn-secondary btn-xs"
                            onClick={handleReset}
                            disabled={loading}
                        >
                            Reset
                        </button>
                    )}
                </div>
            </div>

            {isSuperAdmin && (
                <div className="superadmin-notice-banner">
                    <Shield size={16} />
                    <div>
                        <strong>Super Admin Role:</strong> Users with this role automatically bypass permission checks and have unrestricted access to all current and future modules.
                    </div>
                </div>
            )}

            {/* Grid Matrix Table */}
            <div className="setting-table-container matrix-table-wrapper">
                <table className="setting-data-table matrix-table">
                    <thead>
                        <tr>
                            <th className="matrix-module-col">System Modules</th>
                            <th className="matrix-toggle-col">Row Quick Toggle</th>
                            {operations.map((op) => (
                                <th key={op.id} className="matrix-op-col">
                                    <span className="op-title">{op.display_name}</span>
                                    <span className="op-code">{op.operation_name}</span>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={operations.length + 2} className="table-empty-row">
                                    <div className="loading-spinner-row">
                                        <RefreshCw size={18} className="spin" />
                                        <span>Loading permission matrix...</span>
                                    </div>
                                </td>
                            </tr>
                        ) : modules.length === 0 ? (
                            <tr>
                                <td colSpan={operations.length + 2} className="table-empty-row">
                                    <KeyRound size={28} className="empty-icon" />
                                    <p>No modules defined in database.</p>
                                </td>
                            </tr>
                        ) : (
                            modules.map((mod) => {
                                const allModuleChecked = operations.every(op =>
                                    selectedPermissions.has(`${mod.id}_${op.id}`)
                                );
                                const someModuleChecked = operations.some(op =>
                                    selectedPermissions.has(`${mod.id}_${op.id}`)
                                );

                                return (
                                    <tr key={mod.id}>
                                        <td className="matrix-module-cell">
                                            <div className="matrix-mod-info">
                                                <span className="matrix-mod-name">{mod.display_name}</span>
                                                <code className="matrix-mod-code">{mod.module_name}</code>
                                            </div>
                                        </td>
                                        <td className="matrix-toggle-cell">
                                            <button
                                                type="button"
                                                className="btn-toggle-all-row"
                                                onClick={() => toggleModuleAll(mod.id)}
                                                title={allModuleChecked ? 'Uncheck all for module' : 'Check all for module'}
                                            >
                                                {allModuleChecked ? (
                                                    <CheckSquare size={16} className="text-primary-color" />
                                                ) : someModuleChecked ? (
                                                    <div className="indeterminate-box" />
                                                ) : (
                                                    <Square size={16} className="text-muted" />
                                                )}
                                                <span>{allModuleChecked ? 'All' : 'Toggle'}</span>
                                            </button>
                                        </td>
                                        {operations.map((op) => {
                                            const isChecked = selectedPermissions.has(`${mod.id}_${op.id}`);
                                            return (
                                                <td
                                                    key={op.id}
                                                    className={`matrix-check-cell ${isChecked ? 'cell-checked' : ''}`}
                                                    onClick={() => togglePermission(mod.id, op.id)}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={isChecked}
                                                        onChange={() => togglePermission(mod.id, op.id)}
                                                        className="matrix-checkbox"
                                                        onClick={(e) => e.stopPropagation()}
                                                    />
                                                </td>
                                            );
                                        })}
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
