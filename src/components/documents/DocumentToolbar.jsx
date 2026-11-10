import React, { useState, useRef, useEffect } from 'react';
import {
    Undo2,
    Redo2,
    Bold,
    Italic,
    Underline,
    AlignLeft,
    AlignCenter,
    AlignRight,
    List,
    ListOrdered,
    Table,
    Link2,
    MoreVertical,
    PenLine,
    Maximize2,
    Palette,
    Heading1,
    Heading2,
    Heading3,
    Quote,
    RemoveFormatting,
    Check
} from 'lucide-react';

export default function DocumentToolbar({
    onFormat,
    isAnnotationsPanelOpen = false,
    onToggleAnnotationsPanel,
    annotationCount = 0,
    zoomLevel = '100%',
    onZoomChange,
    onToggleFullscreen
}) {
    const [isColorMenuOpen, setIsColorMenuOpen] = useState(false);
    const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
    const [currentColor, setCurrentColor] = useState('#0f172a');

    const colorMenuRef = useRef(null);
    const moreMenuRef = useRef(null);
    const savedRangeRef = useRef(null);

    // Save current editor text selection
    const saveSelection = () => {
        const sel = window.getSelection();
        if (sel && sel.rangeCount > 0) {
            savedRangeRef.current = sel.getRangeAt(0).cloneRange();
        }
    };

    // Restore editor text selection
    const restoreSelection = () => {
        if (savedRangeRef.current) {
            const sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(savedRangeRef.current);
        }
    };

    // Dismiss popups on click outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (colorMenuRef.current && !colorMenuRef.current.contains(e.target)) {
                setIsColorMenuOpen(false);
            }
            if (moreMenuRef.current && !moreMenuRef.current.contains(e.target)) {
                setIsMoreMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Ensure focus is on a contentEditable section before executing command
    const ensureEditableFocus = () => {
        const active = document.activeElement;
        if (active && active.isContentEditable) return active;
        const firstEditable = document.querySelector('.dms-section-content[contenteditable="true"]');
        if (firstEditable) {
            firstEditable.focus();
            return firstEditable;
        }
        return null;
    };

    // Execute standard document command without losing selection
    const execFormat = (command, value = null) => {
        ensureEditableFocus();
        try {
            document.execCommand(command, false, value);
        } catch (err) {
            console.warn('execCommand failed:', err);
        }

        // Notify parent or active section
        if (onFormat) {
            onFormat(command, value);
        }

        const activeEl = document.activeElement;
        if (activeEl && activeEl.isContentEditable) {
            activeEl.dispatchEvent(new Event('input', { bubbles: true }));
        }
    };

    // Insert Empty Table
    const handleInsertTable = () => {
        ensureEditableFocus();
        const tableHtml = `
            <table style="width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 13px;">
                <thead>
                    <tr style="background: #f8fafc;">
                        <th style="border: 1px solid #cbd5e1; padding: 8px 12px; text-align: left; font-weight: 600; min-width: 80px;">&nbsp;</th>
                        <th style="border: 1px solid #cbd5e1; padding: 8px 12px; text-align: left; font-weight: 600; min-width: 80px;">&nbsp;</th>
                        <th style="border: 1px solid #cbd5e1; padding: 8px 12px; text-align: left; font-weight: 600; min-width: 80px;">&nbsp;</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td style="border: 1px solid #cbd5e1; padding: 8px 12px; min-width: 80px;">&nbsp;</td>
                        <td style="border: 1px solid #cbd5e1; padding: 8px 12px; min-width: 80px;">&nbsp;</td>
                        <td style="border: 1px solid #cbd5e1; padding: 8px 12px; min-width: 80px;">&nbsp;</td>
                    </tr>
                    <tr>
                        <td style="border: 1px solid #cbd5e1; padding: 8px 12px; min-width: 80px;">&nbsp;</td>
                        <td style="border: 1px solid #cbd5e1; padding: 8px 12px; min-width: 80px;">&nbsp;</td>
                        <td style="border: 1px solid #cbd5e1; padding: 8px 12px; min-width: 80px;">&nbsp;</td>
                    </tr>
                </tbody>
            </table>
            <p><br/></p>
        `;
        execFormat('insertHTML', tableHtml);
    };

    // Insert Link
    const handleInsertLink = () => {
        ensureEditableFocus();
        const url = window.prompt('Enter link URL (e.g. https://example.com):', 'https://');
        if (url && url.trim() && url !== 'https://') {
            execFormat('createLink', url.trim());
        }
    };

    // Color Swatches
    const COLOR_SWATCHES = [
        { label: 'Default / Slate', value: '#0f172a' },
        { label: 'Charcoal', value: '#334155' },
        { label: 'Muted Gray', value: '#64748b' },
        { label: 'Blue', value: '#2563eb' },
        { label: 'Sky Blue', value: '#0284c7' },
        { label: 'Teal', value: '#0d9488' },
        { label: 'Green', value: '#16a34a' },
        { label: 'Emerald', value: '#059669' },
        { label: 'Amber', value: '#d97706' },
        { label: 'Red', value: '#dc2626' },
        { label: 'Rose', value: '#e11d48' },
        { label: 'Purple', value: '#7c3aed' },
        { label: 'Indigo', value: '#4f46e5' },
        { label: 'Fuchsia', value: '#c026d3' }
    ];

    const handleSelectColor = (color, closeMenu = true) => {
        setCurrentColor(color);
        restoreSelection();
        try {
            document.execCommand('foreColor', false, color);
        } catch (err) {
            console.warn('execCommand foreColor failed:', err);
        }

        if (onFormat) {
            onFormat('foreColor', color);
        }

        const activeEl = document.activeElement;
        if (activeEl && activeEl.isContentEditable) {
            activeEl.dispatchEvent(new Event('input', { bubbles: true }));
        }

        if (closeMenu) {
            setIsColorMenuOpen(false);
        }
    };

    return (
        <div className="dms-toolbar">
            {/* Formatting Tools */}
            <div className="dms-toolbar-left">
                {/* 1. Undo / Redo */}
                <button
                    type="button"
                    className="dms-tool-btn"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => execFormat('undo')}
                    title="Undo (Ctrl+Z)"
                >
                    <Undo2 size={14} />
                </button>
                <button
                    type="button"
                    className="dms-tool-btn"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => execFormat('redo')}
                    title="Redo (Ctrl+Y)"
                >
                    <Redo2 size={14} />
                </button>

                <div className="dms-toolbar-sep" />

                {/* 2. Bold / Italic / Underline / Text Color */}
                <button
                    type="button"
                    className="dms-tool-btn"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => execFormat('bold')}
                    title="Bold (Ctrl+B)"
                >
                    <Bold size={14} />
                </button>
                <button
                    type="button"
                    className="dms-tool-btn"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => execFormat('italic')}
                    title="Italic (Ctrl+I)"
                >
                    <Italic size={14} />
                </button>
                <button
                    type="button"
                    className="dms-tool-btn"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => execFormat('underline')}
                    title="Underline (Ctrl+U)"
                >
                    <Underline size={14} />
                </button>

                {/* Text Color Picker Popover */}
                <div style={{ position: 'relative' }} ref={colorMenuRef}>
                    <button
                        type="button"
                        className={`dms-tool-btn ${isColorMenuOpen ? 'active' : ''}`}
                        onMouseDown={(e) => {
                            e.preventDefault();
                            saveSelection();
                        }}
                        onClick={() => {
                            saveSelection();
                            setIsColorMenuOpen((o) => !o);
                        }}
                        title="Text Color"
                    >
                        <Palette size={14} style={{ color: currentColor !== '#0f172a' ? currentColor : undefined }} />
                    </button>

                    {isColorMenuOpen && (
                        <div
                            onMouseDown={(e) => e.stopPropagation()}
                            onClick={(e) => e.stopPropagation()}
                            style={{
                                position: 'absolute',
                                top: '100%',
                                left: '0',
                                marginTop: '6px',
                                background: '#ffffff',
                                border: '1px solid #e2e8f0',
                                borderRadius: '8px',
                                boxShadow: '0 8px 24px rgba(0,0,0,0.14)',
                                zIndex: 100,
                                padding: '10px',
                                minWidth: '210px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '8px'
                            }}
                        >
                            <span style={{ fontSize: '10.5px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                                Text Color
                            </span>

                            {/* Color Palette Swatches */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px' }}>
                                {COLOR_SWATCHES.map((swatch) => (
                                    <button
                                        key={swatch.value}
                                        type="button"
                                        onMouseDown={(e) => e.preventDefault()}
                                        onClick={() => handleSelectColor(swatch.value, true)}
                                        title={swatch.label}
                                        style={{
                                            width: '22px',
                                            height: '22px',
                                            borderRadius: '50%',
                                            background: swatch.value,
                                            border: currentColor === swatch.value ? '2px solid #0284c7' : '1px solid #cbd5e1',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            outline: 'none',
                                            boxShadow: currentColor === swatch.value ? '0 0 0 2px rgba(2,132,199,0.2)' : 'none'
                                        }}
                                    >
                                        {currentColor === swatch.value && <Check size={11} color="#ffffff" />}
                                    </button>
                                ))}
                            </div>

                            {/* Custom Color Row */}
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    marginTop: '2px',
                                    paddingTop: '8px',
                                    borderTop: '1px solid #f1f5f9'
                                }}
                            >
                                <label style={{ fontSize: '11px', color: '#475569', fontWeight: 600 }}>Custom:</label>
                                <input
                                    type="color"
                                    value={currentColor.startsWith('#') && currentColor.length === 7 ? currentColor : '#0f172a'}
                                    onInput={(e) => handleSelectColor(e.target.value, false)}
                                    onChange={(e) => handleSelectColor(e.target.value, false)}
                                    title="Choose custom color"
                                    style={{
                                        width: '26px',
                                        height: '24px',
                                        border: '1px solid #cbd5e1',
                                        borderRadius: '4px',
                                        padding: '1px',
                                        background: 'transparent',
                                        cursor: 'pointer'
                                    }}
                                />
                                <input
                                    type="text"
                                    value={currentColor}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setCurrentColor(val);
                                        if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
                                            handleSelectColor(val, false);
                                        }
                                    }}
                                    placeholder="#000000"
                                    style={{
                                        width: '68px',
                                        fontSize: '11px',
                                        fontFamily: 'monospace',
                                        padding: '3px 6px',
                                        border: '1px solid #cbd5e1',
                                        borderRadius: '4px',
                                        outline: 'none'
                                    }}
                                />
                                <button
                                    type="button"
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={() => handleSelectColor(currentColor, true)}
                                    className="dms-btn-primary"
                                    style={{
                                        fontSize: '11px',
                                        padding: '3px 9px',
                                        borderRadius: '4px',
                                        marginLeft: 'auto'
                                    }}
                                >
                                    Done
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <div className="dms-toolbar-sep" />

                {/* 3. Text Alignment (Left, Center, Right) */}
                <button
                    type="button"
                    className="dms-tool-btn"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => execFormat('justifyLeft')}
                    title="Align Left"
                >
                    <AlignLeft size={14} />
                </button>
                <button
                    type="button"
                    className="dms-tool-btn"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => execFormat('justifyCenter')}
                    title="Align Center"
                >
                    <AlignCenter size={14} />
                </button>
                <button
                    type="button"
                    className="dms-tool-btn"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => execFormat('justifyRight')}
                    title="Align Right"
                >
                    <AlignRight size={14} />
                </button>

                <div className="dms-toolbar-sep" />

                {/* 4. Lists (Bullet & Numbered) */}
                <button
                    type="button"
                    className="dms-tool-btn"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => execFormat('insertUnorderedList')}
                    title="Bullet List"
                >
                    <List size={14} />
                </button>
                <button
                    type="button"
                    className="dms-tool-btn"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => execFormat('insertOrderedList')}
                    title="Numbered List"
                >
                    <ListOrdered size={14} />
                </button>

                <div className="dms-toolbar-sep" />

                {/* 5. Table & Link (Image Upload Button Removed As Requested) */}
                <button
                    type="button"
                    className="dms-tool-btn"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={handleInsertTable}
                    title="Insert Formatted Table"
                >
                    <Table size={14} />
                </button>
                <button
                    type="button"
                    className="dms-tool-btn"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={handleInsertLink}
                    title="Insert Web Link"
                >
                    <Link2 size={14} />
                </button>

                {/* More Options Popover */}
                <div style={{ position: 'relative' }} ref={moreMenuRef}>
                    <button
                        type="button"
                        className={`dms-tool-btn ${isMoreMenuOpen ? 'active' : ''}`}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => setIsMoreMenuOpen((o) => !o)}
                        title="More formatting options (Headings, Quotes, Clear formatting)"
                    >
                        <MoreVertical size={14} />
                    </button>

                    {isMoreMenuOpen && (
                        <div
                            style={{
                                position: 'absolute',
                                top: '100%',
                                left: '0',
                                marginTop: '6px',
                                background: '#ffffff',
                                border: '1px solid #e2e8f0',
                                borderRadius: '8px',
                                boxShadow: '0 8px 18px rgba(0,0,0,0.12)',
                                zIndex: 100,
                                padding: '4px',
                                minWidth: '160px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '2px'
                            }}
                        >
                            <button
                                type="button"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => {
                                    execFormat('formatBlock', '<h1>');
                                    setIsMoreMenuOpen(false);
                                }}
                                className="dms-context-item"
                            >
                                <Heading1 size={14} />
                                <span>Heading 1</span>
                            </button>
                            <button
                                type="button"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => {
                                    execFormat('formatBlock', '<h2>');
                                    setIsMoreMenuOpen(false);
                                }}
                                className="dms-context-item"
                            >
                                <Heading2 size={14} />
                                <span>Heading 2</span>
                            </button>
                            <button
                                type="button"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => {
                                    execFormat('formatBlock', '<h3>');
                                    setIsMoreMenuOpen(false);
                                }}
                                className="dms-context-item"
                            >
                                <Heading3 size={14} />
                                <span>Heading 3</span>
                            </button>
                            <button
                                type="button"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => {
                                    execFormat('formatBlock', '<p>');
                                    setIsMoreMenuOpen(false);
                                }}
                                className="dms-context-item"
                            >
                                <span>Normal Paragraph</span>
                            </button>
                            <button
                                type="button"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => {
                                    execFormat('formatBlock', '<blockquote>');
                                    setIsMoreMenuOpen(false);
                                }}
                                className="dms-context-item"
                            >
                                <Quote size={14} />
                                <span>Quote Block</span>
                            </button>
                            <div className="dms-context-sep" />
                            <button
                                type="button"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => {
                                    execFormat('removeFormat');
                                    setIsMoreMenuOpen(false);
                                }}
                                className="dms-context-item"
                                style={{ color: '#dc2626' }}
                            >
                                <RemoveFormatting size={14} />
                                <span>Clear Formatting</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Annotate, Zoom & Fullscreen */}
            <div className="dms-toolbar-right" style={{ position: 'relative' }}>
                <button
                    type="button"
                    className={`dms-annotate-btn ${isAnnotationsPanelOpen ? 'active' : ''}`}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={onToggleAnnotationsPanel}
                    title={isAnnotationsPanelOpen ? 'Close Annotation Side Tab' : 'Open Annotation Side Tab'}
                >
                    <PenLine size={14} />
                    <span>Annotate</span>
                    {annotationCount > 0 && (
                        <span className="dms-annotate-count-badge">
                            {annotationCount}
                        </span>
                    )}
                </button>

                <select
                    className="dms-zoom-select"
                    value={zoomLevel}
                    onChange={(e) => onZoomChange && onZoomChange(e.target.value)}
                >
                    <option value="75%">75%</option>
                    <option value="100%">100%</option>
                    <option value="125%">125%</option>
                    <option value="150%">150%</option>
                </select>

                <button
                    type="button"
                    className="dms-tool-btn"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={onToggleFullscreen}
                    title="Fullscreen Mode"
                >
                    <Maximize2 size={14} />
                </button>
            </div>
        </div>
    );
}
