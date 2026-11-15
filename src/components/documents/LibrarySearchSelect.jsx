import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Folder, Check, X, Loader2, ChevronDown } from 'lucide-react';
import { documentManagementApi } from '../../services/api/documentManagementApi';

export default function LibrarySearchSelect({
    value,
    onChange,
    placeholder = 'Search & select library...',
    initialLibraryName = ''
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedLibrary, setSelectedLibrary] = useState(null);
    const [options, setOptions] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const containerRef = useRef(null);
    const debounceTimeoutRef = useRef(null);

    // Fetch initial selected library details if value is provided
    useEffect(() => {
        if (value) {
            documentManagementApi.getLibraryById(value).then((res) => {
                if (res?.data) {
                    setSelectedLibrary(res.data);
                }
            }).catch(() => {
                if (initialLibraryName) {
                    setSelectedLibrary({ id: value, library_name: initialLibraryName });
                }
            });
        } else {
            setSelectedLibrary(null);
        }
    }, [value, initialLibraryName]);

    // Query libraries with search term (debounced)
    const fetchLibraries = useCallback(async (query = '') => {
        setIsLoading(true);
        try {
            const params = { limit: 15 };
            if (query.trim()) params.search = query.trim();

            const res = await documentManagementApi.getLibraries(params);
            const list = res?.data?.libraries || res?.data || [];
            setOptions(list);
        } catch (err) {
            console.error('Failed to search libraries:', err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Handle search input typing with 250ms debounce
    const handleSearchChange = (e) => {
        const query = e.target.value;
        setSearchTerm(query);
        setIsOpen(true);

        if (debounceTimeoutRef.current) {
            clearTimeout(debounceTimeoutRef.current);
        }

        debounceTimeoutRef.current = setTimeout(() => {
            fetchLibraries(query);
        }, 250);
    };

    // Open dropdown and load initial suggestions if empty
    const handleOpen = () => {
        setIsOpen(true);
        if (options.length === 0) {
            fetchLibraries(searchTerm);
        }
    };

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
        };
    }, []);

    const handleSelectOption = (lib) => {
        setSelectedLibrary(lib);
        onChange(lib.id);
        setIsOpen(false);
        setSearchTerm('');
    };

    const handleClear = (e) => {
        e.stopPropagation();
        setSelectedLibrary(null);
        onChange('');
        setSearchTerm('');
        fetchLibraries('');
    };

    return (
        <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
            {/* Input / Selector Box */}
            <div
                onClick={handleOpen}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '6px 10px',
                    borderRadius: '7px',
                    border: `1px solid ${isOpen ? 'var(--dms-border-focus, #3b82f6)' : 'var(--dms-border, #cbd5e1)'}`,
                    background: '#ffffff',
                    boxShadow: isOpen ? '0 0 0 2px rgba(59, 130, 246, 0.15)' : 'none',
                    cursor: 'text',
                    transition: 'all 0.15s ease'
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
                    <Search size={14} style={{ color: '#94a3b8', flexShrink: 0 }} />
                    {selectedLibrary && !isOpen ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
                            <Folder size={13} style={{ color: 'var(--dms-primary, #1a73e8)', flexShrink: 0 }} />
                            <span style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {selectedLibrary.library_name}
                            </span>
                        </div>
                    ) : (
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={handleSearchChange}
                            onFocus={handleOpen}
                            placeholder={selectedLibrary ? selectedLibrary.library_name : placeholder}
                            style={{
                                border: 'none',
                                outline: 'none',
                                width: '100%',
                                fontSize: '13px',
                                color: '#0f172a',
                                background: 'transparent'
                            }}
                        />
                    )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                    {isLoading && <Loader2 size={13} style={{ animation: 'spin 1s linear infinite', color: '#94a3b8' }} />}
                    {selectedLibrary && (
                        <button
                            type="button"
                            onClick={handleClear}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: '#94a3b8',
                                cursor: 'pointer',
                                padding: '2px',
                                display: 'flex',
                                alignItems: 'center',
                                borderRadius: '4px'
                            }}
                            title="Clear library selection"
                        >
                            <X size={13} />
                        </button>
                    )}
                    <ChevronDown size={14} style={{ color: '#94a3b8', transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
                </div>
            </div>

            {/* Dropdown Results Menu */}
            {isOpen && (
                <div
                    style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        marginTop: '4px',
                        background: '#ffffff',
                        border: '1px solid var(--dms-border, #e2e8f0)',
                        borderRadius: '8px',
                        boxShadow: '0 8px 20px rgba(0, 0, 0, 0.1)',
                        zIndex: 100,
                        maxHeight: '220px',
                        overflowY: 'auto',
                        padding: '4px 0'
                    }}
                >
                    {isLoading && options.length === 0 ? (
                        <div style={{ padding: '12px', textAlign: 'center', fontSize: '12px', color: '#94a3b8' }}>
                            Searching libraries...
                        </div>
                    ) : options.length === 0 ? (
                        <div style={{ padding: '12px', textAlign: 'center', fontSize: '12px', color: '#94a3b8' }}>
                            No libraries found matching "{searchTerm}".
                        </div>
                    ) : (
                        options.map((lib) => {
                            const isSelected = selectedLibrary?.id === lib.id;
                            return (
                                <div
                                    key={lib.id}
                                    onClick={() => handleSelectOption(lib)}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        padding: '8px 12px',
                                        cursor: 'pointer',
                                        background: isSelected ? 'var(--dms-primary-light, #f0f7ff)' : 'transparent',
                                        color: isSelected ? 'var(--dms-primary, #0369a1)' : '#0f172a',
                                        transition: 'background 0.12s'
                                    }}
                                    onMouseEnter={(e) => {
                                        if (!isSelected) e.currentTarget.style.background = '#f8fafc';
                                    }}
                                    onMouseLeave={(e) => {
                                        if (!isSelected) e.currentTarget.style.background = 'transparent';
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                                        <Folder size={14} style={{ color: isSelected ? 'var(--dms-primary, #1a73e8)' : '#64748b', flexShrink: 0 }} />
                                        <div style={{ minWidth: 0 }}>
                                            <div style={{ fontSize: '12.5px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {lib.library_name}
                                            </div>
                                            {lib.description && (
                                                <div style={{ fontSize: '11px', color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    {lib.description}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {isSelected && <Check size={14} style={{ color: 'var(--dms-primary, #1a73e8)', flexShrink: 0 }} />}
                                </div>
                            );
                        })
                    )}
                </div>
            )}
        </div>
    );
}
