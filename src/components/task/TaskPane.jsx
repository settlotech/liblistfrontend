import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
    ListChecks,
    Search,
    RefreshCw,
    Filter,
    ChevronLeft,
    ChevronRight,
    Pin,
    AlertCircle,
    CheckCircle2,
    Calendar,
    User,
    Clock,
    Layers,
    FileText,
    MousePointerClick
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { taskApi } from '../../services/api/taskApi';
import TaskList from './TaskList';
import TaskCard from './TaskCard';
import TaskContextMenu from './TaskContextMenu';
import CreateTaskDialog from './CreateTaskDialog';
import TaskDetailsPane from './TaskDetailsPane';

/**
 * TaskPane – Primary Task Management Workspace Pane.
 * Supports:
 * - Grouped lists: Common, Pinned, General
 * - Right-click context menu trigger ONLY for task creation
 * - Pin/unpin per user
 * - Searching and status filtering
 * - Pagination controls
 * - Slide-in TaskDetailsPane
 */
export default function TaskPane() {
    const { user, hasPermission } = useAuth();

    // Data states
    const [tasks, setTasks] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [totalTasks, setTotalTasks] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(25);

    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'pending' | 'responded' | 'completed' | 'approved' | 'cancelled'
    const [activeTab, setActiveTab] = useState('all'); // 'all' | 'common' | 'pinned' | 'general'

    // Selected task for details pane
    const [selectedTask, setSelectedTask] = useState(null);

    // Context menu state
    const [contextMenu, setContextMenu] = useState(null); // { x: number, y: number } | null

    // Dialog state
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    // Load tasks from backend
    const loadTasks = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await taskApi.getTasks({
                search: searchQuery,
                page: currentPage,
                limit: pageSize
            });
            if (res?.success) {
                const list = res.data?.tasks || [];
                setTasks(list);
                setTotalTasks(res.data?.total || list.length);

                // If currently open task was modified, update selection
                if (selectedTask) {
                    const updatedSelected = list.find(t => t.id === selectedTask.id);
                    if (updatedSelected) {
                        setSelectedTask(updatedSelected);
                    }
                }
            }
        } catch (err) {
            console.error('Failed to load tasks:', err);
        } finally {
            setIsLoading(false);
        }
    }, [searchQuery, currentPage, pageSize, selectedTask?.id]);

    useEffect(() => {
        loadTasks();
    }, [currentPage, pageSize, searchQuery]);

    // Handle Right Click on Task Pane
    const handleContextMenu = (e) => {
        e.preventDefault();
        e.stopPropagation();

        setContextMenu({
            x: e.clientX,
            y: e.clientY
        });
    };

    const handleCloseContextMenu = () => {
        setContextMenu(null);
    };

    const handleOpenCreateModal = () => {
        setContextMenu(null);
        setIsCreateModalOpen(true);
    };

    // Pin & Unpin Actions
    const handlePin = async (taskId) => {
        try {
            await taskApi.pinTask(taskId);
            setTasks(prev =>
                prev.map(t => t.id === taskId ? { ...t, is_pinned: true, display_category: 'pinned' } : t)
            );
            loadTasks();
        } catch (err) {
            console.error('Failed to pin task:', err);
        }
    };

    const handleUnpin = async (taskId) => {
        try {
            await taskApi.unpinTask(taskId);
            setTasks(prev =>
                prev.map(t => t.id === taskId ? { ...t, is_pinned: false, display_category: t.category } : t)
            );
            loadTasks();
        } catch (err) {
            console.error('Failed to unpin task:', err);
        }
    };

    // Filter tasks by status and search
    const filteredTasks = useMemo(() => {
        return tasks.filter(t => {
            if (statusFilter !== 'all' && t.status !== statusFilter) return false;
            return true;
        });
    }, [tasks, statusFilter]);

    // Categorize tasks into Common, Pinned, and General
    const commonTasks = useMemo(() => {
        return filteredTasks.filter(t => t.category === 'common');
    }, [filteredTasks]);

    const pinnedTasks = useMemo(() => {
        return filteredTasks.filter(t => t.is_pinned || t.display_category === 'pinned');
    }, [filteredTasks]);

    const generalTasks = useMemo(() => {
        return filteredTasks.filter(t => t.category === 'general' && !t.is_pinned && t.display_category !== 'pinned');
    }, [filteredTasks]);

    const totalPages = Math.ceil(totalTasks / pageSize) || 1;

    return (
        <div
            onContextMenu={handleContextMenu}
            className="flex-1 flex h-full bg-[#f8fafc] overflow-hidden select-text relative"
        >
            {/* Main Area: Task List & Filter Controls */}
            <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0">

                {/* Top Action & Metric Bar */}
                <div className="px-6 py-3.5 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-blue-50 text-[#0057B8] border border-blue-200">
                            <ListChecks className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-base font-bold text-slate-900 tracking-tight">
                                    Library Workspace – Task Management
                                </h1>
                                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-[#0057B8] border border-blue-200">
                                    {totalTasks} Total
                                </span>
                            </div>
                             
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={loadTasks}
                            className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                            title="Refresh Task List"
                        >
                            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                </div>

                {/* Category Tabs & Search/Status Filter Bar */}
                <div className="px-6 py-2.5 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
                    {/* Category tabs */}
                    <div className="flex items-center gap-1.5 overflow-x-auto">
                        <button
                            type="button"
                            onClick={() => setActiveTab('all')}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                                activeTab === 'all'
                                    ? 'bg-[#0057B8] text-white shadow-xs'
                                    : 'text-slate-600 hover:bg-slate-100'
                            }`}
                        >
                            All ({filteredTasks.length})
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('common')}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                                activeTab === 'common'
                                    ? 'bg-[#0057B8] text-white shadow-xs'
                                    : 'text-slate-600 hover:bg-slate-100'
                            }`}
                        >
                            Common ({commonTasks.length})
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('pinned')}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                                activeTab === 'pinned'
                                    ? 'bg-[#0057B8] text-white shadow-xs'
                                    : 'text-slate-600 hover:bg-slate-100'
                            }`}
                        >
                            Pinned ({pinnedTasks.length})
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('general')}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                                activeTab === 'general'
                                    ? 'bg-[#0057B8] text-white shadow-xs'
                                    : 'text-slate-600 hover:bg-slate-100'
                            }`}
                        >
                            General ({generalTasks.length})
                        </button>
                    </div>

                    {/* Search & Status Filters */}
                    <div className="flex items-center gap-2">
                        {/* Status Filter */}
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="text-xs p-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:border-[#0057B8]"
                        >
                            <option value="all">All Statuses</option>
                            <option value="pending">Pending</option>
                            <option value="responded">Responded</option>
                            <option value="completed">Completed</option>
                            <option value="approved">Approved</option>
                            <option value="cancelled">Cancelled</option>
                        </select>

                        {/* Search input */}
                        <div className="relative w-48 sm:w-64">
                            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search tasks by code, title..."
                                className="w-full text-xs pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-[#0057B8]"
                            />
                        </div>
                    </div>
                </div>

                {/* Task List Workspace Content */}
                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar space-y-6">
                    {filteredTasks.length === 0 && !isLoading ? (
                        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 max-w-lg mx-auto">
                            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#0057B8] flex items-center justify-center mx-auto mb-3">
                                <ListChecks className="w-6 h-6" />
                            </div>
                            <h3 className="font-bold text-slate-800 text-sm">No Tasks Found</h3>
                            <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto leading-relaxed">
                                No tasks match your current filter. Right-click anywhere in this pane to create a new task.
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* Pinned Tasks Category */}
                            {(activeTab === 'all' || activeTab === 'pinned') && pinnedTasks.length > 0 && (
                                <TaskList
                                    title="Pinned Tasks"
                                    tasks={pinnedTasks}
                                    isLoading={isLoading}
                                    selectedTaskId={selectedTask?.id}
                                    onTaskClick={(t) => setSelectedTask(t)}
                                    onPin={handlePin}
                                    onUnpin={handleUnpin}
                                    emptyMessage="No pinned tasks"
                                />
                            )}

                            {/* Common Tasks Category */}
                            {(activeTab === 'all' || activeTab === 'common') && (
                                <TaskList
                                    title="Common Tasks (Workspace Shared)"
                                    tasks={commonTasks}
                                    isLoading={isLoading}
                                    selectedTaskId={selectedTask?.id}
                                    onTaskClick={(t) => setSelectedTask(t)}
                                    onPin={handlePin}
                                    onUnpin={handleUnpin}
                                    emptyMessage="No common tasks shared across workspace"
                                />
                            )}

                            {/* General Tasks Category */}
                            {(activeTab === 'all' || activeTab === 'general') && (
                                <TaskList
                                    title="General Tasks"
                                    tasks={generalTasks}
                                    isLoading={isLoading}
                                    selectedTaskId={selectedTask?.id}
                                    onTaskClick={(t) => setSelectedTask(t)}
                                    onPin={handlePin}
                                    onUnpin={handleUnpin}
                                    emptyMessage="No general tasks assigned or created by you"
                                />
                            )}
                        </>
                    )}
                </div>

                {/* Pagination Bar */}
                {totalTasks > pageSize && (
                    <div className="px-6 py-2.5 bg-white border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
                        <span>
                            Showing Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong> ({totalTasks} tasks)
                        </span>
                        <div className="flex items-center gap-1.5">
                            <button
                                type="button"
                                disabled={currentPage <= 1}
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50 transition cursor-pointer"
                                title="Previous Page"
                            >
                                <ChevronLeft className="w-3.5 h-3.5" />
                            </button>
                            <button
                                type="button"
                                disabled={currentPage >= totalPages}
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50 transition cursor-pointer"
                                title="Next Page"
                            >
                                <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Slide-in Task Details Pane */}
            {selectedTask && (
                <div className="w-96 lg:w-[440px] flex-shrink-0 h-full shadow-2xl z-20">
                    <TaskDetailsPane
                        task={selectedTask}
                        onClose={() => setSelectedTask(null)}
                        onTaskUpdated={loadTasks}
                    />
                </div>
            )}

            {/* Right-Click Custom Context Menu */}
            {contextMenu && (
                <TaskContextMenu
                    position={contextMenu}
                    onNewTask={handleOpenCreateModal}
                    onClose={handleCloseContextMenu}
                />
            )}

            {/* Task Creation Modal: Opened ONLY via Context Menu */}
            {isCreateModalOpen && (
                <CreateTaskDialog
                    onClose={() => setIsCreateModalOpen(false)}
                    onTaskCreated={(newTask) => {
                        loadTasks();
                        if (newTask) {
                            setSelectedTask(newTask);
                        }
                    }}
                />
            )}
        </div>
    );
}
