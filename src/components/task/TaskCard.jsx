import React from 'react';
import { Pin, PinOff, User, Calendar, Circle, ExternalLink, FileText } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const STATUS_CONFIG = {
    pending:   { label: 'Pending',   bg: 'bg-amber-50',   text: 'text-amber-800',  border: 'border-amber-200',  dot: 'bg-amber-400'  },
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

export default function TaskCard({ task, onClick, onPin, onUnpin, isSelected }) {
    const { user } = useAuth();
    const status = STATUS_CONFIG[task.status] || STATUS_CONFIG.pending;
    const catKey = task.display_category || task.category;
    const cat    = CATEGORY_BADGE[catKey] || CATEGORY_BADGE.general;
    const isPinned = task.is_pinned || catKey === 'pinned';

    const handlePinClick = (e) => {
        e.stopPropagation();
        isPinned ? onUnpin(task.id) : onPin(task.id);
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '—';
        return new Date(dateStr).toLocaleDateString('en-AU', {
            day: '2-digit', month: 'short', year: 'numeric'
        });
    };

    return (
        <div
            onClick={() => onClick(task)}
            className={`
                group relative p-4 rounded-2xl border bg-white cursor-pointer
                transition-all duration-150 hover:border-[#0057B8]/40 hover:shadow-md
                ${isSelected ? 'border-[#0057B8] shadow-md ring-1 ring-[#0057B8]/20' : 'border-slate-200 shadow-xs'}
            `}
        >
            {/* Top Row: Task Code + Badges */}
            <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {task.task_code}
                    </span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${cat.bg} ${cat.text} ${cat.border}`}>
                        {cat.label}
                    </span>
                    <span className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded border ${status.bg} ${status.text} ${status.border}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                        {status.label}
                    </span>
                    {task.section_id && (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-blue-50 text-[#0057B8] border border-blue-200/70 max-w-[150px] truncate" title={`Policy Section: ${task.section_id}`}>
                            § {task.section_id}
                        </span>
                    )}
                    {(task.library_id || task.linked_policy_id) && (
                        <a
                            href={`/home?policy=${encodeURIComponent(task.library_id || task.linked_policy_id)}`}
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100/70 text-[#0057B8] border border-blue-200 hover:bg-blue-200/80 transition max-w-[170px] truncate"
                            title={`Origin Policy: ${task.library_id || task.linked_policy_id} (Click to open)`}
                        >
                            <ExternalLink className="w-2.5 h-2.5 flex-shrink-0" />
                            <span className="truncate">Policy: {task.library_id || task.linked_policy_id}</span>
                        </a>
                    )}
                </div>

                {/* Pin button */}
                <button
                    onClick={handlePinClick}
                    title={isPinned ? 'Unpin task' : 'Pin task'}
                    className={`
                        p-1.5 rounded-lg transition-all flex-shrink-0 opacity-0 group-hover:opacity-100
                        ${isPinned ? 'opacity-100 text-[#0057B8] bg-blue-50' : 'text-slate-400 hover:text-[#0057B8] hover:bg-blue-50'}
                    `}
                >
                    {isPinned
                        ? <PinOff className="w-3.5 h-3.5" />
                        : <Pin className="w-3.5 h-3.5" />
                    }
                </button>
            </div>

            {/* Title */}
            <h4 className={`text-sm font-bold text-slate-900 leading-snug mb-1 line-clamp-2 ${task.status === 'cancelled' ? 'line-through text-slate-400' : ''}`}>
                {task.title}
            </h4>

            {/* Description preview */}
            {task.description && (
                <p className="text-xs text-slate-500 leading-relaxed line-clamp-2 mb-2">
                    {task.description}
                </p>
            )}

            {/* Footer Meta */}
            <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-2 pt-2 border-t border-slate-100">
                <span className="flex items-center gap-1 font-medium">
                    <User className="w-3 h-3 text-[#0057B8]" />
                    {task.assigned_to_name || task.assigned_to || 'Unassigned'}
                </span>
                <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    {formatDate(task.updated_at || task.created_at)}
                </span>
                {task.created_by_name && (
                    <span className="ml-auto text-slate-400 truncate max-w-24">
                        by {task.created_by_name}
                    </span>
                )}
            </div>
        </div>
    );
}
