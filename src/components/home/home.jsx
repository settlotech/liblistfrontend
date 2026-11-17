import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useLocation, useNavigate } from 'react-router-dom';
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
import { DEFAULT_DEPARTMENTS, DEFAULT_POLICIES } from '../../data/defaultPolicies';
import { useAuth } from '../../context/AuthContext';
import { getUserNoteById } from '../../utils/userNotesStorage';
import './home.css';

export default function Home({ initialView = 'policy' }) {
  const { user: authUser, logout: authLogout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const urlPolicyId = searchParams.get('policy');
  const urlEdit = searchParams.get('edit');
  const urlSection = searchParams.get('section');
  const urlTab = searchParams.get('tab');
  const urlItem = searchParams.get('item');
  const urlView = searchParams.get('view');
  const urlNoteNav = searchParams.get('noteNav');

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
        role: authUser.role || 'Bank Approver',
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
      role: 'Bank Approver',
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
  const [policies, setPolicies] = useState(DEFAULT_POLICIES);
  const [allPolicies, setAllPolicies] = useState(DEFAULT_POLICIES);
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
  const [openedDraft, setOpenedDraft] = useState(null);

  // Modals
  const [isMakerCheckerOpen, setIsMakerCheckerOpen] = useState(false);
  const [isConfigureModalOpen, setIsConfigureModalOpen] = useState(false);
  const [isAddPolicyModalOpen, setIsAddPolicyModalOpen] = useState(false);
  const [addPolicyInitialMode, setAddPolicyInitialMode] = useState('direct');
  const [editingPolicy, setEditingPolicy] = useState(null);
  const [selectedDraft, setSelectedDraft] = useState(null);
  const [viewingDraft, setViewingDraft] = useState(null);
  const [isDraftEditing, setIsDraftEditing] = useState(false);
  const [preselectedDept, setPreselectedDept] = useState({ id: null, name: '' });
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isNotificationsModalOpen, setIsNotificationsModalOpen] = useState(false);
  const [isBankUserManagerOpen, setIsBankUserManagerOpen] = useState(false);
  const [isSuperAdminModalOpen, setIsSuperAdminModalOpen] = useState(false);
  const [isRoleLoginOpen, setIsRoleLoginOpen] = useState(false);
  const [isVectorSpaceOpen, setIsVectorSpaceOpen] = useState(false);

  // Strict route path synchronizer: guarantees correct view based on URL pathname
  useEffect(() => {
    if (location.pathname === '/changelogs') {
      setActiveWorkspaceView('change_management');
    } else if (location.pathname === '/tasks' || location.pathname === '/demotask') {
      setActiveWorkspaceView('tasks');
    } else if (location.pathname === '/templates') {
      setActiveWorkspaceView('templates');
    } else if (location.pathname === '/home') {
      if (urlView) {
        setActiveWorkspaceView(urlView);
      } else {
        setActiveWorkspaceView('policy');
      }
    } else if (initialView) {
      setActiveWorkspaceView(initialView);
    }

    if (urlItem) {
      setFocusedReviewItemId(urlItem);
      setActiveWorkspaceView('change_management');
    }
  }, [location.pathname, initialView, urlView, urlItem]);

  // Sync policy and auto-open edit modal if requested from Task location navigation (never override /changelogs)
  useEffect(() => {
    if (urlPolicyId && location.pathname !== '/changelogs') {
      setSelectedPolicyId(urlPolicyId);
      setActiveWorkspaceView('policy');
      if (urlEdit === 'true') {
        const found = allPolicies.find(p => p.id === urlPolicyId) || 
                      policies.find(p => p.id === urlPolicyId) || 
                      policiesDatabase[urlPolicyId] ||
                      (policies.length > 0 ? policies[0] : null);
        if (found) {
          setEditingPolicy(found);
          setIsAddPolicyModalOpen(true);
        }
      }
    }
  }, [urlPolicyId, urlEdit, allPolicies, policies]);

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
      setAllPolicies(DEFAULT_POLICIES);
      setPolicies(DEFAULT_POLICIES);
    }
  }, [currentUser?.roleType, selectedPolicyId]);

  // Load Maker-Checker data
  const loadMakerChecker = useCallback(async () => {
    try {
      const data = await apiService.getMakerCheckerItems();
      if (data) {
        const pendingArr = Array.isArray(data.pending) ? data.pending : [];
        const historyArr = Array.isArray(data.history) ? data.history : [];
        const draftsArr = Array.isArray(data.drafts) ? data.drafts : [];

        setMakerCheckerData({
          pendingCount: data.pendingCount || pendingArr.length,
          pending: pendingArr,
          history: historyArr,
          drafts: draftsArr
        });
      }
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
        if (location.pathname !== '/changelogs') {
          setActiveWorkspaceView('policy');
        }
      }
    };

    const handlePolicyCreatedEvent = (e) => {
      loadHierarchy();
      loadPolicies();
      loadMakerChecker();
      if (e.detail?.id) {
        setSelectedPolicyId(e.detail.id);
        if (e.detail?.status !== 'draft' && e.detail?.status !== 'pending_approval') {
          setActiveWorkspaceView('policy');
        } else {
          setActiveWorkspaceView('change_management');
        }
      }
    };

    const handleMakerCheckerUpdatedEvent = () => {
      loadMakerChecker();
      loadPolicies();
    };

    window.addEventListener('liblist:select-policy', handleSelectPolicyEvent);
    window.addEventListener('liblist:policy-created', handlePolicyCreatedEvent);
    window.addEventListener('liblist:maker-checker-updated', handleMakerCheckerUpdatedEvent);

    return () => {
      window.removeEventListener('liblist:select-policy', handleSelectPolicyEvent);
      window.removeEventListener('liblist:policy-created', handlePolicyCreatedEvent);
      window.removeEventListener('liblist:maker-checker-updated', handleMakerCheckerUpdatedEvent);
    };
  }, [loadHierarchy, loadPolicies, loadMakerChecker]);

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

  const handleOpenAddPolicyModal = (deptId = null, deptName = '', initialMode = 'direct') => {
    setAddPolicyInitialMode(initialMode);
    setPreselectedDept({ id: deptId, name: deptName });
    setIsAddPolicyModalOpen(true);
  };

  const safeAllPolicies = Array.isArray(allPolicies) && allPolicies.length > 0 
    ? allPolicies 
    : DEFAULT_POLICIES;
  const safePolicies = Array.isArray(policies) && policies.length > 0 
    ? policies 
    : DEFAULT_POLICIES;

  const activePolicy = safeAllPolicies.find(p => p.id === selectedPolicyId) 
    || safePolicies.find(p => p.id === selectedPolicyId) 
    || (makerCheckerData.drafts || []).find(d => d.id === selectedPolicyId)
    || DEFAULT_POLICIES.find(p => p.id === selectedPolicyId)
    || safeAllPolicies[0] 
    || DEFAULT_POLICIES[0]
    || null;

  // When clicking Configure on an active policy, take a copy and create a draft clone for the user to edit
  const handleConfigurePolicyCopy = async (targetDoc) => {
    const basePolicy = targetDoc || activePolicy || DEFAULT_POLICIES[0];
    if (!basePolicy) return;

    let policyToCopy = basePolicy;
    let fetchedParentVersions = Array.isArray(basePolicy.versions) ? basePolicy.versions : [];
    if (basePolicy.id && !String(basePolicy.id).startsWith('draft-clone-')) {
      try {
        const [fullRes, versRes] = await Promise.allSettled([
          !basePolicy.content || fetchedParentVersions.length === 0
            ? apiService.getPolicyDetails(basePolicy.id, currentUser?.roleType || 'employee')
            : Promise.resolve(null),
          fetchedParentVersions.length === 0
            ? apiService.getPolicyVersions(basePolicy.id)
            : Promise.resolve(null),
        ]);
        if (fullRes.status === 'fulfilled' && fullRes.value) {
          policyToCopy = { ...basePolicy, ...fullRes.value };
          if (Array.isArray(fullRes.value.versions) && fullRes.value.versions.length > 0) {
            fetchedParentVersions = fullRes.value.versions;
          }
        }
        if (versRes.status === 'fulfilled' && Array.isArray(versRes.value) && versRes.value.length > 0) {
          fetchedParentVersions = versRes.value;
        }
      } catch (_) {}
    }

    const params = typeof policyToCopy.parameters === 'string'
      ? JSON.parse(policyToCopy.parameters || '{}')
      : (policyToCopy.parameters || {});

    // Calculate incremental draft revision: 1.0 -> 1.1 or 1.2 -> 1.3
    const curVer = policyToCopy.version || params.version || '1.0';
    const num = parseFloat(String(curVer).replace(/[^0-9.]/g, '')) || 1.0;
    const nextVer = `${(num + 0.1).toFixed(1)}`;

    // Prepare sections
    let initialSections = params.sections;
    if (!Array.isArray(initialSections) || initialSections.length === 0) {
      const raw = policyToCopy.content || '';
      const parts = raw.split(/(?=###\s+)/);
      if (parts.length > 1) {
        initialSections = parts.map((part, i) => {
          const match = part.match(/^###\s*(?:\d+\.?\s*)?(.*?)\n([\s\S]*)$/);
          return {
            id: `sec-${i}-${Date.now()}`,
            title: match ? match[1].trim() : `Section ${i + 1}`,
            content: match ? match[2].trim() : part.trim(),
            type: 'section'
          };
        });
      } else {
        initialSections = [
          { id: `sec-summary-${Date.now()}`, title: 'Summary', content: policyToCopy.summary || 'Summary of operational intent.', type: 'section' },
          { id: `sec-details-${Date.now()}`, title: 'Details', content: raw || 'Operational policy clauses.', type: 'section' }
        ];
      }
    }

    const parentHistorySource = [
      ...(Array.isArray(fetchedParentVersions) ? fetchedParentVersions : []),
      ...(Array.isArray(params.versions) ? params.versions : []),
    ];
    const normalizedParentHistory = parentHistorySource.map((v, idx) => {
      const verNum = String(v.version_number || v.version || curVer || '1.0').replace(/^v/i, '');
      const verTs = v.created_at || v.timestamp || policyToCopy.updated_at || policyToCopy.created_at || new Date().toISOString();
      return {
        ...v,
        id: v.id || `parent-${policyToCopy.id}-${verNum}-${idx}`,
        policy_id: v.policy_id || policyToCopy.id,
        version: verNum,
        version_number: verNum,
        title: v.title || policyToCopy.title,
        summary: v.summary || policyToCopy.summary || '',
        content: v.content || policyToCopy.content || '',
        sections: Array.isArray(v.sections) && v.sections.length > 0 ? v.sections : initialSections,
        timestamp: verTs,
        created_at: verTs,
        author: v.changed_by || v.author || policyToCopy.created_by || 'Policy Owner',
        changed_by: v.changed_by || v.author || policyToCopy.created_by || 'Policy Owner',
        notes: v.change_summary || v.notes || v.summary || `Parent policy v${verNum}`,
        change_summary: v.change_summary || v.notes || v.summary || `Parent policy v${verNum}`,
        source: v.source || 'parent_policy',
        status_tag: v.status_tag || 'parent',
      };
    });

    const parentBaselineEntry = {
      id: `parent-base-${policyToCopy.id}`,
      policy_id: policyToCopy.id,
      version: String(curVer).replace(/^v/i, ''),
      version_number: String(curVer).replace(/^v/i, ''),
      title: policyToCopy.title,
      summary: policyToCopy.summary || '',
      content: policyToCopy.content || '',
      sections: initialSections,
      timestamp: policyToCopy.updated_at || policyToCopy.created_at || new Date().toISOString(),
      created_at: policyToCopy.updated_at || policyToCopy.created_at || new Date().toISOString(),
      author: policyToCopy.created_by || 'Policy Owner',
      changed_by: policyToCopy.created_by || 'Policy Owner',
      notes: `Parent baseline (${policyToCopy.title})`,
      change_summary: `Parent baseline (${policyToCopy.title})`,
      source: 'parent_policy',
      status_tag: 'parent',
    };

    const cloneTimestamp = new Date().toISOString();
    const draftCloneEntry = {
      id: `draft-clone-rev-${nextVer}-${Date.now()}`,
      version: nextVer,
      version_number: nextVer,
      title: policyToCopy.title ? `${policyToCopy.title} (Draft Revision)` : 'Operational Policy (Draft Revision)',
      summary: policyToCopy.summary || '',
      content: policyToCopy.content || '',
      sections: initialSections,
      timestamp: cloneTimestamp,
      created_at: cloneTimestamp,
      author: currentUser?.name || 'Marcus Vance',
      changed_by: currentUser?.name || 'Marcus Vance',
      notes: `Cloned active policy '${policyToCopy.title}' for direct user draft configuration`,
      change_summary: `Cloned active policy '${policyToCopy.title}' for direct user draft configuration`,
      source: 'draft_revision',
      status_tag: 'draft',
    };

    const mergedVersions = [
      draftCloneEntry,
      ...(normalizedParentHistory.length > 0 ? normalizedParentHistory : [parentBaselineEntry]),
    ];

    const draftClone = {
      department_id: policyToCopy.department_id || policyToCopy.deptId || 'credit-cards',
      title: policyToCopy.title ? `${policyToCopy.title} (Draft Revision)` : 'Operational Policy (Draft Revision)',
      summary: policyToCopy.summary || '',
      content: policyToCopy.content || '',
      parameters: {
        ...params,
        version: nextVer,
        copied_from: policyToCopy.id,
        sections: initialSections,
        turnaround_sla: params.turnaround_sla || '4 Hours',
        daily_limit: params.daily_limit || '$25,000 AUD',
        approval_limits: params.approval_limits || { officer_cap: '$100,000 AUD' },
        versions: mergedVersions
      },
      created_by: currentUser?.name || 'Marcus Vance',
      creation_mode: 'direct',
      status: 'draft',
      version: nextVer,
      user_role: currentUser?.roleType || 'employee',
      user_name: currentUser?.name || 'Marcus Vance'
    };

    let savedDraft = draftClone;
    try {
      const res = await apiService.createPolicy(draftClone);
      savedDraft = res?.policy || res || draftClone;
    } catch (err) {
      console.warn('Could not save draft clone via API, using client copy:', err);
      savedDraft = { ...draftClone, id: `draft-clone-${Date.now()}` };
    }

    setMakerCheckerData(prev => ({
      ...prev,
      drafts: [savedDraft, ...(prev.drafts || [])]
    }));
    setAllPolicies(prev => [savedDraft, ...(Array.isArray(prev) ? prev : [])]);
    setActiveWorkspaceView('change_management');
    setSelectedDraft(savedDraft);
    setEditingPolicy(savedDraft);
    setPreselectedDept({
      id: savedDraft.department_id,
      name: policyToCopy.department_name || ''
    });
    setIsAddPolicyModalOpen(true);
  };

  return (
    <div className="home-page p-0 flex flex-col h-full w-full overflow-hidden bg-[var(--bg-primary,#f8fafc)] text-[var(--text-primary,#0f172a)]">
      <div className="flex-1 flex overflow-hidden relative bg-[var(--bg-primary,#f8fafc)]">
        {/* Pane 1: Center Workspace (Full width, no redundant hierarchy column) */}
        {activeWorkspaceView === 'change_management' ? (
          <ChangeManagementCenterPane
            currentUser={currentUser}
            drafts={
              (makerCheckerData.drafts && makerCheckerData.drafts.length > 0)
                ? [
                    ...makerCheckerData.drafts,
                    ...allPolicies.filter(p => p.status === 'draft' && !makerCheckerData.drafts.some(d => String(d.id) === String(p.id)))
                  ]
                : allPolicies.filter(p => p.status === 'draft')
            }
            inReviewItems={makerCheckerData.pending}
            historyItems={makerCheckerData.history}
            policies={allPolicies}
            onBackToPolicy={null}
            onOpenAddPolicyModal={handleOpenAddPolicyModal}
                        onEditDraft={(draft) => {
              const basePolicy = allPolicies.find(p => String(p.id) === String(draft.id)) || {};
              const baseParams = typeof basePolicy.parameters === 'string'
                ? (() => { try { return JSON.parse(basePolicy.parameters || '{}'); } catch { return {}; } })()
                : (basePolicy.parameters || {});
              const draftParams = typeof draft.parameters === 'string'
                ? (() => { try { return JSON.parse(draft.parameters || '{}'); } catch { return {}; } })()
                : (draft.parameters || {});
              const mergedDraft = {
                ...basePolicy,
                ...draft,
                parameters: { ...baseParams, ...draftParams }
              };
              setViewingDraft(mergedDraft);
              setSelectedPolicyId(mergedDraft.id);
              setActiveWorkspaceView('policy');
              setIsDraftEditing(true);
            }}
            onRefresh={() => {
              setRefreshTrigger(prev => prev + 1);
              loadMakerChecker();
              loadPolicies();
            }}
            initialTab={urlTab || (focusedReviewItemId ? 'in_review' : 'drafts')}
            focusedItemId={focusedReviewItemId}
            onSelectDraft={(draft) => setSelectedDraft(draft)}
            selectedDraftId={selectedDraft?.id}
            onViewDraft={(draft) => {
              const fullPolicy = allPolicies.find(p => p.id === draft.id) || draft;
              setViewingDraft(fullPolicy);
              setSelectedPolicyId(fullPolicy.id);
              setActiveWorkspaceView('policy');
            }}
          />
        ) : activeWorkspaceView === 'tasks' ? (
          <TasksWorkspaceCenterPane
            currentUser={currentUser}
            onBackToPolicy={() => setActiveWorkspaceView('policy')}
            onOpenPolicy={(policyId) => {
              const isDraft = allPolicies.some(p => String(p.id) === String(policyId) && p.status === 'draft') || 
                              makerCheckerData.drafts?.some(d => String(d.id) === String(policyId)) ||
                              String(policyId).toLowerCase().includes('draft');
              if (isDraft) {
                const foundDraft = allPolicies.find(p => String(p.id) === String(policyId)) || 
                                   makerCheckerData.drafts?.find(d => String(d.id) === String(policyId)) ||
                                   { id: policyId, status: 'draft', title: 'Assigned Draft Policy' };
                setSelectedDraft(foundDraft);
                setEditingPolicy(foundDraft);
                setActiveWorkspaceView('change_management');
                setPreselectedDept({
                  id: foundDraft.department_id || foundDraft.deptId || null,
                  name: foundDraft.department_name || ''
                });
                setIsAddPolicyModalOpen(true);
              } else {
                setSelectedPolicyId(policyId);
                setActiveWorkspaceView('policy');
              }
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
              setEditingPolicy({
                title: tpl.title,
                summary: tpl.summary,
                department_id: tpl.department_id,
                parameters: {
                  turnaround_sla: tpl.sla,
                  daily_limit: tpl.daily_limit,
                  approval_limits: { officer_cap: tpl.officer_cap },
                  sections: typeof tpl.sections === 'string' ? JSON.parse(tpl.sections) : (tpl.sections || [])
                }
              });
              setPreselectedDept({ id: tpl.department_id, name: tpl.department_name || '' });
              setIsAddPolicyModalOpen(true);
            }}
          />
        ) : (
          <PolicyWorkspacePane
            policy={viewingDraft || activePolicy}
            currentUser={currentUser}
            canEditPolicy={true}
            canCreateDocument={true}
            initialEditMode={isDraftEditing}
            noteNavTarget={
              location.state?.noteNavTarget ||
              (urlNoteNav ? getUserNoteById(authUser || currentUser, urlNoteNav) : null)
            }
            onDraftSaved={(savedDoc) => {
              setIsDraftEditing(false);
              if (savedDoc && savedDoc.id) {
                setViewingDraft((prev) => (prev && String(prev.id) === String(savedDoc.id) ? savedDoc : prev));
                setAllPolicies((prev) =>
                  Array.isArray(prev)
                    ? prev.map((p) => (String(p.id) === String(savedDoc.id) ? { ...p, ...savedDoc } : p))
                    : prev
                );
                setRefreshTrigger((prev) => prev + 1);
              }
            }}
            onOpenCopyTemplate={async (doc) => {
              const baseDoc = doc || activePolicy || DEFAULT_POLICIES[0];
              if (!baseDoc) return;

              let resolvedDoc = baseDoc;
              let parentVers = Array.isArray(baseDoc.versions) ? baseDoc.versions : [];
              if (baseDoc.id && !String(baseDoc.id).startsWith('draft-clone-')) {
                try {
                  const [fullRes, versRes] = await Promise.allSettled([
                    !baseDoc.content || !(baseDoc.parameters?.sections?.length)
                      ? apiService.getPolicyDetails(baseDoc.id, currentUser?.roleType || 'employee')
                      : Promise.resolve(null),
                    parentVers.length === 0
                      ? apiService.getPolicyVersions(baseDoc.id)
                      : Promise.resolve(null),
                  ]);
                  if (fullRes.status === 'fulfilled' && fullRes.value) {
                    resolvedDoc = { ...baseDoc, ...fullRes.value };
                    if (Array.isArray(fullRes.value.versions) && fullRes.value.versions.length > 0) {
                      parentVers = fullRes.value.versions;
                    }
                  }
                  if (versRes.status === 'fulfilled' && Array.isArray(versRes.value) && versRes.value.length > 0) {
                    parentVers = versRes.value;
                  }
                } catch (_) {}
              }

              const srcParams = typeof resolvedDoc.parameters === 'string'
                ? (() => { try { return JSON.parse(resolvedDoc.parameters || '{}'); } catch { return {}; } })()
                : (resolvedDoc.parameters || {});

              let copySections = Array.isArray(srcParams.sections) ? srcParams.sections : [];
              if (copySections.length === 0 && resolvedDoc.content) {
                const raw = String(resolvedDoc.content);
                const parts = raw.split(/(?=###\s+)/).filter((p) => p.trim());
                if (parts.length > 0) {
                  copySections = parts.map((part, idx) => {
                    const match = part.match(/^###\s*(?:\d+\.?\s*)?(.*?)\n([\s\S]*)$/);
                    return {
                      id: `tpl-copy-sec-${idx + 1}-${Date.now()}`,
                      title: match ? match[1].trim() : `Section ${idx + 1}`,
                      content: match ? match[2].trim() : part.trim(),
                      type: 'section',
                    };
                  });
                }
              }

              const curVer = String(resolvedDoc.version || srcParams.version || '1.0').replace(/^v/i, '');
              const normalizedParentHistory = [
                ...(Array.isArray(parentVers) ? parentVers : []),
                ...(Array.isArray(srcParams.versions) ? srcParams.versions : []),
              ].map((v, idx) => {
                const verNum = String(v.version_number || v.version || curVer).replace(/^v/i, '');
                const verTs = v.created_at || v.timestamp || resolvedDoc.updated_at || resolvedDoc.created_at || new Date().toISOString();
                return {
                  ...v,
                  id: v.id || `parent-${resolvedDoc.id}-${verNum}-${idx}`,
                  policy_id: v.policy_id || resolvedDoc.id,
                  version: verNum,
                  version_number: verNum,
                  title: v.title || resolvedDoc.title,
                  summary: v.summary || resolvedDoc.summary || '',
                  content: v.content || resolvedDoc.content || '',
                  sections: Array.isArray(v.sections) && v.sections.length > 0 ? v.sections : copySections,
                  timestamp: verTs,
                  created_at: verTs,
                  author: v.changed_by || v.author || resolvedDoc.created_by || 'Policy Owner',
                  changed_by: v.changed_by || v.author || resolvedDoc.created_by || 'Policy Owner',
                  notes: v.change_summary || v.notes || `Parent baseline (${resolvedDoc.title})`,
                  change_summary: v.change_summary || v.notes || `Parent baseline (${resolvedDoc.title})`,
                  source: v.source || 'parent_policy',
                  status_tag: v.status_tag || 'parent',
                };
              });

              const fallbackParentBaseline = {
                id: `parent-base-${resolvedDoc.id}`,
                policy_id: resolvedDoc.id,
                version: curVer,
                version_number: curVer,
                title: resolvedDoc.title,
                summary: resolvedDoc.summary || '',
                content: resolvedDoc.content || '',
                sections: copySections,
                timestamp: resolvedDoc.updated_at || resolvedDoc.created_at || new Date().toISOString(),
                created_at: resolvedDoc.updated_at || resolvedDoc.created_at || new Date().toISOString(),
                author: resolvedDoc.created_by || 'Policy Owner',
                changed_by: resolvedDoc.created_by || 'Policy Owner',
                notes: `Parent baseline (${resolvedDoc.title})`,
                change_summary: `Parent baseline (${resolvedDoc.title})`,
                source: 'parent_policy',
                status_tag: 'parent',
              };

              const draftTemplateCopy = {
                isTemplateCopy: true,
                department_id: resolvedDoc.department_id || resolvedDoc.deptId || 'company-policies',
                department_name: resolvedDoc.department_name || '',
                title: resolvedDoc.title ? `${resolvedDoc.title} (Copy)` : 'Copied Operational Policy',
                summary: resolvedDoc.summary || '',
                content: resolvedDoc.content || '',
                status: 'draft',
                version: '1.0',
                parameters: {
                  ...srcParams,
                  version: '1.0',
                  copied_from: resolvedDoc.id,
                  sections: copySections.map((s, idx) => ({
                    ...s,
                    id: `tpl-copy-sec-${idx + 1}-${Date.now()}`,
                  })),
                  versions: normalizedParentHistory.length > 0 ? normalizedParentHistory : [fallbackParentBaseline],
                },
                versions: normalizedParentHistory.length > 0 ? normalizedParentHistory : [fallbackParentBaseline],
              };

              setEditingPolicy(draftTemplateCopy);
              setIsDraftEditing(false);
              setPreselectedDept({
                id: draftTemplateCopy.department_id,
                name: draftTemplateCopy.department_name || ''
              });
              setAddPolicyInitialMode('direct');
              setIsAddPolicyModalOpen(true);
            }}
            onOpenConfigureModal={(doc) => {
              const isDraft = Boolean(viewingDraft || doc?.status === 'draft' || doc?.status === 'pending_approval');
              if (isDraft) {
                const target =
                  doc && (!viewingDraft || String(doc.id) === String(viewingDraft.id))
                    ? { ...(viewingDraft || {}), ...doc }
                    : (doc || viewingDraft);
                setEditingPolicy(target);
                setPreselectedDept({
                  id: target.department_id || target.deptId || null,
                  name: target.department_name || ''
                });
                setIsAddPolicyModalOpen(true);
              } else {
                handleConfigurePolicyCopy(doc);
              }
            }}
            onToggleStatus={handleTogglePolicyStatus}
            onToggleMasking={handleTogglePolicyMasking}
            onOpenExportModal={() => setIsExportModalOpen(true)}
            refreshTrigger={refreshTrigger}
            isDraftView={Boolean(viewingDraft || activePolicy?.status === 'draft' || activePolicy?.status === 'pending_approval')}
            onBackToChangeManagement={
              (viewingDraft || activePolicy?.status === 'draft' || activePolicy?.status === 'pending_approval')
                ? () => {
                    setViewingDraft(null);
                    setIsDraftEditing(false);
                    setActiveWorkspaceView('change_management');
                  }
                : null
            }
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
              openedDocument={
                viewingDraft || (
                  activeWorkspaceView === 'change_management'
                    ? (selectedDraft || makerCheckerData.drafts?.[0] || allPolicies.find(p => p.status === 'draft') || null)
                    : activePolicy
                )
              }
              activePolicy={viewingDraft || activePolicy}
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
              policies={safeAllPolicies}
              drafts={makerCheckerData.drafts || []}
              activeWorkspaceView={activeWorkspaceView}
              onOpenDraft={(draft) => {
                const fullPolicy = safeAllPolicies.find(p => p.id === draft.id) || draft;
                setSelectedDraft(fullPolicy);
                setEditingPolicy(fullPolicy);
                setPreselectedDept({
                  id: fullPolicy.department_id || fullPolicy.deptId || null,
                  name: fullPolicy.department_name || ''
                });
                setIsAddPolicyModalOpen(true);
              }}
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
        onClose={() => {
          setIsAddPolicyModalOpen(false);
          setAddPolicyInitialMode('direct');
          const wasDraft = editingPolicy?.status === 'draft' || editingPolicy?.status === 'pending_approval';
          setEditingPolicy(null);
          setIsDraftEditing(false);
          if (wasDraft) {
            setViewingDraft(null);
            setActiveWorkspaceView('change_management');
          }
        }}
        initialCreationMode={addPolicyInitialMode}
        masterPolicies={allPolicies}
        editingPolicy={editingPolicy}
        preselectedDepartmentId={preselectedDept.id}
        preselectedDepartmentName={preselectedDept.name}
        currentUser={currentUser}
        departments={departments}
        onPolicyCreated={(newPolicy) => {
          setEditingPolicy(null);
          setAddPolicyInitialMode('direct');
          setIsDraftEditing(false);
          setRefreshTrigger(prev => prev + 1);
          setIsAddPolicyModalOpen(false);
          const pId = typeof newPolicy === 'string' ? newPolicy : (newPolicy && newPolicy.id);
          if (pId) {
            setSelectedPolicyId(pId);
            if (newPolicy?.status !== 'draft' && newPolicy?.status !== 'pending_approval') {
              setViewingDraft(null);
              setActiveWorkspaceView('policy');
            } else {
              setViewingDraft(prev => (prev && String(prev.id) === String(pId) ? newPolicy : prev));
              setSelectedDraft(newPolicy);
              setActiveWorkspaceView('change_management');
            }
          }
          if (newPolicy && typeof newPolicy === 'object' && newPolicy.id) {
            setAllPolicies(prev => {
              const list = Array.isArray(prev) ? prev : [];
              const exists = list.some(p => String(p.id) === String(newPolicy.id));
              if (exists) {
                return list.map(p => String(p.id) === String(newPolicy.id) ? { ...p, ...newPolicy } : p);
              }
              return [newPolicy, ...list];
            });
            if (newPolicy.status === 'draft') {
              setMakerCheckerData(prev => ({
                ...prev,
                drafts: [newPolicy, ...(prev.drafts || []).filter(d => String(d.id) !== String(newPolicy.id))]
              }));
            }
          }
          loadPolicies();
          loadMakerChecker();
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
