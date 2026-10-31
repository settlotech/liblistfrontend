import React, { useState, useEffect } from 'react';
import { 
  X, 
  CheckCircle, 
  Clock, 
  User, 
  FileText, 
  Check, 
  Trash2, 
  ExternalLink, 
  Send, 
  ShieldCheck, 
  Layers,
  FileEdit,
  Save,
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { apiService } from '../services/apiService';

export default function MakerCheckerModal({
  isOpen,
  onClose,
  items = [],
  history = [],
  drafts = [],
  policies = [],
  currentUser,
  onAction,
  onCloseItem,
  onSelectPolicy,
  onRefresh,
  onEditDraft
}) {
  // Determine role: Manager/Admin/Owner is Bank Owner; otherwise Bank Employee
  const isBankOwner = currentUser?.roleType === 'manager' || currentUser?.roleType === 'admin' || currentUser?.roleType === 'owner';
  const isEmployee = !isBankOwner;

  // Active tab defaults to 'in_review' for bank owners and 'drafts' for employees
  const [activeTab, setActiveTab] = useState(isBankOwner ? 'in_review' : 'drafts');
  const [selectedReviewItem, setSelectedReviewItem] = useState(null);
  const [selectedDraftItem, setSelectedDraftItem] = useState(null);
  const [comments, setComments] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Inline Draft Re-edit State
  const [isEditingDraft, setIsEditingDraft] = useState(false);
  const [draftEditData, setDraftEditData] = useState({
    title: '',
    summary: '',
    content: '',
    sla: '4 Hours',
    daily: '$25,000 AUD',
    cap: '$100,000 AUD'
  });

  useEffect(() => {
    if (isOpen) {
      setActiveTab(isBankOwner ? 'in_review' : 'drafts');
    }
  }, [isOpen, isBankOwner]);

  // Combine drafts from maker-checker endpoint and policies table (purely DB driven)
  const allDraftsList = React.useMemo(() => {
    const list = [...(drafts || [])];
    (policies || []).forEach(p => {
      if (p.status === 'draft' && !list.some(d => d.id === p.id)) {
        list.push(p);
      }
    });
    return list;
  }, [drafts, policies]);

  const currentUserName = currentUser?.name?.toLowerCase().trim() || '';

  const userDrafts = React.useMemo(() => {
    if (!currentUserName || isBankOwner) return allDraftsList;
    return allDraftsList.filter(d => {
      const creator = (d.created_by || d.requested_by || '').toLowerCase();
      return creator.includes(currentUserName) || currentUserName.includes(creator);
    });
  }, [allDraftsList, isBankOwner, currentUserName]);

  const currentReviewItem = selectedReviewItem || items[0] || null;
  const currentDraftItem = selectedDraftItem || userDrafts[0] || null;

  // Sync draft edit fields whenever current draft selection changes
  useEffect(() => {
    if (currentDraftItem) {
      const p = typeof currentDraftItem.parameters === 'string'
        ? JSON.parse(currentDraftItem.parameters || '{}')
        : (currentDraftItem.parameters || {});

      setDraftEditData({
        title: currentDraftItem.title || '',
        summary: currentDraftItem.summary || '',
        content: currentDraftItem.content || '',
        sla: p.turnaround_sla || '4 Hours',
        daily: p.daily_limit || '$25,000 AUD',
        cap: p.approval_limits?.officer_cap || '$100,000 AUD'
      });
      setIsEditingDraft(false);
    }
  }, [currentDraftItem?.id]);

  if (!isOpen) return null;

  const handleAction = async (action) => {
    if (!currentReviewItem) return;
    setIsSubmitting(true);
    try {
      await onAction(currentReviewItem.id, action, currentUser?.name || 'Marcus Vance (Bank Owner)', comments);
      alert(`Request #${currentReviewItem.id} ${action === 'approve' ? 'Approved & Updated in System' : 'Rejected'}!`);
      setComments('');
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Failed to action request:', err);
      alert('Failed to process action: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteDraft = async (draftId) => {
    if (!window.confirm('Are you sure you want to delete this saved draft?')) return;
    setIsSubmitting(true);
    try {
      await apiService.deletePolicy(draftId);
      if (selectedDraftItem?.id === draftId) {
        setSelectedDraftItem(null);
      }
      if (onRefresh) onRefresh();
      alert('Draft removed successfully from database.');
    } catch (err) {
      console.error('Failed to delete draft:', err);
      alert('Failed to delete draft: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePublishDraft = async (draft) => {
    setIsSubmitting(true);
    try {
      await apiService.publishDraft(draft.id, currentUser?.name || 'Marcus Vance (Bank Owner)');
      alert(`Policy "${draft.title}" published as active!`);
      if (onRefresh) onRefresh();
      if (onSelectPolicy) onSelectPolicy(draft.id);
    } catch (err) {
      console.error('Failed to publish draft:', err);
      alert('Failed to publish draft: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitDraftForApproval = async (draft) => {
    const note = window.prompt("Optional Note for Approver / Submission Info:", `Draft policy "${draft.title}" submitted for sign-off.`);
    if (note === null) return; // cancelled by user

    setIsSubmitting(true);
    try {
      await apiService.createMakerCheckerItem({
        policy_id: draft.id,
        policy_title: draft.title,
        title: draft.title,
        department_name: draft.department_name || 'Retail Banking',
        department: draft.department_name || 'Retail Banking',
        maker_name: currentUser?.name || 'Staff User',
        requested_by: `${currentUser?.name || 'Staff User'} (${currentUser?.role || 'Staff'})`,
        change_details: note || `Draft policy submitted for manager sign-off. Title: ${draft.title}.`,
        status: 'pending',
        proposed_changes: {
          title: draft.title,
          summary: draft.summary,
          content: draft.content,
          parameters: draft.parameters,
          submission_note: note
        }
      });
      alert(`Draft "${draft.title}" submitted for review with note! It now appears in the "In Review" queue for Marcus Vance.`);
      if (onRefresh) onRefresh();
      setActiveTab('in_review');
    } catch (err) {
      console.error('Failed to submit draft for approval:', err);
      alert('Failed to submit draft: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveDraftChanges = async (publishImmediately = false) => {
    if (!currentDraftItem) return;
    setIsSubmitting(true);
    try {
      const currentParams = typeof currentDraftItem.parameters === 'string'
        ? JSON.parse(currentDraftItem.parameters || '{}')
        : (currentDraftItem.parameters || {});

      const updatedParams = {
        ...currentParams,
        turnaround_sla: draftEditData.sla,
        daily_limit: draftEditData.daily,
        approval_limits: {
          ...(currentParams.approval_limits || {}),
          officer_cap: draftEditData.cap
        }
      };

      // 1. Update policy in DB
      await apiService.updatePolicy(currentDraftItem.id, {
        title: draftEditData.title,
        summary: draftEditData.summary,
        content: draftEditData.content,
        parameters: updatedParams,
        user_name: currentUser?.name || 'Staff User',
        updated_by: currentUser?.name || 'Staff User',
        change_summary: publishImmediately ? 'Published as active policy' : 'Draft clauses and parameters updated'
      });

      // 2. If publishing immediately (Bank Owner/Manager)
      if (publishImmediately) {
        await apiService.publishDraft(currentDraftItem.id, currentUser?.name || 'Marcus Vance (Bank Owner)');
        alert(`Draft "${draftEditData.title}" updated and published as ACTIVE policy!`);
        if (onSelectPolicy) onSelectPolicy(currentDraftItem.id);
      } else {
        alert(`Draft "${draftEditData.title}" changes saved successfully in database!`);
      }

      setIsEditingDraft(false);
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Failed to save draft:', err);
      alert('Failed to save draft: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper to extract sections from draft parameters
  const getDraftSections = (draft) => {
    if (!draft) return [];
    let params = draft.parameters;
    if (typeof params === 'string') {
      try { params = JSON.parse(params); } catch { params = {}; }
    }
    return params?.sections || [];
  };

  const getDraftParams = (draft) => {
    if (!draft) return {};
    let params = draft.parameters;
    if (typeof params === 'string') {
      try { params = JSON.parse(params); } catch { params = {}; }
    }
    return params || {};
  };

  const draftSections = getDraftSections(currentDraftItem);
  const draftParams = getDraftParams(currentDraftItem);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-[#e5e7eb] w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#e5e7eb] flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-800 flex items-center justify-center font-bold text-base shadow-2xs">
              ⚖️
            </div>
            <div>
              <h2 className="text-base font-bold text-[#111827]">Maker-Checker Governance Workflow</h2>
              <p className="text-[11.5px] text-slate-500">APRA CPS 234 Dual-Control Sign-Off & Institutional Draft Governance</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-6 px-6 border-b border-slate-200 bg-white text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('in_review')}
            className={`py-3 font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'in_review'
                ? 'border-[#0057B8] text-[#0057B8]'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <span>In Review</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
              activeTab === 'in_review' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-600'
            }`}>
              {items.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('drafts')}
            className={`py-3 font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'drafts'
                ? 'border-[#0057B8] text-[#0057B8]'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <span>Drafts</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
              activeTab === 'drafts' ? 'bg-amber-100 text-amber-900 border border-amber-200' : 'bg-slate-100 text-slate-600'
            }`}>
              {userDrafts.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`py-3 font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'history'
                ? 'border-[#0057B8] text-[#0057B8]'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <span>Approval History</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
              {history.length}
            </span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">

          {/* TAB 1: IN REVIEW (Dual Approval Queue) */}
          {activeTab === 'in_review' && (
            items.length === 0 ? (
              <div className="text-center py-16 text-slate-400">
                <CheckCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="font-semibold text-slate-700 text-base">Governance Queue Clean</p>
                <p className="text-[12px] mt-1 text-slate-500">
                  No policy amendments or drafts currently pending Maker-Checker adjudication.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* List Column */}
                <div className="space-y-2 md:col-span-1 border-r border-slate-100 pr-4">
                  <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">
                    Pending Adjudication ({items.length})
                  </h3>
                  {items.map((item) => {
                    const isSelected = currentReviewItem?.id === item.id;
                    return (
                      <div
                        key={item.id}
                        onClick={() => setSelectedReviewItem(item)}
                        className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                          isSelected
                            ? 'border-[#0057B8] bg-blue-50/50 shadow-xs ring-1 ring-[#0057B8]/20'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded">
                            CR-#{item.id}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            {new Date(item.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <h4 className="text-[13px] font-bold text-slate-800 line-clamp-1">{item.policy_title}</h4>
                        <div className="flex items-center justify-between text-[11.5px] text-slate-500 mt-1">
                          <span className="truncate">{item.department_name}</span>
                          <span className="text-amber-700 font-semibold text-[10.5px]">Pending</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Details Column */}
                <div className="md:col-span-2 space-y-4">
                  {currentReviewItem && (
                    <>
                      {/* Overview Header */}
                      <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-mono font-bold text-blue-700 bg-blue-100 px-1.5 py-0.2 rounded">
                                CR-#{currentReviewItem.id}
                              </span>
                              <span className="text-xs text-slate-500 font-medium">
                                {currentReviewItem.department_name}
                              </span>
                            </div>
                            <h3 className="text-base font-bold text-slate-900 mt-1">{currentReviewItem.policy_title}</h3>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3 pt-3 border-t border-slate-200 text-[12px]">
                          <div>
                            <span className="text-slate-500 block text-[11px]">Requested By (Maker):</span>
                            <p className="font-semibold text-slate-800">{currentReviewItem.maker_name}</p>
                          </div>
                          <div>
                            <span className="text-slate-500 block text-[11px]">Submission Date:</span>
                            <p className="font-semibold text-slate-800">{new Date(currentReviewItem.created_at).toLocaleString()}</p>
                          </div>
                          <div>
                            <span className="text-slate-500 block text-[11px]">Dual Approval Standard:</span>
                            <p className="font-semibold text-slate-800">APRA CPS 234 Mandate</p>
                          </div>
                        </div>
                      </div>

                      {/* Proposed Changes Preview */}
                      <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-2">
                        <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Proposed Amendments</h4>
                        <div className="p-3 bg-slate-50 rounded-lg text-xs font-mono text-slate-800 whitespace-pre-wrap max-h-48 overflow-y-auto custom-scrollbar">
                          {typeof currentReviewItem.proposed_changes === 'string'
                            ? currentReviewItem.proposed_changes
                            : JSON.stringify(currentReviewItem.proposed_changes, null, 2)}
                        </div>
                      </div>

                      {/* Adjudication Action Box */}
                      {isBankOwner ? (
                        <div className="space-y-3 pt-2">
                          <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                              Checker Review Notes / Approval Justification
                            </label>
                            <textarea
                              rows={2}
                              value={comments}
                              onChange={(e) => setComments(e.target.value)}
                              placeholder="e.g. Verified compliance with APRA CPS 234 Annexure A. Delegation authorized."
                              className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:border-[#0057B8] focus:ring-2 focus:ring-[#0057B8]/15 bg-white"
                            />
                          </div>
                          <div className="flex items-center justify-end gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => handleAction('reject')}
                              disabled={isSubmitting}
                              className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-[13px] font-medium transition cursor-pointer"
                            >
                              Reject Proposal
                            </button>
                            <button
                              type="button"
                              onClick={() => handleAction('approve')}
                              disabled={isSubmitting}
                              className="px-5 py-2 bg-[#0057B8] hover:bg-[#004EA6] text-white rounded-lg text-[13px] font-semibold shadow-xs transition cursor-pointer flex items-center gap-1.5"
                            >
                              <Check className="w-4 h-4" />
                              <span>{isSubmitting ? 'Approving...' : 'Approve & Update in System'}</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-gradient-to-r from-blue-50/70 via-sky-50/40 to-slate-50 border border-blue-200/80 rounded-xl p-4 text-xs space-y-2.5 shadow-2xs">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
                              <span className="font-bold text-slate-900 text-[13px]">Submitted Proposal — Awaiting Manager Adjudication</span>
                            </div>
                            <span className="bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded-full text-[10.5px] uppercase tracking-wide border border-amber-300">
                              In Review
                            </span>
                          </div>
                          <p className="text-slate-600 leading-relaxed text-[12px]">
                            This policy amendment was authored by <strong>{currentReviewItem.maker_name || currentUser?.name || 'Bank Employee'}</strong> and has been submitted to the governance queue. Marcus Vance (Bank Owner / Department Manager) will review, sign off, or request revisions.
                          </p>
                          <div className="flex items-center gap-3 pt-1 text-[11px] text-slate-500 border-t border-slate-200/70">
                            <span>Request: <strong className="font-mono text-slate-800">CR-#{currentReviewItem.id}</strong></span>
                            <span>•</span>
                            <span>Maker: <strong className="text-slate-800">{currentReviewItem.maker_name}</strong></span>
                            <span>•</span>
                            <span>Status: <strong className="text-amber-700 uppercase font-bold">{currentReviewItem.status || 'Pending'}</strong></span>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )
          )}

          {/* TAB 2: DRAFTS (Saved drafts with Re-edit & Publish) */}
          {activeTab === 'drafts' && (
            userDrafts.length === 0 ? (
              <div className="text-center py-16 text-slate-400">
                <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="font-semibold text-slate-700 text-base">No saved drafts found for {currentUser?.name || 'this user'}.</p>
                <p className="text-[12px] mt-1 text-slate-500">
                  When you author a document and save as draft, it will appear right here from the PostgreSQL database.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Drafts List Column */}
                <div className="space-y-2 md:col-span-1 border-r border-slate-100 pr-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Saved Drafts ({userDrafts.length})
                    </h3>
                    <span className="text-[10px] text-amber-700 font-bold bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                      Draft Mode
                    </span>
                  </div>

                  {userDrafts.map((draft) => {
                    const isSelected = currentDraftItem?.id === draft.id;
                    return (
                      <div
                        key={draft.id}
                        onClick={() => {
                          setSelectedDraftItem(draft);
                          setIsEditingDraft(false);
                        }}
                        className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                          isSelected
                            ? 'border-[#0057B8] bg-blue-50/50 shadow-xs ring-1 ring-[#0057B8]/20'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-200">
                            Draft
                          </span>
                          <span className="text-[11px] text-slate-400">
                            {new Date(draft.updated_at || draft.created_at || Date.now()).toLocaleDateString()}
                          </span>
                        </div>
                        <h4 className="text-[13px] font-bold text-slate-800 line-clamp-1">{draft.title}</h4>
                        <div className="flex items-center justify-between text-[11.5px] text-slate-500 mt-1">
                          <span className="truncate">{draft.department_name || 'Retail Banking'}</span>
                          <span className="text-slate-400 text-[10.5px] flex items-center gap-1">
                            <User className="w-3 h-3" /> {draft.created_by || 'Me'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Draft Details & Actions Column */}
                <div className="md:col-span-2 space-y-4">
                  {currentDraftItem && (
                    <>
                      {/* Top Action Header Bar */}
                      <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-2xs flex flex-wrap items-center justify-between gap-2.5">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
                          <span className="font-bold text-slate-800 text-xs">
                            {isEditingDraft ? 'Editing Saved Draft' : 'Saved Draft Ready'}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          {!isEditingDraft ? (
                            <>
                              {/* 1. Full Editor (ConfigurePolicyModal) */}
                              {onEditDraft && (
                                <button
                                  type="button"
                                  onClick={() => onEditDraft(currentDraftItem)}
                                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-[#0057B8] hover:bg-[#004EA6] text-white shadow-2xs transition cursor-pointer"
                                  title="Open in Full Policy Editor (ConfigurePolicyModal)"
                                >
                                  <FileEdit className="w-3.5 h-3.5" />
                                  <span>Re-edit in Full Editor</span>
                                </button>
                              )}

                              {/* 2. Quick Inline Edit */}
                              <button
                                type="button"
                                onClick={() => setIsEditingDraft(true)}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-2xs transition cursor-pointer"
                                title="Quick inline edit for draft clauses and thresholds"
                              >
                                <Sparkles className="w-3.5 h-3.5" />
                                <span>Quick Edit</span>
                              </button>

                              {/* 3. Publish to Active (Bank Owner / Approver) */}
                              {isBankOwner ? (
                                <button
                                  type="button"
                                  onClick={() => handlePublishDraft(currentDraftItem)}
                                  disabled={isSubmitting}
                                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-[#0057B8] hover:bg-[#004EA6] text-white shadow-2xs transition cursor-pointer"
                                  title="Publish this draft directly as an active policy"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Publish Active</span>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleSubmitDraftForApproval(currentDraftItem)}
                                  disabled={isSubmitting}
                                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-[#0057B8] hover:bg-[#004EA6] text-white shadow-2xs transition cursor-pointer"
                                  title="Submit this draft to Marcus Vance for approval"
                                >
                                  <Send className="w-3.5 h-3.5" />
                                  <span>Submit for Approval</span>
                                </button>
                              )}

                              {/* 4. Open in Workspace */}
                              <button
                                type="button"
                                onClick={() => {
                                  if (onSelectPolicy) onSelectPolicy(currentDraftItem.id);
                                }}
                                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 transition cursor-pointer"
                                title="Open in main workspace"
                              >
                                <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                                <span>Workspace</span>
                              </button>

                              {/* 5. Delete Draft */}
                              <button
                                type="button"
                                onClick={() => handleDeleteDraft(currentDraftItem.id)}
                                disabled={isSubmitting}
                                className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition cursor-pointer"
                                title="Delete this draft"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => setIsEditingDraft(false)}
                                className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-300 text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                              >
                                Cancel
                              </button>

                              <button
                                type="button"
                                onClick={() => handleSaveDraftChanges(false)}
                                disabled={isSubmitting}
                                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-[#0057B8] hover:bg-[#004EA6] text-white shadow-2xs transition cursor-pointer disabled:opacity-50"
                              >
                                <Save className="w-3.5 h-3.5" />
                                <span>Save Draft</span>
                              </button>

                              {isBankOwner ? (
                                <button
                                  type="button"
                                  onClick={() => handleSaveDraftChanges(true)}
                                  disabled={isSubmitting}
                                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-[#0057B8] hover:bg-[#004EA6] text-white shadow-2xs transition cursor-pointer disabled:opacity-50"
                                >
                                  <CheckCircle className="w-3.5 h-3.5" />
                                  <span>Save & Publish</span>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={async () => {
                                    await handleSaveDraftChanges(false);
                                    await handleSubmitDraftForApproval(currentDraftItem);
                                  }}
                                  disabled={isSubmitting}
                                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-[#0057B8] hover:bg-[#004EA6] text-white shadow-2xs transition cursor-pointer disabled:opacity-50"
                                >
                                  <Send className="w-3.5 h-3.5" />
                                  <span>Save & Submit</span>
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </div>

                      {/* MODE A: Inline Editing Mode */}
                      {isEditingDraft ? (
                        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-4 text-xs animate-in fade-in duration-150">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                              Policy Document Title *
                            </label>
                            <input
                              type="text"
                              value={draftEditData.title}
                              onChange={(e) => setDraftEditData(prev => ({ ...prev, title: e.target.value }))}
                              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 font-bold outline-none focus:bg-white focus:border-blue-500"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                              Executive Summary & Scope
                            </label>
                            <textarea
                              rows={2}
                              value={draftEditData.summary}
                              onChange={(e) => setDraftEditData(prev => ({ ...prev, summary: e.target.value }))}
                              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-800 outline-none focus:bg-white focus:border-blue-500 leading-relaxed"
                            />
                          </div>

                          <div className="grid grid-cols-3 gap-3">
                            <div>
                              <label className="block text-[10.5px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                                Turnaround SLA
                              </label>
                              <input
                                type="text"
                                value={draftEditData.sla}
                                onChange={(e) => setDraftEditData(prev => ({ ...prev, sla: e.target.value }))}
                                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-medium"
                              />
                            </div>
                            <div>
                              <label className="block text-[10.5px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                                Daily Limit
                              </label>
                              <input
                                type="text"
                                value={draftEditData.daily}
                                onChange={(e) => setDraftEditData(prev => ({ ...prev, daily: e.target.value }))}
                                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-medium"
                              />
                            </div>
                            <div>
                              <label className="block text-[10.5px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                                Officer Cap
                              </label>
                              <input
                                type="text"
                                value={draftEditData.cap}
                                onChange={(e) => setDraftEditData(prev => ({ ...prev, cap: e.target.value }))}
                                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-medium"
                              />
                            </div>
                          </div>

                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                                Draft Clauses & Specifications (Phases)
                              </label>
                              <span className="text-[10px] text-slate-400">Use ### Phase N: format</span>
                            </div>
                            <textarea
                              rows={7}
                              value={draftEditData.content}
                              onChange={(e) => setDraftEditData(prev => ({ ...prev, content: e.target.value }))}
                              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-3 text-slate-800 font-mono text-xs outline-none focus:bg-white focus:border-blue-500 leading-relaxed custom-scrollbar"
                            />
                          </div>

                          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                            <button
                              type="button"
                              onClick={() => setIsEditingDraft(false)}
                              className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-bold transition cursor-pointer"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSaveDraftChanges(false)}
                              disabled={isSubmitting}
                              className="px-4 py-2 bg-[#0057B8] hover:bg-[#004EA6] text-white rounded-lg font-bold shadow-xs transition cursor-pointer"
                            >
                              {isSubmitting ? 'Saving...' : 'Save Updated Draft'}
                            </button>
                            {isBankOwner ? (
                              <button
                                type="button"
                                onClick={() => handleSaveDraftChanges(true)}
                                disabled={isSubmitting}
                                className="px-4 py-2 bg-[#0057B8] hover:bg-[#004EA6] text-white rounded-lg font-bold shadow-xs transition cursor-pointer"
                              >
                                {isSubmitting ? 'Publishing...' : 'Save & Publish to Active'}
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={async () => {
                                  await handleSaveDraftChanges(false);
                                  await handleSubmitDraftForApproval(currentDraftItem);
                                }}
                                disabled={isSubmitting}
                                className="px-4 py-2 bg-[#0057B8] hover:bg-[#004EA6] text-white rounded-lg font-bold shadow-xs transition cursor-pointer"
                              >
                                {isSubmitting ? 'Submitting...' : 'Save & Submit for Sign-off'}
                              </button>
                            )}
                          </div>
                        </div>
                      ) : (
                        /* MODE B: Read-only Preview Mode */
                        <>
                          {/* Overview Header */}
                          <div className="p-4 bg-amber-50/40 rounded-xl border border-amber-200/80">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full uppercase tracking-wider">
                                    Draft Document
                                  </span>
                                  <span className="text-xs text-slate-500 font-medium">
                                    {currentDraftItem.department_name || 'Retail Lending'}
                                  </span>
                                </div>
                                <h3 className="text-base font-bold text-slate-900 mt-1">{currentDraftItem.title}</h3>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3 pt-3 border-t border-amber-200/60 text-[12px]">
                              <div>
                                <span className="text-slate-500 block text-[11px]">Author / User:</span>
                                <p className="font-semibold text-slate-800">{currentDraftItem.created_by || currentUser?.name || 'Staff User'}</p>
                              </div>
                              <div>
                                <span className="text-slate-500 block text-[11px]">Last Updated:</span>
                                <p className="font-semibold text-slate-800">{new Date(currentDraftItem.updated_at || currentDraftItem.created_at || Date.now()).toLocaleString()}</p>
                              </div>
                              <div>
                                <span className="text-slate-500 block text-[11px]">Status:</span>
                                <p className="font-bold text-amber-800">Draft (Unpublished)</p>
                              </div>
                            </div>
                          </div>

                          {/* Summary & Scope */}
                          {currentDraftItem.summary && (
                            <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-1">
                              <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Executive Summary & Scope</h4>
                              <p className="text-xs text-slate-700 leading-relaxed">{currentDraftItem.summary}</p>
                            </div>
                          )}

                          {/* SLA and Limits Parameters Grid */}
                          {(draftParams.turnaround_sla || draftParams.daily_limit || draftParams.approval_limits?.officer_cap) && (
                            <div className="grid grid-cols-3 gap-2.5 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                              <div>
                                <span className="text-[10.5px] font-bold text-slate-500 uppercase block">Turnaround SLA</span>
                                <span className="font-semibold text-slate-800">{draftParams.turnaround_sla || '4 Hours'}</span>
                              </div>
                              <div>
                                <span className="text-[10.5px] font-bold text-slate-500 uppercase block">Daily Limit</span>
                                <span className="font-semibold text-slate-800">{draftParams.daily_limit || '$25,000 AUD'}</span>
                              </div>
                              <div>
                                <span className="text-[10.5px] font-bold text-slate-500 uppercase block">Officer Cap</span>
                                <span className="font-semibold text-slate-800">{draftParams.approval_limits?.officer_cap || '$100,000 AUD'}</span>
                              </div>
                            </div>
                          )}

                          {/* Clauses Preview */}
                          <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-2">
                            <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                              <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                                <Layers className="w-3.5 h-3.5 text-[#0057B8]" />
                                <span>Draft Clauses ({draftSections.length > 0 ? draftSections.length : 1})</span>
                              </h4>
                              <span className="text-[11px] text-slate-400 font-mono">
                                {(currentDraftItem.content || '').length} characters
                              </span>
                            </div>

                            {draftSections.length > 0 ? (
                              <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                                {draftSections.map((sec, i) => (
                                  <div key={sec.id || i} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-1">
                                    <span className="font-bold text-slate-800 block">{sec.title || `Section ${i + 1}`}</span>
                                    <p className="text-slate-600 line-clamp-2 text-[11.5px]">{sec.content}</p>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="p-3 bg-slate-50 rounded-lg text-xs text-slate-700 font-sans leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto custom-scrollbar">
                                {currentDraftItem.content || 'Draft clauses authored in system.'}
                              </div>
                            )}
                          </div>

                          {/* Bottom Action Footer for Draft */}
                          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex flex-wrap items-center justify-between gap-3 shadow-2xs">
                            <span className="text-[11.5px] text-slate-500">
                              Data source: PostgreSQL database (<code className="font-mono text-slate-700">policies</code> table).
                            </span>
                            <div className="flex items-center gap-2">
                              {onEditDraft && (
                                <button
                                  type="button"
                                  onClick={() => onEditDraft(currentDraftItem)}
                                  className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-[#0057B8] text-white hover:bg-[#004EA6] transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
                                >
                                  <FileEdit className="w-3.5 h-3.5" />
                                  <span>Re-edit in Full Editor</span>
                                </button>
                              )}
                              {isBankOwner ? (
                                <button
                                  type="button"
                                  onClick={() => handlePublishDraft(currentDraftItem)}
                                  disabled={isSubmitting}
                                  className="px-4 py-1.5 rounded-lg text-xs font-bold bg-[#0057B8] text-white hover:bg-[#004EA6] transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Publish as Active Policy</span>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleSubmitDraftForApproval(currentDraftItem)}
                                  disabled={isSubmitting}
                                  className="px-4 py-1.5 rounded-lg text-xs font-bold bg-[#0057B8] text-white hover:bg-[#004EA6] transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
                                >
                                  <Send className="w-3.5 h-3.5" />
                                  <span>Submit for Approval</span>
                                </button>
                              )}
                            </div>
                          </div>
                        </>
                      )}
                    </>
                  )}
                </div>
              </div>
            )
          )}

          {/* TAB 3: APPROVAL HISTORY */}
          {activeTab === 'history' && (
            <div className="space-y-3">
              <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Historical Sign-offs</h3>
              {history.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">No sign-off history recorded yet.</p>
              ) : (
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                  {history.map((h) => (
                    <div key={h.id} className="p-4 bg-white flex items-start justify-between gap-4 text-[13px]">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase ${
                            h.status === 'approved' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                          }`}>
                            {h.status}
                          </span>
                          <span className="font-bold text-slate-800">{h.policy_title}</span>
                        </div>
                        <p className="text-[12px] text-slate-500">
                          Maker: <strong>{h.maker_name}</strong> • Approver: <strong>{h.checker_name || 'Marcus Vance'}</strong>
                        </p>
                        {h.checker_comments && (
                          <p className="text-[12px] text-slate-600 italic">&quot;{h.checker_comments}&quot;</p>
                        )}
                      </div>
                      <span className="text-[11.5px] text-slate-400 whitespace-nowrap">
                        {new Date(h.reviewed_at || h.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
