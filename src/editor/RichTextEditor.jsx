import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Plus, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import { TextStyle } from '@tiptap/extension-text-style';
import FontFamily from '@tiptap/extension-font-family';
import Color from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import TextAlign from '@tiptap/extension-text-align';
import Placeholder from '@tiptap/extension-placeholder';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import {
  Table,
  TableRow,
} from '@tiptap/extension-table';
import { CustomTableCell, CustomTableHeader } from './extensions/CustomTableExtensions';
import Link from '@tiptap/extension-link';

import FontSize from './extensions/FontSizeExtension';
import LineHeight from './extensions/LineHeightExtension';
import CustomImage from './extensions/CustomImageExtension';
import PageBreak from './extensions/PageBreakExtension';
import ContextMenuToolbar from './ContextMenuToolbar';
import EditorToolbar from './EditorToolbar';
import EditorStatusBar from './EditorStatusBar';
import { normalizeRichHtml } from '../utils/richContentConverter';
import {
  hasDraggedImageData,
  extractDroppedImagePayloads,
  extractSyncImagePayloads,
  insertImagesIntoEditorAtCoords,
  handleEditorImagePaste,
} from './utils/imageDropHelper';
import './styles/editor.css';

// Printable content height per page in pixels (A4 standard ratio)
const PAGE_HEIGHT_PX = 960;

// Default demo template showcasing simple text prompt
const DEMO_TEMPLATE = {
  type: 'doc',
  content: [
    {
      type: 'paragraph',
      content: [
        {
          type: 'text',
          text: 'Helo use what can todo',
        },
      ],
    },
  ],
};
 
export const RichTextEditor = ({
  value,
  defaultValue,
  initialContent,
  onChange,
  onSave,
  onImageUpload,
  placeholder = "Start writing or press '/' for commands...",
  paged = true, // Auto-pagination mode
  minHeight = '380px',
  maxHeight,
  readOnly = false,
  showToolbar = true,
  showStatusBar = true,
  autoSaveKey,
  documentTitle = 'Untitled Document',
  onTitleChange,
  pageHeaderSlot = null,
  pageFooterSlot = null,
  pagePadding = undefined,
  zoomLevel: controlledZoomLevel = undefined,
  onZoomChange: onControlledZoomChange = undefined,
  onAddPage = null,
  className = '',
  style = {},
}) => {
  const [docTitle, setDocTitle] = useState(() => {
    if (autoSaveKey) {
      const savedTitle = localStorage.getItem(`${autoSaveKey}_title`);
      if (savedTitle) return savedTitle;
    }
    return documentTitle;
  });

  const [isPaged, setIsPaged] = useState(paged);
  const [pageCount, setPageCount] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [saveStatus, setSaveStatus] = useState('saved');
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const [internalZoom, setInternalZoom] = useState(100);
  const zoomLevel = controlledZoomLevel !== undefined ? controlledZoomLevel : internalZoom;
  const zoomLevelRef = useRef(zoomLevel);

  useEffect(() => {
    zoomLevelRef.current = zoomLevel;
  }, [zoomLevel]);

  const setZoomLevel = useCallback((next) => {
    const raw = typeof next === 'function' ? next(zoomLevelRef.current) : next;
    const clamped = Math.min(200, Math.max(25, Math.round(Number(raw) || 100)));
    zoomLevelRef.current = clamped;
    if (onControlledZoomChange) {
      onControlledZoomChange(clamped);
    } else {
      setInternalZoom(clamped);
    }
  }, [onControlledZoomChange]);

  const [pageSize, setPageSize] = useState({ width: 816, height: 1056 });
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [loadJsonInput, setLoadJsonInput] = useState('');
  const [loadError, setLoadError] = useState('');
  const [contextMenu, setContextMenu] = useState(null); // { x, y } for right-click toolbar
  const [isDropTarget, setIsDropTarget] = useState(false);

  const workspaceRef = useRef(null);
  const pageRef = useRef(null);
  const editorRef = useRef(null);
  const autoSaveTimerRef = useRef(null);
  const resizeObserverRef = useRef(null);
  const lastEmittedHtmlRef = useRef(null);

  const normalizeDocContent = (c) => {
    if (!c) return null;
    if (typeof c === 'string') {
      try {
        const parsed = JSON.parse(c);
        if (parsed && typeof parsed === 'object') return normalizeDocContent(parsed);
      } catch (_) {
        return normalizeRichHtml(c); // Converts legacy Markdown / <div align> / pipe tables into clean HTML
      }
    }
    if (typeof c === 'object') {
      if (c.json) return normalizeDocContent(c.json);
      if (c.type === 'doc') return c;
      if (Array.isArray(c.content)) return { type: 'doc', content: c.content };
    }
    return null;
  };

  // Compute starting content
  const getStartingContent = () => {
    const raw = (value !== undefined) ? value
      : (defaultValue !== undefined) ? defaultValue
      : (initialContent !== undefined) ? initialContent
      : null;

    if (raw !== null && raw !== undefined) {
      if (typeof raw === 'string' && !raw.trim()) return '';
      const normalized = normalizeDocContent(raw);
      if (normalized) return normalized;
    }

    if (autoSaveKey) {
      try {
        const cached = localStorage.getItem(autoSaveKey);
        if (cached) {
          const parsed = normalizeDocContent(cached);
          if (parsed) return parsed;
        }
      } catch {}
    }
    return DEMO_TEMPLATE;
  };

  // Recalculate multi-page pagination based on page breaks or content height
  const updatePagination = useCallback(() => {
    if (!workspaceRef.current) return;
    const editorDom = workspaceRef.current.querySelector('.tiptap');
    if (!editorDom) return;

    // Check for explicit page breaks in the document
    const explicitBreaks = editorDom.querySelectorAll('.document-page-break');
    let computedPages = 1;

    if (explicitBreaks.length > 0) {
      computedPages = explicitBreaks.length + 1;
    } else {
      const contentHeight = editorDom.scrollHeight;
      computedPages = Math.max(1, Math.ceil(contentHeight / PAGE_HEIGHT_PX));
    }
    setPageCount(computedPages);

    // Current page based on cursor position
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();

      if (explicitBreaks.length > 0) {
        let cur = 1;
        explicitBreaks.forEach((brk, idx) => {
          const brkRect = brk.getBoundingClientRect();
          if (rect.top > brkRect.bottom) {
            cur = idx + 2;
          }
        });
        setCurrentPage(Math.min(computedPages, cur));
      } else {
        const domRect = editorDom.getBoundingClientRect();
        const relativeTop = rect.top - domRect.top + editorDom.scrollTop;
        if (relativeTop >= 0) {
          const cur = Math.min(
            computedPages,
            Math.max(1, Math.ceil(relativeTop / PAGE_HEIGHT_PX))
          );
          setCurrentPage(cur);
        }
      }
    }
  }, []);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4],
        },
      }),
      PageBreak,
      Underline,
      TextStyle,
      FontFamily.configure({
        types: ['textStyle'],
      }),
      FontSize,
      Color.configure({
        types: ['textStyle'],
      }),
      Highlight.configure({
        multicolor: true,
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      LineHeight,
      Table.configure({
        resizable: true,
        lastColumnResizable: false,
      }),
      TableRow,
      CustomTableHeader,
      CustomTableCell,
      CustomImage.configure({
        inline: false,
        allowBase64: true,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          rel: 'noopener noreferrer',
          target: '_blank',
        },
      }),
      Subscript,
      Superscript,
      Placeholder.configure({
        placeholder,
      }),
    ],

    content: getStartingContent(),
    editable: !readOnly,
    editorProps: {
      handleDrop: (view, event, _slice, moved) => {
        if (readOnly) return false;
        if (moved || view.dragging) return false;
        const dt = event.dataTransfer;
        if (!hasDraggedImageData(dt)) return false;

        event.preventDefault();
        event.stopPropagation();
        setIsDropTarget(false);

        const coords = { left: event.clientX, top: event.clientY };
        const ed = editorRef.current;
        if (!ed || ed.isDestroyed) return true;

        if (dt.files && dt.files.length > 0) {
          void (async () => {
            const imgs = await extractDroppedImagePayloads(dt, onImageUpload);
            if (imgs.length > 0) {
              insertImagesIntoEditorAtCoords(ed, imgs, coords);
            }
          })();
        } else {
          const imgs = extractSyncImagePayloads(dt);
          if (imgs.length > 0) {
            insertImagesIntoEditorAtCoords(ed, imgs, coords);
          }
        }
        return true;
      },
      handlePaste: (_view, event) => {
        if (readOnly) return false;
        const ed = editorRef.current;
        return handleEditorImagePaste(ed, event, onImageUpload);
      },
    },

    onUpdate: ({ editor }) => {
      setSaveStatus('unsaved');
      updatePagination();

      const json = editor.getJSON();
      const html = editor.getHTML();
      const text = editor.getText();
      lastEmittedHtmlRef.current = html;

      if (onChange) {
        onChange({ json, html, text, editor });
      }

      // Auto-save debouncing
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }

      autoSaveTimerRef.current = setTimeout(async () => {
        setSaveStatus('saving');
        try {
          if (autoSaveKey) {
            localStorage.setItem(autoSaveKey, JSON.stringify(json));
          }
          if (onSave) {
            await onSave({ json, html, text, title: docTitle });
          }
          setSaveStatus('saved');
          setLastSavedAt(new Date());
        } catch (err) {
          console.error('Save failed:', err);
          setSaveStatus('error');
        }
      }, 1200);
    },

    onSelectionUpdate: () => {
      updatePagination();
    },
  });

  useEffect(() => {
    editorRef.current = editor;
  }, [editor]);

  // Observe content resizing to update pagination automatically when content expands
  useEffect(() => {
    if (!workspaceRef.current) return;
    const editorDom = workspaceRef.current.querySelector('.tiptap');
    if (!editorDom) return;

    resizeObserverRef.current = new ResizeObserver(() => {
      updatePagination();
    });
    resizeObserverRef.current.observe(editorDom);

    return () => {
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
      }
    };
  }, [editor, updatePagination]);

  // Sync external value changes if provided (handles HTML string, JSON object, or undefined)
  useEffect(() => {
    if (value !== undefined && editor && !editor.isDestroyed) {
      if (typeof value === 'string' && !value.trim()) {
        if (lastEmittedHtmlRef.current !== '' && !editor.isEmpty) {
          editor.commands.clearContent(false);
          lastEmittedHtmlRef.current = editor.getHTML();
          updatePagination();
        }
        return;
      }
      const normalized = normalizeDocContent(value);
      if (!normalized) return;

      if (typeof normalized === 'string') {
        const currentHtml = editor.getHTML();
        if (normalized !== lastEmittedHtmlRef.current && normalized !== currentHtml) {
          try {
            editor.commands.setContent(normalized, { emitUpdate: false });
            lastEmittedHtmlRef.current = editor.getHTML();
            updatePagination();
          } catch (e) {
            console.warn('RichTextEditor setContent html error:', e);
          }
        }
      } else if (typeof normalized === 'object' && normalized !== null) {
        // Only update if different to avoid infinite cursor jumps
        const currentJson = editor.getJSON();
        if (JSON.stringify(currentJson) !== JSON.stringify(normalized)) {
          try {
            editor.commands.setContent(normalized, { emitUpdate: false });
            lastEmittedHtmlRef.current = editor.getHTML();
            updatePagination();
          } catch (e) {
            console.warn('RichTextEditor setContent json error:', e);
          }
        }
      }
    }
  }, [value, editor, updatePagination]);

  // Handle document title updates
  const handleTitleChange = (newTitle) => {
    setDocTitle(newTitle);
    if (autoSaveKey) {
      localStorage.setItem(`${autoSaveKey}_title`, newTitle);
    }
    if (onTitleChange) {
      onTitleChange(newTitle);
    }
  };

  // Manual save trigger
  const handleManualSave = async () => {
    if (!editor) return;
    setSaveStatus('saving');
    const json = editor.getJSON();
    const html = editor.getHTML();
    const text = editor.getText();

    try {
      if (autoSaveKey) {
        localStorage.setItem(autoSaveKey, JSON.stringify(json));
      }
      if (onSave) {
        await onSave({ json, html, text, title: docTitle });
      }
      setSaveStatus('saved');
      setLastSavedAt(new Date());
    } catch (err) {
      console.error('Manual save failed:', err);
      setSaveStatus('error');
    }
  };

  const handleLoadSample = () => {
    if (editor) {
      editor.commands.setContent(DEMO_TEMPLATE);
      setDocTitle('Strategy & Governance Overview');
      setSaveStatus('saved');
      setLastSavedAt(new Date());
      setTimeout(updatePagination, 50);
    }
  };

  const handleLoadJsonSubmit = () => {
    setLoadError('');
    try {
      const parsed = JSON.parse(loadJsonInput);
      editor.commands.setContent(parsed);
      setShowLoadModal(false);
      setLoadJsonInput('');
      setSaveStatus('saved');
      setLastSavedAt(new Date());
      setTimeout(updatePagination, 50);
    } catch (err) {
      setLoadError(`Failed to load JSON: ${err.message}`);
    }
  };

  useEffect(() => {
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, []);

  // Track unscaled .document-page dimensions for accurate layout zoom scaling & Fit Page
  useEffect(() => {
    const el = pageRef.current;
    if (!el || !isPaged) return;
    const measure = () => {
      const w = el.offsetWidth || 816;
      const h = el.offsetHeight || 1056;
      setPageSize((prev) => (prev.width === w && prev.height === h ? prev : { width: w, height: h }));
    };
    measure();
    if (typeof ResizeObserver !== 'undefined') {
      const ro = new ResizeObserver(measure);
      ro.observe(el);
      return () => ro.disconnect();
    }
  }, [isPaged, editor]);

  // Fit entire white page (+ below-page + button) inside the workspace viewport
  const handleFitFullPage = useCallback(() => {
    const ws = workspaceRef.current;
    if (!ws) return;
    const availW = Math.max(200, ws.clientWidth - 64);
    const availH = Math.max(200, ws.clientHeight - 136);
    const fitW = availW / (pageSize.width || 816);
    const fitH = availH / (pageSize.height || 1056);
    const fitPct = Math.floor(Math.min(fitW, fitH) * 100);
    setZoomLevel(Math.max(25, Math.min(100, fitPct)));
    ws.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  }, [pageSize.width, pageSize.height, setZoomLevel]);

  const handleToggleFitOrActual = useCallback(() => {
    if (zoomLevelRef.current < 95) {
      setZoomLevel(100);
    } else {
      handleFitFullPage();
    }
  }, [handleFitFullPage, setZoomLevel]);

  const handleWorkspaceAddPage = useCallback(() => {
    if (onAddPage) {
      onAddPage();
      return;
    }
    if (editor) {
      editor.chain().focus('end').setPageBreak().run();
      setTimeout(() => {
        updatePagination();
        if (workspaceRef.current) {
          workspaceRef.current.scrollTo({
            top: workspaceRef.current.scrollHeight,
            behavior: 'smooth',
          });
        }
      }, 40);
    }
  }, [editor, onAddPage, updatePagination]);

  // Non-passive mouse wheel / trackpad pinch zoom inside workspace (Ctrl/Meta/Alt + Wheel)
  useEffect(() => {
    const ws = workspaceRef.current;
    if (!ws || !isPaged) return;
    const handleWheelZoom = (e) => {
      if (!(e.ctrlKey || e.metaKey || e.altKey)) return;
      e.preventDefault();
      e.stopPropagation();
      const step = Math.abs(e.deltaY) < 40 ? 5 : 10;
      const delta = e.deltaY < 0 ? step : -step;
      const prevZoom = zoomLevelRef.current;
      const nextZoom = Math.min(200, Math.max(25, prevZoom + delta));
      if (nextZoom === prevZoom) return;
      const ratio = nextZoom / prevZoom;
      const rect = ws.getBoundingClientRect();
      const pointerY = e.clientY - rect.top;
      const pointerX = e.clientX - rect.left;
      setZoomLevel(nextZoom);
      requestAnimationFrame(() => {
        ws.scrollTop = Math.max(0, (ws.scrollTop + pointerY) * ratio - pointerY);
        ws.scrollLeft = Math.max(0, (ws.scrollLeft + pointerX) * ratio - pointerX);
      });
    };
    ws.addEventListener('wheel', handleWheelZoom, { passive: false });
    return () => ws.removeEventListener('wheel', handleWheelZoom);
  }, [isPaged, setZoomLevel, editor]);

  if (!editor) {
    return (
      <div className={`modern-editor-container ${className}`} style={{ minHeight, ...style }}>
        <div style={{ padding: '32px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
          Loading rich text editor...
        </div>
      </div>
    );
  }

  const zoomScale = zoomLevel / 100;
  const scaledWidth = isPaged ? Math.round((pageSize.width || 816) * zoomScale) : undefined;
  const scaledHeight = isPaged ? Math.round((pageSize.height || 1056) * zoomScale) : undefined;

  return (
    <div
      className={`modern-editor-container ${className}`}
      style={{ minHeight, maxHeight, ...style }}
    >
      {/* Modern Segmented Ribbon Toolbar */}
      {showToolbar && (
        <EditorToolbar
          editor={editor}
          documentTitle={docTitle}
          onSave={handleManualSave}
          isSaving={saveStatus === 'saving'}
          onImageUpload={onImageUpload}
          zoomLevel={zoomLevel}
          onZoomChange={setZoomLevel}
          onFitPage={isPaged ? handleFitFullPage : undefined}
          onAddPage={onAddPage}
        />
      )}

      {/* Workspace Shell: Hosts scrollable page canvas + floating Word-style bottom-right zoom controls */}
      <div className="modern-editor-workspace-shell">
        <div
          ref={workspaceRef}
          className={`modern-editor-workspace ${!isPaged ? 'flow-mode' : ''}`}
          style={{ minHeight: `calc(${minHeight} - 80px)` }}
          onDragOver={(e) => {
            if (readOnly) return;
            if (editor?.view?.dragging) return;
            if (!hasDraggedImageData(e.dataTransfer)) return;
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
            if (!isDropTarget) setIsDropTarget(true);
          }}
          onDragLeave={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget)) {
              setIsDropTarget(false);
            }
          }}
          onDrop={(e) => {
            setIsDropTarget(false);
            if (readOnly || e.defaultPrevented) return;
            if (editor?.view?.dragging) return;
            const dt = e.dataTransfer;
            if (!hasDraggedImageData(dt)) return;
            e.preventDefault();
            const coords = { left: e.clientX, top: e.clientY };
            if (!editor || editor.isDestroyed) return;
            if (dt.files && dt.files.length > 0) {
              void (async () => {
                const imgs = await extractDroppedImagePayloads(dt, onImageUpload);
                if (imgs.length > 0) {
                  insertImagesIntoEditorAtCoords(editor, imgs, coords);
                }
              })();
            } else {
              const imgs = extractSyncImagePayloads(dt);
              if (imgs.length > 0) {
                insertImagesIntoEditorAtCoords(editor, imgs, coords);
              }
            }
          }}
          onDoubleClick={(e) => {
            if (!isPaged) return;
            if (
              e.target === workspaceRef.current ||
              (e.target instanceof HTMLElement && e.target.classList.contains('document-zoom-canvas'))
            ) {
              handleToggleFitOrActual();
            }
          }}
          onContextMenu={(e) => {
            if (readOnly) return; // In read-only view mode, allow parent DocumentAnnotationsLayer to handle right-click!
            e.preventDefault();

            // ── Capture the ProseMirror position of the image SYNCHRONOUSLY
            let imageNodePos = null;
            let imageSrc = null;
            if (editor) {
              try {
                let el = e.target;
                // Walk up at most 4 levels to find an <img>
                for (let i = 0; i < 4 && el; i++) {
                  if (el.tagName === 'IMG') {
                    imageSrc = el.getAttribute('src');
                    // Use desc.posBefore if available on pmViewDesc
                    const desc = el.pmViewDesc || (editor.view.docView && editor.view.docView.nearestDesc(el));
                    if (desc && typeof desc.posBefore === 'number') {
                      imageNodePos = desc.posBefore;
                    } else {
                      imageNodePos = editor.view.posAtDOM(el, 0);
                    }
                    break;
                  }
                  el = el.parentElement;
                }
                // Fallback: use posAtCoords if no img tag found in DOM walk
                if (imageNodePos === null) {
                  const coords = editor.view.posAtCoords({ left: e.clientX, top: e.clientY });
                  if (coords) {
                    const $pos = editor.state.doc.resolve(coords.pos);
                    const nodeAfter = $pos.nodeAfter;
                    if (nodeAfter && nodeAfter.type.name === 'image') {
                      imageNodePos = coords.pos;
                      imageSrc = nodeAfter.attrs.src;
                    } else if (coords.inside >= 0) {
                      const nodeAt = editor.state.doc.nodeAt(coords.inside);
                      if (nodeAt && nodeAt.type.name === 'image') {
                        imageNodePos = coords.inside;
                        imageSrc = nodeAt.attrs.src;
                      }
                    }
                  }
                }
              } catch (err) {
                console.error('[RightClick] Error capturing imageNodePos:', err);
                imageNodePos = null;
              }
            }

            setContextMenu({ x: e.clientX, y: e.clientY, imageNodePos, imageSrc });
          }}
        >
          {isPaged ? (
            <div className="document-zoom-canvas">
              <div
                className="document-zoom-stage"
                style={{
                  width: `${scaledWidth}px`,
                  height: `${scaledHeight}px`,
                }}
              >
                <div
                  className="document-page-wrapper"
                  style={{
                    width: `${pageSize.width || 816}px`,
                    transform: `scale(${zoomScale})`,
                    transformOrigin: 'top left',
                  }}
                >
                  <div
                    ref={pageRef}
                    className={`document-page ${isDropTarget ? 'drop-target-active' : ''}`}
                    style={{
                      minHeight: '1056px',
                      margin: 0,
                      padding: pagePadding ? pagePadding : undefined,
                    }}
                  >
                    {pageHeaderSlot}
                    <EditorContent editor={editor} />
                    {pageFooterSlot}
                  </div>
                </div>
              </div>

              {/* Plus (+) Icon Directly Below the Page */}
              {!readOnly && (
                <div className="workspace-below-page-add">
                  <button
                    type="button"
                    className="workspace-add-page-circle-btn"
                    onClick={handleWorkspaceAddPage}
                    title={onAddPage ? 'Add New Page' : 'Insert Page Break'}
                    aria-label="Add Page"
                  >
                    <Plus size={20} strokeWidth={2.5} />
                  </button>
                  <span className="workspace-add-page-label">Add Page</span>
                </div>
              )}
            </div>
          ) : (
            <div className="document-page-wrapper">
              <div
                className="document-page"
                style={{
                  minHeight: 'unset',
                }}
              >
                {pageHeaderSlot}
                <EditorContent editor={editor} />
                {pageFooterSlot}
              </div>
            </div>
          )}
        </div>

        {/* Floating Word-Style Workspace Zoom Pill (Bottom-Right Corner of Canvas) */}
        {isPaged && (
          <div
            className="workspace-floating-zoom-bar"
            title="Mouse Zoom: Drag slider, click Full Page, or hold Ctrl + Mouse Wheel in workspace"
          >
            <button
              type="button"
              className="workspace-zoom-fit-btn"
              onClick={handleFitFullPage}
              title="Fit Full Page in View (Double-click gray workspace background)"
            >
              <Maximize2 size={12} />
              <span>Full Page</span>
            </button>
            <span className="workspace-zoom-divider" />
            <button
              type="button"
              className="workspace-zoom-icon-btn"
              onClick={() => setZoomLevel((z) => Math.max(25, z - 10))}
              disabled={zoomLevel <= 25}
              title="Zoom Out (Ctrl + Scroll Down)"
            >
              <ZoomOut size={13} />
            </button>
            <input
              type="range"
              className="workspace-zoom-slider"
              min={25}
              max={200}
              step={1}
              value={zoomLevel}
              onChange={(e) => setZoomLevel(Number(e.target.value))}
              aria-label="Workspace zoom percentage"
            />
            <button
              type="button"
              className="workspace-zoom-icon-btn"
              onClick={() => setZoomLevel((z) => Math.min(200, z + 10))}
              disabled={zoomLevel >= 200}
              title="Zoom In (Ctrl + Scroll Up)"
            >
              <ZoomIn size={13} />
            </button>
            <button
              type="button"
              className="workspace-zoom-pct-btn"
              onClick={() => setZoomLevel(100)}
              title="Click to reset zoom to 100%"
            >
              {zoomLevel}%
            </button>
          </div>
        )}
      </div>

      {/* Modern Status Bar */}
      {showStatusBar && (
        <EditorStatusBar
          editor={editor}
          saveStatus={saveStatus}
          lastSavedAt={lastSavedAt}
          zoomLevel={zoomLevel}
          onZoomChange={setZoomLevel}
          onFitPage={isPaged ? handleFitFullPage : undefined}
          pageCount={pageCount}
          currentPage={currentPage}
          isPaged={isPaged}
          onAddPage={onAddPage}
        />
      )}

      {/* Right-Click Floating Quick Toolbar (Word Style) */}
      {contextMenu && (
        <ContextMenuToolbar
          editor={editor}
          position={contextMenu}
          imageNodePos={contextMenu.imageNodePos ?? null}
          imageSrc={contextMenu.imageSrc ?? null}
          onClose={() => setContextMenu(null)}
        />
      )}

      {/* Load JSON Modal */}
      {showLoadModal && (
        <div
          className="modal-backdrop"
          onClick={() => setShowLoadModal(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.4)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#ffffff',
              padding: '24px',
              borderRadius: '10px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
              width: '90%',
              maxWidth: '540px',
            }}
          >
            <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', color: '#0f172a' }}>
              Import Document from JSON
            </h3>
            <p style={{ margin: '0 0 12px 0', fontSize: '12px', color: '#64748b' }}>
              Paste your structured JSON document below:
            </p>
            <textarea
              rows={9}
              style={{
                width: '100%',
                padding: '10px',
                fontFamily: 'monospace',
                fontSize: '12px',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                boxSizing: 'border-box',
                outline: 'none',
              }}
              placeholder='{ "type": "doc", "content": [...] }'
              value={loadJsonInput}
              onChange={(e) => setLoadJsonInput(e.target.value)}
            />
            {loadError && (
              <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '6px' }}>
                {loadError}
              </div>
            )}
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '8px',
                marginTop: '16px',
              }}
            >
              <button
                type="button"
                className="btn-modal-cancel"
                onClick={() => setShowLoadModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-modal-submit"
                onClick={handleLoadJsonSubmit}
                disabled={!loadJsonInput.trim()}
              >
                Load Document
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RichTextEditor;
