import React, { useState } from 'react';
import {
  MessageSquare,
  Bot,
  FileText,
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
  // 2 Core Panes: 'shidney' (Private AI) | 'chats' (Shared Chat + Commands + Inline @Shidney Private)
  const [activePaneTab, setActivePaneTab] = useState('chats');

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
        <div className="h-11 px-3.5 border-b border-[#dbe4ef] bg-white flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 font-bold text-slate-800 text-[13px] min-w-0">
            <MessageSquare className="w-4 h-4 text-[#0057B8] flex-shrink-0" />
            <span className="truncate">Chats &amp; Commands</span>
          </div>
          {currentDoc?.title && (
            <span
              className="hidden sm:inline-flex items-center gap-1 max-w-[130px] px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-[10px] font-medium text-slate-600 truncate"
              title={currentDoc.title}
            >
              <FileText className="w-2.5 h-2.5 text-[#0057B8] flex-shrink-0" />
              <span className="truncate">{currentDoc.title}</span>
            </span>
          )}
          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="lg:hidden p-1 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* 2 Tabs: Shidney (Private AI) | Chats (Shared + @Commands + Inline @Shidney) */}
        <div className="p-1 border-b border-[#e2e8f0] bg-white grid grid-cols-2 gap-1 text-[11px]">
          <button
            type="button"
            onClick={() => setActivePaneTab('shidney')}
            className={`py-1.5 px-2 rounded-lg flex items-center justify-center gap-1.5 font-medium transition cursor-pointer ${
              activePaneTab === 'shidney'
                ? 'bg-[#0057B8] text-white shadow-sm font-semibold'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
            title="Shidney AI Assistant"
          >
            <Bot className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">Shidney</span>
          </button>

          <button
            type="button"
            onClick={() => setActivePaneTab('chats')}
            className={`py-1.5 px-2 rounded-lg flex items-center justify-center gap-1.5 font-medium transition cursor-pointer ${
              activePaneTab === 'chats'
                ? 'bg-[#0057B8] text-white shadow-sm font-semibold'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
            title="Team Chat, @Commands & Inline @Shidney"
          >
            <MessageSquare className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">Chats</span>
          </button>
        </div>

        {/* Tab Body Content */}
        <div className="flex-1 overflow-hidden">
          {activePaneTab === 'shidney' && (
            <div className="h-full flex flex-col">
              <ShidneyAIChat
                openedDocument={currentDoc}
                activePolicy={currentDoc || activePolicy}
                currentUser={currentUser}
                onSelectPolicy={onSelectPolicy}
                policies={policies}
              />
            </div>
          )}

          {activePaneTab === 'chats' && (
            <div className="h-full flex flex-col">
              <DraftCommentsFeed
                openedDocument={currentDoc}
                currentUser={currentUser}
                onOpenDraft={onOpenDraft}
                onActionClick={(actionUrl) => {
                  if (actionUrl?.startsWith('action:policy:') && onSelectPolicy) {
                    onSelectPolicy(actionUrl.replace('action:policy:', '').trim());
                  }
                }}
              />
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
