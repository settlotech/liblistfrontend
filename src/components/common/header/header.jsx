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
import "./Header.css";

const Header = () => {
    const [profileOpen, setProfileOpen] = useState(false);
    const [globlesearch, setGlobalSearch] = useState('');
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

    const displayName = user?.name || 'User';
    const displayRole = user?.roles?.[0]?.role_name || user?.role || 'Member';

    return (
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
                <button className="access-button">
                    <Users size={15} />
                    <span>Bank Users & Access</span>
                </button>

                <button className="header-icon-button notification" aria-label="Notifications">
                    <Bell size={17} />
                    <span className="notification-count">2</span>
                </button>

                <button className="header-icon-button" aria-label="Panel options">
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

                            <button className="profile-menu-item" onClick={() => setProfileOpen(false)}>
                                <UserRound size={15} />
                                <span>My Profile</span>
                            </button>

                            <button className="profile-menu-item" onClick={handleSettingsClick}>
                                <Settings size={15} />
                                <span>Settings</span>
                            </button>

                            <button className="profile-menu-item" onClick={() => setProfileOpen(false)}>
                                <ShieldCheck size={15} />
                                <span>Security</span>
                            </button>

                            <button className="profile-menu-item" onClick={() => setProfileOpen(false)}>
                                <CircleHelp size={15} />
                                <span>Help & Support</span>
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
    );
};

export default Header;
