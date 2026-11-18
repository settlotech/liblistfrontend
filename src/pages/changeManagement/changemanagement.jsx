import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
    ShieldCheck,
    FileText,
    Clock,
    CheckCircle2,
    XCircle,
    FileEdit,
    Plus,
    Search,
    User,
    Calendar,
    Folder,
    Check,
    X,
    AlertCircle,
    Eye,
    Trash2,
    GitBranch
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { documentManagementApi } from '../../services/api/documentManagementApi';
import FullscreenEditorModal from '../../components/common/FullscreenEditorModal';
import './changemanagement.css';
import LoadMoreOnScroll from '../../components/common/LoadMoreOnScroll';

export default function ChangeManagementPage() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // Feedback toast from create navigation
    const [toastMsg, setToastMsg] = useState(location.state?.toastMessage || null);

    const [documents, setDocuments]       = useState([]);
    const [isLoading, setIsLoading]       = useState(true);
    const [documentsPage, setDocumentsPage] = useState(1);
    const [documentsHasMore, setDocumentsHasMore] = useState(false);
    const [loadingMoreDocuments, setLoadingMoreDocuments] = useState(false);
    const [activeTab, setActiveTab]       = useState('all'); // 'all' | 'draft' | 'pending' | 'approved' | 'rejected'
    const [searchQuery, setSearchQuery]   = useState('');

    // Fullscreen Editor State for Reviewing submitted versions
    const [openDoc, setOpenDoc]           = useState(null);
    const [openDocContent, setOpenDocContent] = useState(null);
    const [isLoadingDoc, setIsLoadingDoc] = useState(false);

    // Library Removal Review State
    const [pendingLibraryRemovals, setPendingLibraryRemovals] = useState([]);
    const [reviewingLibrary, setReviewingLibrary] = useState(null);
    const [libraryReviewAction, setLibraryReviewAction] = useState('approve'); // 'approve' | 'reject'
    const [libraryReviewFeedback, setLibraryReviewFeedback] = useState('');
    const [isReviewingLibrary, setIsReviewingLibrary] = useState(false);

    // Policy Removal Review State
    const [pendingPolicyRemovals, setPendingPolicyRemovals] = useState([]);
    const [reviewingPolicyRemoval, setReviewingPolicyRemoval] = useState(null);
    const [policyRemovalAction, setPolicyRemovalAction] = useState('approve'); // 'approve' | 'reject'
    const [policyRemovalFeedback, setPolicyRemovalFeedback] = useState('');
    const [isReviewingPolicyRemoval, setIsReviewingPolicyRemoval] = useState(false);

    // Super Admin Review Action Modal State
    const [reviewingDoc, setReviewingDoc] = useState(null);
    const [reviewAction, setReviewAction] = useState('approve'); // 'approve' | 'reject'
    const [rejectionReason, setRejectionReason] = useState('');
    const [isReviewing, setIsReviewing]   = useState(false);
    const [reviewError, setReviewError]   = useState('');

    // Role check: Super Admin or users with documents:approval permission
    const isSuperAdmin = user?.isSuperAdmin || (user?.roles || []).some(r => {
        const name = typeof r === 'string' ? r : r.role_name;
        return name?.toLowerCase() === 'super admin';
    });
    const canApprove = isSuperAdmin || (user?.permissionStrings || user?.permissions || []).includes('documents:approval');

    useEffect(() => {
        if (!toastMsg) return;
        const timer = setTimeout(() => setToastMsg(null), 5000);
    
    return () => clearTimeout(timer);
    }, [toastMsg]);

    const loadPolicies = useCallback(async (page = 1, append = false) => {
        if (append) setLoadingMoreDocuments(true); else setIsLoading(true);
        try {
            const [docsRes, libRes, polRemRes] = await Promise.all([
                documentManagementApi.getDocuments({ page, limit: 30, scope: 'change_management' }).catch(() => ({ data: [] })),
                append ? Promise.resolve(null) : documentManagementApi.getPendingLibraryRemovals().catch(() => ({ data: [] })),
                append ? Promise.resolve(null) : documentManagementApi.getPendingPolicyRemovals().catch(() => ({ data: [] }))
            ]);
            const list = docsRes?.data?.documents || docsRes?.data || [];
            setDocuments(current => append ? [...current, ...list] : list);
            setDocumentsPage(page);
            setDocumentsHasMore(page < (docsRes?.pagination?.totalPages || 1));
            if (!append) {
                setPendingLibraryRemovals(libRes?.data || []);
                setPendingPolicyRemovals(polRemRes?.data || []);
            }
        } catch (err) {
            console.error('Failed to load change management data:', err);
        } finally {
            setIsLoading(false);
            setLoadingMoreDocuments(false);
        }
    }, []);

    useEffect(() => {
        loadPolicies();
    }, [loadPolicies]);

    // Categorization helper functions
    const isPendingReview = (d) => (d.status === 'pending' || d.status === 'in_review') || (d.has_pending_revision && d.revision_status === 'pending_review');
    const isDraftStatus   = (d) => d.status === 'draft' || (d.has_pending_revision && d.revision_status === 'draft');
    const isApprovedStatus = (d) => (d.status === 'active' || d.status === 'approved') && !isPendingReview(d);
    const isRejectedStatus = (d) => d.status === 'rejected' || d.revision_status === 'rejected';

    // Tab counts
    const draftCount    = documents.filter(isDraftStatus).length;
    const pendingCount  = documents.filter(isPendingReview).length;
    const approvedCount = documents.filter(isApprovedStatus).length;
    const rejectedCount = documents.filter(isRejectedStatus).length;

    // Filter & search
    const displayedDocs = useMemo(() => {
        return documents.filter(d => {
            // Tab filter
            if (activeTab === 'draft'    && !isDraftStatus(d)) return false;
            if (activeTab === 'pending'  && !isPendingReview(d)) return false;
            if (activeTab === 'approved' && !isApprovedStatus(d)) return false;
            if (activeTab === 'rejected' && !isRejectedStatus(d)) return false;

            // Search filter
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase().trim();
                const matchesName = (d.document_name || '').toLowerCase().includes(q) || (d.pending_document_name || '').toLowerCase().includes(q);
                const matchesLib  = (d.library_name || '').toLowerCase().includes(q);
                const matchesUser = (d.pending_revision_by_name || d.requested_by_name || d.created_by_name || '').toLowerCase().includes(q);
                if (!matchesName && !matchesLib && !matchesUser) return false;
            }

            return true;
        });
    }, [documents, activeTab, searchQuery]);

    // Handle Super Admin Approval / Rejection
    const handleConfirmReview = async () => {
        if (!reviewingDoc) return;
        if (reviewAction === 'reject' && !rejectionReason.trim()) {
            setReviewError('Please provide a reason for requesting revisions.');
            return;
        }

        setIsReviewing(true);
        setReviewError('');

        try {
            await documentManagementApi.reviewDocument(reviewingDoc.id, reviewAction, rejectionReason);
            setReviewingDoc(null);
            setOpenDoc(null);
            setRejectionReason('');
            setToastMsg(`Policy "${reviewingDoc.pending_document_name || reviewingDoc.document_name}" ${reviewAction === 'approve' ? 'approved & published to Master Library' : 'rejected / returned for revision'}.`);
            if (reviewAction === 'approve') {
                // Refresh sidebar Master Library tree so new version appears
                window.dispatchEvent(new CustomEvent('liblist:document-updated', { detail: { library_id: reviewingDoc.library_id } }));
                window.dispatchEvent(new CustomEvent('liblist:version-committed', { detail: { document_id: reviewingDoc.id } }));
                window.dispatchEvent(new CustomEvent('liblist:refresh-nav'));
            }
            loadPolicies();
        } catch (err) {
            setReviewError(err.message || 'Failed to update policy status.');
        } finally {
            setIsReviewing(false);
        }
    };

    // Open policy submitted content in Fullscreen Editor
    const handleOpenDocument = async (doc) => {
        setIsLoadingDoc(true);
        try {
            const res = await documentManagementApi.getDocumentMetadata(doc.id);
            const fullDoc = res?.data || doc;
            const sections = fullDoc.sections || [];

            // Find Details section or first section
            const detailsSection = sections.find(s => (s.section_title || '').toLowerCase().includes('details')) || sections[0];

            // Always display what the user submitted for review (draft_content fallback to content)
            const rawContent = detailsSection ? (detailsSection.draft_content || detailsSection.content) : null;

            let parsed = null;
            if (rawContent) {
                if (typeof rawContent === 'object' && Array.isArray(rawContent.content)) {
                    parsed = rawContent;
                } else if (typeof rawContent === 'string') {
                    try {
                        const j = JSON.parse(rawContent);
                        if (j && Array.isArray(j.content)) parsed = j;
                    } catch {}
                }
            }

            if (!parsed && sections.length > 0) {
                const allBlocks = [];
                sections.forEach(sec => {
                    const c = sec.draft_content || sec.content;
                    if (c) {
                        try {
                            const j = typeof c === 'string' ? JSON.parse(c) : c;
                            if (j?.content) j.content.forEach(b => allBlocks.push(b));
                        } catch {}
                    }
                });
                if (allBlocks.length > 0) parsed = { type: 'doc', content: allBlocks };
            }

            if (!parsed) {
                parsed = {
                    type: 'doc',
                    content: [{ type: 'paragraph', content: [{ type: 'text', text: fullDoc.description || 'No content provided for this policy.' }] }]
                };
            }

            setOpenDoc(fullDoc);
            setOpenDocContent(parsed);
        } catch (err) {
            console.error('Failed to load document content:', err);
            setToastMsg('Failed to open document for review.');
        } finally {
            setIsLoadingDoc(false);
        }
    };

    // Open the PARENT (live/approved/base) version of a revision policy in the editor
    const handleOpenParentDocument = async (e, doc) => {
        e.stopPropagation();
        const parentVerId = doc.parent_version_id || doc.live_version_id;
        const parentVerNum = doc.parent_version_number || doc.live_version_number || '1.0';

        setIsLoadingDoc(true);
        try {
            let parsed = null;
            let fullDoc = doc;

            // 1. Try to load exact snapshot sections if parentVerId exists
            if (parentVerId) {
                try {
                    const verSecRes = await documentManagementApi.getVersionSections(doc.id, parentVerId);
                    const verSections = verSecRes?.data || [];
                    if (verSections.length > 0) {
                        const allBlocks = [];
                        verSections.forEach(sec => {
                            const c = sec.content;
                            if (c) {
                                try {
                                    const j = typeof c === 'string' ? JSON.parse(c) : c;
                                    if (j?.content) j.content.forEach(b => allBlocks.push(b));
                                    else if (Array.isArray(j)) j.forEach(b => allBlocks.push(b));
                                } catch {}
                            }
                        });
                        if (allBlocks.length > 0) parsed = { type: 'doc', content: allBlocks };
                    }
                } catch (vErr) {
                    console.warn('Could not load specific version snapshot, trying document metadata:', vErr);
                }
            }

            // 2. Fallback: load complete document metadata and use committed live content
            if (!parsed) {
                const res = await documentManagementApi.getDocumentMetadata(doc.id);
                fullDoc = res?.data || doc;
                const sections = fullDoc.sections || [];
                const allBlocks = [];
                sections.forEach(sec => {
                    const c = sec.content; // committed live content
                    if (c) {
                        try {
                            const j = typeof c === 'string' ? JSON.parse(c) : c;
                            if (j?.content) j.content.forEach(b => allBlocks.push(b));
                            else if (Array.isArray(j)) j.forEach(b => allBlocks.push(b));
                        } catch {}
                    }
                });
                if (allBlocks.length > 0) parsed = { type: 'doc', content: allBlocks };
            }

            if (!parsed) {
                parsed = {
                    type: 'doc',
                    content: [{ type: 'paragraph', content: [{ type: 'text', text: fullDoc.description || 'No content found for parent version.' }] }]
                };
            }

            setOpenDoc({
                ...fullDoc,
                _viewingParent: true,
                _parentVersionLabel: `v${parentVerNum}`,
                document_name: `${fullDoc.document_name} [Parent v${parentVerNum}]`,
            });
            setOpenDocContent(parsed);
        } catch (err) {
            console.error('Failed to load parent document:', err);
            setToastMsg('Failed to open parent version.');
        } finally {
            setIsLoadingDoc(false);
        }
    };

    // Review Library Removal (Super Admin)
    const handleConfirmLibraryReview = async () => {
        if (!reviewingLibrary) return;
        setIsReviewingLibrary(true);
        try {
            await documentManagementApi.reviewLibraryRemoval(reviewingLibrary.id, libraryReviewAction, libraryReviewFeedback);
            const libName = reviewingLibrary.library_name;
            const libId = reviewingLibrary.id;
            setReviewingLibrary(null);
            setLibraryReviewFeedback('');
            setToastMsg(`Library "${libName}" removal ${libraryReviewAction === 'approve' ? 'approved and library suspended' : 'rejected'}.`);
            window.dispatchEvent(new CustomEvent('liblist:library-updated', { detail: { library_id: libId } }));
            window.dispatchEvent(new CustomEvent('liblist:refresh-nav'));
            loadPolicies();
        } catch (err) {
            alert(err.message || 'Failed to review library removal');
        } finally {
            setIsReviewingLibrary(false);
        }
    };


    // Review Policy Removal (Super Admin)
    const handleConfirmPolicyRemovalReview = async () => {
        if (!reviewingPolicyRemoval) return;
        setIsReviewingPolicyRemoval(true);
        try {
            await documentManagementApi.reviewPolicyRemoval(reviewingPolicyRemoval.id, policyRemovalAction, policyRemovalFeedback);
            const docName = reviewingPolicyRemoval.document_name;
            const docId = reviewingPolicyRemoval.id;
            setReviewingPolicyRemoval(null);
            setPolicyRemovalFeedback('');
            setToastMsg(`Policy "${docName}" removal ${policyRemovalAction === 'approve' ? 'approved and policy suspended' : 'rejected'}.`);
            window.dispatchEvent(new CustomEvent('liblist:document-updated', { detail: { document_id: docId } }));
            window.dispatchEvent(new CustomEvent('liblist:refresh-nav'));
            loadPolicies();
        } catch (err) {
            alert(err.message || 'Failed to review policy removal');
        } finally {
            setIsReviewingPolicyRemoval(false);
        }
    };

    return (
        <div className="change-mgmt-container">
            {/* Notification Toast */}
            {toastMsg && (
                <div className="templates-toast-alert success">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <CheckCircle2 size={16} />
                        <span>{toastMsg}</span>
                    </div>
                    <button
                        type="button"
                        className="templates-toast-close"
                        onClick={() => setToastMsg(null)}
                    >
                        <X size={14} />
                    </button>
                </div>
            )}

            {/* Header */}
            <div className="change-mgmt-header">
                <div className="change-mgmt-title-group">
                    <h2>
                        {/* <ShieldCheck size={22} style={{ color: 'var(--btn-primary-bg, #0057B8)' }} /> */}
                        <span>Change Management &amp; Policy Lifecycle</span>
                    </h2>
                    <p>
                        {isSuperAdmin
                            ? 'Authorize and publish submitted operational policy drafts across institution libraries.'
                            : 'Track the lifecycle of your authored operational policies from draft to Super Admin approval.'
                        }
                    </p>
                </div>

                <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => navigate('/documents/create')}
                >
                    <Plus size={15} />
                    <span>Create  Policy</span>
                </button>
            </div>

            {/* Lifecycle Tabs */}
            <div className="change-mgmt-tabs">
                <button
                    type="button"
                    className={`change-mgmt-tab ${activeTab === 'all' ? 'active' : ''}`}
                    onClick={() => setActiveTab('all')}
                >
                    <FileText size={15} />
                    <span>All Policies</span>
                    <span className="change-mgmt-badge">{documents.length}</span>
                </button>

                <button
                    type="button"
                    className={`change-mgmt-tab ${activeTab === 'draft' ? 'active' : ''}`}
                    onClick={() => setActiveTab('draft')}
                >
                    <FileEdit size={15} />
                    <span>Saved Draft</span>
                    <span className="change-mgmt-badge">{draftCount}</span>
                </button>

                {/* <button
                    type="button"
                    className={`change-mgmt-tab ${activeTab === 'pending' ? 'active' : ''}`}
                    onClick={() => setActiveTab('pending')}
                >
                    <Clock size={15} />
                    <span>In Review</span>
                    <span className="change-mgmt-badge" style={{ background: pendingCount > 0 ? '#fef3c7' : '', color: pendingCount > 0 ? '#b45309' : '' }}>
                        {pendingCount}
                    </span>
                </button> */}

                {/* <button
                    type="button"
                    className={`change-mgmt-tab ${activeTab === 'library_removals' ? 'active' : ''}`}
                    onClick={() => setActiveTab('library_removals')}
                >
                    <Folder size={15} />
                    <span>Library Removals</span>
                    <span className="change-mgmt-badge" style={{ background: pendingLibraryRemovals.length > 0 ? '#fee2e2' : '', color: pendingLibraryRemovals.length > 0 ? '#b91c1c' : '' }}>
                        {pendingLibraryRemovals.length}
                    </span>
                </button> */}

                {/* <button
                    type="button"
                    className={`change-mgmt-tab ${activeTab === 'policy_removals' ? 'active' : ''}`}
                    onClick={() => setActiveTab('policy_removals')}
                >
                    <Trash2 size={15} />
                    <span>Policy Removals</span>
                    <span className="change-mgmt-badge" style={{ background: pendingPolicyRemovals.length > 0 ? '#fee2e2' : '', color: pendingPolicyRemovals.length > 0 ? '#b91c1c' : '' }}>
                        {pendingPolicyRemovals.length}
                    </span>
                </button> */}

                <button
                    type="button"
                    className={`change-mgmt-tab ${activeTab === 'approved' ? 'active' : ''}`}
                    onClick={() => setActiveTab('approved')}
                >
                    <CheckCircle2 size={15} />
                    <span>Approved</span>
                    <span className="change-mgmt-badge" style={{ background: '#dcfce7', color: '#15803d' }}>
                        {approvedCount}
                    </span>
                </button>

                <button
                    type="button"
                    className={`change-mgmt-tab ${activeTab === 'rejected' ? 'active' : ''}`}
                    onClick={() => setActiveTab('rejected')}
                >
                    <XCircle size={15} />
                    <span>Rejected</span>
                    <span className="change-mgmt-badge" style={{ background: rejectedCount > 0 ? '#fee2e2' : '', color: rejectedCount > 0 ? '#b91c1c' : '' }}>
                        {rejectedCount}
                    </span>
                </button>
            </div>

            {/* Filter toolbar */}
            <div className="templates-filter-bar">
                <div className="templates-filter-controls">
                    <div className="templates-search-wrap">
                        <Search size={15} className="templates-search-icon" />
                        <input
                            type="text"
                            className="templates-search-input"
                            placeholder="Filter by policy name, library, or author..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <div style={{ fontSize: '12px', color: '#64748b' }}>
                    Showing <strong>{displayedDocs.length}</strong> {displayedDocs.length === 1 ? 'policy' : 'policies'}
                </div>
            </div>

            {/* Main Content Table */}
            {activeTab === 'library_removals' ? (
                <div className="change-mgmt-table-card">
                    <table className="change-mgmt-table">
                        <thead>
                            <tr>
                                <th style={{ width: '25%' }}>Library Name</th>
                                <th style={{ width: '15%' }}>Status</th>
                                <th style={{ width: '12%' }}>Documents</th>
                                <th style={{ width: '18%' }}>Requested By</th>
                                <th style={{ width: '18%' }}>Removal Justification</th>
                                <th style={{ width: '12%', textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr>
                                    <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                                        Loading library removal requests...
                                    </td>
                                </tr>
                            ) : pendingLibraryRemovals.length === 0 ? (
                                <tr>
                                    <td colSpan={6} style={{ padding: '60px 20px', textAlign: 'center' }}>
                                        <Folder size={32} style={{ color: '#94a3b8', margin: '0 auto 10px', display: 'block' }} />
                                        <h4 style={{ margin: '0 0 4px', fontSize: '14px', color: '#334155' }}>
                                            No pending library removals
                                        </h4>
                                        <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>
                                            Libraries requested for removal by users will appear here for Super Admin approval.
                                        </p>
                                    </td>
                                </tr>
                            ) : (
                                pendingLibraryRemovals.map((lib) => {
                                    const dateStr = lib.removal_requested_at
                                        ? new Date(lib.removal_requested_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                                        : '—';

                                
    return (
                                        <tr key={lib.id} className="row-needs-review">
                                            <td>
                                                <div className="policy-cell-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    <Folder size={14} style={{ color: '#0057B8' }} />
                                                    <span>{lib.library_name}</span>
                                                </div>
                                                {lib.description && (
                                                    <div className="policy-cell-sub">{lib.description}</div>
                                                )}
                                            </td>

                                            <td>
                                                <span className="policy-status-pill pending" style={{ background: '#fef3c7', color: '#b45309' }}>
                                                    <Clock size={11} />
                                                    <span>Removal Requested</span>
                                                </span>
                                            </td>

                                            <td>
                                                <span style={{ fontWeight: 600, color: '#334155' }}>
                                                    {lib.document_count || 0} policies
                                                </span>
                                            </td>

                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12.5px', color: '#334155' }}>
                                                    <User size={13} style={{ color: '#0057B8' }} />
                                                    <span>{lib.requested_by_name || 'User'}</span>
                                                </div>
                                                <div style={{ fontSize: '11px', color: '#64748b' }}>
                                                    {dateStr}
                                                </div>
                                            </td>

                                            <td>
                                                <span style={{ fontSize: '12.5px', color: '#b91c1c', fontStyle: 'italic' }}>
                                                    "{lib.removal_reason || 'No justification provided'}"
                                                </span>
                                            </td>

                                            <td style={{ textAlign: 'right' }}>
                                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end' }}>
                                                    {canApprove && (
                                                        <>
                                                            <button
                                                                type="button"
                                                                className="btn btn-sm btn-primary"
                                                                style={{ background: '#16a34a', borderColor: '#15803d' }}
                                                                onClick={() => {
                                                                    setReviewingLibrary(lib);
                                                                    setLibraryReviewAction('approve');
                                                                    setLibraryReviewFeedback('');
                                                                }}
                                                                title="Approve removal (suspend library)"
                                                            >
                                                                <Check size={12} />
                                                                <span>Approve</span>
                                                            </button>

                                                            <button
                                                                type="button"
                                                                className="btn btn-sm btn-danger"
                                                                onClick={() => {
                                                                    setReviewingLibrary(lib);
                                                                    setLibraryReviewAction('reject');
                                                                    setLibraryReviewFeedback('');
                                                                }}
                                                                title="Reject removal"
                                                            >
                                                                <X size={12} />
                                                                <span>Reject</span>
                                                            </button>
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
                </div>
            ) : activeTab === 'policy_removals' ? (
                <div className="change-mgmt-table-card">
                    <table className="change-mgmt-table">
                        <thead>
                            <tr>
                                <th style={{ width: '25%' }}>Policy Name</th>
                                <th style={{ width: '15%' }}>Master Library</th>
                                <th style={{ width: '15%' }}>Status</th>
                                <th style={{ width: '15%' }}>Requested By</th>
                                <th style={{ width: '18%' }}>Removal Justification</th>
                                <th style={{ width: '12%', textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr>
                                    <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                                        Loading policy removal requests...
                                    </td>
                                </tr>
                            ) : pendingPolicyRemovals.length === 0 ? (
                                <tr>
                                    <td colSpan={6} style={{ padding: '60px 20px', textAlign: 'center' }}>
                                        <Trash2 size={32} style={{ color: '#94a3b8', margin: '0 auto 10px', display: 'block' }} />
                                        <h4 style={{ margin: '0 0 4px', fontSize: '14px', color: '#334155' }}>
                                            No pending policy removals
                                        </h4>
                                        <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>
                                            Operational policies requested for removal will appear here for Super Admin approval.
                                        </p>
                                    </td>
                                </tr>
                            ) : (
                                pendingPolicyRemovals.map((doc) => {
                                    const dateStr = doc.removal_requested_at
                                        ? new Date(doc.removal_requested_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                                        : '—';

                                    return (
                                        <tr key={doc.id} className="row-needs-review">
                                            <td>
                                                <div className="policy-cell-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    <FileText size={14} style={{ color: '#0057B8' }} />
                                                    <span>{doc.document_name}</span>
                                                </div>
                                            </td>

                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12.5px', color: '#334155' }}>
                                                    <Folder size={12} style={{ color: '#0057B8' }} />
                                                    <span>{doc.library_name || 'Master Library'}</span>
                                                </div>
                                            </td>

                                            <td>
                                                <span className="policy-status-pill pending" style={{ background: '#fee2e2', color: '#b91c1c' }}>
                                                    <Clock size={11} />
                                                    <span>Removal Requested</span>
                                                </span>
                                            </td>

                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12.5px', color: '#334155' }}>
                                                    <User size={13} style={{ color: '#0057B8' }} />
                                                    <span>{doc.requested_by_name || 'User'}</span>
                                                </div>
                                                <div style={{ fontSize: '11px', color: '#64748b' }}>
                                                    {dateStr}
                                                </div>
                                            </td>

                                            <td>
                                                <span style={{ fontSize: '12.5px', color: '#b91c1c', fontStyle: 'italic' }}>
                                                    "{doc.removal_reason || 'No justification provided'}"
                                                </span>
                                            </td>

                                            <td style={{ textAlign: 'right' }}>
                                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end' }}>
                                                    {canApprove && (
                                                        <>
                                                            <button
                                                                type="button"
                                                                className="btn btn-sm btn-primary"
                                                                style={{ background: '#16a34a', borderColor: '#15803d' }}
                                                                onClick={() => {
                                                                    setReviewingPolicyRemoval(doc);
                                                                    setPolicyRemovalAction('approve');
                                                                    setPolicyRemovalFeedback('');
                                                                }}
                                                                title="Approve removal (suspend policy)"
                                                            >
                                                                <Check size={12} />
                                                                <span>Approve</span>
                                                            </button>

                                                            <button
                                                                type="button"
                                                                className="btn btn-sm btn-danger"
                                                                onClick={() => {
                                                                    setReviewingPolicyRemoval(doc);
                                                                    setPolicyRemovalAction('reject');
                                                                    setPolicyRemovalFeedback('');
                                                                }}
                                                                title="Reject removal"
                                                            >
                                                                <X size={12} />
                                                                <span>Reject</span>
                                                            </button>
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
                </div>
            ) : (
                /* Policies Table */
                <div className="change-mgmt-table-card">
                    <table className="change-mgmt-table">
                        <thead>
                            <tr>
                                <th style={{ width: '22%' }}>Policy Name &amp; Master Library</th>
                                <th style={{ width: '18%' }}>Revision Commit Message</th>
                                <th style={{ width: '10%' }}>Status</th>
                                <th style={{ width: '10%' }}>Version</th>
                                <th style={{ width: '12%' }}>Parent</th>
                                <th style={{ width: '12%' }}>Authored By</th>
                                <th style={{ width: '8%' }}>Updated Date</th>
                                <th style={{ width: '8%', textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr>
                                    <td colSpan={8} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                                        Loading policy entries...
                                    </td>
                                </tr>
                            ) : displayedDocs.length === 0 ? (
                                <tr>
                                    <td colSpan={8} style={{ padding: '60px 20px', textAlign: 'center' }}>
                                        <FileText size={32} style={{ color: '#94a3b8', margin: '0 auto 10px', display: 'block' }} />
                                        <h4 style={{ margin: '0 0 4px', fontSize: '14px', color: '#334155' }}>
                                            No policies found in this category
                                        </h4>
                                        <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>
                                            Click <strong>Create Operational Policy</strong> to author a new policy into the Master Library.
                                        </p>
                                    </td>
                                </tr>
                            ) : (
                                displayedDocs.map((doc) => {
                                    const isPending = isPendingReview(doc);
                                    const isDraft = isDraftStatus(doc);
                                    const dateStr = doc.updated_at
                                        ? new Date(doc.updated_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                                        : '—';
                                    const displayPolicyName = doc.has_pending_revision && doc.pending_document_name
                                        ? doc.pending_document_name
                                        : doc.document_name;
                                    const hasProposedTitle = displayPolicyName !== doc.document_name;

                                
    return (
                                        <tr
                                            key={doc.id}
                                            className={isPending ? 'row-needs-review' : ''}
                                            style={{ cursor: 'pointer' }}
                                            onClick={() => handleOpenDocument(doc)}
                                        >
                                            {/* Policy Name & Library */}
                                            <td>
                                                <div className="policy-cell-title">{displayPolicyName}</div>
                                                {hasProposedTitle && (
                                                    <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                                                        Current title: {doc.document_name}
                                                    </div>
                                                )}
                                                <div className="policy-cell-sub">
                                                    <Folder size={12} style={{ color: '#0057B8' }} />
                                                    <span>{doc.library_name || 'Master Library'}</span>
                                                    {/* {doc.description && (
                                                        <span style={{ color: '#94a3b8' }}>• {doc.description.slice(0, 40)}...</span>
                                                    )} */}
                                                </div>
                                            </td>

                                            {/* Pending revision commit message */}
                                            <td>
                                                <div style={{ fontSize: '12px', color: doc.pending_revision_commit_message ? '#334155' : '#94a3b8', lineHeight: 1.4, whiteSpace: 'pre-wrap' }}>
                                                    {doc.pending_revision_commit_message || doc.live_version_commit_message || (doc.has_pending_revision ? 'No commit message provided' : '—')}
                                                </div>
                                            </td>

                                            {/* Status */}
                                            <td>
                                                {doc.has_pending_revision && doc.revision_status === 'pending_review' ? (
                                                    <span className="policy-status-pill pending">
                                                        <Clock size={11} />
                                                        <span>Revision v{doc.pending_revision_version} Pending</span>
                                                    </span>
                                                ) : doc.has_pending_revision && doc.revision_status === 'draft' ? (
                                                    <span className="policy-status-pill draft">
                                                        <FileEdit size={11} />
                                                        <span>Revision v{doc.pending_revision_version} Draft</span>
                                                    </span>
                                                ) : (
                                                    <span className={`policy-status-pill ${doc.status || 'draft'}`}>
                                                        {doc.status === 'draft' && <FileEdit size={11} />}
                                                        {(doc.status === 'pending' || doc.status === 'in_review') && <Clock size={11} />}
                                                        {(doc.status === 'active' || doc.status === 'approved') && <CheckCircle2 size={11} />}
                                                        {doc.status === 'rejected' && <XCircle size={11} />}
                                                        <span>{doc.status === 'active' ? 'Approved & Live' : doc.status}</span>
                                                    </span>
                                                )}
                                            </td>

                                            {/* Version & Sections */}
                                            <td>
                                                <span style={{ fontFamily: 'monospace', fontWeight: 600, color: '#334155' }}>
                                                    {doc.has_pending_revision
                                                        ? `v${doc.current_version_number || 1}.0 → v${doc.pending_revision_version}`
                                                        : `v${doc.current_version_number || 1}.0`}
                                                </span>
                                                {/* <span style={{ fontSize: '11px', color: '#64748b', marginLeft: '6px' }}>
                                                    ({doc.section_count || 6} Sections)
                                                </span> */}
                                            </td>

                                            {/* Parent Version Policy */}
                                            <td>
                                                {doc.parent_version_id ? (
                                                    <button
                                                        type="button"
                                                        className="policy-parent-link-btn"
                                                        onClick={(e) => handleOpenParentDocument(e, doc)}
                                                        title={`Open parent version v${doc.parent_version_number || doc.live_version_number || '1.0'}`}
                                                    >
                                                        {/* v${doc.parent_version_number} · */}
                                                        {/* <GitBranch size={13} style={{ color: '#0057B8', flexShrink: 0 }} /> */}
                                                        <span className="policy-parent-text">
                                                            {`${doc.root_policy_name || doc.document_name}`}
                                                        </span>
                                                    </button>
                                                ) : (
                                                    <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                                                        —
                                                    </span>
                                                )}
                                            </td>

                                            {/* Author */}
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12.5px', color: '#334155' }}>
                                                    <User size={13} style={{ color: '#0057B8' }} />
                                                    <span>{doc.pending_revision_by_name || doc.requested_by_name || doc.created_by_name || 'Author'}</span>
                                                </div>
                                            </td>

                                            {/* Date */}
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: '#64748b' }}>
                                                    <Calendar size={12} />
                                                    <span>{dateStr}</span>
                                                </div>
                                            </td>

                                            {/* Actions */}
                                            <td style={{ textAlign: 'right' }}>
                                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end' }}>
                                                    {canApprove && (isPending || isDraft) ? (
                                                        <button
                                                            type="button"
                                                            className="btn btn-sm btn-primary"
                                                            style={{ background: '#16a34a', borderColor: '#15803d' }}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setReviewingDoc(doc);
                                                                setReviewAction('approve');
                                                                setReviewError('');
                                                            }}
                                                            title="Approve & Publish"
                                                        >
                                                            <Check size={12} />
                                                            <span>Approve</span>
                                                        </button>
                                                    ) : null}

                                                    {canApprove && (isPending || isDraft) && (
                                                        <button
                                                            type="button"
                                                            className="btn btn-sm btn-danger"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setReviewingDoc(doc);
                                                                setReviewAction('reject');
                                                                setReviewError('');
                                                            }}
                                                            title="Reject / Rework"
                                                        >
                                                            <X size={12} />
                                                            <span>Reject</span>
                                                        </button>
                                                    )}

                                                    <button
                                                        type="button"
                                                        className="btn btn-sm btn-secondary"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleOpenDocument(doc);
                                                        }}
                                                        title="Open in Fullscreen Editor"
                                                    >
                                                        <Eye size={12} />
                                                        <span>Open</span>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                    <LoadMoreOnScroll hasMore={documentsHasMore} loading={loadingMoreDocuments} onLoadMore={() => loadPolicies(documentsPage + 1, true)} label="Load more policies" />
                </div>
            )}

            {/* Super Admin Approval / Rejection Modal */}
            {reviewingDoc && (
                <div className="template-modal-overlay">
                    <div className="template-modal-card" style={{ maxWidth: '580px', height: 'auto', maxHeight: '90vh' }}>
                        <div className="template-modal-header">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                {reviewAction === 'approve' ? (
                                    <CheckCircle2 size={18} style={{ color: '#16a34a' }} />
                                ) : (
                                    <XCircle size={18} style={{ color: '#dc2626' }} />
                                )}
                                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700 }}>
                                    {reviewingDoc.has_pending_revision && reviewingDoc.revision_status === 'pending_review'
                                        ? (reviewAction === 'approve'
                                            ? `Approve Revision v${reviewingDoc.pending_revision_version || ''}`
                                            : `Reject Revision v${reviewingDoc.pending_revision_version || ''}`)
                                        : (reviewAction === 'approve'
                                            ? 'Approve & Publish Operational Policy'
                                            : 'Request Rework / Reject Policy')}
                                </h3>
                            </div>
                            <button
                                type="button"
                                className="dms-annot-close-btn"
                                onClick={() => setReviewingDoc(null)}
                            >
                                <X size={16} />
                            </button>
                        </div>

                        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                            {reviewError && (
                                <div style={{ padding: '8px 12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', color: '#b91c1c', fontSize: '12px' }}>
                                    {reviewError}
                                </div>
                            )}

                            <div>
                                <span style={{ fontSize: '12px', color: '#64748b' }}>Policy:</span>
                                <h4 style={{ margin: '2px 0 0', fontSize: '14px', color: '#0f172a' }}>
                                    {reviewingDoc.pending_document_name || reviewingDoc.document_name}
                                </h4>
                                {reviewingDoc.pending_document_name && reviewingDoc.pending_document_name !== reviewingDoc.document_name && (
                                    <div style={{ marginTop: '4px', fontSize: '11px', color: '#64748b' }}>
                                        Current title: {reviewingDoc.document_name}
                                    </div>
                                )}
                            </div>

                            {reviewingDoc.pending_revision_commit_message && (
                                <div style={{ padding: '10px 12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '7px' }}>
                                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', marginBottom: '4px' }}>Revision commit message</div>
                                    <div style={{ fontSize: '12px', color: '#334155', whiteSpace: 'pre-wrap' }}>{reviewingDoc.pending_revision_commit_message}</div>
                                </div>
                            )}

                            {reviewAction === 'approve' ? (
                                <p style={{ margin: 0, fontSize: '13px', color: '#334155', lineHeight: '1.5' }}>
                                    {reviewingDoc.has_pending_revision
                                        ? `Approving will promote Revision v${reviewingDoc.pending_revision_version || ''} to live version and update the Master Library across all  institutions.`
                                        : 'Approving will immediately transition this operational policy from draft to active. It will be published into Master Library and made visible across  institutions.'}
                                </p>
                            ) : (
                                <div>
                                    <label className="form-label" style={{ color: '#991b1b' }}>
                                        Revision / Rejection Reason <span style={{ color: '#dc2626' }}>*</span>
                                    </label>
                                    <textarea
                                        className="form-input"
                                        style={{ height: '80px', padding: '10px 12px' }}
                                        placeholder="Explain needed changes so the author can revise the draft..."
                                        value={rejectionReason}
                                        onChange={(e) => setRejectionReason(e.target.value)}
                                        required
                                    />
                                </div>
                            )}

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => setReviewingDoc(null)}
                                    disabled={isReviewing}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    className={`btn ${reviewAction === 'approve' ? 'btn-primary' : 'btn-danger'}`}
                                    style={reviewAction === 'approve' ? { background: '#16a34a', borderColor: '#15803d' } : {}}
                                    onClick={handleConfirmReview}
                                    disabled={isReviewing}
                                >
                                    {isReviewing
                                        ? 'Processing...'
                                        : (reviewAction === 'approve' ? 'Confirm Approval & Publish' : 'Confirm Rejection')
                                    }
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Fullscreen Editor Modal for Review & Direct Approval */}
            {openDoc && (() => {
                const isViewingParent = Boolean(openDoc._viewingParent);
                const docNeedsReview = !isViewingParent && (isPendingReview(openDoc) || isDraftStatus(openDoc));
            
    return (
                    <FullscreenEditorModal
                        isOpen={Boolean(openDoc)}
                        onClose={() => setOpenDoc(null)}
                        title={openDoc.pending_document_name || openDoc.document_name}
                        subtitle={
                            isViewingParent
                                ? `Viewing Reference Parent Policy ${openDoc._parentVersionLabel || ''} (Committed Active Version)`
                                : openDoc.has_pending_revision
                                    ? `Reviewing Revision v${openDoc.pending_revision_version || '1.1'} submitted for review by ${openDoc.pending_revision_by_name || 'Author'}`
                                    : (openDoc.status === 'active' || openDoc.status === 'approved')
                                        ? `Published Policy v${openDoc.current_version_number || '1.0'} (Active in Master Library)`
                                        : `Reviewing Operational Policy v${openDoc.current_version_number || '1.0'} (${openDoc.status === 'draft' ? 'Draft' : openDoc.status} submitted by ${openDoc.requested_by_name || openDoc.created_by_name || 'Author'})`
                        }
                        initialContent={openDocContent}
                        readOnly={isViewingParent ? true : !docNeedsReview}
                        onChange={(val) => {
                            const doc = val?.json || (val?.type === 'doc' ? val : null) || val;
                            setOpenDocContent(doc);
                        }}
                        onApprove={(docNeedsReview && canApprove) ? async () => {
                            setIsReviewing(true);
                            try {
                                const sections = openDoc.sections || [];
                                const detailsSection = sections.find(s => (s.section_title || '').toLowerCase().includes('details')) || sections[0];
                                if (detailsSection && openDocContent) {
                                    await documentManagementApi.saveSectionEdits(openDoc.id, [{
                                        sectionId: detailsSection.id,
                                        content: openDocContent,
                                        section_title: detailsSection.section_title,
                                    }], { isDraftOnly: true });
                                }

                                await documentManagementApi.reviewDocument(openDoc.id, 'approve');
                                const name = openDoc.document_name;
                                const libId = openDoc.library_id;
                                const docId = openDoc.id;
                                setOpenDoc(null);
                                setToastMsg(`Policy "${name}" approved & published to Master Library.`);
                                window.dispatchEvent(new CustomEvent('liblist:document-updated', { detail: { library_id: libId } }));
                                window.dispatchEvent(new CustomEvent('liblist:version-committed', { detail: { document_id: docId } }));
                                window.dispatchEvent(new CustomEvent('liblist:refresh-nav'));
                                loadPolicies();
                            } catch (err) {
                                alert(err.message || 'Failed to approve policy');
                            } finally {
                                setIsReviewing(false);
                            }
                        } : null}
                        isApproving={isReviewing && !reviewingDoc}
                        approveLabel={openDoc.has_pending_revision ? `Approve Revision v${openDoc.pending_revision_version || ''}` : 'Approve & Publish'}
                        onReject={(docNeedsReview && canApprove) ? () => {
                            setReviewingDoc(openDoc);
                            setReviewAction('reject');
                            setReviewError('');
                            setRejectionReason('');
                        } : null}
                        rejectLabel="Reject / Rework"
                    />
                );
            })()}

            {/* Library Review Modal (Super Admin) */}
            {reviewingLibrary && (
                <div className="template-modal-overlay">
                    <div className="template-modal-card" style={{ maxWidth: '540px', height: 'auto' }}>
                        <div className="template-modal-header">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                {libraryReviewAction === 'approve' ? (
                                    <CheckCircle2 size={18} style={{ color: '#16a34a' }} />
                                ) : (
                                    <XCircle size={18} style={{ color: '#dc2626' }} />
                                )}
                                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700 }}>
                                    {libraryReviewAction === 'approve' ? 'Approve Library Removal' : 'Reject Library Removal'}
                                </h3>
                            </div>
                            <button
                                type="button"
                                className="dms-annot-close-btn"
                                onClick={() => setReviewingLibrary(null)}
                            >
                                <X size={16} />
                            </button>
                        </div>

                        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                            <div>
                                <span style={{ fontSize: '12px', color: '#64748b' }}>Target Library:</span>
                                <h4 style={{ margin: '2px 0 0', fontSize: '14px', color: '#0f172a' }}>
                                    {reviewingLibrary.library_name}
                                </h4>
                            </div>

                            <p style={{ margin: 0, fontSize: '13px', color: '#334155', lineHeight: '1.5' }}>
                                {libraryReviewAction === 'approve'
                                    ? `Approving will change the library status from active to suspended. It will no longer be visible in the Master Library tree.`
                                    : `Rejecting will dismiss the removal request. The library will remain active in the Master Library tree.`}
                            </p>

                            <div style={{ padding: '10px 12px', background: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '12px' }}>
                                <strong>Requester's Justification:</strong>
                                <p style={{ margin: '4px 0 0', color: '#64748b', fontStyle: 'italic' }}>
                                    "{reviewingLibrary.removal_reason || 'No justification provided.'}"
                                </p>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => setReviewingLibrary(null)}
                                    disabled={isReviewingLibrary}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    className={`btn ${libraryReviewAction === 'approve' ? 'btn-primary' : 'btn-danger'}`}
                                    style={libraryReviewAction === 'approve' ? { background: '#16a34a', borderColor: '#15803d' } : {}}
                                    onClick={handleConfirmLibraryReview}
                                    disabled={isReviewingLibrary}
                                >
                                    {isReviewingLibrary
                                        ? 'Processing...'
                                        : (libraryReviewAction === 'approve' ? 'Confirm Removal (Suspend)' : 'Confirm Rejection')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Policy Removal Review Modal (Super Admin) */}
            {reviewingPolicyRemoval && (
                <div className="template-modal-overlay">
                    <div className="template-modal-card" style={{ maxWidth: '540px', height: 'auto' }}>
                        <div className="template-modal-header">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                {policyRemovalAction === 'approve' ? (
                                    <CheckCircle2 size={18} style={{ color: '#16a34a' }} />
                                ) : (
                                    <XCircle size={18} style={{ color: '#dc2626' }} />
                                )}
                                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700 }}>
                                    {policyRemovalAction === 'approve' ? 'Approve Policy Removal' : 'Reject Policy Removal'}
                                </h3>
                            </div>
                            <button
                                type="button"
                                className="dms-annot-close-btn"
                                onClick={() => setReviewingPolicyRemoval(null)}
                            >
                                <X size={16} />
                            </button>
                        </div>

                        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                            <div>
                                <span style={{ fontSize: '12px', color: '#64748b' }}>Target Policy:</span>
                                <h4 style={{ margin: '2px 0 0', fontSize: '14px', color: '#0f172a' }}>
                                    {reviewingPolicyRemoval.document_name}
                                </h4>
                                {reviewingPolicyRemoval.library_name && (
                                    <span style={{ fontSize: '12px', color: '#64748b' }}>
                                        Library: {reviewingPolicyRemoval.library_name}
                                    </span>
                                )}
                            </div>

                            <p style={{ margin: 0, fontSize: '13px', color: '#334155', lineHeight: '1.5' }}>
                                {policyRemovalAction === 'approve'
                                    ? `Approving will change the policy status from active to suspended. It will no longer be visible to normal users in the Master Library tree.`
                                    : `Rejecting will dismiss the removal request. The policy will remain active in the Master Library tree.`}
                            </p>

                            <div style={{ padding: '10px 12px', background: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '12px' }}>
                                <strong>Requester's Justification:</strong>
                                <p style={{ margin: '4px 0 0', color: '#64748b', fontStyle: 'italic' }}>
                                    "{reviewingPolicyRemoval.removal_reason || 'No justification provided.'}"
                                </p>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => setReviewingPolicyRemoval(null)}
                                    disabled={isReviewingPolicyRemoval}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    className={`btn ${policyRemovalAction === 'approve' ? 'btn-primary' : 'btn-danger'}`}
                                    style={policyRemovalAction === 'approve' ? { background: '#16a34a', borderColor: '#15803d' } : {}}
                                    onClick={handleConfirmPolicyRemovalReview}
                                    disabled={isReviewingPolicyRemoval}
                                >
                                    {isReviewingPolicyRemoval
                                        ? 'Processing...'
                                        : (policyRemovalAction === 'approve' ? 'Confirm Removal (Suspend)' : 'Confirm Rejection')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
