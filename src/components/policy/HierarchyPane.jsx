import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Pin, 
  GripVertical, 
  ChevronRight, 
  Plus, 
  Folder, 
  Shield, 
  Users, 
  CreditCard, 
  Laptop, 
  Landmark, 
  Scale, 
  Megaphone, 
  FileText, 
  UserCheck, 
  Wrench, 
  FolderKanban, 
  FileCode,
  Layers,
  X,
  ListChecks,
  Link as LinkIcon,
  CheckCircle2,
  Building2,
  Box,
  Check,
  Sliders,
  RefreshCw
} from 'lucide-react';
import { apiService } from '../../services/apiService';
import { DEFAULT_DEPARTMENTS } from '../../data/defaultPolicies';

// Clean stroke icons
const getDeptIcon = (iconName, className = "w-4 h-4 text-slate-600") => {
  switch (iconName) {
    case 'megaphone': return <Megaphone className={className} strokeWidth={1.75} />;
    case 'shield': return <Shield className={className} strokeWidth={1.75} />;
    case 'headset': return <Users className={className} strokeWidth={1.75} />;
    case 'cpu': return <Wrench className={className} strokeWidth={1.75} />;
    case 'piggy-bank': return <Landmark className={className} strokeWidth={1.75} />;
    case 'users': return <Users className={className} strokeWidth={1.75} />;
    case 'laptop': return <Laptop className={className} strokeWidth={1.75} />;
    case 'scale': return <Scale className={className} strokeWidth={1.75} />;
    case 'edit': return <FileText className={className} strokeWidth={1.75} />;
    case 'user-check': return <UserCheck className={className} strokeWidth={1.75} />;
    case 'tool': return <Wrench className={className} strokeWidth={1.75} />;
    case 'folder-kanban': return <FolderKanban className={className} strokeWidth={1.75} />;
    case 'file-text': return <FileCode className={className} strokeWidth={1.75} />;
    case 'credit-card': return <CreditCard className={className} strokeWidth={1.75} />;
    default: return <Folder className={className} strokeWidth={1.75} />;
  }
};

export default function HierarchyPane({
  selectedDepartmentId = 'all',
  onSelectDepartment,
  policies = [],
  selectedPolicyId,
  onSelectPolicy,
  onOpenAddPolicyModal,
  onOpenVectorSpace,
  onOpenMakerChecker,
  onOpenConfigureModal,
  canCreateDocument = true,
  isMobileOpen,
  onCloseMobile,
  isCollapsed = false,
  width = 280,
  refreshTrigger = 0,
  currentUser = { roleType: 'employee' },
  activeWorkspaceView = 'policy',
  onSelectWorkspaceView
}) {
  const [departments, setDepartments] = useState(DEFAULT_DEPARTMENTS);
  const [internalPolicies, setInternalPolicies] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Pinned libraries state (persisted in localStorage)
  const [pinnedPolicyIds, setPinnedPolicyIds] = useState(() => {
    try {
      const saved = localStorage.getItem('liblist_pinned_policies');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return ['personal-loans-assessment-sop', 'aml-ctf-screening-policy'];
  });

  // Task List state & Modal
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [tasks, setTasks] = useState([
    { id: 'TSK-001', code: 'APS220-CR-01', desc: 'APS220-CR-01 Serviceability rate assessment buffer verification. Completed in meeting.', assigned: '@per2', date: '10/23/2026', status: 'Completed', completed: true },
    { id: 'TSK-002', code: 'DTI-CAP-02', desc: 'Free text - Under review for DTI Cap 6.0x exception limits.', assigned: '@per2', date: '10/18/2026', status: 'Reassigned', completed: false },
    { id: 'TSK-003', code: 'CDR-OPEN-03', desc: 'Self Reminder: Check APRA guidance updates on Open Banking streams.', assigned: '@self', date: '10/08/2026', status: 'In Progress', completed: false }
  ]);

  // Default expanded to primary banking libraries so policies are immediately visible
  const [expandedDeptIds, setExpandedDeptIds] = useState(['credit-cards', 'retail-lending', 'onboarding', 'security', 'legal-compliance']);

  const toggleDeptExpand = (deptId, e) => {
    if (e) e.stopPropagation();
    setExpandedDeptIds(prev => 
      prev.includes(deptId) 
        ? prev.filter(id => id !== deptId) 
        : [...prev, deptId]
    );
  };

  const handleTogglePin = (policyId, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setPinnedPolicyIds(prev => {
      const updated = prev.includes(policyId)
        ? prev.filter(id => id !== policyId)
        : [...prev, policyId];
      try {
        localStorage.setItem('liblist_pinned_policies', JSON.stringify(updated));
      } catch (err) {
        // ignore
      }
      return updated;
    });
  };

  const handleContextMenu = (policyId, e) => {
    e.preventDefault();
    e.stopPropagation();
    handleTogglePin(policyId, e);
  };

  // Fetch live hierarchy & fallback policies — lightweight (no content body)
  const loadHierarchy = async () => {
    try {
      const userRole = currentUser?.roleType || 'employee';
      const data = await apiService.getHierarchy();
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

      // Lightweight policy list from DB (no content — just id, title, status, version, department_id)
      const polData = await apiService.getPolicies('all', '', userRole);
      if (polData && Array.isArray(polData)) {
        setInternalPolicies(polData);
      } else {
        setInternalPolicies([]);
      }
    } catch (err) {
      console.error('Failed to load hierarchy:', err);
      setDepartments(DEFAULT_DEPARTMENTS);
      setInternalPolicies([]);
    }
  };

  useEffect(() => {
    loadHierarchy();
  }, [refreshTrigger, currentUser?.roleType]);

  // Canonical policy list: prioritize policies from DB
  const sourceList = (Array.isArray(policies) && policies.length > 0)
    ? policies
    : (Array.isArray(internalPolicies) ? internalPolicies : []);

  const policyMap = new Map();
  sourceList.forEach(p => {
    if (p && p.id) policyMap.set(p.id, p);
  });
  const allAvailablePolicies = Array.from(policyMap.values());

  // Filter departments: Only show primary active banking categories
  const primaryDeptIds = ['credit-cards', 'retail-lending', 'onboarding', 'security', 'legal-compliance'];
  const activeDepartments = departments.filter(d => 
    primaryDeptIds.includes(d.id) || (d.count && d.count > 0)
  );

  const displayedPrimary = activeDepartments.filter(d => 
    d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    allAvailablePolicies.some(p => p.department_id === d.id && p.title.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Get pinned policies objects
  const pinnedPolicies = allAvailablePolicies.filter(p => pinnedPolicyIds.includes(p.id));

  if (isCollapsed) return null;

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs z-40 md:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        style={{ width: `${width}px` }}
        className={`
          flex-shrink-0 bg-[#f0f4f9] border-r border-[#dbe4ef] flex flex-col h-[calc(100vh-3.5rem)] select-none transition-all duration-200
          ${isMobileOpen 
            ? 'fixed inset-y-0 left-0 z-50 shadow-xl !w-80' 
            : 'relative z-10'}
        `}
      >
        {/* Top Search bar */}
        <div className="p-3 bg-[#f0f4f9] pb-1.5 border-b border-[#e2e8f0]">
          <div className="relative flex items-center group/search">
            <Search className="w-3.5 h-3.5 text-[#0057B8] absolute left-3 top-1/2 -translate-y-1/2 transition-colors pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search sections..."
              className="w-full bg-white border-2 border-[#0057B8]/40 hover:border-[#0057B8] focus:border-[#0057B8] focus:ring-2 focus:ring-[#0057B8]/20 rounded-xl pl-8 pr-8 py-1.5 text-[12px] text-slate-800 placeholder-slate-400 outline-none transition shadow-2xs font-medium"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                title="Clear search"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full text-slate-400 hover:text-white hover:bg-[#0057B8] transition cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Scrollable Navigation Area */}
        <div className="flex-1 overflow-y-auto px-2 py-2 space-y-3.5 custom-scrollbar">

          {/* 1. PINNED LIBRARIES */}
          <div className="space-y-1 pt-1 border-t border-slate-200/80">
            <div className="px-2 py-1 text-[10.5px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
              <span>Pinned Libraries</span>
              <Pin className="w-3 h-3 text-slate-400" />
            </div>

            <nav className="space-y-0.5">
              {pinnedPolicies.length === 0 ? (
                <div className="px-2.5 py-1.5 text-[11px] text-slate-400 italic bg-white/50 rounded-lg border border-dashed border-slate-200">
                  None selected
                  <span className="block text-[10px] text-slate-400 not-italic mt-0.5">
                    Right-click any library to pin
                  </span>
                </div>
              ) : (
                pinnedPolicies.map(pol => {
                  const isPolSelected = selectedPolicyId === pol.id;
                  return (
                    <div
                      key={`pinned-${pol.id}`}
                      onClick={() => {
                        if (onSelectPolicy) onSelectPolicy(pol.id);
                        if (onSelectWorkspaceView) onSelectWorkspaceView('policy');
                      }}
                      onContextMenu={(e) => handleContextMenu(pol.id, e)}
                      className={`group flex items-center justify-between px-2.5 py-1.5 text-[11.5px] rounded-lg transition cursor-pointer border ${
                        isPolSelected
                          ? 'bg-[#0057B8] text-white border-[#0057B8] shadow-2xs font-medium'
                          : 'bg-white hover:bg-blue-50/60 text-slate-700 border-slate-200/80 hover:border-blue-300'
                      }`}
                      title={`${pol.title} (Right-click to unpin)`}
                    >
                      <span className="truncate flex items-center gap-1.5 flex-1 min-w-0 pr-1">
                        <LinkIcon className={`w-3 h-3 shrink-0 ${isPolSelected ? 'text-blue-200' : 'text-[#0057B8]'}`} />
                        <span className="truncate">{pol.title}</span>
                      </span>
                      <div className="flex items-center gap-1 shrink-0">
                        <span className={`text-[9.5px] font-mono px-1 py-0.2 rounded ${
                          isPolSelected ? 'bg-blue-900/60 text-blue-100' : 'bg-slate-100 text-slate-500'
                        }`}>
                          v{pol.version || '1.0'}
                        </span>
                        <button
                          onClick={(e) => handleTogglePin(pol.id, e)}
                          title="Unpin"
                          className={`p-0.5 rounded transition ${
                            isPolSelected ? 'hover:bg-blue-800 text-blue-200' : 'hover:bg-slate-200 text-slate-400'
                          }`}
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </nav>
          </div>

          {/* 3. LIBRARY LIST (WITH DIRECTLY VISIBLE '+' BUTTON, NO SHOW ALL) */}
          <div className="space-y-1 pt-1 border-t border-slate-200/80">
            <div className="px-2 py-1 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-[#0057B8]" />
                <h2 className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  Library List
                </h2>
              </div>

              {/* Directly visible + button */}
              {canCreateDocument && (
                <button
                  onClick={() => onOpenAddPolicyModal && onOpenAddPolicyModal()}
                  className="p-1 rounded-md text-[#0057B8] hover:bg-blue-100 hover:text-blue-900 border border-[#0057B8]/30 bg-white transition cursor-pointer flex items-center justify-center shadow-2xs"
                  title="Create or Ingest Operational Policy"
                  aria-label="Create Policy"
                >
                  <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
                </button>
              )}
            </div>

            {/* Root CBA Bank Node Card */}
            <div className="px-2.5 py-1.5 bg-white rounded-lg border border-slate-200/90 flex items-center justify-between text-[12px] font-semibold text-slate-800 shadow-2xs mb-1.5">
              <span className="flex items-center gap-1.5 truncate">
                <Building2 className="w-3.5 h-3.5 text-[#0057B8] shrink-0" />
                <span className="truncate">CBA - Retail Standards</span>
              </span>
              <span className="text-[10px] bg-blue-50 text-[#0057B8] font-bold px-1.5 py-0.2 rounded border border-blue-200/60 shrink-0">
                4 Products
              </span>
            </div>

            {/* PRIMARY ACTIVE CATEGORIES WITH EXPANDABLE HIERARCHY */}
            <div className="space-y-1">
              {displayedPrimary.map((dept) => {
                const isSelected = selectedDepartmentId === dept.id;
                const isExpanded = expandedDeptIds.includes(dept.id);
                const deptPolicies = allAvailablePolicies.filter(p => p.department_id === dept.id);

                return (
                  <div key={dept.id} className="space-y-0.5">
                    <div
                      className={`group relative flex items-center justify-between rounded-lg px-2.5 py-1.5 transition-colors cursor-pointer ${
                        isSelected 
                          ? 'bg-[#0057B8]/10 text-[#0057B8] font-semibold border-l-2 border-[#0057B8] shadow-2xs' 
                          : 'hover:bg-slate-100/80 text-slate-700'
                      }`}
                      onClick={() => {
                        onSelectDepartment(dept.id);
                        toggleDeptExpand(dept.id);
                      }}
                    >
                      {/* Left side: Chevron, Icon, Name */}
                      <div className="flex items-center gap-1.5 min-w-0 flex-1">
                        {/* Chevron Clickable Toggle */}
                        <button
                          type="button"
                          onClick={(e) => toggleDeptExpand(dept.id, e)}
                          className="text-slate-400 hover:text-slate-700 transition flex-shrink-0 p-0.5 rounded hover:bg-slate-300/40"
                          title={isExpanded ? "Collapse hierarchy" : "Expand hierarchy"}
                        >
                          <ChevronRight className={`w-3.5 h-3.5 transition-transform duration-150 ${isExpanded ? 'rotate-90 text-slate-800' : ''}`} />
                        </button>

                        <div className="flex-shrink-0">
                          {getDeptIcon(dept.icon, `w-3.5 h-3.5 ${isSelected ? 'text-slate-900' : 'text-slate-600'}`)}
                        </div>

                        <span className="truncate text-[12px] tracking-tight">
                          {dept.name}
                        </span>
                      </div>

                      {/* Right side: Clean Count and Directly Visible '+' button */}
                      <div className="flex items-center gap-1 flex-shrink-0 ml-1">
                        <span className={`text-[11px] font-medium px-1.5 py-0.2 rounded ${
                          isSelected 
                            ? 'bg-white text-slate-800 shadow-2xs' 
                            : 'text-slate-500 bg-slate-200/50'
                        }`}>
                          {deptPolicies.length || dept.count || 0}
                        </span>

                        {canCreateDocument && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (onOpenAddPolicyModal) onOpenAddPolicyModal(dept.id, dept.name);
                            }}
                            className="p-1 hover:bg-blue-100 text-slate-500 hover:text-[#0057B8] rounded transition cursor-pointer flex items-center justify-center"
                            title={`Add policy to ${dept.name}`}
                            aria-label={`Add to ${dept.name}`}
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* CHILD POLICIES EXPANDED UNDERNEATH DEPARTMENT */}
                    {isExpanded && (
                      <div className="ml-5 pl-2.5 border-l border-slate-300/70 my-1 space-y-1 animate-in fade-in duration-150">
                        {deptPolicies.length === 0 ? (
                          <div className="py-1 px-2 text-[11px] text-slate-400 italic flex items-center justify-between bg-slate-50/50 rounded">
                            <span>No policies authored</span>
                            {canCreateDocument && (
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (onOpenAddPolicyModal) onOpenAddPolicyModal(dept.id, dept.name);
                                }}
                                className="text-slate-700 hover:text-slate-900 font-semibold text-[10.5px] underline cursor-pointer"
                              >
                                + Add
                              </button>
                            )}
                          </div>
                        ) : (
                          deptPolicies.map(pol => {
                            const isPolSelected = selectedPolicyId === pol.id;
                            const isPinnedPol = pinnedPolicyIds.includes(pol.id);
                            const isDraft = pol.status === 'draft';

                            return (
                              <div
                                key={pol.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (onSelectPolicy) onSelectPolicy(pol.id);
                                  if (onSelectWorkspaceView) onSelectWorkspaceView('policy');
                                }}
                                onContextMenu={(e) => handleContextMenu(pol.id, e)}
                                className={`group/pol flex items-center justify-between py-1.5 px-2.5 rounded-lg text-[11.5px] transition cursor-pointer border ${
                                  isPolSelected
                                    ? 'bg-[#0057B8] text-white font-medium border-[#0057B8] shadow-sm'
                                    : isDraft
                                    ? 'bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100'
                                    : 'text-slate-700 hover:bg-white border-transparent hover:border-slate-200 hover:shadow-xs'
                                }`}
                                title={`${pol.title}${isDraft ? ' (Draft — pending Bank Administrator approval)' : ''}`}
                              >
                                {/* Left: Icon + clean product name */}
                                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                  {isDraft ? (
                                    <span className={`w-2 h-2 rounded-full flex-shrink-0 bg-amber-400 ${isPolSelected ? 'bg-amber-300' : ''}`} />
                                  ) : pol.is_product ? (
                                    <CreditCard className={`w-3 h-3 flex-shrink-0 ${isPolSelected ? 'text-amber-300' : 'text-blue-600'}`} />
                                  ) : (
                                    <FileText className={`w-3 h-3 flex-shrink-0 ${isPolSelected ? 'text-slate-200' : 'text-slate-400 group-hover/pol:text-slate-600'}`} />
                                  )}
                                  {/* Product name — truncated cleanly */}
                                  <span className="truncate tracking-tight font-medium leading-none">
                                    {pol.title}
                                  </span>
                                </div>

                                {/* Right: version badge + pin + draft badge */}
                                <div className="flex items-center gap-1 flex-shrink-0 ml-1.5">
                                  {isDraft && (
                                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                                      isPolSelected ? 'bg-amber-400 text-amber-950' : 'bg-amber-200 text-amber-800'
                                    }`}>Draft</span>
                                  )}
                                  <span className={`text-[9.5px] font-mono px-1 py-0.5 rounded ${
                                    isPolSelected ? 'bg-blue-800/60 text-blue-100' : isDraft ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-400'
                                  }`}>
                                    v{pol.version || '1.0'}
                                  </span>
                                  <button
                                    onClick={(e) => handleTogglePin(pol.id, e)}
                                    title={isPinnedPol ? 'Unpin library' : 'Pin library'}
                                    className={`p-0.5 rounded transition cursor-pointer opacity-0 group-hover/pol:opacity-100 ${
                                      isPolSelected
                                        ? 'text-blue-200 hover:text-white opacity-100'
                                        : isPinnedPol ? 'text-amber-500 opacity-100' : 'text-slate-300 hover:text-[#0057B8]'
                                    }`}
                                  >
                                    <Pin className={`w-2.5 h-2.5 ${isPinnedPol ? 'fill-current' : ''}`} />
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
          </div>

        </div>

        {/* TASK LIST MODAL */}
        {isTaskModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-5 w-full max-w-lg space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#0057B8] flex items-center justify-center font-bold">
                    <ListChecks className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Liblist Tasks & Assignments</h3>
                    <p className="text-[11px] text-slate-500">Manage, reassign, and track regulatory compliance tasks</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsTaskModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Task Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-[11.5px]">
                  <thead className="bg-slate-50 text-slate-500 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="p-2.5">Status</th>
                      <th className="p-2.5">Task ID</th>
                      <th className="p-2.5">Assigned</th>
                      <th className="p-2.5">Description</th>
                      <th className="p-2.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {tasks.map(task => (
                      <tr key={task.id} className="hover:bg-slate-50/80">
                        <td className="p-2.5">
                          <input 
                            type="checkbox" 
                            checked={task.completed} 
                            onChange={() => {
                              setTasks(prev => prev.map(t => t.id === task.id ? { ...t, completed: !t.completed } : t));
                            }}
                            className="rounded border-slate-300 text-[#0057B8] focus:ring-0 cursor-pointer" 
                          />
                        </td>
                        <td className="p-2.5 font-mono font-bold text-[#0057B8]">{task.id}</td>
                        <td className="p-2.5">
                          <span className="bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded font-mono text-[10px] border border-purple-200">
                            {task.assigned}
                          </span>
                        </td>
                        <td className="p-2.5 text-slate-700 font-normal">{task.desc}</td>
                        <td className="p-2.5 text-right">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            task.status === 'Completed'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : task.status === 'Reassigned'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-blue-50 text-blue-700 border border-blue-200'
                          }`}>
                            {task.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setIsTaskModalOpen(false)}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-[#0057B8] hover:bg-blue-700 rounded-lg shadow-xs transition cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
