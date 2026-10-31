import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  Bot, 
  CheckCircle2, 
  Clock, 
  User, 
  X,
  FileSpreadsheet,
  Send,
  Sparkles,
  Layers,
  ClipboardList,
  AlertCircle,
  Plus,
  FileText,
  Calendar,
  Filter,
  Eye
} from 'lucide-react';
import { apiService } from '../services/apiService';
import ShidneyAIChat from './ShidneyAIChat';

export default function ContextualFeedPane({
  activePolicy,
  currentUser,
  isMobileOpen,
  onCloseMobile,
  isCollapsed = false,
  width = 340,
  refreshTrigger = 0,
  onOpenMakerChecker,
  onViewRequest,
  onSelectPolicy,
  policies = []
}) {
  const [activePaneTab, setActivePaneTab] = useState('chat'); // 'chat' | 'requests'
  const [comments, setComments] = useState([]);
  const [newCommentText, setNewCommentText] = useState('');
  const [changeLogs, setChangeLogs] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [metrics, setMetrics] = useState([]);

  // Minutes & Operational Issues near the Chatbot (Initialized clean)
  const [minutesAndIssues, setMinutesAndIssues] = useState([]);
  const [miFilter, setMiFilter] = useState('all'); // 'all' | 'minute' | 'issue'
  const [isAddingMI, setIsAddingMI] = useState(false);
  const [newMIType, setNewMIType] = useState('minute');
  const [newMITitle, setNewMITitle] = useState('');
  const [newMIDetails, setNewMIDetails] = useState('');
  const [newMISeverity, setNewMISeverity] = useState('Medium');

  useEffect(() => {
    const loadLogs = async () => {
      try {
        const logs = await apiService.getChangeLogs();
        if (logs) setChangeLogs(logs);

        const mc = await apiService.getMakerCheckerItems();
        if (mc?.pending) setPendingRequests(mc.pending);

        const m = await apiService.getDashboardMetrics(activePolicy?.department_id || 'all');
        if (m) setMetrics(m);
      } catch (err) {
        console.error('Failed to load logs:', err);
      }
    };
    loadLogs();
  }, [activePolicy?.id, refreshTrigger]);

  const handlePostComment = (e) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;

    setComments(prev => [
      ...prev,
      {
        id: `c-${Date.now()}`,
        author: currentUser?.name || 'Reviewer',
        role: currentUser?.roleType === 'manager' ? 'Bank Owner' : 'Bank Employee',
        time: 'Just now',
        text: newCommentText.trim()
      }
    ]);
    setNewCommentText('');
  };

  const handleCreateMI = (e) => {
    e.preventDefault();
    if (!newMITitle.trim()) return;
    const authorRole = currentUser?.roleType === 'manager' ? 'Bank Owner' : 'Bank Employee';
    const item = {
      id: `mi-${Date.now()}`,
      type: newMIType,
      title: newMITitle.trim(),
      date: 'Just now',
      author: `${currentUser?.name || 'Marcus Vance'} (${authorRole})`,
      details: newMIDetails.trim() || 'No additional details noted.',
      status: newMIType === 'minute' ? 'RECORDED' : 'OPEN',
      severity: newMISeverity
    };
    setMinutesAndIssues(prev => [item, ...prev]);
    setNewMITitle('');
    setNewMIDetails('');
    setIsAddingMI(false);
  };

  const handleQuickApprove = async (requestId) => {
    const note = window.prompt("Approver Decision Note / Feedback (Optional):", "Approved via Contextual Action Pane");
    if (note === null) return; // user cancelled prompt
    try {
      await apiService.reviewMakerCheckerItem(requestId, 'approve', currentUser?.name || 'Marcus Vance', note || 'Approved via Contextual Action Pane');
      setPendingRequests(prev => prev.filter(r => r.id !== requestId));
      alert("Change request approved and deployed to repository.");
    } catch (err) {
      console.error(err);
      alert("Failed to approve: " + err.message);
    }
  };

  const filteredMI = minutesAndIssues.filter(item => {
    if (miFilter === 'all') return true;
    return item.type === miFilter;
  });

  if (isCollapsed) return null;

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs z-40 lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        style={{ width: `${width}px` }}
        className={`
          flex-shrink-0 bg-[#f0f4f9] border-l border-[#dbe4ef] flex flex-col h-[calc(100vh-3.5rem)] select-none transition-all duration-200
          ${isMobileOpen 
            ? 'fixed inset-y-0 right-0 z-50 shadow-xl !w-80' 
            : 'relative z-10'}
        `}
      >
        {/* Top Header - Comments/Queries with Chat option */}
        <div className="h-11 px-3.5 border-b border-[#dbe4ef] bg-white flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-slate-800 text-[13px]">
            <MessageSquare className="w-4 h-4 text-blue-600" />
            <span className="truncate">Comments/Queries with Chat option</span>
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

        {/* 2 Clean Tabs: Chatbot (AI) | Requests */}
        <div className="p-1 border-b border-[#e2e8f0] bg-white grid grid-cols-2 gap-1 text-[11px]">
          <button
            onClick={() => setActivePaneTab('chat')}
            className={`py-1.5 px-2 rounded-lg flex items-center justify-center gap-1.5 font-medium transition cursor-pointer ${
              activePaneTab === 'chat'
                ? 'bg-[#0057B8] text-white shadow-sm font-semibold'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
            title="Interactive Banking AI Copilot"
          >
            <Bot className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">Chat</span>
          </button>

          <button
            onClick={() => setActivePaneTab('requests')}
            className={`py-1.5 px-2 rounded-lg flex items-center justify-center gap-1.5 font-medium transition cursor-pointer ${
              activePaneTab === 'requests'
                ? 'bg-[#0057B8] text-white shadow-sm font-semibold'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
            title="Policy Change Requests"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">Requests</span>
            {pendingRequests.length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full bg-amber-500 text-white text-[9.5px] font-bold">
                {pendingRequests.length}
              </span>
            )}
          </button>
        </div>

        {/* Tab Body Content */}
        <div className="flex-1 overflow-y-auto p-3.5 space-y-3 custom-scrollbar">
          
          {/* TAB 1: Chatbot (Shidney AI Copilot grounded in policy) */}
          {activePaneTab === 'chat' && (
            <div className="h-full flex flex-col">
              <ShidneyAIChat 
                activePolicy={activePolicy} 
                currentUser={currentUser}
                onSelectPolicy={onSelectPolicy}
                policies={policies}
              />
            </div>
          )}

          {/* TAB 2: Change Requests */}
          {activePaneTab === 'requests' && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider">
                  Pending Policy Change Requests
                </span>
                <button
                  onClick={onOpenMakerChecker}
                  className="text-[11px] font-medium text-slate-700 hover:text-slate-900 underline cursor-pointer"
                >
                  Full Modal →
                </button>
              </div>

              {pendingRequests.length === 0 ? (
                <div className="p-6 text-center text-slate-400 text-xs bg-white rounded-xl border border-slate-200">
                  <CheckCircle2 className="w-6 h-6 text-slate-300 mx-auto mb-1.5" />
                  <p className="font-medium text-slate-600">All Requests Adjudicated</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">No pending employee submissions in queue.</p>
                </div>
              ) : (
                pendingRequests.map(req => (
                  <div key={req.id} className="p-3 rounded-lg border border-slate-200 bg-white shadow-2xs text-[12px] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-800 text-[12px] truncate">{req.title || 'Amendment Request'}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-50 text-amber-700 border border-amber-200 font-semibold">
                        PENDING
                      </span>
                    </div>
                    <p className="text-slate-600 text-[11.5px] leading-snug">{req.change_summary || req.reason}</p>
                    <div className="text-[10.5px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-100">
                      <span>Submitted by {req.maker_name}</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            if (onViewRequest) {
                              onViewRequest(req);
                            } else if (onOpenMakerChecker) {
                              onOpenMakerChecker();
                            }
                          }}
                          className="px-2.5 py-0.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 rounded text-[11px] font-medium transition cursor-pointer shadow-2xs flex items-center gap-1"
                          title="View Request Details & Proposed Clauses"
                        >
                          <Eye className="w-3 h-3 text-slate-500" />
                          <span>View</span>
                        </button>
                        {currentUser?.roleType === 'manager' && (
                          <button
                            type="button"
                            onClick={() => handleQuickApprove(req.id)}
                            className="px-2.5 py-0.5 bg-[#0057B8] hover:bg-[#004EA6] text-white rounded text-[11px] font-medium transition cursor-pointer shadow-2xs"
                          >
                            Approve
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
