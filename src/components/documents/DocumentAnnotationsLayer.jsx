import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
    Crop,
    FileText,
    MessageSquare,
    Trash2,
    X,
    Check,
    Tag,
    User,
    Clock,
    Plus,
    Palette,
    Search
} from 'lucide-react';
import { documentManagementApi } from '../../services/api/documentManagementApi';
import './annotations.css';

const PRESET_COLORS = [
    { label: 'Deep Blue', value: '#0057B8' },
    { label: 'Ruby Red', value: '#dc2626' },
    { label: 'Emerald Green', value: '#16a34a' },
    { label: 'Amber Yellow', value: '#d97706' },
    { label: 'Purple Violet', value: '#9333ea' },
    { label: 'Teal Cyan', value: '#0891b2' },
];

const PREDEFINED_NOTE_CATEGORIES = [
    { key: 'NOTES', label: 'General Note', color: '#d97706', description: 'General observation or commentary' },
    { key: 'COMPLIANCE', label: 'Compliance / APRA', color: '#dc2626', description: 'Statutory, regulatory, or policy rule compliance' },
    { key: 'RISK', label: 'Risk & Control', color: '#b91c1c', description: 'Operational, financial, or cyber risk area' },
    { key: 'ACTION', label: 'Action Required', color: '#0057B8', description: 'Follow-up or operational task required' },
    { key: 'AUDIT', label: 'Audit Finding', color: '#9333ea', description: 'Internal or external audit observation' },
    { key: 'EXCEPTION', label: 'Policy Exception', color: '#ea580c', description: 'Approved or requested policy departure' },
    { key: 'REVISION', label: 'Revision Suggestion', color: '#16a34a', description: 'Recommended wording or clause update' },
];

export default function DocumentAnnotationsLayer({
    documentId,
    versionId,
    currentUser,
    children,
    onAnnotationsCountChange,
    targetAnnotationId = null,
    isDrawerOpen = false,
    onCloseDrawer,
    onOpenDrawer,
}) {
    const [annotations, setAnnotations] = useState([]);
    const [activeAnnotationId, setActiveAnnotationId] = useState(targetAnnotationId);

    // Drawer Filter & Search State
    const [filterTab, setFilterTab] = useState('ALL'); // 'ALL' | 'TEXT' | 'IMAGE'
    const [searchQuery, setSearchQuery] = useState('');

    // Context Menu State
    const [contextMenu, setContextMenu] = useState(null); // { x, y, relX, relY }

    // Snipping / Drag Tool State
    const [isSnippingMode, setIsSnippingMode] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState(null); // { x, y } in %
    const [currentDragBox, setCurrentDragBox] = useState(null); // { x, y, width, height } in %

    // Dialog Modal State for Creating/Editing Annotation or Note
    const [modalData, setModalData] = useState(null);
    const [modalType, setModalType] = useState('IMAGE'); // 'IMAGE' (Annotation) or 'TEXT' (Note)
    const [labelText, setLabelText] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('NOTES');
    const [description, setDescription] = useState('');
    const [selectedColor, setSelectedColor] = useState('#0057B8');
    const [isSaving, setIsSaving] = useState(false);

    const containerRef = useRef(null);
    const contextMenuRef = useRef(null);

    // Load Annotations from Backend
    const loadAnnotations = useCallback(async () => {
        if (!documentId) return;
        try {
            const res = await documentManagementApi.getAnnotations(documentId, {
                version_id: versionId || undefined,
            });
            const list = res?.data || [];
            setAnnotations(list);
            if (onAnnotationsCountChange) onAnnotationsCountChange(list.length);
        } catch (err) {
            console.error('Failed to load annotations:', err);
        }
    }, [documentId, versionId, onAnnotationsCountChange]);

    useEffect(() => {
        loadAnnotations();
    }, [loadAnnotations]);

    // Auto-scroll and highlight target annotation when passed from URL
    useEffect(() => {
        if (!targetAnnotationId || annotations.length === 0) return;
        setActiveAnnotationId(targetAnnotationId);

        // Scroll into view
        const timer = setTimeout(() => {
            const el = document.getElementById(`annot-item-${targetAnnotationId}`);
            if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }, 400);

        return () => clearTimeout(timer);
    }, [targetAnnotationId, annotations]);

    const notesCount = useMemo(() => annotations.filter(a => a.annotation_type === 'TEXT').length, [annotations]);
    const visualCount = useMemo(() => annotations.filter(a => a.annotation_type === 'IMAGE').length, [annotations]);

    const filteredAnnotations = useMemo(() => {
        return annotations.filter(ann => {
            if (filterTab === 'TEXT' && ann.annotation_type !== 'TEXT') return false;
            if (filterTab === 'IMAGE' && ann.annotation_type !== 'IMAGE') return false;
            if (!searchQuery.trim()) return true;
            const q = searchQuery.toLowerCase().trim();
            const matchText = (ann.annotation_text || '').toLowerCase().includes(q);
            const matchLabel = (ann.label || '').toLowerCase().includes(q);
            const matchQuote = (ann.anchor_data?.selectedText || '').toLowerCase().includes(q);
            return matchText || matchLabel || matchQuote;
        });
    }, [annotations, filterTab, searchQuery]);

    // Handle Right Click on Container
    const handleContextMenu = (e) => {
        e.preventDefault();
        if (isSnippingMode) return;

        const rect = containerRef.current.getBoundingClientRect();
        const clientX = e.clientX;
        const clientY = e.clientY;

        // Capture any selected text from window selection
        let selectedText = '';
        const selection = window.getSelection();
        if (selection && selection.toString().trim()) {
            selectedText = selection.toString().trim();
        }

        // Calculate relative coordinates in percentage (0 - 100%)
        const relX = ((clientX - rect.left) / rect.width) * 100;
        const relY = ((clientY - rect.top) / rect.height) * 100;

        // Viewport collision detection & boundary flip
        const estimatedMenuWidth = 260;
        const estimatedMenuHeight = 420;
        const screenPadding = 16;

        let screenX = clientX;
        let screenY = clientY;

        // If context menu extends past the bottom of the viewport, flip it upwards
        if (clientY + estimatedMenuHeight > window.innerHeight - screenPadding) {
            screenY = Math.max(screenPadding, clientY - estimatedMenuHeight);
        }

        // If context menu extends past the right of the viewport, flip it leftwards
        if (clientX + estimatedMenuWidth > window.innerWidth - screenPadding) {
            screenX = Math.max(screenPadding, clientX - estimatedMenuWidth);
        }

        setContextMenu({
            screenX,
            screenY,
            relX: Math.max(0, Math.min(100, relX)),
            relY: Math.max(0, Math.min(100, relY)),
            selectedText,
        });
    };

    // Keep Context Menu strictly within visible screen bounds
    useEffect(() => {
        if (!contextMenu || !contextMenuRef.current) return;
        const el = contextMenuRef.current;
        const rect = el.getBoundingClientRect();
        const screenPadding = 12;

        let adjusted = false;
        let newX = contextMenu.screenX;
        let newY = contextMenu.screenY;

        if (rect.bottom > window.innerHeight - screenPadding) {
            newY = Math.max(screenPadding, window.innerHeight - rect.height - screenPadding);
            adjusted = true;
        }
        if (rect.top < screenPadding) {
            newY = screenPadding;
            adjusted = true;
        }
        if (rect.right > window.innerWidth - screenPadding) {
            newX = Math.max(screenPadding, window.innerWidth - rect.width - screenPadding);
            adjusted = true;
        }
        if (rect.left < screenPadding) {
            newX = screenPadding;
            adjusted = true;
        }

        if (adjusted && (newX !== contextMenu.screenX || newY !== contextMenu.screenY)) {
            setContextMenu(prev => prev ? { ...prev, screenX: newX, screenY: newY } : null);
        }
    }, [contextMenu]);

    // Close Context Menu on outside click
    useEffect(() => {
        const handleClick = () => setContextMenu(null);
        window.addEventListener('click', handleClick);
        return () => window.removeEventListener('click', handleClick);
    }, []);

    // Start Annotation (Snipping Tool Mode)
    const handleStartAnnotation = () => {
        setContextMenu(null);
        setIsSnippingMode(true);
    };

    // Start Note (Textual Pin with Predefined Category and Selected Text)
    const handleStartNote = (categoryKey = 'NOTES') => {
        const cat = PREDEFINED_NOTE_CATEGORIES.find(c => c.key === categoryKey) || PREDEFINED_NOTE_CATEGORIES[0];
        const coords = contextMenu ? { x: contextMenu.relX, y: contextMenu.relY } : { x: 50, y: 50 };
        const selectedText = contextMenu?.selectedText || '';

        setContextMenu(null);
        setModalType('TEXT');
        setSelectedCategory(cat.key);
        setLabelText(cat.label);
        setDescription('');
        setSelectedColor(cat.color);
        setModalData({
            anchor_data: {
                ...coords,
                selectedText,
            },
        });
    };

    // Mouse events for Snipping Drag
    const handleMouseDown = (e) => {
        if (!isSnippingMode) return;
        const rect = containerRef.current.getBoundingClientRect();
        const startX = ((e.clientX - rect.left) / rect.width) * 100;
        const startY = ((e.clientY - rect.top) / rect.height) * 100;

        setIsDragging(true);
        setDragStart({ x: startX, y: startY });
        setCurrentDragBox({ x: startX, y: startY, width: 0, height: 0 });
    };

    const handleMouseMove = (e) => {
        if (!isSnippingMode || !isDragging || !dragStart) return;
        const rect = containerRef.current.getBoundingClientRect();
        const currentX = ((e.clientX - rect.left) / rect.width) * 100;
        const currentY = ((e.clientY - rect.top) / rect.height) * 100;

        const x = Math.min(dragStart.x, currentX);
        const y = Math.min(dragStart.y, currentY);
        const width = Math.abs(currentX - dragStart.x);
        const height = Math.abs(currentY - dragStart.y);

        setCurrentDragBox({
            x: Math.max(0, x),
            y: Math.max(0, y),
            width: Math.min(100 - x, width),
            height: Math.min(100 - y, height),
        });
    };

    const handleMouseUp = () => {
        if (!isSnippingMode || !isDragging) return;
        setIsDragging(false);
        setIsSnippingMode(false);

        // Require minimum box size (at least 2% width/height to avoid tiny accidental clicks)
        if (currentDragBox && currentDragBox.width > 2 && currentDragBox.height > 2) {
            setModalType('IMAGE');
            setLabelText('Annotation');
            setDescription('');
            setSelectedColor('#0057B8');
            setModalData({
                anchor_data: {
                    x: currentDragBox.x,
                    y: currentDragBox.y,
                    width: currentDragBox.width,
                    height: currentDragBox.height,
                    shape: 'RECTANGLE',
                },
            });
        }
        setCurrentDragBox(null);
        setDragStart(null);
    };

    // Save Annotation or Note
    const handleSaveAnnotation = async () => {
        if (!description.trim()) return;
        setIsSaving(true);
        try {
            await documentManagementApi.createAnnotation(documentId, {
                version_id: versionId || null,
                annotation_type: modalType,
                category: modalType === 'TEXT' ? selectedCategory : 'ACTION',
                anchor_data: modalData.anchor_data,
                label: labelText.trim() || (modalType === 'IMAGE' ? 'Annotation' : 'Note'),
                color: selectedColor,
                annotation_text: description.trim(),
            });

            setModalData(null);
            await loadAnnotations();
            if (onOpenDrawer) onOpenDrawer();
        } catch (err) {
            alert(err.message || 'Failed to save annotation');
        } finally {
            setIsSaving(false);
        }
    };

    // Delete Annotation
    const handleDeleteAnnotation = async (id, e) => {
        if (e) e.stopPropagation();
        if (!window.confirm('Delete this annotation?')) return;
        try {
            await documentManagementApi.deleteAnnotation(documentId, id);
            await loadAnnotations();
            if (activeAnnotationId === id) setActiveAnnotationId(null);
        } catch (err) {
            alert(err.message || 'Failed to delete annotation');
        }
    };

    return (
        <div className="annotations-layer-wrapper" style={{ width: '100%', position: 'relative' }}>
            {/* Main Document Content Canvas with Overlay */}
            <div
                ref={containerRef}
                className="annotations-layer-container"
                onContextMenu={handleContextMenu}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                style={{ width: '100%', position: 'relative' }}
            >
                {/* Embedded Child Content (Document Rich Text Viewer) */}
                {children}

                {/* Snipping Tool Active Dragging Canvas Overlay */}
                {isSnippingMode && (
                    <div className="annot-snipping-overlay">
                        {currentDragBox && (
                            <div
                                className="annot-drag-preview"
                                style={{
                                    left: `${currentDragBox.x}%`,
                                    top: `${currentDragBox.y}%`,
                                    width: `${currentDragBox.width}%`,
                                    height: `${currentDragBox.height}%`,
                                }}
                            />
                        )}
                    </div>
                )}

                {/* Rendered Visual Annotations (Bounding Boxes with Labels) */}
                {annotations.map((ann) => {
                    const isVisual = ann.annotation_type === 'IMAGE' && ann.anchor_data?.width;
                    const isActive = activeAnnotationId === ann.id;
                    const color = ann.color || '#0057B8';

                    if (isVisual) {
                        const { x, y, width, height } = ann.anchor_data;
                        return (
                            <div
                                key={ann.id}
                                id={`annot-item-${ann.id}`}
                                className={`annot-box-rendered ${isActive ? 'active' : ''}`}
                                style={{
                                    left: `${x}%`,
                                    top: `${y}%`,
                                    width: `${width}%`,
                                    height: `${height}%`,
                                    borderColor: color,
                                    backgroundColor: `${color}18`, // subtle tint
                                }}
                                onClick={() => {
                                    setActiveAnnotationId(isActive ? null : ann.id);
                                    if (onOpenDrawer) onOpenDrawer();
                                }}
                            >
                                <span
                                    className="annot-box-tag"
                                    style={{ backgroundColor: color }}
                                >
                                    {ann.label || 'Annotation'}
                                </span>
                            </div>
                        );
                    }

                    // Rendered Text Notes (Pin)
                    if (ann.annotation_type === 'TEXT' && ann.anchor_data?.x !== undefined) {
                        const { x, y } = ann.anchor_data;
                        return (
                            <div
                                key={ann.id}
                                id={`annot-item-${ann.id}`}
                                className={`annot-note-pin ${isActive ? 'active' : ''}`}
                                style={{
                                    left: `${x}%`,
                                    top: `${y}%`,
                                    backgroundColor: color,
                                }}
                                onClick={() => {
                                    setActiveAnnotationId(isActive ? null : ann.id);
                                    if (onOpenDrawer) onOpenDrawer();
                                }}
                                title={`${ann.custom_id ? `${ann.custom_id} · ` : ''}${ann.label || 'Note'}`}
                            >
                                <MessageSquare size={13} />
                            </div>
                        );
                    }

                    return null;
                })}

                {/* Right-Click Context Menu */}
                {contextMenu && (
                    <div
                        ref={contextMenuRef}
                        className="annot-context-menu"
                        style={{
                            left: `${contextMenu.screenX}px`,
                            top: `${contextMenu.screenY}px`,
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="annot-context-header" style={{ padding: '6px 10px', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                            Add Note or Annotation
                        </div>

                        {/* Selected Text Preview in Context Menu if text is highlighted */}
                        {contextMenu.selectedText && (
                            <div style={{
                                margin: '2px 6px 6px',
                                padding: '6px 8px',
                                background: '#f8fafc',
                                borderRadius: '6px',
                                border: '1px solid #e2e8f0',
                                borderLeft: '3px solid #0057B8',
                            }}>
                                <div style={{ fontSize: '10px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: '2px' }}>
                                    Selected Text Passage:
                                </div>
                                <div style={{
                                    fontSize: '11px',
                                    color: '#1e293b',
                                    fontStyle: 'italic',
                                    lineHeight: '1.35',
                                    maxHeight: '42px',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    display: '-webkit-box',
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: 'vertical'
                                }}>
                                    "{contextMenu.selectedText}"
                                </div>
                            </div>
                        )}

                        <button
                            type="button"
                            className="annot-context-item highlight-blue"
                            onClick={handleStartAnnotation}
                        >
                            <Crop size={15} style={{ color: '#0057B8' }} />
                            <span>Visual Annotation (Chart / Image)</span>
                        </button>

                        <div style={{ height: '1px', background: '#f1f5f9', margin: '4px 0' }} />
                        <div className="annot-context-header" style={{ padding: '4px 10px', fontSize: '10.5px', fontWeight: 600, color: '#94a3b8' }}>
                            {contextMenu.selectedText ? 'Save Note for Selected Text:' : 'Text Notes by Category:'}
                        </div>

                        {PREDEFINED_NOTE_CATEGORIES.map(cat => (
                            <button
                                key={cat.key}
                                type="button"
                                className="annot-context-item"
                                onClick={() => handleStartNote(cat.key)}
                                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                            >
                                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: cat.color, flexShrink: 0 }} />
                                <span>{cat.label}</span>
                            </button>
                        ))}
                    </div>
                )}
            </div>

           
            {/* Slide-out Annotations & Notes Drawer (Matching Version History Drawer) */}
            {isDrawerOpen && (
                <div className="annot-drawer-overlay" onClick={onCloseDrawer}>
                    <div className="annot-drawer" onClick={(e) => e.stopPropagation()}>
                        <div className="annot-drawer-header">
                            <div className="annot-drawer-title">
                                <MessageSquare size={17} style={{ color: '#0057B8' }} />
                                <span>Annotations &amp; Notes</span>
                                <span className="annot-drawer-badge">
                                    {annotations.length}
                                </span>
                            </div>
                            <button
                                type="button"
                                className="annot-drawer-close-btn"
                                onClick={onCloseDrawer}
                                title="Close Drawer"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        {/* Drawer Filter Toolbar */}
                        <div className="annot-drawer-toolbar">
                            <div className="annot-drawer-tabs">
                                <button
                                    type="button"
                                    className={`annot-tab-pill ${filterTab === 'ALL' ? 'active' : ''}`}
                                    onClick={() => setFilterTab('ALL')}
                                >
                                    All ({annotations.length})
                                </button>
                                <button
                                    type="button"
                                    className={`annot-tab-pill ${filterTab === 'TEXT' ? 'active' : ''}`}
                                    onClick={() => setFilterTab('TEXT')}
                                >
                                    Notes ({notesCount})
                                </button>
                                <button
                                    type="button"
                                    className={`annot-tab-pill ${filterTab === 'IMAGE' ? 'active' : ''}`}
                                    onClick={() => setFilterTab('IMAGE')}
                                >
                                    Visual ({visualCount})
                                </button>
                            </div>

                            <div className="annot-drawer-search">
                                <Search size={13} style={{ color: '#94a3b8' }} />
                                <input
                                    type="text"
                                    placeholder="Filter notes or quotes..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                                {searchQuery && (
                                    <button
                                        type="button"
                                        onClick={() => setSearchQuery('')}
                                        className="annot-search-clear"
                                    >
                                        <X size={12} />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Drawer Body */}
                        <div className="annot-drawer-body">
                            {filteredAnnotations.length === 0 ? (
                                <div className="annot-drawer-empty">
                                    <MessageSquare size={36} style={{ color: '#cbd5e1', marginBottom: '10px' }} />
                                    <div style={{ fontWeight: 600, color: '#334155', fontSize: '13px' }}>
                                        {annotations.length === 0 ? 'No annotations or notes yet' : 'No matching items'}
                                    </div>
                                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px', lineHeight: '1.4' }}>
                                        {annotations.length === 0
                                            ? 'Right-click anywhere on the policy to highlight text, leave notes, or snip charts/images.'
                                            : 'Try adjusting your search query or tab filters.'}
                                    </div>
                                </div>
                            ) : (
                                filteredAnnotations.map((ann) => {
                                    const isActive = activeAnnotationId === ann.id;
                                    const isVisual = ann.annotation_type === 'IMAGE';
                                    const color = ann.color || '#0057B8';
                                    const dateStr = ann.created_at
                                        ? new Date(ann.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
                                        : '';

                                    return (
                                        <div
                                            key={ann.id}
                                            id={`annot-sidebar-${ann.id}`}
                                            className={`annot-comment-card ${isActive ? 'active' : ''}`}
                                            onClick={() => {
                                                setActiveAnnotationId(isActive ? null : ann.id);
                                                const el = document.getElementById(`annot-item-${ann.id}`);
                                                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                            }}
                                        >
                                            <div className="annot-card-header">
                                                <span className="annot-card-badge" style={{ backgroundColor: color }}>
                                                    {isVisual ? <Crop size={10} /> : <FileText size={10} />}
                                                    {ann.label || (isVisual ? 'Annotation' : 'Note')}
                                                </span>
                                                {ann.custom_id && (
                                                    <span className="annot-card-author" title={isVisual ? 'Annotation ID' : 'Note ID'}>
                                                        {ann.custom_id}
                                                    </span>
                                                )}
                                                <span className="annot-card-author">
                                                    {ann.author_name || 'User'} · {dateStr}
                                                </span>
                                            </div>

                                            <div className="annot-card-body">
                                                {ann.anchor_data?.selectedText && (
                                                    <div className="annot-card-quote" style={{ borderLeftColor: color }}>
                                                        "{ann.anchor_data.selectedText}"
                                                    </div>
                                                )}
                                                <div className="annot-card-msg">
                                                    {ann.annotation_text}
                                                </div>
                                            </div>

                                            <div className="annot-card-actions">
                                                <button
                                                    type="button"
                                                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '3px', color: '#dc2626' }}
                                                    onClick={(e) => handleDeleteAnnotation(ann.id, e)}
                                                    title="Delete"
                                                >
                                                    <Trash2 size={13} />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {/* Drawer Footer */}
                        <div className="annot-drawer-footer">
                            <span style={{ fontSize: '11px', color: '#64748b' }}>
                                Tip: Right-click any text or chart on the policy to add notes.
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {/* Create/Save Annotation Modal Dialog */}
            {modalData && (
                <div className="template-modal-overlay">
                    <div className="template-modal-card" style={{ maxWidth: '460px', height: 'auto' }}>
                        <div className="template-modal-header">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                {modalType === 'IMAGE' ? (
                                    <Crop size={17} style={{ color: selectedColor }} />
                                ) : (
                                    <FileText size={17} style={{ color: selectedColor }} />
                                )}
                                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700 }}>
                                    {modalType === 'IMAGE' ? 'Save Section Annotation' : 'Add Policy Note'}
                                </h3>
                            </div>
                            <button
                                type="button"
                                className="dms-annot-close-btn"
                                onClick={() => setModalData(null)}
                            >
                                <X size={16} />
                            </button>
                        </div>

                        <div style={{ padding: '18px 22px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                            {/* Selected Reference Text Preview */}
                            {modalData.anchor_data?.selectedText && (
                                <div>
                                    <label style={{ fontSize: '12px', fontWeight: 600, color: '#334155', display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '5px' }}>
                                        <FileText size={13} style={{ color: selectedColor }} />
                                        <span>Selected Text Reference</span>
                                    </label>
                                    <div className="annot-selected-text-preview" style={{ borderLeftColor: selectedColor }}>
                                        "{modalData.anchor_data.selectedText}"
                                    </div>
                                </div>
                            )}

                            {modalType === 'TEXT' && (
                                <div>
                                    <label style={{ fontSize: '12px', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '5px' }}>
                                        Predefined Category
                                    </label>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px' }}>
                                        {PREDEFINED_NOTE_CATEGORIES.map(cat => {
                                            const isSelected = selectedCategory === cat.key;
                                            return (
                                                <button
                                                    key={cat.key}
                                                    type="button"
                                                    onClick={() => {
                                                        setSelectedCategory(cat.key);
                                                        setLabelText(cat.label);
                                                        setSelectedColor(cat.color);
                                                    }}
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '6px',
                                                        padding: '7px 10px',
                                                        borderRadius: '6px',
                                                        border: isSelected ? `2px solid ${cat.color}` : '1px solid #e2e8f0',
                                                        background: isSelected ? `${cat.color}14` : '#f8fafc',
                                                        fontSize: '12px',
                                                        fontWeight: isSelected ? 600 : 500,
                                                        color: '#1e293b',
                                                        cursor: 'pointer',
                                                        textAlign: 'left'
                                                    }}
                                                >
                                                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: cat.color, flexShrink: 0 }} />
                                                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cat.label}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            <div>
                                <label style={{ fontSize: '12px', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '5px' }}>
                                    Label / Identifier
                                </label>
                                <input
                                    type="text"
                                    className="form-input"
                                    style={{ width: '100%', boxSizing: 'border-box', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                                    placeholder={modalType === 'IMAGE' ? 'e.g. Architecture Chart, Person, Building' : 'e.g. Compliance Remark'}
                                    value={labelText}
                                    onChange={(e) => setLabelText(e.target.value)}
                                    autoFocus
                                />
                            </div>

                            <div>
                                <label style={{ fontSize: '12px', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '5px' }}>
                                    Color Tag
                                </label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    {PRESET_COLORS.map((c) => (
                                        <button
                                            key={c.value}
                                            type="button"
                                            onClick={() => setSelectedColor(c.value)}
                                            style={{
                                                width: '24px',
                                                height: '24px',
                                                borderRadius: '50%',
                                                backgroundColor: c.value,
                                                border: selectedColor === c.value ? '2px solid #0f172a' : '2px solid transparent',
                                                cursor: 'pointer',
                                                outline: 'none',
                                            }}
                                            title={c.label}
                                        />
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label style={{ fontSize: '12px', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '5px' }}>
                                    Description / Remark <span style={{ color: '#dc2626' }}>*</span>
                                </label>
                                <textarea
                                    className="form-input"
                                    style={{ width: '100%', boxSizing: 'border-box', height: '80px', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', resize: 'vertical' }}
                                    placeholder="Enter your observations or comments on this section..."
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    required
                                />
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => setModalData(null)}
                                    disabled={isSaving}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-primary"
                                    style={{ backgroundColor: selectedColor, borderColor: selectedColor }}
                                    onClick={handleSaveAnnotation}
                                    disabled={isSaving || !description.trim()}
                                >
                                    {isSaving ? 'Saving...' : 'Save Annotation'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
