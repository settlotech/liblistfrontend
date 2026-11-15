import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    Shield,
    Users,
    FileText,
    CheckCircle2,
    Search,
    ChevronDown,
    Save,
    Lock,
    Eye,
    Edit2,
    AlertCircle,
    Loader2,
    X,
    Folder,
    Trash2,
} from 'lucide-react';
import { documentManagementApi } from '../../services/api/documentManagementApi';
import { fetchUsersWithRolesApi } from '../../services/setting.service';
import { useAuth } from '../../context/AuthContext';

// ─── Searchable User Dropdown ─────────────────────────────────────────────────
function UserSearchDropdown({ users, selectedUser, onSelect }) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const ref = useRef(null);

    // Close on outside click
    useEffect(() => {
        const handler = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const filtered = users.filter(u => {
        if (!query.trim()) return true;
        const q = query.toLowerCase();
        return (
            (u.name  || '').toLowerCase().includes(q) ||
            (u.email || '').toLowerCase().includes(q) ||
            (u.role_name || '').toLowerCase().includes(q)
        );
    });

    const displayLabel = selectedUser
        ? `${selectedUser.name || 'User'} — ${selectedUser.email || ''}`
        : 'Choose Bank Employee...';

    return (
        <div ref={ref} style={{ position: 'relative', minWidth: '340px' }}>
            <button
                type="button"
                style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    width: '100%', padding: '9px 14px',
                    background: '#fff', border: '1.5px solid #cbd5e1',
                    borderRadius: '8px', cursor: 'pointer',
                    fontSize: '13.5px', color: selectedUser ? '#0f172a' : '#94a3b8',
                    justifyContent: 'space-between',
                }}
                onClick={() => setOpen(o => !o)}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Users size={15} style={{ color: '#0057B8', flexShrink: 0 }} />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '260px' }}>
                        {displayLabel}
                    </span>
                </div>
                <ChevronDown size={14} style={{ flexShrink: 0, color: '#64748b', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }} />
            </button>

            {open && (
                <div style={{
                    position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 200,
                    background: '#fff', border: '1.5px solid #cbd5e1', borderRadius: '8px',
                    boxShadow: '0 8px 24px rgba(0,0,0,.12)', maxHeight: '280px', overflow: 'hidden',
                    display: 'flex', flexDirection: 'column',
                }}>
                    {/* Search inside dropdown */}
                    <div style={{ padding: '8px', borderBottom: '1px solid #f1f5f9', flexShrink: 0 }}>
                        <div style={{ position: 'relative' }}>
                            <Search size={13} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                            <input
                                autoFocus
                                type="text"
                                placeholder="Search by name, email or role..."
                                value={query}
                                onChange={e => setQuery(e.target.value)}
                                style={{
                                    width: '100%', padding: '7px 10px 7px 28px',
                                    border: '1px solid #e2e8f0', borderRadius: '6px',
                                    fontSize: '12.5px', outline: 'none', boxSizing: 'border-box',
                                }}
                            />
                        </div>
                    </div>

                    {/* User list */}
                    <div style={{ overflowY: 'auto', flex: 1 }}>
                        {filtered.length === 0 ? (
                            <div style={{ padding: '16px', textAlign: 'center', color: '#94a3b8', fontSize: '12.5px' }}>
                                No users found
                            </div>
                        ) : (
                            filtered.map(u => {
                                const roleName = u.role_name || (Array.isArray(u.roles) ? u.roles.map(r => r.role_name || r).join(', ') : 'User');
                                const isSelected = selectedUser?.id === u.id;
                                return (
                                    <div
                                        key={u.id}
                                        onClick={() => { onSelect(u); setOpen(false); setQuery(''); }}
                                        style={{
                                            padding: '10px 14px', cursor: 'pointer',
                                            background: isSelected ? '#eff6ff' : 'transparent',
                                            borderLeft: isSelected ? '3px solid #0057B8' : '3px solid transparent',
                                            display: 'flex', flexDirection: 'column', gap: '2px',
                                        }}
                                        onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = '#f8fafc'; }}
                                        onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
                                    >
                                        <div style={{ fontWeight: 600, fontSize: '13px', color: '#0f172a' }}>
                                            {u.name || 'Unnamed'}
                                            {isSelected && <CheckCircle2 size={12} style={{ color: '#0057B8', marginLeft: '6px', display: 'inline' }} />}
                                        </div>
                                        <div style={{ fontSize: '11.5px', color: '#64748b' }}>
                                            {u.email} · <span style={{ color: '#0057B8' }}>{roleName}</span>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Main PolicyAccessControl Component ───────────────────────────────────────
export default function PolicyAccessControl({ canUpdate = true, canCreate = true, isSuperAdmin = false }) {
    // If no explicit props passed (legacy), default to full access for backward compat
    const canEdit = canUpdate || canCreate || isSuperAdmin;    const [users, setUsers]               = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);

    // policyAccess: { [document_id]: { can_view, can_edit, can_delete } }
    const [policyAccess, setPolicyAccess] = useState({});
    // Raw policy list from backend for selected user
    const [policies, setPolicies]         = useState([]);

    const [isLoadingUsers, setIsLoadingUsers] = useState(true);
    const [isLoadingPolicies, setIsLoadingPolicies] = useState(false);
    const [isSaving, setIsSaving]         = useState(false);
    const [toast, setToast]               = useState(null);
    const [toastType, setToastType]       = useState('success'); // 'success' | 'error'
    const [policySearch, setPolicySearch] = useState('');

    // Load bank users on mount (exclude Super Admin since Super Admin has universal unrestricted access)
    useEffect(() => {
        setIsLoadingUsers(true);
        fetchUsersWithRolesApi({ limit: 100 })
            .then(res => {
                const list = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
                // Exclude Super Admin from policy-specific access list
                const filteredUsers = list.filter(u => {
                    const roleName = (u.role_name || (Array.isArray(u.roles) ? u.roles.map(r => r.role_name || r).join(', ') : '')).toLowerCase();
                    const isSuper = u.isSuperAdmin || u.is_super_admin || roleName.includes('super admin') || roleName.includes('super_admin');
                    return !isSuper;
                });
                setUsers(filteredUsers);
            })
            .catch(err => console.error('Failed loading users:', err))
            .finally(() => setIsLoadingUsers(false));
    }, []);

    // Load policies for selected user
    const loadUserPolicies = useCallback(async (user) => {
        if (!user) return;
        setIsLoadingPolicies(true);
        setPolicySearch('');
        try {
            const res = await documentManagementApi.getUserPolicyAccess(user.id);
            const list = res?.data || [];
            setPolicies(list);

            // Build access map from response
            const map = {};
            list.forEach(item => {
                map[item.document_id] = {
                    can_view: item.can_view,
                    can_edit: item.can_edit,
                    can_delete: item.can_delete ?? false,
                };
            });
            setPolicyAccess(map);
        } catch (err) {
            console.error('Failed loading user policies:', err);
            showToast('Failed to load policies for this user.', 'error');
        } finally {
            setIsLoadingPolicies(false);
        }
    }, []);

    useEffect(() => {
        if (selectedUser) loadUserPolicies(selectedUser);
    }, [selectedUser, loadUserPolicies]);

    const showToast = (msg, type = 'success') => {
        setToast(msg);
        setToastType(type);
        setTimeout(() => setToast(null), 4000);
    };

    // Toggle a single checkbox (optimistic)
    const handleToggle = (documentId, field) => {
        setPolicyAccess(prev => {
            const current = prev[documentId] || { can_view: true, can_edit: false, can_delete: false };
            let updated = { ...current, [field]: !current[field] };
            // Removing view → also remove edit and delete
            if (field === 'can_view' && !updated.can_view) { updated.can_edit = false; updated.can_delete = false; }
            // Adding edit → also add view
            if (field === 'can_edit' && updated.can_edit) updated.can_view = true;
            // Adding delete → also add view
            if (field === 'can_delete' && updated.can_delete) updated.can_view = true;
            return { ...prev, [documentId]: updated };
        });
    };

    // Save all changes
    const handleSave = async () => {
        if (!selectedUser) return;
        setIsSaving(true);
        try {
            const payload = policies.map(p => ({
                document_id: p.document_id,
                can_view: policyAccess[p.document_id]?.can_view ?? true,
                can_edit: policyAccess[p.document_id]?.can_edit ?? false,
                can_delete: policyAccess[p.document_id]?.can_delete ?? false,
            }));
            await documentManagementApi.bulkUpdateUserPolicyAccess(selectedUser.id, payload);
            showToast(`Access permissions saved for ${selectedUser.name}.`);
        } catch (err) {
            console.error('Failed saving policy access:', err);
            showToast('Failed to save. Please try again.', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    // Select all / clear all
    const handleSelectAllView = () => {
        setPolicyAccess(prev => {
            const next = { ...prev };
            filteredPolicies.forEach(p => {
                next[p.document_id] = { ...next[p.document_id], can_view: true };
            });
            return next;
        });
    };
    const handleClearAll = () => {
        setPolicyAccess(prev => {
            const next = { ...prev };
            filteredPolicies.forEach(p => {
                next[p.document_id] = { can_view: false, can_edit: false, can_delete: false };
            });
            return next;
        });
    };

    // Filter policies by search
    const filteredPolicies = policies.filter(p => {
        if (!policySearch.trim()) return true;
        const q = policySearch.toLowerCase();
        return (
            (p.document_name  || '').toLowerCase().includes(q) ||
            (p.library_name   || '').toLowerCase().includes(q) ||
            (p.document_type  || '').toLowerCase().includes(q)
        );
    });

    // Count changes
    const changedCount = policies.filter(p => {
        const original = p;
        const current  = policyAccess[p.document_id] || {};
        return (
            current.can_view !== original.can_view ||
            current.can_edit !== original.can_edit ||
            (current.can_delete ?? false) !== (original.can_delete ?? false)
        );
    }).length;

    // Status pill
    const StatusPill = ({ status }) => {
        const styles = {
            active:   { bg: '#dcfce7', color: '#15803d' },
            approved: { bg: '#dcfce7', color: '#15803d' },
            draft:    { bg: '#f1f5f9', color: '#475569' },
            pending:  { bg: '#fef3c7', color: '#b45309' },
            in_review:{ bg: '#fef3c7', color: '#b45309' },
            rejected: { bg: '#fee2e2', color: '#b91c1c' },
        };
        const s = styles[status] || styles.draft;
        return (
            <span style={{
                display: 'inline-block', padding: '2px 8px', borderRadius: '99px',
                fontSize: '10.5px', fontWeight: 600, background: s.bg, color: s.color,
                textTransform: 'capitalize',
            }}>
                {status === 'active' ? 'Live' : status}
            </span>
        );
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '20px' }}>
            {/* Toast */}
            {toast && (
                <div style={{
                    padding: '10px 16px',
                    background: toastType === 'error' ? '#fef2f2' : '#ecfdf5',
                    border: `1px solid ${toastType === 'error' ? '#fecaca' : '#6ee7b7'}`,
                    borderRadius: '8px',
                    color: toastType === 'error' ? '#b91c1c' : '#065f46',
                    fontSize: '13px',
                    display: 'flex', alignItems: 'center', gap: '8px',
                }}>
                    {toastType === 'error'
                        ? <AlertCircle size={15} />
                        : <CheckCircle2 size={15} />
                    }
                    <span>{toast}</span>
                </div>
            )}

            {/* Read-Only Notice if user has Read permission but not Update/Create */}
            {!canEdit && (
                <div style={{
                    padding: '10px 16px',
                    background: '#fffbeb',
                    border: '1px solid #fde68a',
                    borderRadius: '8px',
                    color: '#92400e',
                    fontSize: '13px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                }}>
                    <Lock size={15} />
                    <span><strong>Read-Only Mode:</strong> Your role has permission to view policy access assignments, but editing or granting access requires <code>policy_access:update</code> permission in the Permission Matrix.</span>
                </div>
            )}

            {/* Header Panel */}
            <div style={{
                background: '#fff', padding: '20px 24px',
                border: '1px solid #e2e8f0', borderRadius: '12px',
            }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '18px' }}>
                    {/* <div style={{
                        width: '40px', height: '40px', borderRadius: '10px',
                        background: 'linear-gradient(135deg, #0057B8, #1e40af)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                        <Shield size={20} style={{ color: '#fff' }} />
                    </div> */}
                    <div>
                        <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>
                            Policy-Specific Access Control
                        </h3>
                        <p style={{ margin: '3px 0 0', fontSize: '12.5px', color: '#64748b' }}>
                            Select a bank employee to view and configure their individual access to each policy document.
                            These override role-based permissions with Need-to-Know access.
                        </p>
                    </div>
                </div>

                {/* User Selector row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                    <div>
                        <label style={{ fontSize: '11.5px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '5px' }}>
                            SELECT BANK EMPLOYEE
                        </label>
                        {isLoadingUsers ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#94a3b8', fontSize: '13px' }}>
                                <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                                Loading users...
                            </div>
                        ) : (
                            <UserSearchDropdown
                                users={users}
                                selectedUser={selectedUser}
                                onSelect={setSelectedUser}
                            />
                        )}
                    </div>

                    {selectedUser && (
                        <div style={{
                            marginTop: '18px', padding: '8px 14px',
                            background: '#eff6ff', border: '1px solid #bfdbfe',
                            borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px',
                        }}>
                            <Users size={14} style={{ color: '#0057B8' }} />
                            <div>
                                <div style={{ fontSize: '12px', fontWeight: 700, color: '#1e40af' }}>
                                    {selectedUser.name}
                                </div>
                                <div style={{ fontSize: '11px', color: '#3b82f6' }}>
                                    {selectedUser.role_name || 'Bank User'} · {selectedUser.email}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Policy Grid — only show when user is selected */}
            {selectedUser && (
                <div style={{
                    background: '#fff', border: '1px solid #e2e8f0',
                    borderRadius: '12px', overflow: 'hidden',
                }}>
                    {/* Toolbar */}
                    <div style={{
                        padding: '14px 20px', borderBottom: '1px solid #f1f5f9',
                        background: '#f8fafc',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px',
                        flexWrap: 'wrap',
                    }}>
                        <div>
                            <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
                                Policy Access for <span style={{ color: '#0057B8' }}>{selectedUser.name}</span>
                            </h4>
                            <span style={{ fontSize: '11.5px', color: '#64748b' }}>
                                {filteredPolicies.length} policies · {changedCount > 0 && (
                                    <span style={{ color: '#b45309', fontWeight: 600 }}>{changedCount} unsaved change{changedCount !== 1 ? 's' : ''}</span>
                                )}
                                {changedCount === 0 && 'No changes'}
                            </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            {/* Policy search */}
                            <div style={{ position: 'relative' }}>
                                <Search size={13} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                                <input
                                    type="text"
                                    placeholder="Search policies..."
                                    value={policySearch}
                                    onChange={e => setPolicySearch(e.target.value)}
                                    style={{
                                        paddingLeft: '28px', paddingRight: '10px', paddingTop: '7px', paddingBottom: '7px',
                                        border: '1px solid #e2e8f0', borderRadius: '6px',
                                        fontSize: '12.5px', outline: 'none', width: '200px',
                                    }}
                                />
                                {policySearch && (
                                    <button onClick={() => setPolicySearch('')} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                                        <X size={12} style={{ color: '#94a3b8' }} />
                                    </button>
                                )}
                            </div>

                            <button
                                type="button"
                                onClick={handleSelectAllView}
                                disabled={!canEdit}
                                style={{
                                    padding: '7px 12px', border: '1px solid #e2e8f0', borderRadius: '6px',
                                    background: '#fff', fontSize: '12px',
                                    cursor: canEdit ? 'pointer' : 'not-allowed',
                                    color: canEdit ? '#475569' : '#94a3b8',
                                    opacity: canEdit ? 1 : 0.6
                                }}
                            >
                                <Eye size={12} style={{ marginRight: '4px', display: 'inline' }} />
                                Select All View
                            </button>
                            <button
                                type="button"
                                onClick={handleClearAll}
                                disabled={!canEdit}
                                style={{
                                    padding: '7px 12px', border: '1px solid #e2e8f0', borderRadius: '6px',
                                    background: '#fff', fontSize: '12px',
                                    cursor: canEdit ? 'pointer' : 'not-allowed',
                                    color: canEdit ? '#dc2626' : '#94a3b8',
                                    opacity: canEdit ? 1 : 0.6
                                }}
                            >
                                <Lock size={12} style={{ marginRight: '4px', display: 'inline' }} />
                                Revoke All
                            </button>
                            <button
                                type="button"
                                onClick={handleSave}
                                disabled={!canEdit || isSaving || changedCount === 0}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '6px',
                                    padding: '7px 16px', borderRadius: '6px', fontSize: '12.5px',
                                    fontWeight: 600,
                                    cursor: !canEdit || isSaving || changedCount === 0 ? 'not-allowed' : 'pointer',
                                    background: canEdit && changedCount > 0 ? '#0057B8' : '#e2e8f0',
                                    color: canEdit && changedCount > 0 ? '#fff' : '#94a3b8',
                                    border: 'none', transition: 'background .2s',
                                }}
                            >
                                {isSaving
                                    ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />
                                    : <Save size={13} />
                                }
                                {isSaving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </div>

                    {/* Table */}
                    {isLoadingPolicies ? (
                        <div style={{ padding: '48px', textAlign: 'center', color: '#94a3b8' }}>
                            <Loader2 size={24} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 10px', display: 'block' }} />
                            Loading policies...
                        </div>
                    ) : filteredPolicies.length === 0 ? (
                        <div style={{ padding: '48px', textAlign: 'center', color: '#94a3b8' }}>
                            <FileText size={28} style={{ margin: '0 auto 10px', display: 'block' }} />
                            {policySearch ? 'No policies match your search.' : 'No policies found in the system.'}
                        </div>
                    ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                                    <th style={{ padding: '11px 20px', textAlign: 'left', fontSize: '11.5px', fontWeight: 700, color: '#475569', letterSpacing: '.03em' }}>
                                        POLICY DOCUMENT
                                    </th>
                                    <th style={{ padding: '11px 16px', textAlign: 'left', fontSize: '11.5px', fontWeight: 700, color: '#475569', letterSpacing: '.03em', width: '160px' }}>
                                        MASTER LIBRARY
                                    </th>
                                    <th style={{ padding: '11px 16px', textAlign: 'left', fontSize: '11.5px', fontWeight: 700, color: '#475569', letterSpacing: '.03em', width: '100px' }}>
                                        STATUS
                                    </th>
                                    <th style={{ padding: '11px 16px', textAlign: 'center', fontSize: '11.5px', fontWeight: 700, color: '#475569', letterSpacing: '.03em', width: '100px' }}>
                                        <Eye size={12} style={{ display: 'inline', marginRight: '4px' }} />
                                        CAN VIEW
                                    </th>
                                    <th style={{ padding: '11px 16px', textAlign: 'center', fontSize: '11.5px', fontWeight: 700, color: '#475569', letterSpacing: '.03em', width: '100px' }}>
                                        <Edit2 size={12} style={{ display: 'inline', marginRight: '4px' }} />
                                        CAN EDIT
                                    </th>
                                    <th style={{ padding: '11px 16px', textAlign: 'center', fontSize: '11.5px', fontWeight: 700, color: '#dc2626', letterSpacing: '.03em', width: '110px' }}>
                                        <Trash2 size={12} style={{ display: 'inline', marginRight: '4px' }} />
                                        CAN DELETE
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredPolicies.map((p, idx) => {
                                    const access = policyAccess[p.document_id] || { can_view: true, can_edit: false, can_delete: false };
                                    const isChanged = access.can_view !== p.can_view || access.can_edit !== p.can_edit || (access.can_delete ?? false) !== (p.can_delete ?? false);

                                    return (
                                        <tr
                                            key={p.document_id}
                                            style={{
                                                borderBottom: '1px solid #f1f5f9',
                                                background: isChanged ? '#fffbeb' : (idx % 2 === 0 ? '#fff' : '#fafafa'),
                                                transition: 'background .15s',
                                            }}
                                            onMouseEnter={e => { if (!isChanged) e.currentTarget.style.background = '#f0f9ff'; }}
                                            onMouseLeave={e => { e.currentTarget.style.background = isChanged ? '#fffbeb' : (idx % 2 === 0 ? '#fff' : '#fafafa'); }}
                                        >
                                            <td style={{ padding: '12px 20px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <FileText size={14} style={{ color: '#0057B8', flexShrink: 0 }} />
                                                    <div>
                                                        <div style={{ fontWeight: 600, fontSize: '13px', color: '#0f172a' }}>
                                                            {p.document_name}
                                                        </div>
                                                        {p.document_type && (
                                                            <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'capitalize' }}>
                                                                {p.document_type}
                                                            </div>
                                                        )}
                                                    </div>
                                                    {isChanged && (
                                                        <span style={{ fontSize: '10px', background: '#fef3c7', color: '#92400e', padding: '2px 7px', borderRadius: '99px', fontWeight: 600, flexShrink: 0 }}>
                                                            Modified
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td style={{ padding: '12px 16px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12.5px', color: '#334155' }}>
                                                    <Folder size={12} style={{ color: '#0057B8', flexShrink: 0 }} />
                                                    <span>{p.library_name || 'Master Library'}</span>
                                                </div>
                                            </td>
                                            <td style={{ padding: '12px 16px' }}>
                                                <StatusPill status={p.status} />
                                            </td>
                                            <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                                                <label style={{ display: 'inline-flex', cursor: canEdit ? 'pointer' : 'not-allowed' }}>
                                                    <input
                                                        type="checkbox"
                                                        checked={!!access.can_view}
                                                        disabled={!canEdit}
                                                        onChange={() => handleToggle(p.document_id, 'can_view')}
                                                        style={{ width: '16px', height: '16px', cursor: canEdit ? 'pointer' : 'not-allowed', accentColor: '#0057B8', opacity: canEdit ? 1 : 0.5 }}
                                                    />
                                                </label>
                                            </td>
                                            <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                                                <label style={{ display: 'inline-flex', cursor: canEdit && access.can_view ? 'pointer' : 'not-allowed' }}>
                                                    <input
                                                        type="checkbox"
                                                        checked={!!access.can_edit}
                                                        disabled={!canEdit || !access.can_view}
                                                        onChange={() => handleToggle(p.document_id, 'can_edit')}
                                                        style={{ width: '16px', height: '16px', cursor: canEdit && access.can_view ? 'pointer' : 'not-allowed', accentColor: '#0057B8', opacity: canEdit && access.can_view ? 1 : 0.4 }}
                                                    />
                                                </label>
                                            </td>
                                            <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                                                <label style={{ display: 'inline-flex', cursor: canEdit && access.can_view ? 'pointer' : 'not-allowed' }}>
                                                    <input
                                                        type="checkbox"
                                                        checked={!!(access.can_delete)}
                                                        disabled={!canEdit || !access.can_view}
                                                        onChange={() => handleToggle(p.document_id, 'can_delete')}
                                                        style={{ width: '16px', height: '16px', cursor: canEdit && access.can_view ? 'pointer' : 'not-allowed', accentColor: '#dc2626', opacity: canEdit && access.can_view ? 1 : 0.4 }}
                                                    />
                                                </label>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}

                    {/* Footer save bar (always visible when there are changes) */}
                    {changedCount > 0 && (
                        <div style={{
                            padding: '12px 20px', background: '#fffbeb', borderTop: '1px solid #fde68a',
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        }}>
                            <span style={{ fontSize: '12.5px', color: '#92400e', fontWeight: 600 }}>
                                ⚠ {changedCount} unsaved change{changedCount !== 1 ? 's' : ''} — Click "Save Changes" to apply.
                            </span>
                            <button
                                type="button"
                                onClick={handleSave}
                                disabled={isSaving}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '6px',
                                    padding: '8px 18px', borderRadius: '6px', fontSize: '12.5px',
                                    fontWeight: 600, cursor: isSaving ? 'not-allowed' : 'pointer',
                                    background: '#0057B8', color: '#fff', border: 'none',
                                }}
                            >
                                {isSaving ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={13} />}
                                {isSaving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Empty state — no user selected yet */}
            {!selectedUser && !isLoadingUsers && (
                <div style={{
                    background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px',
                    padding: '60px 20px', textAlign: 'center',
                }}>
                    <Shield size={36} style={{ color: '#cbd5e1', margin: '0 auto 12px', display: 'block' }} />
                    <h4 style={{ margin: '0 0 6px', fontSize: '15px', color: '#334155' }}>
                        Select a Bank Employee
                    </h4>
                    <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8' }}>
                        Choose a user from the dropdown above to configure their individual policy access permissions.
                    </p>
                </div>
            )}

            {/* Spin keyframe (inject once) */}
            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}
