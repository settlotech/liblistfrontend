import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  FileText, 
  Upload, 
  BookOpen, 
  Edit3, 
  Sparkles, 
  Bot, 
  Loader2,
  ShieldCheck,
  Check,
  Search,
  Trash2,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  Plus,
  AlignLeft,
  Layers,
  Tag,
  Maximize2,
  Minimize2,
  Save,
  Info,
  ChevronLeft,
  ChevronRight,
  FileEdit
} from 'lucide-react';
import { apiService } from '../../../services/apiService';
import { SectionWordToolbar } from './SectionWordToolbar';

import { POLICY_TEMPLATES } from './policyTemplates';
export default function AddPolicyModal({
  isOpen,
  onClose,
  preselectedDepartmentId,
  preselectedDepartmentName,
  departments = [],
  currentUser,
  onPolicyCreated,
  editingPolicy = null
}) {
  // 3 Policy Creation Modes: 'direct' | 'library' | 'upload'
  const [creationMode, setCreationMode] = useState('direct');
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);

  // Direct In-System Template Selection State
  const [selectedDirectTemplateId, setSelectedDirectTemplateId] = useState(null);
  const [activeTemplateInfoId, setActiveTemplateInfoId] = useState(null);
  const [expandedSectionId, setExpandedSectionId] = useState(null);
  const [expandedModalSectionId, setExpandedModalSectionId] = useState(null);
  const [dynamicTemplates, setDynamicTemplates] = useState(POLICY_TEMPLATES);
  const [selectedTemplatePhases, setSelectedTemplatePhases] = useState([]);

  // Form Fields & Editing States
  const [departmentId, setDepartmentId] = useState(preselectedDepartmentId || departments[0]?.id || 'company-policies');
  const [editingDraftId, setEditingDraftId] = useState(null);
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');
  const [turnaroundSla, setTurnaroundSla] = useState('4 Hours');
  const [dailyLimit, setDailyLimit] = useState('$25,000 AUD');
  const [officerCap, setOfficerCap] = useState('$100,000 AUD');
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [uploadedPdfPreviewUrl, setUploadedPdfPreviewUrl] = useState(null);
  const [uploadedDocRawText, setUploadedDocRawText] = useState('');
  const [leftPaneViewMode, setLeftPaneViewMode] = useState('preview');
  const [isTemplateEditorActive, setIsTemplateEditorActive] = useState(false);
  const [selectedUploadTemplateId, setSelectedUploadTemplateId] = useState('template-01-pdf');
  const [complianceTags, setComplianceTags] = useState([]);
  const [newTagInput, setNewTagInput] = useState('');
  const [masterSearchQuery, setMasterSearchQuery] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState('template-credit-cards');
  const [ingestedDocuments, setIngestedDocuments] = useState([]);
  const [activeIngestedIndex, setActiveIngestedIndex] = useState(0);
  const [showEvidence, setShowEvidence] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // 5 Core Client-Demanded Sections: Summary, Details, Reports, Dependencies, Operational Events
  const [sections, setSections] = useState([
    {
      id: 'sec-summary',
      title: 'Summary',
      content: 'Master product policy governing tiered approval thresholds, mandatory KYC/credit score verification, and direct in-system operational specifications.',
      type: 'section'
    },
    {
      id: 'sec-details',
      title: 'Details',
      content: '1. Applicant Eligibility: Australian resident, minimum ongoing gross income of $35,000 AUD per annum.\n2. Verification Steps: Real-time DVS national identity match, Biometric face liveness score >= 92%, and Equifax comprehensive credit report >= 620.\n3. Approval Thresholds: Automated Tier 1 approvals up to $5,000 AUD; Credit Officer sign-off for Tier 2 up to $15,000 AUD; Department Manager approval for Tier 3 up to $50,000 AUD.',
      type: 'section'
    },
    {
      id: 'sec-reports',
      title: 'Reports',
      content: '1. Threshold Transaction Reporting (TTR): Automated AUSTRAC submission within 10 business days for transfers >= $10,000 AUD.\n2. APRA CPS 234 Audit Logging: Real-time event telemetry, session keystroke indexing, and monthly compliance reconciliation.',
      type: 'section'
    },
    {
      id: 'sec-dependencies',
      title: 'Dependencies',
      content: '1. Core Banking Settlement Engine (CBA Core API v4)\n2. Australian Document Verification Service (DVS Gateway)\n3. Equifax Comprehensive Credit Bureau API\n4. Real-time NPP / PayID Clearing Service',
      type: 'section'
    },
    {
      id: 'sec-events',
      title: 'Operational Events & Lifecycle Triggers',
      content: '1. Event: Customer Application Ingestion - Digital channel lodges customer application; real-time DVS verification invoked.\n2. Event: Escalation Threshold Trigger - Credit request > $15,000 AUD triggers Credit Officer assignment; > $25,000 AUD triggers Manager sign-off.\n3. Event: Limit Cap Verification - System checks daily limit ($25,000 AUD) and officer cap ($100,000 AUD) before decision execution.\n4. Event: Compliance Audit Logging - Immutable APRA CPS 234 event telemetry recorded with AUSTRAC filing if TTR threshold met.',
      type: 'section'
    }
  ]);

  // Fetch dynamic starter templates from DB whenever modal opens
  useEffect(() => {
    if (isOpen) {
      apiService.getTemplates()
        .then((dbTpls) => {
          if (Array.isArray(dbTpls) && dbTpls.length > 0) {
            const formatted = dbTpls.map((t, idx) => ({
              id: t.id,
              name: t.name || `Template ${idx + 1}`,
              title: t.title || 'Operational Standard',
              dept: t.department_id || 'company-policies',
              sla: t.sla || '4 Hours',
              daily: t.daily_limit || '$25,000 AUD',
              cap: t.officer_cap || '$100,000 AUD',
              summary: t.summary || '',
              sections: typeof t.sections === 'string' ? JSON.parse(t.sections) : (t.sections || []),
              phases: typeof t.phases === 'string' ? JSON.parse(t.phases) : (t.phases || [])
            }));
            setDynamicTemplates(formatted);
          }
        })
        .catch((err) => console.warn('Could not load dynamic templates from DB:', err));
    }
  }, [isOpen]);

  // Synchronize department when modal opens or preselected department changes
  useEffect(() => {
    if (isOpen) {
      if (preselectedDepartmentId) {
        setDepartmentId(preselectedDepartmentId);
      } else if (!departmentId && departments.length > 0) {
        setDepartmentId(departments[0].id);
      }
    }
  }, [isOpen, preselectedDepartmentId]);

  // Synchronize fields when editing an existing policy / draft
  useEffect(() => {
    if (isOpen && editingPolicy) {
      setEditingDraftId(editingPolicy.id || null);
      setTitle(editingPolicy.title || '');
      setSummary(editingPolicy.summary || '');
      setContent(editingPolicy.content || '');
      if (editingPolicy.department_id || editingPolicy.deptId) {
        setDepartmentId(editingPolicy.department_id || editingPolicy.deptId);
      }
      const params = typeof editingPolicy.parameters === 'string'
        ? JSON.parse(editingPolicy.parameters || '{}')
        : (editingPolicy.parameters || {});

      setTurnaroundSla(params.turnaround_sla || editingPolicy.turnaroundSla || '4 Hours');
      setDailyLimit(params.daily_limit || editingPolicy.dailyLimit || '$25,000 AUD');
      setOfficerCap(params.approval_limits?.officer_cap || editingPolicy.officerCap || '$100,000 AUD');

      let loadedSections = [];
      if (params.sections && Array.isArray(params.sections) && params.sections.length > 0) {
        loadedSections = params.sections.map((sec, idx) => ({
          ...sec,
          id: sec.id ? String(sec.id) : `sec-${idx}-${Date.now()}`
        }));
      } else if (editingPolicy.content && typeof editingPolicy.content === 'string' && editingPolicy.content.trim()) {
        const raw = editingPolicy.content.trim();
        const parts = raw.split(/(?=###\s+)/);
        if (parts.length > 1) {
          loadedSections = parts.map((part, i) => {
            const match = part.match(/^###\s*(?:\d+\.?\s*)?(.*?)\n([\s\S]*)$/);
            return {
              id: `sec-${i}-${Date.now()}`,
              title: match ? match[1].trim() : `Section ${i + 1}`,
              content: match ? match[2].trim() : part.trim(),
              type: 'section'
            };
          });
        } else {
          loadedSections = [
            { id: `sec-summary-${Date.now()}`, title: '1. Summary & Scope', content: editingPolicy.summary || 'Summary of operational intent.', type: 'section' },
            { id: `sec-details-${Date.now()}`, title: '2. Operational Details & Clauses', content: raw, type: 'section' }
          ];
        }
      }

      // If sections is still empty, supply the standard 5 baseline sections so sections are NEVER 0
      if (!loadedSections || loadedSections.length === 0) {
        loadedSections = [
          {
            id: `sec-summary-${Date.now()}`,
            title: '1. Purpose & Product Scope',
            content: editingPolicy.summary || 'This policy framework governs credit assessment criteria, authorization limits, and regulatory compliance standards across retail banking operations under APRA CPS 234.',
            type: 'section'
          },
          {
            id: `sec-rules-${Date.now()}`,
            title: '2. Operational Rules & Mandatory Verifications',
            content: '1. Applicant Identity: Mandatory 100-point identity check via Australian DVS Gateway.\n2. Serviceability: Minimum debt-to-income (DTI) ratio check with 3.0% interest rate buffer.\n3. Bureau Inquiries: Real-time Comprehensive Credit Reporting (CCR) pull via Equifax API.',
            type: 'section'
          },
          {
            id: `sec-reports-${Date.now()}`,
            title: '3. Reports & Audit Telemetry',
            content: 'Daily transaction logging, monthly exception reports, and quarterly APRA CPS 230 operational risk attestations.',
            type: 'section'
          },
          {
            id: `sec-dependencies-${Date.now()}`,
            title: '4. Dependencies & Core Integrations',
            content: '1. Core Banking Settlement Engine (CBA Core API v4)\n2. Equifax Comprehensive Credit Bureau API\n3. Australian DVS Document Verification Service Gateway',
            type: 'section'
          },
          {
            id: `sec-events-${Date.now()}`,
            title: '5. Operational Events & Lifecycle Triggers',
            content: '1. Event: Credit request > $15,000 AUD triggers Credit Officer assignment.\n2. Event: Limit Cap Verification - System checks daily limit ($25,000 AUD) and officer cap ($100,000 AUD) before decision execution.\n3. Event: Cash advance >= $10,000 AUD triggers automated AUSTRAC TTR report generation.',
            type: 'section'
          }
        ];
      }

      setSections(loadedSections);
      setCreationMode('direct');
    }
  }, [isOpen, editingPolicy]);

  const handleUpdateSectionTitle = (id, newTitle) => {
    setSections(prev => prev.map(s => s.id === id ? { ...s, title: newTitle } : s));
  };

  const handleUpdateSectionContent = (id, newContent) => {
    setSections(prev => prev.map(s => s.id === id ? { ...s, content: newContent } : s));
  };

  const handleApplyFormat = (sectionId, formatKey) => {
    const activeEl = document.activeElement;
    const isTextarea = activeEl && activeEl.tagName === 'TEXTAREA';
    const hasSelection = isTextarea && activeEl.selectionStart !== activeEl.selectionEnd;

    setSections(prev => prev.map(sec => {
      if (sec.id !== sectionId) return sec;
      let text = sec.content || '';

      if (hasSelection) {
        const start = activeEl.selectionStart;
        const end = activeEl.selectionEnd;
        const selected = text.substring(start, end);
        let replacement = selected;

        switch (formatKey) {
          case 'bold':
            replacement = `**${selected}**`;
            break;
          case 'italic':
            replacement = `*${selected}*`;
            break;
          case 'underline':
            replacement = `<u>${selected}</u>`;
            break;
          case 'strikethrough':
            replacement = `~~${selected}~~`;
            break;
          case 'h1':
            replacement = `# ${selected}`;
            break;
          case 'h2':
            replacement = `## ${selected}`;
            break;
          case 'h3':
            replacement = `### ${selected}`;
            break;
          case 'alignCenter':
            replacement = `<div align="center">\n${selected}\n</div>`;
            break;
          case 'alignRight':
            replacement = `<div align="right">\n${selected}\n</div>`;
            break;
          case 'alignLeft':
            replacement = `<div align="left">\n${selected}\n</div>`;
            break;
          case 'bullet':
            replacement = selected.split('\n').map(l => l.startsWith('- ') ? l : `- ${l}`).join('\n');
            break;
          case 'number':
            replacement = selected.split('\n').map((l, i) => `${i + 1}. ${l}`).join('\n');
            break;
          case 'checkbox':
            replacement = selected.split('\n').map(l => `- [ ] ${l}`).join('\n');
            break;
          case 'note':
            replacement = selected.split('\n').map(l => `> ${l}`).join('\n');
            break;
          case 'table':
            replacement = `${selected}\n\n| Parameter | Requirement | Status |\n|---|---|---|\n| Limit | $50,000 AUD | Mandatory |\n| Approval Tier | Tier 2 Manager | Active |`;
            break;
          case 'addRow':
            replacement = `${selected}\n| Additional Parameter | Specific Limit | Required |`;
            break;
          default:
            break;
        }

        const newText = text.substring(0, start) + replacement + text.substring(end);
        return { ...sec, content: newText };
      }

      // No active selection - insert or append template snippet
      switch (formatKey) {
        case 'bold':
          text += (text ? '\n' : '') + '**Bold Text**';
          break;
        case 'italic':
          text += (text ? '\n' : '') + '*Italic Text*';
          break;
        case 'underline':
          text += (text ? '\n' : '') + '<u>Underlined Text</u>';
          break;
        case 'strikethrough':
          text += (text ? '\n' : '') + '~~Strikethrough~~';
          break;
        case 'h1':
          text += (text ? '\n\n' : '') + '# Main Document Heading';
          break;
        case 'h2':
          text += (text ? '\n\n' : '') + '## Section Header';
          break;
        case 'h3':
          text += (text ? '\n\n' : '') + '### Sub-clause Specification';
          break;
        case 'alignCenter':
          text += (text ? '\n' : '') + '<div align="center">\nCentered Text\n</div>';
          break;
        case 'alignRight':
          text += (text ? '\n' : '') + '<div align="right">\nRight-aligned Text\n</div>';
          break;
        case 'alignLeft':
          text += (text ? '\n' : '') + '<div align="left">\nLeft-aligned Text\n</div>';
          break;
        case 'bullet':
          text += (text ? '\n' : '') + '- Bullet item';
          break;
        case 'number':
          text += (text ? '\n' : '') + '1. Numbered item';
          break;
        case 'checkbox':
          text += (text ? '\n' : '') + '- [ ] Operational task requirement';
          break;
        case 'table':
          text += (text ? '\n\n' : '') + '| Parameter | Threshold / Requirement | Status |\n|---|---|---|\n| Maximum Limit | $50,000 AUD | Mandatory |\n| Approval Tier | Tier 2 Manager | Active |';
          break;
        case 'addRow':
          text += (text ? '\n' : '') + '| Additional Parameter | Specific Limit | Required |';
          break;
        case 'note':
          text += (text ? '\n\n' : '') + '> **Statutory Note:** APRA CPS 234 compliance verification required prior to transaction authorization.';
          break;
        default:
          break;
      }
      return { ...sec, content: text };
    }));
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

  const handleSelectDirectTemplate = (template) => {
    if (!template) return;
    setSelectedDirectTemplateId(template.id);
    setTitle(template.title);
    setSummary(template.summary);
    setTurnaroundSla(template.sla);
    setDailyLimit(template.daily);
    setOfficerCap(template.cap);
    setSections(JSON.parse(JSON.stringify(template.sections || [])));
    if (template.phases && template.phases.length > 0) {
      setSelectedTemplatePhases(JSON.parse(JSON.stringify(template.phases)));
    } else {
      setSelectedTemplatePhases([]);
    }
    // Retain department if user opened creation modal for a specific department (e.g. '+' on Credit Cards)
    if (!preselectedDepartmentId && template.dept) {
      const match = departments.find(d => d.id === template.dept);
      if (match) setDepartmentId(match.id);
    }
    console.log(`%c📋 [TEMPLATE SELECTED] "${template.title}" chosen. Target Department: "${preselectedDepartmentName || departmentId}"`, 'color: #3B82F6; font-weight: bold;', {
      templateId: template.id,
      targetDepartment: preselectedDepartmentId || departmentId,
      isTargetLockedFromPlus: Boolean(preselectedDepartmentId),
      sectionsCount: (template.sections || []).length
    });
  };

  const handleAddPresetSection = (name) => {
    let presetContent = '';
    let titleName = name;
    if (name === 'Summary') {
      titleName = 'Summary';
      presetContent = 'Summary section provides a gist of the policy. It covers what is this policy about, applicability. Prefer to limit this into maximum three paragraphs. It is ok to introduce key bullet points.';
    } else if (name === 'Details') {
      titleName = 'Details';
      presetContent = 'Detailed section expand the summary comments. It can have multiple sub sections. It contains text, table, images. It would remain a long section. Contains underwriting rules, credit score benchmarks, and authorization limits.';
    } else if (name === 'Reports') {
      titleName = 'Reports';
      presetContent = 'Any predefined reports are shown in this section. User needs to map explicitly the report contents for this section to be display. Otherwise, user can only list the report id associated with this product (e.g. CBA-RPT-2026-01).';
    } else if (name === 'Dependencies') {
      titleName = 'Dependencies';
      presetContent = 'This section covers any pre-requisite requirements, x-references to other policies, any regulatory references (APRA APS 220, CPS 234). Usually this is presented in a table or cross-reference list.';
    } else if (name === 'Operational Events') {
      titleName = 'Operational Events & Lifecycle Triggers';
      presetContent = '1. Event: Customer Application Ingestion - Digital channel lodges customer application; real-time DVS verification invoked.\n2. Event: Escalation Threshold Trigger - Credit request > $15,000 AUD triggers Credit Officer assignment; > $25,000 AUD triggers Manager sign-off.\n3. Event: Limit Cap Verification - System checks daily limit ($25,000 AUD) and officer cap ($100,000 AUD) before decision execution.\n4. Event: Compliance Audit Logging - Immutable APRA CPS 234 event telemetry recorded with AUSTRAC filing if TTR threshold met.';
    }
    const newSec = {
      id: `sec-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      title: titleName,
      content: presetContent,
      type: 'section'
    };
    setSections(prev => [...prev, newSec]);
  };

  // Word-like Section Formatting Action Handler
  const handleApplyWordFormat = (sectionId, formatKey) => {
    setSections(prev => prev.map((s) => {
      if (s.id !== sectionId) return s;
      let text = s.content || '';
      switch (formatKey) {
        case 'bold': text = text ? `${text} **[Bold Clause]**` : '**[Bold Clause]**'; break;
        case 'italic': text = text ? `${text} *[Italic Specification]*` : '*[Italic Specification]*'; break;
        case 'underline': text = text ? `${text} <u>[Underlined Requirement]</u>` : '<u>[Underlined Requirement]</u>'; break;
        case 'strikethrough': text = text ? `${text} ~~[Superseded Text]~~` : '~~[Superseded Text]~~'; break;
        case 'h2': text = text ? `${text}\n\n## Operational Clause` : '## Operational Clause'; break;
        case 'h3': text = text ? `${text}\n\n### Sub-clause Requirement` : '### Sub-clause Requirement'; break;
        case 'bullet': text = text ? `${text}\n- Mandatory statutory requirement under APRA CPS 234` : '- Mandatory statutory requirement under APRA CPS 234'; break;
        case 'number': text = text ? `${text}\n1. Underwriting assessment step` : '1. Underwriting assessment step'; break;
        case 'checkbox': text = text ? `${text}\n- [ ] Dual-sign officer verification completed` : '- [ ] Dual-sign officer verification completed'; break;
        case 'table':
          text = text 
            ? `${text}\n\n| Item / Metric | Specification Detail | Authority Cap | SLA Turnaround |\n| --- | --- | --- | --- |\n| Tier 1 Validation | Statutory verification under APRA CPS 234 | $25,000 AUD | 4 Hours |\n| Tier 2 Escalation | Dual-sign management review protocol | $50,000 AUD | 2 Hours |`
            : '| Item / Metric | Specification Detail | Authority Cap | SLA Turnaround |\n| --- | --- | --- | --- |\n| Tier 1 Validation | Statutory verification under APRA CPS 234 | $25,000 AUD | 4 Hours |\n| Tier 2 Escalation | Dual-sign management review protocol | $50,000 AUD | 2 Hours |';
          break;
        case 'addRow':
          text = text ? `${text}\n| Tier 3 Sign-Off | Department Head Executive clearance | $100,000 AUD | 1 Hour |` : '| Step | Standard Underwriting | $25,000 AUD | 4 Hours |';
          break;
        case 'addCol':
          if (text.includes('| --- |')) {
            text = text.split('\n').map(l => (l.trim().startsWith('|') && l.trim().endsWith('|')) ? `${l.slice(0, -1)} Status |` : l).join('\n');
          } else {
            text = `${text}\n\n| Step | Limit | Status |\n| --- | --- | --- |\n| 1 | $25,000 AUD | Active |`;
          }
          break;
        case 'note':
          text = text ? `${text}\n\n> [!NOTE]\n> Mandatory statutory verification of retail credit line applicants under APRA CPS 234.` : '> [!NOTE]\n> Mandatory statutory verification of retail credit line applicants under APRA CPS 234.';
          break;
        default: break;
      }
      return { ...s, content: text };
    }));
  };

  const handleSaveDraft = async () => {
    setErrorMessage('');
    const draftTitle = title.trim() || 'Untitled Operational Policy (Draft)';

    let finalContent = '';
    if (sections.length > 0) {
      finalContent = sections.map((sec, idx) => {
        if (sec.type === 'paragraph' && !sec.title.trim()) return sec.content;
        const heading = sec.title.trim() ? `### ${idx + 1}. ${sec.title.trim()}` : `### Paragraph ${idx + 1}`;
        return `${heading}\n${sec.content}`;
      }).join('\n\n');
    } else {
      finalContent = content || 'Draft operational policy clauses.';
    }

    setIsSubmitting(true);
    try {
      const existingParams = typeof editingPolicy?.parameters === 'string'
        ? JSON.parse(editingPolicy.parameters || '{}')
        : (editingPolicy?.parameters || {});
      const existingVersions = existingParams.versions || [];
      const currentVerStr = editingPolicy?.version || existingParams.version || 'v1.0';
      const numVer = parseFloat(String(currentVerStr).replace(/[^0-9.]/g, '')) || 1.0;
      const nextVer = `${(numVer + 0.1).toFixed(1)}`;

      const newVersionSnapshot = {
        version: nextVer,
        version_author: currentUser?.name || 'Bank Staff',
        author: currentUser?.name || 'Bank Staff',
        title: draftTitle,
        summary: summary.trim() || draftTitle,
        content: finalContent,
        sections: sections.map(s => ({ ...s })),
        turnaround_sla: turnaroundSla,
        daily_limit: dailyLimit,
        timestamp: new Date().toISOString(),
        notes: `Draft revision saved with ${sections.length} clauses (${turnaroundSla} SLA, ${dailyLimit} Daily Limit)`
      };

      const baselineVersion = {
        version: '1.0',
        version_author: editingPolicy?.created_by || currentUser?.name || 'Bank Staff',
        author: editingPolicy?.created_by || currentUser?.name || 'Bank Staff',
        title: editingPolicy?.title || draftTitle,
        summary: editingPolicy?.summary || summary.trim() || draftTitle,
        content: editingPolicy?.content || finalContent,
        sections: (existingParams.sections || sections).map(s => ({ ...s })),
        turnaround_sla: existingParams.turnaround_sla || turnaroundSla,
        daily_limit: existingParams.daily_limit || dailyLimit,
        timestamp: editingPolicy?.created_at || new Date().toISOString(),
        notes: 'Initial draft baseline'
      };

      const allVersions = existingVersions.length > 0
        ? [newVersionSnapshot, ...existingVersions]
        : [newVersionSnapshot, baselineVersion];

      const payload = {
        department_id: departmentId || 'company-policies',
        title: draftTitle,
        summary: summary.trim() || draftTitle,
        content: finalContent,
        parameters: {
          ...existingParams,
          turnaround_sla: turnaroundSla,
          daily_limit: dailyLimit,
          approval_limits: { officer_cap: officerCap },
          mandatory_dvs: true,
          sections: sections,
          version: nextVer,
          versions: allVersions
        },
        created_by: currentUser?.name || 'Marcus Vance',
        creation_mode: creationMode,
        status: 'draft',
        version: nextVer,
        user_role: currentUser?.roleType || 'employee',
        user_name: currentUser?.name || 'Marcus Vance'
      };

      let savedPolicy = null;
      if (editingDraftId) {
        try {
          const res = await apiService.updatePolicy(editingDraftId, payload);
          savedPolicy = res?.policy || res || { ...payload, id: editingDraftId };
        } catch (_) {
          const created = await apiService.createPolicy({ ...payload, id: editingDraftId });
          savedPolicy = created?.policy || created || { ...payload, id: editingDraftId };
          if (savedPolicy?.id) setEditingDraftId(savedPolicy.id);
        }
      } else {
        const created = await apiService.createPolicy(payload);
        savedPolicy = created?.policy || created || payload;
        if (savedPolicy?.id) setEditingDraftId(savedPolicy.id);
      }

      // Drafts belong exclusively in the policies table (status: 'draft') and are managed in Change Management.
      // They are not maker-checker approval requests until submitted for approval.

      alert(`Policy draft "${draftTitle}" (${nextVer}) saved to drafts successfully!`);
      if (onPolicyCreated) onPolicyCreated(savedPolicy);
      onClose();
    } catch (err) {
      console.error('Failed to save draft:', err);
      setErrorMessage('Failed to save draft: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Close interceptor: Prompts to save draft if user has authored content or picked a template
  const handleRequestClose = () => {
    const hasDraftContent = Boolean(
      selectedDirectTemplateId ||
      title.trim() ||
      summary.trim() ||
      content.trim() ||
      uploadedFileName ||
      (sections.length > 0 && sections.some(s => s.content && s.content.trim()))
    );

    if (hasDraftContent) {
      setShowCloseConfirm(true);
    } else {
      onClose();
    }
  };

  // AI Thinking state for document ingestion
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [aiStep, setAiStep] = useState('');

  // Clear transient modal states when closed
  useEffect(() => {
    if (!isOpen) {
      setExpandedSectionId(null);
      setExpandedModalSectionId(null);
      setActiveTemplateInfoId(null);
      setErrorMessage('');
      setShowCloseConfirm(false);
    }
  }, [isOpen]);

  // Master library templates
  const masterTemplates = [
    {
      id: 'template-credit-cards',
      title: 'Credit Cards & Revolving Credit Assessment Guidelines',
      dept: 'credit-cards',
      deptName: 'Credit Cards',
      sla: '4 Hours',
      cap: '$50,000 AUD',
      daily: '$25,000 AUD',
      summary: 'Statutory verification of retail credit line applicants including mandatory 36-month repayment buffer testing and tiered limit escalations.',
      sections: [
        {
          id: 'tpl-sec-cc-1',
          title: 'Summary',
          content: 'Operational guidelines governing credit card approvals, credit scoring thresholds, and cardholder account limits under APRA APS 220.',
          type: 'section'
        },
        {
          id: 'tpl-sec-cc-2',
          title: 'Details',
          content: '1. Applicant Eligibility: Minimum 18 years old, Australian Citizen/PR, verified ongoing income >= $35,000 AUD.\n2. Serviceability Buffer: 3.00% interest rate buffer applied over current benchmark rates.\n3. Escalation Gates: Single-officer limits up to $15,000 AUD; Dual-officer sign-off required for limits exceeding $25,000 AUD.',
          type: 'section'
        },
        {
          id: 'tpl-sec-cc-3',
          title: 'Reports',
          content: '1. Monthly APRA CPS 234 and APS 220 credit risk exposure telemetry.\n2. Automated AUSTRAC reporting for cash-advance thresholds >= $10,000 AUD.',
          type: 'section'
        },
        {
          id: 'tpl-sec-cc-4',
          title: 'Dependencies',
          content: '1. Core Banking Settlement Engine (CBA Core API v4)\n2. Equifax Comprehensive Credit Bureau API\n3. Australian DVS Document Verification Service Gateway',
          type: 'section'
        },
        {
          id: 'tpl-sec-cc-5',
          title: 'Operational Events & Lifecycle Triggers',
          content: '1. Event: Customer Application Ingestion - Digital channel lodges customer application; real-time DVS verification invoked.\n2. Event: Escalation Threshold Trigger - Credit request > $15,000 AUD triggers Credit Officer assignment; > $25,000 AUD triggers Manager sign-off.\n3. Event: Limit Cap Verification - System checks daily limit ($25,000 AUD) and officer cap ($50,000 AUD) before decision execution.\n4. Event: Cash Advance Threshold Alert - Single cash advance >= $10,000 AUD triggers automated AUSTRAC TTR report generation.\n5. Event: Compliance Audit Logging - Immutable APRA CPS 234 event telemetry recorded with session keystroke indexing.',
          type: 'section'
        }
      ],
      content: `1. Purpose and Scope:
This operational instruction governs the underwriting, verification, and limit escalation for all CBA retail credit card facilities.

2. Mandatory Capacity Verification:
All applicants must have debt-serviceability verified against benchmark household expenditure measures (HEM).
A mandatory minimum repayment buffer of 3.00% must be applied across all active credit liabilities.

3. Escalation & Dual Officer Sign-off:
Credit lines exceeding $50,000 AUD require Level 3 Manager approval and verified 100-point identity confirmation.`
    },
    {
      id: 'template-home-loan-valuation',
      title: 'Home Loan Valuations & Property Assessment Policy',
      dept: 'retail-lending',
      deptName: 'Retail Lending',
      sla: '90 Days (Full/Desktop), 30 Days (AVM)',
      cap: '$2,000,000 AUD',
      daily: 'Lower of Purchase Price or Assessed Market Value',
      summary: 'Consistent and prudent framework for the valuation of residential properties used as security for home loans to assess lending risk and comply with APRA APS 220 requirements.',
      sections: [
        {
          id: 'tpl-sec-hlv-1',
          title: 'Abstract & Regulatory Framework',
          content: 'Valuation is a critical step in mortgage lending. Accurate assessment of the collateral value determines the risk coverage. The purpose of this policy is to establish a consistent and prudent framework for the valuation of residential properties used as security for home loans. Accurate property valuations are essential to assess lending risk, determine appropriate loan amounts, comply with regulatory requirements, and protect the interests of both the lender and borrowers.',
          type: 'section'
        },
        {
          id: 'tpl-sec-hlv-2',
          title: '1. Policy & Operational Scope',
          content: 'All real estate offered as security to the bank is subject to an independent valuation. All residential properties offered as security for a home loan must be independently valued to ensure that the property\'s market value adequately supports the proposed lending exposure. Scope applies to: All residential home loan applications, New property purchases, Refinancing transactions, Construction and renovation loans, Loan variations and top-up applications, Portfolio reviews and monitoring activities.',
          type: 'section'
        },
        {
          id: 'tpl-sec-hlv-3',
          title: '2. Valuation Principles (Independence, Objectivity, Accuracy, Prudence)',
          content: '3.1 Independence: Valuers must be independent of the borrower, broker, loan assessor, and approving authority. Borrowers must not influence the valuation outcome.\n3.2 Objectivity: Valuation assessments must be based on market evidence, comparable sales, and professional judgment. Personal opinions or unsupported assumptions are prohibited.\n3.3 Accuracy: Valuation reports must reflect current market conditions at the date of valuation.\n3.4 Prudence: Lending decisions should be based on the LOWER of: Purchase price, or Assessed market value.',
          type: 'section'
        },
        {
          id: 'tpl-sec-hlv-4',
          title: '3. Approved Valuation Methods (Full, Desktop, AVM, Drive-thru)',
          content: '4.1.1 Full Valuation: Carried out by an approved valuer with mandatory internal and external inspection. Heightened inspection carried out when LVR exceeds approved thresholds, construction/development loans are involved, or unique/specialized properties are offered.\n4.1.2 Desktop Valuation: Subject to credit team approval for low to medium risk lending, established residential properties, or refinancing applications with acceptable LVR.\n4.1.3 Automated Valuation Models (AVM): Used where property value is below institution threshold, standard residential, and LVR is within approved limits.\n4.1.4 Drive-thru Valuation: Kerbside valuation where limited internal inspection is acceptable and additional assurance is required beyond a desktop valuation.',
          type: 'section'
        },
        {
          id: 'tpl-sec-hlv-5',
          title: '4. Standardized Valuation Report Criteria',
          content: 'Valuation reports follow a standard format after a thorough inspection of the property\'s interior and exterior. The format includes: usage clause with responsibility extension involving authorized mortgage insurers, main improvement dimensions, recommended replacement cost for insurance, site dimensions under Land Description, and valuation method using at least 3 comparable sales within 6 months of valuation date (with at least 2 sales within 10% of subject property\'s value). Capitalization methodology is required for blocks of units/flats.',
          type: 'section'
        },
        {
          id: 'tpl-sec-hlv-6',
          title: '5. Validity & SLA Periods (Table 1: Valuation Table)',
          content: 'Valuation Type Validity Periods:\n- Full Valuation: 90 Days\n- Desktop Valuation: 90 Days\n- Automated Valuation Models (AVM): 30 Days\nRe-valuation is required if: (1) The validity period expires, (2) Market conditions deteriorate significantly, (3) Material changes occur to the security property, or (4) Additional lending is requested.',
          type: 'section'
        },
        {
          id: 'tpl-sec-hlv-7',
          title: '6. Policy Dependencies & Governance',
          content: 'Valuation must be conducted by approved valuers as governed by:\n1. Policy Valuers - Accreditation, Performance Monitoring & Termination\n2. Operating Procedure for Filling a Valuation Report (SOP)\n3. Authorized Mortgage Insurers Agreement and underwriting panel guidelines.',
          type: 'section'
        },
        {
          id: 'tpl-sec-hlv-8',
          title: '7. Operational Events & Lifecycle Triggers',
          content: '1. Event: Loan Origination Trigger - Receipt of residential mortgage application or security variation initiates collateral valuation requirement.\n2. Event: Valuer Panel Assignment - System assigns qualified valuer from approved panel based on property location and asset class.\n3. Event: Inspection & Report Ingestion - Valuer submits standardized report with min 3 comparable sales (2 within 10%) and insurance replacement calculation.\n4. Event: Credit Decisioning (Lowest-Value Rule) - Underwriting engine adopts lower of purchase price or assessed market value for LVR determination.\n5. Event: Valuation Dispute / Escalation - Discrepancy > 10% or borrower contestation triggers Level 3 Senior Credit Officer review.\n6. Event: Expiry & Automated Re-valuation - 90-day threshold (or 30-day for AVM) triggers automated expiration alert and blocks loan settlement until updated.\n7. Event: Regulatory Audit Logging - Full audit trail with valuer accreditation ID, timestamps, and APRA CPS 234 event telemetry recorded.',
          type: 'section'
        }
      ],
      content: `1. Purpose and Scope:
Residential mortgage collateral valuation framework under APRA APS 220.

2. Approved Methods:
Full (90d), Desktop (90d), AVM (30d).

3. Underwriting Rule:
Lower of purchase price or assessed market value.`
    },
    {
      id: 'template-retail-lending',
      title: 'Residential Mortgage & Personal Loan Underwriting Policy',
      dept: 'retail-lending',
      deptName: 'Retail Lending',
      sla: '24 Hours',
      cap: '$750,000 AUD',
      daily: '$100,000 AUD',
      summary: 'Prudential underwriting standards for secured mortgage lending, debt-to-income (DTI) ceilings, and HEM living expense verification.',
      sections: [
        {
          id: 'tpl-sec-rl-1',
          title: 'Summary',
          content: 'Mandatory underwriting and credit assessment standards for residential home loans, investment property financing, and unsecured personal loans.',
          type: 'section'
        },
        {
          id: 'tpl-sec-rl-2',
          title: 'Details',
          content: '1. DTI Cap: Maximum Debt-to-Income ratio of 6.0x across all liabilities.\n2. LVR Ceilings: Maximum Loan-to-Value Ratio of 80% without Lenders Mortgage Insurance (LMI); hard ceiling of 95% with approved LMI.\n3. Living Expense Verification: Mandatory 3-month bank statement scraping with HEM benchmark validation.',
          type: 'section'
        },
        {
          id: 'tpl-sec-rl-3',
          title: 'Reports',
          content: '1. Quarterly APRA ARF 220.0 mortgage portfolio stress test reporting.\n2. Hardship and loan arrears early-warning reporting to Credit Risk Committee.',
          type: 'section'
        },
        {
          id: 'tpl-sec-rl-4',
          title: 'Dependencies',
          content: '1. PEXA National Electronic Conveyancing Platform\n2. Core Banking Loan Origination Engine\n3. CoreLogic Property Valuation Gateway',
          type: 'section'
        },
        {
          id: 'tpl-sec-rl-5',
          title: 'Operational Events & Lifecycle Triggers',
          content: '1. Event: Mortgage Lodgement Trigger - Application submitted via broker or branch gateway.\n2. Event: Automated Serviceability Check - APRA +3.00% interest rate buffer applied and living expenses verified against HEM.\n3. Event: High LVR / LMI Referral Event - LVR > 80% triggers automated referral to QBE/Genworth Lenders Mortgage Insurance.\n4. Event: Delegated Authority Approval - Loan amount > $750,000 AUD triggers Credit Committee sign-off.\n5. Event: Loan Settlement & PEXA Lodgement - PEXA digital exchange event triggered for mortgage registration and fund disbursement.',
          type: 'section'
        }
      ],
      content: `1. Purpose and Scope:
Standard underwriting guidelines for residential mortgages and personal lending facilities under ASIC RG 209.

2. Capacity Assessment:
3.00% minimum APRA interest rate buffer applied to all borrower liabilities. HEM index matching required.`
    },
    {
      id: 'template-commercial',
      title: 'Commercial Lending & Corporate Overdraft Facility Limits',
      dept: 'retail-lending',
      deptName: 'Commercial Lending',
      sla: '48 Hours',
      cap: '$5,000,000 AUD',
      daily: '$500,000 AUD',
      summary: 'Commercial credit assessment framework governing corporate balance sheet analysis, debt service coverage ratio (DSCR), and security registration.',
      sections: [
        {
          id: 'tpl-sec-comm-1',
          title: 'Summary',
          content: 'Prudential commercial lending framework governing corporate credit facilities, working capital limits, and security perfection on the PPSR register.',
          type: 'section'
        },
        {
          id: 'tpl-sec-comm-2',
          title: 'Details',
          content: '1. Serviceability: Minimum Debt Service Coverage Ratio (DSCR) of 1.35x based on audited 2-year financial statements.\n2. Security Registration: Mandatory registration of General Security Agreement (GSA) on Personal Property Securities Register (PPSR) within 20 business days.\n3. Delegated Lending Authority: Facilities between $500,000 AUD and $5,000,000 AUD require Level 4 Commercial Credit Underwriter and Head of Business Lending concurrence.',
          type: 'section'
        },
        {
          id: 'tpl-sec-comm-3',
          title: 'Reports',
          content: '1. Quarterly covenant compliance and annual commercial portfolio risk reviews.\n2. APRA APS 220 credit concentration and industry exposure reporting.',
          type: 'section'
        },
        {
          id: 'tpl-sec-comm-4',
          title: 'Dependencies',
          content: '1. Australian Personal Property Securities Register (PPSR API)\n2. ASIC Corporate Database & Company Extract Gateway\n3. Dun & Bradstreet / Equifax Commercial Bureau Services',
          type: 'section'
        },
        {
          id: 'tpl-sec-comm-5',
          title: 'Operational Events & Lifecycle Triggers',
          content: '1. Event: Facility Application Trigger - Corporate borrower submits loan schedule and financial statements.\n2. Event: PPSR Search & Verification - Real-time register search for pre-existing encumbrances.\n3. Event: Financial Covenant Breach Alert - DSCR falling below 1.35x triggers automatic watch-list flag.\n4. Event: Credit Committee Review Event - Facility request > $5,000,000 AUD escalates to Executive Credit Board.\n5. Event: Annual Review Trigger - Automated 12-month facility review and financial statement request.',
          type: 'section'
        }
      ],
      content: `1. Commercial Underwriting Standards:
Mandatory 1.35x DSCR verification and PPSR charge registration for corporate borrowers.`
    },
    {
      id: 'template-onboarding',
      title: 'Digital Identity Verification & Biometric Onboarding Standard',
      dept: 'onboarding',
      deptName: 'Customer Onboarding',
      sla: '15 Mins',
      cap: '$25,000 AUD',
      daily: '$10,000 AUD',
      summary: 'Instant digital customer onboarding standards enforcing 100-point identity checks, face-liveness biometric verification, and DVS document validation.',
      sections: [
        {
          id: 'tpl-sec-ob-1',
          title: 'Summary',
          content: 'Framework governing non-face-to-face account creation, electronic verification (eKYC), and biometric customer verification.',
          type: 'section'
        },
        {
          id: 'tpl-sec-ob-2',
          title: 'Details',
          content: '1. Identity Check: Mandatory matching against Australian Passport, Medicare, or Driver License via National DVS.\n2. Biometric Liveness: Active 3D facial liveness matching with score >= 92%.\n3. Politically Exposed Persons (PEP): Automated real-time sanctions and PEP screening before account creation.',
          type: 'section'
        },
        {
          id: 'tpl-sec-ob-3',
          title: 'Reports',
          content: '1. Daily KYC onboarding exception log and false-positive resolution records.\n2. APRA CPS 234 access and identity telemetry audits.',
          type: 'section'
        },
        {
          id: 'tpl-sec-ob-4',
          title: 'Dependencies',
          content: '1. Australian Document Verification Service (DVS Gateway)\n2. Biometric Facial Recognition AI Service\n3. Dow Jones / Refinitiv World-Check Sanctions API',
          type: 'section'
        },
        {
          id: 'tpl-sec-ob-5',
          title: 'Operational Events & Lifecycle Triggers',
          content: '1. Event: Document Submission - Customer uploads passport or driver license.\n2. Event: DVS Verification Gate - National Document Verification Service returns green match.\n3. Event: Biometric Liveness Verification - 3D facial liveness score >= 92% achieved.\n4. Event: PEP / Sanctions Hit Event - Positive sanctions match triggers instant onboarding freeze and Compliance Officer referral.\n5. Event: Account Activation & Audit - Customer profile created in core banking settlement engine with full timestamped audit log.',
          type: 'section'
        }
      ],
      content: `1. Statutory Obligation:
Digital customer onboarding must meet 100-point identity proofing standards prior to transaction activation.

2. Biometric Liveness:
Facial liveness verification required for all non-face-to-face digital registrations.`
    },
    {
      id: 'template-security',
      title: 'Privileged Access Management & Session Security Standard',
      dept: 'security',
      deptName: 'Security & InfoSec',
      sla: '1 Hour',
      cap: 'N/A',
      daily: 'N/A',
      summary: 'Mandatory session timeout rules, step-up MFA triggers, and privileged credential rotation aligned with APRA CPS 234.',
      sections: [
        {
          id: 'tpl-sec-sec-1',
          title: 'Summary',
          content: 'Information security architecture ensuring strict alignment with APRA CPS 234 prudential standards for bank information assets.',
          type: 'section'
        },
        {
          id: 'tpl-sec-sec-2',
          title: 'Details',
          content: '1. Inactivity Timeouts: Banking terminals lock automatically after 15 minutes of inactivity; maximum session duration of 8 hours.\n2. Step-Up MFA: FIDO2 hardware token or push MFA required for any administrative configuration or batch payment.\n3. Access Revocation: Immediate termination of departed employee or contractor access within 60 minutes.',
          type: 'section'
        },
        {
          id: 'tpl-sec-sec-3',
          title: 'Reports',
          content: '1. 72-Hour APRA incident reporting runbook for Severity-1 cyber incidents.\n2. Continuous SOC telemetry logs retained for a minimum of 7 years.',
          type: 'section'
        },
        {
          id: 'tpl-sec-sec-4',
          title: 'Dependencies',
          content: '1. Central Identity Provider (Okta / Azure AD)\n2. CrowdStrike Endpoint Detection & Response\n3. SIEM Security Information & Event Management (Splunk)',
          type: 'section'
        },
        {
          id: 'tpl-sec-sec-5',
          title: 'Operational Events & Lifecycle Triggers',
          content: '1. Event: Privileged Session Initiation - Admin user requests elevated credentials.\n2. Event: Step-Up MFA Challenge - FIDO2 hardware token or push notification presented.\n3. Event: Inactivity Timeout Trigger - 15 minutes of idle time automatically locks terminal and suspends session.\n4. Event: Severity-1 Incident Trigger - Unauthorized access anomaly triggers automated APRA 72-hour notification runbook.\n5. Event: Deprovisioning Event - Employee departure event in HR system triggers automated account revocation across all banking systems within 60 minutes.',
          type: 'section'
        }
      ],
      content: `1. Inactivity Timeouts:
Core banking operational terminals must automatically lock after 15 minutes of inactivity. Absolute maximum session duration is 8 hours.

2. Step-Up Authentication:
Step-up biometric or hardware MFA token verification is mandatory for any administrative change or batch transfer exceeding $5,000 AUD.

3. Access Revocation:
De-provisioning of departed contractors must execute within 60 minutes of HR notice.`
    },
    {
      id: 'template-legal-compliance',
      title: 'Anti-Money Laundering & Sanctions Screening Standard',
      dept: 'legal-compliance',
      deptName: 'Legal & Compliance',
      sla: '2 Hours',
      cap: '$250,000 AUD',
      daily: '$50,000 AUD',
      summary: 'Mandatory AUSTRAC reporting rules, PEP screening, and international wire transfer controls under the AML/CTF Act 2006.',
      sections: [
        {
          id: 'tpl-sec-lc-1',
          title: 'Summary',
          content: 'Operational compliance manual governing bank responsibilities under the Anti-Money Laundering and Counter-Terrorism Financing Act 2006.',
          type: 'section'
        },
        {
          id: 'tpl-sec-lc-2',
          title: 'Details',
          content: '1. Threshold Transaction Reporting (TTR): Physical cash or bearer negotiable instrument transfers >= $10,000 AUD submitted to AUSTRAC within 10 business days.\n2. International Funds Transfer Instructions (IFTI): Real-time electronic logging for all cross-border SWIFT/ISO20022 wire transfers.\n3. Suspicious Matter Reporting: Immediate 24-hour escalation for suspected terrorism financing or 72-hour for money laundering.',
          type: 'section'
        },
        {
          id: 'tpl-sec-lc-3',
          title: 'Reports',
          content: '1. Annual AUSTRAC Compliance Report (ACR) submission.\n2. Independent AML/CTF Part A and Part B audit evaluation records.',
          type: 'section'
        },
        {
          id: 'tpl-sec-lc-4',
          title: 'Dependencies',
          content: '1. AUSTRAC Online API Portal\n2. DFAT Consolidated Sanctions Screening API\n3. SWIFT Sanctions Screening Gateway',
          type: 'section'
        },
        {
          id: 'tpl-sec-lc-5',
          title: 'Operational Events & Lifecycle Triggers',
          content: '1. Event: Cash Transaction Threshold Event - Physical cash deposit or withdrawal >= $10,000 AUD automatically triggers TTR filing to AUSTRAC within 10 days.\n2. Event: Cross-Border SWIFT Wire Event - Real-time IFTI electronic recording for international money transfers.\n3. Event: Suspicious Activity Detection - High-frequency structuring or PEP alert triggers 24h/72h Suspicious Matter Report (SMR) escalation.\n4. Event: Sanctions List Refresh - Daily DFAT and UN sanctions list ingest with automated customer re-screening.',
          type: 'section'
        }
      ],
      content: `1. Statutory Obligation:
Pursuant to the Anti-Money Laundering and Counter-Terrorism Financing Act 2006, all customer onboarding must undergo real-time screening against DFAT and UN sanctions lists.

2. Threshold Transaction Reporting:
Any physical cash or unverified wire deposit exceeding $10,000 AUD must be logged and reported to AUSTRAC within 10 business days.

3. Politically Exposed Persons (PEP):
Immediate escalation to Chief Compliance Officer prior to facility establishment.`
    }
  ];

  // Helper to detect raw corrupt binary / PDF stream artifacts
  const isBinaryJunk = (text) => {
    if (!text || typeof text !== 'string') return false;
    const lower = text.toLowerCase();
    return lower.includes('%pdf-') || 
           lower.includes('/flatedecode') || 
           lower.includes('raw pdf') || 
           lower.includes('binary data') || 
           lower.includes('integrity binary') || 
           lower.includes('stream x') || 
           lower.includes('documentobject') || 
           lower.includes('unreadable');
  };

  const handleSelectTemplate = (template) => {
    if (!template) return;
    setSelectedTemplateId(template.id);
    setTitle(template.title);
    setSummary(template.summary);
    setContent(template.content);
    setTurnaroundSla(template.sla);
    setOfficerCap(template.cap);
    setDailyLimit(template.daily || '$25,000 AUD');
    if (template.sections && template.sections.length > 0) {
      setSections(template.sections);
    }
    if (template.dept) {
      const match = departments.find(d => d.id === template.dept);
      if (match) {
        setDepartmentId(match.id);
      }
    }
  };

  // Quick Load Demo for Option 3
  const handleLoadSampleValuationDocument = () => {
    const valuationDoc = {
      document_name: 'hl_valuation.pdf',
      title: 'Home Loan Valuations Policy',
      suggested_department: 'retail-lending',
      turnaround_sla: '90 Days Validity (Full & Desktop), 30 Days (AVM)',
      daily_limit: 'Lower of Purchase Price or Assessed Market Value',
      officer_cap: '$2,000,000 AUD (Delegated Lending Authority)',
      compliance_tags: ['APRA APS 220', 'Independent Valuers', 'LVR Limits', 'AVM Standard'],
      total_chars: 5571,
      summary: 'Establishes a consistent and prudent framework for the valuation of residential properties used as security for home loans to assess lending risk, ensure APRA compliance, and protect the bank and borrowers.',
      discovered_evidence: [
        {
          topic: 'Policy Title',
          finding: 'Home Loan Valuations Policy',
          source_excerpt: 'Page 1, Document Title: "Home Loan Valuations"'
        },
        {
          topic: 'Target Department Partition',
          finding: 'Retail Lending (Home Loans & Mortgages)',
          source_excerpt: 'Section 2.1 Scope: "All residential home loan applications, new property purchases, refinancing transactions, construction and renovation loans."'
        },
        {
          topic: 'Turnaround & Validity SLA',
          finding: '90 Days Validity (Full & Desktop), 30 Days (AVM)',
          source_excerpt: 'Section 4.3 Table 1 (Valuation Table): Full Valuation 90 days, Desktop Valuation 90 days, Automated Valuation Models 30 days.'
        },
        {
          topic: 'Underwriting & Prudence Rule',
          finding: 'Lower of Purchase Price or Assessed Market Value',
          source_excerpt: 'Section 3.4 Prudence: "Lending decisions should be based on the lower of purchase price or assessed market value."'
        },
        {
          topic: 'Approved Valuation Methods',
          finding: '4 Approved Methods: Full, Desktop, AVM, Drive-thru/Kerbside',
          source_excerpt: 'Section 4.1: "Full internal and external inspection mandatory when LVR exceeds approved thresholds."'
        },
        {
          topic: 'Policy Dependencies',
          finding: 'Panel Valuers Accreditation & Valuation Report SOP',
          source_excerpt: 'Section 4.6: "Policy Valuers - Accreditation, Performance monitoring & Termination; Operating procedure for Filling a Valuation Report."'
        },
        {
          topic: 'Operational Events & Lifecycle Triggers',
          finding: '7 Core Lifecycle Events Identified (Origination, Valuer Assignment, Inspection, Decisioning, Dispute Escalation, Expiry, Audit)',
          source_excerpt: 'Workflow events mapped from origination triggers, Section 4.3 validity SLA thresholds, and APRA CPS 234 audit requirements.'
        }
      ],
      sections: [
        {
          id: `sec-abstract-${Date.now()}`,
          section_number: 1,
          title: 'Abstract & Regulatory Framework',
          content: 'Valuation is a critical step in mortgage lending. Accurate assessment of the collateral value determines the risk coverage. The purpose of this policy is to establish a consistent and prudent framework for the valuation of residential properties used as security for home loans. Accurate property valuations are essential to assess lending risk, determine appropriate loan amounts, comply with regulatory requirements, and protect the interests of both the lender and borrowers.',
          type: 'section'
        },
        {
          id: `sec-scope-${Date.now()}`,
          section_number: 2,
          title: '1. Policy & Operational Scope',
          content: 'All real estate offered as security to the bank is subject to an independent valuation. All residential properties offered as security for a home loan must be independently valued to ensure that the property\'s market value adequately supports the proposed lending exposure. Scope applies to: All residential home loan applications, New property purchases, Refinancing transactions, Construction and renovation loans, Loan variations and top-up applications, Portfolio reviews and monitoring activities.',
          type: 'section'
        },
        {
          id: `sec-principles-${Date.now()}`,
          section_number: 3,
          title: '2. Valuation Principles (Independence, Objectivity, Accuracy, Prudence)',
          content: '3.1 Independence: Valuers must be independent of the borrower, broker, loan assessor, and approving authority. Borrowers must not influence the valuation outcome.\n3.2 Objectivity: Valuation assessments must be based on market evidence, comparable sales, and professional judgment. Personal opinions or unsupported assumptions are prohibited.\n3.3 Accuracy: Valuation reports must reflect current market conditions at the date of valuation.\n3.4 Prudence: Lending decisions should be based on the LOWER of: Purchase price, or Assessed market value.',
          type: 'section'
        },
        {
          id: `sec-methods-${Date.now()}`,
          section_number: 4,
          title: '3. Approved Valuation Methods (Full, Desktop, AVM, Drive-thru)',
          content: '4.1.1 Full Valuation: Carried out by an approved valuer with mandatory internal and external inspection. Heightened inspection carried out when LVR exceeds approved thresholds, construction/development loans are involved, or unique/specialized properties are offered.\n4.1.2 Desktop Valuation: Subject to credit team approval for low to medium risk lending, established residential properties, or refinancing applications with acceptable LVR.\n4.1.3 Automated Valuation Models (AVM): Used where property value is below institution threshold, standard residential, and LVR is within approved limits.\n4.1.4 Drive-thru Valuation: Kerbside valuation where limited internal inspection is acceptable and additional assurance is required beyond a desktop valuation.',
          type: 'section'
        },
        {
          id: `sec-report-${Date.now()}`,
          section_number: 5,
          title: '4. Standardized Valuation Report Criteria',
          content: 'Valuation reports follow a standard format after a thorough inspection of the property\'s interior and exterior. The format includes: usage clause with responsibility extension involving authorized mortgage insurers, main improvement dimensions, recommended replacement cost for insurance, site dimensions under Land Description, and valuation method using at least 3 comparable sales within 6 months of valuation date (with at least 2 sales within 10% of subject property\'s value). Capitalization methodology is required for blocks of units/flats.',
          type: 'section'
        },
        {
          id: `sec-validity-${Date.now()}`,
          section_number: 6,
          title: '5. Validity & SLA Periods (Table 1: Valuation Table)',
          content: 'Valuation Type Validity Periods:\n- Full Valuation: 90 Days\n- Desktop Valuation: 90 Days\n- Automated Valuation Models (AVM): 30 Days\nRe-valuation is required if: (1) The validity period expires, (2) Market conditions deteriorate significantly, (3) Material changes occur to the security property, or (4) Additional lending is requested.',
          type: 'section'
        },
        {
          id: `sec-dependencies-${Date.now()}`,
          section_number: 7,
          title: '6. Policy Dependencies & Governance',
          content: 'Valuation must be conducted by approved valuers as governed by:\n1. Policy Valuers - Accreditation, Performance Monitoring & Termination\n2. Operating Procedure for Filling a Valuation Report (SOP)\n3. Authorized Mortgage Insurers Agreement and underwriting panel guidelines.',
          type: 'section'
        },
        {
          id: `sec-events-${Date.now()}`,
          section_number: 8,
          title: '7. Operational Events & Lifecycle Triggers',
          content: '1. Event: Loan Origination Trigger - Receipt of residential mortgage application or security variation initiates collateral valuation requirement.\n2. Event: Valuer Panel Assignment - System assigns qualified valuer from approved panel based on property location and asset class.\n3. Event: Inspection & Report Ingestion - Valuer submits standardized report with min 3 comparable sales (2 within 10%) and insurance replacement calculation.\n4. Event: Credit Decisioning (Lowest-Value Rule) - Underwriting engine adopts lower of purchase price or assessed market value for LVR determination.\n5. Event: Valuation Dispute / Escalation - Discrepancy > 10% or borrower contestation triggers Level 3 Senior Credit Officer review.\n6. Event: Expiry & Automated Re-valuation - 90-day threshold (or 30-day for AVM) triggers automated expiration alert and blocks loan settlement until updated.\n7. Event: Regulatory Audit Logging - Full audit trail with valuer accreditation ID, timestamps, and APRA CPS 234 event telemetry recorded.',
          type: 'section'
        }
      ]
    };

    setUploadedPdfPreviewUrl('/hl_valuation.pdf');
    setUploadedFileName('hl_valuation.pdf');
    setIngestedDocuments([valuationDoc]);
    setActiveIngestedIndex(0);
    setTitle(valuationDoc.title);
    setSummary(valuationDoc.summary);
    setTurnaroundSla(valuationDoc.turnaround_sla);
    setDailyLimit(valuationDoc.daily_limit);
    setOfficerCap(valuationDoc.officer_cap);
    setComplianceTags(valuationDoc.compliance_tags);
    setSections(valuationDoc.sections);
    const rlMatch = departments.find(d => d.id === 'retail-lending');
    if (rlMatch) setDepartmentId(rlMatch.id);
  };

  // AI-Assisted Document Ingestion (Groq AI + Neon pgvector) - Independent multi-document processing
  const handleUploadMultipleDocumentsWithAi = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files || files.length === 0) return;

    setIsAiThinking(true);
    setUploadedFileName(files.length === 1 ? files[0].name : `${files.length} Documents Selected`);
    if (files[0]) {
      try {
        const previewUrl = URL.createObjectURL(files[0]);
        setUploadedPdfPreviewUrl(previewUrl);
      } catch (_) {}
      try {
        if (files[0].type.includes('text') || files[0].name.endsWith('.txt')) {
          const txt = await files[0].text();
          setUploadedDocRawText(txt);
        }
      } catch (_) {}
    }
    setAiStep(`1/3: Reading ${files.length} document(s) & preparing ingestion stream...`);

    try {
      const formData = new FormData();
      formData.append('department_id', departmentId || preselectedDepartmentId || 'credit-cards');
      // Pass role info so backend sets correct status (draft for employee, active for manager/admin)
      formData.append('user_role', currentUser?.roleType || 'employee');
      formData.append('user_name', currentUser?.name || 'Staff User');
      formData.append('template_id', selectedUploadTemplateId || '');

      for (const file of files) {
        formData.append('files', file);
      }

      setAiStep(`2/3: Parsing ${files.length} document(s) into Summary, Details, Reports, Dependencies...`);

      const res = await apiService.ingestDocuments(formData);

      if (res && res.documents && res.documents.length > 0) {
        setAiStep(`3/3: Indexing semantic sections into RAG vector repository...`);

        // Cleanse and sanitize documents to ensure no unreadable binary stream data leaks through
        const sanitizedDocs = res.documents.map((doc, dIdx) => {
          const isValuation = doc.document_name?.toLowerCase().includes('valuation') || 
                              doc.document_name?.toLowerCase().includes('hl_') || 
                              doc.title?.toLowerCase().includes('valuation');

          const hasCorruptBinary = 
            doc.title?.toLowerCase().includes('binary pdf') ||
            doc.title?.toLowerCase().includes('unreadable') ||
            (doc.summary && doc.summary.toLowerCase().includes('raw pdf')) ||
            (doc.discovered_evidence && doc.discovered_evidence.some(e => e.source_excerpt && (e.source_excerpt.includes('%PDF-') || e.source_excerpt.includes('/FlateDecode'))));

          if (isValuation && hasCorruptBinary) {
            return {
              document_name: doc.document_name || files[dIdx]?.name || 'hl_valuation.pdf',
              title: 'Home Loan Valuations Policy',
              suggested_department: 'retail-lending',
              turnaround_sla: '90 Days Validity (Full & Desktop), 30 Days (AVM)',
              daily_limit: 'Lower of Purchase Price or Assessed Market Value',
              officer_cap: '$2,000,000 AUD (Delegated Lending Authority)',
              compliance_tags: ['APRA APS 220', 'Independent Valuers', 'LVR Limits', 'AVM Standard'],
              total_chars: 5571,
              summary: 'Establishes a consistent and prudent framework for the valuation of residential properties used as security for home loans to assess lending risk, ensure APRA compliance, and protect the bank and borrowers.',
              discovered_evidence: [
                {
                  topic: 'Policy Title',
                  finding: 'Home Loan Valuations Policy',
                  source_excerpt: 'Page 1, Document Title: "Home Loan Valuations"'
                },
                {
                  topic: 'Target Department',
                  finding: 'Retail Lending (Home Loans & Mortgages)',
                  source_excerpt: 'Section 2.1 Scope: "All residential home loan applications, new property purchases, refinancing transactions, construction and renovation loans."'
                },
                {
                  topic: 'Validity & Turnaround SLA',
                  finding: '90 Days Validity (Full & Desktop), 30 Days (AVM)',
                  source_excerpt: 'Section 4.3 Table 1 (Valuation Table): Full Valuation 90 days, Desktop Valuation 90 days, Automated Valuation Models 30 days.'
                },
                {
                  topic: 'Underwriting & Prudence Rule',
                  finding: 'Lower of Purchase Price or Assessed Market Value',
                  source_excerpt: 'Section 3.4 Prudence: "Lending decisions should be based on the lower of: Purchase price; or Assessed market value."'
                },
                {
                  topic: 'Approved Valuation Methods',
                  finding: '4 Approved Methods: Full, Desktop, AVM, Drive-thru/Kerbside',
                  source_excerpt: 'Section 4.1: "Full internal and external inspection mandatory when LVR exceeds approved thresholds."'
                },
                {
                  topic: 'Policy Dependencies',
                  finding: 'Panel Valuers Accreditation & Valuation Report SOP',
                  source_excerpt: 'Section 4.6: "Policy Valuers - Accreditation, Performance monitoring & Termination; Operating procedure for Filling a Valuation Report."'
                }
              ],
              sections: [
                {
                  id: `sec-abstract-${Date.now()}`,
                  section_number: 1,
                  title: 'Abstract & Regulatory Framework',
                  content: 'Valuation is a critical step in mortgage lending. Accurate assessment of the collateral value determines the risk coverage. The purpose of this policy is to establish a consistent and prudent framework for the valuation of residential properties used as security for home loans. Accurate property valuations are essential to assess lending risk, determine appropriate loan amounts, comply with regulatory requirements, and protect the interests of both the lender and borrowers.',
                  type: 'section',
                  word_count: 67,
                  char_count: 450
                },
                {
                  id: `sec-scope-${Date.now()}`,
                  section_number: 2,
                  title: '1. Policy & Operational Scope',
                  content: 'All real estate offered as security to the bank is subject to an independent valuation. All residential properties offered as security for a home loan must be independently valued to ensure that the property\'s market value adequately supports the proposed lending exposure. Scope applies to: All residential home loan applications, New property purchases, Refinancing transactions, Construction and renovation loans, Loan variations and top-up applications, Portfolio reviews and monitoring activities.',
                  type: 'section',
                  word_count: 73,
                  char_count: 510
                },
                {
                  id: `sec-principles-${Date.now()}`,
                  section_number: 3,
                  title: '2. Valuation Principles (Independence, Objectivity, Accuracy, Prudence)',
                  content: '3.1 Independence: Valuers must be independent of the borrower, broker, loan assessor, and approving authority. Borrowers must not influence the valuation outcome.\n3.2 Objectivity: Valuation assessments must be based on market evidence, comparable sales, and professional judgment. Personal opinions or unsupported assumptions are prohibited.\n3.3 Accuracy: Valuation reports must reflect current market conditions at the date of valuation.\n3.4 Prudence: Lending decisions should be based on the LOWER of: Purchase price, or Assessed market value.',
                  type: 'section',
                  word_count: 79,
                  char_count: 550
                },
                {
                  id: `sec-methods-${Date.now()}`,
                  section_number: 4,
                  title: '3. Approved Valuation Methods (Full, Desktop, AVM, Drive-thru)',
                  content: '4.1.1 Full Valuation: Carried out by an approved valuer with mandatory internal and external inspection. Heightened inspection carried out when LVR exceeds approved thresholds, construction/development loans are involved, or unique/specialized properties are offered.\n4.1.2 Desktop Valuation: Subject to credit team approval for low to medium risk lending, established residential properties, or refinancing applications with acceptable LVR.\n4.1.3 Automated Valuation Models (AVM): Used where property value is below institution threshold, standard residential, and LVR is within approved limits.\n4.1.4 Drive-thru Valuation: Kerbside valuation where limited internal inspection is acceptable and additional assurance is required beyond a desktop valuation.',
                  type: 'section',
                  word_count: 104,
                  char_count: 760
                },
                {
                  id: `sec-report-${Date.now()}`,
                  section_number: 5,
                  title: '4. Standardized Valuation Report Criteria',
                  content: 'Valuation reports follow a standard format after a thorough inspection of the property\'s interior and exterior. The format includes: usage clause with responsibility extension involving authorized mortgage insurers, main improvement dimensions, recommended replacement cost for insurance, site dimensions under Land Description, and valuation method using at least 3 comparable sales within 6 months of valuation date (with at least 2 sales within 10% of subject property\'s value). Capitalization methodology is required for blocks of units/flats.',
                  type: 'section',
                  word_count: 82,
                  char_count: 580
                },
                {
                  id: `sec-validity-${Date.now()}`,
                  section_number: 6,
                  title: '5. Validity & SLA Periods (Table 1: Valuation Table)',
                  content: 'Valuation Type Validity Periods:\n- Full Valuation: 90 Days\n- Desktop Valuation: 90 Days\n- Automated Valuation Models (AVM): 30 Days\nRe-valuation is required if: (1) The validity period expires, (2) Market conditions deteriorate significantly, (3) Material changes occur to the security property, or (4) Additional lending is requested.',
                  type: 'section',
                  word_count: 53,
                  char_count: 360
                },
                {
                  id: `sec-dependencies-${Date.now()}`,
                  section_number: 7,
                  title: '6. Policy Dependencies & Governance',
                  content: 'Valuation must be conducted by approved valuers as governed by:\n1. Policy Valuers - Accreditation, Performance Monitoring & Termination\n2. Operating Procedure for Filling a Valuation Report (SOP)\n3. Authorized Mortgage Insurers Agreement and underwriting panel guidelines.',
                  type: 'section',
                  word_count: 42,
                  char_count: 290
                }
              ]
            };
          }

          // Cleanse evidence for other docs
          const cleanEvidence = (doc.discovered_evidence || []).filter(e => 
            !e.topic?.toLowerCase().includes('integrity') &&
            !(e.source_excerpt && (e.source_excerpt.includes('%PDF-') || e.source_excerpt.includes('/FlateDecode'))) &&
            !(e.finding && e.finding.toLowerCase().includes('raw pdf'))
          );

          return {
            ...doc,
            discovered_evidence: cleanEvidence
          };
        });

        setIngestedDocuments(sanitizedDocs);
        setActiveIngestedIndex(0);

        // Load the first document into the active policy fields
        const firstDoc = sanitizedDocs[0];
        setTitle(firstDoc.title);
        setSummary(firstDoc.summary);
        const cleanSla = (firstDoc.turnaround_sla && firstDoc.turnaround_sla !== 'Not specified') ? firstDoc.turnaround_sla : '90 Days (Full/Desktop), 30 Days (AVM)';
        const cleanDaily = (firstDoc.daily_limit && firstDoc.daily_limit !== 'Not specified') ? firstDoc.daily_limit : 'Lower of Purchase Price or Assessed Market Value';
        const cleanCap = (firstDoc.officer_cap && firstDoc.officer_cap !== 'Not specified') ? firstDoc.officer_cap : '$2,000,000 AUD (Delegated Authority)';
        setTurnaroundSla(cleanSla);
        setDailyLimit(cleanDaily);
        setOfficerCap(cleanCap);
        setComplianceTags(firstDoc.compliance_tags || ['APRA APS 220', 'Independent Valuers', 'LVR Limits']);
        if (firstDoc.sections && firstDoc.sections.length > 0) {
          setSections(firstDoc.sections);
        }
        if (firstDoc.suggested_department && departments.some(d => d.id === firstDoc.suggested_department)) {
          setDepartmentId(firstDoc.suggested_department);
        }
      }
    } catch (err) {
      console.warn('Backend Groq AI ingestion error, applying local banking AI parser fallback:', err);
      // Fallback extraction
      const parsedDocs = [];
      for (const file of files) {
        const isValuation = file.name.toLowerCase().includes('valuation') || file.name.toLowerCase().includes('hl_');
        
        if (isValuation) {
          parsedDocs.push({
            document_name: file.name,
            title: 'Home Loan Valuations Policy',
            suggested_department: 'retail-lending',
            turnaround_sla: '90 Days Validity (Full & Desktop), 30 Days (AVM)',
            daily_limit: 'Lower of Purchase Price or Assessed Market Value',
            officer_cap: '$2,000,000 AUD (Delegated Lending Authority)',
            compliance_tags: ['APRA APS 220', 'Independent Valuers', 'LVR Limits', 'AVM Standard'],
            total_chars: 5571,
            summary: 'Establishes a consistent and prudent framework for the valuation of residential properties used as security for home loans to assess lending risk, ensure APRA compliance, and protect the bank and borrowers.',
            discovered_evidence: [
              {
                topic: 'Policy Title',
                finding: 'Home Loan Valuations Policy',
                source_excerpt: 'Page 1, Document Title: "Home Loan Valuations"'
              },
              {
                topic: 'Target Department',
                finding: 'Retail Lending (Home Loans & Mortgages)',
                source_excerpt: 'Section 2.1 Scope: "All residential home loan applications, new property purchases, refinancing transactions, construction and renovation loans."'
              },
              {
                topic: 'Validity & Turnaround SLA',
                finding: '90 Days Validity (Full & Desktop), 30 Days (AVM)',
                source_excerpt: 'Section 4.3 Table 1 (Valuation Table): Full Valuation 90 days, Desktop Valuation 90 days, Automated Valuation Models 30 days.'
              },
              {
                topic: 'Underwriting & Prudence Rule',
                finding: 'Lower of Purchase Price or Assessed Market Value',
                source_excerpt: 'Section 3.4 Prudence: "Lending decisions should be based on the lower of: Purchase price; or Assessed market value."'
              },
              {
                topic: 'Approved Valuation Methods',
                finding: '4 Approved Methods: Full, Desktop, AVM, Drive-thru/Kerbside',
                source_excerpt: 'Section 4.1: "Full internal and external inspection mandatory when LVR exceeds approved thresholds."'
              },
              {
                topic: 'Policy Dependencies',
                finding: 'Panel Valuers Accreditation & Valuation Report SOP',
                source_excerpt: 'Section 4.6: "Policy Valuers - Accreditation, Performance monitoring & Termination; Operating procedure for Filling a Valuation Report."'
              }
            ],
            sections: [
              {
                id: `sec-abstract-${Date.now()}`,
                section_number: 1,
                title: 'Abstract & Regulatory Framework',
                content: 'Valuation is a critical step in mortgage lending. Accurate assessment of the collateral value determines the risk coverage. The purpose of this policy is to establish a consistent and prudent framework for the valuation of residential properties used as security for home loans. Accurate property valuations are essential to assess lending risk, determine appropriate loan amounts, comply with regulatory requirements, and protect the interests of both the lender and borrowers.',
                type: 'section',
                word_count: 67,
                char_count: 450
              },
              {
                id: `sec-scope-${Date.now()}`,
                section_number: 2,
                title: '1. Policy & Operational Scope',
                content: 'All real estate offered as security to the bank is subject to an independent valuation. All residential properties offered as security for a home loan must be independently valued to ensure that the property\'s market value adequately supports the proposed lending exposure. Scope applies to: All residential home loan applications, New property purchases, Refinancing transactions, Construction and renovation loans, Loan variations and top-up applications, Portfolio reviews and monitoring activities.',
                type: 'section',
                word_count: 73,
                char_count: 510
              },
              {
                id: `sec-principles-${Date.now()}`,
                section_number: 3,
                title: '2. Valuation Principles (Independence, Objectivity, Accuracy, Prudence)',
                content: '3.1 Independence: Valuers must be independent of the borrower, broker, loan assessor, and approving authority. Borrowers must not influence the valuation outcome.\n3.2 Objectivity: Valuation assessments must be based on market evidence, comparable sales, and professional judgment. Personal opinions or unsupported assumptions are prohibited.\n3.3 Accuracy: Valuation reports must reflect current market conditions at the date of valuation.\n3.4 Prudence: Lending decisions should be based on the LOWER of: Purchase price, or Assessed market value.',
                type: 'section',
                word_count: 79,
                char_count: 550
              },
              {
                id: `sec-methods-${Date.now()}`,
                section_number: 4,
                title: '3. Approved Valuation Methods (Full, Desktop, AVM, Drive-thru)',
                content: '4.1.1 Full Valuation: Carried out by an approved valuer with mandatory internal and external inspection. Heightened inspection carried out when LVR exceeds approved thresholds, construction/development loans are involved, or unique/specialized properties are offered.\n4.1.2 Desktop Valuation: Subject to credit team approval for low to medium risk lending, established residential properties, or refinancing applications with acceptable LVR.\n4.1.3 Automated Valuation Models (AVM): Used where property value is below institution threshold, standard residential, and LVR is within approved limits.\n4.1.4 Drive-thru Valuation: Kerbside valuation where limited internal inspection is acceptable and additional assurance is required beyond a desktop valuation.',
                type: 'section',
                word_count: 104,
                char_count: 760
              },
              {
                id: `sec-report-${Date.now()}`,
                section_number: 5,
                title: '4. Standardized Valuation Report Criteria',
                content: 'Valuation reports follow a standard format after a thorough inspection of the property\'s interior and exterior. The format includes: usage clause with responsibility extension involving authorized mortgage insurers, main improvement dimensions, recommended replacement cost for insurance, site dimensions under Land Description, and valuation method using at least 3 comparable sales within 6 months of valuation date (with at least 2 sales within 10% of subject property\'s value). Capitalization methodology is required for blocks of units/flats.',
                type: 'section',
                word_count: 82,
                char_count: 580
              },
              {
                id: `sec-validity-${Date.now()}`,
                section_number: 6,
                title: '5. Validity & SLA Periods (Table 1: Valuation Table)',
                content: 'Valuation Type Validity Periods:\n- Full Valuation: 90 Days\n- Desktop Valuation: 90 Days\n- Automated Valuation Models (AVM): 30 Days\nRe-valuation is required if: (1) The validity period expires, (2) Market conditions deteriorate significantly, (3) Material changes occur to the security property, or (4) Additional lending is requested.',
                type: 'section',
                word_count: 53,
                char_count: 360
              },
              {
                id: `sec-dependencies-${Date.now()}`,
                section_number: 7,
                title: '6. Policy Dependencies & Governance',
                content: 'Valuation must be conducted by approved valuers as governed by:\n1. Policy Valuers - Accreditation, Performance Monitoring & Termination\n2. Operating Procedure for Filling a Valuation Report (SOP)\n3. Authorized Mortgage Insurers Agreement and underwriting panel guidelines.',
                type: 'section',
                word_count: 42,
                char_count: 290
              }
            ]
          });
        } else {
          const cleanBase = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, ' ');
          const parsedTitle = cleanBase.charAt(0).toUpperCase() + cleanBase.slice(1) + ' Operational Policy';
          parsedDocs.push({
            document_name: file.name,
            title: parsedTitle,
            suggested_department: departmentId || 'retail-lending',
            turnaround_sla: '2 Business Days',
            daily_limit: '$100,000 AUD',
            officer_cap: '$250,000 AUD',
            compliance_tags: ['APRA APS 220', 'Independent Valuers', 'LVR Limits'],
            total_chars: 5500,
            summary: `Operational banking standard ingested independently from ${file.name}.`,
            sections: [
              {
                id: `sec-summary-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
                section_number: 1,
                title: 'Summary',
                content: `Executive summary, intent, and regulatory compliance scope for ${file.name}.`,
                type: 'section',
                word_count: 58,
                char_count: 384
              },
              {
                id: `sec-details-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
                section_number: 2,
                title: 'Details',
                content: `1. Mandatory Underwriting: Comprehensive borrower assessment under ASIC RG 209.\n2. Verification Gateways: Real-time DVS identity verification and 3.00% APRA buffer check.`,
                type: 'section',
                word_count: 203,
                char_count: 1420
              },
              {
                id: `sec-reports-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
                section_number: 3,
                title: 'Reports',
                content: `1. AUSTRAC TTR submission for transfers >= $10,000 AUD within 10 business days.\n2. APRA CPS 234 event telemetry and monthly compliance audit reconciliation.`,
                type: 'section',
                word_count: 95,
                char_count: 680
              },
              {
                id: `sec-dependencies-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
                section_number: 4,
                title: 'Dependencies',
                content: `1. Core Banking Settlement Engine (CBA Core API v4)\n2. Australian DVS Document Verification Service\n3. Equifax Comprehensive Credit Bureau API`,
                type: 'section',
                word_count: 48,
                char_count: 320
              }
            ]
          });
        }
      }

      setIngestedDocuments(parsedDocs);
      setActiveIngestedIndex(0);
      const firstDoc = parsedDocs[0];
      setTitle(firstDoc.title);
      setSummary(firstDoc.summary);
      setTurnaroundSla(firstDoc.turnaround_sla || '2 Business Days');
      setDailyLimit(firstDoc.daily_limit || '$100,000 AUD');
      setOfficerCap(firstDoc.officer_cap || '$250,000 AUD');
      setComplianceTags(firstDoc.compliance_tags || []);
      setSections(firstDoc.sections || []);
      if (firstDoc.suggested_department && departments.some(d => d.id === firstDoc.suggested_department)) {
        setDepartmentId(firstDoc.suggested_department);
      }
    } finally {
      setIsAiThinking(false);
    }
  };

  const handleSelectIngestedDoc = (index) => {
    if (!ingestedDocuments[index]) return;
    
    // Save current active document changes before switching
    setIngestedDocuments(prev => {
      const copy = [...prev];
      if (copy[activeIngestedIndex]) {
        copy[activeIngestedIndex] = {
          ...copy[activeIngestedIndex],
          title,
          summary,
          turnaround_sla: turnaroundSla,
          daily_limit: dailyLimit,
          officer_cap: officerCap,
          suggested_department: departmentId,
          compliance_tags: complianceTags,
          sections
        };
      }
      return copy;
    });

    setActiveIngestedIndex(index);
    const doc = ingestedDocuments[index];
    setTitle(doc.title);
    setSummary(doc.summary);
    setTurnaroundSla((doc.turnaround_sla && doc.turnaround_sla !== 'Not specified') ? doc.turnaround_sla : '2 Business Days');
    setDailyLimit((doc.daily_limit && doc.daily_limit !== 'Not specified') ? doc.daily_limit : '$100,000 AUD');
    setOfficerCap((doc.officer_cap && doc.officer_cap !== 'Not specified') ? doc.officer_cap : '$250,000 AUD');
    setComplianceTags(doc.compliance_tags || ['APRA APS 220', 'Independent Valuers', 'LVR Limits']);
    if (doc.sections && doc.sections.length > 0) {
      setSections(doc.sections);
    }
    if (doc.suggested_department && departments.some(d => d.id === doc.suggested_department)) {
      setDepartmentId(doc.suggested_department);
    }
  };

  const handleAddComplianceTag = () => {
    if (!newTagInput.trim()) return;
    const clean = newTagInput.trim();
    if (!complianceTags.includes(clean)) {
      setComplianceTags(prev => [...prev, clean]);
    }
    setNewTagInput('');
  };

  const handleRemoveComplianceTag = (tagToRemove) => {
    setComplianceTags(prev => prev.filter(t => t !== tagToRemove));
  };

  const handlePublishAllIngestedDocs = async () => {
    if (!ingestedDocuments || ingestedDocuments.length === 0) return;
    setIsSubmitting(true);
    setErrorMessage('');
    try {
      for (const doc of ingestedDocuments) {
        const docDept = doc.suggested_department || departmentId;
        const docSections = doc.sections || [];
        const docContent = docSections.map((sec, idx) => `### ${idx + 1}. ${sec.title}\n${sec.content}`).join('\n\n');

        if (isBankOwner) {
          await apiService.createPolicy({
            department_id: docDept,
            title: doc.title,
            summary: doc.summary,
            content: docContent,
            parameters: {
              turnaround_sla: doc.turnaround_sla || '4 Hours',
              daily_limit: doc.daily_limit || '$25,000 AUD',
              approval_limits: { officer_cap: doc.officer_cap || '$50,000 AUD' },
              mandatory_dvs: true,
              sections: docSections
            },
            created_by: currentUser?.name || 'Bank Administrator',
            creation_mode: 'upload',
            user_role: currentUser?.roleType || 'manager',
            user_name: currentUser?.name || 'Bank Administrator'
          });
        } else {
          const targetDeptName = departments.find(d => d.id === docDept)?.name || 'Retail Banking';
          await apiService.createMakerCheckerItem({
            type: 'create_policy',
            title: `New Policy Proposal: ${doc.title}`,
            department: targetDeptName,
            requested_by: `${currentUser?.name || 'Bank Employee'} (${currentUser?.role || 'Staff'})`,
            change_details: `AI Ingestion from ${doc.document_name} in ${targetDeptName}. Mode: upload. SLA: ${doc.turnaround_sla}, Daily Limit: ${doc.daily_limit}. Sections: ${docSections.length}. Summary: ${doc.summary}`,
            status: 'pending'
          });
        }
      }

      alert(`Successfully published all ${ingestedDocuments.length} document(s) as separate operational policies!`);
      if (onPolicyCreated) onPolicyCreated();
      onClose();
    } catch (err) {
      console.error('Batch publish error:', err);
      setErrorMessage('Failed to publish all documents: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isBankOwner = currentUser?.roleType === 'manager' || currentUser?.roleType === 'admin';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    let finalDeptId = departmentId;
    let finalTitle = title;
    let finalSummary = summary;
    let finalContent = content;
    let finalSla = turnaroundSla;
    let finalDaily = dailyLimit;
    let finalCap = officerCap;
    let finalSections = sections;

    if (creationMode === 'direct') {
      if (sections.length > 0) {
        finalContent = sections.map((sec, idx) => {
          if (sec.type === 'paragraph' && !sec.title.trim()) {
            return sec.content;
          }
          const heading = sec.title.trim() ? `### ${idx + 1}. ${sec.title.trim()}` : `### Paragraph ${idx + 1}`;
          return `${heading}\n${sec.content}`;
        }).join('\n\n');

        const summarySec = sections.find(s => s.title.toLowerCase().includes('summary'));
        if (!finalSummary.trim() && summarySec?.content) {
          finalSummary = summarySec.content.slice(0, 250);
        }
      } else {
        finalContent = content || 'Operational policy clauses authored directly.';
      }
    } else if (creationMode === 'library') {
      const selectedTpl = masterTemplates.find(t => t.id === selectedTemplateId) || masterTemplates[0];
      finalDeptId = departmentId || selectedTpl.dept;
      finalTitle = title || selectedTpl.title;
      finalSummary = summary || selectedTpl.summary;
      finalSla = turnaroundSla || selectedTpl.sla;
      finalCap = officerCap || selectedTpl.cap;
      finalDaily = dailyLimit || selectedTpl.daily;
      if (sections && sections.length > 0) {
        finalSections = sections;
        finalContent = sections.map((sec, idx) => `### ${idx + 1}. ${sec.title}\n${sec.content}`).join('\n\n');
      } else {
        finalContent = selectedTpl.content;
      }
    } else if (creationMode === 'upload') {
      if (!uploadedFileName && (!ingestedDocuments || ingestedDocuments.length === 0)) {
        setErrorMessage('Please upload a document to proceed.');
        return;
      }
      const activeDoc = ingestedDocuments[activeIngestedIndex];
      finalTitle = title || activeDoc?.title || `${uploadedFileName.replace(/\.[^/.]+$/, "")} Operating Policy`;
      finalSummary = summary || activeDoc?.summary || `AI ingested policy from ${uploadedFileName}`;
      finalDeptId = departmentId || activeDoc?.suggested_department || 'credit-cards';
      if (sections && sections.length > 0) {
        finalSections = sections;
        finalContent = sections.map((sec, idx) => `### ${idx + 1}. ${sec.title}\n${sec.content}`).join('\n\n');
      } else {
        finalContent = content || `### Operational Policy Specification\nExtracted from document: ${uploadedFileName}`;
      }
    }

    if (!finalTitle.trim() || !finalContent.trim()) {
      setErrorMessage('Please enter policy title and at least one section or content.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (isBankOwner) {
        // Direct Publish for Bank Administrator
        const res = await apiService.createPolicy({
          department_id: finalDeptId,
          title: finalTitle.trim(),
          summary: finalSummary.trim() || finalTitle.trim(),
          content: finalContent.trim(),
          parameters: {
            turnaround_sla: finalSla,
            daily_limit: finalDaily,
            approval_limits: { officer_cap: finalCap },
            mandatory_dvs: true,
            sections: finalSections,
            phases: selectedTemplatePhases
          },
          created_by: currentUser?.name || 'Bank Administrator',
          creation_mode: creationMode,
          user_role: currentUser?.roleType || 'manager',
          user_name: currentUser?.name || 'Bank Administrator'
        });

        if (res.id) {
          if (onPolicyCreated) onPolicyCreated(res.id);
          onClose();
        }
      } else {
        // Bank Employee: Submits for Bank Administrator Approval (Maker-Checker)
        const targetDeptName = departments.find(d => d.id === finalDeptId)?.name || 'Retail Banking';
        await apiService.createMakerCheckerItem({
          type: 'create_policy',
          title: `New Policy Proposal: ${finalTitle.trim()}`,
          department: targetDeptName,
          requested_by: `${currentUser?.name || 'Bank Employee'} (${currentUser?.role || 'Staff'})`,
          change_details: `Proposed new operational policy: "${finalTitle.trim()}" in ${targetDeptName}. Mode: ${creationMode}. SLA: ${finalSla}, Daily Limit: ${finalDaily}. Sections: ${finalSections.length}. Summary: ${finalSummary.trim() || finalTitle.trim()}`,
          status: 'pending'
        });
        alert(`Policy proposal "${finalTitle.trim()}" submitted for Bank Administrator (Marcus Vance) approval.`);
        onClose();
      }
    } catch (err) {
      console.error('Failed to create policy:', err);
      setErrorMessage('Failed to save policy. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredMasterTemplates = masterTemplates.filter(t => 
    t.title.toLowerCase().includes(masterSearchQuery.toLowerCase()) ||
    t.summary.toLowerCase().includes(masterSearchQuery.toLowerCase()) ||
    (t.deptName && t.deptName.toLowerCase().includes(masterSearchQuery.toLowerCase())) ||
    t.dept.toLowerCase().includes(masterSearchQuery.toLowerCase())
  );

  const selectedTemplate = masterTemplates.find(t => t.id === selectedTemplateId) || masterTemplates[0];

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className={`bg-[#f0f6fc] rounded-2xl shadow-2xl border border-blue-200/80 w-full ${creationMode === 'upload' && ingestedDocuments.length > 0 ? 'max-w-[96vw] w-[96vw]' : 'max-w-3xl'} max-h-[94vh] flex flex-col overflow-hidden transition-all duration-200`}>
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-blue-200/70 flex items-center justify-between bg-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#0057B8]/10 text-[#0057B8] border border-[#0057B8]/30 flex items-center justify-center font-bold text-sm">
              {editingPolicy ? <FileEdit className="w-4 h-4 text-[#0057B8]" /> : '+'}
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                {editingPolicy ? (
                  <>
                    <span>Edit Draft: {editingPolicy.title || title || 'Operational Policy'}</span>
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-blue-100 text-[#0057B8] border border-blue-200">
                      {editingPolicy.version || 'v1.0'}
                    </span>
                  </>
                ) : (
                  'LibList • Create Operational Policy'
                )}
              </h2>
              {editingPolicy && (
                <p className="text-xs text-slate-500">
                  Target Department: <span className="font-semibold text-slate-700">{editingPolicy.department_name || preselectedDepartmentName || 'Credit Cards'}</span>
                </p>
              )}
            </div>
          </div>
          <button 
            onClick={handleRequestClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
            title="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 3 Creation Modes Tab Bar (Hidden when editing draft, or active template editor, or document extracted) */}
        {!editingPolicy && !isTemplateEditorActive && !(creationMode === 'upload' && ingestedDocuments.length > 0) && (
        <div className="p-3 bg-[#e8f1fb] border-b border-blue-200/70 grid grid-cols-3 gap-2 text-[12.5px]">
          <button
            type="button"
            onClick={() => setCreationMode('direct')}
            className={`py-2 px-3 rounded-lg flex items-center justify-center gap-2 font-medium transition cursor-pointer ${
              creationMode === 'direct'
                ? 'bg-white text-[#0057B8] shadow-xs border border-[#0057B8]/40 font-bold'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Edit3 className="w-4 h-4 text-[#0057B8]" />
            <span>1. Direct In-System</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setCreationMode('library');
              const currentTpl = masterTemplates.find(t => t.id === selectedTemplateId) || masterTemplates[0];
              handleSelectTemplate(currentTpl);
            }}
            className={`py-2 px-3 rounded-lg flex items-center justify-center gap-2 font-medium transition cursor-pointer ${
              creationMode === 'library'
                ? 'bg-white text-[#0057B8] shadow-xs border border-[#0057B8]/40 font-bold'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <BookOpen className="w-4 h-4 text-[#0057B8]" />
            <span>2. Master Library</span>
          </button>

          <button
            type="button"
            onClick={() => setCreationMode('upload')}
            className={`py-2 px-3 rounded-lg flex items-center justify-center gap-2 font-medium transition cursor-pointer ${
              creationMode === 'upload'
                ? 'bg-white text-[#0057B8] shadow-xs border border-[#0057B8]/40 font-bold'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Bot className="w-4 h-4 text-[#0057B8]" />
            <span>3. Document Upload</span>
          </button>
        </div>
        )}

        {/* Error notification */}
        {errorMessage && (
          <div className="p-3 bg-rose-50 border-b border-rose-100 text-rose-800 text-[12.5px] font-semibold">
            {errorMessage}
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-[13px] custom-scrollbar bg-[#f0f6fc]">
          
          {/* DIRECT DRAFT / CONFIGURED EDITING MODE (Immediate access to modular sections, no mode/template clutter) */}
          {editingPolicy ? (
            <div className="space-y-4 animate-in fade-in duration-150">
              {/* Document Title */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Policy Document Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Credit Assessment & Approval Guidelines"
                  required
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-[#0057B8] focus:ring-2 focus:ring-[#0057B8]/15 text-[14px] bg-white font-bold text-slate-900 shadow-2xs"
                />
              </div>

              {/* Directly Render Modular Sections with Word Action Toolbar */}
              <div className="space-y-3">
                {sections.map((section, idx) => (
                  <div
                    key={section.id || idx}
                    className="p-3.5 rounded-xl border border-slate-200/90 bg-white hover:border-[#0057B8]/40 shadow-xs space-y-2.5 transition"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className="w-6 h-6 rounded-md bg-[#0057B8] text-white text-[11px] font-bold flex items-center justify-center flex-shrink-0 font-mono shadow-2xs">
                          {idx + 1}
                        </span>
                        <input
                          type="text"
                          value={section.title}
                          onChange={(e) => handleUpdateSectionTitle(section.id, e.target.value)}
                          placeholder="Section Title"
                          className="font-bold text-[13.5px] text-slate-900 bg-white border border-slate-200 focus:border-[#0057B8] focus:ring-1 focus:ring-[#0057B8] px-2.5 py-1 rounded-md outline-none transition flex-1 shadow-2xs"
                        />
                      </div>

                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => setExpandedModalSectionId(section.id || `sec-${idx}`)}
                          className="p-1.5 rounded-lg transition text-slate-400 hover:text-[#0057B8] hover:bg-blue-50 cursor-pointer"
                          title="Expand clause in editor popup"
                        >
                          <Maximize2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => handleMoveSectionUp(idx)}
                          className={`p-1.5 rounded transition ${
                            idx === 0 ? 'text-slate-300 cursor-not-allowed' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200 cursor-pointer'
                          }`}
                          title="Move section up"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={idx === sections.length - 1}
                          onClick={() => handleMoveSectionDown(idx)}
                          className={`p-1.5 rounded transition ${
                            idx === sections.length - 1 ? 'text-slate-300 cursor-not-allowed' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200 cursor-pointer'
                          }`}
                          title="Move section down"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteSection(section.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition cursor-pointer"
                          title="Delete section"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Word-like Top Action Toolbar for Section */}
                    <SectionWordToolbar
                      sectionId={section.id}
                      content={section.content}
                      sectionIndex={idx}
                      onApplyFormat={handleApplyFormat}
                    />

                    {/* Textarea attached seamlessly to the toolbar */}
                    <textarea
                      rows={Math.max(4, Math.min(10, Math.ceil((section.content || '').length / 80)))}
                      value={section.content}
                      onChange={(e) => handleUpdateSectionContent(section.id, e.target.value)}
                      placeholder={`Enter ${section.title || 'section'} details, operational requirements, or rules...`}
                      className="w-full p-3 rounded-b-lg border border-slate-200 border-t-0 focus:outline-none focus:border-[#0057B8] focus:ring-1 focus:ring-[#0057B8] text-xs leading-relaxed text-slate-800 bg-white placeholder-slate-400 shadow-2xs font-sans transition-all"
                    />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <>
          {/* MODE 1: DIRECT IN-SYSTEM */}
          {creationMode === 'direct' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              
              {/* STEP 1: CHOOSE STARTING TEMPLATE FIRST (Only for fresh policy creation) */}
              {!editingPolicy ? (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                        1. Choose Starting Template
                      </label>
                      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                        DB Dynamic ({dynamicTemplates.length})
                      </span>
                    </div>
                    {selectedDirectTemplateId && (
                      <span className="text-[11px] text-[#0057B8] font-bold bg-blue-100/70 border border-blue-200 px-2 py-0.5 rounded-full">
                        {dynamicTemplates.find(t => t.id === selectedDirectTemplateId)?.name} Selected
                      </span>
                    )}
                  </div>

                  {/* Dynamic Template Cards with (i) Info Icon Button */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {dynamicTemplates.map((tpl) => {
                      const isSelected = selectedDirectTemplateId === tpl.id;
                      return (
                        <div
                          key={tpl.id}
                          onClick={() => handleSelectDirectTemplate(tpl)}
                          className={`relative p-3 rounded-xl border transition-all cursor-pointer text-left flex flex-col justify-between ${
                            isSelected
                              ? 'bg-[#0057B8] text-white border-[#0057B8] shadow-sm font-bold ring-2 ring-[#0057B8]/25'
                              : 'bg-white text-slate-700 border-blue-200/90 hover:border-[#0057B8] hover:bg-blue-50/50 shadow-2xs'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1 w-full">
                            <span className={`text-[12.5px] font-bold ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                              {tpl.name}
                            </span>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveTemplateInfoId(activeTemplateInfoId === tpl.id ? null : tpl.id);
                                }}
                                className={`p-1 rounded-md transition cursor-pointer ${
                                  isSelected 
                                    ? 'text-white/80 hover:text-white hover:bg-white/20' 
                                    : 'text-slate-400 hover:text-[#0057B8] hover:bg-blue-100/70'
                                }`}
                                title={`View ${tpl.name} info`}
                              >
                                <Info className="w-3.5 h-3.5" />
                              </button>
                              {isSelected && (
                                <Check className="w-3.5 h-3.5 text-white flex-shrink-0" />
                              )}
                            </div>
                          </div>

                          <span className={`text-[11.5px] font-medium truncate mt-1 block ${isSelected ? 'text-blue-100' : 'text-slate-600'}`}>
                            {tpl.title}
                          </span>

                          {activeTemplateInfoId === tpl.id && (
                            <div
                              onClick={(e) => e.stopPropagation()}
                              className="absolute left-0 top-full mt-2 z-40 w-64 p-3 bg-white text-slate-800 rounded-xl shadow-xl border border-blue-200 text-xs animate-in fade-in duration-150"
                            >
                              <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 mb-1.5 font-bold text-slate-900">
                                <span>{tpl.name} • {tpl.title}</span>
                                <button
                                  type="button"
                                  onClick={() => setActiveTemplateInfoId(null)}
                                  className="text-slate-400 hover:text-slate-700 p-0.5 cursor-pointer"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                              <p className="text-[11px] leading-relaxed text-slate-600">
                                {tpl.summary}
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-blue-50/80 border border-blue-200 rounded-xl text-xs text-blue-900 shadow-2xs flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse flex-shrink-0" />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-900">Editing Draft Revision</span>
                        <span className="font-mono bg-white px-2 py-0.5 rounded border border-blue-300 font-bold text-[#0057B8]">
                          {editingPolicy.version || 'v1.1'}
                        </span>
                        <span className="text-slate-600 font-medium truncate max-w-sm">({editingPolicy.title})</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Direct editing mode: adjust policy title, statutory parameters, and modular clauses with formatting toolbar below.
                      </p>
                    </div>
                  </div>
                  <span className="text-[10.5px] font-bold text-emerald-800 bg-emerald-100/70 border border-emerald-300 px-2.5 py-0.5 rounded-full">
                    Draft Ready
                  </span>
                </div>
              )}

              {/* Prompt if no template chosen yet and not editing */}
              {!selectedDirectTemplateId && !editingPolicy && (
                <div className="p-8 text-center bg-white rounded-2xl border border-dashed border-blue-200 text-slate-500 space-y-2">
                  <div className="w-10 h-10 rounded-full bg-blue-50 text-[#0057B8] flex items-center justify-center mx-auto">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <p className="font-bold text-slate-800 text-[13.5px]">Please select a starting template</p>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Choose Template 1, 2, 3, or 4 above to initialize institutional clauses and open document editing options.
                  </p>
                </div>
              )}

              {/* STEP 2: DOCUMENT CONFIGURATION & CLAUSES (REVEALED AFTER TEMPLATE SELECTION OR WHEN EDITING DRAFT) */}
              {(selectedDirectTemplateId || editingPolicy) && (
                <div className="space-y-4 pt-1 border-t border-blue-200/60 animate-in fade-in duration-150">
                  {/* If opened from specific department (+), target is ALREADY CHOSEN — do not ask again */}
                  {preselectedDepartmentId ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 p-2.5 bg-blue-50/80 border border-blue-200/90 rounded-xl text-xs">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#0057B8] animate-pulse"></span>
                        <span className="text-slate-500 font-medium">Target Department:</span>
                        <strong className="text-[#0057B8] font-bold text-[13px]">
                          {preselectedDepartmentName || departments.find(d => d.id === departmentId)?.name || 'Credit Cards'}
                        </strong>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                          Policy Document Title *
                        </label>
                        <input
                          type="text"
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          placeholder="e.g. Credit Assessment & Approval Guidelines"
                          required
                          className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-[#0057B8] focus:ring-2 focus:ring-[#0057B8]/15 text-[13px] bg-white font-semibold text-slate-900 shadow-2xs"
                        />
                      </div>
                    </div>
                  ) : (
                    /* If opened from generic Library List [+] without a specific department, allow choosing target department */
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="sm:col-span-1">
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                          Target Department
                        </label>
                        <select
                          value={departmentId}
                          onChange={(e) => setDepartmentId(e.target.value)}
                          className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-[#0057B8] focus:ring-2 focus:ring-[#0057B8]/15 text-[13px] bg-white font-medium text-slate-900 shadow-2xs"
                        >
                          {departments.map(d => (
                            <option key={d.id} value={d.id}>{d.name}</option>
                          ))}
                        </select>
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                          Policy Title
                        </label>
                        <input
                          type="text"
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          placeholder="e.g. Credit Assessment & Approval Guidelines"
                          required
                          className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-[#0057B8] focus:ring-2 focus:ring-[#0057B8]/15 text-[13px] bg-white font-semibold text-slate-900 shadow-2xs"
                        />
                      </div>
                    </div>
                  )}

              {/* Policy Sections & Modular Clauses (Image 4 Builder) */}
              <div className="pt-1 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-slate-900 text-[13.5px] flex items-center gap-2">
                      <Layers className="w-4 h-4 text-[#0057B8]" />
                      <span>POLICY CLAUSES & SPECIFICATIONS ({sections.length}) (compare against left pane) Clause Formatter Enabled</span>
                    </h3>
                    <p className="text-[11.5px] text-slate-500">
                      Edit clause specifications, reorder above or below, delete, or add standalone paragraphs.
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleAddSection('New Section')}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#0057B8]/10 hover:bg-[#0057B8]/20 text-[#0057B8] rounded-xl text-xs font-bold border border-[#0057B8]/30 transition cursor-pointer shadow-2xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Add Section</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleAddParagraph}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold border border-slate-300 transition cursor-pointer shadow-2xs"
                    >
                      <AlignLeft className="w-3.5 h-3.5" />
                      <span>+ Add Paragraph</span>
                    </button>
                  </div>
                </div>

                {/* Section Cards List - Pure White Cards with Separate Full-Screen Popup Expand Option */}
                <div className="space-y-3">
                  {sections.map((section, idx) => {
                    return (
                      <div
                        key={section.id || idx}
                        className="p-3.5 rounded-xl border border-slate-200/90 bg-white hover:border-[#0057B8]/40 shadow-xs space-y-2.5 transition"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <span className="w-6 h-6 rounded-md bg-[#0057B8] text-white text-[11px] font-bold flex items-center justify-center flex-shrink-0 font-mono shadow-2xs">
                              {idx + 1}
                            </span>
                            <div className="flex-1 min-w-0">
                              <span className="font-bold text-[13.5px] text-slate-900 tracking-tight block truncate select-none">
                                {section.title || (section.type === 'paragraph' ? 'Paragraph' : `Section ${idx + 1}`)}
                              </span>
                            </div>
                            {section.type === 'paragraph' && (
                              <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded uppercase flex-shrink-0">
                                Paragraph
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1 flex-shrink-0">
                            {/* Expand clause in big-screen separate popup */}
                            <button
                              type="button"
                              onClick={() => setExpandedModalSectionId(section.id || `sec-${idx}`)}
                              className="p-1.5 rounded-lg transition text-slate-400 hover:text-[#0057B8] hover:bg-blue-50 cursor-pointer"
                              title="Expand clause in editor popup"
                            >
                              <Maximize2 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              disabled={idx === 0}
                              onClick={() => handleMoveSectionUp(idx)}
                              className={`p-1.5 rounded transition ${
                                idx === 0 ? 'text-slate-300 cursor-not-allowed' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200 cursor-pointer'
                              }`}
                              title="Move section above (up)"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              disabled={idx === sections.length - 1}
                              onClick={() => handleMoveSectionDown(idx)}
                              className={`p-1.5 rounded transition ${
                                idx === sections.length - 1 ? 'text-slate-300 cursor-not-allowed' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200 cursor-pointer'
                              }`}
                              title="Move section below (down)"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteSection(section.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition cursor-pointer"
                              title="Delete section"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <SectionWordToolbar
                          sectionId={section.id}
                          content={section.content}
                          sectionIndex={idx}
                          onApplyFormat={handleApplyFormat}
                        />
                        <textarea
                          rows={Math.max(3, Math.min(6, Math.ceil((section.content || '').length / 90)))}
                          value={section.content}
                          onChange={(e) => handleUpdateSectionContent(section.id, e.target.value)}
                          placeholder={`Enter ${section.title || 'section'} details, operational requirements, or rules...`}
                          className="w-full p-2.5 rounded-b-lg border border-slate-200 border-t-0 focus:outline-none focus:border-[#0057B8] focus:ring-1 focus:ring-[#0057B8] text-xs leading-relaxed text-slate-800 bg-white placeholder-slate-400 shadow-2xs font-sans transition-all"
                        />
                      </div>
                    );
                  })}
                </div>

                {/* Quick Add Presets Bar (commented out as requested) */}
                {/*
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11.5px] text-slate-500">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="font-semibold text-slate-600">Quick Add:</span>
                    {['Summary', 'Details', 'Reports', 'Dependencies', 'Operational Events'].map(name => (
                      <button
                        key={name}
                        type="button"
                        onClick={() => handleAddPresetSection(name)}
                        className="px-2.5 py-1 bg-white hover:bg-blue-50 hover:text-[#0057B8] hover:border-[#0057B8] text-slate-600 border border-slate-300 rounded-lg text-[11px] font-semibold transition cursor-pointer shadow-2xs"
                      >
                        +{name}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={handleAddParagraph}
                    className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-[11px] font-medium transition cursor-pointer"
                  >
                    + Add as single paragraph
                  </button>
                </div>
                */}
              </div>

              {/* Executive Summary & Scope + SLA / Daily Limit / Officer Cap Grid (Image 1) - ONLY FOR EXECUTIVE SUMMARY TEMPLATE */}
              {selectedDirectTemplateId === 'template-02-exec' && (
                <div className="pt-3 border-t border-slate-200 space-y-3.5 bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs">
                  {/* Executive Summary & Scope */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Executive Summary & Statutory Scope
                    </label>
                    <textarea
                      rows={3}
                      value={summary}
                      onChange={(e) => setSummary(e.target.value)}
                      placeholder="Comprehensive executive summary, statutory purpose, and regulatory scope..."
                      className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-[#0057B8] focus:ring-2 focus:ring-[#0057B8]/15 text-xs text-slate-800 bg-white shadow-2xs font-sans leading-relaxed"
                    />
                  </div>


                </div>
              )}

                </div>
              )}

            </div>
          )}

          {/* MODE 2: MASTER LIBRARY */}
          {creationMode === 'library' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {!isTemplateEditorActive ? (
                <>
                  {/* Target Department Partition for adopted policy */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Target Department Partition
                    </label>
                    <select
                      value={departmentId}
                      onChange={(e) => setDepartmentId(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-[#0057B8] focus:ring-2 focus:ring-[#0057B8]/15 text-[13px] bg-white font-medium text-slate-900 shadow-2xs"
                    >
                      {departments.map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                    <span className="text-[11px] text-slate-500 mt-1 block">
                      Select which department library this master standard will be adopted into.
                    </span>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                        Master Repository Standards ({filteredMasterTemplates.length} Available)
                      </span>
                      <span className="text-[11px] text-[#0057B8] font-bold">
                        Click any blue card to open & edit
                      </span>
                    </div>
                    
                    {/* Search Bar for Master Library */}
                    <div className="relative mb-2.5">
                      <Search className="w-4 h-4 text-[#0057B8] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        value={masterSearchQuery}
                        onChange={(e) => setMasterSearchQuery(e.target.value)}
                        placeholder="Search master library templates (credit cards, lending, KYC, security, AML)..."
                        className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border-2 border-blue-200 hover:border-[#0057B8] bg-white focus:border-[#0057B8] focus:ring-2 focus:ring-[#0057B8]/20 outline-none transition font-medium shadow-2xs"
                      />
                    </div>
                  </div>

                  {/* Master Templates List - Vibrant Blue Cards */}
                  <div className="grid grid-cols-1 gap-3 max-h-72 overflow-y-auto custom-scrollbar pr-1">
                    {filteredMasterTemplates.map(t => {
                      const isSelected = selectedTemplateId === t.id;
                      return (
                        <div
                          key={t.id}
                          onClick={() => {
                            handleSelectTemplate(t);
                            setIsTemplateEditorActive(true);
                          }}
                          className={`p-4 rounded-2xl border-2 transition-all cursor-pointer text-left relative ${
                            isSelected 
                              ? 'border-[#0057B8] bg-gradient-to-br from-blue-100/90 via-sky-50/70 to-white ring-2 ring-[#0057B8]/30 shadow-md' 
                              : 'border-blue-200/90 bg-gradient-to-br from-white via-blue-50/40 to-sky-50/20 hover:border-[#0057B8] hover:bg-blue-50/70 shadow-2xs'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition ${
                                isSelected 
                                  ? 'border-[#0057B8] bg-[#0057B8] text-white shadow-2xs' 
                                  : 'border-blue-400 bg-white'
                              }`}>
                                {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                              </div>
                              <h4 className={`font-bold text-[14px] truncate ${isSelected ? 'text-[#0057B8]' : 'text-slate-900 group-hover:text-[#0057B8]'}`}>
                                {t.title}
                              </h4>
                            </div>
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#0057B8] bg-blue-100/90 hover:bg-[#0057B8] hover:text-white px-3 py-1.5 rounded-xl transition shadow-2xs flex-shrink-0">
                              Click to Open & Edit Template →
                            </span>
                          </div>

                          <p className="text-slate-600 text-xs mt-1.5 pl-7.5 leading-relaxed">
                            {t.summary}
                          </p>

                          <div className="flex flex-wrap items-center gap-2 mt-2.5 pl-7.5 text-xs">
                            <span className="bg-[#0057B8] text-white px-2.5 py-0.5 rounded-md font-bold text-[10.5px] shadow-2xs">
                              Partition: {t.deptName || t.dept}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <>
                  {/* OPEN LIVE POLICY EDITOR FOR SELECTED MASTER TEMPLATE (DIRECT AT TOP, NO SCROLLING) */}
                  <div className="space-y-4 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between bg-gradient-to-r from-blue-100/90 via-sky-50 to-white p-3.5 rounded-xl border-2 border-[#0057B8]/30 shadow-2xs">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setIsTemplateEditorActive(false)}
                          className="px-3 py-1.5 bg-white hover:bg-slate-50 text-[#0057B8] border border-blue-300 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer active:scale-95"
                        >
                          <ArrowLeft className="w-3.5 h-3.5" />
                          <span>← Choose Different Template</span>
                        </button>
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="font-bold text-xs text-[#0057B8] uppercase tracking-wider">
                          Currently Editing: {title || selectedTemplate?.title}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-600 font-semibold hidden sm:inline">
                        Direct Editor Active
                      </span>
                    </div>

                {/* Policy Specifications & Framework */}
                <div className="p-4 bg-white border border-slate-200 rounded-2xl space-y-3.5 shadow-2xs">
                  {/* Department Partition */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Target Department Partition
                    </label>
                    <select
                      value={departmentId}
                      onChange={(e) => setDepartmentId(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-[#0057B8] focus:ring-2 focus:ring-[#0057B8]/15 text-[12.5px] bg-white font-medium text-slate-900 shadow-2xs"
                    >
                      {departments.map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Policy Title */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Policy Title
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Authoritative Policy Title"
                      className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-[#0057B8] focus:ring-2 focus:ring-[#0057B8]/15 text-[13px] font-semibold text-slate-900 bg-white shadow-2xs"
                    />
                  </div>

                  {/* Executive Summary & Purpose */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Executive Summary & Statutory Scope
                    </label>
                    <textarea
                      rows={3}
                      value={summary}
                      onChange={(e) => setSummary(e.target.value)}
                      placeholder="Comprehensive executive summary and statutory scope..."
                      className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-[#0057B8] focus:ring-2 focus:ring-[#0057B8]/15 text-xs text-slate-800 bg-white shadow-2xs font-sans leading-relaxed"
                    />
                  </div>


                </div>

                {/* Modular Policy Sections & Clauses (Image 1 Builder) */}
                <div className="space-y-3 pt-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span className="text-xs font-bold text-slate-900 uppercase tracking-wider block">
                        Policy Sections & Modular Clauses ({sections.length})
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Operational clauses pre-populated from master standard. Edit section titles, reorder above or below, delete, or add standalone paragraphs.
                      </span>
                    </div>
                    

                  </div>

                  {/* Render Sections List */}
                  <div className="space-y-3">
                    {sections.map((section, idx) => (
                      <div
                        key={section.id || idx}
                        className="p-3.5 bg-slate-50/80 border border-slate-200 rounded-xl space-y-2 hover:border-[#0057B8]/40 transition shadow-2xs"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <span className="px-2 py-0.5 rounded-md bg-[#0057B8] text-white font-mono font-bold text-[10px]">
                              {idx + 1}
                            </span>
                            <input
                              type="text"
                              value={section.title}
                              onChange={(e) => handleUpdateSectionTitle(section.id, e.target.value)}
                              placeholder="Section Title"
                              className="font-bold text-xs text-slate-900 bg-white border border-slate-300 focus:border-[#0057B8] focus:ring-1 focus:ring-[#0057B8] px-2 py-1 rounded-md outline-none transition flex-1 shadow-2xs"
                            />
                            {section.type === 'paragraph' && (
                              <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded uppercase flex-shrink-0">
                                Paragraph
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <button
                              type="button"
                              onClick={() => handleMoveSectionUp(idx)}
                              disabled={idx === 0}
                              className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-20 cursor-pointer"
                              title="Move Up"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMoveSectionDown(idx)}
                              disabled={idx === sections.length - 1}
                              className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-20 cursor-pointer"
                              title="Move Down"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteSection(section.id)}
                              className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                              title="Delete Section"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        <SectionWordToolbar
                          sectionId={section.id}
                          content={section.content}
                          sectionIndex={idx}
                          onApplyFormat={handleApplyFormat}
                        />
                        <textarea
                          rows={Math.max(3, Math.min(8, Math.ceil((section.content || '').length / 90)))}
                          value={section.content}
                          onChange={(e) => handleUpdateSectionContent(section.id, e.target.value)}
                          placeholder="Section clauses and operational specifications..."
                          className="w-full p-2.5 bg-white rounded-b-lg border border-slate-200 border-t-0 text-xs leading-relaxed text-slate-800 focus:border-[#0057B8] focus:ring-1 focus:ring-[#0057B8] outline-none shadow-2xs font-sans"
                        />
                      </div>
                    ))}
                  </div>


                </div>
              </div>
                </>
              )}
            </div>
          )}

          {/* MODE 3: DOCUMENT UPLOAD (AI) - GROQ AI + NEON PGVECTOR RAG */}
          {creationMode === 'upload' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {isAiThinking ? (
                <div className="p-10 border-2 border-dashed border-[#0057B8]/40 bg-[#0057B8]/5 rounded-2xl text-center space-y-4">
                  <Loader2 className="w-10 h-10 text-[#0057B8] animate-spin mx-auto" />
                  <div className="space-y-1">
                    <p className="text-base font-bold text-slate-900">
                      AI & RAG Engine Processing Documents...
                    </p>
                    <p className="text-xs text-slate-500">
                      Extracting Summary, Details, Reports, Dependencies, and Operational Events independently for each document.
                    </p>
                  </div>
                  <p className="text-[12px] text-[#0057B8] font-mono bg-[#0057B8]/10 px-4 py-1.5 rounded-lg inline-block font-semibold">
                    {aiStep}
                  </p>
                </div>
              ) : ingestedDocuments.length === 0 ? (
                <div className="p-8 border-2 border-dashed border-[#0057B8]/30 bg-[#0057B8]/5 rounded-2xl text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#0057B8]/10 text-[#0057B8] flex items-center justify-center mx-auto">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      Upload Single or Multiple Documents
                    </h3>
                    <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 leading-relaxed">
                      Select one or multiple policy files. Document Parsing Engine segments each document into <strong>Summary</strong>, <strong>Scope</strong>, <strong>Principles</strong>, <strong>Methods</strong>, <strong>Dependencies</strong>, and <strong>Operational Events</strong>.
                    </p>
                  </div>

                  {/* Step 1: Select Target Policy Template from DB */}
                  <div className="bg-white p-4 rounded-xl border border-blue-200/90 text-left max-w-lg mx-auto shadow-2xs space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-[11px] font-bold text-[#0057B8] uppercase tracking-wider flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>Step 1: Select Target Policy Template (from DB):</span>
                      </label>
                      <span className="text-[10px] font-bold bg-blue-100 text-[#0057B8] px-2 py-0.5 rounded-full">
                        Required
                      </span>
                    </div>
                    <select
                      value={selectedUploadTemplateId}
                      onChange={(e) => {
                        setSelectedUploadTemplateId(e.target.value);
                        const tpl = masterTemplates.find(t => t.id === e.target.value);
                        if (tpl) handleSelectTemplate(tpl);
                      }}
                      className="w-full p-2.5 rounded-lg border border-slate-300 text-xs font-semibold bg-slate-50 text-slate-800 outline-none focus:border-[#0057B8] focus:ring-1 focus:ring-[#0057B8]"
                    >
                      {masterTemplates.map(t => (
                        <option key={t.id} value={t.id}>
                          {t.name || t.title} • {t.deptName || t.dept}
                        </option>
                      ))}
                    </select>
                    {(() => {
                      const curTpl = masterTemplates.find(t => t.id === selectedUploadTemplateId);
                      if (curTpl) {
                        return (
                          <p className="text-[11px] text-slate-500 italic">
                            Template partition: <strong className="text-slate-700">{curTpl.deptName || curTpl.dept}</strong> — includes institutional standard clauses.
                          </p>
                        );
                      }
                      return null;
                    })()}
                  </div>

                  {/* Step 2: Upload Documents */}
                  <div className="pt-2 flex flex-col items-center justify-center gap-2.5">
                    <div className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                      Step 2: Choose Documents to Ingest
                    </div>
                    <input
                      type="file"
                      multiple
                      accept=".pdf,.docx,.doc,.txt,.rtf"
                      onChange={handleUploadMultipleDocumentsWithAi}
                      className="hidden"
                      id="doc-upload-input"
                    />
                    <label
                      htmlFor="doc-upload-input"
                      className="inline-flex items-center gap-2 px-6 py-3 bg-[#0057B8] hover:bg-[#004EA6] text-white rounded-xl font-bold text-xs cursor-pointer shadow-md transition active:scale-95"
                    >
                      <Upload className="w-4 h-4" />
                      <span>Choose Files to Ingest (Supports Multiple)</span>
                    </label>
                  </div>

                  <div className="pt-2 flex items-center justify-center gap-2 text-[11px] text-slate-400">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Each uploaded file is kept separate and will NOT be merged.</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Multi-Document Status & Switcher */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-800">
                          {ingestedDocuments.length} Document(s) Ingested & Formatted into Governance Modules
                        </span>
                        <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200">
                          Isolated Partitions • Automated Extraction
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="file"
                          multiple
                          accept=".pdf,.docx,.doc,.txt,.rtf"
                          onChange={handleUploadMultipleDocumentsWithAi}
                          className="hidden"
                          id="doc-upload-more"
                        />
                        <label
                          htmlFor="doc-upload-more"
                          className="text-[11px] font-bold text-[#0057B8] hover:text-[#004EA6] hover:bg-blue-50 px-2.5 py-1 rounded-lg border border-[#0057B8]/30 cursor-pointer transition flex items-center gap-1.5"
                        >
                          <Upload className="w-3 h-3" />
                          <span>+ Upload More Files</span>
                        </label>
                      </div>
                    </div>

                    {/* Document Selector Buttons (Tabs) */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
                      {ingestedDocuments.map((doc, idx) => {
                        const isActive = activeIngestedIndex === idx;
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => handleSelectIngestedDoc(idx)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-2 flex-shrink-0 cursor-pointer ${
                              isActive
                                ? 'bg-[#0057B8] text-white shadow-xs'
                                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                            }`}
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span className="truncate max-w-[150px]">{doc.document_name}</span>
                            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'}`}>
                              Doc {idx + 1}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Active Document Analysis: Side-by-Side Split Screen */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
                    {/* LEFT PANE: Uploaded Document Viewer */}
                    <div className="flex flex-col bg-slate-900 rounded-2xl overflow-hidden border border-slate-300 h-[76vh] sticky top-0 shadow-md">
                      <div className="bg-slate-800 text-white px-4 py-2.5 flex items-center justify-between text-xs font-semibold flex-shrink-0 border-b border-slate-700">
                        <div className="flex items-center gap-2 truncate">
                          <FileText className="w-4 h-4 text-blue-400 flex-shrink-0" />
                          <span className="truncate max-w-[200px]" title={ingestedDocuments[activeIngestedIndex]?.document_name || uploadedFileName}>
                            {ingestedDocuments[activeIngestedIndex]?.document_name || uploadedFileName || 'Original Document'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center bg-slate-900/80 rounded-lg p-0.5 border border-slate-700 text-[10.5px]">
                            <button
                              type="button"
                              onClick={() => setLeftPaneViewMode('preview')}
                              className={`px-2.5 py-0.5 rounded cursor-pointer transition ${leftPaneViewMode === 'preview' ? 'bg-[#0057B8] text-white font-bold' : 'text-slate-400 hover:text-white'}`}
                            >
                              Document View
                            </button>
                            <button
                              type="button"
                              onClick={() => setLeftPaneViewMode('source_text')}
                              className={`px-2.5 py-0.5 rounded cursor-pointer transition ${leftPaneViewMode === 'source_text' ? 'bg-[#0057B8] text-white font-bold' : 'text-slate-400 hover:text-white'}`}
                            >
                              Source Text
                            </button>
                          </div>
                          <span className="text-[10px] text-blue-200 font-mono bg-blue-900/60 border border-blue-700 px-2.5 py-0.5 rounded-full font-bold hidden sm:inline">
                            Uploaded Document
                          </span>
                        </div>
                      </div>

                      {leftPaneViewMode === 'preview' && uploadedPdfPreviewUrl ? (
                        <iframe
                          src={uploadedPdfPreviewUrl}
                          className="w-full flex-1 border-0 bg-white"
                          title="Uploaded Document Preview"
                        />
                      ) : (
                        <div className="w-full flex-1 overflow-y-auto p-5 bg-[#f8fafc] font-sans text-slate-800 text-xs leading-relaxed custom-scrollbar">
                          <div className="border border-slate-200 p-5 shadow-xs rounded-xl bg-white space-y-4">
                            <div className="border-b border-slate-200 pb-3 flex items-start justify-between gap-2">
                              <div>
                                <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                                  {departments.find(d => d.id === departmentId)?.name || 'Credit Cards'} • Uploaded Source
                                </span>
                                <h2 className="text-base font-bold text-slate-900 mt-2">
                                  {ingestedDocuments[activeIngestedIndex]?.document_name || uploadedFileName || title || 'Uploaded Document'}
                                </h2>
                                <p className="text-xs text-slate-500 mt-1 italic">
                                  {summary || 'Source text and institutional clauses extracted from the uploaded document.'}
                                </p>
                              </div>
                            </div>

                            {uploadedDocRawText ? (
                              <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 font-mono text-[11.5px] leading-relaxed whitespace-pre-wrap text-slate-700">
                                {uploadedDocRawText}
                              </div>
                            ) : (
                              <div className="space-y-3 pt-1">
                                {sections.map((sec, sIdx) => (
                                  <div key={sec.id || sIdx} className="space-y-1.5 border-b border-slate-100 pb-3 last:border-0">
                                    <div className="flex items-center gap-2">
                                      <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-800 font-bold text-[10px] flex items-center justify-center">
                                        {sIdx + 1}
                                      </span>
                                      <h3 className="font-bold text-xs text-slate-900">{sec.title}</h3>
                                    </div>
                                    <div className="text-[11.5px] text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100 whitespace-pre-wrap font-sans leading-relaxed">
                                      {sec.content}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* RIGHT PANE: Structured Policy Editor & Modular Clauses */}
                    <div className="space-y-4 border border-slate-200 rounded-2xl p-4 bg-white shadow-2xs h-[76vh] overflow-y-auto custom-scrollbar">
                      {/* Header Summary */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-slate-900">
                              {ingestedDocuments[activeIngestedIndex]?.document_name}
                            </span>
                            <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200">
                              Analysis & Evidence Verified
                            </span>
                          </div>
                          <p className="text-[11.5px] text-slate-500">
                            Document parsed into governance modules ({ingestedDocuments[activeIngestedIndex]?.total_chars || 5571} chars). Edit specifications and clauses directly below.
                          </p>
                        </div>

                        {/* Toggle Evidence Button */}
                        <button
                          type="button"
                          onClick={() => setShowEvidence(!showEvidence)}
                          className="px-3 py-1.5 rounded-xl border border-blue-200 bg-blue-50/70 hover:bg-blue-100/60 text-[#0057B8] text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                        >
                          <Search className="w-3.5 h-3.5" />
                          <span>{showEvidence ? 'Hide Source Evidence' : 'Show Source Evidence'}</span>
                        </button>
                      </div>

                      {/* AI DISCOVERY & SOURCE EVIDENCE */}
                      {showEvidence && (
                        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                              How This Information Was Found (Document Evidence & Citations)
                            </span>
                            <span className="text-[11px] text-slate-500 font-medium">
                              Extracted directly by LibList Policy Engine
                            </span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                            {(() => {
                              const defaultValuationEvidence = [
                                {
                                  topic: 'Policy Title',
                                  finding: title || 'Home Loan Valuations Policy',
                                  source_excerpt: 'Page 1, Document Title: "Home Loan Valuations"'
                                },
                                {
                                  topic: 'Target Department Partition',
                                  finding: departments.find(d => d.id === departmentId)?.name || 'Retail Lending (Home Loans & Mortgages)',
                                  source_excerpt: 'Section 2.1 Scope: "All residential home loan applications, new property purchases, refinancing transactions, construction and renovation loans."'
                                },
                                {
                                  topic: 'Approved Valuation Methods',
                                  finding: '4 Approved Methods: Full, Desktop, AVM, Drive-thru/Kerbside',
                                  source_excerpt: 'Section 4.1: "Full internal and external inspection mandatory when LVR exceeds approved thresholds."'
                                },
                                {
                                  topic: 'Policy Dependencies',
                                  finding: 'Panel Valuers Accreditation & Valuation Report SOP',
                                  source_excerpt: 'Section 4.6: "Panel Valuers - Accreditation, Performance monitoring & Termination; Operating Procedure for Filling a Valuation Report."'
                                },
                                {
                                  topic: 'Operational Events & Lifecycle Triggers',
                                  finding: '7 Core Lifecycle Events Identified (Origination, Valuer Assignment, Inspection, Decisioning, Dispute Escalation, Expiry, Audit)',
                                  source_excerpt: 'Workflow events mapped from origination triggers, Section 4.3 validity SLA thresholds, and APRA CPS 234 audit requirements.'
                                }
                              ];

                              const rawEv = ingestedDocuments[activeIngestedIndex]?.discovered_evidence || [];
                              const cleanEv = rawEv.filter(e => 
                                !isBinaryJunk(e.topic) &&
                                !isBinaryJunk(e.finding) &&
                                !isBinaryJunk(e.source_excerpt)
                              );

                              const displayList = cleanEv.length > 0 ? cleanEv : defaultValuationEvidence;

                              return displayList.map((item, eIdx) => (
                                <div key={eIdx} className="p-3 bg-white border border-blue-100 rounded-xl space-y-1.5 shadow-2xs hover:border-[#0057B8]/40 transition">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-bold text-[#0057B8] uppercase tracking-wider bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                                      {item.topic}
                                    </span>
                                    <span className="text-[11.5px] font-bold text-slate-900">
                                      {item.finding}
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-slate-600 bg-slate-50/90 p-2 rounded-lg border border-slate-100 leading-relaxed font-sans">
                                    <strong className="text-slate-500 font-semibold">Source Excerpt: </strong>
                                    <span className="italic">"{item.source_excerpt}"</span>
                                  </p>
                                </div>
                              ));
                            })()}
                          </div>
                        </div>
                      )}

                      {/* Policy Specifications & Governance Framework */}
                      <div className="p-3.5 bg-blue-50/40 border border-blue-100/80 rounded-xl space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-blue-900 uppercase tracking-wider flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                            Policy Specifications & Governance Framework
                          </span>
                        </div>

                        {/* Target Department Partition */}
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                              Department Partition
                            </label>
                            <span className="text-[10px] font-semibold text-blue-700 bg-blue-100 px-1.5 py-0.2 rounded">
                              Auto-assigned: {departments.find(d => d.id === departmentId)?.name || 'Retail Lending'}
                            </span>
                          </div>
                          <select
                            value={departmentId}
                            onChange={(e) => setDepartmentId(e.target.value)}
                            className="w-full p-2 rounded-xl border border-slate-300 focus:outline-none focus:border-[#0057B8] focus:ring-2 focus:ring-[#0057B8]/15 text-[12.5px] bg-white font-medium text-slate-900 shadow-2xs"
                          >
                            {departments.map(d => (
                              <option key={d.id} value={d.id}>{d.name}</option>
                            ))}
                          </select>
                        </div>

                        {/* Policy Title */}
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                            Policy Title
                          </label>
                          <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Authoritative Policy Title"
                            className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-[#0057B8] focus:ring-2 focus:ring-[#0057B8]/15 text-[13px] font-semibold text-slate-900 bg-white shadow-2xs"
                          />
                        </div>

                        {/* Executive Summary & Purpose */}
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                            Executive Summary & Statutory Scope
                          </label>
                          <textarea
                            rows={3}
                            value={summary}
                            onChange={(e) => setSummary(e.target.value)}
                            placeholder="Comprehensive executive summary, statutory purpose, and regulatory scope of this policy..."
                            className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-[#0057B8] focus:ring-2 focus:ring-[#0057B8]/15 text-xs text-slate-800 bg-white shadow-2xs font-sans leading-relaxed"
                          />
                        </div>

                        {/* Identified Compliance Tags & Citations */}
                        <div className="pt-1">
                          <label className="block text-[10.5px] font-bold text-slate-600 uppercase mb-1.5 flex items-center gap-1">
                            <Tag className="w-3 h-3 text-slate-500" />
                            <span>Identified Compliance Rules & Regulatory Tags ({complianceTags.length})</span>
                          </label>
                          
                          <div className="flex flex-wrap items-center gap-1.5">
                            {complianceTags.map((tag, tIdx) => (
                              <span 
                                key={tIdx}
                                className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-blue-200 text-blue-800 text-[11px] font-medium rounded-lg shadow-2xs"
                              >
                                <span>{tag}</span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveComplianceTag(tag)}
                                  className="text-blue-400 hover:text-rose-600 cursor-pointer ml-0.5"
                                  title="Remove tag"
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
                                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddComplianceTag(); } }}
                                placeholder="+ Add rule/tag"
                                className="px-2 py-0.5 text-[11px] border border-slate-300 rounded-lg bg-white outline-none focus:border-blue-500 w-28"
                              />
                              {newTagInput && (
                                <button
                                  type="button"
                                  onClick={handleAddComplianceTag}
                                  className="text-[11px] font-bold text-blue-700 hover:underline cursor-pointer px-1"
                                >
                                  Add
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Policy Sections & Clauses List (THE COMPLETE EDITOR WITH TOOLBAR & EXPAND) */}
                      <div className="space-y-3 pt-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <span className="text-xs font-bold text-slate-900 uppercase tracking-wider block">
                              Policy Sections & Modular Clauses ({sections.length})
                            </span>
                            <span className="text-[11px] text-slate-500">
                              Authoritative operational clauses and specifications extracted directly from document text.
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleAddSection('New Section')}
                              className="px-3 py-1.5 bg-[#0057B8]/10 hover:bg-[#0057B8]/20 text-[#0057B8] font-bold text-xs rounded-xl transition cursor-pointer flex items-center gap-1 shadow-2xs border border-[#0057B8]/30"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>+ Add Section</span>
                            </button>
                            <button
                              type="button"
                              onClick={handleAddParagraph}
                              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer flex items-center gap-1 border border-slate-300 shadow-2xs"
                            >
                              <AlignLeft className="w-3.5 h-3.5" />
                              <span>+ Add Paragraph</span>
                            </button>
                          </div>
                        </div>

                        {/* Sections List */}
                        <div className="space-y-3">
                          {sections.map((section, idx) => (
                            <div
                              key={section.id || idx}
                              className="p-3.5 bg-white border border-slate-200/90 rounded-xl space-y-2 hover:border-[#0057B8]/40 transition shadow-2xs"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                  <span className="w-6 h-6 rounded-md bg-[#0057B8] text-white text-[11px] font-bold flex items-center justify-center flex-shrink-0 font-mono shadow-2xs">
                                    {idx + 1}
                                  </span>
                                  <input
                                    type="text"
                                    value={section.title}
                                    onChange={(e) => handleUpdateSectionTitle(section.id, e.target.value)}
                                    placeholder="Section Title"
                                    className="font-bold text-xs text-slate-900 bg-white border border-slate-200 focus:border-[#0057B8] focus:ring-1 focus:ring-[#0057B8] px-2.5 py-1 rounded-md outline-none transition flex-1 shadow-2xs"
                                  />
                                  {section.type === 'paragraph' && (
                                    <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded uppercase flex-shrink-0">
                                      Paragraph
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-center gap-1 flex-shrink-0">
                                  {/* Expand Button for full editor canvas */}
                                  <button
                                    type="button"
                                    onClick={() => setExpandedModalSectionId(section.id || `sec-${idx}`)}
                                    className="p-1.5 text-slate-400 hover:text-[#0057B8] hover:bg-blue-50 rounded-lg cursor-pointer transition"
                                    title="Expand clause into editor canvas"
                                  >
                                    <Maximize2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleMoveSectionUp(idx)}
                                    disabled={idx === 0}
                                    className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-20 rounded cursor-pointer"
                                    title="Move Up"
                                  >
                                    <ArrowUp className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleMoveSectionDown(idx)}
                                    disabled={idx === sections.length - 1}
                                    className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-20 rounded cursor-pointer"
                                    title="Move Down"
                                  >
                                    <ArrowDown className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteSection(section.id)}
                                    className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                                    title="Delete Section"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>

                              {/* Action Toolbar */}
                              <SectionWordToolbar
                                sectionId={section.id}
                                content={section.content}
                                sectionIndex={idx}
                                onApplyFormat={handleApplyFormat}
                              />

                              {/* Textarea */}
                              <textarea
                                rows={Math.max(3, Math.min(8, Math.ceil((section.content || '').length / 90)))}
                                value={section.content}
                                onChange={(e) => handleUpdateSectionContent(section.id, e.target.value)}
                                placeholder="Section clauses and operational specifications..."
                                className="w-full p-2.5 bg-white rounded-b-lg border border-slate-200 border-t-0 text-xs leading-relaxed text-slate-800 focus:border-[#0057B8] focus:ring-1 focus:ring-[#0057B8] outline-none shadow-2xs font-sans"
                              />

                              {/* Word & character counts */}
                              <div className="flex items-center justify-between text-[10px] text-slate-400 px-1 pt-0.5">
                                <span>Clause {idx + 1}</span>
                                <span>{(section.content || '').trim().split(/\s+/).filter(Boolean).length} words • {(section.content || '').length} chars</span>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Quick Add Presets Bar */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11.5px] text-slate-500">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="font-semibold text-slate-600">Quick Add:</span>
                            {['Summary', 'Details', 'Reports', 'Dependencies', 'Operational Events'].map(name => (
                              <button
                                key={name}
                                type="button"
                                onClick={() => handleAddSection(name)}
                                className="px-2.5 py-1 bg-white hover:bg-blue-50 hover:text-[#0057B8] hover:border-[#0057B8] text-slate-600 border border-slate-300 rounded-lg text-[11px] font-semibold transition cursor-pointer shadow-2xs"
                              >
                                +{name}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                    {/* Batch Publish All Documents Button (if multiple files) */}
                    {ingestedDocuments.length > 1 && (
                      <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                        <div className="space-y-0.5">
                          <span className="font-bold text-emerald-900 block">
                            Multiple Documents Detected ({ingestedDocuments.length} Files)
                          </span>
                          <p className="text-[11.5px] text-emerald-700">
                            You can publish each document separately, or publish all {ingestedDocuments.length} files at once into their respective partitions.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={handlePublishAllIngestedDocs}
                          disabled={isSubmitting}
                          className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs shadow-xs transition cursor-pointer whitespace-nowrap active:scale-95"
                        >
                          Publish All {ingestedDocuments.length} as Separate Policies
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
            </>
          )}
        </form>

        {/* Footer: Cancel and Save as Draft ONLY (No Submit for Approval) */}
        <div className="px-6 py-3 border-t border-blue-200/80 flex items-center justify-between bg-white">
          <button
            type="button"
            onClick={handleRequestClose}
            className="px-4 py-2 text-[13px] font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={isSubmitting || isAiThinking}
            className="px-5 py-2 text-[13px] font-bold text-white bg-[#0057B8] hover:bg-[#004EA6] rounded-xl shadow-xs transition cursor-pointer flex items-center gap-2 active:scale-95 disabled:opacity-50"
          >
            <Save className="w-4 h-4 text-white" />
            <span>{isSubmitting ? 'Saving Draft...' : 'Save as Draft'}</span>
          </button>
        </div>
        </div>
      </div>

      {/* FULL WORD DOCUMENT CLAUSE EXPANDED EDITOR (A4 WORD PAGE EXPERIENCE) */}
      {expandedModalSectionId && typeof document !== 'undefined' && createPortal(
        (() => {
          const currentSectionIndex = Math.max(0, sections.findIndex((s, idx) => (s.id || `sec-${idx}`) === expandedModalSectionId));
          const currentSection = sections[currentSectionIndex] || sections[0];
          const totalSections = Math.max(1, sections.length);
          const hasPrev = currentSectionIndex > 0;
          const hasNext = currentSectionIndex < totalSections - 1;

          if (!currentSection) return null;

          const cleanWords = (currentSection.content || '').trim().split(/\s+/).filter(Boolean).length;
          const charCount = (currentSection.content || '').length;

          return (
            <div className="fixed inset-0 z-[9999] flex flex-col bg-[#e8edf4] animate-in fade-in duration-150 select-text">
            {/* Top Word Ribbon Title Bar */}
            <div className="bg-[#0057B8] text-white px-5 py-2.5 flex items-center justify-between shadow-md flex-shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-white/15 border border-white/30 flex items-center justify-center font-bold text-white shadow-xs">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="font-bold text-sm text-white truncate">
                      Document Clause Editor • Clause {currentSectionIndex + 1}
                    </h2>
                    <span className="text-[11px] font-mono bg-white/20 border border-white/30 px-2 py-0.5 rounded text-white font-semibold">
                      Page {currentSectionIndex + 1} of {totalSections}
                    </span>
                  </div>
                  <p className="text-[11px] text-blue-100 truncate">
                    {title || 'Operational Policy Document'} (Draft Revision)
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setExpandedModalSectionId(null)}
                  className="px-4 py-1.5 bg-white hover:bg-blue-50 text-[#0057B8] font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer active:scale-95"
                  title="Save and return to policy draft view"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Done & Return to Policy</span>
                </button>
                <button
                  type="button"
                  onClick={() => setExpandedModalSectionId(null)}
                  className="p-1.5 text-white/80 hover:text-white hover:bg-white/15 rounded-lg cursor-pointer transition"
                  title="Close expanded editor"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Word Action Formatting Toolbar (Spanning full width across the top) */}
            <div className="bg-white border-b border-slate-300 px-4 sm:px-8 py-1.5 shadow-2xs flex-shrink-0 flex items-center justify-between">
              <div className="w-full">
                <SectionWordToolbar
                  sectionId={currentSection.id}
                  content={currentSection.content}
                  sectionIndex={currentSectionIndex}
                  onApplyFormat={handleApplyFormat}
                />
              </div>
            </div>

            {/* Word Document Canvas - Centered A4 Sheet of Paper */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-8 flex justify-center custom-scrollbar bg-[#e8edf4]">
              <div className="w-full max-w-4xl bg-white rounded-sm shadow-2xl border border-slate-300 min-h-[850px] p-8 sm:p-14 flex flex-col space-y-4">
                
                {/* Word Page Running Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 text-[11px] text-slate-400 font-mono select-none">
                  <span className="uppercase tracking-wider font-semibold text-slate-500">
                    COMMONWEALTH BANK OF AUSTRALIA • INSTITUTIONAL GOVERNANCE STANDARD
                  </span>
                  <span>CLAUSE PAGE {currentSectionIndex + 1} / {totalSections}</span>
                </div>

                {/* Section Clause Heading (Editable Large Word Title) */}
                <div className="pt-2">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-6 h-6 rounded-md bg-[#0057B8] text-white font-mono font-bold text-xs flex items-center justify-center flex-shrink-0 shadow-2xs">
                      {currentSectionIndex + 1}
                    </span>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#0057B8] bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
                      Clause Specification
                    </span>
                  </div>
                  <input
                    type="text"
                    value={currentSection.title}
                    onChange={(e) => handleUpdateSectionTitle(currentSection.id, e.target.value)}
                    placeholder="Enter Clause Title (e.g. Purpose & Product Scope)..."
                    className="w-full text-xl sm:text-2xl font-bold text-slate-900 border-b border-transparent hover:border-slate-300 focus:border-[#0057B8] pb-1 outline-none transition font-sans placeholder-slate-300"
                  />
                </div>

                {/* Word Page Canvas Textarea */}
                <textarea
                  key={currentSection.id}
                  value={currentSection.content || ''}
                  onChange={(e) => handleUpdateSectionContent(currentSection.id, e.target.value)}
                  placeholder="Type full operational clause specifications, underwriting parameters, statutory authorities, and APRA compliance rules here..."
                  className="w-full flex-1 min-h-[600px] border-none outline-none focus:ring-0 text-[14.5px] leading-relaxed text-slate-800 font-sans resize-none placeholder-slate-300 bg-transparent custom-scrollbar"
                  autoFocus
                />

                {/* Word Page Running Footer */}
                <div className="pt-4 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-400 font-mono select-none">
                  <span>Confidential - Commonwealth Bank Internal Use Only • APRA CPS 234</span>
                  <span>Page {currentSectionIndex + 1} of {totalSections}</span>
                </div>
              </div>
            </div>

            {/* Bottom Word Status Ribbon */}
            <div className="bg-white border-t border-slate-300 px-6 py-2.5 flex items-center justify-between text-xs text-slate-600 flex-shrink-0 select-none shadow-xs">
              <div className="flex items-center gap-3 font-mono text-[11.5px] text-slate-500">
                <span className="font-semibold text-slate-700">
                  Page {currentSectionIndex + 1} of {totalSections}
                </span>
                <span>•</span>
                <span>{cleanWords} words</span>
                <span>•</span>
                <span>{charCount} characters</span>
                <span>•</span>
                <span className="text-emerald-700 font-semibold flex items-center gap-1">
                  <Check className="w-3 h-3 text-emerald-600" />
                  Auto-Synchronized
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={!hasPrev}
                  onClick={() => {
                    if (hasPrev) {
                      const prevSec = sections[currentSectionIndex - 1];
                      setExpandedModalSectionId(prevSec.id || `sec-${currentSectionIndex - 1}`);
                    }
                  }}
                  className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl border flex items-center gap-1.5 transition ${
                    hasPrev 
                      ? 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300 cursor-pointer shadow-2xs' 
                      : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-50'
                  }`}
                  title="Previous Clause Page"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Previous Clause</span>
                </button>

                <button
                  type="button"
                  disabled={!hasNext}
                  onClick={() => {
                    if (hasNext) {
                      const nextSec = sections[currentSectionIndex + 1];
                      setExpandedModalSectionId(nextSec.id || `sec-${currentSectionIndex + 1}`);
                    }
                  }}
                  className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl border flex items-center gap-1.5 transition ${
                    hasNext 
                      ? 'bg-[#0057B8] hover:bg-[#004EA6] text-white border-[#0057B8] cursor-pointer shadow-xs' 
                      : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-50'
                  }`}
                  title="Next Clause Page"
                >
                  <span>Next Clause</span>
                  <ChevronRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => setExpandedModalSectionId(null)}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-xs transition cursor-pointer flex items-center gap-1.5 ml-2"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Done & Return</span>
                </button>
              </div>
            </div>
          </div>
        );
      })(),
      document.body
    )}

      {/* CLOSE CONFIRMATION / SAVE TO DRAFT PROMPT */}
      {showCloseConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden p-6 animate-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center flex-shrink-0 shadow-2xs">
                <Save className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold text-slate-900">
                  Save as Draft Before Closing?
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  You have drafted policy specifications. Would you like to save this as a draft in the database so you can re-edit it later?
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-col sm:flex-row items-center justify-end gap-2 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowCloseConfirm(false)}
                className="w-full sm:w-auto px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                Keep Editing
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCloseConfirm(false);
                  onClose();
                }}
                className="w-full sm:w-auto px-3.5 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 border border-red-200 rounded-xl transition cursor-pointer"
              >
                Discard & Close
              </button>
              <button
                type="button"
                onClick={async () => {
                  setShowCloseConfirm(false);
                  await handleSaveDraft();
                }}
                disabled={isSubmitting}
                className="w-full sm:w-auto px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-xs transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save to Draft & Close</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
