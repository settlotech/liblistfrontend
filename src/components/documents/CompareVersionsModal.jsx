import React, { useState, useEffect } from 'react';
import { X, Scale, ArrowRight, CheckCircle, AlertCircle } from 'lucide-react';
import { documentManagementApi } from '../../services/api/documentManagementApi';

export default function CompareVersionsModal({
    isOpen,
    onClose,
    documentId,
    v1Id,
    v2Id
}) {
    const [diffData, setDiffData] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (isOpen && v1Id && v2Id) {
            setIsLoading(true);
            documentManagementApi.compareVersions(v1Id, v2Id).then((res) => {
                if (res?.data) {
                    setDiffData(res.data);
                }
            }).catch(console.error).finally(() => setIsLoading(false));
        }
    }, [isOpen, v1Id, v2Id]);

    if (!isOpen) return null;

    return (
        <div className="dms-modal-overlay">
            <div className="dms-modal-card" style={{ maxWidth: '750px' }}>
                <div className="dms-modal-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Scale size={18} style={{ color: 'var(--dms-primary)' }} />
                        <h3 className="dms-modal-title">Version Comparison & Diff</h3>
                    </div>
                    <button type="button" className="dms-annot-close-btn" onClick={onClose}>
                        <X size={16} />
                    </button>
                </div>

                <div className="dms-modal-body">
                    {isLoading ? (
                        <p style={{ textAlign: 'center', color: '#94a3b8', padding: '24px' }}>
                            Computing Git-like tree diff...
                        </p>
                    ) : diffData ? (
                        <div>
                            {/* Summary bar */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '16px' }}>
                                <div style={{ padding: '8px 12px', background: '#dcfce7', borderRadius: '6px', textAlign: 'center' }}>
                                    <span style={{ fontSize: '11px', color: '#15803d', fontWeight: 600 }}>Added</span>
                                    <div style={{ fontSize: '16px', fontWeight: 700, color: '#166534' }}>
                                        {diffData.summary?.added_count || 0}
                                    </div>
                                </div>
                                <div style={{ padding: '8px 12px', background: '#e0f2fe', borderRadius: '6px', textAlign: 'center' }}>
                                    <span style={{ fontSize: '11px', color: '#0369a1', fontWeight: 600 }}>Updated</span>
                                    <div style={{ fontSize: '16px', fontWeight: 700, color: '#075985' }}>
                                        {diffData.summary?.updated_count || 0}
                                    </div>
                                </div>
                                <div style={{ padding: '8px 12px', background: '#fee2e2', borderRadius: '6px', textAlign: 'center' }}>
                                    <span style={{ fontSize: '11px', color: '#b91c1c', fontWeight: 600 }}>Deleted</span>
                                    <div style={{ fontSize: '16px', fontWeight: 700, color: '#991b1b' }}>
                                        {diffData.summary?.deleted_count || 0}
                                    </div>
                                </div>
                                <div style={{ padding: '8px 12px', background: '#f1f5f9', borderRadius: '6px', textAlign: 'center' }}>
                                    <span style={{ fontSize: '11px', color: '#475569', fontWeight: 600 }}>Unchanged</span>
                                    <div style={{ fontSize: '16px', fontWeight: 700, color: '#334155' }}>
                                        {diffData.summary?.unchanged_count || 0}
                                    </div>
                                </div>
                            </div>

                            {/* Changes list */}
                            <div style={{ maxHeight: '280px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px' }}>
                                {diffData.changes?.updated?.map((ch, idx) => (
                                    <div key={idx} style={{ padding: '8px', borderBottom: '1px solid #f1f5f9' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', fontWeight: 600, color: '#0369a1' }}>
                                            <span>[UPDATED]</span>
                                            <span>{ch.section_title}</span>
                                        </div>
                                        <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px', fontFamily: 'monospace' }}>
                                            Hash: {ch.old_hash?.slice(0, 8)} -&gt; {ch.new_hash?.slice(0, 8)}
                                        </div>
                                    </div>
                                ))}

                                {diffData.changes?.added?.map((ch, idx) => (
                                    <div key={idx} style={{ padding: '8px', borderBottom: '1px solid #f1f5f9' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', fontWeight: 600, color: '#15803d' }}>
                                            <span>[ADDED]</span>
                                            <span>{ch.section_title}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <p style={{ textAlign: 'center', color: '#64748b' }}>Select two versions to view diff.</p>
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
