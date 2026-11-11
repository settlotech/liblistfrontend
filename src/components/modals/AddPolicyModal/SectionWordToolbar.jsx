import React from 'react';
import { 
  Bold, 
  Italic, 
  Underline, 
  Strikethrough, 
  Heading1,
  Heading2, 
  Heading3, 
  List, 
  ListOrdered, 
  Table, 
  Plus, 
  Columns, 
  Rows, 
  Quote, 
  CheckSquare, 
  FileText,
  Sparkles,
  AlignLeft,
  AlignCenter,
  AlignRight
} from 'lucide-react';

/**
 * Word-like Top Action Toolbar for Section & Modular Clause Editing
 * Provides formatting, markdown table insertion, row/column addition, and Word page layout cues.
 */
export function SectionWordToolbar({
  sectionId,
  content = '',
  sectionIndex = 0,
  onApplyFormat
}) {
  // Calculate Word-like metrics
  const cleanText = (content || '').trim();
  const wordCount = cleanText ? cleanText.split(/\s+/).length : 0;
  const charCount = cleanText.length;

  const handleAction = (e, formatKey) => {
    e.preventDefault();
    e.stopPropagation();
    if (onApplyFormat) {
      onApplyFormat(sectionId, formatKey);
    }
  };

  return (
    <div className="bg-gradient-to-r from-slate-100 via-slate-50 to-slate-100 border border-slate-200 border-b-0 rounded-t-lg px-2.5 py-1.5 flex flex-wrap items-center justify-between gap-1.5 select-none shadow-2xs">
      
      {/* Left Formatting Action Group */}
      <div className="flex flex-wrap items-center gap-1">
        
        {/* Text Styles (B, I, U, S) */}
        <div className="flex items-center bg-white border border-slate-200 rounded-md p-0.5 shadow-2xs">
          <button
            type="button"
            onClick={(e) => handleAction(e, 'bold')}
            title="Bold (**text**)"
            className="p-1 hover:bg-slate-100 hover:text-blue-700 text-slate-700 rounded transition cursor-pointer"
          >
            <Bold className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={(e) => handleAction(e, 'italic')}
            title="Italic (*text*)"
            className="p-1 hover:bg-slate-100 hover:text-blue-700 text-slate-700 rounded transition cursor-pointer"
          >
            <Italic className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={(e) => handleAction(e, 'underline')}
            title="Underline (<u>text</u>)"
            className="p-1 hover:bg-slate-100 hover:text-blue-700 text-slate-700 rounded transition cursor-pointer"
          >
            <Underline className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={(e) => handleAction(e, 'strikethrough')}
            title="Strikethrough (~~text~~)"
            className="p-1 hover:bg-slate-100 hover:text-blue-700 text-slate-700 rounded transition cursor-pointer"
          >
            <Strikethrough className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Headings */}
        <div className="flex items-center bg-white border border-slate-200 rounded-md p-0.5 shadow-2xs">
          <button
            type="button"
            onClick={(e) => handleAction(e, 'h1')}
            title="Heading 1 (# Document Title)"
            className="px-1.5 py-0.5 hover:bg-slate-100 hover:text-blue-700 text-slate-700 rounded text-[11px] font-bold transition cursor-pointer flex items-center gap-0.5"
          >
            <Heading1 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={(e) => handleAction(e, 'h2')}
            title="Heading 2 (## Section)"
            className="px-1.5 py-0.5 hover:bg-slate-100 hover:text-blue-700 text-slate-700 rounded text-[11px] font-bold transition cursor-pointer flex items-center gap-0.5"
          >
            <Heading2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={(e) => handleAction(e, 'h3')}
            title="Heading 3 (### Sub-clause)"
            className="px-1.5 py-0.5 hover:bg-slate-100 hover:text-blue-700 text-slate-700 rounded text-[11px] font-bold transition cursor-pointer flex items-center gap-0.5"
          >
            <Heading3 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Text Alignment */}
        <div className="flex items-center bg-white border border-slate-200 rounded-md p-0.5 shadow-2xs">
          <button
            type="button"
            onClick={(e) => handleAction(e, 'alignLeft')}
            title="Align Left"
            className="p-1 hover:bg-slate-100 hover:text-blue-700 text-slate-700 rounded transition cursor-pointer"
          >
            <AlignLeft className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={(e) => handleAction(e, 'alignCenter')}
            title="Align Center"
            className="p-1 hover:bg-slate-100 hover:text-blue-700 text-slate-700 rounded transition cursor-pointer"
          >
            <AlignCenter className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={(e) => handleAction(e, 'alignRight')}
            title="Align Right"
            className="p-1 hover:bg-slate-100 hover:text-blue-700 text-slate-700 rounded transition cursor-pointer"
          >
            <AlignRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Lists */}
        <div className="flex items-center bg-white border border-slate-200 rounded-md p-0.5 shadow-2xs">
          <button
            type="button"
            onClick={(e) => handleAction(e, 'bullet')}
            title="Bulleted List (- item)"
            className="p-1 hover:bg-slate-100 hover:text-blue-700 text-slate-700 rounded transition cursor-pointer"
          >
            <List className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={(e) => handleAction(e, 'number')}
            title="Numbered List (1. item)"
            className="p-1 hover:bg-slate-100 hover:text-blue-700 text-slate-700 rounded transition cursor-pointer"
          >
            <ListOrdered className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={(e) => handleAction(e, 'checkbox')}
            title="Checklist (- [ ] Task)"
            className="p-1 hover:bg-slate-100 hover:text-blue-700 text-slate-700 rounded transition cursor-pointer"
          >
            <CheckSquare className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Word Table Actions Group */}
        <div className="flex items-center bg-blue-50/70 border border-blue-200 rounded-md p-0.5 shadow-2xs gap-0.5">
          <button
            type="button"
            onClick={(e) => handleAction(e, 'table')}
            title="Insert Standard Markdown Table"
            className="px-2 py-0.5 bg-white hover:bg-blue-100 text-blue-800 border border-blue-200 rounded text-[10.5px] font-bold transition cursor-pointer flex items-center gap-1 shadow-2xs"
          >
            <Table className="w-3 h-3 text-blue-600" />
            <span>Table</span>
          </button>
          <button
            type="button"
            onClick={(e) => handleAction(e, 'addRow')}
            title="Append Row to Table"
            className="px-1.5 py-0.5 hover:bg-blue-100 text-blue-700 rounded text-[10.5px] font-semibold transition cursor-pointer flex items-center gap-0.5"
          >
            <Rows className="w-3 h-3" />
            <span>+Row</span>
          </button>
          <button
            type="button"
            onClick={(e) => handleAction(e, 'addCol')}
            title="Append Column to Table"
            className="px-1.5 py-0.5 hover:bg-blue-100 text-blue-700 rounded text-[10.5px] font-semibold transition cursor-pointer flex items-center gap-0.5"
          >
            <Columns className="w-3 h-3" />
            <span>+Col</span>
          </button>
        </div>

        {/* Statutory Note / Callout */}
        <button
          type="button"
          onClick={(e) => handleAction(e, 'note')}
          title="Insert APRA Compliance Callout"
          className="px-2 py-1 bg-white hover:bg-amber-50 text-slate-700 hover:text-amber-800 border border-slate-200 hover:border-amber-300 rounded-md text-[10.5px] font-semibold transition cursor-pointer flex items-center gap-1 shadow-2xs"
        >
          <Quote className="w-3 h-3 text-amber-600" />
          <span>Note</span>
        </button>
      </div>

      {/* Right Word Page Cue / Layout Status */}
      <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono">
        <span className="flex items-center gap-1 bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-600 font-medium shadow-2xs">
          <FileText className="w-3 h-3 text-blue-600" />
          <span>Clause {sectionIndex + 1}</span>
        </span>
        <span className="text-slate-400">
          {wordCount} words • {charCount} chars
        </span>
      </div>
    </div>
  );
}

export default SectionWordToolbar;
