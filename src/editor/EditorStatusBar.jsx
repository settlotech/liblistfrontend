import React from 'react';
import {
  CheckCircle2,
  Clock,
  FileText,
  AlertCircle,
  ZoomIn,
  ZoomOut,
  RefreshCw,
} from 'lucide-react';

export const EditorStatusBar = ({
  editor,
  saveStatus = 'saved', // 'saved' | 'saving' | 'unsaved' | 'error'
  lastSavedAt = null,
  zoomLevel = 100,
  onZoomChange,
  pageCount = 1,
  currentPage = 1,
  isPaged = true,
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
    if (onZoomChange && zoomLevel < 175) {
      onZoomChange(Math.min(175, zoomLevel + 10));
    }
  };

  const handleZoomOut = () => {
    if (onZoomChange && zoomLevel > 60) {
      onZoomChange(Math.max(60, zoomLevel - 10));
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

        {/* Zoom Controls */}
        <div className="status-item zoom-controls">
          <button
            type="button"
            className="btn-status-zoom"
            onClick={handleZoomOut}
            title="Zoom Out"
            disabled={zoomLevel <= 60}
          >
            <ZoomOut size={12} />
          </button>
          <span
            className="zoom-percent-text"
            onClick={handleResetZoom}
            title="Click to reset zoom"
          >
            {zoomLevel}%
          </span>
          <button
            type="button"
            className="btn-status-zoom"
            onClick={handleZoomIn}
            title="Zoom In"
            disabled={zoomLevel >= 175}
          >
            <ZoomIn size={12} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditorStatusBar;
