import React, { useState } from 'react';
import { 
  MessageSquare, 
  Bot, 
  X
} from 'lucide-react';
import ShidneyAIChat from '../ShidneyAIChat';
import DraftCommentsFeed from './DraftCommentsFeed';

export default function ContextualFeedPane({
  openedDocument = null,
  activePolicy,
  currentUser,
  isMobileOpen,
  onCloseMobile,
  isCollapsed = false,
  width = 340,
  onSelectPolicy,
  policies = [],
  onOpenDraft,
  activeWorkspaceView = 'policy'
}) {
  // 2 Core Panes: 'shidney' (AI Copilot) | 'comments' (Chats)
  const [activePaneTab, setActivePaneTab] = useState('comments');

  if (isCollapsed) return null;

  const currentDoc = openedDocument || (activeWorkspaceView === 'policy' ? activePolicy : null);

  return (
    <>
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs z-40 lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        style={{ width: `${width}px` }}
        className={`
          flex-shrink-0 bg-[#f8fafc] border-l border-[#dbe4ef] flex flex-col h-[calc(100vh-3.5rem)] select-none transition-all duration-200
          ${isMobileOpen 
            ? 'fixed inset-y-0 right-0 z-50 shadow-xl !w-80' 
            : 'relative z-10'}
        `}
      >
        {/* Top Header Bar */}
        <div className="h-11 px-3.5 border-b border-[#dbe4ef] bg-white flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-slate-800 text-[13px]">
            <MessageSquare className="w-4 h-4 text-[#0057B8]" />
            <span className="truncate">Chats & Shidney</span>
          </div>
          {onCloseMobile && (
            <button 
              onClick={onCloseMobile}
              className="lg:hidden p-1 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* 2 Tabs: Shidney AI | Chats */}
        <div className="p-1 border-b border-[#e2e8f0] bg-white grid grid-cols-2 gap-1 text-[11px]">
          <button
            type="button"
            onClick={() => setActivePaneTab('shidney')}
            className={`py-1.5 px-2 rounded-lg flex items-center justify-center gap-1.5 font-medium transition cursor-pointer ${
              activePaneTab === 'shidney'
                ? 'bg-[#0057B8] text-white shadow-sm font-semibold'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
            title="Interactive Shidney Banking AI Copilot"
          >
            <Bot className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">Shidney Assistant</span>
          </button>

          <button
            type="button"
            onClick={() => setActivePaneTab('comments')}
            className={`py-1.5 px-2 rounded-lg flex items-center justify-center gap-1.5 font-medium transition cursor-pointer ${
              activePaneTab === 'comments'
                ? 'bg-[#0057B8] text-white shadow-sm font-semibold'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
            title="Document Comments & Team Discussion"
          >
            <MessageSquare className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">Chats</span>
          </button>
        </div>

        {/* Tab Body Content */}
        <div className="flex-1 overflow-hidden">
          
          {/* TAB 1: Shidney AI Copilot */}
          {activePaneTab === 'shidney' && (
            <div className="h-full flex flex-col">
              <ShidneyAIChat 
                activePolicy={activePolicy} 
                currentUser={currentUser}
                onSelectPolicy={onSelectPolicy}
                policies={policies}
              />
            </div>
          )}

          {/* TAB 2: Document Comments & Team Discussion */}
          {activePaneTab === 'comments' && (
            <div className="h-full flex flex-col">
              <DraftCommentsFeed 
                openedDocument={currentDoc}
                currentUser={currentUser}
                onOpenDraft={onOpenDraft}
              />
            </div>
          )}

        </div>
      </aside>
    </>
  );
}
