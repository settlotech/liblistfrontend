import React, { useState, useRef, useEffect } from 'react';
import {
  Table as TableIcon,
  ChevronDown,
  Plus,
  Trash2,
  Columns,
  Rows,
  Split,
  Combine,
  CheckSquare,
  PaintBucket,
  Square,
  Ban,
} from 'lucide-react';

const MAX_GRID_ROWS = 8;
const MAX_GRID_COLS = 8;

const SHADING_COLORS = [
  '#ffffff', '#f8fafc', '#f1f5f9', '#e2e8f0', '#cbd5e1', '#94a3b8',
  '#eff6ff', '#dbeafe', '#bfdbfe', '#93c5fd', '#3b82f6', '#1d4ed8',
  '#f0fdf4', '#dcfce7', '#bbf7d0', '#86efac', '#22c55e', '#15803d',
  '#fefce8', '#fef9c3', '#fef08a', '#fde047', '#eab308', '#a16207',
  '#fff1f2', '#ffe4e6', '#fecdd3', '#fda4af', '#ef4444', '#b91c1c',
  '#faf5ff', '#f3e8ff', '#e9d5ff', '#d8b4fe', '#a855f7', '#7e22ce',
];

const BORDER_COLORS = [
  '#000000', // Word standard black
  '#334155', // Slate
  '#64748b', // Muted Slate
  '#cbd5e1', // Light Gray
  '#2563eb', // Blue
  '#dc2626', // Red
  '#16a34a', // Green
  '#d97706', // Amber
  '#7c3aed', // Purple
];

export const TableControls = ({ editor }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showShadingMenu, setShowShadingMenu] = useState(false);
  const [showBorderMenu, setShowBorderMenu] = useState(false);
  const [customShading, setCustomShading] = useState('#dbeafe');
  const [customBorder, setCustomBorder] = useState('#000000');

  const [hoveredRows, setHoveredRows] = useState(3);
  const [hoveredCols, setHoveredCols] = useState(3);
  const containerRef = useRef(null);
  const shadingRef = useRef(null);
  const borderRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
      if (shadingRef.current && !shadingRef.current.contains(event.target)) {
        setShowShadingMenu(false);
      }
      if (borderRef.current && !borderRef.current.contains(event.target)) {
        setShowBorderMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!editor) return null;

  const isTableActive = editor.isActive('table');

  const handleInsertGridTable = (rows, cols) => {
    editor
      .chain()
      .focus()
      .insertTable({ rows, cols, withHeaderRow: true })
      .run();
    setIsOpen(false);
  };

  const applyShading = (color) => {
    editor
      .chain()
      .focus()
      .setCellAttribute('backgroundColor', color)
      .run();
    setShowShadingMenu(false);
  };

  const applyBorderColor = (color) => {
    editor
      .chain()
      .focus()
      .setCellAttribute('borderColor', color)
      .run();
    setShowBorderMenu(false);
  };

  return (
    <div className="table-controls-wrapper" ref={containerRef}>
      <button
        type="button"
        className={`toolbar-btn table-main-btn ${isTableActive ? 'active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        title="Table Tools & Grid Selector"
        aria-expanded={isOpen}
      >
        <TableIcon size={15} />
        <span className="btn-label-text">Table</span>
        <ChevronDown size={11} className="dropdown-arrow" />
      </button>

      {isOpen && (
        <div className="table-popover-menu">
          {!isTableActive ? (
            <div className="table-grid-selector">
              <div className="table-grid-header">
                <span>Insert Table</span>
                <span className="table-grid-dim">
                  {hoveredCols} x {hoveredRows}
                </span>
              </div>
              <div
                className="grid-matrix"
                onMouseLeave={() => {
                  setHoveredRows(3);
                  setHoveredCols(3);
                }}
              >
                {Array.from({ length: MAX_GRID_ROWS }).map((_, rIdx) => (
                  <div key={rIdx} className="grid-row">
                    {Array.from({ length: MAX_GRID_COLS }).map((_, cIdx) => {
                      const isHighlighted =
                        rIdx < hoveredRows && cIdx < hoveredCols;
                      return (
                        <div
                          key={cIdx}
                          className={`grid-cell ${isHighlighted ? 'highlighted' : ''}`}
                          onMouseEnter={() => {
                            setHoveredRows(rIdx + 1);
                            setHoveredCols(cIdx + 1);
                          }}
                          onClick={() =>
                            handleInsertGridTable(rIdx + 1, cIdx + 1)
                          }
                          title={`${cIdx + 1} Columns x ${rIdx + 1} Rows`}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
              <div className="table-grid-footer">
                Click to insert {hoveredCols} × {hoveredRows} table
              </div>
            </div>
          ) : (
            <div className="table-operations-menu">
              <div className="table-popover-header">
                <span className="table-status-badge">Table Active</span>
                <button
                  type="button"
                  className="btn-danger-text"
                  onClick={() => {
                    editor.chain().focus().deleteTable().run();
                    setIsOpen(false);
                  }}
                >
                  <Trash2 size={12} style={{ marginRight: 4 }} /> Delete Table
                </button>
              </div>

              {/* Shading & Border Color Operations */}
              <div className="table-menu-section">
                <div className="table-menu-title">Styling & Borders</div>
                <div className="table-btn-group">
                  <button
                    type="button"
                    className="table-action-item"
                    onClick={() => {
                      setIsOpen(false);
                      setShowShadingMenu(true);
                    }}
                  >
                    <PaintBucket size={13} /> Cell Shading (Background)
                  </button>
                  <button
                    type="button"
                    className="table-action-item"
                    onClick={() => {
                      setIsOpen(false);
                      setShowBorderMenu(true);
                    }}
                  >
                    <Square size={13} /> Change Border Color
                  </button>
                </div>
              </div>

              <div className="table-menu-section">
                <div className="table-menu-title">Row Operations</div>
                <div className="table-btn-group">
                  <button
                    type="button"
                    className="table-action-item"
                    onClick={() => {
                      editor.chain().focus().addRowBefore().run();
                      setIsOpen(false);
                    }}
                  >
                    <Plus size={13} /> Add Row Above
                  </button>
                  <button
                    type="button"
                    className="table-action-item"
                    onClick={() => {
                      editor.chain().focus().addRowAfter().run();
                      setIsOpen(false);
                    }}
                  >
                    <Plus size={13} /> Add Row Below
                  </button>
                  <button
                    type="button"
                    className="table-action-item danger"
                    onClick={() => {
                      editor.chain().focus().deleteRow().run();
                      setIsOpen(false);
                    }}
                  >
                    <Trash2 size={13} /> Delete Row
                  </button>
                </div>
              </div>

              <div className="table-menu-section">
                <div className="table-menu-title">Column Operations</div>
                <div className="table-btn-group">
                  <button
                    type="button"
                    className="table-action-item"
                    onClick={() => {
                      editor.chain().focus().addColumnBefore().run();
                      setIsOpen(false);
                    }}
                  >
                    <Plus size={13} /> Add Column Left
                  </button>
                  <button
                    type="button"
                    className="table-action-item"
                    onClick={() => {
                      editor.chain().focus().addColumnAfter().run();
                      setIsOpen(false);
                    }}
                  >
                    <Plus size={13} /> Add Column Right
                  </button>
                  <button
                    type="button"
                    className="table-action-item danger"
                    onClick={() => {
                      editor.chain().focus().deleteColumn().run();
                      setIsOpen(false);
                    }}
                  >
                    <Trash2 size={13} /> Delete Column
                  </button>
                </div>
              </div>

              <div className="table-menu-section">
                <div className="table-menu-title">Cells & Headers</div>
                <div className="table-btn-group">
                  <button
                    type="button"
                    className="table-action-item"
                    onClick={() => {
                      editor.chain().focus().toggleHeaderRow().run();
                      setIsOpen(false);
                    }}
                  >
                    <CheckSquare size={13} /> Toggle Header Row
                  </button>
                  <button
                    type="button"
                    className="table-action-item"
                    onClick={() => {
                      editor.chain().focus().toggleHeaderColumn().run();
                      setIsOpen(false);
                    }}
                  >
                    <Columns size={13} /> Toggle Header Column
                  </button>
                  <button
                    type="button"
                    className="table-action-item"
                    onClick={() => {
                      editor.chain().focus().mergeCells().run();
                      setIsOpen(false);
                    }}
                  >
                    <Combine size={13} /> Merge Selected Cells
                  </button>
                  <button
                    type="button"
                    className="table-action-item"
                    onClick={() => {
                      editor.chain().focus().splitCell().run();
                      setIsOpen(false);
                    }}
                  >
                    <Split size={13} /> Split Cell
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Quick context action buttons when inside table */}
      {isTableActive && (
        <div className="table-quick-actions">
          {/* Quick Shading Button */}
          <div className="dropdown-control" ref={shadingRef}>
            <button
              type="button"
              className="toolbar-btn icon-only"
              onClick={() => setShowShadingMenu(!showShadingMenu)}
              title="Cell Shading (Fill Color)"
            >
              <PaintBucket size={14} />
            </button>

            {showShadingMenu && (
              <div className="color-picker-popover table-color-popover">
                <div className="color-popover-header">
                  <span>Cell Shading</span>
                  <button
                    type="button"
                    className="btn-no-color"
                    onClick={() => applyShading(null)}
                  >
                    <Ban size={11} style={{ marginRight: 3 }} /> No Fill
                  </button>
                </div>
                <div className="color-grid">
                  {SHADING_COLORS.map((col, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className="color-swatch"
                      style={{ backgroundColor: col }}
                      onClick={() => applyShading(col)}
                      title={col}
                    />
                  ))}
                </div>
                <div className="custom-color-row" style={{ marginTop: 8 }}>
                  <input
                    type="color"
                    className="color-input-native"
                    value={customShading}
                    onChange={(e) => setCustomShading(e.target.value)}
                  />
                  <input
                    type="text"
                    className="color-input-hex"
                    value={customShading}
                    maxLength={7}
                    onChange={(e) => setCustomShading(e.target.value)}
                  />
                  <button
                    type="button"
                    className="btn-apply-color"
                    onClick={() => applyShading(customShading)}
                  >
                    Apply
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Quick Border Color Button */}
          <div className="dropdown-control" ref={borderRef}>
            <button
              type="button"
              className="toolbar-btn icon-only"
              onClick={() => setShowBorderMenu(!showBorderMenu)}
              title="Table Border Color"
            >
              <Square size={14} />
            </button>

            {showBorderMenu && (
              <div className="color-picker-popover table-color-popover">
                <div className="color-popover-header">
                  <span>Border Color</span>
                  <button
                    type="button"
                    className="btn-no-color"
                    onClick={() => applyBorderColor('#000000')}
                  >
                    Black (Word)
                  </button>
                </div>
                <div className="color-grid" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
                  {BORDER_COLORS.map((col, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className="color-swatch"
                      style={{ backgroundColor: col }}
                      onClick={() => applyBorderColor(col)}
                      title={col}
                    />
                  ))}
                </div>
                <div className="custom-color-row" style={{ marginTop: 8 }}>
                  <input
                    type="color"
                    className="color-input-native"
                    value={customBorder}
                    onChange={(e) => setCustomBorder(e.target.value)}
                  />
                  <input
                    type="text"
                    className="color-input-hex"
                    value={customBorder}
                    maxLength={7}
                    onChange={(e) => setCustomBorder(e.target.value)}
                  />
                  <button
                    type="button"
                    className="btn-apply-color"
                    onClick={() => applyBorderColor(customBorder)}
                  >
                    Apply
                  </button>
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            className="toolbar-btn"
            onClick={() => editor.chain().focus().toggleHeaderRow().run()}
            title="Toggle Table Header Row"
          >
            <CheckSquare size={13} />
            <span className="btn-label-text">Hdr</span>
          </button>
          <button
            type="button"
            className="toolbar-btn"
            onClick={() => editor.chain().focus().addRowAfter().run()}
            title="Add Row Below"
          >
            <Rows size={13} />
            <span className="btn-label-text">+Row</span>
          </button>
          <button
            type="button"
            className="toolbar-btn"
            onClick={() => editor.chain().focus().deleteRow().run()}
            title="Delete Current Row"
          >
            <span className="btn-label-text" style={{ color: '#dc2626', fontWeight: 600 }}>-Row</span>
          </button>
          <button
            type="button"
            className="toolbar-btn"
            onClick={() => editor.chain().focus().addColumnAfter().run()}
            title="Add Column Right"
          >
            <Columns size={13} />
            <span className="btn-label-text">+Col</span>
          </button>
          <button
            type="button"
            className="toolbar-btn"
            onClick={() => editor.chain().focus().deleteColumn().run()}
            title="Delete Current Column"
          >
            <span className="btn-label-text" style={{ color: '#dc2626', fontWeight: 600 }}>-Col</span>
          </button>
          <button
            type="button"
            className="toolbar-btn icon-only"
            onClick={() => editor.chain().focus().mergeCells().run()}
            disabled={!editor.can().mergeCells()}
            title="Merge Selected Cells (Select 2+ cells)"
          >
            <Combine size={13} />
          </button>
          <button
            type="button"
            className="toolbar-btn icon-only"
            onClick={() => editor.chain().focus().splitCell().run()}
            disabled={!editor.can().splitCell()}
            title="Split Merged Cell"
          >
            <Split size={13} />
          </button>
          <button
            type="button"
            className="toolbar-btn icon-only"
            onClick={() => editor.chain().focus().deleteTable().run()}
            title="Delete Table"
          >
            <Trash2 size={13} style={{ color: '#dc2626' }} />
          </button>
        </div>
      )}
    </div>
  );
};

export default TableControls;
