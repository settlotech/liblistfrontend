import React from 'react';
import { 
  Building2, 
  ShieldCheck, 
  Sliders, 
  Lock, 
  Unlock, 
  FileText, 
  CheckCircle2, 
  TrendingUp, 
  Clock, 
  Download, 
  Edit, 
  User, 
  Mail, 
  Key, 
  Server
} from 'lucide-react';

export default function BankProfilePage({ 
  selectedBank, 
  policy, 
  onOpenEditModal, 
  onOpenExportModal,
  onNavigateToTab
}) {
  const bankCustom = policy?.bankCustomAddenda?.[selectedBank.id] || {
    maxSessionLifetime: '15 minutes inactivity',
    mfaStepUpTrigger: 'Transfers > $5,000 AUD',
    customTermsClause: 'Standard institutional terms applied.',
    lastModifiedBy: 'Default Compliance Officer',
    customMarginUsed: '5.0% of permitted 10%',
  };

  const quotaPercent = ((selectedBank.quotaUsed || 7.5) / 10.0) * 100;

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#f8fafc] p-8 space-y-6">
      {/* 1. Bank Profile Header Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700 shadow-2xs">
            <Building2 className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                {selectedBank.name}
              </h1>
              <span className="text-xs font-bold bg-emerald-50 text-emerald-800 px-3 py-1 rounded-full border border-emerald-300">
                {selectedBank.subscriptionStatus || 'Active Enterprise Tenant'}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mt-1.5 font-medium">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                {selectedBank.tier}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <Mail className="w-4 h-4 text-slate-400" />
                {selectedBank.contactEmail}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-slate-400" />
                Joined: {selectedBank.joinedDate}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onOpenEditModal}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs transition shadow-xs cursor-pointer"
          >
            <Edit className="w-4 h-4" />
            <span>Edit 10% Custom Terms</span>
          </button>

          <button
            onClick={onOpenExportModal}
            className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-2.5 rounded-xl text-xs transition shadow-xs cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export APRA Certificate</span>
          </button>
        </div>
      </div>

      {/* 2. Key Metrics & 10% Quota Allocation */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* 10% Quota Meter */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              10% Custom Terms Quota
            </span>
            <Sliders className="w-4 h-4 text-blue-600" />
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 font-mono">
              {selectedBank.quotaUsed || 7.8}%
            </span>
            <span className="text-xs font-mono font-semibold text-slate-400">
              / 10.0% Max Allowed
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200">
            <div
              className="h-full rounded-full bg-blue-600 transition-all duration-300"
              style={{ width: `${Math.min(100, quotaPercent)}%` }}
            ></div>
          </div>

          <p className="text-[11.5px] text-slate-500">
            Remaining buffer: <strong className="text-emerald-700 font-mono">{(10.0 - (selectedBank.quotaUsed || 7.8)).toFixed(1)}%</strong> for additional institutional addenda.
          </p>
        </div>

        {/* APRA Compliance Rating */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Regulatory Audit Score
            </span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-emerald-700 font-mono">
              {selectedBank.complianceScore}%
            </span>
            <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              APRA PASSED
            </span>
          </div>

          <div className="text-[11.5px] text-slate-500 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Last audit verification on {selectedBank.lastAuditDate}</span>
          </div>
        </div>

        {/* Subscribed Frameworks */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Subscribed Master Frameworks
            </span>
            <FileText className="w-4 h-4 text-blue-600" />
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 font-mono">
              18 Books
            </span>
            <span className="text-xs text-slate-500 font-medium">
              Active Specs
            </span>
          </div>

          <p className="text-[11.5px] text-slate-500">
            Includes Authentication, APP 11 Privacy, CDR Consent, and Rate Limiting.
          </p>
        </div>
      </div>

      {/* 3. Active Bank Custom Terms & Conditions Addenda */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Unlock className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">
              Active Institutional Addenda ({selectedBank.name})
            </h3>
          </div>
          <span className="text-xs font-mono font-bold bg-blue-100 text-blue-900 px-2.5 py-0.5 rounded border border-blue-200">
            {bankCustom.customMarginUsed}
          </span>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
              <span className="text-xs uppercase font-bold text-slate-500 block">
                Bank Session Inactivity Window
              </span>
              <p className="text-sm font-bold text-slate-900">
                {bankCustom.maxSessionLifetime}
              </p>
              <span className="text-[11px] text-slate-500">Controls automated token expiry</span>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
              <span className="text-xs uppercase font-bold text-slate-500 block">
                Step-Up MFA Trigger Condition
              </span>
              <p className="text-sm font-bold text-slate-900">
                {bankCustom.mfaStepUpTrigger}
              </p>
              <span className="text-[11px] text-slate-500">Triggers mandatory hardware/biometric auth</span>
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
            <span className="text-xs uppercase font-bold text-slate-500 block">
              Institutional Custom Terms & Conditions Clause
            </span>
            <p className="text-xs font-mono text-slate-900 bg-white p-3 rounded-lg border border-slate-200 leading-relaxed">
              "{bankCustom.customTermsClause}"
            </p>
            <div className="pt-2 flex justify-between items-center text-xs text-slate-500">
              <span>Sign-off: <strong className="text-slate-800">{bankCustom.lastModifiedBy}</strong></span>
              <span className="text-emerald-700 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> APRA CPG 234 Validated
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Quick Navigation to Bank Resources */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div 
          onClick={() => onNavigateToTab('AUTH')}
          className="bg-white border border-slate-200 hover:border-blue-400 rounded-2xl p-5 shadow-xs cursor-pointer transition group"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700 mb-3 group-hover:scale-105 transition">
            <Key className="w-5 h-5" />
          </div>
          <h4 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition">
            Authentication & SSO Spec
          </h4>
          <p className="text-xs text-slate-500 mt-1">
            OAuth 2.0 PKCE, Token rotation, latency curves, and SSO policies.
          </p>
        </div>

        <div 
          onClick={() => onNavigateToTab('PRIVACY')}
          className="bg-white border border-slate-200 hover:border-emerald-400 rounded-2xl p-5 shadow-xs cursor-pointer transition group"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 mb-3 group-hover:scale-105 transition">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h4 className="text-sm font-bold text-slate-900 group-hover:text-emerald-600 transition">
            Privacy & Data Retention Spec
          </h4>
          <p className="text-xs text-slate-500 mt-1">
            APP 11 PII 7-year statutory retention and cryptographic erasure.
          </p>
        </div>

        <div 
          onClick={() => onNavigateToTab('GATEWAY')}
          className="bg-white border border-slate-200 hover:border-amber-400 rounded-2xl p-5 shadow-xs cursor-pointer transition group"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 mb-3 group-hover:scale-105 transition">
            <Server className="w-5 h-5" />
          </div>
          <h4 className="text-sm font-bold text-slate-900 group-hover:text-amber-600 transition">
            API Gateway & CORS Spec
          </h4>
          <p className="text-xs text-slate-500 mt-1">
            Rate limiting, multi-tenant IP throttling, and CORS security.
          </p>
        </div>
      </div>
    </div>
  );
}
