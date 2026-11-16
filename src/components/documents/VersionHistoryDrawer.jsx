import React, { useEffect, useState } from 'react';
import { X, GitBranch, Clock, User, History } from 'lucide-react';
import { documentManagementApi } from '../../services/api/documentManagementApi';
import './versionHistoryDrawer.css';

export default function VersionHistoryDrawer({ docId, currentVersionId, isOpen, onClose, onSelectVersion }) {
    const [versions, setVersions] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!isOpen || !docId) return;
        setIsLoading(true);
        documentManagementApi.getVersionHistory(docId)
            .then(res => setVersions(res?.data || []))
            .catch(err => console.error('Failed to load versions:', err))
            .finally(() => setIsLoading(false));
    }, [isOpen, docId]);

    if (!isOpen) return null;

    const formatDate = (dateStr) => {
        if (!dateStr) return '—';
        return new Date(dateStr).toLocaleDateString('en-GB', {
            day: '2-digit', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    const tagColor = (tag) => {
        if (tag === 'active') return '#16a34a';
        if (tag === 'revision') return '#d97706';
        if (tag === 'draft') return '#6366f1';
        if (tag === 'rejected') return '#dc2626';
        return '#64748b';
    };

    return (
        <div className="vh-drawer-overlay" onClick={onClose}>
            <div className="vh-drawer" onClick={e => e.stopPropagation()}>
                <div className="vh-drawer-header">
                    <div className="vh-drawer-title">
                        <GitBranch size={16} />
                        <span>Version History</span>
                    </div>
                    <button className="vh-close-btn" onClick={onClose}><X size={16} /></button>
                </div>

                <div className="vh-drawer-body">
                    {isLoading ? (
                        <div className="vh-loading">Loading versions...</div>
                    ) : versions.length === 0 ? (
                        <div className="vh-empty">
                            <History size={32} style={{ marginBottom: '10px', color: '#cbd5e1' }} />
                            <div>No version history yet.</div>
                            <div style={{ fontSize: '11px', marginTop: '6px' }}>Approve a policy to create the first version snapshot.</div>
                        </div>
                    ) : (
                        <div className="vh-timeline">
                            {versions.map((v, idx) => (
                                <div
                                    key={v.id}
                                    className={`vh-entry ${v.id === currentVersionId ? 'current' : ''}`}
                                    onClick={() => onSelectVersion(v)}
                                >
                                    <div className="vh-entry-line">
                                        <div className="vh-dot" style={{ background: tagColor(v.version_tag), boxShadow: `0 0 0 2px ${tagColor(v.version_tag)}33` }} />
                                        {idx < versions.length - 1 && <div className="vh-line" />}
                                    </div>
                                    <div className="vh-entry-content">
                                        <div className="vh-entry-top">
                                            <span className="vh-version-num">v{v.version_number}</span>
                                            <span className="vh-tag" style={{ color: tagColor(v.version_tag), borderColor: `${tagColor(v.version_tag)}55` }}>
                                                {v.version_tag || 'draft'}
                                            </span>
                                            {v.id === currentVersionId && (
                                                <span className="vh-current-badge">Current</span>
                                            )}
                                        </div>
                                        <div className="vh-commit-msg">{v.commit_message || 'No commit message'}</div>
                                        <div className="vh-meta">
                                            <span><User size={11} /> {v.committed_by_name || 'Unknown'}</span>
                                            <span><Clock size={11} /> {formatDate(v.committed_at)}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
