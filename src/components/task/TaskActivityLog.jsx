import React from 'react';
import {
    CheckCircle2, Clock, XCircle, ThumbsUp, MessageSquare,
    UserPlus, UserMinus, User, Edit3, RefreshCw
} from 'lucide-react';

const ACTION_CONFIG = {
    created:      { icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />, color: 'text-emerald-700', label: 'created the task' },
    assigned:     { icon: <UserPlus className="w-3.5 h-3.5 text-blue-500" />,        color: 'text-blue-700',    label: 'assigned the task' },
    reassigned:   { icon: <RefreshCw className="w-3.5 h-3.5 text-indigo-500" />,     color: 'text-indigo-700',  label: 'reassigned the task' },
    status_changed:{ icon: <Clock className="w-3.5 h-3.5 text-amber-500" />,         color: 'text-amber-700',   label: 'changed status' },
    responded:    { icon: <MessageSquare className="w-3.5 h-3.5 text-blue-500" />,   color: 'text-blue-700',    label: 'responded to the task' },
    completed:    { icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />, color: 'text-emerald-700', label: 'completed the task' },
    approved:     { icon: <ThumbsUp className="w-3.5 h-3.5 text-purple-500" />,      color: 'text-purple-700',  label: 'approved the task' },
    cancelled:    { icon: <XCircle className="w-3.5 h-3.5 text-rose-500" />,         color: 'text-rose-700',    label: 'cancelled the task' },
    commented:    { icon: <MessageSquare className="w-3.5 h-3.5 text-slate-500" />,  color: 'text-slate-700',   label: 'added a comment' },
    updated:      { icon: <Edit3 className="w-3.5 h-3.5 text-slate-500" />,          color: 'text-slate-700',   label: 'updated the task' }
};

const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleString('en-AU', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
};

export default function TaskActivityLog({ logs = [], isLoading }) {
    if (isLoading) {
        return (
            <div className="space-y-3 p-4">
                {[1, 2, 3].map(i => (
                    <div key={i} className="flex gap-3 animate-pulse">
                        <div className="w-7 h-7 rounded-full bg-slate-100 flex-shrink-0" />
                        <div className="flex-1 space-y-1.5">
                            <div className="h-3 bg-slate-100 rounded w-3/4" />
                            <div className="h-2.5 bg-slate-50 rounded w-1/2" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (logs.length === 0) {
        return (
            <div className="p-6 text-center text-xs text-slate-400">
                No activity recorded yet.
            </div>
        );
    }

    return (
        <div className="p-4 space-y-1">
            {logs.map((log, idx) => {
                const config = ACTION_CONFIG[log.action] || ACTION_CONFIG.updated;
                return (
                    <div key={log.id} className="flex gap-3">
                        {/* Timeline line */}
                        <div className="flex flex-col items-center flex-shrink-0" style={{ width: 28 }}>
                            <div className="w-7 h-7 rounded-full bg-white border border-slate-200 flex items-center justify-center shadow-xs z-10">
                                {config.icon}
                            </div>
                            {idx < logs.length - 1 && (
                                <div className="w-px flex-1 bg-slate-100 my-1" style={{ minHeight: 12 }} />
                            )}
                        </div>

                        {/* Content */}
                        <div className="pb-3 flex-1 min-w-0">
                            <p className="text-xs text-slate-800 leading-snug">
                                <span className="font-bold">{log.performed_by_name || 'User'}</span>{' '}
                                <span className={config.color}>{config.label}</span>
                                {log.old_value && log.new_value && log.action === 'status_changed' && (
                                    <span className="text-slate-500">
                                        {' '}from <strong>{log.old_value}</strong> to <strong>{log.new_value}</strong>
                                    </span>
                                )}
                                {log.action === 'reassigned' && log.new_value && (
                                    <span className="text-slate-500"> to <strong>{log.new_value}</strong></span>
                                )}
                            </p>

                            {log.comment && (
                                <p className="text-xs text-slate-500 mt-1 italic bg-slate-50 rounded-lg px-2.5 py-1.5 border border-slate-100">
                                    "{log.comment}"
                                </p>
                            )}

                            <span className="text-[10px] text-slate-400 mt-0.5 block">
                                {formatDate(log.created_at)}
                            </span>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
