import React, { useState, useRef, useMemo, useEffect } from 'react';
import {
    Move,
    Trash2,
    Pencil,
    Plus,
    FileImage,
    ImagePlus,
    Check,
    X,
    Save,
    Tag,
    ChevronUp,
    ChevronDown,
    AlignLeft,
    AlignCenter,
    AlignRight,
    MapPin,
    FileText,
    RefreshCw,
    Maximize2,
    ArrowUpToLine,
    ArrowDownToLine,
    ArrowLeftToLine,
    ArrowRightToLine,
    Columns2,
    Rows2,
    Split
} from 'lucide-react';
import { documentManagementApi } from '../../services/api/documentManagementApi';

export default function DocumentEditor({
    documentId,
    documentTitle = 'Information Security Policy',
    libraryName = 'Policies',
    sections = [],
    annotations = [],
    zoomLevel = '100%',
    onUpdateSectionContent,
    onDeleteSection,
    onAddSection,
    onImageClick,
    onTextSelectionAnnotate,
    onOpenAddAnnotation,
    onSelectAnnotation
}) {
    const [activeSectionId, setActiveSectionId] = useState(null);
    const [editingTitleId, setEditingTitleId] = useState(null);
    const [tempTitle, setTempTitle] = useState('');
    const [isUploadingImageForSection, setIsUploadingImageForSection] = useState(null);
    const [resizingImages, setResizingImages] = useState({});
    const [contextMenu, setContextMenu] = useState(null);
    const [measuredHeights, setMeasuredHeights] = useState({});

    const fileInputRef = useRef(null);
    const editorPaperRef = useRef(null);
    const contextMenuRef = useRef(null);

    // Calculate numeric zoom scale
    const zoomScale =
        zoomLevel === '75%' ? 0.75 : zoomLevel === '125%' ? 1.25 : zoomLevel === '150%' ? 1.5 : 1.0;

    // Dynamically adjust context menu position to prevent viewport overflow
    useEffect(() => {
        if (contextMenu && contextMenuRef.current) {
            const el = contextMenuRef.current;
            const rect = el.getBoundingClientRect();
            const padding = 12;

            if (rect.bottom > window.innerHeight - padding) {
                const adjustedTop = Math.max(padding, window.innerHeight - rect.height - padding);
                el.style.top = `${adjustedTop}px`;
            }
            if (rect.right > window.innerWidth - padding) {
                const adjustedLeft = Math.max(padding, window.innerWidth - rect.width - padding);
                el.style.left = `${adjustedLeft}px`;
            }
        }
    }, [contextMenu]);

    // Close right-click context menu on outside click or scroll
    useEffect(() => {
        const handleDismissMenu = () => setContextMenu(null);
        window.addEventListener('click', handleDismissMenu);
        window.addEventListener('scroll', handleDismissMenu, true);
        return () => {
            window.removeEventListener('click', handleDismissMenu);
            window.removeEventListener('scroll', handleDismissMenu, true);
        };
    }, []);

    // Dynamically observe real rendered heights of sections for accurate A4 pagination
    useEffect(() => {
        if (typeof ResizeObserver === 'undefined') return;

        const observer = new ResizeObserver((entries) => {
            const updates = {};
            let hasChange = false;

            entries.forEach((entry) => {
                const secId = entry.target.getAttribute('data-section-block-id');
                if (secId) {
                    const h = Math.round(entry.borderBoxSize?.[0]?.blockSize || entry.contentRect.height + 24);
                    if (h > 40) {
                        updates[secId] = h;
                        hasChange = true;
                    }
                }
            });

            if (hasChange) {
                setMeasuredHeights((prev) => ({ ...prev, ...updates }));
            }
        });

        const blocks = document.querySelectorAll('.dms-section-block[data-section-block-id]');
        blocks.forEach((el) => observer.observe(el));

        return () => observer.disconnect();
    }, [sections]);

    // Handle text selection for Annotation
    const handleMouseUp = () => {
        const selection = window.getSelection();
        if (selection && selection.toString().trim().length > 0) {
            const selectedText = selection.toString().trim();
            if (onTextSelectionAnnotate) {
                onTextSelectionAnnotate(selectedText);
            }
        }
    };

    // Right-Click Context Menu interceptor: Table Menu for tables, Section Menu for sections
    const handleContextMenu = (e, sectionId = null) => {
        const tableCell = e.target.closest('td, th');
        const table = e.target.closest('table');

        // Resolve target section ID
        const effectiveSectionId =
            sectionId ||
            e.target.closest('[data-section-id]')?.getAttribute('data-section-id') ||
            activeSectionId ||
            (sections.length > 0 ? sections[0].id : null);

        // 1. Right-clicked on or inside a Table -> strictly show Table Context Menu
        if (tableCell && table) {
            e.preventDefault();
            e.stopPropagation();

            const approxWidth = 240;
            const approxHeight = 340;
            const pad = 14;

            const posX = e.clientX + approxWidth > window.innerWidth - pad
                ? Math.max(pad, window.innerWidth - approxWidth - pad)
                : e.clientX;

            const posY = e.clientY + approxHeight > window.innerHeight - pad
                ? Math.max(pad, e.clientY - approxHeight)
                : e.clientY;

            setContextMenu({
                x: posX,
                y: posY,
                type: 'table',
                sectionId: effectiveSectionId,
                targetCell: tableCell,
                targetTable: table,
                selectedText: ''
            });
            return;
        }

        // 2. Right-clicked on section (except table) -> show Add Section, Add Annotation, Add Image
        e.preventDefault();
        e.stopPropagation();

        const approxWidth = 220;
        const approxHeight = 170;
        const pad = 14;

        const posX = e.clientX + approxWidth > window.innerWidth - pad
            ? Math.max(pad, window.innerWidth - approxWidth - pad)
            : e.clientX;

        const posY = e.clientY + approxHeight > window.innerHeight - pad
            ? Math.max(pad, e.clientY - approxHeight)
            : e.clientY;

        setContextMenu({
            x: posX,
            y: posY,
            type: 'section',
            sectionId: effectiveSectionId,
            targetCell: null,
            targetTable: null,
            selectedText: ''
        });
    };

    // Table Manipulation Actions (Insert row/col, merge col/row, split, delete)
    const handleTableAction = (action, { targetCell, targetTable, sectionId }) => {
        if (!targetTable || !targetCell) return;
        const row = targetCell.closest('tr');
        if (!row && action !== 'delete_table') return;

        const cellIndex = targetCell.cellIndex;

        switch (action) {
            case 'insert_row_above': {
                const newRow = row.cloneNode(true);
                Array.from(newRow.cells).forEach((c) => {
                    c.innerHTML = '&nbsp;';
                    c.removeAttribute('colspan');
                    c.removeAttribute('rowspan');
                });
                row.parentElement.insertBefore(newRow, row);
                break;
            }
            case 'insert_row_below': {
                const newRow = row.cloneNode(true);
                Array.from(newRow.cells).forEach((c) => {
                    c.innerHTML = '&nbsp;';
                    c.removeAttribute('colspan');
                    c.removeAttribute('rowspan');
                });
                row.parentElement.insertBefore(newRow, row.nextSibling);
                break;
            }
            case 'insert_col_left': {
                const allRows = targetTable.querySelectorAll('tr');
                allRows.forEach((r) => {
                    const isHeader = r.parentElement.tagName === 'THEAD';
                    const newCell = document.createElement(isHeader ? 'th' : 'td');
                    newCell.style.cssText = 'border: 1px solid #cbd5e1; padding: 8px 12px; min-width: 80px;';
                    newCell.innerHTML = '&nbsp;';
                    const refCell = r.children[cellIndex];
                    if (refCell) {
                        r.insertBefore(newCell, refCell);
                    } else {
                        r.appendChild(newCell);
                    }
                });
                break;
            }
            case 'insert_col_right': {
                const allRows = targetTable.querySelectorAll('tr');
                allRows.forEach((r) => {
                    const isHeader = r.parentElement.tagName === 'THEAD';
                    const newCell = document.createElement(isHeader ? 'th' : 'td');
                    newCell.style.cssText = 'border: 1px solid #cbd5e1; padding: 8px 12px; min-width: 80px;';
                    newCell.innerHTML = '&nbsp;';
                    const refCell = r.children[cellIndex + 1];
                    if (refCell) {
                        r.insertBefore(newCell, refCell);
                    } else {
                        r.appendChild(newCell);
                    }
                });
                break;
            }
            case 'delete_row': {
                const tbody = row.parentElement;
                row.remove();
                if (tbody.children.length === 0) {
                    targetTable.remove();
                }
                break;
            }
            case 'delete_col': {
                const allRows = targetTable.querySelectorAll('tr');
                allRows.forEach((r) => {
                    if (r.children[cellIndex]) {
                        r.children[cellIndex].remove();
                    }
                });
                if (targetTable.querySelector('tr')?.children.length === 0) {
                    targetTable.remove();
                }
                break;
            }
            case 'merge_column': {
                const nextCell = targetCell.nextElementSibling;
                if (nextCell) {
                    const nextText = nextCell.innerHTML === '&nbsp;' ? '' : nextCell.innerHTML;
                    const curText = targetCell.innerHTML === '&nbsp;' ? '' : targetCell.innerHTML;
                    targetCell.innerHTML = (curText + (nextText ? ' ' + nextText : '')).trim() || '&nbsp;';
                    const curSpan = parseInt(targetCell.getAttribute('colspan') || '1', 10);
                    const nextSpan = parseInt(nextCell.getAttribute('colspan') || '1', 10);
                    targetCell.setAttribute('colspan', curSpan + nextSpan);
                    nextCell.remove();
                } else {
                    alert('No adjacent column cell to merge with.');
                }
                break;
            }
            case 'merge_row': {
                const nextRow = row.nextElementSibling;
                if (nextRow && nextRow.children[cellIndex]) {
                    const nextRowCell = nextRow.children[cellIndex];
                    const nextText = nextRowCell.innerHTML === '&nbsp;' ? '' : nextRowCell.innerHTML;
                    const curText = targetCell.innerHTML === '&nbsp;' ? '' : targetCell.innerHTML;
                    targetCell.innerHTML = (curText + (nextText ? ' ' + nextText : '')).trim() || '&nbsp;';
                    const curSpan = parseInt(targetCell.getAttribute('rowspan') || '1', 10);
                    const nextSpan = parseInt(nextRowCell.getAttribute('rowspan') || '1', 10);
                    targetCell.setAttribute('rowspan', curSpan + nextSpan);
                    nextRowCell.remove();
                } else {
                    alert('No adjacent row cell below to merge with.');
                }
                break;
            }
            case 'split_cell': {
                const colSpan = parseInt(targetCell.getAttribute('colspan') || '1', 10);
                const rowSpan = parseInt(targetCell.getAttribute('rowspan') || '1', 10);
                if (colSpan > 1) {
                    targetCell.removeAttribute('colspan');
                    for (let i = 1; i < colSpan; i++) {
                        const newCell = document.createElement(targetCell.tagName);
                        newCell.style.cssText = targetCell.style.cssText;
                        newCell.innerHTML = '&nbsp;';
                        row.insertBefore(newCell, targetCell.nextSibling);
                    }
                }
                if (rowSpan > 1) {
                    targetCell.removeAttribute('rowspan');
                    let currRow = row.nextElementSibling;
                    for (let i = 1; i < rowSpan && currRow; i++) {
                        const newCell = document.createElement('td');
                        newCell.style.cssText = targetCell.style.cssText;
                        newCell.innerHTML = '&nbsp;';
                        const ref = currRow.children[cellIndex] || null;
                        currRow.insertBefore(newCell, ref);
                        currRow = currRow.nextElementSibling;
                    }
                }
                if (colSpan <= 1 && rowSpan <= 1) {
                    alert('This cell is not merged.');
                }
                break;
            }
            case 'delete_table': {
                targetTable.remove();
                break;
            }
            default:
                break;
        }

        // Persist updated HTML to section in database
        const sectionEl = document.querySelector(`.dms-section-content[data-section-id="${sectionId}"]`);
        if (sectionEl) {
            const targetSec = sections.find((s) => s.id === sectionId);
            if (targetSec) {
                const baseObj = typeof targetSec.content === 'object' && targetSec.content !== null ? targetSec.content : {};
                onUpdateSectionContent(sectionId, {
                    ...baseObj,
                    html: sectionEl.innerHTML,
                    text: sectionEl.innerText.trim()
                });
            }
        }
    };

    // Trigger image upload for a specific section
    const handleTriggerImageUpload = (sectionId) => {
        setIsUploadingImageForSection(sectionId);
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file || !isUploadingImageForSection || !documentId) return;

        try {
            const res = await documentManagementApi.uploadImage(
                documentId,
                file,
                isUploadingImageForSection
            );

            if (res.success && res.data) {
                const targetSec = sections.find((s) => s.id === isUploadingImageForSection);
                if (targetSec) {
                    const currentContent = typeof targetSec.content === 'object' && targetSec.content !== null ? targetSec.content : {};
                    const images = Array.isArray(currentContent.images) ? [...currentContent.images] : [];
                    images.push({
                        id: res.data.id,
                        url: res.data.url,
                        file_name: res.data.file_name,
                        caption: file.name,
                        width: '100%',
                        align: 'center'
                    });

                    onUpdateSectionContent(targetSec.id, {
                        ...currentContent,
                        images
                    });
                }
            }
        } catch (err) {
            alert('Failed to upload image: ' + err.message);
        } finally {
            setIsUploadingImageForSection(null);
            e.target.value = '';
        }
    };

    // Remove an image from section
    const handleRemoveImage = (sectionId, imageId) => {
        const targetSec = sections.find((s) => s.id === sectionId);
        if (!targetSec) return;

        const currentContent = typeof targetSec.content === 'object' && targetSec.content !== null ? targetSec.content : {};
        const images = (currentContent.images || []).filter((img) => img.id !== imageId);

        onUpdateSectionContent(sectionId, {
            ...currentContent,
            images
        });
    };

    // Update Image Alignment or Width Style
    const handleUpdateImageStyle = (sectionId, imageId, updates) => {
        const targetSec = sections.find((s) => s.id === sectionId);
        if (!targetSec) return;

        const currentContent = typeof targetSec.content === 'object' && targetSec.content !== null ? targetSec.content : {};
        const images = (currentContent.images || []).map((img) =>
            img.id === imageId ? { ...img, ...updates } : img
        );

        onUpdateSectionContent(sectionId, {
            ...currentContent,
            images
        });
    };

    // Interactive Drag to Resize Image Corner Handle
    const handleStartResize = (e, sectionId, imageId, currentWidthStr = '100%') => {
        e.stopPropagation();
        e.preventDefault();

        const currentNum = parseInt(currentWidthStr, 10) || 100;
        const startX = e.clientX;

        const onMouseMove = (moveEvent) => {
            const deltaX = moveEvent.clientX - startX;
            // Scale drag sensitivity
            const newPercent = Math.min(100, Math.max(25, Math.round(currentNum + deltaX * 0.2)));
            setResizingImages((prev) => ({
                ...prev,
                [imageId]: `${newPercent}%`
            }));
        };

        const onMouseUp = () => {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
            setResizingImages((prev) => {
                const finalWidth = prev[imageId];
                if (finalWidth) {
                    handleUpdateImageStyle(sectionId, imageId, { width: finalWidth });
                }
                const nextState = { ...prev };
                delete nextState[imageId];
                return nextState;
            });
        };

        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
    };

    // Resolve Image URL safely for localhost or production
    const resolveImageUrl = (url) => {
        if (!url) return '';
        if (url.startsWith('http://') || url.startsWith('https://')) return url;
        const rawApi = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
        const backendOrigin = rawApi.replace(/\/api\/?$/, '');
        const cleanPath = url.startsWith('/') ? url : `/${url}`;
        return `${backendOrigin}${cleanPath}`;
    };

    // Estimate vertical height (pixels) of a section to calculate A4 sheet pagination
    const estimateSectionHeight = (section) => {
        // If we have an exact DOM measurement, use it!
        if (measuredHeights[section.id] && measuredHeights[section.id] > 50) {
            return measuredHeights[section.id];
        }

        let h = 90; // Base section header + padding + spacing

        const html = section.content?.html || '';
        const text = typeof section.content === 'string'
            ? section.content
            : (section.content?.text || '');

        if (text) {
            const lines = Math.max(1, Math.ceil(text.length / 55));
            h += lines * 24;
        }

        // Count HTML tables: header + rows
        if (html.includes('<table')) {
            const rowMatches = html.match(/<tr/gi);
            const rowCount = rowMatches ? rowMatches.length : 3;
            h += Math.max(140, rowCount * 42 + 50);
        }

        // Count attached / uploaded images
        const images = section.content?.images || [];
        if (images.length > 0) {
            images.forEach(() => {
                h += 420;
            });
        }

        // Count inline raw img tags
        const imgMatches = html.match(/<img/gi);
        if (imgMatches && images.length === 0) {
            h += imgMatches.length * 400;
        }

        // Annotations preview chip row
        const sectionAnnotations = annotations.filter((a) => a.section_id === section.id);
        if (sectionAnnotations.length > 0) {
            h += 38;
        }

        return Math.max(140, h);
    };

    // Multi-page A4 Pagination System
    const pages = useMemo(() => {
        if (!sections || sections.length === 0) {
            return [[]];
        }

        // Safe usable height budget inside A4 page before splitting onto the next page
        const A4_PAGE_CONTENT_BUDGET = 720;
        const pageList = [];
        let currentPage = [];
        let currentHeight = 0;

        sections.forEach((sec, idx) => {
            const secHeight = estimateSectionHeight(sec);

            if (currentPage.length > 0 && currentHeight + secHeight > A4_PAGE_CONTENT_BUDGET) {
                pageList.push(currentPage);
                currentPage = [{ ...sec, globalIndex: idx }];
                currentHeight = secHeight;
            } else {
                currentPage.push({ ...sec, globalIndex: idx });
                currentHeight += secHeight;
            }
        });

        if (currentPage.length > 0) {
            pageList.push(currentPage);
        }

        return pageList.length > 0 ? pageList : [[]];
    }, [sections, measuredHeights, annotations]);

    // Render individual section item
    const renderSectionItem = (section, localIdx) => {
        const isPrimary = !section.parent_section_id;
        const globalIdx = section.globalIndex ?? localIdx;
        const secNumber =
            section.section_number || (isPrimary ? `${globalIdx + 1}.0` : `${globalIdx + 1}.1`);
        const isEditingThisTitle = editingTitleId === section.id;
        const sectionImages = section.content?.images || [];

        // Filter annotations linked to this section
        const sectionAnnotations = annotations.filter(
            (a) => a.section_id === section.id
        );

        return (
            <div
                key={section.id || `sec-${globalIdx}`}
                data-section-block-id={section.id}
                className={`dms-section-block ${activeSectionId === section.id ? 'active' : ''}`}
                onFocus={() => setActiveSectionId(section.id)}
                onContextMenu={(e) => handleContextMenu(e, section.id)}
            >
                {/* Section Header (Title & Actions) */}
                <div className="dms-section-header">
                    {isEditingThisTitle ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', width: '100%' }}>
                            <input
                                type="text"
                                className="dms-form-input"
                                value={tempTitle}
                                onChange={(e) => setTempTitle(e.target.value)}
                                autoFocus
                            />
                            <button
                                type="button"
                                className="dms-btn-primary"
                                style={{ padding: '6px 10px' }}
                                onClick={() => {
                                    onUpdateSectionContent(section.id, section.content, tempTitle);
                                    setEditingTitleId(null);
                                }}
                            >
                                <Check size={13} />
                            </button>
                            <button
                                type="button"
                                className="dms-btn-outline"
                                style={{ padding: '6px 10px' }}
                                onClick={() => setEditingTitleId(null)}
                            >
                                <X size={13} />
                            </button>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                            <h2
                                className={`dms-section-title ${isPrimary ? 'h2' : 'h3'}`}
                                onClick={() => {
                                    setEditingTitleId(section.id);
                                    setTempTitle(section.section_title);
                                }}
                                title="Click to edit section title"
                                style={{ cursor: 'pointer' }}
                            >
                                <span style={{ color: 'var(--dms-primary)', marginRight: '6px' }}>{secNumber}</span>
                                {section.section_title}
                            </h2>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <button
                                    type="button"
                                    className="dms-card-action-btn btn-image"
                                    onClick={() => handleTriggerImageUpload(section.id)}
                                    title="Add image to this section"
                                >
                                    <ImagePlus size={14} />
                                </button>
                                <button
                                    type="button"
                                    className="dms-card-action-btn btn-delete"
                                    onClick={() => onDeleteSection(section.id)}
                                    title="Delete this section"
                                >
                                    <Trash2 size={13} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Rich Editable Content for Section Body */}
                <div
                    className="dms-section-content"
                    data-section-id={section.id}
                    contentEditable
                    suppressContentEditableWarning
                    onContextMenu={(e) => handleContextMenu(e, section.id)}
                    onBlur={(e) => {
                        const newHtml = e.currentTarget.innerHTML;
                        const newText = e.currentTarget.innerText.trim();
                        const existingHtml = section.content?.html;
                        const existingText = typeof section.content === 'string'
                            ? section.content
                            : (section.content?.text || '');

                        if (newHtml !== existingHtml || newText !== existingText) {
                            const baseObj = typeof section.content === 'object' && section.content !== null ? section.content : {};
                            onUpdateSectionContent(section.id, {
                                ...baseObj,
                                html: newHtml,
                                text: newText
                            });
                        }
                    }}
                    dangerouslySetInnerHTML={{
                        __html:
                            section.content?.html ||
                            (typeof section.content === 'string' && section.content.trim()
                                ? section.content
                                : section.content?.text
                                    ? section.content.text
                                    : '<p style="color: #64748b; font-style: italic;">Type section content here...</p>')
                    }}
                    style={{
                        minHeight: '40px',
                        padding: '4px 0',
                        outline: 'none',
                        borderRadius: '4px'
                    }}
                />

                {/* Uploaded / Attached Images with Resize Handles & Alignment Controls */}
                {sectionImages.map((img, imgIdx) => {
                    const imgPins = annotations.filter(
                        (a) => a.annotation_type === 'IMAGE' && (a.section_id === section.id || a.asset_id === img.id)
                    );

                    const effectiveWidth = resizingImages[img.id] || img.width || '100%';
                    const effectiveAlign = img.align || 'center';

                    const wrapperAlignmentStyle = {
                        width: effectiveWidth,
                        marginLeft: effectiveAlign === 'left' ? '0' : 'auto',
                        marginRight: effectiveAlign === 'right' ? '0' : 'auto',
                        display: 'block'
                    };

                    return (
                        <div
                            key={img.id || imgIdx}
                            className="dms-image-wrapper"
                            style={wrapperAlignmentStyle}
                            onClick={(e) => {
                                const rect = e.currentTarget.getBoundingClientRect();
                                const x = parseFloat((((e.clientX - rect.left) / rect.width) * 100).toFixed(2));
                                const y = parseFloat((((e.clientY - rect.top) / rect.height) * 100).toFixed(2));

                                if (onImageClick) {
                                    onImageClick({
                                        x,
                                        y,
                                        sectionId: section.id,
                                        assetId: img.id
                                    });
                                }
                            }}
                            title="Click image to drop an annotation pin, or use controls above"
                        >
                            {/* Floating Toolbar with Alignment, Size & Delete Controls */}
                            <div className="dms-image-toolbar" onClick={(e) => e.stopPropagation()}>
                                {/* Alignment Controls */}
                                <button
                                    type="button"
                                    className={`dms-img-action-btn ${effectiveAlign === 'left' ? 'active' : ''}`}
                                    onClick={() => handleUpdateImageStyle(section.id, img.id, { align: 'left' })}
                                    title="Align Left"
                                >
                                    <AlignLeft size={13} />
                                </button>
                                <button
                                    type="button"
                                    className={`dms-img-action-btn ${effectiveAlign === 'center' ? 'active' : ''}`}
                                    onClick={() => handleUpdateImageStyle(section.id, img.id, { align: 'center' })}
                                    title="Align Center"
                                >
                                    <AlignCenter size={13} />
                                </button>
                                <button
                                    type="button"
                                    className={`dms-img-action-btn ${effectiveAlign === 'right' ? 'active' : ''}`}
                                    onClick={() => handleUpdateImageStyle(section.id, img.id, { align: 'right' })}
                                    title="Align Right"
                                >
                                    <AlignRight size={13} />
                                </button>

                                <span style={{ width: '1px', height: '14px', background: '#e2e8f0', margin: '0 2px' }} />

                                {/* Size Presets */}
                                <button
                                    type="button"
                                    className={`dms-img-size-btn ${effectiveWidth === '50%' ? 'active' : ''}`}
                                    onClick={() => handleUpdateImageStyle(section.id, img.id, { width: '50%' })}
                                    title="50% Width"
                                >
                                    50%
                                </button>
                                <button
                                    type="button"
                                    className={`dms-img-size-btn ${effectiveWidth === '75%' ? 'active' : ''}`}
                                    onClick={() => handleUpdateImageStyle(section.id, img.id, { width: '75%' })}
                                    title="75% Width"
                                >
                                    75%
                                </button>
                                <button
                                    type="button"
                                    className={`dms-img-size-btn ${effectiveWidth === '100%' ? 'active' : ''}`}
                                    onClick={() => handleUpdateImageStyle(section.id, img.id, { width: '100%' })}
                                    title="100% Width"
                                >
                                    100%
                                </button>

                                <span style={{ width: '1px', height: '14px', background: '#e2e8f0', margin: '0 2px' }} />

                                {/* Annotate Pin Button */}
                                <button
                                    type="button"
                                    className="dms-img-action-btn"
                                    onClick={() => {
                                        if (onOpenAddAnnotation) {
                                            onOpenAddAnnotation({
                                                coords: { x: 50, y: 50, asset_id: img.id },
                                                sectionId: section.id,
                                                category: 'ACTION'
                                            });
                                        }
                                    }}
                                    title="Add Annotation Pin"
                                >
                                    <MapPin size={13} />
                                </button>

                                {/* Delete Image */}
                                <button
                                    type="button"
                                    className="dms-img-action-btn"
                                    style={{ color: '#ef4444' }}
                                    onClick={() => handleRemoveImage(section.id, img.id)}
                                    title="Remove Image"
                                >
                                    <Trash2 size={13} />
                                </button>
                            </div>

                            <img
                                src={resolveImageUrl(img.url)}
                                alt={img.caption || img.file_name || 'Section Diagram'}
                                className="dms-image-element"
                            />

                            {/* Numbered Hotspot Pin Markers */}
                            {imgPins.map((ann, pIdx) => {
                                const pinX = ann.anchor_data?.x ?? 50;
                                const pinY = ann.anchor_data?.y ?? 50;
                                const pinColor =
                                    (ann.category || '').toUpperCase().includes('ACTION')
                                        ? 'pin-red'
                                        : (ann.category || '').toUpperCase().includes('CDE')
                                          ? 'pin-purple'
                                          : 'pin-blue';

                                return (
                                    <div
                                        key={ann.id || pIdx}
                                        className={`dms-image-pin ${pinColor}`}
                                        style={{ left: `${pinX}%`, top: `${pinY}%` }}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onSelectAnnotation && onSelectAnnotation(ann);
                                        }}
                                        title={`${ann.reference_code || `REF-${pIdx + 1}`}: ${ann.annotation_text}`}
                                    >
                                        <span>{pIdx + 1}</span>
                                    </div>
                                );
                            })}

                            {/* Interactive Corner Resize Handles */}
                            <div
                                className="dms-resize-handle dms-handle-br"
                                onMouseDown={(e) => handleStartResize(e, section.id, img.id, effectiveWidth)}
                                title="Drag to resize image width"
                            />
                            <div
                                className="dms-resize-handle dms-handle-bl"
                                onMouseDown={(e) => handleStartResize(e, section.id, img.id, effectiveWidth)}
                                title="Drag to resize image width"
                            />
                            <div
                                className="dms-resize-handle dms-handle-tr"
                                onMouseDown={(e) => handleStartResize(e, section.id, img.id, effectiveWidth)}
                                title="Drag to resize image width"
                            />
                            <div
                                className="dms-resize-handle dms-handle-tl"
                                onMouseDown={(e) => handleStartResize(e, section.id, img.id, effectiveWidth)}
                                title="Drag to resize image width"
                            />
                        </div>
                    );
                })}

                {/* Active annotations tags preview under section */}
                {sectionAnnotations.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
                        {sectionAnnotations.map((ann, aIdx) => (
                            <span
                                key={ann.id || aIdx}
                                className="dms-category-pill pill-blue"
                                onClick={() => onSelectAnnotation && onSelectAnnotation(ann)}
                                style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                            >
                                <Tag size={10} />
                                <span>{ann.reference_code || `REF-${aIdx + 1}`}: {ann.category}</span>
                            </span>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="dms-editor-area">
            {/* Hidden image upload input */}
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                style={{ display: 'none' }}
            />

            {/* A4 Multi-Page Stack with Zoom Scale */}
            <div
                className="dms-pages-stack"
                ref={editorPaperRef}
                onMouseUp={handleMouseUp}
                onContextMenu={(e) => handleContextMenu(e)}
                style={{
                    transform: `scale(${zoomScale})`,
                    transformOrigin: 'top center',
                    transition: 'transform 0.15s ease'
                }}
            >
                {sections.length === 0 ? (
                    /* Initial Empty A4 Page Sheet */
                    <div className="dms-a4-page">
                        <div className="dms-a4-header">
                            <span>{documentTitle}</span>
                            <span className="dms-a4-header-tag">{libraryName}</span>
                        </div>
                        <div className="dms-a4-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94a3b8' }}>
                                <p style={{ fontSize: '16px', fontWeight: 600, color: '#475569' }}>
                                    This document has no sections yet.
                                </p>
                                <p style={{ fontSize: '13px', marginTop: '4px' }}>
                                    Add structured sections with rich text, lists, and interactive workflow diagrams.
                                </p>
                                <button
                                    type="button"
                                    className="dms-btn-primary"
                                    style={{ margin: '16px auto 0' }}
                                    onClick={() => onAddSection && onAddSection()}
                                >
                                    <Plus size={15} />
                                    <span>Add First Section</span>
                                </button>
                            </div>
                        </div>
                        <div className="dms-a4-footer">
                            <span>LibList Document Management</span>
                            <span className="dms-a4-page-num">Page 1 of 1</span>
                        </div>
                    </div>
                ) : (
                    /* Auto-Paginated A4 Pages */
                    pages.map((pageSections, pIndex) => (
                        <div key={`a4-page-${pIndex}`} className="dms-a4-page">
                            {/* Running A4 Page Header */}
                            <div className="dms-a4-header">
                                <span>{documentTitle}</span>
                                <span className="dms-a4-header-tag">{libraryName}</span>
                            </div>

                            {/* Usable Page Content Area */}
                            <div className="dms-a4-content">
                                {pageSections.map((sec, localIdx) => renderSectionItem(sec, localIdx))}
                            </div>

                            {/* Running A4 Page Footer */}
                            <div className="dms-a4-footer">
                                <span>LibList Document Management</span>
                                <span className="dms-a4-page-num">
                                    Page {pIndex + 1} of {pages.length}
                                </span>
                            </div>
                        </div>
                    ))
                )}

                {/* Floating Add Section CTA at bottom of document */}
                {sections.length > 0 && (
                    <div style={{ textAlign: 'center', margin: '8px 0 24px' }}>
                        <button
                            type="button"
                            className="dms-btn-primary"
                            style={{ padding: '8px 18px', boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)' }}
                            onClick={() => onAddSection && onAddSection()}
                        >
                            <Plus size={15} />
                            <span>Add New Section</span>
                        </button>
                    </div>
                )}
            </div>

            {/* Custom Right-Click Context Menu */}
            {contextMenu && (
                <div
                    ref={contextMenuRef}
                    className="dms-context-menu"
                    style={{ left: `${contextMenu.x}px`, top: `${contextMenu.y}px` }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {contextMenu.type === 'table' && (
                        <>
                            <div className="dms-context-header">Table Rows & Columns</div>
                            <button
                                type="button"
                                className="dms-context-item"
                                onClick={() => {
                                    handleTableAction('insert_row_above', contextMenu);
                                    setContextMenu(null);
                                }}
                            >
                                <ArrowUpToLine size={14} color="#0284c7" />
                                <span>Insert Row Above</span>
                            </button>
                            <button
                                type="button"
                                className="dms-context-item"
                                onClick={() => {
                                    handleTableAction('insert_row_below', contextMenu);
                                    setContextMenu(null);
                                }}
                            >
                                <ArrowDownToLine size={14} color="#0284c7" />
                                <span>Insert Row Below</span>
                            </button>
                            <button
                                type="button"
                                className="dms-context-item"
                                onClick={() => {
                                    handleTableAction('insert_col_left', contextMenu);
                                    setContextMenu(null);
                                }}
                            >
                                <ArrowLeftToLine size={14} color="#0284c7" />
                                <span>Insert Column Left</span>
                            </button>
                            <button
                                type="button"
                                className="dms-context-item"
                                onClick={() => {
                                    handleTableAction('insert_col_right', contextMenu);
                                    setContextMenu(null);
                                }}
                            >
                                <ArrowRightToLine size={14} color="#0284c7" />
                                <span>Insert Column Right</span>
                            </button>

                            <div className="dms-context-sep" />
                            <div className="dms-context-header">Merge & Split</div>
                            <button
                                type="button"
                                className="dms-context-item"
                                onClick={() => {
                                    handleTableAction('merge_column', contextMenu);
                                    setContextMenu(null);
                                }}
                            >
                                <Columns2 size={14} color="#7c3aed" />
                                <span>Merge Column (with next cell)</span>
                            </button>
                            <button
                                type="button"
                                className="dms-context-item"
                                onClick={() => {
                                    handleTableAction('merge_row', contextMenu);
                                    setContextMenu(null);
                                }}
                            >
                                <Rows2 size={14} color="#7c3aed" />
                                <span>Merge Row (with row below)</span>
                            </button>
                            <button
                                type="button"
                                className="dms-context-item"
                                onClick={() => {
                                    handleTableAction('split_cell', contextMenu);
                                    setContextMenu(null);
                                }}
                            >
                                <Split size={14} color="#059669" />
                                <span>Split Merged Cell</span>
                            </button>

                            <div className="dms-context-sep" />
                            <div className="dms-context-header">Delete</div>
                            <button
                                type="button"
                                className="dms-context-item"
                                style={{ color: '#b91c1c' }}
                                onClick={() => {
                                    handleTableAction('delete_row', contextMenu);
                                    setContextMenu(null);
                                }}
                            >
                                <Trash2 size={14} />
                                <span>Delete Current Row</span>
                            </button>
                            <button
                                type="button"
                                className="dms-context-item"
                                style={{ color: '#b91c1c' }}
                                onClick={() => {
                                    handleTableAction('delete_col', contextMenu);
                                    setContextMenu(null);
                                }}
                            >
                                <Trash2 size={14} />
                                <span>Delete Current Column</span>
                            </button>
                            <button
                                type="button"
                                className="dms-context-item"
                                style={{ color: '#dc2626', fontWeight: 600 }}
                                onClick={() => {
                                    handleTableAction('delete_table', contextMenu);
                                    setContextMenu(null);
                                }}
                            >
                                <Trash2 size={14} />
                                <span>Delete Table</span>
                            </button>
                        </>
                    )}

                    {contextMenu.type === 'section' && (
                        <>
                            <div className="dms-context-header">Section Actions</div>
                            <button
                                type="button"
                                className="dms-context-item"
                                onClick={() => {
                                    if (onAddSection) onAddSection();
                                    setContextMenu(null);
                                }}
                            >
                                <Plus size={14} color="#2563eb" />
                                <span>Add Section</span>
                            </button>
                            <button
                                type="button"
                                className="dms-context-item"
                                onClick={() => {
                                    if (onOpenAddAnnotation) {
                                        onOpenAddAnnotation({
                                            sectionId: contextMenu.sectionId,
                                            category: 'NOTES'
                                        });
                                    }
                                    setContextMenu(null);
                                }}
                            >
                                <Tag size={14} color="#3b82f6" />
                                <span>Add Annotation</span>
                            </button>
                            <button
                                type="button"
                                className="dms-context-item"
                                onClick={() => {
                                    handleTriggerImageUpload(contextMenu.sectionId);
                                    setContextMenu(null);
                                }}
                            >
                                <ImagePlus size={14} color="#059669" />
                                <span>Add Image</span>
                            </button>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
