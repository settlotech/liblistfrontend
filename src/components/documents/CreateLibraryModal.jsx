import React, { useState } from 'react';
import { X, FolderPlus, AlertCircle, Layers } from 'lucide-react';
import { documentManagementApi } from '../../services/api/documentManagementApi';

export default function CreateLibraryModal({
    isOpen,
    onClose,
    existingLibraries = [],
    onLibraryCreated
}) {
    const [libraryName, setLibraryName] = useState('');
    const [parentLibraryId, setParentLibraryId] = useState('');
    const [description, setDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!libraryName.trim()) {
            setErrorMsg('Library name is required.');
            return;
        }

        setIsSubmitting(true);
        setErrorMsg('');

        try {
            const payload = {
                library_name: libraryName.trim(),
                description: description.trim() || null,
                parent_library_id: parentLibraryId || null,
                display_order: 0
            };
            console.log("payload ==> ", payload);

            const res = await documentManagementApi.createLibrary(payload);

            if (res.success && res.data) {
                if (onLibraryCreated) {
                    onLibraryCreated(res.data);
                }
                window.dispatchEvent(new CustomEvent('liblist:library-created', { detail: res.data }));
                onClose();
            } else {
                setErrorMsg(res.message || 'Failed to create library.');
            }
        } catch (err) {
            setErrorMsg(err.message || 'Error communicating with server.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="dms-modal-overlay">
            <div className="dms-modal-card" style={{ maxWidth: '480px' }}>
                <div className="dms-modal-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FolderPlus size={18} style={{ color: 'var(--dms-primary)' }} />
                        <h3 className="dms-modal-title">Create New Master Library</h3>
                    </div>
                    <button type="button" className="dms-annot-close-btn" onClick={onClose}>
                        <X size={16} />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="dms-modal-body">
                        {errorMsg && (
                            <div style={{ padding: '8px 12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', color: '#b91c1c', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <AlertCircle size={14} />
                                <span>{errorMsg}</span>
                            </div>
                        )}

                        <div className="dms-form-group">
                            <label className="dms-form-label">Library Name *</label>
                            <input
                                type="text"
                                className="dms-form-input"
                                value={libraryName}
                                onChange={(e) => setLibraryName(e.target.value)}
                                placeholder="e.g. Information Security Governance"
                                autoFocus
                                required
                            />
                        </div>

                        <div className="dms-form-group">
                            <label className="dms-form-label">Parent Library (Optional)</label>
                            <select
                                className="dms-form-select"
                                value={parentLibraryId}
                                onChange={(e) => setParentLibraryId(e.target.value)}
                            >
                                <option value="">None (Top-level Root Library)</option>
                                {existingLibraries.map((lib) => (
                                    <option key={lib.id} value={lib.id}>
                                        {lib.library_name}
                                    </option>
                                ))}
                            </select>
                            <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                                Nest this library inside another parent category to organize hierarchy.
                            </span>
                        </div>

                        <div className="dms-form-group">
                            <label className="dms-form-label">Description</label>
                            <textarea
                                className="dms-form-textarea"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Purpose, regulatory scope, or department focus..."
                                style={{ minHeight: '65px' }}
                            />
                        </div>
                    </div>

                    <div className="dms-modal-footer">
                        <button type="button" className="dms-btn-outline" onClick={onClose} disabled={isSubmitting}>
                            Cancel
                        </button>
                        <button type="submit" className="dms-btn-primary" disabled={isSubmitting}>
                            {isSubmitting ? 'Creating...' : 'Create Library'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
