import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

// Word-style standard palette
const THEME_COLORS = [
  '#000000', '#434343', '#666666', '#999999', '#b7b7b7', '#cccccc', '#d9d9d9', '#efefef', '#f3f3f3', '#ffffff',
  '#980000', '#ff0000', '#ff9900', '#ffff00', '#00ff00', '#00ffff', '#4a86e8', '#0000ff', '#9900ff', '#ff00ff',
  '#e6b8af', '#f4cccc', '#fce5cd', '#fff2cc', '#d9ead3', '#d0e0e3', '#c9daf8', '#cfe2f3', '#d9d2e9', '#ead1dc',
  '#dd7e6b', '#ea9999', '#f9cb9c', '#ffe599', '#b6d7a8', '#a2c4c9', '#a4c2f4', '#9fc5e8', '#b4a7d6', '#d5a6bd',
  '#cc4125', '#e06666', '#f6b26b', '#ffd966', '#93c47d', '#76a5af', '#6d9eeb', '#6fa8dc', '#8e7cc3', '#c27ba0',
  '#a61c00', '#cc0000', '#e69138', '#f1c232', '#6aa84f', '#45818e', '#3c78d8', '#3d85c6', '#674ea7', '#a64d79',
  '#5b0f00', '#660000', '#783f04', '#7f6000', '#274e13', '#0c343d', '#1155cc', '#073763', '#20124d', '#4c1130',
];

export const TextColorPicker = ({ editor }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [customColor, setCustomColor] = useState('#000000');
  const [recentColors, setRecentColors] = useState(() => {
    try {
      const saved = localStorage.getItem('tiptap_recent_text_colors');
      return saved ? JSON.parse(saved) : ['#000000', '#1d4ed8', '#dc2626', '#16a34a'];
    } catch {
      return ['#000000', '#1d4ed8', '#dc2626', '#16a34a'];
    }
  });

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

  // Selection-aware: get active text color
  const currentColor = editor.getAttributes('textStyle').color || '#000000';

  const applyColor = (color) => {
    if (!color) {
      editor.chain().focus().unsetColor().run();
    } else {
      editor.chain().focus().setColor(color).run();

      // update recent colors
      setRecentColors((prev) => {
        const filtered = prev.filter((c) => c.toLowerCase() !== color.toLowerCase());
        const updated = [color, ...filtered].slice(0, 8);
        try {
          localStorage.setItem('tiptap_recent_text_colors', JSON.stringify(updated));
        } catch {}
        return updated;
      });
    }
    setIsOpen(false);
  };

  return (
    <div className="color-picker-wrapper" ref={containerRef}>
      <div className="split-color-btn">
        <button
          type="button"
          className="toolbar-btn text-color-main-btn"
          onClick={() => applyColor(currentColor)}
          title={`Font Color (${currentColor})`}
        >
          <span className="color-icon-letter">
            A
            <span
              className="color-bar-indicator"
              style={{ backgroundColor: currentColor }}
            />
          </span>
        </button>
        <button
          type="button"
          className="toolbar-btn text-color-arrow-btn"
          onClick={() => setIsOpen(!isOpen)}
          title="Choose Text Color"
          aria-expanded={isOpen}
        >
          <ChevronDown size={11} />
        </button>
      </div>

      {isOpen && (
        <div className="color-picker-popover">
          <div className="color-popover-header">
            <span>Font Color</span>
            <button
              type="button"
              className="btn-text-reset"
              onClick={() => applyColor(null)}
            >
              Automatic
            </button>
          </div>

          <div className="color-section-title">Theme Colors</div>
          <div className="color-grid">
            {THEME_COLORS.map((col, idx) => (
              <button
                key={idx}
                type="button"
                className={`color-swatch ${currentColor.toLowerCase() === col.toLowerCase() ? 'active' : ''}`}
                style={{ backgroundColor: col }}
                onClick={() => applyColor(col)}
                title={col}
              >
                {currentColor.toLowerCase() === col.toLowerCase() && (
                  <Check
                    size={10}
                    color={
                      ['#ffffff', '#efefef', '#f3f3f3', '#fff2cc', '#ffff00'].includes(col)
                        ? '#000'
                        : '#fff'
                    }
                  />
                )}
              </button>
            ))}
          </div>

          {recentColors.length > 0 && (
            <>
              <div className="color-section-title">Recent Colors</div>
              <div className="recent-colors-row">
                {recentColors.map((col, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className="color-swatch small"
                    style={{ backgroundColor: col }}
                    onClick={() => applyColor(col)}
                    title={col}
                  />
                ))}
              </div>
            </>
          )}

          <div className="color-section-title">Custom Color</div>
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
              placeholder="#000000"
            />
            <button
              type="button"
              className="btn-apply-color"
              onClick={() => applyColor(customColor)}
            >
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TextColorPicker;
