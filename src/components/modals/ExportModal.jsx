import React, { useState } from 'react';
import { X, ShieldCheck, Download, Copy, Check, Lock, Unlock } from 'lucide-react';

export default function ExportModal({ 
  isOpen, 
  onClose, 
  policy, 
  selectedBank 
}) {
  if (!isOpen || !policy) return null;

  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const auditHash = `SHA256-AU-APRA-${(policy.id || 'SPEC').toUpperCase()}-${(selectedBank.id || 'BANK').toUpperCase()}-9408F2A`;

  const handleCopyHash = () => {
    navigator.clipboard.writeText(auditHash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    setDownloading(true);
    setTimeout(() => {
      setDownloading(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-300 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-in fade-in duration-150">
        {/* Header */}
        <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 shadow-2xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Compliance & Specification Package</h3>
              <p className="text-[11px] text-slate-500">APRA CPS 234 & SOC2 Type II Certified</p>
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
        <div className="p-5 overflow-y-auto custom-scrollbar space-y-4 text-xs text-slate-800">
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <span className="font-bold text-slate-900 text-xs">LibTrak Verified Specification</span>
              <span className="font-mono font-bold text-[#0057B8] text-xs bg-[#0057B8]/10 px-2 py-0.5 rounded border border-[#0057B8]/30">
                {policy.latestVersion || 'v3.1.2'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-slate-700">
              <div><span className="text-slate-500 font-medium">Document:</span> <span className="font-bold text-slate-900">{policy.title}</span></div>
              <div><span className="text-slate-500 font-medium">Institution:</span> <span className="font-bold text-slate-900">{selectedBank.name}</span></div>
              <div><span className="text-slate-500 font-medium">Gov Approval:</span> <span className="font-bold text-slate-900">{policy.complianceLevel || 'SOC2 / APRA'}</span></div>
              <div><span className="text-slate-500 font-medium">Audit Status:</span> <span className="font-bold text-emerald-800">Verified Compliant</span></div>
            </div>

            <div className="pt-2 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <span className="font-mono text-slate-600 text-[10.5px] truncate max-w-[280px]">
                {auditHash}
              </span>
              <button
                onClick={handleCopyHash}
                className="flex items-center justify-center gap-1 text-slate-800 hover:text-slate-950 font-bold font-mono bg-white px-2.5 py-1 rounded-lg border border-slate-300 shadow-2xs transition cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy Hash'}</span>
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200 flex items-start gap-2.5">
              <Lock className="w-4 h-4 text-emerald-700 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-emerald-950 text-xs">Master Regulatory Core Framework</span>
                <p className="text-xs text-emerald-900 mt-0.5">
                  Standardized government-approved operating baseline locked against unauthorized drift.
                </p>
              </div>
            </div>

            <div className="p-3 bg-[#0057B8]/5 rounded-xl border border-[#0057B8]/20 flex items-start gap-2.5">
              <Unlock className="w-4 h-4 text-[#0057B8] flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-slate-950 text-xs">Institution Policy Rules ({selectedBank.name})</span>
                <p className="text-xs text-slate-700 mt-0.5">
                  Customized institutional parameters and risk verification triggers verified against statutory frameworks.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition cursor-pointer"
          >
            Close
          </button>
          
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="flex items-center gap-2 bg-[#0057B8] hover:bg-[#004EA6] text-white font-bold px-4 py-2 rounded-lg text-xs shadow-xs transition cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>{downloading ? 'Exporting...' : 'Download Specification Bundle'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
