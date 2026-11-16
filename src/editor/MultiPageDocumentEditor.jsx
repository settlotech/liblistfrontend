import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useImperativeHandle,
  forwardRef,
} from 'react';
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
import { Table, TableRow } from '@tiptap/extension-table';
import Link from '@tiptap/extension-link';
import { Plus, ZoomIn, ZoomOut, Maximize2, Image as ImageIcon } from 'lucide-react';

import { CustomTableCell, CustomTableHeader } from './extensions/CustomTableExtensions';
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
  attachImageDragData,
  handleEditorImagePaste,
} from './utils/imageDropHelper';
import './styles/editor.css';

function resolveContextImageTarget(editor, event) {
  if (!editor || !event) return { imageNodePos: null, imageSrc: null };
  try {
    let el = event.target;
    for (let i = 0; i < 4 && el; i++) {
      if (el.tagName === 'IMG') {
        const imageSrc = el.getAttribute('src');
        const desc =
          el.pmViewDesc || (editor.view.docView && editor.view.docView.nearestDesc(el));
        const imageNodePos =
          desc && typeof desc.posBefore === 'number'
            ? desc.posBefore
            : editor.view.posAtDOM(el, 0);
        return { imageNodePos, imageSrc };
      }
      el = el.parentElement;
    }

    const coords = editor.view.posAtCoords({ left: event.clientX, top: event.clientY });
    if (coords) {
      const $pos = editor.state.doc.resolve(coords.pos);
      const nodeAfter = $pos.nodeAfter;
      if (nodeAfter && nodeAfter.type.name === 'image') {
        return { imageNodePos: coords.pos, imageSrc: nodeAfter.attrs.src };
      }
      if (coords.inside >= 0) {
        const nodeAt = editor.state.doc.nodeAt(coords.inside);
        if (nodeAt && nodeAt.type.name === 'image') {
          return { imageNodePos: coords.inside, imageSrc: nodeAt.attrs.src };
        }
      }
    }
  } catch {
    // ignore context target errors
  }
  return { imageNodePos: null, imageSrc: null };
}

/**
 * Individual MS Word-style A4 page inside the continuous stacked MultiPageDocumentEditor.
 */
const WordPageCanvas = ({
  section,
  sectionKey,
  pageIndex,
  totalPages,
  zoomScale,
  pagePadding,
  showPageHeaderFooter,
  isActive,
  isDropTarget,
  placeholder,
  onImageUpload,
  onRegisterEditor,
  onActivatePage,
  onChangeContent,
  onChangeTitle,
  onChangeField,
  onOpenContextMenu,
  registerStageRef,
}) => {
  const pageRef = useRef(null);
  const lastEmittedHtmlRef = useRef(null);
  const [pageSize, setPageSize] = useState({ width: 816, height: 1056 });

  const initialHtml = normalizeRichHtml(section?.content || '') || '';

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4] },
      }),
      PageBreak,
      Underline,
      TextStyle,
      FontFamily.configure({ types: ['textStyle'] }),
      FontSize,
      Color.configure({ types: ['textStyle'] }),
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      LineHeight,
      Table.configure({ resizable: true, lastColumnResizable: false }),
      TableRow,
      CustomTableHeader,
      CustomTableCell,
      CustomImage.configure({ inline: false, allowBase64: true }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' },
      }),
      Subscript,
      Superscript,
      Placeholder.configure({ placeholder }),
    ],
    content: initialHtml,
    editorProps: {
      handleDrop: (view, event) => {
        // Allow internal ProseMirror node drag/reorder natively
        if (view.dragging) return false;
        const dt = event.dataTransfer;
        if (!dt) return false;

        const hasFiles = Array.from(dt.files || []).some(
          (f) => f.type?.startsWith('image/') || /\.(png|jpe?g|gif|webp|svg|bmp|avif)$/i.test(f.name || '')
        );
        const syncImages = hasFiles ? [] : extractSyncImagePayloads(dt);
        if (!hasFiles && syncImages.length === 0) return false;

        event.preventDefault();
        event.stopPropagation();

        const dropPoint = { x: event.clientX, y: event.clientY };
        extractDroppedImagePayloads(dt, onImageUpload).then((images) => {
          if (images.length > 0 && editor && !editor.isDestroyed) {
            onActivatePage(sectionKey, editor);
            insertImagesIntoEditorAtCoords(editor, images, dropPoint);
            const updatedHtml = editor.getHTML();
            lastEmittedHtmlRef.current = updatedHtml;
            onChangeContent(sectionKey, updatedHtml);
          }
        });
        return true;
      },
      handlePaste: (_view, event) => {
        return handleEditorImagePaste(editor, event, onImageUpload, (updatedHtml) => {
          lastEmittedHtmlRef.current = updatedHtml;
          onChangeContent(sectionKey, updatedHtml);
        });
      },
    },
    onUpdate: ({ editor: ed }) => {
      const html = ed.getHTML();
      lastEmittedHtmlRef.current = html;
      onChangeContent(sectionKey, html);
    },
    onFocus: ({ editor: ed }) => {
      onActivatePage(sectionKey, ed);
    },
  });

  useEffect(() => {
    onRegisterEditor(sectionKey, editor);
    return () => onRegisterEditor(sectionKey, null);
  }, [sectionKey, editor, onRegisterEditor]);

  // Sync external state updates without triggering feedback loops
  useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    const normalized = normalizeRichHtml(section?.content || '') || '';
    const currentHtml = editor.getHTML();
    if (normalized !== lastEmittedHtmlRef.current && normalized !== currentHtml) {
      try {
        editor.commands.setContent(normalized, { emitUpdate: false });
        lastEmittedHtmlRef.current = editor.getHTML();
      } catch {
        // ignore transient sync error
      }
    }
  }, [section?.content, editor]);

  // Measure unscaled page size for exact layout zoom box & Fit Page calculations
  useEffect(() => {
    const el = pageRef.current;
    if (!el) return;
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
  }, [editor]);

  const runningHeaderText =
    section?.headerText !== undefined ? section.headerText : 'Header';
  const runningFooterText =
    section?.footerText !== undefined ? section.footerText : 'Footer';

  const scaledWidth = Math.round((pageSize.width || 816) * zoomScale);
  const scaledHeight = Math.round((pageSize.height || 1056) * zoomScale);

  return (
    <div
      ref={(el) => registerStageRef(sectionKey, el)}
      data-page-key={sectionKey}
      data-page-index={pageIndex}
      className="document-zoom-stage"
      style={{
        width: `${scaledWidth}px`,
        height: `${scaledHeight}px`,
      }}
      onMouseDown={() => {
        if (editor) onActivatePage(sectionKey, editor);
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
          className={`document-page ${isActive ? 'active-word-page' : ''} ${
            isDropTarget ? 'drop-target-active' : ''
          }`}
          style={{
            minHeight: '1056px',
            margin: 0,
            padding: pagePadding || '56px 72px',
          }}
          onContextMenu={(e) => {
            if (!editor) return;
            e.preventDefault();
            const target = resolveContextImageTarget(editor, e);
            onOpenContextMenu({
              editor,
              x: e.clientX,
              y: e.clientY,
              ...target,
            });
          }}
        >
          {/* Page Header & Clause Title */}
          <div className="mb-5 select-text">
            {showPageHeaderFooter && (
              <div className="flex items-center justify-between gap-3 pb-2.5 mb-3 border-b border-slate-200 text-[11px] text-slate-400 font-mono">
                <input
                  type="text"
                  value={runningHeaderText}
                  onChange={(e) => onChangeField(sectionKey, 'headerText', e.target.value)}
                  placeholder="Header"
                  className="flex-1 bg-transparent tracking-wide font-semibold text-slate-500 border border-transparent hover:border-slate-200 focus:border-[#0057B8] focus:bg-blue-50/20 px-1.5 py-0.5 rounded outline-none transition"
                />
                <span className="flex-shrink-0 select-none">
                  Page {pageIndex + 1} of {totalPages}
                </span>
              </div>
            )}

            <div>
              <div className="flex items-center gap-2 mb-1.5 select-none">
                <span className="w-6 h-6 rounded-md bg-[#0057B8] text-white font-mono font-bold text-xs flex items-center justify-center flex-shrink-0 shadow-2xs">
                  {pageIndex + 1}
                </span>
              </div>
              <input
                type="text"
                value={section?.title || ''}
                onChange={(e) => onChangeTitle(sectionKey, e.target.value)}
                placeholder="Enter Title..."
                className="w-full text-xl sm:text-2xl font-bold text-slate-900 border-b border-slate-200 hover:border-slate-300 focus:border-[#0057B8] pb-1.5 outline-none transition font-sans placeholder-slate-300 bg-transparent"
              />
            </div>
          </div>

          <EditorContent editor={editor} />

          {/* Page Footer */}
          {showPageHeaderFooter && (
            <div className="mt-8 pt-3 border-t border-slate-200 flex items-center justify-between gap-3 text-[11px] text-slate-400 font-mono">
              <input
                type="text"
                value={runningFooterText}
                onChange={(e) => onChangeField(sectionKey, 'footerText', e.target.value)}
                placeholder="Footer"
                className="flex-1 bg-transparent text-slate-500 border border-transparent hover:border-slate-200 focus:border-[#0057B8] focus:bg-blue-50/20 px-1.5 py-0.5 rounded outline-none transition"
              />
              <span className="flex-shrink-0 select-none">
                Page {pageIndex + 1} of {totalPages}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Full Microsoft Word-like Multi-Page Vertical Scroll Workspace.
 * Displays ALL document pages stacked continuously, tracks active page on scroll,
 * supports dragging images onto/near any page, mouse zoom (25%-200%), Fit Full Page,
 * and a + Add Page control below the last page.
 */
export const MultiPageDocumentEditor = forwardRef(function MultiPageDocumentEditor(
  {
    sections = [],
    initialActiveSectionId = null,
    documentTitle = 'Operational Policy Document',
    extractedImages = [],
    showPageHeaderFooter = true,
    pagePadding = '56px 72px',
    zoomLevel = 100,
    onZoomChange,
    onAddPage,
    onChangeSectionContent,
    onChangeSectionTitle,
    onChangeSectionField,
    onActivePageChange,
    onImageUpload,
    placeholder = 'Type content, drag images anywhere onto or near a page, format tables, or align text...',
  },
  ref
) {
  const workspaceRef = useRef(null);
  const editorsMapRef = useRef({});
  const stageRefsMapRef = useRef({});
  const didInitialScrollRef = useRef(false);
  const prevSectionCountRef = useRef(sections.length);
  const zoomLevelRef = useRef(zoomLevel);

  const [activeKey, setActiveKey] = useState(() => {
    if (initialActiveSectionId) return String(initialActiveSectionId);
    const first = sections[0];
    return first ? String(first.id || 'sec-0') : 'sec-0';
  });
  const [activeEditor, setActiveEditor] = useState(null);
  const [dropTargetKey, setDropTargetKey] = useState(null);
  const [contextMenuState, setContextMenuState] = useState(null);
  const [showAssetsTray, setShowAssetsTray] = useState(false);

  useEffect(() => {
    zoomLevelRef.current = zoomLevel;
  }, [zoomLevel]);

  const setZoomClamped = useCallback(
    (next) => {
      if (!onZoomChange) return;
      const raw = typeof next === 'function' ? next(zoomLevelRef.current) : next;
      const clamped = Math.min(200, Math.max(25, Math.round(Number(raw) || 100)));
      zoomLevelRef.current = clamped;
      onZoomChange(clamped);
    },
    [onZoomChange]
  );

  const handleRegisterEditor = useCallback((key, ed) => {
    if (ed) {
      editorsMapRef.current[key] = ed;
      setActiveEditor((prev) => prev || ed);
    } else {
      delete editorsMapRef.current[key];
    }
  }, []);

  const registerStageRef = useCallback((key, el) => {
    if (el) {
      stageRefsMapRef.current[key] = el;
    } else {
      delete stageRefsMapRef.current[key];
    }
  }, []);

  const handleActivatePage = useCallback(
    (key, ed) => {
      setActiveKey(key);
      if (ed) setActiveEditor(ed);
      const idx = sections.findIndex((s, i) => String(s.id || `sec-${i}`) === String(key));
      if (onActivePageChange && idx >= 0) {
        onActivePageChange(key, idx);
      }
    },
    [sections, onActivePageChange]
  );

  // Scroll smoothly to target page when first opening OR when a new page is appended via + Add Page
  const scrollToPage = useCallback((targetKey, behavior = 'smooth') => {
    const ws = workspaceRef.current;
    const stageEl = stageRefsMapRef.current[targetKey];
    if (!ws || !stageEl) return;
    const wsRect = ws.getBoundingClientRect();
    const elRect = stageEl.getBoundingClientRect();
    const targetTop = Math.max(0, ws.scrollTop + (elRect.top - wsRect.top) - 20);
    ws.scrollTo({ top: targetTop, behavior });
  }, []);

  useEffect(() => {
    if (!didInitialScrollRef.current && initialActiveSectionId) {
      const timer = setTimeout(() => {
        scrollToPage(String(initialActiveSectionId), 'auto');
        const targetEd = editorsMapRef.current[String(initialActiveSectionId)];
        if (targetEd && !targetEd.isDestroyed) {
          setActiveEditor(targetEd);
        }
        didInitialScrollRef.current = true;
      }, 60);
      return () => clearTimeout(timer);
    }
    didInitialScrollRef.current = true;
  }, [initialActiveSectionId, scrollToPage]);

  useEffect(() => {
    if (sections.length > prevSectionCountRef.current) {
      const last = sections[sections.length - 1];
      const lastKey = String(last?.id || `sec-${sections.length - 1}`);
      const timer = setTimeout(() => {
        setActiveKey(lastKey);
        scrollToPage(lastKey, 'smooth');
        const targetEd = editorsMapRef.current[lastKey];
        if (targetEd && !targetEd.isDestroyed) {
          targetEd.commands.focus('end');
          setActiveEditor(targetEd);
        }
      }, 80);
      prevSectionCountRef.current = sections.length;
      return () => clearTimeout(timer);
    }
    prevSectionCountRef.current = sections.length;
  }, [sections, scrollToPage]);

  // Expose synchronous flush so Done & Return / Save Draft always captures latest image transforms & drops
  useImperativeHandle(
    ref,
    () => ({
      flushAllPages: () => {
        const snapshot = {};
        Object.entries(editorsMapRef.current).forEach(([k, ed]) => {
          if (ed && !ed.isDestroyed) {
            snapshot[k] = ed.getHTML();
          }
        });
        return snapshot;
      },
      scrollToPage,
      getActiveEditor: () => activeEditor,
    }),
    [scrollToPage, activeEditor]
  );

  // Track active page naturally while scrolling up/down across all Word pages
  const handleWorkspaceScroll = useCallback(() => {
    const ws = workspaceRef.current;
    if (!ws || sections.length === 0) return;
    const wsRect = ws.getBoundingClientRect();
    const viewportMidY = wsRect.top + wsRect.height * 0.38;

    let closestKey = activeKey;
    let closestIdx = -1;
    let bestDist = Infinity;

    sections.forEach((sec, idx) => {
      const k = String(sec.id || `sec-${idx}`);
      const stage = stageRefsMapRef.current[k];
      if (!stage) return;
      const r = stage.getBoundingClientRect();
      const dist =
        viewportMidY >= r.top && viewportMidY <= r.bottom
          ? 0
          : Math.min(Math.abs(r.top - viewportMidY), Math.abs(r.bottom - viewportMidY));
      if (dist < bestDist) {
        bestDist = dist;
        closestKey = k;
        closestIdx = idx;
      }
    });

    if (closestIdx >= 0 && closestKey !== activeKey) {
      setActiveKey(closestKey);
      const ed = editorsMapRef.current[closestKey];
      if (ed && !ed.isDestroyed) setActiveEditor(ed);
      if (onActivePageChange) onActivePageChange(closestKey, closestIdx);
    }
  }, [sections, activeKey, onActivePageChange]);

  // Fit Full Page inside workspace viewport
  const handleFitFullPage = useCallback(() => {
    const ws = workspaceRef.current;
    if (!ws) return;
    const activeStage =
      stageRefsMapRef.current[activeKey] || Object.values(stageRefsMapRef.current)[0];
    const scaleNow = Math.max(0.25, (zoomLevelRef.current || 100) / 100);
    const naturalW = activeStage ? (activeStage.offsetWidth || 816) / scaleNow : 816;
    const naturalH = activeStage ? (activeStage.offsetHeight || 1056) / scaleNow : 1056;
    const availW = Math.max(200, ws.clientWidth - 64);
    const availH = Math.max(200, ws.clientHeight - 136);
    const fitPct = Math.floor(Math.min(availW / naturalW, availH / naturalH) * 100);
    setZoomClamped(Math.max(25, Math.min(100, fitPct)));
  }, [activeKey, setZoomClamped]);

  // Non-passive mouse wheel / trackpad pinch zoom (Ctrl/Meta/Alt + Wheel)
  useEffect(() => {
    const ws = workspaceRef.current;
    if (!ws) return;
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
      setZoomClamped(nextZoom);
      requestAnimationFrame(() => {
        ws.scrollTop = Math.max(0, (ws.scrollTop + pointerY) * ratio - pointerY);
        ws.scrollLeft = Math.max(0, (ws.scrollLeft + pointerX) * ratio - pointerX);
      });
    };
    ws.addEventListener('wheel', handleWheelZoom, { passive: false });
    return () => ws.removeEventListener('wheel', handleWheelZoom);
  }, [setZoomClamped]);

  // Resolve nearest page vertically when user drags/drops an image near OR onto any page
  const findNearestPageKey = useCallback(
    (clientY) => {
      let bestKey = activeKey || (sections[0] ? String(sections[0].id || 'sec-0') : null);
      let bestDist = Infinity;
      sections.forEach((sec, idx) => {
        const k = String(sec.id || `sec-${idx}`);
        const el = stageRefsMapRef.current[k];
        if (!el) return;
        const r = el.getBoundingClientRect();
        const dist =
          clientY >= r.top && clientY <= r.bottom
            ? 0
            : Math.min(Math.abs(clientY - r.top), Math.abs(clientY - r.bottom));
        if (dist < bestDist) {
          bestDist = dist;
          bestKey = k;
        }
      });
      return bestKey;
    },
    [sections, activeKey]
  );

  const handleWorkspaceDragOver = useCallback(
    (e) => {
      if (!hasDraggedImageData(e.dataTransfer)) return;
      e.preventDefault();
      try {
        e.dataTransfer.dropEffect = 'copy';
      } catch {
        // ignore restricted dropEffect
      }
      const nearest = findNearestPageKey(e.clientY);
      if (nearest !== dropTargetKey) {
        setDropTargetKey(nearest);
      }
    },
    [findNearestPageKey, dropTargetKey]
  );

  const handleWorkspaceDragLeave = useCallback((e) => {
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDropTargetKey(null);
    }
  }, []);

  const handleWorkspaceDrop = useCallback(
    async (e) => {
      const targetKey = findNearestPageKey(e.clientY);
      setDropTargetKey(null);
      if (!hasDraggedImageData(e.dataTransfer)) return;
      const images = await extractDroppedImagePayloads(e.dataTransfer, onImageUpload);
      if (!images || images.length === 0) return;

      e.preventDefault();
      e.stopPropagation();

      const targetEditor = editorsMapRef.current[targetKey] || activeEditor;
      if (targetEditor && !targetEditor.isDestroyed) {
        handleActivatePage(targetKey, targetEditor);
        insertImagesIntoEditorAtCoords(targetEditor, images, { x: e.clientX, y: e.clientY });
        onChangeSectionContent(targetKey, targetEditor.getHTML());
      }
    },
    [
      findNearestPageKey,
      onImageUpload,
      activeEditor,
      handleActivatePage,
      onChangeSectionContent,
    ]
  );

  const activeIndex = Math.max(
    0,
    sections.findIndex((s, i) => String(s.id || `sec-${i}`) === String(activeKey))
  );

  const zoomScale = zoomLevel / 100;

  return (
    <div
      className="modern-editor-container h-full"
      style={{ flex: 1, height: '100%', minHeight: 0, borderRadius: 0, border: 'none' }}
    >
      {/* Shared Top Word Formatting Toolbar bound to focused page */}
      <EditorToolbar
        editor={activeEditor}
        documentTitle={documentTitle}
        onImageUpload={onImageUpload}
        zoomLevel={zoomLevel}
        onZoomChange={setZoomClamped}
        onFitPage={handleFitFullPage}
        onAddPage={onAddPage}
      />

      {/* Optional Extracted Assets Tray (Draggable directly into any Word page) */}
      {extractedImages.length > 0 && (
        <div className="workspace-assets-strip">
          <button
            type="button"
            onClick={() => setShowAssetsTray((prev) => !prev)}
            className="workspace-assets-toggle-btn"
          >
            <ImageIcon size={13} />
            <span>Document Images ({extractedImages.length})</span>
            <span className="workspace-assets-hint">
              {showAssetsTray ? 'Hide' : 'Drag or click to insert into any page'}
            </span>
          </button>

          {showAssetsTray && (
            <div className="workspace-assets-carousel">
              {extractedImages.map((img, idx) => (
                <div
                  key={idx}
                  draggable
                  onDragStart={(e) =>
                    attachImageDragData(e.dataTransfer, {
                      src: img.dataUrl,
                      alt: img.name || `Asset ${idx + 1}`,
                    })
                  }
                  onClick={() => {
                    const targetEd = activeEditor || Object.values(editorsMapRef.current)[0];
                    if (targetEd && !targetEd.isDestroyed) {
                      insertImagesIntoEditorAtCoords(targetEd, [
                        { src: img.dataUrl, alt: img.name || `Asset ${idx + 1}` },
                      ]);
                      onChangeSectionContent(activeKey, targetEd.getHTML());
                    }
                  }}
                  className="workspace-asset-thumb-card"
                  title={`Drag onto any page or click to insert "${img.name || `Asset ${idx + 1}`}"`}
                >
                  <img
                    src={img.dataUrl}
                    alt={img.name || `Asset ${idx + 1}`}
                    draggable={false}
                  />
                  <span>{img.name || `Image ${idx + 1}`}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Workspace Shell: Hosts Continuous Multi-Page Word Canvas + Floating Zoom Pill */}
      <div className="modern-editor-workspace-shell">
        <div
          ref={workspaceRef}
          className="modern-editor-workspace"
          onScroll={handleWorkspaceScroll}
          onDragOver={handleWorkspaceDragOver}
          onDragLeave={handleWorkspaceDragLeave}
          onDrop={handleWorkspaceDrop}
          onDoubleClick={(e) => {
            if (
              e.target === workspaceRef.current ||
              (e.target instanceof HTMLElement &&
                e.target.classList.contains('document-zoom-canvas'))
            ) {
              if (zoomLevelRef.current < 95) {
                setZoomClamped(100);
              } else {
                handleFitFullPage();
              }
            }
          }}
        >
          <div className="document-zoom-canvas multi-page-stack">
            {sections.map((section, idx) => {
              const secKey = String(section.id || `sec-${idx}`);
              return (
                <WordPageCanvas
                  key={secKey}
                  section={section}
                  sectionKey={secKey}
                  pageIndex={idx}
                  totalPages={sections.length}
                  zoomScale={zoomScale}
                  pagePadding={pagePadding}
                  showPageHeaderFooter={showPageHeaderFooter}
                  isActive={secKey === String(activeKey)}
                  isDropTarget={dropTargetKey === secKey}
                  placeholder={placeholder}
                  onImageUpload={onImageUpload}
                  onRegisterEditor={handleRegisterEditor}
                  onActivatePage={handleActivatePage}
                  onChangeContent={onChangeSectionContent}
                  onChangeTitle={onChangeSectionTitle}
                  onChangeField={onChangeSectionField}
                  onOpenContextMenu={setContextMenuState}
                  registerStageRef={registerStageRef}
                />
              );
            })}

            {/* Plus (+) Icon Directly Below the Last Page */}
            <div className="workspace-below-page-add">
              <button
                type="button"
                className="workspace-add-page-circle-btn"
                onClick={() => onAddPage && onAddPage()}
                title="Add New Page"
                aria-label="Add Page"
              >
                <Plus size={20} strokeWidth={2.5} />
              </button>
              <span className="workspace-add-page-label">Add Page</span>
            </div>
          </div>
        </div>

        {/* Floating Word-Style Bottom-Right Workspace Zoom Bar */}
        <div
          className="workspace-floating-zoom-bar"
          title="Mouse Zoom: Drag slider, click Full Page, or hold Ctrl + Mouse Wheel in workspace"
        >
          <button
            type="button"
            className="workspace-zoom-fit-btn"
            onClick={handleFitFullPage}
            title="Fit Full Page in View"
          >
            <Maximize2 size={12} />
            <span>Full Page</span>
          </button>
          <span className="workspace-zoom-divider" />
          <button
            type="button"
            className="workspace-zoom-icon-btn"
            onClick={() => setZoomClamped((z) => Math.max(25, z - 10))}
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
            onChange={(e) => setZoomClamped(Number(e.target.value))}
            aria-label="Workspace zoom percentage"
          />
          <button
            type="button"
            className="workspace-zoom-icon-btn"
            onClick={() => setZoomClamped((z) => Math.min(200, z + 10))}
            disabled={zoomLevel >= 200}
            title="Zoom In (Ctrl + Scroll Up)"
          >
            <ZoomIn size={13} />
          </button>
          <button
            type="button"
            className="workspace-zoom-pct-btn"
            onClick={() => setZoomClamped(100)}
            title="Click to reset zoom to 100%"
          >
            {zoomLevel}%
          </button>
        </div>
      </div>

      {/* Editor Status Bar */}
      {activeEditor && (
        <EditorStatusBar
          editor={activeEditor}
          saveStatus="saved"
          zoomLevel={zoomLevel}
          onZoomChange={setZoomClamped}
          onFitPage={handleFitFullPage}
          pageCount={sections.length}
          currentPage={activeIndex + 1}
          isPaged={true}
          onAddPage={onAddPage}
        />
      )}

      {/* Right-Click Quick Context Menu */}
      {contextMenuState && contextMenuState.editor && (
        <ContextMenuToolbar
          editor={contextMenuState.editor}
          position={{ x: contextMenuState.x, y: contextMenuState.y }}
          imageNodePos={contextMenuState.imageNodePos ?? null}
          imageSrc={contextMenuState.imageSrc ?? null}
          onClose={() => setContextMenuState(null)}
        />
      )}
    </div>
  );
});

export default MultiPageDocumentEditor;

