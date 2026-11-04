import React, { useState } from 'react';
import { Crown, Lock, Shield, ArrowRight, X, Building2, KeyRound } from 'lucide-react';

export default function SuperAdminLoginModal({
  isOpen,
  onClose,
  onLoginAsSuperAdmin
}) {
  const [adminKey, setAdminKey] = useState('MASTER-SUPER-ADMIN-2026');
  const [adminEmail, setAdminEmail] = useState('admin.governance@libtrak.gov.au');
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsAuthenticating(true);
    setTimeout(() => {
      setIsAuthenticating(false);
      onLoginAsSuperAdmin({
        id: 'super_admin',
        name: 'Ramesh',
        role: 'Platform Owner',
        roleType: 'admin',
        department: 'Central Platform Owner',
        bankName: 'Central Platform Owner',
        avatar: 'R'
      });
      onClose();
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-[#0f172a] text-white rounded-2xl shadow-2xl border border-slate-800 w-full max-w-md overflow-hidden relative">
        
        {/* Ambient background glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* Top bar */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between relative z-10">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Crown className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-tight text-white">
                Super Admin Direct Gateway
              </h3>
              <p className="text-[11px] text-slate-400">
                Central Platform Owner & Subscribed Banks Registry
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 relative z-10">
          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 space-y-1">
            <span className="text-[10.5px] font-bold text-amber-400 uppercase tracking-wider block">
              Direct Admin Access Endpoint
            </span>
            <p>
              Logs directly into the Platform Owner Portal to manage central master policies and oversee all 4 subscribed banks (CBA, NAB, Westpac, ANZ).
            </p>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
              Platform Master Email
            </label>
            <div className="relative">
              <input
                type="email"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                required
                className="w-full text-xs p-2.5 rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-amber-400 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
              Super Admin Cryptographic Access Key
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={adminKey}
                onChange={(e) => setAdminKey(e.target.value)}
                required
                className="w-full text-xs pl-9 pr-3 py-2.5 rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-amber-400 font-mono"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isAuthenticating}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-slate-950 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 transition shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Crown className="w-4 h-4" />
              <span>{isAuthenticating ? 'Authenticating Master Clearance...' : 'Login as Super Admin'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="text-center pt-2">
            <span className="text-[10.5px] text-slate-500">
              Direct endpoint access URL: <code className="text-amber-400/80">#/super-admin</code>
            </span>
          </div>
        </form>

      </div>
    </div>
  );
}
