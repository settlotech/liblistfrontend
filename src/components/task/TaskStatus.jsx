import React from 'react';

const STATUS_CONFIG = {
    pending:   { label: 'Pending',   bg: 'bg-amber-50',   text: 'text-amber-800',  border: 'border-amber-200',  dot: 'bg-amber-400'  },
    responded: { label: 'Responded', bg: 'bg-blue-50',    text: 'text-blue-700',   border: 'border-blue-200',   dot: 'bg-blue-500'   },
    completed: { label: 'Completed', bg: 'bg-emerald-50', text: 'text-emerald-700',border: 'border-emerald-200',dot: 'bg-emerald-500' },
    approved:  { label: 'Approved',  bg: 'bg-purple-50',  text: 'text-purple-700', border: 'border-purple-200', dot: 'bg-purple-500'  },
    cancelled: { label: 'Cancelled', bg: 'bg-slate-100',  text: 'text-slate-500',  border: 'border-slate-200',  dot: 'bg-slate-400'  }
};

const ALLOWED_TRANSITIONS = {
    pending:   ['responded', 'completed', 'cancelled'],
    responded: ['completed', 'cancelled'],
    completed: ['approved', 'cancelled'],
    approved:  [],
    cancelled: []
};

/**
 * TaskStatus – Displays the current task status badge and optional action buttons.
 * @param {string} status - Current status
 * @param {boolean} canApprove  - User has approver role on this task
 * @param {boolean} canRespond  - User is assignee or reviewer
 * @param {boolean} canCancel   - User is task creator
 * @param {boolean} canComplete - User is assignee, reviewer, or creator
 * @param {function} onStatusChange - (newStatus, comment?) => void
 * @param {boolean} isUpdating
 */
export default function TaskStatus({
    status,
    canApprove = false,
    canRespond = false,
    canCancel = false,
    canComplete = false,
    onStatusChange,
    isUpdating = false
}) {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
    const transitions = ALLOWED_TRANSITIONS[status] || [];

    const handleAction = (newStatus) => {
        if (onStatusChange) onStatusChange(newStatus);
    };

    return (
        <div className="space-y-2">
            {/* Status Badge */}
            <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold ${config.bg} ${config.text} ${config.border}`}>
                <span className={`w-2 h-2 rounded-full ${config.dot}`} />
                {config.label}
            </div>

            {/* Action Buttons */}
            {transitions.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                    {transitions.includes('responded') && canRespond && (
                        <button
                            onClick={() => handleAction('responded')}
                            disabled={isUpdating}
                            className="px-3 py-1 text-xs font-semibold bg-blue-50 hover:bg-blue-100 text-[#0057B8] border border-blue-200 rounded-lg transition cursor-pointer disabled:opacity-50"
                        >
                            Mark Responded
                        </button>
                    )}
                    {transitions.includes('completed') && canComplete && (
                        <button
                            onClick={() => handleAction('completed')}
                            disabled={isUpdating}
                            className="px-3 py-1 text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg transition cursor-pointer disabled:opacity-50"
                        >
                            Mark Completed
                        </button>
                    )}
                    {transitions.includes('approved') && canApprove && (
                        <button
                            onClick={() => handleAction('approved')}
                            disabled={isUpdating}
                            className="px-3 py-1 text-xs font-semibold bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-lg transition cursor-pointer disabled:opacity-50"
                        >
                            Approve Task
                        </button>
                    )}
                    {transitions.includes('cancelled') && canCancel && (
                        <button
                            onClick={() => handleAction('cancelled')}
                            disabled={isUpdating}
                            className="px-3 py-1 text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg transition cursor-pointer disabled:opacity-50"
                        >
                            Cancel Task
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
