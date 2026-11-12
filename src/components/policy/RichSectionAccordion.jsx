import React, { useState, useEffect } from 'react';
import { 
  ChevronDown, 
  ChevronRight, 
  Plus, 
  Trash2, 
  ArrowUp, 
  ArrowDown, 
  Table as TableIcon, 
  List, 
  ListOrdered, 
  Image as ImageIcon, 
  Quote, 
  Bold, 
  Italic, 
  Underline,
  Save,
  CheckCircle2,
  FileEdit,
  Eye,
  Maximize2,
  Minimize2,
  Layers,
  Sparkles
} from 'lucide-react';
import { 
  NumberedListBlock, 
  BulletListBlock, 
  TableBlock, 
  ImageBlock, 
  ParagraphBlock,
  parseMarkdownTable 
} from './RichContentRenderer';

export default function RichSectionAccordion({
  sections = [],
  isEditMode = false,
  onToggleEditMode,
  onSaveSections,
  isSaving = false,
  policyTitle = ''
}) {
  const [localSections, setLocalSections] = useState([]);
  const [expandedSectionIds, setExpandedSectionIds] = useState(new Set());
  const [savedBanner, setSavedBanner] = useState(false);

  // Initialize sections from props
  useEffect(() => {
    if (Array.isArray(sections) && sections.length > 0) {
      setLocalSections(sections);
      // Expand all by default so user can read everything
      setExpandedSectionIds(new Set(sections.map(s => s.id || s.title)));
    } else {
      // Default starter sections
      const defaultSecs = [
        {
          id: 'sec-1',
          title: '1. Purpose & Scope',
          content: 'Defines the operational rules and risk parameters for retail card issuance across all customer segments.\n\n> **Statutory Note:** APRA CPS 234 compliance verification required prior to transaction authorization.'
        },
        {
          id: 'sec-2',
          title: '2. Underwriting Limits & Approvals',
          content: 'Automated decisioning threshold up to $15,000 AUD. Credit assessor review required for limits above $25,000 AUD.'
        }
      ];
      setLocalSections(defaultSecs);
      setExpandedSectionIds(new Set(defaultSecs.map(s => s.id)));
    }
  }, [sections]);

  // Toggle individual section expand/collapse
  const toggleSection = (id) => {
    setExpandedSectionIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Expand all / Collapse all
  const expandAll = () => {
    setExpandedSectionIds(new Set(localSections.map(s => s.id || s.title)));
  };

  const collapseAll = () => {
    setExpandedSectionIds(new Set());
  };

  // Section Actions
  const handleUpdateSectionTitle = (id, newTitle) => {
    setLocalSections(prev => prev.map(s => (s.id || s.title) === id ? { ...s, title: newTitle } : s));
  };

  const handleUpdateSectionContent = (id, newContent) => {
    setLocalSections(prev => prev.map(s => (s.id || s.title) === id ? { ...s, content: newContent } : s));
  };

  const handleAddSection = () => {
    const nextIdx = localSections.length + 1;
    const newId = `sec-${Date.now()}`;
    const newSec = {
      id: newId,
      title: `${nextIdx}. New Section Title`,
      content: 'Enter clause requirements, operational guidelines, or insert a table.'
    };
    setLocalSections(prev => [...prev, newSec]);
    setExpandedSectionIds(prev => new Set([...prev, newId]));
  };

  const handleDeleteSection = (id) => {
    if (localSections.length <= 1) {
      alert('A policy document must contain at least one section.');
      return;
    }
    setLocalSections(prev => prev.filter(s => (s.id || s.title) !== id));
  };

  const handleMoveUp = (index) => {
    if (index <= 0) return;
    setLocalSections(prev => {
      const copy = [...prev];
      const temp = copy[index - 1];
      copy[index - 1] = copy[index];
      copy[index] = temp;
      return copy;
    });
  };

  const handleMoveDown = (index) => {
    if (index >= localSections.length - 1) return;
    setLocalSections(prev => {
      const copy = [...prev];
      const temp = copy[index + 1];
      copy[index + 1] = copy[index];
      copy[index] = temp;
      return copy;
    });
  };

  // Content formatting toolbar actions
  const handleInsertFormat = (id, type) => {
    setLocalSections(prev => prev.map(sec => {
      if ((sec.id || sec.title) !== id) return sec;
      let text = sec.content || '';

      switch (type) {
        case 'bold':
          text += (text ? '\n' : '') + '**Bold Clause Text**';
          break;
        case 'italic':
          text += (text ? '\n' : '') + '*Italic Operational Note*';
          break;
        case 'underline':
          text += (text ? '\n' : '') + '<u>Underlined Statutory Mandatory</u>';
          break;
        case 'table':
          text += (text ? '\n\n' : '') + '| Role | Responsibility | Requirement |\n|---|---|---|\n| Manager | Review & Sign-off | Mandatory |\n| Officer | Verification Check | Automated |';
          break;
        case 'numbered_list':
          text += (text ? '\n\n' : '') + '1. Identify the document owner\n2. Review the document\n   a. Check the approval requirements';
          break;
        case 'bullet_list':
          text += (text ? '\n\n' : '') + '● Customer verification\n○ Identity verification';
          break;
        case 'note':
          text += (text ? '\n\n' : '') + '> **Statutory Note:** APRA CPS 234 compliance verification required prior to transaction authorization.';
          break;
        default:
          break;
      }
      return { ...sec, content: text };
    }));
  };

  const handleSave = async () => {
    if (onSaveSections) {
      await onSaveSections(localSections);
      setSavedBanner(true);
      setTimeout(() => setSavedBanner(false), 3000);
    }
  };

  // Helper to parse and render mixed content (markdown text, markdown tables, callout notes)
  const renderRichContent = (contentStr, sectionId) => {
    if (!contentStr || !contentStr.trim()) {
      return <p className="text-xs text-slate-400 italic">No content in this section.</p>;
    }

    // Check if content is JSON object/array
    if (contentStr.trim().startsWith('{') || contentStr.trim().startsWith('[')) {
      try {
        const parsed = JSON.parse(contentStr);
        if (parsed.type === 'table') {
          return <TableBlock block={parsed} isEditing={false} />;
        }
        if (parsed.type === 'numbered_list') {
          return <NumberedListBlock block={parsed} isEditing={false} />;
        }
        if (parsed.type === 'bullet_list') {
          return <BulletListBlock block={parsed} isEditing={false} />;
        }
        if (parsed.type === 'image') {
          return <ImageBlock block={parsed} isEditing={false} />;
        }
        if (parsed.type === 'paragraph') {
          return <ParagraphBlock block={parsed} isEditing={false} />;
        }
      } catch {
        // Fall through to text rendering
      }
    }

    // Split text into paragraphs and markdown tables
    const blocks = [];
    const lines = contentStr.split('\n');
    let currentText = [];
    let currentTableLines = [];
    let inTable = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const isTableLine = line.trim().startsWith('|') && line.trim().endsWith('|');

      if (isTableLine) {
        if (!inTable) {
          if (currentText.length > 0) {
            blocks.push({ type: 'text', content: currentText.join('\n') });
            currentText = [];
          }
          inTable = true;
        }
        currentTableLines.push(line);
      } else {
        if (inTable) {
          const parsedTable = parseMarkdownTable(currentTableLines.join('\n'));
          if (parsedTable) {
            blocks.push({ type: 'table', block: parsedTable });
          } else {
            blocks.push({ type: 'text', content: currentTableLines.join('\n') });
          }
          currentTableLines = [];
          inTable = false;
        }
        currentText.push(line);
      }
    }

    if (inTable) {
      const parsedTable = parseMarkdownTable(currentTableLines.join('\n'));
      if (parsedTable) {
        blocks.push({ type: 'table', block: parsedTable });
      } else {
        blocks.push({ type: 'text', content: currentTableLines.join('\n') });
      }
    } else if (currentText.length > 0) {
      blocks.push({ type: 'text', content: currentText.join('\n') });
    }

    return (
      <div className="space-y-3">
        {blocks.map((b, bIdx) => {
          if (b.type === 'table') {
            return <TableBlock key={bIdx} block={b.block} isEditing={false} />;
          }

          const textBlock = b.content;
          const subLines = textBlock.split('\n');

          return (
            <div key={bIdx} className="space-y-1.5">
              {subLines.map((line, lIdx) => {
                const trimmed = line.trim();
                if (!trimmed) return <div key={lIdx} className="h-1" />;

                // Statutory Note
                if (trimmed.startsWith('> **Statutory Note:**') || trimmed.startsWith('>')) {
                  return (
                    <div
                      key={lIdx}
                      className="p-3 my-2 rounded-xl bg-amber-50/80 border border-amber-200/90 text-amber-900 text-xs leading-relaxed flex items-start gap-2 shadow-2xs"
                    >
                      <Quote className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <span>{trimmed.replace(/^>\s*/, '').replace(/\*\*/g, '')}</span>
                    </div>
                  );
                }

                // Numbered list item
                const numMatch = trimmed.match(/^(\d+|[a-z])\.\s+(.*)/i);
                if (numMatch) {
                  const isSub = line.startsWith('   ') || line.startsWith('\t');
                  return (
                    <div
                      key={lIdx}
                      className="flex items-start gap-2 text-xs leading-relaxed"
                      style={{ marginLeft: isSub ? '1.5rem' : '0.25rem' }}
                    >
                      <span className="font-mono font-bold text-[#0057B8] shrink-0 bg-blue-50 border border-blue-200/60 px-1.5 py-0.2 rounded text-[11px]">
                        {numMatch[1]}.
                      </span>
                      <span className="text-slate-800">{numMatch[2].replace(/\*\*/g, '')}</span>
                    </div>
                  );
                }

                // Bullet list item
                if (trimmed.startsWith('●') || trimmed.startsWith('○') || trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
                  const isSub = line.startsWith('   ') || line.startsWith('\t') || trimmed.startsWith('○');
                  const cleanText = trimmed.replace(/^[●○\-\*]\s*/, '');
                  return (
                    <div
                      key={lIdx}
                      className="flex items-start gap-2 text-xs leading-relaxed"
                      style={{ marginLeft: isSub ? '1.5rem' : '0.25rem' }}
                    >
                      <span className="text-[#0057B8] shrink-0 text-xs mt-0.5 font-bold">
                        {isSub ? '○' : '●'}
                      </span>
                      <span className="text-slate-800">{cleanText.replace(/\*\*/g, '')}</span>
                    </div>
                  );
                }

                // Standard paragraph
                return (
                  <p key={lIdx} className="text-xs text-slate-700 leading-relaxed">
                    {trimmed.replace(/\*\*/g, '')}
                  </p>
                );
              })}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Header Bar with Mode Toggle, Expand All, and Save Draft */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-white rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-[#0057B8]" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
            Document Sections ({localSections.length})
          </h3>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
            isEditMode 
              ? 'bg-amber-100 text-amber-900 border border-amber-300' 
              : 'bg-blue-50 text-[#0057B8] border border-blue-200'
          }`}>
            {isEditMode ? 'Interactive Editing' : 'Reader View'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Expand / Collapse All */}
          <button
            type="button"
            onClick={expandedSectionIds.size === localSections.length ? collapseAll : expandAll}
            className="px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer flex items-center gap-1"
          >
            {expandedSectionIds.size === localSections.length ? (
              <>
                <Minimize2 className="w-3 h-3" />
                <span>Collapse All</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-3 h-3" />
                <span>Expand All</span>
              </>
            )}
          </button>

          {/* Toggle View / Edit Mode */}
          {onToggleEditMode && (
            <button
              type="button"
              onClick={onToggleEditMode}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-2xs ${
                isEditMode
                  ? 'bg-slate-200 hover:bg-slate-300 text-slate-800'
                  : 'bg-[#0057B8] hover:bg-[#004EA6] text-white shadow-xs'
              }`}
            >
              {isEditMode ? (
                <>
                  <Eye className="w-3.5 h-3.5" />
                  <span>Preview</span>
                </>
              ) : (
                <>
                  <FileEdit className="w-3.5 h-3.5" />
                  <span>Edit Document</span>
                </>
              )}
            </button>
          )}

          {/* Save Draft Button (in edit mode) */}
          {isEditMode && onSaveSections && (
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="px-3.5 py-1.5 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition cursor-pointer flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Saving…' : 'Save Draft'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Success Notification Banner */}
      {savedBanner && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Draft sections saved successfully to institutional database.</span>
        </div>
      )}

      {/* Accordion Sections List */}
      <div className="space-y-3">
        {localSections.map((sec, idx) => {
          const secKey = sec.id || sec.title || `sec-${idx}`;
          const isExpanded = expandedSectionIds.has(secKey);

          return (
            <div
              key={secKey}
              className={`rounded-2xl border transition-all duration-150 bg-white shadow-2xs overflow-hidden ${
                isExpanded ? 'border-slate-300 ring-1 ring-slate-100' : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              {/* Section Header */}
              <div
                onClick={() => toggleSection(secKey)}
                className="px-5 py-3.5 bg-slate-50/70 hover:bg-slate-100/70 transition flex items-center justify-between gap-3 cursor-pointer select-none border-b border-slate-100"
              >
                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                  <span className="w-6 h-6 rounded-lg bg-[#0057B8] text-white font-mono font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                    {idx + 1}
                  </span>

                  {isEditMode ? (
                    <input
                      type="text"
                      value={sec.title || ''}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => handleUpdateSectionTitle(secKey, e.target.value)}
                      placeholder="Section Title"
                      className="text-xs font-bold text-slate-900 bg-white border border-slate-200 rounded px-2.5 py-1 focus:outline-none focus:border-[#0057B8] flex-1 max-w-md shadow-2xs"
                    />
                  ) : (
                    <h4 className="text-xs font-bold text-slate-900 tracking-tight truncate">
                      {sec.title || `Section ${idx + 1}`}
                    </h4>
                  )}
                </div>

                <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                  {isEditMode && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleMoveUp(idx)}
                        disabled={idx === 0}
                        className="p-1 rounded text-slate-400 hover:text-slate-700 disabled:opacity-30 cursor-pointer"
                        title="Move Up"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveDown(idx)}
                        disabled={idx === localSections.length - 1}
                        className="p-1 rounded text-slate-400 hover:text-slate-700 disabled:opacity-30 cursor-pointer"
                        title="Move Down"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteSection(secKey)}
                        className="p-1 rounded text-slate-400 hover:text-rose-600 cursor-pointer"
                        title="Delete Section"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}

                  <div className="p-1 text-slate-400" onClick={() => toggleSection(secKey)}>
                    {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </div>
                </div>
              </div>

              {/* Section Content Body (when expanded) */}
              {isExpanded && (
                <div className="p-5 space-y-3 bg-white animate-in fade-in">
                  {isEditMode ? (
                    <div className="space-y-2">
                      {/* Section Quick Format Bar */}
                      <div className="flex flex-wrap items-center justify-between gap-1.5 p-1.5 bg-slate-50 rounded-xl border border-slate-200">
                        <div className="flex flex-wrap items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleInsertFormat(secKey, 'bold')}
                            className="px-2 py-1 rounded bg-white hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700 flex items-center gap-0.5 cursor-pointer"
                            title="Bold"
                          >
                            <Bold className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleInsertFormat(secKey, 'italic')}
                            className="px-2 py-1 rounded bg-white hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700 flex items-center gap-0.5 cursor-pointer"
                            title="Italic"
                          >
                            <Italic className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleInsertFormat(secKey, 'underline')}
                            className="px-2 py-1 rounded bg-white hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700 flex items-center gap-0.5 cursor-pointer"
                            title="Underline"
                          >
                            <Underline className="w-3 h-3" />
                          </button>

                          <span className="w-px h-4 bg-slate-300 mx-1" />

                          {/* Table Insertion */}
                          <button
                            type="button"
                            onClick={() => handleInsertFormat(secKey, 'table')}
                            className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-[#0057B8] border border-blue-200 text-xs font-bold flex items-center gap-1 cursor-pointer shadow-2xs"
                            title="Insert Table Grid"
                          >
                            <TableIcon className="w-3 h-3" />
                            <span>+ Table</span>
                          </button>

                          {/* Numbered List */}
                          <button
                            type="button"
                            onClick={() => handleInsertFormat(secKey, 'numbered_list')}
                            className="px-2 py-1 rounded bg-white hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700 flex items-center gap-1 cursor-pointer"
                            title="Insert Numbered List"
                          >
                            <ListOrdered className="w-3 h-3" />
                            <span>1. List</span>
                          </button>

                          {/* Bullet List */}
                          <button
                            type="button"
                            onClick={() => handleInsertFormat(secKey, 'bullet_list')}
                            className="px-2 py-1 rounded bg-white hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700 flex items-center gap-1 cursor-pointer"
                            title="Insert Bullet List"
                          >
                            <List className="w-3 h-3" />
                            <span>● Bullets</span>
                          </button>

                          {/* Statutory Note */}
                          <button
                            type="button"
                            onClick={() => handleInsertFormat(secKey, 'note')}
                            className="px-2 py-1 rounded bg-amber-50 hover:bg-amber-100 border border-amber-200 text-xs font-bold text-amber-800 flex items-center gap-1 cursor-pointer"
                            title="Insert APRA Note"
                          >
                            <Quote className="w-3 h-3" />
                            <span>Note</span>
                          </button>
                        </div>

                        <span className="text-[10.5px] font-mono text-slate-400">
                          {(sec.content || '').length} chars
                        </span>
                      </div>

                      {/* Textarea Editor */}
                      <textarea
                        rows={6}
                        value={sec.content || ''}
                        onChange={(e) => handleUpdateSectionContent(secKey, e.target.value)}
                        placeholder="Enter section clauses, regulatory parameters, or table rows..."
                        className="w-full text-xs font-mono text-slate-800 p-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-[#0057B8] focus:ring-1 focus:ring-[#0057B8] leading-relaxed custom-scrollbar"
                      />

                      {/* Live Formatted Preview below editor */}
                      <div className="pt-2 border-t border-slate-100">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                          Live Rendered HTML Preview
                        </span>
                        <div className="p-3 bg-slate-50/50 rounded-xl border border-slate-100">
                          {renderRichContent(sec.content, secKey)}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div>{renderRichContent(sec.content, secKey)}</div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add Section Button (in edit mode) */}
      {isEditMode && (
        <button
          type="button"
          onClick={handleAddSection}
          className="w-full py-3 rounded-2xl border-2 border-dashed border-slate-200 hover:border-[#0057B8] hover:bg-blue-50/30 text-slate-600 hover:text-[#0057B8] text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Section</span>
        </button>
      )}
    </div>
  );
}

