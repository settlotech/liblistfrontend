import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

const FONT_FAMILIES = [
  { name: 'Default Font', value: '' },
  { name: 'Arial', value: 'Arial, sans-serif' },
  { name: 'Calibri', value: 'Calibri, sans-serif' },
  { name: 'Georgia', value: 'Georgia, serif' },
  { name: 'Times New Roman', value: '"Times New Roman", Times, serif' },
  { name: 'Verdana', value: 'Verdana, sans-serif' },
  { name: 'Tahoma', value: 'Tahoma, sans-serif' },
  { name: 'Courier New', value: '"Courier New", Courier, monospace' },
  { name: 'Trebuchet MS', value: '"Trebuchet MS", sans-serif' },
  { name: 'Garamond', value: 'Garamond, serif' },
  { name: 'Impact', value: 'Impact, sans-serif' },
];

export const FontFamilyControl = ({ editor }) => {
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

  // Selection-aware: get active font family
  const currentFontFamily =
    editor.getAttributes('textStyle').fontFamily || '';

  const activeFont =
    FONT_FAMILIES.find((font) => {
      if (!font.value && !currentFontFamily) return true;
      if (!font.value || !currentFontFamily) return false;
      return (
        currentFontFamily.toLowerCase().includes(font.name.toLowerCase()) ||
        currentFontFamily === font.value
      );
    }) || { name: currentFontFamily ? currentFontFamily.split(',')[0].replace(/['"]/g, '') : 'Default Font', value: currentFontFamily };

  const handleSelect = (fontValue) => {
    if (!fontValue) {
      editor.chain().focus().unsetFontFamily().run();
    } else {
      editor.chain().focus().setFontFamily(fontValue).run();
    }
    setIsOpen(false);
  };

  return (
    <div className="dropdown-control font-family-control" ref={containerRef}>
      <button
        type="button"
        className="toolbar-dropdown-btn font-family-btn"
        onClick={() => setIsOpen(!isOpen)}
        title="Font Family"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span
          className="selected-text"
          style={{ fontFamily: activeFont.value || 'inherit' }}
        >
          {activeFont.name}
        </span>
        <ChevronDown size={14} className="dropdown-arrow" />
      </button>

      {isOpen && (
        <ul className="dropdown-menu font-family-menu" role="listbox">
          {FONT_FAMILIES.map((font) => (
            <li
              key={font.name}
              role="option"
              aria-selected={activeFont.name === font.name}
              className={`dropdown-item ${activeFont.name === font.name ? 'selected' : ''}`}
              style={{ fontFamily: font.value || 'inherit' }}
              onClick={() => handleSelect(font.value)}
            >
              {font.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default FontFamilyControl;
