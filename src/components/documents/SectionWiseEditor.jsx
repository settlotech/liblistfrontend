import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import { TextStyle } from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import TextAlign from '@tiptap/extension-text-align';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import { Table, TableRow } from '@tiptap/extension-table';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Undo2,
  Redo2,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Maximize2,
  Layers,
  Quote,
  FileText,
  X,
  Check,
  ChevronLeft,
  ChevronRight,
  Lock,
} from 'lucide-react';

import { CustomTableCell, CustomTableHeader } from '../../editor/extensions/CustomTableExtensions';
import CustomImage from '../../editor/extensions/CustomImageExtension';
import PageBreak from '../../editor/extensions/PageBreakExtension';
import FontSize from '../../editor/extensions/FontSizeExtension';
import LineHeight from '../../editor/extensions/LineHeightExtension';
import TableControls from '../../editor/TableControls';
import ImageControls from '../../editor/ImageControls';
import ContextMenuToolbar from '../../editor/ContextMenuToolbar';
import '../../editor/styles/editor.css';
import './sectionWiseEditor.css';

export const EMPTY_TIPTAP_DOC = {
  type: 'doc',
  content: [{ type: 'paragraph', content: [] }],
};

export function normalizeSectionContent(raw) {
  if (!raw) return EMPTY_TIPTAP_DOC;
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (!trimmed) return EMPTY_TIPTAP_DOC;
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (parsed && typeof parsed === 'object') {
          if (parsed.type === 'doc') return parsed;
          if (parsed.json?.type === 'doc') return parsed.json;
          if (Array.isArray(parsed.content)) return { type: 'doc', content: parsed.content };
        }
      } catch {
        // Treat as HTML / plain text string
      }
    }
    return raw;
  }
  if (typeof raw === 'object') {
    if (raw.json) return normalizeSectionContent(raw.json);
    if (raw.type === 'doc' && Array.isArray(raw.content)) return raw;
    if (Array.isArray(raw.content)) return { type: 'doc', content: raw.content };
  }
  return EMPTY_TIPTAP_DOC;
}

export function extractSectionTipTapJson(raw) {
  const norm = normalizeSectionContent(raw);
  if (norm && typeof norm === 'object' && norm.type === 'doc') {
    return norm;
  }
  const str = typeof norm === 'string' ? norm : '';
  const plain = str.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  return {
    type: 'doc',
    content: [{ type: 'paragraph', content: plain ? [{ type: 'text', text: plain }] : [] }],
  };
}

export function sectionsToCombinedDoc(sections = [], includeHeadings = true) {
  const nodes = [];
  (sections || []).forEach((sec, idx) => {
    const title = sec.section_title || sec.title || `Section ${idx + 1}`;
    const norm = normalizeSectionContent(sec.content);
    if (includeHeadings && title) {
      nodes.push({
        type: 'heading',
        attrs: { level: 2 },
        content: [{ type: 'text', text: title }],
      });
    }
    if (norm && typeof norm === 'object' && Array.isArray(norm.content)) {
      norm.content.forEach((n) => {
        if (n && n.type !== 'pageBreak') nodes.push(n);
      });
    } else if (typeof norm === 'string' && norm.trim()) {
      const plain = norm.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      if (plain) {
        nodes.push({ type: 'paragraph', content: [{ type: 'text', text: plain }] });
      }
    }
  });
  return {
    type: 'doc',
    content: nodes.length > 0 ? nodes : EMPTY_TIPTAP_DOC.content,
  };
}

function buildSectionExtensions(placeholder) {
  return [
    StarterKit.configure({
      heading: { levels: [1, 2, 3, 4] },
      link: false,
      underline: false,
    }),
    PageBreak,
    Underline,
    TextStyle,
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
    Placeholder.configure({ placeholder }),
  ];
}

function computeEditorStats(ed) {
  if (!ed || ed.isDestroyed) return { words: 0, chars: 0 };
  const text = ed.getText().trim();
  return {
    words: text ? text.split(/\s+/).length : 0,
    chars: text.length,
  };
}

function resolveContextImageTarget(editor, event) {
  let imageNodePos = null;
  let imageSrc = null;
  try {
    let el = event.target;
    for (let i = 0; i < 4 && el; i++) {
      if (el.tagName === 'IMG') {
        imageSrc = el.getAttribute('src');
        const desc = el.pmViewDesc || (editor.view.docView && editor.view.docView.nearestDesc(el));
        imageNodePos =
          desc && typeof desc.posBefore === 'number'
            ? desc.posBefore
            : editor.view.posAtDOM(el, 0);
        break;
      }
      el = el.parentElement;
    }
  } catch {
    imageNodePos = null;
  }
  return { imageNodePos, imageSrc };
}

function SectionFormatToolbar({ editor, clauseNumber, stats, variant = 'card' }) {
  if (!editor) return null;

  const handleTableRow = () => {
    if (editor.isActive('table')) {
      editor.chain().focus().addRowAfter().run();
    } else {
      editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
    }
  };

  const handleTableCol = () => {
    if (editor.isActive('table')) {
      editor.chain().focus().addColumnAfter().run();
    } else {
      editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
    }
  };

  return (
    <div className={`swe-editor-toolbar ${variant === 'fullscreen' ? 'is-fullscreen-bar' : ''}`}>
      <div className="swe-toolbar-row">
        <div className="swe-tool-group">
          <button
            type="button"
            className={`swe-tool-btn ${editor.isActive('bold') ? 'active' : ''}`}
            onClick={() => editor.chain().focus().toggleBold().run()}
            title="Bold"
          >
            <Bold size={13} />
          </button>
          <button
            type="button"
            className={`swe-tool-btn ${editor.isActive('italic') ? 'active' : ''}`}
            onClick={() => editor.chain().focus().toggleItalic().run()}
            title="Italic"
          >
            <Italic size={13} />
          </button>
          <button
            type="button"
            className={`swe-tool-btn ${editor.isActive('underline') ? 'active' : ''}`}
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            title="Underline"
          >
            <UnderlineIcon size={13} />
          </button>
          <button
            type="button"
            className={`swe-tool-btn ${editor.isActive('strike') ? 'active' : ''}`}
            onClick={() => editor.chain().focus().toggleStrike().run()}
            title="Strikethrough"
          >
            <Strikethrough size={13} />
          </button>
        </div>

        <div className="swe-tool-group">
          <button
            type="button"
            className={`swe-tool-btn ${editor.isActive('heading', { level: 1 }) ? 'active' : ''}`}
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            title="Heading 1"
          >
            <Heading1 size={13} />
          </button>
          <button
            type="button"
            className={`swe-tool-btn ${editor.isActive('heading', { level: 2 }) ? 'active' : ''}`}
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            title="Heading 2"
          >
            <Heading2 size={13} />
          </button>
          <button
            type="button"
            className={`swe-tool-btn ${editor.isActive('heading', { level: 3 }) ? 'active' : ''}`}
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            title="Heading 3"
          >
            <Heading3 size={13} />
          </button>
        </div>

        <div className="swe-tool-group">
          <button
            type="button"
            className={`swe-tool-btn ${editor.isActive({ textAlign: 'left' }) ? 'active' : ''}`}
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            title="Align Left"
          >
            <AlignLeft size={13} />
          </button>
          <button
            type="button"
            className={`swe-tool-btn ${editor.isActive({ textAlign: 'center' }) ? 'active' : ''}`}
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            title="Align Center"
          >
            <AlignCenter size={13} />
          </button>
          <button
            type="button"
            className={`swe-tool-btn ${editor.isActive({ textAlign: 'right' }) ? 'active' : ''}`}
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            title="Align Right"
          >
            <AlignRight size={13} />
          </button>
          <button
            type="button"
            className={`swe-tool-btn ${editor.isActive({ textAlign: 'justify' }) ? 'active' : ''}`}
            onClick={() => editor.chain().focus().setTextAlign('justify').run()}
            title="Justify"
          >
            <AlignJustify size={13} />
          </button>
        </div>

        <div className="swe-tool-group">
          <button
            type="button"
            className={`swe-tool-btn ${editor.isActive('bulletList') ? 'active' : ''}`}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            title="Bulleted List"
          >
            <List size={13} />
          </button>
          <button
            type="button"
            className={`swe-tool-btn ${editor.isActive('orderedList') ? 'active' : ''}`}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            title="Numbered List"
          >
            <ListOrdered size={13} />
          </button>
        </div>

        <div className="swe-tool-group swe-table-group">
          <TableControls editor={editor} />
          <button
            type="button"
            className="swe-tool-btn swe-table-sub-btn"
            onClick={handleTableRow}
            title={editor.isActive('table') ? 'Add Row Below' : 'Insert 3x3 Table & Row'}
          >
            +Row
          </button>
          <button
            type="button"
            className="swe-tool-btn swe-table-sub-btn"
            onClick={handleTableCol}
            title={editor.isActive('table') ? 'Add Column After' : 'Insert 3x3 Table & Column'}
          >
            +Col
          </button>
        </div>

        <div className="swe-tool-group">
          <ImageControls editor={editor} />
        </div>

        <button
          type="button"
          className={`swe-tool-btn note-btn ${editor.isActive('blockquote') ? 'active' : ''}`}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          title="Insert Compliance / Policy Note Callout"
        >
          <Quote size={12} />
          <span>Note</span>
        </button>

        <div className="swe-tool-group">
          <button
            type="button"
            className="swe-tool-btn"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            title="Undo"
          >
            <Undo2 size={13} />
          </button>
          <button
            type="button"
            className="swe-tool-btn"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            title="Redo"
          >
            <Redo2 size={13} />
          </button>
        </div>
      </div>

      <div className="swe-clause-meta">
        <span className="swe-clause-chip">
          <FileText size={11} /> Clause {clauseNumber}
        </span>
        <span>{stats.words} words · {stats.chars} chars</span>
      </div>
    </div>
  );
}

function SectionRichEditor({
  sectionId,
  value,
  clauseNumber = 1,
  readOnly = false,
  placeholder = 'Write clause details, tables, or policy rules...',
  onChange,
  onFocus,
}) {
  const lastEmittedStrRef = useRef('');
  const [contextMenu, setContextMenu] = useState(null);
  const [stats, setStats] = useState({ words: 0, chars: 0 });

  const initialStartingContent = useMemo(() => normalizeSectionContent(value), []);

  const editor = useEditor({
    extensions: buildSectionExtensions(placeholder),
    content: initialStartingContent,
    editable: !readOnly,
    onCreate: ({ editor: ed }) => {
      const json = ed.getJSON();
      lastEmittedStrRef.current = JSON.stringify(json);
      setStats(computeEditorStats(ed));
      if (typeof value === 'string' && value.trim() && onChange) {
        onChange(json);
      }
    },
    onUpdate: ({ editor: ed }) => {
      const json = ed.getJSON();
      lastEmittedStrRef.current = JSON.stringify(json);
      setStats(computeEditorStats(ed));
      if (onChange) onChange(json);
    },
    onFocus: () => {
      if (onFocus) onFocus(sectionId);
    },
  });

  useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    editor.setEditable(!readOnly);
  }, [editor, readOnly]);

  // Sync when external value changes (e.g. template swap, reorder, or edits from Document Clause Editor)
  useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    const incomingNorm = normalizeSectionContent(value);
    const incomingKey = typeof incomingNorm === 'string' ? incomingNorm : JSON.stringify(incomingNorm);
    if (incomingKey === lastEmittedStrRef.current) return;

    const currentKey = JSON.stringify(editor.getJSON());
    if (incomingKey === currentKey) return;

    try {
      editor.commands.setContent(incomingNorm, false);
      lastEmittedStrRef.current = JSON.stringify(editor.getJSON());
      setStats(computeEditorStats(editor));
    } catch (err) {
      console.warn('SectionRichEditor sync warning:', err);
    }
  }, [value, editor]);

  return (
    <div className="swe-editor-box">
      {editor && !readOnly && (
        <SectionFormatToolbar
          editor={editor}
          clauseNumber={clauseNumber}
          stats={stats}
          variant="card"
        />
      )}

      <div
        className="swe-editor-body"
        onContextMenu={(e) => {
          if (!editor || readOnly) return;
          e.preventDefault();
          const { imageNodePos, imageSrc } = resolveContextImageTarget(editor, e);
          setContextMenu({ x: e.clientX, y: e.clientY, imageNodePos, imageSrc });
        }}
      >
        <EditorContent editor={editor} />
      </div>

      {contextMenu && editor && (
        <ContextMenuToolbar
          editor={editor}
          position={contextMenu}
          imageNodePos={contextMenu.imageNodePos ?? null}
          imageSrc={contextMenu.imageSrc ?? null}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  );
}

function DocumentClauseEditorModal({
  section,
  sectionIndex,
  totalSections,
  documentTitle,
  readOnly,
  titleLocked = false,
  onTitleChange,
  onContentChange,
  onNavigate,
  onClose,
}) {
  const [contextMenu, setContextMenu] = useState(null);
  const [stats, setStats] = useState({ words: 0, chars: 0 });
  const initialContent = useMemo(() => normalizeSectionContent(section?.content), []);

  const editor = useEditor({
    extensions: buildSectionExtensions(
      'Type full operational clause specifications, underwriting parameters, statutory authorities, and compliance rules here...'
    ),
    content: initialContent,
    editable: !readOnly,
    autofocus: !readOnly ? 'end' : false,
    onCreate: ({ editor: ed }) => {
      setStats(computeEditorStats(ed));
    },
    onUpdate: ({ editor: ed }) => {
      setStats(computeEditorStats(ed));
      if (!readOnly && onContentChange) {
        onContentChange(sectionIndex, ed.getJSON());
      }
    },
  });

  useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    editor.setEditable(!readOnly);
  }, [editor, readOnly]);

  const flushAnd = (callback) => {
    if (editor && !editor.isDestroyed && !readOnly && onContentChange) {
      onContentChange(sectionIndex, editor.getJSON());
    }
    callback();
  };

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        flushAnd(onClose);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  const clauseTitle = section?.section_title ?? section?.title ?? '';
  const hasPrev = sectionIndex > 0;
  const hasNext = sectionIndex < totalSections - 1;
  const isParagraph = section?.type === 'paragraph';

  return createPortal(
    <div className="dce-overlay">
      {/* Top Blue Word Ribbon Header */}
      <div className="dce-header">
        <div className="dce-header-left">
          <div className="dce-header-icon">
            <FileText size={16} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div className="dce-header-title-row">
              <h2 className="dce-header-title">
                Document Clause Editor &bull; Clause {sectionIndex + 1}
              </h2>
              <span className="dce-header-page-pill">
                Page {sectionIndex + 1} of {totalSections}
              </span>
            </div>
            <p className="dce-header-subtitle">
              {documentTitle || 'Operational Policy Document'} {readOnly ? '(Read-Only View)' : '(Draft Revision)'}
            </p>
          </div>
        </div>

        <div className="dce-header-actions">
          <button
            type="button"
            className="dce-btn-done-top"
            onClick={() => flushAnd(onClose)}
            title="Save and return to policy view"
          >
            <Check size={14} />
            <span>{readOnly ? 'Close Preview' : 'Done & Return to Policy'}</span>
          </button>
          <button
            type="button"
            className="dce-btn-close-x"
            onClick={() => flushAnd(onClose)}
            title="Close clause editor"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Full-Width Word Action Formatting Toolbar */}
      {!readOnly && editor && (
        <div className="dce-toolbar-bar">
          <SectionFormatToolbar
            editor={editor}
            clauseNumber={sectionIndex + 1}
            stats={stats}
            variant="fullscreen"
          />
        </div>
      )}

      {/* Centered A4 White Paper Canvas */}
      <div className="dce-canvas">
        <div className="dce-page-sheet">
          {/* Word Page Running Header */}
          <div className="dce-page-running-head">
            <span>INSTITUTIONAL GOVERNANCE STANDARD</span>
            <span>CLAUSE PAGE {sectionIndex + 1} / {totalSections}</span>
          </div>

          {/* Section Clause Badge & Editable Title */}
          <div className="dce-clause-title-block">
            <div className="dce-clause-badge-row">
              <span className="dce-clause-num-box">{sectionIndex + 1}</span>
              <span className="dce-clause-spec-pill">
                {isParagraph ? 'PARAGRAPH SPECIFICATION' : 'CLAUSE SPECIFICATION'}
              </span>
            </div>

            {readOnly || titleLocked ? (
              <h2 className="dce-clause-title-readonly">
                {clauseTitle || `Section ${sectionIndex + 1}`}
              </h2>
            ) : (
              <input
                type="text"
                className="dce-clause-title-input"
                value={clauseTitle}
                onChange={(e) => onTitleChange && onTitleChange(sectionIndex, e.target.value)}
                placeholder={`Enter Clause ${sectionIndex + 1} Title (e.g. Purpose & Product Scope)...`}
              />
            )}
          </div>

          {/* Rich TipTap Document Body inside A4 Page */}
          <div
            className="dce-editor-body"
            onClick={() => {
              if (editor && !editor.isDestroyed && !editor.isFocused && !readOnly) {
                editor.commands.focus();
              }
            }}
            onContextMenu={(e) => {
              if (!editor || readOnly) return;
              e.preventDefault();
              const { imageNodePos, imageSrc } = resolveContextImageTarget(editor, e);
              setContextMenu({ x: e.clientX, y: e.clientY, imageNodePos, imageSrc });
            }}
          >
            <EditorContent editor={editor} />
          </div>

          {/* Word Page Running Footer */}
          <div className="dce-page-running-foot">
            <span>Confidential &bull; Enterprise Policy Governance Framework</span>
            <span>Page {sectionIndex + 1} of {totalSections}</span>
          </div>
        </div>
      </div>

      {/* Bottom Status & Clause Pagination Ribbon */}
      <div className="dce-footer">
        <div className="dce-footer-meta">
          <span style={{ fontWeight: 700, color: '#334155' }}>
            Page {sectionIndex + 1} of {totalSections}
          </span>
          <span>&bull;</span>
          <span>{stats.words} words</span>
          <span>&bull;</span>
          <span>{stats.chars} characters</span>
          {!readOnly && (
            <>
              <span>&bull;</span>
              <span className="dce-sync-indicator">
                <Check size={12} />
                <span>Auto-Synchronized</span>
              </span>
            </>
          )}
        </div>

        <div className="dce-footer-actions">
          <button
            type="button"
            className="dce-nav-btn"
            disabled={!hasPrev}
            onClick={() => hasPrev && flushAnd(() => onNavigate(sectionIndex - 1))}
            title="Previous Clause Page"
          >
            <ChevronLeft size={15} />
            <span>Previous Clause</span>
          </button>

          <button
            type="button"
            className="dce-nav-btn primary"
            disabled={!hasNext}
            onClick={() => hasNext && flushAnd(() => onNavigate(sectionIndex + 1))}
            title="Next Clause Page"
          >
            <span>Next Clause</span>
            <ChevronRight size={15} />
          </button>

          <button
            type="button"
            className="dce-done-green-btn"
            onClick={() => flushAnd(onClose)}
          >
            <Check size={14} />
            <span>{readOnly ? 'Close' : 'Done & Return'}</span>
          </button>
        </div>
      </div>

      {contextMenu && editor && (
        <ContextMenuToolbar
          editor={editor}
          position={contextMenu}
          imageNodePos={contextMenu.imageNodePos ?? null}
          imageSrc={contextMenu.imageSrc ?? null}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>,
    document.body
  );
}

export default function SectionWiseEditor({
  sections = [],
  onChange,
  readOnly = false,
  allowEditTemplateTitles = false,
  documentTitle = '',
  headerTitle = 'POLICY CLAUSES & SPECIFICATIONS',
  headerSubtitle = 'Edit clause specifications, reorder sections above or below, or add new custom sections below.',
}) {
  const [expandedIndex, setExpandedIndex] = useState(null);
  const bottomBarRef = useRef(null);

  const safeSections = Array.isArray(sections) ? sections : [];

  const emit = (nextList) => {
    const normalized = nextList.map((s, idx) => ({
      ...s,
      order: idx,
      section_order: idx,
    }));
    onChange && onChange(normalized);
  };

  const handleTitleChange = (idx, titleVal) => {
    if (readOnly) return;
    if (safeSections[idx]?.isTemplateSection && !allowEditTemplateTitles) return;
    const next = safeSections.map((s, i) =>
      i === idx ? { ...s, title: titleVal, section_title: titleVal } : s
    );
    emit(next);
  };

  const handleContentChange = (idx, jsonContent) => {
    if (readOnly) return;
    const next = safeSections.map((s, i) =>
      i === idx ? { ...s, content: jsonContent } : s
    );
    emit(next);
  };

  const handleMoveUp = (idx) => {
    if (idx <= 0 || readOnly) return;
    const next = [...safeSections];
    const tmp = next[idx - 1];
    next[idx - 1] = next[idx];
    next[idx] = tmp;
    emit(next);
  };

  const handleMoveDown = (idx) => {
    if (idx >= safeSections.length - 1 || readOnly) return;
    const next = [...safeSections];
    const tmp = next[idx + 1];
    next[idx + 1] = next[idx];
    next[idx] = tmp;
    emit(next);
  };

  const handleDelete = (idx) => {
    if (readOnly) return;
    if (safeSections.length <= 1) {
      window.alert('A policy document must keep at least one section.');
      return;
    }
    const next = safeSections.filter((_, i) => i !== idx);
    emit(next);
  };

  const handleAddSection = () => {
    if (readOnly) return;
    const nextIdx = safeSections.length + 1;
    const newItem = {
      id: `sec-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title: `${nextIdx}. New Section`,
      section_title: `${nextIdx}. New Section`,
      type: 'section',
      isTemplateSection: false,
      isCustom: true,
      order: safeSections.length,
      section_order: safeSections.length,
      content: EMPTY_TIPTAP_DOC,
    };
    emit([...safeSections, newItem]);
    requestAnimationFrame(() => {
      bottomBarRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    });
  };

  const safeExpandedIndex =
    expandedIndex !== null && safeSections.length > 0
      ? Math.min(Math.max(0, expandedIndex), safeSections.length - 1)
      : null;
  const expandedSection = safeExpandedIndex !== null ? safeSections[safeExpandedIndex] : null;
  const expandedKey = expandedSection
    ? expandedSection.sectionId || expandedSection.id || `sec-idx-${safeExpandedIndex}`
    : null;

  return (
    <div className="section-wise-shell">
      <div className="section-wise-header">
        <div className="section-wise-title-block">
          <h3 className="section-wise-heading">
            <Layers size={15} style={{ color: '#0057B8' }} />
            <span>{headerTitle} ({safeSections.length})</span>
          </h3>
          <p className="section-wise-sub">{headerSubtitle}</p>
        </div>
      </div>

      <div className="section-wise-cards">
        {safeSections.map((sec, idx) => {
          const secKey = sec.sectionId || sec.id || `sec-idx-${idx}`;
          const secTitle = sec.section_title ?? sec.title ?? '';
          const isTitleLocked = readOnly || (Boolean(sec.isTemplateSection) && !allowEditTemplateTitles);

          return (
            <div key={secKey} className="swe-card">
              <div className="swe-card-head">
                <div className="swe-card-title-wrap">
                  <span className="swe-order-badge">{idx + 1}</span>
                  {isTitleLocked ? (
                    <div className="swe-title-locked" title={sec.isTemplateSection ? 'Template section heading cannot be edited' : undefined}>
                      <span className="swe-title-locked-text">{secTitle || `Section ${idx + 1}`}</span>
                      {sec.isTemplateSection && !readOnly && (
                        <span className="swe-tpl-lock-pill">
                          <Lock size={10} />
                          <span>Template Topic</span>
                        </span>
                      )}
                    </div>
                  ) : (
                    <input
                      type="text"
                      className="swe-title-input"
                      value={secTitle}
                      onChange={(e) => handleTitleChange(idx, e.target.value)}
                      placeholder={`Enter Section ${idx + 1} Heading...`}
                    />
                  )}
                </div>

                <div className="swe-card-controls">
                  <button
                    type="button"
                    className="swe-icon-btn"
                    title="Open Document Clause Editor (Full Screen)"
                    onClick={() => setExpandedIndex(idx)}
                  >
                    <Maximize2 size={14} />
                  </button>
                  {!readOnly && (
                    <>
                      <button
                        type="button"
                        className="swe-icon-btn"
                        disabled={idx === 0}
                        title="Move section up"
                        onClick={() => handleMoveUp(idx)}
                      >
                        <ArrowUp size={14} />
                      </button>
                      <button
                        type="button"
                        className="swe-icon-btn"
                        disabled={idx >= safeSections.length - 1}
                        title="Move section down"
                        onClick={() => handleMoveDown(idx)}
                      >
                        <ArrowDown size={14} />
                      </button>
                      <button
                        type="button"
                        className="swe-icon-btn danger"
                        title="Delete section"
                        onClick={() => handleDelete(idx)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </>
                  )}
                </div>
              </div>

              <SectionRichEditor
                sectionId={secKey}
                value={sec.content}
                clauseNumber={idx + 1}
                readOnly={readOnly}
                placeholder={`Enter ${secTitle || `Section ${idx + 1}`} clauses, requirements, tables, or notes...`}
                onChange={(json) => handleContentChange(idx, json)}
              />
            </div>
          );
        })}
      </div>

      {!readOnly && (
        <div className="swe-bottom-bar" ref={bottomBarRef}>
          <button
            type="button"
            className="swe-btn-add-section swe-btn-add-section-bottom"
            onClick={handleAddSection}
          >
            <Plus size={15} />
            <span>Add Section</span>
          </button>
        </div>
      )}

      {expandedSection && (
        <DocumentClauseEditorModal
          key={`dce-${safeExpandedIndex}-${expandedKey}`}
          section={expandedSection}
          sectionIndex={safeExpandedIndex}
          totalSections={safeSections.length}
          documentTitle={documentTitle || headerTitle}
          readOnly={readOnly}
          titleLocked={Boolean(expandedSection.isTemplateSection) && !allowEditTemplateTitles}
          onTitleChange={handleTitleChange}
          onContentChange={handleContentChange}
          onNavigate={(nextIdx) => setExpandedIndex(nextIdx)}
          onClose={() => setExpandedIndex(null)}
        />
      )}
    </div>
  );
}
