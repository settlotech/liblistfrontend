import React, { useState, useRef, useEffect } from 'react';
import { NodeViewWrapper } from '@tiptap/react';
import {
  RotateCcw,
  RotateCw,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Trash2,
  GripVertical,
  Move,
  ZoomIn,
  ZoomOut,
  RefreshCw,
} from 'lucide-react';

/**
 * Interactive Image NodeView for the WYSIWYG Document Editor.
 * Supports:
 * - Drag-movable positioning on canvas (drag image directly or via Move handle) & flow reordering (Grip handle)
 * - Interactive corner/side resize handles + quick size presets & +/- adjusters
 * - Rotation controls (-90, +90, drag-rotate knob, and 0 deg reset)
 * - Left / Center / Right alignment & delete
 */
export const ImageNodeView = ({
  node,
  updateAttributes,
  selected,
  deleteNode,
  editor,
  getPos,
}) => {
  const {
    src,
    alt = '',
    title = '',
    width = '75%',
    alignment = 'center',
    rotation = 0,
    offsetX = 0,
    offsetY = 0,
  } = node.attrs || {};

  const wrapperRef = useRef(null);
  const frameRef = useRef(null);

  const [isHovered, setIsHovered] = useState(false);
  const [liveWidth, setLiveWidth] = useState(null);
  const [liveOffset, setLiveOffset] = useState(null);
  const [liveRotation, setLiveRotation] = useState(null);
  const [activeInteraction, setActiveInteraction] = useState(null); // 'resize' | 'move' | 'rotate' | null

  useEffect(() => {
    setLiveWidth(null);
    setLiveOffset(null);
    setLiveRotation(null);
  }, [width, offsetX, offsetY, rotation]);

  const effectiveWidth = liveWidth !== null ? liveWidth : (width || '75%');
  const effectiveOffsetX = liveOffset ? liveOffset.x : (Number(offsetX) || 0);
  const effectiveOffsetY = liveOffset ? liveOffset.y : (Number(offsetY) || 0);
  const effectiveRotation = liveRotation !== null ? liveRotation : (Number(rotation) || 0);
  const isEditable = editor?.isEditable !== false;
  const showControls = isEditable && (selected || isHovered || activeInteraction !== null);

  const selectThisImage = () => {
    try {
      if (editor && typeof getPos === 'function') {
        const pos = getPos();
        if (typeof pos === 'number') {
          editor.commands.setNodeSelection(pos);
        }
      }
    } catch {
      // ignore selection sync error
    }
  };

  const getCanvasScale = () => {
    const pageEl = wrapperRef.current?.closest('.document-page');
    if (pageEl && pageEl.offsetWidth) {
      return pageEl.getBoundingClientRect().width / pageEl.offsetWidth || 1;
    }
    return 1;
  };

  // Interactive Corner / Edge Resize Handler
  const handleResizeStart = (direction, e) => {
    if (!isEditable) return;
    e.preventDefault();
    e.stopPropagation();
    selectThisImage();

    const frameEl = frameRef.current;
    const wrapperEl = wrapperRef.current;
    if (!frameEl) return;

    const scale = getCanvasScale();
    const startX = e.clientX;
    const startWidth = frameEl.offsetWidth || frameEl.getBoundingClientRect().width / scale;
    const maxWidth = wrapperEl ? Math.max(120, wrapperEl.offsetWidth - 12) : 720;

    setActiveInteraction('resize');

    const handleMouseMove = (moveEvent) => {
      const dx = (moveEvent.clientX - startX) / scale;
      const isLeftSide = direction === 'nw' || direction === 'sw' || direction === 'w';
      const delta = isLeftSide ? -dx : dx;
      const nextWidth = Math.round(Math.max(48, Math.min(maxWidth, startWidth + delta)));
      setLiveWidth(`${nextWidth}px`);
    };

    const handleMouseUp = (upEvent) => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      const dx = (upEvent.clientX - startX) / scale;
      const isLeftSide = direction === 'nw' || direction === 'sw' || direction === 'w';
      const delta = isLeftSide ? -dx : dx;
      const finalWidth = Math.round(Math.max(48, Math.min(maxWidth, startWidth + delta)));
      setActiveInteraction(null);
      setLiveWidth(null);
      updateAttributes({ width: `${finalWidth}px` });
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  // Interactive Drag-to-Move Asset Handler (Free Positioning X / Y)
  const handleDragMoveStart = (e) => {
    if (!isEditable) return;
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    selectThisImage();

    const scale = getCanvasScale();
    const startX = e.clientX;
    const startY = e.clientY;
    const baseX = Number(offsetX) || 0;
    const baseY = Number(offsetY) || 0;
    let moved = false;

    const handleMouseMove = (moveEvent) => {
      const dx = (moveEvent.clientX - startX) / scale;
      const dy = (moveEvent.clientY - startY) / scale;
      if (!moved && Math.abs(dx) + Math.abs(dy) < 3) return;
      moved = true;
      setActiveInteraction('move');
      setLiveOffset({
        x: Math.round(Math.max(-360, Math.min(360, baseX + dx))),
        y: Math.round(Math.max(-360, Math.min(360, baseY + dy))),
      });
    };

    const handleMouseUp = (upEvent) => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      setActiveInteraction(null);
      if (moved) {
        const dx = (upEvent.clientX - startX) / scale;
        const dy = (upEvent.clientY - startY) / scale;
        const finalX = Math.round(Math.max(-360, Math.min(360, baseX + dx)));
        const finalY = Math.round(Math.max(-360, Math.min(360, baseY + dy)));
        setLiveOffset(null);
        updateAttributes({ offsetX: finalX, offsetY: finalY });
      } else {
        setLiveOffset(null);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  // Interactive Circular Knob Rotate Handler
  const handleRotateDragStart = (e) => {
    if (!isEditable) return;
    e.preventDefault();
    e.stopPropagation();
    selectThisImage();

    const frameEl = frameRef.current;
    if (!frameEl) return;
    const rect = frameEl.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    setActiveInteraction('rotate');

    const calcAngle = (clientX, clientY) => {
      const rad = Math.atan2(clientY - centerY, clientX - centerX);
      let deg = Math.round((rad * 180) / Math.PI + 90);
      deg = ((deg % 360) + 360) % 360;
      return deg;
    };

    const handleMouseMove = (moveEvent) => {
      setLiveRotation(calcAngle(moveEvent.clientX, moveEvent.clientY));
    };

    const handleMouseUp = (upEvent) => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      const finalDeg = calcAngle(upEvent.clientX, upEvent.clientY);
      setActiveInteraction(null);
      setLiveRotation(null);
      updateAttributes({ rotation: finalDeg });
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const stepSize = (deltaPx) => {
    const frameEl = frameRef.current;
    const wrapperEl = wrapperRef.current;
    const curW = frameEl ? frameEl.getBoundingClientRect().width : 300;
    const maxW = wrapperEl ? Math.max(120, wrapperEl.getBoundingClientRect().width - 12) : 720;
    const nextW = Math.round(Math.max(48, Math.min(maxW, curW + deltaPx)));
    updateAttributes({ width: `${nextW}px` });
  };

  const rotateBy = (deltaDeg) => {
    const next = (((Number(rotation) || 0) + deltaDeg) % 360 + 360) % 360;
    updateAttributes({ rotation: next });
  };

  const justifyMap = {
    left: 'flex-start',
    center: 'center',
    right: 'flex-end',
  };

  const transformParts = [];
  if (effectiveOffsetX || effectiveOffsetY) {
    transformParts.push(`translate(${effectiveOffsetX}px, ${effectiveOffsetY}px)`);
  }
  if (effectiveRotation) {
    transformParts.push(`rotate(${effectiveRotation}deg)`);
  }

  return (
    <NodeViewWrapper
      ref={wrapperRef}
      className="image-node-wrapper"
      style={{
        display: 'flex',
        justifyContent: justifyMap[alignment] || 'center',
        margin: '16px 0',
        position: 'relative',
        width: '100%',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        ref={frameRef}
        className={`image-node-frame ${selected ? 'is-selected' : ''}`}
        style={{
          position: 'relative',
          width: effectiveWidth,
          maxWidth: '100%',
          transform: transformParts.length ? transformParts.join(' ') : undefined,
          transformOrigin: 'center center',
          transition: activeInteraction ? 'none' : 'transform 0.12s ease',
          outline: showControls ? '2px solid #0057B8' : '2px solid transparent',
          outlineOffset: '2px',
          borderRadius: '6px',
          display: 'inline-block',
        }}
      >
        {/* Top Floating Drag-Rotate Handle Knob */}
        {showControls && (
          <div
            contentEditable={false}
            onMouseDown={handleRotateDragStart}
            title="Drag to rotate image freely"
            style={{
              position: 'absolute',
              top: '-28px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '22px',
              height: '22px',
              borderRadius: '9999px',
              background: '#ffffff',
              border: '1.5px solid #0057B8',
              color: '#0057B8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'grab',
              boxShadow: '0 2px 6px rgba(0,0,0,0.18)',
              zIndex: 40,
            }}
          >
            <RotateCw size={11} />
          </div>
        )}

        {/* Draggable Image Body (click to select, drag to move freely on page) */}
        <img
          src={src}
          alt={alt}
          title={title}
          draggable={false}
          onMouseDown={handleDragMoveStart}
          style={{
            width: '100%',
            height: 'auto',
            display: 'block',
            borderRadius: '6px',
            cursor: isEditable ? (activeInteraction === 'move' ? 'grabbing' : 'grab') : 'default',
            userSelect: 'none',
          }}
        />

        {/* Corner & Edge Resize Handles */}
        {showControls && (
          <>
            {[
              { dir: 'nw', style: { top: -5, left: -5, cursor: 'nwse-resize' } },
              { dir: 'ne', style: { top: -5, right: -5, cursor: 'nesw-resize' } },
              { dir: 'sw', style: { bottom: -5, left: -5, cursor: 'nesw-resize' } },
              { dir: 'se', style: { bottom: -5, right: -5, cursor: 'nwse-resize' } },
              { dir: 'w', style: { top: '50%', left: -5, transform: 'translateY(-50%)', cursor: 'ew-resize' } },
              { dir: 'e', style: { top: '50%', right: -5, transform: 'translateY(-50%)', cursor: 'ew-resize' } },
            ].map(({ dir, style }) => (
              <div
                key={dir}
                contentEditable={false}
                onMouseDown={(e) => handleResizeStart(dir, e)}
                title="Drag to resize image"
                style={{
                  position: 'absolute',
                  width: '11px',
                  height: '11px',
                  background: '#ffffff',
                  border: '2px solid #0057B8',
                  borderRadius: '2px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
                  zIndex: 42,
                  ...style,
                }}
              />
            ))}
          </>
        )}

        {/* Interactive Image Asset Toolbar (Drag Reorder, Move, Size, Rotate, Align, Delete) */}
        {showControls && (
          <div
            contentEditable={false}
            onMouseDown={(e) => e.stopPropagation()}
            className="image-floating-controls"
            style={{
              position: 'absolute',
              bottom: '-42px',
              left: '50%',
              transform: `translateX(-50%)${effectiveRotation ? ` rotate(${-effectiveRotation}deg)` : ''}`,
              display: 'flex',
              alignItems: 'center',
              gap: '3px',
              padding: '4px 6px',
              background: '#0f172a',
              color: '#f8fafc',
              borderRadius: '8px',
              boxShadow: '0 8px 20px rgba(15, 23, 42, 0.3)',
              border: '1px solid #334155',
              zIndex: 50,
              whiteSpace: 'nowrap',
              fontSize: '11px',
            }}
          >
            {/* Reorder in Document Flow Handle */}
            <span
              draggable={true}
              data-drag-handle=""
              title="Drag to move image between paragraphs"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '2px',
                padding: '2px 4px',
                borderRadius: '4px',
                background: '#1e293b',
                color: '#93c5fd',
                cursor: 'grab',
              }}
            >
              <GripVertical size={12} />
            </span>

            {/* Drag Position Button */}
            <button
              type="button"
              onMouseDown={handleDragMoveStart}
              title="Drag to move image position on page"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '2px',
                padding: '2px 5px',
                background: '#1e293b',
                color: '#f8fafc',
                border: 'none',
                borderRadius: '4px',
                cursor: 'grab',
                fontSize: '10px',
                fontWeight: 600,
              }}
            >
              <Move size={11} />
              <span>Move</span>
            </button>

            <span style={{ width: 1, height: 14, background: '#334155', margin: '0 2px' }} />

            {/* Size - / Presets / + */}
            <button
              type="button"
              onClick={() => stepSize(-36)}
              title="Shrink image size"
              style={{
                padding: '2px 4px',
                background: 'transparent',
                color: '#e2e8f0',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              <ZoomOut size={12} />
            </button>
            {['25%', '50%', '75%', '100%'].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => updateAttributes({ width: preset })}
                title={`Set width to ${preset}`}
                style={{
                  padding: '2px 5px',
                  background: effectiveWidth === preset ? '#0057B8' : 'transparent',
                  color: effectiveWidth === preset ? '#ffffff' : '#cbd5e1',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '10px',
                  fontWeight: 600,
                }}
              >
                {preset}
              </button>
            ))}
            <button
              type="button"
              onClick={() => stepSize(36)}
              title="Increase image size"
              style={{
                padding: '2px 4px',
                background: 'transparent',
                color: '#e2e8f0',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              <ZoomIn size={12} />
            </button>

            <span style={{ width: 1, height: 14, background: '#334155', margin: '0 2px' }} />

            {/* Rotate Controls */}
            <button
              type="button"
              onClick={() => rotateBy(-90)}
              title="Rotate Left 90°"
              style={{
                padding: '2px 5px',
                background: 'transparent',
                color: '#e2e8f0',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '2px',
              }}
            >
              <RotateCcw size={12} />
            </button>
            <button
              type="button"
              onClick={() => updateAttributes({ rotation: 0 })}
              title="Click to reset rotation to 0°"
              style={{
                padding: '1px 4px',
                background: effectiveRotation ? '#1e293b' : 'transparent',
                color: effectiveRotation ? '#93c5fd' : '#94a3b8',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '10px',
                fontFamily: 'monospace',
              }}
            >
              {effectiveRotation}°
            </button>
            <button
              type="button"
              onClick={() => rotateBy(90)}
              title="Rotate Right 90°"
              style={{
                padding: '2px 5px',
                background: 'transparent',
                color: '#e2e8f0',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '2px',
              }}
            >
              <RotateCw size={12} />
            </button>

            <span style={{ width: 1, height: 14, background: '#334155', margin: '0 2px' }} />

            {/* Alignment */}
            {[
              { align: 'left', icon: <AlignLeft size={12} />, label: 'Align Left' },
              { align: 'center', icon: <AlignCenter size={12} />, label: 'Align Center' },
              { align: 'right', icon: <AlignRight size={12} />, label: 'Align Right' },
            ].map(({ align, icon, label }) => (
              <button
                key={align}
                type="button"
                onClick={() => updateAttributes({ alignment: align })}
                title={label}
                style={{
                  padding: '2px 4px',
                  background: alignment === align ? '#0057B8' : 'transparent',
                  color: alignment === align ? '#ffffff' : '#cbd5e1',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                {icon}
              </button>
            ))}

            {(effectiveOffsetX !== 0 || effectiveOffsetY !== 0) && (
              <button
                type="button"
                onClick={() => updateAttributes({ offsetX: 0, offsetY: 0 })}
                title="Reset drag position"
                style={{
                  padding: '2px 5px',
                  background: '#1e293b',
                  color: '#fbbf24',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '10px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '2px',
                }}
              >
                <RefreshCw size={10} />
              </button>
            )}

            <span style={{ width: 1, height: 14, background: '#334155', margin: '0 2px' }} />

            <button
              type="button"
              onClick={deleteNode}
              title="Delete Image"
              style={{
                padding: '2px 5px',
                background: 'transparent',
                color: '#f87171',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              <Trash2 size={12} />
            </button>
          </div>
        )}
      </div>
    </NodeViewWrapper>
  );
};

export default ImageNodeView;
