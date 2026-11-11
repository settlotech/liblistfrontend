import React, { useState, useEffect, useRef } from 'react';
import { Plus, CheckSquare, ListChecks, Sparkles } from 'lucide-react';

/**
 * Clean Formatted Content Renderer
 * - Enterprise typography with Australian banking styling.
 * - Section-level "+ Assign Task" action.
 * - Floating "Assign Task from Selection" tooltip when text is selected/held.
 */
export default function FormattedPolicyContent({
  content,
  policyId = '',
  policyTitle = '',
  onAssignTask
}) {
  const containerRef = useRef(null);
  const [floatingTooltip, setFloatingTooltip] = useState(null);

  // Split content into clean sections
  if (!content) return null;

  const rawLines = content.split('\n');
  const sections = [];
  let currentSection = { title: '', items: [] };

  for (let i = 0; i < rawLines.length; i++) {
    let line = rawLines[i].trim();
    if (!line) continue;

    if (line === '-' || line === '•' || line === '*' || line === '.' || line === ':') {
      continue;
    }

    if (/^#{1,6}\s+/.test(line)) {
      if (currentSection.title || currentSection.items.length > 0) {
        sections.push(currentSection);
      }
      const cleanTitle = line.replace(/^#{1,6}\s*/, '').trim();
      currentSection = { title: cleanTitle, items: [] };
      continue;
    }

    line = line.replace(/###/g, '').replace(/##/g, '').replace(/^#\s*/, '').trim();
    currentSection.items.push(line);
  }

  if (currentSection.title || currentSection.items.length > 0) {
    sections.push(currentSection);
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
          className="group/sec rounded-xl border border-slate-100 hover:border-blue-200/80 bg-white hover:bg-blue-50/20 transition-all p-3 space-y-2 shadow-2xs"
        >
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
                    <div key={iIdx} className="group/item flex items-start justify-between gap-2 py-0.5">
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
                  <div key={iIdx} className="group/item flex items-start justify-between gap-2 py-0.5">
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
                <p key={iIdx} className="text-slate-600 font-normal leading-relaxed">
                  {item.replace(/\*\*/g, '')}
                </p>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
