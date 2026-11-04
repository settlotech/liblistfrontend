import { useState, useEffect, useRef } from "react";
import { useAuth } from "../../../context/AuthContext";
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
    ChevronDown
} from "lucide-react";
import BankUserManagerModal from "../../governance/BankUserManagerModal";
import NotificationsModal from "../../modals/NotificationsModal";
import "./Header.css";

const Header = () => {
    const [profileOpen, setProfileOpen] = useState(false);
    const [globlesearch, setGlobalSearch] = useState('');
    const [isBankUsersOpen, setIsBankUsersOpen] = useState(false);
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const profileRef = useRef(null);
    const { logout, user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        const handleOutsideClick = (event) => {
            if (profileRef.current && !profileRef.current.contains(event.target)) {
                setProfileOpen(false);
            }
        };
        document.addEventListener("mousedown", handleOutsideClick);
        return () => document.removeEventListener("mousedown", handleOutsideClick);
    }, []);

    useEffect(() => {
        const handleEscape = (event) => {
            if (event.key === "Escape") setProfileOpen(false);
        };
        document.addEventListener("keydown", handleEscape);
        return () => document.removeEventListener("keydown", handleEscape);
    }, []);

    const handleLogout = async () => {
        setProfileOpen(false);
        await logout();
        navigate('/login', { replace: true });
    };

    const handleSettingsClick = () => {
        setProfileOpen(false);
        navigate('/settings');
    };

    // Derive initials from user name
    const initials = user?.name
        ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
        : 'U';

    const displayName = user?.name || 'Marcus Vance';
    const displayRole = user?.roles?.[0]?.role_name || user?.role || 'Bank Administrator';

    return (
        <>
            <header className="app-header">
                <div className="header-left">
                    <div className="bank-info">
                        <span className="bank-name">Commonwealth Bank of Australia (CBA)</span>
                        <span className="bank-code">CBA</span>
                    </div>
                </div>

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

                <div className="header-right">
                    <button 
                        className="access-button"
                        onClick={() => setIsBankUsersOpen(true)}
                        title="Manage institutional bank users & access permissions"
                    >
                        <Users size={15} />
                        <span>Bank Users & Access</span>
                    </button>

                    <button 
                        className="header-icon-button notification" 
                        aria-label="Notifications"
                        onClick={() => setIsNotificationsOpen(true)}
                        title="View compliance notifications & maker-checker queue"
                    >
                        <Bell size={17} />
                        <span className="notification-count">2</span>
                    </button>

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
                                    <span>Settings & RBAC</span>
                                </button>

                                <button className="profile-menu-item" onClick={() => { setProfileOpen(false); navigate('/changelogs'); }}>
                                    <ShieldCheck size={15} />
                                    <span>Audit & Change Logs</span>
                                </button>

                                <button className="profile-menu-item" onClick={() => { setProfileOpen(false); navigate('/tasks'); }}>
                                    <CircleHelp size={15} />
                                    <span>APRA Compliance Help</span>
                                </button>

                                <div className="profile-menu-divider" />

                                <button className="profile-menu-item logout-item" onClick={handleLogout}>
                                    <LogOut size={15} />
                                    <span>Logout</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {/* Bank Users & Access Control Matrix Modal */}
            <BankUserManagerModal
                isOpen={isBankUsersOpen}
                onClose={() => setIsBankUsersOpen(false)}
                currentUser={user || { name: displayName, role: displayRole, roleType: 'manager' }}
            />

            {/* Notifications & Queue Modal */}
            <NotificationsModal
                isOpen={isNotificationsOpen}
                onClose={() => setIsNotificationsOpen(false)}
                currentUser={user || { name: displayName, role: displayRole, roleType: 'manager' }}
            />
        </>
    );
};

export default Header;
