import React from 'react';
import {
    FileText,
    History,
    Scale,
    RotateCcw,
    CheckCircle2,
    GitCommit
} from 'lucide-react';

export default function DocumentHeader({
    document,
    libraryName = 'Policies',
    currentVersion,
    activeTab,
    onTabChange,
    onOpenVersionHistory,
    onOpenCompare,
    onOpenRestore,
    onOpenCommit,
    availableDocuments = [],
    onSelectDocument = null
}) {
    if (!document) return null;

    const versionNum = currentVersion?.version_number ? `v${currentVersion.version_number}` : 'v1';
    const commitHash = currentVersion?.commit_hash ? currentVersion.commit_hash.slice(0, 8) : 'initial';
    const updatedDate = document.updated_at
    ? new Date(document.updated_at).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    })
    : '10 Nov 2026';
    const updatedBy = document.updated_by_name ;
    console.log("updatedBy ==> ", updatedBy);
    console.log("document ==> ", document);
    console.log("updatedDate ==> ", updatedDate);

    return (
        <header className="dms-header">
            {/* Breadcrumbs */}
            <nav className="dms-breadcrumbs" aria-label="Breadcrumb">
                <span className="dms-breadcrumb-item">Libraries</span>
                <span className="dms-breadcrumb-sep">&gt;</span>
                <span className="dms-breadcrumb-item">{libraryName}</span>
                <span className="dms-breadcrumb-sep">&gt;</span>
                <span className="dms-breadcrumb-active">{document.document_name}</span>
            </nav>

            {/* Title Row & Actions */}
            <div className="dms-header-row">
                <div className="dms-title-group">
                    <span className="dms-doc-icon">
                        <FileText size={22} />
                    </span>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                            <h1 className="dms-doc-title">{document.document_name}</h1>
                            <span className="dms-version-badge">{versionNum}</span>
                            {availableDocuments && availableDocuments.length > 0 && onSelectDocument && (
                                <select
                                    value={document.id}
                                    onChange={(e) => onSelectDocument(e.target.value)}
                                    style={{
                                        padding: '4px 8px',
                                        fontSize: '11.5px',
                                        fontWeight: '600',
                                        borderRadius: '6px',
                                        border: '1px solid #cbd5e1',
                                        background: '#ffffff',
                                        color: '#0f172a',
                                        maxWidth: '240px',
                                        cursor: 'pointer'
                                    }}
                                    title="Switch policy / draft"
                                >
                                    {availableDocuments.map(d => (
                                        <option key={d.id} value={d.id}>
                                            {d.status === 'draft' ? '[Draft] ' : ''}{d.title} (v{d.version || '1.0'})
                                        </option>
                                    ))}
                                </select>
                            )}
                        </div>
                        <div className="dms-meta-line" style={{ marginTop: '2px' }}>
                            Last updated: {updatedDate} 
                            {/* by <strong>{updatedBy}</strong>  */}
                            {/* • Commit: <span className="dms-meta-commit">{commitHash}</span> */}
                        </div>
                    </div>
                </div>

                {/* Top Action Buttons (Image 1) */}
                <div className="dms-header-actions"> 
                    <button
                        type="button"
                        className="dms-btn-primary"
                        onClick={onOpenCommit}
                        title="Commit current changes to new version"
                    >
                        <CheckCircle2 size={15} />
                        <span>Commit Changes</span>
                    </button>
                </div>
            </div>

            {/* Document Navigation Tabs */}
            <div className="dms-tabs-bar">
                <button
                    type="button"
                    className={`dms-tab-btn ${activeTab === 'document' ? 'active' : ''}`}
                    onClick={() => onTabChange('document')}
                >
                    Document
                </button>
                <button
                    type="button"
                    className={`dms-tab-btn ${activeTab === 'version_history' ? 'active' : ''}`}
                    onClick={() => onTabChange('version_history')}
                >
                    Version History
                </button>
                <button
                    type="button"
                    className={`dms-tab-btn ${activeTab === 'activity_log' ? 'active' : ''}`}
                    onClick={() => onTabChange('activity_log')}
                >
                    Activity Log
                </button>
                <button
                    type="button"
                    className={`dms-tab-btn ${activeTab === 'references' ? 'active' : ''}`}
                    onClick={() => onTabChange('references')}
                >
                    References
                </button>
            </div>
        </header>
    );
}
