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
  Download,
  FileJson,
  FileCode,
  Printer,
  ChevronDown,
  Sparkles,
  FileText,
  Layers,
  Check,
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
  onLoadJson,
  onLoadSample,
  documentTitle = 'Untitled Document',
  onTitleChange,
  isSaving = false,
  onImageUpload,
  isPaged = true,
  onTogglePaged,
  pageCount = 1,
  currentPage = 1,
  marginPreset = 'normal',
  onMarginPresetChange,
}) => {
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [copiedNotification, setCopiedNotification] = useState(false);
  const exportMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target)) {
        setShowExportMenu(false);
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

        {/* Objects (Table, Image, Link) */}
        <ToolbarGroup>
          <TableControls editor={editor} />
          <ImageControls editor={editor} onImageUpload={onImageUpload} />
          <LinkControls editor={editor} />
          <label className="page-margins-control" title="Set A4 page margins">
            <span>Margins</span>
            <select
              aria-label="Page margins"
              value={marginPreset}
              onChange={(event) => onMarginPresetChange?.(event.target.value)}
            >
              <option value="normal">Normal</option>
              <option value="narrow">Narrow</option>
              <option value="wide">Wide</option>
            </select>
          </label>
        </ToolbarGroup>

        <div className="modern-separator" />

        {/* Export & Save Actions */}
        <ToolbarGroup>
          <div className="dropdown-control" ref={exportMenuRef}>
            {/* <button
              type="button"
              className="modern-tool-btn icon-only"
              onClick={() => setShowExportMenu(!showExportMenu)}
              title="Export (Word, JSON, HTML, PDF)"
              aria-expanded={showExportMenu}
            >
              <Download size={15} />
            </button> */}

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
