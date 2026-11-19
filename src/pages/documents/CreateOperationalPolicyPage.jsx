import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
    FileText,
    Layers,
    Search,
    ChevronDown,
    Save,
    X,
    AlertCircle,
    CheckCircle2,
    Folder,
    Sparkles,
    UploadCloud,
    BookOpen,
    Info,
    Tag,
    Maximize2,
    Minimize2,
    GripVertical,
    ArrowLeftRight,
    ArrowRight,
    ArrowLeft,
    FileUp,
    Cpu,
    CheckSquare,
    ChevronUp,
    Plus,
    Trash2,
    Loader2,
    Copy
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { documentManagementApi } from '../../services/api/documentManagementApi';
import RichTextEditor from '../../editor/RichTextEditor';
import FullscreenEditorModal from '../../components/common/FullscreenEditorModal';
import SectionWiseEditor, {
    normalizeSectionContent,
    extractSectionTipTapJson,
    sectionsToCombinedDoc,
} from '../../components/documents/SectionWiseEditor';
import BrowserDocumentViewer from '../../components/documents/BrowserDocumentViewer';
import './createOperationalPolicy.css';

const DEFAULT_STARTER_SECTIONS = [
    {
        id: 'sec-default-1',
        title: '1. Summary',
        section_title: '1. Summary',
        isTemplateSection: true,
        order: 0,
        content: {
            type: 'doc',
            content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Summarize the regulatory intent, purpose, and scope of this policy.' }] }],
        },
    },
    {
        id: 'sec-default-2',
        title: '2. Details',
        section_title: '2. Details',
        isTemplateSection: true,
        order: 1,
        content: {
            type: 'doc',
            content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Define operational rules, thresholds, controls, and responsibilities.' }] }],
        },
    },
];

const escapeHtmlText = (str = '') =>
    String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');

const parseMaybeJsonContent = (val) => {
    if (!val) return null;
    if (typeof val === 'string') {
        const trimmed = val.trim();
        if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
            try {
                const parsed = JSON.parse(trimmed);
                if (parsed && typeof parsed === 'object') return parsed;
            } catch (_) {
                return val;
            }
        }
    }
    return val;
};

const tipTapNodeToHtml = (rawInput) => {
    const node = parseMaybeJsonContent(rawInput);
    if (!node) return '';
    if (typeof node === 'string') return node;
    if (Array.isArray(node)) return node.map(tipTapNodeToHtml).join('');
    if (node.type === 'text') {
        let txt = escapeHtmlText(node.text || '');
        (node.marks || []).forEach((m) => {
            if (m.type === 'bold') txt = `<strong>${txt}</strong>`;
            else if (m.type === 'italic') txt = `<em>${txt}</em>`;
            else if (m.type === 'underline') txt = `<u>${txt}</u>`;
            else if (m.type === 'strike') txt = `<s>${txt}</s>`;
            else if (m.type === 'code') txt = `<code>${txt}</code>`;
            else if (m.type === 'link' && m.attrs?.href) txt = `<a href="${escapeHtmlText(m.attrs.href)}" target="_blank" rel="noopener noreferrer">${txt}</a>`;
        });
        return txt;
    }
    const inner = Array.isArray(node.content) ? node.content.map(tipTapNodeToHtml).join('') : '';
    switch (node.type) {
        case 'doc': return inner;
        case 'paragraph': return `<p>${inner || '<br/>'}</p>`;
        case 'hardBreak': return '<br/>';
        case 'horizontalRule': return '<hr/>';
        case 'heading': {
            const lvl = Math.min(6, Math.max(1, Number(node.attrs?.level) || 2));
            return `<h${lvl}>${inner}</h${lvl}>`;
        }
        case 'bulletList': return `<ul>${inner}</ul>`;
        case 'orderedList': return `<ol>${inner}</ol>`;
        case 'listItem': return `<li>${inner}</li>`;
        case 'codeBlock': return `<pre><code>${inner}</code></pre>`;
        case 'table': return `<table class="editor-table" style="width:100%;border-collapse:collapse;margin:12px 0;"><tbody>${inner}</tbody></table>`;
        case 'tableRow': return `<tr>${inner}</tr>`;
        case 'tableHeader': {
            const cs = node.attrs?.colspan > 1 ? ` colspan="${node.attrs.colspan}"` : '';
            const rs = node.attrs?.rowspan > 1 ? ` rowspan="${node.attrs.rowspan}"` : '';
            return `<th${cs}${rs}>${inner || '<p></p>'}</th>`;
        }
        case 'tableCell': {
            const cs = node.attrs?.colspan > 1 ? ` colspan="${node.attrs.colspan}"` : '';
            const rs = node.attrs?.rowspan > 1 ? ` rowspan="${node.attrs.rowspan}"` : '';
            return `<td${cs}${rs}>${inner || '<p></p>'}</td>`;
        }
        case 'image': return node.attrs?.src ? `<p><img src="${escapeHtmlText(node.attrs.src)}" alt="${escapeHtmlText(node.attrs.alt || 'Image')}" style="max-width:100%;" /></p>` : '';
        case 'blockquote': return `<blockquote>${inner}</blockquote>`;
        default: return inner;
    }
};

const templateSectionsToHtml = (sections = []) => {
    if (!Array.isArray(sections) || sections.length === 0) return '<p></p>';
    return sections
        .slice()
        .sort((a, b) => (a.order ?? a.section_order ?? 0) - (b.order ?? b.section_order ?? 0))
        .map((s, idx) => {
            const title = s.title || s.section_title || `Section ${idx + 1}`;
            const rawContent = parseMaybeJsonContent(s.draft_content ?? s.content);
            const body = rawContent && typeof rawContent === 'object' ? tipTapNodeToHtml(rawContent) : (rawContent || '<p></p>');
            return `<h2>${escapeHtmlText(title)}</h2>\n${body}`;
        })
        .join('\n');
};

const extractPlainFromNode = (node) => {
    if (!node) return '';
    if (typeof node.text === 'string') return node.text;
    if (Array.isArray(node.content)) return node.content.map(extractPlainFromNode).join('');
    return '';
};

const splitTipTapDocByH2Sections = (tipTapDoc) => {
    const nodes = Array.isArray(tipTapDoc?.content) ? tipTapDoc.content : [];
    const grouped = [];
    let current = null;

    nodes.forEach((node) => {
        if (node?.type === 'heading' && Number(node?.attrs?.level) === 2) {
            const title = extractPlainFromNode(node).trim();
            if (title) {
                if (current) grouped.push(current);
                current = { title, contentNodes: [] };
                return;
            }
        }
        if (current) {
            current.contentNodes.push(node);
        }
    });
    if (current) grouped.push(current);

    if (grouped.length < 2) return null;
    return grouped.map((sec, idx) => ({
        title: sec.title,
        order: idx,
        content: {
            type: 'doc',
            content: sec.contentNodes.length > 0
                ? sec.contentNodes
                : [{ type: 'paragraph', content: [{ type: 'text', text: '' }] }],
        },
    }));
};

export default function CreateOperationalPolicyPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { user } = useAuth();

    const isSuperAdmin = user?.isSuperAdmin === true || (user?.roles || []).some(r => {
        const name = typeof r === 'string' ? r : r.role_name;
        return name?.toLowerCase() === 'super admin';
    });
    const permList = user?.permissionStrings || user?.permissions || [];
    const hasTemplateUpdatePerm = isSuperAdmin || permList.includes('templates:update');
    const hasTemplateCreatePerm = isSuperAdmin || permList.includes('templates:create');

    // Query params: pre-selected tab, library ID, or source document to copy
    const initialLibraryId = searchParams.get('libraryId') || '';
    const initialTabParam = searchParams.get('tab');
    const initialTab = ['direct', 'master', 'upload'].includes(initialTabParam) ? initialTabParam : 'direct';
    const initialSourceDocId = searchParams.get('sourceDocId') || '';

    // Tabs: 'direct' | 'master' | 'upload'
    const [activeTab, setActiveTab] = useState(initialTab);

    // Libraries list & selected library
    const [libraries, setLibraries]             = useState([]);
    const [selectedLibraryId, setSelectedLibraryId] = useState(initialLibraryId);

    // Master Library tab state
    const [masterSourceLibFilter, setMasterSourceLibFilter] = useState('all');
    const [masterSearchQuery, setMasterSearchQuery] = useState('');
    const [masterDocs, setMasterDocs] = useState([]);
    const [isLoadingMasterDocs, setIsLoadingMasterDocs] = useState(false);
    const [isCopyingFromMaster, setIsCopyingFromMaster] = useState(false);
    const [masterErrorMsg, setMasterErrorMsg] = useState('');
    const handledSourceDocRef = useRef('');

    // Direct tab — Target Master Library searchable combobox
    const [directLibrarySearch, setDirectLibrarySearch]           = useState('');
    const [isDirectLibraryDropdownOpen, setIsDirectLibraryDropdownOpen] = useState(false);
    const directLibraryWrapRef                                    = useRef(null);

    // Form inputs
    const [policyName, setPolicyName]           = useState('');
    const [description, setDescription]         = useState('');
    const [documentType, setDocumentType]       = useState('policy');

    // Templates list & searchable dropdown state
    const [templates, setTemplates]             = useState([]);
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [templateSearch, setTemplateSearch]   = useState('');
    const [isTemplateDropdownOpen, setIsTemplateDropdownOpen] = useState(false);
    const templateWrapRef                       = useRef(null);

    // Editor content state (section-wise + unified preview)
    const [directSections, setDirectSections] = useState(DEFAULT_STARTER_SECTIONS);
    const hasTouchedDirectSectionsRef = useRef(false);
    const [editorJsonContent, setEditorJsonContent] = useState(null);
    const [editorInitialContent, setEditorInitialContent] = useState(null);
    const [editorKey, setEditorKey]             = useState(Date.now());
    const [isFullscreen, setIsFullscreen]       = useState(false);

    // Submit state & feedback
    const [isSubmitting, setIsSubmitting]       = useState(false);
    const [errorMsg, setErrorMsg]               = useState('');
    const [loadedTemplateAlert, setLoadedTemplateAlert] = useState(null);

    // Store sections back into an existing or new template modal
    const [isStoreTemplateOpen, setIsStoreTemplateOpen] = useState(false);
    const [storeTemplateMode, setStoreTemplateMode] = useState('existing');
    const [targetExistingTemplateId, setTargetExistingTemplateId] = useState('');
    const [newTemplateName, setNewTemplateName] = useState('');
    const [newTemplateCategory, setNewTemplateCategory] = useState('Operational Policy');
    const [newTemplateDescription, setNewTemplateDescription] = useState('');
    const [isStoringTemplate, setIsStoringTemplate] = useState(false);
    const [storeTemplateError, setStoreTemplateError] = useState('');

    // ── Upload Stepper State ──────────────────────────────────────────────────
    const [uploadStep, setUploadStep] = useState(1); // 1 | 2 | 3 | 4
    const [uploadedFile, setUploadedFile] = useState(null);
    const [uploadPreviewUrl, setUploadPreviewUrl] = useState(null);
    const [isDragOver, setIsDragOver] = useState(false);
    const uploadFileRef = useRef(null);

    const [useTemplateToFormat, setUseTemplateToFormat] = useState(true);
    const [selectedUploadTemplate, setSelectedUploadTemplate] = useState(null);
    const [uploadTemplateSearch, setUploadTemplateSearch] = useState('');

    const [isExtracting, setIsExtracting] = useState(false);
    const [extractionResult, setExtractionResult] = useState(null);
    const [extractionError, setExtractionError] = useState('');

    const [uploadPanelsSwapped, setUploadPanelsSwapped] = useState(false);
    const [isReviewFullscreen, setIsReviewFullscreen] = useState(false);
    const [uploadSections, setUploadSections] = useState([]);
    const [uploadViewMode, setUploadViewMode] = useState('sections'); // 'sections' | 'document'
    const [uploadEditorContent, setUploadEditorContent] = useState(null);
    const [uploadEditorKey, setUploadEditorKey] = useState(Date.now());
    const [unmappedDismissed, setUnmappedDismissed] = useState(new Set());
    const [unmappedCollapsed, setUnmappedCollapsed] = useState(false);
    const [copiedUnmappedKey, setCopiedUnmappedKey] = useState(null);

    // Unmapped container free dragging state
    const [unmappedPos, setUnmappedPos] = useState(null); // { x, y }
    const isDraggingUnmappedRef = useRef(false);
    const unmappedDragStartRef = useRef({ mouseX: 0, mouseY: 0, startX: 0, startY: 0 });
    const unmappedContainerRef = useRef(null);

    const [uploadPolicyName, setUploadPolicyName] = useState('');
    const [uploadDescription, setUploadDescription] = useState('');
    const [uploadLibraryId, setUploadLibraryId] = useState(initialLibraryId || '');
    const [uploadDocType, setUploadDocType] = useState('policy');
    const [uploadError, setUploadError] = useState('');
    const [isUploadSubmitting, setIsUploadSubmitting] = useState(false);

    // Searchable library combobox for upload Step 4
    const [uploadLibrarySearch, setUploadLibrarySearch] = useState('');
    const [isUploadLibraryDropdownOpen, setIsUploadLibraryDropdownOpen] = useState(false);
    const uploadLibraryWrapRef = useRef(null);
    const uploadStepPanelRef = useRef(null);

    // Scroll step panel to top whenever step changes
    useEffect(() => {
        if (uploadStepPanelRef.current) {
            uploadStepPanelRef.current.scrollTop = 0;
        }
    }, [uploadStep]);

    // Start the review editor at the beginning when switching between fitted
    // and fullscreen layouts so the document doesn't reopen mid-page.
    const resetUploadEditorScroll = () => {
        document.querySelectorAll('.upload-review-container .modern-editor-workspace')
            .forEach(workspace => { workspace.scrollTop = 0; workspace.scrollLeft = 0; });
    };

    useEffect(() => {
        if (uploadStep !== 3) return;
        requestAnimationFrame(resetUploadEditorScroll);
        const timer = setTimeout(resetUploadEditorScroll, 120);
        return () => clearTimeout(timer);
    }, [isReviewFullscreen, uploadStep, uploadEditorKey]);

    // Sync URL query params when navigated from Sidebar Copy Template / + / PolicyViewer
    useEffect(() => {
        const t = searchParams.get('tab');
        if (t && ['direct', 'master', 'upload'].includes(t)) {
            setActiveTab(t);
        }
        const lid = searchParams.get('libraryId');
        if (lid) {
            setSelectedLibraryId(lid);
            setUploadLibraryId(lid);
        }
    }, [searchParams]);

    // Load available libraries, approved templates (Template 1 default), and live Master Library policies
    useEffect(() => {
        let isMounted = true;

        // 1. Fetch Libraries
        documentManagementApi.getLibraries({ limit: 100 })
            .then(res => {
                if (!isMounted) return;
                const libs = res?.data || [];
                setLibraries(libs);
                if (!selectedLibraryId && libs.length > 0) {
                    setSelectedLibraryId(libs[0].id);
                }
            })
            .catch(err => console.error('Failed to load libraries:', err));

        // 2. Fetch Approved Templates & auto-inherit DB Template 1
        documentManagementApi.getTemplates({ status: 'approved', limit: 50 })
            .then(res => {
                if (!isMounted) return;
                const rawTmpls = res?.data?.templates || res?.data || [];
                const tmpls = [...rawTmpls].sort((a, b) => {
                    const aIsT1 = a.template_id === 'TMPL-001' || /template\s*1/i.test(a.template_name || '');
                    const bIsT1 = b.template_id === 'TMPL-001' || /template\s*1/i.test(b.template_name || '');
                    if (aIsT1 && !bIsT1) return -1;
                    if (!aIsT1 && bIsT1) return 1;
                    return String(a.template_id || '').localeCompare(String(b.template_id || ''));
                });
                setTemplates(tmpls);
                const template1 = tmpls.find(t => t.template_id === 'TMPL-001' || /template\s*1/i.test(t.template_name || '')) || tmpls[0];
                if (template1) {
                    setSelectedUploadTemplate(prev => prev || template1);
                    if (!hasTouchedDirectSectionsRef.current && !initialSourceDocId && Array.isArray(template1.structure?.sections) && template1.structure.sections.length > 0) {
                        const starterFromT1 = template1.structure.sections
                            .slice()
                            .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                            .map((s, idx) => ({
                                id: `sec-t1-${idx}-${Date.now()}`,
                                title: s.title || `Section ${idx + 1}`,
                                section_title: s.title || `Section ${idx + 1}`,
                                isTemplateSection: true,
                                order: idx,
                                content: normalizeSectionContent(s.content || (s.description ? `<p>${escapeHtmlText(s.description)}</p>` : '')),
                            }));
                        setSelectedTemplate(prev => prev || template1);
                        setTemplateSearch(prev => prev || template1.template_name || '');
                        setDirectSections(starterFromT1);
                    }
                }
            })
            .catch(err => console.error('Failed to load templates:', err));

        // 3. Fetch Active Master Library Documents
        setIsLoadingMasterDocs(true);
        documentManagementApi.getDocuments({ status: 'active', limit: 100 })
            .then(res => {
                if (!isMounted) return;
                const list = Array.isArray(res?.data) ? res.data : (Array.isArray(res?.data?.documents) ? res.data.documents : []);
                setMasterDocs(list);
            })
            .catch(err => console.error('Failed to load master documents:', err))
            .finally(() => {
                if (isMounted) setIsLoadingMasterDocs(false);
            });

        return () => { isMounted = false; };
    }, []);

    // Close template dropdown on outside click
    useEffect(() => {
        const handler = (e) => {
            if (templateWrapRef.current && !templateWrapRef.current.contains(e.target)) {
                setIsTemplateDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // Close upload library dropdown on outside click
    useEffect(() => {
        const handler = (e) => {
            if (uploadLibraryWrapRef.current && !uploadLibraryWrapRef.current.contains(e.target)) {
                setIsUploadLibraryDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // Close direct library dropdown on outside click
    useEffect(() => {
        const handler = (e) => {
            if (directLibraryWrapRef.current && !directLibraryWrapRef.current.contains(e.target)) {
                setIsDirectLibraryDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // Handle Esc key for fullscreen review mode
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && isReviewFullscreen) {
                setIsReviewFullscreen(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isReviewFullscreen]);

    // Filter templates for searchable combobox
    const filteredTemplates = useMemo(() => {
        if (!templateSearch.trim()) return templates;
        const q = templateSearch.toLowerCase().trim();
        return templates.filter(t =>
            (t.template_name || '').toLowerCase().includes(q) ||
            (t.category || '').toLowerCase().includes(q) ||
            (t.description || '').toLowerCase().includes(q)
        );
    }, [templates, templateSearch]);

    // Filter libraries for upload Step 4 searchable combobox
    const uploadFilteredLibraries = useMemo(() => {
        if (!uploadLibrarySearch.trim()) return libraries;
        const q = uploadLibrarySearch.toLowerCase();
        return libraries.filter(l => (l.library_name || '').toLowerCase().includes(q));
    }, [libraries, uploadLibrarySearch]);

    // Filter libraries for Direct tab Target Master Library combobox
    const filteredDirectLibraries = useMemo(() => {
        if (!directLibrarySearch.trim()) return libraries;
        const q = directLibrarySearch.toLowerCase();
        return libraries.filter(l => (l.library_name || '').toLowerCase().includes(q));
    }, [libraries, directLibrarySearch]);

    // When user selects a template -> automatically load all sections into Section-Wise Editor!
    const handleSelectTemplate = (tmpl) => {
        setSelectedTemplate(tmpl);
        setTemplateSearch(tmpl.template_name);
        setIsTemplateDropdownOpen(false);

        if (!policyName.trim()) {
            setPolicyName(tmpl.template_name.replace(/^Template\s*\d+\s*[:—-]\s*/i, '').trim() || tmpl.template_name);
        }
        if (!description.trim() && tmpl.description) {
            setDescription(tmpl.description);
        }

        const tplSections = (tmpl.structure?.sections || [])
            .slice()
            .sort((a, b) => (a.order ?? a.section_order ?? 0) - (b.order ?? b.section_order ?? 0));

        const nextSections = tplSections.length > 0
            ? tplSections.map((s, idx) => ({
                id: `sec-tpl-${idx}-${Date.now()}`,
                title: s.title || s.section_title || `Section ${idx + 1}`,
                section_title: s.title || s.section_title || `Section ${idx + 1}`,
                isTemplateSection: true,
                order: idx,
                content: normalizeSectionContent(s.content || (s.description ? `<p>${escapeHtmlText(s.description)}</p>` : '')),
            }))
            : DEFAULT_STARTER_SECTIONS;

        hasTouchedDirectSectionsRef.current = true;
        setDirectSections(nextSections);

        const combined = sectionsToCombinedDoc(nextSections, true);
        setEditorInitialContent(combined);
        setEditorJsonContent(combined);
        setEditorKey(Date.now());

        setLoadedTemplateAlert(`Template "${tmpl.template_name}" loaded (${nextSections.length} sections).`);
        setTimeout(() => setLoadedTemplateAlert(null), 5000);
    };

    // Load a Master Library document as a template into the Section-Wise Editor
    const handleCopyFromMasterLibrary = async (sourceDoc, templateIdOverride = 'keep-original') => {
        const chosenTplId = templateIdOverride || 'keep-original';
        const chosenTpl = chosenTplId === 'keep-original'
            ? null
            : (templates.find(t => (t.id || t._id) === chosenTplId) || templates[0] || null);

        setMasterErrorMsg('');
        setIsCopyingFromMaster(true);

        try {
            let sourceSections = [];
            let sourceMeta = sourceDoc || null;

            if (sourceDoc?.id) {
                const metaRes = await documentManagementApi.getDocumentMetadata(sourceDoc.id);
                const fullDoc = metaRes?.data || sourceDoc;
                sourceMeta = fullDoc;
                sourceSections = Array.isArray(fullDoc.sections) ? fullDoc.sections : [];
            }

            let mappedSectionCards = [];
            if (chosenTpl && Array.isArray(chosenTpl.structure?.sections) && chosenTpl.structure.sections.length > 0) {
                if (sourceSections.length === 0) {
                    mappedSectionCards = chosenTpl.structure.sections.map((tSec, idx) => ({
                        id: `sec-master-${idx}-${Date.now()}`,
                        title: tSec.title || `Section ${idx + 1}`,
                        section_title: tSec.title || `Section ${idx + 1}`,
                        isTemplateSection: true,
                        order: idx,
                        content: normalizeSectionContent(tSec.content),
                    }));
                } else {
                    const unclaimed = new Set(sourceSections.map((_, i) => i));
                    mappedSectionCards = chosenTpl.structure.sections.map((tSec, idx) => {
                        const normT = (tSec.title || '').toLowerCase().replace(/^\d+\.?\s*/, '').replace(/[^a-z0-9]/g, '');
                        const matchedIdx = sourceSections.findIndex((sSec, sIdx) => {
                            if (!unclaimed.has(sIdx)) return false;
                            const normS = (sSec.section_title || sSec.title || '').toLowerCase().replace(/^\d+\.?\s*/, '').replace(/[^a-z0-9]/g, '');
                            return normS === normT || normS.includes(normT) || normT.includes(normS);
                        });
                        if (matchedIdx >= 0) {
                            unclaimed.delete(matchedIdx);
                            const matched = sourceSections[matchedIdx];
                            return {
                                id: `sec-master-${idx}-${Date.now()}`,
                                title: tSec.title,
                                section_title: tSec.title,
                                isTemplateSection: true,
                                order: idx,
                                content: normalizeSectionContent(matched.draft_content || matched.content || tSec.content),
                            };
                        }
                        return {
                            id: `sec-master-${idx}-${Date.now()}`,
                            title: tSec.title,
                            section_title: tSec.title,
                            isTemplateSection: true,
                            order: idx,
                            content: normalizeSectionContent(tSec.content),
                        };
                    });

                    if (unclaimed.size > 0) {
                        Array.from(unclaimed).forEach((i, extraIdx) => {
                            const sec = sourceSections[i];
                            const t = sec.section_title || sec.title || `Clause ${i + 1}`;
                            mappedSectionCards.push({
                                id: `sec-master-extra-${extraIdx}-${Date.now()}`,
                                title: t,
                                section_title: t,
                                isTemplateSection: false,
                                isCustom: true,
                                order: mappedSectionCards.length,
                                content: normalizeSectionContent(sec.draft_content ?? sec.content),
                            });
                        });
                    }
                }
            } else if (sourceSections.length > 0) {
                mappedSectionCards = sourceSections
                    .slice()
                    .sort((a, b) => (a.section_order ?? a.order ?? 0) - (b.section_order ?? b.order ?? 0))
                    .map((sec, idx) => {
                        const t = sec.section_title || sec.title || `Section ${idx + 1}`;
                        return {
                            id: `sec-master-${idx}-${Date.now()}`,
                            title: t,
                            section_title: t,
                            isTemplateSection: true,
                            order: idx,
                            content: normalizeSectionContent(sec.draft_content ?? sec.content),
                        };
                    });
            } else {
                mappedSectionCards = DEFAULT_STARTER_SECTIONS;
            }

            if (initialLibraryId) {
                setSelectedLibraryId(initialLibraryId);
            } else if (sourceMeta?.library_id) {
                setSelectedLibraryId(sourceMeta.library_id);
            }

            if (chosenTpl) {
                setSelectedTemplate(chosenTpl);
                setTemplateSearch(chosenTpl.template_name);
            } else {
                setSelectedTemplate(null);
                setTemplateSearch('');
            }

            const newTitle = sourceMeta?.document_name
                ? `${sourceMeta.document_name} (Copy)`
                : (chosenTpl?.template_name?.replace(/^Template\s*\d+\s*[:—-]\s*/i, '').trim() || 'New Policy Draft');
            setPolicyName(newTitle);
            setDescription(sourceMeta?.description || chosenTpl?.description || '');

            hasTouchedDirectSectionsRef.current = true;
            setDirectSections(mappedSectionCards);

            const combined = sectionsToCombinedDoc(mappedSectionCards, true);
            setEditorInitialContent(combined);
            setEditorJsonContent(combined);
            setEditorKey(Date.now());
            setActiveTab('direct');
            window.scrollTo({ top: 0, behavior: 'smooth' });

            setLoadedTemplateAlert(
                sourceMeta?.document_name
                    ? `Loaded "${sourceMeta.document_name}" (${mappedSectionCards.length} sections) into the editor.`
                    : `Started new draft from "${chosenTpl?.template_name || 'Template'}".`
            );
            setTimeout(() => setLoadedTemplateAlert(null), 6000);
        } catch (err) {
            setMasterErrorMsg(err.message || 'Failed to load document as template.');
        } finally {
            setIsCopyingFromMaster(false);
        }
    };

    // Auto-handle ?sourceDocId= deep link if provided
    useEffect(() => {
        if (!initialSourceDocId || templates.length === 0) return;
        if (handledSourceDocRef.current === initialSourceDocId) return;
        const foundDoc = masterDocs.find(d => d.id === initialSourceDocId) || { id: initialSourceDocId };
        handledSourceDocRef.current = initialSourceDocId;
        handleCopyFromMasterLibrary(foundDoc, 'keep-original');
    }, [initialSourceDocId, templates, masterDocs]);

    // Open modal to store current SectionWiseEditor sections into an existing or new template
    const openStoreTemplateModal = () => {
        const defaultTpl = selectedTemplate || templates[0] || null;
        setStoreTemplateError('');
        setStoreTemplateMode(hasTemplateUpdatePerm && defaultTpl ? 'existing' : 'new');
        setTargetExistingTemplateId(defaultTpl?.id || '');
        setNewTemplateName(
            policyName.trim() ||
            (defaultTpl ? `${defaultTpl.template_name} (Custom)` : 'Custom Policy Template')
        );
        setNewTemplateCategory(defaultTpl?.category || 'Operational Policy');
        setNewTemplateDescription(description.trim() || defaultTpl?.description || '');
        setIsStoreTemplateOpen(true);
    };

    const handleStoreToTemplate = async (e) => {
        if (e && e.preventDefault) e.preventDefault();
        if (!Array.isArray(directSections) || directSections.length === 0) {
            setStoreTemplateError('At least one section is required before saving to a template.');
            return;
        }

        const serializedSections = directSections.map((sec, idx) => ({
            title: (sec.section_title || sec.title || `Section ${idx + 1}`).trim() || `Section ${idx + 1}`,
            order: idx,
            content: extractSectionTipTapJson(sec.content),
            subsections: [],
        }));

        setIsStoringTemplate(true);
        setStoreTemplateError('');

        try {
            if (storeTemplateMode === 'existing') {
                const targetTpl = templates.find(t => t.id === targetExistingTemplateId);
                if (!targetTpl) {
                    setStoreTemplateError('Please select an existing template to update.');
                    return;
                }
                const res = await documentManagementApi.updateTemplate(targetTpl.id, {
                    template_name: targetTpl.template_name,
                    category: targetTpl.category || 'General',
                    description: targetTpl.description ?? null,
                    structure: { sections: serializedSections },
                });
                const updatedTpl = res?.data || {
                    ...targetTpl,
                    structure: { sections: serializedSections },
                };
                setTemplates(prev => prev.map(t => (t.id === updatedTpl.id ? { ...t, ...updatedTpl } : t)));
                setSelectedTemplate(updatedTpl);
                setTemplateSearch(updatedTpl.template_name || '');
                setIsStoreTemplateOpen(false);
                setLoadedTemplateAlert(
                    `Stored ${serializedSections.length} sections into existing template "${updatedTpl.template_name}".`
                );
                setTimeout(() => setLoadedTemplateAlert(null), 6000);
            } else {
                if (!newTemplateName.trim()) {
                    setStoreTemplateError('Template name is required.');
                    return;
                }
                const res = await documentManagementApi.createTemplate({
                    template_name: newTemplateName.trim(),
                    category: newTemplateCategory.trim() || 'Operational Policy',
                    description: newTemplateDescription.trim() || null,
                    structure: { sections: serializedSections },
                });
                const createdTpl = res?.data;
                if (createdTpl && createdTpl.status === 'approved') {
                    setTemplates(prev => [createdTpl, ...prev]);
                    setSelectedTemplate(createdTpl);
                    setTemplateSearch(createdTpl.template_name || '');
                }
                setIsStoreTemplateOpen(false);
                setLoadedTemplateAlert(
                    createdTpl?.status === 'approved'
                        ? `Created & approved template "${newTemplateName.trim()}" with ${serializedSections.length} sections.`
                        : `Submitted template "${newTemplateName.trim()}" (${serializedSections.length} sections) for Admin approval.`
                );
                setTimeout(() => setLoadedTemplateAlert(null), 6500);
            }
        } catch (err) {
            setStoreTemplateError(err?.message || 'Failed to store sections into template.');
        } finally {
            setIsStoringTemplate(false);
        }
    };

    // Save Policy as Draft
    const handleSaveToDraft = async (e) => {
        if (e && e.preventDefault) e.preventDefault();

        if (!selectedLibraryId) {
            setErrorMsg('Please select a target Master Library.');
            return;
        }
        if (!policyName.trim()) {
            setErrorMsg('Policy / Document Name is required.');
            return;
        }

        setIsSubmitting(true);
        setErrorMsg('');

        try {
            const sections = (Array.isArray(directSections) && directSections.length > 0)
                ? directSections.map((sec, idx) => ({
                    title: (sec.section_title || sec.title || `Section ${idx + 1}`).trim(),
                    order: idx,
                    content: extractSectionTipTapJson(sec.content),
                }))
                : [{
                    title: '1. Details',
                    order: 0,
                    content: extractSectionTipTapJson(editorJsonContent),
                }];

            const payload = {
                library_id:    selectedLibraryId,
                document_name: policyName.trim(),
                description:   description.trim() || null,
                document_type: documentType,
                source_type:   selectedTemplate ? 'template' : 'manual',
                status:        'draft',
                sections,
            };

            const res = await documentManagementApi.createDocument(payload);

            if (res?.success) {
                // Navigate to Change Management with state feedback
                navigate('/change-management', {
                    state: {
                        toastMessage: `Policy "${policyName.trim()}" saved as draft and submitted for Super Admin review.`
                    }
                });
            } else {
                setErrorMsg(res?.message || 'Failed to save policy draft.');
            }
        } catch (err) {
            setErrorMsg(err.message || 'Error communicating with server.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        if (policyName.trim() || editorJsonContent || uploadedFile || uploadPolicyName.trim()) {
            if (window.confirm('Are you sure you want to discard unsaved policy drafts?')) {
                navigate(-1);
            }
        } else {
            navigate(-1);
        }
    };

    // ── Upload Stepper Helpers ────────────────────────────────────────────────
    const handleUploadFileSelect = (file) => {
        if (!file) return;
        const allowed = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        if (!allowed.includes(file.type) && !file.name.match(/\.(pdf|doc|docx)$/i)) {
            setUploadError('Only PDF, DOC, or DOCX files are supported.');
            return;
        }
        if (file.size > 40 * 1024 * 1024) {
            setUploadError('File size must be under 40 MB.');
            return;
        }
        setUploadError('');
        setUploadedFile(file);
        if (uploadPreviewUrl) URL.revokeObjectURL(uploadPreviewUrl);
        setUploadPreviewUrl(URL.createObjectURL(file));
    };

    const handleUploadDrop = (e) => {
        e.preventDefault();
        setIsDragOver(false);
        const file = e.dataTransfer.files?.[0];
        handleUploadFileSelect(file);
    };

    const convertAISectionsToHtml = (sections = []) => {
        if (!sections || !sections.length) return '<p></p>';
        // Join sections with just a paragraph gap — NO explicit page-break divs.
        // Page breaks only appear when the user inserts them manually (toolbar / Ctrl+Enter),
        // exactly like Microsoft Word: content flows continuously and page boundaries are
        // shown as a visual grey gap in the editor workspace.
        return sections.map((sec, idx) => {
            const title = sec.section_title || sec.title || `Section ${idx + 1}`;
            const contentTemplate = document.createElement('template');
            contentTemplate.innerHTML = sec.content || '<p></p>';
            contentTemplate.content
                .querySelectorAll('div[data-type="page-break"], div.document-page-break, hr.page-break')
                .forEach((pageBreak) => pageBreak.remove());
            return `<h2>${title}</h2>\n${contentTemplate.innerHTML}`;
        }).join('\n<p></p>\n');
    };

    const handleRunAIExtraction = async () => {
        if (!uploadedFile) return;
        if (useTemplateToFormat && !selectedUploadTemplate) {
            setExtractionError('Please select a template or switch off "Use template to format".');
            return;
        }
        setIsExtracting(true);
        setExtractionError('');
        try {
            const formData = new FormData();
            formData.append('file', uploadedFile);
            formData.append('useTemplate', String(useTemplateToFormat));
            if (useTemplateToFormat && selectedUploadTemplate) {
                formData.append('templateId', selectedUploadTemplate.id || selectedUploadTemplate._id);
            }
            const res = await documentManagementApi.aiExtractPolicy(formData);
            if (res?.success) {
                const extracted = res.data?.extracted || res.data;
                setExtractionResult(extracted);
                setUploadPolicyName(extracted.document_name || uploadedFile.name.replace(/\.[^.]+$/, ''));
                setUploadDescription(extracted.description || '');
                if (!uploadLibraryId && libraries.length > 0) {
                    setUploadLibraryId(libraries[0].id);
                }
                const extractedList = Array.isArray(extracted.sections) ? extracted.sections : [];
                const normalizedUploadSecs = extractedList.map((sec, idx) => ({
                    id: `sec-upload-${idx}-${Date.now()}`,
                    title: sec.section_title || sec.title || `Section ${idx + 1}`,
                    section_title: sec.section_title || sec.title || `Section ${idx + 1}`,
                    isTemplateSection: true,
                    order: idx,
                    content: normalizeSectionContent(sec.content || '<p></p>'),
                }));
                setUploadSections(normalizedUploadSecs);
                setUploadViewMode(normalizedUploadSecs.length > 0 ? 'sections' : 'document');
                const fullHtmlDoc = convertAISectionsToHtml(extractedList);
                setUploadEditorContent(fullHtmlDoc);
                setUploadEditorKey(Date.now());
                setUnmappedDismissed(new Set());
                setUploadStep(3);
            } else {
                setExtractionError(res?.message || 'AI extraction failed.');
            }
        } catch (err) {
            setExtractionError(err.message || 'AI extraction failed. Please try again.');
        } finally {
            setIsExtracting(false);
        }
    };

    // Free dragging for Unmapped Clauses container
    const handleUnmappedDragStart = (e) => {
        if (e.button !== 0) return;
        // Don't drag if clicking buttons inside the header
        if (e.target.closest('button')) return;
        e.preventDefault();

        const rect = unmappedContainerRef.current 
            ? unmappedContainerRef.current.getBoundingClientRect() 
            : { left: window.innerWidth - 340, top: window.innerHeight - 450 };

        const startX = unmappedPos ? unmappedPos.x : rect.left;
        const startY = unmappedPos ? unmappedPos.y : rect.top;

        isDraggingUnmappedRef.current = true;
        unmappedDragStartRef.current = {
            mouseX: e.clientX,
            mouseY: e.clientY,
            startX,
            startY
        };

        const onMouseMove = (moveEvt) => {
            if (!isDraggingUnmappedRef.current) return;
            const deltaX = moveEvt.clientX - unmappedDragStartRef.current.mouseX;
            const deltaY = moveEvt.clientY - dragDeltaY(moveEvt);

            const newX = Math.max(10, Math.min(window.innerWidth - 340, unmappedDragStartRef.current.startX + deltaX));
            const newY = Math.max(10, Math.min(window.innerHeight - 80, unmappedDragStartRef.current.startY + (moveEvt.clientY - unmappedDragStartRef.current.mouseY)));

            setUnmappedPos({ x: newX, y: newY });
        };

        const dragDeltaY = (evt) => unmappedDragStartRef.current.mouseY;

        const onMouseUp = () => {
            isDraggingUnmappedRef.current = false;
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
        };

        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
    };

    const handleInsertUnmapped = (clause) => {
        const clauseTitle = clause.title || 'Unmapped Clause';
        const clauseContent = clause.content || '';

        setUploadSections(prev => ([
            ...prev,
            {
                id: `sec-unmapped-${Date.now()}`,
                title: clauseTitle,
                section_title: clauseTitle,
                isTemplateSection: false,
                isCustom: true,
                order: prev.length,
                section_order: prev.length,
                content: normalizeSectionContent(clauseContent),
            },
        ]));

        setUploadEditorContent(prev => {
            if (typeof prev === 'string') {
                return `${prev}\n<h3 style="color: #1e293b; margin-top: 18px;">${clauseTitle}</h3>\n${clauseContent}`;
            }
            if (prev && prev.type === 'doc') {
                return {
                    ...prev,
                    content: [
                        ...(prev.content || []),
                        { type: 'heading', attrs: { level: 3 }, content: [{ type: 'text', text: clauseTitle }] },
                        { type: 'paragraph', content: [{ type: 'text', text: clauseContent.replace(/<[^>]+>/g, ' ').trim() }] }
                    ]
                };
            }
            return `<p>${clauseContent}</p>`;
        });
        setUploadEditorKey(Date.now());
    };

    const handleCopyUnmapped = async (clause, key) => {
        const plainText = [clause.title, clause.content]
            .filter(Boolean)
            .map(value => {
                const container = document.createElement('div');
                container.innerHTML = value;
                return container.textContent || '';
            })
            .join('\n\n')
            .trim();

        try {
            await navigator.clipboard.writeText(plainText);
            setCopiedUnmappedKey(key);
            window.setTimeout(() => setCopiedUnmappedKey(current => current === key ? null : current), 1800);
        } catch (error) {
            console.error('Could not copy unmapped clause:', error);
        }
    };

    const handleUploadSaveToDraft = async () => {
        if (!uploadLibraryId) {
            setUploadError('Please select a target library.');
            return;
        }
        if (!uploadPolicyName.trim()) {
            setUploadError('Policy name is required.');
            return;
        }
        setIsUploadSubmitting(true);
        setUploadError('');
        try {
            let sections = [];
            if (Array.isArray(uploadSections) && uploadSections.length > 0) {
                sections = uploadSections.map((sec, idx) => ({
                    title: (sec.section_title || sec.title || `Section ${idx + 1}`).trim(),
                    order: idx,
                    content: extractSectionTipTapJson(sec.content),
                }));
            } else {
                let cleanUploadContent = null;
                if (uploadEditorContent) {
                    const rawJson = uploadEditorContent?.json || (uploadEditorContent?.type === 'doc' ? uploadEditorContent : null);
                    if (rawJson) {
                        cleanUploadContent = JSON.parse(JSON.stringify(rawJson));
                    }
                }
                if (!cleanUploadContent) {
                    throw new Error('The extracted document is still loading. Please wait a moment and try again.');
                }
                const selectedLibName = libraries.find(l => l.id === uploadLibraryId)?.library_name || 'Banking';
                const splitUploadSections = splitTipTapDocByH2Sections(cleanUploadContent);
                sections = splitUploadSections || [
                    {
                        title: '1. Configuration',
                        order: 0,
                        content: {
                            type: 'doc',
                            content: [{ type: 'paragraph', content: [{ type: 'text', text: `Document classification: Operational Policy. Library: ${selectedLibName}. Source: ${uploadedFile?.name || 'Upload'}${useTemplateToFormat && selectedUploadTemplate ? ` | Inherited Template: ${selectedUploadTemplate.template_name}` : ''}.` }] }]
                        }
                    },
                    {
                        title: '2. Summary',
                        order: 1,
                        content: {
                            type: 'doc',
                            content: [{ type: 'paragraph', content: [{ type: 'text', text: uploadDescription.trim() || 'Extracted executive summary.' }] }]
                        }
                    },
                    {
                        title: '3. Details',
                        order: 2,
                        content: cleanUploadContent
                    }
                ];
            }

            const payload = {
                library_id:    uploadLibraryId,
                document_name: uploadPolicyName.trim(),
                description:   uploadDescription.trim() || null,
                document_type: uploadDocType,
                source_type:   'upload',
                status:        'draft',
                sections,
            };

            const res = await documentManagementApi.createDocument(payload);
            if (res?.success) {
                navigate('/change-management', {
                    state: {
                        toastMessage: `Policy "${uploadPolicyName.trim()}" saved as draft and submitted for Super Admin review.`
                    }
                });
            } else {
                setUploadError(res?.message || 'Failed to save policy draft.');
            }
        } catch (err) {
            setUploadError(err.message || 'Error saving draft.');
        } finally {
            setIsUploadSubmitting(false);
        }
    };

    const uploadFilteredTemplates = useMemo(() => {
        if (!uploadTemplateSearch.trim()) return templates;
        const q = uploadTemplateSearch.toLowerCase().trim();
        return templates.filter(t =>
            (t.template_name || '').toLowerCase().includes(q) ||
            (t.category || '').toLowerCase().includes(q) ||
            (t.description || '').toLowerCase().includes(q)
        );
    }, [templates, uploadTemplateSearch]);

    const filteredMasterDocs = useMemo(() => {
        return masterDocs.filter((doc) => {
            if (masterSourceLibFilter !== 'all' && doc.library_id !== masterSourceLibFilter) return false;
            if (masterSearchQuery.trim()) {
                const q = masterSearchQuery.toLowerCase().trim();
                const hay = `${doc.document_name || ''} ${doc.description || ''} ${doc.library_name || ''}`.toLowerCase();
                if (!hay.includes(q)) return false;
            }
            return true;
        });
    }, [masterDocs, masterSourceLibFilter, masterSearchQuery]);

    const selectedLibraryName = libraries.find(l => l.id === selectedLibraryId)?.library_name || 'Select Library';
    const isUploadReviewFocus = activeTab === 'upload' && uploadStep === 3;

    return (
        <div className={`create-policy-container ${isUploadReviewFocus ? 'is-upload-review' : ''}`}>
            {/* Top Header Bar with Title & Top Action Buttons (hidden during Step 3 Review for full workspace height) */}
            {!isUploadReviewFocus && (
                <div className="create-policy-header">
                    <div className="create-policy-title-group">
                        <h2>
                            <FileText size={22} style={{ color: 'var(--btn-primary-bg, #0057B8)' }} />
                            <span>Create Operational Policy</span>
                        </h2> 
                    </div>

                    {/* Top Action Buttons (Cancel and Save to Draft) */}
                    <div className="create-policy-header-actions">
                        <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={handleCancel}
                            disabled={isSubmitting || isUploadSubmitting}
                        >
                            <X size={15} />
                            <span>Cancel</span>
                        </button>
                        {activeTab === 'upload' ? (
                            uploadStep === 4 && (
                                <button
                                    type="button"
                                    className="btn btn-primary"
                                    onClick={handleUploadSaveToDraft}
                                    disabled={isUploadSubmitting}
                                >
                                    <Save size={15} />
                                    <span>{isUploadSubmitting ? 'Saving Draft...' : 'Save to Draft'}</span>
                                </button>
                            )
                        ) : activeTab === 'direct' && (
                            <button
                                type="button"
                                className="btn btn-primary"
                                onClick={handleSaveToDraft}
                                disabled={isSubmitting}
                            >
                                <Save size={15} />
                                <span>{isSubmitting ? 'Saving Draft...' : 'Save to Draft'}</span>
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* 3 Top Tabs Navigation (hidden during Step 3 Extraction Review to maximize screen space) */}
            {!isUploadReviewFocus && (
                <div className="create-policy-tabs-bar">
                    <button
                        type="button"
                        className={`create-policy-tab-item ${activeTab === 'direct' ? 'active' : ''}`}
                        onClick={() => setActiveTab('direct')}
                    >
                        {/* <Sparkles size={15} /> */}
                        <span>1. Direct In System</span>
                    </button>

                    <button
                        type="button"
                        className={`create-policy-tab-item ${activeTab === 'master' ? 'active' : ''}`}
                        onClick={() => setActiveTab('master')}
                    >
                        {/* <BookOpen size={15} /> */}
                        <span>2. Master Library</span> 
                    </button>

                    <button
                        type="button"
                        className={`create-policy-tab-item ${activeTab === 'upload' ? 'active' : ''}`}
                        onClick={() => setActiveTab('upload')}
                    >
                        {/* <UploadCloud size={15} /> */}
                        <span>3. Document Upload</span> 
                    </button>
                </div>
            )}

            {/* Tab 1: Direct In System Content */}
            {activeTab === 'direct' ? (
                <div className="create-policy-grid">
                    {/* ── Left Panel (38%): Policy Configuration & Starting Template ── */}
                    <div className="create-policy-left-panel">
                        {errorMsg && (
                            <div style={{ padding: '9px 12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', color: '#b91c1c', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <AlertCircle size={14} />
                                <span>{errorMsg}</span>
                            </div>
                        )}

                        {loadedTemplateAlert && (
                            <div className="template-loaded-alert">
                                <CheckCircle2 size={15} />
                                <span>{loadedTemplateAlert}</span>
                            </div>
                        )}

                        {/* 1. Target Master Library Selector */}
                        <div className="form-group" ref={directLibraryWrapRef}>
                            <label className="form-label">
                                Target Master Library <span style={{ color: 'var(--error, #dc2626)' }}>*</span>
                            </label>

                            <div className="template-picker-container">
                                <div className="template-picker-input-wrap">
                                    <span className="input-icon-left">
                                        <Folder size={14} style={{ color: '#0057B8' }} />
                                    </span>
                                    <input
                                        type="text"
                                        className="form-input has-left-icon has-right-icon"
                                        placeholder={
                                            selectedLibraryId
                                                ? libraries.find(l => l.id === selectedLibraryId)?.library_name || 'Search libraries…'
                                                : 'Search Master Library…'
                                        }
                                        value={directLibrarySearch}
                                        onChange={(e) => {
                                            setDirectLibrarySearch(e.target.value);
                                            setIsDirectLibraryDropdownOpen(true);
                                        }}
                                        onFocus={() => setIsDirectLibraryDropdownOpen(true)}
                                    />
                                    <button
                                        type="button"
                                        className="input-icon-right"
                                        tabIndex={-1}
                                        onClick={() => setIsDirectLibraryDropdownOpen(o => !o)}
                                    >
                                        <ChevronDown size={14} style={{ transform: isDirectLibraryDropdownOpen ? 'rotate(180deg)' : 'none', transition: '0.15s' }} />
                                    </button>
                                </div>

                                {isDirectLibraryDropdownOpen && (
                                    <div className="template-picker-dropdown">
                                        {filteredDirectLibraries.length === 0 ? (
                                            <div style={{ padding: '12px', fontSize: '12px', color: '#94a3b8', textAlign: 'center' }}>
                                                No libraries found.
                                            </div>
                                        ) : (
                                            filteredDirectLibraries.map(lib => (
                                                <button
                                                    key={lib.id}
                                                    type="button"
                                                    className={`template-picker-item ${selectedLibraryId === lib.id ? 'selected' : ''}`}
                                                    onClick={() => {
                                                        setSelectedLibraryId(lib.id);
                                                        setDirectLibrarySearch('');
                                                        setIsDirectLibraryDropdownOpen(false);
                                                    }}
                                                >
                                                    <div className="template-picker-item-title">
                                                        <span>{lib.library_name}</span>
                                                        {lib.description && (
                                                            <span className="template-badge">Library</span>
                                                        )}
                                                    </div>
                                                    {lib.description && (
                                                        <span className="template-picker-item-desc">
                                                            {lib.description}
                                                        </span>
                                                    )}
                                                </button>
                                            ))
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Show selected library name as a confirmation badge */}
                            {selectedLibraryId && (
                                <div style={{ marginTop: '6px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#0057B8' }}>
                                    <Folder size={12} />
                                    <span>{libraries.find(l => l.id === selectedLibraryId)?.library_name}</span>
                                    <button
                                        type="button"
                                        onClick={() => { setSelectedLibraryId(''); setDirectLibrarySearch(''); }}
                                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '0 2px', lineHeight: 1 }}
                                        title="Clear selection"
                                    >
                                        <X size={12} />
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* 2. Choose Starting Template (Searchable Combobox) */}
                        <div className="form-group" ref={templateWrapRef}>
                            <label className="form-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <span>Choose Starting Template</span>
                                <span style={{ fontSize: '11px', color: '#64748b' }}>Autoloads clauses</span>
                            </label>

                            <div className="template-picker-container">
                                <div className="template-picker-input-wrap">
                                    <span className="input-icon-left"><Search size={14} /></span>
                                    <input
                                        type="text"
                                        className="form-input has-left-icon has-right-icon"
                                        placeholder="Search template (e.g. APRA CPS 234, AML...)"
                                        value={templateSearch}
                                        onChange={(e) => {
                                            setTemplateSearch(e.target.value);
                                            setIsTemplateDropdownOpen(true);
                                        }}
                                        onFocus={() => setIsTemplateDropdownOpen(true)}
                                    />
                                    <button
                                        type="button"
                                        className="input-icon-right"
                                        tabIndex={-1}
                                        onClick={() => setIsTemplateDropdownOpen(o => !o)}
                                    >
                                        <ChevronDown size={14} style={{ transform: isTemplateDropdownOpen ? 'rotate(180deg)' : 'none', transition: '0.15s' }} />
                                    </button>
                                </div>

                                {isTemplateDropdownOpen && (
                                    <div className="template-picker-dropdown">
                                        {filteredTemplates.length === 0 ? (
                                            <div style={{ padding: '12px', fontSize: '12px', color: '#94a3b8', textAlign: 'center' }}>
                                                No matching policy templates found.
                                            </div>
                                        ) : (
                                            filteredTemplates.map(tmpl => (
                                                <button
                                                    key={tmpl.id}
                                                    type="button"
                                                    className={`template-picker-item ${selectedTemplate?.id === tmpl.id ? 'selected' : ''}`}
                                                    onClick={() => handleSelectTemplate(tmpl)}
                                                >
                                                    <div className="template-picker-item-title">
                                                        <span>{tmpl.template_name}</span>
                                                        <span className="template-badge">{tmpl.category || 'Standard'}</span>
                                                    </div>
                                                    {tmpl.description && (
                                                        <span className="template-picker-item-desc">
                                                            {tmpl.description}
                                                        </span>
                                                    )}
                                                </button>
                                            ))
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* 3. Policy / Document Name */}
                        <div className="form-group">
                            <label className="form-label">
                                Policy / Document Name <span style={{ color: 'var(--error, #dc2626)' }}>*</span>
                            </label>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="e.g. Enterprise Credit Cards & Limits Standard"
                                value={policyName}
                                onChange={(e) => setPolicyName(e.target.value)}
                                required
                            />
                        </div>

                        {/* 4. Executive Summary / Description */}
                        <div className="form-group">
                            <label className="form-label">Executive Scope &amp; Summary</label>
                            <textarea
                                className="form-input"
                                style={{ height: '76px', padding: '10px 12px', resize: 'vertical' }}
                                placeholder="State regulatory intent, executive ownership, and department scope..."
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                            />
                        </div>

                        {/* 5. 6 Standard Sections Structure Guide */}
                        {/* <div className="template-info-box" style={{ marginTop: 'auto' }}>
                            <div className="template-info-title">
                                <Layers size={14} /> 6 Standard Sections Structure
                            </div>
                            <ul className="template-info-list">
                                <li>1. Configuration (Auto initialized)</li>
                                <li>2. Summary (Executive intent)</li>
                                <li>3. Details (Authored clauses — Right Editor)</li>
                                <li>4. Reference (Statutory circulars)</li>
                                <li>5. Dependencies (System integration)</li>
                                <li>6. Controls (Verification checkpoints)</li>
                            </ul>
                        </div> */}
                    </div>

                    {/* ── Right Panel (62%): Section-Wise Policy Clauses & Controls Editor ── */}
                    <div className="create-policy-right-panel">
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                            <div>
                                <label className="form-label" style={{ margin: 0 }}>
                                    Policy Sections &amp; Modular Clauses ({directSections.length})
                                </label>
                                <span style={{ fontSize: '12px', color: '#64748b' }}>
                                    {selectedTemplate
                                        ? `Loaded from template: ${selectedTemplate.template_name}. Add, reorder, rename, or edit sections.`
                                        : 'Edit section titles, reorder up/down, add paragraphs, tables, or expand any clause.'
                                    }
                                </span>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                {selectedTemplate && (
                                    <span className="template-badge" style={{ background: '#dbeafe', color: '#1d4ed8' }}>
                                        Template: {selectedTemplate.template_name || selectedTemplate.category}
                                    </span>
                                )}

                                {(hasTemplateUpdatePerm || hasTemplateCreatePerm) && (
                                    <button
                                        type="button"
                                        className="btn-store-template"
                                        onClick={openStoreTemplateModal}
                                        title="Store these sections (including newly added sections) into an existing or new template"
                                    >
                                        <Layers size={13} />
                                        <span>Store in Template</span>
                                    </button>
                                )}

                                <button
                                    type="button"
                                    className="btn-fullscreen-toggle"
                                    onClick={() => setIsFullscreen(true)}
                                    title="Open Section-Wise Editor in Full Page Mode"
                                >
                                    <Maximize2 size={13} />
                                    <span>Full Page View</span>
                                </button>
                            </div>
                        </div>

                        <div className="create-policy-sections-wrapper">
                            <SectionWiseEditor
                                sections={directSections}
                                documentTitle={policyName || selectedTemplate?.template_name || 'Operational Policy Document'}
                                onChange={(nextSections) => {
                                    hasTouchedDirectSectionsRef.current = true;
                                    setDirectSections(nextSections);
                                }}
                            />
                        </div>
                    </div>
                </div>
            ) : activeTab === 'master' ? (
                <div className="master-library-shell">
                    {masterErrorMsg && (
                        <div className="upload-error-banner">
                            <AlertCircle size={14} /> {masterErrorMsg}
                        </div>
                    )}

                    <div className="master-section-card">
                        <div className="master-section-head">
                            <div>
                                <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 7 }}>
                                    <BookOpen size={16} style={{ color: '#0057B8' }} />
                                    <span>Master Library Documents ({filteredMasterDocs.length})</span>
                                </div>
                                <p style={{ margin: '3px 0 0', fontSize: '12px', color: '#64748b' }}>
                                    Choose any approved document below and click <strong>Use Template</strong> to load it into the editor and create your draft.
                                </p>
                            </div>
                        </div>

                        <div className="master-controls-grid">
                            <div className="form-group" style={{ margin: 0 }}>
                                <label className="form-label">Filter Library</label>
                                <select
                                    className="form-input"
                                    value={masterSourceLibFilter}
                                    onChange={(e) => setMasterSourceLibFilter(e.target.value)}
                                >
                                    <option value="all">All Libraries ({libraries.length})</option>
                                    {libraries.map((lib) => (
                                        <option key={lib.id} value={lib.id}>{lib.library_name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group" style={{ margin: 0 }}>
                                <label className="form-label">Search Document</label>
                                <div className="template-picker-input-wrap">
                                    <span className="input-icon-left"><Search size={14} /></span>
                                    <input
                                        type="text"
                                        className="form-input has-left-icon"
                                        placeholder="Search documents, clauses, policies..."
                                        value={masterSearchQuery}
                                        onChange={(e) => setMasterSearchQuery(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        {isLoadingMasterDocs ? (
                            <div style={{ padding: '28px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
                                Loading Master Library documents...
                            </div>
                        ) : filteredMasterDocs.length === 0 ? (
                            <div style={{ padding: '28px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
                                No matching Master Library documents found. Try clearing filters or creating a new document directly.
                            </div>
                        ) : (
                            <div className="master-policies-list">
                                {filteredMasterDocs.map((doc) => {
                                    const isHighlighted = initialSourceDocId === doc.id;
                                    return (
                                        <div
                                            key={doc.id}
                                            className={`master-policy-card ${isHighlighted ? 'highlighted' : ''}`}
                                            onClick={() => handleCopyFromMasterLibrary(doc)}
                                        >
                                            <div>
                                                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                                                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', lineHeight: 1.35 }}>
                                                        {doc.document_name}
                                                    </div>
                                                    <span className="template-card-badge">v{doc.current_version_number || '1.0'}</span>
                                                </div>
                                                {doc.description && (
                                                    <p style={{ margin: '6px 0 0', fontSize: '11.5px', color: '#64748b', lineHeight: 1.45, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                                        {doc.description}
                                                    </p>
                                                )}
                                            </div>

                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, paddingTop: 8, borderTop: '1px solid #f1f5f9' }}>
                                                <span style={{ fontSize: '11px', fontWeight: 600, color: '#0057B8', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                                    <Folder size={12} /> {doc.library_name || 'Master Library'}
                                                </span>
                                                <button
                                                    type="button"
                                                    className="btn btn-primary"
                                                    style={{ padding: '5px 11px', fontSize: '11.5px' }}
                                                    disabled={isCopyingFromMaster}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleCopyFromMasterLibrary(doc);
                                                    }}
                                                >
                                                    <Sparkles size={12} />
                                                    <span>{isCopyingFromMaster ? 'Loading...' : 'Use Template'}</span>
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                /* ── UPLOAD TAB: 4-Step Stepper ── */
                <div className={`upload-stepper-container ${isUploadReviewFocus ? 'is-upload-review' : ''}`}>

                    {/* Step Nav Bar (hidden during Step 3 Extraction Review to use full screen height) */}
                    {!isUploadReviewFocus && (
                        <div className="upload-stepper-nav">
                            {[
                                { n: 1, label: 'Upload File', icon: <FileUp size={16} /> },
                                { n: 2, label: 'Select Template', icon: <Layers size={16} /> },
                                { n: 3, label: 'Review', icon: <Cpu size={16} /> },
                                { n: 4, label: 'Finalise', icon: <CheckSquare size={16} /> },
                            ].map(({ n, label, icon }, i) => (
                                <React.Fragment key={n}>
                                    <div className={`upload-stepper-step ${uploadStep === n ? 'active' : uploadStep > n ? 'done' : ''}`}>
                                        <div className="upload-step-circle">
                                            {uploadStep > n ? <CheckCircle2 size={16} /> : icon}
                                        </div>
                                        <span className="upload-step-label">{label}</span>
                                    </div>
                                    {i < 3 && <div className={`upload-step-connector ${uploadStep > n ? 'done' : ''}`} />}
                                </React.Fragment>
                            ))}
                        </div>
                    )}

                    {/* ── STEP 1: File Upload ── */}
                    {uploadStep === 1 && (
                        <div className="upload-step-panel">
                            <h3 className="upload-step-title"><FileUp size={18} /> Upload Your Document</h3>
                            <p className="upload-step-subtitle">Supported formats: PDF, DOC, DOCX — Max 40 MB</p>

                            {uploadError && (
                                <div className="upload-error-banner">
                                    <AlertCircle size={14} /> {uploadError}
                                </div>
                            )}

                            {!uploadedFile ? (
                                <div
                                    className={`upload-drop-zone ${isDragOver ? 'drag-over' : ''}`}
                                    onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                                    onDragLeave={() => setIsDragOver(false)}
                                    onDrop={handleUploadDrop}
                                    onClick={() => uploadFileRef.current?.click()}
                                >
                                    <UploadCloud size={48} className="upload-drop-icon" />
                                    <p className="upload-drop-title">Drag & drop your file here</p>
                                    <p className="upload-drop-sub">or <span className="upload-drop-link">click to browse</span></p>
                                    <input
                                        ref={uploadFileRef}
                                        type="file"
                                        accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                                        style={{ display: 'none' }}
                                        onChange={(e) => handleUploadFileSelect(e.target.files?.[0])}
                                    />
                                </div>
                            ) : (
                                <div className="upload-file-card">
                                    <div className="upload-file-card-icon">
                                        <FileText size={28} />
                                    </div>
                                    <div className="upload-file-card-info">
                                        <p className="upload-file-name">{uploadedFile.name}</p>
                                        <p className="upload-file-meta">
                                            {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                                            &nbsp;·&nbsp;
                                            {uploadedFile.type.includes('pdf') ? 'PDF' : uploadedFile.type.includes('msword') ? 'DOC' : 'DOCX'}
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        className="upload-file-change-btn"
                                        onClick={() => { setUploadedFile(null); setUploadPreviewUrl(null); setUploadError(''); }}
                                    >
                                        <Trash2 size={14} /> Change
                                    </button>
                                </div>
                            )}

                            <div className="upload-step-actions">
                                <div />
                                <button
                                    type="button"
                                    className="btn btn-primary"
                                    disabled={!uploadedFile}
                                    onClick={() => { setUploadError(''); setUploadStep(2); }}
                                >
                                    Next: Select Template <ArrowRight size={15} />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ── STEP 2: Select Template ── */}
                    {uploadStep === 2 && (
                        <div className="upload-step-panel">
                            <div className="upload-step-header-with-toggle">
                                <div>
                                    <h3 className="upload-step-title"><Layers size={18} /> Select a Template</h3>
                                    <p className="upload-step-subtitle">Choose whether to format against an approved template or keep the native document structure.</p>
                                </div>

                                {/* Toggle button for "Use template to format" */}
                                <div className="upload-template-toggle-pill">
                                    <span className="toggle-label-text">Use template to format</span>
                                    <label className="toggle-switch">
                                        <input
                                            type="checkbox"
                                            checked={useTemplateToFormat}
                                            onChange={(e) => {
                                                setUseTemplateToFormat(e.target.checked);
                                                setExtractionError('');
                                            }}
                                        />
                                        <span className="toggle-slider round"></span>
                                    </label>
                                </div>
                            </div>

                            {extractionError && (
                                <div className="upload-error-banner">
                                    <AlertCircle size={14} /> {extractionError}
                                </div>
                            )}

                            {useTemplateToFormat ? (
                                <>
                                    <div className="upload-template-search">
                                        <Search size={15} />
                                        <input
                                            type="text"
                                            placeholder="Search templates..."
                                            value={uploadTemplateSearch}
                                            onChange={(e) => setUploadTemplateSearch(e.target.value)}
                                        />
                                    </div>

                                    <div className="template-select-grid">
                                        {uploadFilteredTemplates.length === 0 && (
                                            <p style={{ color: '#64748b', fontSize: '13px', gridColumn: '1/-1', textAlign: 'center', padding: '32px 0' }}>
                                                No approved templates found.
                                            </p>
                                        )}
                                        {uploadFilteredTemplates.map((tmpl, idx) => {
                                            const tmplId = tmpl.id || tmpl._id;
                                            const isSelected = Boolean(selectedUploadTemplate && (selectedUploadTemplate.id || selectedUploadTemplate._id) === tmplId);
                                            const isTemplate1 = tmpl.template_id === 'TMPL-001' || idx === 0;
                                            const secList = tmpl.structure?.sections || [];
                                            return (
                                                <div
                                                    key={tmplId}
                                                    className={`template-select-card ${isSelected ? 'selected' : ''}`}
                                                    onClick={() => setSelectedUploadTemplate(tmpl)}
                                                >
                                                    <div className="template-card-header">
                                                        <span className="template-card-name">{tmpl.template_name}</span>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                                            {isTemplate1 && (
                                                                <span className="template-default-badge">DB Template 1</span>
                                                            )}
                                                            {tmpl.category && (
                                                                <span className="template-card-badge">{tmpl.category}</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    {tmpl.description && (
                                                        <p className="template-card-desc">{tmpl.description}</p>
                                                    )}
                                                    {secList.length > 0 && (
                                                        <div className="template-section-pills">
                                                            {secList.map((sec, sIdx) => (
                                                                <span key={sIdx} className="template-section-pill">
                                                                    {sec.title}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                    <div className="template-card-footer">
                                                        <span className="template-card-sections">
                                                            <Layers size={12} /> {secList.length} sections
                                                        </span>
                                                        {isSelected && (
                                                            <div className="template-card-selected-mark">
                                                                <CheckCircle2 size={14} /> Selected
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </>
                            ) : (
                                <div className="upload-native-format-card">
                                    <div className="native-format-icon">
                                        <FileText size={32} style={{ color: 'var(--btn-primary-bg, #0057B8)' }} />
                                    </div>
                                    <div className="native-format-content">
                                        <h4>Keep Original Document Structure</h4>
                                        <p>
                                            The document will not be forced into any template sections. 
                                        </p> 
                                    </div>
                                </div>
                            )}

                            <div className="upload-step-actions">
                                <button type="button" className="btn btn-secondary" onClick={() => setUploadStep(1)}>
                                    <ArrowLeft size={15} /> Back
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-primary"
                                    disabled={(useTemplateToFormat && !selectedUploadTemplate) || isExtracting}
                                    onClick={handleRunAIExtraction}
                                >
                                    {isExtracting ? (
                                        <><Loader2 size={15} className="spin-icon" /> Running AI Extraction...</>
                                    ) : (
                                        <><Cpu size={15} /> {useTemplateToFormat ? 'Run Extraction' : 'Run Extraction'} <ArrowRight size={15} /></>
                                    )}
                                </button>
                            </div>

                            {isExtracting && (
                                <div className="ai-loading-overlay">
                                    <div className="ai-loading-box">
                                        <Loader2 size={32} className="spin-icon" style={{ color: '#0057B8' }} />
                                        <p>Analysing your document…</p>
                                        <p style={{ fontSize: '12px', color: '#94a3b8' }}>This may take 10–30 seconds</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── STEP 3: Two-Panel Review ── */}
                    {uploadStep === 3 && (
                        <div className={`upload-review-container ${isReviewFullscreen ? 'fullscreen-mode' : ''}`}>
                            {/* Top bar */}
                            <div className="upload-review-topbar">
                                <div className="upload-review-topbar-left">
                                    {/* <span className="upload-review-badge">
                                        <CheckCircle2 size={14} /> AI Extraction Complete
                                    </span> */}
                                    <span className="upload-review-filename">{uploadedFile?.name}</span>
                                </div>
                                <div className="upload-review-topbar-right">
                                    {uploadSections.length > 0 && (
                                        <div className="fullscreen-view-toggle">
                                            <button
                                                type="button"
                                                className={`fullscreen-toggle-pill ${uploadViewMode === 'sections' ? 'active' : ''}`}
                                                onClick={() => setUploadViewMode('sections')}
                                            >
                                                <Layers size={13} />
                                                <span>Sections ({uploadSections.length})</span>
                                            </button>
                                            <button
                                                type="button"
                                                className={`fullscreen-toggle-pill ${uploadViewMode === 'document' ? 'active' : ''}`}
                                                onClick={() => {
                                                    setUploadEditorContent(sectionsToCombinedDoc(uploadSections, true));
                                                    setUploadEditorKey(Date.now());
                                                    setUploadViewMode('document');
                                                }}
                                            >
                                                <FileText size={13} />
                                                <span>Full Document</span>
                                            </button>
                                        </div>
                                    )}
                                    <button
                                        type="button"
                                        className="btn btn-secondary upload-review-back-btn"
                                        onClick={() => setUploadStep(2)}
                                    >
                                        <ArrowLeft size={15} />
                                        <span>Back</span>
                                    </button>
                                    <button
                                        type="button"
                                        className="btn btn-secondary upload-swap-btn"
                                        onClick={() => setUploadPanelsSwapped(s => !s)}
                                        title="Swap Panels"
                                    >
                                        <ArrowLeftRight size={15} />
                                        <span>Swap Panels</span>
                                    </button>
                                    <button
                                        type="button"
                                        className={`btn ${isReviewFullscreen ? 'btn-primary' : 'btn-secondary'} upload-fullscreen-btn`}
                                        onClick={() => setIsReviewFullscreen(f => !f)}
                                        title={isReviewFullscreen ? "Exit Full Screen (Esc)" : "Maximize Screen"}
                                    >
                                        {isReviewFullscreen ? (
                                            <>
                                                <Minimize2 size={15} />
                                                <span>Exit Full Screen</span>
                                            </>
                                        ) : (
                                            <>
                                                <Maximize2 size={15} />
                                                <span>Max Screen</span>
                                            </>
                                        )}
                                    </button>
                                    <button
                                        type="button"
                                        className="btn btn-primary"
                                        onClick={() => { setUploadError(''); setUploadStep(4); }}
                                    >
                                        <span>Continue to Finalise</span>
                                        <ArrowRight size={15} />
                                    </button>
                                </div>
                            </div>

                            {/* Two panels */}
                            <div className="upload-review-panels">
                                {!uploadPanelsSwapped ? (
                                    <>
                                        <div className="upload-panel upload-panel-left">
                                            <div className="upload-panel-body upload-original-doc-body">
                                                <BrowserDocumentViewer
                                                    headerLabel="Original Document"
                                                    fileName={uploadedFile?.name || ''}
                                                    fileObj={uploadedFile}
                                                    previewUrl={uploadPreviewUrl || ''}
                                                    fallbackRawText={(extractionResult?.sections || [])
                                                        .map(s => `${s.section_title || s.title || ''}\n${String(s.content || '').replace(/<[^>]+>/g, ' ').trim()}`)
                                                        .join('\n\n')}
                                                />
                                            </div>
                                        </div>
                                        <div className="upload-panel upload-panel-right">
                                            <div className="upload-panel-header">Extracted Content (Editable)</div>
                                            <div className={`upload-panel-body upload-panel-editor ${uploadViewMode === 'sections' && uploadSections.length > 0 ? 'upload-sections-scroll' : ''}`}>
                                                {uploadViewMode === 'sections' && uploadSections.length > 0 ? (
                                                    <SectionWiseEditor
                                                        sections={uploadSections}
                                                        documentTitle={uploadPolicyName || selectedUploadTemplate?.template_name || 'Uploaded Policy Document'}
                                                        onChange={setUploadSections}
                                                    />
                                                ) : (
                                                    <RichTextEditor
                                                        key={`upload-editor-${uploadEditorKey}`}
                                                        paged={true}
                                                        placeholder="AI extracted content appears here…"
                                                        initialContent={uploadEditorContent}
                                                        onChange={(val) => setUploadEditorContent(val?.json || val)}
                                                        onReady={(val) => {
                                                            setUploadEditorContent(val.json);
                                                            setTimeout(resetUploadEditorScroll, 50);
                                                        }}
                                                    />
                                                )}
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="upload-panel upload-panel-left">
                                            <div className="upload-panel-header">Extracted Content (Editable)</div>
                                            <div className={`upload-panel-body upload-panel-editor ${uploadViewMode === 'sections' && uploadSections.length > 0 ? 'upload-sections-scroll' : ''}`}>
                                                {uploadViewMode === 'sections' && uploadSections.length > 0 ? (
                                                    <SectionWiseEditor
                                                        sections={uploadSections}
                                                        documentTitle={uploadPolicyName || selectedUploadTemplate?.template_name || 'Uploaded Policy Document'}
                                                        onChange={setUploadSections}
                                                    />
                                                ) : (
                                                    <RichTextEditor
                                                        key={`upload-editor-swap-${uploadEditorKey}`}
                                                        paged={true}
                                                        placeholder="AI extracted content appears here…"
                                                        initialContent={uploadEditorContent}
                                                        onChange={(val) => setUploadEditorContent(val?.json || val)}
                                                        onReady={(val) => {
                                                            setUploadEditorContent(val.json);
                                                            setTimeout(resetUploadEditorScroll, 50);
                                                        }}
                                                    />
                                                )}
                                            </div>
                                        </div>
                                        <div className="upload-panel upload-panel-right">
                                            <div className="upload-panel-body upload-original-doc-body">
                                                <BrowserDocumentViewer
                                                    headerLabel="Original Document"
                                                    fileName={uploadedFile?.name || ''}
                                                    fileObj={uploadedFile}
                                                    previewUrl={uploadPreviewUrl || ''}
                                                    fallbackRawText={(extractionResult?.sections || [])
                                                        .map(s => `${s.section_title || s.title || ''}\n${String(s.content || '').replace(/<[^>]+>/g, ' ').trim()}`)
                                                        .join('\n\n')}
                                                />
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Floating Draggable Unmapped Clauses */}
                            {extractionResult?.unmapped_content?.filter(c => !unmappedDismissed.has(c.id || c.title)).length > 0 && (
                                <div
                                    ref={unmappedContainerRef}
                                    className="unmapped-floating-container"
                                    style={unmappedPos ? {
                                        position: 'fixed',
                                        left: `${unmappedPos.x}px`,
                                        top: `${unmappedPos.y}px`,
                                        right: 'auto',
                                        bottom: 'auto',
                                        zIndex: 10001
                                    } : {
                                        position: 'fixed',
                                        right: '24px',
                                        bottom: isReviewFullscreen ? '70px' : '60px',
                                        zIndex: 10001
                                    }}
                                >
                                    <div
                                        className="unmapped-header"
                                        onMouseDown={handleUnmappedDragStart}
                                        title="Click and drag to move anywhere"
                                    >
                                        <div className="unmapped-header-title-wrap">
                                            <GripVertical size={14} className="unmapped-drag-grip" />
                                            <AlertCircle size={14} />
                                            <span>Unmapped Clauses</span>
                                            <span className="unmapped-count-badge">
                                                {extractionResult.unmapped_content.filter(c => !unmappedDismissed.has(c.id || c.title)).length}
                                            </span>
                                        </div>
                                        <button
                                            type="button"
                                            className="unmapped-collapse-btn"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setUnmappedCollapsed(c => !c);
                                            }}
                                            title={unmappedCollapsed ? 'Expand' : 'Collapse'}
                                        >
                                            {unmappedCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                                        </button>
                                    </div>
                                    {!unmappedCollapsed && (
                                        <div className="unmapped-list">
                                            {extractionResult.unmapped_content
                                                .filter(c => !unmappedDismissed.has(c.id || c.title))
                                                .map((clause, idx) => (
                                                    <div key={clause.id || clause.title || idx} className="unmapped-item">
                                                        <div className="unmapped-item-top">
                                                            <span className="unmapped-item-title">{clause.title || `Clause ${idx + 1}`}</span>
                                                            <button
                                                                type="button"
                                                                className="unmapped-dismiss-btn"
                                                                onClick={() => setUnmappedDismissed(s => new Set([...s, clause.id || clause.title]))}
                                                                title="Dismiss"
                                                            >
                                                                <X size={12} />
                                                            </button>
                                                        </div>
                                                        {clause.content && (
                                                            <p className="unmapped-item-snippet">
                                                                {(clause.content || '').replace(/<[^>]+>/g, ' ').substring(0, 120)}…
                                                            </p>
                                                        )}
                                                        {clause.suggested_section && (
                                                            <p className="unmapped-suggested">Suggested: {clause.suggested_section}</p>
                                                        )}
                                                        <div className="unmapped-item-actions">
                                                            <button
                                                                type="button"
                                                                className="unmapped-insert-btn"
                                                                onClick={() => handleInsertUnmapped(clause)}
                                                            >
                                                                <Plus size={12} /> Insert into Editor
                                                            </button>
                                                            <button
                                                                type="button"
                                                                className="unmapped-copy-btn"
                                                                onClick={() => handleCopyUnmapped(clause, clause.id || clause.title || idx)}
                                                                title="Copy clause text so you can paste it anywhere in the editor"
                                                            >
                                                                <Copy size={12} />
                                                                {copiedUnmappedKey === (clause.id || clause.title || idx) ? 'Copied' : 'Copy'}
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))
                                            }
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── STEP 4: Finalise & Save ── */}
                    {uploadStep === 4 && (
                        <div className="upload-step-panel upload-finalize-panel" ref={uploadStepPanelRef}>
                            <div className="upload-finalize-header">
                                <div className="upload-finalize-header-icon">
                                    <CheckSquare size={20} />
                                </div>
                                <div>
                                    <h3 className="upload-finalize-title">Finalise & Save Policy</h3>
                                    {/* <p className="upload-finalize-subtitle">Review the extracted metadata and assign to a library before saving.</p> */}
                                </div>
                            </div>

                            {uploadError && (
                                <div className="upload-error-banner">
                                    <AlertCircle size={14} /> {uploadError}
                                </div>
                            )}

                            <div className="upload-finalize-split-layout">
                                {/* Left Column: Form Fields */}
                                <div className="upload-finalize-left">
                                    <div className="upload-form-row">
                                        <label className="upload-form-label">
                                            <span>Policy / Document Name <span style={{ color: 'var(--error, #dc2626)' }}>*</span></span>
                                        </label>
                                        <input
                                            className="upload-form-input"
                                            type="text"
                                            value={uploadPolicyName}
                                            onChange={(e) => setUploadPolicyName(e.target.value)}
                                            placeholder="Enter policy name…"
                                        />
                                    </div>

                                    <div className="upload-form-row" ref={uploadLibraryWrapRef}>
                                        <label className="upload-form-label">
                                            <span>Target Master Library <span style={{ color: 'var(--error, #dc2626)' }}>*</span></span>
                                        </label>
                                        <div className="template-picker-container">
                                            <div className="template-picker-input-wrap">
                                                <span className="input-icon-left">
                                                    <Folder size={14} style={{ color: '#0057B8' }} />
                                                </span>
                                                <input
                                                    type="text"
                                                    className="upload-form-input has-left-icon has-right-icon"
                                                    placeholder={
                                                        uploadLibraryId
                                                            ? libraries.find(l => l.id === uploadLibraryId)?.library_name || 'Search libraries…'
                                                            : 'Search Master Library…'
                                                    }
                                                    value={uploadLibrarySearch}
                                                    onChange={(e) => {
                                                        setUploadLibrarySearch(e.target.value);
                                                        setIsUploadLibraryDropdownOpen(true);
                                                    }}
                                                    onFocus={() => setIsUploadLibraryDropdownOpen(true)}
                                                />
                                                <button
                                                    type="button"
                                                    className="input-icon-right"
                                                    tabIndex={-1}
                                                    onClick={() => setIsUploadLibraryDropdownOpen(o => !o)}
                                                >
                                                    <ChevronDown
                                                        size={14}
                                                        style={{
                                                            transform: isUploadLibraryDropdownOpen ? 'rotate(180deg)' : 'none',
                                                            transition: 'transform 0.15s',
                                                        }}
                                                    />
                                                </button>
                                            </div>
                                            {isUploadLibraryDropdownOpen && (
                                                <div className="template-picker-dropdown">
                                                    {uploadFilteredLibraries.length === 0 ? (
                                                        <div style={{ padding: '12px', fontSize: '12px', color: '#94a3b8', textAlign: 'center' }}>
                                                            No libraries found.
                                                        </div>
                                                    ) : uploadFilteredLibraries.map(lib => (
                                                        <button
                                                            key={lib.id}
                                                            type="button"
                                                            className={`template-picker-item ${uploadLibraryId === lib.id ? 'selected' : ''}`}
                                                            onClick={() => {
                                                                setUploadLibraryId(lib.id);
                                                                setUploadLibrarySearch('');
                                                                setIsUploadLibraryDropdownOpen(false);
                                                            }}
                                                        >
                                                            <div className="template-picker-item-title">
                                                                <span>{lib.library_name}</span>
                                                                {lib.description && (
                                                                    <span className="template-badge">Library</span>
                                                                )}
                                                            </div>
                                                            {lib.description && (
                                                                <span className="template-picker-item-desc">
                                                                    {lib.description}
                                                                </span>
                                                            )}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {/* Selected Library Badge */}
                                        {uploadLibraryId && (
                                            <div style={{ marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#0057B8' }}>
                                                <Folder size={12} />
                                                <span>{libraries.find(l => l.id === uploadLibraryId)?.library_name}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => { setUploadLibraryId(''); setUploadLibrarySearch(''); }}
                                                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '0 2px', lineHeight: 1 }}
                                                    title="Clear selection"
                                                >
                                                    <X size={12} />
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    <div className="upload-form-row">
                                        <label className="upload-form-label">Document Type</label>
                                        <select
                                            className="upload-form-input"
                                            value={uploadDocType}
                                            onChange={(e) => setUploadDocType(e.target.value)}
                                        >
                                            <option value="policy">Policy</option>
                                            <option value="procedure">Procedure</option>
                                            <option value="guideline">Guideline</option>
                                            <option value="standard">Standard</option>
                                            <option value="framework">Framework</option>
                                        </select>
                                    </div>

                                    <div className="upload-form-row">
                                        <label className="upload-form-label">Description / Executive Scope</label>
                                        <textarea
                                            className="upload-form-input"
                                            rows={3}
                                            value={uploadDescription}
                                            onChange={(e) => setUploadDescription(e.target.value)}
                                            placeholder="Brief scope, regulatory intent, or summary…"
                                        />
                                    </div>
                                </div>

                                {/* Right Column: Summary Card and Action Buttons */}
                                <div className="upload-finalize-right">
                                    {extractionResult && (
                                        <div className="upload-extraction-summary-card">
                                            <div className="summary-card-header">
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    <Sparkles size={14} style={{ color: '#16a34a' }} />
                                                    <span>Extraction Summary</span>
                                                </div>
                                                {uploadedFile && (
                                                    <span className="summary-card-file" title={uploadedFile.name}>
                                                        <FileText size={12} /> {uploadedFile.name}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="summary-card-grid">
                                                <div className="summary-stat-box">
                                                    <span className="summary-stat-val">{extractionResult.sections?.length || 0}</span>
                                                    <span className="summary-stat-lbl">Sections Extracted</span>
                                                </div>
                                                <div className="summary-stat-box">
                                                    <span className="summary-stat-val">{extractionResult.unmapped_content?.length || 0}</span>
                                                    <span className="summary-stat-lbl">Unmapped Clauses</span>
                                                </div>
                                                <div className="summary-stat-box full-width">
                                                    <span className="summary-stat-lbl">Template Applied</span>
                                                    <span className="summary-stat-tag">
                                                        {useTemplateToFormat && selectedUploadTemplate ? selectedUploadTemplate.template_name : 'Native Structure'}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="summary-readiness-box">
                                                <CheckCircle2 size={14} />
                                                <span>Clauses structured &amp; ready for compliance draft</span>
                                            </div>
                                        </div>
                                    )}

                                    {/* Action Buttons Box */}
                                    <div className="upload-finalize-actions-box">
                                        <button
                                            type="button"
                                            className="btn btn-primary"
                                            disabled={isUploadSubmitting}
                                            onClick={handleUploadSaveToDraft}
                                        >
                                            <Save size={15} />
                                            {isUploadSubmitting ? 'Saving Draft…' : 'Save as Draft & Send to Review'}
                                        </button>
                                        <button type="button" className="btn btn-secondary" onClick={() => setUploadStep(3)}>
                                            <ArrowLeft size={15} /> Back 
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                </div>
            )}

            {/* Bottom Action Bar with Duplicate Cancel and Save to Draft Buttons */}
            {activeTab === 'direct' && (
                <div className="create-policy-bottom-actions">
                    <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={handleCancel}
                        disabled={isSubmitting}
                    >
                        <X size={15} />
                        <span>Cancel</span>
                    </button>
                    <button
                        type="button"
                        className="btn btn-primary"
                        onClick={handleSaveToDraft}
                        disabled={isSubmitting}
                    >
                        <Save size={15} />
                        <span>{isSubmitting ? 'Saving Draft...' : 'Save to Draft'}</span>
                    </button>
                </div>
            )}

            {/* Store Sections in Template Modal */}
            {isStoreTemplateOpen && (
                <div
                    className="store-template-overlay"
                    onClick={(e) => {
                        if (e.target === e.currentTarget && !isStoringTemplate) setIsStoreTemplateOpen(false);
                    }}
                >
                    <form className="store-template-modal" onSubmit={handleStoreToTemplate}>
                        <div className="store-template-head">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div className="store-template-icon">
                                    <Layers size={16} />
                                </div>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>
                                        Store Sections into Template
                                    </h3>
                                    <span style={{ fontSize: '12px', color: '#64748b' }}>
                                        Save all {directSections.length} section{directSections.length === 1 ? '' : 's'} into an existing template or create a new template.
                                    </span>
                                </div>
                            </div>
                            <button
                                type="button"
                                className="btn btn-sm btn-secondary"
                                onClick={() => setIsStoreTemplateOpen(false)}
                                disabled={isStoringTemplate}
                            >
                                <X size={14} />
                            </button>
                        </div>

                        <div className="store-template-body">
                            {storeTemplateError && (
                                <div style={{ padding: '9px 12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', color: '#b91c1c', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <AlertCircle size={14} />
                                    <span>{storeTemplateError}</span>
                                </div>
                            )}

                            <div className="store-template-mode-tabs">
                                <button
                                    type="button"
                                    className={`store-mode-btn ${storeTemplateMode === 'existing' ? 'active' : ''}`}
                                    onClick={() => setStoreTemplateMode('existing')}
                                    disabled={templates.length === 0}
                                >
                                    Update Existing Template
                                </button>
                                {hasTemplateCreatePerm && (
                                    <button
                                        type="button"
                                        className={`store-mode-btn ${storeTemplateMode === 'new' ? 'active' : ''}`}
                                        onClick={() => setStoreTemplateMode('new')}
                                    >
                                        Save as New Template
                                    </button>
                                )}
                            </div>

                            {storeTemplateMode === 'existing' ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    {!hasTemplateUpdatePerm && (
                                        <div style={{ padding: '10px 12px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', fontSize: '12px', color: '#92400e', lineHeight: 1.45 }}>
                                            <strong>Note:</strong> Your current role does not have <code>templates:update</code> permission to overwrite shared approved templates directly. Switch to <strong>Save as New Template</strong> above to store your extended sections (for Admin approval), or sign in as Admin / Super Admin.
                                        </div>
                                    )}
                                    <div className="form-group">
                                        <label className="form-label">Select Existing Template *</label>
                                        <select
                                            className="form-input"
                                            value={targetExistingTemplateId}
                                            onChange={(e) => setTargetExistingTemplateId(e.target.value)}
                                        >
                                            {templates.map((t) => (
                                                <option key={t.id} value={t.id}>
                                                    {t.template_name} ({Array.isArray(t.structure?.sections) ? t.structure.sections.length : 0} sections)
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    <div className="form-group">
                                        <label className="form-label">New Template Name *</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            placeholder="e.g. Template 1: Policy Document (Extended)"
                                            value={newTemplateName}
                                            onChange={(e) => setNewTemplateName(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Category</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            placeholder="e.g. Operational Policy"
                                            value={newTemplateCategory}
                                            onChange={(e) => setNewTemplateCategory(e.target.value)}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Description</label>
                                        <textarea
                                            className="form-input"
                                            rows={2}
                                            style={{ padding: '8px 12px', resize: 'vertical' }}
                                            placeholder="Describe this template..."
                                            value={newTemplateDescription}
                                            onChange={(e) => setNewTemplateDescription(e.target.value)}
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="store-template-preview">
                                <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                                    Sections to store ({directSections.length}):
                                </div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                    {directSections.map((sec, idx) => (
                                        <span key={sec.id || idx} className="store-sec-chip">
                                            {idx + 1}. {sec.section_title || sec.title || `Section ${idx + 1}`}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="store-template-foot">
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={() => setIsStoreTemplateOpen(false)}
                                disabled={isStoringTemplate}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={isStoringTemplate || (storeTemplateMode === 'existing' && !hasTemplateUpdatePerm)}
                            >
                                <Save size={14} />
                                <span>
                                    {isStoringTemplate
                                        ? 'Storing...'
                                        : storeTemplateMode === 'existing'
                                            ? 'Update Existing Template'
                                            : isSuperAdmin
                                                ? 'Save & Publish Template'
                                                : 'Submit New Template'}
                                </span>
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Reusable Fullscreen Editor Modal */}
            <FullscreenEditorModal
                isOpen={isFullscreen}
                onClose={() => setIsFullscreen(false)}
                title={policyName ? `Editing: ${policyName}` : 'Operational Policy Clauses Editor'}
                subtitle="Full Page Section-Wise Authoring Mode — Press Esc or click Cancel to return"
                placeholder="Write operational policy clauses, criteria, tables, and requirements here..."
                initialContent={editorJsonContent || editorInitialContent}
                sections={directSections}
                onSectionsChange={(nextSections) => {
                    hasTouchedDirectSectionsRef.current = true;
                    setDirectSections(nextSections);
                }}
                onChange={(val) => {
                    const json = val?.json || val;
                    setEditorJsonContent(json);
                }}
                onSaveDraft={handleSaveToDraft}
                isSubmitting={isSubmitting}
            />
        </div>
    );
}
