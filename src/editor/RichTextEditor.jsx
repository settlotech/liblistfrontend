import React, { useState, useEffect, useRef, useCallback } from 'react';
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
import './styles/editor.css';

// A4 at 96 DPI, with a 32px visual gap between sheets.
const PAGE_HEIGHT_PX = 1123;
const PAGE_GAP_PX = 32;
const PAGE_INTERVAL_PX = PAGE_HEIGHT_PX + PAGE_GAP_PX;
const PAGE_MARGIN_PRESETS = {
  normal: { vertical: 96, horizontal: 96 },
  narrow: { vertical: 48, horizontal: 48 },
  wide: { vertical: 144, horizontal: 144 },
};

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
  onReady,
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
  const [marginPreset, setMarginPreset] = useState('normal');
  const [pageCount, setPageCount] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [saveStatus, setSaveStatus] = useState('saved');
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [loadJsonInput, setLoadJsonInput] = useState('');
  const [loadError, setLoadError] = useState('');
  const [contextMenu, setContextMenu] = useState(null); // { x, y } for right-click toolbar

  const workspaceRef = useRef(null);
  const autoSaveTimerRef = useRef(null);
  const resizeObserverRef = useRef(null);

  const normalizeDocContent = (c) => {
    if (!c) return null;
    if (typeof c === 'string') {
      try {
        const parsed = JSON.parse(c);
        if (parsed && typeof parsed === 'object') return normalizeDocContent(parsed);
      } catch (_) {
        return c; // Valid HTML string
      }
    }
    if (typeof c === 'object') {
      if (c.json) return normalizeDocContent(c.json);
      if (c.type === 'doc' || Array.isArray(c.content)) {
        const withoutManualBreaks = (node) => {
          if (Array.isArray(node)) {
            return node.map(withoutManualBreaks).filter(Boolean);
          }
          if (!node || typeof node !== 'object') return node;
          if (node.type === 'pageBreak') return null;
          return Object.fromEntries(
            Object.entries(node).map(([key, value]) => [key, withoutManualBreaks(value)])
          );
        };
        const normalized = withoutManualBreaks(c);
        return normalized.type === 'doc' ? normalized : { type: 'doc', content: normalized.content };
      }
    }
    return null;
  };

  // Compute starting content
  const getStartingContent = () => {
    const raw = (value !== undefined) ? value
      : (defaultValue !== undefined) ? defaultValue
      : (initialContent !== undefined) ? initialContent
      : null;

    if (raw) {
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

  // Keep top-level blocks inside the printable area of each A4 page.
  const updatePagination = useCallback(() => {
    if (!workspaceRef.current) return;
    const editorDom = workspaceRef.current.querySelector('.tiptap');
    if (!editorDom) return;

    const blocks = Array.from(editorDom.children);
    blocks.forEach((block) => {
      if (block.dataset.autoPageMargin) {
        block.style.marginTop = '';
        delete block.dataset.autoPageMargin;
      }
    });

    if (isPaged) {
      const scale = zoomLevel / 100 || 1;
      const editorTop = editorDom.getBoundingClientRect().top;
      const pageMargins = PAGE_MARGIN_PRESETS[marginPreset] || PAGE_MARGIN_PRESETS.normal;
      const pageContentHeight = PAGE_HEIGHT_PX - pageMargins.vertical * 2;

      blocks.forEach((block) => {
        // Ignore old explicit break nodes; automatic page layout is authoritative.
        if (block.classList.contains('document-page-break')) return;

        const rect = block.getBoundingClientRect();
        const top = (rect.top - editorTop) / scale;
        const height = rect.height / scale;
        const pageIndex = Math.floor(top / PAGE_INTERVAL_PX);
        const pageStart = pageIndex * PAGE_INTERVAL_PX;
        const offsetInPage = top - pageStart;
        const overflowsPage = offsetInPage + height > pageContentHeight;
        const fitsOnPage = height <= pageContentHeight;
        const alreadyAtPageTop = offsetInPage <= 48;

        // Keep blocks together when they fit. A block taller than one page can
        // still move forward when it starts late on a page, but won't be pushed
        // repeatedly when it already begins at the top of a page.
        if (overflowsPage && (fitsOnPage || !alreadyAtPageTop)) {
          // The editor is one continuous page element, so CSS padding only
          // creates a top margin for page 1. Add the virtual page's top margin
          // here as well to keep content clear of the page break on later pages.
          const nextPageTop = (pageIndex + 1) * PAGE_INTERVAL_PX + pageMargins.vertical;
          const naturalMarginTop = parseFloat(window.getComputedStyle(block).marginTop) || 0;
          const previousMarginBottom = block.previousElementSibling
            ? parseFloat(window.getComputedStyle(block.previousElementSibling).marginBottom) || 0
            : 0;
          const naturalCollapsedMargin = Math.max(naturalMarginTop, previousMarginBottom);
          const margin = naturalCollapsedMargin + Math.max(0, nextPageTop - top);
          if (margin > 0) {
            block.style.marginTop = `${margin}px`;
            block.dataset.autoPageMargin = 'true';
          }
        }
      });
    }

    const contentHeight = editorDom.scrollHeight;
    const computedPages = Math.max(1, Math.ceil(contentHeight / PAGE_INTERVAL_PX));
    setPageCount(computedPages);

    // Current page based on cursor position
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();

      const domRect = editorDom.getBoundingClientRect();
      const relativeTop = (rect.top - domRect.top) / (zoomLevel / 100 || 1);
      if (relativeTop >= 0) {
        const cur = Math.min(
          computedPages,
          Math.max(1, Math.floor(relativeTop / PAGE_INTERVAL_PX) + 1)
        );
        setCurrentPage(cur);
      }
    }
  }, [isPaged, marginPreset, zoomLevel]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4],
        },
        link: false,
        underline: false,
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

    onUpdate: ({ editor }) => {
      setSaveStatus('unsaved');
      updatePagination();

      const json = editor.getJSON();
      const html = editor.getHTML();
      const text = editor.getText();

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

    onCreate: ({ editor }) => {
      if (onReady) {
        onReady({ json: editor.getJSON(), html: editor.getHTML(), text: editor.getText(), editor });
      }
    },

    onSelectionUpdate: () => {
      updatePagination();
    },
  });

  // Observe content resizing to update pagination automatically when content expands
  useEffect(() => {
    if (!workspaceRef.current) return;
    const editorDom = workspaceRef.current.querySelector('.tiptap');
    if (!editorDom) return;

    resizeObserverRef.current = new ResizeObserver(() => {
      updatePagination();
    });
    resizeObserverRef.current.observe(editorDom);
    updatePagination();

    return () => {
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
      }
    };
  }, [editor, updatePagination]);

  // Sync external value changes if provided (handles HTML string, JSON object, or undefined)
  useEffect(() => {
    if (value !== undefined && editor && !editor.isDestroyed) {
      const normalized = normalizeDocContent(value);
      if (!normalized) return;

      if (typeof normalized === 'string') {
        const currentHtml = editor.getHTML();
        if (normalized !== currentHtml) {
          try {
            editor.commands.setContent(normalized, false);
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
            editor.commands.setContent(normalized, false);
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

  if (!editor) {
    return (
      <div className={`modern-editor-container ${className}`} style={{ minHeight, ...style }}>
        <div style={{ padding: '32px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
          Loading rich text editor...
        </div>
      </div>
    );
  }

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
          onTitleChange={handleTitleChange}
          onSave={handleManualSave}
          onLoadJson={() => setShowLoadModal(true)}
          onLoadSample={handleLoadSample}
          isSaving={saveStatus === 'saving'}
          onImageUpload={onImageUpload}
          isPaged={isPaged}
          onTogglePaged={() => setIsPaged(!isPaged)}
          pageCount={pageCount}
          currentPage={currentPage}
          marginPreset={marginPreset}
          onMarginPresetChange={setMarginPreset}
        />
      )}

      {/* Workspace: Supports both Multi-Page (Paged) and Flow mode */}
      <div
        ref={workspaceRef}
        className={`modern-editor-workspace ${!isPaged ? 'flow-mode' : ''}`}
        style={{ minHeight: `calc(${minHeight} - 80px)` }}
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
        <div
          className="document-page-wrapper"
          style={{ transform: `scale(${zoomLevel / 100})` }}
        >
          <div
            className="document-page"
            style={{
              minHeight: isPaged ? 'var(--rte-page-height)' : 'unset',
              padding: isPaged
                ? `${PAGE_MARGIN_PRESETS[marginPreset].vertical}px ${PAGE_MARGIN_PRESETS[marginPreset].horizontal}px`
                : undefined,
            }}
          >
            <EditorContent editor={editor} />
          </div>
        </div>
      </div>

      {/* Modern Status Bar */}
      {showStatusBar && (
        <EditorStatusBar
          editor={editor}
          saveStatus={saveStatus}
          lastSavedAt={lastSavedAt}
          zoomLevel={zoomLevel}
          onZoomChange={setZoomLevel}
          pageCount={pageCount}
          currentPage={currentPage}
          isPaged={isPaged}
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
              Paste your structured Tiptap JSON document below:
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
