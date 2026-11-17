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
import FormattedPolicyContent from '../policy/FormattedPolicyContent';
import PolicyVersionHistoryModal from './PolicyVersionHistoryModal';
import { combineAndDeduplicateVersions } from '../../utils/policyVersionHistory';

function safeParseJson(val, fallback = {}) {
  if (!val) return fallback;
  if (typeof val === 'string') {
    try { return JSON.parse(val); } catch { return fallback; }
  }
  return typeof val === 'object' ? val : fallback;
}

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
  const isBankOwner =
    currentUser?.roleType === 'manager' ||
    currentUser?.roleType === 'admin' ||
    currentUser?.roleType === 'owner' ||
    /approver|administrator|owner|manager/i.test(currentUser?.role || '');
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
  const [historyModalState, setHistoryModalState] = useState(null);

  const handleToggleVersionHistory = async (draftId) => {
    if (expandedVersionDraftId === draftId) {
      setExpandedVersionDraftId(null);
      return;
    }
    setExpandedVersionDraftId(draftId);
    try {
      const res = await apiService.getPolicyVersions(draftId);
      if (Array.isArray(res) && res.length > 0) {
        setDraftVersionsCache(prev => ({ ...prev, [draftId]: res }));
      }
    } catch (_) {}
  };
  const [selectedReviewItemId, setSelectedReviewItemId] = useState(focusedItemId || null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reviewPaneTab, setReviewPaneTab] = useState('proposed'); // 'proposed' | 'diff'
  const [reviewPolicyCache, setReviewPolicyCache] = useState({});
  const [reviewToast, setReviewToast] = useState(null);

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
      setApproverComments('');
      setSelectedReviewItemId(null);
      setReviewToast({
        type: action === 'approve' ? 'success' : 'info',
        message: action === 'approve'
          ? `Request CR-#${item.id} approved and published to Master Library.`
          : `Request CR-#${item.id} rejected with feedback and returned to Saved Drafts.`
      });
      setTimeout(() => setReviewToast(null), 5000);
      if (item.policy_id) {
        window.dispatchEvent(new CustomEvent('liblist:policy-created', {
          detail: { id: item.policy_id, status: action === 'approve' ? 'active' : 'draft' }
        }));
      }
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Failed to action request:', err);
      setReviewToast({
        type: 'error',
        message: 'Failed to action request: ' + (err.message || 'Unknown error')
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // 5. Withdraw pending submission back to Saved Drafts
  const handleWithdrawReviewItem = async (item) => {
    if (!item?.id) return;
    if (!window.confirm(`Withdraw "${item.policy_title || item.title}" from In-Review back to Saved Drafts?`)) return;
    setIsSubmitting(true);
    try {
      await apiService.closeMakerCheckerItem(item.id);
      setSelectedReviewItemId(null);
      setReviewToast({
        type: 'info',
        message: `Submission CR-#${item.id} returned to Saved Drafts.`
      });
      setTimeout(() => setReviewToast(null), 5000);
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Failed to withdraw submission:', err);
      setReviewToast({
        type: 'error',
        message: 'Failed to withdraw submission: ' + (err.message || 'Unknown error')
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Lazy-load full details & parent baseline for the currently inspected In-Review item
  const activeReviewItemForEffect = useMemo(() => {
    if (activeTab !== 'in_review' || !filteredInReview.length) return null;
    return filteredInReview.find(i => String(i.id) === String(selectedReviewItemId)) || filteredInReview[0];
  }, [activeTab, filteredInReview, selectedReviewItemId]);

  useEffect(() => {
    const pid = activeReviewItemForEffect?.policy_id;
    if (!pid || reviewPolicyCache[pid]) return;
    let cancelled = false;

    const loadDetailsAndParent = async () => {
      try {
        const full = await apiService.getPolicyDetails(pid, currentUser?.roleType || 'manager');
        if (cancelled || !full) return;
        const fParams = safeParseJson(full.parameters, {});
        let parentDoc = null;
        if (fParams.copied_from && String(fParams.copied_from) !== String(pid)) {
          parentDoc = await apiService.getPolicyDetails(fParams.copied_from, currentUser?.roleType || 'manager').catch(() => null);
        }
        if (!cancelled) {
          setReviewPolicyCache(prev => ({
            ...prev,
            [pid]: { policy: full, parentPolicy: parentDoc }
          }));
        }
      } catch (_) {}
    };
    loadDetailsAndParent();
    return () => { cancelled = true; };
  }, [activeReviewItemForEffect?.policy_id, currentUser?.roleType, reviewPolicyCache]);

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
              <span>New Policy / Draft</span>
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
                  <div className="col-span-12 sm:col-span-4">Draft Document</div>
                  <div className="col-span-6 sm:col-span-3">Department</div>
                  <div className="col-span-6 sm:col-span-2">Author & Date</div>

                  <div className="col-span-12 sm:col-span-3 text-right">Actions</div>
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
                          <div className="col-span-12 sm:col-span-4 min-w-0 pr-2">
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
                          <div className="col-span-12 sm:col-span-3 flex items-center justify-end gap-2 flex-wrap">
                            {/* 1. View Draft Document - Commented out per user request
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
                              title="View Draft Document with Chat and Collaboration"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            */}

                            {/* 1.5. Chat and Assign Task Panel - Commented out per user request
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
                              title="Open Draft Chat and Assign Tasks to Squad"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                            </button>
                            */}

                            {/* 2. Edit Draft in Workspace View */}
                            {onEditDraft && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onEditDraft(draft);
                                }}
                                className="px-3 py-1.5 rounded-xl border border-blue-200 bg-blue-50 hover:bg-[#0057B8] text-[#0057B8] hover:text-white text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-2xs active:scale-95"
                                title="Edit Draft Document in workspace view"
                              >
                                <FileEdit className="w-3.5 h-3.5" />
                                <span>Edit</span>
                              </button>
                            )}

                            {/* 2.5. Version History */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleVersionHistory(draft.id);
                              }}
                              className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-bold transition cursor-pointer flex items-center gap-1 shadow-2xs ${
                                expandedVersionDraftId === draft.id
                                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                                  : 'border-slate-300 hover:border-[#0057B8] bg-white hover:bg-blue-50/50 text-[#0057B8]'
                              }`}
                              title="Inspect Version History and Snapshots for this Draft"
                            >
                              <HistoryIcon className="w-3.5 h-3.5" />
                              <span>History</span>
                            </button>

                            {/* 3. Submit for Approval - Commented out per user request
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
                            */}

                            {/* 4. Delete Draft */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteDraft(draft.id, draft.title);
                              }}
                              disabled={isSubmitting}
                              className="px-2.5 py-1.5 rounded-xl border border-rose-200 bg-rose-50/60 hover:bg-rose-100 text-rose-600 hover:text-rose-700 text-xs font-bold transition cursor-pointer flex items-center gap-1 shadow-2xs active:scale-95"
                              title="Delete Draft"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Delete</span>
                            </button>
                          </div>
                        </div>

                        {/* Expandable Version History Accordion */}
                        {expandedVersionDraftId === draft.id && (() => {
                          const combinedList = combineAndDeduplicateVersions(draft, draftVersionsCache[draft.id] || []);
                          const finalVerList = combinedList.length > 0 ? combinedList : [
                            {
                              id: `ver-initial-${draft.id}`,
                              version: draft.version || '1.0',
                              version_number: draft.version || '1.0',
                              title: draft.title,
                              summary: draft.summary,
                              content: draft.content,
                              created_at: draft.updated_at || draft.created_at || new Date().toISOString(),
                              timestamp: draft.updated_at || draft.created_at || new Date().toISOString(),
                              sections: clauses,
                              change_summary: 'Initial version draft',
                              changed_by: draft.created_by || 'Staff User',
                              source: 'draft'
                            }
                          ];

                          return (
                            <div
                              onClick={(e) => e.stopPropagation()}
                              className="px-5 py-3.5 bg-blue-50/40 border-t border-blue-100 text-xs space-y-2 cursor-default"
                            >
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <h4 className="font-bold text-blue-900 text-xs flex items-center gap-1.5">
                                  <Layers className="w-3.5 h-3.5 text-blue-600" />
                                  <span>Combined Policy & Draft Version History ({finalVerList.length})</span>
                                </h4>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setHistoryModalState({
                                        policy: draft,
                                        initialMode: 'timeline',
                                        initialSelectedVersion: null
                                      });
                                    }}
                                    className="px-2.5 py-1 bg-[#0057B8] hover:bg-[#004EA6] text-white rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-2xs cursor-pointer active:scale-95"
                                    title="Open full Policy & Draft Version History inspector"
                                  >
                                    <HistoryIcon className="w-3 h-3" />
                                    <span>Full History</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const nextState = comparingDraftId === draft.id ? null : draft.id;
                                      setComparingDraftId(nextState);
                                      if (nextState) {
                                        setCompareV1(String(finalVerList[finalVerList.length - 1]?.id || ''));
                                        setCompareV2(String(finalVerList[0]?.id || ''));
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
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setExpandedVersionDraftId(null);
                                      setComparingDraftId(null);
                                    }}
                                    className="text-slate-400 hover:text-slate-600 text-[11px] cursor-pointer"
                                  >
                                    Close
                                  </button>
                                </div>
                              </div>
                              <div className="space-y-1.5">
                                {finalVerList.map((ver, vIdx) => {
                                  const isParentSource = ver.source === 'parent_policy' || ver.status_tag === 'parent';
                                  const isDraftSource = ver.source === 'draft_revision' || ver.status_tag === 'draft' || ver.source === 'draft';
                                  const originLabel = isParentSource
                                    ? 'Parent Policy'
                                    : isDraftSource
                                      ? 'Draft Revision'
                                      : 'Active Policy';
                                  const originCls = isParentSource
                                    ? 'bg-slate-100 text-slate-700 border-slate-300'
                                    : isDraftSource
                                      ? 'bg-amber-50 text-amber-800 border-amber-200'
                                      : 'bg-emerald-50 text-emerald-800 border-emerald-200';
                                  const displayDate = ver.created_at || ver.timestamp
                                    ? new Date(ver.created_at || ver.timestamp).toLocaleString()
                                    : 'Timestamp unavailable';

                                  return (
                                    <div key={ver.id || vIdx} className="p-2.5 rounded-xl bg-white border border-blue-200/80 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
                                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                        <span className="font-mono font-bold text-xs bg-blue-100 text-blue-800 px-2.5 py-1 rounded-md flex-shrink-0">
                                          v{String(ver.version_number || ver.version || `1.${vIdx}`).replace(/^v/i, '')}
                                        </span>
                                        <div className="min-w-0 flex-1">
                                          <div className="flex items-center gap-2 flex-wrap">
                                            <p className="font-bold text-slate-800 text-xs truncate">
                                              {ver.title || draft.title}
                                            </p>
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${originCls}`}>
                                              {originLabel}
                                            </span>
                                          </div>
                                          <p className="text-[10.5px] text-slate-400 mt-0.5">
                                            {displayDate} • {ver.changed_by || 'Staff User'} • {(ver.sections || []).length} Sections • {ver.change_summary || ver.notes || 'User draft'}
                                          </p>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-1.5 flex-shrink-0">
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setHistoryModalState({
                                              policy: draft,
                                              initialMode: 'view',
                                              initialSelectedVersion: ver
                                            });
                                          }}
                                          className="px-2.5 py-1 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-2xs cursor-pointer"
                                          title="Preview this exact revision snapshot"
                                        >
                                          <Eye className="w-3 h-3" />
                                          <span>View</span>
                                        </button>
                                        {onEditDraft && (
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              onEditDraft({
                                                ...draft,
                                                title: ver.title || draft.title,
                                                summary: ver.summary || draft.summary,
                                                version: ver.version_number || ver.version,
                                                content: ver.content || draft.content,
                                                parameters: {
                                                  ...params,
                                                  version: ver.version_number || ver.version,
                                                  sections: ver.sections || params.sections || []
                                                }
                                              });
                                              apiService.restorePolicyVersion(draft.id, ver.id || ver.version_number || ver.version, currentUser?.name).catch(() => {});
                                            }}
                                            className="px-2.5 py-1 bg-white hover:bg-blue-50 text-[#0057B8] border border-blue-300 rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-2xs cursor-pointer flex-shrink-0"
                                            title="Restore and edit this specific version"
                                          >
                                            <FileEdit className="w-3 h-3" />
                                            <span>Restore & Edit</span>
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>

                              {/* Compare Versions & Clause Diff Inspector */}
                              {comparingDraftId === draft.id && (() => {
                                const verAObj = finalVerList.find(v => String(v.id) === String(compareV1)) || finalVerList[finalVerList.length - 1] || finalVerList[0];
                                const verBObj = finalVerList.find(v => String(v.id) === String(compareV2)) || finalVerList[0];

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
                                              <option key={v.id || i} value={String(v.id)}>
                                                v{String(v.version_number || v.version || `1.${i}`).replace(/^v/i, '')} ({v.source === 'parent_policy' ? 'Parent' : v.source === 'draft_revision' ? 'Draft' : 'Rev'})
                                              </option>
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
                                              <option key={v.id || i} value={String(v.id)}>
                                                v{String(v.version_number || v.version || `1.${i}`).replace(/^v/i, '')} ({v.source === 'parent_policy' ? 'Parent' : v.source === 'draft_revision' ? 'Draft' : 'Rev'})
                                              </option>
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
                                              <div className="text-[11px] text-slate-600 mt-1.5 leading-relaxed max-h-40 overflow-y-auto rounded-lg bg-white/80 p-2 border border-slate-200/70">
                                                <FormattedPolicyContent content={snippet} />
                                              </div>
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
                                  <h5 className="font-bold text-slate-800 text-xs mb-1">{sec.title || `Clause ${idx + 1}`}</h5>
                                  <div className="text-[11.5px] text-slate-600">
                                    <FormattedPolicyContent content={sec.content || ''} />
                                  </div>
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
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-bold text-slate-900">
                In-Review Queue ({filteredInReview.length})
              </h2>
              {reviewToast && (
                <div
                  className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
                    reviewToast.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : reviewToast.type === 'error'
                        ? 'bg-rose-50 text-rose-800 border-rose-200'
                        : 'bg-blue-50 text-[#0057B8] border-blue-200'
                  }`}
                >
                  <span>{reviewToast.message}</span>
                  <button
                    type="button"
                    onClick={() => setReviewToast(null)}
                    className="opacity-70 hover:opacity-100 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
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
                    const isSelected = String(activeItem?.id) === String(item.id);
                    const changes = safeParseJson(item.proposed_changes, {});
                    const itemParams = safeParseJson(changes.parameters, {});
                    const itemVer = item.policy_version || itemParams.version || '1.0';

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
                        <div className="flex items-center justify-between mb-1.5 gap-2">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-mono font-bold text-blue-700 bg-blue-100/70 border border-blue-200 px-2 py-0.5 rounded-md">
                              CR-#{item.id}
                            </span>
                            <span className="text-[10px] font-mono font-bold text-slate-700 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded">
                              v{String(itemVer).replace(/^v/i, '')}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {item.created_at ? new Date(item.created_at).toLocaleDateString() : 'Pending'}
                          </span>
                        </div>

                        <h4 className="text-[13px] font-bold text-slate-900 line-clamp-1">
                          {item.policy_title || item.current_policy_title || item.title}
                        </h4>

                        <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 pt-2 border-t border-slate-100">
                          <span className="truncate font-medium">{item.department_name || 'Retail Banking'}</span>
                          <span className="text-slate-600 font-semibold flex items-center gap-1">
                            <User className="w-3 h-3 text-slate-400" /> {item.maker_name}
                          </span>
                        </div>

                        {(changes.submission_note || changes.details) && (
                          <div className="mt-2 p-2 bg-blue-50/70 border border-blue-100 rounded-lg text-[11px] text-blue-900 italic line-clamp-2">
                            "{changes.submission_note || changes.details}"
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

                    const safeChanges = safeParseJson(item.proposed_changes, {});
                    const changesParams = safeParseJson(safeChanges.parameters, {});
                    const linkedPolicy = item.policy_id
                      ? [...(policies || []), ...allDrafts].find(p => String(p.id) === String(item.policy_id))
                      : null;
                    const cachedEntry = item.policy_id ? reviewPolicyCache[item.policy_id] : null;
                    const cachedPolicy = cachedEntry?.policy || null;
                    const parentBaselinePolicy = cachedEntry?.parentPolicy || (changesParams.copied_from
                      ? (policies || []).find(p => String(p.id) === String(changesParams.copied_from))
                      : null);

                    const itemPolicyParams = safeParseJson(item.policy_parameters, {});
                    const linkedParams = safeParseJson(linkedPolicy?.parameters, {});
                    const cachedParams = safeParseJson(cachedPolicy?.parameters, {});
                    const params = {
                      ...itemPolicyParams,
                      ...linkedParams,
                      ...cachedParams,
                      ...changesParams,
                    };

                    const resolvedTitle = safeChanges.title || item.policy_title || item.current_policy_title || item.title;
                    const resolvedSummary =
                      safeChanges.summary ||
                      item.policy_summary ||
                      cachedPolicy?.summary ||
                      linkedPolicy?.summary ||
                      '';
                    const resolvedContent =
                      safeChanges.content ||
                      item.policy_content ||
                      cachedPolicy?.content ||
                      linkedPolicy?.content ||
                      '';
                    const resolvedVersion =
                      params.version ||
                      item.policy_version ||
                      cachedPolicy?.version ||
                      linkedPolicy?.version ||
                      '1.0';

                    let proposedSections = Array.isArray(params.sections) && params.sections.length > 0
                      ? params.sections
                      : [];
                    if (proposedSections.length === 0 && resolvedContent) {
                      proposedSections = getDraftClauses({
                        summary: resolvedSummary,
                        content: resolvedContent,
                        parameters: params
                      });
                    }

                    const baselineParams = safeParseJson(parentBaselinePolicy?.parameters, {});
                    const baselineSections = Array.isArray(baselineParams.sections) && baselineParams.sections.length > 0
                      ? baselineParams.sections
                      : (parentBaselinePolicy?.content
                          ? getDraftClauses(parentBaselinePolicy)
                          : []);

                    const historyPolicyTarget = item.policy_id
                      ? (cachedPolicy || linkedPolicy || {
                          id: item.policy_id,
                          title: resolvedTitle,
                          summary: resolvedSummary,
                          content: resolvedContent,
                          status: item.policy_status || 'pending_approval',
                          version: resolvedVersion,
                          parameters: params,
                          created_by: item.maker_name,
                          created_at: item.created_at
                        })
                      : null;

                    const openEditSubmission = () => {
                      if (!onEditDraft) return;
                      onEditDraft({
                        ...(linkedPolicy || {}),
                        ...(cachedPolicy || {}),
                        id: item.policy_id || linkedPolicy?.id || item.id,
                        department_id:
                          cachedPolicy?.department_id ||
                          linkedPolicy?.department_id ||
                          params.department_id ||
                          undefined,
                        department_name: item.department_name || cachedPolicy?.department_name || linkedPolicy?.department_name,
                        title: resolvedTitle,
                        summary: resolvedSummary,
                        version: resolvedVersion,
                        content: resolvedContent,
                        parameters: {
                          ...params,
                          sections: proposedSections
                        },
                        status: cachedPolicy?.status || linkedPolicy?.status || item.policy_status || 'pending_approval'
                      });
                    };

                    return (
                      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 space-y-4">
                        
                        {/* Header Details */}
                        <div className="flex flex-wrap items-start justify-between gap-3 pb-3 border-b border-slate-100">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[10.5px] font-mono font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                                CR-#{item.id}
                              </span>
                              <span className="text-[10.5px] font-mono font-bold text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
                                v{String(resolvedVersion).replace(/^v/i, '')}
                              </span>
                              <span className="text-xs font-semibold text-slate-500">
                                {item.department_name || 'Retail Banking'}
                              </span>
                            </div>
                            <h3 className="text-base font-bold text-slate-900 mt-1">
                              {resolvedTitle}
                            </h3>
                            {resolvedSummary && (
                              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                                {resolvedSummary}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-2 flex-shrink-0">
                            {historyPolicyTarget && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setHistoryModalState({
                                    policy: historyPolicyTarget,
                                    initialMode: 'timeline',
                                    initialSelectedVersion: null
                                  });
                                }}
                                className="px-2.5 py-1 rounded-lg border border-slate-300 hover:border-[#0057B8] bg-white hover:bg-blue-50/60 text-[#0057B8] text-[11px] font-bold transition flex items-center gap-1 shadow-2xs cursor-pointer"
                                title="View full revision history for this policy / draft"
                              >
                                <HistoryIcon className="w-3.5 h-3.5" />
                                <span>History</span>
                              </button>
                            )}
                            <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300 font-bold text-[10.5px] uppercase tracking-wide">
                              Pending Approval
                            </span>
                          </div>
                        </div>

                        {/* Submitter Info and Note Box */}
                        <div className="p-3.5 rounded-xl bg-blue-50/80 border border-blue-200/90 text-xs space-y-2">
                          <div className="flex items-center justify-between text-[11px] text-blue-800 font-semibold">
                            <span className="flex items-center gap-1.5">
                              <User className="w-3.5 h-3.5 text-[#0057B8]" />
                              <span>Submitted by: <strong>{item.maker_name}</strong> ({item.maker_role || 'Staff Submitter'})</span>
                            </span>
                            <span>{item.created_at ? new Date(item.created_at).toLocaleString() : ''}</span>
                          </div>

                          {/* Submission Note */}
                          <div className="pt-1 text-slate-800">
                            <span className="font-bold text-[11px] text-blue-900 block mb-0.5">
                              Submitter Operational Context / Note:
                            </span>
                            <p className="text-xs italic bg-white p-2 rounded-lg border border-blue-200 leading-relaxed text-slate-700">
                              {safeChanges.submission_note || safeChanges.details || item.change_details || 'Draft policy submitted for review.'}
                            </p>
                          </div>
                        </div>

                        {/* Proposed Operational Thresholds */}
                        <div className="space-y-2">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                            <Sliders className="w-3.5 h-3.5 text-[#0057B8]" />
                            <span>Proposed Operational Limits &amp; SLA</span>
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

                        {/* Proposed Clauses vs Baseline Comparison Toggle */}
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                              <Layers className="w-3.5 h-3.5 text-[#0057B8]" />
                              <span>Proposed Clauses ({proposedSections.length || 1})</span>
                            </h4>
                            <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                              <button
                                type="button"
                                onClick={() => setReviewPaneTab('proposed')}
                                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition cursor-pointer ${
                                  reviewPaneTab === 'proposed'
                                    ? 'bg-white text-[#0057B8] shadow-2xs'
                                    : 'text-slate-600 hover:text-slate-900'
                                }`}
                              >
                                Proposed View
                              </button>
                              <button
                                type="button"
                                onClick={() => setReviewPaneTab('diff')}
                                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition cursor-pointer ${
                                  reviewPaneTab === 'diff'
                                    ? 'bg-white text-[#0057B8] shadow-2xs'
                                    : 'text-slate-600 hover:text-slate-900'
                                }`}
                              >
                                Compare Diff
                              </button>
                            </div>
                          </div>

                          {reviewPaneTab === 'diff' ? (
                            <div className="space-y-2 max-h-72 overflow-y-auto custom-scrollbar p-1">
                              {baselineSections.length === 0 ? (
                                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
                                  New standalone policy submission (no prior parent baseline to diff against). All {proposedSections.length} sections are newly proposed.
                                </div>
                              ) : (
                                Array.from(new Set([
                                  ...baselineSections.map(s => s.title || 'Untitled Section'),
                                  ...proposedSections.map(s => s.title || 'Untitled Section')
                                ])).map((cTitle, cIdx) => {
                                  const sBase = baselineSections.find(s => (s.title || 'Untitled Section') === cTitle);
                                  const sProp = proposedSections.find(s => (s.title || 'Untitled Section') === cTitle);
                                  let diffState = 'unchanged';
                                  let diffLabel = 'No changes';
                                  let diffBadgeCls = 'bg-slate-100 text-slate-600 border-slate-200';
                                  if (!sBase && sProp) {
                                    diffState = 'added';
                                    diffLabel = '+ Added';
                                    diffBadgeCls = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                                  } else if (sBase && !sProp) {
                                    diffState = 'removed';
                                    diffLabel = '- Removed';
                                    diffBadgeCls = 'bg-rose-50 text-rose-700 border-rose-200';
                                  } else if (sBase && sProp && (sBase.content || '').trim() !== (sProp.content || '').trim()) {
                                    diffState = 'modified';
                                    diffLabel = '~ Modified';
                                    diffBadgeCls = 'bg-blue-50 text-[#0057B8] border-blue-200';
                                  }

                                  return (
                                    <div
                                      key={cIdx}
                                      className={`p-3 rounded-xl border text-xs space-y-1.5 ${
                                        diffState === 'added' ? 'border-emerald-200 bg-emerald-50/30' :
                                        diffState === 'removed' ? 'border-rose-200 bg-rose-50/30' :
                                        diffState === 'modified' ? 'border-blue-200 bg-blue-50/30' :
                                        'border-slate-200 bg-slate-50/60'
                                      }`}
                                    >
                                      <div className="flex items-center justify-between gap-2">
                                        <span className="font-bold text-slate-900">{cIdx + 1}. {cTitle}</span>
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${diffBadgeCls}`}>
                                          {diffLabel}
                                        </span>
                                      </div>
                                      {(sProp?.content || sBase?.content) && (
                                        <div className="text-[11.5px] text-slate-700 bg-white/80 rounded-lg p-2 border border-slate-200/70">
                                          <FormattedPolicyContent content={sProp?.content || sBase?.content || ''} />
                                        </div>
                                      )}
                                    </div>
                                  );
                                })
                              )}
                            </div>
                          ) : (
                            <div className="space-y-2.5 max-h-72 overflow-y-auto custom-scrollbar p-1">
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
                                    <div className="text-[11.5px] text-slate-800 leading-relaxed pt-1">
                                      <FormattedPolicyContent content={sec.content || ''} />
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <div className="p-3 rounded-xl bg-blue-50/40 border border-blue-200/80 text-xs leading-relaxed">
                                  <FormattedPolicyContent content={resolvedContent || safeChanges.details || 'No custom clauses attached.'} />
                                </div>
                              )}
                            </div>
                          )}
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
                                  onClick={openEditSubmission}
                                  className="px-3.5 py-2 text-xs font-bold text-[#0057B8] hover:bg-blue-50 border border-blue-200 rounded-xl transition cursor-pointer flex items-center gap-1.5"
                                  title="Open in editor to correct clauses, thresholds, or wording before sign-off"
                                >
                                  <FileEdit className="w-3.5 h-3.5" />
                                  <span>Correct &amp; Adjust</span>
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => handleActionRequest(item, 'reject')}
                                disabled={isSubmitting}
                                className="px-4 py-2 text-xs font-bold text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-xl transition cursor-pointer disabled:opacity-50"
                              >
                                Reject &amp; Send Feedback
                              </button>

                              <button
                                type="button"
                                onClick={() => handleActionRequest(item, 'approve')}
                                disabled={isSubmitting}
                                className="px-5 py-2 text-xs font-bold text-white bg-[#0057B8] hover:bg-[#004EA6] rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
                              >
                                <Check className="w-4 h-4" />
                                <span>{isSubmitting ? 'Processing...' : 'Approve & Deploy to Active Policy'}</span>
                              </button>
                            </div>
                          </div>
                        ) : (
                          /* Submitter Employee View */
                          <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 flex flex-wrap items-center justify-between gap-2">
                            <span className="font-semibold">
                              Pending review by Department Manager / Bank Administrator.
                            </span>
                            <div className="flex items-center gap-2 flex-wrap">
                              {onEditDraft && (
                                <button
                                  type="button"
                                  onClick={openEditSubmission}
                                  className="px-2.5 py-1 text-xs font-bold bg-white text-[#0057B8] border border-blue-300 hover:bg-blue-100 rounded-lg transition cursor-pointer flex items-center gap-1"
                                >
                                  <FileEdit className="w-3 h-3" />
                                  <span>Edit / Correct</span>
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => handleWithdrawReviewItem(item)}
                                disabled={isSubmitting}
                                className="px-2.5 py-1 text-xs font-bold bg-white text-slate-700 border border-slate-300 hover:bg-slate-100 rounded-lg transition cursor-pointer disabled:opacity-50"
                                title="Withdraw this submission back to Saved Drafts"
                              >
                                Withdraw to Draft
                              </button>
                              <span className="text-[11px] font-mono font-bold bg-blue-200 px-2 py-0.5 rounded text-blue-900">
                                Pending Sign-Off
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

                        <div className="text-right text-slate-400 text-[11px] flex-shrink-0 flex flex-col items-end gap-2">
                          <p>{new Date(item.reviewed_at || item.created_at).toLocaleString()}</p>
                          {item.policy_id && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                const linkedPolicy = [...(policies || []), ...allDrafts].find(p => String(p.id) === String(item.policy_id));
                                setHistoryModalState({
                                  policy: linkedPolicy || {
                                    id: item.policy_id,
                                    title: item.policy_title || item.title,
                                    status: item.status === 'approved' ? 'active' : 'draft',
                                    version: linkedPolicy?.version || '1.0',
                                    created_by: item.maker_name,
                                    created_at: item.reviewed_at || item.created_at
                                  },
                                  initialMode: 'timeline',
                                  initialSelectedVersion: null
                                });
                              }}
                              className="px-2.5 py-1 rounded-lg border border-slate-300 hover:border-[#0057B8] bg-white hover:bg-blue-50/60 text-[#0057B8] text-[11px] font-bold transition flex items-center gap-1 shadow-2xs cursor-pointer"
                              title="Inspect combined policy and draft revision history"
                            >
                              <HistoryIcon className="w-3.5 h-3.5" />
                              <span>History</span>
                            </button>
                          )}
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
                  <div className="text-[11.5px] text-slate-700 leading-relaxed">
                    <FormattedPolicyContent content={sec.content || ''} />
                  </div>
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

      <PolicyVersionHistoryModal
        isOpen={Boolean(historyModalState?.policy)}
        onClose={() => setHistoryModalState(null)}
        policy={historyModalState?.policy}
        currentUser={currentUser}
        initialMode={historyModalState?.initialMode || 'timeline'}
        initialSelectedVersion={historyModalState?.initialSelectedVersion || null}
        onRestoreAndEdit={
          onEditDraft
            ? (restoredDraft) => {
                setHistoryModalState(null);
                onEditDraft(restoredDraft);
              }
            : null
        }
        onPolicyRestored={() => {
          if (onRefresh) onRefresh();
        }}
      />

    </div>
  );
}

export default ChangeManagementCenterPane;

