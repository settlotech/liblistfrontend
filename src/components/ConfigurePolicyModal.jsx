import React, { useState, useEffect } from 'react';
import { 
  X, 
  FileEdit, 
  CheckCircle, 
  Clock, 
  ShieldCheck, 
  AlertCircle,
  Trash2,
  ArrowUp,
  ArrowDown,
  Plus,
  AlignLeft,
  Layers
} from 'lucide-react';
import { apiService } from '../services/apiService';

export default function ConfigurePolicyModal({
  isOpen,
  onClose,
  policy,
  currentUser,
  onPolicyUpdated
}) {
  if (!isOpen || !policy) return null;

  const isChecker = currentUser?.roleType === 'manager' || currentUser?.roleType === 'admin';
  const isEmployee = currentUser?.roleType === 'employee';

  const initialParams = typeof policy.parameters === 'string'
    ? JSON.parse(policy.parameters || '{}')
    : (policy.parameters || {});

  const [title, setTitle] = useState(policy.title || '');
  const [content, setContent] = useState(policy.content || '');
  const [turnaroundSla, setTurnaroundSla] = useState(initialParams.turnaround_sla || '4 Hours');
  const [officerCap, setOfficerCap] = useState(initialParams.approval_limits?.officer_cap || '$100,000 AUD');
  const [dailyLimit, setDailyLimit] = useState(initialParams.daily_limit || '$25,000 AUD');
  const [mandatoryDvs, setMandatoryDvs] = useState(Boolean(initialParams.mandatory_dvs ?? true));
  const [justification, setJustification] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  // Parse existing sections or initialize with standard 4 core sections
  const parseInitialSections = () => {
    if (initialParams.sections && Array.isArray(initialParams.sections) && initialParams.sections.length > 0) {
      return initialParams.sections;
    }
    const raw = policy.content || '';
    const parts = raw.split(/(?=###\s+)/);
    if (parts.length > 1) {
      return parts.map((part, i) => {
        const match = part.match(/^###\s*(?:\d+\.?\s*)?(.*?)\n([\s\S]*)$/);
        if (match) {
          return {
            id: `sec-${i}-${Date.now()}`,
            title: match[1].trim(),
            content: match[2].trim(),
            type: 'section'
          };
        }
        return {
          id: `sec-${i}-${Date.now()}`,
          title: `Section ${i + 1}`,
          content: part.trim(),
          type: 'section'
        };
      });
    }
    return [
      { id: 'sec-summary', title: 'Summary', content: policy.summary || 'Summary of operational intent and scope.', type: 'section' },
      { id: 'sec-details', title: 'Details', content: raw || 'Operational execution specifications.', type: 'section' },
      { id: 'sec-reports', title: 'Reports', content: '1. AUSTRAC automated threshold detection\n2. APRA CPS 234 event telemetry logging', type: 'section' },
      { id: 'sec-dependencies', title: 'Dependencies', content: '1. CBA Core Banking Network\n2. Australian Document Verification Service (DVS)', type: 'section' }
    ];
  };

  const [sections, setSections] = useState(parseInitialSections);

  const handleUpdateSectionTitle = (id, newTitle) => {
    setSections(prev => prev.map(s => s.id === id ? { ...s, title: newTitle } : s));
  };

  const handleUpdateSectionContent = (id, newContent) => {
    setSections(prev => prev.map(s => s.id === id ? { ...s, content: newContent } : s));
  };

  const handleDeleteSection = (id) => {
    setSections(prev => prev.filter(s => s.id !== id));
  };

  const handleMoveSectionUp = (index) => {
    if (index <= 0) return;
    setSections(prev => {
      const copy = [...prev];
      const temp = copy[index - 1];
      copy[index - 1] = copy[index];
      copy[index] = temp;
      return copy;
    });
  };

  const handleMoveSectionDown = (index) => {
    setSections(prev => {
      if (index >= prev.length - 1) return prev;
      const copy = [...prev];
      const temp = copy[index + 1];
      copy[index + 1] = copy[index];
      copy[index] = temp;
      return copy;
    });
  };

  const handleAddSection = (customTitle = 'New Section') => {
    const newSec = {
      id: `sec-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      title: customTitle,
      content: '',
      type: 'section'
    };
    setSections(prev => [...prev, newSec]);
  };

  const handleAddParagraph = () => {
    const newPara = {
      id: `sec-para-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      title: '',
      content: '',
      type: 'paragraph'
    };
    setSections(prev => [...prev, newPara]);
  };

  const isDraft = policy?.status === 'draft';

  const handleSubmit = async (e, publishImmediately = false, submitForSignoff = false) => {
    if (e && e.preventDefault) e.preventDefault();
    setIsSubmitting(true);
    setStatusMessage(null);

    const compiledContent = sections.length > 0
      ? sections.map((sec, idx) => {
          if (sec.type === 'paragraph' && !sec.title.trim()) {
            return sec.content;
          }
          const heading = sec.title.trim() ? `### ${idx + 1}. ${sec.title.trim()}` : `### Paragraph ${idx + 1}`;
          return `${heading}\n${sec.content}`;
        }).join('\n\n')
      : content;

    const updatedParams = {
      ...initialParams,
      turnaround_sla: turnaroundSla,
      daily_limit: dailyLimit,
      mandatory_dvs: mandatoryDvs,
      approval_limits: {
        ...(initialParams.approval_limits || {}),
        officer_cap: officerCap
      },
      sections: sections
    };

    try {
      const res = await apiService.updatePolicy(policy.id, {
        title,
        content: compiledContent,
        parameters: updatedParams,
        user_name: currentUser?.name || 'Marcus Vance',
        user_role: currentUser?.roleType || 'employee',
        justification: justification || (isDraft ? 'Draft updated' : 'Operational parameters revised')
      });

      if (publishImmediately && isChecker) {
        await apiService.publishDraft(policy.id, currentUser?.name || 'Marcus Vance (Bank Owner)');
        setStatusMessage({
          type: 'success',
          text: `Policy "${title}" saved and published as ACTIVE!`
        });
      } else if (submitForSignoff && isEmployee) {
        await apiService.createMakerCheckerItem({
          policy_id: policy.id,
          policy_title: title,
          department_name: policy.department_name || 'Retail Banking',
          maker_name: currentUser?.name || 'Bank Employee',
          requested_by: `${currentUser?.name || 'Bank Employee'} (Bank Employee)`,
          change_details: justification || `Draft policy "${title}" submitted for sign-off.`,
          status: 'pending',
          proposed_changes: { 
            title, 
            content: compiledContent, 
            parameters: updatedParams,
            submission_note: justification || 'Updated draft specifications.'
          }
        });
        setStatusMessage({
          type: 'success',
          text: 'Draft saved and submitted to Department Manager for Maker-Checker review.'
        });
      } else if (res.maker_checker) {
        setStatusMessage({
          type: 'success',
          text: 'Proposed amendments submitted to Department Manager for Maker-Checker review.'
        });
      } else {
        setStatusMessage({
          type: 'success',
          text: isDraft 
            ? 'Draft policy updated and saved successfully in database.' 
            : `Policy updated directly to version ${res.version} with audit logging.`
        });
      }

      setTimeout(() => {
        if (onPolicyUpdated) onPolicyUpdated();
        onClose();
      }, 1200);
    } catch (err) {
      console.error('Failed to configure policy:', err);
      setStatusMessage({ type: 'error', text: 'Failed to update policy parameters.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-[#e5e7eb] w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#e5e7eb] flex items-center justify-between bg-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-800 flex items-center justify-center">
              <FileEdit className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Configure Operational Clauses & Parameters
              </h2>
              <p className="text-[12px] text-slate-500">
                {isEmployee 
                  ? 'Submit proposed amendments to Department Manager for Maker-Checker review.' 
                  : 'Direct in-system editing: Auto-increments version (v1.0 → v1.1) and updates repository.'}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Status Notification */}
        {statusMessage && (
          <div className={`p-3 text-[12.5px] font-semibold flex items-center gap-2 ${
            statusMessage.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-b border-emerald-100' : 'bg-rose-50 text-rose-800 border-b border-rose-100'
          }`}>
            <CheckCircle className="w-4 h-4" />
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-[13px] custom-scrollbar">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Policy Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:border-[#0057B8] focus:ring-2 focus:ring-[#0057B8]/15 text-[13px] bg-white font-medium"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Turnaround SLA</label>
              <input
                type="text"
                value={turnaroundSla}
                onChange={(e) => setTurnaroundSla(e.target.value)}
                placeholder="e.g. 4 Hours"
                required
                className="w-full p-2 rounded-lg border border-slate-300 focus:outline-none focus:border-[#0057B8] focus:ring-2 focus:ring-[#0057B8]/15 text-[13px] bg-white"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Daily Retail Limit</label>
              <input
                type="text"
                value={dailyLimit}
                onChange={(e) => setDailyLimit(e.target.value)}
                placeholder="e.g. $25,000 AUD"
                required
                className="w-full p-2 rounded-lg border border-slate-300 focus:outline-none focus:border-[#0057B8] focus:ring-2 focus:ring-[#0057B8]/15 text-[13px] bg-white"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Officer Approval Cap</label>
              <input
                type="text"
                value={officerCap}
                onChange={(e) => setOfficerCap(e.target.value)}
                placeholder="e.g. $100,000 AUD"
                required
                className="w-full p-2 rounded-lg border border-slate-300 focus:outline-none focus:border-[#0057B8] focus:ring-2 focus:ring-[#0057B8]/15 text-[13px] bg-white"
              />
            </div>
          </div>

          {/* MODULAR SECTIONS BUILDER (Summary, Details, Reports, Dependencies + Single Paragraph) */}
          <div className="pt-2 border-t border-slate-200/80 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="font-bold text-slate-900 text-[13.5px] flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#0057B8]" />
                  <span>Policy Sections & Modular Clauses ({sections.length})</span>
                </h3>
                <p className="text-[11.5px] text-slate-500">
                  Edit section titles, reorder above or below, delete, or add standalone paragraphs.
                </p>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleAddSection('New Section')}
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#0057B8]/10 hover:bg-[#0057B8]/20 text-[#0057B8] rounded-md text-[11.5px] font-bold border border-[#0057B8]/30 transition cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add Section</span>
                </button>
                <button
                  type="button"
                  onClick={handleAddParagraph}
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-[11.5px] font-bold border border-slate-300 transition cursor-pointer"
                >
                  <AlignLeft className="w-3 h-3" />
                  <span>Add Paragraph</span>
                </button>
              </div>
            </div>

            {/* Section Cards List */}
            {sections.length === 0 ? (
              <div className="p-6 text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50 space-y-2">
                <p className="text-slate-500 text-[12.5px]">No sections in this policy. Add one below:</p>
                <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                  {['Summary', 'Details', 'Reports', 'Dependencies'].map(name => (
                    <button
                      key={name}
                      type="button"
                      onClick={() => handleAddSection(name)}
                      className="px-2.5 py-1 bg-white border border-slate-300 hover:border-[#0057B8] text-slate-700 hover:text-[#0057B8] text-[11.5px] font-semibold rounded-md shadow-2xs cursor-pointer transition"
                    >
                      + {name}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {sections.map((section, idx) => (
                  <div
                    key={section.id}
                    className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-50 transition shadow-2xs space-y-2.5"
                  >
                    {/* Section Header */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className="w-6 h-6 rounded-md bg-white border border-slate-300 text-slate-700 text-[11px] font-bold flex items-center justify-center flex-shrink-0 font-mono shadow-2xs">
                          {idx + 1}
                        </span>
                        
                        {/* Editable Section Title Input */}
                        <input
                          type="text"
                          value={section.title}
                          onChange={(e) => handleUpdateSectionTitle(section.id, e.target.value)}
                          placeholder={section.type === 'paragraph' ? "Paragraph Heading (optional)" : "Section Title"}
                          className="font-bold text-[13px] text-slate-900 bg-white border border-slate-300 focus:border-[#0057B8] focus:ring-1 focus:ring-[#0057B8] px-2.5 py-1 rounded-md outline-none flex-1 transition"
                        />

                        {section.type === 'paragraph' && (
                          <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded uppercase flex-shrink-0">
                            Paragraph
                          </span>
                        )}
                      </div>

                      {/* Controls: Move Up, Move Down, Delete */}
                      <div className="flex items-center gap-0.5 flex-shrink-0">
                        {/* Move Up (Above) */}
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => handleMoveSectionUp(idx)}
                          className={`p-1.5 rounded transition ${
                            idx === 0 
                              ? 'text-slate-300 cursor-not-allowed' 
                              : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/80 cursor-pointer'
                          }`}
                          title={idx === 0 ? "Already at top" : "Move section above (up)"}
                          aria-label="Move section up"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>

                        {/* Move Down (Below) */}
                        <button
                          type="button"
                          disabled={idx === sections.length - 1}
                          onClick={() => handleMoveSectionDown(idx)}
                          className={`p-1.5 rounded transition ${
                            idx === sections.length - 1 
                              ? 'text-slate-300 cursor-not-allowed' 
                              : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/80 cursor-pointer'
                          }`}
                          title={idx === sections.length - 1 ? "Already at bottom" : "Move section below (down)"}
                          aria-label="Move section down"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete Section */}
                        <button
                          type="button"
                          onClick={() => handleDeleteSection(section.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition cursor-pointer ml-0.5"
                          title="Delete section"
                          aria-label="Delete section"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Section Content Textarea */}
                    <div>
                      <textarea
                        rows={section.type === 'paragraph' ? 2 : 3}
                        value={section.content}
                        onChange={(e) => handleUpdateSectionContent(section.id, e.target.value)}
                        placeholder={
                          section.type === 'paragraph' 
                            ? "Enter standalone paragraph or clause text..." 
                            : `Enter ${section.title || 'section'} details, operational requirements, or rules...`
                        }
                        className="w-full p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:border-[#0057B8] focus:ring-1 focus:ring-[#0057B8] text-[12.5px] leading-relaxed text-slate-800 bg-white placeholder-slate-400 custom-scrollbar"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Quick Add Presets Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11.5px] text-slate-500">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="font-semibold text-slate-600">Quick Add:</span>
                {['Summary', 'Details', 'Reports', 'Dependencies'].map(name => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => handleAddSection(name)}
                    className="px-2 py-0.5 bg-white hover:bg-slate-100 hover:text-slate-900 text-slate-600 border border-slate-200 rounded text-[11px] transition cursor-pointer shadow-2xs font-medium"
                  >
                    +{name}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={handleAddParagraph}
                className="px-2.5 py-0.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded text-[11px] font-medium transition cursor-pointer"
              >
                + Add as single paragraph
              </button>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Revision Justification / Change Notes</label>
            <input
              type="text"
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              placeholder="e.g. Updated Turnaround SLA from 6h to 4h based on Q3 committee directive"
              className="w-full p-2 rounded-lg border border-slate-300 focus:outline-none focus:border-[#0057B8] focus:ring-2 focus:ring-[#0057B8]/15 text-[13px] bg-white"
            />
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-[#e5e7eb] flex items-center justify-end gap-2 bg-slate-50/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-[13px] text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
          >
            Cancel
          </button>

          {isDraft ? (
            <>
              <button
                type="button"
                onClick={(e) => handleSubmit(e, false)}
                disabled={isSubmitting}
                className="px-4 py-2 text-[13px] font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg shadow-2xs transition cursor-pointer"
              >
                {isSubmitting ? 'Saving...' : 'Save Updated Draft'}
              </button>

              {isChecker ? (
                <button
                  type="button"
                  onClick={(e) => handleSubmit(e, true)}
                  disabled={isSubmitting}
                  className="px-5 py-2 text-[13px] font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition cursor-pointer"
                >
                  {isSubmitting ? 'Publishing...' : 'Save & Publish to Active'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={(e) => handleSubmit(e, false, true)}
                  disabled={isSubmitting}
                  className="px-5 py-2 text-[13px] font-semibold text-white bg-[#0057B8] hover:bg-[#004EA6] rounded-lg shadow-xs transition cursor-pointer flex items-center gap-1.5"
                >
                  {isSubmitting ? 'Submitting...' : 'Save & Submit Draft for Sign-off'}
                </button>
              )}
            </>
          ) : (
            <button
              onClick={(e) => handleSubmit(e, false)}
              disabled={isSubmitting}
              className="px-5 py-2 text-[13px] font-semibold text-white bg-[#0057B8] hover:bg-[#004EA6] rounded-lg shadow-xs transition cursor-pointer"
            >
              {isSubmitting ? 'Saving Configuration...' : (isChecker ? 'Update Policy Immediately' : 'Submit for Maker-Checker Sign-off')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
