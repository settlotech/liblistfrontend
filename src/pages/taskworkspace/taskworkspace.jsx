import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
    ListTodo,
    Plus,
    Search,
    Pin,
    RotateCw,
    CheckCircle2,
    Clock,
    User,
    Users,
    Check,
    ChevronDown,
    ChevronRight,
    X,
    AlertCircle,
    MessageSquare,
    Send,
    Trash2,
    UserCheck,
    FileText,
    Bookmark,
    CheckSquare,
    HelpCircle,
    Calendar
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { taskApi } from '../../services/api/taskApi';
import './taskworkspace.css';
import LoadMoreOnScroll from '../../components/common/LoadMoreOnScroll';

export default function TaskWorkspace() {
    const { user } = useAuth();

    // ── DATA STATE ────────────────────────────────────────────────────────
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [taskPage, setTaskPage] = useState(1);
    const [tasksHasMore, setTasksHasMore] = useState(false);
    const [loadingMoreTasks, setLoadingMoreTasks] = useState(false);
    const [assignableUsers, setAssignableUsers] = useState([]);
    const [groups, setGroups] = useState([]);

    // ── FILTER & TAB STATE ────────────────────────────────────────────────
    // Image 1: "The list is grouped into Common, Pinned, General"
    const [activeTab, setActiveTab] = useState('all'); // 'all' | 'common' | 'pinned' | 'general'
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    // ── CONTEXT MENU STATE (Trigger Type 1) ───────────────────────────────
    const [contextMenu, setContextMenu] = useState(null); // { x, y, task }
    const contextMenuRef = useRef(null);

    // ── CREATE TASK MODAL (2-Column Grid Layout) ──────────────────────────
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [newTaskDesc, setNewTaskDesc] = useState('');
    const [newTaskCategory, setNewTaskCategory] = useState('general'); // 'general' | 'common'
    const [newTaskDueDate, setNewTaskDueDate] = useState('');

    // Multiple Assignees — GitHub-style unified dropdown (users + groups)
    const [selectedAssignees, setSelectedAssignees] = useState([]); // [{ id, name, email, isSelf?, fromGroup? }]
    const [activeGroupId, setActiveGroupId] = useState(null);        // which group is currently applied
    const [assignerSearch, setAssignerSearch] = useState('');
    const [assignerDropdownOpen, setAssignerDropdownOpen] = useState(false);
    const [assignerView, setAssignerView] = useState('flat');         // 'flat' | 'group' (expanded group view)
    const [expandedGroupId, setExpandedGroupId] = useState(null);    // group being previewed
    const assignerRef = useRef(null);
    const participantRef = useRef(null);

    // Reusable Assignee Groups — Create form
    const [showCreateGroup, setShowCreateGroup] = useState(false);
    const [newGroupName, setNewGroupName] = useState('');
    const [newGroupMembers, setNewGroupMembers] = useState([]);
    const [groupMemberSearch, setGroupMemberSearch] = useState('');
    const [groupMemberDropdownOpen, setGroupMemberDropdownOpen] = useState(false);
    const [isSavingGroup, setIsSavingGroup] = useState(false);
    const groupMemberRef = useRef(null);

    // Roles & Participants — searchable dropdown
    const [participantSearch, setParticipantSearch] = useState('');
    const [participantDropdownOpen, setParticipantDropdownOpen] = useState(false);
    const [newTaskParticipantUser, setNewTaskParticipantUser] = useState('');
    const [newTaskParticipantRole, setNewTaskParticipantRole] = useState('reviewer');
    const [newTaskParticipants, setNewTaskParticipants] = useState([]);
    const [isSubmittingTask, setIsSubmittingTask] = useState(false);
    const [modalError, setModalError] = useState('');

    // ── EXPANDED ROWS FOR AUDIT TRAIL / LOG TABLE (Image 4) ───────────────
    const [expandedTaskIds, setExpandedTaskIds] = useState(new Set());
    const [commentInputs, setCommentInputs] = useState({});

    // ── FETCH TASKS, USERS & GROUPS ON MOUNT ──────────────────────────────
    const fetchTasks = async (page = 1, append = false) => {
        try {
            if (append) setLoadingMoreTasks(true); else setLoading(true);
            const res = await taskApi.getTasks({ search: '', page, limit: 30 });
            const list = res?.data || res || [];
            const batch = Array.isArray(list) ? list : [];
            setTasks(current => append ? [...current, ...batch] : batch);
            setTaskPage(page);
            setTasksHasMore(page < (res?.pagination?.totalPages || 1));
        } catch (err) {
            console.error('Failed to fetch tasks:', err);
        } finally {
            setLoading(false);
            setLoadingMoreTasks(false);
        }
    };

    const fetchUsers = async () => {
        try {
            const users = await taskApi.getAssignableUsers();
            setAssignableUsers(Array.isArray(users) ? users : []);
        } catch (err) {
            console.error('Failed to fetch assignable users:', err);
        }
    };

    const fetchGroups = async () => {
        try {
            const grps = await taskApi.getGroups();
            setGroups(Array.isArray(grps) ? grps : []);
        } catch (err) {
            console.error('Failed to fetch assignee groups:', err);
        }
    };

    useEffect(() => {
        fetchTasks();
        fetchUsers();
        fetchGroups();
    }, []);

    // ── CLOSE CONTEXT MENU & DROPDOWNS ON CLICK OUTSIDE OR ESCAPE ─────────
    useEffect(() => {
        const handleClickOutside = (e) => {
            // If click happened inside the floating context menu, let its button onClick execute
            if (contextMenuRef.current && contextMenuRef.current.contains(e.target)) {
                return;
            }
            setContextMenu(null);
            if (assignerRef.current && !assignerRef.current.contains(e.target)) {
                setAssignerDropdownOpen(false);
                setAssignerView('flat');
                setExpandedGroupId(null);
            }
            if (participantRef.current && !participantRef.current.contains(e.target)) {
                setParticipantDropdownOpen(false);
            }
            if (groupMemberRef.current && !groupMemberRef.current.contains(e.target)) {
                setGroupMemberDropdownOpen(false);
            }
        };
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                setContextMenu(null);
                setAssignerDropdownOpen(false);
                setParticipantDropdownOpen(false);
                setGroupMemberDropdownOpen(false);
                setAssignerView('flat');
                setExpandedGroupId(null);
            }
        };
        // Use capture phase on mousedown so clicks anywhere inside modal or page
        // trigger closing of dropdowns, regardless of any stopPropagation
        document.addEventListener('mousedown', handleClickOutside, true);
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside, true);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

    // ── RIGHT-CLICK CONTEXT HANDLER (TYPE 1 TRIGGER) ──────────────────────
    const handleContextMenu = (e, task = null) => {
        e.preventDefault();
        e.stopPropagation();

        // Viewport collision detection
        const x = Math.min(e.clientX, window.innerWidth - 210);
        const y = Math.min(e.clientY, window.innerHeight - 260);

        setContextMenu({ x, y, task });
    };

    // ── FILTERED USERS FOR SEARCHABLE DROPDOWN ────────────────────────────
    const filteredAssignerUsers = useMemo(() => {
        if (!assignerSearch.trim()) return assignableUsers;
        const q = assignerSearch.toLowerCase();
        return assignableUsers.filter(u =>
            (u.name || '').toLowerCase().includes(q) ||
            (u.email || '').toLowerCase().includes(q)
        );
    }, [assignableUsers, assignerSearch]);

    // Filtered groups for assignee dropdown
    const filteredAssignerGroups = useMemo(() => {
        if (!assignerSearch.trim()) return groups;
        const q = assignerSearch.toLowerCase();
        return groups.filter(g => (g.name || '').toLowerCase().includes(q));
    }, [groups, assignerSearch]);

    // Filtered users for participant dropdown
    const filteredParticipantUsers = useMemo(() => {
        if (!participantSearch.trim()) return assignableUsers;
        const q = participantSearch.toLowerCase();
        return assignableUsers.filter(u =>
            (u.name || '').toLowerCase().includes(q) ||
            (u.email || '').toLowerCase().includes(q)
        );
    }, [assignableUsers, participantSearch]);

    // Filtered users for group member dropdown
    const filteredGroupUsers = useMemo(() => {
        if (!groupMemberSearch.trim()) return assignableUsers;
        const q = groupMemberSearch.toLowerCase();
        return assignableUsers.filter(u =>
            (u.name || '').toLowerCase().includes(q) ||
            (u.email || '').toLowerCase().includes(q)
        );
    }, [assignableUsers, groupMemberSearch]);

    // ── ASSIGNEE ACTIONS — GitHub-style toggle ────────────────────────────
    const handleToggleAssignee = (u) => {
        if (u === 'self') {
            setSelectedAssignees([{ id: 'self', name: '@self (Reminder)', isSelf: true }]);
            setActiveGroupId(null);
        } else {
            setSelectedAssignees(prev => {
                const clean = prev.filter(a => !a.isSelf);
                if (clean.some(a => a.id === u.id)) {
                    // deselect
                    return clean.filter(a => a.id !== u.id);
                }
                return [...clean, { id: u.id, name: u.name, email: u.email }];
            });
            setActiveGroupId(null); // manual change — no longer tied to a group
        }
    };

    // ── POPULATE/TOGGLE GROUP — FIX: replace group members, not merge ─────
    const handleToggleGroup = (groupId) => {
        const group = groups.find(g => String(g.id) === String(groupId));
        if (!group || !Array.isArray(group.members)) return;

        if (String(activeGroupId) === String(groupId)) {
            // Deselect: remove all members of this group
            const memberIds = new Set(group.members.map(m => m.id));
            setSelectedAssignees(prev => prev.filter(a => !memberIds.has(a.id)));
            setActiveGroupId(null);
        } else {
            // Select group: REPLACE current assignees with this group's members exactly
            setActiveGroupId(groupId);
            setSelectedAssignees(group.members.map(m => ({
                id: m.id, name: m.name, email: m.email, fromGroup: group.name
            })));
        }
    };

    const handleRemoveAssignee = (assigneeId) => {
        setSelectedAssignees(prev => prev.filter(a => a.id !== assigneeId));
        setActiveGroupId(null); // manual deselect breaks group binding
    };

    // ── CREATE & SAVE GROUP ───────────────────────────────────────────────
    const handleCreateGroup = async (e) => {
        if (e) e.preventDefault();
        if (!newGroupName.trim()) {
            setModalError('Group name is required.');
            return;
        }
        if (newGroupMembers.length === 0) {
            setModalError('Select at least one user member for the group.');
            return;
        }
        try {
            setIsSavingGroup(true);
            setModalError('');
            await taskApi.createGroup({
                name: newGroupName.trim(),
                member_ids: newGroupMembers
            });
            await fetchGroups();

            // After saving, replace assignees with the new group members
            const membersToAdd = assignableUsers.filter(u => newGroupMembers.includes(u.id));
            setSelectedAssignees(membersToAdd.map(m => ({ id: m.id, name: m.name, email: m.email, fromGroup: newGroupName.trim() })));

            setNewGroupName('');
            setNewGroupMembers([]);
            setGroupMemberSearch('');
            setGroupMemberDropdownOpen(false);
            setShowCreateGroup(false);
        } catch (err) {
            console.error('Failed to create group:', err);
            setModalError(err.message || 'Failed to create group');
        } finally {
            setIsSavingGroup(false);
        }
    };

    // ── FILTERED & GROUPED TASKS ──────────────────────────────────────────
    const counts = useMemo(() => {
        return {
            all: tasks.length,
            pinned: tasks.filter(t => t.is_pinned).length,
            common: tasks.filter(t => t.category === 'common').length,
            general: tasks.filter(t => t.category === 'general').length,
        };
    }, [tasks]);

    const filteredTasks = useMemo(() => {
        return tasks.filter(t => {
            // Group tab filter
            if (activeTab === 'common' && t.category !== 'common') return false;
            if (activeTab === 'general' && t.category !== 'general') return false;
            if (activeTab === 'pinned' && !t.is_pinned) return false;

            // Status filter
            if (statusFilter !== 'all' && (t.status || '').toLowerCase() !== statusFilter.toLowerCase()) return false;

            // Search filter
            if (search.trim()) {
                const q = search.toLowerCase();
                const matchTitle = (t.title || '').toLowerCase().includes(q);
                const matchDesc = (t.description || '').toLowerCase().includes(q);
                const matchSeq = (t.task_seq || '').toLowerCase().includes(q);
                const matchAssigned = (t.assigned_name || '').toLowerCase().includes(q);
                const matchAssignees = (t.assignees || []).some(a => (a.name || '').toLowerCase().includes(q));
                if (!matchTitle && !matchDesc && !matchSeq && !matchAssigned && !matchAssignees) return false;
            }

            return true;
        });
    }, [tasks, activeTab, statusFilter, search]);

    // ── CREATE TASK SUBMISSION ────────────────────────────────────────────
    const handleCreateTask = async (e) => {
        e.preventDefault();
        if (!newTaskTitle.trim()) {
            setModalError('Task title is required.');
            return;
        }

        try {
            setIsSubmittingTask(true);
            setModalError('');

            const realAssignees = selectedAssignees.filter(a => !a.isSelf).map(a => a.id);
            const primaryAssignee = realAssignees[0] || null;

            const payload = {
                title: newTaskTitle.trim(),
                description: newTaskDesc.trim() || null,
                category: newTaskCategory,
                due_date: newTaskDueDate ? new Date(newTaskDueDate).toISOString() : null,
                assigned_to: primaryAssignee,
                assignees: realAssignees,
                participants: newTaskParticipants
            };

            await taskApi.createTask(payload);

            // Reset form
            setNewTaskTitle('');
            setNewTaskDesc('');
            setNewTaskCategory('general');
            setNewTaskDueDate('');
            setSelectedAssignees([]);
            setAssignerSearch('');
            setNewTaskParticipants([]);
            setShowCreateModal(false);

            // Reload tasks
            await fetchTasks();
        } catch (err) {
            console.error('Task creation error:', err);
            setModalError(err.message || 'Failed to create task.');
        } finally {
            setIsSubmittingTask(false);
        }
    };

    // ── PIN / UNPIN TASK ──────────────────────────────────────────────────
    const handleTogglePin = async (task, e) => {
        if (e) e.stopPropagation();
        try {
            if (task.is_pinned) {
                await taskApi.unpinTask(task.id);
            } else {
                await taskApi.pinTask(task.id);
            }
            setTasks(prev => prev.map(t => t.id === task.id ? { ...t, is_pinned: !t.is_pinned } : t));
        } catch (err) {
            console.error('Error toggling pin:', err);
        }
    };

    // ── STATUS TRANSITION (With Image 2 Rules) ────────────────────────────
    const handleStatusChange = async (task, newStatus, e) => {
        if (e) e.stopPropagation();
        try {
            // Image 2 Rule: "cancelled applicable only for self made requests"
            if (newStatus === 'cancelled') {
                const isCreator = task.created_by === user?.id;
                const isAdmin = user?.role === 'Super Admin' || user?.role === 'Admin';
                if (!isCreator && !isAdmin) {
                    alert('Cancelled is only applicable for self-made requests.');
                    return;
                }
            }

            // Image 2 Rule: "Approved only when the user is the approver role"
            if (newStatus === 'approved') {
                const isApproverParticipant = (task.participants || []).some(
                    p => p.user_id === user?.id && p.role === 'approver'
                );
                const hasApproverRole = user?.role === 'Approver' || user?.role === 'Super Admin';
                if (!isApproverParticipant && !hasApproverRole) {
                    alert('Approved is only allowed when the user has the Approver role.');
                    return;
                }
            }

            await taskApi.updateStatus(task.id, newStatus);
            await fetchTasks();
        } catch (err) {
            console.error('Error updating status:', err);
            alert(err.message || 'Failed to update status');
        }
    };

    // ── PERMISSION CHECK: Task Deletion (Author or Super Admin only) ────
    const canDeleteTask = (task) => {
        if (!task || !user) return false;
        const isAuthor = task.created_by && String(task.created_by) === String(user.id);
        const isSuperAdmin =
            user.isSuperAdmin === true ||
            (user.role || '').toLowerCase() === 'super admin' ||
            (user.role || '').toLowerCase() === 'super_admin' ||
            (Array.isArray(user.roles) && user.roles.some(r => {
                const rName = (typeof r === 'string' ? r : r.role_name || '').toLowerCase();
                return rName === 'super admin' || rName === 'super_admin';
            }));
        return Boolean(isAuthor || isSuperAdmin);
    };

    // ── DELETE TASK ───────────────────────────────────────────────────────
    const handleDeleteTask = async (task, e) => {
        if (e) e.stopPropagation();
        if (!canDeleteTask(task)) {
            alert('Only the author of this task or a Super Admin can delete it.');
            return;
        }
        if (!window.confirm(`Are you sure you want to delete task ${task.task_seq || `#${task.id}`}?`)) return;
        try {
            await taskApi.deleteTask(task.id);
            setTasks(prev => prev.filter(t => t.id !== task.id));
        } catch (err) {
            console.error('Error deleting task:', err);
            alert(err.message || 'Failed to delete task.');
        }
    };

    // ── ADD PARTICIPANT TO NEW TASK ───────────────────────────────────────
    const handleAddParticipant = (userId, role) => {
        const uid = userId || newTaskParticipantUser;
        const rl = role || newTaskParticipantRole;
        if (!uid) return;
        if (newTaskParticipants.some(p => p.user_id === uid)) return;
        setNewTaskParticipants(prev => [...prev, { user_id: uid, role: rl }]);
        setNewTaskParticipantUser('');
        setParticipantSearch('');
        setParticipantDropdownOpen(false);
    };

    const handleRemoveParticipant = (userId) => {
        setNewTaskParticipants(prev => prev.filter(p => p.user_id !== userId));
    };

    // ── TOGGLE EXPAND ROW (Image 4 Date Log Sub-table) ────────────────────
    const toggleExpandRow = (taskId) => {
        setExpandedTaskIds(prev => {
            const next = new Set(prev);
            if (next.has(taskId)) next.delete(taskId);
            else next.add(taskId);
            return next;
        });
    };

    // ── ADD COMMENT / LOG ENTRY TO EXPANDED TASK ──────────────────────────
    const handleAddComment = async (taskId) => {
        const comment = commentInputs[taskId]?.trim();
        if (!comment) return;
        try {
            await taskApi.addComment(taskId, comment);
            setCommentInputs(prev => ({ ...prev, [taskId]: '' }));
            await fetchTasks();
        } catch (err) {
            console.error('Error adding comment:', err);
        }
    };

    return (
        <div
            className="task-workspace-container"
            onContextMenu={(e) => handleContextMenu(e, null)}
        >
            {/* ── HEADER ── */}
            <div className="task-workspace-header">
                <div className="task-header-title-group">
                    <h2 className="task-header-title">
                        {/* <ListTodo size={24} style={{ color: 'var(--btn-primary-bg, #0057B8)' }} /> */}
                        <span>Library Workspace — Task List</span>
                    </h2>
                    <p className="task-header-subtitle">
                        Create, track, and assign operational policy tasks with detailed date logs and status transitions.
                    </p>
                </div>

                <div className="task-header-actions"> 
                    <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={fetchTasks}
                        title="Refresh Tasks"
                    >
                        <RotateCw size={15} />
                    </button>
                    <button
                        type="button"
                        className="btn btn-primary"
                        onClick={() => setShowCreateModal(true)}
                    >
                        <Plus size={16} />
                        <span>New Task</span>
                    </button>
                </div>
            </div>

            {/* ── TABS & CONTROLS (Common, Pinned, General) ── */}
            <div className="task-controls-bar">
                <div className="task-tabs-group">
                    <button
                        type="button"
                        className={`task-tab-btn ${activeTab === 'all' ? 'active' : ''}`}
                        onClick={() => setActiveTab('all')}
                    >
                        <span>All Tasks</span>
                        <span className="task-tab-badge">{counts.all}</span>
                    </button>
                    <button
                        type="button"
                        className={`task-tab-btn ${activeTab === 'pinned' ? 'active' : ''}`}
                        onClick={() => setActiveTab('pinned')}
                    >
                        <Pin size={13} />
                        <span>Pinned</span>
                        <span className="task-tab-badge">{counts.pinned}</span>
                    </button>
                    <button
                        type="button"
                        className={`task-tab-btn ${activeTab === 'common' ? 'active' : ''}`}
                        onClick={() => setActiveTab('common')}
                    >
                        <Bookmark size={13} />
                        <span>Common</span>
                        <span className="task-tab-badge">{counts.common}</span>
                    </button>
                    <button
                        type="button"
                        className={`task-tab-btn ${activeTab === 'general' ? 'active' : ''}`}
                        onClick={() => setActiveTab('general')}
                    >
                        <FileText size={13} />
                        <span>General</span>
                        <span className="task-tab-badge">{counts.general}</span>
                    </button>
                </div>

                <div className="task-filter-group">
                    <div className="task-search-input-wrap">
                        <Search size={14} />
                        <input
                            type="text"
                            className="task-search-input"
                            placeholder="Search tasks, ID, owner…"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    <select
                        className="task-status-filter-select"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="all">All Statuses</option>
                        <option value="responded">Responded</option>
                        <option value="completed">Completed</option>
                        <option value="approved">Approved</option>
                        <option value="reassigned">Reassigned</option>
                        <option value="cancelled">Cancelled</option>
                    </select>
                </div>
            </div>

            {/* ── RESPONSIVE TASK TABLE ── */}
            <div className="task-table-wrapper">
                <div className="task-table-scroll">
                    <table className="task-table">
                        <thead>
                            <tr>
                                <th style={{ width: '40px' }}></th>
                                <th style={{ width: '90px' }}>Task ID</th>
                                <th style={{ width: '115px' }}>Date Log</th>
                                <th style={{ width: '125px' }}>Due Date</th>
                                <th style={{ width: '160px' }}>Assigned To</th>
                                <th style={{ width: '120px' }}>Status</th>
                                <th>Task Description</th>
                                <th style={{ width: '90px' }}>Category</th>
                                <th style={{ width: '110px', textAlign: 'center' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="9" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                                        Loading tasks…
                                    </td>
                                </tr>
                            ) : filteredTasks.length === 0 ? (
                                <tr>
                                    <td colSpan="9">
                                        <div className="task-empty-state">
                                            <div className="task-empty-icon">
                                                <ListTodo size={28} />
                                            </div>
                                            <h4 style={{ margin: 0, color: '#0f172a' }}>No tasks found</h4>
                                            <p style={{ margin: 0, fontSize: '13px' }}>
                                                Right-click anywhere or click "New Task" to create one.
                                            </p>
                                            <button
                                                type="button"
                                                className="btn btn-primary"
                                                style={{ marginTop: '8px' }}
                                                onClick={() => setShowCreateModal(true)}
                                            >
                                                <Plus size={15} /> Create Task
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredTasks.map((t) => {
                                    const isExpanded = expandedTaskIds.has(t.id);
                                    const latestDate = t.created_at
                                        ? new Date(t.created_at).toLocaleDateString('en-US', {
                                              month: '2-digit',
                                              day: '2-digit',
                                              year: 'numeric'
                                          })
                                        : '—';

                                    return (
                                        <React.Fragment key={t.id}>
                                            <tr
                                                className={isExpanded ? 'task-row-expanded' : ''}
                                                onClick={() => toggleExpandRow(t.id)}
                                                onContextMenu={(e) => handleContextMenu(e, t)}
                                            >
                                                {/* Expand Chevron */}
                                                <td style={{ textAlign: 'center', paddingRight: 0 }}>
                                                    {isExpanded ? (
                                                        <ChevronDown size={15} style={{ color: '#0057B8' }} />
                                                    ) : (
                                                        <ChevronRight size={15} style={{ color: '#94a3b8' }} />
                                                    )}
                                                </td>

                                                {/* Task ID */}
                                                <td>
                                                    <span className="task-id-badge">{t.task_seq || `#${t.id}`}</span>
                                                </td>

                                                {/* Date Log (Image 4) */}
                                                <td className="task-date-cell">
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                        <Clock size={12} />
                                                        <span>{latestDate}</span>
                                                    </div>
                                                </td>

                                                {/* Due Date */}
                                                <td className="task-date-cell">
                                                    {t.due_date ? (
                                                        (() => {
                                                            const dueDateObj = new Date(t.due_date);
                                                            const isOverdue = dueDateObj < new Date() && !['completed', 'approved', 'cancelled'].includes((t.status || '').toLowerCase());
                                                            const dueDateStr = dueDateObj.toLocaleDateString('en-US', {
                                                                month: '2-digit',
                                                                day: '2-digit',
                                                                year: 'numeric'
                                                            });
                                                            return (
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: isOverdue ? '#dc2626' : '#475569', fontWeight: isOverdue ? 600 : 500 }}>
                                                                    <Calendar size={12} style={{ color: isOverdue ? '#dc2626' : '#64748b' }} />
                                                                    <span>{dueDateStr}</span>
                                                                    {isOverdue && (
                                                                        <span style={{ fontSize: '10px', background: '#fee2e2', color: '#dc2626', padding: '1px 5px', borderRadius: '4px' }}>
                                                                            Overdue
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            );
                                                        })()
                                                    ) : (
                                                        <span style={{ color: '#94a3b8', fontSize: '12px' }}>—</span>
                                                    )}
                                                </td>

                                                {/* Assigned to / Owner — multi-assignee support */}
                                                <td>
                                                    {t.assignees && t.assignees.length > 0 ? (
                                                        <div className="task-owner-multi">
                                                            {t.assignees.slice(0, 2).map(a => (
                                                                <span key={a.id} className={`task-owner-pill ${a.id === user?.id ? 'self' : ''}`}>
                                                                    <User size={11} />
                                                                    <span>@{a.name}</span>
                                                                </span>
                                                            ))}
                                                            {t.assignees.length > 2 && (
                                                                <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>
                                                                    +{t.assignees.length - 2}
                                                                </span>
                                                            )}
                                                        </div>
                                                    ) : t.assigned_name ? (
                                                        <span className={`task-owner-pill ${t.assigned_to === user?.id ? 'self' : ''}`}>
                                                            <User size={11} />
                                                            <span>@{t.assigned_name}</span>
                                                        </span>
                                                    ) : (
                                                        <span className="task-owner-pill self">
                                                            <User size={11} />
                                                            <span>@self</span>
                                                        </span>
                                                    )}
                                                </td>

                                                {/* Status (Image 4) */}
                                                <td>
                                                    <span className={`task-status-badge ${(t.status || 'responded').toLowerCase()}`}>
                                                        <CheckCircle2 size={11} />
                                                        <span>{t.status || 'Responded'}</span>
                                                    </span>
                                                </td>

                                                {/* Task Title & Description */}
                                                <td className="task-desc-cell">
                                                    <span className="task-title-text">{t.title}</span>
                                                    {t.description && (
                                                        <p className="task-desc-snippet">{t.description}</p>
                                                    )}
                                                    {t.section_id && (
                                                        <span className="task-context-ref">
                                                            <FileText size={10} /> Ref: {t.section_id}
                                                        </span>
                                                    )}
                                                </td>

                                                {/* Category / Group (Image 1) */}
                                                <td>
                                                    <span className={`task-cat-badge ${t.category || 'general'}`}>
                                                        {t.category || 'general'}
                                                    </span>
                                                </td>

                                                {/* Actions */}
                                                <td onClick={(e) => e.stopPropagation()}>
                                                    <div className="task-actions-cell" style={{ justifyContent: 'center' }}>
                                                        <button
                                                            type="button"
                                                            className={`task-icon-btn ${t.is_pinned ? 'pinned' : ''}`}
                                                            onClick={(e) => handleTogglePin(t, e)}
                                                            title={t.is_pinned ? 'Unpin Task' : 'Pin Task'}
                                                        >
                                                            <Pin size={14} />
                                                        </button>
                                                        {canDeleteTask(t) && (
                                                            <button
                                                                type="button"
                                                                className="task-icon-btn danger"
                                                                onClick={(e) => handleDeleteTask(t, e)}
                                                                title="Delete Task"
                                                            >
                                                                <Trash2 size={14} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>

                                            {/* ── EXPANDABLE AUDIT LOG TABLE (Image 4 Bottom Table) ── */}
                                            {isExpanded && (
                                                <tr className="task-history-row">
                                                    <td colSpan="9">
                                                        <div className="task-history-container">
                                                            <div className="task-history-header">
                                                                <span className="task-history-title">
                                                                    <Clock size={13} />
                                                                    Task History &amp; Date Logs (Audit Trail)
                                                                </span>
                                                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                                    <span style={{ fontSize: '11px', color: '#64748b' }}>Change Status:</span>
                                                                    <select
                                                                        value={t.status || 'responded'}
                                                                        onChange={(e) => handleStatusChange(t, e.target.value)}
                                                                        style={{ padding: '3px 8px', fontSize: '11px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                                                                    >
                                                                        <option value="responded">Responded</option>
                                                                        <option value="completed">Completed</option>
                                                                        <option value="approved">Approved  </option>
                                                                        <option value="reassigned">Reassigned</option>
                                                                        <option value="cancelled">Cancelled</option>
                                                                    </select>
                                                                </div>
                                                            </div>

                                                            {/* Sub-table matching Image 4 */}
                                                            <table className="task-history-table">
                                                                <thead>
                                                                    <tr>
                                                                        <th style={{ width: '80px' }}>TaskId</th>
                                                                        <th style={{ width: '110px' }}>Date</th>
                                                                        <th style={{ width: '130px' }}>Status</th>
                                                                        <th style={{ width: '160px' }}>Owner</th>
                                                                        <th>Comment</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    {t.history_logs && t.history_logs.length > 0 ? (
                                                                        t.history_logs.map((log, lIdx) => {
                                                                            const isDone = log.status?.toLowerCase() === 'completed';
                                                                            const dateStr = log.date
                                                                                ? new Date(log.date).toLocaleDateString('en-US')
                                                                                : '—';
                                                                            return (
                                                                                <tr key={log.id || lIdx} className={isDone ? 'completed-log' : ''}>
                                                                                    <td>{lIdx === 0 ? (t.task_seq || t.id) : ''}</td>
                                                                                    <td>{dateStr}</td>
                                                                                    <td>
                                                                                        <span className={`task-status-badge ${(log.status || '').toLowerCase()}`}>
                                                                                            {log.status}
                                                                                        </span>
                                                                                    </td>
                                                                                    <td>@{log.owner}</td>
                                                                                    <td>{log.comment || '—'}</td>
                                                                                </tr>
                                                                            );
                                                                        })
                                                                    ) : (
                                                                        <tr>
                                                                            <td>{t.task_seq || t.id}</td>
                                                                            <td>{latestDate}</td>
                                                                            <td>{t.status}</td>
                                                                            <td>@{t.assigned_name || 'self'}</td>
                                                                            <td>Task initiated</td>
                                                                        </tr>
                                                                    )}
                                                                </tbody>
                                                            </table>

                                                            {/* Add Comment / Log Entry */}
                                                            <div className="task-history-add-comment">
                                                                <input
                                                                    type="text"
                                                                    placeholder="Add a date log comment or status note…"
                                                                    value={commentInputs[t.id] || ''}
                                                                    onChange={(e) =>
                                                                        setCommentInputs({ ...commentInputs, [t.id]: e.target.value })
                                                                    }
                                                                    onKeyDown={(e) => {
                                                                        if (e.key === 'Enter') handleAddComment(t.id);
                                                                    }}
                                                                />
                                                                <button
                                                                    type="button"
                                                                    className="btn btn-primary"
                                                                    style={{ padding: '6px 12px', fontSize: '12px' }}
                                                                    onClick={() => handleAddComment(t.id)}
                                                                >
                                                                    <Send size={12} /> Post Log
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                    <LoadMoreOnScroll hasMore={tasksHasMore} loading={loadingMoreTasks} onLoadMore={() => fetchTasks(taskPage + 1, true)} label="Load more tasks" />
                </div>
            </div>

            {/* ── FLOATING RIGHT-CLICK CONTEXT MENU (TRIGGER TYPE 1) ── */}
            {contextMenu && (
                <div
                    ref={contextMenuRef}
                    className="task-context-menu"
                    style={{ left: `${contextMenu.x}px`, top: `${contextMenu.y}px` }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <button
                        type="button"
                        className="task-context-menu-item"
                        onClick={() => {
                            setContextMenu(null);
                            setShowCreateModal(true);
                        }}
                    >
                        <Plus size={14} style={{ color: '#0057B8' }} />
                        <span>New Task  </span>
                    </button>

                    <button
                        type="button"
                        className="task-context-menu-item"
                        onClick={() => {
                            setContextMenu(null);
                            fetchTasks();
                        }}
                    >
                        <RotateCw size={14} />
                        <span>Refresh Tasks</span>
                    </button>

                    {contextMenu.task && (
                        <>
                            <div className="task-context-divider" />
                            <button
                                type="button"
                                className="task-context-menu-item"
                                onClick={() => {
                                    handleTogglePin(contextMenu.task);
                                    setContextMenu(null);
                                }}
                            >
                                <Pin size={14} />
                                <span>{contextMenu.task.is_pinned ? 'Unpin Task' : 'Pin Task'}</span>
                            </button>

                            <button
                                type="button"
                                className="task-context-menu-item"
                                onClick={() => {
                                    toggleExpandRow(contextMenu.task.id);
                                    setContextMenu(null);
                                }}
                            >
                                <Clock size={14} />
                                <span>View History Logs</span>
                            </button>

                            {canDeleteTask(contextMenu.task) && (
                                <button
                                    type="button"
                                    className="task-context-menu-item danger"
                                    onClick={() => {
                                        handleDeleteTask(contextMenu.task);
                                        setContextMenu(null);
                                    }}
                                >
                                    <Trash2 size={14} />
                                    <span>Delete Task</span>
                                </button>
                            )}
                        </>
                    )}
                </div>
            )}

            {/* ── CREATE TASK MODAL — 2-Column Grid Layout ── */}
            {showCreateModal && (
                <div className="task-modal-backdrop" onClick={() => { setShowCreateModal(false); setModalError(''); setShowCreateGroup(false); }}>
                    <div className="task-modal-card" onClick={(e) => e.stopPropagation()}>

                        {/* Header */}
                        <div className="task-modal-header">
                            <h3 className="task-modal-title">
                                <Plus size={18} style={{ color: '#0057B8' }} />
                                <span>Create New Task</span>
                            </h3>
                            <button type="button" className="task-modal-close-btn" onClick={() => setShowCreateModal(false)}>
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleCreateTask}>
                            <div className="task-modal-body">

                                {/* Error Banner */}
                                {modalError && (
                                    <div style={{ gridColumn: '1/-1', padding: '8px 12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', color: '#b91c1c', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <AlertCircle size={14} /> <span>{modalError}</span>
                                    </div>
                                )}

                                {/* ── 2-COLUMN GRID ── */}
                                <div className="task-modal-grid">

                                    {/* ═══ LEFT COLUMN ═══ */}
                                    <div className="task-col-left">

                                        {/* Task Title */}
                                        <div className="task-form-group">
                                            <label>Task Title *</label>
                                            <input
                                                type="text"
                                                className="task-form-input"
                                                placeholder="e.g. Complete APRA CPS 234 Review Clauses"
                                                value={newTaskTitle}
                                                onChange={(e) => setNewTaskTitle(e.target.value)}
                                                required
                                                autoFocus
                                            />
                                        </div>

                                        {/* Task Category Toggle & Due Date */}
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                            <div className="task-form-group">
                                                <label>Task Category</label>
                                                <div className="task-category-toggle">
                                                    <button
                                                        type="button"
                                                        className={`task-cat-option ${newTaskCategory === 'general' ? 'active' : ''}`}
                                                        onClick={() => setNewTaskCategory('general')}
                                                    >
                                                        <FileText size={14} /> <span>General</span>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className={`task-cat-option ${newTaskCategory === 'common' ? 'active' : ''}`}
                                                        onClick={() => setNewTaskCategory('common')}
                                                    >
                                                        <Bookmark size={14} /> <span>Common</span>
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="task-form-group">
                                                <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                    <Calendar size={13} style={{ color: '#0057B8' }} />
                                                    <span>Due Date</span>
                                                </label>
                                                <input
                                                    type="date"
                                                    className="task-form-input"
                                                    value={newTaskDueDate}
                                                    onChange={(e) => setNewTaskDueDate(e.target.value)}
                                                    min={new Date().toISOString().split('T')[0]}
                                                    style={{ fontSize: '12px' }}
                                                />
                                            </div>
                                        </div>

                                        {/* ── ASSIGNED TO — GitHub-style unified dropdown (users + groups) ── */}
                                        <div className="task-form-group">
                                            <label>Assigned To <span style={{ fontWeight: 400, color: '#94a3b8' }}>(search users or pick a group)</span></label>

                                            <div className="task-search-select-wrapper" ref={assignerRef}>
                                                {/* Search input with toggle chevron & quick Done button */}
                                                <div className="task-search-input-container" style={{ position: 'relative' }}>
                                                    <Search size={14} className="search-icon" />
                                                    <input
                                                        type="text"
                                                        className="task-form-input task-search-input"
                                                        style={{ paddingRight: assignerDropdownOpen ? '90px' : '36px' }}
                                                        placeholder={assignerView === 'group' ? `Members of "${groups.find(g => String(g.id) === String(expandedGroupId))?.name}"` : 'Search users or groups…'}
                                                        value={assignerSearch}
                                                        onChange={(e) => { setAssignerSearch(e.target.value); setAssignerDropdownOpen(true); }}
                                                        onFocus={() => setAssignerDropdownOpen(true)}
                                                        onClick={(e) => { e.stopPropagation(); setAssignerDropdownOpen(true); }}
                                                    />
                                                    <div style={{ position: 'absolute', right: '6px', top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                        {assignerDropdownOpen && (
                                                            <button
                                                                type="button"
                                                                style={{
                                                                    background: '#e0f2fe',
                                                                    color: '#0057B8',
                                                                    border: '1px solid #bfdbfe',
                                                                    borderRadius: '4px',
                                                                    padding: '2px 8px',
                                                                    fontSize: '11px',
                                                                    fontWeight: 600,
                                                                    cursor: 'pointer',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    gap: '3px',
                                                                    height: '24px'
                                                                }}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setAssignerDropdownOpen(false);
                                                                    setAssignerView('flat');
                                                                    setExpandedGroupId(null);
                                                                }}
                                                                title="Close dropdown"
                                                            >
                                                                <Check size={12} /> Done
                                                            </button>
                                                        )}
                                                        <button
                                                            type="button"
                                                            style={{
                                                                background: 'none',
                                                                border: 'none',
                                                                cursor: 'pointer',
                                                                padding: '4px',
                                                                color: '#64748b',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center'
                                                            }}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setAssignerDropdownOpen(prev => !prev);
                                                            }}
                                                            title={assignerDropdownOpen ? 'Close dropdown' : 'Open dropdown'}
                                                        >
                                                            <ChevronDown size={14} style={{ transform: assignerDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s ease' }} />
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Unified dropdown — GitHub style */}
                                                {assignerDropdownOpen && (
                                                    <div className="task-search-dropdown-menu" onClick={(e) => e.stopPropagation()}>
                                                        {/* Header bar with counter and Done button */}
                                                        <div className="task-search-dropdown-header">
                                                            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                                <Users size={12} style={{ color: '#0057B8' }} />
                                                                <span>Select Assignees ({selectedAssignees.length} selected)</span>
                                                            </span>
                                                             
                                                        </div>

                                                        {/* Scrollable body */}
                                                        <div className="task-search-dropdown-body">
                                                            {/* ── BACK button when inside a group view ── */}
                                                            {assignerView === 'group' && (
                                                                <div
                                                                    className="task-search-item"
                                                                    style={{ color: '#0057B8', fontWeight: 600, borderBottom: '1px solid #f1f5f9', marginBottom: '4px' }}
                                                                    onClick={() => { setAssignerView('flat'); setExpandedGroupId(null); setAssignerSearch(''); }}
                                                                >
                                                                    <ChevronRight size={13} style={{ transform: 'rotate(180deg)' }} />
                                                                    <span style={{ fontSize: '12px' }}>Back to all</span>
                                                                </div>
                                                            )}

                                                            {assignerView === 'flat' && (
                                                                <>
                                                                    {/* @self option */}
                                                                    <div
                                                                        className={`task-search-item ${selectedAssignees.some(a => a.isSelf) ? 'is-selected' : ''}`}
                                                                        onClick={() => handleToggleAssignee('self')}
                                                                    >
                                                                        <div className="task-search-avatar self">@</div>
                                                                        <div className="task-search-item-info">
                                                                            <span className="task-search-item-name">@self</span>
                                                                            <span className="task-search-item-email">Self Reminder</span>
                                                                        </div>
                                                                        {selectedAssignees.some(a => a.isSelf) && <Check size={13} style={{ color: '#0057B8', flexShrink: 0 }} />}
                                                                    </div>

                                                                    {/* ── GROUPS section ── */}
                                                                    {filteredAssignerGroups.length > 0 && (
                                                                        <>
                                                                            <div style={{ padding: '4px 10px', fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.6px', background: '#f8fafc', marginTop: '4px' }}>
                                                                                Groups
                                                                            </div>
                                                                            {filteredAssignerGroups.map(g => {
                                                                                const isActive = String(activeGroupId) === String(g.id);
                                                                                return (
                                                                                    <div key={g.id} className={`task-search-item ${isActive ? 'is-selected' : ''}`}
                                                                                        style={{ justifyContent: 'space-between' }}>
                                                                                        {/* Left — toggle group */}
                                                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}
                                                                                            onClick={() => { handleToggleGroup(g.id); setAssignerDropdownOpen(false); }}>
                                                                                            <div className="task-search-avatar" style={{ background: isActive ? '#dbeafe' : '#e2e8f0', color: isActive ? '#0057B8' : '#475569' }}>
                                                                                                <Users size={12} />
                                                                                            </div>
                                                                                            <div className="task-search-item-info">
                                                                                                <span className="task-search-item-name">{g.name}</span>
                                                                                                <span className="task-search-item-email">{g.members?.length || 0} member{g.members?.length !== 1 ? 's' : ''}</span>
                                                                                            </div>
                                                                                            {isActive && <Check size={13} style={{ color: '#0057B8', flexShrink: 0 }} />}
                                                                                        </div>
                                                                                        {/* Right — expand to see members */}
                                                                                        <button
                                                                                            type="button"
                                                                                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px 6px', color: '#94a3b8', flexShrink: 0 }}
                                                                                            title="See members"
                                                                                            onClick={(e) => { e.stopPropagation(); setAssignerView('group'); setExpandedGroupId(g.id); setAssignerSearch(''); }}
                                                                                        >
                                                                                            <ChevronRight size={13} />
                                                                                        </button>
                                                                                    </div>
                                                                                );
                                                                            })}
                                                                        </>
                                                                    )}

                                                                    {/* ── USERS section ── */}
                                                                    <div style={{ padding: '4px 10px', fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.6px', background: '#f8fafc', marginTop: '4px' }}>
                                                                        Users
                                                                    </div>
                                                                    {filteredAssignerUsers.map(u => {
                                                                        const isSelected = selectedAssignees.some(a => a.id === u.id);
                                                                        return (
                                                                            <div
                                                                                key={u.id}
                                                                                className={`task-search-item ${isSelected ? 'is-selected' : ''}`}
                                                                                onClick={() => handleToggleAssignee(u)}
                                                                            >
                                                                                <div className="task-search-avatar">{(u.name || '?')[0].toUpperCase()}</div>
                                                                                <div className="task-search-item-info">
                                                                                    <span className="task-search-item-name">{u.name}</span>
                                                                                    <span className="task-search-item-email">{u.email}</span>
                                                                                </div>
                                                                                {isSelected && <Check size={13} style={{ color: '#0057B8', flexShrink: 0 }} />}
                                                                            </div>
                                                                        );
                                                                    })}

                                                                    {filteredAssignerUsers.length === 0 && filteredAssignerGroups.length === 0 && assignerSearch && (
                                                                        <div style={{ padding: '10px', fontSize: '12px', color: '#94a3b8', textAlign: 'center' }}>
                                                                            No results for "{assignerSearch}"
                                                                        </div>
                                                                    )}
                                                                </>
                                                            )}

                                                            {/* ── GROUP MEMBER VIEW (expanded from chevron) ── */}
                                                            {assignerView === 'group' && expandedGroupId && (() => {
                                                                const grp = groups.find(g => String(g.id) === String(expandedGroupId));
                                                                const members = (grp?.members || []).filter(m =>
                                                                    !assignerSearch.trim() ||
                                                                    m.name.toLowerCase().includes(assignerSearch.toLowerCase())
                                                                );
                                                                return (
                                                                    <>
                                                                        {/* Toggle whole group */}
                                                                        <div
                                                                            className={`task-search-item ${String(activeGroupId) === String(expandedGroupId) ? 'is-selected' : ''}`}
                                                                            style={{ fontWeight: 700, borderBottom: '1px solid #f1f5f9' }}
                                                                            onClick={() => { handleToggleGroup(expandedGroupId); setAssignerView('flat'); setExpandedGroupId(null); setAssignerDropdownOpen(false); }}
                                                                        >
                                                                            <div className="task-search-avatar" style={{ background: '#dbeafe', color: '#0057B8' }}><Users size={12} /></div>
                                                                            <div className="task-search-item-info">
                                                                                <span className="task-search-item-name">{String(activeGroupId) === String(expandedGroupId) ? '✓ Remove group' : `Assign whole group`}</span>
                                                                                <span className="task-search-item-email">{grp?.members?.length || 0} members</span>
                                                                            </div>
                                                                        </div>
                                                                        {members.map(m => {
                                                                            const isSelected = selectedAssignees.some(a => a.id === m.id);
                                                                            return (
                                                                                <div
                                                                                    key={m.id}
                                                                                    className={`task-search-item ${isSelected ? 'is-selected' : ''}`}
                                                                                    onClick={() => { handleToggleAssignee({ id: m.id, name: m.name, email: m.email }); setActiveGroupId(null); }}
                                                                                >
                                                                                    <div className="task-search-avatar">{(m.name || '?')[0].toUpperCase()}</div>
                                                                                    <div className="task-search-item-info">
                                                                                        <span className="task-search-item-name">{m.name}</span>
                                                                                        <span className="task-search-item-email">{m.email}</span>
                                                                                    </div>
                                                                                    {isSelected && <Check size={13} style={{ color: '#0057B8', flexShrink: 0 }} />}
                                                                                </div>
                                                                            );
                                                                        })}
                                                                        {members.length === 0 && (
                                                                            <div style={{ padding: '10px', fontSize: '12px', color: '#94a3b8', textAlign: 'center' }}>No members match</div>
                                                                        )}
                                                                    </>
                                                                );
                                                            })()}
                                                        </div>

                                                        {/* Fixed footer with Done button to close dropdown */}
                                                        <div className="task-search-dropdown-footer">
                                                            <span style={{ fontSize: '11px', color: '#64748b' }}>
                                                                {selectedAssignees.length} selected
                                                            </span>
                                                            <button
                                                                type="button"
                                                                className="task-dropdown-done-btn"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setAssignerDropdownOpen(false);
                                                                    setAssignerView('flat');
                                                                    setExpandedGroupId(null);
                                                                }}
                                                            >
                                                                Done
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Selected assignee chips */}
                                            {selectedAssignees.length > 0 && (
                                                <div className="task-assignee-chips">
                                                    {activeGroupId && (
                                                        <span style={{ fontSize: '10px', color: '#64748b', alignSelf: 'center', fontWeight: 600 }}>
                                                            <Users size={10} /> {groups.find(g => String(g.id) === String(activeGroupId))?.name}:
                                                        </span>
                                                    )}
                                                    {selectedAssignees.map(a => (
                                                        <span key={a.id} className={`task-assignee-chip ${a.isSelf ? 'self' : ''}`}>
                                                            <User size={11} />
                                                            <span>{a.isSelf ? '@self' : a.name}</span>
                                                            <button type="button" className="task-assignee-chip-remove" onClick={() => handleRemoveAssignee(a.id)}>
                                                                <X size={10} />
                                                            </button>
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {/* Task Description */}
                                        <div className="task-form-group">
                                            <label>Task Description <span style={{ fontWeight: 400, color: '#94a3b8' }}>(Free Field Text)</span></label>
                                            <textarea
                                                className="task-form-input"
                                                rows={4}
                                                placeholder="Key contents, context remarks, or action requirements…"
                                                value={newTaskDesc}
                                                onChange={(e) => setNewTaskDesc(e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    {/* ═══ RIGHT COLUMN ═══ */}
                                    <div className="task-col-right">

                                        {/* ── ASSIGNEE GROUPS — Create & Manage ── */}
                                        <div className="task-form-group">
                                            <label>Assignee Groups <span style={{ fontWeight: 400, color: '#94a3b8' }}>(save teams for reuse)</span></label>

                                            <div className="task-group-section">
                                                <div className="task-group-header">
                                                    <span className="task-group-title">
                                                        <Users size={13} /> Saved Groups
                                                        {groups.length > 0 && (
                                                            <span style={{ background: '#e2e8f0', borderRadius: '10px', padding: '1px 7px', fontSize: '10px', fontWeight: 700 }}>
                                                                {groups.length}
                                                            </span>
                                                        )}
                                                    </span>
                                                    <button type="button" className="task-group-btn" onClick={() => setShowCreateGroup(v => !v)}>
                                                        {showCreateGroup ? '✕ Cancel' : '+ Create Group'}
                                                    </button>
                                                </div>

                                                {/* Existing groups — click to toggle assignees (GitHub-style: replace not merge) */}
                                                {groups.length > 0 && !showCreateGroup && (
                                                    <div className="task-group-pills">
                                                        {groups.map(g => {
                                                            const isActive = String(activeGroupId) === String(g.id);
                                                            return (
                                                                <button
                                                                    key={g.id}
                                                                    type="button"
                                                                    className={`task-group-pill ${isActive ? 'active' : ''}`}
                                                                    title={isActive ? 'Click to deselect group' : `Select all ${g.members?.length || 0} members`}
                                                                    onClick={() => handleToggleGroup(g.id)}
                                                                >
                                                                    {isActive && <Check size={10} />}
                                                                    <Users size={11} />
                                                                    <span>{g.name}</span>
                                                                    <span style={{ opacity: 0.6 }}>({g.members?.length || 0})</span>
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                )}

                                                {groups.length === 0 && !showCreateGroup && (
                                                    <p style={{ fontSize: '11px', color: '#94a3b8', margin: 0 }}>No groups yet. Create one to quickly assign a team.</p>
                                                )}

                                                {/* ── Create Group inline form ── */}
                                                {showCreateGroup && (
                                                    <div className="task-group-form">
                                                        <div className="task-form-group" style={{ gap: '4px' }}>
                                                            <label style={{ fontSize: '11px' }}>Group Name *</label>
                                                            <input
                                                                type="text"
                                                                className="task-form-input"
                                                                placeholder="e.g. Credit Risk Reviewers"
                                                                value={newGroupName}
                                                                onChange={(e) => setNewGroupName(e.target.value)}
                                                                style={{ fontSize: '12px', padding: '7px 10px' }}
                                                            />
                                                        </div>
                                                        <div className="task-form-group" style={{ gap: '4px' }}>
                                                            <label style={{ fontSize: '11px' }}>
                                                                Select Members * <span style={{ fontWeight: 400, color: '#94a3b8' }}>({newGroupMembers.length} selected)</span>
                                                            </label>

                                                            {/* Searchable member dropdown with toggle and Done button */}
                                                            <div className="task-search-select-wrapper" ref={groupMemberRef}>
                                                                <div className="task-search-input-container" style={{ position: 'relative' }}>
                                                                    <Search size={13} className="search-icon" />
                                                                    <input
                                                                        type="text"
                                                                        className="task-form-input task-search-input"
                                                                        style={{ paddingRight: groupMemberDropdownOpen ? '90px' : '36px', fontSize: '12px' }}
                                                                        placeholder="Search members to add…"
                                                                        value={groupMemberSearch}
                                                                        onChange={(e) => {
                                                                            setGroupMemberSearch(e.target.value);
                                                                            setGroupMemberDropdownOpen(true);
                                                                        }}
                                                                        onFocus={() => setGroupMemberDropdownOpen(true)}
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setGroupMemberDropdownOpen(true);
                                                                        }}
                                                                    />
                                                                    <div style={{ position: 'absolute', right: '6px', top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                                        {groupMemberDropdownOpen && (
                                                                            <button
                                                                                type="button"
                                                                                style={{
                                                                                    background: '#e0f2fe',
                                                                                    color: '#0057B8',
                                                                                    border: '1px solid #bfdbfe',
                                                                                    borderRadius: '4px',
                                                                                    padding: '2px 8px',
                                                                                    fontSize: '11px',
                                                                                    fontWeight: 600,
                                                                                    cursor: 'pointer',
                                                                                    display: 'flex',
                                                                                    alignItems: 'center',
                                                                                    gap: '3px',
                                                                                    height: '24px'
                                                                                }}
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    setGroupMemberDropdownOpen(false);
                                                                                }}
                                                                                title="Done (Close dropdown)"
                                                                            >
                                                                                <Check size={12} /> Done
                                                                            </button>
                                                                        )}
                                                                        <button
                                                                            type="button"
                                                                            style={{
                                                                                background: 'none',
                                                                                border: 'none',
                                                                                cursor: 'pointer',
                                                                                padding: '4px',
                                                                                color: '#64748b',
                                                                                display: 'flex',
                                                                                alignItems: 'center',
                                                                                justifyContent: 'center'
                                                                            }}
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                setGroupMemberDropdownOpen(prev => !prev);
                                                                            }}
                                                                            title={groupMemberDropdownOpen ? 'Close dropdown' : 'Open dropdown'}
                                                                        >
                                                                            <ChevronDown size={14} style={{ transform: groupMemberDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s ease' }} />
                                                                        </button>
                                                                    </div>
                                                                </div>

                                                                {groupMemberDropdownOpen && (
                                                                    <div className="task-search-dropdown-menu" onClick={(e) => e.stopPropagation()}>
                                                                        {/* Header bar */}
                                                                        <div className="task-search-dropdown-header">
                                                                            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                                                <Users size={12} style={{ color: '#0057B8' }} />
                                                                                <span>Select Members ({newGroupMembers.length} selected)</span>
                                                                            </span> 
                                                                        </div>

                                                                        {/* Scrollable body */}
                                                                        <div className="task-search-dropdown-body">
                                                                            {filteredGroupUsers.map(u => {
                                                                                const isMember = newGroupMembers.includes(u.id);
                                                                                return (
                                                                                    <div
                                                                                        key={u.id}
                                                                                        className={`task-search-item ${isMember ? 'is-selected' : ''}`}
                                                                                        onClick={() => {
                                                                                            setNewGroupMembers(prev =>
                                                                                                isMember ? prev.filter(id => id !== u.id) : [...prev, u.id]
                                                                                            );
                                                                                        }}
                                                                                    >
                                                                                        <div className="task-search-avatar">
                                                                                            {(u.name || '?')[0].toUpperCase()}
                                                                                        </div>
                                                                                        <div className="task-search-item-info">
                                                                                            <span className="task-search-item-name">{u.name}</span>
                                                                                            <span className="task-search-item-email">{u.email}</span>
                                                                                        </div>
                                                                                        {isMember && <Check size={13} style={{ color: '#0057B8', flexShrink: 0 }} />}
                                                                                    </div>
                                                                                );
                                                                            })}
                                                                            {filteredGroupUsers.length === 0 && (
                                                                                <div style={{ padding: '10px', fontSize: '12px', color: '#94a3b8', textAlign: 'center' }}>
                                                                                    No users match "{groupMemberSearch}"
                                                                                </div>
                                                                            )}
                                                                        </div>

                                                                        {/* Fixed footer with Done button to close dropdown */}
                                                                        <div className="task-search-dropdown-footer">
                                                                            <span style={{ fontSize: '11px', color: '#64748b' }}>
                                                                                {newGroupMembers.length} selected
                                                                            </span>
                                                                            <button
                                                                                type="button"
                                                                                className="task-dropdown-done-btn"
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    setGroupMemberDropdownOpen(false);
                                                                                }}
                                                                            >
                                                                                Done
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>

                                                            {/* Selected members chips */}
                                                            {newGroupMembers.length > 0 && (
                                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginTop: '4px' }}>
                                                                    {newGroupMembers.map(uid => {
                                                                        const u = assignableUsers.find(user => user.id === uid);
                                                                        return (
                                                                            <span
                                                                                key={uid}
                                                                                style={{
                                                                                    display: 'inline-flex',
                                                                                    alignItems: 'center',
                                                                                    gap: '4px',
                                                                                    padding: '2px 8px',
                                                                                    borderRadius: '12px',
                                                                                    fontSize: '11px',
                                                                                    fontWeight: 600,
                                                                                    background: '#eff6ff',
                                                                                    border: '1px solid #bfdbfe',
                                                                                    color: '#0057B8'
                                                                                }}
                                                                            >
                                                                                <User size={10} />
                                                                                <span>{u?.name || 'User'}</span>
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => setNewGroupMembers(prev => prev.filter(id => id !== uid))}
                                                                                    style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', color: '#64748b' }}
                                                                                >
                                                                                    <X size={10} />
                                                                                </button>
                                                                            </span>
                                                                        );
                                                                    })}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <button
                                                            type="button"
                                                            className="btn btn-primary"
                                                            style={{ fontSize: '12px', padding: '6px 14px', alignSelf: 'flex-start' }}
                                                            disabled={isSavingGroup || !newGroupName.trim() || newGroupMembers.length === 0}
                                                            onClick={handleCreateGroup}
                                                        >
                                                            {isSavingGroup ? 'Saving…' : 'Save & Assign Group'}
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* ── PARTICIPANTS & ROLES — Searchable dropdown ── */}
                                        <div className="task-form-group">
                                            <label>Task Roles &amp; Participants
                                                <span style={{ fontWeight: 400, color: '#94a3b8', marginLeft: 4 }}>(Approver, Reviewer, For Info)</span>
                                            </label>

                                            {/* Searchable participant picker */}
                                            <div style={{ display: 'flex', gap: '7px', alignItems: 'flex-start' }}>
                                                <div className="task-search-select-wrapper" ref={participantRef} style={{ flex: 1 }}>
                                                    {newTaskParticipantUser ? (
                                                        <div style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'space-between',
                                                            padding: '0 10px',
                                                            height: '38px',
                                                            background: '#eff6ff',
                                                            border: '1px solid #bfdbfe',
                                                            borderRadius: '8px',
                                                            fontSize: '12px',
                                                            color: '#0057B8',
                                                            boxSizing: 'border-box'
                                                        }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                                <UserCheck size={14} />
                                                                <strong style={{ color: '#1e293b' }}>
                                                                    {assignableUsers.find(u => u.id === newTaskParticipantUser)?.name}
                                                                </strong>
                                                            </div>
                                                            <button
                                                                type="button"
                                                                onClick={() => { setNewTaskParticipantUser(''); setParticipantSearch(''); }}
                                                                style={{
                                                                    border: 'none',
                                                                    background: 'none',
                                                                    cursor: 'pointer',
                                                                    color: '#64748b',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    padding: '2px'
                                                                }}
                                                                title="Change user"
                                                            >
                                                                <X size={13} />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className="task-search-input-container">
                                                            <Search size={13} className="search-icon" />
                                                            <input
                                                                type="text"
                                                                className="task-form-input task-search-input"
                                                                placeholder="Search user to assign role…"
                                                                value={participantSearch}
                                                                onChange={(e) => {
                                                                    setParticipantSearch(e.target.value);
                                                                    setParticipantDropdownOpen(true);
                                                                }}
                                                                onFocus={() => setParticipantDropdownOpen(true)}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setParticipantDropdownOpen(true);
                                                                }}
                                                                style={{ fontSize: '12px' }}
                                                            />
                                                        </div>
                                                    )}

                                                    {participantDropdownOpen && !newTaskParticipantUser && (
                                                        <div className="task-search-dropdown-menu" onClick={(e) => e.stopPropagation()}>
                                                            {filteredParticipantUsers.map(u => {
                                                                const alreadyAdded = newTaskParticipants.some(p => p.user_id === u.id);
                                                                return (
                                                                    <div
                                                                        key={u.id}
                                                                        className={`task-search-item ${alreadyAdded ? '' : ''}`}
                                                                        style={alreadyAdded ? { opacity: 0.45, pointerEvents: 'none', background: '#f8fafc' } : {}}
                                                                        onClick={() => {
                                                                            setNewTaskParticipantUser(u.id);
                                                                            setParticipantSearch('');
                                                                            setParticipantDropdownOpen(false);
                                                                        }}
                                                                    >
                                                                        <div className="task-search-avatar">{(u.name || '?')[0].toUpperCase()}</div>
                                                                        <div className="task-search-item-info">
                                                                            <span className="task-search-item-name">{u.name} {alreadyAdded && '(already added)'}</span>
                                                                            <span className="task-search-item-email">{u.email}</span>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                            {filteredParticipantUsers.length === 0 && (
                                                                <div style={{ padding: '10px', fontSize: '12px', color: '#94a3b8', textAlign: 'center' }}>
                                                                    No users match "{participantSearch}"
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>

                                                <select
                                                    className="task-form-input"
                                                    value={newTaskParticipantRole}
                                                    onChange={(e) => setNewTaskParticipantRole(e.target.value)}
                                                    style={{ width: '100px', fontSize: '12px' }}
                                                >
                                                    <option value="approver">Approver</option>
                                                    <option value="reviewer">Reviewer</option>
                                                    <option value="for_info">For Info</option>
                                                </select>
                                                <button
                                                    type="button"
                                                    className="btn btn-secondary"
                                                    onClick={() => handleAddParticipant(newTaskParticipantUser, newTaskParticipantRole)}
                                                    disabled={!newTaskParticipantUser}
                                                    style={{ fontSize: '12px', padding: '7px 12px', whiteSpace: 'nowrap' }}
                                                >
                                                    Add
                                                </button>
                                            </div>

                                            {/* Participant chips */}
                                            {newTaskParticipants.length > 0 && (
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                                                    {newTaskParticipants.map(p => {
                                                        const uName = assignableUsers.find(u => u.id === p.user_id)?.name || 'User';
                                                        return (
                                                            <span key={p.user_id} className="task-assignee-chip">
                                                                <UserCheck size={11} />
                                                                <strong style={{ fontSize: '11px' }}>{uName}</strong>
                                                                <span style={{ color: '#93c5fd', fontSize: '10px' }}>({p.role})</span>
                                                                <button type="button" className="task-assignee-chip-remove" onClick={() => handleRemoveParticipant(p.user_id)}>
                                                                    <X size={10} />
                                                                </button>
                                                            </span>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>

                                        {/* Quick summary card */}
                                        <div style={{ marginTop: 'auto', padding: '12px 14px', background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '8px', fontSize: '12px', color: '#0369a1', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                            <strong style={{ fontSize: '12px' }}>Task Summary</strong>
                                            <div>Category: <strong>{newTaskCategory}</strong></div>
                                            <div>Due Date: <strong>{newTaskDueDate ? new Date(newTaskDueDate).toLocaleDateString() : 'No due date'}</strong></div>
                                            <div>Assignees: <strong>{selectedAssignees.length === 0 ? '@self' : selectedAssignees.map(a => a.isSelf ? '@self' : a.name).join(', ')}</strong></div>
                                            <div>Participants: <strong>{newTaskParticipants.length}</strong></div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Footer Buttons */}
                            <div className="task-modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)} disabled={isSubmittingTask}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary" disabled={isSubmittingTask}>
                                    <Plus size={15} />
                                    <span>{isSubmittingTask ? 'Creating Task…' : 'Create Task'}</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
