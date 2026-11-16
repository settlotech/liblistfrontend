import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  BookmarkPlus,
  Image as ImageIcon,
  StickyNote,
  X,
  Check,
  ExternalLink,
  Navigation,
} from 'lucide-react';

function CaptureModalDialog({ captureDraft, isSavingCapture, onCloseCapture, onSaveCapture }) {
  const pointInputRef = useRef(null);
  const [titleInput, setTitleInput] = useState(captureDraft.defaultTitle || '');
  const [notePointInput, setNotePointInput] = useState('');
  const [categoryInput, setCategoryInput] = useState(
    captureDraft.itemType === 'annotation' ? 'Visual Annotation' : 'Policy Note'
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      pointInputRef.current?.focus();
    }, 60);
    return () => clearTimeout(timer);
  }, []);

  const handleSubmitCapture = (e) => {
    if (e) e.preventDefault();
    const trimmedPoint = notePointInput.trim();
    if (!trimmedPoint || isSavingCapture) return;
    onSaveCapture({
      title: titleInput.trim() || captureDraft.defaultTitle || 'Policy Reference',
      content: trimmedPoint,
      category: categoryInput,
    });
  };

  const snippetPreview = captureDraft.selectedText || captureDraft.lineText || '';

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/45 backdrop-blur-xs p-4 animate-in fade-in duration-150"
      onClick={onCloseCapture}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden"
      >
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-[#0057B8] text-white flex items-center justify-center flex-shrink-0 shadow-xs">
              {captureDraft.itemType === 'annotation' ? (
                <ImageIcon className="w-4 h-4" />
              ) : (
                <BookmarkPlus className="w-4 h-4" />
              )}
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-slate-900 truncate">
                {captureDraft.itemType === 'annotation' ? 'Add Annotation' : 'Add to Notes'}
              </h3>
              <p className="text-[11px] text-slate-500 truncate">
                {captureDraft.policyTitle}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCloseCapture}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmitCapture} className="p-5 space-y-3.5 text-xs">
          {captureDraft.snapshotDataUrl && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-2 space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block px-1">
                Captured Visual Reference
              </span>
              <div className="relative bg-white rounded-lg border border-slate-200 overflow-hidden flex items-center justify-center max-h-44 p-2">
                <img
                  src={captureDraft.snapshotDataUrl}
                  alt={captureDraft.sectionTitle || 'Captured asset'}
                  className="max-h-40 w-auto object-contain"
                />
              </div>
            </div>
          )}

          {!captureDraft.snapshotDataUrl && snippetPreview && (
            <div className="rounded-xl border border-blue-100 bg-blue-50/50 px-3 py-2 space-y-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#0057B8] block">
                {captureDraft.sectionTitle || 'Captured Section'}
              </span>
              <p className="text-[11.5px] text-slate-700 line-clamp-3 leading-relaxed">
                {snippetPreview}
              </p>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
              Topic / Section Title
            </label>
            <input
              type="text"
              value={titleInput}
              onChange={(e) => setTitleInput(e.target.value)}
              placeholder="Enter topic..."
              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-[#0057B8] focus:ring-2 focus:ring-[#0057B8]/15 outline-none text-slate-900 font-semibold"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
              {captureDraft.itemType === 'annotation' ? 'Annotation Point *' : 'Note Point *'}
            </label>
            <textarea
              ref={pointInputRef}
              rows={3}
              required
              value={notePointInput}
              onChange={(e) => setNotePointInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmitCapture();
                }
              }}
              placeholder={
                captureDraft.itemType === 'annotation'
                  ? 'Enter a line or point about this graph/image...'
                  : 'Write your note point or summary line...'
              }
              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-[#0057B8] focus:ring-2 focus:ring-[#0057B8]/15 outline-none text-slate-800 resize-none leading-relaxed"
            />
          </div>

          <div className="flex items-center justify-between gap-3 pt-1">
            <select
              value={categoryInput}
              onChange={(e) => setCategoryInput(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 font-semibold text-[11.5px] outline-none cursor-pointer"
            >
              <option value="Policy Note">Policy Note</option>
              <option value="Visual Annotation">Visual Annotation</option>
              <option value="Compliance">Compliance</option>
              <option value="Risk & Control">Risk &amp; Control</option>
              <option value="Policy Drafts">Policy Drafts</option>
              <option value="General">General</option>
            </select>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onCloseCapture}
                className="px-3.5 py-1.5 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!notePointInput.trim() || isSavingCapture}
                className="px-4 py-1.5 rounded-xl bg-[#0057B8] hover:bg-[#004EA6] disabled:opacity-50 text-white font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{isSavingCapture ? 'Saving...' : 'Save'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function PolicyRightClickNotesOverlay({
  contextMenu,
  onCloseContextMenu,
  onChooseAction,
  captureDraft,
  onCloseCapture,
  onSaveCapture,
  isSavingCapture = false,
  savedToast,
  onDismissToast,
  onOpenNotesWorkspace,
  spotlightBanner,
  onDismissSpotlight,
}) {
  const menuRef = useRef(null);

  useLayoutEffect(() => {
    if (!contextMenu || !menuRef.current) return;
    const el = menuRef.current;
    const pad = 12;
    const rect = el.getBoundingClientRect();
    let x = contextMenu.clientX;
    let y = contextMenu.clientY;
    if (x + rect.width > window.innerWidth - pad) x = Math.max(pad, window.innerWidth - rect.width - pad);
    if (y + rect.height > window.innerHeight - pad) y = Math.max(pad, window.innerHeight - rect.height - pad);
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
  }, [contextMenu]);

  useEffect(() => {
    if (!contextMenu) return;
    const close = () => onCloseContextMenu();
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onCloseContextMenu();
    };
    window.addEventListener('click', close);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('click', close);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [contextMenu, onCloseContextMenu]);

  return (
    <>
      {contextMenu && (
        <div
          ref={menuRef}
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'fixed',
            left: `${contextMenu.clientX}px`,
            top: `${contextMenu.clientY}px`,
            zIndex: 9998,
          }}
          className="w-60 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden py-1.5 text-slate-800 animate-in fade-in zoom-in-95 duration-100"
        >
          <div className="px-3 py-1.5 border-b border-slate-100 flex items-center justify-between gap-2">
            <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400 truncate">
              {contextMenu.sectionTitle || (contextMenu.isAsset ? 'Graph / Visual Asset' : 'Policy Section')}
            </span>
          </div>

          {(contextMenu.selectedText || contextMenu.lineText) && !contextMenu.isAsset && (
            <div className="mx-2 my-1.5 px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200/80 text-[11px] text-slate-600 line-clamp-2 italic">
              &ldquo;{contextMenu.selectedText || contextMenu.lineText}&rdquo;
            </div>
          )}

          {contextMenu.isAsset ? (
            <>
              <button
                type="button"
                onClick={() => onChooseAction('annotation')}
                className="w-full px-3 py-2 text-left text-[12.5px] font-semibold text-slate-800 hover:bg-blue-50 hover:text-[#0057B8] flex items-center gap-2.5 transition cursor-pointer"
              >
                <span className="w-6 h-6 rounded-lg bg-blue-50 text-[#0057B8] flex items-center justify-center flex-shrink-0">
                  <ImageIcon className="w-3.5 h-3.5" />
                </span>
                <span>Add Annotation</span>
              </button>
              <button
                type="button"
                onClick={() => onChooseAction('note')}
                className="w-full px-3 py-2 text-left text-[12.5px] font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition cursor-pointer"
              >
                <span className="w-6 h-6 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
                  <BookmarkPlus className="w-3.5 h-3.5" />
                </span>
                <span>Add to Notes</span>
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => onChooseAction('note')}
                className="w-full px-3 py-2 text-left text-[12.5px] font-semibold text-slate-800 hover:bg-blue-50 hover:text-[#0057B8] flex items-center gap-2.5 transition cursor-pointer"
              >
                <span className="w-6 h-6 rounded-lg bg-blue-50 text-[#0057B8] flex items-center justify-center flex-shrink-0">
                  <BookmarkPlus className="w-3.5 h-3.5" />
                </span>
                <span>Add to Notes</span>
              </button>
              <button
                type="button"
                onClick={() => onChooseAction('annotation')}
                className="w-full px-3 py-2 text-left text-[12.5px] font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition cursor-pointer"
              >
                <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center flex-shrink-0">
                  <StickyNote className="w-3.5 h-3.5" />
                </span>
                <span>Add Annotation</span>
              </button>
            </>
          )}
        </div>
      )}

      {captureDraft && (
        <CaptureModalDialog
          key={`${captureDraft.itemType}:${captureDraft.anchorId}:${captureDraft.defaultTitle}`}
          captureDraft={captureDraft}
          isSavingCapture={isSavingCapture}
          onCloseCapture={onCloseCapture}
          onSaveCapture={onSaveCapture}
        />
      )}

      {spotlightBanner && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-[#0057B8] text-white text-xs shadow-2xl border border-blue-400/50 animate-in fade-in slide-in-from-bottom-2">
          <Navigation className="w-4 h-4 text-blue-200 flex-shrink-0" />
          <div className="min-w-0">
            <span className="font-bold">
              {spotlightBanner.itemType === 'annotation' ? 'Annotation' : 'Note'} #{spotlightBanner.noteNumber}
            </span>
            {spotlightBanner.sectionTitle && (
              <span className="text-blue-100 ml-1.5">• {spotlightBanner.sectionTitle}</span>
            )}
            {spotlightBanner.notePoint && (
              <p className="text-[11px] text-blue-100 truncate max-w-md">{spotlightBanner.notePoint}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onDismissSpotlight}
            className="p-1 hover:bg-white/15 rounded-lg cursor-pointer"
            title="Dismiss"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {savedToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl bg-slate-900 text-white text-xs font-semibold shadow-2xl border border-slate-700 animate-in fade-in slide-in-from-bottom-2">
          <span className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0 font-bold">
            #{savedToast.noteNumber}
          </span>
          <div className="min-w-0">
            <div>
              Saved {savedToast.itemType === 'annotation' ? 'Annotation' : 'Note'} #{savedToast.noteNumber}
            </div>
            <div className="text-[11px] text-slate-300 font-normal truncate max-w-[220px]">
              {savedToast.content}
            </div>
          </div>
          {onOpenNotesWorkspace && (
            <button
              type="button"
              onClick={() => onOpenNotesWorkspace(savedToast)}
              className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-blue-300 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
            >
              <span>Open</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          )}
          <button
            type="button"
            onClick={onDismissToast}
            className="p-0.5 text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </>
  );
}
