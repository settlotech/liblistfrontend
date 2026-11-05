import React, { useEffect, useRef } from 'react';
import { Plus } from 'lucide-react';

/**
 * TaskContextMenu – Right-click context menu for the Task Pane.
 * Opens at mouse coordinates. Prevents browser default context menu.
 * Closes on outside click, Escape key, or scroll.
 */
export default function TaskContextMenu({ position, onNewTask, onClose }) {
    const menuRef = useRef(null);

    // Close on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside, { capture: true });
        return () => document.removeEventListener('mousedown', handleClickOutside, { capture: true });
    }, [onClose]);

    // Close on Escape key
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    // Adjust position to avoid viewport overflow
    const getAdjustedPosition = () => {
        const menuWidth = 200;
        const menuHeight = 80;
        const vw = window.innerWidth;
        const vh = window.innerHeight;

        return {
            left: position.x + menuWidth > vw ? vw - menuWidth - 8 : position.x,
            top:  position.y + menuHeight > vh ? vh - menuHeight - 8 : position.y
        };
    };

    const { left, top } = getAdjustedPosition();

    return (
        <div
            ref={menuRef}
            role="menu"
            aria-label="Task context menu"
            style={{ position: 'fixed', left, top, zIndex: 9999 }}
            className="bg-white border border-slate-200 rounded-xl shadow-2xl py-1.5 w-52 animate-in fade-in zoom-in-95 duration-100"
        >
            <button
                role="menuitem"
                onClick={() => { onClose(); onNewTask(); }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-semibold text-slate-700
                           hover:bg-blue-50 hover:text-[#0057B8] transition-colors cursor-pointer rounded-lg mx-0.5"
                style={{ width: 'calc(100% - 4px)' }}
            >
                <Plus className="w-3.5 h-3.5 text-[#0057B8]" />
                New Task
            </button>
        </div>
    );
}
