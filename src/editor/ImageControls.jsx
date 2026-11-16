import React, { useState, useRef, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
import {
  Image as ImageIcon,
  Upload,
  Link as LinkIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Trash2,
  RotateCcw,
  RotateCw,
  X,
} from 'lucide-react';

function readImageAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
}

export const ImageControls = ({ editor, onImageUpload }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('upload'); // 'upload' or 'url'
  const [imageUrl, setImageUrl] = useState('');
  const [altText, setAltText] = useState('');
  const [alignment, setAlignment] = useState('center');
  const [width, setWidth] = useState('75%');
  const [rotation, setRotation] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [popoverCoords, setPopoverCoords] = useState(null);

  const containerRef = useRef(null);
  const triggerBtnRef = useRef(null);
  const popoverRef = useRef(null);
  const fileInputRef = useRef(null);

  const updatePopoverPosition = useCallback(() => {
    if (!triggerBtnRef.current || typeof window === 'undefined') return;
    const rect = triggerBtnRef.current.getBoundingClientRect();
    const popW = 310;
    const popH = popoverRef.current ? popoverRef.current.getBoundingClientRect().height : 390;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    let left = Math.min(rect.left, vw - popW - 12);
    left = Math.max(8, left);

    let top = rect.bottom + 6;
    if (top + popH > vh - 10) {
      const aboveTop = rect.top - popH - 6;
      top = aboveTop >= 8 ? aboveTop : Math.max(8, vh - popH - 10);
    }
    setPopoverCoords({ top, left, width: popW });
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    updatePopoverPosition();
    const raf = requestAnimationFrame(updatePopoverPosition);
    window.addEventListener('resize', updatePopoverPosition);
    window.addEventListener('scroll', updatePopoverPosition, true);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', updatePopoverPosition);
      window.removeEventListener('scroll', updatePopoverPosition, true);
    };
  }, [isOpen, activeTab, imageUrl, updatePopoverPosition]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && containerRef.current.contains(event.target)) return;
      if (popoverRef.current && popoverRef.current.contains(event.target)) return;
      setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!editor) return null;

  const isImageActive = editor.isActive('image');
  const currentImageAttrs = editor.getAttributes('image');

  const handleOpenModal = () => {
    if (isImageActive) {
      const existingSrc = currentImageAttrs.src || '';
      setImageUrl(existingSrc);
      setAltText(currentImageAttrs.alt || '');
      setAlignment(currentImageAttrs.alignment || currentImageAttrs['data-alignment'] || 'center');
      setWidth(currentImageAttrs.width || currentImageAttrs['data-width'] || '75%');
      setRotation(Number(currentImageAttrs.rotation ?? currentImageAttrs['data-rotation']) || 0);
      setActiveTab(/^https?:\/\//i.test(existingSrc) ? 'url' : 'upload');
    } else {
      setImageUrl('');
      setAltText('');
      setAlignment('center');
      setWidth('75%');
      setRotation(0);
      setActiveTab('upload');
    }
    setUploadError('');
    setIsOpen(true);
  };

  const applyImageToEditor = (srcToUse, altToUse) => {
    const cleanSrc = String(srcToUse || '').trim();
    if (!cleanSrc) return false;
    editor
      .chain()
      .focus()
      .setImage({
        src: cleanSrc,
        alt: String(altToUse || '').trim() || 'Policy Image',
        width,
        alignment,
        rotation: Number(rotation) || 0,
      })
      .run();
    return true;
  };

  const handleInsertOrUpdate = () => {
    if (!imageUrl.trim()) {
      setUploadError('Please upload an image file or provide an image URL');
      return;
    }

    applyImageToEditor(imageUrl, altText);
    setIsOpen(false);
  };

  const processUploadedFile = async (file) => {
    if (!file) return;
    const looksLikeImage =
      file.type?.startsWith('image/') ||
      /\.(png|jpe?g|gif|webp|svg|bmp|avif)$/i.test(file.name || '');
    if (!looksLikeImage) {
      setUploadError('Selected file is not a supported image');
      return;
    }

    setIsUploading(true);
    setUploadError('');

    try {
      let finalUrl = '';

      if (onImageUpload) {
        try {
          const uploaded = await onImageUpload(file);
          if (uploaded && typeof uploaded === 'string') {
            finalUrl = uploaded;
          }
        } catch {
          // Fall back cleanly to base64 DataURL so offline/draft saves always succeed
        }
      }
      if (!finalUrl) {
        finalUrl = await readImageAsDataUrl(file);
      }

      if (!finalUrl) {
        throw new Error('Could not read selected image');
      }

      const resolvedAlt = altText.trim() || file.name.replace(/\.[^/.]+$/, '');
      setImageUrl(finalUrl);
      if (!altText.trim()) {
        setAltText(resolvedAlt);
      }

      // Immediately insert/update the image into the live editor so it never gets lost if user clicks away
      applyImageToEditor(finalUrl, resolvedAlt);
      setIsOpen(false);
    } catch (err) {
      setUploadError(err.message || 'Image upload failed');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (file) {
      await processUploadedFile(file);
    }
  };

  const handleDeleteImage = () => {
    if (isImageActive) {
      editor.chain().focus().deleteSelection().run();
      setIsOpen(false);
    }
  };

  const popoverBody = isOpen ? (
    <div
      ref={popoverRef}
      className="image-modal-popover"
      style={
        popoverCoords
          ? {
              position: 'fixed',
              top: `${popoverCoords.top}px`,
              left: `${popoverCoords.left}px`,
              width: `${popoverCoords.width}px`,
              marginTop: 0,
              zIndex: 10260,
            }
          : undefined
      }
      onMouseDown={(e) => {
        if (!['INPUT', 'SELECT', 'TEXTAREA'].includes(e.target.tagName)) {
          e.preventDefault();
        }
        e.stopPropagation();
      }}
    >
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
          className={`image-tab-btn ${activeTab === 'upload' ? 'active' : ''}`}
          onClick={() => setActiveTab('upload')}
        >
          <Upload size={13} style={{ marginRight: 6 }} /> Upload File
        </button>
        <button
          type="button"
          className={`image-tab-btn ${activeTab === 'url' ? 'active' : ''}`}
          onClick={() => setActiveTab('url')}
        >
          <LinkIcon size={13} style={{ marginRight: 6 }} /> Web URL
        </button>
      </div>

      {activeTab === 'url' ? (
        <div className="image-form-group">
          <label className="image-field-label">Image Source URL</label>
          <input
            type="url"
            className="image-text-input"
            placeholder="https://example.com/photo.png"
            value={imageUrl.startsWith('data:image/') ? '' : imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleInsertOrUpdate();
              }
            }}
          />

          {imageUrl && (
            <div className="image-preview-box">
              <img
                src={imageUrl}
                alt={altText || 'Preview'}
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
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              const dropped = e.dataTransfer?.files?.[0];
              if (dropped) void processUploadedFile(dropped);
            }}
          >
            <Upload size={22} className="upload-icon" />
            <p>Click or drop an image file here</p>
            <span className="upload-subtext">Inserts immediately • JPG, PNG, GIF, WebP, SVG</span>
          </div>
          {isUploading && <p className="uploading-text">Inserting image...</p>}
          {imageUrl && !isUploading && (
            <div className="image-preview-box" style={{ marginTop: 8 }}>
              <img src={imageUrl} alt={altText || 'Selected preview'} />
            </div>
          )}
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

      <div className="image-form-group" style={{ marginBottom: 10 }}>
        <label className="image-field-label">Rotate Image ({rotation}°)</label>
        <div className="image-align-btns">
          <button
            type="button"
            className="align-btn"
            onClick={() => setRotation((r) => (((Number(r) || 0) - 90) % 360 + 360) % 360)}
            title="Rotate Left 90°"
          >
            <RotateCcw size={13} />
          </button>
          <button
            type="button"
            className={`align-btn ${rotation === 0 ? 'selected' : ''}`}
            onClick={() => setRotation(0)}
            style={{ fontSize: 10, fontWeight: 600 }}
          >
            0°
          </button>
          <button
            type="button"
            className={`align-btn ${rotation === 90 ? 'selected' : ''}`}
            onClick={() => setRotation(90)}
            style={{ fontSize: 10, fontWeight: 600 }}
          >
            90°
          </button>
          <button
            type="button"
            className={`align-btn ${rotation === 180 ? 'selected' : ''}`}
            onClick={() => setRotation(180)}
            style={{ fontSize: 10, fontWeight: 600 }}
          >
            180°
          </button>
          <button
            type="button"
            className="align-btn"
            onClick={() => setRotation((r) => (((Number(r) || 0) + 90) % 360 + 360) % 360)}
            title="Rotate Right 90°"
          >
            <RotateCw size={13} />
          </button>
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
  ) : null;

  return (
    <div className="image-controls-wrapper" ref={containerRef}>
      <button
        ref={triggerBtnRef}
        type="button"
        className={`toolbar-btn ${isImageActive ? 'active' : ''}`}
        onMouseDown={(e) => e.preventDefault()}
        onClick={handleOpenModal}
        title="Insert or Edit Image"
        aria-expanded={isOpen}
      >
        <ImageIcon size={16} />
        <span className="btn-label-text">Image</span>
      </button>

      {popoverBody && typeof document !== 'undefined'
        ? ReactDOM.createPortal(popoverBody, document.body)
        : popoverBody}
    </div>
  );
};

export default ImageControls;
