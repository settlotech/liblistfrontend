/**
 * Rich Content Converter & Sanitizer
 * Bridges legacy Markdown / raw alignment / pipe tables and TipTap HTML / JSON
 * so clause editors and policy viewers render uniformly across pages.
 */

const SAFE_ALIGNMENTS = new Set(['left', 'center', 'right', 'justify']);

export function tiptapJsonToHtml(node) {
  if (!node) return '';
  if (typeof node === 'string') return node;
  if (Array.isArray(node)) return node.map(tiptapJsonToHtml).join('');

  if (node.type === 'text') {
    let text = escapeHtml(node.text || '');
    const marks = Array.isArray(node.marks) ? node.marks : [];
    marks.forEach((mark) => {
      switch (mark.type) {
        case 'bold':
          text = `<strong>${text}</strong>`;
          break;
        case 'italic':
          text = `<em>${text}</em>`;
          break;
        case 'underline':
          text = `<u>${text}</u>`;
          break;
        case 'strike':
          text = `<s>${text}</s>`;
          break;
        case 'subscript':
          text = `<sub>${text}</sub>`;
          break;
        case 'superscript':
          text = `<sup>${text}</sup>`;
          break;
        case 'code':
          text = `<code>${text}</code>`;
          break;
        case 'highlight': {
          const bg = mark.attrs?.color || '#fef08a';
          text = `<mark style="background-color: ${escapeAttr(bg)}">${text}</mark>`;
          break;
        }
        case 'textStyle': {
          const styles = [];
          if (mark.attrs?.color) styles.push(`color: ${mark.attrs.color}`);
          if (mark.attrs?.fontFamily) styles.push(`font-family: ${mark.attrs.fontFamily}`);
          if (mark.attrs?.fontSize) styles.push(`font-size: ${mark.attrs.fontSize}`);
          if (styles.length > 0) {
            text = `<span style="${escapeAttr(styles.join('; '))}">${text}</span>`;
          }
          break;
        }
        case 'link': {
          const href = mark.attrs?.href || '#';
          text = `<a href="${escapeAttr(href)}" target="_blank" rel="noopener noreferrer">${text}</a>`;
          break;
        }
        default:
          break;
      }
    });
    return text;
  }

  const childrenHtml = Array.isArray(node.content) ? node.content.map(tiptapJsonToHtml).join('') : '';

  switch (node.type) {
    case 'doc':
      return childrenHtml;
    case 'paragraph': {
      const styles = [];
      if (node.attrs?.textAlign) styles.push(`text-align: ${node.attrs.textAlign}`);
      if (node.attrs?.lineHeight) styles.push(`line-height: ${node.attrs.lineHeight}`);
      const styleAttr = styles.length > 0 ? ` style="${escapeAttr(styles.join('; '))}"` : '';
      return `<p${styleAttr}>${childrenHtml || '<br>'}</p>`;
    }
    case 'heading': {
      const level = Math.min(4, Math.max(1, Number(node.attrs?.level) || 2));
      const styles = [];
      if (node.attrs?.textAlign) styles.push(`text-align: ${node.attrs.textAlign}`);
      if (node.attrs?.lineHeight) styles.push(`line-height: ${node.attrs.lineHeight}`);
      const styleAttr = styles.length > 0 ? ` style="${escapeAttr(styles.join('; '))}"` : '';
      return `<h${level}${styleAttr}>${childrenHtml}</h${level}>`;
    }
    case 'bulletList':
      return `<ul>${childrenHtml}</ul>`;
    case 'orderedList':
      return `<ol>${childrenHtml}</ol>`;
    case 'listItem':
      return `<li>${childrenHtml}</li>`;
    case 'blockquote':
      return `<blockquote>${childrenHtml}</blockquote>`;
    case 'horizontalRule':
      return '<hr />';
    case 'pageBreak':
      return '<div data-type="page-break" class="document-page-break"><div class="page-break-line-bar"></div><div class="page-break-badge">PAGE BREAK</div></div>';
    case 'table':
      return `<table><tbody>${childrenHtml}</tbody></table>`;
    case 'tableRow':
      return `<tr>${childrenHtml}</tr>`;
    case 'tableHeader':
    case 'tableCell': {
      const tag = node.type === 'tableHeader' ? 'th' : 'td';
      const attrs = [];
      if (node.attrs?.colspan > 1) attrs.push(`colspan="${Number(node.attrs.colspan)}"`);
      if (node.attrs?.rowspan > 1) attrs.push(`rowspan="${Number(node.attrs.rowspan)}"`);
      const styles = [];
      if (node.attrs?.backgroundColor) styles.push(`background-color: ${node.attrs.backgroundColor}`);
      if (node.attrs?.borderColor) styles.push(`border-color: ${node.attrs.borderColor}`);
      if (styles.length > 0) attrs.push(`style="${escapeAttr(styles.join('; '))}"`);
      return `<${tag}${attrs.length ? ' ' + attrs.join(' ') : ''}>${childrenHtml || '<p></p>'}</${tag}>`;
    }
    case 'image': {
      const src = node.attrs?.src || '';
      if (!src) return '';
      const alt = node.attrs?.alt || '';
      const align = node.attrs?.alignment || node.attrs?.['data-alignment'] || 'center';
      const width = node.attrs?.width || node.attrs?.['data-width'] || '75%';
      const rotation = Number(node.attrs?.rotation ?? node.attrs?.['data-rotation']) || 0;
      const offsetX = Number(node.attrs?.offsetX ?? node.attrs?.['data-offset-x']) || 0;
      const offsetY = Number(node.attrs?.offsetY ?? node.attrs?.['data-offset-y']) || 0;

      let marginStyle = 'margin: 16px auto; display: block;';
      if (align === 'left') {
        marginStyle = 'margin: 16px auto 16px 0; display: block;';
      } else if (align === 'right') {
        marginStyle = 'margin: 16px 0 16px auto; display: block;';
      }

      const transforms = [];
      if (offsetX || offsetY) transforms.push(`translate(${offsetX}px, ${offsetY}px)`);
      if (rotation) transforms.push(`rotate(${rotation}deg)`);
      const transformStyle = transforms.length
        ? ` transform: ${transforms.join(' ')}; transform-origin: center center;`
        : '';
      const fullStyle = `${marginStyle} width: ${escapeAttr(width)}; max-width: 100%; height: auto; border-radius: 6px;${transformStyle}`;

      return `<img src="${escapeAttr(src)}" alt="${escapeAttr(alt)}" data-alignment="${escapeAttr(align)}" data-width="${escapeAttr(width)}" data-rotation="${rotation}" data-offset-x="${offsetX}" data-offset-y="${offsetY}" style="${fullStyle}" />`;
    }
    default:
      return childrenHtml;
  }
}

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function escapeAttr(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function inlineMarkdownToHtml(text) {
  if (!text) return '';
  let out = String(text);

  // Convert inline markdown images first: ![alt](url)
  out = out.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_, alt, url) => {
    return `<img src="${escapeAttr(url.trim())}" alt="${escapeAttr(alt.trim())}" data-alignment="center" data-width="75%" />`;
  });

  // Protect existing inline HTML tags (<img ...>, <a ...>, <span>, <u>, etc.) so markdown regexes never corrupt attributes
  const preservedTags = [];
  out = out.replace(/<[^>]+>/g, (tag) => {
    const token = `%%LIBLISTHTMLTAG${preservedTags.length}%%`;
    preservedTags.push(tag);
    return token;
  });

  // Links: [label](url)
  out = out.replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, (_, label, url) => {
    return `<a href="${escapeAttr(url)}" target="_blank" rel="noopener noreferrer">${label}</a>`;
  });

  // Bold **text**
  out = out.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  // Italic *text* (avoid touching ** or URL asterisks)
  out = out.replace(/(^|[^*])\*([^*\n]+?)\*([^*]|$)/g, '$1<em>$2</em>$3');
  // Strikethrough ~~text~~
  out = out.replace(/~~(.+?)~~/g, '<s>$1</s>');
  // Inline code `code`
  out = out.replace(/`([^`\n]+)`/g, '<code>$1</code>');

  // Restore protected HTML tags verbatim
  out = out.replace(/%%LIBLISTHTMLTAG(\d+)%%/g, (_, idxStr) => preservedTags[Number(idxStr)] || '');

  return out;
}

function isMarkdownTableSeparator(line) {
  return /^\|?(\s*:?-+:?\s*\|)+\s*:?-+:?\s*\|?$/.test(line.trim());
}

function splitMarkdownTableRow(line) {
  let trimmed = line.trim();
  if (trimmed.startsWith('|')) trimmed = trimmed.slice(1);
  if (trimmed.endsWith('|')) trimmed = trimmed.slice(0, -1);
  return trimmed.split('|').map((c) => c.trim());
}

function buildHtmlTableFromPipeLines(pipeLines) {
  if (!pipeLines || pipeLines.length === 0) return '';

  const hasSeparator = pipeLines.length >= 2 && isMarkdownTableSeparator(pipeLines[1]);
  const headerCells = splitMarkdownTableRow(pipeLines[0]);
  const numCols = Math.max(1, headerCells.length);

  let rowsHtml = '<tr>';
  for (let c = 0; c < numCols; c++) {
    rowsHtml += `<th><p>${inlineMarkdownToHtml(headerCells[c] || '')}</p></th>`;
  }
  rowsHtml += '</tr>';

  const bodyStartIdx = hasSeparator ? 2 : 1;
  const bodyLines = pipeLines.slice(bodyStartIdx);

  if (bodyLines.length === 0) {
    // Ensure a visible editable data row when user inserted a table or header row
    rowsHtml += '<tr>';
    for (let c = 0; c < numCols; c++) {
      rowsHtml += '<td><p></p></td>';
    }
    rowsHtml += '</tr>';
  } else {
    bodyLines.forEach((rowLine) => {
      if (isMarkdownTableSeparator(rowLine)) return;
      const cells = splitMarkdownTableRow(rowLine);
      rowsHtml += '<tr>';
      for (let c = 0; c < numCols; c++) {
        rowsHtml += `<td><p>${inlineMarkdownToHtml(cells[c] || '')}</p></td>`;
      }
      rowsHtml += '</tr>';
    });
  }

  return `<table><tbody>${rowsHtml}</tbody></table>`;
}

/**
 * Checks whether content already looks like pure TipTap / semantic HTML
 * with no unparsed markdown blocks mixed in.
 */
function isAlreadyPureHtml(str) {
  const trimmed = str.trim();
  if (!trimmed.startsWith('<')) return false;
  // Detect legacy `<div align="center">` or mixed markdown headings/tables inside HTML strings
  if (/<div\s+align=/i.test(trimmed)) return false;
  if (/(^|\n)\s*#{1,4}\s+/.test(trimmed)) return false;
  if (/(^|\n)\s*\|.+\|/.test(trimmed)) return false;
  if (/!\[[^\]]*\]\([^)]+\)/.test(trimmed)) return false;
  if (/(^|\n)\s*>\s+/.test(trimmed)) return false;
  return /<\/?(p|h[1-6]|table|ul|ol|blockquote|div|img|hr)\b/i.test(trimmed);
}

/**
 * Normalizes mixed Markdown, legacy alignment `<div align="...">`, pipe tables,
 * plain text, HTML, or TipTap JSON for use inside RichTextEditor or viewer.
 */
export function normalizeRichHtml(raw) {
  if (!raw) return '';

  if (typeof raw === 'object') {
    if (raw.type === 'doc') return tiptapJsonToHtml(raw);
    if (raw.json && raw.json.type === 'doc') return tiptapJsonToHtml(raw.json);
    return '';
  }

  const rawStr = String(raw);
  const trimmed = rawStr.trim();
  if (!trimmed) return '';

  // Handle JSON-stringified TipTap doc
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed && parsed.type === 'doc') {
        return tiptapJsonToHtml(parsed);
      }
      if (parsed && parsed.json && parsed.json.type === 'doc') {
        return tiptapJsonToHtml(parsed.json);
      }
    } catch {
      // Not valid JSON; proceed as text/markdown/html
    }
  }

  if (isAlreadyPureHtml(rawStr)) {
    return rawStr;
  }

  // Convert legacy `<div align="center">...</div>` blocks into aligned `<p>` tags
  let normalized = rawStr.replace(
    /<div\s+align=["'](left|center|right|justify)["'][^>]*>([\s\S]*?)<\/div>/gi,
    (_, align, inner) => {
      const cleanAlign = SAFE_ALIGNMENTS.has(align.toLowerCase()) ? align.toLowerCase() : 'left';
      const innerLines = inner
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean);
      if (innerLines.length === 0) return '';
      return innerLines
        .map((l) => `<p style="text-align: ${cleanAlign}">${inlineMarkdownToHtml(l)}</p>`)
        .join('\n');
    }
  );

  // Normalize standalone TipTap/prose HTML blocks so line parser passes them straight through
  const lines = normalized.split(/\r?\n/);
  const output = [];

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const trim = line.trim();

    if (!trim) {
      i++;
      continue;
    }

    // Horizontal rule / explicit page break marker
    if (/^---+$/.test(trim) && i > 0) {
      output.push('<hr />');
      i++;
      continue;
    }

    // Already-formed single-line or block HTML tags
    if (/^<(h[1-6]|p|table|ul|ol|blockquote|div|img|hr|figure)\b/i.test(trim)) {
      const multilineTagMatch = trim.match(/^<(table|ul|ol|blockquote|div|figure)\b/i);
      if (multilineTagMatch) {
        const tagName = multilineTagMatch[1].toLowerCase();
        const closeRe = new RegExp(`<\\/${tagName}>`, 'i');
        if (!closeRe.test(trim)) {
          const htmlBuf = [line];
          i++;
          while (i < lines.length && !closeRe.test(lines[i])) {
            htmlBuf.push(lines[i]);
            i++;
          }
          if (i < lines.length) {
            htmlBuf.push(lines[i]);
            i++;
          }
          output.push(htmlBuf.join('\n'));
          continue;
        }
      } else if (/^<img\b/i.test(trim) && !/>/.test(trim)) {
        const imgBuf = [line];
        i++;
        while (i < lines.length && !/>/.test(lines[i])) {
          imgBuf.push(lines[i]);
          i++;
        }
        if (i < lines.length) {
          imgBuf.push(lines[i]);
          i++;
        }
        output.push(imgBuf.join(' '));
        continue;
      }
      output.push(trim);
      i++;
      continue;
    }

    // Markdown pipe tables (including standalone | col1 | col2 | lines)
    if (trim.startsWith('|') && trim.endsWith('|')) {
      const tableLines = [];
      while (i < lines.length) {
        const t = lines[i].trim();
        if (t.startsWith('|') && t.endsWith('|')) {
          tableLines.push(t);
          i++;
        } else {
          break;
        }
      }
      output.push(buildHtmlTableFromPipeLines(tableLines));
      continue;
    }

    // Markdown Headings (# .. ####)
    const headingMatch = trim.match(/^(#{1,4})\s+(.+)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      output.push(`<h${level}>${inlineMarkdownToHtml(headingMatch[2].trim())}</h${level}>`);
      i++;
      continue;
    }

    // Standalone Markdown Image ![alt](url)
    const imgMatch = trim.match(/^!\[(.*?)\]\((.*?)\)$/);
    if (imgMatch) {
      output.push(
        `<img src="${escapeAttr(imgMatch[2].trim())}" alt="${escapeAttr(imgMatch[1].trim())}" data-alignment="center" data-width="75%" />`
      );
      i++;
      continue;
    }

    // Blockquotes / Notes (> ...)
    if (trim.startsWith('>')) {
      const quoteParas = [];
      while (i < lines.length && lines[i].trim().startsWith('>')) {
        const qLine = lines[i].trim().replace(/^>\s?/, '').trim();
        if (qLine && !/^\[!NOTE\]$/i.test(qLine)) {
          quoteParas.push(`<p>${inlineMarkdownToHtml(qLine)}</p>`);
        }
        i++;
      }
      if (quoteParas.length > 0) {
        output.push(`<blockquote>${quoteParas.join('')}</blockquote>`);
      }
      continue;
    }

    // Unordered Lists / Checkboxes (- , * , ● , ○ , - [ ] , - [x] )
    if (/^(-|\*|●|○|\[ \]|\[x\])\s+/i.test(trim) || /^- \[[ x]\]\s+/i.test(trim)) {
      const listItems = [];
      while (i < lines.length) {
        const cur = lines[i].trim();
        const checkMatch = cur.match(/^- \[([ x])\]\s+(.+)$/i);
        const bulletMatch = cur.match(/^(?:-|\*|●|○)\s+(.+)$/);
        if (checkMatch) {
          const mark = checkMatch[1].toLowerCase() === 'x' ? '☑' : '☐';
          listItems.push(`<li><p>${mark} ${inlineMarkdownToHtml(checkMatch[2])}</p></li>`);
          i++;
        } else if (bulletMatch) {
          listItems.push(`<li><p>${inlineMarkdownToHtml(bulletMatch[1])}</p></li>`);
          i++;
        } else {
          break;
        }
      }
      if (listItems.length > 0) {
        output.push(`<ul>${listItems.join('')}</ul>`);
      }
      continue;
    }

    // Ordered Lists (1. , 2. )
    if (/^\d+\.\s+/.test(trim)) {
      const orderedItems = [];
      while (i < lines.length) {
        const cur = lines[i].trim();
        const numMatch = cur.match(/^\d+\.\s+(.+)$/);
        if (numMatch) {
          orderedItems.push(`<li><p>${inlineMarkdownToHtml(numMatch[1])}</p></li>`);
          i++;
        } else {
          break;
        }
      }
      if (orderedItems.length > 0) {
        output.push(`<ol>${orderedItems.join('')}</ol>`);
      }
      continue;
    }

    // Standard Paragraph line
    output.push(`<p>${inlineMarkdownToHtml(trim)}</p>`);
    i++;
  }

  return output.join('\n');
}

/**
 * Strips scripts, iframes, and dangerous attributes while preserving document formatting HTML.
 */
export function sanitizeRichHtml(html) {
  if (!html) return '';
  return String(html)
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/<iframe[\s\S]*?>[\s\S]*?<\/iframe>/gi, '')
    .replace(/<object[\s\S]*?>[\s\S]*?<\/object>/gi, '')
    .replace(/<embed[\s\S]*?>/gi, '')
    .replace(/\son[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/javascript:/gi, '');
}

/**
 * Extracts readable plain text from HTML / Markdown / TipTap JSON for accurate word counts and summaries.
 */
export function htmlToPlainText(content) {
  if (!content) return '';
  let html = '';
  if (typeof content === 'object') {
    html = tiptapJsonToHtml(content);
  } else {
    html = String(content);
  }

  return html
    .replace(/<div[^>]*data-type=["']page-break["'][^>]*>[\s\S]*?<\/div>/gi, ' ')
    .replace(/<\/(p|div|li|tr|h[1-6]|blockquote)>/gi, ' ')
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
