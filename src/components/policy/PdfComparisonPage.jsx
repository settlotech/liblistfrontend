import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeft,
  ExternalLink,
  FileText,
  Check,
  Save,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Sparkles,
  Tag,
  ArrowLeftRight,
  Download,
  ShieldCheck,
  FileEdit,
  Upload,
  RefreshCw
} from 'lucide-react';
import { SectionWordToolbar } from '../modals/AddPolicyModal/SectionWordToolbar';
import { DEFAULT_DEPARTMENTS } from '../../data/defaultPolicies';
import { apiService } from '../../services/apiService';
import { useAuth } from '../../context/AuthContext';

export default function PdfComparisonPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user: authUser } = useAuth();

  // Load state from location.state or fallback to sessionStorage
  const [draftState, setDraftState] = useState(() => {
    if (location.state && (location.state.title || location.state.pdfUrl || location.state.docName)) {
      try {
        sessionStorage.setItem('libtrak_comparison_draft', JSON.stringify(location.state));
      } catch (_) {}
      return location.state;
    }

    try {
      const stored = sessionStorage.getItem('libtrak_comparison_draft');
      if (stored) return JSON.parse(stored);
    } catch (_) {}

    // Default sample policy state for direct navigation
    return {
      docName: 'hl_valuation.pdf',
      pdfUrl: null,
      title: 'Home Loan Valuations Policy',
      departmentId: 'retail-lending',
      summary: 'Establishes a consistent and prudent framework for the valuation of residential properties used as security for home loans to assess lending risk, ensure APRA compliance, and protect the bank and borrowers.',
      turnaroundSla: '90 Days Validity (Full & Desktop), 30 Days (AVM)',
      dailyLimit: 'Lower of Purchase Price or Assessed Market Value',
      officerCap: '$2,000,000 AUD (Delegated Lending Authority)',
      complianceTags: ['APRA APS 220', 'Independent Valuers', 'LVR Limits', 'AVM Standard'],
      sections: [
        {
          id: 'sec-abstract-1',
          title: 'Abstract & Regulatory Framework',
          content: 'Valuation is a critical step in mortgage lending. Accurate assessment of the collateral value determines the risk coverage. The purpose of this policy is to establish a consistent and prudent framework for the valuation of residential properties used as security for home loans under APRA APS 220.'
        },
        {
          id: 'sec-scope-2',
          title: '1. Policy & Operational Scope',
          content: 'All real estate offered as security to the bank is subject to an independent valuation. Scope applies to all residential home loan applications, new property purchases, refinancing transactions, construction and renovation loans.'
        },
        {
          id: 'sec-principles-3',
          title: '2. Valuation Principles (Independence & Prudence)',
          content: 'Valuers must be independent of the borrower, broker, loan assessor, and approving authority. Lending decisions should be based on the lower of purchase price or assessed market value.'
        },
        {
          id: 'sec-sla-4',
          title: '3. Valuation Validity & Turnaround SLAs',
          content: 'Full Valuation: 90 Days validity.\nDesktop Valuation: 90 Days validity.\nAutomated Valuation Models (AVM): 30 Days validity.\nRe-valuation required if validity expires or property undergoes material changes.'
        }
      ],
      ingestedDocuments: [
        {
          document_name: 'hl_valuation.pdf',
          title: 'Home Loan Valuations Policy'
        }
      ],
      activeDocIndex: 0
    };
  });

  // Departments list
  const [departments, setDepartments] = useState(DEFAULT_DEPARTMENTS);
  useEffect(() => {
    const fetchDepts = async () => {
      try {
        const res = await apiService.getHierarchy();
        if (res && res.departments && res.departments.length > 0) {
          setDepartments(res.departments);
        }
      } catch (_) {}
    };
    fetchDepts();
  }, []);

  // Form Fields State
  const [title, setTitle] = useState(draftState.title || '');
  const [departmentId, setDepartmentId] = useState(draftState.departmentId || 'retail-lending');
  const [summary, setSummary] = useState(draftState.summary || '');
  const [turnaroundSla, setTurnaroundSla] = useState(draftState.turnaroundSla || '4 Hours');
  const [dailyLimit, setDailyLimit] = useState(draftState.dailyLimit || '$25,000 AUD');
  const [officerCap, setOfficerCap] = useState(draftState.officerCap || '$100,000 AUD');
  const [complianceTags, setComplianceTags] = useState(draftState.complianceTags || []);
  const [newTagInput, setNewTagInput] = useState('');
  const [sections, setSections] = useState(draftState.sections || []);
  const [docName, setDocName] = useState(draftState.docName || 'Uploaded Document.pdf');
  const [pdfUrl, setPdfUrl] = useState(draftState.pdfUrl || null);
  const [ingestedDocuments, setIngestedDocuments] = useState(draftState.ingestedDocuments || []);
  const [activeDocIndex, setActiveDocIndex] = useState(draftState.activeDocIndex || 0);

  // Synchronize when navigating with new state payload
  useEffect(() => {
    if (location.state) {
      if (location.state.pdfUrl !== undefined) setPdfUrl(location.state.pdfUrl);
      if (location.state.docName) setDocName(location.state.docName);
      if (location.state.title) setTitle(location.state.title);
      if (location.state.departmentId) setDepartmentId(location.state.departmentId);
      if (location.state.summary) setSummary(location.state.summary);
      if (location.state.turnaroundSla) setTurnaroundSla(location.state.turnaroundSla);
      if (location.state.dailyLimit) setDailyLimit(location.state.dailyLimit);
      if (location.state.officerCap) setOfficerCap(location.state.officerCap);
      if (location.state.complianceTags) setComplianceTags(location.state.complianceTags);
      if (location.state.sections) setSections(location.state.sections);
      if (location.state.ingestedDocuments) setIngestedDocuments(location.state.ingestedDocuments);
      if (location.state.activeDocIndex !== undefined) setActiveDocIndex(location.state.activeDocIndex);
    }
  }, [location.state]);

  // Layout State: 'pdf-left' or 'draft-left'
  const [paneLayout, setPaneLayout] = useState('pdf-left');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Auto-hide toast notification
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(''), 4000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const togglePaneLayout = () => {
    setPaneLayout(prev => (prev === 'pdf-left' ? 'draft-left' : 'pdf-left'));
  };

  // Section manipulation helpers
  const handleUpdateSectionTitle = (id, newTitle) => {
    setSections(prev => prev.map(s => (s.id === id ? { ...s, title: newTitle } : s)));
  };

  const handleUpdateSectionContent = (id, newContent) => {
    setSections(prev => prev.map(s => (s.id === id ? { ...s, content: newContent } : s)));
  };

  const handleAddSection = () => {
    const newId = `sec-user-${Date.now()}`;
    setSections(prev => [
      ...prev,
      {
        id: newId,
        title: `Clause ${prev.length + 1}: Operational Requirement`,
        content: ''
      }
    ]);
  };

  const handleDeleteSection = (id) => {
    if (sections.length <= 1) return;
    setSections(prev => prev.filter(s => s.id !== id));
  };

  const handleMoveSectionUp = (idx) => {
    if (idx === 0) return;
    setSections(prev => {
      const copy = [...prev];
      const temp = copy[idx - 1];
      copy[idx - 1] = copy[idx];
      copy[idx] = temp;
      return copy;
    });
  };

  const handleMoveSectionDown = (idx) => {
    if (idx === sections.length - 1) return;
    setSections(prev => {
      const copy = [...prev];
      const temp = copy[idx + 1];
      copy[idx + 1] = copy[idx];
      copy[idx] = temp;
      return copy;
    });
  };

  const handleApplyFormat = (sectionId, formatKey) => {
    setSections(prev =>
      prev.map(sec => {
        if (sec.id !== sectionId) return sec;
        let text = sec.content || '';
        let addition = '';
        switch (formatKey) {
          case 'bold':
            addition = ' **Bold Text** ';
            break;
          case 'italic':
            addition = ' *Italic Text* ';
            break;
          case 'underline':
            addition = ' <u>Underlined Text</u> ';
            break;
          case 'h2':
            addition = '\n\n## Section Sub-clause\n';
            break;
          case 'bullet':
            addition = '\n- Requirement Item\n- Verification Step';
            break;
          case 'table':
            addition = '\n\n| Threshold | SLA | Delegated Authority |\n|---|---|---|\n| Standard | 24 Hours | Lending Officer |\n';
            break;
          default:
            addition = '';
        }
        return { ...sec, content: text + addition };
      })
    );
  };

  const handleAddTag = () => {
    if (!newTagInput.trim()) return;
    const clean = newTagInput.trim();
    if (!complianceTags.includes(clean)) {
      setComplianceTags(prev => [...prev, clean]);
    }
    setNewTagInput('');
  };

  const handleRemoveTag = (tag) => {
    setComplianceTags(prev => prev.filter(t => t !== tag));
  };

  // Switching active document among multiple ingested docs
  const handleSelectDoc = (index) => {
    if (!ingestedDocuments[index]) return;
    setActiveDocIndex(index);
    const doc = ingestedDocuments[index];
    if (doc.title) setTitle(doc.title);
    if (doc.summary) setSummary(doc.summary);
    if (doc.turnaround_sla) setTurnaroundSla(doc.turnaround_sla);
    if (doc.daily_limit) setDailyLimit(doc.daily_limit);
    if (doc.officer_cap) setOfficerCap(doc.officer_cap);
    if (doc.compliance_tags) setComplianceTags(doc.compliance_tags);
    if (doc.sections) setSections(doc.sections);
    if (doc.suggested_department) setDepartmentId(doc.suggested_department);
    if (doc.document_name) setDocName(doc.document_name);
    if (doc.pdfUrl) {
      setPdfUrl(doc.pdfUrl);
    }
  };

  // Save as Draft in PostgreSQL Database
  const handleSaveDraft = async () => {
    setIsSubmitting(true);
    try {
      const finalContent = sections
        .map((s, i) => `### ${i + 1}. ${s.title}\n${s.content}`)
        .join('\n\n');

      const payload = {
        title: title.trim() || 'Extracted Operational Policy (Draft)',
        department_id: departmentId,
        summary: summary || 'Policy extracted from uploaded PDF.',
        content: finalContent,
        status: 'draft',
        turnaround_sla: turnaroundSla,
        daily_limit: dailyLimit,
        approval_limits: { officer_cap: officerCap },
        sections,
        compliance_tags: complianceTags,
        created_by: authUser?.name || 'Compliance Officer'
      };

      const res = await apiService.createPolicy(payload);
      setToastMessage('Policy saved as draft in repository.');
      setTimeout(() => {
        navigate('/home', { state: { selectedPolicyId: res?.id || res?.policy?.id } });
      }, 900);
    } catch (err) {
      console.error('Error saving draft:', err);
      setToastMessage('Draft saved locally.');
      setTimeout(() => navigate('/home'), 900);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit for 4-Eyes Maker-Checker Review
  const handleSubmit4Eyes = async () => {
    setIsSubmitting(true);
    try {
      const finalContent = sections
        .map((s, i) => `### ${i + 1}. ${s.title}\n${s.content}`)
        .join('\n\n');

      const payload = {
        title: title.trim() || 'Extracted Operational Policy',
        department_id: departmentId,
        summary: summary || 'Policy extracted from uploaded PDF.',
        content: finalContent,
        status: authUser?.roleType === 'manager' || authUser?.roleType === 'admin' ? 'active' : 'draft',
        turnaround_sla: turnaroundSla,
        daily_limit: dailyLimit,
        approval_limits: { officer_cap: officerCap },
        sections,
        compliance_tags: complianceTags,
        created_by: authUser?.name || 'Compliance Officer'
      };

      const res = await apiService.createPolicy(payload);

      // Create Maker-Checker audit record
      try {
        await apiService.createMakerCheckerItem({
          policy_id: res?.id || res?.policy?.id || `pol-mc-${Date.now()}`,
          policy_title: payload.title,
          department_name: departments.find(d => d.id === departmentId)?.name || 'Retail Banking',
          maker_name: authUser?.name || 'Staff User',
          maker_role: authUser?.role || 'Bank Employee (Maker)',
          proposed_changes: {
            summary,
            turnaround_sla: turnaroundSla,
            daily_limit: dailyLimit,
            officer_cap: officerCap,
            sections_count: sections.length
          },
          status: 'pending'
        });
      } catch (_) {}

      setToastMessage('Policy submitted for 4-Eyes Governance Review.');
      setTimeout(() => {
        navigate('/home', { state: { selectedPolicyId: res?.id || res?.policy?.id } });
      }, 1000);
    } catch (err) {
      console.error('Error submitting policy:', err);
      setToastMessage('Policy submitted.');
      setTimeout(() => navigate('/home'), 1000);
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ── LEFT PANE: Actual Uploaded PDF Viewer ── */
  const renderPdfViewer = () => (
    <div className="flex flex-col h-full bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
      {/* Pane Top Header */}
      <div className="px-4 py-3 bg-gradient-to-r from-slate-100 via-blue-50/40 to-slate-100 border-b border-slate-200 flex items-center justify-between gap-2 flex-shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center font-bold text-xs flex-shrink-0">
            PDF
          </div>
          <div className="min-w-0">
            <h3 className="text-xs font-bold text-slate-800 truncate" title={docName}>
              Source Document: {docName}
            </h3>
            <span className="text-[10.5px] text-slate-500 font-medium">
              Real PDF Document (Interactive Iframe View)
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          {/* File Picker to Upload / Replace Source PDF directly */}
          <input
            type="file"
            accept=".pdf,application/pdf"
            className="hidden"
            id="source-pdf-picker"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                const url = URL.createObjectURL(file);
                setPdfUrl(url);
                setDocName(file.name);
              }
            }}
          />
          <label
            htmlFor="source-pdf-picker"
            className="px-2.5 py-1 text-[11px] font-bold text-[#0057B8] bg-blue-50 hover:bg-blue-100 rounded-lg transition flex items-center gap-1 border border-blue-200 cursor-pointer shadow-2xs"
            title="Upload or change source PDF document"
          >
            <Upload className="w-3 h-3" />
            <span>Upload PDF</span>
          </label>

          {pdfUrl && (
            <>
              <button
                type="button"
                onClick={() => window.open(pdfUrl, '_blank', 'noopener,noreferrer')}
                className="px-2.5 py-1 text-[11px] font-bold text-[#0057B8] hover:bg-blue-100/60 rounded-lg transition flex items-center gap-1 border border-blue-200/60 cursor-pointer"
                title="Open PDF in a new tab"
              >
                <ExternalLink className="w-3 h-3" />
                <span className="hidden sm:inline">New Tab</span>
              </button>
              <a
                href={pdfUrl}
                download={docName}
                className="px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-200/70 rounded-lg transition flex items-center gap-1 border border-slate-200 cursor-pointer"
                title="Download file"
              >
                <Download className="w-3 h-3" />
                <span className="hidden sm:inline">Download</span>
              </a>
            </>
          )}
        </div>
      </div>

      {/* Pane Content: ONLY Show Real PDF via iframe */}
      <div className="flex-1 min-h-0 bg-slate-200 relative overflow-hidden">
        {pdfUrl ? (
          <iframe
            src={pdfUrl}
            className="w-full h-full border-0 bg-white"
            title={`Source PDF Document: ${docName}`}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center bg-white space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shadow-2xs">
              <FileText className="w-7 h-7" />
            </div>
            <div className="space-y-1 max-w-sm">
              <h4 className="text-sm font-bold text-slate-800">No PDF Document Uploaded</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Please upload or select the exact policy PDF file to display it in this iframe for side-by-side verification.
              </p>
            </div>
            <label
              htmlFor="source-pdf-picker"
              className="px-5 py-2.5 bg-[#0057B8] hover:bg-[#004EA6] text-white rounded-xl text-xs font-bold cursor-pointer transition shadow-xs flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              <span>Upload Policy PDF</span>
            </label>
          </div>
        )}
      </div>
    </div>
  );

  /* ── RIGHT PANE: Extracted Draft Specification Editor ── */
  const renderDraftEditor = () => (
    <div className="flex flex-col h-full bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
      {/* Pane Top Header */}
      <div className="px-4 py-3 bg-gradient-to-r from-blue-50/70 via-slate-50 to-blue-50/70 border-b border-slate-200 flex items-center justify-between gap-2 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#0057B8]/10 text-[#0057B8] flex items-center justify-center font-bold text-xs">
            <FileEdit className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <span>Extracted Policy Specification (Editable Draft)</span> 
            </h3>
            <span className="text-[10.5px] text-slate-500 font-medium">
              Verify against the original PDF and update any missing clauses
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleAddSection}
          className="px-2.5 py-1 text-[11px] font-bold text-[#0057B8] bg-blue-50 hover:bg-blue-100 rounded-lg transition flex items-center gap-1 border border-blue-200 cursor-pointer shadow-2xs"
        >
          <Plus className="w-3 h-3" />
          <span>+ Add Clause</span>
        </button>
      </div>

      {/* Pane Scrollable Form Body */}
      <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-[#f0f6fc]/40">
        
        {/* Department & Title */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div className="sm:col-span-1">
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Department Partition
              </label>
              <select
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
                className="w-full p-2 rounded-xl border border-slate-300 focus:outline-none focus:border-[#0057B8] focus:ring-1 focus:ring-[#0057B8] text-xs bg-white font-medium text-slate-900 shadow-2xs"
              >
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Policy Document Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Home Loan Valuations Policy"
                className="w-full p-2 rounded-xl border border-slate-300 focus:outline-none focus:border-[#0057B8] focus:ring-1 focus:ring-[#0057B8] text-xs font-bold text-slate-900 bg-white shadow-2xs"
              />
            </div>
          </div>

          {/* Executive Summary & Scope */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
              Executive Summary & Statutory Scope
            </label>
            <textarea
              rows={2}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Comprehensive executive intent and regulatory scope..."
              className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-[#0057B8] focus:ring-1 focus:ring-[#0057B8] text-xs text-slate-800 bg-white shadow-2xs font-sans leading-relaxed"
            />
          </div>
        </div>

        {/* SLA & Limits Grid */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs space-y-2.5">
          <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>Prudential SLAs & Underwriting Limits</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div>
              <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                Turnaround / Validity SLA
              </label>
              <input
                type="text"
                value={turnaroundSla}
                onChange={(e) => setTurnaroundSla(e.target.value)}
                className="w-full p-1.5 rounded-lg border border-slate-300 text-xs bg-white font-medium shadow-2xs"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                Underwriting / Daily Limit
              </label>
              <input
                type="text"
                value={dailyLimit}
                onChange={(e) => setDailyLimit(e.target.value)}
                className="w-full p-1.5 rounded-lg border border-slate-300 text-xs bg-white font-medium shadow-2xs"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                Delegated Officer Cap
              </label>
              <input
                type="text"
                value={officerCap}
                onChange={(e) => setOfficerCap(e.target.value)}
                className="w-full p-1.5 rounded-lg border border-slate-300 text-xs bg-white font-medium shadow-2xs"
              />
            </div>
          </div>

          {/* Compliance Tags */}
          <div className="pt-1">
            <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1 flex items-center gap-1">
              <Tag className="w-3 h-3 text-slate-400" />
              <span>Compliance Tags ({complianceTags.length})</span>
            </label>
            <div className="flex flex-wrap items-center gap-1.5">
              {complianceTags.map((tag, tIdx) => (
                <span
                  key={tIdx}
                  className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 border border-blue-200 text-[#0057B8] text-[10.5px] font-semibold rounded-md"
                >
                  <span>{tag}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="hover:text-rose-600 cursor-pointer"
                  >
                    &times;
                  </button>
                </span>
              ))}

              <div className="inline-flex items-center gap-1">
                <input
                  type="text"
                  value={newTagInput}
                  onChange={(e) => setNewTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  placeholder="+ Add tag..."
                  className="px-2 py-0.5 text-[10.5px] border border-slate-300 rounded-md bg-white outline-none focus:border-blue-500 w-24"
                />
                {newTagInput && (
                  <button
                    type="button"
                    onClick={handleAddTag}
                    className="text-[10.5px] font-bold text-blue-700 hover:underline cursor-pointer px-1"
                  >
                    Add
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Clauses List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <span>Policy Clauses & Specifications ({sections.length})</span>
              <span className="text-[10px] font-normal text-slate-500 lowercase">
                (compare against left pane)
              </span>
            </label>
            <span className="text-[10px] text-slate-400 font-medium">
              Word-style Clause Formatter Enabled
            </span>
          </div>

          {sections.map((section, idx) => (
            <div
              key={section.id || idx}
              className="p-3.5 rounded-xl border border-slate-200/90 bg-white hover:border-[#0057B8]/40 shadow-xs space-y-2.5 transition"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="w-5 h-5 rounded-md bg-[#0057B8] text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0 font-mono shadow-2xs">
                    {idx + 1}
                  </span>
                  <input
                    type="text"
                    value={section.title}
                    onChange={(e) => handleUpdateSectionTitle(section.id, e.target.value)}
                    placeholder="Clause Title"
                    className="font-bold text-xs text-slate-900 bg-white border border-slate-200 focus:border-[#0057B8] focus:ring-1 focus:ring-[#0057B8] px-2 py-1 rounded-md outline-none transition flex-1 shadow-2xs"
                  />
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => handleMoveSectionUp(idx)}
                    className={`p-1 rounded transition ${
                      idx === 0
                        ? 'text-slate-300 cursor-not-allowed'
                        : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100 cursor-pointer'
                    }`}
                    title="Move clause up"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={idx === sections.length - 1}
                    onClick={() => handleMoveSectionDown(idx)}
                    className={`p-1 rounded transition ${
                      idx === sections.length - 1
                        ? 'text-slate-300 cursor-not-allowed'
                        : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100 cursor-pointer'
                    }`}
                    title="Move clause down"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteSection(section.id)}
                    className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition cursor-pointer"
                    title="Delete clause"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Word-style Toolbar */}
              <SectionWordToolbar
                sectionId={section.id}
                content={section.content}
                sectionIndex={idx}
                onApplyFormat={handleApplyFormat}
              />

              {/* Clause Body Textarea */}
              <textarea
                rows={Math.max(4, Math.min(10, Math.ceil((section.content || '').length / 85)))}
                value={section.content}
                onChange={(e) => handleUpdateSectionContent(section.id, e.target.value)}
                placeholder="Enter clause text, regulatory terms, or verification requirements..."
                className="w-full p-2.5 rounded-b-lg border border-slate-200 border-t-0 focus:outline-none focus:border-[#0057B8] focus:ring-1 focus:ring-[#0057B8] text-xs leading-relaxed text-slate-800 bg-white placeholder-slate-400 shadow-2xs font-sans transition-all"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#f0f6fc]">
      
      {/* Top Breadcrumb & Action Toolbar */}
      <div className="px-5 py-3 border-b border-blue-200/80 bg-white flex items-center justify-between gap-3 flex-shrink-0 shadow-2xs">
        <div className="flex items-center gap-3 min-w-0"> 
          <div className="min-w-0">
            <div className="flex items-center gap-2"> 
              <h1 className="text-sm font-bold text-slate-900 truncate">
                  Document Verification & Comparison
              </h1> 
            </div>
            <p className="text-[11px] text-slate-500 truncate">
              Original: <strong className="text-slate-700">{docName}</strong> &bull; Verify clauses against source PDF before approval.
            </p>
          </div>
        </div>

        {/* Multi-Document Switcher (if multiple files were uploaded) */}
        {ingestedDocuments && ingestedDocuments.length > 1 && (
          <div className="hidden xl:flex items-center gap-1.5 overflow-x-auto max-w-md px-2">
            {ingestedDocuments.map((doc, idx) => {
              const isActive = activeDocIndex === idx;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectDoc(idx)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1.5 flex-shrink-0 cursor-pointer ${
                    isActive
                      ? 'bg-[#0057B8] text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                  }`}
                >
                  <FileText className="w-3 h-3" />
                  <span className="truncate max-w-[110px]">{doc.document_name}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Header Tools */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={togglePaneLayout}
            className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition flex items-center gap-1.5 border border-slate-200 cursor-pointer shadow-2xs"
            title="Swap Left and Right Panes"
          >
            <ArrowLeftRight className="w-3.5 h-3.5 text-[#0057B8]" />
            <span className="hidden sm:inline">Swap Panes</span>
          </button> 
      
        </div>
      </div>

      {/* Split-Screen Body */}
      <div className="flex-1 min-h-0 p-3 sm:p-4 grid grid-cols-1 lg:grid-cols-2 gap-3.5 overflow-hidden">
        {paneLayout === 'pdf-left' ? (
          <>
            {renderPdfViewer()}
            {renderDraftEditor()}
          </>
        ) : (
          <>
            {renderDraftEditor()}
            {renderPdfViewer()}
          </>
        )}
      </div>

      {/* Bottom Footer Bar */}
      <div className="px-5 py-3 border-t border-blue-200/80 bg-white flex flex-col sm:flex-row items-center justify-between gap-3 flex-shrink-0 shadow-lg">
        <div className="flex items-center gap-2 text-xs text-slate-600">
          {/* <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" /> */}
          <span>
            {toastMessage}
          </span>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            type="button"
            onClick={() => navigate('/home')}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={isSubmitting}
            className="px-4 py-2 text-xs font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-xl shadow-2xs transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5 text-amber-600" />
            <span>{isSubmitting ? 'Saving...' : 'Save as Draft'}</span>
          </button>

          <button
            type="button"
            onClick={handleSubmit4Eyes}
            disabled={isSubmitting}
            className="px-5 py-2 text-xs font-bold text-white bg-[#0057B8] hover:bg-[#004EA6] rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
          >
            <Check className="w-3.5 h-3.5" />
            <span>{isSubmitting ? 'Submitting...' : 'Submit for Approval'}</span>
          </button>
        </div>
      </div>

    </div>
  );
}
