import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  FileText,
  Plus,
  Search,
  Trash2,
  Pin,
  Calendar,
  Check,
  Navigation,
  Image as ImageIcon,
  BookmarkCheck,
  BookOpen,
  Quote,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  loadLocalUserNotes,
  fetchUserNotes,
  createUserNoteOrAnnotation,
  updateUserNoteOrAnnotation,
  deleteUserNoteOrAnnotation,
  matchesNoteSearch,
  USER_NOTES_EVENT,
  resolveUserKey,
} from '../../utils/userNotesStorage';
import './notes.css';

export default function NotesWorkspace() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id: routeNoteId } = useParams();
  const userKey = resolveUserKey(user);

  const [notes, setNotes] = useState(() => loadLocalUserNotes(user));
  const [activeNoteId, setActiveNoteId] = useState(() => {
    const initial = loadLocalUserNotes(user);
    if (routeNoteId && initial.some((n) => String(n.id) === String(routeNoteId))) {
      return String(routeNoteId);
    }
    return initial[0]?.id || '';
  });

  const [typeFilter, setTypeFilter] = useState('ALL'); // 'ALL' | 'note' | 'annotation'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [saveStatus, setSaveStatus] = useState('Saved');
  const updateTimerRef = useRef(null);

  // Sync per-user notes/annotations from backend + local storage on user change or live save events
  useEffect(() => {
    let active = true;
    const local = loadLocalUserNotes(user);
    setNotes(local);
    if (routeNoteId && local.some((n) => String(n.id) === String(routeNoteId))) {
      setActiveNoteId(String(routeNoteId));
    } else if (local.length > 0 && !local.some((n) => String(n.id) === String(activeNoteId))) {
      setActiveNoteId(local[0].id);
    }

    fetchUserNotes(user)
      .then((list) => {
        if (!active) return;
        setNotes(list);
        if (routeNoteId && list.some((n) => String(n.id) === String(routeNoteId))) {
          setActiveNoteId(String(routeNoteId));
        }
      })
      .catch(() => {});

    const onUpdated = (e) => {
      if (e?.detail?.userKey && e.detail.userKey !== userKey) return;
      if (Array.isArray(e?.detail?.items)) {
        setNotes(e.detail.items);
      }
    };
    window.addEventListener(USER_NOTES_EVENT, onUpdated);
    return () => {
      active = false;
      window.removeEventListener(USER_NOTES_EVENT, onUpdated);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userKey, routeNoteId]);

  const activeNote = useMemo(
    () => notes.find((n) => String(n.id) === String(activeNoteId)) || notes[0] || null,
    [notes, activeNoteId]
  );

  const noteCount = useMemo(() => notes.filter((n) => n.itemType !== 'annotation').length, [notes]);
  const annotationCount = useMemo(() => notes.filter((n) => n.itemType === 'annotation').length, [notes]);

  const handleCreateNote = async () => {
    const newItemType = typeFilter === 'annotation' ? 'annotation' : 'note';
    const created = await createUserNoteOrAnnotation(user, {
      itemType: newItemType,
      title: newItemType === 'annotation' ? 'New Annotation' : 'Untitled Note',
      content: '',
      category:
        selectedCategory !== 'All'
          ? selectedCategory
          : newItemType === 'annotation'
            ? 'Visual Annotation'
            : 'General',
      targetType: 'general',
      targetAnchor: {},
      pinned: false,
    });
    setActiveNoteId(created.id);
  };

  const handleUpdateActiveNote = (updates) => {
    if (!activeNote) return;
    setSaveStatus('Saving...');
    const targetId = activeNote.id;

    setNotes((prev) =>
      prev.map((n) =>
        String(n.id) === String(targetId)
          ? { ...n, ...updates, updatedAt: new Date().toISOString() }
          : n
      )
    );

    if (updateTimerRef.current) clearTimeout(updateTimerRef.current);
    updateTimerRef.current = setTimeout(async () => {
      await updateUserNoteOrAnnotation(user, targetId, updates);
      setSaveStatus('Saved');
    }, 300);
  };

  const handleDeleteActiveNote = async () => {
    if (!activeNote) return;
    const label = activeNote.itemType === 'annotation' ? 'annotation' : 'note';
    if (!window.confirm(`Are you sure you want to delete this ${label}?`)) return;
    const remaining = await deleteUserNoteOrAnnotation(user, activeNote.id);
    setNotes(remaining);
    if (remaining.length > 0) {
      setActiveNoteId(remaining[0].id);
    } else {
      setActiveNoteId('');
    }
  };

  const handleTogglePin = async (noteId, e) => {
    e.stopPropagation();
    const target = notes.find((n) => String(n.id) === String(noteId));
    if (!target) return;
    const nextPinned = !target.pinned;
    const nextList = notes.map((n) => (String(n.id) === String(noteId) ? { ...n, pinned: nextPinned } : n));
    setNotes(nextList);
    await updateUserNoteOrAnnotation(user, noteId, { pinned: nextPinned });
  };

  const handleNavigateToPolicyTarget = (item) => {
    if (!item || !item.policyId) return;
    const navId = item.clientId || item.id;
    navigate(`/home?policy=${encodeURIComponent(item.policyId)}&noteNav=${encodeURIComponent(navId)}`, {
      state: {
        noteNavTarget: item,
      },
    });
  };

  const categories = ['All', 'Policy Note', 'Visual Annotation', 'Compliance', 'Risk & Control', 'Policy Drafts', 'General'];

  const filteredNotes = useMemo(() => {
    return notes.filter((n) => {
      if (typeFilter === 'note' && n.itemType === 'annotation') return false;
      if (typeFilter === 'annotation' && n.itemType !== 'annotation') return false;
      const matchesCategory = selectedCategory === 'All' || n.category === selectedCategory;
      if (!matchesCategory) return false;
      return matchesNoteSearch(n, searchQuery);
    });
  }, [notes, typeFilter, selectedCategory, searchQuery]);

  // Sort pinned items first, then most recently updated
  const sortedNotes = useMemo(() => {
    return [...filteredNotes].sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return new Date(b.updatedAt) - new Date(a.updatedAt);
    });
  }, [filteredNotes]);

  const activeAnchor = activeNote?.targetAnchor || {};
  const activeExcerpt = activeAnchor.excerpt || activeAnchor.selectedText || activeAnchor.lineText || '';
  const activeSnapshot = activeAnchor.snapshotDataUrl || activeAnchor.imageSrc || '';

  return (
    <div className="notes-workspace-container">
      {/* Left Sidebar: Notes & Annotations List */}
      <div className="notes-sidebar">
        {/* Sidebar Header */}
        <div className="notes-sidebar-header">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-[#0057B8] text-white flex items-center justify-center shadow-xs flex-shrink-0">
                <FileText className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h1 className="font-bold text-sm text-slate-900 leading-tight truncate">Notes &amp; Annotations</h1>
                <p className="text-[11px] text-slate-500">
                  {noteCount} note(s) • {annotationCount} annotation(s)
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleCreateNote}
              className="px-3 py-1.5 bg-[#0057B8] hover:bg-[#004EA6] text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95 flex-shrink-0"
              title="Create new note"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New</span>
            </button>
          </div>

          {/* Search by ID (#1, 1) or Note Point */}
          <div className="relative mt-3">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by ID (e.g. 1, #2) or note point..."
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#0057B8] outline-none transition"
            />
          </div>

          {/* Type Filter Tabs */}
          <div className="grid grid-cols-3 gap-1 mt-2.5 p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => setTypeFilter('ALL')}
              className={`py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                typeFilter === 'ALL' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({notes.length})
            </button>
            <button
              type="button"
              onClick={() => setTypeFilter('note')}
              className={`py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                typeFilter === 'note' ? 'bg-white text-[#0057B8] shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Notes ({noteCount})
            </button>
            <button
              type="button"
              onClick={() => setTypeFilter('annotation')}
              className={`py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                typeFilter === 'annotation' ? 'bg-white text-amber-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Annotations ({annotationCount})
            </button>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1 mt-2 overflow-x-auto pb-0.5 custom-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition cursor-pointer flex-shrink-0 ${
                  selectedCategory === cat
                    ? 'bg-[#0057B8] text-white'
                    : 'text-slate-600 hover:bg-slate-200/70 bg-slate-100'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Notes & Annotations Cards List */}
        <div className="notes-list custom-scrollbar">
          {sortedNotes.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs italic">
              No matching notes or annotations. Right-click any section, graph, or image in Master Library to add one.
            </div>
          ) : (
            sortedNotes.map((note) => {
              const isActive = note.id === activeNote?.id;
              const isAnn = note.itemType === 'annotation';
              const thumb = note.targetAnchor?.snapshotDataUrl || note.targetAnchor?.imageSrc || '';

              return (
                <div
                  key={note.id}
                  onClick={() => setActiveNoteId(note.id)}
                  className={`notes-card ${isActive ? 'active' : ''}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0 flex-1">
                      {note.noteNumber !== null && note.noteNumber !== undefined && (
                        <span
                          className={`px-1.5 py-0.5 rounded font-mono text-[10.5px] font-bold flex-shrink-0 ${
                            isAnn
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : 'bg-blue-100 text-[#0057B8] border border-blue-200'
                          }`}
                        >
                          #{note.noteNumber}
                        </span>
                      )}
                      <h3 className="font-bold text-xs text-slate-900 truncate flex-1">
                        {note.title || (isAnn ? 'Untitled Annotation' : 'Untitled Note')}
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => handleTogglePin(note.id, e)}
                      className={`text-slate-300 hover:text-amber-500 transition cursor-pointer ${
                        note.pinned ? 'text-amber-500' : ''
                      }`}
                      title={note.pinned ? 'Unpin' : 'Pin'}
                    >
                      <Pin className="w-3.5 h-3.5 fill-current" />
                    </button>
                  </div>

                  {/* Note / Annotation Point Line */}
                  <p className="text-[11.5px] text-slate-600 line-clamp-2 mt-1 leading-relaxed">
                    {note.content || 'No additional point added'}
                  </p>

                  {/* Mini Visual Thumbnail for Graph/Image Annotations */}
                  {thumb && (
                    <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50 overflow-hidden h-16 flex items-center justify-center p-1">
                      <img src={thumb} alt={note.title} className="max-h-full max-w-full object-contain" />
                    </div>
                  )}

                  {/* Source Master Library Metadata */}
                  {note.policyTitle && (
                    <div className="mt-1.5 flex items-center gap-1 text-[10.5px] text-[#0057B8] font-medium truncate">
                      <BookOpen className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">{note.policyTitle}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-2 mt-2 pt-1 border-t border-slate-100 text-[10.5px] text-slate-400">
                    <div className="flex items-center gap-1">
                      <span
                        className={`font-semibold px-1.5 py-0.5 rounded ${
                          isAnn ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {isAnn ? 'Annotation' : 'Note'}
                      </span>
                      <span className="font-medium text-slate-500 truncate max-w-[110px]">
                        {note.category}
                      </span>
                    </div>
                    <span>
                      {new Date(note.updatedAt).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                      })}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Right Area: Active Note / Annotation Detail & Navigate Action */}
      <div className="notes-editor-pane">
        {activeNote ? (
          <div className="notes-editor-content">
            {/* Top Toolbar */}
            <div className="notes-editor-topbar flex-wrap gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                {activeNote.noteNumber !== null && activeNote.noteNumber !== undefined && (
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-mono text-xs font-bold border ${
                      activeNote.itemType === 'annotation'
                        ? 'bg-amber-50 text-amber-800 border-amber-200'
                        : 'bg-blue-50 text-[#0057B8] border-blue-200'
                    }`}
                  >
                    {activeNote.itemType === 'annotation' ? (
                      <ImageIcon className="w-3.5 h-3.5" />
                    ) : (
                      <BookmarkCheck className="w-3.5 h-3.5" />
                    )}
                    <span>
                      {activeNote.itemType === 'annotation' ? 'Annotation' : 'Note'} #{activeNote.noteNumber}
                    </span>
                  </span>
                )}

                <select
                  value={activeNote.category}
                  onChange={(e) => handleUpdateActiveNote({ category: e.target.value })}
                  className="text-xs font-semibold px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-slate-700 outline-none cursor-pointer"
                >
                  <option value="Policy Note">Policy Note</option>
                  <option value="Visual Annotation">Visual Annotation</option>
                  <option value="Compliance">Compliance</option>
                  <option value="Risk & Control">Risk &amp; Control</option>
                  <option value="Policy Drafts">Policy Drafts</option>
                  <option value="General">General</option>
                  <option value="Audit">Audit</option>
                  <option value="Meeting">Meeting</option>
                </select>

                <span className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                  <Calendar className="w-3 h-3" />
                  Last edited {new Date(activeNote.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {activeNote.policyId && (
                  <button
                    type="button"
                    onClick={() => handleNavigateToPolicyTarget(activeNote)}
                    className="px-3.5 py-1.5 bg-[#0057B8] hover:bg-[#004EA6] text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95"
                    title="Close Notes & Annotations and navigate directly to this exact point in Master Library"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    <span>Navigate</span>
                  </button>
                )}

                <span className="text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  {saveStatus}
                </span>

                <button
                  type="button"
                  onClick={handleDeleteActiveNote}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Linked Master Library Location & Visual/Text Preview */}
            {activeNote.policyId && (
              <div className="mb-4 p-3.5 rounded-2xl border border-blue-200/80 bg-blue-50/40 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#0057B8] block">
                      Master Library Source
                    </span>
                    <div className="text-xs font-bold text-slate-900 truncate">
                      {activeNote.policyTitle || activeNote.policyId}
                      {activeAnchor.sectionTitle ? ` • ${activeAnchor.sectionTitle}` : ''}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleNavigateToPolicyTarget(activeNote)}
                    className="px-3 py-1 rounded-lg bg-white hover:bg-[#0057B8] text-[#0057B8] hover:text-white border border-blue-200 text-[11px] font-bold flex items-center gap-1.5 transition cursor-pointer flex-shrink-0 shadow-2xs"
                  >
                    <Navigation className="w-3 h-3" />
                    <span>Navigate to Point</span>
                  </button>
                </div>

                {/* Visual Graph / Image Snapshot for Annotations */}
                {activeSnapshot && (
                  <div className="relative rounded-xl border border-slate-200 bg-white p-2.5 flex items-center justify-center max-h-64 overflow-hidden">
                    <img
                      src={activeSnapshot}
                      alt={activeNote.title || 'Annotated asset'}
                      className="max-h-56 w-auto object-contain"
                    />
                  </div>
                )}

                {/* Captured Line / Section Excerpt */}
                {activeExcerpt && (
                  <div className="flex items-start gap-2 rounded-xl bg-white border border-slate-200/90 px-3 py-2 text-[12px] text-slate-700 leading-relaxed">
                    <Quote className="w-3.5 h-3.5 text-[#0057B8] flex-shrink-0 mt-0.5" />
                    <span className="italic">{activeExcerpt}</span>
                  </div>
                )}
              </div>
            )}

            {/* Topic / Title Input */}
            <input
              type="text"
              value={activeNote.title}
              onChange={(e) => handleUpdateActiveNote({ title: e.target.value })}
              placeholder="Topic / Title..."
              className="notes-title-input"
            />

            {/* Note / Annotation Point Field */}
            <label className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              {activeNote.itemType === 'annotation' ? 'Annotation Point' : 'Note Point'}
            </label>
            <textarea
              value={activeNote.content}
              onChange={(e) => handleUpdateActiveNote({ content: e.target.value })}
              placeholder="Write your note point, policy line observation, or annotation comment..."
              className="notes-textarea custom-scrollbar"
            />
          </div>
        ) : (
          <div className="p-12 text-center text-slate-400 text-sm">
            Select a note or annotation, click &ldquo;+ New&rdquo;, or right-click any section, graph, or image in Master Library.
          </div>
        )}
      </div>
    </div>
  );
}
