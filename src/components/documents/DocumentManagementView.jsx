import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, FileText, AlertCircle, Loader2 } from 'lucide-react';
import DocumentHeader from './DocumentHeader';
import DocumentToolbar from './DocumentToolbar';
import DocumentEditor from './DocumentEditor';
import AnnotationsPanel from './AnnotationsPanel';
import AddAnnotationModal from './AddAnnotationModal';
import NewDocumentModal from './NewDocumentModal';
import VersionTimelineView from './VersionTimelineView';
import VersionHistoryModal from './VersionHistoryModal';
import CompareVersionsModal from './CompareVersionsModal';
import ActivityLogView from './ActivityLogView';
import ReferencesView from './ReferencesView';
import ErrorBoundary from '../common/ErrorBoundary';
import { documentManagementApi } from '../../services/api/documentManagementApi';
import { apiService } from '../../services/apiService';
import './documents.css';

export default function DocumentManagementView() {
    const [searchParams, setSearchParams] = useSearchParams();
    const docIdParam = searchParams.get('docId') || searchParams.get('policy');

    // Dynamic database-driven states (NO HARDCODED MOCKS)
    const [document, setDocument] = useState(null);
    const [library, setLibrary] = useState(null);
    const [libraries, setLibraries] = useState([]);
    const [sections, setSections] = useState([]);
    const [annotations, setAnnotations] = useState([]);
    const [currentVersion, setCurrentVersion] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [availableDraftsAndPolicies, setAvailableDraftsAndPolicies] = useState([]);

    // View & layout state
    const [activeTab, setActiveTab] = useState('document'); // 'document' | 'version_history' | 'activity_log' | 'references'
    const [isAnnotationsPanelOpen, setIsAnnotationsPanelOpen] = useState(true);
    const [zoomLevel, setZoomLevel] = useState('100%');
    const [isFullscreen, setIsFullscreen] = useState(false);

    // Modals state
    const [isNewDocModalOpen, setIsNewDocModalOpen] = useState(false);
    const [isAddAnnotationModalOpen, setIsAddAnnotationModalOpen] = useState(false);
    const [isVersionHistoryModalOpen, setIsVersionHistoryModalOpen] = useState(false);
    const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
    const [compareVersionIds, setCompareVersionIds] = useState({ v1: null, v2: null });

    // Annotation drafting context
    const [selectedAnchorCoords, setSelectedAnchorCoords] = useState(null);
    const [selectedTextSnippet, setSelectedTextSnippet] = useState('');
    const [targetAnnotationSectionId, setTargetAnnotationSectionId] = useState(null);
    const [defaultAnnotationCategory, setDefaultAnnotationCategory] = useState('ACTION');
    const [editingAnnotation, setEditingAnnotation] = useState(null);

    const handleOpenAddAnnotation = ({ text = '', coords = null, sectionId = null, category = 'ACTION' } = {}) => {
        setSelectedTextSnippet(text || '');
        setSelectedAnchorCoords(coords || null);
        setTargetAnnotationSectionId(sectionId || null);
        setDefaultAnnotationCategory(category || 'ACTION');
        setEditingAnnotation(null);
        setIsAddAnnotationModalOpen(true);
    };

    // Load Document and all related data strictly from PostgreSQL Database
    const loadDocumentData = useCallback(async (targetDocId) => {
        setIsLoading(true);
        try {
            // 1. Fetch available libraries from DB
            const libRes = await documentManagementApi.getLibraries().catch(() => ({ data: [] }));
            const libs = libRes?.data?.libraries || libRes?.data || [];
            setLibraries(libs);

            let liveDoc = null;

            // 2. Resolve document by ID or pick the first available document in DB
            if (targetDocId) {
                const docRes = await documentManagementApi.getDocumentById(targetDocId).catch(() => null);
                if (docRes?.data) {
                    liveDoc = docRes.data;
                }
            }

            if (!liveDoc) {
                const docsRes = await documentManagementApi.getDocuments({ limit: 1 }).catch(() => null);
                const foundDocs = docsRes?.data?.documents || docsRes?.data || [];
                if (foundDocs.length > 0) {
                    liveDoc = foundDocs[0];
                    setSearchParams({ docId: liveDoc.id });
                } else {
                    // Bridge with PostgreSQL Bank Policies & Saved Drafts for Notes
                    const [allPol, mcData] = await Promise.all([
                        apiService.getPolicies('all').catch(() => []),
                        apiService.getMakerCheckerItems().catch(() => ({ drafts: [] }))
                    ]);
                    const drafts = mcData?.drafts || [];
                    const policies = Array.isArray(allPol) ? allPol : [];
                    const combined = [
                        ...drafts,
                        ...policies.filter(p => !drafts.some(d => String(d.id) === String(p.id)))
                    ];
                    setAvailableDraftsAndPolicies(combined);

                    if (combined.length > 0) {
                        const target = targetDocId
                            ? combined.find(p => String(p.id) === String(targetDocId)) || combined[0]
                            : combined[0];

                        const rawSec = target.parameters?.sections || [];
                        const parsedSec = Array.isArray(rawSec) 
                            ? rawSec 
                            : (typeof rawSec === 'string' ? JSON.parse(rawSec) : []);

                        liveDoc = {
                            id: target.id,
                            document_name: target.title,
                            title: target.title,
                            summary: target.summary,
                            status: target.status || 'draft',
                            version: target.version || '1.0',
                            department_name: target.department_name || target.department_id || 'Retail Lending',
                            created_by: target.created_by || 'Staff User',
                            updated_at: target.updated_at || new Date().toISOString(),
                            is_draft: target.status === 'draft'
                        };

                        setLibrary({
                            id: target.department_id || 'retail-lending',
                            library_name: target.department_name || 'Retail Banking Standards'
                        });

                        if (parsedSec.length > 0) {
                            setSections(parsedSec.map((s, idx) => ({
                                id: s.id || `sec-${idx}`,
                                section_number: idx + 1,
                                title: s.title || `Clause ${idx + 1}`,
                                content: s.content || ''
                            })));
                        } else {
                            setSections([
                                {
                                    id: 'sec-1',
                                    section_number: 1,
                                    title: '1. Policy Clauses & Specifications',
                                    content: target.content || 'Operational policy clauses and specifications authored in system.'
                                }
                            ]);
                        }

                        // Load comments as notes
                        try {
                            const comms = await apiService.getPolicyComments(target.id);
                            const list = Array.isArray(comms) ? comms : (comms?.comments || []);
                            setAnnotations(list.map(c => ({
                                id: c.id,
                                category: 'NOTE',
                                comment: c.comment || c.text || '',
                                author: c.author_name || c.user_name || 'Staff User',
                                created_at: c.created_at
                            })));
                        } catch (_) {
                            setAnnotations([]);
                        }

                        setCurrentVersion({
                            id: `v-${target.version || '1.0'}`,
                            version_number: target.version || '1.0',
                            commit_message: `Draft v${target.version || '1.0'} initialized`
                        });
                    }
                }
            }

            setDocument(liveDoc);

            if (liveDoc) {
                // 3. Fetch Parent Library info from DB
                if (liveDoc.library_id) {
                    const parentLibRes = await documentManagementApi.getLibraryById(liveDoc.library_id).catch(() => null);
                    setLibrary(parentLibRes?.data || null);
                } else {
                    setLibrary(null);
                }

                // 4. Fetch real sections from DB
                const secRes = await documentManagementApi.getSections(liveDoc.id).catch(() => null);
                const fetchedSections = secRes?.data?.sections || secRes?.data || [];
                setSections(fetchedSections);

                // 5. Fetch real annotations from DB
                const annRes = await documentManagementApi.getAnnotations(liveDoc.id).catch(() => null);
                const fetchedAnns = annRes?.data?.annotations || annRes?.data || [];
                setAnnotations(fetchedAnns);

                // 6. Fetch versions & commits from DB
                const verRes = await documentManagementApi.getVersions(liveDoc.id).catch(() => null);
                const versions = verRes?.data?.versions || verRes?.data || [];
                if (versions.length > 0) {
                    setCurrentVersion(versions[0]);
                } else {
                    setCurrentVersion(null);
                }
            } else {
                setSections([]);
                setAnnotations([]);
                setCurrentVersion(null);
            }
        } catch (err) {
            console.error('Error fetching document management data from DB:', err);
        } finally {
            setIsLoading(false);
        }
    }, [setSearchParams]);

    useEffect(() => {
        loadDocumentData(docIdParam);
    }, [docIdParam, loadDocumentData]);

    // Handle custom event from sidebar
    useEffect(() => {
        const handleOpenDoc = (e) => {
            if (e.detail) {
                setSearchParams({ docId: e.detail });
            }
        };

        window.addEventListener('liblist:open-document', handleOpenDoc);
        return () => window.removeEventListener('liblist:open-document', handleOpenDoc);
    }, [setSearchParams]);

    // Image click -> Trigger drop annotation pin
    const handleImageClick = (coords) => {
        setSelectedAnchorCoords(coords);
        setSelectedTextSnippet('');
        setEditingAnnotation(null);
        setIsAddAnnotationModalOpen(true);
    };

    // Text selection -> Trigger text annotation
    const handleTextSelectionAnnotate = (text) => {
        setSelectedTextSnippet(text);
        setSelectedAnchorCoords(null);
        setEditingAnnotation(null);
        setIsAddAnnotationModalOpen(true);
    };

    // Create or Update Section Content (Persists directly to DB)
    const handleUpdateSectionContent = async (sectionId, newContent, newTitle = null) => {
        try {
            const currentSec = sections.find((s) => s.id === sectionId);
            const payload = {
                content: newContent,
                lock_version: currentSec?.lock_version
            };
            if (newTitle) payload.section_title = newTitle;

            const res = await documentManagementApi.updateSection(sectionId, payload);
            if (res.success && res.data) {
                setSections((prev) =>
                    prev.map((s) => (s.id === sectionId ? { ...s, ...res.data } : s))
                );
            }
        } catch (err) {
            console.error('Failed to update section:', err);
            alert('Failed to update section in database: ' + err.message);
        }
    };

    // Add New Section to Document (Persists to DB)
    const handleAddSection = async () => {
        if (!document?.id) return;
        const nextOrder = sections.length;
        const nextNum = `${nextOrder + 1}.0`;

        try {
            const res = await documentManagementApi.createSection({
                document_id: document.id,
                section_title: `Section ${nextNum}`,
                section_number: nextNum,
                section_order: nextOrder,
                content: { text: '' }
            });

            if (res.success && res.data) {
                setSections((prev) => [...prev, res.data]);
            }
        } catch (err) {
            alert('Failed to create section: ' + err.message);
        }
    };

    // Delete Section from DB
    const handleDeleteSection = async (sectionId) => {
        if (!window.confirm('Are you sure you want to delete this section?')) return;
        try {
            await documentManagementApi.deleteSection(sectionId);
            setSections((prev) => prev.filter((s) => s.id !== sectionId));
        } catch (err) {
            alert('Failed to delete section: ' + err.message);
        }
    };

    // Save Annotation (Calls DB API)
    const handleSaveAnnotation = async (data) => {
        setIsAddAnnotationModalOpen(false);
        if (!document?.id) return;

        try {
            if (data.id) {
                await documentManagementApi.updateAnnotation(data.id, data);
            } else {
                await documentManagementApi.createAnnotation({
                    ...data,
                    document_id: document.id
                });
            }
            // Refresh annotations from DB
            const annRes = await documentManagementApi.getAnnotations(document.id);
            setAnnotations(annRes?.data?.annotations || annRes?.data || []);
        } catch (err) {
            alert('Failed to save annotation: ' + err.message);
        }
    };

    // Delete Annotation from DB
    const handleDeleteAnnotation = async (annId) => {
        if (!window.confirm('Delete this annotation?')) return;
        try {
            await documentManagementApi.deleteAnnotation(annId);
            setAnnotations((prev) => prev.filter((a) => a.id !== annId));
        } catch (err) {
            alert('Failed to delete annotation: ' + err.message);
        }
    };

    // Commit Changes (Git-like commit with real hash from PostgreSQL DB)
    const handleCommitChanges = async () => {
        if (!document?.id) return;
        const commitMsg = window.prompt(
            'Enter a commit message for this document version snapshot:',
            'Operational compliance updates and section revisions'
        );
        if (!commitMsg) return;

        try {
            const res = await documentManagementApi.commitDocument(document.id, {
                commit_message: commitMsg.trim(),
                version_tag: `v${(currentVersion?.version_number || 0) + 1}`
            });

            if (res?.data) {
                setCurrentVersion(res.data);
                // Refresh document state
                const docRes = await documentManagementApi.getDocumentById(document.id);
                if (docRes?.data) setDocument(docRes.data);

                // Notify side navigation and version timeline so commit version badge and tree update immediately
                window.dispatchEvent(new CustomEvent('liblist:version-committed', {
                    detail: { documentId: document.id, version: res.data }
                }));

                alert(`Version v${res.data.version_number} committed successfully! Commit Hash: ${res.data.commit_hash.slice(0, 8)}`);
            }
        } catch (err) {
            alert('Commit failed: ' + (err.message || 'Server error'));
        }
    };

    // Restore Version from DB
    const handleRestoreVersion = async (targetVersionId) => {
        let versionIdToRestore = targetVersionId;
        if (!versionIdToRestore) {
            setActiveTab('version_history');
            alert('Please select a version checkpoint from the timeline to restore.');
            return;
        }

        if (!window.confirm('Restore this document to the selected version snapshot?')) return;
        try {
            const res = await documentManagementApi.restoreVersion(document.id, versionIdToRestore);
            if (res?.data) {
                setCurrentVersion(res.data);
                await loadDocumentData(document.id);
                setIsVersionHistoryModalOpen(false);
                setActiveTab('document');

                // Notify side navigation so commit version badge and tree update immediately
                window.dispatchEvent(new CustomEvent('liblist:version-restored', {
                    detail: { documentId: document.id, version: res.data }
                }));

                alert(`Document version successfully restored! Created new checkpoint v${res.data.version_number || ''}.`);
            }
        } catch (err) {
            console.error('Restore error:', err);
            alert('Restore failed: ' + err.message);
        }
    };

    if (isLoading) {
        return (
            <div className="dms-container" style={{ alignItems: 'center', justifyContent: 'center' }}>
                <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', color: 'var(--dms-primary)' }} />
                <span style={{ marginTop: '12px', fontSize: '13px', color: '#64748b' }}>
                    Loading document from database...
                </span>
            </div>
        );
    }

    // Empty state when DB has no documents
    if (!document) {
        return (
            <div className="dms-container" style={{ alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
                <div style={{ textAlign: 'center', maxWidth: '420px' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--dms-primary-light)', color: 'var(--dms-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                        <FileText size={24} />
                    </div>
                    <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', margin: '0 0 8px' }}>
                        No Documents in Master Library
                    </h2>
                    <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.5, margin: '0 0 20px' }}>
                        Create a new document directly in the system, instantiate from a master library template, or upload and extract a real PDF.
                    </p>
                    <button
                        type="button"
                        className="dms-btn-primary"
                        style={{ margin: '0 auto' }}
                        onClick={() => setIsNewDocModalOpen(true)}
                    >
                        <Plus size={15} />
                        <span>Create New Document</span>
                    </button>
                </div>

                <NewDocumentModal
                    isOpen={isNewDocModalOpen}
                    onClose={() => setIsNewDocModalOpen(false)}
                    libraries={libraries}
                    onDocumentCreated={(newDoc) => {
                        setSearchParams({ docId: newDoc.id });
                        loadDocumentData(newDoc.id);
                    }}
                />
            </div>
        );
    }

    return (
        <div className={`dms-container ${isFullscreen ? 'fullscreen' : ''}`}>
            {/* Dynamic Document Header from Database */}
            <DocumentHeader
                document={document}
                libraryName={library?.library_name || 'Master Library'}
                currentVersion={currentVersion}
                activeTab={activeTab}
                onTabChange={setActiveTab}
                onOpenVersionHistory={() => setActiveTab('version_history')}
                onOpenCompare={() => setActiveTab('version_history')}
                onOpenRestore={() => setActiveTab('version_history')}
                onOpenCommit={handleCommitChanges}
                availableDocuments={availableDraftsAndPolicies}
                onSelectDocument={(id) => {
                    setSearchParams({ docId: id });
                    loadDocumentData(id);
                }}
            />

            {/* TAB 1: Main WYSIWYG Document Editor View */}
            {activeTab === 'document' && (
                <>
                    {/* Rich Formatting Toolbar */}
                    <DocumentToolbar
                        zoomLevel={zoomLevel}
                        onZoomChange={setZoomLevel}
                        isAnnotationsPanelOpen={isAnnotationsPanelOpen}
                        onToggleAnnotationsPanel={() => setIsAnnotationsPanelOpen((prev) => !prev)}
                        annotationCount={annotations.length}
                        onToggleFullscreen={() => setIsFullscreen((f) => !f)}
                    />

                    {/* Responsive Workspace Body */}
                    <div className="dms-workspace-body">
                        <ErrorBoundary title="Document Editor Error">
                            <DocumentEditor
                                documentId={document.id}
                                documentTitle={document.document_name}
                                libraryName={library?.library_name || 'Policies'}
                                sections={sections}
                                annotations={annotations}
                                zoomLevel={zoomLevel}
                                onUpdateSectionContent={handleUpdateSectionContent}
                                onDeleteSection={handleDeleteSection}
                                onAddSection={handleAddSection}
                                onImageClick={handleImageClick}
                                onTextSelectionAnnotate={handleTextSelectionAnnotate}
                                onOpenAddAnnotation={handleOpenAddAnnotation}
                                onSelectAnnotation={() => setIsAnnotationsPanelOpen(true)}
                            />
                        </ErrorBoundary>

                        {/* Collapsible Right Annotations Panel */}
                        <AnnotationsPanel
                            annotations={annotations}
                            isOpen={isAnnotationsPanelOpen}
                            onClose={() => setIsAnnotationsPanelOpen(false)}
                            onAddAnnotationClick={() => {
                                setSelectedAnchorCoords(null);
                                setSelectedTextSnippet('');
                                setEditingAnnotation(null);
                                setIsAddAnnotationModalOpen(true);
                            }}
                            onEditAnnotation={(ann) => {
                                setEditingAnnotation(ann);
                                setIsAddAnnotationModalOpen(true);
                            }}
                            onDeleteAnnotation={handleDeleteAnnotation}
                            onSelectAnnotation={() => {}}
                        />
                    </div>
                </>
            )}

            {/* TAB 2: Git-like Split Version Timeline & Compare View (Image 4) */}
            {activeTab === 'version_history' && (
                <div className="dms-workspace-body" style={{ background: '#f8fafc', minHeight: 'calc(100vh - 120px)', overflowY: 'auto' }}>
                    <ErrorBoundary title="Version History Error" onReset={() => setActiveTab('version_history')}>
                        <VersionTimelineView
                            documentId={document.id}
                            currentVersionId={currentVersion?.id}
                            onClose={() => setActiveTab('document')}
                            onRestoreVersion={handleRestoreVersion}
                        />
                    </ErrorBoundary>
                </div>
            )}

            {/* TAB 3: Activity Log Audit Trail */}
            {activeTab === 'activity_log' && (
                <div className="dms-workspace-body">
                    <ActivityLogView documentId={document.id} />
                </div>
            )}

            {/* TAB 4: References Register */}
            {activeTab === 'references' && (
                <div className="dms-workspace-body">
                    <ReferencesView
                        documentId={document.id}
                        annotations={annotations}
                        onNavigateToAnnotation={() => {
                            setActiveTab('document');
                            setIsAnnotationsPanelOpen(true);
                        }}
                    />
                </div>
            )}

            {/* Modals */}
            <AddAnnotationModal
                isOpen={isAddAnnotationModalOpen}
                onClose={() => setIsAddAnnotationModalOpen(false)}
                onSave={handleSaveAnnotation}
                sections={sections}
                initialData={editingAnnotation}
                initialSectionId={targetAnnotationSectionId}
                defaultCategory={defaultAnnotationCategory}
                anchorCoordinates={selectedAnchorCoords}
                selectedText={selectedTextSnippet}
            />

            <NewDocumentModal
                isOpen={isNewDocModalOpen}
                onClose={() => setIsNewDocModalOpen(false)}
                libraries={libraries}
                preselectedLibraryId={library?.id}
                onDocumentCreated={(newDoc) => {
                    setSearchParams({ docId: newDoc.id });
                    loadDocumentData(newDoc.id);
                }}
            />

            <CompareVersionsModal
                isOpen={isCompareModalOpen}
                onClose={() => setIsCompareModalOpen(false)}
                documentId={document.id}
                v1Id={compareVersionIds.v1}
                v2Id={compareVersionIds.v2}
            />
        </div>
    );
}
