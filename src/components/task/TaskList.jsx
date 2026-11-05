import React from 'react';
import { CheckCircle2, Loader2 } from 'lucide-react';
import TaskCard from './TaskCard';

/**
 * TaskList – Renders a grouped section of tasks (Common / Pinned / General).
 */
export default function TaskList({
    title,
    tasks = [],
    isLoading,
    selectedTaskId,
    onTaskClick,
    onPin,
    onUnpin,
    emptyMessage = 'No tasks in this category'
}) {
    if (isLoading) {
        return (
            <div className="mb-5">
                <div className="flex items-center gap-2 mb-2 px-1">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{title}</span>
                    <Loader2 className="w-3 h-3 text-slate-400 animate-spin" />
                </div>
                <div className="space-y-2">
                    {[1, 2].map(i => (
                        <div key={i} className="h-20 bg-white rounded-2xl border border-slate-200 animate-pulse" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="mb-5">
            {/* Section header */}
            <div className="flex items-center gap-2 mb-2 px-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{title}</span>
                <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                    {tasks.length}
                </span>
            </div>

            {tasks.length === 0 ? (
                <div className="flex items-center gap-2 px-3 py-3 rounded-xl bg-slate-50 border border-slate-100">
                    <CheckCircle2 className="w-4 h-4 text-slate-300" />
                    <span className="text-xs text-slate-400">{emptyMessage}</span>
                </div>
            ) : (
                <div className="space-y-2">
                    {tasks.map(task => (
                        <TaskCard
                            key={task.id}
                            task={task}
                            isSelected={selectedTaskId === task.id}
                            onClick={onTaskClick}
                            onPin={onPin}
                            onUnpin={onUnpin}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
