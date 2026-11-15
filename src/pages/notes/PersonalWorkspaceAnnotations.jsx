import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    FileText,
    Highlighter,
    Search,
    Folder,
    Calendar,
    ChevronRight,
    ExternalLink,
    Trash2,
    Crop,
    CheckCircle2,
    Filter
} from 'lucide-react';
import { documentManagementApi } from '../../services/api/documentManagementApi';
import './personalWorkspaceAnnotations.css';

/**
 * PersonalWorkspaceAnnotations
 * @param {'notes' | 'annotations'} mode - Whether to show Notes (TEXT) or Annotations (IMAGE/Visual)
 */
export default function PersonalWorkspaceAnnotations({ mode = 'notes' }) {
    const navigate = useNavigate();
    const isNotesMode = mode === 'notes';

    const [items, setItems] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedLibrary, setSelectedLibrary] = useState('ALL');
    const [toastMsg, setToastMsg] = useState(null);

    const loadData = useCallback(async () => {
        setIsLoading(true);
        try {
            const annotation_type = isNotesMode ? 'TEXT' : 'IMAGE';
            const res = await documentManagementApi.getMyAnnotations({
                annotation_type,
            });
            setItems(res?.data || []);
        } catch (err) {
            console.error('Failed to load user annotations/notes:', err);
        } finally {
            setIsLoading(false);
        }
    }, [isNotesMode]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const showToast = (msg) => {
        setToastMsg(msg);
        setTimeout(() => setToastMsg(null), 4000);
    };

    const handleDelete = async (item, e) => {
        e.stopPropagation();
        if (!window.confirm(`Delete this ${isNotesMode ? 'note' : 'annotation'}?`)) return;
        try {
            await documentManagementApi.deleteAnnotation(item.document_id, item.id);
            showToast(`${isNotesMode ? 'Note' : 'Annotation'} deleted.`);
            loadData();
        } catch (err) {
            alert(err.message || 'Failed to delete');
        }
    };

    // Filter by search and library
    const libraries = useMemo(() => {
        const set = new Set();
        items.forEach(it => {
            if (it.library_name) set.add(it.library_name);
        });
        return Array.from(set);
    }, [items]);

    const filteredItems = useMemo(() => {
        return items.filter(it => {
            if (selectedLibrary !== 'ALL' && it.library_name !== selectedLibrary) {
                return false;
            }
            if (!searchQuery.trim()) return true;
            const q = searchQuery.toLowerCase().trim();
            const textMatch = (it.annotation_text || '').toLowerCase().includes(q);
            const labelMatch = (it.label || '').toLowerCase().includes(q);
            const docMatch = (it.document_name || '').toLowerCase().includes(q);
            const libMatch = (it.library_name || '').toLowerCase().includes(q);
            return textMatch || labelMatch || docMatch || libMatch;
        });
    }, [items, selectedLibrary, searchQuery]);

    return (
        <div className="pw-annot-container">
            {toastMsg && (
                <div className="pw-annot-toast">
                    <CheckCircle2 size={16} />
                    <span>{toastMsg}</span>
                </div>
            )}

            {/* Header */}
            <div className="pw-annot-header">
                <div className="pw-annot-header-left">
                    {/* <div className="pw-annot-icon-box" style={{ background: isNotesMode ? '#fef3c7' : '#eff6ff', color: isNotesMode ? '#d97706' : '#0057B8' }}>
                        {isNotesMode ? <FileText size={22} /> : <Highlighter size={22} />}
                    </div> */}
                    <div>
                        <h2>{isNotesMode ? 'Personal Notes' : 'Personal Visual Annotations'}</h2>
                        <p>
                            {isNotesMode
                                ? 'All private textual notes and remarks you authored across operational policies.'
                                : 'All visual snipped image/chart annotations and marked clauses you authored across policies.'}
                        </p>
                    </div>
                </div>

                <div className="pw-annot-count-badge">
                    <span>{items.length} Total {isNotesMode ? 'Notes' : 'Annotations'}</span>
                </div>
            </div>

            {/* Filter toolbar */}
            <div className="pw-annot-toolbar">
                <div className="pw-annot-search-box">
                    <Search size={15} style={{ color: '#94a3b8' }} />
                    <input
                        type="text"
                        placeholder={`Search ${isNotesMode ? 'notes' : 'annotations'} by text, label, or policy name...`}
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                </div>

                {libraries.length > 0 && (
                    <div className="pw-annot-filter-select">
                        <Filter size={14} style={{ color: '#64748b' }} />
                        <select
                            value={selectedLibrary}
                            onChange={e => setSelectedLibrary(e.target.value)}
                        >
                            <option value="ALL">All Master Libraries</option>
                            {libraries.map(lib => (
                                <option key={lib} value={lib}>{lib}</option>
                            ))}
                        </select>
                    </div>
                )}
            </div>

            {/* Content List */}
            {isLoading ? (
                <div className="pw-annot-empty-state">
                    <p>Loading your {isNotesMode ? 'notes' : 'annotations'}...</p>
                </div>
            ) : filteredItems.length === 0 ? (
                <div className="pw-annot-empty-state">
                    {isNotesMode ? (
                        <FileText size={40} style={{ color: '#cbd5e1', margin: '0 auto 12px', display: 'block' }} />
                    ) : (
                        <Crop size={40} style={{ color: '#cbd5e1', margin: '0 auto 12px', display: 'block' }} />
                    )}
                    <h3>No {isNotesMode ? 'Notes' : 'Annotations'} Found</h3>
                    <p>
                        {searchQuery || selectedLibrary !== 'ALL'
                            ? 'No items match your filter criteria.'
                            : `You haven't created any ${isNotesMode ? 'notes' : 'annotations'} yet. Right-click anywhere in the Policy Viewer to add ${isNotesMode ? 'notes' : 'annotations'}.`}
                    </p>
                </div>
            ) : (
                <div className="pw-annot-grid">
                    {filteredItems.map(item => {
                        const dateStr = item.created_at
                            ? new Date(item.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                            : '—';
                        const color = item.color || (isNotesMode ? '#d97706' : '#0057B8');

                        return (
                            <div
                                key={item.id}
                                className="pw-annot-card"
                                // style={{ borderLeftColor: color }}
                                onClick={() => navigate(`/documents/${item.document_id}?annotId=${item.id}`)}
                            >
                                <div className="pw-annot-card-top">
                                    <div className="pw-annot-card-meta">
                                        <span className="pw-annot-tag" style={{ backgroundColor: color }}>
                                            {isNotesMode ? <FileText size={11} /> : <Crop size={11} />}
                                            {item.label || (isNotesMode ? 'Note' : 'Annotation')}
                                        </span>
                                        <span className="pw-annot-date">
                                            <Calendar size={12} />
                                            {dateStr}
                                        </span>
                                    </div>

                                    <button
                                        type="button"
                                        className="pw-annot-delete-btn"
                                        onClick={(e) => handleDelete(item, e)}
                                        title="Delete"
                                    >
                                        <Trash2 size={13} />
                                    </button>
                                </div>

                                <div className="pw-annot-card-body">
                                    {item.anchor_data?.selectedText && (
                                        <div className="pw-annot-quote">
                                            <span className="pw-annot-quote-bar" style={{ backgroundColor: color }} />
                                            <span className="pw-annot-quote-text">"{item.anchor_data.selectedText}"</span>
                                        </div>
                                    )}
                                    <p className="pw-annot-text">
                                        "{item.annotation_text}"
                                    </p>
                                </div>

                                <div className="pw-annot-card-bottom">
                                    <div className="pw-annot-doc-info">
                                        <Folder size={13} style={{ color: '#0057B8', flexShrink: 0 }} />
                                        <span className="pw-annot-doc-name" title={item.document_name}>
                                            {item.document_name}
                                        </span>
                                        {item.library_name && (
                                            <span className="pw-annot-lib-pill">
                                                {item.library_name}
                                            </span>
                                        )}
                                    </div>

                                    <span className="pw-annot-open-link">
                                        <span>Open Policy</span>
                                        <ChevronRight size={14} />
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
