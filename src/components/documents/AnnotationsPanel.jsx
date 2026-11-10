import React, { useState, useMemo } from 'react';
import {
    Tag,
    X,
    User,
    Pencil,
    Trash2,
    Plus,
    ChevronDown,
    ExternalLink
} from 'lucide-react';

export default function AnnotationsPanel({
    annotations = [],
    isOpen = true,
    onClose,
    onAddAnnotationClick,
    onEditAnnotation,
    onDeleteAnnotation,
    onSelectAnnotation
}) {
    const [activeFilter, setActiveFilter] = useState('ALL');

    // Counts for filter pills
    const counts = useMemo(() => {
        let notes = 0;
        let actions = 0;
        let references = 0;

        annotations.forEach((ann) => {
            const cat = (ann.category || ann.annotation_type || '').toUpperCase();
            if (cat === 'NOTES' || cat === 'NOTE') notes++;
            if (cat === 'ACTION' || cat === 'ACTIONS') actions++;
            if (ann.reference_code) references++;
        });

        return {
            all: annotations.length,
            notes,
            actions,
            references
        };
    }, [annotations]);

    // Filtered list
    const filteredAnnotations = useMemo(() => {
        if (activeFilter === 'ALL') return annotations;
        if (activeFilter === 'NOTES') {
            return annotations.filter((a) => (a.category || '').toUpperCase().includes('NOTE'));
        }
        if (activeFilter === 'ACTIONS') {
            return annotations.filter((a) => (a.category || '').toUpperCase().includes('ACTION'));
        }
        if (activeFilter === 'REFERENCES') {
            return annotations.filter((a) => Boolean(a.reference_code));
        }
        return annotations;
    }, [annotations, activeFilter]);

    if (!isOpen) return null;

    const getBadgeStyle = (category, idx) => {
        const cat = (category || '').toUpperCase();
        if (cat.includes('ACTION')) return { card: 'card-red', badge: 'badge-red', pill: 'pill-red', label: 'Action' };
        if (cat.includes('NOTE')) return { card: 'card-blue', badge: 'badge-blue', pill: 'pill-blue', label: 'Note' };
        if (cat.includes('CDE')) return { card: 'card-purple', badge: 'badge-purple', pill: 'pill-purple', label: 'CDE' };
        return { card: 'card-yellow', badge: 'badge-yellow', pill: 'pill-yellow', label: 'Action' };
    };

    return (
        <aside className="dms-annotations-panel" aria-label="Document Annotations">
            {/* Header */}
            <div className="dms-annot-header">
                <div className="dms-annot-title">
                    <Tag size={16} style={{ color: 'var(--dms-primary)' }} />
                    <span>Annotations</span>
                </div>
                <button
                    type="button"
                    className="dms-annot-close-btn"
                    onClick={onClose}
                    title="Close Annotations panel"
                >
                    <X size={15} />
                </button>
            </div>

            {/* Filter Tabs (Image 1) */}
            <div className="dms-annot-filters">
                <button
                    type="button"
                    className={`dms-filter-tab ${activeFilter === 'ALL' ? 'active' : ''}`}
                    onClick={() => setActiveFilter('ALL')}
                >
                    All ({counts.all})
                </button>
                <button
                    type="button"
                    className={`dms-filter-tab ${activeFilter === 'NOTES' ? 'active' : ''}`}
                    onClick={() => setActiveFilter('NOTES')}
                >
                    Notes ({counts.notes})
                </button>
                <button
                    type="button"
                    className={`dms-filter-tab ${activeFilter === 'ACTIONS' ? 'active' : ''}`}
                    onClick={() => setActiveFilter('ACTIONS')}
                >
                    Actions ({counts.actions})
                </button>
                <button
                    type="button"
                    className={`dms-filter-tab ${activeFilter === 'REFERENCES' ? 'active' : ''}`}
                    onClick={() => setActiveFilter('REFERENCES')}
                >
                    References ({counts.references})
                </button>
            </div>

            {/* Annotations List */}
            <div className="dms-annot-list">
                {filteredAnnotations.length === 0 ? (
                    <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: '13px', padding: '32px 16px' }}>
                        No annotations found in this category. Click below to add one!
                    </div>
                ) : (
                    filteredAnnotations.map((ann, index) => {
                        const style = getBadgeStyle(ann.category, index);
                        const markerNum = ann.marker_number || index + 1;
                        const dateFormatted = ann.created_at
                            ? new Date(ann.created_at).toLocaleString('en-GB', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                              })
                            : '10 Nov 2026, 10:15 AM';

                        return (
                            <div
                                key={ann.id || `ann-${index}`}
                                className={`dms-annot-card ${style.card}`}
                                onClick={() => onSelectAnnotation && onSelectAnnotation(ann)}
                            >
                                {/* Card Top Row: Marker Number + Category Pill */}
                                <div className="dms-annot-card-top">
                                    <span className={`dms-card-badge ${style.badge}`}>
                                        {markerNum}
                                    </span>
                                    <span className={`dms-category-pill ${style.pill}`}>
                                        {ann.category || style.label}
                                    </span>
                                </div>

                                {/* Body Row: Thumbnail + Text */}
                                <div className="dms-annot-body-row">
                                    {ann.thumbnail_url && (
                                        <img
                                            src={ann.thumbnail_url}
                                            alt="Crop snippet"
                                            className="dms-annot-thumb"
                                        />
                                    )}
                                    <p className="dms-annot-text">{ann.annotation_text}</p>
                                </div>

                                {/* Footer Row: Author, Ref Code Pill & Actions */}
                                <div className="dms-annot-footer">
                                    <div className="dms-annot-author">
                                        <User size={12} />
                                        <span>{ann.author_name} • {dateFormatted}</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        {ann.reference_code && (
                                            <span className="dms-ref-pill" title="Automatic Generated Reference Code">
                                                {ann.reference_code}
                                            </span>
                                        )}
                                        <div className="dms-card-actions">
                                            <button
                                                type="button"
                                                className="dms-card-action-btn"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onEditAnnotation && onEditAnnotation(ann);
                                                }}
                                                title="Edit annotation"
                                            >
                                                <Pencil size={12} />
                                            </button>
                                            <button
                                                type="button"
                                                className="dms-card-action-btn btn-delete"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onDeleteAnnotation && onDeleteAnnotation(ann.id);
                                                }}
                                                title="Delete annotation"
                                            >
                                                <Trash2 size={12} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Bottom Add Annotation CTA (Image 1) */}
            <div className="dms-annot-cta">
                <button
                    type="button"
                    className="dms-btn-full"
                    onClick={onAddAnnotationClick}
                >
                    <Plus size={15} />
                    <span>Add Annotation</span>
                    <ChevronDown size={13} style={{ marginLeft: 'auto' }} />
                </button>
            </div>
        </aside>
    );
}
