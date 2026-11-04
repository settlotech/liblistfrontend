import React from 'react';
import { 
  Server, 
  ShieldCheck, 
  Activity, 
  Lock, 
  Unlock, 
  Zap, 
  CheckCircle2, 
  AlertTriangle, 
  Sliders,
  Edit,
  Download
} from 'lucide-react';

export default function ApiGatewayPage({ 
  selectedBank, 
  onOpenEditModal, 
  onOpenExportModal 
}) {
  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#f8fafc] p-8 space-y-6">
      {/* 1. Header Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold text-amber-800 mb-1 flex items-center gap-2">
            <span className="bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
              Core Banking Platform • Production
            </span>
            <span className="text-slate-400">•</span>
            <span className="font-mono text-slate-600">APRA-API-GATEWAY-2026</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            API Gateway, Rate Limiting & CORS Policies
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Enterprise specification for multi-tenant rate throttling, DDoS mitigation, and cross-origin resource protection.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onOpenEditModal}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-xl text-xs transition shadow-xs cursor-pointer"
          >
            <Edit className="w-4 h-4" />
            <span>Edit Bank Limits</span>
          </button>

          <button
            onClick={onOpenExportModal}
            className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-2 rounded-xl text-xs transition shadow-xs cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export Gateway Spec</span>
          </button>
        </div>
      </div>

      {/* 2. Metadata Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-white border border-slate-200 rounded-xl p-4 shadow-xs text-xs">
        <div>
          <div className="text-xs font-bold uppercase text-slate-500">Gateway Version</div>
          <div className="font-mono text-slate-900 font-bold text-sm mt-1">v2.1.0</div>
        </div>
        <div>
          <div className="text-xs font-bold uppercase text-slate-500">Max Global Burst</div>
          <div className="text-slate-900 font-bold text-sm mt-1">10,000 req/sec</div>
        </div>
        <div>
          <div className="text-xs font-bold uppercase text-slate-500">DDoS Protection</div>
          <div className="text-emerald-700 font-bold text-sm mt-1">Active (WAF Layer 7)</div>
        </div>
        <div>
          <div className="text-xs font-bold uppercase text-slate-500">Tenant Allocation</div>
          <div className="text-blue-700 font-bold text-sm mt-1">{selectedBank.name.split(' ')[0]} Dedicated</div>
        </div>
      </div>

      {/* 3. Master Standard vs Bank Tier Overrides */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Master Baseline */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div className="flex items-center gap-2 font-bold text-slate-900 text-xs">
              <Lock className="w-4 h-4 text-emerald-700" />
              <span>90% Core Master Throttling Standard (Locked)</span>
            </div>
            <span className="text-xs font-mono font-bold bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded border border-emerald-200">
              Mandatory
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
              <div className="font-bold text-slate-900 text-xs flex justify-between">
                <span>GATE-01: Token Bucket Rate Limiting</span>
                <span className="text-emerald-700 font-mono">1,200 req/min</span>
              </div>
              <p className="text-slate-600 text-[11.5px] leading-relaxed">
                Standard client credentials token bucket with algorithmic refill every 100ms. Drops non-authenticated bursts with HTTP 429 Too Many Requests.
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
              <div className="font-bold text-slate-900 text-xs flex justify-between">
                <span>GATE-02: Strict CORS Whitelist</span>
                <span className="text-emerald-700 font-mono">Enforced</span>
              </div>
              <p className="text-slate-600 text-[11.5px] leading-relaxed">
                Wildcard '*' Access-Control-Allow-Origin headers are prohibited in production financial APIs. All origins must match registered DNS SAN certificates.
              </p>
            </div>
          </div>
        </div>

        {/* Bank Custom Addenda */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div className="flex items-center gap-2 font-bold text-slate-900 text-xs">
              <Unlock className="w-4 h-4 text-blue-600" />
              <span>10% Bank Custom API Limits ({selectedBank.name})</span>
            </div>
            <span className="text-xs font-mono font-bold bg-blue-50 text-blue-800 px-2 py-0.5 rounded border border-blue-200">
              Tier-1 Quota
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <span className="text-[11px] uppercase font-bold text-slate-500 block mb-0.5">
                Bank High-Frequency Burst Multiplier
              </span>
              <p className="text-xs font-bold text-slate-900">Up to 2,500 req/min for Treasury Webhooks</p>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <span className="text-[11px] uppercase font-bold text-slate-500 block mb-0.5">
                Custom Ip Whitelist Subnet
              </span>
              <p className="text-xs font-bold text-slate-900">10.240.0.0/16 (Private DirectConnect Tunnel)</p>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1">
              <span className="text-[11px] uppercase font-bold text-slate-500 block">
                Bank Specific Gateway Addenda
              </span>
              <p className="text-xs font-mono text-slate-900 bg-white p-2.5 rounded border border-slate-200 leading-relaxed">
                "{selectedBank.name} Addendum: Automated failover to secondary Australian East availability zone upon 3 consecutive 5xx errors."
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
