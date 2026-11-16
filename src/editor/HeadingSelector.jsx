import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

const STYLES = [
  { label: 'Normal Text', value: 'paragraph', tag: 'p', className: 'style-preview-p' },
  { label: 'Heading 1', value: '1', tag: 'h1', className: 'style-preview-h1' },
  { label: 'Heading 2', value: '2', tag: 'h2', className: 'style-preview-h2' },
  { label: 'Heading 3', value: '3', tag: 'h3', className: 'style-preview-h3' },
  { label: 'Heading 4', value: '4', tag: 'h4', className: 'style-preview-h4' },
];

export const HeadingSelector = ({ editor }) => {
  const [isOpen, setIsOpen] = useState(false);
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

  // Selection-aware: detect current block format
  let currentStyle = STYLES[0];
  for (let level = 1; level <= 4; level++) {
    if (editor.isActive('heading', { level })) {
      currentStyle = STYLES.find((s) => s.value === String(level)) || STYLES[0];
      break;
    }
  }

  const handleSelect = (item) => {
    if (item.value === 'paragraph') {
      editor.chain().focus().setParagraph().run();
    } else {
      editor.chain().focus().toggleHeading({ level: Number(item.value) }).run();
    }
    setIsOpen(false);
  };

  return (
    <div className="dropdown-control heading-selector-control" ref={containerRef}>
      <button
        type="button"
        className="toolbar-dropdown-btn heading-selector-btn"
        onClick={() => setIsOpen(!isOpen)}
        title="Styles & Headings"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="selected-heading-text">{currentStyle.label}</span>
        <ChevronDown size={14} className="dropdown-arrow" />
      </button>

      {isOpen && (
        <ul className="dropdown-menu heading-menu" role="listbox">
          {STYLES.map((item) => (
            <li
              key={item.value}
              role="option"
              aria-selected={currentStyle.value === item.value}
              className={`dropdown-item heading-item ${currentStyle.value === item.value ? 'selected' : ''}`}
              onClick={() => handleSelect(item)}
            >
              <div className="heading-preview-item">
                <span className="heading-label">{item.label}</span>
                <span className={`heading-sample ${item.className}`}>AaBbCc</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default HeadingSelector;
