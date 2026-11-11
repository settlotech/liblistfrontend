import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    ChevronRight,
    Folder,
    FileText,
    Layers,
    Plus,
    FileCode,
    BookOpen
} from 'lucide-react';
import { documentManagementApi } from '../../services/api/documentManagementApi';

export default function MasterLibraryTree({
    searchQuery = '',
    selectedDocId = null,
    onSelectDocument,
    onSelectSection,
    onOpenCreateDocModal
}) {
    const [treeData, setTreeData] = useState([]);
    const [expandedNodeIds, setExpandedNodeIds] = useState(new Set());
    const [isLoading, setIsLoading] = useState(true);

    // Fetch live hierarchy & documents from PostgreSQL DB
    const loadHierarchy = useCallback(async (showSpinner = false) => {
        if (showSpinner) setIsLoading(true);
        try {
            const [hierRes, docsRes] = await Promise.all([
                documentManagementApi.getLibraryHierarchy().catch(() => ({ data: [] })),
                documentManagementApi.getDocuments({ limit: 100 }).catch(() => ({ data: [] }))
            ]);

            const libraries = hierRes?.data || [];
            const documents = docsRes?.data?.documents || docsRes?.data || [];

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

            setTreeData(combined);

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
            if (e?.detail?.library_id) {
                setExpandedNodeIds((prev) => new Set([...prev, e.detail.library_id]));
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

        return () => {
            window.removeEventListener('liblist:library-created', handleSilentRefresh);
            window.removeEventListener('liblist:library-updated', handleSilentRefresh);
            window.removeEventListener('liblist:document-created', handleDocCreated);
            window.removeEventListener('liblist:document-updated', handleSilentRefresh);
            window.removeEventListener('liblist:version-committed', handleSilentRefresh);
            window.removeEventListener('liblist:version-restored', handleSilentRefresh);
            window.removeEventListener('liblist:refresh-nav', handleSilentRefresh);
        };
    }, [loadHierarchy]);

    // Ensure the library containing active document is expanded
    useEffect(() => {
        if (selectedDocId && treeData.length > 0) {
            const parentLib = treeData.find((lib) =>
                lib.documents?.some((d) => d.id === selectedDocId)
            );
            if (parentLib) {
                setExpandedNodeIds((prev) => new Set([...prev, parentLib.id]));
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

    // Filter tree dynamically based on search query
    const filteredTree = useMemo(() => {
        if (!searchQuery.trim()) return treeData;
        const q = searchQuery.toLowerCase().trim();

        return treeData.map((lib) => {
            const libMatches = lib.library_name?.toLowerCase().includes(q);
            const matchingDocs = (lib.documents || []).filter(
                (d) => d.document_name?.toLowerCase().includes(q)
            );

            if (libMatches || matchingDocs.length > 0) {
                return {
                    ...lib,
                    documents: libMatches ? lib.documents : matchingDocs
                };
            }
            return null;
        }).filter(Boolean);
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
            {filteredTree.map((lib) => {
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
                            </div>
                        </div>

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
                                        const versionTag = doc.current_version_number
                                            ? `v${doc.current_version_number}`
                                            : 'v1';

                                        return (
                                            <div key={doc.id} className="dms-tree-node">
                                                <div
                                                    className={`sidebar-policy-row ${isDocSelected ? 'active' : ''}`}
                                                    onClick={() => onSelectDocument && onSelectDocument(doc.id)}
                                                    title={`${doc.document_name} (${doc.status})`}
                                                >
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', minWidth: 0, flex: 1 }}>
                                                        <FileText size={11} style={{ flexShrink: 0 }} />
                                                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                            {doc.document_name}
                                                        </span>
                                                    </div>

                                                    <span className="sidebar-ver-tag">
                                                        {versionTag}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
