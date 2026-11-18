import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
    FileSpreadsheet,
    Plus,
    Search,
    CheckCircle2,
    Clock,
    XCircle,
    Copy,
    Layers,
    X,
    AlertCircle,
    Check,
    ChevronDown,
    Tag,
    User,
    Calendar,
    Eye,
    ShieldCheck,
    Filter,
    ArrowUpDown,
    Edit2,
    Save,
    RotateCcw
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { documentManagementApi } from '../../services/api/documentManagementApi';
import RichTextEditor from '../../editor/RichTextEditor';
import './templates.css';
import LoadMoreOnScroll from '../../components/common/LoadMoreOnScroll';

/* ─────────────────────────────────────────────────────────────
   CategoryCombobox
   Loads existing categories from API, filters locally on type,
   allows free-text entry as a new category.
───────────────────────────────────────────────────────────── */
function CategoryCombobox({ value, onChange }) {
    const [inputVal, setInputVal]       = useState(value || '');
    const [options, setOptions]         = useState([]);
    const [filtered, setFiltered]       = useState([]);
    const [open, setOpen]               = useState(false);
    const [loading, setLoading]         = useState(false);
    const wrapRef                       = useRef(null);

    // Keep internal input in sync if parent changes value
    useEffect(() => {
        setInputVal(value || '');
    }, [value]);

    // Load all categories once on mount
    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        documentManagementApi.getTemplateCategories()
            .then(res => {
                if (cancelled) return;
                const cats = Array.isArray(res?.data) ? res.data : [];
                setOptions(cats);
                setFiltered(cats);
            })
            .catch(() => {})
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, []);

    // Filter locally as user types
    useEffect(() => {
        const q = inputVal.trim().toLowerCase();
        if (!q) {
            setFiltered(options);
        } else {
            setFiltered(options.filter(c => c.toLowerCase().includes(q)));
        }
    }, [inputVal, options]);

    // Close on outside click
    useEffect(() => {
        const handler = (e) => {
            if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const select = (cat) => {
        setInputVal(cat);
        onChange(cat);
        setOpen(false);
    };

    const handleInputChange = (e) => {
        const v = e.target.value;
        setInputVal(v);
        onChange(v);
        setOpen(true);
    };

    const isNew = inputVal.trim() && !options.some(c => c.toLowerCase() === inputVal.trim().toLowerCase());

    return (
        <div className="category-combobox" ref={wrapRef}>
            <div className="input-wrapper">
                <span className="input-icon-left"><Tag size={14} /></span>
                <input
                    type="text"
                    className="form-input has-left-icon has-right-icon"
                    placeholder="e.g. Information Security, AML / CTF, Lending..."
                    value={inputVal}
                    onChange={handleInputChange}
                    onFocus={() => setOpen(true)}
                    autoComplete="off"
                />
                <button
                    type="button"
                    className="input-icon-right"
                    tabIndex={-1}
                    onClick={() => setOpen(o => !o)}
                >
                    <ChevronDown size={14} style={{ transform: open ? 'rotate(180deg)' : 'none', transition: '0.15s' }} />
                </button>
            </div>

            {open && (
                <div className="category-dropdown">
                    {loading ? (
                        <div className="category-dropdown-item category-dropdown-hint">Loading...</div>
                    ) : (
                        <>
                            {filtered.length > 0 && filtered.map(cat => (
                                <button
                                    key={cat}
                                    type="button"
                                    className={`category-dropdown-item ${inputVal.trim().toLowerCase() === cat.toLowerCase() ? 'selected' : ''}`}
                                    onClick={() => select(cat)}
                                >
                                    <Tag size={12} style={{ color: '#0057B8' }} />
                                    <span>{cat}</span>
                                </button>
                            ))}

                            {isNew && (
                                <button
                                    type="button"
                                    className="category-dropdown-item category-dropdown-new"
                                    onClick={() => select(inputVal.trim())}
                                >
                                    <Plus size={13} />
                                    <span>Create new category: <strong>"{inputVal.trim()}"</strong></span>
                                </button>
                            )}

                            {!loading && filtered.length === 0 && !isNew && (
                                <div className="category-dropdown-item category-dropdown-hint">No categories found</div>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    );
}

/* ─────────────────────────────────────────────────────────────
   Main Page
───────────────────────────────────────────────────────────── */
export default function TemplatesPage() {
    const { user } = useAuth();
    const [templates, setTemplates]         = useState([]);
    const [isLoading, setIsLoading]         = useState(true);
    const [templatePage, setTemplatePage] = useState(1);
    const [templatesHasMore, setTemplatesHasMore] = useState(false);
    const [loadingMoreTemplates, setLoadingMoreTemplates] = useState(false);

    // Active sub-tab: 'approved' | 'pending' | 'all'
    const [activeTab, setActiveTab]         = useState('approved');

    // Table Filters
    const [searchQuery, setSearchQuery]           = useState('');
    const [selectedCategory, setSelectedCategory] = useState('ALL');
    const [sortBy, setSortBy]                     = useState('newest'); // 'newest' | 'oldest' | 'name'

    // Create Modal state
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [templateName, setTemplateName]           = useState('');
    const [category, setCategory]                   = useState('Information Security');
    const [description, setDescription]             = useState('');
    const [editorJsonContent, setEditorJsonContent] = useState(null);
    const [isSubmitting, setIsSubmitting]           = useState(false);
    const [errorMsg, setErrorMsg]                   = useState('');

    // Review / View / Edit Modal state
    const [reviewingTemplate, setReviewingTemplate] = useState(null);
    const [modalMode, setModalMode]                 = useState('view'); // 'view' | 'edit'
    const [editName, setEditName]                   = useState('');
    const [editCategory, setEditCategory]           = useState('');
    const [editDescription, setEditDescription]     = useState('');
    const [editEditorContent, setEditEditorContent] = useState(null);
    const [isSavingEdit, setIsSavingEdit]           = useState(false);
    const [editErrorMsg, setEditErrorMsg]           = useState('');
    const [rejectionReason, setRejectionReason]     = useState('');
    const [isReviewing, setIsReviewing]             = useState(false);
    const [reviewFeedbackMsg, setReviewFeedbackMsg] = useState('');

    // Toast alert for user feedback
    const [toastMsg, setToastMsg]                   = useState(null);

    useEffect(() => {
        if (!toastMsg) return;
        const timer = setTimeout(() => setToastMsg(null), 4500);
        return () => clearTimeout(timer);
    }, [toastMsg]);

    // Role checks
    const isSuperAdmin = user?.isSuperAdmin === true || (user?.roles || []).some(r => {
        const name = typeof r === 'string' ? r : r.role_name;
        return ['super admin', 'super_admin'].includes(name?.toLowerCase());
    });
    const hasCreatePermission   = isSuperAdmin || (user?.permissionStrings || user?.permissions || []).includes('templates:create');
    const hasUpdatePermission   = isSuperAdmin || (user?.permissionStrings || user?.permissions || []).includes('templates:update');
    const hasApprovalPermission = isSuperAdmin || (user?.permissionStrings || user?.permissions || []).includes('templates:approval');

    useEffect(() => {
        if (!hasApprovalPermission && activeTab === 'approved') {
            setActiveTab('all');
        }
    }, [hasApprovalPermission, activeTab]);

    const loadTemplates = useCallback(async (page = 1, append = false) => {
        if (append) setLoadingMoreTemplates(true); else setIsLoading(true);
        try {
            // Approvers and admins see all statuses; others see approved only
            const params = hasApprovalPermission ? {} : { status: 'approved' };
            const res = await documentManagementApi.getTemplates({ ...params, page, limit: 30 });
            const list = res?.data?.templates || res?.data || [];
            setTemplates(current => append ? [...current, ...list] : list);
            setTemplatePage(page);
            setTemplatesHasMore(page * 30 < (res?.pagination?.total || 0));
        } catch (err) {
            console.error('Failed to load templates:', err);
        } finally {
            setIsLoading(false);
            setLoadingMoreTemplates(false);
        }
    }, [hasApprovalPermission]);

    useEffect(() => { loadTemplates(); }, [loadTemplates]);

    const resetModal = () => {
        setTemplateName('');
        setCategory('Information Security');
        setDescription('');
        setEditorJsonContent(null);
        setErrorMsg('');
    };

    const handleOpenModal = () => { resetModal(); setIsCreateModalOpen(true); };
    const handleCloseModal = () => { setIsCreateModalOpen(false); resetModal(); };

    // Open template in View mode
    const handleOpenView = (tmpl) => {
        setReviewingTemplate(tmpl);
        setModalMode('view');
        setEditName(tmpl.template_name || '');
        setEditCategory(tmpl.category || 'Information Security');
        setEditDescription(tmpl.description || '');
        const detailsSec =
            tmpl.structure?.sections?.find(s => (s.title || '').toLowerCase().includes('details')) ||
            tmpl.structure?.sections?.find(s => s.order === 2) ||
            tmpl.structure?.sections?.[1] ||
            tmpl.structure?.sections?.[0];
        setEditEditorContent(detailsSec?.content || null);
        setRejectionReason('');
        setReviewFeedbackMsg('');
        setEditErrorMsg('');
    };

    // Open template in Edit mode
    const handleOpenEdit = (tmpl) => {
        setReviewingTemplate(tmpl);
        setModalMode('edit');
        setEditName(tmpl.template_name || '');
        setEditCategory(tmpl.category || 'Information Security');
        setEditDescription(tmpl.description || '');
        const detailsSec =
            tmpl.structure?.sections?.find(s => (s.title || '').toLowerCase().includes('details')) ||
            tmpl.structure?.sections?.find(s => s.order === 2) ||
            tmpl.structure?.sections?.[1] ||
            tmpl.structure?.sections?.[0];
        setEditEditorContent(detailsSec?.content || null);
        setRejectionReason('');
        setReviewFeedbackMsg('');
        setEditErrorMsg('');
    };

    // Save edited template
    const handleSaveEditTemplate = async () => {
        if (!editName.trim()) {
            setEditErrorMsg('Template name is required.');
            return;
        }
        if (!editCategory.trim()) {
            setEditErrorMsg('Category is required.');
            return;
        }

        setIsSavingEdit(true);
        setEditErrorMsg('');

        try {
            let cleanContent = {
                type: 'doc',
                content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Detailed operational clauses and controls.' }] }]
            };

            if (editEditorContent) {
                const rawJson = editEditorContent?.json || (editEditorContent?.type === 'doc' ? editEditorContent : null);
                if (rawJson) {
                    try {
                        cleanContent = JSON.parse(JSON.stringify(rawJson));
                    } catch (e) {
                        console.warn('Failed to serialize editor AST', e);
                    }
                }
            }

            // Update details and summary in structure sections
            const currentSections = reviewingTemplate.structure?.sections || [
                { title: '1. Configuration', order: 0, content: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Document configuration, ownership, and scope.' }] }] } },
                { title: '2. Summary',       order: 1, content: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: editDescription || 'Executive summary.' }] }] } },
                { title: '3. Details',       order: 2, content: cleanContent },
                { title: '4. Reference',     order: 3, content: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Statutory citations and internal bank policies.' }] }] } },
                { title: '5. Dependencies',  order: 4, content: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Cross-functional system dependencies.' }] }] } },
                { title: '6. Controls',      order: 5, content: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Compliance checkpoints and verification metrics.' }] }] } },
            ];

            const updatedSections = currentSections.map(s => {
                if ((s.title || '').toLowerCase().includes('details')) {
                    return { ...s, content: cleanContent };
                }
                if ((s.title || '').toLowerCase().includes('summary')) {
                    return { ...s, content: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: editDescription || 'Executive summary.' }] }] } };
                }
                return s;
            });

            const res = await documentManagementApi.updateTemplate(reviewingTemplate.id, {
                template_name: editName.trim(),
                category:      editCategory.trim(),
                description:   editDescription.trim(),
                structure:     { sections: updatedSections },
            });

            if (res?.success) {
                const updatedTmpl = {
                    ...reviewingTemplate,
                    template_name: editName.trim(),
                    category:      editCategory.trim(),
                    description:   editDescription.trim(),
                    structure:     { sections: updatedSections },
                };
                setReviewingTemplate(updatedTmpl);
                setModalMode('view');
                loadTemplates();
                setToastMsg({
                    type: 'success',
                    text: res?.message || 'Template updated successfully.'
                });
            } else {
                setEditErrorMsg(res?.message || 'Failed to update template.');
            }
        } catch (err) {
            setEditErrorMsg(err.message || 'Error updating template.');
        } finally {
            setIsSavingEdit(false);
        }
    };

    const handleCreateTemplate = async (e) => {
        if (e && e.preventDefault) e.preventDefault();
        if (!templateName.trim()) { setErrorMsg('Template name is required.'); return; }
        if (!category.trim())     { setErrorMsg('Category is required.'); return; }

        setIsSubmitting(true);
        setErrorMsg('');

        try {
            let cleanDetailsContent = {
                type: 'doc',
                content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Detailed operational clauses and controls.' }] }]
            };

            if (editorJsonContent) {
                const rawJson = editorJsonContent?.json || (editorJsonContent?.type === 'doc' ? editorJsonContent : null);
                if (rawJson) {
                    try {
                        cleanDetailsContent = JSON.parse(JSON.stringify(rawJson));
                    } catch (e) {
                        console.warn('Failed to serialize editor AST', e);
                    }
                }
            }

            const standardSections = [
                { title: '1. Configuration', order: 0, content: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Document configuration, ownership, and scope.' }] }] } },
                { title: '2. Summary',       order: 1, content: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: description || 'Executive summary of key policy requirements.' }] }] } },
                { title: '3. Details',       order: 2, content: cleanDetailsContent },
                { title: '4. Reference',     order: 3, content: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Statutory citations and internal bank policies.' }] }] } },
                { title: '5. Dependencies',  order: 4, content: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Cross-functional system dependencies.' }] }] } },
                { title: '6. Controls',      order: 5, content: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Compliance checkpoints and verification metrics.' }] }] } },
            ];

            const res = await documentManagementApi.createTemplate({
                template_name: templateName.trim(),
                category:      category.trim(),
                description:   description.trim(),
                structure:     { sections: standardSections },
            });

            if (res?.success) {
                handleCloseModal();
                loadTemplates();
                setToastMsg({
                    type: 'success',
                    text: res?.message || (isSuperAdmin ? 'Template created and approved successfully.' : 'Template submitted for review. Approvers have been notified.')
                });
            } else {
                setErrorMsg(res?.message || 'Failed to create template.');
            }
        } catch (err) {
            setErrorMsg(err.message || 'Error communicating with server.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Review & Approval handler
    const handleReviewTemplate = async (templateId, action) => {
        setIsReviewing(true);
        setReviewFeedbackMsg('');
        try {
            const res = await documentManagementApi.reviewTemplate(templateId, action, action === 'reject' ? rejectionReason : null);
            setReviewingTemplate(null);
            setRejectionReason('');
            loadTemplates();
            setToastMsg({
                type: 'success',
                text: res?.message || `Template ${action === 'approve' ? 'approved & published' : 'rejected'} successfully.`
            });
        } catch (err) {
            setReviewFeedbackMsg('Failed to update status: ' + (err.message || 'Unknown error'));
        } finally {
            setIsReviewing(false);
        }
    };

    // Unique Categories list from loaded templates
    const uniqueCategories = useMemo(() => {
        return Array.from(new Set(templates.map(t => t.category).filter(Boolean)));
    }, [templates]);

    // Subtab counts
    const pendingCount = templates.filter(t => t.status === 'pending').length;
    const approvedCount = templates.filter(t => t.status === 'approved').length;

    // Filter & sort templates for table display
    const displayedTemplates = useMemo(() => {
        return templates.filter(t => {
            // 1. Status Tab filter
            if (activeTab === 'approved' && t.status !== 'approved') return false;
            if (activeTab === 'pending'  && t.status !== 'pending')  return false;

            // 2. Category filter
            if (selectedCategory !== 'ALL' && t.category !== selectedCategory) return false;

            // 3. Search query filter
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                const matchesName = (t.template_name || '').toLowerCase().includes(q);
                const matchesDesc = (t.description || '').toLowerCase().includes(q);
                const matchesId   = (t.template_id || '').toLowerCase().includes(q);
                const matchesCat  = (t.category || '').toLowerCase().includes(q);
                const matchesUser = (t.requested_by_name || t.created_by_name || '').toLowerCase().includes(q);
                if (!matchesName && !matchesDesc && !matchesId && !matchesCat && !matchesUser) {
                    return false;
                }
            }

            return true;
        }).sort((a, b) => {
            if (sortBy === 'newest') {
                return new Date(b.created_at || 0) - new Date(a.created_at || 0);
            }
            if (sortBy === 'oldest') {
                return new Date(a.created_at || 0) - new Date(b.created_at || 0);
            }
            if (sortBy === 'name') {
                return (a.template_name || '').localeCompare(b.template_name || '');
            }
            return 0;
        });
    }, [templates, activeTab, selectedCategory, searchQuery, sortBy]);

    return (
        <div className="templates-page-container">
            {/* Notification Toast */}
            {toastMsg && (
                <div className={`templates-toast-alert ${toastMsg.type || 'success'}`}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <CheckCircle2 size={16} />
                        <span>{toastMsg.text}</span>
                    </div>
                    <button
                        type="button"
                        className="templates-toast-close"
                        onClick={() => setToastMsg(null)}
                        title="Dismiss"
                    >
                        <X size={14} />
                    </button>
                </div>
            )}

            {/* Header */}
            <div className="templates-header">
                <div className="templates-title-group">
                    <h2>Policy Templates</h2>
                    <p>Clone pre-certified institutional policy structures with clauses, risk benchmarks, and SLAs.</p>
                </div>

                <div className="templates-actions">
                    {hasCreatePermission && (
                        <button
                            type="button"
                            className="btn btn-primary"
                            onClick={handleOpenModal}
                        >
                            <Plus size={16} />
                            <span>{isSuperAdmin ? 'New Template' : 'Submit Template for Approval'}</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Sub-tabs: Approved Catalog / Pending Approvals / All */}
            <div className="templates-tabs-bar">
                {hasApprovalPermission && (
                    <button
                        type="button"
                        className={`templates-tab-item ${activeTab === 'approved' ? 'active' : ''}`}
                        onClick={() => setActiveTab('approved')}
                    >
                        <CheckCircle2 size={15} />
                        <span>Approved Templates</span>
                        <span className="templates-tab-badge">{approvedCount}</span>
                    </button>
                )}

                {hasApprovalPermission && (
                    <button
                        type="button"
                        className={`templates-tab-item ${activeTab === 'pending' ? 'active' : ''}`}
                        onClick={() => setActiveTab('pending')}
                    >
                        <Clock size={15} />
                        <span>Pending Approvals</span>
                        <span className={`templates-tab-badge ${pendingCount > 0 ? 'pending-badge' : ''}`}>
                            {pendingCount}
                        </span>
                    </button>
                )}

                <button
                    type="button"
                    className={`templates-tab-item ${activeTab === 'all' ? 'active' : ''}`}
                    onClick={() => setActiveTab('all')}
                >
                    <Layers size={15} />
                    <span>All Templates</span>
                    <span className="templates-tab-badge">{templates.length}</span>
                </button>
            </div>

            {/* Filter & Search Toolbar */}
            <div className="templates-filter-bar">
                <div className="templates-filter-controls">
                    <div className="templates-search-wrap">
                        <Search size={15} className="templates-search-icon" />
                        <input
                            type="text"
                            className="templates-search-input"
                            placeholder="Search by name, ID, category, or owner..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <select
                        className="templates-filter-select"
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                    >
                        <option value="ALL">All Categories</option>
                        {uniqueCategories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>

                    <select
                        className="templates-filter-select"
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                    >
                        <option value="newest">Sort: Newest First</option>
                        <option value="oldest">Sort: Oldest First</option>
                        <option value="name">Sort: Name (A-Z)</option>
                    </select>

                    {(selectedCategory !== 'ALL' || searchQuery) && (
                        <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => { setSelectedCategory('ALL'); setSearchQuery(''); }}
                            style={{ height: '36px' }}
                        >
                            Clear Filters
                        </button>
                    )}
                </div>

                <div style={{ fontSize: '12px', color: '#64748b' }}>
                    Showing <strong>{displayedTemplates.length}</strong> {displayedTemplates.length === 1 ? 'template' : 'templates'}
                </div>
            </div>

            {/* Templates Table Formation */}
            <div className="templates-table-container">
                <table className="templates-table">
                    <thead>
                        <tr>
                            <th style={{ width: '30%' }}>Template Name &amp; ID</th>
                            <th style={{ width: '15%' }}>Category</th>
                            <th style={{ width: '12%' }}>Structure</th>
                            <th style={{ width: '12%' }}>Status</th>
                            <th style={{ width: '16%' }}>Submitted By / Owner</th>
                            <th style={{ width: '10%' }}>Created Date</th>
                            <th style={{ width: '15%', textAlign: 'right' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr>
                                <td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                                    Loading policy templates...
                                </td>
                            </tr>
                        ) : displayedTemplates.length === 0 ? (
                            <tr>
                                <td colSpan={7} style={{ padding: '60px 20px', textAlign: 'center' }}>
                                    <FileSpreadsheet size={34} style={{ color: '#94a3b8', margin: '0 auto 10px', display: 'block' }} />
                                    <h4 style={{ margin: '0 0 4px', fontSize: '14px', color: '#334155' }}>
                                        {activeTab === 'pending' ? 'No Templates Pending Approval' : 'No templates match your filters'}
                                    </h4>
                                    <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>
                                        {activeTab === 'pending'
                                            ? 'All submitted policy templates have been reviewed.'
                                            : (hasCreatePermission ? 'Create your first standardized banking policy template.' : 'Contact an administrator to publish templates.')}
                                    </p>
                                </td>
                            </tr>
                        ) : (
                            displayedTemplates.map((tmpl) => {
                                const isPending = tmpl.status === 'pending';
                                const sectionsCount = tmpl.structure?.sections?.length || 6;
                                const dateStr = tmpl.created_at
                                    ? new Date(tmpl.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                                    : '—';

                                return (
                                    <tr key={tmpl.id} className={isPending ? 'row-pending' : ''}>
                                        {/* Template Name & ID */}
                                        <td>
                                            <div className="template-name-cell">
                                                <span className="template-name-title">{tmpl.template_name}</span>
                                                {tmpl.template_id && (
                                                    <span className="template-id-sub">ID: {tmpl.template_id}</span>
                                                )}
                                                {tmpl.description && (
                                                    <span style={{ fontSize: '11px', color: '#64748b', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                                        {tmpl.description}
                                                    </span>
                                                )}
                                            </div>
                                        </td>

                                        {/* Category */}
                                        <td>
                                            <span className="template-badge">{tmpl.category || 'General'}</span>
                                        </td>

                                        {/* Structure */}
                                        <td>
                                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: '#475569' }}>
                                                <Layers size={13} style={{ color: '#0057B8' }} />
                                                <span>{sectionsCount} Sections</span>
                                            </div>
                                        </td>

                                        {/* Status */}
                                        <td>
                                            <span className={`template-status-badge ${tmpl.status || 'approved'}`}>
                                                {tmpl.status === 'approved' && <CheckCircle2 size={11} style={{ display: 'inline', marginRight: '3px' }} />}
                                                {tmpl.status === 'pending'  && <Clock        size={11} style={{ display: 'inline', marginRight: '3px' }} />}
                                                {tmpl.status === 'rejected' && <XCircle      size={11} style={{ display: 'inline', marginRight: '3px' }} />}
                                                {tmpl.status || 'approved'}
                                            </span>
                                        </td>

                                        {/* Submitter / Owner */}
                                        <td>
                                            <div className="template-user-cell">
                                                <span className="template-user-name">
                                                    <User size={13} style={{ color: '#0057B8' }} />
                                                    {tmpl.requested_by_name || tmpl.created_by_name || (isPending ? 'Standard User' : 'Super Admin')}
                                                </span>
                                                {(tmpl.requested_by_email || tmpl.created_by_email) && (
                                                    <span className="template-user-email">
                                                        {tmpl.requested_by_email || tmpl.created_by_email}
                                                    </span>
                                                )}
                                            </div>
                                        </td>

                                        {/* Created Date */}
                                        <td>
                                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: '#64748b' }}>
                                                <Calendar size={12} />
                                                <span>{dateStr}</span>
                                            </div>
                                        </td>

                                        {/* Actions */}
                                        <td style={{ textAlign: 'right' }}>
                                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end' }}>
                                                {hasApprovalPermission && isPending ? (
                                                    <button
                                                        type="button"
                                                        className="btn btn-sm btn-primary"
                                                        style={{ background: '#f59e0b', borderColor: '#d97706', color: '#fff' }}
                                                        onClick={() => handleOpenView(tmpl)}
                                                        title="Review full template content and approve or reject"
                                                    >
                                                        <ShieldCheck size={13} />
                                                        <span>Review &amp; Approve</span>
                                                    </button>
                                                ) : (
                                                    <>
                                                        <button
                                                            type="button"
                                                            className="btn btn-sm btn-secondary"
                                                            onClick={() => handleOpenView(tmpl)}
                                                            title="View template sections & clauses"
                                                        >
                                                            <Eye size={12} />
                                                            <span>View</span>
                                                        </button>
                                                        {hasUpdatePermission && !isPending && (
                                                            <button
                                                                type="button"
                                                                className="btn btn-sm btn-secondary"
                                                                onClick={() => handleOpenEdit(tmpl)}
                                                                title="Edit template details and clauses"
                                                            >
                                                                <Edit2 size={12} />
                                                                <span>Edit</span>
                                                            </button>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
                <LoadMoreOnScroll hasMore={templatesHasMore} loading={loadingMoreTemplates} onLoadMore={() => loadTemplates(templatePage + 1, true)} label="Load more templates" />
            </div>

            {/* ─────────────────────────────────────────────────────────────
                VIEW / EDIT / APPROVE MODAL (Buttons at Top Header!)
            ───────────────────────────────────────────────────────────── */}
            {reviewingTemplate && (
                <div className="template-modal-overlay">
                    <div className="review-modal-card">
                        {/* Modal Header with Top Buttons */}
                        <div className="template-modal-header">
                            <div className="template-modal-header-left">
                                {modalMode === 'edit' ? (
                                    <Edit2 size={18} style={{ color: 'var(--btn-primary-bg, #0057B8)' }} />
                                ) : reviewingTemplate.status === 'pending' ? (
                                    <ShieldCheck size={20} style={{ color: '#f59e0b' }} />
                                ) : (
                                    <FileSpreadsheet size={18} style={{ color: 'var(--btn-primary-bg, #0057B8)' }} />
                                )}
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700 }}>
                                        {modalMode === 'edit'
                                            ? `Edit Template: ${reviewingTemplate.template_name}`
                                            : reviewingTemplate.status === 'pending'
                                                ? `Review Template: ${reviewingTemplate.template_name}`
                                                : `Template Details: ${reviewingTemplate.template_name}`
                                        }
                                    </h3>
                                    <span style={{ fontSize: '12px', color: '#64748b' }}>
                                        {modalMode === 'edit'
                                            ? 'Update template attributes and standard clauses. Changes take effect immediately.'
                                            : reviewingTemplate.status === 'pending'
                                                ? `Review structured clauses authored by ${reviewingTemplate.requested_by_name || 'user'} before approving.`
                                                : `Read-only banking policy standard. Clone into a document when creating a policy.`
                                        }
                                    </span>
                                </div>
                            </div>

                            {/* Action Buttons in Modal Header (TOP) */}
                            <div className="template-modal-header-actions">
                                {modalMode === 'edit' ? (
                                    <>
                                        <button
                                            type="button"
                                            className="btn btn-secondary"
                                            onClick={() => {
                                                setModalMode('view');
                                                setEditErrorMsg('');
                                            }}
                                            disabled={isSavingEdit}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="button"
                                            className="btn btn-primary"
                                            onClick={handleSaveEditTemplate}
                                            disabled={isSavingEdit}
                                        >
                                            <Save size={14} />
                                            <span>{isSavingEdit ? 'Saving Changes...' : 'Save Changes'}</span>
                                        </button>
                                    </>
                                ) : reviewingTemplate.status === 'pending' && hasApprovalPermission ? (
                                    <>
                                        <button
                                            type="button"
                                            className="btn btn-secondary"
                                            onClick={() => setReviewingTemplate(null)}
                                            disabled={isReviewing}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="button"
                                            className="btn btn-danger"
                                            onClick={() => handleReviewTemplate(reviewingTemplate.id, 'reject')}
                                            disabled={isReviewing}
                                        >
                                            <X size={14} />
                                            <span>{isReviewing ? 'Rejecting...' : 'Reject Template'}</span>
                                        </button>
                                        <button
                                            type="button"
                                            className="btn btn-primary"
                                            style={{ background: '#16a34a', borderColor: '#15803d' }}
                                            onClick={() => handleReviewTemplate(reviewingTemplate.id, 'approve')}
                                            disabled={isReviewing}
                                        >
                                            <Check size={14} />
                                            <span>{isReviewing ? 'Approving...' : 'Approve & Publish'}</span>
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        {hasUpdatePermission && reviewingTemplate.status !== 'pending' && (
                                            <button
                                                type="button"
                                                className="btn btn-secondary"
                                                onClick={() => setModalMode('edit')}
                                                title="Edit template details and clauses"
                                            >
                                                <Edit2 size={13} />
                                                <span>Edit Template</span>
                                            </button>
                                        )}
                                        <button
                                            type="button"
                                            className="btn btn-secondary"
                                            onClick={() => setReviewingTemplate(null)}
                                        >
                                            Close
                                        </button>
                                    </>
                                )}
                                <button
                                    type="button"
                                    className="dms-annot-close-btn"
                                    onClick={() => setReviewingTemplate(null)}
                                    title="Close"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        </div>

                        {/* 2-Panel Split: 40% Left, 60% Right */}
                        <div className="template-modal-split">
                            {/* Left Panel: Form in Edit mode / Metadata in View mode */}
                            <div className="review-modal-left">
                                {reviewFeedbackMsg && (
                                    <div style={{ padding: '8px 12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', color: '#b91c1c', fontSize: '12px' }}>
                                        {reviewFeedbackMsg}
                                    </div>
                                )}
                                {editErrorMsg && (
                                    <div style={{ padding: '8px 12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', color: '#b91c1c', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <AlertCircle size={14} />
                                        <span>{editErrorMsg}</span>
                                    </div>
                                )}

                                {modalMode === 'edit' ? (
                                    <>
                                        <div className="form-group">
                                            <label className="form-label">
                                                Template Name <span style={{ color: 'var(--error, #dc2626)' }}>*</span>
                                            </label>
                                            <input
                                                type="text"
                                                className="form-input"
                                                placeholder="e.g. APRA CPS 234 Information Security Standard"
                                                value={editName}
                                                onChange={(e) => setEditName(e.target.value)}
                                                required
                                            />
                                        </div>

                                        <div className="form-group">
                                            <label className="form-label">
                                                Category <span style={{ color: 'var(--error, #dc2626)' }}>*</span>
                                            </label>
                                            <CategoryCombobox value={editCategory} onChange={setEditCategory} />
                                        </div>

                                        <div className="form-group">
                                            <label className="form-label">Description</label>
                                            <textarea
                                                className="form-input"
                                                style={{ height: '84px', padding: '10px 14px', resize: 'vertical' }}
                                                placeholder="Executive scope & objectives..."
                                                value={editDescription}
                                                onChange={(e) => setEditDescription(e.target.value)}
                                            />
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="review-meta-item">
                                            <span className="review-meta-label">Submitted / Created By</span>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <User size={14} style={{ color: '#0057B8' }} />
                                                <span className="review-meta-value">
                                                    {reviewingTemplate.requested_by_name || reviewingTemplate.created_by_name || (reviewingTemplate.status === 'pending' ? 'Standard User' : 'Super Admin')}
                                                </span>
                                            </div>
                                            {(reviewingTemplate.requested_by_email || reviewingTemplate.created_by_email) && (
                                                <span style={{ fontSize: '12px', color: '#64748b', marginLeft: '20px' }}>
                                                    {reviewingTemplate.requested_by_email || reviewingTemplate.created_by_email}
                                                </span>
                                            )}
                                        </div>

                                        <div className="review-meta-item">
                                            <span className="review-meta-label">Category</span>
                                            <span className="review-meta-value">{reviewingTemplate.category || 'General'}</span>
                                        </div>

                                        <div className="review-meta-item">
                                            <span className="review-meta-label">Template ID</span>
                                            <span className="review-meta-value" style={{ fontFamily: 'monospace' }}>
                                                {reviewingTemplate.template_id || 'Auto-generated'}
                                            </span>
                                        </div>

                                        <div className="review-meta-item">
                                            <span className="review-meta-label">Scope &amp; Description</span>
                                            <p style={{ margin: 0, fontSize: '13px', color: '#334155', lineHeight: '1.45' }}>
                                                {reviewingTemplate.description || 'No description provided.'}
                                            </p>
                                        </div>

                                        {/* Rejection Feedback Area (shown if pending and user can approve) */}
                                        {hasApprovalPermission && reviewingTemplate.status === 'pending' && (
                                            <div className="review-rejection-box">
                                                <span className="review-meta-label" style={{ color: '#991b1b' }}>
                                                    Rejection Reason (Required only if Rejecting)
                                                </span>
                                                <textarea
                                                    className="form-input"
                                                    style={{ height: '70px', padding: '8px 10px', fontSize: '12px' }}
                                                    placeholder="Explain changes needed so the submitter can revise and resubmit..."
                                                    value={rejectionReason}
                                                    onChange={(e) => setRejectionReason(e.target.value)}
                                                />
                                            </div>
                                        )}
                                    </>
                                )}

                                {/* Banking Standards Checklist */}
                                {/* <div className="template-info-box" style={{ marginTop: 'auto' }}>
                                    <div className="template-info-title">
                                        <Layers size={13} /> 6 Standard Sections Structure
                                    </div>
                                    <ul className="template-info-list">
                                        <li>1. Configuration (Auto initialized)</li>
                                        <li>2. Summary (Executive objectives)</li>
                                        <li>3. Details (Authored content - Right)</li>
                                        <li>4. Reference (Statutory circulars)</li>
                                        <li>5. Dependencies (System integration)</li>
                                        <li>6. Controls (Verification metrics)</li>
                                    </ul>
                                </div> */}
                            </div>

                            {/* Right Panel: Rich Text Editor */}
                            <div className="review-modal-right">
                                <div>
                                    <label className="form-label" style={{ marginBottom: '2px', display: 'block' }}>
                                        {modalMode === 'edit'
                                            ? 'Section 3: Details — Edit Standard Clauses & Content'
                                            : 'Section 3: Details — Authored Content Preview'
                                        }
                                    </label>
                                    <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                                        {modalMode === 'edit'
                                            ? 'Edit rich formatted clauses, tables, and compliance requirements.'
                                            : 'Read-only preview of formatted clauses, SLAs, and rules.'
                                        }
                                    </span>
                                </div>

                                <div className="template-editor-wrapper">
                                    <RichTextEditor
                                        key={`editor-${reviewingTemplate.id}-${modalMode}`}
                                        paged={false}
                                        readOnly={modalMode === 'view'}
                                        showToolbar={modalMode === 'edit'}
                                        placeholder="Write standard policy template clauses, requirements, SLAs and tables here..."
                                        initialContent={
                                            editEditorContent ||
                                            reviewingTemplate.structure?.sections?.find(s => s.order === 2 || s.title?.includes('Details'))?.content ||
                                            reviewingTemplate.structure?.sections?.[2]?.content ||
                                            { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'No detailed clauses.' }] }] }
                                        }
                                        onChange={modalMode === 'edit' ? (val) => setEditEditorContent(val?.json || val) : undefined}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ─────────────────────────────────────────────────────────────
                Create Template Modal (Buttons at Top Header!)
            ───────────────────────────────────────────────────────────── */}
            {isCreateModalOpen && (
                <div className="template-modal-overlay">
                    <div className="template-modal-card">
                        {/* Modal Header with Top Buttons */}
                        <div className="template-modal-header">
                            <div className="template-modal-header-left">
                                <FileSpreadsheet size={18} style={{ color: 'var(--btn-primary-bg, #0057B8)' }} />
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700 }}>
                                        {isSuperAdmin ? 'Create New Approved Template' : 'Submit Template for Approval'}
                                    </h3>
                                    <span style={{ fontSize: '12px', color: '#64748b' }}>
                                        {isSuperAdmin ? 'Directly publishes standardized banking policy standard.' : 'Submits policy template to designated approvers for review.'}
                                    </span>
                                </div>
                            </div>

                            {/* Top Action Buttons */}
                            <div className="template-modal-header-actions">
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={handleCloseModal}
                                    disabled={isSubmitting}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-primary"
                                    onClick={handleCreateTemplate}
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? 'Saving...' : (isSuperAdmin ? 'Publish Approved Template' : 'Submit for Approval')}
                                </button>
                                <button
                                    type="button"
                                    className="dms-annot-close-btn"
                                    onClick={handleCloseModal}
                                    title="Close"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        </div>

                        <form onSubmit={handleCreateTemplate} style={{ display: 'flex', flexDirection: 'column', height: 'calc(100% - 60px)', minHeight: 0 }}>
                            <div className="template-modal-split">
                                {/* Left Panel (40%): Form Inputs & Guidance */}
                                <div className="template-modal-left">
                                    {errorMsg && (
                                        <div style={{ padding: '8px 12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', color: '#b91c1c', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <AlertCircle size={14} />
                                            <span>{errorMsg}</span>
                                        </div>
                                    )}

                                    <div className="form-group">
                                        <label className="form-label">
                                            Template Name <span style={{ color: 'var(--error, #dc2626)' }}>*</span>
                                        </label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            placeholder="e.g. APRA CPS 234 Information Security Standard"
                                            value={templateName}
                                            onChange={(e) => setTemplateName(e.target.value)}
                                            required
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">
                                            Category <span style={{ color: 'var(--error, #dc2626)' }}>*</span>
                                        </label>
                                        <CategoryCombobox value={category} onChange={setCategory} />
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Description</label>
                                        <textarea
                                            className="form-input"
                                            style={{ height: '84px', padding: '10px 14px', resize: 'vertical' }}
                                            placeholder="Executive scope & objectives..."
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                        />
                                    </div>

                                    {/* Standard Sections Guide */}
                                    <div className="template-info-box">
                                        <div className="template-info-title">
                                            <Layers size={14} /> 6 Standard Banking Sections
                                        </div>
                                        <div className="template-info-desc">
                                            Templates automatically bundle mandatory compliance sections into all created policies:
                                        </div>
                                        <ul className="template-info-list">
                                            <li><strong>1. Configuration:</strong> Version, owner, scope</li>
                                            <li><strong>2. Summary:</strong> Populated from description</li>
                                            <li><strong>3. Details:</strong> Authored in the rich editor (Right)</li>
                                            <li><strong>4. Reference:</strong> Statutory citations &amp; policies</li>
                                            <li><strong>5. Dependencies:</strong> System &amp; governance links</li>
                                            <li><strong>6. Controls:</strong> Risk mitigation &amp; audit metrics</li>
                                        </ul>
                                    </div>
                                </div>

                                {/* Right Panel (60%): Rich Text Editor */}
                                <div className="template-modal-right">
                                    <div>
                                        <label className="form-label" style={{ marginBottom: '2px', display: 'block' }}>
                                            Template Standard Clauses &amp; Content
                                        </label>
                                        <span style={{ fontSize: '12px', color: 'var(--text-muted, #94a3b8)' }}>
                                            Stored as structured JSON for Section 3: Details.
                                        </span>
                                    </div>

                                    <div className="template-editor-wrapper">
                                        <RichTextEditor
                                            paged={false}
                                            placeholder="Write standard policy template clauses, requirements, SLAs and tables here..."
                                            onChange={(val) => setEditorJsonContent(val?.json || val)}
                                        />
                                    </div>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
