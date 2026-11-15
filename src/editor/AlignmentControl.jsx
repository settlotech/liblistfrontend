import React, { useState, useRef, useEffect } from 'react';
import {
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  ChevronsUpDown,
} from 'lucide-react';

const LINE_SPACINGS = [
  { label: '1.0 (Single)', value: '1.0' },
  { label: '1.15', value: '1.15' },
  { label: '1.5 (1.5 lines)', value: '1.5' },
  { label: '2.0 (Double)', value: '2.0' },
  { label: '2.5', value: '2.5' },
];

export const AlignmentControl = ({ editor }) => {
  const [showSpacing, setShowSpacing] = useState(false);
  const spacingRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (spacingRef.current && !spacingRef.current.contains(event.target)) {
        setShowSpacing(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!editor) return null;

  const currentSpacing = editor.getAttributes('paragraph').lineHeight ||
    editor.getAttributes('heading').lineHeight || '1.6';

  const applyLineSpacing = (val) => {
    editor.chain().focus().setLineHeight(val).run();
    setShowSpacing(false);
  };

  return (
    <div className="alignment-controls-wrapper">
      <button
        type="button"
        className={`toolbar-btn icon-only ${editor.isActive({ textAlign: 'left' }) ? 'active' : ''}`}
        onClick={() => editor.chain().focus().setTextAlign('left').run()}
        title="Align Left (Ctrl+L)"
      >
        <AlignLeft size={16} />
      </button>

      <button
        type="button"
        className={`toolbar-btn icon-only ${editor.isActive({ textAlign: 'center' }) ? 'active' : ''}`}
        onClick={() => editor.chain().focus().setTextAlign('center').run()}
        title="Align Center (Ctrl+E)"
      >
        <AlignCenter size={16} />
      </button>

      <button
        type="button"
        className={`toolbar-btn icon-only ${editor.isActive({ textAlign: 'right' }) ? 'active' : ''}`}
        onClick={() => editor.chain().focus().setTextAlign('right').run()}
        title="Align Right (Ctrl+R)"
      >
        <AlignRight size={16} />
      </button>

      <button
        type="button"
        className={`toolbar-btn icon-only ${editor.isActive({ textAlign: 'justify' }) ? 'active' : ''}`}
        onClick={() => editor.chain().focus().setTextAlign('justify').run()}
        title="Justify (Ctrl+J)"
      >
        <AlignJustify size={16} />
      </button>

      {/* Line Spacing Control */}
      <div className="dropdown-control line-spacing-control" ref={spacingRef}>
        <button
          type="button"
          className="toolbar-btn icon-only"
          onClick={() => setShowSpacing(!showSpacing)}
          title="Line & Paragraph Spacing"
          aria-expanded={showSpacing}
        >
          <ChevronsUpDown size={15} />
        </button>

        {showSpacing && (
          <ul className="dropdown-menu line-spacing-menu" role="menu">
            <li className="dropdown-menu-header">Line Spacing</li>
            {LINE_SPACINGS.map((spacing) => (
              <li
                key={spacing.value}
                role="menuitem"
                className={`dropdown-item ${currentSpacing === spacing.value ? 'selected' : ''}`}
                onClick={() => applyLineSpacing(spacing.value)}
              >
                {spacing.label}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default AlignmentControl;
