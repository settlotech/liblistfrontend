import React, { useState, useEffect } from 'react';
import { User, Shield, Eye, Info, X, Plus, Loader2 } from 'lucide-react';
import { taskApi } from '../../services/api/taskApi';
import { usersApi } from '../../services/api/usersApi';

const ROLE_CONFIG = {
    approver: { label: 'Approver', icon: <Shield className="w-3 h-3" />, bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
    reviewer: { label: 'Reviewer', icon: <Eye className="w-3 h-3" />, bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
    for_info: { label: 'For Info', icon: <Info className="w-3 h-3" />, bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200' }
};

/**
 * TaskParticipants – Displays participants grouped by role, with dynamic user selection from users table.
 */
export default function TaskParticipants({
    participants = [],
    canManage = false,
    onRemove,
    onAdd,
    isLoading
}) {
    const [isAdding, setIsAdding] = useState(false);
    const [users, setUsers] = useState([]);
    const [selectedUserId, setSelectedUserId] = useState('');
    const [selectedRole, setSelectedRole] = useState('reviewer');
    const [isLoadingUsers, setIsLoadingUsers] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const loadUsers = async () => {
        setIsLoadingUsers(true);
        try {
            let list = [];
            try {
                const res = await taskApi.getAssignableUsers();
                list = Array.isArray(res) ? res : (res?.data || []);
            } catch {
                const res = await usersApi.getUsers();
                list = Array.isArray(res) ? res : (res?.data || []);
            }
            setUsers(Array.isArray(list) ? list : []);
        } catch (err) {
            console.error('Failed to load users for participants:', err);
        } finally {
            setIsLoadingUsers(false);
        }
    };

    const handleOpenAdd = () => {
        setIsAdding(true);
        if (users.length === 0) {
            loadUsers();
        }
    };

    const handleSaveAdd = async () => {
        if (!selectedUserId || !onAdd) return;
        setIsSaving(true);
        try {
            await onAdd(selectedUserId, selectedRole);
            setSelectedUserId('');
            setIsAdding(false);
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="space-y-2 animate-pulse">
                <div className="h-4 bg-slate-100 rounded w-1/3" />
                <div className="h-8 bg-slate-50 rounded-xl" />
            </div>
        );
    }

    // Group existing participants by role
    const grouped = participants.reduce((acc, p) => {
        (acc[p.role] = acc[p.role] || []).push(p);
        return acc;
    }, {});

    return (
        <div className="space-y-3">
            {/* Header with Add Button */}
            <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Participants List ({participants.length})
                </span>
                {canManage && !isAdding && onAdd && (
                    <button
                        type="button"
                        onClick={handleOpenAdd}
                        className="flex items-center gap-1 text-[11px] font-semibold text-[#0057B8] hover:underline cursor-pointer"
                    >
                        <Plus className="w-3 h-3" />
                        <span>Add Participant</span>
                    </button>
                )}
            </div>

            {/* Inline Add Participant Form */}
            {isAdding && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 animate-in fade-in duration-100">
                    <span className="text-[10.5px] font-bold text-slate-700 block">
                        Add New Participant (from Users Table)
                    </span>
                    {isLoadingUsers ? (
                        <div className="flex items-center gap-2 text-xs text-slate-500 py-1">
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-[#0057B8]" />
                            <span>Loading users from database...</span>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <select
                                value={selectedUserId}
                                onChange={(e) => setSelectedUserId(e.target.value)}
                                className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white focus:outline-none focus:border-[#0057B8]"
                            >
                                <option value="">Select User...</option>
                                {users.map((u) => (
                                    <option key={u.id} value={u.id}>
                                        {u.name} {u.email ? `(${u.email})` : ''}
                                    </option>
                                ))}
                            </select>

                            <select
                                value={selectedRole}
                                onChange={(e) => setSelectedRole(e.target.value)}
                                className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white focus:outline-none focus:border-[#0057B8]"
                            >
                                <option value="approver">Approver</option>
                                <option value="reviewer">Reviewer</option>
                                <option value="for_info">For Info</option>
                            </select>
                        </div>
                    )}

                    <div className="flex items-center justify-end gap-1.5 pt-1">
                        <button
                            type="button"
                            onClick={() => {
                                setSelectedUserId('');
                                setIsAdding(false);
                            }}
                            className="px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-200 rounded-lg transition cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            disabled={!selectedUserId || isSaving}
                            onClick={handleSaveAdd}
                            className="flex items-center gap-1 px-3 py-1 bg-[#0057B8] hover:bg-[#004EA6] text-white text-xs font-semibold rounded-lg transition disabled:opacity-50 cursor-pointer shadow-xs"
                        >
                            {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                            <span>Add</span>
                        </button>
                    </div>
                </div>
            )}

            {participants.length === 0 && !isAdding && (
                <div className="text-xs text-slate-400 py-2">
                    No participants assigned to this task.
                </div>
            )}

            {/* List by Role */}
            {Object.entries(grouped).map(([role, members]) => {
                const config = ROLE_CONFIG[role] || ROLE_CONFIG.for_info;
                return (
                    <div key={role}>
                        <div className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider mb-1.5 ${config.text}`}>
                            {config.icon}
                            {config.label} ({members.length})
                        </div>
                        <div className="space-y-1">
                            {members.map((p) => (
                                <div
                                    key={p.id}
                                    className={`flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg border ${config.bg} ${config.border}`}
                                >
                                    <div className="flex items-center gap-2 min-w-0">
                                        <div className={`w-6 h-6 rounded-full ${config.bg} border ${config.border} flex items-center justify-center flex-shrink-0`}>
                                            <User className={`w-3 h-3 ${config.text}`} />
                                        </div>
                                        <div className="min-w-0">
                                            <span className={`text-xs font-semibold ${config.text} block truncate`}>
                                                {p.user_name || 'Unknown'}
                                            </span>
                                            {p.email && (
                                                <span className="text-[10px] text-slate-400 truncate block">
                                                    {p.email}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    {canManage && onRemove && (
                                        <button
                                            type="button"
                                            onClick={() => onRemove(p.id)}
                                            className="p-1 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition flex-shrink-0 cursor-pointer"
                                            title="Remove participant"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
