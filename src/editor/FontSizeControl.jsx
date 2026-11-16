import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Plus, Minus } from 'lucide-react';

const FONT_SIZES = [
  '8px',
  '9px',
  '10px',
  '11px',
  '12px',
  '14px',
  '16px',
  '18px',
  '20px',
  '24px',
  '28px',
  '32px',
  '36px',
  '48px',
  '72px',
];

export const FontSizeControl = ({ editor }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
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

  // Selection-aware: get active font size from TextStyle mark
  const currentFontSize = editor.getAttributes('textStyle').fontSize || '16px';
  const numericSize = parseInt(currentFontSize, 10) || 16;

  const handleApplySize = (val) => {
    let sizeStr = val.toString().trim();
    if (!sizeStr) return;
    if (!isNaN(sizeStr)) {
      sizeStr = `${sizeStr}px`;
    }
    editor.chain().focus().setFontSize(sizeStr).run();
    setIsOpen(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleApplySize(inputValue || currentFontSize);
    }
  };

  const increaseFontSize = () => {
    const nextSize = `${numericSize + 2}px`;
    editor.chain().focus().setFontSize(nextSize).run();
  };

  const decreaseFontSize = () => {
    if (numericSize > 6) {
      const prevSize = `${numericSize - 2}px`;
      editor.chain().focus().setFontSize(prevSize).run();
    }
  };

  return (
    <div className="font-size-group" ref={containerRef}>
      <div className="dropdown-control font-size-control">
        <button
          type="button"
          className="toolbar-dropdown-btn font-size-btn"
          onClick={() => {
            setInputValue(numericSize.toString());
            setIsOpen(!isOpen);
          }}
          title="Font Size"
          aria-haspopup="listbox"
          aria-expanded={isOpen}
        >
          <span className="selected-size">{numericSize}</span>
          <ChevronDown size={14} className="dropdown-arrow" />
        </button>

        {isOpen && (
          <div className="dropdown-menu font-size-menu" role="listbox">
            <div className="custom-size-input-wrapper">
              <input
                type="number"
                min="6"
                max="120"
                className="custom-size-input"
                placeholder="Custom pt/px"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                autoFocus
              />
              <button
                type="button"
                className="btn-apply-size"
                onClick={() => handleApplySize(inputValue)}
              >
                Set
              </button>
            </div>
            <ul className="font-size-list">
              {FONT_SIZES.map((size) => {
                const num = parseInt(size, 10);
                return (
                  <li
                    key={size}
                    role="option"
                    aria-selected={numericSize === num}
                    className={`dropdown-item ${numericSize === num ? 'selected' : ''}`}
                    onClick={() => handleApplySize(size)}
                  >
                    {num}
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>

      <button
        type="button"
        className="toolbar-btn icon-only"
        onClick={increaseFontSize}
        title="Grow Font Size (Ctrl+Shift+>)"
      >
        <span className="font-step-indicator">
          A<Plus size={10} className="step-badge" />
        </span>
      </button>

      <button
        type="button"
        className="toolbar-btn icon-only"
        onClick={decreaseFontSize}
        title="Shrink Font Size (Ctrl+Shift+<)"
      >
        <span className="font-step-indicator">
          A<Minus size={10} className="step-badge" />
        </span>
      </button>
    </div>
  );
};

export default FontSizeControl;
