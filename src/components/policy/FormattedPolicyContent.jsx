import React from 'react';

/**
 * Clean Formatted Content Renderer
 * Removes raw markdown hashes, strips unnecessary asterisks, filters out empty points, 
 * renders compact enterprise typography with Australian banking styling.
 */
export default function FormattedPolicyContent({ content }) {
  if (!content) return null;

  // Split content into clean lines
  const rawLines = content.split('\n');
  const sections = [];
  let currentSection = { title: '', items: [] };

  for (let i = 0; i < rawLines.length; i++) {
    let line = rawLines[i].trim();
    if (!line) continue;

    // Filter out unwanted empty points or stray punctuation
    if (line === '-' || line === '•' || line === '*' || line === '.' || line === ':') {
      continue;
    }

    // Check for section headers (###, ##, #)
    if (/^#{1,6}\s+/.test(line)) {
      if (currentSection.title || currentSection.items.length > 0) {
        sections.push(currentSection);
      }
      const cleanTitle = line.replace(/^#{1,6}\s*/, '').trim();
      currentSection = { title: cleanTitle, items: [] };
      continue;
    }

    // Clean internal markdown hashes if any exist
    line = line.replace(/###/g, '').replace(/##/g, '').replace(/^#\s*/, '').trim();

    currentSection.items.push(line);
  }

  if (currentSection.title || currentSection.items.length > 0) {
    sections.push(currentSection);
  }

  return (
    <div className="space-y-3.5 pt-1 text-[12.5px] leading-relaxed">
      {sections.map((sec, sIdx) => (
        <div key={sIdx} className="space-y-1.5">
          {sec.title && (
            <div className="flex items-center gap-2 pb-1 border-b border-slate-100">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0057B8]" />
              <h4 className="text-[12.5px] font-bold text-slate-900 tracking-tight">
                {sec.title}
              </h4>
            </div>
          )}

          <div className="space-y-1.5 pl-2.5 border-l-2 border-blue-100/80">
            {sec.items.map((item, iIdx) => {
              // Check if bullet point or numbered item
              const bulletMatch = item.match(/^(\d+\.|\*|-|•)\s*(.*)/);
              if (bulletMatch) {
                const bulletNum = bulletMatch[1];
                let text = bulletMatch[2].trim();
                // Filter out unwanted extra empty points
                if (!text || text === '-' || text === '•' || text === '.') return null;

                // Check for bold title like **Title**: Body or Title: Body
                const boldMatch = text.match(/^\*\*(.*?)\*\*(?::\s*|\s*-\s*|\s*)(.*)/) || text.match(/^([A-Za-z0-9\s()/-]{3,40}):\s*(.*)/);
                if (boldMatch) {
                  const boldTitle = boldMatch[1].replace(/\*\*/g, '').trim();
                  const body = boldMatch[2].replace(/\*\*/g, '').trim();
                  return (
                    <div key={iIdx} className="flex items-start gap-2 py-0.5">
                      <span className="text-[11px] font-mono font-bold text-[#0057B8] shrink-0 mt-0.5">
                        {bulletNum}
                      </span>
                      <div className="text-slate-700 leading-relaxed">
                        <strong className="font-semibold text-slate-900">{boldTitle}: </strong>
                        <span>{body}</span>
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={iIdx} className="flex items-start gap-2 py-0.5">
                    <span className="text-[11px] font-mono font-bold text-[#0057B8] shrink-0 mt-0.5">
                      {bulletNum}
                    </span>
                    <span className="text-slate-700 leading-relaxed">{text.replace(/\*\*/g, '')}</span>
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

