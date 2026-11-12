import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  RefreshCw, 
  FileText, 
  Clock, 
  User, 
  Check, 
  X, 
  Trash2, 
  FileEdit, 
  Send, 
  Eye, 
  Search, 
  ArrowLeft, 
  Plus, 
  CheckCircle, 
  AlertCircle, 
  MessageSquare, 
  Layers, 
  ChevronDown, 
  ChevronUp, 
  Sparkles,
  Sliders,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  History as HistoryIcon
} from 'lucide-react';
import { apiService } from '../../services/apiService';

export function ChangeManagementCenterPane({
  currentUser,
  drafts = [],
  inReviewItems = [],
  historyItems = [],
  policies = [],
  onEditDraft,
  onRefresh,
  onBackToPolicy,
  onOpenAddPolicyModal,
  initialTab = 'drafts',
  focusedItemId = null,
  onSelectDraft = null,
  selectedDraftId = null,
  onViewDraft = null
}) {
  const isBankOwner = currentUser?.roleType === 'manager' || currentUser?.roleType === 'admin' || currentUser?.roleType === 'owner';
  const isEmployee = !isBankOwner;

  const [activeTab, setActiveTab] = useState(initialTab || (isBankOwner ? 'in_review' : 'drafts'));
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedDraftId, setExpandedDraftId] = useState(null);
  const [draftScope, setDraftScope] = useState('all'); // 'all' | 'my'
  const [expandedVersionDraftId, setExpandedVersionDraftId] = useState(null);
  const [draftVersionsCache, setDraftVersionsCache] = useState({});
  const [comparingDraftId, setComparingDraftId] = useState(null);
  const [compareV1, setCompareV1] = useState(null);
  const [compareV2, setCompareV2] = useState(null);

  const handleToggleVersionHistory = async (draftId) => {
    if (expandedVersionDraftId === draftId) {
      setExpandedVersionDraftId(null);
      return;
    }
    setExpandedVersionDraftId(draftId);
    if (!draftVersionsCache[draftId]) {
      try {
        const res = await apiService.getPolicyVersions(draftId);
        if (Array.isArray(res) && res.length > 0) {
          setDraftVersionsCache(prev => ({ ...prev, [draftId]: res }));
        }
      } catch (_) {}
    }
  };
  const [selectedReviewItemId, setSelectedReviewItemId] = useState(focusedItemId || null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Approver decision note
  const [approverComments, setApproverComments] = useState('');

  // Submitter note modal state (when submitting a draft for approval)
  const [draftToSubmit, setDraftToSubmit] = useState(null);
  const [submissionNote, setSubmissionNote] = useState('');

  // Quick view drawer/modal for clauses
  const [viewingDraftClauses, setViewingDraftClauses] = useState(null);

  const handleViewDraft = async (draft) => {
    setViewingDraftClauses(draft);
    if (draft && draft.id) {
      try {
        const full = await apiService.getPolicyDetails(draft.id, currentUser?.roleType || 'employee');
        if (full) {
          setViewingDraftClauses(prev => (prev && prev.id === draft.id ? { ...prev, ...full } : full));
        }
      } catch (_) {}
    }
  };

  // Sync initialTab and focused item if passed
  useEffect(() => {
    if (initialTab) setActiveTab(initialTab);
    if (focusedItemId) {
      setSelectedReviewItemId(focusedItemId);
      setActiveTab('in_review');
    }
  }, [initialTab, focusedItemId]);

  // Combine and deduplicate drafts from maker-checker and policies
  const allDrafts = useMemo(() => {
    const list = [...(drafts || [])];
    (policies || []).forEach(p => {
      if (p.status === 'draft' && !list.some(d => String(d.id) === String(p.id))) {
        list.push(p);
      }
    });
    return list;
  }, [drafts, policies]);

  // Filter drafts by user role if employee
  const currentUserName = currentUser?.name?.toLowerCase().trim() || '';
  const filteredDrafts = useMemo(() => {
    let result = allDrafts;
    if (!isBankOwner && currentUserName) {
      result = allDrafts.filter(d => {
        const creator = (d.created_by || d.requested_by || '').toLowerCase();
        return creator.includes(currentUserName) || currentUserName.includes(creator);
      });
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(d => 
        (d.title || '').toLowerCase().includes(q) ||
        (d.department_name || '').toLowerCase().includes(q) ||
        (d.created_by || '').toLowerCase().includes(q) ||
        (d.summary || '').toLowerCase().includes(q)
      );
    }
    return result;
  }, [allDrafts, isBankOwner, currentUserName, searchQuery]);

  // Filter in-review items
  const filteredInReview = useMemo(() => {
    let list = inReviewItems || [];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(item => 
        (item.policy_title || item.title || '').toLowerCase().includes(q) ||
        (item.department_name || '').toLowerCase().includes(q) ||
        (item.maker_name || '').toLowerCase().includes(q) ||
        (item.change_details || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [inReviewItems, searchQuery]);

  // Filter history items
  const filteredHistory = useMemo(() => {
    let list = historyItems || [];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(item => 
        (item.policy_title || item.title || '').toLowerCase().includes(q) ||
        (item.department_name || '').toLowerCase().includes(q) ||
        (item.checker_name || '').toLowerCase().includes(q) ||
        (item.checker_comments || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [historyItems, searchQuery]);

  // 1. Submit Draft for Approval (Opens prompt for Submitter Note)
  const handleOpenSubmitModal = (draft) => {
    setDraftToSubmit(draft);
    setSubmissionNote(`Operational policy "${draft.title}" finalized. Ready for APRA CPS 234 dual sign-off.`);
  };

  const handleConfirmSubmitForApproval = async () => {
    if (!draftToSubmit) return;
    setIsSubmitting(true);
    try {
      const p = typeof draftToSubmit.parameters === 'string'
        ? JSON.parse(draftToSubmit.parameters || '{}')
        : (draftToSubmit.parameters || {});

      await apiService.createMakerCheckerItem({
        policy_id: draftToSubmit.id,
        policy_title: draftToSubmit.title,
        title: draftToSubmit.title,
        department_name: draftToSubmit.department_name || 'Retail Banking',
        department: draftToSubmit.department_name || 'Retail Banking',
        maker_name: currentUser?.name || 'Bank Employee',
        requested_by: `${currentUser?.name || 'Bank Employee'} (${currentUser?.role || 'Staff'})`,
        change_details: submissionNote || `Draft policy submitted for sign-off.`,
        status: 'pending',
        proposed_changes: {
          title: draftToSubmit.title,
          summary: draftToSubmit.summary,
          content: draftToSubmit.content,
          parameters: p,
          submission_note: submissionNote,
          submitted_at: new Date().toISOString()
        }
      });

      alert(`Draft "${draftToSubmit.title}" submitted for approval with your note! Marcus Vance will review.`);
      setDraftToSubmit(null);
      setSubmissionNote('');
      if (onRefresh) onRefresh();
      setActiveTab('in_review');
    } catch (err) {
      console.error('Failed to submit draft:', err);
      alert('Failed to submit draft: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 2. Publish draft directly as active (Bank Administrator action)
  const handlePublishDraft = async (draft) => {
    if (!window.confirm(`Publish "${draft.title}" immediately as active policy?`)) return;
    setIsSubmitting(true);
    try {
      await apiService.publishDraft(draft.id, currentUser?.name || 'Marcus Vance (Bank Administrator)');
      alert(`Policy "${draft.title}" published as active in repository!`);
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Failed to publish draft:', err);
      alert('Failed to publish draft: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3. Delete draft from DB
  const handleDeleteDraft = async (draftId, draftTitle) => {
    if (!window.confirm(`Are you sure you want to permanently delete draft "${draftTitle}"?`)) return;
    setIsSubmitting(true);
    try {
      await apiService.deletePolicy(draftId);
      alert('Draft removed successfully from PostgreSQL database.');
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Failed to delete draft:', err);
      alert('Failed to delete draft: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 4. Adjudicate Maker-Checker Request (Approve or Reject with Decision Note)
  const handleActionRequest = async (item, action) => {
    setIsSubmitting(true);
    try {
      const decisionNote = approverComments.trim() || (action === 'approve' ? 'Approved per APRA CPS 234 Dual-Control Governance' : 'Rejected - Revisions requested');
      await apiService.actionMakerChecker(
        item.id,
        action,
        currentUser?.name || 'Marcus Vance (Bank Administrator)',
        decisionNote
      );
      alert(`Request CR-#${item.id} ${action === 'approve' ? 'APPROVED & DEPLOYED' : 'REJECTED'} successfully!`);
      setApproverComments('');
      setSelectedReviewItem(null);
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Failed to action request:', err);
      alert('Failed to action request: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper to extract clauses safely
  const getDraftClauses = (draft) => {
    if (!draft) return [];
    const p = typeof draft.parameters === 'string'
      ? JSON.parse(draft.parameters || '{}')
      : (draft.parameters || {});
    if (p.sections && Array.isArray(p.sections) && p.sections.length > 0) {
      return p.sections;
    }
    const raw = draft.content || '';
    const parts = raw.split(/(?=###\s+)/);
    if (parts.length > 1) {
      return parts.map((part, i) => {
        const match = part.match(/^###\s*(?:\d+\.?\s*)?(.*?)\n([\s\S]*)$/);
        return {
          id: `sec-${i}`,
          title: match ? match[1].trim() : `Section ${i + 1}`,
          content: match ? match[2].trim() : part.trim()
        };
      });
    }
    return [
      { id: 'sec-summary', title: 'Executive Summary', content: draft.summary || raw }
    ];
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#f8fafc] overflow-hidden select-text">
      
      {/* Top Header Bar */}
      <div className="px-6 py-3.5 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-3">


          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#0057B8] animate-pulse"></span>
              <h1 className="text-base font-bold text-slate-900">
                Change Management
              </h1>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onOpenAddPolicyModal && (
            <button
              type="button"
              onClick={onOpenAddPolicyModal}
              className="px-3.5 py-1.5 bg-[#0057B8] hover:bg-[#004EA6] text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-xs flex items-center gap-1.5 active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Policy</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs and Search Filter Bar */}
      <div className="px-6 py-2.5 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {/* Tab 1: Saved Drafts */}
          <button
            type="button"
            onClick={() => setActiveTab('drafts')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'drafts'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Saved Drafts</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
              activeTab === 'drafts' ? 'bg-amber-600 text-white' : 'bg-slate-200 text-slate-700'
            }`}>
              {filteredDrafts.length}
            </span>
          </button>

          {/* Tab 2: In Review Queue */}
          <button
            type="button"
            onClick={() => setActiveTab('in_review')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'in_review'
                ? 'bg-[#0057B8] text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>In Review Queue</span>
            {inReviewItems.length > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                activeTab === 'in_review' ? 'bg-blue-700 text-white' : 'bg-amber-100 text-amber-900 border border-amber-300'
              }`}>
                {inReviewItems.length}
              </span>
            )}
          </button>

          {/* Tab 3: Approval History */}
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'history'
                ? 'bg-[#0057B8] text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Approval History</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
              activeTab === 'history' ? 'bg-blue-800 text-white' : 'bg-slate-200 text-slate-700'
            }`}>
              {filteredHistory.length}
            </span>
          </button>
        </div>

        {/* Search input */}
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search title, department, author..."
            className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-300 focus:outline-none focus:border-[#0057B8] focus:ring-1 focus:ring-[#0057B8] text-xs bg-slate-50"
          />
        </div>
      </div>

      {/* Main Tab Content */}
      <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">

        {/* ========================================================= */}
        {/* TAB 1: SAVED DRAFTS IN ROWS (Table / List Row View)       */}
        {/* ========================================================= */}
        {activeTab === 'drafts' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900">
                Saved Drafts ({filteredDrafts.length})
              </h2>
            </div>

            {filteredDrafts.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-2xs">
                <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2.5" />
                <h3 className="font-bold text-slate-700 text-sm">No Saved Drafts Found</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
                  When you save policy drafts in the creation modal, they appear right here in structured rows for fast re-editing and sign-off.
                </p>
                {onOpenAddPolicyModal && (
                  <button
                    type="button"
                    onClick={onOpenAddPolicyModal}
                    className="mt-4 px-4 py-2 bg-[#0057B8] hover:bg-[#004EA6] text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Create Starting Draft</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
                {/* Table Header */}
                <div className="grid grid-cols-12 gap-3 px-5 py-3 bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <div className="col-span-12 sm:col-span-5">Draft Document</div>
                  <div className="col-span-6 sm:col-span-3">Department</div>
                  <div className="col-span-6 sm:col-span-2">Author & Date</div>

                  <div className="col-span-12 sm:col-span-2 text-right">Actions</div>
                </div>

                {/* Table Rows */}
                <div className="divide-y divide-slate-100">
                  {filteredDrafts.map((draft) => {
                    const params = typeof draft.parameters === 'string'
                      ? JSON.parse(draft.parameters || '{}')
                      : (draft.parameters || {});
                    const clauses = getDraftClauses(draft);
                    const isExpanded = expandedDraftId === draft.id;

                    return (
                      <div 
                        key={draft.id} 
                        onClick={() => onSelectDraft && onSelectDraft(draft)}
                        className={`transition cursor-pointer ${
                          selectedDraftId === draft.id 
                            ? 'bg-blue-50/80 border-l-4 border-l-[#0057B8] shadow-2xs' 
                            : 'hover:bg-slate-50/80'
                        }`}
                        title="Click to open this draft's comments"
                      >
                        {/* Primary Row */}
                        <div className="grid grid-cols-12 gap-3 px-5 py-4 items-center">
                          
                          {/* Col 1: Draft Title & Summary */}
                          <div className="col-span-12 sm:col-span-5 min-w-0 pr-2">
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0"></span>
                              <h3 className="font-bold text-slate-900 text-[13.5px] truncate">
                                {draft.title || 'Untitled Operational Policy'}
                              </h3>
                              <span className="text-[10px] font-bold px-2 py-0.2 rounded-md bg-amber-100 text-amber-900 border border-amber-200 flex-shrink-0">
                                Draft
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 truncate mt-1">
                              {draft.summary || 'Operational policy clauses authored in system.'}
                            </p>
                            <span className="text-[10px] font-mono text-slate-400 mt-0.5 inline-block">
                              ID: {draft.id}
                            </span>
                          </div>

                          {/* Col 2: Department */}
                          <div className="col-span-6 sm:col-span-3 text-xs">
                            <span className="px-2.5 py-1 rounded-md bg-blue-50 text-[#0057B8] font-bold text-[11px] border border-blue-200/60 inline-block truncate max-w-full">
                              {draft.department_name || draft.department_id || 'Retail Banking'}
                            </span>
                          </div>

                          {/* Col 3: Author & Date */}
                          <div className="col-span-6 sm:col-span-2 text-xs text-slate-600">
                            <div className="flex items-center gap-1 font-semibold text-slate-800 text-[11.5px]">
                              <User className="w-3 h-3 text-slate-400" />
                              <span className="truncate">{draft.created_by && !draft.created_by.toLowerCase().includes('sarah') ? draft.created_by : 'Draft Revision'}</span>
                            </div>
                            <p className="text-[10.5px] text-slate-400 mt-0.5 flex items-center gap-1">
                              <Clock className="w-3 h-3 text-slate-300" />
                              <span>{new Date(draft.updated_at || draft.created_at || Date.now()).toLocaleDateString()}</span>
                            </p>
                          </div>

                          {/* Col 4: Actions Toolbar */}
                          <div className="col-span-12 sm:col-span-2 flex items-center justify-end gap-1.5 flex-wrap">
                            {/* 1. View Draft Document like Master Library with Chat */}
                            <button
                              type="button"
                              onClick={() => {
                                if (onViewDraft) {
                                  onViewDraft(draft);
                                } else {
                                  handleViewDraft(draft);
                                }
                              }}
                              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-blue-50 text-[#0057B8] transition cursor-pointer"
                              title="View Draft Document with Chat & Collaboration"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            {/* 1.5. Chat & Assign Task Panel */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (onSelectDraft) onSelectDraft(draft);
                              }}
                              className={`p-1.5 rounded-lg border transition cursor-pointer ${
                                selectedDraftId === draft.id
                                  ? 'bg-[#0057B8] text-white border-[#0057B8] shadow-xs'
                                  : 'border-slate-200 bg-white hover:bg-blue-50 text-[#0057B8]'
                              }`}
                              title="Open Draft Chat & Assign Tasks to Squad"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                            </button>

                            {/* 2. Re-edit in Full Editor (Blue/Indigo accent) */}
                            {onEditDraft && (
                              <button
                                type="button"
                                onClick={() => onEditDraft(draft)}
                                className="px-2.5 py-1.5 rounded-lg border border-slate-300 hover:border-[#0057B8] bg-white hover:bg-blue-50/50 text-[#0057B8] text-[11px] font-bold transition cursor-pointer flex items-center gap-1 shadow-2xs"
                                title="Open in Full Editor with all draft specifications"
                              >
                                <FileEdit className="w-3.5 h-3.5" />
                                <span>Edit</span>
                              </button>
                            )}

                            {/* 2.5. Version History & Commit Snapshots */}
                            <button
                              type="button"
                              onClick={() => handleToggleVersionHistory(draft.id)}
                              className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-bold transition cursor-pointer flex items-center gap-1 shadow-2xs ${
                                expandedVersionDraftId === draft.id
                                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                                  : 'border-slate-300 hover:border-[#0057B8] bg-white hover:bg-blue-50/50 text-[#0057B8]'
                              }`}
                              title="Inspect Version History & Commit Snapshots for this Draft"
                            >
                              <HistoryIcon className="w-3.5 h-3.5" />
                              <span>History</span>
                            </button>

                            {/* 3. Submit for Approval (Blue per user request) */}
                            {isEmployee ? (
                              <button
                                type="button"
                                onClick={() => handleOpenSubmitModal(draft)}
                                className="px-3 py-1.5 rounded-lg bg-[#0057B8] hover:bg-[#004EA6] text-white text-[11px] font-bold transition cursor-pointer flex items-center gap-1 shadow-xs active:scale-95"
                                title="Submit Draft to Bank Administrator for Approval"
                              >
                                <Send className="w-3 h-3" />
                                <span>Submit</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handlePublishDraft(draft)}
                                disabled={isSubmitting}
                                className="px-3 py-1.5 rounded-lg bg-[#0057B8] hover:bg-[#004EA6] text-white text-[11px] font-bold transition cursor-pointer flex items-center gap-1 shadow-xs active:scale-95"
                                title="Publish directly to Active"
                              >
                                <Check className="w-3 h-3" />
                                <span>Publish</span>
                              </button>
                            )}

                            {/* 4. Delete Draft */}
                            <button
                              type="button"
                              onClick={() => handleDeleteDraft(draft.id, draft.title)}
                              disabled={isSubmitting}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                              title="Delete Draft"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Expandable Version History Accordion */}
                        {expandedVersionDraftId === draft.id && (() => {
                          const localList = (params.versions && params.versions.length > 0) ? params.versions : [];
                          const dbList = draftVersionsCache[draft.id] || [];
                          const seen = new Set();
                          const verList = [];
                          for (const v of [...localList, ...dbList]) {
                            const key = String(v.version || v.version_number || '').trim();
                            if (key && !seen.has(key)) {
                              seen.add(key);
                              verList.push(v);
                            }
                          }
                          const finalVerList = verList.length > 0 ? verList : [
                            {
                              version: draft.version || '1.0',
                              timestamp: draft.updated_at || draft.created_at || new Date().toISOString(),
                              sections: clauses,
                              notes: 'Initial version draft'
                            }
                          ];

                          return (
                            <div className="px-5 py-3.5 bg-blue-50/40 border-t border-blue-100 text-xs space-y-2">
                              <div className="flex items-center justify-between">
                                <h4 className="font-bold text-blue-900 text-xs flex items-center gap-1.5">
                                  <Layers className="w-3.5 h-3.5 text-blue-600" />
                                  <span>Version History & User Draft Revisions ({finalVerList.length})</span>
                                </h4>
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const nextState = comparingDraftId === draft.id ? null : draft.id;
                                      setComparingDraftId(nextState);
                                      if (nextState) {
                                        setCompareV1(finalVerList[finalVerList.length - 1]?.version || '1.0');
                                        setCompareV2(finalVerList[0]?.version || draft.version || '1.1');
                                      }
                                    }}
                                    className="px-2.5 py-1 bg-white hover:bg-blue-50 text-[#0057B8] border border-blue-200 rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-2xs cursor-pointer active:scale-95"
                                    title="Compare differences across revisions"
                                  >
                                    <Sliders className="w-3 h-3 text-[#0057B8]" />
                                    <span>{comparingDraftId === draft.id ? 'Hide Compare' : 'Compare Versions & Diff'}</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => { setExpandedVersionDraftId(null); setComparingDraftId(null); }}
                                    className="text-slate-400 hover:text-slate-600 text-[11px] cursor-pointer"
                                  >
                                    Close
                                  </button>
                                </div>
                              </div>
                              <div className="space-y-1.5">
                                {finalVerList.map((ver, vIdx) => (
                                  <div key={vIdx} className="p-2.5 rounded-xl bg-white border border-blue-200/80 flex items-center justify-between gap-3 shadow-2xs">
                                    <div className="flex items-center gap-2.5 min-w-0">
                                      <span className="font-mono font-bold text-xs bg-blue-100 text-blue-800 px-2.5 py-1 rounded-md">
                                        {ver.version || `v1.${vIdx}`}
                                      </span>
                                      <div className="min-w-0">
                                        <p className="font-bold text-slate-800 text-xs truncate">
                                          {ver.title || draft.title}
                                        </p>
                                        <p className="text-[10.5px] text-slate-400 mt-0.5">
                                          {new Date(ver.timestamp || Date.now()).toLocaleString()} • {(ver.sections || []).length} Sections • {ver.notes || 'User draft'}
                                        </p>
                                      </div>
                                    </div>
                                    {onEditDraft && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          onEditDraft({
                                            ...draft,
                                            title: ver.title || draft.title,
                                            summary: ver.summary || draft.summary,
                                            version: ver.version || ver.version_number,
                                            content: ver.content || draft.content,
                                            parameters: {
                                              ...params,
                                              version: ver.version || ver.version_number,
                                              sections: ver.sections || params.sections || []
                                            }
                                          });
                                          apiService.restorePolicyVersion(draft.id, ver.id || ver.version, currentUser?.name).catch(() => {});
                                        }}
                                        className="px-2.5 py-1 bg-white hover:bg-blue-50 text-[#0057B8] border border-blue-300 rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-2xs cursor-pointer flex-shrink-0"
                                        title="Restore and edit this specific version"
                                      >
                                        <FileEdit className="w-3 h-3" />
                                        <span>Restore & Edit</span>
                                      </button>
                                    )}
                                  </div>
                                ))}
                              </div>

                              {/* Compare Versions & Clause Diff Inspector */}
                              {comparingDraftId === draft.id && (() => {
                                const verAObj = finalVerList.find(v => (v.version || v.version_number) === compareV1) || finalVerList[finalVerList.length - 1] || finalVerList[0];
                                const verBObj = finalVerList.find(v => (v.version || v.version_number) === compareV2) || finalVerList[0];

                                const secsA = verAObj.sections || [];
                                const secsB = verBObj.sections || clauses;

                                // Build comparison map by title
                                const allTitles = Array.from(new Set([
                                  ...secsA.map(s => s.title || 'Untitled Section'),
                                  ...secsB.map(s => s.title || 'Untitled Section')
                                ]));

                                return (
                                  <div className="mt-3 p-3.5 bg-white border border-blue-200 rounded-2xl shadow-xs space-y-3">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
                                      <span className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                                        <Sliders className="w-3.5 h-3.5 text-[#0057B8]" />
                                        <span>Compare Revisions & Clause Differential</span>
                                      </span>
                                      
                                      <div className="flex items-center gap-2">
                                        <div className="flex items-center gap-1">
                                          <span className="text-[10.5px] font-semibold text-slate-500">Base:</span>
                                          <select
                                            value={compareV1 || ''}
                                            onChange={(e) => setCompareV1(e.target.value)}
                                            className="text-[11px] font-bold p-1 border border-slate-200 rounded-lg bg-slate-50 text-slate-800"
                                          >
                                            {finalVerList.map((v, i) => (
                                              <option key={i} value={v.version || v.version_number}>{v.version || `v1.${i}`}</option>
                                            ))}
                                          </select>
                                        </div>

                                        <span className="text-slate-400 text-xs">→</span>

                                        <div className="flex items-center gap-1">
                                          <span className="text-[10.5px] font-semibold text-slate-500">Compare:</span>
                                          <select
                                            value={compareV2 || ''}
                                            onChange={(e) => setCompareV2(e.target.value)}
                                            className="text-[11px] font-bold p-1 border border-blue-300 rounded-lg bg-blue-50/50 text-[#0057B8]"
                                          >
                                            {finalVerList.map((v, i) => (
                                              <option key={i} value={v.version || v.version_number}>{v.version || `v1.${i}`}</option>
                                            ))}
                                          </select>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Clause diff items */}
                                    <div className="space-y-2">
                                      {allTitles.map((tTitle, tIdx) => {
                                        const sA = secsA.find(s => (s.title || 'Untitled Section') === tTitle);
                                        const sB = secsB.find(s => (s.title || 'Untitled Section') === tTitle);

                                        let status = 'unchanged';
                                        let badgeColor = 'bg-slate-100 text-slate-600 border-slate-200';
                                        let badgeText = 'No changes';
                                        let snippet = sB?.content || sA?.content || '';

                                        if (!sA && sB) {
                                          status = 'added';
                                          badgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                                          badgeText = '+ Added content';
                                        } else if (sA && !sB) {
                                          status = 'removed';
                                          badgeColor = 'bg-rose-50 text-rose-700 border-rose-200';
                                          badgeText = '- Content removed';
                                          snippet = sA.content;
                                        } else if (sA && sB && (sA.content || '').trim() !== (sB.content || '').trim()) {
                                          status = 'modified';
                                          badgeColor = 'bg-blue-50 text-[#0057B8] border-blue-200';
                                          badgeText = '~ Modified content';
                                        }

                                        return (
                                          <div
                                            key={tIdx}
                                            className={`p-2.5 rounded-xl border text-xs transition ${
                                              status === 'added' ? 'border-emerald-200 bg-emerald-50/30' :
                                              status === 'removed' ? 'border-rose-200 bg-rose-50/30' :
                                              status === 'modified' ? 'border-blue-200 bg-blue-50/30' :
                                              'border-slate-100 bg-slate-50/50'
                                            }`}
                                          >
                                            <div className="flex items-center justify-between gap-2">
                                              <span className="font-bold text-slate-800 text-xs truncate">
                                                {tIdx + 1}. {tTitle}
                                              </span>
                                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badgeColor}`}>
                                                {badgeText}
                                              </span>
                                            </div>
                                            {snippet && (
                                              <p className="text-[11px] text-slate-600 mt-1 line-clamp-2 leading-relaxed font-sans">
                                                {snippet}
                                              </p>
                                            )}
                                          </div>
                                        );
                                      })}
                                    </div>

                                    {/* Legend */}
                                    <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100 text-[10.5px]">
                                      <span className="flex items-center gap-1 font-semibold text-emerald-700">
                                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Added
                                      </span>
                                      <span className="flex items-center gap-1 font-semibold text-rose-700">
                                        <span className="w-2 h-2 rounded-full bg-rose-500"></span> Removed
                                      </span>
                                      <span className="flex items-center gap-1 font-semibold text-[#0057B8]">
                                        <span className="w-2 h-2 rounded-full bg-[#0057B8]"></span> Modified
                                      </span>
                                      <span className="flex items-center gap-1 font-semibold text-slate-500">
                                        <span className="w-2 h-2 rounded-full bg-slate-400"></span> No changes
                                      </span>
                                    </div>
                                  </div>
                                );
                              })()}
                            </div>
                          );
                        })()}

                        {/* Inline Expandable Clause Preview */}
                        {isExpanded && (
                          <div className="px-5 py-3 bg-slate-50/90 border-t border-slate-100 text-xs">
                            <h4 className="font-bold text-slate-700 text-[11.5px] uppercase tracking-wider mb-2">
                              Draft Clauses Preview ({clauses.length})
                            </h4>
                            <div className="space-y-2">
                              {clauses.map((sec, idx) => (
                                <div key={sec.id || idx} className="p-2.5 rounded-xl bg-white border border-slate-200">
                                  <h5 className="font-bold text-slate-800 text-xs">{sec.title || `Clause ${idx + 1}`}</h5>
                                  <p className="text-[11.5px] text-slate-600 mt-1 whitespace-pre-wrap">{sec.content}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: IN REVIEW QUEUE (Submitter & Approver View & Diff) */}
        {/* ========================================================= */}
        {activeTab === 'in_review' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900">
                In-Review Queue ({filteredInReview.length})
              </h2>
            </div>

            {filteredInReview.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-2xs">
                <CheckCircle className="w-10 h-10 text-[#0057B8] mx-auto mb-2.5" />
                <h3 className="font-bold text-slate-700 text-sm">Governance Queue Clean</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
                  All employee policy proposals and amendments have been adjudicated. No pending items in review.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Left: Pending Requests List */}
                <div className="lg:col-span-5 space-y-2.5">
                  {filteredInReview.map((item) => {
                    const activeItem = filteredInReview.find(i => String(i.id) === String(selectedReviewItemId)) || filteredInReview[0];
                    const isSelected = activeItem?.id === item.id;
                    const changes = typeof item.proposed_changes === 'string'
                      ? JSON.parse(item.proposed_changes || '{}')
                      : (item.proposed_changes || {});

                    return (
                      <div
                        key={item.id}
                        onClick={() => setSelectedReviewItemId(item.id)}
                        className={`p-4 rounded-2xl border text-left cursor-pointer transition-all ${
                          isSelected
                            ? 'border-[#0057B8] bg-blue-50/70 shadow-xs ring-2 ring-[#0057B8]/25'
                            : 'border-slate-200 hover:border-slate-300 bg-white shadow-2xs'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] font-mono font-bold text-blue-700 bg-blue-100/70 border border-blue-200 px-2 py-0.5 rounded-md">
                            CR-#{item.id}
                          </span>
                          <span className="text-[11px] text-slate-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(item.created_at).toLocaleDateString()}
                          </span>
                        </div>

                        <h4 className="text-[13px] font-bold text-slate-900 line-clamp-1">
                          {item.policy_title || item.title}
                        </h4>

                        <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 pt-2 border-t border-slate-100">
                          <span className="truncate font-medium">{item.department_name || 'Retail Banking'}</span>
                          <span className="text-slate-600 font-semibold flex items-center gap-1">
                            <User className="w-3 h-3 text-slate-400" /> {item.maker_name}
                          </span>
                        </div>

                        {changes.submission_note && (
                          <div className="mt-2 p-2 bg-blue-50/70 border border-blue-100 rounded-lg text-[11px] text-blue-900 italic line-clamp-2">
                            "{changes.submission_note}"
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Right: Selected Request Review & Visual Diff Pane */}
                <div className="lg:col-span-7">
                  {(() => {
                    const item = filteredInReview.find(i => String(i.id) === String(selectedReviewItemId)) || filteredInReview[0];
                    if (!item) return null;

                    let changes = item.proposed_changes;
                    if (typeof changes === 'string') {
                      try { changes = JSON.parse(changes); } catch (_) { changes = {}; }
                    }

                    const params = changes.parameters || {};
                    const proposedSections = params.sections || [];

                    return (
                      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 space-y-4">
                        
                        {/* Header Details */}
                        <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10.5px] font-mono font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                                CR-#{item.id}
                              </span>
                              <span className="text-xs font-semibold text-slate-500">
                                {item.department_name || 'Retail Banking'}
                              </span>
                            </div>
                            <h3 className="text-base font-bold text-slate-900 mt-1">
                              {item.policy_title || item.title}
                            </h3>
                          </div>

                          <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300 font-bold text-[10.5px] uppercase tracking-wide">
                            Pending Approval
                          </span>
                        </div>

                        {/* Submitter Info and Note Box */}
                        <div className="p-3.5 rounded-xl bg-blue-50/80 border border-blue-200/90 text-xs space-y-2">
                          <div className="flex items-center justify-between text-[11px] text-blue-800 font-semibold">
                            <span className="flex items-center gap-1.5">
                              <User className="w-3.5 h-3.5 text-[#0057B8]" />
                              <span>Submitted by: <strong>{item.maker_name}</strong> ({item.maker_role || 'Staff Submitter'})</span>
                            </span>
                            <span>{new Date(item.created_at).toLocaleString()}</span>
                          </div>

                          {/* Submission Note */}
                          <div className="pt-1 text-slate-800">
                            <span className="font-bold text-[11px] text-blue-900 block mb-0.5">
                              Submitter Operational Context / Note:
                            </span>
                            <p className="text-xs italic bg-white p-2 rounded-lg border border-blue-200 leading-relaxed text-slate-700">
                              {changes.submission_note || item.change_details || 'Draft policy submitted for review.'}
                            </p>
                          </div>
                        </div>

                        {/* Proposed Operational Thresholds (Highlighted in Blue) */}
                        <div className="space-y-2">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                            <Sliders className="w-3.5 h-3.5 text-[#0057B8]" />
                            <span>Proposed Operational Limits & SLA</span>
                          </h4>
                          <div className="grid grid-cols-3 gap-2.5">
                            <div className="p-2.5 rounded-xl bg-blue-50/70 border border-blue-200 text-xs">
                              <span className="text-[10.5px] text-blue-700 font-medium block">Turnaround SLA</span>
                              <strong className="text-blue-900 font-bold text-sm">{params.turnaround_sla || '4 Hours'}</strong>
                            </div>
                            <div className="p-2.5 rounded-xl bg-blue-50/70 border border-blue-200 text-xs">
                              <span className="text-[10.5px] text-blue-700 font-medium block">Daily Limit</span>
                              <strong className="text-blue-900 font-bold text-sm">{params.daily_limit || '$25,000 AUD'}</strong>
                            </div>
                            <div className="p-2.5 rounded-xl bg-blue-50/70 border border-blue-200 text-xs">
                              <span className="text-[10.5px] text-blue-700 font-medium block">Officer Approval Cap</span>
                              <strong className="text-blue-900 font-bold text-sm">{params.approval_limits?.officer_cap || '$100,000 AUD'}</strong>
                            </div>
                          </div>
                        </div>

                        {/* Proposed Clauses */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                              <Layers className="w-3.5 h-3.5 text-[#0057B8]" />
                              <span>Proposed Clauses Specification ({proposedSections.length || 1})</span>
                            </h4>
                            <span className="text-[10.5px] font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md">
                              Proposed Clauses
                            </span>
                          </div>

                          <div className="space-y-2.5 max-h-64 overflow-y-auto custom-scrollbar p-1">
                            {proposedSections.length > 0 ? (
                              proposedSections.map((sec, idx) => (
                                <div 
                                  key={sec.id || idx} 
                                  className="p-3 rounded-xl bg-blue-50/40 border border-blue-200/80 text-xs space-y-1"
                                >
                                  <div className="flex items-center justify-between">
                                    <h5 className="font-bold text-slate-900 text-[12px] flex items-center gap-1.5">
                                      <span className="w-2 h-2 rounded-full bg-[#0057B8]"></span>
                                      <span>{sec.title || `Clause ${idx + 1}`}</span>
                                    </h5>
                                    <span className="text-[10px] font-mono font-bold text-blue-700 bg-blue-100 px-1.5 py-0.2 rounded">
                                      Clause #{idx + 1}
                                    </span>
                                  </div>
                                  <p className="text-[11.5px] text-slate-800 whitespace-pre-wrap leading-relaxed pt-1">
                                    {sec.content}
                                  </p>
                                </div>
                              ))
                            ) : (
                              <div className="p-3 rounded-xl bg-blue-50/40 border border-blue-200/80 text-xs whitespace-pre-wrap leading-relaxed font-mono">
                                {changes.content || 'No custom clauses attached.'}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Approver Adjudication Action Box (Bank Administrator) */}
                        {isBankOwner ? (
                          <div className="pt-3 border-t border-slate-200 space-y-3">
                            <div>
                              <label className="block text-xs font-bold text-slate-700 mb-1">
                                Approver Decision Note / Feedback (Optional):
                              </label>
                              <textarea
                                rows={2}
                                value={approverComments}
                                onChange={(e) => setApproverComments(e.target.value)}
                                placeholder="e.g. Verified compliance. Delegation authorized."
                                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-[#0057B8] focus:ring-1 focus:ring-[#0057B8] bg-slate-50"
                              />
                            </div>

                            <div className="flex flex-wrap items-center justify-end gap-2.5">
                              {onEditDraft && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const draftToEdit = {
                                      id: item.policy_id || item.id,
                                      title: item.policy_title || item.title,
                                      department_name: item.department_name,
                                      content: changes?.content,
                                      parameters: changes?.parameters,
                                      status: 'draft'
                                    };
                                    onEditDraft(draftToEdit);
                                  }}
                                  className="px-3.5 py-2 text-xs font-bold text-[#0057B8] hover:bg-blue-50 border border-blue-200 rounded-xl transition cursor-pointer flex items-center gap-1.5"
                                  title="Open in editor to correct clauses, thresholds, or wording before sign-off"
                                >
                                  <FileEdit className="w-3.5 h-3.5" />
                                  <span>Correct & Adjust</span>
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => handleActionRequest(item, 'reject')}
                                disabled={isSubmitting}
                                className="px-4 py-2 text-xs font-bold text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-xl transition cursor-pointer"
                              >
                                Reject & Send Feedback
                              </button>

                              <button
                                type="button"
                                onClick={() => handleActionRequest(item, 'approve')}
                                disabled={isSubmitting}
                                className="px-5 py-2 text-xs font-bold text-white bg-[#0057B8] hover:bg-[#004EA6] rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1.5 active:scale-95"
                              >
                                <Check className="w-4 h-4" />
                                <span>Approve & Deploy to Active Policy</span>
                              </button>
                            </div>
                          </div>
                        ) : (
                          /* Submitter Employee View */
                          <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 flex flex-wrap items-center justify-between gap-2">
                            <span className="font-semibold">
                              Pending review by Department Manager / Bank Administrator (Marcus Vance).
                            </span>
                            <div className="flex items-center gap-2">
                              {onEditDraft && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const draftToEdit = {
                                      id: item.policy_id || item.id,
                                      title: item.policy_title || item.title,
                                      department_name: item.department_name,
                                      content: changes?.content,
                                      parameters: changes?.parameters,
                                      status: 'draft'
                                    };
                                    onEditDraft(draftToEdit);
                                  }}
                                  className="px-2.5 py-1 text-xs font-bold bg-white text-[#0057B8] border border-blue-300 hover:bg-blue-100 rounded-lg transition cursor-pointer flex items-center gap-1"
                                >
                                  <FileEdit className="w-3 h-3" />
                                  <span>Edit / Correct</span>
                                </button>
                              )}
                              <span className="text-[11px] font-mono font-bold bg-blue-200 px-2 py-0.5 rounded text-blue-900">
                                Locked for Adjudication
                              </span>
                            </div>
                          </div>
                        )}

                      </div>
                    );
                  })()}
                </div>

              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: APPROVAL AUDIT HISTORY                             */}
        {/* ========================================================= */}
        {activeTab === 'history' && (
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-slate-900">
              Approval History ({filteredHistory.length})
            </h2>

            {filteredHistory.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-2xs">
                <CheckCircle2 className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <h3 className="font-bold text-slate-700 text-sm">No Adjudicated History Yet</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Once approvals or rejections occur, the timestamped decision records will be indexed here.
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
                <div className="divide-y divide-slate-100">
                  {filteredHistory.map((item) => {
                    const isApproved = item.status === 'approved';

                    return (
                      <div key={item.id} className="p-4 hover:bg-slate-50/70 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] uppercase font-mono border ${
                              isApproved 
                                ? 'bg-blue-50 text-blue-800 border-blue-300' 
                                : 'bg-rose-50 text-rose-800 border-rose-300'
                            }`}>
                              {item.status}
                            </span>
                            <span className="font-mono text-slate-400 text-[11px]">CR-#{item.id}</span>
                            <strong className="text-slate-900 text-[13px]">{item.policy_title || item.title}</strong>
                          </div>

                          <div className="text-slate-500 text-[11.5px] flex items-center gap-3">
                            <span>Department: <strong className="text-slate-700">{item.department_name || 'Retail Banking'}</strong></span>
                            <span>•</span>
                            <span>Maker: <strong className="text-slate-700">{item.maker_name}</strong></span>
                            <span>•</span>
                            <span>Checker: <strong className="text-slate-700">{item.checker_name || 'Marcus Vance'}</strong></span>
                          </div>

                          {item.checker_comments && (
                            <p className="text-[11.5px] text-slate-700 italic bg-slate-50 p-2 rounded-lg border border-slate-200 inline-block mt-1">
                              Approver Note: "{item.checker_comments}"
                            </p>
                          )}
                        </div>

                        <div className="text-right text-slate-400 text-[11px] flex-shrink-0">
                          <p>{new Date(item.reviewed_at || item.created_at).toLocaleString()}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

      </div>

      {/* ========================================================= */}
      {/* MODAL 1: SUBMITTER NOTE DIALOG (When Submitting for Sign-off) */}
      {/* ========================================================= */}
      {draftToSubmit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-blue-200 max-w-lg w-full overflow-hidden p-6 animate-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3.5 mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-[#0057B8] flex items-center justify-center flex-shrink-0 shadow-2xs">
                <Send className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold text-slate-900">
                  Submit Draft for Approval
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Policy: <strong className="text-slate-800">{draftToSubmit.title}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDraftToSubmit(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Note field */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">
                Operational Note / Explanation for Approver:
              </label>
              <textarea
                rows={3}
                value={submissionNote}
                onChange={(e) => setSubmissionNote(e.target.value)}
                placeholder="e.g. Updated Turnaround SLA to 4 hours and added Section 3 KYC underwriting rules per APRA CPS 230 guidelines."
                className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:outline-none focus:border-[#0057B8] focus:ring-2 focus:ring-[#0057B8]/15 bg-white"
              />
              <p className="text-[11px] text-slate-500">
                This note will be highlighted for Marcus Vance when reviewing your proposed clauses.
              </p>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDraftToSubmit(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmSubmitForApproval}
                disabled={isSubmitting}
                className="px-5 py-2 text-xs font-bold text-white bg-[#0057B8] hover:bg-[#004EA6] rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSubmitting ? 'Submitting...' : 'Confirm Submission'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: QUICK VIEW DRAFT CLAUSES MODAL                   */}
      {/* ========================================================= */}
      {viewingDraftClauses && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <span className="text-[10px] font-bold text-amber-700 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded">
                  Draft Specification
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-1">
                  {viewingDraftClauses.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setViewingDraftClauses(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-3 custom-scrollbar text-xs">
              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-slate-700 leading-relaxed">
                <strong>Executive Summary:</strong> {viewingDraftClauses.summary || 'Operational policy clauses.'}
              </div>

              <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider pt-2">
                Draft Clauses
              </h4>

              {getDraftClauses(viewingDraftClauses).map((sec, idx) => (
                <div key={sec.id || idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <h5 className="font-bold text-slate-900">{sec.title || `Clause ${idx + 1}`}</h5>
                  <p className="text-[11.5px] text-slate-700 whitespace-pre-wrap leading-relaxed">
                    {sec.content}
                  </p>
                </div>
              ))}
            </div>

            <div className="px-6 py-3 border-t border-slate-200 flex items-center justify-between bg-white">
              <span className="text-xs text-slate-500">
                Department: <strong>{viewingDraftClauses.department_name || 'Retail Banking'}</strong>
              </span>

              <div className="flex items-center gap-2">
                {onSelectDraft && (
                  <button
                    type="button"
                    onClick={() => {
                      const d = viewingDraftClauses;
                      setViewingDraftClauses(null);
                      onSelectDraft(d);
                    }}
                    className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                    title="Open draft in reader view"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Reader View</span>
                  </button>
                )}
                {onEditDraft && (
                  <button
                    type="button"
                    onClick={() => {
                      const d = viewingDraftClauses;
                      setViewingDraftClauses(null);
                      onEditDraft(d);
                    }}
                    className="px-4 py-1.5 bg-[#0057B8] hover:bg-[#004EA6] text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <FileEdit className="w-3.5 h-3.5" />
                    <span>Open in Full Editor</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setViewingDraftClauses(null)}
                  className="px-4 py-1.5 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
}

export default ChangeManagementCenterPane;

