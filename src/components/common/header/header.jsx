import { useState, useEffect, useRef } from "react";
import { useAuth } from "../../../context/AuthContext";
import { useNotifications } from "../../../context/NotificationContext";
import { useNavigate } from "react-router-dom";
import {
    Search,
    Users,
    Bell,
    PanelRightClose,
    UserRound,
    Settings,
    ShieldCheck,
    CircleHelp,
    LogOut,
    ChevronDown,
    CheckCheck,
    Sparkles,
    Info,
} from "lucide-react";
import BankUserManagerModal from "../../governance/BankUserManagerModal";
import "./Header.css";

const formatTimeAgo = (dateStr) => {
    if (!dateStr) return '';
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return new Date(dateStr).toLocaleDateString([], { month: 'short', day: 'numeric' });
};

const Header = () => {
    const [profileOpen, setProfileOpen] = useState(false);
    const [notifOpen, setNotifOpen] = useState(false);
    const [globlesearch, setGlobalSearch] = useState('');
    const [isBankUsersOpen, setIsBankUsersOpen] = useState(false);
    const [isSendingDemo, setIsSendingDemo] = useState(false);

    const profileRef = useRef(null);
    const notifRef = useRef(null);

    const { logout, user } = useAuth();
    const {
        notifications,
        unreadCount,
        permissionStatus, 
        markAsRead,
        markAllAsRead, 
    } = useNotifications();

    const navigate = useNavigate();

    // Close dropdowns on outside click
    useEffect(() => {
        const handleOutsideClick = (event) => {
            if (profileRef.current && !profileRef.current.contains(event.target)) {
                setProfileOpen(false);
            }
            if (notifRef.current && !notifRef.current.contains(event.target)) {
                setNotifOpen(false);
            }
        };
        document.addEventListener("mousedown", handleOutsideClick);
        return () => document.removeEventListener("mousedown", handleOutsideClick);
    }, []);

    // Close on Escape key
    useEffect(() => {
        const handleEscape = (event) => {
            if (event.key === "Escape") {
                setProfileOpen(false);
                setNotifOpen(false);
            }
        };
        document.addEventListener("keydown", handleEscape);
        return () => document.removeEventListener("keydown", handleEscape);
    }, []);

    const handleLogout = async () => {
        setProfileOpen(false);
        setNotifOpen(false);
        await logout();
        navigate('/login', { replace: true });
    };

    const handleSettingsClick = () => {
        setProfileOpen(false);
        setNotifOpen(false);
        navigate('/settings');
    };

    // Derive initials from user name
    const initials = user?.name
        ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
        : 'U';

    const displayName = user?.name || 'Marcus Vance';
    const displayRole = user?.roles?.[0]?.role_name || user?.role || 'Bank Administrator';

    return (
        <header className="app-header">
            {/* Left Section */}
            <div className="header-left">
                <div className="bank-info">
                    <span className="bank-name">Commonwealth Bank of Australia (CBA)</span>
                    <span className="bank-code">CBA</span>
                </div>
            </div>

            {/* Search Bar */}
            <div className="header-search">
                <Search className="search-icon" size={16} />
                <input
                    type="text"
                    placeholder="Search policies, operational clauses, SLAs..."
                    value={globlesearch}
                    onChange={(e) => setGlobalSearch(e.target.value)}
                />
                <span className="search-shortcut">Ctrl+K</span>
            </div>

            {/* Right Section */}
            <div className="header-right">
                <button
                    className="access-button"
                    onClick={() => setIsBankUsersOpen(true)}
                    title="Manage institutional bank users & access permissions"
                >
                    <Users size={15} />
                    <span>Bank Users &amp; Access</span>
                </button>

                {/* ── Notification Bell & Popover ── */}
                <div className="notification-dropdown" ref={notifRef}>
                    <button
                        className="header-icon-button notification"
                        aria-label="Notifications"
                        onClick={() => setNotifOpen((prev) => !prev)}
                        title="View compliance notifications & maker-checker queue"
                    >
                        <Bell size={17} />
                        {unreadCount > 0 && (
                            <span className="notification-count">
                                {unreadCount > 99 ? '99+' : unreadCount}
                            </span>
                        )}
                    </button>

                    {notifOpen && (
                        <div className="notification-popover">
                            <div className="notif-popover-header">
                                <div className="notif-header-title">
                                    <span>Notifications</span>
                                    {unreadCount > 0 && (
                                        <span className="notif-count-pill">{unreadCount} new</span>
                                    )}
                                </div>
                                <div className="notif-header-actions">
                                    {unreadCount > 0 && (
                                        <button
                                            type="button"
                                            className="btn-notif-action"
                                            onClick={markAllAsRead}
                                            title="Mark all notifications as read"
                                        >
                                            <CheckCheck size={13} />
                                            <span>Read All</span>
                                        </button>
                                    )}
                                </div>
                            </div>

                            {permissionStatus !== 'granted' && (
                                <div className="notif-permission-banner">
                                    <span>Enable browser push notifications</span>
                                </div>
                            )}

                            {/* Notifications List */}
                            <div className="notif-list-body">
                                {notifications.length === 0 ? (
                                    <div className="notif-empty-state">
                                        <Bell size={28} strokeWidth={1.5} />
                                        <span>No notifications yet</span>
                                    </div>
                                ) : (
                                    notifications.map((item) => (
                                        <div
                                            key={item.id}
                                            className={`notif-item-row ${!item.is_read ? 'unread' : ''}`}
                                            onClick={() => {
                                                if (!item.is_read) markAsRead(item.id);
                                            }}
                                        >
                                            <div className="notif-item-icon">
                                                <Info size={15} />
                                            </div>
                                            <div className="notif-item-content">
                                                <div className="notif-item-title">
                                                    <span>{item.title}</span>
                                                    {!item.is_read && <span className="notif-unread-dot" />}
                                                </div>
                                                <p className="notif-item-body">{item.body}</p>
                                                <span className="notif-item-time">
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

                <button
                    className="header-icon-button"
                    aria-label="Panel options"
                    onClick={() => navigate('/settings')}
                    title="Open System Settings & RBAC"
                >
                    <PanelRightClose size={17} />
                </button>

                <div className="profile-dropdown" ref={profileRef}>
                    <button
                        className="user-profile"
                        onClick={() => setProfileOpen((prev) => !prev)}
                        aria-expanded={profileOpen}
                        aria-haspopup="true"
                    >
                        <div className="user-avatar">{initials}</div>
                        <div className="user-details">
                            <span className="user-name">{displayName}</span>
                            <span className="user-role">{displayRole}</span>
                        </div>
                        <ChevronDown size={13} className={`profile-arrow ${profileOpen ? "rotate" : ""}`} />
                    </button>

                    {profileOpen && (
                        <div className="profile-menu">
                            <div className="profile-menu-header">
                                <div className="user-avatar large">{initials}</div>
                                <div className="profile-info">
                                    <h4>{displayName}</h4>
                                    <p>{displayRole}</p>
                                </div>
                            </div>

                            <div className="profile-menu-divider" />

                            <button className="profile-menu-item" onClick={handleSettingsClick}>
                                <UserRound size={15} />
                                <span>My Profile</span>
                            </button>

                            <button className="profile-menu-item" onClick={handleSettingsClick}>
                                <Settings size={15} />
                                <span>Settings</span>
                            </button>

                            <button className="profile-menu-item" onClick={() => { setProfileOpen(false); navigate('/changelogs'); }}>
                                <ShieldCheck size={15} />
                                <span>Audit &amp; Change Logs</span>
                            </button>

                            <button className="profile-menu-item" onClick={() => { setProfileOpen(false); navigate('/tasks'); }}>
                                <CircleHelp size={15} />
                                <span>APRA Compliance Help</span>
                            </button>

                            <div className="profile-menu-divider" />

                            <button className="profile-menu-item logout-item" onClick={handleLogout}>
                                <LogOut size={15} />
                                <span>Sign Out</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Bank User Manager Modal */}
            <BankUserManagerModal
                isOpen={isBankUsersOpen}
                onClose={() => setIsBankUsersOpen(false)}
                currentUser={user}
            />
        </header>
    );
};

export default Header;
