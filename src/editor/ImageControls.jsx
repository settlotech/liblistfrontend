import React, { useState, useRef, useEffect } from 'react';
import {
  Image as ImageIcon,
  Upload,
  Link as LinkIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Trash2,
  Maximize2,
  X,
} from 'lucide-react';

export const ImageControls = ({ editor, onImageUpload }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('url'); // 'url' or 'upload'
  const [imageUrl, setImageUrl] = useState('');
  const [altText, setAltText] = useState('');
  const [alignment, setAlignment] = useState('center');
  const [width, setWidth] = useState('100%');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const containerRef = useRef(null);
  const fileInputRef = useRef(null);

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

  const isImageActive = editor.isActive('image');
  const currentImageAttrs = editor.getAttributes('image');

  const handleOpenModal = () => {
    if (isImageActive) {
      setImageUrl(currentImageAttrs.src || '');
      setAltText(currentImageAttrs.alt || '');
      setAlignment(currentImageAttrs['data-alignment'] || 'center');
      setWidth(currentImageAttrs['data-width'] || '100%');
    } else {
      setImageUrl('');
      setAltText('');
      setAlignment('center');
      setWidth('100%');
    }
    setUploadError('');
    setIsOpen(true);
  };

  const handleInsertOrUpdate = () => {
    if (!imageUrl.trim()) {
      setUploadError('Please provide a valid image URL');
      return;
    }

    editor
      .chain()
      .focus()
      .setImage({
        src: imageUrl.trim(),
        alt: altText.trim(),
        'data-width': width,
        'data-alignment': alignment,
      })
      .run();

    setIsOpen(false);
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError('Selected file is not an image');
      return;
    }

    setIsUploading(true);
    setUploadError('');

    try {
      let finalUrl = '';

      if (onImageUpload) {
        // External upload handler provided by app/backend
        finalUrl = await onImageUpload(file);
      } else {
        // Embed the image in editor content so it is included when the document is saved.
        finalUrl = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = (error) => reject(error);
          reader.readAsDataURL(file);
        });
      }

      if (typeof finalUrl !== 'string' || !finalUrl.trim()) {
        throw new Error('Image upload did not return an image URL');
      }

      const nextAltText = altText || file.name.replace(/\.[^/.]+$/, '');
      setImageUrl(finalUrl);
      setAltText(nextAltText);
      editor.chain().focus().setImage({
        src: finalUrl,
        alt: nextAltText,
        'data-width': width,
        'data-alignment': alignment,
      }).run();
      setActiveTab('url');
      setIsOpen(false);
    } catch (err) {
      setUploadError(err.message || 'Image upload failed');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeleteImage = () => {
    if (isImageActive) {
      editor.chain().focus().deleteSelection().run();
      setIsOpen(false);
    }
  };

  return (
    <div className="image-controls-wrapper" ref={containerRef}>
      <button
        type="button"
        className={`toolbar-btn ${isImageActive ? 'active' : ''}`}
        onClick={handleOpenModal}
        title="Insert or Edit Image"
        aria-expanded={isOpen}
      >
        <ImageIcon size={16} />
        <span className="btn-label-text">Image</span>
      </button>

      {isOpen && (
        <div className="image-modal-popover">
          <div className="image-modal-header">
            <span>{isImageActive ? 'Edit Image' : 'Insert Image'}</span>
            <button
              type="button"
              className="btn-close-modal"
              onClick={() => setIsOpen(false)}
            >
              <X size={14} />
            </button>
          </div>

          <div className="image-tab-bar">
            <button
              type="button"
              className={`image-tab-btn ${activeTab === 'url' ? 'active' : ''}`}
              onClick={() => setActiveTab('url')}
            >
              <LinkIcon size={13} style={{ marginRight: 6 }} /> Web URL
            </button>
            <button
              type="button"
              className={`image-tab-btn ${activeTab === 'upload' ? 'active' : ''}`}
              onClick={() => setActiveTab('upload')}
            >
              <Upload size={13} style={{ marginRight: 6 }} /> Upload File
            </button>
          </div>

          {activeTab === 'url' ? (
            <div className="image-form-group">
              <label className="image-field-label">Image Source URL</label>
              <input
                type="url"
                className="image-text-input"
                placeholder="https://example.com/photo.png"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
              />

              {imageUrl && (
                <div className="image-preview-box">
                  <img
                    src={imageUrl}
                    alt="Preview"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                    onLoad={(e) => {
                      e.target.style.display = 'block';
                    }}
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="image-upload-dropzone">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleFileUpload}
              />
              <div
                className="upload-dropzone-inner"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload size={24} className="upload-icon" />
                <p>Click to choose an image from your computer</p>
                <span className="upload-subtext">JPG, PNG, GIF, WebP, SVG</span>
              </div>
              {isUploading && <p className="uploading-text">Uploading image...</p>}
            </div>
          )}

          {uploadError && <div className="image-error-text">{uploadError}</div>}

          <div className="image-form-group">
            <label className="image-field-label">Alternative Text (Alt)</label>
            <input
              type="text"
              className="image-text-input"
              placeholder="Descriptive image summary"
              value={altText}
              onChange={(e) => setAltText(e.target.value)}
            />
          </div>

          <div className="image-form-row">
            <div className="image-form-subcol">
              <label className="image-field-label">Alignment</label>
              <div className="image-align-btns">
                <button
                  type="button"
                  className={`align-btn ${alignment === 'left' ? 'selected' : ''}`}
                  onClick={() => setAlignment('left')}
                  title="Align Left"
                >
                  <AlignLeft size={14} />
                </button>
                <button
                  type="button"
                  className={`align-btn ${alignment === 'center' ? 'selected' : ''}`}
                  onClick={() => setAlignment('center')}
                  title="Align Center"
                >
                  <AlignCenter size={14} />
                </button>
                <button
                  type="button"
                  className={`align-btn ${alignment === 'right' ? 'selected' : ''}`}
                  onClick={() => setAlignment('right')}
                  title="Align Right"
                >
                  <AlignRight size={14} />
                </button>
              </div>
            </div>

            <div className="image-form-subcol">
              <label className="image-field-label">Size Preset</label>
              <select
                className="image-size-select"
                value={width}
                onChange={(e) => setWidth(e.target.value)}
              >
                <option value="25%">Small (25%)</option>
                <option value="50%">Medium (50%)</option>
                <option value="75%">Large (75%)</option>
                <option value="100%">Full Width (100%)</option>
              </select>
            </div>
          </div>

          <div className="image-modal-actions">
            {isImageActive && (
              <button
                type="button"
                className="btn-danger-text"
                onClick={handleDeleteImage}
              >
                <Trash2 size={13} style={{ marginRight: 4 }} /> Delete Image
              </button>
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
                onClick={handleInsertOrUpdate}
                disabled={isUploading || !imageUrl.trim()}
              >
                {isImageActive ? 'Update Image' : 'Insert Image'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageControls;
