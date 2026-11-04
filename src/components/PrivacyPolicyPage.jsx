import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  Unlock, 
  FileText, 
  Lightbulb, 
  CheckCircle2, 
  Clock, 
  Database, 
  Trash2, 
  Key, 
  Edit,
  Download
} from 'lucide-react';

export default function PrivacyPolicyPage({ 
  selectedBank, 
  policy, 
  onOpenEditModal, 
  onOpenExportModal 
}) {
  const bankCustom = policy?.bankCustomAddenda?.[selectedBank.id] || {
    maxSessionLifetime: '7 years + 60 days buffer',
    mfaStepUpTrigger: 'Tier-3 clearance for TFN lookups',
    customTermsClause: 'CBA Privacy Addendum 3.1: Retention of marketing clickstream data truncated to 90 days post-campaign termination.',
    lastModifiedBy: 'Claire Evans (Data Protection Officer)',
    customMarginUsed: '5.2% of permitted 10%',
  };

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#f8fafc] p-8 space-y-6">
      {/* 1. Header Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold text-emerald-800 mb-1 flex items-center gap-2">
            <span className="bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              Australian Privacy Act 1988 & APRA CPS 234
            </span>
            <span className="text-slate-400">•</span>
            <span className="font-mono text-slate-600">OAIC-AU-PRIVACY-2026-11X</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            APP 11: Security & Destruction of PII Data
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Standard Operating Procedure for statutory data retention, customer erasure, and sovereign encryption.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onOpenEditModal}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-xl text-xs transition shadow-xs cursor-pointer"
          >
            <Edit className="w-4 h-4" />
            <span>Edit Bank Addenda</span>
          </button>

          <button
            onClick={onOpenExportModal}
            className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-2 rounded-xl text-xs transition shadow-xs cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export OAIC Cert</span>
          </button>
        </div>
      </div>

      {/* 2. Metadata Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-white border border-slate-200 rounded-xl p-4 shadow-xs text-xs">
        <div>
          <div className="text-xs font-bold uppercase text-slate-500">Latest Revision</div>
          <div className="font-mono text-slate-900 font-bold text-sm mt-1">v4.0.1 (Approved)</div>
        </div>
        <div>
          <div className="text-xs font-bold uppercase text-slate-500">Statutory Baseline</div>
          <div className="text-slate-900 font-bold text-sm mt-1">7 Years Strict</div>
        </div>
        <div>
          <div className="text-xs font-bold uppercase text-slate-500">Custodian Squad</div>
          <div className="text-slate-900 font-bold text-sm mt-1">Data Governance</div>
        </div>
        <div>
          <div className="text-xs font-bold uppercase text-slate-500">Tenant Margin</div>
          <div className="text-blue-700 font-bold text-sm mt-1">{bankCustom.customMarginUsed}</div>
        </div>
      </div>

      {/* 3. Vision Banner */}
      <div className="bg-emerald-50/70 border-l-4 border-emerald-600 border border-emerald-100 rounded-r-xl p-4 flex gap-3.5 items-start">
        <Lightbulb className="w-5 h-5 text-emerald-700 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="text-xs font-extrabold uppercase tracking-wider text-emerald-950">
            STATUTORY DATA PROTECTION MANDATE
          </div>
          <p className="text-xs text-slate-800 leading-relaxed">
            "Mandate strict de-identification, sovereign encryption, and cryptographic erasure of customer identifiable financial information once statutory retention periods expire."
          </p>
        </div>
      </div>

      {/* 4. 90% Core Master Standard vs 10% Bank Addenda */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 90% Master Core Clauses */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div className="flex items-center gap-2 font-bold text-slate-900">
              <Lock className="w-4 h-4 text-emerald-700" />
              <span>90% Master Regulatory Core (Locked)</span>
            </div>
            <span className="text-xs font-mono font-bold bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded border border-emerald-200">
              APRA & OAIC Mandated
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
              <div className="font-bold text-slate-900 text-xs flex justify-between">
                <span>PRIV-01: Master Statutory Retention Baseline (7 Years)</span>
                <span className="text-emerald-700 font-mono">Mandatory</span>
              </div>
              <p className="text-slate-600 text-[11.5px] leading-relaxed">
                Under Corporations Act 2001 & AML/CTF Rules, primary financial transaction ledgers and customer KYC identification records must be retained for exactly 7 years following relationship closure.
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
              <div className="font-bold text-slate-900 text-xs flex justify-between">
                <span>PRIV-02: Irrevocable De-identification on Expiry</span>
                <span className="text-emerald-700 font-mono">Mandatory</span>
              </div>
              <p className="text-slate-600 text-[11.5px] leading-relaxed">
                Upon reaching statutory expiry date + 30 days grace window, all direct identifiers (TFN, passport, residential address) must undergo cryptographic one-way salted hashing or DoD-standard erasure.
              </p>
            </div>
          </div>
        </div>

        {/* 10% Bank Custom Provisions */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div className="flex items-center gap-2 font-bold text-slate-900">
              <Unlock className="w-4 h-4 text-blue-600" />
              <span>10% Bank Specific Addenda ({selectedBank.name})</span>
            </div>
            <button
              onClick={onOpenEditModal}
              className="text-xs bg-blue-50 text-blue-800 font-bold px-2.5 py-1 rounded border border-blue-200 hover:bg-blue-100 transition cursor-pointer"
            >
              Modify Terms
            </button>
          </div>

          <div className="space-y-3 text-xs">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <span className="text-[11px] uppercase font-bold text-slate-500 block mb-0.5">
                Bank Archive Freeze Rule
              </span>
              <p className="text-xs font-bold text-slate-900">{bankCustom.maxSessionLifetime}</p>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <span className="text-[11px] uppercase font-bold text-slate-500 block mb-0.5">
                PII Officer Search Authorization
              </span>
              <p className="text-xs font-bold text-slate-900">{bankCustom.mfaStepUpTrigger}</p>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1">
              <span className="text-[11px] uppercase font-bold text-slate-500 block">
                Custom Privacy Terms Clause
              </span>
              <p className="text-xs font-mono text-slate-900 bg-white p-2.5 rounded border border-slate-200 leading-relaxed">
                "{bankCustom.customTermsClause}"
              </p>
              <div className="pt-2 text-[11px] text-slate-500 flex justify-between">
                <span>Sign-off: {bankCustom.lastModifiedBy}</span>
                <span className="text-emerald-700 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Validated
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
