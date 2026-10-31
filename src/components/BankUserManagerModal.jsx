import React, { useState } from 'react';
import { 
  X, 
  Users, 
  ShieldCheck, 
  Lock, 
  Check, 
  Plus, 
  UserPlus, 
  FileEdit, 
  FileText, 
  Building2,
  AlertCircle,
  Eye,
  EyeOff,
  Search
} from 'lucide-react';


export default function BankUserManagerModal({
  isOpen,
  onClose,
  currentUser,
  bankUsers = [],
  onUpdateBankUsers,
  policies = []
}) {
  const [usersList, setUsersList] = useState(bankUsers.length > 0 ? bankUsers : [
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
        'customer-onboarding-sop': { canView: true, canEdit: true },
        'remote-access-security-policy': { canView: true, canEdit: false },
        'vip-executive-escalation-sop': { canView: false, canEdit: false }
      },
      allowedPolicyIds: ['credit-card-limits-policy', 'customer-onboarding-sop', 'remote-access-security-policy'],
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
        'customer-onboarding-sop': { canView: true, canEdit: false },
        'remote-access-security-policy': { canView: true, canEdit: true },
        'vip-executive-escalation-sop': { canView: false, canEdit: false }
      },
      allowedPolicyIds: ['remote-access-security-policy', 'customer-onboarding-sop'],
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
        'customer-onboarding-sop': { canView: false, canEdit: false },
        'remote-access-security-policy': { canView: false, canEdit: false },
        'vip-executive-escalation-sop': { canView: false, canEdit: false }
      },
      allowedPolicyIds: ['credit-card-limits-policy'],
      lastActive: 'Yesterday, 4:50 PM'
    },
    {
      id: 'liam_chen',
      name: 'Liam Chen',
      role: 'Bank Employee',
      roleType: 'employee',
      department: 'Compliance Oversight',
      canView: true,
      canCreate: false,
      canEdit: false,
      policyPermissions: {
        'credit-card-limits-policy': { canView: false, canEdit: false },
        'customer-onboarding-sop': { canView: true, canEdit: false },
        'remote-access-security-policy': { canView: true, canEdit: false },
        'vip-executive-escalation-sop': { canView: false, canEdit: false }
      },
      allowedPolicyIds: ['customer-onboarding-sop', 'remote-access-security-policy'],
      lastActive: '23 Oct 2026'
    },
    {
      id: 'marcus_vance',
      name: 'Marcus Vance',
      role: 'Bank Owner & Sign-Off Authority',
      roleType: 'manager',
      department: 'Executive Governance & Retail Lending',
      canView: true,
      canCreate: true,
      canEdit: true,
      policyPermissions: {
        'credit-card-limits-policy': { canView: true, canEdit: true },
        'customer-onboarding-sop': { canView: true, canEdit: true },
        'remote-access-security-policy': { canView: true, canEdit: true },
        'vip-executive-escalation-sop': { canView: true, canEdit: true }
      },
      allowedPolicyIds: ['credit-card-limits-policy', 'customer-onboarding-sop', 'remote-access-security-policy', 'vip-executive-escalation-sop'],
      lastActive: 'Now'
    }
  ]);

  const [selectedUserId, setSelectedUserId] = useState('sarah_jenkins');
  const [policySearchQuery, setPolicySearchQuery] = useState('');
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserRole, setNewUserRole] = useState('');
  const [newUserDept, setNewUserDept] = useState('');

  if (!isOpen) return null;

  const activeUser = usersList.find(u => u.id === selectedUserId) || usersList[0];

  // Direct Option 1: Toggle Global Can View
  const handleToggleGlobalView = () => {
    setUsersList(prev => prev.map(u => {
      if (u.id !== activeUser.id) return u;
      return { ...u, canView: !(u.canView !== false) };
    }));
  };

  // Direct Option 2: Toggle Global Can Create
  const handleToggleGlobalCreate = () => {
    setUsersList(prev => prev.map(u => {
      if (u.id !== activeUser.id) return u;
      const nextVal = !(u.canCreate !== false);
      return { ...u, canCreate: nextVal, canCreatePolicies: nextVal };
    }));
  };

  // Direct Option 3: Toggle Global Can Edit
  const handleToggleGlobalEdit = () => {
    setUsersList(prev => prev.map(u => {
      if (u.id !== activeUser.id) return u;
      return { ...u, canEdit: !(u.canEdit !== false) };
    }));
  };

  // Toggle Policy Can View (If disabled, policy is completely hidden from employee)
  const handleTogglePolicyView = (policyId) => {
    setUsersList(prev => prev.map(u => {
      if (u.id !== activeUser.id) return u;
      const currentPerms = u.policyPermissions || {};
      const currentPol = currentPerms[policyId] || { 
        canView: (u.allowedPolicyIds || []).includes(policyId), 
        canEdit: false 
      };
      const newCanView = !currentPol.canView;
      const updatedPerms = {
        ...currentPerms,
        [policyId]: {
          ...currentPol,
          canView: newCanView,
          canEdit: newCanView ? currentPol.canEdit : false
        }
      };
      const updatedAllowed = newCanView
        ? [...new Set([...(u.allowedPolicyIds || []), policyId])]
        : (u.allowedPolicyIds || []).filter(id => id !== policyId);

      return { ...u, policyPermissions: updatedPerms, allowedPolicyIds: updatedAllowed };
    }));
  };

  // Toggle Policy Can Edit
  const handleTogglePolicyEdit = (policyId) => {
    setUsersList(prev => prev.map(u => {
      if (u.id !== activeUser.id) return u;
      const currentPerms = u.policyPermissions || {};
      const currentPol = currentPerms[policyId] || { 
        canView: (u.allowedPolicyIds || []).includes(policyId), 
        canEdit: false 
      };
      const newCanEdit = !currentPol.canEdit;
      const updatedPerms = {
        ...currentPerms,
        [policyId]: {
          ...currentPol,
          canView: newCanEdit ? true : currentPol.canView,
          canEdit: newCanEdit
        }
      };
      const updatedAllowed = newCanEdit
        ? [...new Set([...(u.allowedPolicyIds || []), policyId])]
        : (u.allowedPolicyIds || []);

      return { ...u, policyPermissions: updatedPerms, allowedPolicyIds: updatedAllowed };
    }));
  };

  // Add new user
  const handleAddUser = (e) => {
    e.preventDefault();
    if (!newUserName.trim()) return;
    const newUser = {
      id: `user_${Date.now()}`,
      name: newUserName.trim(),
      role: newUserRole.trim() || 'Credit Officer',
      roleType: 'employee',
      department: newUserDept.trim() || 'Retail Operations',
      canView: true,
      canCreate: true,
      canEdit: true,
      allowedPolicyIds: ['credit-card-limits-policy'],
      lastActive: 'Just added'
    };
    const updated = [...usersList, newUser];
    setUsersList(updated);
    setSelectedUserId(newUser.id);
    setIsAddUserModalOpen(false);
    setNewUserName('');
    setNewUserRole('');
    setNewUserDept('');
    if (onUpdateBankUsers) onUpdateBankUsers(updated);
  };

  const handleSaveAndClose = () => {
    if (onUpdateBankUsers) {
      onUpdateBankUsers(usersList);
    }
    onClose();
  };

  // Canonical policies list from database
  const availablePolicies = (policies && policies.length > 0) ? policies : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-4xl flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-[#0057B8] text-white shadow-2xs">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                LibList • User Access Control Manager
              </h2>
              <p className="text-[12px] text-slate-500">
                Banking Repository Management • Direct Clearances (Can View, Can Create, Can Edit)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2-Column Layout: Left Users List, Right Access Permissions */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* Column 1: Users in Bank */}
          <div className="w-72 sm:w-80 border-r border-slate-200 bg-slate-50/50 flex flex-col">
            <div className="p-3 border-b border-slate-200 flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Active Bank Staff ({usersList.length})
              </span>
              <button
                onClick={() => setIsAddUserModalOpen(true)}
                className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-slate-700 hover:text-slate-950 px-2 py-0.5 rounded bg-white border border-slate-200 hover:bg-slate-100 transition cursor-pointer"
              >
                <UserPlus className="w-3 h-3 text-[#0057B8]" />
                <span>+ Add Staff</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
              {usersList.map((user) => {
                const isSelected = user.id === selectedUserId;
                return (
                  <div
                    key={user.id}
                    onClick={() => setSelectedUserId(user.id)}
                    className={`p-2.5 rounded-lg transition cursor-pointer text-left ${
                      isSelected 
                        ? 'bg-[#0057B8] text-white shadow-sm' 
                        : 'bg-white hover:bg-slate-100/80 text-slate-800 border border-slate-200/70'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[13px] truncate">{user.name}</span>
                      <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-semibold ${
                        isSelected 
                          ? 'bg-[#004EA6] text-white' 
                          : user.roleType === 'manager' 
                          ? 'bg-amber-100 text-amber-800' 
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {user.roleType === 'manager' ? 'Bank Owner' : 'Employee'}
                      </span>
                    </div>

                    <div className={`text-[11.5px] truncate mt-0.5 ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                      {user.role}
                    </div>

                    <div className="flex items-center justify-between pt-1.5 mt-1 border-t border-slate-200/40 text-[10.5px]">
                      <span className={isSelected ? 'text-slate-300' : 'text-slate-500'}>
                        {user.canCreate !== false ? 'Can Create' : 'Read Only'}
                      </span>
                      <span className={isSelected ? 'text-slate-300' : 'text-slate-500'}>
                        {(user.allowedPolicyIds || []).length} Policies
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Column 2: Selected User's Permissions & Document Controls */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5 custom-scrollbar bg-white">
            
            {/* User Profile Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl border border-slate-200 bg-slate-50">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900">{activeUser.name}</h3>
                  <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-200 text-slate-800">
                    {activeUser.department}
                  </span>
                </div>
                <p className="text-[12px] text-slate-500 mt-0.5">{activeUser.role}</p>
              </div>

              <div className="flex items-center gap-1.5 text-xs">
                <span className={`px-2 py-0.5 rounded font-mono font-semibold text-[11px] ${
                  activeUser.roleType === 'manager' 
                    ? 'bg-amber-100 text-amber-900 border border-amber-300' 
                    : 'bg-blue-100 text-blue-900 border border-blue-200'
                }`}>
                  {activeUser.roleType === 'manager' ? 'Bank Owner' : 'Bank Employee'}
                </span>
              </div>
            </div>

            {/* DIRECT USER PERMISSIONS: CAN VIEW, CAN CREATE, CAN EDIT (Replaces Level 1/2/3) */}
            <div className="space-y-2">
              <label className="text-[12px] font-bold text-slate-800 uppercase tracking-wider block">
                Direct User Permissions
              </label>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {/* 1. Can View */}
                <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 flex flex-col justify-between space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <Eye className="w-4 h-4 text-slate-600" />
                      Can View
                    </span>
                    <button
                      onClick={handleToggleGlobalView}
                      className={`px-2 py-0.5 rounded text-[11px] font-bold transition cursor-pointer ${
                        activeUser.canView !== false
                          ? 'bg-emerald-600 text-white shadow-2xs'
                          : 'bg-rose-100 text-rose-800 border border-rose-300'
                      }`}
                    >
                      {activeUser.canView !== false ? 'Allowed' : 'Prohibited'}
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-500">Read & browse bank policies</p>
                </div>

                {/* 2. Can Create */}
                <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 flex flex-col justify-between space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <Plus className="w-4 h-4 text-slate-600" />
                      Can Create
                    </span>
                    <button
                      onClick={handleToggleGlobalCreate}
                      className={`px-2 py-0.5 rounded text-[11px] font-bold transition cursor-pointer ${
                        activeUser.canCreate !== false
                          ? 'bg-emerald-600 text-white shadow-2xs'
                          : 'bg-rose-100 text-rose-800 border border-rose-300'
                      }`}
                    >
                      {activeUser.canCreate !== false ? 'Allowed' : 'Prohibited'}
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-500">Author & submit new policies</p>
                </div>

                {/* 3. Can Edit */}
                <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 flex flex-col justify-between space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <FileEdit className="w-4 h-4 text-slate-600" />
                      Can Edit
                    </span>
                    <button
                      onClick={handleToggleGlobalEdit}
                      className={`px-2 py-0.5 rounded text-[11px] font-bold transition cursor-pointer ${
                        activeUser.canEdit !== false
                          ? 'bg-emerald-600 text-white shadow-2xs'
                          : 'bg-rose-100 text-rose-800 border border-rose-300'
                      }`}
                    >
                      {activeUser.canEdit !== false ? 'Allowed' : 'Prohibited'}
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-500">Configure & update clauses</p>
                </div>
              </div>
            </div>

            {/* POLICY-SPECIFIC ACCESS CONTROLS (With Search & Scroll) */}
            <div className="space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h4 className="text-[12.5px] font-bold text-slate-800 uppercase tracking-wider">
                  Policy-Specific Access Controls
                </h4>
                <span className="text-[11px] font-mono text-slate-500 font-semibold">
                  {(activeUser.allowedPolicyIds || []).length} of {availablePolicies.length} Viewable
                </span>
              </div>

              {/* Policy Search Bar */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-[#0057B8] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={policySearchQuery}
                  onChange={(e) => setPolicySearchQuery(e.target.value)}
                  placeholder="Search policies in library..."
                  className="w-full text-xs pl-8 pr-3 py-1.5 rounded-xl border-2 border-[#0057B8]/40 hover:border-[#0057B8] bg-white focus:border-[#0057B8] focus:ring-2 focus:ring-[#0057B8]/20 outline-none transition font-medium shadow-2xs"
                />
              </div>

              {/* Scrollable Policy List */}
              <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 overflow-y-auto max-h-56 bg-white shadow-2xs custom-scrollbar">
                {availablePolicies
                  .filter(pol => 
                    pol.title.toLowerCase().includes(policySearchQuery.toLowerCase()) || 
                    (pol.department_name && pol.department_name.toLowerCase().includes(policySearchQuery.toLowerCase()))
                  )
                  .map((pol) => {
                    const perms = (activeUser.policyPermissions && activeUser.policyPermissions[pol.id]) || {
                      canView: (activeUser.allowedPolicyIds || []).includes(pol.id),
                      canEdit: activeUser.canEdit !== false
                    };
                    // If user is globally prohibited from viewing, policy cannot be viewed
                    const isGlobalViewProhibited = activeUser.canView === false;
                    const isGlobalEditProhibited = activeUser.canEdit === false;

                    const isViewable = !isGlobalViewProhibited && perms.canView;
                    const isEditable = !isGlobalEditProhibited && perms.canEdit && isViewable;

                    return (
                      <div
                        key={pol.id}
                        className={`p-3 flex flex-wrap items-center justify-between gap-3 transition ${
                          !isViewable ? 'bg-slate-50/80 opacity-80' : 'bg-white hover:bg-slate-50/40'
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <div className={`text-[13px] font-bold truncate ${isViewable ? 'text-slate-800' : 'text-slate-500'}`}>
                            {pol.title}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {pol.department_name}
                          </div>
                        </div>

                        {/* Direct Action Toggles for this policy */}
                        <div className="flex items-center gap-2">
                          {/* Can View Toggle */}
                          <button
                            onClick={() => !isGlobalViewProhibited && handleTogglePolicyView(pol.id)}
                            disabled={isGlobalViewProhibited}
                            className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold transition ${
                              isGlobalViewProhibited
                                ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                                : isViewable
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-emerald-100 cursor-pointer'
                                : 'bg-rose-50 text-rose-700 border border-rose-300 hover:bg-rose-100 cursor-pointer'
                            }`}
                            title={
                              isGlobalViewProhibited 
                                ? "Global viewing prohibited for this user" 
                                : isViewable ? "Can View policy" : "Hidden from sidebar"
                            }
                          >
                            {isViewable ? <Eye className="w-3.5 h-3.5 text-emerald-600" /> : <EyeOff className="w-3.5 h-3.5 text-rose-500" />}
                            <span>{isViewable ? 'Can View' : 'Hidden'}</span>
                          </button>

                          {/* Can Edit Toggle */}
                          <button
                            onClick={() => !isGlobalEditProhibited && isViewable && handleTogglePolicyEdit(pol.id)}
                            disabled={isGlobalEditProhibited || !isViewable}
                            className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold transition ${
                              isGlobalEditProhibited
                                ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-60'
                                : !isViewable
                                ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-50'
                                : isEditable
                                ? 'bg-blue-50 text-blue-700 border border-blue-300 hover:bg-blue-100 cursor-pointer'
                                : 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200 cursor-pointer'
                            }`}
                            title={
                              isGlobalEditProhibited
                                ? "Editing is prohibited by direct permission above"
                                : !isViewable
                                ? "Must be viewable before editing can be enabled"
                                : isEditable ? "Staff can configure and edit" : "Read-only access"
                            }
                          >
                            <FileEdit className="w-3.5 h-3.5" />
                            <span>
                              {isGlobalEditProhibited ? 'Read Only' : isEditable ? 'Can Edit' : 'Read Only'}
                            </span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-slate-200 bg-white flex items-center justify-between">
          <span className="text-xs text-slate-500">Changes apply immediately to staff sessions in Commonwealth Bank.</span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveAndClose}
              className="px-4 py-1.5 text-xs font-semibold bg-[#0057B8] hover:bg-[#004EA6] text-white rounded-lg transition shadow-xs cursor-pointer"
            >
              Save Access Control Settings
            </button>
          </div>
        </div>

        {/* Modal: Add New Staff Member */}
        {isAddUserModalOpen && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-900/50 p-4">
            <div className="bg-white rounded-xl shadow-xl border border-slate-200 p-5 w-full max-w-sm">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-bold text-slate-900">Add Bank Staff User</h4>
                <button onClick={() => setIsAddUserModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <form onSubmit={handleAddUser} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                    placeholder="e.g. Jack Taylor"
                    className="w-full text-xs p-2 rounded-lg border border-slate-300 focus:outline-none focus:border-[#0057B8] focus:ring-1 focus:ring-[#0057B8]/20"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Job Title / Role</label>
                  <input
                    type="text"
                    required
                    value={newUserRole}
                    onChange={(e) => setNewUserRole(e.target.value)}
                    placeholder="e.g. Credit Underwriting Analyst"
                    className="w-full text-xs p-2 rounded-lg border border-slate-300 focus:outline-none focus:border-[#0057B8] focus:ring-1 focus:ring-[#0057B8]/20"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Department</label>
                  <input
                    type="text"
                    required
                    value={newUserDept}
                    onChange={(e) => setNewUserDept(e.target.value)}
                    placeholder="e.g. Retail Lending Squad"
                    className="w-full text-xs p-2 rounded-lg border border-slate-300 focus:outline-none focus:border-[#0057B8] focus:ring-1 focus:ring-[#0057B8]/20"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddUserModalOpen(false)}
                    className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 text-xs font-semibold text-white bg-[#0057B8] hover:bg-[#004EA6] rounded-lg shadow-xs transition cursor-pointer"
                  >
                    Add User
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
