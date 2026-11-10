import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
    Settings,
    LayoutDashboard,
    BarChart3,
    FileText,
    Building2,
    ShieldCheck,
    ChevronLeft,
    ChevronRight,
    LogOut,
    Pin,
    Layers,
    Search,
    X,
    Plus,
    Link as LinkIcon,
    Folder,
    FolderKanban,
    ListChecks
} from 'lucide-react';
import { apiService } from '../../services/apiService';
import { DEFAULT_DEPARTMENTS, DEFAULT_POLICIES } from '../../data/defaultPolicies';
import MasterLibraryTree from '../documents/MasterLibraryTree';
import NewDocumentModal from '../documents/NewDocumentModal';
import CreateLibraryModal from '../documents/CreateLibraryModal';
import '../../App.css';
import './Sidebar.css';

export default function Sidebar() {
    const [collapsed, setCollapsed] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams] = useSearchParams();
    const { logout, user, hasPermission } = useAuth();

    // Active selected document or policy ID
    const [selectedDocId, setSelectedDocId] = useState(
        () => searchParams.get('docId') || searchParams.get('policy') || ''
    );

    // Search query for filtering libraries & documents
    const [searchQuery, setSearchQuery] = useState('');

    // Modal states
    const [isCreateLibraryModalOpen, setIsCreateLibraryModalOpen] = useState(false);
    const [isNewDocModalOpen, setIsNewDocModalOpen] = useState(false);
    const [selectedLibraryIdForDoc, setSelectedLibraryIdForDoc] = useState(null);

    const NAV_ITEMS = [
        {
            section: 'Governance Hub',
            items: [
                { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' }, 
                { id: 'task', label: 'Tasks', icon: ListChecks, path: '/demotask' },
                { id: 'changelogs', label: 'Change Management', icon: ShieldCheck, path: '/changelogs' },
                { id: 'templates', label: 'Policy Templates', icon: FolderKanban, path: '/templates' },
                { id: 'settings', label: 'Settings', icon: Settings, path: '/settings' }
            ]
        },  
    ];

    // Pinned libraries state (persisted in localStorage)
    const [pinnedDocIds, setPinnedDocIds] = useState(() => {
        try {
            const saved = localStorage.getItem('liblist_pinned_policies');
            if (saved) return JSON.parse(saved);
        } catch (_) { }
        return [];
    });

    // Sync selectedDocId with URL params
    useEffect(() => {
        const urlDoc = searchParams.get('docId') || searchParams.get('policy');
        if (urlDoc) {
            setSelectedDocId(urlDoc);
        }
    }, [searchParams]);

    // Sync selectedDocId when document is created elsewhere
    useEffect(() => {
        const handleDocCreated = (e) => {
            if (e.detail?.id) {
                setSelectedDocId(e.detail.id);
            }
        };
        window.addEventListener('liblist:document-created', handleDocCreated);
        return () => {
            window.removeEventListener('liblist:document-created', handleDocCreated);
        };
    }, []);

    // Document click -> Open document in DocumentManagementView
    const handleDocumentClick = (docId) => {
        setSelectedDocId(docId);
        navigate(`/documents?docId=${encodeURIComponent(docId)}`);
        window.dispatchEvent(new CustomEvent('liblist:open-document', { detail: docId }));
    };

    const handleNavClick = (path) => {
        navigate(path);
    };

    const handleLogout = async () => {
        await logout();
        navigate('/login', { replace: true });
    };

    const isActive = (path) => {
        return location.pathname === path;
    };

    // Filter nav items based on RBAC permissions
    const visibleGroups = NAV_ITEMS.map((group) => ({
        ...group,
        items: group.items.filter((item) => !item.module || hasPermission(item.module, 'read'))
    })).filter((group) => group.items.length > 0);

    return (
        <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
            {/* Logo Area */}
            <div className="sidebar-logo-area">
                <div className="sidebar-logo-icon">
                    <Building2 size={17} />
                </div>
                <span className="sidebar-logo-text">LibList Banking</span>
            </div>

            {/* Scrollable Navigation Area */}
            <nav className="sidebar-nav">
                {/* 1. GOVERNANCE HUB MODULES */}
                {visibleGroups.map((group) => (
                    <div key={group.section} className="sidebar-group">
                        <div className="sidebar-section-label">{group.section}</div>
                        {group.items.map((item) => {
                            const Icon = item.icon;
                            return (
                                <button
                                    key={item.id}
                                    className={`sidebar-nav-item ${isActive(item.path) ? 'active' : ''}`}
                                    onClick={() => handleNavClick(item.path)}
                                    title={collapsed ? item.label : undefined} 
                                >
                                    <Icon size={18} />
                                    <span className="nav-item-label">{item.label}</span>
                                </button>
                            );
                        })}
                    </div>
                ))}

                {/* 2. MASTER LIBRARY (Hierarchical Tree of Libraries, Documents & Sections) */}
                <div className="sidebar-section-header">
                    <div className="sidebar-section-title-wrap">
                        <Layers size={13} />
                        <span>Master Library</span>
                    </div>
                    {!collapsed && (
                        <button
                            type="button"
                            onClick={() => setIsCreateLibraryModalOpen(true)}
                            className="sidebar-action-icon-btn"
                            title="Add New Master Library"
                            aria-label="Add New Library"
                        >
                            <Plus size={13} strokeWidth={2.5} />
                        </button>
                    )}
                </div>

                {!collapsed && (
                    <>
                        {/* Search Filter */}
                        <div className="sidebar-search-box">
                            <Search size={12} className="sidebar-search-icon" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Filter libraries & documents..."
                                className="sidebar-search-input"
                            />
                            {searchQuery && (
                                <button
                                    type="button"
                                    onClick={() => setSearchQuery('')}
                                    className="sidebar-search-clear"
                                    title="Clear filter"
                                >
                                    <X size={11} />
                                </button>
                            )}
                        </div>

                        {/* Master Library Hierarchy Tree from PostgreSQL DB */}
                        <div className="sidebar-master-tree">
                            <MasterLibraryTree
                                searchQuery={searchQuery}
                                selectedDocId={selectedDocId}
                                onSelectDocument={handleDocumentClick}
                                onOpenCreateDocModal={(libId) => {
                                    setSelectedLibraryIdForDoc(libId);
                                    setIsNewDocModalOpen(true);
                                }}
                            />
                        </div>
                    </>
                )}
            </nav>

            {/* Sidebar Footer */}
            <div className="sidebar-footer">
                <button
                    className="sidebar-nav-item"
                    onClick={handleLogout}
                    title={collapsed ? 'Logout' : undefined}
                >
                    <LogOut size={18} />
                    <span className="nav-item-label">Logout</span>
                </button>

                <button
                    className="sidebar-nav-item"
                    onClick={() => setCollapsed((c) => !c)}
                    title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                    style={{ marginTop: '4px' }}
                >
                    {collapsed
                        ? <ChevronRight size={18} />
                        : <ChevronLeft size={18} />
                    }
                    <span className="nav-item-label">
                        {collapsed ? 'Expand' : 'Collapse'}
                    </span>
                </button>
            </div>

            {/* Modal: Create New Master Library (Triggered by + near Master Library) */}
            <CreateLibraryModal
                isOpen={isCreateLibraryModalOpen}
                onClose={() => setIsCreateLibraryModalOpen(false)}
                onLibraryCreated={(newLib) => {
                    // Tree reloads automatically via custom event
                }}
            />

            {/* Modal: Create / Ingest New Document (3 tabs: Direct-in system, Master library, Document uploads) */}
            <NewDocumentModal
                isOpen={isNewDocModalOpen}
                onClose={() => setIsNewDocModalOpen(false)}
                preselectedLibraryId={selectedLibraryIdForDoc}
                onDocumentCreated={(newDoc) => {
                    setIsNewDocModalOpen(false);
                    handleDocumentClick(newDoc.id);
                }}
            />
        </aside>
    );
}
