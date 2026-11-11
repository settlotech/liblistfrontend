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
    CreditCard,
    Users,
    Landmark,
    Scale,
    UserCheck,
    Wrench,
    Megaphone,
    Laptop,
    FolderKanban,
    ListChecks,
    Pencil, Trash2, Copy, FileEdit
} from 'lucide-react';
import { apiService } from '../../services/apiService';
import { DEFAULT_DEPARTMENTS, DEFAULT_POLICIES } from '../../data/defaultPolicies';
import AddPolicyModal from '../modals/AddPolicyModal/AddPolicyModal';
import '../../App.css';
import './Sidebar.css';

// Clean icon resolver for banking departments
const getDeptIcon = (iconName) => {
    switch (iconName) {
        case 'credit-card': return <CreditCard size={13} />;
        case 'landmark':
        case 'piggy-bank': return <Landmark size={13} />;
        case 'user-check': return <UserCheck size={13} />;
        case 'shield': return <ShieldCheck size={13} />;
        case 'scale': return <Scale size={13} />;
        case 'users':
        case 'headset': return <Users size={13} />;
        case 'laptop':
        case 'cpu': return <Laptop size={13} />;
        case 'megaphone': return <Megaphone size={13} />;
        case 'file-text': return <FileText size={13} />;
        case 'folder-kanban': return <FolderKanban size={13} />;
        case 'tool': return <Wrench size={13} />;
        default: return <Folder size={13} />;
    }
};



const PRIMARY_DEPT_IDS = ['credit-cards', 'retail-lending', 'onboarding', 'security', 'legal-compliance'];

export default function Sidebar() {
    const [collapsed, setCollapsed] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams] = useSearchParams();
    const { logout, user, hasPermission } = useAuth();
 

    // Active selected policy ID (tracked from URL or events)
    const [selectedPolicyId, setSelectedPolicyId] = useState(
        () => searchParams.get('policy') || 'credit-card-limits-policy'
    );

    // Departments & Policies state for Master Library
    const [departments, setDepartments] = useState(DEFAULT_DEPARTMENTS);
    const [policies, setPolicies] = useState(DEFAULT_POLICIES);
    const [searchQuery, setSearchQuery] = useState('');

    // Expanded departments in Master Library (defaults to key banking categories)
    const [expandedDeptIds, setExpandedDeptIds] = useState([
        'credit-cards',
        'retail-lending',
        'onboarding',
        'security',
        'legal-compliance'
    ]);


    const NAV_ITEMS = [
        {
            section: 'Personal wrokspace',
            items: [
                { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
                { id: 'task', label: 'Tasks Workspace', icon: ListChecks, path: '/demotask' },
                { id: 'changelogs', label: 'Change Management', icon: ShieldCheck, path: '/changelogs' },
                { id: 'notes', label: 'Notes', icon: FileText, path: '/notes' },
        
                { id: 'templates', label: 'Policy Templates', icon: FileText, path: '/templates' }
            ]
        },
        {
            section: 'Administration',
            items: [
                { id: 'settings', label: 'Settings', icon: Settings, path: '/settings' }
            ]
        }
    ];

    const availableTabs = useMemo(() => [NAV_ITEMS]);
    // Pinned libraries state (persisted in localStorage)
    const [pinnedPolicyIds, setPinnedPolicyIds] = useState(() => {
        try {
            const saved = localStorage.getItem('liblist_pinned_policies');
            if (saved) return JSON.parse(saved);
        } catch (_) { }
        return ['personal-loans-assessment-sop', 'aml-ctf-screening-policy'];
    });

    // Add Policy Modal state
    const [isAddPolicyModalOpen, setIsAddPolicyModalOpen] = useState(false);
    const [preselectedDept, setPreselectedDept] = useState({ id: null, name: '' });

    // Sync selectedPolicyId with URL param
    useEffect(() => {
        const urlPol = searchParams.get('policy');
        if (urlPol) {
            setSelectedPolicyId(urlPol);
        }
    }, [searchParams]);

    // Load hierarchy and lightweight policies
    const loadData = useCallback(async () => {
        try {
            const userRole = user?.roleType || 'employee';
            const [deptData, polData] = await Promise.all([
                apiService.getHierarchy().catch(() => null),
                apiService.getPolicies('all', '', userRole).catch(() => null)
            ]);

            if (deptData && Array.isArray(deptData) && deptData.length > 0) {
                const enriched = deptData.map(d => {
                    if (['credit-cards', 'retail-lending', 'onboarding', 'security', 'legal-compliance'].includes(d.id)) {
                        return { ...d, count: Math.max(d.count || 0, 2) };
                    }
                    return d;
                });
                setDepartments(enriched);
            } else {
                setDepartments(DEFAULT_DEPARTMENTS);
            }

            if (polData && Array.isArray(polData) && polData.length > 0) {
                setPolicies(polData);
            } else {
                setPolicies(DEFAULT_POLICIES);
            }
        } catch (err) {
            console.warn('Failed to load sidebar library data:', err);
            setDepartments(DEFAULT_DEPARTMENTS);
            setPolicies(DEFAULT_POLICIES);
        }
    }, [user?.roleType]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // Listen for custom events to stay in sync with Home & Workspace
    useEffect(() => {
        const handleSelectPolicyEvent = (e) => {
            if (e.detail) {
                setSelectedPolicyId(e.detail);
            }
        };

        const handlePolicyCreatedEvent = () => {
            loadData();
        };

        const handlePinnedUpdatedEvent = (e) => {
            if (Array.isArray(e.detail)) {
                setPinnedPolicyIds(e.detail);
            }
        };

        window.addEventListener('liblist:select-policy', handleSelectPolicyEvent);
        window.addEventListener('liblist:policy-created', handlePolicyCreatedEvent);
        window.addEventListener('liblist:pinned-updated', handlePinnedUpdatedEvent);

        return () => {
            window.removeEventListener('liblist:select-policy', handleSelectPolicyEvent);
            window.removeEventListener('liblist:policy-created', handlePolicyCreatedEvent);
            window.removeEventListener('liblist:pinned-updated', handlePinnedUpdatedEvent);
        };
    }, [loadData]);

    // Toggle Pin / Unpin
    const handleTogglePin = (policyId, e) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        setPinnedPolicyIds(prev => {
            const next = prev.includes(policyId)
                ? prev.filter(id => id !== policyId)
                : [...prev, policyId];
            try {
                localStorage.setItem('liblist_pinned_policies', JSON.stringify(next));
            } catch (_) { }
            window.dispatchEvent(new CustomEvent('liblist:pinned-updated', { detail: next }));
            return next;
        });
    };

    // Right-click context menu toggles pin
    const handleContextMenu = (policyId, e) => {
        e.preventDefault();
        e.stopPropagation();
        handleTogglePin(policyId, e);
    };

    // Toggle Department expansion
    const toggleDeptExpand = (deptId, e) => {
        if (e) e.stopPropagation();
        setExpandedDeptIds(prev =>
            prev.includes(deptId)
                ? prev.filter(id => id !== deptId)
                : [...prev, deptId]
        );
    };

    // Policy Click -> Navigate to /home with policy query parameter
    const handlePolicyClick = (policyId) => {
        setSelectedPolicyId(policyId);
        navigate(`/home?policy=${encodeURIComponent(policyId)}`);
        window.dispatchEvent(new CustomEvent('liblist:select-policy', { detail: policyId }));
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

    // Filter nav items based on dynamic RBAC permissions
    const visibleGroups = NAV_ITEMS.map((group) => ({
        ...group,
        items: group.items.filter((item) => !item.module || hasPermission(item.module, 'read'))
    })).filter((group) => group.items.length > 0);

    // Active primary categories
    const activeDepartments = useMemo(() => {
        return departments.filter(d => PRIMARY_DEPT_IDS.includes(d.id) || (d.count && d.count > 0));
    }, [departments]);

    // Search filter
    const displayedDepartments = useMemo(() => {
        const query = searchQuery.toLowerCase().trim();
        if (!query) return activeDepartments;
        return activeDepartments.filter(d =>
            d.name.toLowerCase().includes(query) ||
            policies.some(p => p.department_id === d.id && p.title.toLowerCase().includes(query))
        );
    }, [activeDepartments, policies, searchQuery]);

    // Pinned policies objects
    const pinnedPolicies = useMemo(() => {
        return policies.filter(p => pinnedPolicyIds.includes(p.id));
    }, [policies, pinnedPolicyIds]);

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
                {/* 1. GOVERNANCE HUB MODULES (Change Management, Tasks, Templates) */}
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

             

                {/* 2. PINNED LIBRARIES */}
                <div className="sidebar-section-header">
                    <div className="sidebar-section-title-wrap">
                        <Pin size={12} />
                        <span>Pinned Libraries</span>
                    </div>
                </div>

                {!collapsed && (
                    <div className="sidebar-pinned-list">
                        {pinnedPolicies.length === 0 ? (
                            <div className="sidebar-empty-hint">
                                None selected
                                <span style={{ display: 'block', fontSize: '9.5px', marginTop: '2px', opacity: 0.8 }}>
                                    Right-click any policy to pin
                                </span>
                            </div>
                        ) : (
                            pinnedPolicies.map((pol) => {
                                const isSelected = (location.pathname === '/home' || location.pathname === '/documents') && selectedPolicyId === pol.id;
                                return (
                                    <div
                                        key={`pinned-${pol.id}`}
                                        className={`sidebar-pinned-item ${isSelected ? 'active' : ''}`}
                                        onClick={() => handlePolicyClick(pol.id)}
                                        onContextMenu={(e) => handleContextMenu(pol.id, e)}
                                        title={`${pol.title} (Right-click to unpin)`}
                                    >
                                        <div className="sidebar-pinned-content">
                                            <LinkIcon size={12} style={{ color: isSelected ? 'var(--btn-primary-bg)' : 'var(--text-muted)', flexShrink: 0 }} />
                                            <span className="sidebar-pinned-title">{pol.title}</span>
                                        </div>
                                        <div className="sidebar-pinned-meta">
                                            <span className="sidebar-ver-tag">v{pol.version || '1.0'}</span>
                                            <button
                                                type="button"
                                                onClick={(e) => handleTogglePin(pol.id, e)}
                                                className="sidebar-unpin-btn"
                                                title="Unpin"
                                            >
                                                <X size={11} />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                )}

                {/* 3. MASTER LIBRARY (Renamed from Library List, with hierarchy tree) */}
                <div className="sidebar-section-header">
                    <div className="sidebar-section-title-wrap">
                        <Layers size={13} />
                        <span>Master Library</span>
                    </div>
                    {!collapsed && (
                        <button
                            type="button"
                            onClick={() => {
                                setPreselectedDept({ id: null, name: '' });
                                setIsAddPolicyModalOpen(true);
                            }}
                            className="sidebar-action-icon-btn"
                            title="Create or Ingest Operational Policy"
                            aria-label="Create Policy"
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
                                placeholder="Filter libraries..."
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

                        {/* CBA Bank Node Card */}
                        <div className="sidebar-bank-card">
                            <span className="sidebar-bank-card-title">
                                <Building2 size={13} style={{ color: 'var(--btn-primary-bg)' }} />
                                <span>CBA - Retail Standards</span>
                            </span>
                            <span className="sidebar-bank-card-badge">
                                {policies.length} Policies
                            </span>
                        </div>

                        {/* Departments Hierarchy Tree */}
                        <div className="sidebar-master-tree">
                            {displayedDepartments.map((dept) => {
                                const isExpanded = expandedDeptIds.includes(dept.id);
                                const deptPolicies = policies.filter(p => p.department_id === dept.id);

                                return (
                                    <div key={dept.id} className="sidebar-dept-container">
                                        {/* Department Row */}
                                        <div
                                            className="sidebar-dept-row"
                                            onClick={() => toggleDeptExpand(dept.id)}
                                            title={dept.name}
                                        >
                                            <div className="sidebar-dept-main">
                                                <button
                                                    type="button"
                                                    onClick={(e) => toggleDeptExpand(dept.id, e)}
                                                    className="sidebar-chevron-btn"
                                                >
                                                    <ChevronRight
                                                        size={12}
                                                        className={`sidebar-chevron-icon ${isExpanded ? 'expanded' : ''}`}
                                                    />
                                                </button>
                                                {getDeptIcon(dept.icon)}
                                                <span className="sidebar-dept-name">{dept.name}</span>
                                            </div>

                                            <div className="sidebar-dept-actions">
                                                <span className="sidebar-count-badge">
                                                    {deptPolicies.length || dept.count || 0}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setPreselectedDept({ id: dept.id, name: dept.name });
                                                        setIsAddPolicyModalOpen(true);
                                                    }}
                                                    className="sidebar-dept-add-btn"
                                                    title={`Add policy to ${dept.name}`}
                                                >
                                                    <Plus size={11} />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Child Policies underneath department */}
                                        {isExpanded && (
                                            <div className="sidebar-child-policies">
                                                {deptPolicies.length === 0 ? (
                                                    <div className="sidebar-empty-hint" style={{ padding: '4px 6px', fontSize: '10px' }}>
                                                        No policies authored
                                                    </div>
                                                ) : (
                                                    deptPolicies.map((pol) => {
                                                        const isPolSelected = (location.pathname === '/home' || location.pathname === '/documents') && selectedPolicyId === pol.id;
                                                        const isPinned = pinnedPolicyIds.includes(pol.id);
                                                        const isDraft = pol.status === 'draft';

                                                        return (
                                                            <div
                                                                key={pol.id}
                                                                className={`sidebar-policy-row ${isPolSelected ? 'active' : ''}`}
                                                                onClick={() => handlePolicyClick(pol.id)}
                                                                onContextMenu={(e) => handleContextMenu(pol.id, e)}
                                                                title={`${pol.title}${isDraft ? ' (Draft - pending approval)' : ''} (Right-click to pin)`}
                                                            >
                                                                <div className="sidebar-policy-main">
                                                                    {isDraft ? (
                                                                        <span
                                                                            style={{
                                                                                width: '6px',
                                                                                height: '6px',
                                                                                borderRadius: '50%',
                                                                                background: '#f59e0b',
                                                                                flexShrink: 0
                                                                            }}
                                                                        />
                                                                    ) : pol.is_product ? (
                                                                        <CreditCard size={11} style={{ flexShrink: 0, opacity: 0.8 }} />
                                                                    ) : (
                                                                        <FileText size={11} style={{ flexShrink: 0, opacity: 0.8 }} />
                                                                    )}
                                                                    <span className="sidebar-policy-title">{pol.title}</span>
                                                                </div>

                                                                <div className="sidebar-policy-meta">
                                                                    {isDraft && (
                                                                        <span className="sidebar-draft-tag">Draft</span>
                                                                    )}
                                                                    <span className="sidebar-ver-tag">v{pol.version || '1.0'}</span>
                                                                    <button
                                                                        type="button"
                                                                        onClick={(e) => handleTogglePin(pol.id, e)}
                                                                        className={`sidebar-pin-btn ${isPinned ? 'pinned' : ''}`}
                                                                        title={isPinned ? 'Unpin policy' : 'Pin policy'}
                                                                    >
                                                                        <Pin size={10} style={{ fill: isPinned ? 'currentColor' : 'none' }} />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        );
                                                    })
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
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

            {/* Add Policy Modal triggered from Sidebar */}
            {isAddPolicyModalOpen && (
                <AddPolicyModal
                    isOpen={isAddPolicyModalOpen}
                    onClose={() => setIsAddPolicyModalOpen(false)}
                    preselectedDepartmentId={preselectedDept.id}
                    preselectedDepartmentName={preselectedDept.name}
                    departments={departments}
                    currentUser={user}
                    onPolicyCreated={(newPolicy) => {
                        setIsAddPolicyModalOpen(false);
                        loadData();
                        if (newPolicy && newPolicy.id) {
                            handlePolicyClick(newPolicy.id);
                        }
                        window.dispatchEvent(new CustomEvent('liblist:policy-created', { detail: newPolicy }));
                    }}
                />
            )}
        </aside>
    );
}
