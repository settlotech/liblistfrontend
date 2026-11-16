import React, { useEffect, useRef, useState } from 'react';
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
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  FilePlus2,
  Undo2,
  Redo2,
} from 'lucide-react';

import { CustomTableCell, CustomTableHeader } from '../../../editor/extensions/CustomTableExtensions';
import CustomImage from '../../../editor/extensions/CustomImageExtension';
import PageBreak from '../../../editor/extensions/PageBreakExtension';
import FontSize from '../../../editor/extensions/FontSizeExtension';
import LineHeight from '../../../editor/extensions/LineHeightExtension';
import HeadingSelector from '../../../editor/HeadingSelector';
import TableControls from '../../../editor/TableControls';
import ImageControls from '../../../editor/ImageControls';
import ContextMenuToolbar from '../../../editor/ContextMenuToolbar';
import { normalizeRichHtml } from '../../../utils/richContentConverter';
import {
  hasDraggedImageData,
  extractDroppedImagePayloads,
  extractSyncImagePayloads,
  insertImagesIntoEditorAtCoords,
  handleEditorImagePaste,
} from '../../../editor/utils/imageDropHelper';
import '../../../editor/styles/editor.css';

/**
 * Compact Rich Clause Editor for inline policy sections.
 * Renders real formatted headings, alignments, tables (headers, rows, columns, merging),
 * embedded images, and page breaks inside the editing area.
 */
export function SectionRichEditor({
  sectionId,
  value = '',
  sectionIndex: _sectionIndex = 0,
  placeholder = 'Type clause content, insert formatted tables, aligned headings, or images...',
  minHeight = '115px',
  onChange,
  onFocus,
  onImageUpload,
}) {
  const lastEmittedRef = useRef(null);
  const editorRef = useRef(null);
  const [contextMenu, setContextMenu] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);

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
      FontSize,
      Color.configure({ types: ['textStyle'] }),
      Highlight.configure({ multicolor: true }),
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
      Placeholder.configure({ placeholder }),
    ],
    content: normalizeRichHtml(value) || '',
    editorProps: {
      handleDrop: (view, event, _slice, moved) => {
        if (moved || view.dragging) return false;
        const dt = event.dataTransfer;
        if (!hasDraggedImageData(dt)) return false;

        event.preventDefault();
        event.stopPropagation();
        setIsDragOver(false);

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
        const ed = editorRef.current;
        return handleEditorImagePaste(ed, event, onImageUpload);
      },
    },
    onUpdate: ({ editor: ed }) => {
      const html = ed.getHTML();
      lastEmittedRef.current = html;
      if (onChange) {
        onChange(html);
      }
    },
    onFocus: () => {
      if (onFocus) onFocus(sectionId);
    },
  });

  useEffect(() => {
    editorRef.current = editor;
  }, [editor]);

  // Sync external updates (e.g., returning from full-page clause editor or switching template)
  useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    if (value === lastEmittedRef.current) return;

    const normalized = normalizeRichHtml(value) || '';
    const currentHtml = editor.getHTML();
    if (normalized !== currentHtml && normalized !== lastEmittedRef.current) {
      try {
        editor.commands.setContent(normalized, { emitUpdate: false });
        lastEmittedRef.current = editor.getHTML();
      } catch (err) {
        console.warn('SectionRichEditor sync warning:', err);
      }
    }
  }, [value, editor]);

  const handleInsertPageBreak = () => {
    if (!editor) return;
    editor.chain().focus().setPageBreak().run();
  };

  return (
    <div className="border border-slate-200 rounded-lg bg-white shadow-2xs overflow-visible">
      {/* Compact Document Formatting Bar */}
      {editor && (
        <div className="bg-gradient-to-r from-slate-100 via-slate-50 to-slate-100 border-b border-slate-200 rounded-t-lg px-2 py-1 flex flex-wrap items-center gap-1 select-none">
          {/* Undo / Redo */}
          <div className="flex items-center bg-white border border-slate-200 rounded-md p-0.5 shadow-2xs">
            <button
              type="button"
              onClick={() => editor.chain().focus().undo().run()}
              disabled={!editor.can().undo()}
              title="Undo"
              className="p-1 hover:bg-slate-100 text-slate-700 disabled:opacity-30 rounded transition cursor-pointer"
            >
              <Undo2 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().redo().run()}
              disabled={!editor.can().redo()}
              title="Redo"
              className="p-1 hover:bg-slate-100 text-slate-700 disabled:opacity-30 rounded transition cursor-pointer"
            >
              <Redo2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Headings / Header Styles */}
          <HeadingSelector editor={editor} />

          {/* Bold, Italic, Underline, Strike */}
          <div className="flex items-center bg-white border border-slate-200 rounded-md p-0.5 shadow-2xs">
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleBold().run()}
              title="Bold"
              className={`p-1 rounded transition cursor-pointer ${
                editor.isActive('bold') ? 'bg-blue-50 text-[#0057B8]' : 'hover:bg-slate-100 text-slate-700'
              }`}
            >
              <Bold className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleItalic().run()}
              title="Italic"
              className={`p-1 rounded transition cursor-pointer ${
                editor.isActive('italic') ? 'bg-blue-50 text-[#0057B8]' : 'hover:bg-slate-100 text-slate-700'
              }`}
            >
              <Italic className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              title="Underline"
              className={`p-1 rounded transition cursor-pointer ${
                editor.isActive('underline') ? 'bg-blue-50 text-[#0057B8]' : 'hover:bg-slate-100 text-slate-700'
              }`}
            >
              <UnderlineIcon className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleStrike().run()}
              title="Strikethrough"
              className={`p-1 rounded transition cursor-pointer ${
                editor.isActive('strike') ? 'bg-blue-50 text-[#0057B8]' : 'hover:bg-slate-100 text-slate-700'
              }`}
            >
              <Strikethrough className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Alignment (Left, Center, Right, Justify) */}
          <div className="flex items-center bg-white border border-slate-200 rounded-md p-0.5 shadow-2xs">
            <button
              type="button"
              onClick={() => editor.chain().focus().setTextAlign('left').run()}
              title="Align Left"
              className={`p-1 rounded transition cursor-pointer ${
                editor.isActive({ textAlign: 'left' }) ? 'bg-blue-50 text-[#0057B8]' : 'hover:bg-slate-100 text-slate-700'
              }`}
            >
              <AlignLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().setTextAlign('center').run()}
              title="Align Center"
              className={`p-1 rounded transition cursor-pointer ${
                editor.isActive({ textAlign: 'center' }) ? 'bg-blue-50 text-[#0057B8]' : 'hover:bg-slate-100 text-slate-700'
              }`}
            >
              <AlignCenter className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().setTextAlign('right').run()}
              title="Align Right"
              className={`p-1 rounded transition cursor-pointer ${
                editor.isActive({ textAlign: 'right' }) ? 'bg-blue-50 text-[#0057B8]' : 'hover:bg-slate-100 text-slate-700'
              }`}
            >
              <AlignRight className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().setTextAlign('justify').run()}
              title="Justify"
              className={`p-1 rounded transition cursor-pointer ${
                editor.isActive({ textAlign: 'justify' }) ? 'bg-blue-50 text-[#0057B8]' : 'hover:bg-slate-100 text-slate-700'
              }`}
            >
              <AlignJustify className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Lists */}
          <div className="flex items-center bg-white border border-slate-200 rounded-md p-0.5 shadow-2xs">
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              title="Bulleted List"
              className={`p-1 rounded transition cursor-pointer ${
                editor.isActive('bulletList') ? 'bg-blue-50 text-[#0057B8]' : 'hover:bg-slate-100 text-slate-700'
              }`}
            >
              <List className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              title="Numbered List"
              className={`p-1 rounded transition cursor-pointer ${
                editor.isActive('orderedList') ? 'bg-blue-50 text-[#0057B8]' : 'hover:bg-slate-100 text-slate-700'
              }`}
            >
              <ListOrdered className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Interactive Table, Header, Rows/Cols & Merge Controls */}
          <div className="flex items-center bg-white border border-slate-200 rounded-md px-0.5 py-0.5 shadow-2xs">
            <TableControls editor={editor} />
          </div>

          {/* Image Upload & Insert Controls */}
          <div className="flex items-center bg-white border border-slate-200 rounded-md px-0.5 py-0.5 shadow-2xs">
            <ImageControls editor={editor} onImageUpload={onImageUpload} />
          </div>

          {/* Add Page Break */}
          <div className="flex items-center bg-white border border-slate-200 rounded-md p-0.5 shadow-2xs gap-0.5">
            <button
              type="button"
              onClick={handleInsertPageBreak}
              title="Insert Page Break / New Page"
              className="px-1.5 py-0.5 hover:bg-slate-100 text-slate-700 rounded text-[10.5px] font-semibold transition cursor-pointer flex items-center gap-1"
            >
              <FilePlus2 className="w-3 h-3 text-[#0057B8]" />
              <span>Add Page</span>
            </button>
          </div>
        </div>
      )}

      {/* Rich WYSIWYG Editable Canvas */}
      <div
        className={`compact-rich-editor-body bg-white rounded-b-lg cursor-text ${isDragOver ? 'compact-rich-editor-drop-active' : ''}`}
        style={{ minHeight }}
        onDragOver={(e) => {
          if (editor?.view?.dragging) return;
          if (!hasDraggedImageData(e.dataTransfer)) return;
          e.preventDefault();
          e.dataTransfer.dropEffect = 'copy';
          if (!isDragOver) setIsDragOver(true);
        }}
        onDragLeave={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget)) {
            setIsDragOver(false);
          }
        }}
        onDrop={(e) => {
          setIsDragOver(false);
          if (e.defaultPrevented || editor?.view?.dragging) return;
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
        onContextMenu={(e) => {
          if (!editor) return;
          e.preventDefault();
          let imageNodePos = null;
          let imageSrc = null;
          try {
            let el = e.target;
            for (let i = 0; i < 4 && el; i++) {
              if (el.tagName === 'IMG') {
                imageSrc = el.getAttribute('src');
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
          } catch {
            imageNodePos = null;
          }
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

export default SectionRichEditor;
