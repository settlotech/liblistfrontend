import React, { useState } from 'react';
import { X, Building2, Key, User, Save, Check, Copy } from 'lucide-react';
import { userProfiles } from '../../data/mockData';

export default function BankProfileModal({ 
  isOpen, 
  onClose, 
  currentProfile, 
  onSelectProfile,
  onSaveProfileTerms 
}) {
  if (!isOpen) return null;

  const [copiedKey, setCopiedKey] = useState(false);
  const [terms, setTerms] = useState(currentProfile.customTerms);
  const [timeout, setTimeoutVal] = useState(currentProfile.sessionTimeout);
  const [mfa, setMfa] = useState(currentProfile.mfaRule);

  const handleCopyKey = () => {
    navigator.clipboard.writeText(currentProfile.apiKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleSave = (e) => {
    e.preventDefault();
    onSaveProfileTerms({
      ...currentProfile,
      customTerms: terms,
      sessionTimeout: timeout,
      mfaRule: mfa,
    });
    alert(`Policy addenda updated for ${currentProfile.bank}!`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-300 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] text-xs animate-in fade-in duration-150">
        {/* Header */}
        <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#0057B8]/10 border border-[#0057B8]/30 flex items-center justify-center text-[#0057B8] shadow-2xs">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Banker Profile & Operational Preferences</h3>
              <p className="text-[11px] text-slate-500">Manage credentials and your institution's specific policy addenda</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-200 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto custom-scrollbar space-y-4">
          {/* Select Active Bank Account */}
          <div>
            <label className="block text-[11px] uppercase font-bold text-slate-500 mb-1.5">
              Select Active Banker Profile
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {userProfiles.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    onSelectProfile(p);
                    setTerms(p.customTerms);
                    setTimeoutVal(p.sessionTimeout);
                    setMfa(p.mfaRule);
                  }}
                  className={`p-2.5 rounded-lg border text-left transition cursor-pointer flex items-center gap-2.5 ${
                    currentProfile.id === p.id
                      ? 'bg-[#0057B8]/10 border-[#0057B8] text-[#0057B8] font-bold shadow-2xs'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div className="w-7 h-7 rounded-full bg-slate-800 text-white font-bold text-xs flex items-center justify-center flex-shrink-0">
                    {p.initials}
                  </div>
                  <div className="truncate">
                    <div className="truncate text-xs font-semibold text-slate-900">{p.name}</div>
                    <div className="text-[10px] text-slate-500 truncate">{p.bank}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Credentials Box */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2 shadow-2xs">
            <div className="flex justify-between items-center border-b border-slate-200 pb-1.5">
              <span className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                <Key className="w-3.5 h-3.5 text-[#0057B8]" />
                API Credentials & Access Key
              </span>
              <span className="text-[10px] font-bold bg-emerald-50 text-emerald-800 px-1.5 py-0.2 rounded border border-emerald-200">
                Verified Active
              </span>
            </div>

            <div className="space-y-1 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Institution:</span>
                <strong className="text-slate-900">{currentProfile.bank}</strong>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Authorized Representative:</span>
                <strong className="text-slate-900">{currentProfile.email}</strong>
              </div>
            </div>

            <div className="pt-1 flex items-center justify-between bg-white p-2 rounded-lg border border-slate-200">
              <span className="font-mono text-slate-600 text-[11px] truncate max-w-[280px] sm:max-w-[340px]">
                {currentProfile.apiKey}
              </span>
              <button
                onClick={handleCopyKey}
                className="flex items-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-0.5 rounded text-[10.5px] font-semibold transition cursor-pointer"
              >
                {copiedKey ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                <span>{copiedKey ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* Bank Custom Addenda Form */}
          <form onSubmit={handleSave} className="space-y-3 pt-1">
            <div className="font-bold text-slate-900 text-xs">
              Bank Policy Addenda & Operational Preferences
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-600 font-medium mb-1 text-[11px]">
                  Session Inactivity Window
                </label>
                <input
                  type="text"
                  value={timeout}
                  onChange={(e) => setTimeoutVal(e.target.value)}
                  placeholder="e.g. 15 Minutes"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1 text-[11px]">
                  Step-Up Authentication Trigger
                </label>
                <input
                  type="text"
                  value={mfa}
                  onChange={(e) => setMfa(e.target.value)}
                  placeholder="e.g. Transfers > $5,000 AUD"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-600 font-medium mb-1 text-[11px]">
                Institution Policy Addendum Clause
              </label>
              <textarea
                value={terms}
                onChange={(e) => setTerms(e.target.value)}
                rows="3"
                placeholder="Enter bank-specific operational conditions..."
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 outline-none resize-none font-mono"
              />
            </div>

            <div className="pt-2 flex justify-between items-center">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 rounded-lg text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
              >
                Close
              </button>

              <button
                type="submit"
                className="flex items-center gap-1.5 bg-[#0057B8] hover:bg-[#004EA6] text-white font-bold px-4 py-2 rounded-lg text-xs shadow-xs transition cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Policy Preferences</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
