import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
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
  ArrowLeftRight,
  ExternalLink,
  Clock,
  Plus,
  Layers,
  Tag,
  Maximize2,
  Minimize2,
  Save,
  Info,
  FileEdit,
  Image as ImageIcon,
  StickyNote,
  FilePlus2,
  PanelTop,
  ZoomIn,
  ZoomOut,
  Copy
} from 'lucide-react';
import { apiService } from '../../../services/apiService';
import MultiPageDocumentEditor from '../../../editor/MultiPageDocumentEditor';
import { SectionRichEditor } from './SectionRichEditor';
import { normalizeRichHtml, htmlToPlainText } from '../../../utils/richContentConverter';
import DocumentUploadHistorySection from '../../documents/DocumentUploadHistorySection';
import BrowserDocumentViewer from '../../documents/BrowserDocumentViewer';
import { uploadDocumentToCloudinary } from '../../../services/cloudinaryService';
import {
  extractDocxStructuredContent,
  ensureRichAssetsInSections,
} from '../../../utils/docxBrowserRenderer';

import { POLICY_TEMPLATES } from './policyTemplates';
export default function AddPolicyModal({
  isOpen,
  onClose,
  preselectedDepartmentId,
  preselectedDepartmentName,
  departments = [],
  currentUser,
  onPolicyCreated,
  editingPolicy = null,
  initialCreationMode = 'direct',
  masterPolicies = []
}) {
  const navigate = useNavigate();
  // 3 Policy Creation Modes: 'direct' | 'library' | 'upload'
  const [creationMode, setCreationMode] = useState('direct');
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);

  // Direct In-System Template Selection State
  const [selectedDirectTemplateId, setSelectedDirectTemplateId] = useState('template-01-pdf');
  const [activeTemplateInfoId, setActiveTemplateInfoId] = useState(null);
  const [expandedSectionId, setExpandedSectionId] = useState(null);
  const [expandedModalSectionId, setExpandedModalSectionId] = useState(null);
  const [activeExpandedIndex, setActiveExpandedIndex] = useState(0);
  const multiPageEditorRef = useRef(null);

  useEffect(() => {
    if (!expandedModalSectionId) return;
    const idx = sections.findIndex((s, i) => (s.id || `sec-${i}`) === expandedModalSectionId);
    if (idx >= 0) {
      setActiveExpandedIndex(idx);
    }
    // Only initialize index when modal opens so scrolling doesn't reset
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expandedModalSectionId]);
  const [dynamicTemplates, setDynamicTemplates] = useState(POLICY_TEMPLATES);
  const [selectedTemplatePhases, setSelectedTemplatePhases] = useState([]);

  // Form Fields & Editing States
  const [departmentId, setDepartmentId] = useState(preselectedDepartmentId || departments[0]?.id || 'company-policies');
  const [editingDraftId, setEditingDraftId] = useState(null);
  const [editingDraftVersion, setEditingDraftVersion] = useState('1.0');
  const [editingDraftVersionsHistory, setEditingDraftVersionsHistory] = useState([]);
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('Short description of the policy');
  const [content, setContent] = useState('');
  const [turnaroundSla, setTurnaroundSla] = useState('4 Hours');
  const [dailyLimit, setDailyLimit] = useState('$25,000 AUD');
  const [officerCap, setOfficerCap] = useState('$100,000 AUD');
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [uploadedPdfPreviewUrl, setUploadedPdfPreviewUrl] = useState(null);
  const [uploadedDocRawText, setUploadedDocRawText] = useState('');
  const [isTemplateEditorActive, setIsTemplateEditorActive] = useState(false);
  const [selectedUploadTemplateId, setSelectedUploadTemplateId] = useState('');
  const [extractedImages, setExtractedImages] = useState([]);
  const [activeSectionId, setActiveSectionId] = useState(null);
  const [complianceTags, setComplianceTags] = useState([]);
  const [newTagInput, setNewTagInput] = useState('');
  const [masterSearchQuery, setMasterSearchQuery] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState('template-standard-policy');
  const [liveMasterPolicies, setLiveMasterPolicies] = useState([]);
  const [selectedLibraryTemplateId, setSelectedLibraryTemplateId] = useState('template-standard-policy');
  const [masterDeptFilter, setMasterDeptFilter] = useState('all');
  const [copiedFromSourcePolicy, setCopiedFromSourcePolicy] = useState(null);
  const [ingestedDocuments, setIngestedDocuments] = useState([]);
  const [activeIngestedIndex, setActiveIngestedIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showPageHeaderFooter, setShowPageHeaderFooter] = useState(true);
  const [pageMarginPreset, setPageMarginPreset] = useState('normal'); // 'normal' | 'narrow' | 'wide'
  const [editorZoomLevel, setEditorZoomLevel] = useState(100);

  // 7 Core Institutional Template Sections from Template_policy.docx
  const [sections, setSections] = useState([
    {
      id: 'sec-purpose',
      title: 'Purpose',
      content: 'Purpose statement of the policy',
      type: 'section',
      isTemplateSection: true
    },
    {
      id: 'sec-scope',
      title: 'Scope/Coverage',
      content: 'Applicability of the policy. It can be based on lines of business, geographical restrictions, customer segmentation etc',
      type: 'section',
      isTemplateSection: true
    },
    {
      id: 'sec-details',
      title: 'Details/Description',
      content: 'Details of the policy is described in this section. It can cover multiple sections, tables, images',
      type: 'section',
      isTemplateSection: true
    },
    {
      id: 'sec-dependencies',
      title: 'Pre-requisites /Dependencies',
      content: 'Explain cross references to the policies',
      type: 'section',
      isTemplateSection: true
    },
    {
      id: 'sec-controls',
      title: 'Controls',
      content: 'This section describes key monitoring requirements. It can have a sub section for data quality',
      type: 'section',
      isTemplateSection: true
    },
    {
      id: 'sec-reporting',
      title: 'Reporting',
      content: 'Define key metrics for continuous monitoring activities. It also defines the report layout, refer to the report id.',
      type: 'section',
      isTemplateSection: true
    },
    {
      id: 'sec-approval-chain',
      title: 'Approval Chain',
      content: 'Provide the approval chain of this policy',
      type: 'section',
      isTemplateSection: true
    }
  ]);

  // Fetch dynamic starter templates & active Master Library policies whenever modal opens
  useEffect(() => {
    if (isOpen) {
      apiService.getTemplates()
        .then((dbTpls) => {
          if (Array.isArray(dbTpls) && dbTpls.length > 0) {
            const formatted = dbTpls.map((t, idx) => ({
              id: t.id,
              name: t.name || (t.id === 'template-standard-policy' || t.id === 'template-01-pdf' ? 'Policy Template' : `Template ${idx + 1}`),
              title: t.title || (t.id === 'template-standard-policy' || t.id === 'template-01-pdf' ? 'Policy Title' : 'Operational Standard'),
              dept: t.department_id || 'company-policies',
              sla: t.sla || '4 Hours',
              daily: t.daily_limit || '$25,000 AUD',
              cap: t.officer_cap || '$100,000 AUD',
              summary: t.summary || '',
              sections: typeof t.sections === 'string' ? JSON.parse(t.sections) : (t.sections || []),
              phases: typeof t.phases === 'string' ? JSON.parse(t.phases) : (t.phases || [])
            }));
            const standardTpl = POLICY_TEMPLATES[0];
            const nonStandard = formatted.filter(t => t.id !== 'template-standard-policy' && t.id !== 'template-01-pdf');
            setDynamicTemplates([standardTpl, ...nonStandard]);
          }
        })
        .catch((err) => console.warn('Could not load dynamic templates from DB:', err));

      apiService.getPolicies({ status: 'active' })
        .then((pols) => {
          if (Array.isArray(pols)) {
            setLiveMasterPolicies(pols.filter((p) => p && p.status === 'active'));
          }
        })
        .catch(() => {});
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

  // Synchronize fields when editing an existing policy / draft or creating fresh
  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;

    const applyPolicyToForm = (pol) => {
      if (!pol) return;
      setEditingDraftId(pol.id || null);
      setTitle(pol.title || '');
      setSummary(pol.summary || '');
      setContent(pol.content || '');
      if (pol.department_id || pol.deptId) {
        setDepartmentId(pol.department_id || pol.deptId);
      }
      const params = typeof pol.parameters === 'string'
        ? JSON.parse(pol.parameters || '{}')
        : (pol.parameters || {});
      setEditingDraftVersion(String(pol.version || params.version || '1.0').replace(/^v/i, ''));
      const initialHistory =
        Array.isArray(pol.versions) && pol.versions.length > 0
          ? pol.versions
          : Array.isArray(params.versions)
            ? params.versions
            : [];
      setEditingDraftVersionsHistory(initialHistory);

      setTurnaroundSla(params.turnaround_sla || pol.turnaroundSla || '4 Hours');
      setDailyLimit(params.daily_limit || pol.dailyLimit || '$25,000 AUD');
      setOfficerCap(params.approval_limits?.officer_cap || pol.officerCap || '$100,000 AUD');

      let loadedSections = [];
      if (params.sections && Array.isArray(params.sections) && params.sections.length > 0) {
        loadedSections = params.sections.map((sec, idx) => ({
          ...sec,
          id: sec.id ? String(sec.id) : `sec-${idx}-${Date.now()}`
        }));
      } else if (pol.content && typeof pol.content === 'string' && pol.content.trim()) {
        const raw = pol.content.trim();
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
            { id: `sec-summary-${Date.now()}`, title: 'Summary', content: pol.summary || 'Summary of operational intent.', type: 'section' },
            { id: `sec-details-${Date.now()}`, title: 'Details', content: raw, type: 'section' }
          ];
        }
      }

      if (!loadedSections || loadedSections.length === 0) {
        loadedSections = JSON.parse(JSON.stringify(POLICY_TEMPLATES[0].sections));
      }

      setSections(loadedSections);
      setExtractedImages(Array.isArray(params.extracted_images) ? params.extracted_images : []);
      setUploadedFileName(params.source_file_name || '');
      setUploadedPdfPreviewUrl(params.source_file_url || null);
      setIngestedDocuments([]);
      setActiveIngestedIndex(0);
      setIsTemplateEditorActive(false);
      setCreationMode('direct');
    };

    if (editingPolicy) {
      applyPolicyToForm(editingPolicy);
      const initialParams = typeof editingPolicy.parameters === 'string'
        ? JSON.parse(editingPolicy.parameters || '{}')
        : (editingPolicy.parameters || {});
      const hasRichSections = Array.isArray(initialParams.sections) && initialParams.sections.length > 0;
      if (editingPolicy.id && !hasRichSections && !String(editingPolicy.id).startsWith('draft-clone-')) {
        apiService.getPolicyDetails(editingPolicy.id, currentUser?.roleType || 'employee')
          .then((full) => {
            if (!cancelled && full) {
              applyPolicyToForm(full);
            }
          })
          .catch(() => {});
      }
      if (editingPolicy.id && !String(editingPolicy.id).startsWith('draft-clone-')) {
        apiService.getPolicyVersions(editingPolicy.id)
          .then((vers) => {
            if (!cancelled && Array.isArray(vers) && vers.length > 0) {
              setEditingDraftVersionsHistory((prev) => (prev.length >= vers.length ? prev : vers));
            }
          })
          .catch(() => {});
      }
    } else {
      // Fresh policy creation flow - reset transient draft/upload states and initialize to Template 1
      const tpl = POLICY_TEMPLATES[0];
      setEditingDraftId(null);
      setEditingDraftVersion('1.0');
      setEditingDraftVersionsHistory([]);
      setCopiedFromSourcePolicy(null);
      setCreationMode(initialCreationMode || 'direct');
      setMasterDeptFilter('all');
      setMasterSearchQuery('');
      setSelectedLibraryTemplateId('template-standard-policy');
      setSelectedDirectTemplateId(tpl.id);
      setSelectedUploadTemplateId('');
      setTitle('');
      setContent('');
      setSummary(tpl.summary);
      setTurnaroundSla(tpl.sla);
      setDailyLimit(tpl.daily);
      setOfficerCap(tpl.cap);
      setUploadedFileName('');
      setUploadedPdfPreviewUrl(null);
      setUploadedDocRawText('');
      setExtractedImages([]);
      setIngestedDocuments([]);
      setActiveIngestedIndex(0);
      setIsTemplateEditorActive(false);
      const initialTplSections = (tpl.sections || []).map((sec, idx) => ({
        ...sec,
        id: sec.id || `sec-${idx}-${Date.now()}`,
        type: 'section',
        isTemplateSection: true,
        isCustom: false
      }));
      setSections(initialTplSections);
      setSelectedTemplatePhases([]);
      if (preselectedDepartmentId) {
        setDepartmentId(preselectedDepartmentId);
      } else if (departments.length > 0) {
        setDepartmentId(departments[0].id);
      }
    }

    return () => {
      cancelled = true;
    };
  }, [isOpen, editingPolicy, initialCreationMode]);

  // Keep uploaded document sections synced with any inline/fullscreen edits
  useEffect(() => {
    if (creationMode !== 'upload' || ingestedDocuments.length === 0) return;
    setIngestedDocuments(prev => {
      const active = prev[activeIngestedIndex];
      if (!active || active.sections === sections) return prev;
      return prev.map((d, dIdx) => (dIdx === activeIngestedIndex ? { ...d, sections } : d));
    });
  }, [sections, creationMode, activeIngestedIndex]);

  const handleUpdateSectionTitle = (id, newTitle) => {
    setSections(prev => prev.map((s, idx) => {
      const match = (s.id === id) || ((s.id || `sec-${idx}`) === id) || (String(idx) === String(id));
      return match ? { ...s, title: newTitle } : s;
    }));
  };

  const handleUpdateSectionContent = (id, newContent) => {
    setSections(prev => prev.map((s, idx) => {
      const match = (s.id === id) || ((s.id || `sec-${idx}`) === id) || (String(idx) === String(id));
      return match ? { ...s, content: newContent } : s;
    }));
  };

  const handleUpdateSectionField = (id, field, val) => {
    setSections(prev => prev.map((s, idx) => {
      const match = (s.id === id) || ((s.id || `sec-${idx}`) === id) || (String(idx) === String(id));
      return match ? { ...s, [field]: val } : s;
    }));
  };

  const flushFullscreenEditorSections = () => {
    const flushedMap = multiPageEditorRef.current?.flushAllPages?.() || {};
    const keys = Object.keys(flushedMap);
    if (keys.length === 0) return sections;

    const mergedSections = sections.map((sec, idx) => {
      const key = sec.id || `sec-${idx}`;
      if (Object.prototype.hasOwnProperty.call(flushedMap, key)) {
        return { ...sec, content: flushedMap[key] };
      }
      return sec;
    });

    setSections(mergedSections);
    if (ingestedDocuments.length > 0) {
      setIngestedDocuments(prev => prev.map((doc, dIdx) => (
        dIdx === activeIngestedIndex ? { ...doc, sections: mergedSections } : doc
      )));
    }
    return mergedSections;
  };

  const handleCloseExpandedEditor = () => {
    flushFullscreenEditorSections();
    setExpandedModalSectionId(null);
  };

  const handleAddAndOpenPage = (customTitle) => {
    const nextNum = sections.length + 1;
    const newSec = {
      id: `sec-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title: customTitle || `Clause Page ${nextNum}`,
      content: '',
      type: 'section',
      isTemplateSection: false,
      isCustom: true
    };
    setSections(prev => [...prev, newSec]);
    if (!expandedModalSectionId) {
      setActiveExpandedIndex(sections.length);
      setExpandedModalSectionId(newSec.id);
    }
  };

  const handleApplyFormat = (sectionId, formatKey) => {
    const activeEl = document.activeElement;
    const isTextarea = activeEl && activeEl.tagName === 'TEXTAREA';
    const hasSelection = isTextarea && activeEl.selectionStart !== activeEl.selectionEnd;

    setSections(prev => prev.map((sec, idx) => {
      const effectiveId = sec.id || `sec-${idx}`;
      if (sec.id !== sectionId && effectiveId !== sectionId && String(idx) !== String(sectionId)) return sec;
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
    setSections(prev => prev.filter((s, idx) => s.id !== id && (s.id || `sec-${idx}`) !== id && String(idx) !== String(id)));
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
      type: 'section',
      isTemplateSection: false,
      isCustom: true
    };
    setSections(prev => [...prev, newSec]);
  };

  const handleSelectDirectTemplate = (template) => {
    if (!template) return;
    setSelectedDirectTemplateId(template.id);
    const isStandard = template.id === 'template-standard-policy' || template.id === 'template-01-pdf';
    setTitle(isStandard ? '' : (template.title || ''));
    setSummary(template.summary || 'Short description of the policy');
    setTurnaroundSla(template.sla || '4 Hours');
    setDailyLimit(template.daily || '$25,000 AUD');
    setOfficerCap(template.cap || '$100,000 AUD');
    const tplSections = (template.sections || []).map((sec, idx) => ({
      ...sec,
      id: sec.id || `sec-${idx}-${Date.now()}`,
      type: 'section',
      isTemplateSection: true,
      isCustom: false
    }));
    setSections(tplSections);
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
    const currentSections = flushFullscreenEditorSections();

    let finalContent = '';
    if (currentSections.length > 0) {
      finalContent = currentSections.map((sec, idx) => {
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
      const paramVersions = Array.isArray(existingParams.versions) ? existingParams.versions : [];
      const policyVersions = Array.isArray(editingPolicy?.versions) ? editingPolicy.versions : [];
      const mergedPriorVersions = [];
      const seenVerKeys = new Set();
      [...editingDraftVersionsHistory, ...paramVersions, ...policyVersions].forEach((v) => {
        if (!v) return;
        const verNum = String(v.version_number || v.version || '').replace(/^v/i, '');
        const key = `${v.source || ''}|${verNum}|${v.created_at || v.timestamp || ''}`;
        if (!seenVerKeys.has(key)) {
          seenVerKeys.add(key);
          mergedPriorVersions.push(v);
        }
      });

      const currentVerStr = editingDraftVersion || editingPolicy?.version || existingParams.version || '1.0';
      const numVer = parseFloat(String(currentVerStr).replace(/[^0-9.]/g, '')) || 1.0;
      const nextVer = editingDraftId ? `${(numVer + 0.1).toFixed(1)}` : '1.0';
      const nowIso = new Date().toISOString();

      const newVersionSnapshot = {
        id: `draft-rev-${nextVer}-${Date.now()}`,
        version: nextVer,
        version_number: nextVer,
        version_author: currentUser?.name || 'Bank Staff',
        author: currentUser?.name || 'Bank Staff',
        changed_by: currentUser?.name || 'Bank Staff',
        title: draftTitle,
        summary: summary.trim() || draftTitle,
        content: finalContent,
        sections: currentSections.map(s => ({ ...s })),
        turnaround_sla: turnaroundSla,
        daily_limit: dailyLimit,
        timestamp: nowIso,
        created_at: nowIso,
        notes: editingDraftId
          ? `Draft revision saved with ${currentSections.length} clauses (${turnaroundSla} SLA, ${dailyLimit} Daily Limit)`
          : `Initial draft baseline created with ${currentSections.length} clauses`,
        change_summary: editingDraftId
          ? `Draft revision saved with ${currentSections.length} clauses (${turnaroundSla} SLA, ${dailyLimit} Daily Limit)`
          : `Initial draft baseline created with ${currentSections.length} clauses`,
        source: 'draft_revision',
        status_tag: 'draft'
      };

      const baselineVersion = {
        id: `draft-base-${editingDraftId || Date.now()}`,
        version: '1.0',
        version_number: '1.0',
        version_author: editingPolicy?.created_by || currentUser?.name || 'Bank Staff',
        author: editingPolicy?.created_by || currentUser?.name || 'Bank Staff',
        changed_by: editingPolicy?.created_by || currentUser?.name || 'Bank Staff',
        title: editingPolicy?.title || draftTitle,
        summary: editingPolicy?.summary || summary.trim() || draftTitle,
        content: editingPolicy?.content || finalContent,
        sections: (existingParams.sections || currentSections).map(s => ({ ...s })),
        turnaround_sla: existingParams.turnaround_sla || turnaroundSla,
        daily_limit: existingParams.daily_limit || dailyLimit,
        timestamp: editingPolicy?.created_at || nowIso,
        created_at: editingPolicy?.created_at || nowIso,
        notes: 'Initial draft baseline',
        change_summary: 'Initial draft baseline',
        source: 'draft_revision',
        status_tag: 'draft'
      };

      const allVersions = mergedPriorVersions.length > 0
        ? [newVersionSnapshot, ...mergedPriorVersions]
        : (editingDraftId ? [newVersionSnapshot, baselineVersion] : [newVersionSnapshot]);

      const activeIngested = ingestedDocuments[activeIngestedIndex];
      const persistentSourceUrl =
        activeIngested?.cloud_url ||
        (uploadedPdfPreviewUrl && !String(uploadedPdfPreviewUrl).startsWith('blob:') ? uploadedPdfPreviewUrl : '');

      const payload = {
        department_id: departmentId || 'company-policies',
        title: draftTitle,
        summary: summary.trim() || draftTitle,
        content: finalContent,
        parameters: {
          ...existingParams,
          ...(copiedFromSourcePolicy?.id && !existingParams.copied_from ? { copied_from: copiedFromSourcePolicy.id } : {}),
          turnaround_sla: turnaroundSla,
          daily_limit: dailyLimit,
          approval_limits: { officer_cap: officerCap },
          mandatory_dvs: true,
          sections: currentSections,
          extracted_images: extractedImages.slice(0, 24),
          source_file_name: uploadedFileName || activeIngested?.document_name || existingParams.source_file_name || '',
          source_file_url: persistentSourceUrl || existingParams.source_file_url || '',
          version: nextVer,
          versions: allVersions
        },
        created_by: editingPolicy?.created_by || currentUser?.name || 'Marcus Vance',
        creation_mode: creationMode,
        status: editingPolicy?.status === 'pending_approval' ? 'pending_approval' : 'draft',
        version: nextVer,
        user_role: currentUser?.roleType || 'employee',
        user_name: currentUser?.name || 'Marcus Vance'
      };

      let savedPolicy = null;
      if (editingDraftId) {
        try {
          const res = await apiService.updatePolicy(editingDraftId, payload);
          savedPolicy = res?.policy || res || { ...payload, id: editingDraftId };
          if (savedPolicy?.id) setEditingDraftId(savedPolicy.id);
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

      setEditingDraftVersion(nextVer);
      setEditingDraftVersionsHistory(Array.isArray(savedPolicy?.versions) ? savedPolicy.versions : allVersions);

      // Drafts belong exclusively in the policies table (status: 'draft') and are managed in Change Management.
      // They are not maker-checker approval requests until submitted for approval.

      // Persist approved/draft document on the current user
      try {
        const userDocRecord = {
          id: savedPolicy?.id || `doc-user-${Date.now()}`,
          policyId: savedPolicy?.id,
          title: draftTitle,
          version: nextVer,
          department_id: departmentId || 'company-policies',
          department_name: departments.find(d => d.id === departmentId)?.name || 'Company Policies',
          summary: summary.trim() || draftTitle,
          status: 'draft',
          user_id: currentUser?.id,
          user_name: currentUser?.name || 'Staff User',
          user_email: currentUser?.email,
          source_file_name: uploadedFileName,
          source_file_url: uploadedPdfPreviewUrl,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          sections: currentSections
        };
        const userKey = `liblist_approved_user_docs_${currentUser?.id || 'default'}`;
        const existing = JSON.parse(localStorage.getItem(userKey) || '[]');
        localStorage.setItem(userKey, JSON.stringify([userDocRecord, ...existing.filter(d => d.id !== userDocRecord.id)]));
      } catch (_) {}

      alert(`Policy draft "${draftTitle}" (${nextVer}) saved on user account successfully!`);
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
      (sections.length > 0 && sections.some(s => {
        const raw = s.content || '';
        return Boolean(htmlToPlainText(raw).trim()) || /<img\b/i.test(raw) || /<table\b/i.test(raw);
      }))
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
      setEditorZoomLevel(100);
      setActiveTemplateInfoId(null);
      setErrorMessage('');
      setShowCloseConfirm(false);
    }
  }, [isOpen]);

  // Master library templates
  const masterTemplates = [
    {
      id: 'template-standard-policy',
      name: 'Policy Template',
      title: 'Policy Template',
      dept: 'company-policies',
      deptName: 'Institutional Framework',
      sla: '4 Hours',
      cap: '$100,000 AUD',
      daily: '$25,000 AUD',
      summary: 'Short description of the policy',
      sections: [
        {
          id: 'tpl-sec-purpose',
          title: 'Purpose',
          content: 'Purpose statement of the policy',
          type: 'section',
          isTemplateSection: true
        },
        {
          id: 'tpl-sec-scope',
          title: 'Scope/Coverage',
          content: 'Applicability of the policy. It can be based on lines of business, geographical restrictions, customer segmentation etc',
          type: 'section',
          isTemplateSection: true
        },
        {
          id: 'tpl-sec-details',
          title: 'Details/Description',
          content: 'Details of the policy is described in this section. It can cover multiple sections, tables, images',
          type: 'section',
          isTemplateSection: true
        },
        {
          id: 'tpl-sec-dependencies',
          title: 'Pre-requisites /Dependencies',
          content: 'Explain cross references to the policies',
          type: 'section',
          isTemplateSection: true
        },
        {
          id: 'tpl-sec-controls',
          title: 'Controls',
          content: 'This section describes key monitoring requirements. It can have a sub section for data quality',
          type: 'section',
          isTemplateSection: true
        },
        {
          id: 'tpl-sec-reporting',
          title: 'Reporting',
          content: 'Define key metrics for continuous monitoring activities. It also defines the report layout, refer to the report id.',
          type: 'section',
          isTemplateSection: true
        },
        {
          id: 'tpl-sec-approval-chain',
          title: 'Approval Chain',
          content: 'Provide the approval chain of this policy',
          type: 'section',
          isTemplateSection: true
        }
      ]
    },
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
    setCopiedFromSourcePolicy(null);
    setSelectedTemplateId(template.id);
    setTitle(template.title || template.name || 'Operational Policy');
    setSummary(template.summary || '');
    setContent(template.content || '');
    setTurnaroundSla(template.sla || '4 Hours');
    setOfficerCap(template.cap || '$100,000 AUD');
    setDailyLimit(template.daily || '$25,000 AUD');
    if (template.sections && template.sections.length > 0) {
      setSections(template.sections.map((s, idx) => ({
        ...s,
        id: s.id || `tpl-sec-${idx + 1}-${Date.now()}`
      })));
    }
    if (template.dept && !preselectedDepartmentId) {
      const match = departments.find(d => d.id === template.dept);
      if (match) {
        setDepartmentId(match.id);
      }
    }
  };

  // Copies a selected Master Library item or repository standard into the chosen Template structure
  const handleCopyFromMasterLibrary = async (sourceItem, templateChoiceId = selectedLibraryTemplateId) => {
    if (!sourceItem) return;
    let resolvedSource = sourceItem;
    if (sourceItem.id && !sourceItem.isBuiltInStandard && !Array.isArray(sourceItem.parameters?.sections)) {
      try {
        const full = await apiService.getPolicyDetails(sourceItem.id, currentUser?.roleType || 'employee');
        if (full) resolvedSource = { ...sourceItem, ...full };
      } catch (_) {}
    }

    const srcParams = typeof resolvedSource.parameters === 'string'
      ? (() => { try { return JSON.parse(resolvedSource.parameters || '{}'); } catch { return {}; } })()
      : (resolvedSource.parameters || {});

    let sourceSections = [];
    if (Array.isArray(resolvedSource.sections) && resolvedSource.sections.length > 0) {
      sourceSections = resolvedSource.sections;
    } else if (Array.isArray(srcParams.sections) && srcParams.sections.length > 0) {
      sourceSections = srcParams.sections;
    } else if (resolvedSource.content) {
      const raw = String(resolvedSource.content);
      const parts = raw.split(/(?=###\s+)/).filter((p) => p.trim());
      sourceSections = parts.map((part, idx) => {
        const m = part.match(/^###\s*(?:\d+\.?\s*)?(.*?)\n([\s\S]*)$/);
        return {
          id: `src-sec-${idx + 1}-${Date.now()}`,
          title: m ? m[1].trim() : `Clause ${idx + 1}`,
          content: m ? m[2].trim() : part.trim(),
          type: 'section',
        };
      });
    }

    const allTemplateChoices = [
      ...dynamicTemplates,
      ...masterTemplates.filter((m) => !dynamicTemplates.some((d) => d.id === m.id)),
    ];
    const chosenTpl = templateChoiceId === 'keep-original'
      ? null
      : (allTemplateChoices.find((t) => t.id === templateChoiceId) || POLICY_TEMPLATES[0]);

    let finalSections = sourceSections.map((s, idx) => ({
      ...s,
      id: `copy-sec-${idx + 1}-${Date.now()}`,
      type: s.type || 'section',
    }));

    if (chosenTpl && Array.isArray(chosenTpl.sections) && chosenTpl.sections.length > 0 && sourceSections.length > 0) {
      const unclaimed = new Set(sourceSections.map((_, i) => i));
      const tplSections = chosenTpl.sections.map((tSec, tIdx) => {
        const normT = (tSec.title || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        const matchedIdx = sourceSections.findIndex((sSec, sIdx) => {
          if (!unclaimed.has(sIdx)) return false;
          const normS = (sSec.title || '').toLowerCase().replace(/[^a-z0-9]/g, '');
          return normS === normT || normS.includes(normT) || normT.includes(normS);
        });
        if (matchedIdx >= 0) {
          unclaimed.delete(matchedIdx);
          return {
            id: `copy-tpl-${tIdx + 1}-${Date.now()}`,
            title: tSec.title,
            content: sourceSections[matchedIdx].content || tSec.content || '',
            type: 'section',
            isTemplateSection: true,
          };
        }
        return {
          id: `copy-tpl-${tIdx + 1}-${Date.now()}`,
          title: tSec.title,
          content: tSec.content || '',
          type: 'section',
          isTemplateSection: true,
        };
      });

      if (unclaimed.size > 0) {
        const extraBlocks = Array.from(unclaimed).map((i) => {
          const s = sourceSections[i];
          return s.title ? `<h4>${s.title}</h4>\n${s.content || ''}` : (s.content || '');
        }).filter(Boolean).join('\n\n');

        const detailsIdx = tplSections.findIndex((s) => /detail|description|scope/i.test(s.title || ''));
        if (detailsIdx >= 0) {
          const isPlaceholder = /^(details of the policy|applicability of the policy)/i.test(tplSections[detailsIdx].content || '');
          tplSections[detailsIdx] = {
            ...tplSections[detailsIdx],
            content: isPlaceholder ? extraBlocks : [tplSections[detailsIdx].content, extraBlocks].filter(Boolean).join('\n\n'),
          };
        } else {
          tplSections.push({
            id: `copy-extra-${Date.now()}`,
            title: 'Additional Master Clauses',
            content: extraBlocks,
            type: 'section',
            isCustom: true,
          });
        }
      }
      finalSections = tplSections;
    } else if (chosenTpl && finalSections.length === 0) {
      finalSections = (chosenTpl.sections || []).map((s, idx) => ({
        ...s,
        id: `copy-tpl-${idx + 1}-${Date.now()}`,
      }));
    }

    setCopiedFromSourcePolicy(resolvedSource.isBuiltInStandard ? null : resolvedSource);
    setSelectedTemplateId(resolvedSource.id || chosenTpl?.id || 'template-standard-policy');
    setTitle(`${resolvedSource.title || 'Operational Policy'} (Copy)`);
    setSummary(resolvedSource.summary || chosenTpl?.summary || '');
    setContent(resolvedSource.content || '');
    setTurnaroundSla(srcParams.turnaround_sla || resolvedSource.sla || chosenTpl?.sla || '4 Hours');
    setDailyLimit(srcParams.daily_limit || resolvedSource.daily || chosenTpl?.daily || '$25,000 AUD');
    setOfficerCap(srcParams.approval_limits?.officer_cap || resolvedSource.cap || chosenTpl?.cap || '$100,000 AUD');
    if (Array.isArray(srcParams.extracted_images)) {
      setExtractedImages(srcParams.extracted_images);
    }
    if (finalSections.length > 0) {
      setSections(finalSections);
    }
    const targetDept = resolvedSource.department_id || resolvedSource.dept || preselectedDepartmentId;
    if (targetDept && departments.some((d) => d.id === targetDept)) {
      setDepartmentId(targetDept);
    }
    setIsTemplateEditorActive(true);
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

  // Apply Target Template to Extracted Document
  const handleApplyTemplateToExtractedDocument = (templateId) => {
    const targetTpl =
      templateChoosingChoices.find(t => t.id === templateId) ||
      masterTemplates.find(t => t.id === templateId) ||
      masterTemplates[0];
    if (!targetTpl) return;
    setSelectedUploadTemplateId(targetTpl.id);

    const activeDoc = ingestedDocuments[activeIngestedIndex];
    const targetTemplateSections = targetTpl.sections || POLICY_TEMPLATES[0].sections;
    const existingText =
      (activeDoc && activeDoc.raw_text) ||
      uploadedDocRawText ||
      sections.map(s => (s.title && s.title !== 'Others' ? `${s.title}\n${s.content}` : s.content)).filter(Boolean).join('\n\n') ||
      '';
    const paras = existingText.split(/\r?\n\r?\n+/).map(p => p.trim()).filter(Boolean);

    const claimed = new Set();
    const sectionMap = {};
    targetTemplateSections.forEach(s => { sectionMap[s.id || s.title] = []; });

    // 1. Exact & heading prefix matching
    targetTemplateSections.forEach(sec => {
      const secKey = sec.id || sec.title;
      const normTitle = sec.title.toLowerCase().replace(/[^a-z0-9]/g, '');
      paras.forEach((p, pIdx) => {
        if (claimed.has(pIdx)) return;
        const normP = p.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (
          normP === normTitle ||
          (normP.startsWith(normTitle) && p.length <= sec.title.length + 12) ||
          (p.toLowerCase().includes(sec.title.toLowerCase()) && p.length < 140)
        ) {
          claimed.add(pIdx);
          const cleanP = p.replace(new RegExp('^' + sec.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '[:\\s-]*', 'i'), '').trim();
          if (cleanP) {
            sectionMap[secKey].push(cleanP);
          } else if (pIdx + 1 < paras.length && !claimed.has(pIdx + 1)) {
            claimed.add(pIdx + 1);
            sectionMap[secKey].push(paras[pIdx + 1]);
          }
        }
      });
    });

    // 2. Keyword & section topic fallback mapping
    const topicKeywords = {
      purpose: ['purpose', 'objective', 'rationale', 'intent', 'overview', 'background', 'introduction', 'executive summary'],
      scope: ['scope', 'coverage', 'applicab', 'applies to', 'eligibility', 'customer', 'business line'],
      details: ['detail', 'description', 'requirement', 'deliverable', 'procedure', 'assessment', 'methodology', 'rule', 'underwriting', 'limit', 'pricing', 'commercial'],
      dependencies: ['dependency', 'dependencies', 'prerequisite', 'pre-requisite', 'assumption', 'cross reference', 'gateway', 'system'],
      controls: ['control', 'monitoring', 'audit', 'verification', 'compliance', 'security', 'governance', 'risk', 'sla', 'validity'],
      reporting: ['report', 'metric', 'kpi', 'dashboard', 'escalation', 'incident', 'breach'],
      approval: ['approval', 'approve', 'sign-off', 'authority', 'acceptance', 'chain', 'owner', 'delegat']
    };

    paras.forEach((p, pIdx) => {
      if (claimed.has(pIdx)) return;
      const lower = p.toLowerCase();
      for (const sec of targetTemplateSections) {
        const secKey = sec.id || sec.title;
        const secTitleLower = (sec.title || '').toLowerCase();
        const words = secTitleLower.split(/[^a-z0-9]+/).filter(w => w.length > 3);
        let matchedKw = words.some(w => lower.includes(w));
        if (!matchedKw) {
          for (const [topic, kws] of Object.entries(topicKeywords)) {
            if (secTitleLower.includes(topic) && kws.some(kw => lower.includes(kw))) {
              matchedKw = true;
              break;
            }
          }
        }
        if (matchedKw) {
          claimed.add(pIdx);
          sectionMap[secKey].push(p);
          break;
        }
      }
    });

    const unmapped = [];
    paras.forEach((p, pIdx) => {
      if (!claimed.has(pIdx)) unmapped.push(p);
    });

    const newSectionsRaw = targetTemplateSections.map((sec, idx) => {
      const secKey = sec.id || sec.title;
      const matched = sectionMap[secKey] || [];
      const content = matched.length > 0 ? matched.join('\n\n') : (sec.content || '');
      return {
        id: `sec-${idx + 1}-${Date.now()}`,
        section_number: idx + 1,
        title: sec.title,
        type: 'section',
        content: content,
        isTemplateSection: true,
        isCustom: false
      };
    });

    if (unmapped.length > 0) {
      newSectionsRaw.push({
        id: `sec-others-${Date.now()}`,
        section_number: newSectionsRaw.length + 1,
        title: 'Others',
        type: 'section',
        content: unmapped.join('\n\n'),
        isTemplateSection: false,
        isCustom: true
      });
    }

    const newSections = ensureRichAssetsInSections(newSectionsRaw, {
      tables: activeDoc?.tables || [],
      images: (activeDoc?.images && activeDoc.images.length > 0) ? activeDoc.images : extractedImages,
    });

    setSections(newSections);

    if (ingestedDocuments.length > 0) {
      const updatedDocs = [...ingestedDocuments];
      if (updatedDocs[activeIngestedIndex]) {
        updatedDocs[activeIngestedIndex] = {
          ...updatedDocs[activeIngestedIndex],
          sections: newSections
        };
        setIngestedDocuments(updatedDocs);
      }
    }
  };

  // AI-Assisted Document Ingestion Execution Engine
  const executeDocumentIngestion = async (files, targetTemplateId = null) => {
    const templateToUse = targetTemplateId || selectedUploadTemplateId || 'template-standard-policy';
    if (!files || files.length === 0) return;

    setIsAiThinking(true);
    setUploadedFileName(files.length === 1 ? files[0].name : `${files.length} Documents Selected`);

    const localFilesMeta = files.map((file) => {
      if (file?.isHistoryDoc) {
        const remote = file.url || file.secureUrl || '';
        return { fileObj: null, localUrl: remote, cloudUrl: remote };
      }
      let localUrl = '';
      try {
        localUrl = URL.createObjectURL(file);
      } catch (_) {}
      return { fileObj: file || null, localUrl, cloudUrl: '' };
    });

    if (localFilesMeta[0]?.localUrl) {
      setUploadedPdfPreviewUrl(localFilesMeta[0].localUrl);
    }

    let localExtractedText = '';
    const structuredByFile = [];
    const collectedDocxImages = [];

    for (let fIdx = 0; fIdx < files.length; fIdx++) {
      const f = files[fIdx];
      let fileStruct = { tokenizedText: '', plainText: '', tables: [], images: [] };
      if (f) {
        try {
          if (f.type && (f.type.includes('text') || f.name?.endsWith('.txt'))) {
            const txt = await f.text();
            fileStruct.tokenizedText = txt;
            fileStruct.plainText = txt;
          } else if (f.name && f.name.toLowerCase().endsWith('.docx') && f.arrayBuffer) {
            const arrayBuf = await f.arrayBuffer();
            const parsedDocx = await extractDocxStructuredContent(arrayBuf);
            if (parsedDocx) {
              fileStruct = parsedDocx;
              if (Array.isArray(parsedDocx.images) && parsedDocx.images.length > 0) {
                collectedDocxImages.push(...parsedDocx.images);
              }
            }
          }
        } catch (docxErr) {
          console.warn('Non-fatal docx structured parse notice:', docxErr);
        }
      }
      structuredByFile.push(fileStruct);
    }

    if (structuredByFile[0]?.tokenizedText) {
      localExtractedText = structuredByFile[0].tokenizedText;
      setUploadedDocRawText(localExtractedText);
    }
    if (collectedDocxImages.length > 0) {
      setExtractedImages(collectedDocxImages);
    }

    // Automatically upload each document to Cloudinary CDN and capture stored URL
    files.forEach((file, fIdx) => {
      if (!file.isHistoryDoc) {
        uploadDocumentToCloudinary(file, {
          userId: currentUser?.id || null,
          userName: currentUser?.name || null,
          templateId: templateToUse,
          templateName:
            templateChoosingChoices.find(t => t.id === templateToUse)?.name ||
            masterTemplates.find(t => t.id === templateToUse)?.name ||
            'Standard Policy Template'
        })
          .then((cloudRec) => {
            const remoteUrl = cloudRec?.secureUrl || cloudRec?.url || '';
            if (!remoteUrl) return;
            if (localFilesMeta[fIdx]) {
              localFilesMeta[fIdx].cloudUrl = remoteUrl;
            }
            setIngestedDocuments(prev =>
              prev.map((d, dIdx) => (dIdx === fIdx ? { ...d, cloud_url: remoteUrl, file_url: remoteUrl } : d))
            );
          })
          .catch(err => console.warn('Cloudinary background upload warning:', err));
      }
    });
    setAiStep(`1/3: Reading ${files.length} document(s)...`);

    try {
      const selectedTplObj =
        templateChoosingChoices.find(t => t.id === templateToUse) ||
        masterTemplates.find(t => t.id === templateToUse);
      const formData = new FormData();
      formData.append('department_id', departmentId || preselectedDepartmentId || 'company-policies');
      formData.append('user_role', currentUser?.roleType || 'employee');
      formData.append('user_name', currentUser?.name || 'Staff User');
      formData.append('template_id', templateToUse);
      if (selectedTplObj?.sections && Array.isArray(selectedTplObj.sections)) {
        formData.append('template_sections', JSON.stringify(selectedTplObj.sections));
      }
      if (localExtractedText && localExtractedText.trim().length > 20) {
        formData.append('raw_text', localExtractedText.trim());
      } else if (uploadedDocRawText && uploadedDocRawText.trim().length > 20) {
        formData.append('raw_text', uploadedDocRawText.trim());
      }
      if (structuredByFile[0]?.tables?.length > 0) {
        formData.append('rich_tables', JSON.stringify(structuredByFile[0].tables));
      }
      if (structuredByFile[0]?.images?.length > 0) {
        formData.append('rich_images', JSON.stringify(structuredByFile[0].images));
      }

      for (const file of files) {
        if (!file.isHistoryDoc) {
          formData.append('files', file);
        }
      }

      setAiStep(`2/3: Structuring document(s), tables & images into template clauses...`);

      const res = await apiService.ingestDocuments(formData);
      const docList = (res && res.documents && Array.isArray(res.documents))
        ? res.documents
        : (Array.isArray(res) ? res : []);

      if (docList.length > 0) {
        setAiStep(`3/3: Finalizing document sections...`);

        const sanitizedDocs = docList.map((doc, dIdx) => {
          const localStruct = structuredByFile[dIdx] || { tables: [], images: [] };
          const resolvedTables = (Array.isArray(doc.tables) && doc.tables.length > 0) ? doc.tables : (localStruct.tables || []);
          const resolvedImages = (Array.isArray(doc.images) && doc.images.length > 0) ? doc.images : (localStruct.images || []);

          if (resolvedImages.length > 0) {
            setExtractedImages(prev => {
              const existingNames = new Set(prev.map(p => p.name || p.dataUrl?.slice(0, 48)));
              const newImgs = resolvedImages.filter(im => !existingNames.has(im.name || im.dataUrl?.slice(0, 48)));
              return [...prev, ...newImgs];
            });
          }
          const meta = localFilesMeta[dIdx] || {};
          const rawDocSections = (doc.sections || []).map((s, idx) => ({
            ...s,
            id: s.id || `sec-${idx + 1}-${Date.now()}`
          }));
          const hydratedSections = ensureRichAssetsInSections(rawDocSections, {
            tables: resolvedTables,
            images: resolvedImages,
          });

          return {
            ...doc,
            document_name: doc.document_name || files[dIdx]?.name || `Document ${dIdx + 1}`,
            title: doc.title || files[dIdx]?.name || 'Operational Policy',
            raw_text: doc.raw_text || localStruct.tokenizedText || (dIdx === 0 ? localExtractedText : '') || '',
            file_obj: meta.fileObj || null,
            local_preview_url: meta.localUrl || '',
            cloud_url: meta.cloudUrl || doc.cloud_url || doc.file_url || '',
            tables: resolvedTables,
            images: resolvedImages,
            sections: hydratedSections
          };
        });

        setIngestedDocuments(sanitizedDocs);
        setActiveIngestedIndex(0);

        const firstDoc = sanitizedDocs[0];
        if (firstDoc.raw_text && !localExtractedText) {
          setUploadedDocRawText(firstDoc.raw_text);
        }
        setTitle(firstDoc.title);
        setSummary(firstDoc.summary);
        setTurnaroundSla(firstDoc.turnaround_sla || '4 Hours');
        setDailyLimit(firstDoc.daily_limit || '$25,000 AUD');
        setOfficerCap(firstDoc.officer_cap || '$100,000 AUD');
        setComplianceTags(firstDoc.compliance_tags || ['APRA Aligned', 'Institutional Standard']);
        if (firstDoc.sections && firstDoc.sections.length > 0) {
          setSections(firstDoc.sections);
        }
        if (firstDoc.suggested_department && departments.some(d => d.id === firstDoc.suggested_department)) {
          setDepartmentId(firstDoc.suggested_department);
        }
      } else {
        throw new Error('No parsed documents returned by server.');
      }
    } catch (err) {
      console.warn('Backend ingestion notice, applying client template-driven segmentation fallback:', err);
      const targetTpl =
        templateChoosingChoices.find(t => t.id === templateToUse) ||
        masterTemplates.find(t => t.id === templateToUse) ||
        masterTemplates[0];
      const targetSections = targetTpl.sections || POLICY_TEMPLATES[0].sections;

      const parsedDocs = [];
      for (let fIdx = 0; fIdx < files.length; fIdx++) {
        const file = files[fIdx];
        const meta = localFilesMeta[fIdx] || {};
        const localStruct = structuredByFile[fIdx] || { tokenizedText: '', tables: [], images: [] };
        const textToSplit = localStruct.tokenizedText || (fIdx === 0 ? (localExtractedText || uploadedDocRawText) : '') || '';
        const rawParas = textToSplit.split(/\r?\n\r?\n+/).map(p => p.trim()).filter(Boolean);
        const cleanBase = (file.name || 'document').replace(/\.[^/.]+$/, "").replace(/[-_]/g, ' ');
        const docTitle = cleanBase.charAt(0).toUpperCase() + cleanBase.slice(1) + ' Operational Policy';
        
        const claimedIndices = new Set();
        const sectionMap = {};
        targetSections.forEach(s => { sectionMap[s.id || s.title] = []; });

        targetSections.forEach(sec => {
          const secKey = sec.id || sec.title;
          const normTitle = sec.title.toLowerCase().replace(/[^a-z0-9]/g, '');
          rawParas.forEach((p, pIdx) => {
            if (claimedIndices.has(pIdx)) return;
            const normP = p.toLowerCase().replace(/[^a-z0-9]/g, '');
            if (normP === normTitle || (normP.startsWith(normTitle) && p.length <= sec.title.length + 8) || (p.toLowerCase().includes(sec.title.toLowerCase()) && p.length < 140)) {
              claimedIndices.add(pIdx);
              const cleanInline = p.replace(new RegExp('^' + sec.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '[:\\s-]*', 'i'), '').trim();
              if (cleanInline) sectionMap[secKey].push(cleanInline);
            }
          });
        });

        // Collect leftover paragraphs for "Others"
        const unmapped = [];
        rawParas.forEach((p, pIdx) => {
          if (!claimedIndices.has(pIdx)) unmapped.push(p);
        });

        const baseSecs = targetSections.map((sec, idx) => {
          const secKey = sec.id || sec.title;
          const list = sectionMap[secKey] || [];
          const content = list.length > 0 ? list.join('\n\n') : (sec.content || `Operational clauses for ${sec.title}.`);
          return {
            id: sec.id || `sec-${idx + 1}-${Date.now()}`,
            section_number: idx + 1,
            title: sec.title,
            type: 'section',
            content: content,
            isTemplateSection: true,
            isCustom: false
          };
        });

        if (unmapped.length > 0) {
          baseSecs.push({
            id: `sec-others-${Date.now()}`,
            section_number: baseSecs.length + 1,
            title: 'Others',
            type: 'section',
            content: unmapped.join('\n\n'),
            isTemplateSection: false,
            isCustom: true
          });
        }

        const finalSecs = ensureRichAssetsInSections(baseSecs, {
          tables: localStruct.tables || [],
          images: (localStruct.images && localStruct.images.length > 0) ? localStruct.images : collectedDocxImages,
        });

        parsedDocs.push({
          document_name: file.name,
          title: docTitle,
          raw_text: textToSplit || '',
          file_obj: meta.fileObj || null,
          local_preview_url: meta.localUrl || '',
          cloud_url: meta.cloudUrl || '',
          suggested_department: departmentId || targetTpl.dept || 'company-policies',
          turnaround_sla: targetTpl.sla || '4 Hours',
          daily_limit: targetTpl.daily || '$25,000 AUD',
          officer_cap: targetTpl.cap || '$100,000 AUD',
          compliance_tags: ['APRA Aligned', 'Institutional Framework'],
          total_chars: textToSplit.length || 1500,
          summary: targetTpl.summary || `Operational banking policy ingested from ${file.name}.`,
          discovered_evidence: [
            {
              topic: 'Policy Title',
              finding: docTitle,
              source_excerpt: `Extracted from filename and header: "${file.name}"`
            },
            {
              topic: 'Template Mapping',
              finding: `${targetTpl.name || targetTpl.title} (${finalSecs.length} Sections)`,
              source_excerpt: `All ${rawParas.length} content paragraphs structured across standard template clauses.`
            }
          ],
          sections: finalSecs,
          tables: localStruct.tables || [],
          images: (localStruct.images && localStruct.images.length > 0) ? localStruct.images : collectedDocxImages
        });
      }

      setIngestedDocuments(parsedDocs);
      setActiveIngestedIndex(0);
      const firstDoc = parsedDocs[0];
      setTitle(firstDoc.title);
      setSummary(firstDoc.summary);
      setTurnaroundSla(firstDoc.turnaround_sla);
      setDailyLimit(firstDoc.daily_limit);
      setOfficerCap(firstDoc.officer_cap);
      setComplianceTags(firstDoc.compliance_tags);
      setSections(firstDoc.sections);
      if (firstDoc.suggested_department && departments.some(d => d.id === firstDoc.suggested_department)) {
        setDepartmentId(firstDoc.suggested_department);
      }
    } finally {
      setIsAiThinking(false);
    }
  };

  // Direct upload handler (template is already selected in Step 1 before choosing the file)
  const handleUploadMultipleDocumentsWithAi = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files || files.length === 0) return;
    const tplId = selectedUploadTemplateId || templateChoosingChoices[0]?.id || 'template-standard-policy';
    executeDocumentIngestion(files, tplId);
    e.target.value = '';
  };

  // Load history document for editing & correction
  const handleLoadHistoryDocForCorrection = (historyDoc) => {
    if (!historyDoc) return;
    setCreationMode('upload');
    setUploadedFileName(historyDoc.name || historyDoc.originalName);
    setUploadedPdfPreviewUrl(historyDoc.url || historyDoc.secureUrl);
    if (historyDoc.templateId) {
      setSelectedUploadTemplateId(historyDoc.templateId);
    }
    if (historyDoc.sections && Array.isArray(historyDoc.sections) && historyDoc.sections.length > 0) {
      setSections(historyDoc.sections);
      setIngestedDocuments([{
        document_name: historyDoc.name,
        title: (historyDoc.name || 'Policy').replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ') + ' Policy',
        sections: historyDoc.sections,
        cloud_url: historyDoc.url || historyDoc.secureUrl || '',
        local_preview_url: historyDoc.url || historyDoc.secureUrl || '',
        total_chars: 2500,
        summary: historyDoc.notes || 'Document loaded from your upload history.'
      }]);
      setActiveIngestedIndex(0);
    } else {
      const tplId = historyDoc.templateId || selectedUploadTemplateId || templateChoosingChoices[0]?.id || 'template-standard-policy';
      executeDocumentIngestion(
        [{ name: historyDoc.name, url: historyDoc.url || historyDoc.secureUrl, isHistoryDoc: true }],
        tplId
      );
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
    if (doc.raw_text !== undefined) {
      setUploadedDocRawText(doc.raw_text);
    }
    setUploadedFileName(doc.document_name || '');
    setUploadedPdfPreviewUrl(doc.cloud_url || doc.local_preview_url || '');
    setTitle(doc.title);
    setSummary(doc.summary);
    setTurnaroundSla((doc.turnaround_sla && doc.turnaround_sla !== 'Not specified') ? doc.turnaround_sla : '2 Business Days');
    setDailyLimit((doc.daily_limit && doc.daily_limit !== 'Not specified') ? doc.daily_limit : '$100,000 AUD');
    setOfficerCap((doc.officer_cap && doc.officer_cap !== 'Not specified') ? doc.officer_cap : '$250,000 AUD');
    setComplianceTags(doc.compliance_tags || ['APRA APS 220', 'Independent Valuers', 'LVR Limits']);
    if (doc.sections && doc.sections.length > 0) {
      setSections(doc.sections);
    }
    if (Array.isArray(doc.images)) {
      setExtractedImages(doc.images);
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
            change_details: `Document ingested from ${doc.document_name} in ${targetDeptName}. Mode: upload. SLA: ${doc.turnaround_sla}, Daily Limit: ${doc.daily_limit}. Sections: ${docSections.length}. Summary: ${doc.summary}`,
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
    const currentSections = flushFullscreenEditorSections();

    let finalDeptId = departmentId;
    let finalTitle = title;
    let finalSummary = summary;
    let finalContent = content;
    let finalSla = turnaroundSla;
    let finalDaily = dailyLimit;
    let finalCap = officerCap;
    let finalSections = currentSections;

    if (creationMode === 'direct') {
      if (currentSections.length > 0) {
        finalContent = currentSections.map((sec, idx) => {
          if (sec.type === 'paragraph' && !sec.title.trim()) {
            return sec.content;
          }
          const heading = sec.title.trim() ? `### ${idx + 1}. ${sec.title.trim()}` : `### Paragraph ${idx + 1}`;
          return `${heading}\n${sec.content}`;
        }).join('\n\n');

        const summarySec = currentSections.find(s => s.title.toLowerCase().includes('summary'));
        if (!finalSummary.trim() && summarySec?.content) {
          finalSummary = htmlToPlainText(summarySec.content).slice(0, 250) || summarySec.content.slice(0, 250);
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
      if (currentSections && currentSections.length > 0) {
        finalSections = currentSections;
        finalContent = currentSections.map((sec, idx) => `### ${idx + 1}. ${sec.title}\n${sec.content}`).join('\n\n');
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
      finalSummary = summary || activeDoc?.summary || `Policy ingested from ${uploadedFileName}`;
      finalDeptId = departmentId || activeDoc?.suggested_department || 'credit-cards';
      if (currentSections && currentSections.length > 0) {
        finalSections = currentSections;
        finalContent = currentSections.map((sec, idx) => `### ${idx + 1}. ${sec.title}\n${sec.content}`).join('\n\n');
      } else {
        finalContent = content || `### Operational Policy Specification\nExtracted from document: ${uploadedFileName}`;
      }
    }

    if (!finalTitle.trim() || !finalContent.trim()) {
      setErrorMessage('Please enter policy title and at least one section or content.');
      return;
    }

    const activeIngested = ingestedDocuments[activeIngestedIndex];
    const persistentSourceUrl =
      activeIngested?.cloud_url ||
      (uploadedPdfPreviewUrl && !String(uploadedPdfPreviewUrl).startsWith('blob:') ? uploadedPdfPreviewUrl : '');

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
            phases: selectedTemplatePhases,
            extracted_images: extractedImages.slice(0, 24),
            source_file_name: uploadedFileName || activeIngested?.document_name || '',
            source_file_url: persistentSourceUrl || ''
          },
          created_by: currentUser?.name || 'Bank Administrator',
          creation_mode: creationMode,
          user_role: currentUser?.roleType || 'manager',
          user_name: currentUser?.name || 'Bank Administrator'
        });

        if (res.id) {
          try {
            const userApprovedRecord = {
              id: res.id,
              policyId: res.id,
              title: finalTitle.trim(),
              version: 'v1.0',
              department_id: finalDeptId,
              department_name: departments.find(d => d.id === finalDeptId)?.name || 'Company Policies',
              summary: finalSummary.trim() || finalTitle.trim(),
              status: 'approved',
              user_id: currentUser?.id,
              user_name: currentUser?.name || 'Bank Administrator',
              approved_by: currentUser?.name || 'Bank Administrator',
              approved_at: new Date().toISOString(),
              source_file_name: uploadedFileName || `${finalTitle.trim()}.pdf`,
              source_file_url: uploadedPdfPreviewUrl || '',
              created_at: new Date().toISOString(),
              sections: finalSections
            };
            const userKey = `liblist_approved_user_docs_${currentUser?.id || 'default'}`;
            const existing = JSON.parse(localStorage.getItem(userKey) || '[]');
            localStorage.setItem(userKey, JSON.stringify([userApprovedRecord, ...existing.filter(d => d.id !== res.id)]));
            window.dispatchEvent(new CustomEvent('liblist-doc-history-updated'));
          } catch (_) {}

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
        try {
          const userProposalRecord = {
            id: `proposal-${Date.now()}`,
            title: finalTitle.trim(),
            version: 'v1.0',
            department_id: finalDeptId,
            department_name: targetDeptName,
            summary: finalSummary.trim() || finalTitle.trim(),
            status: 'pending_approval',
            user_id: currentUser?.id,
            user_name: currentUser?.name || 'Bank Employee',
            source_file_name: uploadedFileName || `${finalTitle.trim()}.pdf`,
            source_file_url: uploadedPdfPreviewUrl || '',
            created_at: new Date().toISOString(),
            sections: finalSections
          };
          const userKey = `liblist_approved_user_docs_${currentUser?.id || 'default'}`;
          const existing = JSON.parse(localStorage.getItem(userKey) || '[]');
          localStorage.setItem(userKey, JSON.stringify([userProposalRecord, ...existing]));
          window.dispatchEvent(new CustomEvent('liblist-doc-history-updated'));
        } catch (_) {}

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

  const templateChoosingChoices = [
    ...dynamicTemplates,
    ...masterTemplates.filter(
      (m) =>
        !dynamicTemplates.some(
          (d) =>
            d.id === m.id ||
            (m.id === 'template-standard-policy' && d.id === 'template-01-pdf')
        )
    ),
  ];

  const allMasterLibraryItems = (() => {
    const items = [];
    const seenIds = new Set();
    const mergedLive = [
      ...(Array.isArray(masterPolicies) ? masterPolicies : []),
      ...(Array.isArray(liveMasterPolicies) ? liveMasterPolicies : []),
    ];
    mergedLive.forEach((p) => {
      if (!p || p.status !== 'active' || seenIds.has(String(p.id))) return;
      seenIds.add(String(p.id));
      const deptObj = departments.find((d) => d.id === p.department_id);
      items.push({
        ...p,
        dept: p.department_id || 'company-policies',
        deptName: p.department_name || deptObj?.name || p.department_id || 'Master Library',
        isBuiltInStandard: false,
      });
    });
    masterTemplates.forEach((t) => {
      if (seenIds.has(String(t.id))) return;
      seenIds.add(String(t.id));
      items.push({
        ...t,
        isBuiltInStandard: true,
      });
    });
    return items;
  })();

  const filteredMasterTemplates = allMasterLibraryItems.filter((t) => {
    const deptKey = t.department_id || t.dept || '';
    const matchesDept = masterDeptFilter === 'all' || deptKey === masterDeptFilter;
    const q = masterSearchQuery.toLowerCase().trim();
    if (!q) return matchesDept;
    return (
      matchesDept &&
      ((t.title || '').toLowerCase().includes(q) ||
        (t.summary || '').toLowerCase().includes(q) ||
        (t.deptName && t.deptName.toLowerCase().includes(q)) ||
        deptKey.toLowerCase().includes(q))
    );
  });

  const selectedTemplate = allMasterLibraryItems.find(t => t.id === selectedTemplateId) || masterTemplates[0];

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
                    <span>
                      {editingPolicy.isTemplateCopy ? 'Copy Template to Draft:' : 'Edit Draft:'}{' '}
                      {title || editingPolicy.title || 'Operational Policy'}
                    </span>
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
                  Target Department:{' '}
                  <span className="font-semibold text-slate-700">
                    {departments.find((d) => d.id === departmentId)?.name ||
                      editingPolicy.department_name ||
                      preselectedDepartmentName ||
                      'Credit Cards'}
                  </span>
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
              setIsTemplateEditorActive(false);
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
        <form onSubmit={(e) => e.preventDefault()} className={`flex-1 ${creationMode === 'upload' && ingestedDocuments.length > 0 ? 'overflow-y-auto lg:overflow-hidden p-4 flex flex-col gap-3' : 'overflow-y-auto p-6 space-y-4'} text-[13px] custom-scrollbar bg-[#f0f6fc]`}>
          
          {/* DIRECT DRAFT / CONFIGURED EDITING MODE (Immediate access to modular sections, no mode/template clutter) */}
          {editingPolicy ? (
            <div className="space-y-4 animate-in fade-in duration-150">
              {/* Document Title & Metadata */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
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

                {editingPolicy.isTemplateCopy && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Target Department Partition
                      </label>
                      <select
                        value={departmentId}
                        onChange={(e) => setDepartmentId(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-[#0057B8] focus:ring-2 focus:ring-[#0057B8]/15 text-xs bg-white font-medium text-slate-900 shadow-2xs"
                      >
                        {departments.map((d) => (
                          <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Executive Summary
                      </label>
                      <input
                        type="text"
                        value={summary}
                        onChange={(e) => setSummary(e.target.value)}
                        placeholder="Short description of the policy..."
                        className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-[#0057B8] focus:ring-2 focus:ring-[#0057B8]/15 text-xs bg-white text-slate-800 shadow-2xs"
                      />
                    </div>
                  </div>
                )}
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
                          onChange={(e) => handleUpdateSectionTitle(section.id || `sec-${idx}`, e.target.value)}
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
                          onClick={() => handleDeleteSection(section.id || `sec-${idx}`)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition cursor-pointer"
                          title="Delete section"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Interactive Rich Document Clause Editor */}
                    <SectionRichEditor
                      key={`${editingDraftId || 'edit'}-${section.id || idx}`}
                      sectionId={section.id || `sec-${idx}`}
                      value={section.content}
                      sectionIndex={idx}
                      minHeight="130px"
                      onFocus={() => setActiveSectionId(section.id || `sec-${idx}`)}
                      onChange={(val) => handleUpdateSectionContent(section.id || `sec-${idx}`, val)}
                      placeholder={`Enter ${section.title || 'section'} details, operational requirements, tables, or images...`}
                    />
                  </div>
                ))}

                {/* Add Section Button at the Bottom of the Last Section */}
                <div className="pt-2 flex items-center justify-start">
                  <button
                    type="button"
                    onClick={() => handleAddSection('New Section')}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#0057B8]/10 hover:bg-[#0057B8]/20 text-[#0057B8] rounded-xl text-xs font-bold border border-[#0057B8]/30 transition cursor-pointer shadow-2xs active:scale-98"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Section</span>
                  </button>
                </div>
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
                          placeholder="Policy Title"
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
                      <span>POLICY CLAUSES & SPECIFICATIONS ({sections.length})</span>
                    </h3>
                    <p className="text-[11.5px] text-slate-500">
                      Edit clause specifications, reorder above or below, or add new sections.
                    </p>
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
                              <input
                                type="text"
                                value={section.title}
                                onChange={(e) => handleUpdateSectionTitle(section.id || `sec-${idx}`, e.target.value)}
                                placeholder={section.type === 'paragraph' ? 'Paragraph' : `Section ${idx + 1} Title`}
                                className="w-full font-bold text-[13.5px] text-slate-900 bg-white border border-slate-300 focus:border-[#0057B8] focus:ring-1 focus:ring-[#0057B8] px-2.5 py-1 rounded-md outline-none transition shadow-2xs"
                              />
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
                              onClick={() => handleDeleteSection(section.id || `sec-${idx}`)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition cursor-pointer"
                              title="Delete section"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <SectionRichEditor
                          key={`${editingDraftId || selectedDirectTemplateId || 'direct'}-${section.id || idx}`}
                          sectionId={section.id || `sec-${idx}`}
                          value={section.content}
                          sectionIndex={idx}
                          minHeight="115px"
                          onFocus={() => setActiveSectionId(section.id || `sec-${idx}`)}
                          onChange={(val) => handleUpdateSectionContent(section.id || `sec-${idx}`, val)}
                          placeholder={`Enter ${section.title || 'section'} details, operational requirements, tables, or images...`}
                        />
                      </div>
                    );
                  })}

                  {/* Add Section Button at the Bottom of the Last Section */}
                  <div className="pt-2 flex items-center justify-start">
                    <button
                      type="button"
                      onClick={() => handleAddSection('New Section')}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#0057B8]/10 hover:bg-[#0057B8]/20 text-[#0057B8] rounded-xl text-xs font-bold border border-[#0057B8]/30 transition cursor-pointer shadow-2xs active:scale-98"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Section</span>
                    </button>
                  </div>
                </div>
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

          {/* MODE 2: MASTER LIBRARY & TEMPLATE CHOOSING LIBRARY */}
          {creationMode === 'library' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {!isTemplateEditorActive ? (
                <>
                  {/* Step 1: Template Choosing Library */}
                  <div className="p-3.5 rounded-2xl bg-white border border-blue-200/80 shadow-2xs space-y-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <span className="text-[11px] font-bold text-[#0057B8] uppercase tracking-wider flex items-center gap-1.5">
                          <Copy className="w-3.5 h-3.5" />
                          <span>1. Choose Target Template Structure</span>
                        </span>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Pick a Policy Template to format the copied document, or keep its original layout.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const chosenTpl = templateChoosingChoices.find((t) => t.id === selectedLibraryTemplateId) || templateChoosingChoices[0];
                          if (chosenTpl) {
                            handleSelectTemplate(chosenTpl);
                            setIsTemplateEditorActive(true);
                          }
                        }}
                        className="px-3 py-1.5 rounded-lg border border-blue-200 bg-blue-50 hover:bg-blue-100 text-[#0057B8] text-[11px] font-bold transition cursor-pointer"
                      >
                        Start from Blank Template →
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedLibraryTemplateId('keep-original')}
                        className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                          selectedLibraryTemplateId === 'keep-original'
                            ? 'bg-[#0057B8] text-white border-[#0057B8] shadow-xs'
                            : 'bg-slate-50 hover:bg-blue-50/60 text-slate-800 border-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-xs font-bold truncate">Keep Master Structure</span>
                          {selectedLibraryTemplateId === 'keep-original' && <Check className="w-3.5 h-3.5 flex-shrink-0" />}
                        </div>
                        <span className={`text-[10.5px] block mt-0.5 truncate ${selectedLibraryTemplateId === 'keep-original' ? 'text-blue-100' : 'text-slate-500'}`}>
                          Copy original sections as authored
                        </span>
                      </button>

                      {templateChoosingChoices.map((tpl) => {
                        const isTplActive = selectedLibraryTemplateId === tpl.id;
                        return (
                          <button
                            key={tpl.id}
                            type="button"
                            onClick={() => setSelectedLibraryTemplateId(tpl.id)}
                            className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                              isTplActive
                                ? 'bg-[#0057B8] text-white border-[#0057B8] shadow-xs'
                                : 'bg-slate-50 hover:bg-blue-50/60 text-slate-800 border-slate-200'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-1">
                              <span className="text-xs font-bold truncate">{tpl.name || tpl.title}</span>
                              {isTplActive && <Check className="w-3.5 h-3.5 flex-shrink-0" />}
                            </div>
                            <span className={`text-[10.5px] block mt-0.5 truncate ${isTplActive ? 'text-blue-100' : 'text-slate-500'}`}>
                              {(tpl.sections || []).length} template clauses
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Step 2: Master Library Search & Department Partition */}
                  <div className="space-y-2.5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                          Filter Master Library Partition
                        </label>
                        <select
                          value={masterDeptFilter}
                          onChange={(e) => setMasterDeptFilter(e.target.value)}
                          className="w-full p-2 rounded-xl border border-slate-300 focus:outline-none focus:border-[#0057B8] text-xs bg-white font-medium text-slate-900 shadow-2xs"
                        >
                          <option value="all">All Master Library Departments</option>
                          {departments.map(d => (
                            <option key={d.id} value={d.id}>{d.name}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                          Target Department for Copied Draft
                        </label>
                        <select
                          value={departmentId}
                          onChange={(e) => setDepartmentId(e.target.value)}
                          className="w-full p-2 rounded-xl border border-slate-300 focus:outline-none focus:border-[#0057B8] text-xs bg-white font-medium text-slate-900 shadow-2xs"
                        >
                          {departments.map(d => (
                            <option key={d.id} value={d.id}>{d.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                        2. Master Library Policies &amp; Standards ({filteredMasterTemplates.length} Available)
                      </span>
                      <span className="text-[11px] text-[#0057B8] font-bold">
                        Click any item to copy &amp; open editor
                      </span>
                    </div>

                    {/* Search Bar for Master Library */}
                    <div className="relative">
                      <Search className="w-4 h-4 text-[#0057B8] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        value={masterSearchQuery}
                        onChange={(e) => setMasterSearchQuery(e.target.value)}
                        placeholder="Search Master Library policies or standards..."
                        className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border-2 border-blue-200 hover:border-[#0057B8] bg-white focus:border-[#0057B8] focus:ring-2 focus:ring-[#0057B8]/20 outline-none transition font-medium shadow-2xs"
                      />
                    </div>
                  </div>

                  {/* Master Library Items List */}
                  <div className="grid grid-cols-1 gap-2.5 max-h-72 overflow-y-auto custom-scrollbar pr-1">
                    {filteredMasterTemplates.map(t => {
                      const isSelected = selectedTemplateId === t.id;
                      return (
                        <div
                          key={t.id}
                          onClick={() => handleCopyFromMasterLibrary(t, selectedLibraryTemplateId)}
                          className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer text-left relative ${
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
                              <div className="min-w-0">
                                <h4 className={`font-bold text-[13.5px] truncate ${isSelected ? 'text-[#0057B8]' : 'text-slate-900'}`}>
                                  {t.title}
                                </h4>
                                <span className="text-[10px] font-semibold text-slate-500">
                                  {t.isBuiltInStandard ? 'Repository Standard' : `Live Master Library • v${t.version || '1.0'}`}
                                </span>
                              </div>
                            </div>
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#0057B8] bg-blue-100/90 hover:bg-[#0057B8] hover:text-white px-3 py-1.5 rounded-xl transition shadow-2xs flex-shrink-0">
                              Copy with Template →
                            </span>
                          </div>

                          <p className="text-slate-600 text-xs mt-1.5 pl-7.5 leading-relaxed line-clamp-2">
                            {t.summary}
                          </p>

                          <div className="flex flex-wrap items-center gap-2 mt-2 pl-7.5 text-xs">
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
                              onChange={(e) => handleUpdateSectionTitle(section.id || `sec-${idx}`, e.target.value)}
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
                              onClick={() => setExpandedModalSectionId(section.id || `sec-${idx}`)}
                              className="p-1 text-slate-400 hover:text-[#0057B8] hover:bg-blue-50 rounded cursor-pointer transition"
                              title="Expand clause into full page editor"
                            >
                              <Maximize2 className="w-3.5 h-3.5" />
                            </button>
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
                              onClick={() => handleDeleteSection(section.id || `sec-${idx}`)}
                              className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                              title="Delete Section"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        <SectionRichEditor
                          key={`${editingDraftId || selectedDirectTemplateId || 'direct'}-${section.id || idx}`}
                          sectionId={section.id || `sec-${idx}`}
                          value={section.content}
                          sectionIndex={idx}
                          minHeight="115px"
                          onFocus={() => setActiveSectionId(section.id || `sec-${idx}`)}
                          onChange={(val) => handleUpdateSectionContent(section.id || `sec-${idx}`, val)}
                          placeholder="Section clauses and operational specifications..."
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
            <div className={`${ingestedDocuments.length > 0 ? 'flex-1 min-h-0 flex flex-col gap-3' : 'space-y-4'} animate-in fade-in duration-150`}>
              {isAiThinking ? (
                <div className="p-10 border-2 border-dashed border-[#0057B8]/40 bg-[#0057B8]/5 rounded-2xl text-center space-y-4">
                  <Loader2 className="w-10 h-10 text-[#0057B8] animate-spin mx-auto" />
                  <div className="space-y-1">
                    <p className="text-base font-bold text-slate-900">
                      Processing Documents...
                    </p>
                    <p className="text-xs text-slate-500">
                      Segmenting document into template sections...
                    </p>
                  </div>
                  <p className="text-[12px] text-[#0057B8] font-mono bg-[#0057B8]/10 px-4 py-1.5 rounded-lg inline-block font-semibold">
                    {aiStep}
                  </p>
                </div>
              ) : ingestedDocuments.length === 0 ? (
                <>
                {/* STEP 1: CHOOSE POLICY TEMPLATE FIRST */}
                <div className="p-4 bg-white border border-blue-200/90 rounded-2xl shadow-2xs space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-[#0057B8] text-white text-[11px] font-bold flex items-center justify-center">
                        1
                      </span>
                      <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                        Choose Policy Template
                      </span>
                    </div>
                    {selectedUploadTemplateId && (
                      <span className="text-[11px] font-bold text-[#0057B8] bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full">
                        {templateChoosingChoices.find(t => t.id === selectedUploadTemplateId)?.name ||
                          templateChoosingChoices.find(t => t.id === selectedUploadTemplateId)?.title ||
                          'Selected'}{' '}
                        ✓
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-48 overflow-y-auto custom-scrollbar pr-0.5">
                    {templateChoosingChoices.map((t) => {
                      const isTplSelected = selectedUploadTemplateId === t.id;
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => {
                            setSelectedUploadTemplateId(t.id);
                          }}
                          className={`p-3 rounded-xl border text-left transition cursor-pointer flex items-start justify-between gap-2 ${
                            isTplSelected
                              ? 'bg-[#0057B8] text-white border-[#0057B8] shadow-xs ring-2 ring-[#0057B8]/20'
                              : 'bg-slate-50 hover:bg-blue-50/70 text-slate-800 border-slate-200'
                          }`}
                        >
                          <div className="min-w-0">
                            <span className={`font-bold text-xs block truncate ${isTplSelected ? 'text-white' : 'text-slate-900'}`}>
                              {t.name || t.title}
                            </span>
                            <span className={`text-[10.5px] block mt-0.5 truncate ${isTplSelected ? 'text-blue-100' : 'text-slate-500'}`}>
                              {t.sections?.length || 7} sections
                            </span>
                          </div>
                          {isTplSelected && <Check className="w-3.5 h-3.5 text-white flex-shrink-0 mt-0.5" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* STEP 2: CHOOSE FILE & UPLOAD IMMEDIATELY */}
                <div
                  className={`p-6 border-2 border-dashed rounded-2xl text-center space-y-3.5 transition ${
                    selectedUploadTemplateId
                      ? 'border-[#0057B8]/40 bg-[#0057B8]/5'
                      : 'border-slate-300 bg-slate-100/70 opacity-70'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <span className={`w-5 h-5 rounded-full text-[11px] font-bold flex items-center justify-center ${
                      selectedUploadTemplateId ? 'bg-[#0057B8] text-white' : 'bg-slate-400 text-white'
                    }`}>
                      2
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                      Choose File &amp; Upload
                    </h3>
                  </div>

                  <p className="text-xs text-slate-500">
                    {selectedUploadTemplateId
                      ? 'Select single or multiple PDF / DOCX documents — upload and extraction will start automatically.'
                      : 'Please pick a Policy Template in Step 1 first to enable file upload.'}
                  </p>

                  <div className="pt-1 flex flex-col items-center justify-center gap-2">
                    <input
                      type="file"
                      multiple
                      disabled={!selectedUploadTemplateId}
                      accept=".pdf,.docx,.doc,.xlsx,.xls,.csv,.txt,.rtf"
                      onChange={handleUploadMultipleDocumentsWithAi}
                      className="hidden"
                      id="doc-upload-input"
                    />
                    <label
                      htmlFor={selectedUploadTemplateId ? 'doc-upload-input' : undefined}
                      className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-xs shadow-md transition ${
                        selectedUploadTemplateId
                          ? 'bg-[#0057B8] hover:bg-[#004EA6] text-white cursor-pointer active:scale-95'
                          : 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
                      }`}
                    >
                      <Upload className="w-4 h-4" />
                      <span>Choose Files to Upload</span>
                    </label>
                  </div>
                </div>

                {/* Uploaded Documents History & Viewer (Cloudinary Sync) */}
                <DocumentUploadHistorySection
                  currentUser={currentUser}
                  selectedTemplateId={selectedUploadTemplateId || 'template-standard-policy'}
                  selectedTemplateName={
                    templateChoosingChoices.find(t => t.id === selectedUploadTemplateId)?.name ||
                    masterTemplates.find(t => t.id === selectedUploadTemplateId)?.name ||
                    'Policy Template'
                  }
                  onSelectDocumentForCorrection={(historyDoc) => {
                    handleLoadHistoryDocForCorrection(historyDoc);
                  }}
                  onDocIngested={(uploadedRecord, rawFile) => {
                    const tplId = selectedUploadTemplateId || templateChoosingChoices[0]?.id || 'template-standard-policy';
                    executeDocumentIngestion([rawFile], tplId);
                  }}
                />
                </>
              ) : (
                <div className="flex-1 min-h-0 flex flex-col gap-3">
                  {/* Minimal Document Tabs (only when multiple files uploaded) */}
                  {ingestedDocuments.length > 1 && (
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar flex-shrink-0">
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
                            <span className="truncate max-w-[180px]">{doc.document_name}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Active Document Analysis: Side-by-Side Split Screen */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 min-h-0 items-stretch">
                    {/* LEFT PANE: Exact Browser / Docs-Style Uploaded Document Viewer */}
                    <div className="flex flex-col bg-slate-900 rounded-2xl overflow-hidden border border-slate-300 min-h-[520px] lg:h-full shadow-md">
                      <div className="bg-slate-800 text-white px-4 py-2.5 flex items-center justify-between gap-2 text-xs font-semibold flex-shrink-0 border-b border-slate-700">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <FileText className="w-4 h-4 text-blue-400 flex-shrink-0" />
                          <span className="truncate" title={ingestedDocuments[activeIngestedIndex]?.document_name || uploadedFileName}>
                            {ingestedDocuments[activeIngestedIndex]?.document_name || uploadedFileName || 'Document Viewer'}
                          </span>
                        </div>
                      </div>

                      {(() => {
                        const activeDocObj = ingestedDocuments[activeIngestedIndex] || {};
                        const activeDocName = activeDocObj.document_name || uploadedFileName || '';
                        const activeLocalUrl = activeDocObj.local_preview_url || (uploadedPdfPreviewUrl && String(uploadedPdfPreviewUrl).startsWith('blob:') ? uploadedPdfPreviewUrl : '');
                        const activeCloudUrl =
                          activeDocObj.cloud_url ||
                          activeDocObj.file_url ||
                          (uploadedPdfPreviewUrl && /^https?:\/\//i.test(String(uploadedPdfPreviewUrl)) ? uploadedPdfPreviewUrl : '');
                        const activeRawText = activeDocObj.raw_text || uploadedDocRawText || '';

                        return (
                          <BrowserDocumentViewer
                            fileName={activeDocName}
                            fileObj={activeDocObj.file_obj || null}
                            previewUrl={activeLocalUrl || activeCloudUrl}
                            cloudUrl={activeCloudUrl}
                            fallbackRawText={activeRawText}
                            onOpenCompare={() => {
                              const compareUrl = activeCloudUrl || activeLocalUrl || uploadedPdfPreviewUrl;
                              if (!compareUrl) return;
                              navigate('/compare-policy', {
                                state: {
                                  docName: activeDocName,
                                  pdfUrl: compareUrl,
                                  title: title,
                                  sections: sections,
                                },
                              });
                              onClose();
                            }}
                          />
                        );
                      })()}
                    </div>

                    {/* RIGHT PANE: Policy Title First & Editable Sections */}
                    <div className="space-y-4 border border-slate-200 rounded-2xl p-4 bg-white shadow-2xs min-h-[520px] lg:h-full overflow-y-auto custom-scrollbar">
                      {/* 1. POLICY TITLE (FIRST ON TOP) */}
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

                      {/* 2. POLICY SECTIONS & EDITING TOOLS */}
                      <div className="space-y-3">
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
                                  <div className="flex items-center gap-2 flex-1 min-w-0">
                                    <input
                                      type="text"
                                      value={section.title}
                                      onChange={(e) => handleUpdateSectionTitle(section.id || `sec-${idx}`, e.target.value)}
                                      placeholder={`Section ${idx + 1} Title`}
                                      className="font-bold text-xs text-slate-900 bg-white border border-slate-200 focus:border-[#0057B8] focus:ring-1 focus:ring-[#0057B8] px-2.5 py-1 rounded-md outline-none transition flex-1 shadow-2xs"
                                    />
                                    <span className="text-[9.5px] font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded flex-shrink-0">
                                      {section.title === 'Others' ? 'Unmapped' : 'Clause'}
                                    </span>
                                  </div>
                                  {section.type === 'paragraph' && (
                                    <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded uppercase flex-shrink-0">
                                      Paragraph
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-center gap-1 flex-shrink-0">
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
                                    onClick={() => handleDeleteSection(section.id || `sec-${idx}`)}
                                    className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                                    title="Delete Section"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>

                              {/* Rich Interactive Clause Editor */}
                              <SectionRichEditor
                                key={`${editingDraftId || `upload-${activeIngestedIndex}`}-${section.id || idx}`}
                                sectionId={section.id || `sec-${idx}`}
                                value={section.content}
                                sectionIndex={idx}
                                minHeight="120px"
                                onFocus={() => setActiveSectionId(section.id || `sec-${idx}`)}
                                onChange={(val) => handleUpdateSectionContent(section.id || `sec-${idx}`, val)}
                                placeholder="Section clauses, formatted tables, images, and operational specifications..."
                              />

                              {/* Word, character & note counts */}
                              {(() => {
                                const plain = htmlToPlainText(section.content || '');
                                const wCount = plain ? plain.trim().split(/\s+/).filter(Boolean).length : 0;
                                const noteCount = Array.isArray(section.notes) ? section.notes.length : 0;
                                return (
                                  <div className="flex items-center justify-between text-[10px] text-slate-400 px-1 pt-0.5">
                                    <div className="flex items-center gap-2">
                                      <span>Clause {idx + 1}</span>
                                      {noteCount > 0 && (
                                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded font-semibold">
                                          <StickyNote className="w-2.5 h-2.5" />
                                          {noteCount} {noteCount === 1 ? 'note' : 'notes'}
                                        </span>
                                      )}
                                    </div>
                                    <span>{wCount} words • {plain.length} chars</span>
                                  </div>
                                );
                              })()}
                            </div>
                          ))}

                          {/* Add Section Button Only */}
                          <div className="pt-2 flex items-center justify-start">
                            <button
                              type="button"
                              onClick={() => handleAddSection('New Section')}
                              className="px-4 py-2 bg-[#0057B8]/10 hover:bg-[#0057B8]/20 text-[#0057B8] font-bold text-xs rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-2xs border border-[#0057B8]/30"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Add Section</span>
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* 3. DEPARTMENT PARTITION */}
                      <div className="p-3.5 bg-blue-50/40 border border-blue-100/80 rounded-xl">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                            Department Partition
                          </label>
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
            title="Save document as draft on your user account"
          >
            <Save className="w-4 h-4 text-white" />
            <span>{isSubmitting ? 'Saving...' : 'Save as Draft'}</span>
          </button>
        </div>
        </div>
      </div>

      {/* FULL WORD DOCUMENT CLAUSE EXPANDED EDITOR (CONTINUOUS MULTI-PAGE MS WORD WORKSPACE) */}
      {expandedModalSectionId && typeof document !== 'undefined' && createPortal(
        (() => {
          const totalSections = Math.max(1, sections.length);
          const safeActiveIndex = Math.min(Math.max(0, activeExpandedIndex), Math.max(0, sections.length - 1));
          const activeSection = sections[safeActiveIndex] || sections[0];

          if (!activeSection) return null;

          const activePlainBody = htmlToPlainText(activeSection.content || '');
          const cleanWords = activePlainBody ? activePlainBody.trim().split(/\s+/).filter(Boolean).length : 0;
          const charCount = activePlainBody.length;
          const resolvedPagePadding =
            pageMarginPreset === 'narrow'
              ? '36px 44px'
              : pageMarginPreset === 'wide'
                ? '72px 96px'
                : '56px 72px';

          return (
            <div className="fixed inset-0 z-[9999] flex flex-col bg-[#e8edf4] animate-in fade-in duration-150 select-text">
            {/* Top Ribbon Title Bar */}
            <div className="bg-[#0057B8] text-white px-4 sm:px-5 py-2.5 flex flex-wrap items-center justify-between gap-2 shadow-md flex-shrink-0 relative z-20">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-white/15 border border-white/30 flex items-center justify-center font-bold text-white shadow-xs flex-shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="font-bold text-sm text-white truncate">
                      Document Editor • {activeSection.title || `Page ${safeActiveIndex + 1}`}
                    </h2>
                    <span className="text-[11px] font-mono bg-white/20 border border-white/30 px-2 py-0.5 rounded text-white font-semibold flex-shrink-0">
                      Page {safeActiveIndex + 1} of {totalSections}
                    </span>
                  </div>
                  <p className="text-[11px] text-blue-100 truncate">
                    {title || 'Operational Policy Document'} (Draft Revision)
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 flex-shrink-0">
                {/* Plus (+) Add Page Button */}
                <button
                  type="button"
                  onClick={() => handleAddAndOpenPage()}
                  className="px-2.5 py-1.5 text-[11px] font-bold rounded-lg border border-white/40 bg-white/20 hover:bg-white/30 text-white transition flex items-center gap-1 cursor-pointer"
                  title="Add New Page"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Page</span>
                </button>

                {/* Zoom Out / Reset / Zoom In Controls */}
                <div className="inline-flex items-center bg-white/15 border border-white/30 rounded-lg px-1 py-0.5 gap-0.5">
                  <button
                    type="button"
                    onClick={() => setEditorZoomLevel(z => Math.max(25, z - 10))}
                    disabled={editorZoomLevel <= 25}
                    className="p-1 text-white hover:bg-white/20 disabled:opacity-40 rounded cursor-pointer transition"
                    title="Zoom Out (Ctrl + Mouse Wheel)"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditorZoomLevel(100)}
                    className="px-1.5 text-[11px] font-mono font-bold text-white hover:bg-white/20 rounded cursor-pointer"
                    title="Reset Zoom to 100%"
                  >
                    {editorZoomLevel}%
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditorZoomLevel(z => Math.min(200, z + 10))}
                    disabled={editorZoomLevel >= 200}
                    className="p-1 text-white hover:bg-white/20 disabled:opacity-40 rounded cursor-pointer transition"
                    title="Zoom In"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Running Page Header / Footer Toggle */}
                <button
                  type="button"
                  onClick={() => setShowPageHeaderFooter(prev => !prev)}
                  className={`px-2.5 py-1.5 text-[11px] font-semibold rounded-lg border transition flex items-center gap-1 cursor-pointer ${
                    showPageHeaderFooter
                      ? 'bg-white/20 border-white/40 text-white'
                      : 'bg-white/5 border-white/20 text-blue-100 hover:bg-white/15'
                  }`}
                  title="Show or hide editable Header and Footer"
                >
                  <PanelTop className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Header / Footer</span>
                </button>

                {/* Page Margin Presets */}
                <select
                  value={pageMarginPreset}
                  onChange={(e) => setPageMarginPreset(e.target.value)}
                  className="px-2 py-1.5 text-[11px] font-semibold rounded-lg border border-white/30 bg-white/15 text-white outline-none cursor-pointer"
                  title="Page Margins"
                >
                  <option value="normal" className="text-slate-900">Margins: Normal</option>
                  <option value="narrow" className="text-slate-900">Margins: Narrow</option>
                  <option value="wide" className="text-slate-900">Margins: Wide</option>
                </select>

                <button
                  type="button"
                  onClick={handleCloseExpandedEditor}
                  className="px-3.5 py-1.5 bg-white hover:bg-blue-50 text-[#0057B8] font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer active:scale-95"
                  title="Save and return to policy draft view"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Done & Return to Policy</span>
                </button>
                <button
                  type="button"
                  onClick={handleCloseExpandedEditor}
                  className="p-1.5 text-white/80 hover:text-white hover:bg-white/15 rounded-lg cursor-pointer transition"
                  title="Close expanded editor"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Interactive Continuous Multi-Page Word Document Editor */}
            <div className="flex-1 min-h-0 flex overflow-hidden">
              <div className="flex-1 min-w-0 min-h-0 flex flex-col">
                <MultiPageDocumentEditor
                  ref={multiPageEditorRef}
                  sections={sections}
                  initialActiveSectionId={expandedModalSectionId}
                  documentTitle={title || 'Operational Policy Document'}
                  extractedImages={extractedImages}
                  showPageHeaderFooter={showPageHeaderFooter}
                  pagePadding={resolvedPagePadding}
                  zoomLevel={editorZoomLevel}
                  onZoomChange={setEditorZoomLevel}
                  onAddPage={() => handleAddAndOpenPage()}
                  onChangeSectionContent={handleUpdateSectionContent}
                  onChangeSectionTitle={handleUpdateSectionTitle}
                  onChangeSectionField={handleUpdateSectionField}
                  onActivePageChange={(_key, idx) => setActiveExpandedIndex(idx)}
                  placeholder="Type content, format headings, align text, insert formatted tables, drag/resize/rotate images, or insert page breaks..."
                />
              </div>
            </div>

            {/* Bottom Word Status & Actions Ribbon */}
            <div className="bg-white border-t border-slate-300 px-4 sm:px-6 py-2 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600 flex-shrink-0 select-none shadow-xs">
              <div className="flex items-center gap-3 font-mono text-[11.5px] text-slate-500">
                <span className="font-semibold text-slate-700">
                  Page {safeActiveIndex + 1} of {totalSections}
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

              <div className="flex flex-wrap items-center gap-2">
                {/* Zoom Out / Reset / Zoom In Controls */}
                <div className="inline-flex items-center bg-slate-100 border border-slate-300 rounded-xl px-1.5 py-1 gap-1">
                  <button
                    type="button"
                    onClick={() => setEditorZoomLevel(z => Math.max(25, z - 10))}
                    disabled={editorZoomLevel <= 25}
                    className="p-1 text-slate-700 hover:bg-white disabled:opacity-35 rounded-lg cursor-pointer transition"
                    title="Zoom Out (Ctrl + Mouse Wheel)"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditorZoomLevel(100)}
                    className="px-1.5 text-[11px] font-mono font-bold text-slate-700 hover:bg-white rounded cursor-pointer min-w-[42px] text-center"
                    title="Click to reset zoom to 100%"
                  >
                    {editorZoomLevel}%
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditorZoomLevel(z => Math.min(200, z + 10))}
                    disabled={editorZoomLevel >= 200}
                    className="p-1 text-slate-700 hover:bg-white disabled:opacity-35 rounded-lg cursor-pointer transition"
                    title="Zoom In"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Plus (+) Add Page Button */}
                <button
                  type="button"
                  onClick={() => handleAddAndOpenPage()}
                  className="px-3.5 py-1.5 bg-[#0057B8] hover:bg-[#004EA6] text-white font-bold text-xs rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-xs"
                  title="Add a new page to this policy document"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Page</span>
                </button>

                <button
                  type="button"
                  onClick={handleCloseExpandedEditor}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-xs transition cursor-pointer flex items-center gap-1.5"
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
