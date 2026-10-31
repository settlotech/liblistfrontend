import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import HierarchyPane from './components/HierarchyPane';
import PolicyWorkspacePane from './components/PolicyWorkspacePane';
import ContextualFeedPane from './components/ContextualFeedPane';
import AdminDashboard from './components/AdminDashboard';
import MakerCheckerModal from './components/MakerCheckerModal';
import ConfigurePolicyModal from './components/ConfigurePolicyModal';
import AddPolicyModal from './components/AddPolicyModal';
import ExportModal from './components/ExportModal';
import SplashScreen from './components/SplashScreen';
import Login from './components/login/login';
import NotificationsModal from './components/NotificationsModal';
import BankUserManagerModal from './components/BankUserManagerModal';
import SuperAdminLoginModal from './components/SuperAdminLoginModal';
import RoleLoginModal from './components/RoleLoginModal';
import VectorSpaceModal from './components/VectorSpaceModal';
import ChangeManagementCenterPane from './components/ChangeManagementCenterPane.jsx';
import TasksWorkspaceCenterPane from './components/TasksWorkspaceCenterPane.jsx';
import TemplatesWorkspaceCenterPane from './components/TemplatesWorkspaceCenterPane.jsx';
import { apiService } from './services/apiService';
import { banksList, policiesDatabase } from './data/mockData';
import { DEFAULT_DEPARTMENTS } from './data/defaultPolicies';
import { useAuth } from './context/AuthContext';

export default function App() {
  const { user: authUser, logout: authLogout } = useAuth();

  // Standalone /3dviewer route redirect
  useEffect(() => {
    if (typeof window !== 'undefined' && (window.location.pathname === '/3dviewer' || window.location.pathname === '/3dview')) {
      window.location.href = 'http://localhost:5000/3dviewer';
    }
  }, []);

  // Initial loading splash screen
  const [showSplash, setShowSplash] = useState(true);

  // Authentication State with Local/Session persistence
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    try {
      const token = localStorage.getItem('libtrak_access_token');
      const user = localStorage.getItem('libtrak_authenticated_user');
      return Boolean(token && user);
    } catch (_) {
      return false;
    }
  });

  // Current active user persona (restores from stored session or null before login)
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const user = localStorage.getItem('libtrak_authenticated_user');
      if (user) {
        const u = JSON.parse(user);
        const isPlatformOwner = 
          u.email?.toLowerCase().includes('ramesh') || 
          u.role?.toLowerCase().includes('platform') || 
          u.role?.toLowerCase().includes('admin') || 
          u.roleType === 'admin' ||
          u.id === 'u_admin_ramesh';
        if (isPlatformOwner) {
          u.roleType = 'admin';
          u.role = 'Platform Owner';
        }
        return u;
      }
    } catch (_) {}
    return null;
  });

  // Current view: 'WORKSPACE' (3-pane layout from libtrack_UI) vs 'SUPER_ADMIN' (Platform Owner portal)
  const [currentView, setCurrentView] = useState(() => {
    try {
      const user = localStorage.getItem('libtrak_authenticated_user');
      if (user) {
        const u = JSON.parse(user);
        if (u.roleType === 'admin' || u.role?.toLowerCase().includes('platform') || u.email?.toLowerCase().includes('ramesh') || u.id === 'u_admin_ramesh') {
          return 'SUPER_ADMIN';
        }
      }
    } catch (_) {}
    return 'WORKSPACE';
  });

  // Keep currentUser synced when authUser changes from AuthContext
  useEffect(() => {
    if (authUser) {
      const isPlatformOwner = 
        authUser.email?.toLowerCase().includes('ramesh') || 
        authUser.role?.toLowerCase().includes('platform') || 
        authUser.role?.toLowerCase().includes('admin') || 
        authUser.roleType === 'admin' ||
        authUser.id === 'u_admin_ramesh';

      const roleType = isPlatformOwner 
        ? 'admin' 
        : (authUser.role === 'manager' || authUser.role?.toLowerCase().includes('owner') || authUser.role?.toLowerCase().includes('manager')
            ? 'manager' 
            : (authUser.role_type || 'employee'));

      const formatted = {
        id: authUser.id,
        name: authUser.name,
        email: authUser.email,
        role: isPlatformOwner ? 'Platform Owner' : (authUser.role === 'Bank Owner' || authUser.role?.toLowerCase().includes('owner') || roleType === 'manager' ? 'Bank Administrator' : (authUser.role || 'Bank Employee')),
        roleType: roleType,
        department: authUser.department || (isPlatformOwner ? 'National Banking Oversight & APRA Audit' : roleType === 'manager' ? 'Executive Governance' : 'Credit Operations Squad'),
        bankName: isPlatformOwner ? 'Central Platform Governance' : 'Commonwealth Bank of Australia',
        bankId: isPlatformOwner ? 'platform' : 'cba',
        avatar: authUser.name ? authUser.name.split(' ').map(n => n[0]).join('').slice(0, 2) : 'AU',
        canApprove: true,
        canReject: true,
        canEdit: true
      };
      setCurrentUser(formatted);
      setIsAuthenticated(true);
      if (roleType === 'admin') {
        setCurrentView('SUPER_ADMIN');
      }
    }
  }, [authUser]);

  // Banks & Institutions
  const [banks, setBanks] = useState(banksList);
  const [selectedBank, setSelectedBank] = useState(banksList[0]); // CBA by default

  // Data states - Initialize with 2 policies per department and Credit Card policy first
  // Data states - Initialize with 2 policies per department and Credit Card policy first
  const [departments, setDepartments] = useState(DEFAULT_DEPARTMENTS);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState('all');
  const [policies, setPolicies] = useState([]);
  const [allPolicies, setAllPolicies] = useState([]);
  const [selectedPolicyId, setSelectedPolicyId] = useState('credit-card-limits-policy');
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Maker-Checker state
  const [makerCheckerData, setMakerCheckerData] = useState({
    pendingCount: 0,
    pending: [],
    history: []
  });

  // Desktop sidebars layout
  const [isLeftOpen, setIsLeftOpen] = useState(true);
  const [isRightOpen, setIsRightOpen] = useState(true);
  const [leftWidth, setLeftWidth] = useState(280);
  const [rightWidth, setRightWidth] = useState(340);
  const [isDraggingLeft, setIsDraggingLeft] = useState(false);
  const [isDraggingRight, setIsDraggingRight] = useState(false);

  // Mobile drawer states
  const [isMobileLeftOpen, setIsMobileLeftOpen] = useState(false);
  const [isMobileRightOpen, setIsMobileRightOpen] = useState(false);

  // Center workspace active view: 'policy' (default) | 'change_management'
  const [activeWorkspaceView, setActiveWorkspaceView] = useState('policy');
  const [focusedReviewItemId, setFocusedReviewItemId] = useState(null);

  // Modal open states
  const [isMakerCheckerOpen, setIsMakerCheckerOpen] = useState(false);
  const [isConfigureModalOpen, setIsConfigureModalOpen] = useState(false);
  const [isAddPolicyModalOpen, setIsAddPolicyModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isNotificationsModalOpen, setIsNotificationsModalOpen] = useState(false);
  const [isBankUserManagerOpen, setIsBankUserManagerOpen] = useState(false);
  const [isSuperAdminModalOpen, setIsSuperAdminModalOpen] = useState(false);
  const [isRoleLoginOpen, setIsRoleLoginOpen] = useState(false);
  const [isVectorSpaceOpen, setIsVectorSpaceOpen] = useState(false);
  const [preselectedDept, setPreselectedDept] = useState({ id: null, name: '' });

  // Bank Users & Role-Based Access Control State (Bank Administrator Governance)
  const [bankUsers, setBankUsers] = useState([
    {
      id: 'sarah_jenkins',
      name: 'Sarah Jenkins',
      role: 'Bank Employee',
      roleType: 'employee',
      department: 'Credit Operations Squad',
      canView: true,
      canCreate: true,
      canEdit: true,
      policyPermissions: {
        'credit-card-limits-policy': { canView: true, canEdit: true },
        'credit-card-rewards-sop': { canView: true, canEdit: true },
        'personal-loans-assessment-sop': { canView: true, canEdit: true },
        'mortgage-underwriting-standard': { canView: true, canEdit: true },
        'customer-onboarding-sop': { canView: true, canEdit: true },
        'commercial-kyc-sop': { canView: true, canEdit: true },
        'remote-access-security-policy': { canView: true, canEdit: true },
        'privileged-access-sop': { canView: true, canEdit: false },
        'aml-ctf-screening-policy': { canView: true, canEdit: true },
        'cdr-privacy-policy': { canView: true, canEdit: false }
      },
      allowedPolicyIds: [
        'credit-card-limits-policy',
        'credit-card-rewards-sop',
        'personal-loans-assessment-sop',
        'mortgage-underwriting-standard',
        'customer-onboarding-sop',
        'commercial-kyc-sop',
        'remote-access-security-policy',
        'privileged-access-sop',
        'aml-ctf-screening-policy',
        'cdr-privacy-policy'
      ],
      lastActive: 'Today, 11:20 AM'
    },
    {
      id: 'david_miller',
      name: 'David Miller',
      role: 'Bank Employee',
      roleType: 'employee',
      department: 'InfoSec & Cyber Defense',
      canView: true,
      canCreate: false,
      canEdit: false,
      policyPermissions: {
        'credit-card-limits-policy': { canView: false, canEdit: false },
        'credit-card-rewards-sop': { canView: false, canEdit: false },
        'personal-loans-assessment-sop': { canView: false, canEdit: false },
        'mortgage-underwriting-standard': { canView: false, canEdit: false },
        'customer-onboarding-sop': { canView: true, canEdit: false },
        'commercial-kyc-sop': { canView: false, canEdit: false },
        'remote-access-security-policy': { canView: true, canEdit: true },
        'privileged-access-sop': { canView: true, canEdit: true },
        'aml-ctf-screening-policy': { canView: false, canEdit: false },
        'cdr-privacy-policy': { canView: false, canEdit: false }
      },
      allowedPolicyIds: ['remote-access-security-policy', 'privileged-access-sop', 'customer-onboarding-sop'],
      lastActive: 'Today, 9:15 AM'
    },
    {
      id: 'emma_watson',
      name: 'Emma Watson',
      role: 'Bank Employee',
      roleType: 'employee',
      department: 'Consumer Lending Desk',
      canView: true,
      canCreate: true,
      canEdit: true,
      policyPermissions: {
        'credit-card-limits-policy': { canView: true, canEdit: true },
        'credit-card-rewards-sop': { canView: true, canEdit: true },
        'personal-loans-assessment-sop': { canView: true, canEdit: true },
        'mortgage-underwriting-standard': { canView: true, canEdit: true },
        'customer-onboarding-sop': { canView: false, canEdit: false },
        'commercial-kyc-sop': { canView: false, canEdit: false },
        'remote-access-security-policy': { canView: false, canEdit: false },
        'privileged-access-sop': { canView: false, canEdit: false },
        'aml-ctf-screening-policy': { canView: false, canEdit: false },
        'cdr-privacy-policy': { canView: false, canEdit: false }
      },
      allowedPolicyIds: ['credit-card-limits-policy', 'credit-card-rewards-sop', 'personal-loans-assessment-sop', 'mortgage-underwriting-standard'],
      lastActive: 'Yesterday, 4:50 PM'
    },
    {
      id: 'marcus_vance',
      name: 'Marcus Vance',
      role: 'Bank Administrator & Sign-Off Authority',
      roleType: 'manager',
      department: 'Executive Governance & Retail Lending',
      canView: true,
      canCreate: true,
      canEdit: true,
      policyPermissions: {
        'credit-card-limits-policy': { canView: true, canEdit: true },
        'credit-card-rewards-sop': { canView: true, canEdit: true },
        'personal-loans-assessment-sop': { canView: true, canEdit: true },
        'mortgage-underwriting-standard': { canView: true, canEdit: true },
        'customer-onboarding-sop': { canView: true, canEdit: true },
        'commercial-kyc-sop': { canView: true, canEdit: true },
        'remote-access-security-policy': { canView: true, canEdit: true },
        'privileged-access-sop': { canView: true, canEdit: true },
        'aml-ctf-screening-policy': { canView: true, canEdit: true },
        'cdr-privacy-policy': { canView: true, canEdit: true }
      },
      allowedPolicyIds: [
        'credit-card-limits-policy',
        'credit-card-rewards-sop',
        'personal-loans-assessment-sop',
        'mortgage-underwriting-standard',
        'customer-onboarding-sop',
        'commercial-kyc-sop',
        'remote-access-security-policy',
        'privileged-access-sop',
        'aml-ctf-screening-policy',
        'cdr-privacy-policy'
      ],
      lastActive: 'Now'
    }
  ]);

  // Direct endpoint listener for Super Admin (/super-admin or #admin)
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.toLowerCase();
      if (hash.includes('super-admin') || hash.includes('admin')) {
        setCurrentView('SUPER_ADMIN');
      }
    };
    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  // Compute direct permissions for currently active persona
  const currentStaffConfig = bankUsers.find(u => u.id === currentUser?.id);
  const canCurrentUserCreateDocument = currentUser?.roleType === 'manager' || currentUser?.roleType === 'admin' 
    ? true 
    : (currentStaffConfig ? currentStaffConfig.canCreate !== false : true);

  const canCurrentUserEditSelectedPolicy = (policyId) => {
    if (currentUser?.roleType === 'manager' || currentUser?.roleType === 'admin') return true;
    if (!currentStaffConfig) return true;
    if (currentStaffConfig.canEdit === false) return false;
    if (policyId && currentStaffConfig.policyPermissions && currentStaffConfig.policyPermissions[policyId]) {
      return currentStaffConfig.policyPermissions[policyId].canEdit === true;
    }
    return true;
  };

  // 1. Fetch Hierarchy & Departments
  const loadHierarchy = useCallback(async () => {
    try {
      const data = await apiService.getHierarchy();
      console.log('%c🏛️ [APP STATE] Active Departments loaded from PostgreSQL DB:', 'color: #8B5CF6; font-weight: bold;', data);
      if (data && Array.isArray(data) && data.length > 0) {
        const enriched = data.map(d => {
          if (['credit-cards', 'retail-lending', 'onboarding', 'security', 'legal-compliance'].includes(d.id)) {
            return { ...d, count: Math.max(d.count || 0, 2) };
          }
          return d;
        });
        setDepartments(enriched);
      } else {
        setDepartments(DEFAULT_DEPARTMENTS);
      }
    } catch (err) {
      console.error('Failed to load hierarchy:', err);
      setDepartments(DEFAULT_DEPARTMENTS);
    }
  }, []);

  // 2. Fetch Policies with Bank User Access Control Filtering (Completely hides blocked policies)
  const loadPolicies = useCallback(async () => {
    try {
      const data = await apiService.getPolicies('all', '', currentUser?.roleType || 'employee');
      // Canonical database data: directly use DB policies
      const fullList = (data && Array.isArray(data)) ? data : [];
      console.log(`%c🏛️ [APP STATE] Active Database Policies (${fullList.length} policies loaded from DB):`, 'color: #10B981; font-weight: bold;', fullList);

      setAllPolicies(fullList);

      // Enforce employee policy access permissions set by the Bank Administrator
      let baseData = fullList;
      if (currentUser?.roleType === 'employee' && currentStaffConfig) {
        if (currentStaffConfig.canView === false) {
          baseData = [];
        } else {
          baseData = fullList.filter(pol => {
            if (currentStaffConfig.policyPermissions && currentStaffConfig.policyPermissions[pol.id]) {
              return currentStaffConfig.policyPermissions[pol.id].canView === true;
            }
            if (currentStaffConfig.allowedPolicyIds) {
              return currentStaffConfig.allowedPolicyIds.includes(pol.id);
            }
            return true;
          });
        }
      }

      setPolicies(baseData);

      setSelectedPolicyId(prev => {
        if (prev && baseData.some(p => p.id === prev)) {
          return prev;
        }
        if (baseData.length > 0) {
          const creditCard = baseData.find(p => p.id === 'credit-card-limits-policy');
          return creditCard ? creditCard.id : baseData[0].id;
        }
        return null;
      });
    } catch (err) {
      console.error('Failed to load policies:', err);
      setAllPolicies([]);
      setPolicies([]);
    }
  }, [currentUser?.roleType, currentStaffConfig]);

  // 3. Fetch Maker-Checker items & Notification count
  const loadMakerChecker = useCallback(async () => {
    try {
      const data = await apiService.getMakerCheckerItems();
      if (data) {
        console.log(`%c🏛️ [APP STATE] Governance queue loaded: ${data.pendingCount || 0} in review, ${data.drafts?.length || 0} drafts from DB:`, 'color: #EF4444; font-weight: bold;', data);
        setMakerCheckerData(data);
      }
    } catch (err) {
      console.error('Failed to load maker checker data:', err);
    }
  }, []);

  // Trigger loads on mount and when filter dependencies change
  useEffect(() => {
    loadHierarchy();
    loadMakerChecker();
  }, [loadHierarchy, loadMakerChecker, refreshTrigger]);

  useEffect(() => {
    loadPolicies();
  }, [loadPolicies]);

  // Successful institutional login handler
  const handleLoginSuccess = (user, token) => {
    const isPlatformOwner = 
      user?.email?.toLowerCase().includes('ramesh') || 
      user?.role?.toLowerCase().includes('platform') || 
      user?.role?.toLowerCase().includes('admin') || 
      user?.roleType === 'admin' ||
      user?.id === 'u_admin_ramesh';

    const roleType = isPlatformOwner 
      ? 'admin' 
      : (user?.role === 'manager' || user?.role?.toLowerCase().includes('owner') || user?.role?.toLowerCase().includes('manager')
          ? 'manager' 
          : (user?.roleType || 'employee'));

    const formattedUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: isPlatformOwner ? 'Platform Owner' : (user.role === 'Bank Owner' || user.role?.toLowerCase().includes('owner') || roleType === 'manager' ? 'Bank Administrator' : (user.role || 'Bank Employee')),
      roleType: roleType,
      department: user.department || (isPlatformOwner ? 'National Banking Oversight & APRA Audit' : roleType === 'manager' ? 'Executive Governance' : 'Credit Operations Squad'),
      bankName: isPlatformOwner ? 'Central Platform Governance' : 'Commonwealth Bank of Australia',
      bankId: isPlatformOwner ? 'platform' : 'cba',
      avatar: user.name ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2) : 'AU',
      canApprove: true,
      canReject: true,
      canEdit: true
    };

    setCurrentUser(formattedUser);
    setIsAuthenticated(true);
    try {
      localStorage.setItem('libtrak_authenticated_user', JSON.stringify(formattedUser));
      if (token) localStorage.setItem('libtrak_access_token', token);
    } catch (_) {}

    if (roleType === 'admin') {
      setCurrentView('SUPER_ADMIN');
    } else {
      setCurrentView('WORKSPACE');
    }
    setRefreshTrigger(prev => prev + 1);
  };

  // Real-time logout handler
  const handleLogout = async () => {
    try {
      if (authLogout) await authLogout();
    } catch (_) {}
    try {
      await apiService.logout();
    } catch (_) {}
    try {
      localStorage.removeItem('libtrak_authenticated_user');
      localStorage.removeItem('libtrak_access_token');
      sessionStorage.removeItem('user');
    } catch (_) {}
    setIsAuthenticated(false);
    setCurrentUser(null);
  };

  // Switch role and automatically set view if admin
  const handleSelectUser = (user) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
    try {
      localStorage.setItem('libtrak_authenticated_user', JSON.stringify(user));
    } catch (_) {}
    if (user.roleType === 'admin') {
      setCurrentView('SUPER_ADMIN');
    } else {
      setCurrentView('WORKSPACE');
    }
    setRefreshTrigger(prev => prev + 1);
  };

  // Toggle view between Super Admin Portal and 3-Pane Workspace
  const handleToggleSuperAdminView = () => {
    setCurrentView(prev => prev === 'SUPER_ADMIN' ? 'WORKSPACE' : 'SUPER_ADMIN');
  };

  // Super Admin action: Select bank and jump directly into that bank's 3-pane workspace
  const handleAccessBankWorkspace = (bank) => {
    setSelectedBank(bank);
    setCurrentView('WORKSPACE');
  };

  // Resizable Draggable Sidebars
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isDraggingLeft) {
        const newWidth = Math.min(Math.max(e.clientX, 220), 450);
        setLeftWidth(newWidth);
      } else if (isDraggingRight) {
        const newWidth = Math.min(Math.max(window.innerWidth - e.clientX, 260), 500);
        setRightWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsDraggingLeft(false);
      setIsDraggingRight(false);
    };

    if (isDraggingLeft || isDraggingRight) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    } else {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDraggingLeft, isDraggingRight]);

  // Action: Toggle Policy Active / Inactive (Safe Archiving)
  const handleTogglePolicyStatus = async (policyId, newStatus) => {
    try {
      await apiService.togglePolicyStatus(policyId, newStatus, currentUser?.name || 'Authorized Officer');
      setRefreshTrigger(prev => prev + 1);
    } catch (err) {
      console.error('Failed to toggle status:', err);
    }
  };

  // Action: Toggle Document Masking
  const handleTogglePolicyMasking = async (policyId, isMasked) => {
    try {
      await apiService.togglePolicyMasking(policyId, isMasked, currentUser?.name || 'Authorized Officer');
      setRefreshTrigger(prev => prev + 1);
    } catch (err) {
      console.error('Failed to toggle masking:', err);
    }
  };

  // Action: Maker-Checker Approve / Reject
  const handleMakerCheckerAction = async (requestId, action, checkerName, comments) => {
    try {
      await apiService.actionMakerChecker(requestId, action, checkerName, comments);
      await loadMakerChecker();
      setRefreshTrigger(prev => prev + 1);
    } catch (err) {
      console.error('Failed to action maker checker request:', err);
    }
  };

  // Action: Close Maker-Checker item
  const handleCloseMakerCheckerItem = async (requestId) => {
    try {
      await apiService.closeMakerCheckerItem(requestId);
      await loadMakerChecker();
    } catch (err) {
      console.error('Failed to close item:', err);
    }
  };

  // Open Add Policy Modal pre-populated with Department from hover '+'
  const handleOpenAddPolicyModal = (deptId = null, deptName = '') => {
    if (!canCurrentUserCreateDocument) {
      alert("Access Restricted: Policy authoring permission has been revoked for your account by Department Manager Marcus Vance.");
      return;
    }
    console.log(`%c➕ [+] BUTTON CLICKED: Opening AddPolicyModal with Target Department: "${deptName || deptId || 'None (Generic)'}"`, 'color: #0057B8; font-weight: bold; font-size: 13px;', { deptId, deptName });
    setPreselectedDept({ id: deptId, name: deptName });
    setIsAddPolicyModalOpen(true);
  };

  // Active selected policy from database (including saved drafts)
  const activePolicy = allPolicies.find(p => p.id === selectedPolicyId) 
    || policies.find(p => p.id === selectedPolicyId) 
    || (makerCheckerData.drafts || []).find(d => d.id === selectedPolicyId)
    || allPolicies[0] 
    || policies[0]
    || null;

  // If not authenticated, directly show Tamil's exact Login component
  if (!isAuthenticated || !currentUser) {
    return (
      <Login
        onLoginSuccess={handleLoginSuccess}
      />
    );
  }

  // Initial Institutional Loading Screen
  if (showSplash) {
    return (
      <SplashScreen
        onFinish={() => setShowSplash(false)}
        selectedBank={selectedBank}
        onSelectBank={setSelectedBank}
        banks={banks}
      />
    );
  }

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#eef4fa] font-sans text-slate-800">

      {/* Top Application Header */}
      <Header
        currentUser={currentUser}
        onSelectUser={handleSelectUser}
        onLogout={handleLogout}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        pendingReviewCount={
          (currentUser?.roleType === 'manager' || currentUser?.roleType === 'admin')
            ? (makerCheckerData.pendingCount || 0)
            : ((makerCheckerData.pending?.length || 0) + (makerCheckerData.drafts?.length || 0))
        }
        onOpenMakerChecker={() => setIsMakerCheckerOpen(true)}
        onOpenNotifications={() => setIsNotificationsModalOpen(true)}
        onOpenBankUserManagerModal={() => setIsBankUserManagerOpen(true)}
        onOpenSuperAdminModal={() => setIsSuperAdminModalOpen(true)}
        onOpenRoleLogin={() => setIsRoleLoginOpen(true)}
        onOpenVectorSpace={() => setIsVectorSpaceOpen(true)}
        isLeftOpen={isLeftOpen}
        onToggleLeft={() => setIsLeftOpen(!isLeftOpen)}
        isRightOpen={isRightOpen}
        onToggleRight={() => setIsRightOpen(!isRightOpen)}
        onToggleMobileLeft={() => setIsMobileLeftOpen(true)}
        onToggleMobileRight={() => setIsMobileRightOpen(true)}
        currentView={currentView}
        onToggleSuperAdminView={handleToggleSuperAdminView}
        selectedBank={selectedBank}
      />

      {/* Main View Area */}
      {currentView === 'SUPER_ADMIN' ? (
        /* SUPER ADMIN PORTAL (Platform Owner: Banks list + Master Library Management) */
        <AdminDashboard
          banks={banks}
          policies={policiesDatabase}
          onSelectBank={handleAccessBankWorkspace}
          onOpenEditMasterModal={() => setIsConfigureModalOpen(true)}
          onOpenBankCustomModal={() => setIsConfigureModalOpen(true)}
          onOpenAddPolicyModal={handleOpenAddPolicyModal}
          onOpenExportModal={() => setIsExportModalOpen(true)}
          onSwitchToLibraryView={() => setCurrentView('WORKSPACE')}
          onSelectPolicy={(id) => {
            setSelectedPolicyId(id);
            setCurrentView('WORKSPACE');
          }}
        />
      ) : (
        /* EXACT 3-PANE WORKSPACE STRUCTURE (libtrack_UI wireframe) */
        <div className="flex-1 flex overflow-hidden relative bg-[#eef4fa]">
          
          {/* Pane 1: Left - Library Group (Group → Functional → LOB Hierarchy) */}
          {isLeftOpen && (
            <>
              <HierarchyPane
                selectedDepartmentId={selectedDepartmentId}
                onSelectDepartment={(id) => {
                  setSelectedDepartmentId(id);
                  if (id !== 'all') {
                    const currentSelected = allPolicies.find(p => p.id === selectedPolicyId);
                    if (!currentSelected || currentSelected.department_id !== id) {
                      const firstInDept = allPolicies.find(p => p.department_id === id);
                      if (firstInDept) setSelectedPolicyId(firstInDept.id);
                    }
                  }
                }}
                policies={allPolicies}
                selectedPolicyId={selectedPolicyId}
                onSelectPolicy={(id) => {
                  setSelectedPolicyId(id);
                  setActiveWorkspaceView('policy');
                  const pol = allPolicies.find(p => p.id === id);
                  if (pol && pol.department_id) {
                    setSelectedDepartmentId(pol.department_id);
                  }
                }}
                activeWorkspaceView={activeWorkspaceView}
                onSelectWorkspaceView={(view) => {
                  if (view === 'change_management') {
                    setActiveWorkspaceView('change_management');
                    setFocusedReviewItemId(null);
                  } else {
                    setActiveWorkspaceView(view);
                  }
                }}
                onOpenAddPolicyModal={handleOpenAddPolicyModal}
                onOpenVectorSpace={() => setIsVectorSpaceOpen(true)}
                onOpenMakerChecker={() => {
                  setActiveWorkspaceView('change_management');
                  setFocusedReviewItemId(null);
                }}
                onOpenConfigureModal={() => setIsConfigureModalOpen(true)}
                canCreateDocument={canCurrentUserCreateDocument}
                isMobileOpen={isMobileLeftOpen}
                onCloseMobile={() => setIsMobileLeftOpen(false)}
                isCollapsed={!isLeftOpen}
                width={leftWidth}
                refreshTrigger={refreshTrigger}
                currentUser={currentUser}
              />

              {/* Left Draggable Resizer Bar */}
              <div
                onMouseDown={() => setIsDraggingLeft(true)}
                className="hidden md:block w-1 hover:w-1.5 bg-transparent hover:bg-slate-400 active:bg-slate-600 cursor-col-resize transition-all z-20"
                title="Drag to resize sidebar"
              />
            </>
          )}

          {/* Pane 2: Center - PolicyWorkspacePane, ChangeManagementCenterPane, TasksWorkspaceCenterPane, or TemplatesWorkspaceCenterPane */}
          {activeWorkspaceView === 'change_management' ? (
            <ChangeManagementCenterPane
              currentUser={currentUser}
              drafts={makerCheckerData.drafts || allPolicies.filter(p => p.status === 'draft')}
              inReviewItems={makerCheckerData.pending}
              historyItems={makerCheckerData.history}
              policies={allPolicies}
              onBackToPolicy={() => {
                setActiveWorkspaceView('policy');
                setFocusedReviewItemId(null);
              }}
              onOpenAddPolicyModal={handleOpenAddPolicyModal}
              onEditDraft={(draft) => {
                setSelectedPolicyId(draft.id);
                setIsConfigureModalOpen(true);
              }}
              onRefresh={() => {
                setRefreshTrigger(prev => prev + 1);
                loadMakerChecker();
                loadPolicies();
              }}
              initialTab={focusedReviewItemId ? 'in_review' : 'drafts'}
              focusedItemId={focusedReviewItemId}
            />
          ) : activeWorkspaceView === 'tasks' ? (
            <TasksWorkspaceCenterPane
              currentUser={currentUser}
              onBackToPolicy={() => setActiveWorkspaceView('policy')}
              onOpenPolicy={(policyId) => {
                setSelectedPolicyId(policyId);
                setActiveWorkspaceView('policy');
                setRefreshTrigger(prev => prev + 1);
              }}
              onOpenAddPolicyModal={handleOpenAddPolicyModal}
            />
          ) : activeWorkspaceView === 'templates' ? (
            <TemplatesWorkspaceCenterPane
              currentUser={currentUser}
              onBackToPolicy={() => setActiveWorkspaceView('policy')}
              onOpenAddPolicyModal={handleOpenAddPolicyModal}
              onSelectTemplate={(tpl) => {
                handleOpenAddPolicyModal(tpl.department_id, tpl.department_id);
              }}
            />
          ) : (
            <PolicyWorkspacePane
              policy={activePolicy}
              currentUser={currentUser}
              canEditPolicy={canCurrentUserEditSelectedPolicy(selectedPolicyId)}
              canCreateDocument={canCurrentUserCreateDocument}
              onOpenConfigureModal={() => setIsConfigureModalOpen(true)}
              onToggleStatus={handleTogglePolicyStatus}
              onToggleMasking={handleTogglePolicyMasking}
              onOpenExportModal={() => setIsExportModalOpen(true)}
              refreshTrigger={refreshTrigger}
            />
          )}

          {/* Pane 3: Right - Comments/Queries with Chat option */}
          {isRightOpen && (
            <>
              {/* Right Draggable Resizer Bar */}
              <div
                onMouseDown={() => setIsDraggingRight(true)}
                className="hidden lg:block w-1 hover:w-1.5 bg-transparent hover:bg-slate-400 active:bg-slate-600 cursor-col-resize transition-all z-20"
                title="Drag to resize feed"
              />

              <ContextualFeedPane
                activePolicy={activePolicy}
                currentUser={currentUser}
                isMobileOpen={isMobileRightOpen}
                onCloseMobile={() => setIsMobileRightOpen(false)}
                isCollapsed={!isRightOpen}
                width={rightWidth}
                refreshTrigger={refreshTrigger}
                onOpenMakerChecker={() => {
                  setActiveWorkspaceView('change_management');
                  setFocusedReviewItemId(null);
                }}
                onViewRequest={(req) => {
                  setFocusedReviewItemId(req.id);
                  setActiveWorkspaceView('change_management');
                }}
                onSelectPolicy={(id) => {
                  setSelectedPolicyId(id);
                  setActiveWorkspaceView('policy');
                }}
                policies={allPolicies}
              />
            </>
          )}
        </div>
      )}

      {/* ----------------- MODALS ----------------- */}

      {/* 1. Maker-Checker Governance & Review Modal */}
      <MakerCheckerModal
        isOpen={isMakerCheckerOpen}
        onClose={() => setIsMakerCheckerOpen(false)}
        items={makerCheckerData.pending}
        history={makerCheckerData.history}
        drafts={makerCheckerData.drafts || allPolicies.filter(p => p.status === 'draft')}
        policies={allPolicies}
        currentUser={currentUser}
        onAction={handleMakerCheckerAction}
        onCloseItem={handleCloseMakerCheckerItem}
        onSelectPolicy={(id) => {
          setSelectedPolicyId(id);
          setIsMakerCheckerOpen(false);
        }}
        onEditDraft={(draft) => {
          setSelectedPolicyId(draft.id);
          setIsMakerCheckerOpen(false);
          setIsConfigureModalOpen(true);
        }}
        onRefresh={() => {
          setRefreshTrigger(prev => prev + 1);
          loadMakerChecker();
          loadPolicies();
        }}
      />

      {/* 2. Configure Operational Policy Modal (In-System Parameter Editor) */}
      <ConfigurePolicyModal
        isOpen={isConfigureModalOpen}
        onClose={() => setIsConfigureModalOpen(false)}
        policy={activePolicy}
        currentUser={currentUser}
        onPolicyUpdated={() => setRefreshTrigger(prev => prev + 1)}
      />

      {/* 3. Add Policy Modal (3 Creation Modes with AI Thinking Ingestion) */}
      <AddPolicyModal
        isOpen={isAddPolicyModalOpen}
        onClose={() => setIsAddPolicyModalOpen(false)}
        preselectedDepartmentId={preselectedDept.id}
        preselectedDepartmentName={preselectedDept.name}
        departments={departments}
        currentUser={currentUser}
        onPolicyCreated={(newId) => {
          setSelectedPolicyId(newId);
          setRefreshTrigger(prev => prev + 1);
        }}
      />

      {/* 4. Export Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        activePolicy={activePolicy}
        selectedBank={selectedBank}
      />

      {/* 5. Notifications & Compliance Codes Modal */}
      <NotificationsModal
        isOpen={isNotificationsModalOpen}
        onClose={() => setIsNotificationsModalOpen(false)}
        currentUser={currentUser}
        pendingItems={makerCheckerData.pending}
        drafts={makerCheckerData.drafts || allPolicies.filter(p => p.status === 'draft')}
        history={makerCheckerData.history}
        onOpenPolicy={(id) => {
          setSelectedPolicyId(id);
          setActiveWorkspaceView('policy');
          setRefreshTrigger(prev => prev + 1);
        }}
        onOpenReviewItem={(item) => {
          setActiveWorkspaceView('change_management');
          setFocusedReviewItemId(item.id);
        }}
      />

      {/* 6. Bank User Management & Access Control Matrix (Checker Controller) */}
      <BankUserManagerModal
        isOpen={isBankUserManagerOpen}
        onClose={() => setIsBankUserManagerOpen(false)}
        currentUser={currentUser}
        bankUsers={bankUsers}
        onUpdateBankUsers={(updated) => {
          setBankUsers(updated);
          setRefreshTrigger(prev => prev + 1);
        }}
        policies={allPolicies}
      />

      {/* 7. Super Admin Direct Gateway Login Modal */}
      <SuperAdminLoginModal
        isOpen={isSuperAdminModalOpen}
        onClose={() => setIsSuperAdminModalOpen(false)}
        onLoginAsSuperAdmin={(adminUser) => handleSelectUser(adminUser)}
      />

      {/* 8. Institutional Role Login & Credential Authentication Modal */}
      <RoleLoginModal
        isOpen={isRoleLoginOpen}
        onClose={() => setIsRoleLoginOpen(false)}
        currentUser={currentUser}
        onSelectUser={handleSelectUser}
      />

      {/* 9. 3D Vector Space DB Visualizer */}
      <VectorSpaceModal
        isOpen={isVectorSpaceOpen}
        onClose={() => setIsVectorSpaceOpen(false)}
        policies={allPolicies}
        onSelectPolicy={(id) => {
          setSelectedPolicyId(id);
          const pol = allPolicies.find(p => p.id === id);
          if (pol && pol.department_id) {
            setSelectedDepartmentId(pol.department_id);
          }
        }}
      />
    </div>
  );
}
