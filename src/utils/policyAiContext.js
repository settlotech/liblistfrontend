function stripHtmlAndBase64(raw) {
  if (!raw) return '';
  let text = String(raw);
  text = text.replace(/<img[^>]*alt=["']([^"']*)["'][^>]*>/gi, (_, alt) => `[Image: ${alt || 'Diagram'}]`);
  text = text.replace(/<img[^>]*>/gi, '[Image]');
  text = text.replace(/data:image\/[a-zA-Z0-9+.-]+;base64,[A-Za-z0-9+/=]+/g, '[embedded-image]');
  text = text.replace(/<tr[^>]*>([\s\S]*?)<\/tr>/gi, (_, rowHtml) => {
    const cells = [];
    const cellRe = /<(?:th|td)[^>]*>([\s\S]*?)<\/(?:th|td)>/gi;
    let m;
    while ((m = cellRe.exec(rowHtml)) !== null) {
      cells.push(m[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
    }
    return cells.length ? `\n| ${cells.join(' | ')} |` : '';
  });
  return text
    .replace(/<\/?(?:p|div|li|h[1-6]|br|section|article)[^>]*>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function parseParamsSafe(raw) {
  if (!raw) return {};
  if (typeof raw === 'string') {
    try { return JSON.parse(raw); } catch { return {}; }
  }
  return typeof raw === 'object' ? raw : {};
}

export function extractPolicyAiContext(doc) {
  if (!doc || (!doc.id && !doc.title && !doc.document_name)) return null;
  const params = parseParamsSafe(doc.parameters);
  const rawSections = Array.isArray(doc.sections) && doc.sections.length > 0
    ? doc.sections
    : (Array.isArray(params.sections) ? params.sections : []);

  const sections = rawSections.slice(0, 30).map((sec, idx) => ({
    title: sec.title || sec.section_title || `Clause ${idx + 1}`,
    content: stripHtmlAndBase64(sec.content || sec.description || '').slice(0, 1500),
  }));

  return {
    id: doc.id || null,
    title: doc.title || doc.document_name || 'Operational Policy',
    version: String(doc.version || params.version || '1.0').replace(/^v/i, ''),
    status: doc.status || 'active',
    department_name: doc.department_name || doc.department || '',
    turnaround_sla: doc.turnaround_sla || params.turnaround_sla || '',
    daily_limit: doc.daily_limit || params.daily_limit || '',
    summary: stripHtmlAndBase64(doc.summary || doc.description || '').slice(0, 1200),
    content: sections.length === 0 ? stripHtmlAndBase64(doc.content || '').slice(0, 8000) : '',
    sections,
    is_masked: Boolean(doc.is_masked),
  };
}
