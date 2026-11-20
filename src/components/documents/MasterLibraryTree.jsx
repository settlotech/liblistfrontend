import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    ChevronRight,
    Folder,
    FileText,
    Layers,
    Plus,
    FileCode,
    BookOpen,
    Trash2,
    AlertTriangle,
    X,
    Check,
    Pin,
    FileSpreadsheet
} from 'lucide-react';
import { documentManagementApi } from '../../services/api/documentManagementApi';
import { useNavigate, useLocation } from 'react-router-dom';

const flattenLibraries = (libraries = []) => libraries.flatMap((library) => [
    library,
    ...flattenLibraries(library.children || [])
]);

const nestLibraries = (libraries = []) => {
    const byId = new Map(libraries.map((library) => [String(library.id), { ...library, children: [] }]));
    const roots = [];
    libraries.forEach((library) => {
        const node = byId.get(String(library.id));
        const parent = library.parent_library_id && byId.get(String(library.parent_library_id));
        if (parent && parent.id !== node.id) parent.children.push(node);
        else roots.push(node);
    });
    return roots;
};

const templateCss = {
    button: {
        display: 'flex',
        alignItems: 'center',
        gap: '7px',
        width: '100%',
        padding: '7px 10px',
        border: 'none',
        borderRadius: '5px',
        background: 'transparent',
        color: '#475569',
        fontSize: '12px',
        fontWeight: 500,
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        textAlign: 'left',
        whiteSpace: 'nowrap'
    },

    icon: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: '16px'
    },

    text: {
        fontSize: '12px',
        lineHeight: '16px'
    }
};

export default function MasterLibraryTree({
    searchQuery = '',
    selectedDocId = null,
    onSelectDocument,
    onSelectSection,
    onOpenCreateDocModal
}) {

    const navigate = useNavigate();
    const [treeData, setTreeData] = useState([]);
    const [expandedNodeIds, setExpandedNodeIds] = useState(new Set());
    const [isLoading, setIsLoading] = useState(true);
    const [pinnedDocIds, setPinnedDocIds] = useState(new Set());
    const templateNav = [
        { name: 'Policy Templates', path: '/templates', icon: <FileSpreadsheet size={17} strokeWidth={2.2} /> }
    ];
    // Library Removal Request State
    const [removalTargetLib, setRemovalTargetLib] = useState(null);
    const [removalReason, setRemovalReason] = useState('');
    const [removalError, setRemovalError] = useState('');
    const [isSubmittingRemoval, setIsSubmittingRemoval] = useState(false);

    // Fetch pinned policy IDs for current user
    const loadPinnedDocIds = useCallback(async () => {
        try {
            const res = await documentManagementApi.getPinnedPolicies();
            const ids = (res?.data || []).map((p) => p.id);
            setPinnedDocIds(new Set(ids));
        } catch {
            // Ignore error
        }
    }, []);

    useEffect(() => {
        loadPinnedDocIds();
    }, [loadPinnedDocIds]);

    // Listen to real-time pin changes across the app
    useEffect(() => {
        const handlePinEvent = (e) => {
            if (e.detail?.documentId) {
                setPinnedDocIds((prev) => {
                    const next = new Set(prev);
                    if (e.detail.isPinned) {
                        next.add(e.detail.documentId);
                    } else {
                        next.delete(e.detail.documentId);
                    }
                    return next;
                });
            } else {
                loadPinnedDocIds();
            }
        };
        window.addEventListener('policyPinnedChanged', handlePinEvent);
        return () => window.removeEventListener('policyPinnedChanged', handlePinEvent);
    }, [loadPinnedDocIds]);

    const handleTogglePinDoc = async (docId, e) => {
        e.stopPropagation();
        const isCurrentlyPinned = pinnedDocIds.has(docId);
        const nextPinned = !isCurrentlyPinned;

        // Optimistic update
        setPinnedDocIds((prev) => {
            const next = new Set(prev);
            if (nextPinned) next.add(docId);
            else next.delete(docId);
            return next;
        });

        try {
            if (nextPinned) {
                await documentManagementApi.pinPolicy(docId);
            } else {
                await documentManagementApi.unpinPolicy(docId);
            }
            window.dispatchEvent(
                new CustomEvent('policyPinnedChanged', {
                    detail: { documentId: docId, isPinned: nextPinned },
                })
            );
        } catch (err) {
            console.error('Failed to toggle pin in tree:', err);
            loadPinnedDocIds();
        }
    };

    // Fetch live hierarchy & documents from PostgreSQL DB
    const loadHierarchy = useCallback(async (showSpinner = false) => {
        if (showSpinner) setIsLoading(true);
        try {
            const [hierRes, docsRes] = await Promise.all([
                documentManagementApi.getLibraryHierarchy().catch(() => ({ data: [] })),
                documentManagementApi.getDocuments({ limit: 1000 }).catch(() => ({ data: [] }))
            ]);

            const libraries = hierRes?.data || [];
            const allDocs = docsRes?.data?.documents || docsRes?.data || [];
            // Master Library Tree only displays active, approved policies.
            // Draft policies remain in Change Management until approved.
            const documents = allDocs.filter((doc) => doc.status === 'active' || doc.status === 'approved');

            // Group documents by library_id
            const docsByLib = new Map();
            documents.forEach((doc) => {
                const libId = doc.library_id;
                if (!docsByLib.has(libId)) docsByLib.set(libId, []);
                docsByLib.get(libId).push(doc);
            });

            const combined = libraries.map((lib) => ({
                ...lib,
                documents: docsByLib.get(lib.id) || []
            }));
            const nestedLibraries = nestLibraries(combined);

            setTreeData(nestedLibraries);

            // Maintain existing open libraries or auto-expand all
            setExpandedNodeIds((prev) => {
                if (prev.size === 0) {
                    return new Set(combined.map((l) => l.id));
                }
                const next = new Set(prev);
                if (selectedDocId) {
                    combined.forEach((lib) => {
                        if (lib.documents?.some((d) => d.id === selectedDocId)) {
                            next.add(lib.id);
                        }
                    });
                }
                return next;
            });
        } catch (err) {
            console.error('Failed to load Master Library tree:', err);
        } finally {
            setIsLoading(false);
        }
    }, [selectedDocId]);

    // Initial load
    useEffect(() => {
        loadHierarchy(true);
    }, []);

    // Listen to real-time events across Document Management modules
    useEffect(() => {
        const handleSilentRefresh = (e) => {
            loadHierarchy(false);
            const libraryId = e?.detail?.library_id || e?.detail?.id;
            if (libraryId) setExpandedNodeIds((prev) => new Set([...prev, libraryId]));
            if (e?.detail?.parent_library_id) {
                const allLibraries = flattenLibraries(treeData);
                const idsToExpand = [e.detail.parent_library_id];
                let ancestorId = e.detail.parent_library_id;
                while (ancestorId) {
                    const ancestor = allLibraries.find((lib) => String(lib.id) === String(ancestorId));
                    if (!ancestor) break;
                    if (!idsToExpand.some((id) => String(id) === String(ancestor.id))) idsToExpand.push(ancestor.id);
                    ancestorId = ancestor.parent_library_id;
                }
                setExpandedNodeIds((prev) => new Set([...prev, ...idsToExpand]));
            }
        };

        const handleDocCreated = (e) => {
            loadHierarchy(false);
            if (e?.detail?.library_id) {
                setExpandedNodeIds((prev) => new Set([...prev, e.detail.library_id]));
            }
        };

        window.addEventListener('liblist:library-created', handleSilentRefresh);
        window.addEventListener('liblist:library-updated', handleSilentRefresh);
        window.addEventListener('liblist:document-created', handleDocCreated);
        window.addEventListener('liblist:document-updated', handleSilentRefresh);
        window.addEventListener('liblist:version-committed', handleSilentRefresh);
        window.addEventListener('liblist:version-restored', handleSilentRefresh);
        window.addEventListener('liblist:refresh-nav', handleSilentRefresh);
        window.addEventListener('liblist:policy-approved', handleSilentRefresh);

        return () => {
            window.removeEventListener('liblist:library-created', handleSilentRefresh);
            window.removeEventListener('liblist:library-updated', handleSilentRefresh);
            window.removeEventListener('liblist:document-created', handleDocCreated);
            window.removeEventListener('liblist:document-updated', handleSilentRefresh);
            window.removeEventListener('liblist:version-committed', handleSilentRefresh);
            window.removeEventListener('liblist:version-restored', handleSilentRefresh);
            window.removeEventListener('liblist:refresh-nav', handleSilentRefresh);
        };
    }, [loadHierarchy, treeData]);

    // Ensure the library containing active document is expanded
    useEffect(() => {
        if (selectedDocId && treeData.length > 0) {
            const allLibraries = flattenLibraries(treeData);
            const parentLib = allLibraries.find((lib) =>
                lib.documents?.some((d) => d.id === selectedDocId)
            );
            if (parentLib) {
                const idsToExpand = [parentLib.id];
                let ancestorId = parentLib.parent_library_id;
                while (ancestorId) {
                    const ancestor = allLibraries.find((lib) => String(lib.id) === String(ancestorId));
                    if (!ancestor || idsToExpand.some((id) => String(id) === String(ancestor.id))) break;
                    idsToExpand.push(ancestor.id);
                    ancestorId = ancestor.parent_library_id;
                }
                setExpandedNodeIds((prev) => new Set([...prev, ...idsToExpand]));
            }
        }
    }, [selectedDocId, treeData]);

    const toggleExpand = (id, e) => {
        if (e) e.stopPropagation();
        setExpandedNodeIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    // Submit removal request for review
    const handleConfirmRemovalRequest = async () => {
        if (!removalTargetLib) return;
        if (!removalReason.trim()) {
            setRemovalError('Please provide a reason or justification for removing this library.');
            return;
        }

        setIsSubmittingRemoval(true);
        setRemovalError('');
        try {
            await documentManagementApi.requestLibraryRemoval(removalTargetLib.id, removalReason.trim());
            setRemovalTargetLib(null);
            setRemovalReason('');
            loadHierarchy(false);
            window.dispatchEvent(new CustomEvent('liblist:library-updated', { detail: { library_id: removalTargetLib.id } }));
            window.dispatchEvent(new CustomEvent('liblist:refresh-nav'));
        } catch (err) {
            setRemovalError(err.message || 'Failed to submit library removal request.');
        } finally {
            setIsSubmittingRemoval(false);
        }
    };

    // Filter tree dynamically based on search query
    const filteredTree = useMemo(() => {
        if (!searchQuery.trim()) return treeData;
        const q = searchQuery.toLowerCase().trim();

        const filterLibrary = (lib) => {
            const libMatches = lib.library_name?.toLowerCase().includes(q);
            const matchingDocs = (lib.documents || []).filter(
                (d) => d.document_name?.toLowerCase().includes(q)
            );
            const matchingChildren = (lib.children || []).map(filterLibrary).filter(Boolean);

            if (libMatches || matchingDocs.length > 0 || matchingChildren.length > 0) {
                return {
                    ...lib,
                    documents: libMatches ? lib.documents : matchingDocs,
                    children: matchingChildren
                };
            }
            return null;
        };
        return treeData.map(filterLibrary).filter(Boolean);
    }, [treeData, searchQuery]);

    if (isLoading) {
        return (
            <div style={{ padding: '12px 14px', fontSize: '11.5px', color: '#94a3b8' }}>
                Loading libraries from database...
            </div>
        );
    }

    if (treeData.length === 0) {
        return (
            <div style={{ padding: '16px 12px', textAlign: 'center', fontSize: '11.5px', color: '#94a3b8' }}>
                <p style={{ margin: 0 }}>No libraries found in database.</p>
                <p style={{ margin: '4px 0 0', fontSize: '10.5px' }}>
                    Click the <strong>+</strong> button near Master Library to add your first library.
                </p>
            </div>
        );
    }

    return (
        <div className="dms-master-tree-container">
            
            {filteredTree.map((rootLib) => {
                const renderNode = (lib) => {
                    const isLibExpanded = expandedNodeIds.has(lib.id);
                    const docCount = lib.documents ? lib.documents.length : 0;

                    return (
                        <div key={lib.id} className="dms-tree-node">
                            {/* Library Header Row */}
                            <div
                                className="sidebar-dept-row"
                                onClick={(e) => toggleExpand(lib.id, e)}
                            >
                                <div className="sidebar-dept-main">
                                    <button
                                        type="button"
                                        className="sidebar-chevron-btn"
                                        onClick={(e) => toggleExpand(lib.id, e)}
                                    >
                                        <ChevronRight
                                            size={12}
                                            className={`sidebar-chevron-icon ${isLibExpanded ? 'expanded' : ''}`}
                                        />
                                    </button>
                                    <Folder size={13} style={{ color: 'var(--btn-primary-bg)', flexShrink: 0 }} />
                                    <span className="sidebar-dept-name" title={lib.library_name}>
                                        {lib.library_name}
                                    </span>
                                </div>

                                <div className="sidebar-dept-actions">
                                    {lib.pending_removal && (
                                        <span style={{ fontSize: '9.5px', background: '#fef3c7', color: '#b45309', padding: '1px 5px', borderRadius: '4px', fontWeight: 600 }}>
                                            Removal Pending
                                        </span>
                                    )}
                                    <span className="sidebar-count-badge" title={`${docCount} Documents`}>
                                        {docCount}
                                    </span>
                                    <button
                                        type="button"
                                        className="sidebar-dept-add-btn"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onOpenCreateDocModal && onOpenCreateDocModal(lib.id);
                                        }}
                                        title={`Add new document into ${lib.library_name}`}
                                    >
                                        <Plus size={11} strokeWidth={2.5} />
                                    </button>
                                    {/* <button
                                    type="button"
                                    className="sidebar-dept-add-btn"
                                    style={{ color: lib.pending_removal ? '#94a3b8' : '#ef4444' }}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (lib.pending_removal) return;
                                        setRemovalTargetLib(lib);
                                        setRemovalReason('');
                                        setRemovalError('');
                                    }}
                                    title={lib.pending_removal ? 'Removal request already in review' : `Request removal of ${lib.library_name}`}
                                    disabled={lib.pending_removal}
                                >
                                    <Trash2 size={11} />
                                </button> */}
                                </div>
                            </div>

                            {isLibExpanded && lib.children?.length > 0 && (
                                <div className="sidebar-library-children">
                                    {lib.children.map(renderNode)}
                                </div>
                            )}

                            {/* Documents Hierarchy under Library */}
                            {isLibExpanded && lib.documents && (
                                <div className="sidebar-child-policies">
                                    {lib.documents.length === 0 ? (
                                        <div style={{ fontSize: '10.5px', color: '#94a3b8', padding: '4px 8px' }}>
                                            No documents yet. Click + to add.
                                        </div>
                                    ) : (
                                        lib.documents.map((doc) => {
                                            const isDocSelected = selectedDocId === doc.id;
                                            const versionTag = `v${doc.current_version_number || '1.0'}`;

                                            return (
                                                <div key={doc.id} className="dms-tree-node">
                                                    <div
                                                        className={`sidebar-policy-row ${isDocSelected ? 'active' : ''}`}
                                                        onClick={() => onSelectDocument && onSelectDocument(doc.id)}
                                                        title={`${doc.document_name} (v${doc.current_version_number || '1.0'})`}
                                                    >
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', minWidth: 0, flex: 1 }}>
                                                            <div style={{ width: 6, height: 6, borderRadius: '50%', flexShrink: 0, background: '#16a34a' }} title="Published & Live" />
                                                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                                {doc.document_name}
                                                            </span>
                                                        </div>

                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                            <span className="sidebar-ver-tag">
                                                                {versionTag}
                                                            </span>
                                                            <button
                                                                type="button"
                                                                className={`sidebar-pin-btn ${pinnedDocIds.has(doc.id) ? 'pinned' : ''}`}
                                                                onClick={(e) => handleTogglePinDoc(doc.id, e)}
                                                                title={pinnedDocIds.has(doc.id) ? 'Unpin policy from sidebar' : 'Pin policy to sidebar'}
                                                            >
                                                                <Pin size={11} style={pinnedDocIds.has(doc.id) ? { fill: '#0057B8', color: '#0057B8' } : {}} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            )}
                        </div>
                    );
                };
                return renderNode(rootLib);
            })}
            {/* Library Removal Request Modal */}
            {removalTargetLib && (
                <div
                    style={{
                        position: 'fixed', inset: 0, zIndex: 10000,
                        background: 'rgba(0,0,0,0.5)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}
                    onClick={(e) => { if (e.target === e.currentTarget) setRemovalTargetLib(null); }}
                >
                    <div style={{
                        background: '#ffffff', borderRadius: '12px', padding: '24px',
                        width: '460px', maxWidth: '95vw', boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
                        display: 'flex', flexDirection: 'column', gap: '14px'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <AlertTriangle size={18} style={{ color: '#d97706' }} />
                                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>
                                    Request Library Removal
                                </h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => setRemovalTargetLib(null)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
                            >
                                <X size={16} />
                            </button>
                        </div>

                        <p style={{ margin: 0, fontSize: '13px', color: '#475569', lineHeight: '1.5' }}>
                            Request removal of library <strong>"{removalTargetLib.library_name}"</strong>.
                            Per bank policy, the library will remain live until fully reviewed and approved in Change Management.
                        </p>

                        {removalError && (
                            <div style={{ padding: '8px 12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', color: '#b91c1c', fontSize: '12px' }}>
                                {removalError}
                            </div>
                        )}

                        <div>
                            <label style={{ fontSize: '12px', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '6px' }}>
                                Reason / Justification for Removal <span style={{ color: '#dc2626' }}>*</span>
                            </label>
                            <textarea
                                autoFocus
                                style={{
                                    width: '100%', boxSizing: 'border-box',
                                    height: '80px', padding: '10px 12px',
                                    border: '1.5px solid #e2e8f0', borderRadius: '8px',
                                    fontSize: '13px', color: '#0f172a', resize: 'vertical',
                                    fontFamily: 'inherit', outline: 'none'
                                }}
                                placeholder="Explain why this library should be suspended..."
                                value={removalReason}
                                onChange={(e) => setRemovalReason(e.target.value)}
                            />
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
                            <button
                                type="button"
                                onClick={() => setRemovalTargetLib(null)}
                                disabled={isSubmittingRemoval}
                                style={{
                                    padding: '8px 16px', border: '1px solid #e2e8f0',
                                    borderRadius: '6px', background: '#f8fafc',
                                    fontSize: '13px', cursor: 'pointer', color: '#475569'
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirmRemovalRequest}
                                disabled={isSubmittingRemoval}
                                style={{
                                    padding: '8px 18px',
                                    background: '#d97706', color: '#fff',
                                    border: 'none', borderRadius: '6px',
                                    fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                                    opacity: isSubmittingRemoval ? 0.6 : 1
                                }}
                            >
                                {isSubmittingRemoval ? 'Submitting...' : 'Submit Removal Request'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
