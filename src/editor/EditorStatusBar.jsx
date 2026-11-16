import React from 'react';
import {
  CheckCircle2,
  Clock,
  FileText,
  AlertCircle,
  ZoomIn,
  ZoomOut,
  Maximize2,
  RefreshCw,
} from 'lucide-react';

export const EditorStatusBar = ({
  editor,
  saveStatus = 'saved', // 'saved' | 'saving' | 'unsaved' | 'error'
  lastSavedAt = null,
  zoomLevel = 100,
  onZoomChange,
  onFitPage = null,
  pageCount = 1,
  currentPage = 1,
  isPaged = true,
  onAddPage = null,
}) => {
  if (!editor) return null;

  // Calculate text statistics
  const text = editor.getText();
  const characters = text.length;
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const readingTimeMinutes = Math.max(1, Math.ceil(words / 200));

  // Selection statistics
  const { from, to } = editor.state.selection;
  const selectedText = editor.state.doc.textBetween(from, to, ' ');
  const selectedWords = selectedText.trim()
    ? selectedText.trim().split(/\s+/).length
    : 0;

  const handleZoomIn = () => {
    if (onZoomChange && zoomLevel < 200) {
      onZoomChange(Math.min(200, zoomLevel + 10));
    }
  };

  const handleZoomOut = () => {
    if (onZoomChange && zoomLevel > 25) {
      onZoomChange(Math.max(25, zoomLevel - 10));
    }
  };

  const handleResetZoom = () => {
    if (onZoomChange) {
      onZoomChange(100);
    }
  };

  return (
    <div className="modern-status-bar" role="status" aria-label="Editor Status">
      <div className="status-bar-left">
        {isPaged ? (
          <div className="status-item status-page-count" title="Current Page">
            <FileText size={12} className="status-icon" />
            <span>
              Page {currentPage} of {pageCount}
            </span>
          </div>
        ) : (
          <div className="status-item">
            <FileText size={12} className="status-icon" />
            <span>Flow Canvas</span>
          </div>
        )}

        <div className="status-divider" />

        <div className="status-item">
          <span>
            {words} {words === 1 ? 'word' : 'words'}
          </span>
          {selectedWords > 0 && (
            <span className="selection-badge">({selectedWords} selected)</span>
          )}
        </div>

        <div className="status-divider" />

        <div className="status-item">
          <span>{characters} characters</span>
        </div>

        <div className="status-divider" />

        <div className="status-item" title="Estimated reading time">
          <Clock size={12} className="status-icon" />
          <span>~{readingTimeMinutes} min read</span>
        </div>
      </div>

      <div className="status-bar-right">
        {/* Save State Indicator */}
        <div
          className="status-item save-indicator"
          title={
            lastSavedAt
              ? `Last saved at ${lastSavedAt.toLocaleTimeString()}`
              : ''
          }
        >
          {saveStatus === 'saved' && (
            <>
              <CheckCircle2 size={13} className="status-icon icon-success" />
              <span>Saved</span>
            </>
          )}
          {saveStatus === 'saving' && (
            <>
              <RefreshCw size={13} className="status-icon icon-spin" />
              <span>Saving...</span>
            </>
          )}
          {saveStatus === 'unsaved' && (
            <>
              <span className="unsaved-dot" />
              <span>Unsaved changes</span>
            </>
          )}
          {saveStatus === 'error' && (
            <>
              <AlertCircle size={13} className="status-icon icon-error" />
              <span>Save failed</span>
            </>
          )}
        </div>

        <div className="status-divider" />

        {/* Zoom & Quick Add Page Controls */}
        <div className="status-item zoom-controls">
          <button
            type="button"
            className="btn-status-zoom"
            onClick={handleZoomOut}
            title="Zoom Out (Ctrl + Mouse Wheel)"
            disabled={zoomLevel <= 25}
          >
            <ZoomOut size={13} />
          </button>
          <span
            className="zoom-percent-text"
            onClick={handleResetZoom}
            title="Click to reset zoom to 100%"
          >
            {zoomLevel}%
          </span>
          <button
            type="button"
            className="btn-status-zoom"
            onClick={handleZoomIn}
            title="Zoom In (Ctrl + Mouse Wheel)"
            disabled={zoomLevel >= 200}
          >
            <ZoomIn size={13} />
          </button>
          {onFitPage && (
            <button
              type="button"
              className="btn-status-zoom"
              onClick={onFitPage}
              title="Fit Full Page in View"
            >
              <Maximize2 size={12} />
            </button>
          )}
        </div>

        {onAddPage && (
          <>
            <div className="status-divider" />
            <button
              type="button"
              onClick={onAddPage}
              title="Add New Page"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '2px 8px',
                borderRadius: '6px',
                background: '#eff6ff',
                color: '#0057B8',
                border: '1px solid #bfdbfe',
                fontWeight: 700,
                fontSize: '11px',
                cursor: 'pointer',
              }}
            >
              <span>+</span>
              <span>Add Page</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default EditorStatusBar;
