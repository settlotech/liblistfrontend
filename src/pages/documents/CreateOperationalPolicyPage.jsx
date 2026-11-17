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
import './createOperationalPolicy.css';

export default function CreateOperationalPolicyPage() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    // Query params: pre-selected library ID from row '+' click
    const initialLibraryId = searchParams.get('libraryId') || '';

    // Tabs: 'direct' | 'master' | 'upload'
    const [activeTab, setActiveTab] = useState('direct');

    // Libraries list & selected library
    const [libraries, setLibraries]             = useState([]);
    const [selectedLibraryId, setSelectedLibraryId] = useState(initialLibraryId);

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

    // Editor content state
    const [editorJsonContent, setEditorJsonContent] = useState(null);
    const [editorInitialContent, setEditorInitialContent] = useState(null);
    const [editorKey, setEditorKey]             = useState(Date.now());
    const [isFullscreen, setIsFullscreen]       = useState(false);

    // Submit state & feedback
    const [isSubmitting, setIsSubmitting]       = useState(false);
    const [errorMsg, setErrorMsg]               = useState('');
    const [loadedTemplateAlert, setLoadedTemplateAlert] = useState(null);

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
    useEffect(() => {
        if (uploadStep !== 3) return;
        requestAnimationFrame(() => {
            document.querySelectorAll('.upload-review-container .modern-editor-workspace')
                .forEach(workspace => { workspace.scrollTop = 0; workspace.scrollLeft = 0; });
        });
    }, [isReviewFullscreen, uploadStep]);

    // Load available libraries and approved templates on mount
    useEffect(() => {
        let isMounted = true;

        // 1. Fetch Libraries
        documentManagementApi.getLibraries()
            .then(res => {
                if (!isMounted) return;
                const libs = res?.data || [];
                setLibraries(libs);
                if (!selectedLibraryId && libs.length > 0) {
                    setSelectedLibraryId(libs[0].id);
                }
            })
            .catch(err => console.error('Failed to load libraries:', err));

        // 2. Fetch Approved Templates for Tab 1 Autoload
        documentManagementApi.getTemplates({ status: 'approved' })
            .then(res => {
                if (!isMounted) return;
                const tmpls = res?.data?.templates || res?.data || [];
                setTemplates(tmpls);
            })
            .catch(err => console.error('Failed to load templates:', err));

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

    // When user selects a template -> automatically load into right panel Editor!
    const handleSelectTemplate = (tmpl) => {
        setSelectedTemplate(tmpl);
        setTemplateSearch(tmpl.template_name);
        setIsTemplateDropdownOpen(false);

        // Prepopulate policy name and description if empty
        if (!policyName.trim()) {
            setPolicyName(tmpl.template_name);
        }
        if (!description.trim() && tmpl.description) {
            setDescription(tmpl.description);
        }

        // Extract Section 3 (Details) content from template structure
        const detailsSec = tmpl.structure?.sections?.find(s => s.order === 2 || s.title?.includes('Details')) || tmpl.structure?.sections?.[2];
        const contentToLoad = detailsSec?.content || {
            type: 'doc',
            content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Operational policy requirements and governance controls.' }] }]
        };

        setEditorInitialContent(contentToLoad);
        setEditorJsonContent(contentToLoad);
        setEditorKey(Date.now()); // Re-mounts editor with template content

        setLoadedTemplateAlert(`Template "${tmpl.template_name}" loaded into editor successfully.`);
        setTimeout(() => setLoadedTemplateAlert(null), 5000);
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
            // Serialize editor AST
            let cleanDetailsContent = {
                type: 'doc',
                content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Operational clauses and controls.' }] }]
            };

            if (editorJsonContent) {
                const rawJson = editorJsonContent?.json || (editorJsonContent?.type === 'doc' ? editorJsonContent : null);
                if (rawJson) {
                    try {
                        cleanDetailsContent = JSON.parse(JSON.stringify(rawJson));
                    } catch (err) {
                        console.warn('Failed serializing editor content', err);
                    }
                }
            }

            // Assemble 6 standard sections
            const sections = [
                { title: '1. Configuration', order: 0, content: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: `Document classification: Operational Policy. Library: ${libraries.find(l => l.id === selectedLibraryId)?.library_name || 'Banking'}.` }] }] } },
                { title: '2. Summary',       order: 1, content: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: description || 'Executive summary of key policy requirements.' }] }] } },
                { title: '3. Details',       order: 2, content: cleanDetailsContent },
                { title: '4. Reference',     order: 3, content: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Statutory citations and internal bank policies.' }] }] } },
                { title: '5. Dependencies',  order: 4, content: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Cross-functional system dependencies.' }] }] } },
                { title: '6. Controls',      order: 5, content: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Compliance checkpoints and verification metrics.' }] }] } },
            ];

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
                const fullHtmlDoc = convertAISectionsToHtml(extracted.sections || []);
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
            // Build sections preserving full TipTap AST (tables, lists, images)
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

            const sections = [
                {
                    title: '1. Policy Provisions & Clauses',
                    order: 0,
                    content: cleanUploadContent
                }
            ];

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

    const selectedLibraryName = libraries.find(l => l.id === selectedLibraryId)?.library_name || 'Select Library';

    return (
        <div className="create-policy-container">
            {/* Top Header Bar with Title & Top Action Buttons */}
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
                    ) : (
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

            {/* 3 Top Tabs Navigation */}
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

                    {/* ── Right Panel (62%): Rich Text Editor Component ── */}
                    <div className="create-policy-right-panel">
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                            <div>
                                <label className="form-label" style={{ margin: 0 }}>
                                    Section 3: Details — Policy Clauses &amp; Controls Editor
                                </label>
                                <span style={{ fontSize: '12px', color: '#64748b' }}>
                                    {selectedTemplate
                                        ? `Loaded from template: ${selectedTemplate.template_name}. Fully editable.`
                                        : 'Compose and format operational banking clauses, tables, and rules.'
                                    }
                                </span>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                {selectedTemplate && (
                                    <span className="template-badge" style={{ background: '#dbeafe', color: '#1d4ed8' }}>
                                        Template: {selectedTemplate.category}
                                    </span>
                                )}

                                <button
                                    type="button"
                                    className="btn-fullscreen-toggle"
                                    onClick={() => setIsFullscreen(true)}
                                    title="Open Editor in Full Page Mode"
                                >
                                    <Maximize2 size={13} />
                                    <span>Full Page View</span>
                                </button>
                            </div>
                        </div>

                        <div className="create-policy-editor-wrapper">
                            <RichTextEditor
                                key={`editor-${editorKey}`}
                                paged={true}
                                placeholder="Write operational policy clauses, criteria, tables, and requirements here..."
                                initialContent={editorInitialContent}
                                value={editorJsonContent}
                                onChange={(val) => setEditorJsonContent(val?.json || val)}
                            />
                        </div>
                    </div>
                </div>
            ) : activeTab === 'master' ? (
                <div className="tab-coming-soon-panel">
                     
                    <h3 style={{ margin: 0, fontSize: '16px', color: '#0f172a' }}>Working...</h3>
                     
                </div>
            ) : (
                /* ── UPLOAD TAB: 4-Step Stepper ── */
                <div className="upload-stepper-container">

                    {/* Step Nav Bar */}
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
                                        {uploadFilteredTemplates.map(tmpl => {
                                            const tmplId = tmpl.id || tmpl._id;
                                            const isSelected = Boolean(selectedUploadTemplate && (selectedUploadTemplate.id || selectedUploadTemplate._id) === tmplId);
                                            return (
                                                <div
                                                    key={tmplId}
                                                    className={`template-select-card ${isSelected ? 'selected' : ''}`}
                                                    onClick={() => setSelectedUploadTemplate(tmpl)}
                                                >
                                                    <div className="template-card-header">
                                                        <span className="template-card-name">{tmpl.template_name}</span>
                                                        {tmpl.category && (
                                                            <span className="template-card-badge">{tmpl.category}</span>
                                                        )}
                                                    </div>
                                                    {tmpl.description && (
                                                        <p className="template-card-desc">{tmpl.description}</p>
                                                    )}
                                                    <div className="template-card-footer">
                                                        <span className="template-card-sections">
                                                            <Layers size={12} /> {tmpl.structure?.sections?.length || 0} sections
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
                                </div>
                            </div>

                            {/* Two panels */}
                            <div className="upload-review-panels">
                                {!uploadPanelsSwapped ? (
                                    <>
                                        <div className="upload-panel upload-panel-left">
                                            <div className="upload-panel-header">Original Document</div>
                                            <div className="upload-panel-body">
                                                {uploadPreviewUrl && (uploadedFile?.type === 'application/pdf' || uploadedFile?.name?.toLowerCase().endsWith('.pdf')) ? (
                                                    <iframe
                                                        src={uploadPreviewUrl}
                                                        title="PDF Preview"
                                                        className="upload-pdf-iframe"
                                                    />
                                                ) : (
                                                    <div className="upload-doc-placeholder">
                                                        <FileText size={40} style={{ color: '#94a3b8' }} />
                                                        <p>Preview not available for DOC/DOCX files.<br />Content has been extracted by AI on the right.</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="upload-panel upload-panel-right">
                                            <div className="upload-panel-header">Extracted Content (Editable)</div>
                                            <div className="upload-panel-body upload-panel-editor">
                                                <RichTextEditor
                                                    key={`upload-editor-${uploadEditorKey}`}
                                                    paged={true}
                                                    placeholder="AI extracted content appears here…"
                                                    initialContent={uploadEditorContent}
                                                    onChange={(val) => setUploadEditorContent(val?.json || val)}
                                                    onReady={(val) => setUploadEditorContent(val.json)}
                                                />
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="upload-panel upload-panel-left">
                                            <div className="upload-panel-header">Extracted Content (Editable)</div>
                                            <div className="upload-panel-body upload-panel-editor">
                                                <RichTextEditor
                                                    key={`upload-editor-swap-${uploadEditorKey}`}
                                                    paged={true}
                                                    placeholder="AI extracted content appears here…"
                                                    initialContent={uploadEditorContent}
                                                    onChange={(val) => setUploadEditorContent(val?.json || val)}
                                                    onReady={(val) => setUploadEditorContent(val.json)}
                                                />
                                            </div>
                                        </div>
                                        <div className="upload-panel upload-panel-right">
                                            <div className="upload-panel-header">Original Document</div>
                                            <div className="upload-panel-body">
                                                {uploadPreviewUrl && (uploadedFile?.type === 'application/pdf' || uploadedFile?.name?.toLowerCase().endsWith('.pdf')) ? (
                                                    <iframe
                                                        src={uploadPreviewUrl}
                                                        title="PDF Preview"
                                                        className="upload-pdf-iframe"
                                                    />
                                                ) : (
                                                    <div className="upload-doc-placeholder">
                                                        <FileText size={40} style={{ color: '#94a3b8' }} />
                                                        <p>Preview not available for DOC/DOCX files.<br />Content has been extracted by AI on the left.</p>
                                                    </div>
                                                )}
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

                            {/* Step actions */}
                            <div className="upload-step-actions upload-review-actions">
                                <div />
                                <button type="button" className="btn btn-primary" onClick={() => { setUploadError(''); setUploadStep(4); }}>
                                    Continue to Finalise <ArrowRight size={15} />
                                </button>
                            </div>
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

            {/* Reusable Fullscreen Editor Modal */}
            <FullscreenEditorModal
                isOpen={isFullscreen}
                onClose={() => setIsFullscreen(false)}
                title={policyName ? `Editing: ${policyName}` : 'Operational Policy Clauses Editor'}
                subtitle="Full Page Focused Authoring Mode — Press Esc or click Minimize to return"
                placeholder="Write operational policy clauses, criteria, tables, and requirements here..."
                initialContent={editorJsonContent || editorInitialContent}
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
