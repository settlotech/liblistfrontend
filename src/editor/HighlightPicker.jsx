import React, { useState, useRef, useEffect } from 'react';
import { Highlighter, ChevronDown, Ban, Check } from 'lucide-react';

const HIGHLIGHT_PALETTE = [
  { name: 'Yellow', color: '#ffff00' },
  { name: 'Bright Green', color: '#00ff00' },
  { name: 'Cyan', color: '#00ffff' },
  { name: 'Pink', color: '#ff00ff' },
  { name: 'Blue', color: '#38bdf8' },
  { name: 'Red', color: '#ff4d4d' },
  { name: 'Dark Blue', color: '#0000ff' },
  { name: 'Teal', color: '#008080' },
  { name: 'Green', color: '#008000' },
  { name: 'Purple', color: '#800080' },
  { name: 'Dark Red', color: '#800000' },
  { name: 'Olive', color: '#808000' },
  { name: 'Gray 50%', color: '#808080' },
  { name: 'Light Gray', color: '#c0c0c0' },
  { name: 'Black', color: '#000000' },
];

export const HighlightPicker = ({ editor }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [customColor, setCustomColor] = useState('#ffff00');
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

  // Selection-aware: check if active highlight
  const isHighlighted = editor.isActive('highlight');
  const currentHighlightColor = editor.getAttributes('highlight').color || (isHighlighted ? '#ffff00' : null);

  const applyHighlight = (color) => {
    if (!color) {
      editor.chain().focus().unsetHighlight().run();
    } else {
      editor.chain().focus().setHighlight({ color }).run();
    }
    setIsOpen(false);
  };

  return (
    <div className="color-picker-wrapper" ref={containerRef}>
      <div className="split-color-btn">
        <button
          type="button"
          className={`toolbar-btn highlight-main-btn ${isHighlighted ? 'active' : ''}`}
          onClick={() => {
            if (isHighlighted) {
              editor.chain().focus().unsetHighlight().run();
            } else {
              applyHighlight(currentHighlightColor || '#ffff00');
            }
          }}
          title="Text Highlight Color"
        >
          <div className="highlight-icon-wrapper">
            <Highlighter size={16} />
            <span
              className="color-bar-indicator"
              style={{
                backgroundColor: currentHighlightColor || '#ffff00',
              }}
            />
          </div>
        </button>
        <button
          type="button"
          className="toolbar-btn text-color-arrow-btn"
          onClick={() => setIsOpen(!isOpen)}
          title="Choose Highlight Color"
          aria-expanded={isOpen}
        >
          <ChevronDown size={11} />
        </button>
      </div>

      {isOpen && (
        <div className="color-picker-popover highlight-popover">
          <div className="color-popover-header">
            <span>Highlight Color</span>
            <button
              type="button"
              className="btn-no-color"
              onClick={() => applyHighlight(null)}
            >
              <Ban size={12} style={{ marginRight: 4 }} /> No Color
            </button>
          </div>

          <div className="color-grid highlight-grid">
            {HIGHLIGHT_PALETTE.map((item) => (
              <button
                key={item.color}
                type="button"
                className={`color-swatch ${currentHighlightColor === item.color ? 'active' : ''}`}
                style={{ backgroundColor: item.color }}
                onClick={() => applyHighlight(item.color)}
                title={item.name}
              >
                {currentHighlightColor === item.color && (
                  <Check
                    size={10}
                    color={
                      ['#ffff00', '#00ff00', '#00ffff', '#c0c0c0'].includes(item.color)
                        ? '#000'
                        : '#fff'
                    }
                  />
                )}
              </button>
            ))}
          </div>

          <div className="color-section-title">Custom Highlight</div>
          <div className="custom-color-row">
            <input
              type="color"
              className="color-input-native"
              value={customColor}
              onChange={(e) => setCustomColor(e.target.value)}
            />
            <input
              type="text"
              className="color-input-hex"
              value={customColor}
              maxLength={7}
              onChange={(e) => setCustomColor(e.target.value)}
              placeholder="#ffff00"
            />
            <button
              type="button"
              className="btn-apply-color"
              onClick={() => applyHighlight(customColor)}
            >
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default HighlightPicker;
