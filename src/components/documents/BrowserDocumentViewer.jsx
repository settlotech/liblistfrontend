import React, { useEffect, useMemo, useState } from 'react';
import { ExternalLink, FileText, Loader2, ZoomIn, ZoomOut } from 'lucide-react';
import {
  renderDocxToViewerHtml,
  buildCsvSpreadsheetHtml,
  buildPlainTextPageHtml,
} from '../../utils/docxBrowserRenderer';
import './browserDocumentViewer.css';

/**
 * Renders an uploaded or stored document natively in browser/Word page view
 * (.docx via pure-JS Word page renderer, .pdf via browser PDF viewer, plus .doc/.csv/.txt/images).
 */
export default function BrowserDocumentViewer({
  fileName = '',
  fileObj = null,
  previewUrl = '',
  cloudUrl = '',
  fallbackRawText = '',
  headerLabel = 'Original Document',
}) {
  const [resolvedUrl, setResolvedUrl] = useState('');
  const [docHtml, setDocHtml] = useState('');
  const [viewerMode, setViewerMode] = useState('loading');
  const [preferWebDocsViewer, setPreferWebDocsViewer] = useState(false);
  const [zoomPct, setZoomPct] = useState(90);

  const ext = (fileName.split('.').pop() || '').toLowerCase();
  const isPdf = ext === 'pdf' || (fileObj?.type || '').includes('pdf');
  const isDocx =
    ext === 'docx' ||
    (fileObj?.type || '').includes('wordprocessingml.document');
  const isLegacyOffice = ['doc', 'xlsx', 'xls', 'pptx', 'ppt'].includes(ext);
  const isCsv = ext === 'csv';
  const isImage = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp'].includes(ext);
  const isPlainText = ['txt', 'md', 'json', 'log'].includes(ext);

  const sourceToRender = previewUrl || cloudUrl || '';
  const publicUrl = cloudUrl || (previewUrl && /^https?:\/\//i.test(previewUrl) ? previewUrl : '');

  useEffect(() => {
    let cancelled = false;
    let createdBlobUrl = null;

    const loadDocument = async () => {
      setDocHtml('');
      setResolvedUrl('');
      setPreferWebDocsViewer(false);
      setViewerMode('loading');

      // 1. PDF -> Native browser PDF viewer
      if (isPdf) {
        if (fileObj && typeof fileObj.arrayBuffer === 'function') {
          try {
            const buf = await fileObj.arrayBuffer();
            createdBlobUrl = URL.createObjectURL(new Blob([buf], { type: 'application/pdf' }));
            if (!cancelled) {
              setResolvedUrl(`${createdBlobUrl}#view=FitH`);
              setViewerMode('pdf');
            }
            return;
          } catch {
            // Fall through to URL handling
          }
        }

        if (sourceToRender) {
          if (!cancelled) {
            setResolvedUrl(sourceToRender.includes('#') ? sourceToRender : `${sourceToRender}#view=FitH`);
            setViewerMode('pdf');
          }
          return;
        }

        if (!cancelled) setViewerMode('unavailable');
        return;
      }

      // 2. Images -> Direct browser image frame
      if (isImage) {
        if (fileObj instanceof Blob) {
          createdBlobUrl = URL.createObjectURL(fileObj);
          if (!cancelled) {
            setResolvedUrl(createdBlobUrl);
            setViewerMode('image');
          }
          return;
        }
        if (sourceToRender) {
          if (!cancelled) {
            setResolvedUrl(sourceToRender);
            setViewerMode('image');
          }
          return;
        }
      }

      // 3. DOCX -> Render Word page sheets inside isolated <iframe srcDoc>
      if (isDocx) {
        let arrayBuf = null;
        if (fileObj && typeof fileObj.arrayBuffer === 'function') {
          try {
            arrayBuf = await fileObj.arrayBuffer();
          } catch {
            arrayBuf = null;
          }
        } else if (sourceToRender) {
          try {
            const resp = await fetch(sourceToRender);
            if (resp.ok) {
              arrayBuf = await resp.arrayBuffer();
            }
          } catch {
            arrayBuf = null;
          }
        }

        if (arrayBuf) {
          try {
            const html = await renderDocxToViewerHtml(arrayBuf, fileName);
            if (html && !cancelled) {
              setDocHtml(html);
              setViewerMode('html_pages');
              return;
            }
          } catch {
            // Fall back cleanly below
          }
        }

        if (fallbackRawText && !cancelled) {
          setDocHtml(buildPlainTextPageHtml(fallbackRawText, fileName));
          setViewerMode('html_pages');
          return;
        }

        if (!cancelled) {
          setViewerMode(publicUrl ? 'office_iframe' : 'unavailable');
        }
        return;
      }

      // 4. Legacy Office (.doc, .xls, .ppt) -> Public Office viewer or formatted extracted page view
      if (isLegacyOffice) {
        if (publicUrl) {
          if (!cancelled) setViewerMode('office_iframe');
          return;
        }
        if (fallbackRawText && !cancelled) {
          setDocHtml(buildPlainTextPageHtml(fallbackRawText, fileName));
          setViewerMode('html_pages');
          return;
        }
        if (!cancelled) setViewerMode('unavailable');
        return;
      }

      // 5. CSV Spreadsheet -> Isolated grid sheet viewer
      if (isCsv) {
        let text = fallbackRawText;
        if (fileObj && typeof fileObj.text === 'function') {
          try {
            text = await fileObj.text();
          } catch {
            // Keep fallback
          }
        } else if (sourceToRender) {
          try {
            const resp = await fetch(sourceToRender);
            if (resp.ok) text = await resp.text();
          } catch {
            // Keep fallback
          }
        }
        if (text && !cancelled) {
          setDocHtml(buildCsvSpreadsheetHtml(text, fileName));
          setViewerMode('html_pages');
          return;
        }
      }

      // 6. Plain Text / Fallback extracted text -> Isolated page sheet viewer
      if (isPlainText || fallbackRawText) {
        let text = fallbackRawText;
        if (isPlainText && fileObj && typeof fileObj.text === 'function') {
          try {
            text = await fileObj.text();
          } catch {
            // Keep fallback
          }
        }
        if (text && !cancelled) {
          setDocHtml(buildPlainTextPageHtml(text, fileName));
          setViewerMode('html_pages');
          return;
        }
      }

      if (publicUrl && !cancelled) {
        setViewerMode('gview_iframe');
        return;
      }

      if (!cancelled) setViewerMode('unavailable');
    };

    loadDocument();

    return () => {
      cancelled = true;
      if (createdBlobUrl) {
        URL.revokeObjectURL(createdBlobUrl);
      }
    };
  }, [fileName, fileObj, sourceToRender, publicUrl, fallbackRawText, isPdf, isDocx, isLegacyOffice, isCsv, isImage, isPlainText]);

  const effectiveMode = preferWebDocsViewer && publicUrl ? 'office_iframe' : viewerMode;
  const openHref = cloudUrl || resolvedUrl || previewUrl || '';
  const officeEmbedUrl = publicUrl
    ? `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(publicUrl)}`
    : '';
  const gviewEmbedUrl = publicUrl
    ? `https://docs.google.com/gview?url=${encodeURIComponent(publicUrl)}&embedded=true`
    : '';

  const scaledDocHtml = useMemo(() => {
    if (!docHtml) return '';
    if (zoomPct === 100) return docHtml;
    const zoomStyle = `<style>body { zoom: ${(zoomPct / 100).toFixed(2)}; }</style></head>`;
    return docHtml.includes('</head>') ? docHtml.replace('</head>', zoomStyle) : docHtml;
  }, [docHtml, zoomPct]);

  return (
    <div className="bdv-shell">
      <div className="bdv-topbar">
        <div className="bdv-title-wrap">
          <span className="bdv-header-title">{headerLabel}</span>
          {ext && <span className="bdv-ext-pill">{ext.toUpperCase()}</span>}
          {fileName && <span className="bdv-filename" title={fileName}>{fileName}</span>}
        </div>
        <div className="bdv-actions">
          {effectiveMode === 'html_pages' && (
            <div className="bdv-zoom-group">
              <button
                type="button"
                className="bdv-zoom-btn"
                onClick={() => setZoomPct((z) => Math.max(60, z - 10))}
                disabled={zoomPct <= 60}
                title="Zoom Out"
              >
                <ZoomOut size={12} />
              </button>
              <button
                type="button"
                className="bdv-zoom-val"
                onClick={() => setZoomPct(90)}
                title="Reset Zoom"
              >
                {zoomPct}%
              </button>
              <button
                type="button"
                className="bdv-zoom-btn"
                onClick={() => setZoomPct((z) => Math.min(150, z + 10))}
                disabled={zoomPct >= 150}
                title="Zoom In"
              >
                <ZoomIn size={12} />
              </button>
            </div>
          )}
          {isDocx && publicUrl && (
            <button
              type="button"
              className="bdv-btn"
              onClick={() => setPreferWebDocsViewer((v) => !v)}
              title="Switch between Native Page View and Web Docs Viewer"
            >
              {effectiveMode === 'office_iframe' ? 'Page View' : 'Web Viewer'}
            </button>
          )}
          {openHref && (
            <button
              type="button"
              className="bdv-btn"
              onClick={() => window.open(openHref, '_blank', 'noopener,noreferrer')}
              title="Open original file in new browser tab"
            >
              <ExternalLink size={12} />
              <span>Open</span>
            </button>
          )}
        </div>
      </div>

      {effectiveMode === 'loading' && (
        <div className="bdv-center-state">
          <Loader2 size={24} className="bdv-spin" />
          <span>Rendering original document view...</span>
        </div>
      )}

      {effectiveMode === 'pdf' && resolvedUrl && (
        <iframe
          key={resolvedUrl}
          src={resolvedUrl}
          type="application/pdf"
          className="bdv-iframe dark"
          title={fileName || 'PDF Document Viewer'}
        />
      )}

      {effectiveMode === 'html_pages' && scaledDocHtml && (
        <iframe
          srcDoc={scaledDocHtml}
          sandbox="allow-same-origin allow-popups"
          className="bdv-iframe"
          title={fileName || 'Original Document View'}
        />
      )}

      {effectiveMode === 'office_iframe' && officeEmbedUrl && (
        <iframe
          src={officeEmbedUrl}
          className="bdv-iframe light"
          title={fileName || 'Office Document Viewer'}
        />
      )}

      {effectiveMode === 'gview_iframe' && gviewEmbedUrl && (
        <iframe
          src={gviewEmbedUrl}
          className="bdv-iframe light"
          title={fileName || 'Docs Viewer'}
        />
      )}

      {effectiveMode === 'image' && resolvedUrl && (
        <div className="bdv-image-wrap">
          <img
            src={resolvedUrl}
            alt={fileName || 'Uploaded image document'}
            className="bdv-image"
          />
        </div>
      )}

      {effectiveMode === 'unavailable' && (
        <div className="bdv-center-state">
          <FileText size={34} style={{ color: '#94a3b8' }} />
          <div style={{ fontWeight: 700, color: '#334155' }}>{fileName || 'Document'}</div>
          <span>Direct preview is unavailable for this file format.</span>
          {openHref && (
            <a
              href={openHref}
              target="_blank"
              rel="noreferrer"
              className="bdv-open-link"
            >
              Open Original File
            </a>
          )}
        </div>
      )}
    </div>
  );
}
