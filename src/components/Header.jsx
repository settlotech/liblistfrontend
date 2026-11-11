import React, { useState, useRef, useEffect } from 'react';
import { 
  Search, 
  Bell, 
  ChevronDown, 
  Menu, 
  PanelLeftClose, 
  PanelLeftOpen, 
  PanelRightClose, 
  PanelRightOpen, 
  CheckCircle,
  Crown,
  Building2,
  Layers,
  KeyRound,
  Users,
  Box,
  X,
  UserCheck,
  Settings as SettingsIcon,
  LogOut
} from 'lucide-react';

export default function Header({
  currentUser,
  onSelectUser,
  onLogout,
  searchQuery,
  setSearchQuery,
  pendingReviewCount = 0,
  onOpenMakerChecker,
  onOpenNotifications,
  onOpenBankUserManagerModal,
  onOpenSuperAdminModal,
  onOpenRoleLogin,
  onOpenVectorSpace,
  isLeftOpen,
  onToggleLeft,
  isRightOpen,
  onToggleRight,
  onToggleMobileLeft,
  onToggleMobileRight,
  currentView = 'WORKSPACE', // 'WORKSPACE' | 'SUPER_ADMIN'
  onToggleSuperAdminView,
  onToggleSettings,
  selectedBank = { id: 'cba', name: 'Commonwealth Bank of Australia' }
}) {
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const roleDropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (roleDropdownRef.current && !roleDropdownRef.current.contains(e.target)) {
        setIsRoleDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const roles = [
    {
      id: 'marcus_vance',
      name: 'Marcus Vance',
      role: 'Bank Administrator',
      roleType: 'manager',
      department: 'Executive Governance',
      bankName: 'Commonwealth Bank (CBA)',
      avatar: 'MV'
    },
    {
      id: 'sarah_jenkins',
      name: 'Sarah Jenkins',
      role: 'Bank Employee',
      roleType: 'employee',
      department: 'Operations',
      bankName: 'Commonwealth Bank (CBA)',
      avatar: 'SJ'
    }
  ];

  const superAdminRole = {
    id: 'super_admin',
    name: 'Ramesh',
    role: 'Super Admin',
    roleType: 'admin',
    department: 'Central Super Admin',
    bankName: 'Central Super Admin',
    avatar: 'R'
  };

  const isSuperAdmin = currentUser?.roleType === 'admin';
  const isBankOwner = currentUser?.roleType === 'manager';

  return (
    <header className="h-14 border-b border-[#e5e7eb] bg-white px-4 sm:px-6 flex items-center justify-between select-none z-30 shadow-2xs">
      
      {/* Left: Mobile Toggle + Desktop Left Sidebar Toggle + Institution Context */}
      <div className="flex items-center gap-2.5">
        <button
          onClick={onToggleMobileLeft}
          title="Toggle Sidebar"
          className="md:hidden p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200"
        >
          <Menu className="w-4 h-4" />
        </button>

        {onToggleLeft && currentView === 'WORKSPACE' && (
          <button
            onClick={onToggleLeft}
            title={isLeftOpen ? "Collapse Left Pane" : "Expand Left Pane"}
            className="hidden md:flex p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition cursor-pointer"
          >
            {isLeftOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
          </button>
        )}

        {/* Workspace Brand / Bank Context Badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50/80 border border-slate-200/90 shadow-2xs">
          <Building2 className="w-4 h-4 text-[#0057B8]" />
          <span className="font-semibold text-slate-800 text-[13px] tracking-tight">
            {currentView === 'SUPER_ADMIN' ? 'Platform Central Administration' : selectedBank.name}
          </span>
          <span className="text-[11px] font-mono text-[#0057B8] font-semibold bg-white border border-[#0057B8]/30 px-1.5 py-0.2 rounded shadow-2xs">
            {currentView === 'SUPER_ADMIN' ? 'Super Admin' : 'CBA'}
          </span>
        </div>
      </div>

      {/* Center: Search Bar with High-Contrast Banking Blue Border */}
      <div className="flex-1 max-w-xs sm:max-w-md mx-3 sm:mx-6 relative">
        <div className="relative group/search">
          <Search className="w-4 h-4 text-[#0057B8] absolute left-3 top-1/2 -translate-y-1/2 transition-colors" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search policies, operational clauses, SLAs..."
            className="w-full bg-white border-2 border-[#0057B8]/40 hover:border-[#0057B8] focus:border-[#0057B8] focus:ring-3 focus:ring-[#0057B8]/20 rounded-xl pl-9 pr-9 py-1.5 text-[13px] text-slate-800 placeholder-slate-400 outline-none transition shadow-2xs font-medium"
          />
          {searchQuery ? (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full text-slate-400 hover:text-white hover:bg-[#0057B8] transition cursor-pointer"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <span className="hidden sm:inline-block absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono text-[#0057B8] bg-blue-50 border border-[#0057B8]/30 px-1.5 py-0.5 rounded font-semibold pointer-events-none">
              Ctrl+K
            </span>
          )}
        </div>
      </div>

      {/* Right: Clean Notification Bell + Bank User Manager + Role Selector */}
      <div className="flex items-center gap-2">
        
        {/* Bank User & Access Control Management (Bank Administrator Feature) */}
        {isBankOwner && onOpenBankUserManagerModal && (
          <button
            onClick={onOpenBankUserManagerModal}
            title="Manage Bank Users, Clearances & Policy Authoring Permissions"
            className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-bold bg-blue-50/70 hover:bg-[#0057B8] text-[#0057B8] hover:text-white border-2 border-[#0057B8]/30 hover:border-[#0057B8] shadow-2xs transition-all cursor-pointer active:scale-95"
          >
            <Users className="w-3.5 h-3.5" />
            <span>Bank Users & Access</span>
          </button>
        )}

        {/* 3D Vector DB Topology Visualizer (Disabled per preference) */}
        {/* {onOpenVectorSpace && (
          <button
            onClick={onOpenVectorSpace}
            title="Interactive 3D Vector Space & Policy Semantic Topology"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-bold bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-[#0057B8] hover:to-indigo-600 text-[#0057B8] hover:text-white border-2 border-blue-200/80 hover:border-[#0057B8] shadow-2xs transition-all cursor-pointer active:scale-95"
          >
            <Box className="w-3.5 h-3.5 text-indigo-600 group-hover:text-white" />
            <span>3D Vector DB</span>
          </button>
        )} */}

        {/* Clean Notification Bell Icon with Badge Count */}
        <button
          onClick={onOpenNotifications}
          title="System Notifications & Regulatory Compliance Codes"
          className="relative p-2 rounded-lg text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 transition cursor-pointer border border-slate-200 shadow-2xs"
        >
          <Bell className="w-4 h-4 text-slate-700" />
          <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 bg-[#0057B8] text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-2xs">
            {pendingReviewCount !== undefined ? pendingReviewCount : 2}
          </span>
        </button>

        {/* Feed Drawer Toggle (Right) */}
        {onToggleRight && currentView === 'WORKSPACE' && (
          <button
            onClick={onToggleRight}
            title={isRightOpen ? "Collapse Comments/Chat Panel" : "Expand Comments/Chat Panel"}
            className="hidden md:flex p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition cursor-pointer"
          >
            {isRightOpen ? <PanelRightClose className="w-4 h-4" /> : <PanelRightOpen className="w-4 h-4" />}
          </button>
        )}
 
        {onToggleSettings && (
          <button
            onClick={onToggleSettings}
            title={currentView === 'SETTINGS' ? "Back to Workspace" : "Open System Settings & RBAC"}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-bold shadow-2xs transition-all cursor-pointer active:scale-95 ${
              currentView === 'SETTINGS'
                ? 'bg-[#0057B8] text-white border border-[#0057B8]'
                : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200'
            }`}
          >
            <SettingsIcon className="w-3.5 h-3.5 text-slate-600" />
            <span className="hidden sm:inline">{currentView === 'SETTINGS' ? 'Bank Workspace' : 'Settings & RBAC'}</span>
            <span className="sm:hidden">Settings</span>
          </button>
        )}

        {/* Super Admin: Quick Super Admin Portal / Bank Workspace Toggle */}
        {isSuperAdmin && onToggleSuperAdminView && (
          <button
            onClick={onToggleSuperAdminView}
            title={currentView === 'SUPER_ADMIN' ? "Switch to 3-Pane Bank Workspace" : "Open Super Admin Portal"}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-bold bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs transition-all cursor-pointer active:scale-95"
          >
            <Crown className="w-3.5 h-3.5 text-amber-600" />
            <span className="hidden sm:inline">{currentView === 'SUPER_ADMIN' ? 'Bank Workspace' : 'Super Admin Portal'}</span>
            <span className="sm:hidden">{currentView === 'SUPER_ADMIN' ? 'Workspace' : 'Portal'}</span>
          </button>
        )}

        {/* Role Selector Pill */}
        <div ref={roleDropdownRef} className="relative">
          <button
            onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
            className="flex items-center gap-2 bg-white hover:bg-slate-50 border border-slate-200 hover:border-[#0057B8]/40 rounded-lg px-2.5 py-1.5 text-left transition cursor-pointer shadow-2xs"
          >
            <div className="w-6 h-6 rounded-full flex items-center justify-center font-bold text-[11px] text-white bg-[#0057B8] shadow-2xs">
              {currentUser?.avatar || (currentUser?.roleType === 'admin' ? 'R' : currentUser?.roleType === 'manager' ? 'MV' : 'SJ')}
            </div>
            <div className="hidden sm:block">
              <div className="text-[12.5px] font-semibold text-slate-800 leading-tight">
                {currentUser?.name || 'Bank Officer'}
              </div>
              <div className="text-[10.5px] text-slate-500">
                {currentUser?.roleType === 'admin' ? 'Super Admin' : (currentUser?.roleType === 'manager' || currentUser?.role?.toLowerCase().includes('approver') || currentUser?.role?.toLowerCase().includes('owner') ? 'Bank Approver' : 'Bank Employee')}
              </div>
            </div>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {/* User Profile Dropdown Menu */}
          {isRoleDropdownOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in duration-100">
              
              {/* Authenticated User Identity */}
              <div className="px-3.5 py-2.5 border-b border-slate-100 bg-slate-50/70 flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs text-white bg-[#0057B8] flex-shrink-0 shadow-2xs">
                  {currentUser?.avatar || (currentUser?.roleType === 'admin' ? 'R' : currentUser?.roleType === 'manager' ? 'MV' : 'SJ')}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-bold text-slate-800 truncate">
                    {currentUser?.name || 'Bank Officer'}
                  </div>
                  <div className="text-[11px] font-medium text-[#0057B8] truncate">
                    {currentUser?.roleType === 'admin' ? 'Super Admin' : (currentUser?.roleType === 'manager' || currentUser?.role?.toLowerCase().includes('approver') || currentUser?.role?.toLowerCase().includes('owner') ? 'Bank Approver' : (currentUser?.role || 'Bank Employee'))}
                  </div>
                </div>
              </div>

              {/* Department & Email Info */}
              <div className="px-3.5 py-2 text-[11px] text-slate-600 border-b border-slate-100 space-y-1">
                {currentUser?.email && (
                  <div className="truncate text-slate-500">
                    <span className="font-semibold text-slate-700">Email: </span>
                    {currentUser.email}
                  </div>
                )}
                {currentUser?.department && (
                  <div className="truncate text-slate-500">
                    <span className="font-semibold text-slate-700">Dept: </span>
                    {currentUser.department}
                  </div>
                )}
              </div>

              {/* Super Admin / Super Admin View Switcher */}
              {isSuperAdmin && onToggleSuperAdminView && (
                <div className="p-2 border-b border-slate-100 bg-amber-50/40">
                  <button
                    onClick={() => {
                      setIsRoleDropdownOpen(false);
                      onToggleSuperAdminView();
                    }}
                    className="w-full p-2 text-left flex items-center justify-between rounded-xl hover:bg-amber-100/70 transition cursor-pointer text-amber-900"
                  >
                    <div className="flex items-center gap-2">
                      <Crown className="w-4 h-4 text-amber-600" />
                      <div>
                        <div className="text-xs font-bold">
                          {currentView === 'SUPER_ADMIN' ? 'Back to Bank Workspace' : 'Open Super Admin Portal'}
                        </div>
                        <div className="text-[10px] text-amber-700">Multi-Bank Governance</div>
                      </div>
                    </div>
                  </button>
                </div>
              )}

              {/* Bank Administrator: Manage Bank Users (Optional) */}
              {isBankOwner && onOpenBankUserManagerModal && (
                <div className="p-1.5 border-b border-slate-100">
                  <button
                    onClick={() => {
                      setIsRoleDropdownOpen(false);
                      onOpenBankUserManagerModal();
                    }}
                    className="w-full flex items-center gap-2 py-1.5 px-2.5 rounded-lg text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
                  >
                    <Users className="w-3.5 h-3.5 text-slate-500" />
                    <span>Manage Bank Users</span>
                  </button>
                </div>
              )}

              {/* System Settings & RBAC Menu Option */}
              {onToggleSettings && (
                <div className="p-1.5 border-b border-slate-100">
                  <button
                    onClick={() => {
                      setIsRoleDropdownOpen(false);
                      onToggleSettings();
                    }}
                    className="w-full flex items-center gap-2 py-1.5 px-2.5 rounded-lg text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
                  >
                    <SettingsIcon className="w-3.5 h-3.5 text-slate-500" />
                    <span>System Settings</span>
                  </button>
                </div>
              )}

              {/* Logout Action */}
              <div className="p-2">
                {onLogout && (
                  <button
                    onClick={() => {
                      setIsRoleDropdownOpen(false);
                      onLogout();
                    }}
                    className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 transition cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Logout & End Session</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
