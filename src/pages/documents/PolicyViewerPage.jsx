import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import {
    FileText, Folder, ChevronRight, X, Check,
    CheckCircle2, XCircle, GitBranch, Edit3,
    AlertTriangle, History, Trash2, Pin, PinOff,
    MessageSquare
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { documentManagementApi } from '../../services/api/documentManagementApi';
import RichTextEditor from '../../editor/RichTextEditor';
import FullscreenEditorModal from '../../components/common/FullscreenEditorModal';
import VersionHistoryDrawer from '../../components/documents/VersionHistoryDrawer';
import DocumentAnnotationsLayer from '../../components/documents/DocumentAnnotationsLayer';
import './policyViewer.css';

export default function PolicyViewerPage() {
    const { user } = useAuth();
    const { id } = useParams();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const docId = id || searchParams.get('docId');
    const targetAnnotId = searchParams.get('annotId');

    const [documentData, setDocumentData] = useState(null);
    const [sections, setSections] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState('');
    const [toastMsg, setToastMsg] = useState(null);
    const [toastType, setToastType] = useState('success');

    // Version control state
    const [isVersionDrawerOpen, setIsVersionDrawerOpen] = useState(false);
    const [viewingVersion, setViewingVersion] = useState(null); // null = current live version
    const [viewingVersionSections, setViewingVersionSections] = useState(null); // null = use live sections

    // Editor / Configure modal state
    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [editorContent, setEditorContent] = useState(null);
    const [isSavingDraft, setIsSavingDraft] = useState(false);
    const [isCreatingRevision, setIsCreatingRevision] = useState(false);
    const [isSubmittingReview, setIsSubmittingReview] = useState(false);

    // Super Admin review modal
    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
    const [reviewAction, setReviewAction] = useState('approve');
    const [rejectionReason, setRejectionReason] = useState('');
    const [isReviewing, setIsReviewing] = useState(false);

    // Policy Removal modal state
    const [isRemovalModalOpen, setIsRemovalModalOpen] = useState(false);
    const [removalReason, setRemovalReason] = useState('');
    const [isRequestingRemoval, setIsRequestingRemoval] = useState(false);

    // Pinning state
    const [isPinned, setIsPinned] = useState(false);
    const [isTogglingPin, setIsTogglingPin] = useState(false);

    // Annotations & Notes Drawer State
    const [isAnnotationsDrawerOpen, setIsAnnotationsDrawerOpen] = useState(false);
    const [annotationsCount, setAnnotationsCount] = useState(0);

    // Auto-open drawer if navigating to a specific target annotation from Personal Workspace
    useEffect(() => {
        if (targetAnnotId) {
            setIsAnnotationsDrawerOpen(true);
        }
    }, [targetAnnotId]);

    const isSuperAdmin = user?.isSuperAdmin || (user?.roles || []).some(r => {
        const name = typeof r === 'string' ? r : r.role_name;
        return name?.toLowerCase() === 'super admin';
    });

    // Check if user has permission to configure/edit this policy
    const canEditPolicy = isSuperAdmin || documentData?.can_edit === true;

    // Check if user can request removal of this policy
    const canDeletePolicy = isSuperAdmin || documentData?.can_delete === true;

    // Check if the currently logged-in user is the one who configured/started this revision
    const isRevisionAuthor = Boolean(
        user?.id &&
        documentData?.pending_revision_by &&
        String(user.id).toLowerCase() === String(documentData.pending_revision_by).toLowerCase()
    );

    // Toast auto-dismiss
    useEffect(() => {
        if (!toastMsg) return;
        const t = setTimeout(() => setToastMsg(null), 4500);
        return () => clearTimeout(t);
    }, [toastMsg]);

    const showToast = (msg, type = 'success') => {
        setToastMsg(msg);
        setToastType(type);
    };

    const loadDocument = useCallback(async () => {
        if (!docId) { setIsLoading(false); return; }
        setIsLoading(true);
        setErrorMsg('');
        try {
            const res = await documentManagementApi.getDocumentMetadata(docId);
            const doc = res?.data || null;
            if (!doc) {
                setErrorMsg('Policy document not found.');
                setDocumentData(null);
                setSections([]);
                setIsPinned(false);
            } else {
                setDocumentData(doc);
                setSections(doc.sections || []);
                setIsPinned(Boolean(doc.is_pinned));
                setViewingVersion(null);
                setViewingVersionSections(null);
            }
        } catch (err) {
            setErrorMsg(err.message || 'Failed to load policy document.');
        } finally {
            setIsLoading(false);
        }
    }, [docId]);

    useEffect(() => { loadDocument(); }, [loadDocument]);

    // Synchronize pin state if pinned/unpinned from sidebar or other tabs
    useEffect(() => {
        const handlePinEvent = (e) => {
            if (e.detail?.documentId === docId) {
                setIsPinned(Boolean(e.detail.isPinned));
            }
        };
        window.addEventListener('policyPinnedChanged', handlePinEvent);
        return () => window.removeEventListener('policyPinnedChanged', handlePinEvent);
    }, [docId]);

    // Toggle Pin / Unpin handler
    const handleTogglePin = async () => {
        if (!documentData?.id || isTogglingPin) return;
        const nextState = !isPinned;
        setIsPinned(nextState);
        setIsTogglingPin(true);
        try {
            if (nextState) {
                await documentManagementApi.pinPolicy(documentData.id);
                showToast('Policy pinned', 'success');
            } else {
                await documentManagementApi.unpinPolicy(documentData.id);
                showToast('Policy unpinned', 'info');
            }
            window.dispatchEvent(
                new CustomEvent('policyPinnedChanged', {
                    detail: { documentId: documentData.id, isPinned: nextState },
                })
            );
        } catch (err) {
            setIsPinned(!nextState);
            showToast(err.message || 'Failed to update pin', 'error');
        } finally {
            setIsTogglingPin(false);
        }
    };

    // Helper: parse section content
    const parseContent = (content) => {
        if (!content) return null;
        if (typeof content === 'object' && Array.isArray(content.content)) return content;
        if (typeof content === 'string') {
            try {
                const p = JSON.parse(content);
                if (p && Array.isArray(p.content)) return p;
            } catch {
                return { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: content }] }] };
            }
        }
        return null;
    };

    // Combined editor content (from live sections or archived version sections)
    const combinedEditorContent = useMemo(() => {
        const activeSections = viewingVersionSections || sections;

        if (!documentData || activeSections.length === 0) {
            return { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'No policy content available.' }] }] };
        }

        // When viewing live version on the page, always show the published content!
        const getDisplayContent = (sec) => {
            // For general viewing, use live content
            return sec.content;
        };

        // Prefer Details section if it has rich content
        const detailsSection = activeSections.find(s => (s.section_title || '').toLowerCase().includes('details'));
        const parsedDetails = detailsSection ? parseContent(getDisplayContent(detailsSection)) : null;
        if (parsedDetails?.content?.length > 1) return parsedDetails;

        // Merge all sections
        const allBlocks = [];
        activeSections.forEach(sec => {
            const p = parseContent(getDisplayContent(sec));
            if (p?.content) p.content.forEach(b => allBlocks.push(b));
        });

        return allBlocks.length > 0
            ? { type: 'doc', content: allBlocks }
            : { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'No content available.' }] }] };
    }, [documentData, sections, viewingVersionSections]);

    // Content specifically for authoring/editing in FullscreenEditorModal
    const draftEditorContent = useMemo(() => {
        if (!documentData || sections.length === 0) return combinedEditorContent;

        const detailsSection = sections.find(s => (s.section_title || '').toLowerCase().includes('details')) || sections[0];
        // In the editor, prefer draft_content if available, fallback to content
        const contentToEdit = detailsSection.draft_content || detailsSection.content;
        const parsed = parseContent(contentToEdit);
        return parsed || combinedEditorContent;
    }, [documentData, sections, combinedEditorContent]);

    // Handle version selection from drawer
    const handleSelectVersion = async (version) => {
        setIsVersionDrawerOpen(false);
        if (version.id === documentData?.current_version_id) {
            setViewingVersion(null);
            setViewingVersionSections(null);
            return;
        }
        try {
            const res = await documentManagementApi.getVersionSections(docId, version.id);
            const vSections = res?.data || [];
            setViewingVersion(version);
            setViewingVersionSections(vSections);
            showToast(`Viewing archived v${version.version_number} — read only`, 'info');
        } catch (err) {
            showToast('Failed to load version content', 'error');
        }
    };

    const handleReturnToLive = () => {
        setViewingVersion(null);
        setViewingVersionSections(null);
        showToast('Returned to current live version');
    };

    // Handle Configure: Open editor for drafting without touching DB until Save Draft or Submit
    const handleConfigure = () => {
        setEditorContent(draftEditorContent);
        setIsEditorOpen(true);
    };

    // Open editor without creating new revision (already in draft or pending revision)
    const handleOpenEditor = () => {
        setEditorContent(draftEditorContent);
        setIsEditorOpen(true);
    };

    // Discard draft revision and return policy to clean published state
    const handleDiscardDraft = async () => {
        if (!window.confirm('Discard this in-progress revision draft? The policy will remain at its current live version.')) {
            return;
        }
        try {
            await documentManagementApi.discardRevision(docId);
            setIsEditorOpen(false);
            await loadDocument();
            showToast('Revision draft discarded. Returned to live published policy.');
        } catch (err) {
            showToast(err.message || 'Failed to discard draft', 'error');
        }
    };

    // Save draft from fullscreen editor
    const handleSaveDraft = async (commitMessage = '') => {
        if (!documentData || !sections.length) return;
        setIsSavingDraft(true);
        try {
            // If revision not initialized yet in DB, create revision snapshot first
            if (!documentData.has_pending_revision) {
                await documentManagementApi.createRevision(docId, {
                    commit_message: commitMessage || `Revision draft started`,
                    bumpType: 'minor',
                });
            }

            // Save to the Details section (or first section)
            const detailsSection = sections.find(s => (s.section_title || '').toLowerCase().includes('details')) || sections[0];
            const rawContent = editorContent?.json || (editorContent?.type === 'doc' ? editorContent : null) || draftEditorContent;
            const sectionsToSave = [{
                sectionId: detailsSection.id,
                content: rawContent,
                section_title: detailsSection.section_title,
            }];
            await documentManagementApi.saveSectionEdits(docId, sectionsToSave, { commit_message: commitMessage, isDraftOnly: true });
            await loadDocument();
            showToast(`Draft saved.${commitMessage ? ` "${commitMessage}"` : ''}`);
        } catch (err) {
            showToast(err.message || 'Failed to save draft', 'error');
        } finally {
            setIsSavingDraft(false);
        }
    };

    // Submit revision for Super Admin review
    const handleSubmitForReview = async (commitMessage = '') => {
        if (!documentData || !sections.length) return;
        setIsSubmittingReview(true);
        try {
            if (!documentData.has_pending_revision) {
                await documentManagementApi.createRevision(docId, {
                    commit_message: commitMessage || `Revision draft started`,
                    bumpType: 'minor',
                });
            }

            // First persist current editor content
            const detailsSection = sections.find(s => (s.section_title || '').toLowerCase().includes('details')) || sections[0];
            const rawContent = editorContent?.json || (editorContent?.type === 'doc' ? editorContent : null) || draftEditorContent;
            const sectionsToSave = [{
                sectionId: detailsSection.id,
                content: rawContent,
                section_title: detailsSection.section_title,
            }];
            await documentManagementApi.saveSectionEdits(docId, sectionsToSave, { commit_message: commitMessage, isDraftOnly: true });

            // Now trigger review submission with commit message
            await documentManagementApi.submitRevision(docId, { commit_message: commitMessage });
            setIsEditorOpen(false);
            await loadDocument();
            showToast(`Revision submitted for Super Admin review.`);
        } catch (err) {
            showToast(err.message || 'Failed to submit revision for review', 'error');
        } finally {
            setIsSubmittingReview(false);
        }
    };

    // Super Admin approve/reject
    const handleConfirmReview = async () => {
        if (!documentData) return;
        setIsReviewing(true);
        try {
            await documentManagementApi.reviewDocument(documentData.id, reviewAction, rejectionReason);
            setIsReviewModalOpen(false);
            setRejectionReason('');
            await loadDocument();
            showToast(reviewAction === 'approve' ? 'Policy approved & published to Master Library.' : 'Policy rejected / returned for revision.');
            if (reviewAction === 'approve') {
                // Refresh the sidebar Master Library tree
                window.dispatchEvent(new CustomEvent('liblist:document-updated', { detail: { library_id: documentData.library_id } }));
                window.dispatchEvent(new CustomEvent('liblist:version-committed', { detail: { document_id: documentData.id } }));
            }
        } catch (err) {
            showToast(err.message || 'Failed to update policy status.', 'error');
        } finally {
            setIsReviewing(false);
        }
    };

    // Handle policy removal request
    const handleRequestRemoval = async () => {
        if (!removalReason.trim()) return;
        setIsRequestingRemoval(true);
        try {
            await documentManagementApi.requestPolicyRemoval(docId, removalReason.trim());
            setIsRemovalModalOpen(false);
            setRemovalReason('');
            await loadDocument();
            showToast('Policy removal request submitted for Super Admin review.');
        } catch (err) {
            showToast(err.message || 'Failed to submit removal request.', 'error');
        } finally {
            setIsRequestingRemoval(false);
        }
    };

    if (isLoading) {
        return (
            <div className="policy-empty-selection">
                <FileText size={36} style={{ color: '#0057B8', animation: 'pulse 1.5s infinite' }} />
                <h3 style={{ margin: 0, fontSize: '15px' }}>Loading operational policy...</h3>
            </div>
        );
    }

    if (!docId || !documentData) {
        return (
            <div className="policy-empty-selection">
                <Folder size={44} style={{ color: '#94a3b8' }} />
                <h3 style={{ margin: 0, fontSize: '16px', color: '#334155' }}>No Policy Selected</h3>
                <p style={{ margin: 0, fontSize: '13px', maxWidth: '420px', lineHeight: '1.5' }}>
                    Select an operational policy from the <strong>Master Library</strong> tree in the sidebar.
                </p>
                <button type="button" className="btn btn-primary" style={{ marginTop: '12px' }}
                    onClick={() => navigate('/change-management')}>
                    View Change Management
                </button>
            </div>
        );
    }

    const isPending = documentData.status === 'pending' || documentData.status === 'in_review';
    const isDraft = documentData.status === 'draft';
    const isLive = documentData.status === 'active' || documentData.status === 'approved';
    const isArchived = !!viewingVersion;

    const dateStr = documentData.updated_at
        ? new Date(documentData.updated_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
        : '—';

    return (
        <div className="policy-viewer-container">
            {/* Toast */}
            {toastMsg && (
                <div className={`templates-toast-alert ${toastType}`}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {toastType === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                        <span>{toastMsg}</span>
                    </div>
                    <button type="button" className="templates-toast-close" onClick={() => setToastMsg(null)}>
                        <X size={14} />
                    </button>
                </div>
            )}

            {/* Revision In-Progress / Submitted Banner — only visible to Super Admin or the revision author */}
            {documentData.has_pending_revision && !isArchived && (isSuperAdmin || isRevisionAuthor) && (
                documentData.revision_status === 'pending_review' ? (
                    <div className="policy-archived-banner" style={{ background: '#fef9c3', borderColor: '#eab308', color: '#854d0e' }}>
                        <Edit3 size={15} />
                        <span>
                            A new revision draft (<strong>v{documentData.pending_revision_version || ''}</strong>) has been <strong>submitted for Super Admin review</strong>
                            {documentData.pending_revision_by_name ? ` by ${documentData.pending_revision_by_name}` : ''}. The published version below remains live and visible to all users until approved.
                        </span>
                        {(isRevisionAuthor || isSuperAdmin) && (
                            <button className="btn-return-live" style={{ background: '#d97706' }} onClick={handleOpenEditor}>
                                {isSuperAdmin && !isRevisionAuthor ? 'Configure / Review Draft' : 'Edit Revision Draft'}
                            </button>
                        )}
                    </div>
                ) : isRevisionAuthor ? (
                    <div className="policy-archived-banner" style={{ background: '#eff6ff', borderColor: '#3b82f6', color: '#1d4ed8', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Edit3 size={15} />
                            <span>
                                You have an in-progress revision draft (<strong>v{documentData.pending_revision_version || ''}</strong>). Remember to click <strong>Submit for Review</strong> in the editor when your edits are complete.
                            </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <button className="btn-return-live" style={{ background: '#2563eb' }} onClick={handleOpenEditor}>
                                Continue Editing Draft
                            </button>
                            <button
                                className="btn-return-live"
                                style={{ background: '#dc2626' }}
                                onClick={handleDiscardDraft}
                                title="Discard this revision draft and return to live version"
                            >
                                Discard Draft
                            </button>
                        </div>
                    </div>
                ) : null
            )}

            {/* Archived Version Banner */}
            {isArchived && (
                <div className="policy-archived-banner">
                    <History size={15} />
                    <span>Viewing archived <strong>v{viewingVersion.version_number}</strong> — This is a historical snapshot. Live version is unaffected.</span>
                    <button className="btn-return-live" onClick={handleReturnToLive}>View Current Version</button>
                </div>
            )}

            {/* Pending Removal Review Banner */}
            {documentData.pending_removal && !isArchived && (
                <div className="policy-archived-banner" style={{ background: '#fef2f2', borderColor: '#f87171', color: '#991b1b', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Trash2 size={16} />
                        <span>
                            <strong>Removal Pending Review:</strong> A removal request has been submitted for this policy
                            {documentData.removal_reason ? ` (Reason: "${documentData.removal_reason}")` : ''}. 
                        </span>
                    </div>
                    {isSuperAdmin && (
                        <button
                            className="btn-return-live"
                            style={{ background: '#b91c1c' }}
                            onClick={() => navigate('/change-management')}
                        >
                            Review in Change Management
                        </button>
                    )}
                </div>
            )}

            {/* Header Card */}
            <div className="policy-header-card">
                <div className="policy-header-top-row">
                    <div className="policy-breadcrumb">
                        <span>Master Library</span>
                        <ChevronRight size={13} className="breadcrumb-arrow" />
                        <span>{documentData.library_name || 'Library'}</span>
                        <ChevronRight size={13} className="breadcrumb-arrow" />
                        <button
                            className="version-pill version-pill-btn"
                            title="View version history"
                            onClick={() => setIsVersionDrawerOpen(true)}
                        >
                            v{isArchived ? viewingVersion.version_number : (documentData.current_version_number || '1.0')}
                            <History size={11} style={{ marginLeft: '4px' }} />
                        </button>
                    </div>

                    <div className="policy-top-actions"> 
                        {/* {isSuperAdmin && (isPending || isDraft || (documentData.has_pending_revision && documentData.revision_status === 'pending_review')) && !isArchived && (
                            <>
                                <button type="button" className="btn btn-sm btn-danger"
                                    onClick={() => { setReviewAction('reject'); setIsReviewModalOpen(true); }}>
                                    <X size={13} /><span>Reject / Rework</span>
                                </button>
                                <button type="button" className="btn btn-sm btn-primary"
                                    style={{ background: '#16a34a', borderColor: '#15803d' }}
                                    onClick={() => { setReviewAction('approve'); setIsReviewModalOpen(true); }}>
                                    <Check size={13} />
                                    <span>{documentData.has_pending_revision ? `Approve Revision v${documentData.pending_revision_version || ''}` : 'Approve & Publish'}</span>
                                </button>
                            </>
                        )} */}
                          
                          <button
                            type="button"
                            className={`btn-pin-action ${isPinned ? 'is-pinned' : ''}`}
                            onClick={handleTogglePin}
                            disabled={isTogglingPin}
                            title={isPinned ? 'Unpin policy from sidebar PINNED LIBRARIES' : 'Pin policy to sidebar PINNED LIBRARIES'}
                        >
                            <Pin size={13} style={isPinned ? { fill: '#0057B8', color: '#0057B8' } : { color: '#64748b' }} />
                            <span>{isPinned ? 'Pinned' : 'Pin'}</span>
                        </button>
                         
                        
                        {canEditPolicy && !isArchived && (
                            documentData.has_pending_revision ? (
                                isRevisionAuthor ? (
                                    <button type="button" className="btn-configure"
                                        onClick={handleOpenEditor}
                                        style={{ background: '#d97706', borderColor: '#b45309' }}>
                                        <Edit3 size={14} />
                                        <span>Edit Revision Draft (v{documentData.pending_revision_version || ''})</span>
                                    </button>
                                ) : isSuperAdmin ? (
                                    <button type="button" className="btn-configure"
                                        onClick={handleOpenEditor}>
                                        <Edit3 size={14} />
                                        <span>Edit</span>
                                    </button>
                                ) : null
                            ) : isLive ? (
                                <button type="button" className="btn-configure"
                                    onClick={handleConfigure}
                                    disabled={isCreatingRevision}>
                                    <Edit3 size={14} />
                                    <span>{isCreatingRevision ? 'Starting...' : 'Edit'}</span>
                                </button>
                            ) : isDraft ? (
                                <button type="button" className="btn-configure"
                                    onClick={handleOpenEditor}>
                                    <Edit3 size={14} />
                                    <span>Edit Draft</span>
                                </button>
                            ) : null
                        )}

                        {/* Request Policy Removal button: shown to users with can_delete or Super Admin, only on live/active policies */}
                        {/* {canDeletePolicy && isLive && !isArchived && !documentData.pending_removal && (
                            <button
                                type="button"
                                className="btn btn-sm btn-danger"
                                style={{ background: '#b91c1c', borderColor: '#991b1b', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                                onClick={() => setIsRemovalModalOpen(true)}
                                title="Request policy removal (Maker-Checker workflow)"
                            >
                                <Trash2 size={13} />
                                <span>Request Removal</span>
                            </button>
                        )} */}

                       

                        {/* Annotations & Notes Drawer button (matching Version History) */}
                        <button
                            type="button"
                            className={`btn-annotations-action ${isAnnotationsDrawerOpen ? 'active' : ''}`}
                            onClick={() => setIsAnnotationsDrawerOpen(prev => !prev)}
                            title="Notes & Annotations"
                        >
                            <MessageSquare size={13} />
                            <span>Notes &amp; Annotations</span>
                            {annotationsCount > 0 && (
                                <span className="annot-top-count-badge">{annotationsCount}</span>
                            )}
                        </button>

                        {/* Version history button */}
                        <button type="button" className="btn-version-history"
                            onClick={() => setIsVersionDrawerOpen(true)}
                            title="Version History">
                            <GitBranch size={14} />
                        </button>

                        <span className={`status-badge-pill ${documentData.status || 'active'}`}>
                            <span className="status-dot"></span>
                            {isLive ? 'Active' : isPending ? 'In Review' : isDraft ? 'Draft' : documentData.status}
                        </span>
                    </div>
                </div>

                <h1 className="policy-title">{documentData.document_name}</h1>
                {documentData.description && (
                    <p className="policy-description">{documentData.description}</p>
                )}

                {/* Info row */}
                {/* <div className="policy-info-row">
                    <span className="info-chip"><CheckCircle2 size={12} /> {documentData.document_type || 'policy'}</span>
                    <span className="info-chip">Updated: {dateStr}</span>
                    <span className="info-chip">{sections.length} Section{sections.length !== 1 ? 's' : ''}</span>
                    {documentData.requested_by_name && (
                        <span className="info-chip">Author: {documentData.requested_by_name}</span>
                    )}
                </div> */}
            </div>

            {/* Document Content Card */}
            <div className="policy-spec-card">
                <div className="policy-spec-header">
                    <div className="spec-header-title">
                        <FileText size={15} className="spec-icon" />
                        <span>DETAILED LIBRARY INFO</span>
                    </div>
                    <span className="spec-header-tag">CORE SPECIFICATION</span>
                </div>

                <div className="policy-spec-editor-container">
                    <DocumentAnnotationsLayer
                        documentId={documentData.id}
                        versionId={isArchived ? viewingVersion?.id : (documentData.live_version_id || documentData.current_version_id)}
                        currentUser={user}
                        targetAnnotationId={targetAnnotId}
                        isDrawerOpen={isAnnotationsDrawerOpen}
                        onCloseDrawer={() => setIsAnnotationsDrawerOpen(false)}
                        onOpenDrawer={() => setIsAnnotationsDrawerOpen(true)}
                        onAnnotationsCountChange={setAnnotationsCount}
                    >
                        <RichTextEditor
                            key={`doc-${documentData.id}-${isArchived ? viewingVersion?.id : 'live'}`}
                            paged={false}
                            readOnly={true}
                            showToolbar={false}
                            showStatusBar={false}
                            documentTitle={documentData.document_name}
                            initialContent={combinedEditorContent}
                        />
                    </DocumentAnnotationsLayer>
                </div>
            </div>

            {/* Version History Drawer */}
            <VersionHistoryDrawer
                docId={docId}
                currentVersionId={documentData.live_version_id || documentData.current_version_id}
                isOpen={isVersionDrawerOpen}
                onClose={() => setIsVersionDrawerOpen(false)}
                onSelectVersion={handleSelectVersion}
            />

            {/* Fullscreen Editor Modal (for Configure/Edit Draft) */}
            {isEditorOpen && (
                <FullscreenEditorModal
                    isOpen={isEditorOpen}
                    onClose={() => setIsEditorOpen(false)}
                    title={documentData.document_name}
                    subtitle={
                        documentData.has_pending_revision
                            ? `Reviewing Revision v${documentData.pending_revision_version || ''} (Submitted by ${documentData.pending_revision_by_name || 'Author'})`
                            : `Editing v${documentData.current_version_number || '1.0'} revision draft — Live version unchanged until approval`
                    }
                    initialContent={editorContent || draftEditorContent}
                    onChange={(val) => {
                        const doc = val?.json || (val?.type === 'doc' ? val : null) || val;
                        setEditorContent(doc);
                    }}
                    readOnly={false}
                    onSaveDraft={handleSaveDraft}
                    isSubmitting={isSavingDraft}
                    onSubmitForReview={handleSubmitForReview}
                    isSubmittingReview={isSubmittingReview}
                    onApprove={isSuperAdmin && (documentData.has_pending_revision || documentData.status === 'draft') ? async () => {
                        setIsEditorOpen(false);
                        setReviewAction('approve');
                        setIsReviewModalOpen(true);
                    } : null}
                    approveLabel={documentData.has_pending_revision ? `Approve Revision v${documentData.pending_revision_version || ''}` : 'Approve & Publish'}
                    onReject={isSuperAdmin && (documentData.has_pending_revision || documentData.status === 'draft') ? () => {
                        setIsEditorOpen(false);
                        setReviewAction('reject');
                        setIsReviewModalOpen(true);
                    } : null}
                    rejectLabel="Reject / Rework"
                />
            )}

            {/* Super Admin Review Modal */}
            {isReviewModalOpen && (
                <div className="template-modal-overlay">
                    <div className="template-modal-card" style={{ maxWidth: '560px', height: 'auto', maxHeight: '90vh' }}>
                        <div className="template-modal-header">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                {reviewAction === 'approve'
                                    ? <CheckCircle2 size={18} style={{ color: '#16a34a' }} />
                                    : <XCircle size={18} style={{ color: '#dc2626' }} />
                                }
                                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700 }}>
                                    {reviewAction === 'approve' ? 'Approve & Publish Operational Policy' : 'Request Rework / Reject Policy'}
                                </h3>
                            </div>
                            <button type="button" className="dms-annot-close-btn" onClick={() => setIsReviewModalOpen(false)}>
                                <X size={16} />
                            </button>
                        </div>

                        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                            <div>
                                <span style={{ fontSize: '12px', color: '#64748b' }}>Policy:</span>
                                <h4 style={{ margin: '2px 0 0', fontSize: '14px', color: '#0f172a' }}>{documentData.document_name}</h4>
                            </div>

                            {reviewAction === 'approve' ? (
                                <p style={{ margin: 0, fontSize: '13px', color: '#334155', lineHeight: '1.5' }}>
                                    Approving will publish this policy to the <strong>Master Library</strong> under <em>{documentData.library_name}</em> and auto-create a new version snapshot.
                                </p>
                            ) : (
                                <div>
                                    <label className="form-label" style={{ color: '#991b1b' }}>
                                        Revision / Rejection Reason <span style={{ color: '#dc2626' }}>*</span>
                                    </label>
                                    <textarea className="form-input" style={{ height: '80px', padding: '10px 12px' }}
                                        placeholder="Explain needed changes..."
                                        value={rejectionReason}
                                        onChange={e => setRejectionReason(e.target.value)}
                                        required
                                    />
                                </div>
                            )}

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                                <button type="button" className="btn btn-secondary"
                                    onClick={() => setIsReviewModalOpen(false)} disabled={isReviewing}>
                                    Cancel
                                </button>
                                <button type="button"
                                    className={`btn ${reviewAction === 'approve' ? 'btn-primary' : 'btn-danger'}`}
                                    style={reviewAction === 'approve' ? { background: '#16a34a', borderColor: '#15803d' } : {}}
                                    onClick={handleConfirmReview} disabled={isReviewing}>
                                    {isReviewing ? 'Processing...' : (reviewAction === 'approve' ? 'Confirm Approval & Publish' : 'Confirm Rejection')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Policy Removal Request Modal */}
            {isRemovalModalOpen && (
                <div className="template-modal-overlay">
                    <div className="template-modal-card" style={{ maxWidth: '520px', height: 'auto', maxHeight: '90vh' }}>
                        <div className="template-modal-header">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Trash2 size={18} style={{ color: '#dc2626' }} />
                                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700 }}>
                                    Request Policy Removal
                                </h3>
                            </div>
                            <button type="button" className="dms-annot-close-btn" onClick={() => setIsRemovalModalOpen(false)}>
                                <X size={16} />
                            </button>
                        </div>

                        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                            <div>
                                <span style={{ fontSize: '12px', color: '#64748b' }}>Target Policy:</span>
                                <h4 style={{ margin: '2px 0 0', fontSize: '14px', color: '#0f172a' }}>{documentData.document_name}</h4>
                            </div>

                            <p style={{ margin: 0, fontSize: '13px', color: '#475569', lineHeight: '1.5' }}>
                                Submitting a removal request moves this policy into <strong>Change Management</strong> for Super Admin review.
                                The policy is <strong>not deleted</strong>, but upon approval its status transitions to <strong>suspended</strong> and it will no longer be visible in the Master Library.
                            </p>

                            <div>
                                <label className="form-label" style={{ color: '#991b1b', fontWeight: 600, fontSize: '12.5px', marginBottom: '6px', display: 'block' }}>
                                    Removal Justification / Reason <span style={{ color: '#dc2626' }}>*</span>
                                </label>
                                <textarea
                                    className="form-input"
                                    style={{ height: '90px', padding: '10px 12px', width: '100%', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                                    placeholder="Provide detailed justification for why this policy should be decommissioned..."
                                    value={removalReason}
                                    onChange={e => setRemovalReason(e.target.value)}
                                    required
                                />
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => { setIsRemovalModalOpen(false); setRemovalReason(''); }}
                                    disabled={isRequestingRemoval}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-danger"
                                    style={{ background: '#dc2626', borderColor: '#b91c1c' }}
                                    onClick={handleRequestRemoval}
                                    disabled={isRequestingRemoval || !removalReason.trim()}
                                >
                                    {isRequestingRemoval ? 'Submitting...' : 'Submit Removal Request'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
