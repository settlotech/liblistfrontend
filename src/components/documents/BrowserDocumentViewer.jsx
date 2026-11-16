import React, { useEffect, useState } from 'react';
import { ExternalLink, FileText, Loader2 } from 'lucide-react';
import {
  renderDocxToViewerHtml,
  buildCsvSpreadsheetHtml,
  buildPlainTextPageHtml,
} from '../../utils/docxBrowserRenderer';

/**
 * Renders an uploaded/stored file in authentic browser / docs-viewer page mode
 * rather than custom application section cards.
 */
export default function BrowserDocumentViewer({
  fileName = '',
  fileObj = null,
  previewUrl = '',
  cloudUrl = '',
  fallbackRawText = '',
  onOpenCompare = null,
}) {
  const [resolvedPdfUrl, setResolvedPdfUrl] = useState('');
  const [docHtml, setDocHtml] = useState('');
  const [localViewerMode, setLocalViewerMode] = useState('loading'); // 'pdf' | 'html_pages' | 'office_iframe' | 'gview_iframe' | 'image' | 'loading' | 'unavailable'
  const [preferWebDocsViewer, setPreferWebDocsViewer] = useState(false);

  const ext = (fileName.split('.').pop() || '').toLowerCase();
  const isPdf = ext === 'pdf' || (fileObj?.type || '').includes('pdf');
  const isDocx = ext === 'docx';
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
      setResolvedPdfUrl('');
      setPreferWebDocsViewer(false);
      setLocalViewerMode('loading');

      // 1. PDF -> Native browser PDF viewer (force inline application/pdf Blob so browser never triggers download)
      if (isPdf) {
        if (fileObj && typeof fileObj.arrayBuffer === 'function') {
          try {
            const buf = await fileObj.arrayBuffer();
            createdBlobUrl = URL.createObjectURL(new Blob([buf], { type: 'application/pdf' }));
            if (!cancelled) {
              setResolvedPdfUrl(`${createdBlobUrl}#view=FitH`);
              setLocalViewerMode('pdf');
            }
            return;
          } catch {
            // Fall through to URL handling
          }
        }

        if (sourceToRender && sourceToRender.startsWith('blob:')) {
          if (!cancelled) {
            setResolvedPdfUrl(`${sourceToRender}#view=FitH`);
            setLocalViewerMode('pdf');
          }
          return;
        }

        if (sourceToRender && /^https?:\/\//i.test(sourceToRender)) {
          try {
            const resp = await fetch(sourceToRender);
            if (resp.ok) {
              const buf = await resp.arrayBuffer();
              createdBlobUrl = URL.createObjectURL(new Blob([buf], { type: 'application/pdf' }));
              if (!cancelled) {
                setResolvedPdfUrl(`${createdBlobUrl}#view=FitH`);
                setLocalViewerMode('pdf');
              }
              return;
            }
          } catch {
            // Fallback to direct URL in native iframe below
          }
          if (!cancelled) {
            setResolvedPdfUrl(`${sourceToRender}#view=FitH`);
            setLocalViewerMode('pdf');
          }
          return;
        }

        if (!cancelled) setLocalViewerMode('unavailable');
        return;
      }

      // 2. Images -> Direct browser image frame
      if (isImage) {
        if (fileObj instanceof Blob) {
          createdBlobUrl = URL.createObjectURL(fileObj);
          if (!cancelled) {
            setResolvedPdfUrl(createdBlobUrl);
            setLocalViewerMode('image');
          }
          return;
        }
        if (sourceToRender) {
          if (!cancelled) {
            setResolvedPdfUrl(sourceToRender);
            setLocalViewerMode('image');
          }
          return;
        }
      }

      // 3. DOCX -> Render authentic Word page sheets inside isolated <iframe srcDoc>
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
              setLocalViewerMode('html_pages');
              return;
            }
          } catch {
            // Fall back cleanly if binary parsing fails
          }
        }

        if (!cancelled) {
          setLocalViewerMode(sourceToRender && /^https?:\/\//i.test(sourceToRender) ? 'office_iframe' : 'unavailable');
        }
        return;
      }

      // 4. Legacy Office (.doc, .xlsx, .xls, .pptx) -> waits for public URL unless already present
      if (isLegacyOffice) {
        if (!cancelled) {
          setLocalViewerMode('office_iframe');
        }
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
          setLocalViewerMode('html_pages');
          return;
        }
      }

      // 6. Plain Text / Raw Document -> Isolated page sheet viewer
      if (isPlainText || fallbackRawText) {
        let text = fallbackRawText;
        if (fileObj && typeof fileObj.text === 'function') {
          try {
            text = await fileObj.text();
          } catch {
            // Keep fallback
          }
        }
        if (text && !cancelled) {
          setDocHtml(buildPlainTextPageHtml(text, fileName));
          setLocalViewerMode('html_pages');
          return;
        }
      }

      if (sourceToRender && /^https?:\/\//i.test(sourceToRender) && !cancelled) {
        setLocalViewerMode('gview_iframe');
        return;
      }

      if (!cancelled) setLocalViewerMode('unavailable');
    };

    loadDocument();

    return () => {
      cancelled = true;
      if (createdBlobUrl) {
        URL.revokeObjectURL(createdBlobUrl);
      }
    };
  }, [fileName, fileObj, sourceToRender, fallbackRawText, isPdf, isDocx, isLegacyOffice, isCsv, isImage, isPlainText]);

  const effectiveMode =
    preferWebDocsViewer && publicUrl
      ? 'office_iframe'
      : isLegacyOffice && !publicUrl
        ? 'loading'
        : localViewerMode;

  const openHref = cloudUrl || resolvedPdfUrl || previewUrl || '';
  const officeEmbedUrl = publicUrl
    ? `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(publicUrl)}`
    : '';
  const gviewEmbedUrl = publicUrl
    ? `https://docs.google.com/gview?url=${encodeURIComponent(publicUrl)}&embedded=true`
    : '';

  return (
    <div className="w-full flex-1 flex flex-col bg-[#525659] overflow-hidden relative">
      {(openHref || publicUrl || onOpenCompare) && (
        <div className="bg-slate-800/95 px-3 py-1.5 flex items-center justify-between gap-2 text-[11px] text-slate-300 border-b border-slate-700 flex-shrink-0">
          <span className="font-mono text-slate-400 uppercase text-[10px]">
            {ext ? `${ext.toUpperCase()} Viewer` : 'Browser Document View'}
          </span>
          <div className="flex items-center gap-1.5">
            {isDocx && publicUrl && (
              <button
                type="button"
                onClick={() => setPreferWebDocsViewer((v) => !v)}
                className="px-2 py-0.5 bg-slate-700 hover:bg-slate-600 text-white rounded text-[10.5px] font-medium transition cursor-pointer"
                title="Switch between Page View and Web Docs Viewer"
              >
                {effectiveMode === 'office_iframe' ? 'Page View' : 'Web Viewer'}
              </button>
            )}
            {openHref && (
              <button
                type="button"
                onClick={() => window.open(openHref, '_blank', 'noopener,noreferrer')}
                className="px-2 py-0.5 bg-slate-700 hover:bg-slate-600 text-white rounded text-[10.5px] font-medium flex items-center gap-1 transition cursor-pointer"
                title="Open file in new browser tab"
              >
                <ExternalLink className="w-3 h-3 text-blue-400" />
                <span>Open in Browser</span>
              </button>
            )}
            {isPdf && onOpenCompare && (
              <button
                type="button"
                onClick={onOpenCompare}
                className="px-2 py-0.5 bg-[#0057B8] hover:bg-[#004EA6] text-white rounded text-[10.5px] font-bold transition cursor-pointer"
              >
                Split Compare
              </button>
            )}
          </div>
        </div>
      )}

      {effectiveMode === 'loading' && (
        <div className="w-full flex-1 flex flex-col items-center justify-center gap-2.5 bg-[#e2e8f0] text-slate-600 text-xs">
          <Loader2 className="w-6 h-6 animate-spin text-[#0057B8]" />
          <span className="font-medium">Loading browser document view...</span>
        </div>
      )}

      {effectiveMode === 'pdf' && resolvedPdfUrl && (
        <iframe
          key={resolvedPdfUrl}
          src={resolvedPdfUrl}
          type="application/pdf"
          className="w-full flex-1 border-0 bg-[#525659]"
          title={fileName || 'PDF Document Viewer'}
        />
      )}

      {effectiveMode === 'html_pages' && docHtml && (
        <iframe
          srcDoc={docHtml}
          sandbox="allow-same-origin allow-popups"
          className="w-full flex-1 border-0 bg-[#e2e8f0]"
          title={fileName || 'Document Page View'}
        />
      )}

      {effectiveMode === 'office_iframe' && officeEmbedUrl && (
        <iframe
          src={officeEmbedUrl}
          className="w-full flex-1 border-0 bg-white"
          title={fileName || 'Office Document Viewer'}
        />
      )}

      {effectiveMode === 'gview_iframe' && gviewEmbedUrl && (
        <iframe
          src={gviewEmbedUrl}
          className="w-full flex-1 border-0 bg-white"
          title={fileName || 'Docs Viewer'}
        />
      )}

      {effectiveMode === 'image' && resolvedPdfUrl && (
        <div className="w-full flex-1 overflow-auto bg-[#374151] flex items-center justify-center p-4">
          <img
            src={resolvedPdfUrl}
            alt={fileName || 'Uploaded image document'}
            className="max-w-full max-h-full object-contain bg-white shadow-xl rounded"
          />
        </div>
      )}

      {effectiveMode === 'unavailable' && (
        <div className="w-full flex-1 flex flex-col items-center justify-center gap-2 bg-[#f1f5f9] text-slate-500 p-6 text-center text-xs">
          <FileText className="w-9 h-9 text-slate-400" />
          <p className="font-semibold text-slate-700">{fileName || 'Document'}</p>
          <p>Direct file preview is unavailable for this item.</p>
          {openHref && (
            <a
              href={openHref}
              target="_blank"
              rel="noreferrer"
              className="px-3.5 py-1.5 bg-[#0057B8] text-white font-bold rounded-lg text-xs hover:bg-[#004EA6] transition"
            >
              Open Stored File
            </a>
          )}
        </div>
      )}
    </div>
  );
}
