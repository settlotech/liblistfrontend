import React, { useState, useEffect } from 'react';
import {
  FileText,
  Plus,
  Search,
  Trash2,
  Pin,
  Calendar,
  Check
} from 'lucide-react';
import './notes.css';

const DEFAULT_NOTES = [
  {
    id: 'note-1',
    title: 'APRA CPS 234 Compliance Review & Audit Notes',
    content: 'Review meeting with Credit Risk committee regarding CPS 234 cloud security and data controls for online card applications.\n\nKey Action Items:\n1. Verify multi-factor authentication logging for all officer approvals over $25,000.\n2. Ensure encryption keys are rotated quarterly.\n3. Validate turnaround SLAs against Q3 compliance reporting.',
    category: 'Compliance',
    pinned: true,
    updatedAt: new Date(Date.now() - 3600000 * 2).toISOString()
  },
  {
    id: 'note-2',
    title: 'Credit Card Underwriting Threshold Notes',
    content: 'Discussion with senior credit assessor regarding prime borrower buffer calculation:\n- Minimum Equifax credit score requirement of 620 remains mandatory.\n- Automated approval threshold for Level 1 junior assessors set to $5,000 max.\n- Level 2 escalation required for applicants with existing revolving credit exposure > $30,000.',
    category: 'Policy Drafts',
    pinned: true,
    updatedAt: new Date(Date.now() - 3600000 * 8).toISOString()
  },
  {
    id: 'note-3',
    title: 'Home Loan Valuation Policy Notes',
    content: 'Observations from panel valuers audit:\n- Full valuation turnaround SLA averaging 48 hours in metro Sydney and Melbourne.\n- AVM validation window is 30 days strictly.\n- Escalations for disputes > 10% between purchase price and valuation are managed by Tier 3 managers.',
    category: 'Policy Drafts',
    pinned: false,
    updatedAt: new Date(Date.now() - 3600000 * 24).toISOString()
  },
  {
    id: 'note-4',
    title: 'Meeting Notes: Q4 Executive Governance',
    content: 'Executive meeting notes covering upcoming Australian regulatory audits:\n- APRA APS 220 credit quality revisions coming into effect next quarter.\n- Draft policies in Change Management need final review before Dec 1st.\n- Staff submitters to complete annual KYC and AML-CTF refreshers.',
    category: 'General',
    pinned: false,
    updatedAt: new Date(Date.now() - 3600000 * 48).toISOString()
  }
];

export default function NotesWorkspace() {
  const [notes, setNotes] = useState(() => {
    try {
      const saved = localStorage.getItem('liblist_user_notes');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (_) {}
    return DEFAULT_NOTES;
  });

  const [activeNoteId, setActiveNoteId] = useState(() => {
    return notes[0]?.id || 'note-1';
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [saveStatus, setSaveStatus] = useState('Saved');

  // Persist notes
  useEffect(() => {
    try {
      localStorage.setItem('liblist_user_notes', JSON.stringify(notes));
    } catch (_) {}
  }, [notes]);

  const activeNote = notes.find(n => n.id === activeNoteId) || notes[0];

  const handleCreateNote = () => {
    const newNote = {
      id: `note-${Date.now()}`,
      title: 'Untitled Note',
      content: '',
      category: selectedCategory === 'All' ? 'General' : selectedCategory,
      pinned: false,
      updatedAt: new Date().toISOString()
    };
    setNotes(prev => [newNote, ...prev]);
    setActiveNoteId(newNote.id);
  };

  const handleUpdateActiveNote = (updates) => {
    setSaveStatus('Saving...');
    setNotes(prev =>
      prev.map(n =>
        n.id === activeNoteId
          ? { ...n, ...updates, updatedAt: new Date().toISOString() }
          : n
      )
    );
    setTimeout(() => setSaveStatus('Saved'), 300);
  };

  const handleDeleteActiveNote = () => {
    if (!window.confirm('Are you sure you want to delete this note?')) return;
    setNotes(prev => {
      const remaining = prev.filter(n => n.id !== activeNoteId);
      if (remaining.length > 0) {
        setActiveNoteId(remaining[0].id);
      }
      return remaining;
    });
  };

  const handleTogglePin = (noteId, e) => {
    e.stopPropagation();
    setNotes(prev =>
      prev.map(n => (n.id === noteId ? { ...n, pinned: !n.pinned } : n))
    );
  };

  const categories = ['All', 'Policy Drafts', 'Compliance', 'General'];

  const filteredNotes = notes.filter(n => {
    const matchesCategory = selectedCategory === 'All' || n.category === selectedCategory;
    const matchesSearch =
      !searchQuery ||
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Sort pinned notes to top
  const sortedNotes = [...filteredNotes].sort((a, b) => {
    if (a.pinned === b.pinned) {
      return new Date(b.updatedAt) - new Date(a.updatedAt);
    }
    return a.pinned ? -1 : 1;
  });

  return (
    <div className="notes-workspace-container">
      {/* Left Sidebar: Notes List */}
      <div className="notes-sidebar">
        {/* Sidebar Header */}
        <div className="notes-sidebar-header">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#0057B8] text-white flex items-center justify-center shadow-xs">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <h1 className="font-bold text-sm text-slate-900 leading-tight">Notes</h1>
                <p className="text-[11px] text-slate-500">{notes.length} note(s)</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleCreateNote}
              className="px-3 py-1.5 bg-[#0057B8] hover:bg-[#004EA6] text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
              title="Create new note"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New</span>
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative mt-3">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search notes..."
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#0057B8] outline-none transition"
            />
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1 mt-2.5 overflow-x-auto pb-0.5 custom-scrollbar">
            {categories.map(cat => (
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

        {/* Notes Cards List */}
        <div className="notes-list custom-scrollbar">
          {sortedNotes.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs italic">
              No notes found. Click "+ New" to create one!
            </div>
          ) : (
            sortedNotes.map(note => {
              const isActive = note.id === activeNote?.id;
              return (
                <div
                  key={note.id}
                  onClick={() => setActiveNoteId(note.id)}
                  className={`notes-card ${isActive ? 'active' : ''}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold text-xs text-slate-900 truncate flex-1">
                      {note.title || 'Untitled Note'}
                    </h3>
                    <button
                      type="button"
                      onClick={(e) => handleTogglePin(note.id, e)}
                      className={`text-slate-300 hover:text-amber-500 transition cursor-pointer ${
                        note.pinned ? 'text-amber-500' : ''
                      }`}
                      title={note.pinned ? 'Unpin note' : 'Pin note'}
                    >
                      <Pin className="w-3.5 h-3.5 fill-current" />
                    </button>
                  </div>

                  <p className="text-[11.5px] text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                    {note.content || 'No additional text'}
                  </p>

                  <div className="flex items-center justify-between gap-2 mt-2 pt-1 border-t border-slate-100 text-[10.5px] text-slate-400">
                    <span className="font-medium bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                      {note.category}
                    </span>
                    <span>
                      {new Date(note.updatedAt).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short'
                      })}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Right Area: Active Note Editor */}
      <div className="notes-editor-pane">
        {activeNote ? (
          <div className="notes-editor-content">
            {/* Top Toolbar */}
            <div className="notes-editor-topbar">
              <div className="flex items-center gap-2">
                <select
                  value={activeNote.category}
                  onChange={(e) => handleUpdateActiveNote({ category: e.target.value })}
                  className="text-xs font-semibold px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-slate-700 outline-none cursor-pointer"
                >
                  <option value="Policy Drafts">Policy Drafts</option>
                  <option value="Compliance">Compliance</option>
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
                <span className="text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  {saveStatus}
                </span>

                <button
                  type="button"
                  onClick={handleDeleteActiveNote}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                  title="Delete note"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Note Title Input */}
            <input
              type="text"
              value={activeNote.title}
              onChange={(e) => handleUpdateActiveNote({ title: e.target.value })}
              placeholder="Note Title..."
              className="notes-title-input"
            />

            {/* Note Content Area */}
            <textarea
              value={activeNote.content}
              onChange={(e) => handleUpdateActiveNote({ content: e.target.value })}
              placeholder="Start typing your policy notes, compliance thoughts, meeting minutes, or action items..."
              className="notes-textarea custom-scrollbar"
            />
          </div>
        ) : (
          <div className="p-12 text-center text-slate-400 text-sm">
            Select a note or click "+ New" to begin writing.
          </div>
        )}
      </div>
    </div>
  );
}

