import React, { useState, useMemo, useEffect } from 'react';
import { Minimize2, Sparkles, X, Check, Send, MessageSquare, Layers, FileText } from 'lucide-react';
import RichTextEditor from '../../editor/RichTextEditor';
import SectionWiseEditor, { sectionsToCombinedDoc } from '../documents/SectionWiseEditor';
import './fullscreenEditorModal.css';

export default function FullscreenEditorModal({
    isOpen,
    onClose,
    onCancel,
    title = 'Document Editor',
    subtitle = 'Full Page Focused Authoring Mode',
    initialContent,
    onChange,
    sections = null,
    onSectionsChange = null,
    readOnly = false,
    placeholder = 'Write content here...',
    onSaveDraft,
    isSubmitting = false,
    onSubmitForReview,
    isSubmittingReview = false,
    onApprove,
    isApproving = false,
    approveLabel = 'Approve & Publish',
    onReject,
    isRejecting = false,
    rejectLabel = 'Reject / Rework',
    documentTitle,
    onDocumentTitleChange
}) {
    const handleCancel = onCancel || onClose;
    const isSectionWise = Array.isArray(sections) && typeof onSectionsChange === 'function';

    // ── View & Commit Message Dialog State (Hooks unconditionally before early return) ──
    const [viewMode, setViewMode] = useState('sections'); // 'sections' | 'document'
    const [commitDialog, setCommitDialog] = useState(null); // null | 'draft' | 'review'
    const [commitMessage, setCommitMessage] = useState('');

    // Safely extract TipTap doc AST for full-document preview/single-editor mode
    const safeStartingContent = useMemo(() => {
        if (isSectionWise) {
            return sectionsToCombinedDoc(sections, true);
        }
        if (!initialContent) return null;
        let c = initialContent;
        if (typeof c === 'string') {
            try { c = JSON.parse(c); } catch (_) { return c; }
        }
        if (c && typeof c === 'object') {
            if (c.json) return c.json;
            if (c.type === 'doc') return c;
            if (Array.isArray(c.content)) return { type: 'doc', content: c.content };
        }
        return c;
    }, [initialContent, isSectionWise, sections]);

    // Close on Escape key
    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && !commitDialog) {
                handleCancel();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, commitDialog, handleCancel]);

    if (!isOpen) return null;

    // ── Commit dialog helpers ──
    const openCommitDialog = (type) => {
        setCommitMessage('');
        setCommitDialog(type);
    };
    const closeCommitDialog = () => setCommitDialog(null);

    const handleCommitConfirm = () => {
        const msg = commitMessage.trim();
        if (commitDialog === 'draft') {
            onSaveDraft && onSaveDraft(msg);
        } else if (commitDialog === 'review') {
            onSubmitForReview && onSubmitForReview(msg);
        }
        setCommitDialog(null);
        setCommitMessage('');
    };

    return (
        <div className="fullscreen-editor-overlay">
            <div className="fullscreen-editor-shell">
                {/* ── Top Header Bar ── */}
                <div className="fullscreen-editor-header">
                    <div className="fullscreen-header-title-group">
                        <div className="fullscreen-title-badge">
                            <Sparkles size={16} />
                        </div>
                        <div>
                            <h2 className="fullscreen-header-title">{title}</h2>
                            <span className="fullscreen-header-subtitle">{subtitle}</span>
                        </div>
                    </div>

                    {onDocumentTitleChange && (
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '0 16px', minWidth: '220px', flex: 1 }}>
                            <span style={{ fontSize: '12px', fontWeight: 600, whiteSpace: 'nowrap' }}>Policy title</span>
                            <input
                                type="text"
                                value={documentTitle || ''}
                                onChange={(event) => onDocumentTitleChange(event.target.value)}
                                maxLength={500}
                                aria-label="Policy title"
                                style={{ minWidth: 0, width: '100%', padding: '7px 9px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                            />
                        </label>
                    )}

                    <div className="fullscreen-header-actions">
                        {isSectionWise && (
                            <div className="fullscreen-view-toggle">
                                <button
                                    type="button"
                                    className={`fullscreen-toggle-pill ${viewMode === 'sections' ? 'active' : ''}`}
                                    onClick={() => setViewMode('sections')}
                                >
                                    <Layers size={13} />
                                    <span>Sections ({sections.length})</span>
                                </button>
                                <button
                                    type="button"
                                    className={`fullscreen-toggle-pill ${viewMode === 'document' ? 'active' : ''}`}
                                    onClick={() => setViewMode('document')}
                                >
                                    <FileText size={13} />
                                    <span>Document Preview</span>
                                </button>
                            </div>
                        )}

                        {onReject && (
                            <button
                                type="button"
                                className="fullscreen-btn"
                                style={{ background: '#dc2626', borderColor: '#b91c1c', color: '#ffffff' }}
                                onClick={onReject}
                                disabled={isSubmitting || isSubmittingReview || isApproving || isRejecting}
                                title="Reject / Request revisions"
                            >
                                <X size={14} />
                                <span>{isRejecting ? 'Rejecting...' : rejectLabel}</span>
                            </button>
                        )}

                        {onApprove && (
                            <button
                                type="button"
                                className="fullscreen-btn fullscreen-btn-primary"
                                style={{ background: '#16a34a', borderColor: '#15803d', color: '#ffffff' }}
                                onClick={onApprove}
                                disabled={isSubmitting || isSubmittingReview || isApproving || isRejecting}
                                title="Approve and publish to Master Library"
                            >
                                <Check size={14} />
                                <span>{isApproving ? 'Approving...' : approveLabel}</span>
                            </button>
                        )}

                        {onSaveDraft && (
                            <button
                                type="button"
                                className="fullscreen-btn fullscreen-btn-secondary"
                                onClick={() => openCommitDialog('draft')}
                                disabled={isSubmitting || isSubmittingReview}
                            >
                                <Check size={14} />
                                <span>{isSubmitting ? 'Saving...' : 'Save Draft'}</span>
                            </button>
                        )}

                        {onSubmitForReview && (
                            <button
                                type="button"
                                className="fullscreen-btn fullscreen-btn-primary"
                                style={{ background: '#16a34a', borderColor: '#15803d', color: '#ffffff' }}
                                onClick={() => openCommitDialog('review')}
                                disabled={isSubmitting || isSubmittingReview}
                            >
                                <Send size={14} />
                                <span>{isSubmittingReview ? 'Submitting...' : 'Submit for Review'}</span>
                            </button>
                        )}

                        <button
                            type="button"
                            className="fullscreen-btn fullscreen-btn-secondary"
                            onClick={handleCancel}
                            title="Cancel & Exit Editor (Esc)"
                        >
                            <X size={15} />
                            <span>Cancel</span>
                        </button>
                    </div>
                </div>

                {/* ── Editor Workspace (Section-Wise Cards OR Full Height Word/A4 Mode) ── */}
                <div className={`fullscreen-editor-body ${isSectionWise && viewMode === 'sections' ? 'fullscreen-sections-scroll' : ''}`}>
                    {isSectionWise && viewMode === 'sections' ? (
                        <div className="fullscreen-sections-inner">
                            <SectionWiseEditor
                                sections={sections}
                                onChange={onSectionsChange}
                                readOnly={readOnly}
                                documentTitle={documentTitle || title}
                            />
                        </div>
                    ) : (
                        <RichTextEditor
                            key={`fs-editor-${isOpen ? '1' : '0'}-${isSectionWise ? 'preview' : 'std'}`}
                            paged={true}
                            readOnly={isSectionWise ? true : readOnly}
                            showToolbar={!(isSectionWise && viewMode === 'document')}
                            showStatusBar={true}
                            placeholder={placeholder}
                            initialContent={safeStartingContent}
                            onChange={isSectionWise ? undefined : onChange}
                        />
                    )}
                </div>
            </div>

            {/* ── Commit Message Dialog ── */}
            {commitDialog && (
                <div
                    style={{
                        position: 'fixed', inset: 0, zIndex: 10100,
                        background: 'rgba(0,0,0,0.5)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                    onClick={(e) => { if (e.target === e.currentTarget) closeCommitDialog(); }}
                >
                    <div style={{
                        background: '#fff', borderRadius: '12px', padding: '24px',
                        width: '480px', maxWidth: '95vw', boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
                        display: 'flex', flexDirection: 'column', gap: '16px',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <MessageSquare size={18} style={{ color: commitDialog === 'review' ? '#16a34a' : '#0057B8' }} />
                                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>
                                    {commitDialog === 'review' ? 'Submit for Review' : 'Save Draft'}
                                </h3>
                            </div>
                            <button
                                type="button"
                                onClick={closeCommitDialog}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: '4px' }}
                            >
                                <X size={16} />
                            </button>
                        </div>

                        <p style={{ margin: 0, fontSize: '13px', color: '#64748b', lineHeight: '1.5' }}>
                            {commitDialog === 'review'
                                ? 'Describe the changes you made in this revision. This will be visible to the approver.'
                                : 'Add a brief note describing what you changed in this draft (optional).'}
                        </p>

                        <div>
                            <label style={{ fontSize: '12px', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '6px' }}>
                                {commitDialog === 'review' ? 'Revision summary' : 'Draft note'}{' '}
                                {commitDialog === 'review' && <span style={{ color: '#94a3b8', fontWeight: 400 }}>(recommended)</span>}
                            </label>
                            <textarea
                                autoFocus
                                style={{
                                    width: '100%', boxSizing: 'border-box',
                                    height: '90px', padding: '10px 12px',
                                    border: '1.5px solid #e2e8f0', borderRadius: '8px',
                                    fontSize: '13px', color: '#0f172a', resize: 'vertical',
                                    fontFamily: 'inherit', outline: 'none',
                                }}
                                placeholder={commitDialog === 'review'
                                    ? 'e.g. Updated section 3 to reflect new APRA CPS 234 controls...'
                                    : 'e.g. Added clause 4.2 for data retention policy...'}
                                value={commitMessage}
                                onChange={(e) => setCommitMessage(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleCommitConfirm(); }}
                            />
                            <span style={{ fontSize: '11px', color: '#94a3b8' }}>Ctrl+Enter to confirm</span>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                            <button
                                type="button"
                                onClick={closeCommitDialog}
                                style={{
                                    padding: '8px 16px', border: '1px solid #e2e8f0',
                                    borderRadius: '6px', background: '#f8fafc',
                                    fontSize: '13px', cursor: 'pointer', color: '#475569',
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleCommitConfirm}
                                disabled={commitDialog === 'review' ? isSubmittingReview : isSubmitting}
                                style={{
                                    padding: '8px 18px',
                                    background: commitDialog === 'review' ? '#16a34a' : '#0057B8',
                                    color: '#fff', border: 'none', borderRadius: '6px',
                                    fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                                    opacity: (commitDialog === 'review' ? isSubmittingReview : isSubmitting) ? 0.6 : 1,
                                }}
                            >
                                {commitDialog === 'review'
                                    ? (isSubmittingReview ? 'Submitting…' : 'Submit for Review')
                                    : (isSubmitting ? 'Saving…' : 'Save Draft')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
