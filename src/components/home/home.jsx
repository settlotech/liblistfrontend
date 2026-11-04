import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import PolicyWorkspacePane from '../PolicyWorkspacePane';
import ContextualFeedPane from '../ContextualFeedPane';
import MakerCheckerModal from '../MakerCheckerModal';
import ConfigurePolicyModal from '../ConfigurePolicyModal';
import AddPolicyModal from '../AddPolicyModal';
import ExportModal from '../ExportModal';
import VectorSpaceModal from '../VectorSpaceModal';
import ChangeManagementCenterPane from '../ChangeManagementCenterPane.jsx';
import TasksWorkspaceCenterPane from '../TasksWorkspaceCenterPane.jsx';
import TemplatesWorkspaceCenterPane from '../TemplatesWorkspaceCenterPane.jsx';
import { apiService } from '../../services/apiService';
import { banksList, policiesDatabase } from '../../data/mockData';
import { DEFAULT_DEPARTMENTS } from '../../data/defaultPolicies';
import { useAuth } from '../../context/AuthContext';
import './home.css';

export default function Home({ initialView = 'policy' }) {
  const { user: authUser, logout: authLogout } = useAuth();
  const [searchParams] = useSearchParams();
  const urlPolicyId = searchParams.get('policy');

  // Current active user persona
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const stored = localStorage.getItem('libtrak_authenticated_user');
      if (stored) return JSON.parse(stored);
    } catch (_) {}
    if (authUser) {
      return {
        id: authUser.id || 'u_cba_exec_marcus',
        name: authUser.name || 'Marcus Vance',
        email: authUser.email || 'marcus.vance@commbank.com.au',
        role: authUser.role || 'Bank Administrator',
        roleType: authUser.roleType || 'manager',
        department: authUser.department || 'Executive Governance & APRA Oversight',
        bankName: 'Commonwealth Bank of Australia',
        bankId: 'cba',
        avatar: authUser.name ? authUser.name.split(' ').map(n => n[0]).join('').slice(0, 2) : 'MV',
        canApprove: true,
        canReject: true,
        canEdit: true
      };
    }
    return {
      id: 'u_cba_exec_marcus',
      name: 'Marcus Vance',
      email: 'marcus.vance@commbank.com.au',
      role: 'Bank Administrator',
      roleType: 'manager',
      department: 'Executive Governance & APRA Oversight',
      bankName: 'Commonwealth Bank of Australia',
      bankId: 'cba',
      avatar: 'MV',
      canApprove: true,
      canReject: true,
      canEdit: true
    };
  });

  // Banks & Institutions
  const [banks] = useState(banksList);
  const [selectedBank] = useState(banksList[0]);

  // Data states
  const [departments, setDepartments] = useState(DEFAULT_DEPARTMENTS);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState('all');
  const [policies, setPolicies] = useState([]);
  const [allPolicies, setAllPolicies] = useState([]);
  const [selectedPolicyId, setSelectedPolicyId] = useState(
    () => urlPolicyId || 'credit-card-limits-policy'
  );
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Maker-Checker state
  const [makerCheckerData, setMakerCheckerData] = useState({
    pendingCount: 0,
    pending: [],
    history: [],
    drafts: []
  });

  // Layout & Panes
  const [isRightOpen, setIsRightOpen] = useState(true);
  const [rightWidth, setRightWidth] = useState(340);
  const [isDraggingRight, setIsDraggingRight] = useState(false);

  // Active Workspace Center Pane View: 'policy' | 'change_management' | 'tasks' | 'templates'
  const [activeWorkspaceView, setActiveWorkspaceView] = useState(initialView);
  const [focusedReviewItemId, setFocusedReviewItemId] = useState(null);

  // Modals
  const [isMakerCheckerOpen, setIsMakerCheckerOpen] = useState(false);
  const [isConfigureModalOpen, setIsConfigureModalOpen] = useState(false);
  const [isAddPolicyModalOpen, setIsAddPolicyModalOpen] = useState(false);
  const [preselectedDept, setPreselectedDept] = useState({ id: null, name: '' });
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isNotificationsModalOpen, setIsNotificationsModalOpen] = useState(false);
  const [isBankUserManagerOpen, setIsBankUserManagerOpen] = useState(false);
  const [isSuperAdminModalOpen, setIsSuperAdminModalOpen] = useState(false);
  const [isRoleLoginOpen, setIsRoleLoginOpen] = useState(false);
  const [isVectorSpaceOpen, setIsVectorSpaceOpen] = useState(false);

  // Sync initial view if prop changes
  useEffect(() => {
    if (initialView) {
      setActiveWorkspaceView(initialView);
    }
  }, [initialView]);

  // Sync policy from URL query parameter
  useEffect(() => {
    if (urlPolicyId) {
      setSelectedPolicyId(urlPolicyId);
      setActiveWorkspaceView('policy');
    }
  }, [urlPolicyId]);

  // Sync authUser
  useEffect(() => {
    if (authUser && authUser.id !== currentUser?.id) {
      setCurrentUser(prev => ({
        ...prev,
        ...authUser,
        roleType: authUser.isSuperAdmin ? 'admin' : (authUser.roleType || prev.roleType || 'employee')
      }));
    }
  }, [authUser, currentUser?.id]);

  // Load Hierarchy
  const loadHierarchy = useCallback(async () => {
    try {
      const raw = await apiService.getHierarchy();
      const data = Array.isArray(raw) ? raw : (raw?.departments || raw?.data || []);
      if (data && data.length > 0) {
        setDepartments(data);
      } else {
        setDepartments(DEFAULT_DEPARTMENTS);
      }
    } catch (err) {
      console.warn('Could not load hierarchy:', err.message);
      setDepartments(DEFAULT_DEPARTMENTS);
    }
  }, []);

  // Load Policies
  const loadPolicies = useCallback(async () => {
    try {
      const data = await apiService.getPolicies('all', '', currentUser?.roleType || 'employee');
      const fullList = (data && Array.isArray(data)) ? data : [];
      setAllPolicies(fullList);
      setPolicies(fullList);

      if (fullList.length > 0 && !selectedPolicyId) {
        setSelectedPolicyId(fullList[0].id);
      }
    } catch (err) {
      console.warn('Could not load policies from API, using fallback DB:', err.message);
      setAllPolicies(policiesDatabase);
      setPolicies(policiesDatabase);
    }
  }, [currentUser?.roleType, selectedPolicyId]);

  // Load Maker-Checker data
  const loadMakerChecker = useCallback(async () => {
    try {
      const [pending, history, drafts] = await Promise.all([
        apiService.getMakerCheckerPending().catch(() => []),
        apiService.getAuditTrail().catch(() => []),
        apiService.getDrafts().catch(() => [])
      ]);

      const pendingArr = Array.isArray(pending) ? pending : [];
      const historyArr = Array.isArray(history) ? history : [];
      const draftsArr = Array.isArray(drafts) ? drafts : [];

      setMakerCheckerData({
        pendingCount: pendingArr.length,
        pending: pendingArr,
        history: historyArr,
        drafts: draftsArr
      });
    } catch (err) {
      console.warn('Could not load maker-checker data:', err.message);
    }
  }, []);

  useEffect(() => {
    loadHierarchy();
    loadPolicies();
    loadMakerChecker();
  }, [loadHierarchy, loadPolicies, loadMakerChecker, refreshTrigger]);

  // Synchronize events across sidebar and workspace
  useEffect(() => {
    const handleSelectPolicyEvent = (e) => {
      if (e.detail) {
        setSelectedPolicyId(e.detail);
        setActiveWorkspaceView('policy');
      }
    };

    const handlePolicyCreatedEvent = (e) => {
      loadHierarchy();
      loadPolicies();
      if (e.detail?.id) {
        setSelectedPolicyId(e.detail.id);
        setActiveWorkspaceView('policy');
      }
    };

    window.addEventListener('liblist:select-policy', handleSelectPolicyEvent);
    window.addEventListener('liblist:policy-created', handlePolicyCreatedEvent);

    return () => {
      window.removeEventListener('liblist:select-policy', handleSelectPolicyEvent);
      window.removeEventListener('liblist:policy-created', handlePolicyCreatedEvent);
    };
  }, [loadHierarchy, loadPolicies]);

  // Pane resizer for right Copilot feed
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isDraggingRight) {
        const newWidth = window.innerWidth - e.clientX;
        if (newWidth >= 260 && newWidth <= 600) {
          setRightWidth(newWidth);
        }
      }
    };

    const handleMouseUp = () => {
      setIsDraggingRight(false);
    };

    if (isDraggingRight) {
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
  }, [isDraggingRight]);

  const handleTogglePolicyStatus = async (policyId, newStatus) => {
    try {
      await apiService.togglePolicyStatus(policyId, newStatus, currentUser?.name || 'Authorized Officer');
      setRefreshTrigger(prev => prev + 1);
    } catch (err) {
      console.error('Failed to toggle status:', err);
    }
  };

  const handleTogglePolicyMasking = async (policyId, isMasked) => {
    try {
      await apiService.togglePolicyMasking(policyId, isMasked, currentUser?.name || 'Authorized Officer');
      setRefreshTrigger(prev => prev + 1);
    } catch (err) {
      console.error('Failed to toggle masking:', err);
    }
  };

  const handleOpenAddPolicyModal = (deptId = null, deptName = '') => {
    setPreselectedDept({ id: deptId, name: deptName });
    setIsAddPolicyModalOpen(true);
  };

  const activePolicy = allPolicies.find(p => p.id === selectedPolicyId) 
    || policies.find(p => p.id === selectedPolicyId) 
    || (makerCheckerData.drafts || []).find(d => d.id === selectedPolicyId)
    || allPolicies[0] 
    || null;

  return (
    <div className="home-page p-0 flex flex-col h-full w-full overflow-hidden bg-[var(--bg-primary,#f8fafc)] text-[var(--text-primary,#0f172a)]">
      <div className="flex-1 flex overflow-hidden relative bg-[var(--bg-primary,#f8fafc)]">
        {/* Pane 1: Center Workspace (Full width, no redundant hierarchy column) */}
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
            canEditPolicy={true}
            canCreateDocument={true}
            onOpenConfigureModal={() => setIsConfigureModalOpen(true)}
            onToggleStatus={handleTogglePolicyStatus}
            onToggleMasking={handleTogglePolicyMasking}
            onOpenExportModal={() => setIsExportModalOpen(true)}
            refreshTrigger={refreshTrigger}
          />
        )}

        {/* Pane 2: Right Contextual Feed (Shidney AI Copilot) */}
        {isRightOpen && (
          <>
            <div
              onMouseDown={() => setIsDraggingRight(true)}
              className="hidden lg:block w-1 hover:w-1.5 bg-transparent hover:bg-slate-400 active:bg-slate-600 cursor-col-resize transition-all z-20"
              title="Drag to resize feed"
            />

            <ContextualFeedPane
              activePolicy={activePolicy}
              currentUser={currentUser}
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

      {/* Governance & Action Modals */}
      <MakerCheckerModal
        isOpen={isMakerCheckerOpen}
        onClose={() => setIsMakerCheckerOpen(false)}
        currentUser={currentUser}
        pendingItems={makerCheckerData.pending}
        drafts={makerCheckerData.drafts || allPolicies.filter(p => p.status === 'draft')}
        history={makerCheckerData.history}
        onOpenPolicy={(id) => {
          setSelectedPolicyId(id);
          setActiveWorkspaceView('policy');
          setRefreshTrigger(prev => prev + 1);
        }}
      />

      <ConfigurePolicyModal
        isOpen={isConfigureModalOpen}
        onClose={() => setIsConfigureModalOpen(false)}
        policy={activePolicy}
        currentUser={currentUser}
        onSave={() => {
          setRefreshTrigger(prev => prev + 1);
          setIsConfigureModalOpen(false);
        }}
        departments={departments}
      />

      <AddPolicyModal
        isOpen={isAddPolicyModalOpen}
        onClose={() => setIsAddPolicyModalOpen(false)}
        preselectedDepartmentId={preselectedDept.id}
        preselectedDepartmentName={preselectedDept.name}
        currentUser={currentUser}
        departments={departments}
        onPolicyCreated={(newPolicy) => {
          setRefreshTrigger(prev => prev + 1);
          setIsAddPolicyModalOpen(false);
          if (newPolicy && newPolicy.id) {
            setSelectedPolicyId(newPolicy.id);
            setActiveWorkspaceView('policy');
          }
          window.dispatchEvent(new CustomEvent('liblist:policy-created', { detail: newPolicy }));
        }}
      />

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        policy={activePolicy}
      />

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
