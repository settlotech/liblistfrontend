import React, { useState, useMemo } from 'react';
import {
    Pin,
    PinOff,
    User,
    Calendar,
    Clock,
    ArrowUpDown,
    ArrowUp,
    ArrowDown,
    Filter,
    Search,
    X,
    ChevronRight,
    ExternalLink,
    AlertCircle,
    CheckCircle2,
    Eye
} from 'lucide-react';

const STATUS_CONFIG = {
    pending:   { label: 'Pending',   bg: 'bg-amber-50',   text: 'text-amber-700',  border: 'border-amber-200',  dot: 'bg-amber-500'  },
    responded: { label: 'Responded', bg: 'bg-blue-50',    text: 'text-blue-700',   border: 'border-blue-200',   dot: 'bg-blue-500'   },
    completed: { label: 'Completed', bg: 'bg-emerald-50', text: 'text-emerald-700',border: 'border-emerald-200',dot: 'bg-emerald-500' },
    approved:  { label: 'Approved',  bg: 'bg-purple-50',  text: 'text-purple-700', border: 'border-purple-200', dot: 'bg-purple-500'  },
    cancelled: { label: 'Cancelled', bg: 'bg-slate-100',  text: 'text-slate-500',  border: 'border-slate-200',  dot: 'bg-slate-400'  }
};

const CATEGORY_BADGE = {
    common:  { label: 'Common',  bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
    general: { label: 'General', bg: 'bg-slate-50',  text: 'text-slate-600',  border: 'border-slate-200'  },
    pinned:  { label: 'Pinned',  bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200' }
};

export default function TaskTable({
    tasks = [],
    isLoading = false,
    selectedTaskId,
    onTaskClick,
    onPin,
    onUnpin,
    currentUserId,
    emptyMessage = 'No tasks found matching your filter criteria'
}) {
    // Sorting state
    const [sortField, setSortField] = useState('created_at');
    const [sortDirection, setSortDirection] = useState('desc'); // 'asc' | 'desc'

    // In-table quick filters
    const [tableSearch, setTableSearch] = useState('');
    const [tableStatusFilter, setTableStatusFilter] = useState('all');
    const [tableAssigneeFilter, setTableAssigneeFilter] = useState('all');

    // Format date utility
    const formatDate = (dateStr) => {
        if (!dateStr) return '—';
        try {
            const d = new Date(dateStr);
            if (isNaN(d.getTime())) return String(dateStr);
            return d.toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
            });
        } catch {
            return String(dateStr);
        }
    };

    // Toggle sorting
    const handleSort = (field) => {
        if (sortField === field) {
            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    // Extract unique assignees for quick filter
    const uniqueAssignees = useMemo(() => {
        const set = new Set();
        tasks.forEach(t => {
            const name = t.assigned_to_name || t.assigned_to;
            if (name) set.add(name);
        });
        return Array.from(set).sort();
    }, [tasks]);

    // Apply in-table filter & sort
    const processedTasks = useMemo(() => {
        let result = [...tasks];

        // 1. In-table status filter
        if (tableStatusFilter !== 'all') {
            result = result.filter(t => t.status === tableStatusFilter);
        }

        // 2. In-table assignee filter
        if (tableAssigneeFilter !== 'all') {
            result = result.filter(t => {
                const name = t.assigned_to_name || t.assigned_to;
                return name === tableAssigneeFilter;
            });
        }

        // 3. In-table search filter (across code, title, assigner, assignee)
        if (tableSearch.trim()) {
            const query = tableSearch.toLowerCase().trim();
            result = result.filter(t => {
                const code = (t.task_code || '').toLowerCase();
                const title = (t.title || '').toLowerCase();
                const desc = (t.description || '').toLowerCase();
                const assignedBy = (t.created_by_name || t.created_by || '').toLowerCase();
                const assignedTo = (t.assigned_to_name || t.assigned_to || '').toLowerCase();
                return code.includes(query) ||
                       title.includes(query) ||
                       desc.includes(query) ||
                       assignedBy.includes(query) ||
                       assignedTo.includes(query);
            });
        }

        // 4. Sort
        result.sort((a, b) => {
            let valA = a[sortField];
            let valB = b[sortField];

            // Normalize fields
            if (sortField === 'assigned_by') {
                valA = a.created_by_name || a.created_by || '';
                valB = b.created_by_name || b.created_by || '';
            } else if (sortField === 'assigned_to') {
                valA = a.assigned_to_name || a.assigned_to || '';
                valB = b.assigned_to_name || b.assigned_to || '';
            } else if (sortField === 'created_at' || sortField === 'due_date') {
                valA = valA ? new Date(valA).getTime() : 0;
                valB = valB ? new Date(valB).getTime() : 0;
            } else {
                valA = (valA || '').toString().toLowerCase();
                valB = (valB || '').toString().toLowerCase();
            }

            if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
            if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });

        return result;
    }, [tasks, tableStatusFilter, tableAssigneeFilter, tableSearch, sortField, sortDirection]);

    const renderSortIcon = (field) => {
        if (sortField !== field) {
            return <ArrowUpDown className="w-3 h-3 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity ml-1" />;
        }
        return sortDirection === 'asc'
            ? <ArrowUp className="w-3 h-3 text-[#0057B8] ml-1" />
            : <ArrowDown className="w-3 h-3 text-[#0057B8] ml-1" />;
    };

    const hasActiveFilters = tableSearch || tableStatusFilter !== 'all' || tableAssigneeFilter !== 'all';

    const clearFilters = () => {
        setTableSearch('');
        setTableStatusFilter('all');
        setTableAssigneeFilter('all');
    };

    return (
        <div className="w-full flex flex-col bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
            {/* Table Header Filter Toolbar */}
            <div className="p-3.5 bg-slate-50/80 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-wrap flex-1 min-w-[240px]">
                    {/* Search inside table */}
                    <div className="relative flex-1 min-w-[180px] max-w-xs">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            value={tableSearch}
                            onChange={(e) => setTableSearch(e.target.value)}
                            placeholder="Filter table rows..."
                            className="w-full text-xs pl-8 pr-2.5 py-1.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-[#0057B8] shadow-2xs transition"
                        />
                        {tableSearch && (
                            <button
                                type="button"
                                onClick={() => setTableSearch('')}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        )}
                    </div>

                    {/* Status dropdown filter */}
                    <div className="flex items-center gap-1.5">
                        <select
                            value={tableStatusFilter}
                            onChange={(e) => setTableStatusFilter(e.target.value)}
                            className="text-xs py-1.5 px-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:border-[#0057B8] shadow-2xs cursor-pointer font-medium"
                        >
                            <option value="all">All Statuses</option>
                            <option value="pending">Pending</option>
                            <option value="responded">Responded</option>
                            <option value="completed">Completed</option>
                            <option value="approved">Approved</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                    </div>

                    {/* Assignee filter dropdown */}
                    {uniqueAssignees.length > 0 && (
                        <div className="flex items-center gap-1.5">
                            <select
                                value={tableAssigneeFilter}
                                onChange={(e) => setTableAssigneeFilter(e.target.value)}
                                className="text-xs py-1.5 px-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:border-[#0057B8] shadow-2xs cursor-pointer font-medium max-w-[160px] truncate"
                            >
                                <option value="all">All Assignees</option>
                                {uniqueAssignees.map(name => (
                                    <option key={name} value={name}>{name}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Clear filter button */}
                    {hasActiveFilters && (
                        <button
                            type="button"
                            onClick={clearFilters}
                            className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-red-600 px-2 py-1 rounded-lg hover:bg-red-50 transition cursor-pointer"
                        >
                            <X className="w-3 h-3" />
                            Clear Filter
                        </button>
                    )}
                </div>

                {/* Showing count indicator */}
                <div className="text-xs font-medium text-slate-500 whitespace-nowrap">
                    Showing <strong className="text-slate-800">{processedTasks.length}</strong> of {tasks.length} tasks
                </div>
            </div>

            {/* Responsive Table Container */}
            <div className="w-full overflow-x-auto custom-scrollbar">
                <table className="w-full text-left border-collapse min-w-[960px] select-text">
                    {/* Table Header Row */}
                    <thead>
                        <tr className="border-b border-slate-200 bg-slate-50/90 text-[11px] font-bold text-slate-600 uppercase tracking-wider sticky top-0 z-10 backdrop-blur-xs">
                            {/* Pin / Quick Icon */}
                            <th className="py-3 px-3 w-10 text-center">
                                <span className="sr-only">Pin</span>
                            </th>

                            {/* Task Code */}
                            <th
                                onClick={() => handleSort('task_code')}
                                className="py-3 px-3 cursor-pointer group hover:text-[#0057B8] transition-colors whitespace-nowrap w-28"
                            >
                                <div className="flex items-center">
                                    <span>Task Code</span>
                                    {renderSortIcon('task_code')}
                                </div>
                            </th>

                            {/* Title */}
                            <th
                                onClick={() => handleSort('title')}
                                className="py-3 px-4 cursor-pointer group hover:text-[#0057B8] transition-colors min-w-[260px]"
                            >
                                <div className="flex items-center">
                                    <span>Title</span>
                                    {renderSortIcon('title')}
                                </div>
                            </th>

                            {/* Assigned By */}
                            <th
                                onClick={() => handleSort('assigned_by')}
                                className="py-3 px-3 cursor-pointer group hover:text-[#0057B8] transition-colors whitespace-nowrap w-36"
                            >
                                <div className="flex items-center">
                                    <span>Assigned By</span>
                                    {renderSortIcon('assigned_by')}
                                </div>
                            </th>

                            {/* Assigned To */}
                            <th
                                onClick={() => handleSort('assigned_to')}
                                className="py-3 px-3 cursor-pointer group hover:text-[#0057B8] transition-colors whitespace-nowrap w-40"
                            >
                                <div className="flex items-center">
                                    <span>Assigned To</span>
                                    {renderSortIcon('assigned_to')}
                                </div>
                            </th>

                            {/* Assigned Date */}
                            <th
                                onClick={() => handleSort('created_at')}
                                className="py-3 px-3 cursor-pointer group hover:text-[#0057B8] transition-colors whitespace-nowrap w-32"
                            >
                                <div className="flex items-center">
                                    <span>Assigned Date</span>
                                    {renderSortIcon('created_at')}
                                </div>
                            </th>

                            {/* Due Date */}
                            <th
                                onClick={() => handleSort('due_date')}
                                className="py-3 px-3 cursor-pointer group hover:text-[#0057B8] transition-colors whitespace-nowrap w-32"
                            >
                                <div className="flex items-center">
                                    <span>Due Date</span>
                                    {renderSortIcon('due_date')}
                                </div>
                            </th>

                            {/* Status */}
                            <th
                                onClick={() => handleSort('status')}
                                className="py-3 px-3 cursor-pointer group hover:text-[#0057B8] transition-colors whitespace-nowrap w-28"
                            >
                                <div className="flex items-center">
                                    <span>Status</span>
                                    {renderSortIcon('status')}
                                </div>
                            </th>

                            {/* Action Arrow */}
                            <th className="py-3 px-3 w-12 text-center">
                                <span className="sr-only">Details</span>
                            </th>
                        </tr>
                    </thead>

                    {/* Table Body */}
                    <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                        {isLoading ? (
                            <tr>
                                <td colSpan={9} className="py-12 text-center text-slate-400">
                                    <div className="flex flex-col items-center justify-center gap-2">
                                        <div className="w-6 h-6 border-2 border-[#0057B8] border-t-transparent rounded-full animate-spin" />
                                        <span className="text-xs font-medium">Loading tasks...</span>
                                    </div>
                                </td>
                            </tr>
                        ) : processedTasks.length === 0 ? (
                            <tr>
                                <td colSpan={9} className="py-12 text-center text-slate-500">
                                    <div className="flex flex-col items-center justify-center max-w-sm mx-auto gap-2">
                                        <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mb-1">
                                            <AlertCircle className="w-5 h-5" />
                                        </div>
                                        <span className="text-xs font-bold text-slate-700">{emptyMessage}</span>
                                        {hasActiveFilters && (
                                            <button
                                                type="button"
                                                onClick={clearFilters}
                                                className="text-xs text-[#0057B8] font-semibold hover:underline mt-1 cursor-pointer"
                                            >
                                                Reset search & filters
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            processedTasks.map((task) => {
                                const status = STATUS_CONFIG[task.status] || STATUS_CONFIG.pending;
                                const catKey = task.display_category || task.category;
                                const cat = CATEGORY_BADGE[catKey] || CATEGORY_BADGE.general;
                                const isPinned = task.is_pinned || catKey === 'pinned';
                                const isSelected = selectedTaskId === task.id;

                                const assignedByName = task.created_by_name || task.created_by || 'System';
                                const assignedToName = task.assigned_to_name || task.assigned_to || 'Unassigned';
                                const assignedDate = formatDate(task.created_at || task.assigned_date);
                                const dueDate = formatDate(task.due_date || task.deadline);

                                return (
                                    <tr
                                        key={task.id}
                                        onClick={() => onTaskClick(task)}
                                        className={`
                                            group transition-colors duration-100 cursor-pointer
                                            ${isSelected
                                                ? 'bg-blue-50/80 font-medium'
                                                : 'hover:bg-slate-50/80'
                                            }
                                        `}
                                    >
                                        {/* Pin Button */}
                                        <td
                                            className="py-3 px-3 text-center"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                isPinned ? onUnpin(task.id) : onPin(task.id);
                                            }}
                                        >
                                            <button
                                                type="button"
                                                title={isPinned ? 'Unpin Task' : 'Pin Task'}
                                                className={`
                                                    p-1 rounded-md transition cursor-pointer
                                                    ${isPinned
                                                        ? 'text-[#0057B8] bg-blue-100/60 opacity-100'
                                                        : 'text-slate-300 hover:text-[#0057B8] hover:bg-slate-100 opacity-0 group-hover:opacity-100'
                                                    }
                                                `}
                                            >
                                                {isPinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
                                            </button>
                                        </td>

                                        {/* Task Code */}
                                        <td className="py-3 px-3 whitespace-nowrap">
                                            <div className="flex items-center gap-1.5">
                                                <span className="font-mono font-bold text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
                                                    {task.task_code}
                                                </span>
                                            </div>
                                        </td>

                                        {/* Title + Badges */}
                                        <td className="py-3 px-4">
                                            <div className="flex flex-col gap-1 max-w-md">
                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                    <span className={`text-xs font-bold leading-snug group-hover:text-[#0057B8] transition-colors ${task.status === 'cancelled' ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                                                        {task.title}
                                                    </span>
                                                    <span className={`text-[9.5px] font-semibold px-1.5 py-0.2 rounded border ${cat.bg} ${cat.text} ${cat.border}`}>
                                                        {cat.label}
                                                    </span>
                                                </div>

                                                {/* Optional Sub-meta: Description / Policy / Section */}
                                                <div className="flex items-center gap-2 text-[10.5px] text-slate-500">
                                                    {task.section_id && (
                                                        <span className="text-[10px] text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded font-medium border border-blue-100">
                                                            § {task.section_id}
                                                        </span>
                                                    )}
                                                    {(task.library_id || task.linked_policy_id) && (
                                                        <span className="text-[10px] text-slate-500 truncate max-w-[140px]" title={`Policy: ${task.library_id || task.linked_policy_id}`}>
                                                            {task.library_id || task.linked_policy_id}
                                                        </span>
                                                    )}
                                                    {task.description && (
                                                        <span className="truncate max-w-[200px] text-slate-400">
                                                            {task.description}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </td>

                                        {/* Assigned By */}
                                        <td className="py-3 px-3 whitespace-nowrap">
                                            <div className="flex items-center gap-1.5">
                                                <div className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-[10px] flex-shrink-0">
                                                    {assignedByName.charAt(0).toUpperCase()}
                                                </div>
                                                <span className="text-slate-700 font-medium truncate max-w-[110px]" title={assignedByName}>
                                                    {assignedByName}
                                                </span>
                                            </div>
                                        </td>

                                        {/* Assigned To */}
                                        <td className="py-3 px-3 whitespace-nowrap">
                                            <div className="flex items-center gap-1.5">
                                                <div className="w-5 h-5 rounded-full bg-blue-50 text-[#0057B8] flex items-center justify-center font-bold text-[10px] flex-shrink-0">
                                                    {assignedToName.charAt(0).toUpperCase()}
                                                </div>
                                                <span className="text-slate-800 font-semibold truncate max-w-[120px]" title={assignedToName}>
                                                    {assignedToName}
                                                </span>
                                            </div>
                                        </td>

                                        {/* Assigned Date */}
                                        <td className="py-3 px-3 whitespace-nowrap text-slate-600 text-[11.5px]">
                                            <div className="flex items-center gap-1.5">
                                                <Calendar className="w-3 h-3 text-slate-400 flex-shrink-0" />
                                                <span>{assignedDate}</span>
                                            </div>
                                        </td>

                                        {/* Due Date */}
                                        <td className="py-3 px-3 whitespace-nowrap text-slate-600 text-[11.5px]">
                                            <div className="flex items-center gap-1.5">
                                                <Clock className="w-3 h-3 text-slate-400 flex-shrink-0" />
                                                <span className={task.due_date ? 'font-medium text-slate-800' : 'text-slate-400'}>
                                                    {dueDate}
                                                </span>
                                            </div>
                                        </td>

                                        {/* Status */}
                                        <td className="py-3 px-3 whitespace-nowrap">
                                            <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${status.bg} ${status.text} ${status.border}`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                                                {status.label}
                                            </span>
                                        </td>

                                        {/* Action / View arrow */}
                                        <td className="py-3 px-3 text-center">
                                            <div className="flex items-center justify-center text-slate-400 group-hover:text-[#0057B8] transition-colors">
                                                <ChevronRight className="w-4 h-4" />
                                            </div>
                                        </td>
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
