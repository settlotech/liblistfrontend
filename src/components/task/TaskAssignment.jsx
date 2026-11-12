import React, { useState, useEffect } from 'react';
import { User, Check, Loader2, RefreshCw } from 'lucide-react';
import { usersApi } from '../../services/api/usersApi';
import { taskApi } from '../../services/api/taskApi';

/**
 * TaskAssignment – Component to view and manage task assignee with reassignment history.
 */
export default function TaskAssignment({
    task,
    canAssign = false,
    onAssignmentUpdated
}) {
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(task?.assigned_to || '');
    const [isLoadingUsers, setIsLoadingUsers] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        setSelectedUser(task?.assigned_to || '');
    }, [task?.assigned_to]);

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
            console.error('Failed to load users for assignment:', err);
        } finally {
            setIsLoadingUsers(false);
        }
    };

    const handleStartEdit = () => {
        if (!canAssign) return;
        setIsEditing(true);
        if (users.length === 0) {
            loadUsers();
        }
    };

    const handleSaveAssignment = async () => {
        setIsSaving(true);
        setError(null);
        try {
            const newAssigneeId = selectedUser || null;
            if (task.assigned_to) {
                // Reassign
                await taskApi.reassignTask(task.id, newAssigneeId);
            } else {
                // Initial assign
                await taskApi.assignTask(task.id, newAssigneeId);
            }
            setIsEditing(false);
            onAssignmentUpdated?.();
        } catch (err) {
            setError(err.message || 'Failed to update assignment');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
            <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Assigned Personnel
                </span>
                {canAssign && !isEditing && (
                    <button
                        type="button"
                        onClick={handleStartEdit}
                        className="text-[11px] font-semibold text-[#0057B8] hover:underline cursor-pointer"
                    >
                        Change
                    </button>
                )}
            </div>

            {!isEditing ? (
                <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-blue-100 text-[#0057B8] flex items-center justify-center text-xs font-bold">
                        <User className="w-3.5 h-3.5" />
                    </div>
                    <div>
                        <span className="text-xs font-semibold text-slate-800 block">
                            {task?.assigned_to_name || task?.assigned_to || 'Unassigned (Self-Reminder)'}
                        </span>
                        {task?.assigned_to_name && (
                            <span className="text-[10.5px] text-slate-400">
                                Assigned user
                            </span>
                        )}
                    </div>
                </div>
            ) : (
                <div className="space-y-2 mt-1">
                    {isLoadingUsers ? (
                        <div className="flex items-center gap-2 text-xs text-slate-500 py-1">
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-[#0057B8]" />
                            <span>Loading users...</span>
                        </div>
                    ) : (
                        <select
                            value={selectedUser}
                            onChange={(e) => setSelectedUser(e.target.value)}
                            className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white focus:outline-none focus:border-[#0057B8]"
                        >
                            <option value="">— Unassigned (Self-Reminder) —</option>
                            {users.map((u) => (
                                <option key={u.id} value={u.id}>
                                    {u.name} ({u.email})
                                </option>
                            ))}
                        </select>
                    )}

                    {error && (
                        <p className="text-[11px] text-rose-600 font-medium">{error}</p>
                    )}

                    <div className="flex items-center justify-end gap-1.5 pt-1">
                        <button
                            type="button"
                            onClick={() => {
                                setSelectedUser(task?.assigned_to || '');
                                setIsEditing(false);
                            }}
                            className="px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-200 rounded-lg transition cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            disabled={isSaving}
                            onClick={handleSaveAssignment}
                            className="flex items-center gap-1 px-3 py-1 bg-[#0057B8] hover:bg-[#004EA6] text-white text-xs font-semibold rounded-lg transition disabled:opacity-50 cursor-pointer shadow-xs"
                        >
                            {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                            <span>Save</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
