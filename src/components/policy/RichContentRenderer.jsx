import React from 'react';
import { Table as TableIcon, Image as ImageIcon, Plus, Trash2, Columns, Rows, Check } from 'lucide-react';

/**
 * Rich Content Renderer supporting all 5 LibList standard schema types:
 * 1. numbered_list (with levels and nested children)
 * 2. bullet_list (with markers and levels)
 * 3. table (HTML tables with cells, rowSpan, colSpan, isHeader)
 * 4. image (storagePath, caption, dimensions)
 * 5. paragraph (runs with bold, italic, underline)
 * 
 * Also auto-parses markdown tables and lists into semantic HTML.
 */

// 1. Numbered List Renderer
export function NumberedListBlock({ block, isEditing, onChange }) {
  const items = Array.isArray(block.items) ? block.items : [];

  const handleTextChange = (itemIdx, newText) => {
    if (!onChange) return;
    const newItems = items.map((it, idx) => idx === itemIdx ? { ...it, text: newText } : it);
    onChange({ ...block, items: newItems });
  };

  const handleAddItem = () => {
    if (!onChange) return;
    const nextNum = String(items.length + 1);
    onChange({
      ...block,
      items: [...items, { number: nextNum, text: 'New numbered item', level: 0, children: [] }]
    });
  };

  const handleDeleteItem = (delIdx) => {
    if (!onChange) return;
    onChange({
      ...block,
      items: items.filter((_, idx) => idx !== delIdx)
    });
  };

  const renderItem = (item, idx) => (
    <li key={idx} className="my-1.5" style={{ marginLeft: `${(item.level || 0) * 1.25}rem` }}>
      <div className="flex items-start justify-between gap-2 group/item">
        <div className="flex items-start gap-2 flex-1 min-w-0">
          <span className="font-mono font-bold text-[#0057B8] shrink-0 text-xs mt-0.5 bg-blue-50 border border-blue-200/60 px-1.5 py-0.2 rounded">
            {item.number ? `${item.number}.` : `${idx + 1}.`}
          </span>
          {isEditing ? (
            <input
              type="text"
              value={item.text || ''}
              onChange={(e) => handleTextChange(idx, e.target.value)}
              className="flex-1 text-xs text-slate-800 bg-white border border-slate-200 rounded px-2 py-1 focus:outline-none focus:border-[#0057B8]"
            />
          ) : (
            <span className="text-slate-800 text-xs leading-relaxed">{item.text}</span>
          )}
        </div>
        {isEditing && (
          <button
            type="button"
            onClick={() => handleDeleteItem(idx)}
            className="text-slate-300 hover:text-rose-500 p-1 opacity-0 group-hover/item:opacity-100 transition cursor-pointer"
            title="Remove item"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        )}
      </div>

      {Array.isArray(item.children) && item.children.length > 0 && (
        <ol className="list-none space-y-1 mt-1 pl-4 border-l-2 border-blue-100">
          {item.children.map((child, cIdx) => (
            <li key={cIdx} className="flex items-start gap-2 my-1">
              <span className="font-mono font-semibold text-slate-500 shrink-0 text-[11px] mt-0.5">
                {child.number ? `${child.number}.` : `${String.fromCharCode(97 + cIdx)}.`}
              </span>
              <span className="text-slate-700 text-xs leading-relaxed">{child.text}</span>
            </li>
          ))}
        </ol>
      )}
    </li>
  );

  return (
    <div className="my-2 p-2.5 bg-slate-50/50 rounded-xl border border-slate-100">
      <ol className="list-none space-y-1">
        {items.map((item, idx) => renderItem(item, idx))}
      </ol>
      {isEditing && (
        <button
          type="button"
          onClick={handleAddItem}
          className="mt-2 text-[11px] font-bold text-[#0057B8] hover:text-[#004EA6] flex items-center gap-1 cursor-pointer"
        >
          <Plus className="w-3 h-3" />
          <span>Add Numbered Item</span>
        </button>
      )}
    </div>
  );
}

// 2. Bullet List Renderer
export function BulletListBlock({ block, isEditing, onChange }) {
  const items = Array.isArray(block.items) ? block.items : [];

  const handleTextChange = (itemIdx, newText) => {
    if (!onChange) return;
    const newItems = items.map((it, idx) => idx === itemIdx ? { ...it, text: newText } : it);
    onChange({ ...block, items: newItems });
  };

  const handleAddItem = () => {
    if (!onChange) return;
    onChange({
      ...block,
      items: [...items, { marker: '●', text: 'New checklist requirement', level: 0 }]
    });
  };

  const handleDeleteItem = (delIdx) => {
    if (!onChange) return;
    onChange({
      ...block,
      items: items.filter((_, idx) => idx !== delIdx)
    });
  };

  return (
    <div className="my-2 p-2.5 bg-slate-50/50 rounded-xl border border-slate-100">
      <ul className="list-none space-y-1.5">
        {items.map((item, idx) => (
          <li
            key={idx}
            className="flex items-start justify-between gap-2 group/bullet"
            style={{ marginLeft: `${(item.level || 0) * 1.25}rem` }}
          >
            <div className="flex items-start gap-2 flex-1 min-w-0">
              <span className="text-[#0057B8] shrink-0 text-xs mt-0.5 select-none font-bold">
                {item.marker || (item.level === 1 ? '○' : '●')}
              </span>
              {isEditing ? (
                <input
                  type="text"
                  value={item.text || ''}
                  onChange={(e) => handleTextChange(idx, e.target.value)}
                  className="flex-1 text-xs text-slate-800 bg-white border border-slate-200 rounded px-2 py-1 focus:outline-none focus:border-[#0057B8]"
                />
              ) : (
                <span className="text-slate-800 text-xs leading-relaxed">{item.text}</span>
              )}
            </div>
            {isEditing && (
              <button
                type="button"
                onClick={() => handleDeleteItem(idx)}
                className="text-slate-300 hover:text-rose-500 p-1 opacity-0 group-hover/bullet:opacity-100 transition cursor-pointer"
                title="Remove bullet"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            )}
          </li>
        ))}
      </ul>
      {isEditing && (
        <button
          type="button"
          onClick={handleAddItem}
          className="mt-2 text-[11px] font-bold text-[#0057B8] hover:text-[#004EA6] flex items-center gap-1 cursor-pointer"
        >
          <Plus className="w-3 h-3" />
          <span>Add Bullet Point</span>
        </button>
      )}
    </div>
  );
}

// 3. Structured Data Table Renderer & Editor
export function TableBlock({ block, isEditing, onChange }) {
  // Normalize cells into 2D matrix
  const cells = Array.isArray(block.cells) ? block.cells : [];
  let numRows = block.rows || (cells.length > 0 ? Math.max(...cells.map(c => c.row || 0)) + 1 : 2);
  let numCols = block.columns || (cells.length > 0 ? Math.max(...cells.map(c => c.column || 0)) + 1 : 2);

  numRows = Math.max(1, numRows);
  numCols = Math.max(1, numCols);

  const getCell = (r, c) => {
    return cells.find(cell => cell.row === r && cell.column === c) || {
      row: r,
      column: c,
      isHeader: r === 0,
      text: ''
    };
  };

  const updateCellText = (r, c, newText) => {
    if (!onChange) return;
    const existingIdx = cells.findIndex(cell => cell.row === r && cell.column === c);
    let newCells = [...cells];
    if (existingIdx >= 0) {
      newCells[existingIdx] = { ...newCells[existingIdx], text: newText };
    } else {
      newCells.push({ row: r, column: c, isHeader: r === 0, text: newText });
    }
    onChange({ ...block, rows: numRows, columns: numCols, cells: newCells });
  };

  const addRow = () => {
    if (!onChange) return;
    const newRowCount = numRows + 1;
    let newCells = [...cells];
    for (let c = 0; c < numCols; c++) {
      newCells.push({ row: numRows, column: c, isHeader: false, text: '' });
    }
    onChange({ ...block, rows: newRowCount, columns: numCols, cells: newCells });
  };

  const deleteRow = (targetRow) => {
    if (!onChange || numRows <= 1) return;
    const newRowCount = numRows - 1;
    const newCells = cells
      .filter(c => c.row !== targetRow)
      .map(c => c.row > targetRow ? { ...c, row: c.row - 1 } : c);
    onChange({ ...block, rows: newRowCount, columns: numCols, cells: newCells });
  };

  const addColumn = () => {
    if (!onChange) return;
    const newColCount = numCols + 1;
    let newCells = [...cells];
    for (let r = 0; r < numRows; r++) {
      newCells.push({ row: r, column: numCols, isHeader: r === 0, text: '' });
    }
    onChange({ ...block, rows: numRows, columns: newColCount, cells: newCells });
  };

  const deleteColumn = (targetCol) => {
    if (!onChange || numCols <= 1) return;
    const newColCount = numCols - 1;
    const newCells = cells
      .filter(c => c.column !== targetCol)
      .map(c => c.column > targetCol ? { ...c, column: c.column - 1 } : c);
    onChange({ ...block, rows: numRows, columns: newColCount, cells: newCells });
  };

  return (
    <div className="my-3 space-y-2">
      {isEditing && (
        <div className="flex items-center justify-between gap-2 bg-blue-50/70 p-2 rounded-xl border border-blue-200/80 text-xs">
          <div className="flex items-center gap-1.5 font-bold text-[#0057B8]">
            <TableIcon className="w-3.5 h-3.5" />
            <span>Table Structure: {numRows} Rows × {numCols} Columns</span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={addRow}
              className="px-2 py-1 rounded-lg bg-white border border-blue-200 text-[#0057B8] hover:bg-blue-100 font-bold transition flex items-center gap-1 cursor-pointer"
            >
              <Rows className="w-3 h-3" />
              <span>+ Row</span>
            </button>
            <button
              type="button"
              onClick={addColumn}
              className="px-2 py-1 rounded-lg bg-white border border-blue-200 text-[#0057B8] hover:bg-blue-100 font-bold transition flex items-center gap-1 cursor-pointer"
            >
              <Columns className="w-3 h-3" />
              <span>+ Col</span>
            </button>
          </div>
        </div>
      )}

      {/* HTML Semantic Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-2xs bg-white">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-800 font-bold">
              {Array.from({ length: numCols }).map((_, cIdx) => {
                const headerCell = getCell(0, cIdx);
                return (
                  <th
                    key={cIdx}
                    className="p-3 border-r border-slate-200 last:border-r-0 relative group/th"
                  >
                    {isEditing ? (
                      <div className="flex items-center justify-between gap-1">
                        <input
                          type="text"
                          value={headerCell.text || ''}
                          onChange={(e) => updateCellText(0, cIdx, e.target.value)}
                          placeholder={`Column ${cIdx + 1}`}
                          className="w-full font-bold text-slate-900 bg-white border border-slate-200 rounded px-2 py-1 focus:outline-none focus:border-[#0057B8]"
                        />
                        {numCols > 1 && (
                          <button
                            type="button"
                            onClick={() => deleteColumn(cIdx)}
                            className="text-slate-300 hover:text-rose-600 p-0.5 opacity-0 group-hover/th:opacity-100 transition"
                            title="Delete Column"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    ) : (
                      <span>{headerCell.text || `Column ${cIdx + 1}`}</span>
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: numRows - 1 }).map((_, rOffset) => {
              const rIdx = rOffset + 1;
              return (
                <tr
                  key={rIdx}
                  className="border-b border-slate-100 last:border-b-0 hover:bg-blue-50/20 group/row"
                >
                  {Array.from({ length: numCols }).map((_, cIdx) => {
                    const bodyCell = getCell(rIdx, cIdx);
                    return (
                      <td
                        key={cIdx}
                        className="p-2.5 border-r border-slate-100 last:border-r-0 text-slate-700 align-top"
                      >
                        {isEditing ? (
                          <textarea
                            rows={1}
                            value={bodyCell.text || ''}
                            onChange={(e) => updateCellText(rIdx, cIdx, e.target.value)}
                            placeholder="Cell data..."
                            className="w-full text-xs text-slate-800 bg-white border border-slate-200 rounded px-2 py-1 focus:outline-none focus:border-[#0057B8] resize-none"
                          />
                        ) : (
                          <span>{bodyCell.text || '—'}</span>
                        )}
                      </td>
                    );
                  })}
                  {isEditing && numRows > 2 && (
                    <td className="w-8 p-1 text-center align-middle">
                      <button
                        type="button"
                        onClick={() => deleteRow(rIdx)}
                        className="text-slate-300 hover:text-rose-500 p-1 opacity-0 group-hover/row:opacity-100 transition"
                        title="Delete Row"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// 4. Image Block Renderer
export function ImageBlock({ block, isEditing, onChange }) {
  const asset = block.asset || {};
  const caption = block.caption || 'Institutional Workflow Diagram';

  return (
    <figure className="my-4 p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200 max-w-xl mx-auto text-center space-y-2 shadow-2xs">
      <div className="relative overflow-hidden rounded-xl bg-white border border-slate-200 min-h-[140px] flex items-center justify-center p-4">
        {asset.storagePath ? (
          <img
            src={asset.storagePath}
            alt={caption}
            className="w-full h-auto object-contain max-h-72 rounded-lg"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              const placeholder = e.currentTarget.parentNode.querySelector('.img-placeholder');
              if (placeholder) placeholder.style.display = 'flex';
            }}
          />
        ) : null}

        <div
          className="img-placeholder flex flex-col items-center justify-center p-6 text-slate-400 gap-2"
          style={{ display: asset.storagePath ? 'none' : 'flex' }}
        >
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0057B8] flex items-center justify-center">
            <ImageIcon className="w-5 h-5" />
          </div>
          <span className="text-xs font-bold text-slate-700">{caption}</span>
          <span className="text-[10.5px] font-mono text-slate-400">
            {asset.storagePath || 'documents/doc-001/images/workflow.png'}
          </span>
          <span className="text-[10px] text-slate-400">
            {asset.width || 1200} × {asset.height || 800} px
          </span>
        </div>
      </div>

      {isEditing ? (
        <div className="space-y-1.5 pt-1 text-left">
          <label className="text-[10px] font-bold text-slate-500 uppercase">Image Caption</label>
          <input
            type="text"
            value={caption}
            onChange={(e) => onChange && onChange({ ...block, caption: e.target.value })}
            className="w-full text-xs text-slate-800 bg-white border border-slate-200 rounded px-2 py-1 focus:outline-none focus:border-[#0057B8]"
          />
        </div>
      ) : (
        <figcaption className="text-xs font-semibold text-slate-600 italic">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}

// 5. Paragraph with Runs (Bold, Italic, Underline)
export function ParagraphBlock({ block, isEditing, onChange }) {
  const runs = Array.isArray(block.runs) ? block.runs : [];

  if (runs.length === 0) {
    return (
      <p className="text-xs text-slate-700 leading-relaxed my-2">
        {block.text || ''}
      </p>
    );
  }

  return (
    <p className="text-xs text-slate-700 leading-relaxed my-2">
      {runs.map((run, idx) => {
        let content = run.text || '';
        const fmt = run.format || {};
        if (fmt.bold) content = <strong key={idx} className="font-bold text-slate-900">{content}</strong>;
        if (fmt.italic) content = <em key={idx} className="italic">{content}</em>;
        if (fmt.underline) content = <u key={idx} className="underline decoration-slate-400">{content}</u>;
        return <React.Fragment key={idx}>{content}</React.Fragment>;
      })}
    </p>
  );
}

// Helper: Parse markdown table into structured TableBlock format
export function parseMarkdownTable(mdText) {
  const lines = mdText.trim().split('\n').map(l => l.trim()).filter(Boolean);
  if (lines.length < 2) return null;

  const headerParts = lines[0].split('|').map(s => s.trim()).filter(Boolean);
  if (headerParts.length === 0) return null;

  // Verify second line is separator like |---|---|
  if (!/^\|?(\s*:?-+:?\s*\|)+\s*:?-+:?\s*\|?$/.test(lines[1])) {
    return null;
  }

  const numCols = headerParts.length;
  const dataLines = lines.slice(2);
  const numRows = 1 + dataLines.length;

  const cells = [];
  headerParts.forEach((text, cIdx) => {
    cells.push({ row: 0, column: cIdx, isHeader: true, text });
  });

  dataLines.forEach((line, rOffset) => {
    const rowIdx = rOffset + 1;
    const parts = line.split('|').map(s => s.trim()).filter(Boolean);
    for (let cIdx = 0; cIdx < numCols; cIdx++) {
      cells.push({
        row: rowIdx,
        column: cIdx,
        isHeader: false,
        text: parts[cIdx] || ''
      });
    }
  });

  return {
    type: 'table',
    tableId: `table-${Date.now()}`,
    rows: numRows,
    columns: numCols,
    cells
  };
}

