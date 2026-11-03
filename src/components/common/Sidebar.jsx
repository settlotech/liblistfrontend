import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
    LayoutDashboard,
    BookOpen,
    Users,
    Settings,
    BarChart3,
    FileText,
    Building2,
    ChevronLeft,
    ChevronRight,
    LogOut
} from 'lucide-react';
import '../../App.css';

// Note  : for RBAC for Future Module
//Navigation items definition.
// If an item defines a `module`, it is dynamically gated using RBAC:
// hasPermission(item.module, 'read')
 
const NAV_ITEMS = [
    {
        section: 'Workspace',
        items: [
            { id: 'documents', label: 'Documents', icon: FileText, path: '/documents', module: 'documents' }
        ]
    },
    {
        section: 'System',
        items: [
            { id: 'settings', label: 'Settings', icon: Settings, path: '/settings' }
        ]
    }
];

export default function Sidebar() {
    const [collapsed, setCollapsed] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const { logout, hasPermission } = useAuth();

    const isActive = (path) => location.pathname === path;

    const handleNavClick = (path) => {
        navigate(path);
    };

    const handleLogout = async () => {
        await logout();
        navigate('/login', { replace: true });
    };

    // Filter nav items based on dynamic RBAC module permissions
    const visibleGroups = NAV_ITEMS.map((group) => ({
        ...group,
        items: group.items.filter((item) => !item.module || hasPermission(item.module, 'read'))
    })).filter((group) => group.items.length > 0);

    return (
        <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
          
            <div className="sidebar-logo-area">
                <div className="sidebar-logo-icon">
                    <Building2 size={17} />
                </div>
                <span className="sidebar-logo-text">Liblist</span>
            </div>
 
            <nav className="sidebar-nav">
                {visibleGroups.map((group) => (
                    <div key={group.section}>
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
            </nav>
 
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
        </aside>
    );
}
