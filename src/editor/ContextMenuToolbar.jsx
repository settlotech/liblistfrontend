import React, { useState, useEffect, useRef, useCallback } from 'react';
import ReactDOM from 'react-dom';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Code,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  Link2,
  RemoveFormatting,
  Copy,
  Scissors,
  Clipboard,
  Table as TableIcon,
  Plus,
  Trash2,
  Highlighter,
  PaintBucket,
  Square,
  Image as ImageIcon,
  Maximize2,
  ScanLine,
  ChevronRight,
} from 'lucide-react';

// ── NestedMenuItem: renders its submenu as a fixed-position portal so it
//    is NEVER clipped by any ancestor's overflow or by the viewport edge.
//
//    Fix 1 (submenu closes mid-travel): uses a closeTimer ref — leaving the
//    trigger starts a 120 ms timeout; entering the portal cancels it.
//    Fix 2 (Delete Image / actions not working): `onMouseDown={preventDefault}`
//    on the portal keeps the editor focused so commands fire on the live selection.
const NestedMenuItem = ({ label, icon, children, isOpen, onOpen, onClose: onCloseMenu }) => {
  const triggerRef = useRef(null);
  const submenuRef = useRef(null);
  const closeTimerRef = useRef(null);
  const [submenuStyle, setSubmenuStyle] = useState({});

  // Cancel any pending close
  const cancelClose = useCallback(() => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  // Schedule a close (gives mouse time to travel to the portal)
  const scheduleClose = useCallback(() => {
    cancelClose();
    closeTimerRef.current = setTimeout(() => {
      onCloseMenu();
    }, 120);
  }, [cancelClose, onCloseMenu]);

  // Clean up timer on unmount
  useEffect(() => () => cancelClose(), [cancelClose]);

  const computePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const submenuWidth = 215;
    // Measure actual height after render; fall back to generous estimate
    const submenuHeight = submenuRef.current
      ? submenuRef.current.getBoundingClientRect().height
      : 350;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const GAP = 6;

    // Prefer right; flip left if not enough room
    let left = rect.right + GAP;
    if (left + submenuWidth > vw - 8) {
      left = rect.left - submenuWidth - GAP;
    }
    left = Math.max(8, left);

    // Align top with trigger; push up if it would overflow bottom
    let top = rect.top - 4;
    if (top + submenuHeight > vh - 8) {
      top = vh - submenuHeight - 8;
    }
    top = Math.max(8, top);

    setSubmenuStyle({ position: 'fixed', top, left, zIndex: 9999, minWidth: submenuWidth });
  }, []);

  useEffect(() => {
    if (isOpen) {
      // Measure after first paint so submenuRef.current has a real height
      requestAnimationFrame(() => {
        computePosition();
        // Second pass: re-measure once fully rendered
        requestAnimationFrame(() => computePosition());
      });
    }
  }, [isOpen, computePosition]);

  const handleTriggerEnter = () => {
    cancelClose();
    onOpen();
    requestAnimationFrame(() => computePosition());
  };

  const handlePortalEnter = () => {
    cancelClose(); // mouse reached the submenu — do NOT close
  };

  return (
    <div
      ref={triggerRef}
      className="context-menu-item-nested"
      onMouseEnter={handleTriggerEnter}
      onMouseLeave={scheduleClose}
    >
      <button
        type="button"
        className={`context-menu-item ${isOpen ? 'active' : ''}`}
        onClick={(e) => {
          e.stopPropagation();
          if (!isOpen) { onOpen(); requestAnimationFrame(() => computePosition()); }
          else onCloseMenu();
        }}
      >
        {icon}
        <span>{label}</span>
        <ChevronRight size={13} className="context-menu-arrow" />
      </button>

      {isOpen && ReactDOM.createPortal(
        <div
          ref={submenuRef}
          className="context-menu-submenu context-menu-submenu-portal"
          style={submenuStyle}
          // Prevent mousedown from blurring the editor
          onMouseDown={(e) => e.preventDefault()}
          // Stop click from bubbling to document — prevents the outside-click
          // listener in ContextMenuToolbar from closing the menu before onClick fires
          onClick={(e) => e.stopPropagation()}
          onMouseEnter={handlePortalEnter}
          onMouseLeave={scheduleClose}
        >
          {children}
        </div>,
        document.body
      )}
    </div>
  );
};

export const ContextMenuToolbar = ({
  editor,
  position,
  imageNodePos,   // ← ProseMirror node position captured synchronously at right-click time
  imageSrc,       // ← Image src attribute captured at right-click time
  onClose,
}) => {
  const menuRef = useRef(null);
  const [openSubmenu, setOpenSubmenu] = useState(null); // 'table' | 'image' | null

  // ── applyImageAction: directly mutates the ProseMirror document transaction.
  //    This completely bypasses selection loss/blur across portals and guarantees
  //    that resize and delete operations 100% succeed on the target image.
  const applyImageAction = useCallback((action, value) => {
    try {
      if (!editor || !editor.state) {
        onClose();
        return;
      }
      const { tr } = editor.state;
      let targetPos = imageNodePos;
      let targetNode = (targetPos !== null && targetPos !== undefined) ? tr.doc.nodeAt(targetPos) : null;

      // If nodeAt(targetPos) is not the image, search the doc for matching image
      if (!targetNode || targetNode.type.name !== 'image') {
        tr.doc.descendants((node, pos) => {
          if (node.type.name === 'image') {
            if (imageSrc && node.attrs.src === imageSrc) {
              targetPos = pos;
              targetNode = node;
              return false; // Found exact matching image!
            } else if (targetNode === null) {
              targetPos = pos;
              targetNode = node;
            }
          }
        });
      }

      if (!targetNode || targetPos === null) {
        // Fallback to TipTap command
        if (action === 'delete') {
          editor.chain().focus().deleteSelection().run();
        } else if (action === 'width') {
          editor.chain().focus().updateAttributes('image', { width: value }).run();
        } else if (action === 'alignment') {
          editor.chain().focus().updateAttributes('image', { alignment: value }).run();
        }
        onClose();
        return;
      }

      if (action === 'delete') {
        tr.delete(targetPos, targetPos + targetNode.nodeSize);
      } else if (action === 'width') {
        tr.setNodeMarkup(targetPos, undefined, {
          ...targetNode.attrs,
          width: value,
        });
      } else if (action === 'alignment') {
        tr.setNodeMarkup(targetPos, undefined, {
          ...targetNode.attrs,
          alignment: value,
        });
      }

      editor.view.dispatch(tr);
      editor.view.focus();
    } catch (err) {
      console.error('[ContextMenuToolbar] Error applying image action:', err);
    }
    onClose();
  }, [editor, imageNodePos, imageSrc, onClose]);

  // Close on outside click (mousedown), BUT exclude the portal submenu
  // which lives in document.body outside menuRef.
  // KEY FIX: use 'click' (not 'mousedown') for outside-click detection so the
  // submenu button's onClick fires BEFORE this closes the menu.
  useEffect(() => {
    const handleOutsideClick = (e) => {
      // Ignore clicks inside the main menu
      if (menuRef.current && menuRef.current.contains(e.target)) return;
      // Ignore clicks inside any portal submenu (they have this class)
      if (e.target.closest && e.target.closest('.context-menu-submenu-portal')) return;
      onClose();
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    // Use 'click' (fires after mouseup) NOT 'mousedown', so submenu button
    // onClick fires first before the menu is closed.
    document.addEventListener('click', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('click', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  if (!editor || !position) return null;

  // Collision detection: keep the main menu within viewport
  const menuWidth = 250;
  const menuHeight = 250;
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  const adjustedX = Math.max(10, Math.min(position.x, viewportWidth - menuWidth - 15));
  const adjustedY = Math.max(10, Math.min(position.y, viewportHeight - menuHeight - 20));
  // isNearRight / isNearBottom are only used for the main menu placement now;
  // submenus use the NestedMenuItem portal which self-corrects.

  // Active mark states
  const isBold = editor.isActive('bold');
  const isItalic = editor.isActive('italic');
  const isUnderline = editor.isActive('underline');
  const isStrike = editor.isActive('strike');
  const isCode = editor.isActive('code');
  const isTable = editor.isActive('table');
  const isHighlight = editor.isActive('highlight');
  // Use imageNodePos (captured synchronously at right-click) as the
  // source of truth for whether an image was right-clicked.  This is
  // more reliable than editor.isActive('image') which depends on the
  // current selection that may have changed since the menu opened.
  const isImage = imageNodePos !== null && imageNodePos !== undefined;

  // Clipboard actions
  const handleCopy = async () => {
    const { from, to } = editor.state.selection;
    const selectedText = editor.state.doc.textBetween(from, to, '\n');
    if (selectedText) {
      await navigator.clipboard.writeText(selectedText);
    }
    onClose();
  };

  const handleCut = async () => {
    const { from, to } = editor.state.selection;
    const selectedText = editor.state.doc.textBetween(from, to, '\n');
    if (selectedText) {
      await navigator.clipboard.writeText(selectedText);
      editor.chain().focus().deleteSelection().run();
    }
    onClose();
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        editor.chain().focus().insertContent(text).run();
      }
    } catch {
      // Browser permission prompt or fallback
      const pasted = window.prompt('Paste text here:');
      if (pasted) {
        editor.chain().focus().insertContent(pasted).run();
      }
    }
    onClose();
  };

  const handleLink = () => {
    const currentHref = editor.getAttributes('link').href || '';
    const url = window.prompt('Enter link URL:', currentHref);
    if (url !== null) {
      if (url === '') {
        editor.chain().focus().unsetLink().run();
      } else {
        const href = /^https?:\/\//i.test(url) ? url : `https://${url}`;
        editor.chain().focus().setLink({ href, target: '_blank' }).run();
      }
    }
    onClose();
  };

  return (
    <div
      ref={menuRef}
      className="context-menu-floating-toolbar"
      style={{
        left: `${adjustedX}px`,
        top: `${adjustedY}px`,
      }}
      // Prevent mousedown from blurring the editor — keeps selection intact
      // so every command (bold, delete, image resize, etc.) fires correctly.
      onMouseDown={(e) => e.preventDefault()}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Mini Quick-Formatting Ribbon */}
      <div className="context-mini-ribbon">
        <button
          type="button"
          className={`context-tool-btn ${isBold ? 'active' : ''}`}
          onClick={() => {
            editor.chain().focus().toggleBold().run();
            onClose();
          }}
          title="Bold (Ctrl+B)"
        >
          <Bold size={14} />
        </button>

        <button
          type="button"
          className={`context-tool-btn ${isItalic ? 'active' : ''}`}
          onClick={() => {
            editor.chain().focus().toggleItalic().run();
            onClose();
          }}
          title="Italic (Ctrl+I)"
        >
          <Italic size={14} />
        </button>

        <button
          type="button"
          className={`context-tool-btn ${isUnderline ? 'active' : ''}`}
          onClick={() => {
            editor.chain().focus().toggleUnderline().run();
            onClose();
          }}
          title="Underline (Ctrl+U)"
        >
          <UnderlineIcon size={14} />
        </button>

        <button
          type="button"
          className={`context-tool-btn ${isStrike ? 'active' : ''}`}
          onClick={() => {
            editor.chain().focus().toggleStrike().run();
            onClose();
          }}
          title="Strikethrough"
        >
          <Strikethrough size={14} />
        </button>

        <button
          type="button"
          className={`context-tool-btn ${isHighlight ? 'active' : ''}`}
          onClick={() => {
            if (isHighlight) {
              editor.chain().focus().unsetHighlight().run();
            } else {
              editor.chain().focus().setHighlight({ color: '#fef08a' }).run();
            }
            onClose();
          }}
          title="Highlight"
        >
          <Highlighter size={14} />
        </button>

        <button
          type="button"
          className={`context-tool-btn ${isCode ? 'active' : ''}`}
          onClick={() => {
            editor.chain().focus().toggleCode().run();
            onClose();
          }}
          title="Inline Code"
        >
          <Code size={14} />
        </button>

        <button
          type="button"
          className="context-tool-btn"
          onClick={() => {
            editor.chain().focus().unsetAllMarks().clearNodes().run();
            onClose();
          }}
          title="Clear Formatting"
        >
          <RemoveFormatting size={14} />
        </button>
      </div>

      {/* Alignment & List Row */}
      <div className="context-mini-ribbon second-row">
        <button
          type="button"
          className={`context-tool-btn ${editor.isActive({ textAlign: 'left' }) ? 'active' : ''}`}
          onClick={() => {
            editor.chain().focus().setTextAlign('left').run();
            onClose();
          }}
          title="Align Left"
        >
          <AlignLeft size={14} />
        </button>

        <button
          type="button"
          className={`context-tool-btn ${editor.isActive({ textAlign: 'center' }) ? 'active' : ''}`}
          onClick={() => {
            editor.chain().focus().setTextAlign('center').run();
            onClose();
          }}
          title="Align Center"
        >
          <AlignCenter size={14} />
        </button>

        <button
          type="button"
          className={`context-tool-btn ${editor.isActive({ textAlign: 'right' }) ? 'active' : ''}`}
          onClick={() => {
            editor.chain().focus().setTextAlign('right').run();
            onClose();
          }}
          title="Align Right"
        >
          <AlignRight size={14} />
        </button>

        <button
          type="button"
          className={`context-tool-btn ${editor.isActive('bulletList') ? 'active' : ''}`}
          onClick={() => {
            editor.chain().focus().toggleBulletList().run();
            onClose();
          }}
          title="Bulleted List"
        >
          <List size={14} />
        </button>

        <button
          type="button"
          className={`context-tool-btn ${editor.isActive('orderedList') ? 'active' : ''}`}
          onClick={() => {
            editor.chain().focus().toggleOrderedList().run();
            onClose();
          }}
          title="Numbered List"
        >
          <ListOrdered size={14} />
        </button>
      </div>

      <div className="context-menu-divider" />

      {/* Context Action Items */}
      <div className="context-menu-list">
        <button type="button" className="context-menu-item" onClick={handleCut}>
          <Scissors size={14} />
          <span>Cut</span>
          <span className="context-shortcut">Ctrl+X</span>
        </button>

        <button type="button" className="context-menu-item" onClick={handleCopy}>
          <Copy size={14} />
          <span>Copy</span>
          <span className="context-shortcut">Ctrl+C</span>
        </button>

        <button type="button" className="context-menu-item" onClick={handlePaste}>
          <Clipboard size={14} />
          <span>Paste</span>
          <span className="context-shortcut">Ctrl+V</span>
        </button>

        <button type="button" className="context-menu-item" onClick={handleLink}>
          <Link2 size={14} />
          <span>{editor.isActive('link') ? 'Edit Link' : 'Add Link'}</span>
          <span className="context-shortcut">Ctrl+K</span>
        </button>
      </div>

      {/* Table Context Options as Nested Submenu if inside a Table */}
      {isTable && (
        <>
          <div className="context-menu-divider" />
          <NestedMenuItem
            label="Table Tools"
            icon={<TableIcon size={14} />}
            isOpen={openSubmenu === 'table'}
            onOpen={() => setOpenSubmenu('table')}
            onClose={() => setOpenSubmenu(null)}
          >
            <div className="context-table-title">Table Tools</div>
            <button
              type="button"
              className="context-menu-item"
              onClick={() => {
                const color = window.prompt('Enter Cell Shading Color (e.g. #f1f5f9, #dbeafe, lightyellow, or blank to clear):', '#f1f5f9');
                if (color !== null) {
                  editor.chain().focus().setCellAttribute('backgroundColor', color.trim() || null).run();
                }
                onClose();
              }}
            >
              <PaintBucket size={13} />
              <span>Cell Shading (Fill Color)</span>
            </button>
            <button
              type="button"
              className="context-menu-item"
              onClick={() => {
                const color = window.prompt('Enter Table Border Color (e.g. #000000, #2563eb, #dc2626):', '#000000');
                if (color !== null) {
                  editor.chain().focus().setCellAttribute('borderColor', color.trim() || '#000000').run();
                }
                onClose();
              }}
            >
              <Square size={13} />
              <span>Change Border Color</span>
            </button>
            <div className="context-menu-divider" />
            <button
              type="button"
              className="context-menu-item"
              onClick={() => { editor.chain().focus().addRowAfter().run(); onClose(); }}
            >
              <Plus size={13} />
              <span>Insert Row Below</span>
            </button>
            <button
              type="button"
              className="context-menu-item"
              onClick={() => { editor.chain().focus().addColumnAfter().run(); onClose(); }}
            >
              <Plus size={13} />
              <span>Insert Column Right</span>
            </button>
            <div className="context-menu-divider" />
            <button
              type="button"
              className="context-menu-item danger"
              onClick={() => { editor.chain().focus().deleteRow().run(); onClose(); }}
            >
              <Trash2 size={13} />
              <span>Delete Row</span>
            </button>
            <button
              type="button"
              className="context-menu-item danger"
              onClick={() => { editor.chain().focus().deleteColumn().run(); onClose(); }}
            >
              <Trash2 size={13} />
              <span>Delete Column</span>
            </button>
          </NestedMenuItem>
        </>
      )}

      {/* Image Context Options as Nested Submenu if right-clicked on an Image */}
      {isImage && (
        <>
          <div className="context-menu-divider" />
          <NestedMenuItem
            label="Image Tools"
            icon={<ImageIcon size={14} />}
            isOpen={openSubmenu === 'image'}
            onOpen={() => setOpenSubmenu('image')}
            onClose={() => setOpenSubmenu(null)}
          >
            <div className="context-table-title">Image Size</div>
            <button
              type="button"
              className="context-menu-item"
              onClick={() => applyImageAction('width', '25%')}
            >
              <ScanLine size={13} />
              <span>25% Width</span>
            </button>
            <button
              type="button"
              className="context-menu-item"
              onClick={() => applyImageAction('width', '50%')}
            >
              <ScanLine size={13} />
              <span>50% Width</span>
            </button>
            <button
              type="button"
              className="context-menu-item"
              onClick={() => applyImageAction('width', '75%')}
            >
              <ScanLine size={13} />
              <span>75% Width</span>
            </button>
            <button
              type="button"
              className="context-menu-item"
              onClick={() => applyImageAction('width', '100%')}
            >
              <Maximize2 size={13} />
              <span>Full Width (100%)</span>
            </button>
            <button
              type="button"
              className="context-menu-item"
              onClick={() => {
                const val = window.prompt('Enter width (e.g. 300px or 60%):');
                if (val && val.trim()) {
                  applyImageAction('width', val.trim());
                } else {
                  onClose();
                }
              }}
            >
              <ImageIcon size={13} />
              <span>Custom Size…</span>
            </button>

            <div className="context-menu-divider" />
            <div className="context-table-title">Alignment</div>
            <button
              type="button"
              className="context-menu-item"
              onClick={() => applyImageAction('alignment', 'left')}
            >
              <AlignLeft size={13} />
              <span>Align Left</span>
            </button>
            <button
              type="button"
              className="context-menu-item"
              onClick={() => applyImageAction('alignment', 'center')}
            >
              <AlignCenter size={13} />
              <span>Align Center</span>
            </button>
            <button
              type="button"
              className="context-menu-item"
              onClick={() => applyImageAction('alignment', 'right')}
            >
              <AlignRight size={13} />
              <span>Align Right</span>
            </button>

            <div className="context-menu-divider" />
            <button
              type="button"
              className="context-menu-item danger"
              onClick={() => applyImageAction('delete')}
            >
              <Trash2 size={13} />
              <span>Delete Image</span>
            </button>
          </NestedMenuItem>
        </>
      )}
    </div>
  );
};

export default ContextMenuToolbar;
