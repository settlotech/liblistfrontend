import React, { useState } from 'react';
import { X, Lock, Save, Crown, ShieldAlert, Sparkles, CheckCircle2 } from 'lucide-react';

export default function EditMasterCoreModal({ 
  isOpen, 
  onClose, 
  policy, 
  onSaveMasterPolicy 
}) {
  if (!isOpen || !policy) return null;

  const [version, setVersion] = useState(policy.latestVersion || 'v3.1.2');
  const [vision, setVision] = useState(policy.visionStatement || '');
  const [clauses, setClauses] = useState(
    policy.coreFrameworkClauses || [
      { clauseId: 'SEC-01', title: 'Mandatory PKCE & JWT Signing', content: '' },
      { clauseId: 'SEC-02', title: 'Maximum Refresh Token Inactivity', content: '' },
      { clauseId: 'SEC-03', title: 'Audit Logging & Non-Repudiation', content: '' },
    ]
  );

  const handleClauseChange = (index, field, value) => {
    const updated = [...clauses];
    updated[index] = { ...updated[index], [field]: value };
    setClauses(updated);
  };

  const handleSave = (e) => {
    e.preventDefault();
    onSaveMasterPolicy(policy.id, {
      latestVersion: version,
      visionStatement: vision,
      coreFrameworkClauses: clauses,
      lastUpdated: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    });
    alert(`Master Regulatory Specification for "${policy.title}" updated and published to all member banks!`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-300 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-amber-50/70 border-b border-amber-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-900">
              <Crown className="w-5 h-5 text-amber-700" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span>Edit 90% Core Master Standard (Staff Admin Only)</span>
                <span className="text-[10px] font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded border border-amber-300">
                  Government Authority
                </span>
              </h3>
              <p className="text-xs text-slate-600">Target Framework: <strong className="text-slate-900">{policy.title}</strong></p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-200 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 overflow-y-auto custom-scrollbar space-y-4 text-xs">
          <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-lg flex items-start gap-2.5 text-amber-900">
            <ShieldAlert className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
            <div className="text-[11.5px] leading-relaxed">
              <strong>Caution:</strong> Changes made here update the <strong>90% locked regulatory baseline</strong> across all subscribed banks (CBA, NAB, Westpac, ANZ). Subscribed banks cannot override these clauses.
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-800 font-bold mb-1">Specification Version</label>
              <input
                type="text"
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono font-bold text-slate-900 outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-800 font-bold mb-1">Compliance Authority</label>
              <input
                type="text"
                value={policy.complianceLevel || 'APRA CPS 234 / SOC2'}
                disabled
                className="w-full bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-500 font-medium cursor-not-allowed"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-800 font-bold mb-1">In-Spirit Vision Statement</label>
            <textarea
              value={vision}
              onChange={(e) => setVision(e.target.value)}
              rows="2"
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-3 text-xs text-slate-900 outline-none resize-none"
            />
          </div>

          {/* Master Clauses Editor */}
          <div className="space-y-3 pt-2 border-t border-slate-200">
            <div className="font-bold text-slate-900 flex items-center justify-between">
              <span>90% Core Master Clauses (Locked for Banks)</span>
              <span className="text-[11px] text-slate-500 font-normal">{clauses.length} Mandatory Clauses</span>
            </div>

            {clauses.map((clause, idx) => (
              <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={clause.clauseId}
                    onChange={(e) => handleClauseChange(idx, 'clauseId', e.target.value)}
                    className="w-24 bg-white border border-slate-300 rounded px-2 py-1 text-xs font-mono font-bold text-[#0057B8] outline-none"
                  />
                  <input
                    type="text"
                    value={clause.title}
                    onChange={(e) => handleClauseChange(idx, 'title', e.target.value)}
                    className="flex-1 bg-white border border-slate-300 rounded px-2.5 py-1 text-xs font-bold text-slate-900 outline-none"
                  />
                </div>
                <textarea
                  value={clause.content}
                  onChange={(e) => handleClauseChange(idx, 'content', e.target.value)}
                  rows="2"
                  className="w-full bg-white border border-slate-300 rounded p-2 text-xs text-slate-700 outline-none resize-none"
                />
              </div>
            ))}
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition cursor-pointer"
          >
            Cancel
          </button>
          
          <button
            onClick={handleSave}
            className="flex items-center gap-2 bg-[#0057B8] hover:bg-[#004EA6] text-white font-bold px-4 py-2 rounded-lg text-xs shadow-xs transition cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Publish Master Baseline to All Banks</span>
          </button>
        </div>
      </div>
    </div>
  );
}
