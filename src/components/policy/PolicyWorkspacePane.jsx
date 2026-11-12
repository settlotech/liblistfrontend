import React, { useState, useEffect } from 'react';
import { 
  FileEdit, 
  Lock, 
  Unlock, 
  History as HistoryIcon, 
  FileText,
  GraduationCap,
  FileCheck,
  AlertTriangle,
  HelpCircle,
  ExternalLink,
  Layers,
  ArrowLeft,
  ChevronRight,
  Calculator,
  DollarSign,
  CheckCircle,
  Plus,
  Users,
  Award,
  TrendingUp,
  Filter,
  BookOpen,
  CheckCircle2,
  X,
  Check,
  Send
} from 'lucide-react';
import { apiService } from '../../services/apiService';

import FormattedPolicyContent from './FormattedPolicyContent';
import RichSectionAccordion from './RichSectionAccordion';
import CreateTaskDialog from '../task/CreateTaskDialog';
export default function PolicyWorkspacePane({
  policy,
  currentUser,
  onOpenConfigureModal,
  onToggleStatus,
  onToggleMasking,
  onOpenExportModal,
  refreshTrigger = 0,
  canEditPolicy = true,
  canCreateDocument = true,
  onBackToChangeManagement = null,
  isDraftView = false,
  initialEditMode = false,
  onDraftSaved = null
}) {
  const [detailedPolicy, setDetailedPolicy] = useState(policy || null);
  const activeDoc = detailedPolicy || policy;
  const [isLoading, setIsLoading] = useState(false);
  const [activeSupplementaryTab, setActiveSupplementaryTab] = useState('parameters'); // 'parameters' | 'training' | 'reports' | 'incidents' | 'faqs' | 'reg_reference'
  const [assignTaskModalData, setAssignTaskModalData] = useState(null);
  const [taskSuccessToast, setTaskSuccessToast] = useState(null);
  const [isDocumentEditMode, setIsDocumentEditMode] = useState(Boolean(typeof initialEditMode !== "undefined" ? initialEditMode : false));
  const [isSavingDraft, setIsSavingDraft] = useState(false);

  useEffect(() => {
    setIsDocumentEditMode(initialEditMode);
  }, [initialEditMode]);

  // Extract structured sections from policy parameters or content
  const docSections = useMemo(() => {
    const params = typeof activeDoc?.parameters === 'string'
      ? JSON.parse(activeDoc.parameters || '{}')
      : (activeDoc?.parameters || {});

    if (Array.isArray(params.sections) && params.sections.length > 0) {
      return params.sections;
    }

    const contentStr = activeDoc?.content || '';
    if (!contentStr.trim()) {
      return [
        { id: 'sec-1', title: '1. Purpose & Scope', content: '' },
        { id: 'sec-2', title: '2. Underwriting Limits & Approvals', content: '' }
      ];
    }

    const rawLines = contentStr.split('\n');
    const parsedSections = [];
    let curSec = null;
    let curLines = [];

    for (let i = 0; i < rawLines.length; i++) {
      const line = rawLines[i];
      if (/^#{1,3}\s+/.test(line)) {
        if (curSec) {
          curSec.content = curLines.join('\n').trim();
          parsedSections.push(curSec);
        }
        curSec = {
          id: `sec-${parsedSections.length + 1}`,
          title: line.replace(/^#{1,3}\s*/, '').trim(),
          content: ''
        };
        curLines = [];
      } else {
        curLines.push(line);
      }
    }

    if (curSec) {
      curSec.content = curLines.join('\n').trim();
      parsedSections.push(curSec);
    }

    return parsedSections.length > 0 ? parsedSections : [
      { id: 'sec-1', title: activeDoc?.title || '1. Purpose & Scope', content: contentStr }
    ];
  }, [activeDoc]);

  const handleSaveDocumentSections = async (updatedSections) => {
    if (!activeDoc?.id) return;
    setIsSavingDraft(true);
    try {
      const currentParams = typeof activeDoc.parameters === 'string'
        ? JSON.parse(activeDoc.parameters || '{}')
        : (activeDoc?.parameters || {});

      const updatedParams = {
        ...currentParams,
        sections: updatedSections
      };

      const textContent = updatedSections
        .map((s, idx) => `### ${s.title || `Section ${idx + 1}`}\n${s.content || ''}`)
        .join('\n\n');

      await apiService.updatePolicy(activeDoc.id, {
        title: activeDoc.title,
        summary: activeDoc.summary,
        content: textContent,
        parameters: updatedParams,
        status: activeDoc.status || 'draft',
        user_name: currentUser?.name || 'Staff User',
        updated_by: currentUser?.name || 'Staff User'
      });

      setDetailedPolicy(prev => ({
        ...prev,
        content: textContent,
        parameters: updatedParams
      }));

      if (onDraftSaved) {
        onDraftSaved({
          ...activeDoc,
          content: textContent,
          parameters: updatedParams
        });
      }
    } catch (err) {
      console.error('Failed to save draft sections:', err);
      alert('Failed to save draft sections: ' + (err.message || 'Unknown error'));
    } finally {
      setIsSavingDraft(false);
    }
  };

  const isBankOwner = currentUser?.roleType === 'manager' || currentUser?.roleType === 'admin';
  const isEmployee = currentUser?.roleType === 'employee';

  // Immediately sync prop when available (lightweight data from sidebar click)
  useEffect(() => {
    if (policy) {
      setDetailedPolicy(policy);
    }
  }, [policy]);

  // LAZY LOAD: Fetch full policy details (with phases, content, versions, artifacts) only when policy.id changes
  useEffect(() => {
    if (!policy?.id) return;
    let cancelled = false;

    const fetchDetails = async () => {
      setIsLoading(true);
      try {
        const full = await apiService.getPolicyDetails(policy.id, currentUser?.roleType || 'employee');
        if (!cancelled && full) {
          setDetailedPolicy(full);
        }
      } catch (err) {
        console.error('Failed to load policy details:', err);
        // Keep the lightweight policy already shown
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    fetchDetails();
    return () => { cancelled = true; };
  }, [policy?.id, currentUser?.roleType, refreshTrigger]);

  // Training users, modules tracking, and notes per user
  const [trainingUsers, setTrainingUsers] = useState([
    {
      id: 'sarah_jenkins',
      name: 'Sarah Jenkins',
      role: 'Bank Employee',
      department: 'Credit Operations Squad',
      modules: [
        { id: 'm1', name: 'APRA CPS 234 & Credit Verification', status: 'Completed', score: '98%', completedDate: '12 Oct 2026' },
        { id: 'm2', name: 'AML/CTF Customer Due Diligence (CDD)', status: 'Completed', score: '96%', completedDate: '15 Oct 2026' },
        { id: 'm3', name: 'High-Value Escalations & Sign-Off', status: 'In Progress', score: '--', dueDate: '15 Nov 2026' },
        { id: 'm4', name: 'Digital Lending SOP & Consumer Credit Act', status: 'Certified', score: '100%', completedDate: '20 Oct 2026' }
      ],
      notes: [
        { id: 'tn1', author: 'Marcus Vance (Bank Administrator)', date: '16 Oct 2026', text: 'Sarah demonstrated flawless command of Equifax automated checks with zero false positives.' },
        { id: 'tn2', author: 'Sarah Jenkins (Bank Employee)', date: '18 Oct 2026', text: 'Completed practice scenarios on Tier-1 credit card limit overrides exceeding $25k.' }
      ],
      certifiedCount: 3,
      onboardingCompleted: true,
      userCost: 450
    },
    {
      id: 'emma_watson',
      name: 'Emma Watson',
      role: 'Bank Employee',
      department: 'Retail Lending Associate',
      modules: [
        { id: 'm1', name: 'APRA CPS 234 & Credit Verification', status: 'Completed', score: '92%', completedDate: '08 Oct 2026' },
        { id: 'm2', name: 'AML/CTF Customer Due Diligence (CDD)', status: 'In Progress', score: '--', dueDate: '28 Oct 2026' },
        { id: 'm3', name: 'High-Value Escalations & Sign-Off', status: 'Pending', score: '--', dueDate: '30 Nov 2026' },
        { id: 'm4', name: 'Digital Lending SOP & Consumer Credit Act', status: 'Certified', score: '95%', completedDate: '14 Oct 2026' }
      ],
      notes: [
        { id: 'tn3', author: 'Marcus Vance (Bank Administrator)', date: '14 Oct 2026', text: 'On track for full operational delegation sign-off once Module 2 completes.' }
      ],
      certifiedCount: 2,
      onboardingCompleted: false,
      userCost: 450
    },
    {
      id: 'david_miller',
      name: 'David Miller',
      role: 'Bank Employee',
      department: 'Security Operations Specialist',
      modules: [
        { id: 'm1', name: 'APRA CPS 234 & Credit Verification', status: 'Completed', score: '99%', completedDate: '05 Oct 2026' },
        { id: 'm2', name: 'AML/CTF Customer Due Diligence (CDD)', status: 'Completed', score: '100%', completedDate: '09 Oct 2026' },
        { id: 'm3', name: 'High-Value Escalations & Sign-Off', status: 'Certified', score: '98%', completedDate: '17 Oct 2026' },
        { id: 'm4', name: 'Digital Lending SOP & Consumer Credit Act', status: 'Certified', score: '97%', completedDate: '19 Oct 2026' }
      ],
      notes: [
        { id: 'tn4', author: 'Marcus Vance (Bank Administrator)', date: '20 Oct 2026', text: 'Full 100% accreditation achieved across all 4 mandatory operational modules.' }
      ],
      certifiedCount: 4,
      onboardingCompleted: true,
      userCost: 450
    },
    {
      id: 'liam_chen',
      name: 'Liam Chen',
      role: 'Bank Employee',
      department: 'Compliance Oversight',
      modules: [
        { id: 'm1', name: 'APRA CPS 234 & Credit Verification', status: 'Completed', score: '94%', completedDate: '11 Oct 2026' },
        { id: 'm2', name: 'AML/CTF Customer Due Diligence (CDD)', status: 'In Progress', score: '--', dueDate: '02 Nov 2026' },
        { id: 'm3', name: 'High-Value Escalations & Sign-Off', status: 'Pending', score: '--', dueDate: '25 Nov 2026' },
        { id: 'm4', name: 'Digital Lending SOP & Consumer Credit Act', status: 'In Progress', score: '--', dueDate: '10 Nov 2026' }
      ],
      notes: [
        { id: 'tn5', author: 'Marcus Vance (Bank Administrator)', date: '21 Oct 2026', text: 'Enrolled in expedited onboarding path.' }
      ],
      certifiedCount: 1,
      onboardingCompleted: false,
      userCost: 450
    },
    {
      id: 'marcus_vance',
      name: 'Marcus Vance',
      role: 'Bank Administrator',
      department: 'Executive Governance & Sign-Off Authority',
      modules: [
        { id: 'm1', name: 'APRA CPS 234 & Credit Verification', status: 'Certified', score: '100%', completedDate: '01 Oct 2026' },
        { id: 'm2', name: 'AML/CTF Customer Due Diligence (CDD)', status: 'Certified', score: '100%', completedDate: '01 Oct 2026' },
        { id: 'm3', name: 'High-Value Escalations & Sign-Off', status: 'Certified', score: '100%', completedDate: '02 Oct 2026' },
        { id: 'm4', name: 'Digital Lending SOP & Consumer Credit Act', status: 'Certified', score: '100%', completedDate: '02 Oct 2026' }
      ],
      notes: [
        { id: 'tn6', author: 'Executive Risk Committee', date: '03 Oct 2026', text: 'Bank Administrator governance certification validated for Commonwealth Bank credit policies.' }
      ],
      certifiedCount: 4,
      onboardingCompleted: true,
      userCost: 450
    }
  ]);

  const [selectedUserFilter, setSelectedUserFilter] = useState('all'); // 'all' or userId
  const [newTrainingNoteText, setNewTrainingNoteText] = useState('');
  const [selectedUserForNote, setSelectedUserForNote] = useState('sarah_jenkins');
  const [enrolledStaffCount, setEnrolledStaffCount] = useState(42);

  const handleAddTrainingNote = (e) => {
    e.preventDefault();
    if (!newTrainingNoteText.trim()) return;
    const authorRole = currentUser?.roleType === 'manager' ? 'Bank Administrator' : 'Bank Employee';
    const newNote = {
      id: `tn-${Date.now()}`,
      author: `${currentUser?.name || 'Marcus Vance'} (${authorRole})`,
      date: 'Today',
      text: newTrainingNoteText.trim()
    };
    setTrainingUsers(prev => prev.map(u => {
      if (u.id === selectedUserForNote) {
        return { ...u, notes: [newNote, ...u.notes] };
      }
      return u;
    }));
    setNewTrainingNoteText('');
  };

  // State for Approver/Bank Manager adding training sessions
  const [isAddTrainingModalOpen, setIsAddTrainingModalOpen] = useState(false);
  const [isSavingTraining, setIsSavingTraining] = useState(false);
  const [newTrainingSession, setNewTrainingSession] = useState({
    title: '',
    description: '',
    category: 'APRA Mandatory Certification',
    minScore: '95%',
    dueDate: '30 Days from Enrollment',
    url: ''
  });

  const handleAddTrainingSessionSubmit = async (e) => {
    e.preventDefault();
    if (!newTrainingSession.title.trim()) return;
    setIsSavingTraining(true);
    try {
      if (activeDoc?.id) {
        await apiService.addPolicyArtifact(activeDoc.id, {
          tab_type: 'training',
          title: newTrainingSession.title.trim(),
          description: newTrainingSession.description.trim(),
          url_or_file: newTrainingSession.url.trim() || 'https://lms.banking.gov.au/apra-cps234',
          user_name: currentUser?.name || 'Bank Approver'
        });
      }

      // Immediately assign this training module to all enrolled training users
      const newModId = `mod-${Date.now()}`;
      const newModuleObj = {
        id: newModId,
        name: newTrainingSession.title.trim(),
        status: 'In Progress',
        score: '--',
        dueDate: newTrainingSession.dueDate || '30 Days'
      };

      setTrainingUsers(prev => prev.map(u => ({
        ...u,
        modules: [newModuleObj, ...u.modules]
      })));

      alert(`Training session "${newTrainingSession.title}" added to policy "${activeDoc.title}" and assigned to all branch personnel!`);
      setIsAddTrainingModalOpen(false);
      setNewTrainingSession({
        title: '',
        description: '',
        category: 'APRA Mandatory Certification',
        minScore: '95%',
        dueDate: '30 Days from Enrollment',
        url: ''
      });
      setRefreshTrigger(t => t + 1);
    } catch (err) {
      console.error('Failed to add training session:', err);
      alert('Failed to save training session: ' + err.message);
    } finally {
      setIsSavingTraining(false);
    }
  };

  const resolvedContent = activeDoc?.content || (() => {
    if (!activeDoc) return '';
    const params = typeof activeDoc.parameters === 'string'
      ? JSON.parse(activeDoc.parameters || '{}')
      : (activeDoc.parameters || {});
    if (Array.isArray(params.sections) && params.sections.length > 0) {
      return params.sections.map((s, idx) => `### ${idx + 1}. ${s.title || 'Section'}\n${s.content || ''}`).join('\n\n');
    }
    return '';
  })();

  if (!activeDoc) {
    return (
      <main className="flex-1 flex flex-col h-full overflow-y-auto bg-[#f0f4f9] p-5 sm:p-7 space-y-5 custom-scrollbar select-none text-slate-800">
        <div className="p-5 rounded-2xl border border-slate-200/90 bg-white shadow-2xs space-y-3.5 animate-pulse">
          <div className="h-4 bg-slate-100 rounded w-2/5" />
          <div className="h-7 bg-slate-100 rounded w-3/4" />
          <div className="h-4 bg-slate-100 rounded w-full" />
          <div className="h-4 bg-slate-100 rounded w-4/5" />
        </div>
        <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-[12px] text-blue-700 font-medium text-center animate-pulse">
          Loading institutional policy from database…
        </div>
      </main>
    );
  }

  const isActive = activeDoc.status === 'active';

  const parameters = typeof activeDoc.parameters === 'string' 
    ? JSON.parse(activeDoc.parameters || '{}') 
    : (activeDoc.parameters || {});

  const artifacts = activeDoc.artifacts || [];
  const trainingItems = artifacts.filter(a => a.tab_type === 'training');
  const reportItems = artifacts.filter(a => a.tab_type === 'reports');
  const incidentItems = artifacts.filter(a => a.tab_type === 'incidents');
  const faqItems = artifacts.filter(a => a.tab_type === 'faqs');

  // Extract phases from parameters (DB-stored structured data)
  const phases = Array.isArray(parameters.phases) ? parameters.phases : [];

  // Loading skeleton for lazy-loaded content
  if (isLoading && (!activeDoc.content || activeDoc.content.length < 50)) {
    return (
      <main className="flex-1 flex flex-col h-full overflow-y-auto bg-[#f0f4f9] p-5 sm:p-7 space-y-5 custom-scrollbar select-none text-slate-800">
        <div className="p-5 rounded-2xl border border-slate-200/90 bg-white shadow-2xs space-y-3.5 animate-pulse">
          <div className="h-4 bg-slate-100 rounded w-2/5" />
          <div className="h-7 bg-slate-100 rounded w-3/4" />
          <div className="h-4 bg-slate-100 rounded w-full" />
          <div className="h-4 bg-slate-100 rounded w-4/5" />
        </div>
        <div className="p-5 rounded-2xl border border-slate-200/90 bg-white shadow-2xs space-y-4 animate-pulse">
          <div className="h-5 bg-slate-100 rounded w-1/3" />
          <div className="space-y-2">
            <div className="h-4 bg-slate-100 rounded w-full" />
            <div className="h-4 bg-slate-100 rounded w-11/12" />
            <div className="h-4 bg-slate-100 rounded w-4/5" />
            <div className="h-4 bg-slate-100 rounded w-full" />
            <div className="h-4 bg-slate-100 rounded w-3/4" />
          </div>
        </div>
        <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-[12px] text-blue-700 font-medium text-center animate-pulse">
          Loading policy details from database…
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 flex flex-col h-full overflow-y-auto bg-[#f0f4f9] p-5 sm:p-7 space-y-5 custom-scrollbar select-none text-slate-800">
      
      {/* Lazy-loading progress indicator */}
      {isLoading && (
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-50 border border-blue-200 text-[12px] text-blue-700 font-medium">
          <span className="w-3 h-3 border-2 border-blue-400 border-t-blue-700 rounded-full animate-spin flex-shrink-0" />
          <span>Refreshing policy data from database…</span>
        </div>
      )}
      
      {/* Back to Change Management button (When viewing a draft document) */}
      {onBackToChangeManagement && (
        <div className="flex items-center justify-between pb-1">
          <button
            type="button"
            onClick={onBackToChangeManagement}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-blue-200 bg-white hover:bg-blue-50 text-[#0057B8] font-bold text-xs transition cursor-pointer shadow-2xs active:scale-95"
            title="Return to Change Management Hub"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>← Back to Change Management</span>
          </button>
          <span className="text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-300 px-3 py-1 rounded-xl shadow-2xs">
            Draft Document View • Change Management
          </span>
        </div>
      )}

      {/* ----------------- TOP SEPARATE CARD: DOCUMENT HEADER & ACTIONS ----------------- */}
      <div className="p-5 sm:p-6 rounded-2xl border border-slate-200/90 bg-white shadow-2xs space-y-3.5">
        
        {/* Breadcrumb & Action Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Breadcrumb path */}
          <div className="flex items-center gap-1.5 text-[12.5px] text-slate-500 font-medium">
            <span className="hover:text-blue-600 cursor-pointer">Library Group</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-700 font-semibold">{activeDoc?.department_name || 'Retail Banking'}</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200 font-mono text-[11px] font-bold">
              v{activeDoc?.version || '1.0'}
            </span>
          </div>

          {/* Direct Lifecycle Action Buttons */}
          <div className="flex items-center gap-2">
            {/* Configure Button (Controlled by canEditPolicy) */}
            {canEditPolicy ? (
              <button
                onClick={() => onOpenConfigureModal(activeDoc)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[13px] font-medium bg-[#0057B8] hover:bg-[#004EA6] text-white shadow-primary-sm transition cursor-pointer"
                title={isEmployee ? "Submit Proposed Amendments (Bank Employee)" : "Configure Clauses & Thresholds directly"}
              >
                <FileEdit className="w-3.5 h-3.5" />
                <span>{activeDoc.status === 'draft' || isDraftView ? "Edit Draft" : "Configure"}</span>
              </button>
            ) : (
              <div 
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[12.5px] font-medium bg-slate-100 text-slate-500 border border-slate-200 cursor-not-allowed" 
                title="Read Only: Edit permissions not granted for your role"
              >
                <FileText className="w-3.5 h-3.5 text-slate-400" />
                <span>Read Only</span>
              </div>
            )}

            {/* Draft Status Badge or [Active / Inactive] Toggle Button (Approver Only) */}
            {activeDoc.status === 'draft' ? (
              <div className="flex items-center gap-2">
                {/* Draft badge */}
                <div 
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12.5px] font-bold bg-amber-50 text-amber-800 border border-amber-300 shadow-2xs"
                  title="Saved Draft - Not yet published as active policy"
                >
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                  <span>Draft Policy</span>
                </div>
                {/* Publish button — Bank Administrator only (Blue) */}
                {isBankOwner && (
                  <button
                    onClick={async () => {
                      try {
                        await apiService.publishDraft(activeDoc.id, currentUser?.name || 'Marcus Vance (Bank Administrator)');
                        setRefreshTrigger(t => t + 1);
                        if (onToggleStatus) onToggleStatus(activeDoc.id, 'active');
                      } catch (err) {
                        console.error('Publish draft failed:', err);
                        alert('Failed to publish draft. Please try again.');
                      }
                    }}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[13px] font-semibold bg-[#0057B8] hover:bg-[#004EA6] text-white shadow-2xs transition cursor-pointer"
                    title="Publish this draft as an active policy (Bank Administrator action)"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Publish Active</span>
                  </button>
                )}

                {/* Submit for Review button — Bank Employee (Blue) */}
                {isEmployee && (
                  <button
                    onClick={async () => {
                      try {
                        await apiService.createMakerCheckerItem({
                          policy_id: activeDoc?.id,
                          policy_title: activeDoc?.title,
                          title: activeDoc?.title,
                          department_name: activeDoc?.department_name || 'Retail Banking',
                          department: activeDoc?.department_name || 'Retail Banking',
                          maker_name: currentUser?.name || 'Bank Employee',
                          requested_by: `${currentUser?.name || 'Bank Employee'} (Bank Employee)`,
                          change_details: `Draft policy "${activeDoc.title}" submitted for sign-off.`,
                          status: 'pending',
                          proposed_changes: {
                            title: activeDoc.title,
                            summary: activeDoc.summary,
                            content: activeDoc.content,
                            parameters: activeDoc.parameters
                          }
                        });
                        alert(`Draft "${activeDoc.title}" submitted for review! It now appears in Maker-Checker queue.`);
                        setRefreshTrigger(t => t + 1);
                      } catch (err) {
                        console.error('Failed to submit draft for review:', err);
                        alert('Failed to submit draft: ' + err.message);
                      }
                    }}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[13px] font-semibold bg-[#0057B8] hover:bg-[#004EA6] text-white shadow-2xs transition cursor-pointer"
                    title="Submit this draft to Marcus Vance for approval"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Submit for Review</span>
                  </button>
                )}
              </div>
            ) : (
              /* Active / Inactive Toggle: ONLY the approver (Bank Administrator) gets the interactive toggle */
              isBankOwner ? (
                <button
                  type="button"
                  onClick={() => onToggleStatus && onToggleStatus(activeDoc.id, isActive ? 'inactive' : 'active')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-medium border transition cursor-pointer ${
                    isActive
                      ? 'bg-white hover:bg-slate-50 text-slate-800 border-slate-300 shadow-2xs'
                      : 'bg-slate-100 text-slate-600 border-slate-300 hover:bg-slate-200'
                  }`}
                  title="Toggle status: Active / Inactive (Bank Administrator only)"
                >
                  <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-[#0057B8]' : 'bg-slate-400'}`}></span>
                  <span>{isActive ? 'Active' : 'Inactive'}</span>
                </button>
              ) : (
                /* Non-approver employee view: read-only status pill */
                <div
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12.5px] font-medium bg-slate-50 text-slate-700 border border-slate-200"
                  title="Policy Status: Active"
                >
                  <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-[#0057B8]' : 'bg-slate-400'}`}></span>
                  <span>{isActive ? 'Active' : 'Inactive'}</span>
                </div>
              )
            )}
          </div>
        </div>

        {/* Policy Document Title & Clean Summary */}
        <div className="pt-0.5">
          <h1 className="text-xl sm:text-2xl font-bold text-[#111827] tracking-tight">
            {activeDoc.title}
          </h1>
          <p className="text-[13px] text-[#4b5563] mt-1.5 font-normal leading-relaxed">
            {activeDoc.summary}
          </p>
        </div>
      </div>

      {/* ----------------- SECTION 1: DETAILED LIBRARY INFO (MAIN CARD) ----------------- */}
      <div className="p-5 sm:p-6 rounded-2xl border border-slate-200/90 bg-white space-y-4 shadow-2xs">
        <div className="flex items-center justify-between border-b border-[#f1f5f9] pb-2.5">
          <h3 className="text-xs font-bold text-[#111827] uppercase tracking-wider flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#0057B8]" />
            Detailed Library Info
          </h3>
          <span className="text-[10.5px] text-slate-400 font-mono">CORE SPECIFICATION</span>
        </div>

          <FormattedPolicyContent
            content={resolvedContent}
            policyId={activeDoc?.id || detailedPolicy?.id || policy?.id}
            policyTitle={activeDoc?.title || detailedPolicy?.title || policy?.title}
            onAssignTask={null}
          />

            {/* PHASE-WISE BREAKDOWN — Rendered when phases are stored in DB parameters */}
            {phases.length > 0 && (
              <div className="mt-6 pt-5 border-t border-slate-200/80 space-y-4">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#0057B8]" />
                  <h4 className="text-[13.5px] font-bold text-slate-900 tracking-tight">
                    Operational Phases ({phases.length})
                  </h4>
                  <span className="text-[11px] font-medium text-blue-800 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                    Structured Governance Sections
                  </span>
                </div>

                <div className="space-y-3">
                  {phases.map((phase) => (
                    <div
                      key={phase.id || phase.phase_number}
                      className="rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-white hover:border-blue-200 transition p-4 space-y-2 group"
                    >
                      {/* Phase header */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#0057B8] text-white text-[10px] font-black flex items-center justify-center">
                            {phase.phase_number}
                          </span>
                          <h5 className="text-[12.5px] font-bold text-slate-900 group-hover:text-blue-800 transition">
                            Phase {phase.phase_number}: {phase.title}
                          </h5>
                        </div>
                      </div>

                      {/* Phase summary */}
                      {phase.summary && (
                        <p className="text-[12px] text-slate-600 leading-relaxed pl-8">
                          {phase.summary}
                        </p>
                      )}

                      {/* Key rules tags */}
                      {phase.key_rules && phase.key_rules.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pl-8">
                          {phase.key_rules.map((rule, rIdx) => (
                            <span
                              key={rIdx}
                              className="text-[10.5px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200 font-medium"
                            >
                              {rule}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* DIRECT IN-SYSTEM DOCUMENTS (IF THIS IS A MASTER PRODUCT POLICY) */}
            {activeDoc.direct_documents && activeDoc.direct_documents.length > 0 && (
              <div className="mt-6 pt-5 border-t border-slate-200/80 space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-blue-600" />
                    <h4 className="text-[13.5px] font-bold text-slate-900 tracking-tight">
                      Direct In-System Documents in this Product ({activeDoc.direct_documents.length})
                    </h4>
                  </div>
                  <span className="text-[11px] font-medium text-blue-800 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full">
                    Operational Product Specifications
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {activeDoc.direct_documents.map((doc) => (
                    <div 
                      key={doc.id}
                      className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-white hover:border-blue-300 transition shadow-2xs space-y-2 cursor-pointer group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-bold text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.2 rounded">
                          {doc.code}
                        </span>
                        <span className="text-[10px] font-medium text-slate-400">
                          {doc.version}
                        </span>
                      </div>
                      <h5 className="text-[12px] font-bold text-slate-800 group-hover:text-blue-700 transition leading-snug">
                        {doc.title}
                      </h5>
                      <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                        {doc.summary}
                      </p>
                      <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 text-[10.5px]">
                        <span className="text-slate-400">{doc.type}</span>
                        <span className="text-emerald-600 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Active
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* MANDATORY TRAINING, STAFF ACCREDITATION & ONBOARDING COST TRACKING */}
            <div className="mt-8 pt-6 border-t border-slate-200/80 space-y-5">
              
              {/* Header */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-slate-800" />
                  <div>
                    <h4 className="text-[14.5px] font-bold text-slate-900 tracking-tight">
                      Mandatory Training, Staff Accreditation & Onboarding Cost Tracking
                    </h4>
                    <p className="text-[11.5px] text-slate-500">
                      Track individual employee training notes, accreditation progress, and institutional onboarding expenditure.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {isBankOwner && (
                    <button
                      type="button"
                      onClick={() => setIsAddTrainingModalOpen(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-[#0057B8] hover:bg-[#004EA6] text-white shadow-2xs transition cursor-pointer"
                      title="Approver / Bank Manager: Add a new mandatory training session or accreditation module"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Training Session</span>
                    </button>
                  )}
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    APRA CPS 234 Verified • 98.4% Branch Staff Certified
                  </span>
                </div>
              </div>

              {/* Institutional Training Sessions Added by Approver in Database */}
              {trainingItems.length > 0 && (
                <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/40 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-blue-900 uppercase tracking-wider flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-blue-700" />
                      <span>Active Policy Training Sessions Enforced in System ({trainingItems.length})</span>
                    </span>
                    <span className="text-[10.5px] text-blue-700 font-semibold bg-blue-100 px-2 py-0.5 rounded-full">
                      Neon DB Synced
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                    {trainingItems.map(item => (
                      <div key={item.id} className="p-3 rounded-lg bg-white border border-blue-200/80 shadow-2xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900">{item.title}</span>
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded">
                            Active
                          </span>
                        </div>
                        {item.description && (
                          <p className="text-[11.5px] text-slate-600 leading-relaxed">{item.description}</p>
                        )}
                        {item.url_or_file && (
                          <a 
                            href={item.url_or_file} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-[11px] text-blue-700 hover:underline flex items-center gap-1 pt-1 font-medium"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span>Launch Training Module</span>
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 1. ONBOARDING TRAINING COST CALCULATION (FOR USER & FOR BANK OWNER) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                
                {/* CARD 1: Cost to the User / Bank Employee */}
                <div className="p-4 rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50/50 to-white shadow-2xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                        👤
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block">Staff Onboarding Cost</span>
                        <h5 className="text-[13px] font-bold text-slate-900">Cost to the User (Bank Employee)</h5>
                      </div>
                    </div>
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                      100% Subsidized
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between pt-1 border-t border-blue-100">
                    <div>
                      <span className="text-2xl font-black text-slate-900 font-mono">$450 AUD</span>
                      <span className="text-[11px] text-slate-500 ml-1.5">per employee accreditation pack</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[11px] font-semibold text-emerald-600 block">Out of Pocket: $0 AUD</span>
                      <span className="text-[10px] text-slate-400">Paid by Commonwealth Bank</span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-white border border-blue-100 space-y-1.5 text-[11px]">
                    <div className="flex justify-between text-slate-600">
                      <span>• APRA Regulatory Compliance License:</span>
                      <span className="font-semibold text-slate-800">$150 AUD</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>• DVS Simulator & Identity Sandbox:</span>
                      <span className="font-semibold text-slate-800">$120 AUD</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>• Delegation Exam & Officer Certification:</span>
                      <span className="font-semibold text-slate-800">$180 AUD</span>
                    </div>
                  </div>
                </div>

                {/* CARD 2: Cost to the Bank Administrator */}
                <div className="p-4 rounded-xl border border-slate-300 bg-gradient-to-br from-slate-50 to-white shadow-2xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
                        🏦
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Institutional Investment</span>
                        <h5 className="text-[13px] font-bold text-slate-900">Cost to the Bank Administrator</h5>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10.5px] text-slate-500">Enrolled Staff:</span>
                      <div className="flex items-center border border-slate-200 rounded bg-white">
                        <button
                          onClick={() => setEnrolledStaffCount(prev => Math.max(1, prev - 1))}
                          className="px-1.5 py-0.5 text-xs font-bold hover:bg-slate-100 text-slate-600"
                        >
                          -
                        </button>
                        <span className="px-1.5 text-xs font-bold font-mono text-slate-800">{enrolledStaffCount}</span>
                        <button
                          onClick={() => setEnrolledStaffCount(prev => prev + 1)}
                          className="px-1.5 py-0.5 text-xs font-bold hover:bg-slate-100 text-slate-600"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-baseline justify-between pt-1 border-t border-slate-200">
                    <div>
                      <span className="text-2xl font-black text-slate-900 font-mono">
                        ${(enrolledStaffCount * 450).toLocaleString()} AUD
                      </span>
                      <span className="text-[11px] text-slate-500 ml-1.5">total training expenditure</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[11px] font-semibold text-slate-700 block">Budget: $25,000 AUD</span>
                      <span className="text-[10px] text-emerald-600 font-medium">
                        ${(25000 - enrolledStaffCount * 450).toLocaleString()} AUD remaining
                      </span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-white border border-slate-200 space-y-1 text-[11px]">
                    <div className="flex justify-between text-slate-600">
                      <span>• Calculated Allocation:</span>
                      <span className="font-semibold text-slate-800">{enrolledStaffCount} Staff × $450 AUD</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>• APRA Breach Penalties Avoided:</span>
                      <span className="font-semibold text-emerald-600">~$250,000 AUD</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>• Net Compliance ROI:</span>
                      <span className="font-semibold text-slate-900">13.2x Return on Investment</span>
                    </div>
                  </div>
                </div>

              </div>

              {/* 2. USER FILTER FOR TRAINING OPTIONS & NOTES ("jest make tiflreto o") */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Filter className="w-3.5 h-3.5 text-slate-600" />
                    <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                      Filter Training by Bank User:
                    </span>
                  </div>
                  <span className="text-[10.5px] text-slate-400">
                    Viewing {selectedUserFilter === 'all' ? 'All Staff Members' : trainingUsers.find(u => u.id === selectedUserFilter)?.name}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    onClick={() => setSelectedUserFilter('all')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                      selectedUserFilter === 'all'
                        ? 'bg-slate-900 text-white shadow-2xs'
                        : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    All Staff ({trainingUsers.length})
                  </button>

                  {trainingUsers.map(u => (
                    <button
                      key={u.id}
                      onClick={() => {
                        setSelectedUserFilter(u.id);
                        setSelectedUserForNote(u.id);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1.5 ${
                        selectedUserFilter === u.id
                          ? 'bg-slate-900 text-white font-semibold shadow-2xs'
                          : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <span>{u.name}</span>
                      <span className={`text-[10px] px-1 rounded ${
                        selectedUserFilter === u.id
                          ? 'bg-slate-800 text-slate-200'
                          : 'bg-slate-100 text-slate-500'
                      }`}>
                        {u.role === 'Bank Administrator' ? 'Owner' : 'Employee'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. TRAINING OPTIONS & MODULES TRACKING PER USER */}
              <div className="space-y-3">
                {trainingUsers
                  .filter(u => selectedUserFilter === 'all' || u.id === selectedUserFilter)
                  .map(u => (
                    <div key={u.id} className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-3">
                      
                      {/* User Title & Accreditation Status */}
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-[#1e293b] text-white flex items-center justify-center font-bold text-xs">
                            {u.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-900 text-[13px]">{u.name}</span>
                              <span className="text-[10.5px] font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200">
                                {u.role}
                              </span>
                            </div>
                            <span className="text-[11px] text-slate-400">{u.department}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-slate-500 font-medium">
                            {u.certifiedCount} of {u.modules.length} Modules Completed
                          </span>
                          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                            u.onboardingCompleted
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}>
                            {u.onboardingCompleted ? '✓ Accredited' : '● Onboarding in Progress'}
                          </span>
                        </div>
                      </div>

                      {/* Modules Grid for this user */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-xs">
                        {u.modules.map(mod => (
                          <div key={mod.id} className="p-2.5 rounded-lg border border-slate-200/80 bg-slate-50/60 space-y-1">
                            <div className="flex items-center justify-between">
                              <span className={`text-[9.5px] font-bold px-1.5 py-0.2 rounded font-mono ${
                                mod.status === 'Completed' || mod.status === 'Certified'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : mod.status === 'In Progress'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-slate-200 text-slate-700'
                              }`}>
                                {mod.status}
                              </span>
                              <span className="text-[10px] font-bold font-mono text-slate-700">
                                {mod.score !== '--' ? `Score: ${mod.score}` : ''}
                              </span>
                            </div>
                            <h6 className="font-bold text-slate-800 text-[11.5px] leading-snug">{mod.name}</h6>
                            <span className="text-[10px] text-slate-400 block pt-0.5">
                              {mod.completedDate ? `Passed: ${mod.completedDate}` : `Due: ${mod.dueDate}`}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Training Notes for this user */}
                      <div className="pt-2 border-t border-slate-100 space-y-1.5">
                        <span className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wider block">
                          Training & Supervisor Coaching Notes ({u.notes.length})
                        </span>
                        <div className="space-y-1.5">
                          {u.notes.map(note => (
                            <div key={note.id} className="p-2 rounded-lg bg-slate-50 border border-slate-200/70 text-[11.5px] flex items-start justify-between gap-2">
                              <div>
                                <span className="font-semibold text-slate-800">{note.author}: </span>
                                <span className="text-slate-600">{note.text}</span>
                              </div>
                              <span className="text-[10px] text-slate-400 whitespace-nowrap">{note.date}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                    </div>
                  ))}
              </div>

              {/* 4. FORM TO ADD A TRAINING NOTE FOR A USER */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-2">
                <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                  Add Training / Coaching Note for Employee
                </span>
                <form onSubmit={handleAddTrainingNote} className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <label className="text-xs font-semibold text-slate-600">Select Employee:</label>
                    <select
                      value={selectedUserForNote}
                      onChange={(e) => setSelectedUserForNote(e.target.value)}
                      className="p-1.5 text-xs rounded-lg border border-slate-300 bg-white font-medium"
                    >
                      {trainingUsers.map(u => (
                        <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      required
                      value={newTrainingNoteText}
                      onChange={(e) => setNewTrainingNoteText(e.target.value)}
                      placeholder="Add coaching note, accreditation sign-off, or practical exam feedback..."
                      className="flex-1 text-xs p-2 rounded-lg border border-slate-300 focus:outline-none focus:border-slate-500"
                    />
                    <button
                      type="submit"
                      className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 transition cursor-pointer flex items-center gap-1 shadow-2xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Save Note</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => alert("SOP Acknowledgment Recorded: Signed by " + (currentUser?.name || "Staff Reviewer") + " on " + new Date().toLocaleDateString())}
                    className="px-3.5 py-1.5 rounded-lg text-[12.5px] font-semibold bg-slate-900 hover:bg-slate-800 text-white shadow-2xs transition cursor-pointer"
                  >
                    ✓ Acknowledge & Sign-Off SOP
                  </button>
                  <button 
                    onClick={() => alert("Launching 5-question staff accreditation quiz...")}
                    className="px-3 py-1.5 rounded-lg text-[12.5px] font-medium bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 transition cursor-pointer"
                  >
                    Take Accreditation Quiz (5 mins)
                  </button>
                </div>
                <button 
                  onClick={() => window.print()}
                  className="text-[12px] font-medium text-slate-600 hover:text-slate-900 flex items-center gap-1.5 hover:underline cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Download Training Pack (.PDF)</span>
                </button>
              </div>
            </div>
          </div>

      {/* ----------------- SECTION 2: SUPPLEMENTARY SECTION (BOTTOM CARD) ----------------- */}
      <div className="p-5 sm:p-6 rounded-2xl border border-slate-200/90 bg-white space-y-4 shadow-2xs">
        
        {/* Supplementary Section Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#dbe4ef] pb-2.5">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-slate-600" />
            <h3 className="text-[14px] font-bold text-slate-900">Supplementary Section</h3>
            <span className="text-[11px] text-slate-500 font-medium">Operational Parameters & Contextual Linkages</span>
          </div>

          {/* Contextual Linkage Tabs - Highlighted when active docs exist, inactive button when 0 */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => setActiveSupplementaryTab('parameters')}
              className={`px-2.5 py-1 rounded-md text-[11.5px] font-medium transition cursor-pointer ${
                activeSupplementaryTab === 'parameters'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              Thresholds & Charts
            </button>

            {/* Training Tab */}
            <button
              onClick={() => setActiveSupplementaryTab('training')}
              className={`px-2.5 py-1 rounded-md text-[11.5px] font-medium flex items-center gap-1.5 transition cursor-pointer ${
                activeSupplementaryTab === 'training'
                  ? 'bg-[#0057B8] text-white shadow-primary-sm font-semibold'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
              }`}
              title="Staff Training & Onboarding Cost Tracking"
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Training ({trainingUsers.length} Staff)</span>
            </button>

            {/* Reports Tab */}
            <button
              onClick={() => reportItems.length > 0 && setActiveSupplementaryTab('reports')}
              disabled={reportItems.length === 0}
              className={`px-2.5 py-1 rounded-md text-[11.5px] font-medium flex items-center gap-1.5 transition ${
                activeSupplementaryTab === 'reports'
                  ? 'bg-[#0057B8] text-white shadow-primary-sm font-semibold'
                  : reportItems.length > 0
                  ? 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100 cursor-pointer'
                  : 'bg-slate-100 text-slate-400 border border-slate-200/60 cursor-not-allowed opacity-60'
              }`}
              title={reportItems.length > 0 ? "Active Control Reports" : "No reports"}
            >
              <FileCheck className="w-3.5 h-3.5" />
              <span>Reports ({reportItems.length})</span>
            </button>

            {/* Incidents Tab */}
            <button
              onClick={() => incidentItems.length > 0 && setActiveSupplementaryTab('incidents')}
              disabled={incidentItems.length === 0}
              className={`px-2.5 py-1 rounded-md text-[11.5px] font-medium flex items-center gap-1.5 transition ${
                activeSupplementaryTab === 'incidents'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : incidentItems.length > 0
                  ? 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100 cursor-pointer'
                  : 'bg-slate-100 text-slate-400 border border-slate-200/60 cursor-not-allowed opacity-60'
              }`}
              title={incidentItems.length > 0 ? "Active Incidents & Issues" : "No incidents"}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Issues ({incidentItems.length})</span>
            </button>

            {/* FAQs Tab */}
            <button
              onClick={() => faqItems.length > 0 && setActiveSupplementaryTab('faqs')}
              disabled={faqItems.length === 0}
              className={`px-2.5 py-1 rounded-md text-[11.5px] font-medium flex items-center gap-1.5 transition ${
                activeSupplementaryTab === 'faqs'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : faqItems.length > 0
                  ? 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100 cursor-pointer'
                  : 'bg-slate-100 text-slate-400 border border-slate-200/60 cursor-not-allowed opacity-60'
              }`}
              title={faqItems.length > 0 ? "Active FAQs" : "No FAQs"}
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>FAQs ({faqItems.length})</span>
            </button>

            {/* Regulatory Reference Tab */}
            <button
              onClick={() => setActiveSupplementaryTab('reg_reference')}
              className={`px-2.5 py-1 rounded-md text-[11.5px] font-medium flex items-center gap-1.5 transition cursor-pointer ${
                activeSupplementaryTab === 'reg_reference'
                  ? 'bg-[#0057B8] text-white shadow-primary-sm font-semibold'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
              }`}
              title="Optional Regulatory Reference Linkage"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Reg Reference</span>
            </button>
          </div>
        </div>

        {/* Tab 1: Operational Parameters Grid & SLA Trendline Chart */}
        {activeSupplementaryTab === 'parameters' && (
          <div className="space-y-4">
            {/* SUBTLE, COMPACT PARAMETER CARDS (Correct sizes, subtle colors, no huge fonts) */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
              <div className="p-3 rounded-lg border border-slate-200 bg-white shadow-2xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Turnaround SLA</span>
                <p className="text-[14px] font-bold text-slate-800 mt-0.5">
                  {parameters.turnaround_sla || '24 Hours'}
                </p>
                <span className="text-[11px] text-slate-500 mt-0.5 block">Target: 99.4% adherence</span>
              </div>

              <div className="p-3 rounded-lg border border-slate-200 bg-white shadow-2xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Daily Limit</span>
                <p className="text-[14px] font-bold text-slate-800 mt-0.5">
                  {parameters.daily_limit || '$25,000 AUD'}
                </p>
                <span className="text-[11px] text-slate-500 mt-0.5 block">Customer ceiling</span>
              </div>

              <div className="p-3 rounded-lg border border-slate-200 bg-white shadow-2xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Officer Approval Cap</span>
                <p className="text-[14px] font-bold text-slate-800 mt-0.5">
                  {parameters.approval_limits?.officer_cap || '$100,000 AUD'}
                </p>
                <span className="text-[11px] text-slate-500 mt-0.5 block">Delegate approval cap</span>
              </div>

              <div className="p-3 rounded-lg border border-slate-200 bg-white shadow-2xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Identity Check</span>
                <p className="text-[14px] font-bold text-slate-800 mt-0.5">
                  {parameters.mandatory_dvs ? 'Mandatory DVS' : 'Equifax + DVS'}
                </p>
                <span className="text-[11px] text-slate-500 mt-0.5 block">Automated verification</span>
              </div>
            </div>

            {/* SLA TURNAROUND TRENDLINE & TARGET VS ACTUAL CHART */}
            <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
                <div>
                  <h4 className="text-[13px] font-bold text-slate-800">
                    SLA Turnaround Trendline: Operational Targets vs. Actuals
                  </h4>
                  <p className="text-[11.5px] text-slate-500">
                    6-Month Historical Resolution Trend (Commonwealth Bank Credit Adjudication)
                  </p>
                </div>
                <div className="flex items-center gap-4 text-[11px] font-medium text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-0.5 bg-slate-400 border-b border-dashed border-slate-500"></span>
                    <span>Target Benchmark (24.0h)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-900"></span>
                    <span>Actual Adjudication (Avg: 14.2h)</span>
                  </div>
                  <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded font-semibold border border-emerald-200">
                    99.4% SLA Adhered
                  </span>
                </div>
              </div>

              {/* Clean Interactive SVG Chart */}
              <div className="w-full h-44 relative pt-2">
                <svg className="w-full h-full overflow-visible" viewBox="0 0 600 130">
                  {/* Grid lines */}
                  <line x1="40" y1="20" x2="580" y2="20" stroke="#f1f5f9" strokeWidth="1" />
                  <line x1="40" y1="55" x2="580" y2="55" stroke="#f1f5f9" strokeWidth="1" />
                  <line x1="40" y1="90" x2="580" y2="90" stroke="#f1f5f9" strokeWidth="1" />

                  {/* Axis Y Labels */}
                  <text x="32" y="24" textAnchor="end" className="text-[9.5px] fill-slate-400 font-mono">24h</text>
                  <text x="32" y="59" textAnchor="end" className="text-[9.5px] fill-slate-400 font-mono">18h</text>
                  <text x="32" y="94" textAnchor="end" className="text-[9.5px] fill-slate-400 font-mono">12h</text>

                  {/* Benchmark Target Line (24h) */}
                  <line 
                    x1="45" 
                    y1="20" 
                    x2="575" 
                    y2="20" 
                    stroke="#94a3b8" 
                    strokeWidth="1.5" 
                    strokeDasharray="4 4" 
                  />

                  {/* Actual Trend Area Gradient & Path */}
                  <defs>
                    <linearGradient id="actualGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#334155" stopOpacity="0.12" />
                      <stop offset="100%" stopColor="#334155" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Shaded Area */}
                  <polygon 
                    points="60,110 60,35 160,45 260,52 360,56 460,68 560,82 560,110" 
                    fill="url(#actualGradient)" 
                  />

                  {/* Actual Trend Line */}
                  <polyline
                    fill="none"
                    stroke="#0f172a"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points="60,35 160,45 260,52 360,56 460,68 560,82"
                  />

                  {/* Month Data Points & Hover Tooltips */}
                  {/* May */}
                  <circle cx="60" cy="35" r="4" fill="#ffffff" stroke="#0f172a" strokeWidth="2" />
                  <text x="60" y="30" textAnchor="middle" className="text-[9px] fill-slate-700 font-semibold font-mono">21.8h</text>
                  <text x="60" y="124" textAnchor="middle" className="text-[10px] fill-slate-500 font-medium">May</text>

                  {/* Jun */}
                  <circle cx="160" cy="45" r="4" fill="#ffffff" stroke="#0f172a" strokeWidth="2" />
                  <text x="160" y="40" textAnchor="middle" className="text-[9px] fill-slate-700 font-semibold font-mono">20.1h</text>
                  <text x="160" y="124" textAnchor="middle" className="text-[10px] fill-slate-500 font-medium">Jun</text>

                  {/* Jul */}
                  <circle cx="260" cy="52" r="4" fill="#ffffff" stroke="#0f172a" strokeWidth="2" />
                  <text x="260" y="47" textAnchor="middle" className="text-[9px] fill-slate-700 font-semibold font-mono">19.0h</text>
                  <text x="260" y="124" textAnchor="middle" className="text-[10px] fill-slate-500 font-medium">Jul</text>

                  {/* Aug */}
                  <circle cx="360" cy="56" r="4" fill="#ffffff" stroke="#0f172a" strokeWidth="2" />
                  <text x="360" y="51" textAnchor="middle" className="text-[9px] fill-slate-700 font-semibold font-mono">18.4h</text>
                  <text x="360" y="124" textAnchor="middle" className="text-[10px] fill-slate-500 font-medium">Aug</text>

                  {/* Sep */}
                  <circle cx="460" cy="68" r="4" fill="#ffffff" stroke="#0f172a" strokeWidth="2" />
                  <text x="460" y="63" textAnchor="middle" className="text-[9px] fill-slate-700 font-semibold font-mono">16.5h</text>
                  <text x="460" y="124" textAnchor="middle" className="text-[10px] fill-slate-500 font-medium">Sep</text>

                  {/* Oct */}
                  <circle cx="560" cy="82" r="5" fill="#0f172a" stroke="#ffffff" strokeWidth="2" />
                  <text x="560" y="76" textAnchor="middle" className="text-[10px] fill-slate-900 font-bold font-mono">14.2h</text>
                  <text x="560" y="124" textAnchor="middle" className="text-[10px] fill-slate-900 font-bold">Oct (Now)</text>
                </svg>
              </div>

              {/* Operational Insights bar */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-center text-[11.5px]">
                <div className="p-1.5 rounded bg-slate-50">
                  <span className="text-slate-400 block text-[10px]">Fast-Track Automation</span>
                  <span className="font-bold text-slate-800">92.6% within 4 hours</span>
                </div>
                <div className="p-1.5 rounded bg-slate-50">
                  <span className="text-slate-400 block text-[10px]">Supervisor Sign-off</span>
                  <span className="font-bold text-slate-800">100% Dual Approval</span>
                </div>
                <div className="p-1.5 rounded bg-slate-50">
                  <span className="text-slate-400 block text-[10px]">Breach Rate</span>
                  <span className="font-bold text-emerald-600">0.06% (Well within APRA target)</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Training Materials & Staff Onboarding Progress */}
        {activeSupplementaryTab === 'training' && (
          <div className="space-y-3">
            <div className="p-3.5 bg-white rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-2 shadow-2xs">
              <div>
                <h4 className="text-[13px] font-bold text-slate-900">Branch Onboarding & Accreditation Summary</h4>
                <p className="text-[11.5px] text-slate-500">
                  {trainingUsers.filter(u => u.onboardingCompleted).length} of {trainingUsers.length} Staff fully accredited • Total Cost: ${(enrolledStaffCount * 450).toLocaleString()} AUD
                </p>
              </div>
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                APRA CPS 234 Verified
              </span>
            </div>

            {trainingItems.map(item => (
              <div key={item.id} className="p-3 bg-white rounded-xl border border-[#e5e7eb] flex items-center justify-between">
                <div>
                  <h4 className="text-[13.5px] font-semibold text-slate-800">{item.title}</h4>
                  <span className="text-[11px] text-slate-500">{item.file_type} • Updated for v{activeDoc.version || '1.0'}</span>
                </div>
                <button className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium cursor-pointer">
                  Open Guide
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Tab 3: Control Reports */}
        {activeSupplementaryTab === 'reports' && (
          <div className="space-y-2.5">
            {reportItems.map(item => (
              <div key={item.id} className="p-3 bg-white rounded-xl border border-[#e5e7eb] flex items-center justify-between">
                <div>
                  <h4 className="text-[13.5px] font-semibold text-slate-800">{item.title}</h4>
                  <span className="text-[11px] text-slate-500">{item.file_type} • Verified Control Log</span>
                </div>
                <button className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium">
                  View Report
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Tab 4: Issues & Incidents */}
        {activeSupplementaryTab === 'incidents' && (
          <div className="space-y-2.5">
            {incidentItems.map(item => (
              <div key={item.id} className="p-3 bg-white rounded-xl border border-amber-200 bg-amber-50/30 flex items-center justify-between">
                <div>
                  <h4 className="text-[13.5px] font-semibold text-slate-800">{item.title}</h4>
                  <span className="text-[11px] text-amber-700 font-medium">Resolution Confirmed</span>
                </div>
                <button className="px-3 py-1 bg-white border border-slate-200 text-slate-700 rounded-lg text-xs font-medium">
                  Audit Notes
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Tab 5: FAQs */}
        {activeSupplementaryTab === 'faqs' && (
          <div className="space-y-2.5">
            {faqItems.map(item => (
              <div key={item.id} className="p-3.5 bg-white rounded-xl border border-[#e5e7eb]">
                <h4 className="text-[13px] font-bold text-slate-800">{item.title}</h4>
                <p className="text-[12.5px] text-slate-600 mt-1">
                  Personal credit lines are subject to standard verification. Escalations exceeding $50,000 AUD mandate Level 3 Department Manager sign-off.
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Tab 6: Regulatory Reference */}
        {activeSupplementaryTab === 'reg_reference' && (
          <div className="p-4 bg-white rounded-xl border border-[#e5e7eb] space-y-2 text-[13px]">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Optional Regulatory Reference Mapping
            </span>
            <p className="text-slate-700">
              Correlating Framework: <strong>National Credit Code / Banking Code of Practice 2026</strong>
            </p>
            <p className="text-[12px] text-slate-500">
              Note: As agreed, regulatory standards are contextual reference linkages only and are not a mandatory enforcement requirement for every internal bank policy.
            </p>
          </div>
        )}

        {/* Audit & Revision History */}
        <div className="p-5 rounded-xl border border-[#e5e7eb] bg-white space-y-2.5">
          <div className="flex items-center justify-between">
            <h4 className="text-[12px] font-bold text-slate-700 flex items-center gap-1.5 uppercase tracking-wider">
              <HistoryIcon className="w-3.5 h-3.5 text-slate-500" />
              Version Control Timeline
            </h4>
            <span className="text-[11.5px] text-slate-400">
              {(activeDoc.versions || []).length} Recorded Revisions
            </span>
          </div>

          <div className="divide-y divide-slate-100 text-[12.5px]">
            {(activeDoc.versions || []).length === 0 ? (
              <p className="py-2 text-slate-400 text-xs">Initial baseline version 1.0 active.</p>
            ) : (
              (activeDoc.versions || []).map((ver) => (
                <div key={ver.id || ver.version_number} className="py-2.5 flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-800 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200 text-[11px]">
                        v{ver.version_number}
                      </span>
                      <span className="font-semibold text-slate-800">{ver.changed_by}</span>
                    </div>
                    <p className="text-slate-600 mt-0.5 text-[12px]">{ver.change_summary}</p>
                  </div>
                  <span className="text-[11px] text-slate-400 whitespace-nowrap">
                    {new Date(ver.created_at || Date.now()).toLocaleDateString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Approver / Bank Manager Add Training Session Modal */}
      {isAddTrainingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-white">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#0057B8] flex items-center justify-center font-bold text-sm">
                  <GraduationCap className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Add Mandatory Training Session</h3>
                  <p className="text-[11.5px] text-slate-500">Bank Approver: Configure and assign institutional compliance training</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddTrainingModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddTrainingSessionSubmit} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Training Module Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. APRA CPS 234 Operational Risk & Credit Delegation Walkthrough"
                  value={newTrainingSession.title}
                  onChange={(e) => setNewTrainingSession(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:border-[#0057B8] focus:ring-2 focus:ring-[#0057B8]/15 bg-white text-slate-900 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10.5px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                    Accreditation Category
                  </label>
                  <select
                    value={newTrainingSession.category}
                    onChange={(e) => setNewTrainingSession(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full p-2 rounded-lg border border-slate-300 focus:outline-none focus:border-[#0057B8] bg-white text-slate-800"
                  >
                    <option value="APRA Mandatory Certification">APRA Mandatory Certification</option>
                    <option value="Internal SOP Walkthrough">Internal SOP Walkthrough</option>
                    <option value="Officer Delegation Exam">Officer Delegation Exam</option>
                    <option value="AML/CTF Screening Drill">AML/CTF Screening Drill</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10.5px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                    Passing Benchmark / Score
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 95% Required"
                    value={newTrainingSession.minScore}
                    onChange={(e) => setNewTrainingSession(prev => ({ ...prev, minScore: e.target.value }))}
                    className="w-full p-2 rounded-lg border border-slate-300 focus:outline-none focus:border-[#0057B8] bg-white text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Module Objectives & Instructions
                </label>
                <textarea
                  rows={3}
                  placeholder="Provide scope, core directives, and required practical scenarios for staff completion..."
                  value={newTrainingSession.description}
                  onChange={(e) => setNewTrainingSession(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:border-[#0057B8] bg-white text-slate-800 leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10.5px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                    Completion Due Date
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 30 Days from Enrollment"
                    value={newTrainingSession.dueDate}
                    onChange={(e) => setNewTrainingSession(prev => ({ ...prev, dueDate: e.target.value }))}
                    className="w-full p-2 rounded-lg border border-slate-300 focus:outline-none focus:border-[#0057B8] bg-white text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-[10.5px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                    LMS / Material Link
                  </label>
                  <input
                    type="text"
                    placeholder="https://lms.banking.gov.au/..."
                    value={newTrainingSession.url}
                    onChange={(e) => setNewTrainingSession(prev => ({ ...prev, url: e.target.value }))}
                    className="w-full p-2 rounded-lg border border-slate-300 focus:outline-none focus:border-[#0057B8] bg-white text-slate-800"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddTrainingModalOpen(false)}
                  className="px-3.5 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingTraining}
                  className="px-4 py-2 bg-[#0057B8] hover:bg-[#004EA6] text-white rounded-lg text-xs font-bold shadow-xs transition cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{isSavingTraining ? 'Saving to Database...' : 'Save & Enforce Training Session'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Create / Assign Task Modal from Policy Section */}
      {assignTaskModalData && (
        <CreateTaskDialog
          initialData={assignTaskModalData}
          onClose={() => setAssignTaskModalData(null)}
          onTaskCreated={(newTask) => {
            setAssignTaskModalData(null);
            setTaskSuccessToast(`Task ${newTask?.task_code || ''} created and assigned successfully!`);
            setTimeout(() => setTaskSuccessToast(null), 4000);
          }}
        />
      )}

      {/* Task Creation Success Notification Toast */}
      {taskSuccessToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-900 text-white text-xs font-semibold shadow-2xl border border-slate-700 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{taskSuccessToast}</span>
        </div>
      )}
    </main>
  );
}
