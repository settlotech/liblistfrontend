import React, { useState, useRef, useEffect } from 'react';
import {
  Undo2,
  Redo2,
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Subscript as SubscriptIcon,
  Superscript as SuperscriptIcon,
  Code,
  RemoveFormatting,
  Save,
  FileJson,
  FileCode,
  Printer,
  FileText,
  FilePlus2,
  Plus,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Table as TableIcon,
  Minus,
} from 'lucide-react';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';

import ToolbarGroup from './ToolbarGroup';
import FontFamilyControl from './FontFamilyControl';
import FontSizeControl from './FontSizeControl';
import TextColorPicker from './TextColorPicker';
import HighlightPicker from './HighlightPicker';
import HeadingSelector from './HeadingSelector';
import AlignmentControl from './AlignmentControl';
import ListControls from './ListControls';
import TableControls from './TableControls';
import ImageControls from './ImageControls';
import LinkControls from './LinkControls';

export const EditorToolbar = ({
  editor,
  onSave,
  documentTitle = 'Untitled Document',
  isSaving = false,
  onImageUpload,
  zoomLevel = 100,
  onZoomChange = null,
  onFitPage = null,
  onAddPage = null,
}) => {
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showQuickInsertMenu, setShowQuickInsertMenu] = useState(false);
  const [copiedNotification, setCopiedNotification] = useState(false);
  const exportMenuRef = useRef(null);
  const quickInsertRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target)) {
        setShowExportMenu(false);
      }
      if (quickInsertRef.current && !quickInsertRef.current.contains(e.target)) {
        setShowQuickInsertMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!editor) return null;

  // History states
  const canUndo = editor.can().undo();
  const canRedo = editor.can().redo();

  // Marks states (selection-aware)
  const isBold = editor.isActive('bold');
  const isItalic = editor.isActive('italic');
  const isUnderline = editor.isActive('underline');
  const isStrike = editor.isActive('strike');
  const isCode = editor.isActive('code');
  const isSubscript = editor.isActive('subscript');
  const isSuperscript = editor.isActive('superscript');

  // Export handlers
  const handleDownloadJson = () => {
    const json = editor.getJSON();
    const dataStr =
      'data:text/json;charset=utf-8,' +
      encodeURIComponent(JSON.stringify(json, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute(
      'download',
      `${documentTitle.replace(/\.[^/.]+$/, '')}.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    setShowExportMenu(false);
  };

  const handleCopyJson = async () => {
    const json = editor.getJSON();
    await navigator.clipboard.writeText(JSON.stringify(json, null, 2));
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 2000);
    setShowExportMenu(false);
  };

 

  const handlePrint = () => {
    window.print();
    setShowExportMenu(false);
  };

  const handleDownloadWord = async () => {
    try {
      const json = editor.getJSON();
      const docxParagraphs = [
        new Paragraph({
          heading: HeadingLevel.TITLE,
          children: [
            new TextRun({
              text: documentTitle,
              bold: true,
              size: 38,
              font: 'Calibri',
              color: '1E293B',
            }),
          ],
        }),
      ];

      if (json && json.content) {
        json.content.forEach((node) => {
          if (node.type === 'heading') {
            const level =
              node.attrs?.level === 1
                ? HeadingLevel.HEADING_1
                : node.attrs?.level === 2
                ? HeadingLevel.HEADING_2
                : HeadingLevel.HEADING_3;

            const textRuns = (node.content || []).map(
              (c) =>
                new TextRun({
                  text: c.text || '',
                  bold: true,
                  font: 'Calibri',
                })
            );

            docxParagraphs.push(
              new Paragraph({
                heading: level,
                children: textRuns,
              })
            );
          } else if (node.type === 'paragraph') {
            const textRuns = (node.content || []).map((c) => {
              const marks = c.marks || [];
              const isBold = marks.some((m) => m.type === 'bold');
              const isItalic = marks.some((m) => m.type === 'italic');
              const isUnderline = marks.some((m) => m.type === 'underline');
              return new TextRun({
                text: c.text || '',
                bold: isBold,
                italics: isItalic,
                underline: isUnderline ? {} : undefined,
                font: 'Calibri',
              });
            });

            docxParagraphs.push(
              new Paragraph({
                children: textRuns,
              })
            );
          } else if (node.type === 'bulletList' || node.type === 'orderedList') {
            (node.content || []).forEach((item) => {
              const textContent =
                item.content?.[0]?.content?.[0]?.text ||
                item.content?.[0]?.text ||
                '';
              docxParagraphs.push(
                new Paragraph({
                  bullet: { level: 0 },
                  children: [
                    new TextRun({
                      text: textContent,
                      font: 'Calibri',
                    }),
                  ],
                })
              );
            });
          }
        });
      }

      const doc = new Document({
        sections: [
          {
            properties: {},
            children: docxParagraphs,
          },
        ],
      });

      const blob = await Packer.toBlob(doc);
      const url = URL.createObjectURL(blob);
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', url);
      downloadAnchor.setAttribute(
        'download',
        `${documentTitle.replace(/\.[^/.]+$/, '')}.docx`
      );
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Word export error:', err);
    }
    setShowExportMenu(false);
  };


  return (
    <div className="modern-editor-toolbar-wrapper">
      {/* Main Formatting Toolbar */}
      <div className="toolbar-controls-ribbon">
        {/* History (Undo / Redo) */}
        <ToolbarGroup>
          <button
            type="button"
            className="modern-tool-btn"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!canUndo}
            title="Undo (Ctrl+Z)"
          >
            <Undo2 size={15} />
          </button>
          <button
            type="button"
            className="modern-tool-btn"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!canRedo}
            title="Redo (Ctrl+Y)"
          >
            <Redo2 size={15} />
          </button>
        </ToolbarGroup>

        <div className="modern-separator" />

        {/* Headings & Quick Styles */}
        <ToolbarGroup>
          <HeadingSelector editor={editor} />
        </ToolbarGroup>

        <div className="modern-separator" />

        {/* Font Family & Size */}
        <ToolbarGroup>
          <FontFamilyControl editor={editor} />
          <FontSizeControl editor={editor} />
        </ToolbarGroup>

        <div className="modern-separator" />

        {/* Core Formatting */}
        <ToolbarGroup>
          <button
            type="button"
            className={`modern-tool-btn ${isBold ? 'active' : ''}`}
            onClick={() => editor.chain().focus().toggleBold().run()}
            title="Bold (Ctrl+B)"
          >
            <Bold size={15} />
          </button>

          <button
            type="button"
            className={`modern-tool-btn ${isItalic ? 'active' : ''}`}
            onClick={() => editor.chain().focus().toggleItalic().run()}
            title="Italic (Ctrl+I)"
          >
            <Italic size={15} />
          </button>

          <button
            type="button"
            className={`modern-tool-btn ${isUnderline ? 'active' : ''}`}
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            title="Underline (Ctrl+U)"
          >
            <UnderlineIcon size={15} />
          </button>

          <button
            type="button"
            className={`modern-tool-btn ${isStrike ? 'active' : ''}`}
            onClick={() => editor.chain().focus().toggleStrike().run()}
            title="Strikethrough"
          >
            <Strikethrough size={15} />
          </button>

          <button
            type="button"
            className={`modern-tool-btn ${isSubscript ? 'active' : ''}`}
            onClick={() => editor.chain().focus().toggleSubscript().run()}
            title="Subscript"
          >
            <SubscriptIcon size={14} />
          </button>

          <button
            type="button"
            className={`modern-tool-btn ${isSuperscript ? 'active' : ''}`}
            onClick={() => editor.chain().focus().toggleSuperscript().run()}
            title="Superscript"
          >
            <SuperscriptIcon size={14} />
          </button>

          <button
            type="button"
            className={`modern-tool-btn ${isCode ? 'active' : ''}`}
            onClick={() => editor.chain().focus().toggleCode().run()}
            title="Inline Code"
          >
            <Code size={15} />
          </button>

          <button
            type="button"
            className="modern-tool-btn"
            onClick={() =>
              editor.chain().focus().unsetAllMarks().clearNodes().run()
            }
            title="Clear Formatting"
          >
            <RemoveFormatting size={15} />
          </button>
        </ToolbarGroup>

        <div className="modern-separator" />

        {/* Text & Highlight Colors */}
        <ToolbarGroup>
          <TextColorPicker editor={editor} />
          <HighlightPicker editor={editor} />
        </ToolbarGroup>

        <div className="modern-separator" />

        {/* Paragraph Alignment & Spacing */}
        <ToolbarGroup>
          <AlignmentControl editor={editor} />
        </ToolbarGroup>

        <div className="modern-separator" />

        {/* Lists & Indentation */}
        <ToolbarGroup>
          <ListControls editor={editor} />
        </ToolbarGroup>

        <div className="modern-separator" />

        {/* Objects (Table, Image, Link, Add Page) */}
        <ToolbarGroup>
          <TableControls editor={editor} />
          <ImageControls editor={editor} onImageUpload={onImageUpload} />
          <LinkControls editor={editor} />
          <button
            type="button"
            className="modern-tool-btn"
            onClick={() => editor.chain().focus().setPageBreak().run()}
            title="Insert Page Break (Ctrl+Enter)"
            style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '0 6px', fontSize: '11px', fontWeight: 600 }}
          >
            <FilePlus2 size={14} />
            <span>Page Break</span>
          </button>

          {/* Prominent + Quick Insert / Add Button */}
          <div className="dropdown-control" ref={quickInsertRef}>
            <button
              type="button"
              className={`modern-tool-btn ${showQuickInsertMenu ? 'active' : ''}`}
              onClick={() => setShowQuickInsertMenu(!showQuickInsertMenu)}
              title="Quick Insert (+ Table, Note, Page Break, Add Page)"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '3px',
                padding: '0 8px',
                background: '#eff6ff',
                color: '#0057B8',
                border: '1px solid #bfdbfe',
                fontSize: '12px',
                fontWeight: 700,
              }}
            >
              <Plus size={14} />
            </button>
            {showQuickInsertMenu && (
              <ul className="dropdown-menu export-dropdown-menu" style={{ left: 0, right: 'auto', minWidth: '175px' }}>
                {onAddPage && (
                  <li
                    className="dropdown-item"
                    onClick={() => {
                      onAddPage();
                      setShowQuickInsertMenu(false);
                    }}
                  >
                    <Plus size={14} /> Add New Page
                  </li>
                )}
                <li
                  className="dropdown-item"
                  onClick={() => {
                    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
                    setShowQuickInsertMenu(false);
                  }}
                >
                  <TableIcon size={14} /> Insert Table (3x3)
                </li>
                <li
                  className="dropdown-item"
                  onClick={() => {
                    editor.chain().focus().setPageBreak().run();
                    setShowQuickInsertMenu(false);
                  }}
                >
                  <FilePlus2 size={14} /> Insert Page Break
                </li>
                <li
                  className="dropdown-item"
                  onClick={() => {
                    editor.chain().focus().setHorizontalRule().run();
                    setShowQuickInsertMenu(false);
                  }}
                >
                  <Minus size={14} /> Divider Line
                </li>
              </ul>
            )}
          </div>
        </ToolbarGroup>

        <div className="modern-separator" />

        {/* Prominent Zoom Out / Reset / Zoom In Controls */}
        {onZoomChange && (
          <>
            <ToolbarGroup>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '2px',
                  background: '#f8fafc',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  padding: '1px 3px',
                }}
              >
                <button
                  type="button"
                  className="modern-tool-btn icon-only"
                  onClick={() => onZoomChange(Math.max(25, zoomLevel - 10))}
                  disabled={zoomLevel <= 25}
                  title="Zoom Out (Ctrl + Mouse Wheel)"
                  style={{ width: '24px', height: '24px' }}
                >
                  <ZoomOut size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => onZoomChange(100)}
                  title="Reset Zoom to 100%"
                  style={{
                    border: 'none',
                    background: 'transparent',
                    fontSize: '11px',
                    fontWeight: 700,
                    color: '#334155',
                    padding: '0 4px',
                    cursor: 'pointer',
                    minWidth: '38px',
                  }}
                >
                  {zoomLevel}%
                </button>
                <button
                  type="button"
                  className="modern-tool-btn icon-only"
                  onClick={() => onZoomChange(Math.min(200, zoomLevel + 10))}
                  disabled={zoomLevel >= 200}
                  title="Zoom In (Ctrl + Mouse Wheel)"
                  style={{ width: '24px', height: '24px' }}
                >
                  <ZoomIn size={14} />
                </button>
                {onFitPage && (
                  <button
                    type="button"
                    className="modern-tool-btn icon-only"
                    onClick={onFitPage}
                    title="Fit Full Page in View"
                    style={{ width: '24px', height: '24px' }}
                  >
                    <Maximize2 size={13} />
                  </button>
                )}
              </div>
            </ToolbarGroup>
            <div className="modern-separator" />
          </>
        )}

        {/* Export & Save Actions */}
        <ToolbarGroup>
          <div className="dropdown-control" ref={exportMenuRef}>
            {showExportMenu && (
              <ul className="dropdown-menu export-dropdown-menu">
                <li className="dropdown-item" onClick={handleDownloadWord}>
                  <FileText size={14} /> Download Word (.docx)
                </li>
                <li className="dropdown-item" onClick={handleDownloadJson}>
                  <FileJson size={14} /> Download JSON
                </li>
                <li className="dropdown-item" onClick={handleCopyJson}>
                  <FileCode size={14} /> Copy JSON
                </li>
                <li className="dropdown-item" onClick={handlePrint}>
                  <Printer size={14} /> Print / PDF
                </li>
              </ul>
            )}
          </div>

          {onSave && (
            <button
              type="button"
              className="modern-tool-btn icon-only"
              onClick={onSave}
              disabled={isSaving}
              title={isSaving ? 'Saving...' : 'Save Document'}
            >
              <Save size={15} />
            </button>
          )}
        </ToolbarGroup>
      </div>
    </div>
  );
};

export default EditorToolbar;
