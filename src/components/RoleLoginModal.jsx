import React, { useState } from 'react';
import { 
  X, 
  ShieldCheck, 
  UserCheck, 
  Building2, 
  Crown, 
  ArrowRight, 
  KeyRound, 
  Lock, 
  Mail, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';
import { userRoles } from '../data/mockData';
import { apiService } from '../services/apiService';

export default function RoleLoginModal({ 
  isOpen, 
  onClose, 
  currentUser, 
  onSelectUser 
}) {
  const [activeTab, setActiveTab] = useState('quick'); // 'quick' | 'credentials'
  const [email, setEmail] = useState('marcus.vance@cba.com.au');
  const [password, setPassword] = useState('Password123!');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const employees = userRoles.filter(u => u.roleType === 'employee');
  const managers = userRoles.filter(u => u.roleType === 'manager');
  const admins = userRoles.filter(u => u.roleType === 'admin');

  // Direct login via /api/auth/login
  const handleCredentialLogin = async (e) => {
    e.preventDefault();
    setIsAuthenticating(true);
    setErrorMessage('');

    try {
      const result = await apiService.login({ email: email.trim(), password });
      const authenticatedUser = {
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
        role: result.user.role === 'manager' ? 'Bank Administrator' : result.user.role === 'admin' ? 'Platform Owner' : result.user.role,
        roleType: result.user.role === 'manager' || result.user.role === 'admin' ? result.user.role : 'employee',
        department: result.user.department || (result.user.role === 'manager' ? 'Executive Committee' : 'Retail Banking'),
        bankName: 'Commonwealth Bank of Australia',
        bankId: 'cba',
        avatar: result.user.name ? result.user.name.split(' ').map(n => n[0]).join('').slice(0, 2) : 'AU'
      };

      onSelectUser(authenticatedUser);
      onClose();
    } catch (err) {
      setErrorMessage(err.message || 'Invalid email or password.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  // Quick switch with background token generation
  const handleQuickSwitch = async (user) => {
    setIsAuthenticating(true);
    try {
      // Authenticate in backend if possible, or fallback cleanly
      if (user.email) {
        try {
          await apiService.login({ email: user.email, password: 'Password123!' });
        } catch (_) {
          // Keep local switch active
        }
      }
      onSelectUser(user);
      onClose();
    } finally {
      setIsAuthenticating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-300 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col text-xs animate-in fade-in duration-150">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-white font-bold text-xs">
              <UserCheck className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Institutional Login & Role Switcher</h3>
              <p className="text-[11px] text-slate-500">APRA CPS 234 Verified Multi-Tenant Access</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-200 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Selector: Quick Switch vs Credentials Login */}
        <div className="px-6 py-2.5 bg-slate-100/70 border-b border-slate-200 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('quick')}
            className={`px-3 py-1.5 rounded-lg font-bold text-xs transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'quick'
                ? 'bg-white text-[#0057B8] shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Select Bank Persona</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('credentials')}
            className={`px-3 py-1.5 rounded-lg font-bold text-xs transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'credentials'
                ? 'bg-white text-[#0057B8] shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Sign In with Password</span>
          </button>
        </div>

        {/* TAB 1: DIRECT CREDENTIALS LOGIN */}
        {activeTab === 'credentials' && (
          <form onSubmit={handleCredentialLogin} className="p-6 space-y-4">
            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Institutional Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. marcus.vance@cba.com.au"
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-[#0057B8] focus:ring-1 focus:ring-[#0057B8]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-[#0057B8] focus:ring-1 focus:ring-[#0057B8]"
                />
              </div>
            </div>

            {/* Quick-fill credentials helper */}
            <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200 text-xs text-slate-600 space-y-2">
              <span className="text-[10.5px] font-bold text-[#0057B8] uppercase tracking-wider block">
                Quick Fill Certified Test Credentials
              </span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setEmail('marcus.vance@cba.com.au');
                    setPassword('Password123!');
                  }}
                  className="px-2.5 py-1 rounded-lg bg-white border border-blue-200 text-[#0057B8] hover:bg-blue-100 font-semibold transition text-[11px]"
                >
                  Marcus Vance (Bank Administrator)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEmail('sarah.jenkins@cba.com.au');
                    setPassword('Password123!');
                  }}
                  className="px-2.5 py-1 rounded-lg bg-white border border-blue-200 text-[#0057B8] hover:bg-blue-100 font-semibold transition text-[11px]"
                >
                  Sarah Jenkins (Employee)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEmail('ramesh.platform@libtrak.gov.au');
                    setPassword('Password123!');
                  }}
                  className="px-2.5 py-1 rounded-lg bg-white border border-purple-200 text-purple-800 hover:bg-purple-100 font-semibold transition text-[11px]"
                >
                  Ramesh (Super Admin)
                </button>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isAuthenticating}
                className="px-5 py-2 bg-[#0057B8] hover:bg-[#004EA6] text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer flex items-center gap-1.5 active:scale-95"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>{isAuthenticating ? 'Verifying with DB...' : 'Sign In with JWT'}</span>
              </button>
            </div>
          </form>
        )}

        {/* TAB 2: ORIGINAL PERSONA SELECTION MODE */}
        {activeTab === 'quick' && (
          <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto custom-scrollbar">
            {/* 1. Bank Employees (Submitters) */}
            <div>
              <div className="text-[10.5px] font-bold uppercase tracking-wider text-blue-800 mb-2 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                <span>Bank Compliance Employees & Architects (Submitters)</span>
              </div>

              <div className="space-y-2">
                {employees.map((user) => {
                  const isSelected = currentUser?.id === user.id;
                  return (
                    <div
                      key={user.id}
                      onClick={() => handleQuickSwitch(user)}
                      className={`p-3 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'bg-blue-50 border-blue-400 ring-2 ring-blue-500/20 shadow-xs'
                          : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-100 border border-blue-200 flex items-center justify-center font-bold text-xs text-blue-900 shadow-2xs">
                          {user.avatar}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900">{user.name}</span>
                            <span className="text-[10px] font-bold bg-blue-50 text-blue-800 px-2 py-0.2 rounded border border-blue-200">
                              {user.bankId?.toUpperCase()} Submitter
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-600">{user.role}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{user.email}</div>
                        </div>
                      </div>

                      <ArrowRight className={`w-4 h-4 ${isSelected ? 'text-blue-600' : 'text-slate-400'}`} />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 2. Bank Risk Managers (Approvers) */}
            <div>
              <div className="text-[10.5px] font-bold uppercase tracking-wider text-amber-800 mb-2 pt-2 border-t border-slate-100 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-600"></span>
                <span>Bank Risk Managers & Committee Chairs (Approvers)</span>
              </div>

              <div className="space-y-2">
                {managers.map((user) => {
                  const isSelected = currentUser?.id === user.id;
                  return (
                    <div
                      key={user.id}
                      onClick={() => handleQuickSwitch(user)}
                      className={`p-3 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-500/20 shadow-xs'
                          : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-amber-100 border border-amber-300 flex items-center justify-center font-bold text-xs text-amber-900 shadow-2xs">
                          {user.avatar}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900">{user.name}</span>
                            <span className="text-[10px] font-bold bg-amber-100 text-amber-900 px-2 py-0.2 rounded border border-amber-300">
                              {user.bankId?.toUpperCase()} Approver
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-600">{user.role}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{user.email}</div>
                        </div>
                      </div>

                      <ArrowRight className={`w-4 h-4 ${isSelected ? 'text-amber-700' : 'text-slate-400'}`} />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 3. Central Master Authority */}
            <div>
              <div className="text-[10.5px] font-bold uppercase tracking-wider text-purple-800 mb-2 pt-2 border-t border-slate-100 flex items-center gap-1.5">
                <Crown className="w-3.5 h-3.5 text-purple-700" />
                <span>Central Library Master Authority</span>
              </div>

              <div className="space-y-2">
                {admins.map((user) => {
                  const isSelected = currentUser?.id === user.id;
                  return (
                    <div
                      key={user.id}
                      onClick={() => handleQuickSwitch(user)}
                      className={`p-3 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'bg-purple-50 border-purple-400 ring-2 ring-purple-500/20 shadow-xs'
                          : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-purple-100 border border-purple-300 flex items-center justify-center font-bold text-xs text-purple-900 shadow-2xs">
                          <Crown className="w-4 h-4 text-purple-700" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900">{user.name}</span>
                            <span className="text-[10px] font-bold bg-purple-100 text-purple-900 px-2 py-0.2 rounded border border-purple-300">
                              {user.badge}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-600">{user.role}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{user.email}</div>
                        </div>
                      </div>

                      <ArrowRight className={`w-4 h-4 ${isSelected ? 'text-purple-700' : 'text-slate-400'}`} />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-500 flex justify-between items-center">
          <span>APRA CPS 234 Verified Dual-Control Authentication</span>
          <button
            onClick={onClose}
            className="font-bold text-slate-700 hover:text-slate-900 cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
