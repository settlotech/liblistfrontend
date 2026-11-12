import React, { useState, useEffect } from 'react';
import { History as HistoryIcon, ShieldAlert, FileText, User } from 'lucide-react';
import { documentManagementApi } from '../../services/api/documentManagementApi';

export default function ActivityLogView({ documentId }) {
    const [activities, setActivities] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (documentId) {
            setIsLoading(true);
            documentManagementApi.getDocumentActivity(documentId).then((res) => {
                if (res?.data) {
                    setActivities(Array.isArray(res.data) ? res.data : res.data.activities || []);
                }
            }).catch(console.error).finally(() => setIsLoading(false));
        }
    }, [documentId]);

    return (
        <div className="dms-editor-area">
            <div className="dms-paper" style={{ padding: '32px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                    <HistoryIcon size={20} style={{ color: 'var(--dms-primary)' }} />
                    <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: '#0f172a' }}>
                        Document Audit Trail & Activity Log
                    </h2>
                </div>

                {isLoading ? (
                    <p style={{ textAlign: 'center', color: '#94a3b8', padding: '32px' }}>Loading activity logs...</p>
                ) : activities.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                        No activity records found yet. All section updates, annotations, and commits will be logged here.
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {activities.map((act) => {
                            const dateStr = act.created_at
                                ? new Date(act.created_at).toLocaleString()
                                : 'Recent';
                            const eventType = act.event_type || act.activity_type || 'ACTIVITY';
                            const desc = act.details?.description || act.description || `Event: ${eventType}`;

                            return (
                                <div
                                    key={act.id}
                                    style={{
                                        padding: '10px 14px',
                                        borderRadius: '6px',
                                        border: '1px solid #e2e8f0',
                                        background: '#ffffff',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        fontSize: '12.5px'
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <span className="dms-ref-pill" style={{ background: '#f1f5f9', color: '#334155' }}>
                                            {eventType}
                                        </span>
                                        <span style={{ color: '#0f172a', fontWeight: 500 }}>{desc}</span>
                                    </div>
                                    <span style={{ color: '#94a3b8', fontSize: '11.5px' }}>{dateStr}</span>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
