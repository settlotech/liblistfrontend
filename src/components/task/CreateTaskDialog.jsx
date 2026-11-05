import React, { useState, useEffect } from 'react';
import { X, ListChecks, Loader2, User, ChevronDown, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { taskApi } from '../../services/api/taskApi';
import { usersApi } from '../../services/api/usersApi';

/**
 * CreateTaskDialog – Task creation form.
 * IMPORTANT: This dialog must only be opened from the TaskContextMenu (right-click).
 */
export default function CreateTaskDialog({ onClose, onTaskCreated }) {
    const { user } = useAuth();

    const [form, setForm] = useState({
        title: '',
        description: '',
        category: 'general',
        assigned_to: '',
        library_id: '',
        section_id: '',
        participants: [] // [{user_id, role}]
    });

    const [users, setUsers] = useState([]);
    const [isLoadingUsers, setIsLoadingUsers] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [toast, setToast] = useState(null); // { type: 'success'|'error', message }
    const [errors, setErrors] = useState({});

    // Participant form state
    const [participantUserId, setParticipantUserId] = useState('');
    const [participantRole, setParticipantRole] = useState('reviewer');

    useEffect(() => {
        const loadUsers = async () => {
            setIsLoadingUsers(true);
            try {
                let list = [];
                try {
                    const result = await taskApi.getAssignableUsers();
                    list = Array.isArray(result) ? result : (result?.data || []);
                } catch {
                    const result = await usersApi.getUsers();
                    list = Array.isArray(result) ? result : (result?.data || []);
                }
                setUsers(Array.isArray(list) ? list : []);
            } catch (err) {
                console.error('Failed to load users from users table:', err);
                setUsers([]);
            } finally {
                setIsLoadingUsers(false);
            }
        };
        loadUsers();
    }, []);

    // Close on Escape
    useEffect(() => {
        const handler = (e) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [onClose]);

    const validate = () => {
        const errs = {};
        if (!form.title.trim()) errs.title = 'Task title is required';
        return errs;
    };

    const handleChange = (field) => (e) => {
        setForm(prev => ({ ...prev, [field]: e.target.value }));
        setErrors(prev => ({ ...prev, [field]: null }));
    };

    const handleAddParticipant = () => {
        if (!participantUserId) return;
        const dup = form.participants.some(
            p => p.user_id === participantUserId && p.role === participantRole
        );
        if (dup) return;
        setForm(prev => ({
            ...prev,
            participants: [...prev.participants, { user_id: participantUserId, role: participantRole }]
        }));
        setParticipantUserId('');
    };

    const handleRemoveParticipant = (userId, role) => {
        setForm(prev => ({
            ...prev,
            participants: prev.participants.filter(p => !(p.user_id === userId && p.role === role))
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const errs = validate();
        if (Object.keys(errs).length > 0) { setErrors(errs); return; }

        setIsSubmitting(true);
        setToast(null);
        try {
            const payload = {
                title: form.title.trim(),
                description: form.description.trim() || null,
                category: form.category,
                assigned_to: form.assigned_to || null,
                library_id: form.library_id.trim() || null,
                section_id: form.section_id.trim() || null,
                participants: form.participants
            };

            const result = await taskApi.createTask(payload);
            if (result?.success) {
                setToast({ type: 'success', message: `Task ${result.data?.task_code} created successfully!` });
                setTimeout(() => {
                    onClose();
                    onTaskCreated?.(result.data);
                }, 1200);
            }
        } catch (err) {
            setToast({ type: 'error', message: err.message || 'Failed to create task. Please try again.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const otherUsers = users.filter(u => u.id !== user?.id);
    const participantUserMap = Object.fromEntries(users.map(u => [u.id, u.name]));

    const ROLE_LABELS = { approver: 'Approver', reviewer: 'Reviewer', for_info: 'For Info' };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-150"
            onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-150">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-blue-50 border border-blue-200 text-[#0057B8]">
                            <ListChecks className="w-4 h-4" />
                        </div>
                        <div>
                            <h2 className="text-sm font-bold text-slate-900">New Task</h2>
                            <p className="text-[11px] text-slate-500">Create from Task Pane context menu</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Toast */}
                {toast && (
                    <div className={`mx-6 mt-4 flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold border ${
                        toast.type === 'success'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}>
                        {toast.type === 'success'
                            ? <CheckCircle2 className="w-4 h-4" />
                            : <AlertCircle className="w-4 h-4" />
                        }
                        {toast.message}
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-5 text-xs">

                    {/* Title */}
                    <div>
                        <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider text-[10.5px]">
                            Task Title <span className="text-rose-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={form.title}
                            onChange={handleChange('title')}
                            placeholder="Enter a clear, concise task title"
                            autoFocus
                            className={`w-full p-2.5 rounded-xl border text-xs font-medium focus:outline-none focus:border-[#0057B8] transition ${
                                errors.title ? 'border-rose-400 bg-rose-50' : 'border-slate-300'
                            }`}
                        />
                        {errors.title && <p className="text-rose-600 mt-0.5 text-[10.5px]">{errors.title}</p>}
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider text-[10.5px]">
                            Description <span className="text-slate-400 font-normal">(Optional)</span>
                        </label>
                        <textarea
                            rows={3}
                            value={form.description}
                            onChange={handleChange('description')}
                            placeholder="Provide task details, instructions, or context..."
                            className="w-full p-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-[#0057B8] resize-none leading-relaxed"
                        />
                    </div>

                    {/* Category + Assigned To */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider text-[10.5px]">
                                Category
                            </label>
                            <select
                                value={form.category}
                                onChange={handleChange('category')}
                                className="w-full p-2.5 rounded-xl border border-slate-300 bg-white text-xs font-medium focus:outline-none focus:border-[#0057B8]"
                            >
                                <option value="general">General (Mine)</option>
                                <option value="common">Common (Workspace)</option>
                            </select>
                        </div>

                        <div>
                            <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider text-[10.5px]">
                                Assign To <span className="text-slate-400 font-normal">(Optional)</span>
                            </label>
                            {isLoadingUsers ? (
                                <div className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200">
                                    <Loader2 className="w-3 h-3 animate-spin text-slate-400" />
                                    <span className="text-slate-400">Loading users...</span>
                                </div>
                            ) : (
                                <select
                                    value={form.assigned_to}
                                    onChange={handleChange('assigned_to')}
                                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-white text-xs font-medium focus:outline-none focus:border-[#0057B8]"
                                >
                                    <option value="">— Self Reminder (Unassigned) —</option>
                                    {users.map(u => (
                                        <option key={u.id} value={u.id}>
                                            {u.name}{u.email ? ` (${u.email})` : ''}{u.id === user?.id ? ' (Me)' : ''}
                                        </option>
                                    ))}
                                </select>
                            )}
                        </div>
                    </div>

                    {/* Optional References */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider text-[10.5px]">
                                Library Reference <span className="text-slate-400 font-normal">(Optional)</span>
                            </label>
                            <input
                                type="text"
                                value={form.library_id}
                                onChange={handleChange('library_id')}
                                placeholder="Library ID"
                                className="w-full p-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-[#0057B8]"
                            />
                        </div>
                        <div>
                            <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider text-[10.5px]">
                                Section Reference <span className="text-slate-400 font-normal">(Optional)</span>
                            </label>
                            <input
                                type="text"
                                value={form.section_id}
                                onChange={handleChange('section_id')}
                                placeholder="Section ID"
                                className="w-full p-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-[#0057B8]"
                            />
                        </div>
                    </div>

                    {/* Participants */}
                    <div>
                        <label className="block font-bold text-slate-700 mb-2 uppercase tracking-wider text-[10.5px]">
                            Participants <span className="text-slate-400 font-normal">(Optional)</span>
                        </label>

                        {/* Add participant row */}
                        <div className="flex gap-2 mb-2">
                            <select
                                value={participantUserId}
                                onChange={e => setParticipantUserId(e.target.value)}
                                className="flex-1 p-2 rounded-xl border border-slate-300 bg-white text-xs focus:outline-none focus:border-[#0057B8]"
                            >
                                <option value="">Select user...</option>
                                {users.map(u => (
                                    <option key={u.id} value={u.id}>
                                        {u.name}{u.email ? ` (${u.email})` : ''}{u.id === user?.id ? ' (Me)' : ''}
                                    </option>
                                ))}
                            </select>
                            <select
                                value={participantRole}
                                onChange={e => setParticipantRole(e.target.value)}
                                className="p-2 rounded-xl border border-slate-300 bg-white text-xs focus:outline-none focus:border-[#0057B8]"
                            >
                                <option value="approver">Approver</option>
                                <option value="reviewer">Reviewer</option>
                                <option value="for_info">For Info</option>
                            </select>
                            <button
                                type="button"
                                onClick={handleAddParticipant}
                                disabled={!participantUserId}
                                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition disabled:opacity-50 cursor-pointer"
                            >
                                Add
                            </button>
                        </div>

                        {/* Participant list */}
                        {form.participants.length > 0 && (
                            <div className="space-y-1.5">
                                {form.participants.map((p, i) => (
                                    <div key={i} className="flex items-center justify-between gap-2 px-2.5 py-1.5 bg-blue-50 border border-blue-200 rounded-lg">
                                        <span className="text-xs font-medium text-[#0057B8]">
                                            {participantUserMap[p.user_id] || p.user_id}
                                            <span className="ml-2 text-[10px] text-blue-500 font-normal">({ROLE_LABELS[p.role]})</span>
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveParticipant(p.user_id, p.role)}
                                            className="p-0.5 text-blue-300 hover:text-rose-600 transition"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </form>

                {/* Footer */}
                <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50">
                    <p className="text-[10.5px] text-slate-400">
                        Created by: <strong>{user?.name || 'You'}</strong> · Source: task_pane
                    </p>
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-xl text-xs font-semibold cursor-pointer transition"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting || !!toast?.type === 'success'}
                            className="flex items-center gap-1.5 px-5 py-2 bg-[#0057B8] hover:bg-[#004EA6] text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer disabled:opacity-60"
                        >
                            {isSubmitting ? (
                                <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Creating...</>
                            ) : (
                                <><ListChecks className="w-3.5 h-3.5" /> Create Task</>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
