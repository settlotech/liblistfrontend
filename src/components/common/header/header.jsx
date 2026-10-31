
import { useState, useEffect, useRef } from "react";
import { useAuth } from "../../../context/AuthContext";
import {
    PanelLeftClose,
    Building2,
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
    const { logout } = useAuth();

    useEffect(() => {
        const handleOutsideClick = (event) => {
            if (profileRef.current && !profileRef.current.contains(event.target)
            ) {
                setProfileOpen(false);
            }
        };

        document.addEventListener("mousedown", handleOutsideClick);

        return () => {
            document.removeEventListener("mousedown", handleOutsideClick);
        };
    }, []);


    useEffect(() => {
        const handleEscape = (event) => {
            if (event.key === "Escape") {
                setProfileOpen(false);
            }
        };

        document.addEventListener("keydown", handleEscape);

        return () => {
            document.removeEventListener("keydown", handleEscape);
        };
    }, []);

    const handleLogout = async () => {
        setProfileOpen(false);
        await logout();
    };

    const onGloblesearch = (event) => {
        setGlobalSearch(event.target.value);
        console.log(globlesearch);
    }

    return (
        <header className="app-header">

            <div className="header-left">
                <button className="sidebar-toggle" aria-label="Toggle sidebar">
                    <PanelLeftClose size={18} />
                </button>
                <div className="bank-info">
                    <Building2 className="bank-icon" size={17} />

                    <span className="bank-name">
                        Commonwealth Bank of Australia (CBA)
                    </span>

                    <span className="bank-code">CBA</span>
                </div>

            </div>
 
            <div className="header-search">
                <Search className="search-icon" size={18} />
                <input type="text" placeholder="Search policies, operational clauses, SLAs..." value={globlesearch} onChange={(event) => onGloblesearch(event)} />
                <span className="search-shortcut">Ctrl+K</span>
            </div>
 
            <div className="header-right">

                <button className="access-button">
                    <Users size={16} />
                    <span>Bank Users & Access</span>
                </button>

                <button
                    className="header-icon-button notification"
                    aria-label="Notifications"
                >
                    <Bell size={18} />
                    <span className="notification-count">2</span>
                </button>

                <button
                    className="header-icon-button panel-button"
                    aria-label="Panel options"
                >
                    <PanelRightClose size={18} />
                </button>

                <div className="profile-dropdown" ref={profileRef}>

                    <button
                        className="user-profile"
                        onClick={() => setProfileOpen((prev) => !prev)}
                        aria-expanded={profileOpen}
                        aria-haspopup="true"
                    >
                        <div className="user-avatar">MV</div>

                        <div className="user-details">
                            <span className="user-name">Marcus Vance</span>
                            <span className="user-role">Bank Owner</span>
                        </div>

                        <ChevronDown
                            size={14}
                            className={`profile-arrow ${profileOpen ? "rotate" : ""
                                }`}
                        />
                    </button>

                    {profileOpen && (
                        <div className="profile-menu">
                            <div className="profile-menu-header">
                                <div className="user-avatar large">MV</div>
                                <div className="profile-info">
                                    <h4>Marcus Vance</h4>
                                    <p>Bank Owner</p>
                                </div>
                            </div>

                            <div className="profile-menu-divider" />
                            <button
                                className="profile-menu-item"
                                onClick={() => setProfileOpen(false)}
                            >
                                <UserRound size={16} />
                                <span>My Profile</span>
                            </button>

                            <button
                                className="profile-menu-item"
                                onClick={() => setProfileOpen(false)}
                            >

                                <Settings size={16} />
                                <span>Account Settings</span>
                            </button>

                            <button
                                className="profile-menu-item"
                                onClick={() => setProfileOpen(false)}
                            >
                                <ShieldCheck size={16} />
                                <span>Security</span>
                            </button>

                            <button
                                className="profile-menu-item"
                                onClick={() => setProfileOpen(false)}
                            >
                                <CircleHelp size={16} />
                                <span>Help & Support</span>
                            </button>

                            <div className="profile-menu-divider" />

                           
                            <button
                                className="profile-menu-item logout-item"
                                onClick={handleLogout}
                            >
                                <LogOut size={16} />
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
