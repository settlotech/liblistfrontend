import React, { useState, useRef, useEffect } from 'react';
import { Link2, Link2Off, ExternalLink, X } from 'lucide-react';

export const LinkControls = ({ editor }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [url, setUrl] = useState('');
  const [openInNewTab, setOpenInNewTab] = useState(true);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!editor) return null;

  const isLinkActive = editor.isActive('link');
  const currentHref = editor.getAttributes('link').href || '';

  const handleOpen = () => {
    setUrl(currentHref);
    setOpenInNewTab(editor.getAttributes('link').target !== '_self');
    setIsOpen(true);
  };

  const handleSave = () => {
    let finalUrl = url.trim();
    if (!finalUrl) {
      editor.chain().focus().unsetLink().run();
    } else {
      // Add https:// protocol if omitted
      if (!/^https?:\/\//i.test(finalUrl) && !/^mailto:/i.test(finalUrl)) {
        finalUrl = `https://${finalUrl}`;
      }
      editor
        .chain()
        .focus()
        .extendMarkRange('link')
        .setLink({
          href: finalUrl,
          target: openInNewTab ? '_blank' : '_self',
        })
        .run();
    }
    setIsOpen(false);
  };

  const handleRemove = () => {
    editor.chain().focus().unsetLink().run();
    setIsOpen(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    }
  };

  return (
    <div className="link-controls-wrapper" ref={containerRef}>
      <button
        type="button"
        className={`toolbar-btn ${isLinkActive ? 'active' : ''}`}
        onClick={handleOpen}
        title={isLinkActive ? 'Edit Hyperlink (Ctrl+K)' : 'Insert Hyperlink (Ctrl+K)'}
        aria-expanded={isOpen}
      >
        <Link2 size={16} />
        <span className="btn-label-text">Link</span>
      </button>

      {isOpen && (
        <div className="link-modal-popover">
          <div className="link-modal-header">
            <span>{isLinkActive ? 'Edit Link' : 'Insert Hyperlink'}</span>
            <button
              type="button"
              className="btn-close-modal"
              onClick={() => setIsOpen(false)}
            >
              <X size={14} />
            </button>
          </div>

          <div className="link-form-body">
            <div className="link-input-group">
              <label className="link-field-label">Target URL</label>
              <input
                type="text"
                className="link-text-input"
                placeholder="https://example.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={handleKeyDown}
                autoFocus
              />
            </div>

            <label className="link-checkbox-label">
              <input
                type="checkbox"
                checked={openInNewTab}
                onChange={(e) => setOpenInNewTab(e.target.checked)}
              />
              <span>Open in new tab</span>
            </label>
          </div>

          <div className="link-modal-actions">
            {isLinkActive && (
              <div className="link-left-actions">
                <button
                  type="button"
                  className="btn-danger-text"
                  onClick={handleRemove}
                  title="Remove link formatting"
                >
                  <Link2Off size={13} style={{ marginRight: 4 }} /> Unlink
                </button>
                {currentHref && (
                  <a
                    href={currentHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-visit-link"
                    title="Open link in browser"
                  >
                    <ExternalLink size={13} />
                  </a>
                )}
              </div>
            )}
            <div className="actions-right">
              <button
                type="button"
                className="btn-modal-cancel"
                onClick={() => setIsOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-modal-submit"
                onClick={handleSave}
              >
                {isLinkActive ? 'Save' : 'Insert'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LinkControls;
