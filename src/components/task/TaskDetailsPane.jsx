import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    X, User, Calendar, FileText, Tag, MessageSquare,
    RefreshCw, Loader2, ChevronDown, ChevronUp,
    ExternalLink, Compass
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { taskApi } from '../../services/api/taskApi';
import TaskStatus from './TaskStatus';
import TaskParticipants from './TaskParticipants';
import TaskActivityLog from './TaskActivityLog';
import TaskAssignment from './TaskAssignment';

const formatDate = (d) => d ? new Date(d).toLocaleString('en-AU', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
}) : '—';

/**
 * TaskDetailsPane – Slide-in panel showing full task details, participants, and activity log.
 */
export default function TaskDetailsPane({ task: initialTask, onClose, onTaskUpdated }) {
    const { user, hasPermission } = useAuth();
    const [task, setTask] = useState(initialTask);
    const [logs, setLogs] = useState([]);
    const [participants, setParticipants] = useState([]);
    const [comment, setComment] = useState('');
    const [isLoadingDetails, setIsLoadingDetails] = useState(true);
    const [isAddingComment, setIsAddingComment] = useState(false);
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
    const [activeTab, setActiveTab] = useState('details'); // 'details' | 'activity'
    const [error, setError] = useState(null);

    const navigate = useNavigate();

    const handleNavigateToPolicy = () => {
        const policyId = task?.library_id || task?.linked_policy_id || 'credit-card-limits-policy';
        const sectionParam = task?.section_id ? `&section=${encodeURIComponent(task.section_id)}` : '';
        navigate(`/home?policy=${encodeURIComponent(policyId)}${sectionParam}`);
    };

    const isCreator = user?.id === task?.created_by;
    const isAssignee = user?.id === task?.assigned_to;
    const isApprover = participants.some(p => p.user_id === user?.id && p.role === 'approver');
    const isReviewer = participants.some(p => p.user_id === user?.id && p.role === 'reviewer');

    const loadDetails = async () => {
        setIsLoadingDetails(true);
        setError(null);
        try {
            const result = await taskApi.getTaskById(initialTask.id);
            if (result?.success) {
                setTask(result.data);
                setLogs(result.data.logs || []);
                setParticipants(result.data.participants || []);
            }
        } catch (err) {
            setError('Failed to load task details.');
        } finally {
            setIsLoadingDetails(false);
        }
    };

    useEffect(() => {
        if (initialTask?.id) loadDetails();
    }, [initialTask?.id]);

    const handleStatusChange = async (newStatus) => {
        setIsUpdatingStatus(true);
        try {
            const res = await taskApi.updateStatus(task.id, newStatus);
            if (res?.success) {
                setTask(prev => ({ ...prev, status: newStatus }));
                onTaskUpdated?.();
                await loadDetails();
            }
        } catch (err) {
            setError(err.message || 'Failed to update status.');
        } finally {
            setIsUpdatingStatus(false);
        }
    };

    const handleRemoveParticipant = async (participantId) => {
        try {
            await taskApi.removeParticipant(task.id, participantId);
            setParticipants(prev => prev.filter(p => p.id !== participantId));
            onTaskUpdated?.();
        } catch (err) {
            setError(err.message || 'Failed to remove participant.');
        }
    };

    const handleAddParticipant = async (userId, role) => {
        try {
            await taskApi.addParticipant(task.id, userId, role);
            await loadDetails();
            onTaskUpdated?.();
        } catch (err) {
            setError(err.message || 'Failed to add participant.');
        }
    };

    const handleAddComment = async (e) => {
        e.preventDefault();
        if (!comment.trim()) return;
        setIsAddingComment(true);
        try {
            await taskApi.addComment(task.id, comment.trim());
            setComment('');
            await loadDetails();
        } catch (err) {
            setError(err.message || 'Failed to add comment.');
        } finally {
            setIsAddingComment(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-white border-l border-slate-200 w-full">
            {/* Header */}
            <div className="flex items-start justify-between gap-2 px-5 py-4 border-b border-slate-100">
                <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                            {task?.task_code}
                        </span>
                        {isLoadingDetails && <Loader2 className="w-3 h-3 text-slate-400 animate-spin" />}
                    </div>
                    <h2 className="text-sm font-bold text-slate-900 leading-snug line-clamp-2">
                        {task?.title}
                    </h2>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                        onClick={loadDetails}
                        title="Refresh"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                    >
                        <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                    >
                        <X className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-100 px-5">
                {['details', 'activity'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`py-2.5 px-3 text-xs font-semibold capitalize transition border-b-2 -mb-px ${
                            activeTab === tab
                                ? 'border-[#0057B8] text-[#0057B8]'
                                : 'border-transparent text-slate-500 hover:text-slate-700'
                        }`}
                    >
                        {tab === 'activity' ? `Activity (${logs.length})` : 'Details'}
                    </button>
                ))}
            </div>

            {/* Error */}
            {error && (
                <div className="mx-4 mt-3 px-3 py-2 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
                    {error}
                </div>
            )}

            {/* Body */}
            <div className="flex-1 overflow-y-auto">
                {activeTab === 'details' ? (
                    <div className="p-5 space-y-5">
                        {/* Navigate to Location & Edit Section */}
                        <section className="bg-gradient-to-r from-blue-50/90 via-sky-50/50 to-white p-3.5 rounded-2xl border-2 border-[#0057B8]/25 shadow-2xs space-y-2.5">
                            <div className="flex items-center justify-between gap-2">
                                <span className="text-[11px] font-bold uppercase tracking-wider text-[#0057B8] flex items-center gap-1.5">
                                    <Compass className="w-3.5 h-3.5 text-[#0057B8]" />
                                    <span>Policy Section Location</span>
                                </span>
                                {task?.section_id ? (
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#0057B8] text-white max-w-[170px] truncate" title={task.section_id}>
                                        § {task.section_id}
                                    </span>
                                ) : (
                                    <span className="text-[10px] font-semibold text-slate-500">
                                        General Policy
                                    </span>
                                )}
                            </div>
                            <button
                                type="button"
                                onClick={handleNavigateToPolicy}
                                className="w-full py-2.5 px-4 bg-[#0057B8] hover:bg-[#004EA6] text-white rounded-xl text-xs font-bold shadow-xs hover:shadow transition flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                            >
                                <ExternalLink className="w-3.5 h-3.5 text-blue-200" />
                                <span>Navigate to Location & Edit</span>
                            </button>
                        </section>

                        {/* Status */}
                        <section>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Status</p>
                            {task && (
                                <TaskStatus
                                    status={task.status}
                                    canApprove={true}
                                    canRespond={true}
                                    canCancel={true}
                                    canComplete={true}
                                    onStatusChange={handleStatusChange}
                                    isUpdating={isUpdatingStatus}
                                />
                            )}
                        </section>

                        {/* Assignment */}
                        <section>
                            <TaskAssignment
                                task={task}
                                canAssign={true}
                                onAssignmentUpdated={async () => {
                                    onTaskUpdated?.();
                                    await loadDetails();
                                }}
                            />
                        </section>

                        {/* Task Description */}
                        {task?.description && (
                            <section>
                                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                                    <FileText className="inline w-3 h-3 mr-1" />Description
                                </p>
                                <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                                    {task.description}
                                </p>
                            </section>
                        )}

                        {/* Meta Grid */}
                        <section>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                                Task Info
                            </p>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                                <div className="bg-slate-50 rounded-xl px-3 py-2.5">
                                    <span className="text-slate-400 block text-[10px] mb-0.5">Created By</span>
                                    <span className="font-semibold text-slate-700">{task?.created_by_name || '—'}</span>
                                </div>
                                <div className="bg-slate-50 rounded-xl px-3 py-2.5">
                                    <span className="text-slate-400 block text-[10px] mb-0.5">Assigned To</span>
                                    <span className="font-semibold text-slate-700">{task?.assigned_to_name || 'Unassigned'}</span>
                                </div>
                                <div className="bg-slate-50 rounded-xl px-3 py-2.5">
                                    <span className="text-slate-400 block text-[10px] mb-0.5">Created</span>
                                    <span className="font-medium text-slate-600">{formatDate(task?.created_at)}</span>
                                </div>
                                <div className="bg-slate-50 rounded-xl px-3 py-2.5">
                                    <span className="text-slate-400 block text-[10px] mb-0.5">Last Updated</span>
                                    <span className="font-medium text-slate-600">{formatDate(task?.updated_at)}</span>
                                </div>
                                <div className="bg-slate-50 rounded-xl px-3 py-2.5">
                                    <span className="text-slate-400 block text-[10px] mb-0.5">Category</span>
                                    <span className="font-semibold text-slate-700 capitalize">{task?.category || '—'}</span>
                                </div>
                                <div className="bg-slate-50 rounded-xl px-3 py-2.5">
                                    <span className="text-slate-400 block text-[10px] mb-0.5">Source</span>
                                    <span className="font-medium text-slate-600">{task?.created_from || 'task_pane'}</span>
                                </div>
                            </div>
                        </section>

                        {/* Participants */}
                        <section>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                                Participants
                            </p>
                            <TaskParticipants
                                participants={participants}
                                canManage={true}
                                onRemove={handleRemoveParticipant}
                                onAdd={handleAddParticipant}
                                isLoading={isLoadingDetails}
                            />
                        </section>

                        {/* Add Comment */}
                        <section>
                                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                                    Add Comment
                                </p>
                                <form onSubmit={handleAddComment} className="space-y-2">
                                    <textarea
                                        value={comment}
                                        onChange={e => setComment(e.target.value)}
                                        rows={2}
                                        placeholder="Write a comment..."
                                        className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#0057B8] resize-none"
                                    />
                                    <button
                                        type="submit"
                                        disabled={!comment.trim() || isAddingComment}
                                        className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#0057B8] text-white text-xs font-bold rounded-xl disabled:opacity-50 hover:bg-[#004EA6] transition cursor-pointer"
                                    >
                                        {isAddingComment ? <Loader2 className="w-3 h-3 animate-spin" /> : <MessageSquare className="w-3 h-3" />}
                                        {isAddingComment ? 'Posting...' : 'Post Comment'}
                                    </button>
                                </form>
                            </section>
                    </div>
                ) : (
                    <TaskActivityLog logs={logs} isLoading={isLoadingDetails} />
                )}
            </div>
        </div>
    );
}
