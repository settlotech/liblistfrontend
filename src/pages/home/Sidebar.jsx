import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutGrid,
  ListTodo,
  ShieldCheck,
  FileText,
  FileSpreadsheet,
  Settings,
  Pin,
  PinOff,
  Link2,
  Layers,
  Plus,
  Search,
  Highlighter,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { documentManagementApi } from '../../services/api/documentManagementApi';
import CreateLibraryModal from '../../components/documents/CreateLibraryModal';
import MasterLibraryTree from '../../components/documents/MasterLibraryTree';
import styles from './Home.module.css';

const Sidebar = ({ isOpen, onToggle }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isSuperAdmin = user?.isSuperAdmin || (user?.roles || []).some(r => {
    const name = typeof r === 'string' ? r : r.role_name;
    return name?.toLowerCase() === 'super admin';
  });
  const canCreateLibrary = isSuperAdmin || (user?.permissionStrings || user?.permissions || []).includes('libraries:create');

  const workspaceLinks = [
    { name: 'Dashboard', path: '/dashboard', icon: <LayoutGrid size={17} strokeWidth={2.2} /> },
    { name: 'Tasks Workspace', path: '/tasks', icon: <ListTodo size={17} strokeWidth={2.2} /> },
    { name: 'Change Management', path: '/change-management', icon: <ShieldCheck size={17} strokeWidth={2.2} /> },
    { name: 'Notes', path: '/notes', icon: <FileText size={17} strokeWidth={2.2} /> },
    { name: 'Annotations', path: '/annotations', icon: <Highlighter size={17} strokeWidth={2.2} /> },
    // { name: 'Policy Templates', path: '/templates', icon: <FileSpreadsheet size={17} strokeWidth={2.2} /> },
    { name: 'Settings', path: '/settings', icon: <Settings size={17} strokeWidth={2.2} /> },
  ];

  const [activePath, setActivePath] = useState(location.pathname);
  const [filterText, setFilterText] = useState('');
  const [isCreateLibModalOpen, setIsCreateLibModalOpen] = useState(false);

  useEffect(() => {
    setActivePath(location.pathname);
  }, [location.pathname]);

  // Extract selected document ID from current URL (/documents/:id or ?docId=...)
  const selectedDocId = useMemo(() => {
    const docMatch = location.pathname.match(/\/documents\/([0-9a-fA-F-]+)/);
    if (docMatch && docMatch[1] && docMatch[1] !== 'create') {
      return docMatch[1];
    }
    const params = new URLSearchParams(location.search);
    return params.get('docId') || null;
  }, [location.pathname, location.search]);

  const [pinnedPolicies, setPinnedPolicies] = useState([]);
  const [isLoadingPinned, setIsLoadingPinned] = useState(false);

  // Fetch pinned policies for authenticated user
  const loadPinnedPolicies = useCallback(async () => {
    try {
      setIsLoadingPinned(true);
      const res = await documentManagementApi.getPinnedPolicies();
      setPinnedPolicies(res?.data || []);
    } catch (err) {
      console.error('Failed to load pinned policies:', err);
    } finally {
      setIsLoadingPinned(false);
    }
  }, []);

  useEffect(() => {
    loadPinnedPolicies();
  }, [loadPinnedPolicies]);

  // Real-time synchronization across app when pin/unpin occurs
  useEffect(() => {
    const handlePinChange = () => {
      loadPinnedPolicies();
    };
    window.addEventListener('policyPinnedChanged', handlePinChange);
    return () => window.removeEventListener('policyPinnedChanged', handlePinChange);
  }, [loadPinnedPolicies]);

  const handleUnpin = async (docId, e) => {
    e.stopPropagation();
    // Optimistic UI update
    setPinnedPolicies((prev) => prev.filter((p) => p.id !== docId));
    try {
      await documentManagementApi.unpinPolicy(docId);
      window.dispatchEvent(
        new CustomEvent('policyPinnedChanged', {
          detail: { documentId: docId, isPinned: false },
        })
      );
    } catch (err) {
      console.error('Failed to unpin policy:', err);
      loadPinnedPolicies();
    }
  };

  const handleDocumentSelect = (doc) => {
    const id = typeof doc === 'object' ? doc?.id : doc;
    navigate(`/documents/${id}`);
  };

  const handleSectionSelect = (section, doc) => {
    const docId = typeof doc === 'object' ? doc?.id : doc;
    const secId = typeof section === 'object' ? section?.id : section;
    navigate(`/documents/${docId}?sectionId=${secId}`);
  };

  return (
    <>
      <aside className={`${styles.sidebar} ${!isOpen ? styles.sidebarClosed : ''}`}>
        <div className={styles.sidebarScrollContent}>
          {/* ── Section: PERSONAL WORKSPACE ── */}
          <div className={styles.navSection}>
            <div className={styles.sectionHeader}>UserList</div>
            {workspaceLinks.map((item) => {
              const isActive = activePath === item.path || (item.path === '/home' && activePath === '/');
              return (
                <button
                  key={item.name}
                  type="button"
                  className={`${styles.navLink} ${
                    isActive ? styles.navLinkActive : ''
                  }`}
                  onClick={() => {
                    navigate(item.path);
                  }}
                >
                  <span className={styles.navIcon}>{item.icon}</span>
                  <span className={styles.navLabel}>{item.name}</span>
                </button>
              );
            })}
          </div>

          {/* ── Section: PINNED LIBRARIES / POLICIES ── */}
          <div className={styles.navSection}>
            <div className={styles.sectionHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Pin size={14} strokeWidth={2.5} color="var(--btn-primary-bg, #0060df)" />
                <span style={{ color: 'var(--btn-primary-bg, #0060df)' }}>PinList</span>
              </div>
              {pinnedPolicies.length > 0 && (
                <span style={{ fontSize: '10.5px', background: '#eff6ff', color: '#1d4ed8', padding: '1px 6px', borderRadius: '99px', fontWeight: 600 }}>
                  {pinnedPolicies.length}
                </span>
              )}
            </div>

            {pinnedPolicies.length === 0 ? (
              <div className={styles.emptyPinned}>
                {isLoadingPinned ? 'Loading pinned...' : 'No pinned policies. Pin policies from viewer to access here.'}
              </div>
            ) : (
              pinnedPolicies.map((doc) => {
                const isSelected = selectedDocId === doc.id;
                return (
                  <div
                    key={doc.id}
                    className={`${styles.pinnedCard} ${isSelected ? styles.pinnedCardActive : ''}`}
                    onClick={() => navigate(`/documents/${doc.id}`)}
                    title={`${doc.document_name} (${doc.library_name || 'Library'})`}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className={styles.pinnedLeft}>
                      <FileText size={13} strokeWidth={2} color={isSelected ? 'var(--btn-primary-bg, #0060df)' : '#64748b'} />
                      <span className={styles.pinnedTitle}>
                        {doc.document_name}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span className={styles.versionBadge}>v{doc.current_version_number || '1.0'}</span>
                      <button
                        type="button"
                        className={styles.unpinBtn}
                        onClick={(e) => handleUnpin(doc.id, e)}
                        title="Unpin policy"
                      >
                        <PinOff size={12} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* ── Section: MASTER LIBRARY ── */}
          <div className={styles.navSection}>
            <div className={styles.sectionHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Layers size={15} strokeWidth={2.2} color="var(--btn-primary-bg, #0060df)" />
                <span style={{ color: 'var(--btn-primary-bg, #0060df)' }}>LibList</span>
              </div>
              {canCreateLibrary && (
                <button
                  type="button"
                  className={styles.addBtn}
                  title="Create Library"
                  aria-label="Create Library"
                  onClick={() => setIsCreateLibModalOpen(true)}
                >
                  <Plus size={13} strokeWidth={2.5} />
                </button>
              )}
            </div>

            {/* Filter libraries input */}
            <div className={styles.librarySearchBox}>
              <Search size={13} strokeWidth={2.2} className={styles.librarySearchIcon} />
              <input
                type="text"
                placeholder="Filter libraries..."
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                className={styles.librarySearchInput}
              />
            </div>

            {/* Master Library Tree with live backend data */}
            <div className={styles.libraryTree}>
              <MasterLibraryTree
                selectedDocId={selectedDocId}
                searchQuery={filterText}
                onSelectDocument={handleDocumentSelect}
                onSelectSection={handleSectionSelect}
                onOpenCreateDocModal={(libId) => {
                  navigate(`/documents/create?libraryId=${libId}`);
                }}
              />
            </div>
          </div>
        </div>
      </aside>

      {/* Modal to create a new Master Library */}
      <CreateLibraryModal
        isOpen={isCreateLibModalOpen}
        onClose={() => setIsCreateLibModalOpen(false)}
        onLibraryCreated={(newLib) => {
          setIsCreateLibModalOpen(false);
        }}
      />
    </>
  );
};

export default Sidebar;
