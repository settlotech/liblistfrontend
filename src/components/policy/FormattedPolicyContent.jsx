import React, { useState, useEffect, useRef } from 'react';
import { Plus, CheckSquare, ListChecks, Sparkles, StickyNote, FileText } from 'lucide-react';
import { normalizeRichHtml, sanitizeRichHtml } from '../../utils/richContentConverter';
import '../../editor/styles/editor.css';

function containsRichMarkup(text) {
  if (!text || typeof text !== 'string') return false;
  return (
    /<(table|thead|tbody|tr|th|td|p|h[1-6]|ul|ol|li|blockquote|div|span|strong|em|u|s|img|hr|br)\b/i.test(text) ||
    /^\s*\|.*\|\s*$/m.test(text) ||
    /!\[[^\]]*\]\([^)]+\)/.test(text) ||
    /^\s*>\s+/m.test(text) ||
    /^\s*#{1,3}\s+/m.test(text)
  );
}

/**
 * Clean Formatted Content Renderer
 * - Enterprise typography with Australian banking styling.
 * - Renders formatted WYSIWYG tables, headers, alignments, images, notes, and page breaks cleanly.
 * - Section-level "+ Assign Task" action.
 * - Floating "Assign Task from Selection" tooltip when text is selected/held.
 */
export default function FormattedPolicyContent({
  content,
  sections: richSections = null,
  policyId = '',
  policyTitle = '',
  onAssignTask
}) {
  const containerRef = useRef(null);
  const [floatingTooltip, setFloatingTooltip] = useState(null);

  // Close floating tooltip on clicks outside
  useEffect(() => {
    const handleDocumentClick = (e) => {
      if (!e.target.closest('.floating-selection-pill')) {
        // Small delay so button click can register first
        setTimeout(() => setFloatingTooltip(null), 150);
      }
    };
    document.addEventListener('mousedown', handleDocumentClick);
    return () => document.removeEventListener('mousedown', handleDocumentClick);
  }, []);

  const hasStructuredSections =
    Array.isArray(richSections) &&
    richSections.length > 0 &&
    richSections.some((s) => (s?.content && String(s.content).trim()) || (Array.isArray(s?.notes) && s.notes.length > 0));

  if (!content && !hasStructuredSections) return null;

  const sections = [];

  if (hasStructuredSections) {
    richSections.forEach((sec, idx) => {
      const rawBody = typeof sec.content === 'string' ? sec.content : '';
      const rawLines = rawBody.split('\n').map((l) => l.trim()).filter((l) => l && l !== '-' && l !== '•' && l !== '*' && l !== '.' && l !== ':');
      sections.push({
        title: sec.title || `Section ${idx + 1}`,
        rawBody,
        isRich: containsRichMarkup(rawBody),
        items: rawLines.map((l) => l.replace(/###/g, '').replace(/##/g, '').replace(/^#\s*/, '').trim()),
        notes: Array.isArray(sec.notes) ? sec.notes : [],
        headerText: sec.headerText || '',
        footerText: sec.footerText || ''
      });
    });
  } else {
    const rawLines = String(content).split('\n');
    let currentSection = { title: '', rawLines: [], items: [], notes: [], headerText: '', footerText: '' };
    const docHasHtml = /<(table|thead|tbody|tr|th|td|p|h[1-6]|ul|ol|li|blockquote|div|img|hr)\b/i.test(String(content));

    for (let i = 0; i < rawLines.length; i++) {
      const rawLine = rawLines[i];
      const line = rawLine.trim();
      if (!line) {
        if (currentSection.rawLines.length > 0) currentSection.rawLines.push('');
        continue;
      }

      if (line === '-' || line === '•' || line === '*' || line === '.' || line === ':') {
        continue;
      }

      const isSectionBoundary = docHasHtml
        ? /^###\s+/.test(line)
        : /^#{1,6}\s+/.test(line);

      if (isSectionBoundary) {
        if (currentSection.title || currentSection.items.length > 0 || currentSection.rawLines.length > 0) {
          const rawBody = currentSection.rawLines.join('\n').trim();
          sections.push({
            ...currentSection,
            rawBody,
            isRich: containsRichMarkup(rawBody)
          });
        }
        const cleanTitle = line.replace(/^#{1,6}\s*/, '').trim();
        currentSection = { title: cleanTitle, rawLines: [], items: [], notes: [], headerText: '', footerText: '' };
        continue;
      }

      currentSection.rawLines.push(rawLine);
      currentSection.items.push(line.replace(/###/g, '').replace(/##/g, '').replace(/^#\s*/, '').trim());
    }

    if (currentSection.title || currentSection.items.length > 0 || currentSection.rawLines.length > 0) {
      const rawBody = currentSection.rawLines.join('\n').trim();
      sections.push({
        ...currentSection,
        rawBody,
        isRich: containsRichMarkup(rawBody)
      });
    }
  }

  // Handle text selection inside the policy document
  const handleMouseUp = () => {
    if (!onAssignTask) return;
    const selection = window.getSelection();
    const text = selection ? selection.toString().trim() : '';

    if (text && text.length >= 8 && containerRef.current?.contains(selection.anchorNode)) {
      try {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        setFloatingTooltip({
          text,
          x: Math.max(120, Math.min(window.innerWidth - 140, rect.left + rect.width / 2)),
          y: Math.max(10, rect.top - 12)
        });
      } catch {
        setFloatingTooltip(null);
      }
    } else {
      setFloatingTooltip(null);
    }
  };

  return (
    <div
      ref={containerRef}
      onMouseUp={handleMouseUp}
      className="space-y-4 pt-1 text-[12.5px] leading-relaxed relative select-text"
    >
      {/* FLOATING ACTION PILL ON TEXT SELECTION */}
      {floatingTooltip && onAssignTask && (
        <div
          style={{
            position: 'fixed',
            left: `${floatingTooltip.x}px`,
            top: `${floatingTooltip.y}px`,
            transform: 'translate(-50%, -100%)',
            zIndex: 9999
          }}
          className="floating-selection-pill flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900 text-white text-xs font-semibold shadow-2xl border border-slate-700 animate-in fade-in zoom-in-95 cursor-pointer hover:bg-[#0057B8] transition-all"
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onAssignTask({
              library_id: String(policyId || ''),
              section_id: 'Highlighted Policy Section',
              title: `[Clause Review] ${policyTitle || 'Policy Document'}`,
              description: `"${floatingTooltip.text}"`
            });
            setFloatingTooltip(null);
            window.getSelection()?.removeAllRanges();
          }}
        >
          <Sparkles className="w-3.5 h-3.5 text-blue-300 animate-pulse" />
          <span>Assign Task from Selection</span>
        </div>
      )}

      {/* RENDER SECTIONS */}
      {sections.map((sec, sIdx) => (
        <div
          key={sIdx}
          data-note-anchor={`policy-sec-${sIdx}`}
          data-section-title={sec.title || `Section ${sIdx + 1}`}
          className="group/sec rounded-xl border border-slate-100 hover:border-blue-200/80 bg-white hover:bg-blue-50/20 transition-all p-3 space-y-2 shadow-2xs"
        >
          {/* Optional Custom Running Page Header Badge */}
          {sec.headerText && sec.headerText.trim().toLowerCase() !== 'header' && (
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 tracking-wider pb-1 border-b border-dashed border-slate-100">
              <span>{sec.headerText}</span>
              <span>Page {sIdx + 1}</span>
            </div>
          )}

          {/* Section Header */}
          <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#0057B8]" />
              <h4 className="text-[13px] font-bold text-slate-900 tracking-tight">
                {sec.title || `Section ${sIdx + 1}`}
              </h4>
            </div>

            {/* Quick Action: Assign Task for this Section */}
            {onAssignTask && (
              <button
                type="button"
                onClick={() => onAssignTask({
                  library_id: String(policyId || ''),
                  section_id: sec.title || `Section ${sIdx + 1}`,
                  title: `[Section Task] ${sec.title || policyTitle || 'Policy Section'}`,
                  description: sec.items.slice(0, 4).join('\n')
                })}
                className="opacity-70 group-hover/sec:opacity-100 transition-opacity inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-[#0057B8] hover:text-white bg-blue-50 hover:bg-[#0057B8] border border-blue-200 rounded-lg cursor-pointer shadow-2xs"
                title={`Assign a task for ${sec.title || 'this section'}`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Assign Task</span>
              </button>
            )}
          </div>

          {/* Section Clauses and Content */}
          {sec.isRich ? (
            <div className="pl-2.5 border-l-2 border-blue-100 overflow-visible">
              <div
                className="prose-policy-view text-slate-700 leading-relaxed"
                dangerouslySetInnerHTML={{
                  __html: sanitizeRichHtml(normalizeRichHtml(sec.rawBody || ''))
                }}
              />
            </div>
          ) : (
            <div className="space-y-1.5 pl-2.5 border-l-2 border-blue-100">
              {sec.items.map((item, iIdx) => {
                const bulletMatch = item.match(/^(\d+\.|\*|-|•)\s*(.*)/);
                if (bulletMatch) {
                  const bulletNum = bulletMatch[1];
                  let text = bulletMatch[2].trim();
                  if (!text || text === '-' || text === '•' || text === '.') return null;

                  const boldMatch =
                    text.match(/^\*\*(.*?)\*\*(?::\s*|\s*-\s*|\s*)(.*)/) ||
                    text.match(/^([A-Za-z0-9\s()/-]{3,40}):\s*(.*)/);

                  if (boldMatch) {
                    const boldTitle = boldMatch[1].replace(/\*\*/g, '').trim();
                    const body = boldMatch[2].replace(/\*\*/g, '').trim();
                    return (
                      <div
                        key={iIdx}
                        data-note-anchor={`policy-sec-${sIdx}-line-${iIdx}`}
                        data-line-text={`${boldTitle}: ${body}`}
                        className="group/item flex items-start justify-between gap-2 py-0.5 rounded px-1 -mx-1"
                      >
                        <div className="flex items-start gap-2">
                          <span className="text-[11px] font-mono font-bold text-[#0057B8] shrink-0 mt-0.5">
                            {bulletNum}
                          </span>
                          <div className="text-slate-700 leading-relaxed">
                            <strong className="font-semibold text-slate-900">{boldTitle}: </strong>
                            <span>{body}</span>
                          </div>
                        </div>
                        {onAssignTask && (
                          <button
                            type="button"
                            onClick={() => onAssignTask({
                              library_id: String(policyId || ''),
                              section_id: `${sec.title || 'Section'} - ${boldTitle}`,
                              title: `[Clause] ${boldTitle}`,
                              description: body
                            })}
                            className="opacity-0 group-hover/item:opacity-100 transition-opacity text-[10px] font-medium text-slate-400 hover:text-[#0057B8] hover:bg-blue-50 px-1.5 py-0.5 rounded cursor-pointer shrink-0"
                            title="Assign task for this specific clause"
                          >
                            + Task
                          </button>
                        )}
                      </div>
                    );
                  }

                  return (
                    <div
                      key={iIdx}
                      data-note-anchor={`policy-sec-${sIdx}-line-${iIdx}`}
                      data-line-text={text.replace(/\*\*/g, '')}
                      className="group/item flex items-start justify-between gap-2 py-0.5 rounded px-1 -mx-1"
                    >
                      <div className="flex items-start gap-2">
                        <span className="text-[11px] font-mono font-bold text-[#0057B8] shrink-0 mt-0.5">
                          {bulletNum}
                        </span>
                        <span className="text-slate-700 leading-relaxed">{text.replace(/\*\*/g, '')}</span>
                      </div>
                      {onAssignTask && (
                        <button
                          type="button"
                          onClick={() => onAssignTask({
                            library_id: String(policyId || ''),
                            section_id: `${sec.title || 'Section'} (Point ${bulletNum})`,
                            title: `[Point ${bulletNum}] ${sec.title || policyTitle}`,
                            description: text.replace(/\*\*/g, '')
                          })}
                          className="opacity-0 group-hover/item:opacity-100 transition-opacity text-[10px] font-medium text-slate-400 hover:text-[#0057B8] hover:bg-blue-50 px-1.5 py-0.5 rounded cursor-pointer shrink-0"
                          title="Assign task for this item"
                        >
                          + Task
                        </button>
                      )}
                    </div>
                  );
                }

                // Normal text line
                return (
                  <p
                    key={iIdx}
                    data-note-anchor={`policy-sec-${sIdx}-line-${iIdx}`}
                    data-line-text={item.replace(/\*\*/g, '')}
                    className="text-slate-600 font-normal leading-relaxed rounded px-1 -mx-1"
                  >
                    {item.replace(/\*\*/g, '')}
                  </p>
                );
              })}
            </div>
          )}

          {/* Attached Clause Notes */}
          {Array.isArray(sec.notes) && sec.notes.length > 0 && (
            <div className="mt-2 pt-2 border-t border-amber-100 space-y-1.5">
              <div className="flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-wider text-amber-700">
                <StickyNote className="w-3 h-3" />
                <span>Clause Notes ({sec.notes.length})</span>
              </div>
              <div className="space-y-1">
                {sec.notes.map((n, nIdx) => (
                  <div
                    key={n.id || nIdx}
                    className="px-2.5 py-1.5 bg-amber-50/70 border border-amber-200/80 rounded-lg text-[11.5px] text-amber-950"
                  >
                    <p className="leading-snug">{n.text}</p>
                    {(n.author || n.createdAt) && (
                      <div className="text-[10px] text-amber-700/80 mt-0.5 font-mono">
                        {n.author || 'Author'}
                        {n.createdAt ? ` • ${new Date(n.createdAt).toLocaleString()}` : ''}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Optional Custom Running Page Footer */}
          {sec.footerText && sec.footerText.trim().toLowerCase() !== 'footer' && (
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-1.5 border-t border-dashed border-slate-100">
              <span>{sec.footerText}</span>
              <span>Clause {sIdx + 1}</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
