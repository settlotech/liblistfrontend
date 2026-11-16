/**
 * Browser-faithful isolated HTML/CSS page renderers for DOCX, CSV, and TXT files.
 * Renders documents using the document's own formatting inside an isolated iframe
 * (like Google Docs / native browser page viewer), without application card styling.
 */

export async function extractZipEntries(buffer) {
  const u8 = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  const view = new DataView(u8.buffer, u8.byteOffset, u8.byteLength);
  const dec = new TextDecoder();
  const entries = {};

  let eocd = -1;
  for (let i = u8.length - 22; i >= Math.max(0, u8.length - 65557); i--) {
    if (view.getUint32(i, true) === 0x06054b50) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) return entries;

  const cdOffset = view.getUint32(eocd + 16, true);
  const cdCount = view.getUint16(eocd + 10, true);
  let cur = cdOffset;

  for (let i = 0; i < cdCount && cur <= u8.length - 46; i++) {
    if (view.getUint32(cur, true) !== 0x02014b50) break;
    const compMethod = view.getUint16(cur + 10, true);
    const compSize = view.getUint32(cur + 20, true);
    const nameLen = view.getUint16(cur + 28, true);
    const extraLen = view.getUint16(cur + 30, true);
    const commentLen = view.getUint16(cur + 32, true);
    const localOffset = view.getUint32(cur + 42, true);

    if (cur + 46 + nameLen <= u8.length) {
      const name = dec.decode(u8.subarray(cur + 46, cur + 46 + nameLen));
      if (localOffset + 30 <= u8.length && view.getUint32(localOffset, true) === 0x04034b50) {
        const localNameLen = view.getUint16(localOffset + 26, true);
        const localExtraLen = view.getUint16(localOffset + 28, true);
        const dataStart = localOffset + 30 + localNameLen + localExtraLen;
        if (compSize >= 0 && dataStart + compSize <= u8.length) {
          const compData = u8.subarray(dataStart, dataStart + compSize);
          if (compMethod === 0) {
            entries[name] = compData;
          } else if (compMethod === 8 && typeof DecompressionStream !== 'undefined') {
            try {
              const ds = new DecompressionStream('deflate-raw');
              const writer = ds.writable.getWriter();
              const reader = ds.readable.getReader();
              const writePromise = writer.write(compData).then(() => writer.close()).catch(() => {});
              const chunks = [];
              while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                if (value) chunks.push(value);
              }
              await writePromise;
              const totalLen = chunks.reduce((acc, c) => acc + c.length, 0);
              const out = new Uint8Array(totalLen);
              let offset = 0;
              for (const chunk of chunks) {
                out.set(chunk, offset);
                offset += chunk.length;
              }
              entries[name] = out;
            } catch {
              // Skip unreadable entry gracefully
            }
          }
        }
      }
    }
    cur += 46 + nameLen + extraLen + commentLen;
  }

  return entries;
}

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function parseXml(bytes) {
  if (!bytes) return null;
  const text = new TextDecoder().decode(bytes);
  return new DOMParser().parseFromString(text, 'application/xml');
}

function getAttr(el, localName) {
  if (!el) return '';
  return (
    el.getAttribute(`w:${localName}`) ||
    el.getAttribute(localName) ||
    Array.from(el.attributes || []).find((a) => a.localName === localName)?.value ||
    ''
  );
}

function firstChild(el, localName) {
  if (!el) return null;
  for (const child of el.children) {
    if (child.localName === localName) return child;
  }
  return null;
}

function findDescendant(el, localName) {
  if (!el) return null;
  for (const child of el.children) {
    if (child.localName === localName) return child;
    const found = findDescendant(child, localName);
    if (found) return found;
  }
  return null;
}

function twipsToPx(twips) {
  const n = Number(twips);
  return Number.isFinite(n) ? (n / 20) * (96 / 72) : 0;
}

function emuToPx(emu) {
  const n = Number(emu);
  return Number.isFinite(n) && n > 0 ? Math.round(n / 9525) : 0;
}

function uint8ToBase64(bytes) {
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

function parseRunProps(rPr) {
  const style = {};
  if (!rPr) return style;
  const b = firstChild(rPr, 'b');
  if (b && getAttr(b, 'val') !== '0' && getAttr(b, 'val') !== 'false') style.bold = true;
  const i = firstChild(rPr, 'i');
  if (i && getAttr(i, 'val') !== '0' && getAttr(i, 'val') !== 'false') style.italic = true;
  const u = firstChild(rPr, 'u');
  if (u && getAttr(u, 'val') !== 'none') style.underline = true;
  const strike = firstChild(rPr, 'strike') || firstChild(rPr, 'dstrike');
  if (strike && getAttr(strike, 'val') !== '0') style.strike = true;
  const sz = firstChild(rPr, 'sz');
  if (sz) {
    const val = Number(getAttr(sz, 'val'));
    if (Number.isFinite(val) && val > 0) style.fontSizePt = val / 2;
  }
  const color = firstChild(rPr, 'color');
  if (color) {
    const hex = getAttr(color, 'val');
    if (hex && hex.toLowerCase() !== 'auto' && /^[0-9a-f]{6}$/i.test(hex)) {
      style.color = `#${hex}`;
    }
  }
  const highlight = firstChild(rPr, 'highlight');
  if (highlight) {
    const val = getAttr(highlight, 'val');
    if (val && val !== 'none') style.highlight = val;
  }
  const shd = firstChild(rPr, 'shd');
  if (shd) {
    const fill = getAttr(shd, 'fill');
    if (fill && fill.toLowerCase() !== 'auto' && /^[0-9a-f]{6}$/i.test(fill)) {
      style.background = `#${fill}`;
    }
  }
  const rFonts = firstChild(rPr, 'rFonts');
  if (rFonts) {
    const ff = getAttr(rFonts, 'ascii') || getAttr(rFonts, 'hAnsi') || getAttr(rFonts, 'cs');
    if (ff) style.fontFamily = ff;
  }
  const vertAlign = firstChild(rPr, 'vertAlign');
  if (vertAlign) {
    style.vertAlign = getAttr(vertAlign, 'val');
  }
  return style;
}

function parseParaProps(pPr) {
  const props = {};
  if (!pPr) return props;
  const pStyle = firstChild(pPr, 'pStyle');
  if (pStyle) props.styleId = getAttr(pStyle, 'val');
  const jc = firstChild(pPr, 'jc');
  if (jc) {
    const v = getAttr(jc, 'val');
    props.align = v === 'both' ? 'justify' : v;
  }
  const spacing = firstChild(pPr, 'spacing');
  if (spacing) {
    const before = getAttr(spacing, 'before');
    const after = getAttr(spacing, 'after');
    const line = getAttr(spacing, 'line');
    if (before) props.marginTop = `${twipsToPx(before).toFixed(1)}px`;
    if (after) props.marginBottom = `${twipsToPx(after).toFixed(1)}px`;
    if (line && Number(line) > 0) {
      const rule = getAttr(spacing, 'lineRule') || 'auto';
      if (rule === 'auto') {
        props.lineHeight = (Number(line) / 240).toFixed(2);
      } else {
        props.lineHeight = `${twipsToPx(line).toFixed(1)}px`;
      }
    }
  }
  const ind = firstChild(pPr, 'ind');
  if (ind) {
    const left = getAttr(ind, 'left') || getAttr(ind, 'start');
    const firstLine = getAttr(ind, 'firstLine');
    if (left) props.marginLeft = `${twipsToPx(left).toFixed(1)}px`;
    if (firstLine) props.textIndent = `${twipsToPx(firstLine).toFixed(1)}px`;
  }
  const shd = firstChild(pPr, 'shd');
  if (shd) {
    const fill = getAttr(shd, 'fill');
    if (fill && fill.toLowerCase() !== 'auto' && /^[0-9a-f]{6}$/i.test(fill)) {
      props.background = `#${fill}`;
    }
  }
  const numPr = firstChild(pPr, 'numPr');
  if (numPr) {
    const numId = firstChild(numPr, 'numId');
    const ilvl = firstChild(numPr, 'ilvl');
    props.numId = numId ? getAttr(numId, 'val') : '';
    props.ilvl = ilvl ? Number(getAttr(ilvl, 'val') || 0) : 0;
  }
  return props;
}

function parseStylesMap(stylesDoc) {
  const styles = {};
  const defaults = { run: {}, para: {} };
  if (!stylesDoc) return { styles, defaults };

  const docDefaults = findDescendant(stylesDoc.documentElement, 'docDefaults');
  if (docDefaults) {
    const rPrDef = findDescendant(docDefaults, 'rPr');
    if (rPrDef) defaults.run = parseRunProps(rPrDef);
    const pPrDef = findDescendant(docDefaults, 'pPr');
    if (pPrDef) defaults.para = parseParaProps(pPrDef);
  }

  const styleNodes = Array.from(stylesDoc.documentElement.children).filter((n) => n.localName === 'style');
  for (const sNode of styleNodes) {
    const id = getAttr(sNode, 'styleId');
    if (!id) continue;
    const basedOn = firstChild(sNode, 'basedOn');
    const nameNode = firstChild(sNode, 'name');
    styles[id] = {
      id,
      type: getAttr(sNode, 'type'),
      name: nameNode ? getAttr(nameNode, 'val') : id,
      basedOn: basedOn ? getAttr(basedOn, 'val') : null,
      para: parseParaProps(firstChild(sNode, 'pPr')),
      run: parseRunProps(firstChild(sNode, 'rPr')),
    };
  }

  return { styles, defaults };
}

function resolveStyleChain(styleId, stylesMap) {
  const visited = new Set();
  const chain = [];
  let cur = styleId;
  while (cur && stylesMap.styles[cur] && !visited.has(cur)) {
    visited.add(cur);
    chain.unshift(stylesMap.styles[cur]);
    cur = stylesMap.styles[cur].basedOn;
  }
  const para = { ...stylesMap.defaults.para };
  const run = { ...stylesMap.defaults.run };
  for (const s of chain) {
    Object.assign(para, s.para);
    Object.assign(run, s.run);
  }
  return { para, run, name: chain[chain.length - 1]?.name || styleId || '' };
}

function parseNumberingMap(numDoc) {
  const map = {};
  if (!numDoc) return map;
  const abstractFormats = {};

  for (const child of numDoc.documentElement.children) {
    if (child.localName === 'abstractNum') {
      const absId = getAttr(child, 'abstractNumId');
      const lvls = {};
      for (const lvl of child.children) {
        if (lvl.localName === 'lvl') {
          const ilvl = Number(getAttr(lvl, 'ilvl') || 0);
          const numFmt = firstChild(lvl, 'numFmt');
          const lvlText = firstChild(lvl, 'lvlText');
          lvls[ilvl] = {
            fmt: numFmt ? getAttr(numFmt, 'val') : 'bullet',
            text: lvlText ? getAttr(lvlText, 'val') : '•',
          };
        }
      }
      abstractFormats[absId] = lvls;
    }
  }

  for (const child of numDoc.documentElement.children) {
    if (child.localName === 'num') {
      const numId = getAttr(child, 'numId');
      const absRef = firstChild(child, 'abstractNumId');
      const absId = absRef ? getAttr(absRef, 'val') : '';
      map[numId] = abstractFormats[absId] || {};
    }
  }
  return map;
}

function parseRelsMap(relsDoc) {
  const map = {};
  if (!relsDoc) return map;
  for (const rel of relsDoc.documentElement.children) {
    if (rel.localName === 'Relationship') {
      const id = rel.getAttribute('Id');
      const target = rel.getAttribute('Target') || '';
      const mode = rel.getAttribute('TargetMode') || '';
      if (id) map[id] = { target, mode };
    }
  }
  return map;
}

function cssFromRun(runStyle) {
  const css = [];
  if (runStyle.bold) css.push('font-weight:700');
  if (runStyle.italic) css.push('font-style:italic');
  const dec = [];
  if (runStyle.underline) dec.push('underline');
  if (runStyle.strike) dec.push('line-through');
  if (dec.length) css.push(`text-decoration:${dec.join(' ')}`);
  if (runStyle.fontSizePt) css.push(`font-size:${runStyle.fontSizePt}pt`);
  if (runStyle.color) css.push(`color:${runStyle.color}`);
  if (runStyle.background) css.push(`background-color:${runStyle.background}`);
  if (runStyle.highlight) css.push(`background-color:${runStyle.highlight}`);
  if (runStyle.fontFamily) css.push(`font-family:"${escapeHtml(runStyle.fontFamily)}",Calibri,Arial,sans-serif`);
  if (runStyle.vertAlign === 'superscript') css.push('vertical-align:super;font-size:0.75em');
  if (runStyle.vertAlign === 'subscript') css.push('vertical-align:sub;font-size:0.75em');
  return css.join(';');
}

function cssFromPara(paraStyle) {
  const css = [];
  if (paraStyle.align) css.push(`text-align:${paraStyle.align}`);
  if (paraStyle.marginTop) css.push(`margin-top:${paraStyle.marginTop}`);
  if (paraStyle.marginBottom) css.push(`margin-bottom:${paraStyle.marginBottom}`);
  if (paraStyle.lineHeight) css.push(`line-height:${paraStyle.lineHeight}`);
  if (paraStyle.marginLeft) css.push(`margin-left:${paraStyle.marginLeft}`);
  if (paraStyle.textIndent) css.push(`text-indent:${paraStyle.textIndent}`);
  if (paraStyle.background) css.push(`background-color:${paraStyle.background};padding:4px 8px;border-radius:3px`);
  return css.join(';');
}

export async function renderDocxToViewerHtml(arrayBuffer, fileName = 'Document.docx') {
  const entries = await extractZipEntries(arrayBuffer);
  const docXml = parseXml(entries['word/document.xml']);
  if (!docXml) {
    return null;
  }

  const stylesMap = parseStylesMap(parseXml(entries['word/styles.xml']));
  const numberingMap = parseNumberingMap(parseXml(entries['word/numbering.xml']));
  const relsMap = parseRelsMap(parseXml(entries['word/_rels/document.xml.rels']));

  // Build media DataURLs
  const mediaDataUrls = {};
  for (const [entryName, bytes] of Object.entries(entries)) {
    if (entryName.startsWith('word/media/')) {
      const ext = (entryName.split('.').pop() || '').toLowerCase();
      const mime =
        ext === 'png' ? 'image/png' :
        ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' :
        ext === 'gif' ? 'image/gif' :
        ext === 'webp' ? 'image/webp' :
        ext === 'svg' ? 'image/svg+xml' :
        ext === 'bmp' ? 'image/bmp' :
        'application/octet-stream';
      mediaDataUrls[entryName] = `data:${mime};base64,${uint8ToBase64(bytes)}`;
    }
  }

  const resolveRelImage = (rId) => {
    const rel = relsMap[rId];
    if (!rel) return '';
    if (rel.mode === 'External' && /^https?:\/\//i.test(rel.target)) return rel.target;
    const norm = rel.target.replace(/^\/+/, '').replace(/^\.\.\//, '');
    const key = norm.startsWith('word/') ? norm : `word/${norm}`;
    return mediaDataUrls[key] || '';
  };

  const listCounters = {};

  const renderRun = (rNode, inheritedRunStyle) => {
    const ownRPr = parseRunProps(firstChild(rNode, 'rPr'));
    const rStyleNode = findDescendant(firstChild(rNode, 'rPr'), 'rStyle');
    const charInherited = rStyleNode ? resolveStyleChain(getAttr(rStyleNode, 'val'), stylesMap).run : {};
    const mergedRun = { ...inheritedRunStyle, ...charInherited, ...ownRPr };
    const css = cssFromRun(mergedRun);

    let out = '';
    for (const child of rNode.children) {
      const name = child.localName;
      if (name === 't' || name === 'delText') {
        out += escapeHtml(child.textContent || '');
      } else if (name === 'tab') {
        out += '<span style="display:inline-block;width:28px;"></span>';
      } else if (name === 'br') {
        if (getAttr(child, 'type') === 'page') {
          out += '<!--PAGE_BREAK-->';
        } else {
          out += '<br/>';
        }
      } else if (name === 'cr') {
        out += '<br/>';
      } else if (name === 'drawing' || name === 'pict') {
        const blip = findDescendant(child, 'blip');
        const imgData = findDescendant(child, 'imagedata');
        const rId = blip ? getAttr(blip, 'embed') : imgData ? getAttr(imgData, 'id') : '';
        const src = resolveRelImage(rId);
        if (src) {
          const extent = findDescendant(child, 'extent');
          const w = extent ? emuToPx(extent.getAttribute('cx')) : 0;
          const h = extent ? emuToPx(extent.getAttribute('cy')) : 0;
          const dimCss = w > 0
            ? `max-width:100%;width:${w}px;${h > 0 ? `height:${h}px;object-fit:contain;` : 'height:auto;'}`
            : 'max-width:100%;height:auto;';
          out += `<img src="${src}" style="display:inline-block;vertical-align:middle;margin:4px 0;${dimCss}" alt="Document media"/>`;
        }
      }
    }

    if (!out) return '';
    if (out.includes('<!--PAGE_BREAK-->')) {
      const parts = out.split('<!--PAGE_BREAK-->');
      return parts
        .map((p) => (p ? (css ? `<span style="${css}">${p}</span>` : p) : ''))
        .join('<!--PAGE_BREAK-->');
    }
    return css ? `<span style="${css}">${out}</span>` : out;
  };

  const renderParagraph = (pNode) => {
    const pPr = firstChild(pNode, 'pPr');
    const ownPara = parseParaProps(pPr);
    const resolved = resolveStyleChain(ownPara.styleId, stylesMap);
    const mergedPara = { ...resolved.para, ...ownPara };
    const inheritedRun = { ...resolved.run };

    let innerHtml = '';
    for (const child of pNode.children) {
      if (child.localName === 'r') {
        innerHtml += renderRun(child, inheritedRun);
      } else if (child.localName === 'hyperlink') {
        const relId = getAttr(child, 'id');
        const rel = relId ? relsMap[relId] : null;
        let linkContent = '';
        for (const hr of child.children) {
          if (hr.localName === 'r') linkContent += renderRun(hr, { color: '#0563c1', underline: true, ...inheritedRun });
        }
        if (rel?.target && /^https?:\/\//i.test(rel.target)) {
          innerHtml += `<a href="${escapeHtml(rel.target)}" target="_blank" rel="noopener noreferrer" style="color:#0563c1;text-decoration:underline;">${linkContent}</a>`;
        } else {
          innerHtml += linkContent;
        }
      } else if (child.localName === 'sdt') {
        const sdtContent = firstChild(child, 'sdtContent');
        if (sdtContent) {
          for (const sub of sdtContent.children) {
            if (sub.localName === 'r') innerHtml += renderRun(sub, inheritedRun);
          }
        }
      }
    }

    if (innerHtml.includes('<!--PAGE_BREAK-->')) {
      const chunks = innerHtml.split('<!--PAGE_BREAK-->');
      return chunks.map((chunk, idx) => ({
        pageBreakBefore: idx > 0,
        html: chunk ? `<p style="${cssFromPara(mergedPara)}">${chunk}</p>` : '',
      }));
    }

    // List numbering prefix
    let listPrefix = '';
    if (mergedPara.numId) {
      const numDef = numberingMap[mergedPara.numId];
      const ilvl = mergedPara.ilvl || 0;
      const lvlCfg = numDef?.[ilvl] || { fmt: 'bullet', text: '•' };
      const counterKey = `${mergedPara.numId}:${ilvl}`;
      listCounters[counterKey] = (listCounters[counterKey] || 0) + 1;
      const indentPx = 22 + ilvl * 22;
      if (!mergedPara.marginLeft) mergedPara.marginLeft = `${indentPx}px`;
      mergedPara.textIndent = '-16px';
      if (lvlCfg.fmt === 'bullet') {
        listPrefix = '<span style="display:inline-block;width:16px;">&#8226;</span>';
      } else {
        listPrefix = `<span style="display:inline-block;min-width:16px;margin-right:4px;">${listCounters[counterKey]}.</span>`;
      }
    }

    const styleLower = String(resolved.name || ownPara.styleId || '').toLowerCase();
    let tag = 'p';
    if (styleLower.includes('heading 1') || styleLower === 'heading1' || styleLower === 'title') tag = 'h1';
    else if (styleLower.includes('heading 2') || styleLower === 'heading2' || styleLower === 'subtitle') tag = 'h2';
    else if (styleLower.includes('heading 3') || styleLower === 'heading3') tag = 'h3';
    else if (styleLower.includes('heading 4') || styleLower === 'heading4') tag = 'h4';

    const pCss = cssFromPara(mergedPara);
    const content = innerHtml ? `${listPrefix}${innerHtml}` : '&nbsp;';
    return [{
      pageBreakBefore: false,
      html: `<${tag}${pCss ? ` style="${pCss}"` : ''}>${content}</${tag}>`,
    }];
  };

  const renderTable = (tblNode) => {
    const tblPr = firstChild(tblNode, 'tblPr');
    const tblBorders = tblPr ? firstChild(tblPr, 'tblBorders') : null;
    const defaultBorder = tblBorders ? '1px solid #cbd5e1' : '1px solid #cbd5e1';

    let rowsHtml = '';
    for (const tr of tblNode.children) {
      if (tr.localName !== 'tr') continue;
      let cellsHtml = '';
      for (const tc of tr.children) {
        if (tc.localName !== 'tc') continue;
        const tcPr = firstChild(tc, 'tcPr');
        const tcCss = [`border:${defaultBorder}`, 'padding:6px 8px', 'vertical-align:top'];
        let colspan = 1;

        if (tcPr) {
          const gridSpan = firstChild(tcPr, 'gridSpan');
          if (gridSpan) {
            const val = Number(getAttr(gridSpan, 'val'));
            if (val > 1) colspan = val;
          }
          const tcW = firstChild(tcPr, 'tcW');
          if (tcW && getAttr(tcW, 'type') === 'dxa') {
            const px = twipsToPx(getAttr(tcW, 'w'));
            if (px > 0) tcCss.push(`width:${px.toFixed(0)}px`);
          }
          const shd = firstChild(tcPr, 'shd');
          if (shd) {
            const fill = getAttr(shd, 'fill');
            if (fill && fill.toLowerCase() !== 'auto' && /^[0-9a-f]{6}$/i.test(fill)) {
              tcCss.push(`background-color:#${fill}`);
            }
          }
        }

        let cellContent = '';
        for (const child of tc.children) {
          if (child.localName === 'p') {
            const pieces = renderParagraph(child);
            cellContent += pieces.map((pc) => pc.html).join('');
          } else if (child.localName === 'tbl') {
            cellContent += renderTable(child);
          }
        }
        cellsHtml += `<td${colspan > 1 ? ` colspan="${colspan}"` : ''} style="${tcCss.join(';')}">${cellContent || '&nbsp;'}</td>`;
      }
      rowsHtml += `<tr>${cellsHtml}</tr>`;
    }

    return `<table style="width:100%;border-collapse:collapse;margin:8px 0 12px;table-layout:auto;"><tbody>${rowsHtml}</tbody></table>`;
  };

  // Extract header & footer snippets if present
  let headerHtml = '';
  const headerKey = Object.keys(entries).find((k) => /^word\/header\d*\.xml$/i.test(k));
  if (headerKey) {
    const hDoc = parseXml(entries[headerKey]);
    if (hDoc?.documentElement) {
      const ps = Array.from(hDoc.documentElement.children).filter((c) => c.localName === 'p');
      headerHtml = ps.map((p) => renderParagraph(p).map((x) => x.html).join('')).join('');
    }
  }
  let footerHtml = '';
  const footerKey = Object.keys(entries).find((k) => /^word\/footer\d*\.xml$/i.test(k));
  if (footerKey) {
    const fDoc = parseXml(entries[footerKey]);
    if (fDoc?.documentElement) {
      const ps = Array.from(fDoc.documentElement.children).filter((c) => c.localName === 'p');
      footerHtml = ps.map((p) => renderParagraph(p).map((x) => x.html).join('')).join('');
    }
  }

  const body = findDescendant(docXml.documentElement, 'body');
  if (!body) return null;

  // Read genuine page dimensions & margins
  const sectPr = firstChild(body, 'sectPr');
  const pgSz = sectPr ? firstChild(sectPr, 'pgSz') : null;
  const pgMar = sectPr ? firstChild(sectPr, 'pgMar') : null;
  const pageWidthPx = pgSz ? Math.round(twipsToPx(getAttr(pgSz, 'w'))) || 794 : 794;
  const pageMinHeightPx = pgSz ? Math.round(twipsToPx(getAttr(pgSz, 'h'))) || 1123 : 1123;
  const marTop = pgMar ? Math.round(twipsToPx(getAttr(pgMar, 'top'))) || 72 : 72;
  const marRight = pgMar ? Math.round(twipsToPx(getAttr(pgMar, 'right'))) || 72 : 72;
  const marBottom = pgMar ? Math.round(twipsToPx(getAttr(pgMar, 'bottom'))) || 72 : 72;
  const marLeft = pgMar ? Math.round(twipsToPx(getAttr(pgMar, 'left'))) || 72 : 72;

  const pages = [[]];
  const pushToCurrentPage = (html, newPageFirst = false) => {
    if (newPageFirst && pages[pages.length - 1].length > 0) {
      pages.push([]);
    }
    if (html) pages[pages.length - 1].push(html);
  };

  for (const child of body.children) {
    if (child.localName === 'p') {
      const hasLastRenderedBreak = Boolean(findDescendant(child, 'lastRenderedPageBreak'));
      const pieces = renderParagraph(child);
      pieces.forEach((piece, idx) => {
        pushToCurrentPage(piece.html, (idx === 0 && hasLastRenderedBreak) || piece.pageBreakBefore);
      });
    } else if (child.localName === 'tbl') {
      pushToCurrentPage(renderTable(child), false);
    } else if (child.localName === 'sdt') {
      const sdtContent = firstChild(child, 'sdtContent');
      if (sdtContent) {
        for (const sub of sdtContent.children) {
          if (sub.localName === 'p') {
            renderParagraph(sub).forEach((piece) => pushToCurrentPage(piece.html, piece.pageBreakBefore));
          } else if (sub.localName === 'tbl') {
            pushToCurrentPage(renderTable(sub), false);
          }
        }
      }
    }
  }

  const baseDefaultCss = cssFromRun(stylesMap.defaults.run || {});
  const renderedPagesHtml = pages
    .map(
      (pageBlocks) => `
      <div class="doc-page">
        ${headerHtml ? `<div class="doc-running-header">${headerHtml}</div>` : ''}
        <div class="doc-page-body">${pageBlocks.join('\n') || '<p>&nbsp;</p>'}</div>
        ${footerHtml ? `<div class="doc-running-footer">${footerHtml}</div>` : ''}
      </div>`
    )
    .join('\n');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(fileName)}</title>
  <style>
    * { box-sizing: border-box; }
    html, body {
      margin: 0;
      padding: 0;
      background: #e2e8f0;
      font-family: Calibri, "Segoe UI", Arial, sans-serif;
      font-size: 11pt;
      color: #111827;
      line-height: 1.45;
      ${baseDefaultCss}
    }
    .doc-viewport {
      padding: 20px 14px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 20px;
      min-height: 100vh;
    }
    .doc-page {
      width: min(100%, ${pageWidthPx}px);
      min-height: ${Math.min(pageMinHeightPx, 980)}px;
      background: #ffffff;
      padding: ${Math.max(28, Math.round(marTop * 0.72))}px ${Math.max(28, Math.round(marRight * 0.72))}px ${Math.max(28, Math.round(marBottom * 0.72))}px ${Math.max(28, Math.round(marLeft * 0.72))}px;
      box-shadow: 0 4px 18px rgba(15, 23, 42, 0.16), 0 1px 4px rgba(15, 23, 42, 0.08);
      border: 1px solid #cbd5e1;
      display: flex;
      flex-direction: column;
      overflow-wrap: break-word;
    }
    .doc-page-body { flex: 1; }
    .doc-running-header {
      padding-bottom: 10px;
      margin-bottom: 14px;
      border-bottom: 1px solid #e2e8f0;
      font-size: 9pt;
      color: #64748b;
    }
    .doc-running-footer {
      padding-top: 10px;
      margin-top: 18px;
      border-top: 1px solid #e2e8f0;
      font-size: 9pt;
      color: #64748b;
    }
    p { margin: 0 0 8px 0; }
    h1 { font-size: 18pt; margin: 12px 0 8px; }
    h2 { font-size: 14pt; margin: 12px 0 6px; }
    h3 { font-size: 12pt; margin: 10px 0 6px; }
    h4 { font-size: 11pt; margin: 8px 0 4px; }
    table { font-size: 10pt; }
    img { max-width: 100%; }
  </style>
</head>
<body>
  <div class="doc-viewport">
    ${renderedPagesHtml}
  </div>
</body>
</html>`;
}

export function buildCsvSpreadsheetHtml(csvText = '', fileName = 'Spreadsheet.csv') {
  const rows = [];
  let row = [];
  let cell = '';
  let inQuotes = false;

  for (let i = 0; i < csvText.length; i++) {
    const ch = csvText[i];
    const next = csvText[i + 1];
    if (inQuotes) {
      if (ch === '"' && next === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        cell += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      row.push(cell);
      cell = '';
    } else if (ch === '\r' && next === '\n') {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
      i++;
    } else if (ch === '\n' || ch === '\r') {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
    } else {
      cell += ch;
    }
  }
  if (cell.length > 0 || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }

  const maxCols = Math.max(1, ...rows.map((r) => r.length));
  const colLetter = (idx) => {
    let s = '';
    let n = idx;
    while (n >= 0) {
      s = String.fromCharCode((n % 26) + 65) + s;
      n = Math.floor(n / 26) - 1;
    }
    return s;
  };

  const ths = Array.from({ length: maxCols }, (_, i) => `<th>${colLetter(i)}</th>`).join('');
  const bodyRows = rows
    .map((r, rIdx) => {
      const tds = Array.from({ length: maxCols }, (_, cIdx) => {
        const val = escapeHtml(r[cIdx] ?? '');
        return `<td${rIdx === 0 ? ' class="first-row"' : ''}>${val}</td>`;
      }).join('');
      return `<tr><td class="row-num">${rIdx + 1}</td>${tds}</tr>`;
    })
    .join('');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(fileName)}</title>
  <style>
    html, body { margin: 0; padding: 0; background: #ffffff; font-family: Arial, sans-serif; font-size: 12px; color: #111827; }
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid #d1d5db; padding: 5px 8px; text-align: left; white-space: nowrap; }
    th { background: #f3f4f6; color: #4b5563; font-weight: 600; text-align: center; position: sticky; top: 0; }
    td.row-num { background: #f3f4f6; color: #6b7280; text-align: center; width: 38px; font-weight: 600; }
    td.first-row { font-weight: 600; background: #f8fafc; }
  </style>
</head>
<body>
  <table>
    <thead><tr><th></th>${ths}</tr></thead>
    <tbody>${bodyRows}</tbody>
  </table>
</body>
</html>`;
}

export function buildPlainTextPageHtml(text = '', fileName = 'Document.txt') {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(fileName)}</title>
  <style>
    html, body { margin: 0; padding: 0; background: #e2e8f0; font-family: "Segoe UI", Arial, sans-serif; }
    .page {
      max-width: 794px;
      min-height: 920px;
      margin: 20px auto;
      background: #ffffff;
      padding: 52px 56px;
      box-shadow: 0 4px 18px rgba(15, 23, 42, 0.14);
      border: 1px solid #cbd5e1;
      font-size: 11pt;
      line-height: 1.55;
      color: #111827;
      white-space: pre-wrap;
      word-break: break-word;
    }
  </style>
</head>
<body>
  <div class="page">${escapeHtml(text)}</div>
</body>
</html>`;
}
