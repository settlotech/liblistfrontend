import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Menu,
  Building2,
  Search,
  Users,
  Bell,
  ChevronDown,
  LogOut,
  User,
  CheckCheck,
  Info,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { documentManagementApi } from '../../services/api/documentManagementApi';
import styles from './Home.module.css';

const formatTimeAgo = (dateStr) => {
  if (!dateStr) return '';
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(dateStr).toLocaleDateString([], { month: 'short', day: 'numeric' });
};

const Navbar = ({ onToggleSidebar, onToggleChatPanel, chatPanelOpen }) => {
  const { user, logout, hasPermission } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [policyQuery, setPolicyQuery] = useState('');
  const [policyResults, setPolicyResults] = useState([]);
  const [policySearchLoading, setPolicySearchLoading] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef(null);
  const searchInputRef = useRef(null);

  const canViewPolicyAccess =
    user?.isSuperAdmin ||
    (user?.roles || []).some(r => {
      const name = typeof r === 'string' ? r : r.role_name;
      return name?.toLowerCase() === 'super admin';
    }) ||
    Boolean(hasPermission?.('policy_access', 'read'));

  const dropdownRef = useRef(null);
  const notifRef = useRef(null);

  useEffect(() => {
    const query = policyQuery.trim();
    if (!query) {
      setPolicyResults([]);
      setPolicySearchLoading(false);
      return undefined;
    }
    let cancelled = false;
    const timer = setTimeout(async () => {
      setPolicySearchLoading(true);
      try {
        const response = await documentManagementApi.getDocuments({ search: query, limit: 8 });
        if (!cancelled) setPolicyResults(Array.isArray(response?.data) ? response.data : []);
      } catch (error) {
        if (!cancelled) setPolicyResults([]);
      } finally {
        if (!cancelled) setPolicySearchLoading(false);
      }
    }, 250);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [policyQuery]);

  useEffect(() => {
    const handleShortcut = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        searchInputRef.current?.focus();
        setSearchOpen(true);
      }
      if (event.key === 'Escape') setSearchOpen(false);
    };
    const handleOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) setSearchOpen(false);
    };
    window.addEventListener('keydown', handleShortcut);
    document.addEventListener('mousedown', handleOutside);
    return () => {
      window.removeEventListener('keydown', handleShortcut);
      document.removeEventListener('mousedown', handleOutside);
    };
  }, []);

  const openPolicy = (policy) => {
    setSearchOpen(false);
    setPolicyQuery('');
    navigate(`/documents/${policy.id}`);
  };

  const {
    notifications,
    unreadCount,
    permissionStatus,
    markAsRead,
    markAllAsRead,
  } = useNotifications();

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const displayName = user?.name || user?.email?.split('@')?.[0] || 'User';
  const rawRole = user?.role || user?.roles?.[0];
  const displayRole = (typeof rawRole === 'object' ? rawRole?.role_name : rawRole) || (user?.isSuperAdmin ? 'Super Admin' : 'User');
  const displayEmail = user?.email || '';

  return (
    <header className={styles.navbar}>
      {/* ── Left Side: Hamburger (collapse menu) + Brand Logo ── */}
      <div className={styles.navLeft}>
        <button
          type="button"
          className={styles.hamburgerBtn}
          title="Toggle Navigation Menu"
          aria-label="Toggle Navigation Menu"
          onClick={onToggleSidebar}
        >
          <Menu size={18} strokeWidth={2.2} />
        </button>

        <div className={styles.brand}>
          <div className={styles.brandIcon}>
            <Building2 size={18} strokeWidth={2.4} />
          </div>
          <span className={styles.brandTitle}>LibList</span>
        </div>
      </div>

      {/* ── Center: Search Bar ── */}
      <div className={styles.searchContainer} ref={searchRef}>
        <Search size={15} strokeWidth={2.2} className={styles.searchIcon} />
        <input
          type="text"
          className={styles.searchInput}
          placeholder="Ask LibList"
          value={policyQuery}
          ref={searchInputRef}
          aria-label="Search policies"
          aria-expanded={searchOpen && Boolean(policyQuery.trim())}
          onFocus={() => setSearchOpen(true)}
          onChange={(event) => { setPolicyQuery(event.target.value); setSearchOpen(true); }}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && policyResults[0]) openPolicy(policyResults[0]);
          }}
        />
        <span className={styles.searchShortcut}>Ctrl+K</span>
        {searchOpen && policyQuery.trim() && (
          <div className={styles.policySearchResults} role="listbox" aria-label="Policy search results">
            {policySearchLoading ? (
              <div className={styles.policySearchMessage}>Searching policies…</div>
            ) : policyResults.length ? policyResults.map((policy) => (
              <button key={policy.id} type="button" className={styles.policySearchResult} role="option" onClick={() => openPolicy(policy)}>
                <span className={styles.policyResultName}>{policy.document_name}</span>
                <span className={styles.policyResultMeta}>{policy.library_name || 'Policy'}{policy.status ? ` · ${policy.status}` : ''}</span>
              </button>
            )) : (
              <div className={styles.policySearchMessage}>No accessible policies found</div>
            )}
          </div>
        )}
      </div>

      {/* ── Right Side: Access + Bell + Hamburger for Chats & Shidney + Profile ── */}
      <div className={styles.navRight}>
        {canViewPolicyAccess && (
          <button
            type="button"
            className={styles.accessBtn}
            onClick={() => navigate('/settings?tab=policyaccess')}
            title="Manage Policy-Specific User Access Controls"
          >
            <Users size={15} strokeWidth={2} />
            <span>Bank Users & Access</span>
          </button>
        )}

        {/* ── Notification Bell with Popover ── */}
        <div style={{ position: 'relative' }} ref={notifRef}>
          <button
            type="button"
            className={`${styles.iconBtn} ${notifOpen ? styles.iconBtnActive : ''}`}
            title="Notifications"
            aria-label="Notifications"
            onClick={() => setNotifOpen((prev) => !prev)}
          >
            <Bell size={17} strokeWidth={2} />
            {unreadCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '4px',
                  right: '4px',
                  background: '#ef4444',
                  color: '#ffffff',
                  fontSize: '10px',
                  fontWeight: 700,
                  height: '16px',
                  minWidth: '16px',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0 4px',
                  lineHeight: 1
                }}
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: 0,
                width: '360px',
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
                zIndex: 1000,
                overflow: 'hidden'
              }}
            >
              <div
                style={{
                  padding: '12px 16px',
                  borderBottom: '1px solid #f1f5f9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: '#fafafa'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>Notifications</span>
                  {unreadCount > 0 && (
                    <span
                      style={{
                        background: '#e0f2fe',
                        color: '#0284c7',
                        fontSize: '11px',
                        fontWeight: 600,
                        padding: '2px 7px',
                        borderRadius: '12px'
                      }}
                    >
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={markAllAsRead}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#0060df',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <CheckCheck size={14} />
                    <span>Read All</span>
                  </button>
                )}
              </div>

              {/* Notifications List */}
              <div style={{ maxHeight: '380px', overflowY: 'auto' }}>
                {notifications.length === 0 ? (
                  <div
                    style={{
                      padding: '36px 16px',
                      textAlign: 'center',
                      color: '#94a3b8',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <Bell size={28} strokeWidth={1.5} color="#cbd5e1" />
                    <span style={{ fontSize: '13px' }}>No notifications yet</span>
                  </div>
                ) : (
                  notifications.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => {
                        if (!item.is_read) markAsRead(item.id);
                      }}
                      style={{
                        padding: '12px 16px',
                        borderBottom: '1px solid #f8fafc',
                        background: !item.is_read ? '#f0f7ff' : '#ffffff',
                        cursor: 'pointer',
                        display: 'flex',
                        gap: '12px',
                        alignItems: 'flex-start',
                        transition: 'background 0.15s ease'
                      }}
                    >
                      <div
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '8px',
                          background: !item.is_read ? '#e0f0fe' : '#f1f5f9',
                          color: !item.is_read ? '#0060df' : '#64748b',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          marginTop: '2px'
                        }}
                      >
                        <Info size={15} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                          <span style={{ fontSize: '13px', fontWeight: !item.is_read ? 700 : 600, color: '#0f172a' }}>
                            {item.title}
                          </span>
                          {!item.is_read && (
                            <span
                              style={{
                                width: '7px',
                                height: '7px',
                                borderRadius: '50%',
                                background: '#0060df',
                                flexShrink: 0
                              }}
                            />
                          )}
                        </div>
                        <p style={{ fontSize: '12px', color: '#475569', margin: '3px 0 4px', lineHeight: 1.4 }}>
                          {item.body}
                        </p>
                        <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                          {formatTimeAgo(item.created_at)}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Hamburger / Menu button right after the bell icon for Chats & Shidney */}
        <button
          type="button"
          className={`${styles.iconBtn} ${chatPanelOpen ? styles.iconBtnActive : ''}`}
          title="Chats & Shidney"
          aria-label="Chats & Shidney"
          onClick={onToggleChatPanel}
        >
          <Menu size={17} strokeWidth={2.2} />
        </button>

        {/* User Profile Pill & Dropdown */}
        <div className={styles.userProfileWrap} ref={dropdownRef}>
          <button
            type="button"
            className={styles.userBtn}
            onClick={() => setDropdownOpen((prev) => !prev)}
            aria-expanded={dropdownOpen}
          >
            <div className={styles.userAvatar}>
              {getInitials(displayName)}
            </div>
            <div className={styles.userInfo}>
              <div className={styles.userNameRow}>
                <span className={styles.userName}>{displayName}</span>
                <span
                  className={`${styles.userChevron} ${
                    dropdownOpen ? styles.userChevronOpen : ''
                  }`}
                >
                  <ChevronDown size={13} strokeWidth={2.5} />
                </span>
              </div>
              <span className={styles.userRole}>{displayRole}</span>
            </div>
          </button>

          {dropdownOpen && (
            <div className={styles.userDropdown}>
              <div className={styles.dropdownHeader}>
                <div className={styles.dropdownName}>{displayName}</div>
                <div className={styles.dropdownEmail}>{displayEmail}</div>
              </div>

              <button
                type="button"
                className={styles.dropdownItem}
                onClick={() => {
                  setDropdownOpen(false);
                  navigate('/settings');
                }}
              >
                <User size={14} strokeWidth={2} />
                <span>Profile & Preferences</span>
              </button>

              <div className={styles.dropdownDivider} />

              <button
                type="button"
                className={`${styles.dropdownItem} ${styles.logoutBtn}`}
                onClick={() => {
                  setDropdownOpen(false);
                  logout();
                }}
              >
                <LogOut size={14} strokeWidth={2} />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
