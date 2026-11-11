import React, { useState, useEffect } from 'react';
import { Tag, ExternalLink, Bookmark } from 'lucide-react';
import { documentManagementApi } from '../../services/api/documentManagementApi';

export default function ReferencesView({ documentId, annotations = [], onNavigateToAnnotation }) {
    const [references, setReferences] = useState([]);

    useEffect(() => {
        // Collect all annotations that have reference_code
        const refList = annotations.filter((a) => Boolean(a.reference_code));
        setReferences(refList);
    }, [annotations]);

    return (
        <div className="dms-editor-area">
            <div className="dms-paper" style={{ padding: '32px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                    <Bookmark size={20} style={{ color: 'var(--dms-primary)' }} />
                    <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: '#0f172a' }}>
                        Document References Register
                    </h2>
                </div>

                <p style={{ fontSize: '12.5px', color: '#64748b', marginBottom: '20px' }}>
                    Automatic references generated from image hotspots and text annotations across document sections.
                </p>

                {references.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                        No references generated yet. Add annotations to automatically assign reference codes (REF-001, REF-002...).
                    </div>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left', color: '#475569' }}>
                                <th style={{ padding: '10px 12px' }}>Reference Code</th>
                                <th style={{ padding: '10px 12px' }}>Category</th>
                                <th style={{ padding: '10px 12px' }}>Description / Requirement</th>
                                <th style={{ padding: '10px 12px' }}>Target Anchor</th>
                                <th style={{ padding: '10px 12px', textAlign: 'right' }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {references.map((ref, idx) => (
                                <tr key={ref.id || idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                    <td style={{ padding: '12px' }}>
                                        <span className="dms-ref-pill">
                                            {ref.reference_code}
                                        </span>
                                    </td>
                                    <td style={{ padding: '12px' }}>
                                        <span className="dms-category-pill pill-blue">
                                            {ref.category || 'ACTION'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '12px', color: '#0f172a', fontWeight: 500 }}>
                                        {ref.annotation_text}
                                    </td>
                                    <td style={{ padding: '12px', color: '#64748b', fontSize: '12px' }}>
                                        {ref.annotation_type === 'IMAGE' ? 'Workflow Image Diagram' : 'Section Text Content'}
                                    </td>
                                    <td style={{ padding: '12px', textAlign: 'right' }}>
                                        <button
                                            type="button"
                                            className="dms-btn-outline"
                                            style={{ padding: '4px 10px', fontSize: '11.5px' }}
                                            onClick={() => onNavigateToAnnotation && onNavigateToAnnotation(ref)}
                                        >
                                            <ExternalLink size={12} />
                                            View
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
