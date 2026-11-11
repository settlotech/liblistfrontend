import React, { useState, useEffect } from 'react';
import { X, GitCommit, RotateCcw, Scale, Calendar, User } from 'lucide-react';
import { documentManagementApi } from '../../services/api/documentManagementApi';

export default function VersionHistoryModal({
    isOpen,
    onClose,
    documentId,
    currentVersionId,
    onRestoreVersion,
    onCompareVersions
}) {
    const [versions, setVersions] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (isOpen && documentId) {
            setIsLoading(true);
            documentManagementApi.getVersions(documentId).then((res) => {
                if (res?.data?.versions) {
                    setVersions(res.data.versions);
                } else if (Array.isArray(res?.data)) {
                    setVersions(res.data);
                }
            }).catch(console.error).finally(() => setIsLoading(false));
        }
    }, [isOpen, documentId]);

    if (!isOpen) return null;

    return (
        <div className="dms-modal-overlay">
            <div className="dms-modal-card" style={{ maxWidth: '600px' }}>
                <div className="dms-modal-header">
                    <h3 className="dms-modal-title">Git-like Version Commit Log</h3>
                    <button type="button" className="dms-annot-close-btn" onClick={onClose}>
                        <X size={16} />
                    </button>
                </div>

                <div className="dms-modal-body">
                    {isLoading ? (
                        <p style={{ textAlign: 'center', color: '#94a3b8' }}>Loading commits...</p>
                    ) : versions.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>
                            <p>No commits recorded yet. Make edits and click "Commit Changes" to snapshot your first version.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {versions.map((ver) => {
                                const isCurrent = ver.id === currentVersionId;
                                const commitHash = ver.commit_hash ? ver.commit_hash.slice(0, 8) : 'init';
                                const commitDate = ver.created_at || ver.committed_at
                                    ? new Date(ver.created_at || ver.committed_at).toLocaleString()
                                    : 'Recent';

                                return (
                                    <div
                                        key={ver.id}
                                        style={{
                                            padding: '12px 14px',
                                            borderRadius: '8px',
                                            border: `1.5px solid ${isCurrent ? 'var(--dms-primary)' : '#e2e8f0'}`,
                                            background: isCurrent ? '#f0f7ff' : '#ffffff',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            gap: '12px'
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                                            <GitCommit size={18} style={{ color: isCurrent ? 'var(--dms-primary)' : '#64748b', marginTop: '2px' }} />
                                            <div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <span style={{ fontWeight: 700, fontSize: '13px', color: '#0f172a' }}>
                                                        Version v{ver.version_number}
                                                    </span>
                                                    <span className="dms-meta-commit">{commitHash}</span>
                                                    {isCurrent && (
                                                        <span className="dms-version-badge" style={{ fontSize: '10px' }}>
                                                            Current Active
                                                        </span>
                                                    )}
                                                </div>
                                                <p style={{ fontSize: '12.5px', color: '#334155', margin: '3px 0' }}>
                                                    {ver.commit_message || 'Periodic operational snapshot'}
                                                </p>
                                                <div style={{ fontSize: '11px', color: '#94a3b8', display: 'flex', gap: '12px' }}>
                                                    <span>{commitDate}</span>
                                                    {ver.section_count && <span>{ver.section_count} sections</span>}
                                                </div>
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <button
                                                type="button"
                                                className="dms-btn-outline"
                                                style={{ padding: '4px 8px', fontSize: '11.5px' }}
                                                onClick={() => onCompareVersions(ver.id)}
                                                title="Compare against active version"
                                            >
                                                <Scale size={12} />
                                                Compare
                                            </button>
                                            {!isCurrent && (
                                                <button
                                                    type="button"
                                                    className="dms-btn-outline"
                                                    style={{ padding: '4px 8px', fontSize: '11.5px', color: '#0284c7' }}
                                                    onClick={() => onRestoreVersion(ver.id)}
                                                    title="Restore document to this version"
                                                >
                                                    <RotateCcw size={12} />
                                                    Restore
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div className="dms-modal-footer">
                    <button type="button" className="dms-btn-outline" onClick={onClose}>
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
