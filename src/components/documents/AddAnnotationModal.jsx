import React, { useState, useEffect } from 'react';
import { X, Tag, Hash, FileText } from 'lucide-react';

export default function AddAnnotationModal({
    isOpen,
    onClose,
    onSave,
    sections = [],
    initialData = null,
    initialSectionId = null,
    defaultCategory = 'ACTION',
    anchorCoordinates = null,
    selectedText = ''
}) {
    const [category, setCategory] = useState(defaultCategory);
    const [annotationText, setAnnotationText] = useState(selectedText || '');
    const [sectionId, setSectionId] = useState(initialSectionId || sections[0]?.id || '');
    const [referenceCode, setReferenceCode] = useState('');

    useEffect(() => {
        if (initialData) {
            setCategory(initialData.category || 'ACTION');
            setAnnotationText(initialData.annotation_text || '');
            setSectionId(initialData.section_id || initialSectionId || sections[0]?.id || '');
            setReferenceCode(initialData.reference_code || '');
        } else {
            setCategory(defaultCategory);
            setAnnotationText(selectedText || '');
            setSectionId(initialSectionId || sections[0]?.id || '');
            // Auto generate next REF code if creating new
            const randomCode = `REF-${String(Math.floor(Math.random() * 900) + 100)}`;
            setReferenceCode(randomCode);
        }
    }, [initialData, initialSectionId, defaultCategory, selectedText, sections, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!annotationText.trim()) return;

        const payload = {
            section_id: sectionId || null,
            annotation_type: anchorCoordinates ? 'IMAGE' : 'TEXT',
            category,
            annotation_text: annotationText.trim(),
            reference_code: referenceCode.trim() || null,
            anchor_data: anchorCoordinates || (selectedText ? { selected_text: selectedText } : {})
        };

        if (initialData?.id) {
            payload.id = initialData.id;
        }

        onSave(payload);
    };

    return (
        <div className="dms-modal-overlay">
            <div className="dms-modal-card" style={{ maxWidth: '520px' }}>
                <div className="dms-modal-header">
                    <h3 className="dms-modal-title">
                        {initialData ? 'Edit Annotation' : 'Add New Annotation'}
                    </h3>
                    <button
                        type="button"
                        className="dms-annot-close-btn"
                        onClick={onClose}
                    >
                        <X size={16} />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="dms-modal-body">
                        {/* Selected Text preview if any */}
                        {selectedText && (
                            <div
                                style={{
                                    background: '#f8fafc',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '6px',
                                    padding: '8px 12px',
                                    fontSize: '12px',
                                    color: '#475569',
                                    fontStyle: 'italic'
                                }}
                            >
                                Selected Text: "{selectedText}"
                            </div>
                        )}

                        {/* Category selection (Requirement 5 in Image 2) */}
                        <div className="dms-form-group">
                            <label className="dms-form-label">Annotation Category</label>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                                {[
                                    { id: 'ACTION', label: 'Action Item', color: '#ef4444' },
                                    { id: 'NOTES', label: 'Notes / Comment', color: '#3b82f6' },
                                    { id: 'CDE', label: 'Critical Data Element (CDE)', color: '#8b5cf6' },
                                    { id: 'REGULATORY', label: 'Regulatory Tag', color: '#10b981' },
                                    { id: 'REVISION', label: 'Revision Requirement', color: '#f59e0b' }
                                ].map((cat) => (
                                    <button
                                        key={cat.id}
                                        type="button"
                                        onClick={() => setCategory(cat.id)}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            padding: '8px 10px',
                                            borderRadius: '6px',
                                            border: `1.5px solid ${category === cat.id ? cat.color : '#e2e8f0'}`,
                                            background: category === cat.id ? `${cat.color}10` : '#ffffff',
                                            color: '#0f172a',
                                            fontSize: '12px',
                                            fontWeight: 600,
                                            cursor: 'pointer'
                                        }}
                                    >
                                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: cat.color }} />
                                        <span>{cat.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Annotation text */}
                        <div className="dms-form-group">
                            <label className="dms-form-label">Note / Annotation Content</label>
                            <textarea
                                className="dms-form-textarea"
                                value={annotationText}
                                onChange={(e) => setAnnotationText(e.target.value)}
                                placeholder="E.g., User authentication is mandatory..."
                                required
                            />
                        </div>

                        {/* Reference code (Automatic Reference Creation - Image 2 Requirement 4) */}
                        <div className="dms-form-group">
                            <label className="dms-form-label">Automatic Reference Code</label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                {/* <input
                                    type="text"
                                    className="dms-form-input"
                                    value={referenceCode}
                                    onChange={(e) => setReferenceCode(e.target.value)}
                                    placeholder="e.g. REF-001"
                                /> */}
                                <span className="dms-ref-pill" style={{ padding: '6px 10px', fontSize: '11px' }}>
                                    {referenceCode || 'REF-XXX'}
                                </span>
                            </div>
                        </div>

                        {/* Section Selection */}
                        {sections.length > 0 && (
                            <div className="dms-form-group">
                                <label className="dms-form-label">Associated Section</label>
                                <select
                                    className="dms-form-select"
                                    value={sectionId}
                                    onChange={(e) => setSectionId(e.target.value)}
                                >
                                    {sections.map((sec, idx) => (
                                        <option key={sec.id || idx} value={sec.id}>
                                            {sec.section_number || `${idx + 1}.0`} {sec.section_title}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>

                    <div className="dms-modal-footer">
                        <button
                            type="button"
                            className="dms-btn-outline"
                            onClick={onClose}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="dms-btn-primary"
                        >
                            {initialData ? 'Update Annotation' : 'Create Annotation'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
