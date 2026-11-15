import React, { useState, useEffect } from 'react';
import { X, Lock, Building2, SendHorizontal, Save, Sliders, CheckCircle2 } from 'lucide-react';

export default function EditSpecModal({ 
  isOpen, 
  onClose, 
  policy, 
  selectedBank, 
  onSaveCustomization,
  onAddComment,
  currentUser
}) {
  if (!isOpen || !policy) return null;

  const isManager = currentUser?.roleType === 'manager' || currentUser?.type === 'admin';
  const isLending = policy.id?.includes('aps-220') || policy.id?.includes('credit') || policy.id?.includes('lending');
  const isAuth = policy.id?.includes('oauth') || policy.id?.includes('mfa') || policy.id?.includes('privileged-access');
  const isPrivacy = policy.id?.includes('privacy') || policy.id?.includes('cdr');
  const isAml = policy.id?.includes('aml') || policy.id?.includes('sanctions');

  const currentAddenda = policy.bankCustomAddenda?.[selectedBank.id] || {
    sessionTimeout: isLending ? 'Max $50,000 Unsecured Personal Loan Limit' : '15 Minutes Inactivity / 8h Absolute',
    mfaRule: isLending ? 'Income verification via automated CDR Open Banking stream' : 'Transfers > $5,000 AUD or Novel IP',
    customClause: 'Standard institutional operational conditions applied.',
    lastModifiedBy: currentUser?.name || 'Bank Compliance Team',
  };

  // State for Field 1
  const [param1Select, setParam1Select] = useState(currentAddenda.sessionTimeout);
  const [param1Custom, setParam1Custom] = useState('');
  const [isParam1Custom, setIsParam1Custom] = useState(false);

  // State for Field 2
  const [param2Select, setParam2Select] = useState(currentAddenda.mfaRule);
  const [param2Custom, setParam2Custom] = useState('');
  const [isParam2Custom, setIsParam2Custom] = useState(false);

  // State for Field 3 & 4
  const [clause, setClause] = useState(currentAddenda.customClause);
  const [officerName, setOfficerName] = useState(currentUser?.name ? `${currentUser.name} (${selectedBank.id.toUpperCase()} ${currentUser.roleType === 'manager' ? 'Risk Manager' : 'Security Architect'})` : currentAddenda.lastModifiedBy);
  const [justification, setJustification] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Sync state when opening
  useEffect(() => {
    if (isOpen) {
      setParam1Select(currentAddenda.sessionTimeout);
      setParam2Select(currentAddenda.mfaRule);
      setClause(currentAddenda.customClause);
      setSuccessMessage('');
    }
  }, [isOpen, policy.id, selectedBank.id]);

  // Determine Field 1 and Field 2 Labels based on policy
  const getFieldLabels = () => {
    if (isLending) {
      return {
        field1: 'Maximum Personal Loan Limit',
        field2: 'Income & Serviceability Verification Stream',
        field1Presets: [
          'Max $50,000 Unsecured Personal Loan Limit',
          'Max $30,000 Unsecured Personal Loan Limit',
          'Max $20,000 Unsecured Personal Loan Limit',
          'Max $10,000 Unsecured Personal Loan Limit',
          'Max $75,000 Unsecured Personal Loan Limit (High Net Worth)',
        ],
        field2Presets: [
          'Income verification via automated CDR Open Banking stream',
          'Income validation via automated payslip OCR & Employer API',
          'Income validation via Tax Return & ATO MyGov Portal',
          'Income & living expense verification via 12m Bank Statement OCR',
          'Dual-document certified income & employer phone validation',
          'Branch in-person certified income verification',
        ]
      };
    }

    if (isAuth) {
      return {
        field1: 'Session Inactivity Timeout Window',
        field2: 'Step-Up Authentication Trigger',
        field1Presets: [
          '15 Minutes Inactivity / 8h Absolute',
          '20 Minutes Inactivity / 8h Absolute',
          '30 Minutes Inactivity / 12h Absolute',
          '12 Minutes Inactivity / 6h Absolute',
        ],
        field2Presets: [
          'Transfers > $5,000 AUD or Novel IP Geolocation',
          'Any Payee Addition or Modification of Daily Limits',
          'Transfers > $10,000 AUD or International Routing',
          'Cross-border payments > $2,500 AUD or Biometric Mismatch',
        ]
      };
    }

    if (isPrivacy) {
      return {
        field1: 'Statutory Retention & Purge Schedule',
        field2: 'Data Access & Export Clearance Level',
        field1Presets: [
          '7 Years + 30 Days Standard Purge',
          '7 Years + 60 Days Internal Audit Freeze',
          '7 Years + 45 Days Cold Archive Buffer',
          '7 Years Exact Purge Window',
        ],
        field2Presets: [
          'Tier-3 Compliance Officer Clearance for TFN Lookups',
          'Double Officer Approval for Customer Data Export',
          'Zero-Trust Biometric Confirmation for PII Access',
          'Executive Approval for Cross-Border Cloud Access',
        ]
      };
    }

    if (isAml) {
      return {
        field1: 'AUSTRAC Batch Transmission Frequency',
        field2: 'Sanctions Clearance & Override Authorization',
        field1Presets: [
          'Automated batch dispatch every 24 hours',
          'Real-time TTR message staging queue',
          'Immediate transmission for high-risk corridors',
          'Hourly sanctions delta database sync',
        ],
        field2Presets: [
          'Dual-officer sign-off for SMR narrative filing',
          'Senior Compliance Officer clearance for filing exceptions',
          'Sanctions officer override requires level-4 clearance',
          'Two-officer sign-off for false-positive release',
        ]
      };
    }

    return {
      field1: 'Configured Operational Parameter / Timeout',
      field2: 'Risk Threshold / Verification Trigger',
      field1Presets: [
        'Standard Institutional Operational Baseline',
        'Accelerated 24h Triage Protocol',
        'Live Replication Sync (RPO = 0 Seconds)',
      ],
      field2Presets: [
        'Dual-officer cryptographic signoff required',
        'Continuous automated vulnerability scoring review',
        'Automated failover on secondary availability zone',
      ]
    };
  };

  const labels = getFieldLabels();

  const finalParam1 = isParam1Custom ? (param1Custom || 'Custom Parameter') : param1Select;
  const finalParam2 = isParam2Custom ? (param2Custom || 'Custom Trigger') : param2Select;

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!isManager) {
      // Employee Submitter: Create formal Change Request in feed
      if (onAddComment) {
        onAddComment({
          id: `cr-${Date.now()}`,
          type: 'CHANGE_REQUEST',
          category: 'Review',
          badge: 'Policy Variance Request',
          author: currentUser?.name || 'David Miller',
          authorRole: currentUser?.role || 'Security Architect (Employee)',
          avatar: currentUser?.avatar || 'DM',
          recipient: 'Risk Committee (Manager Approver)',
          bankId: selectedBank.id,
          targetProduct: policy.applicableProducts?.[0] || 'Personal Loans',
          time: 'Just now',
          title: `Proposed Rule Update: ${policy.title}`,
          content: justification.trim() || `Proposed operational update for ${selectedBank.name}: ${finalParam1} and ${finalParam2}. Institutional clause: "${clause}"`,
          proposedTimeout: finalParam1,
          proposedMfaRule: finalParam2,
          status: 'PENDING',
          reviewerName: null,
          reviewNote: null,
          reviewedAt: null,
        });
      }

      setSuccessMessage(`Change Request submitted to Risk Committee for review!`);
      setTimeout(() => {
        onClose();
      }, 1200);
    } else {
      // Manager Approver: Enforce and save directly
      if (onSaveCustomization) {
        onSaveCustomization(policy.id, selectedBank.id, {
          sessionTimeout: finalParam1,
          mfaRule: finalParam2,
          customClause: clause,
          lastModifiedBy: officerName,
        });
      }

      setSuccessMessage(`Policy rules updated and enforced for ${selectedBank.name}!`);
      setTimeout(() => {
        onClose();
      }, 1000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-300 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] text-xs animate-in fade-in duration-150">
        {/* Header */}
        <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-300 flex items-center justify-center text-slate-800 shadow-2xs">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Configure Institutional Policy</h3>
              <p className="text-[11px] text-slate-600">
                Bank: <strong className="text-slate-900">{selectedBank.name}</strong> • Standard: <strong className="text-slate-900">{policy.title}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-200 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Success Banner */}
        {successMessage ? (
          <div className="p-8 text-center space-y-3 bg-slate-50 border-y border-slate-200">
            <CheckCircle2 className="w-10 h-10 text-slate-800 mx-auto animate-bounce" />
            <div className="font-bold text-slate-900 text-sm">{successMessage}</div>
            <p className="text-xs text-slate-600">
              {isManager 
                ? 'Your changes are now live and active for this institution.' 
                : 'Your proposal has been logged in the Contextual Review Feed for Risk Manager sign-off.'}
            </p>
          </div>
        ) : (
          /* Form Body */
          <form onSubmit={handleSubmit} className="p-5 overflow-y-auto custom-scrollbar space-y-4">
            <div className="p-3 bg-slate-50 border border-slate-300 rounded-xl flex items-start gap-2.5 text-slate-900">
              <Lock className="w-4 h-4 text-slate-700 flex-shrink-0 mt-0.5" />
              <div className="text-[11px] leading-relaxed text-slate-800">
                <strong className="text-slate-900">Government Baseline Locked:</strong> APRA statutory core clauses cannot be altered. You are configuring your bank's operational thresholds and institutional parameters.
              </div>
            </div>

            {/* Field 1: Dynamic Label & Dropdown with Custom Input */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="block text-slate-800 font-bold text-[11px]">
                  {labels.field1}
                </label>
                <button
                  type="button"
                  onClick={() => setIsParam1Custom(!isParam1Custom)}
                  className="text-[10.5px] font-bold text-blue-600 hover:text-blue-800 cursor-pointer"
                >
                  {isParam1Custom ? '← Choose Preset' : '+ Custom Value'}
                </button>
              </div>

              {isParam1Custom ? (
                <input
                  type="text"
                  value={param1Custom}
                  onChange={(e) => setParam1Custom(e.target.value)}
                  placeholder="Enter custom limit / threshold..."
                  className="w-full bg-slate-50 border border-blue-300 focus:bg-white rounded-lg px-3 py-2 text-xs text-slate-900 outline-none"
                  required
                />
              ) : (
                <select
                  value={param1Select}
                  onChange={(e) => {
                    if (e.target.value === '__CUSTOM__') {
                      setIsParam1Custom(true);
                    } else {
                      setParam1Select(e.target.value);
                    }
                  }}
                  className="w-full bg-slate-50 border border-slate-300 focus:bg-white rounded-lg px-3 py-2 text-xs text-slate-900 outline-none font-medium"
                >
                  {labels.field1Presets.map((opt, idx) => (
                    <option key={idx} value={opt}>{opt}</option>
                  ))}
                  <option value="__CUSTOM__">+ Enter custom value...</option>
                </select>
              )}
            </div>

            {/* Field 2: Dynamic Label & Dropdown with Custom Input */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="block text-slate-800 font-bold text-[11px]">
                  {labels.field2}
                </label>
                <button
                  type="button"
                  onClick={() => setIsParam2Custom(!isParam2Custom)}
                  className="text-[10.5px] font-bold text-blue-600 hover:text-blue-800 cursor-pointer"
                >
                  {isParam2Custom ? '← Choose Preset' : '+ Custom Value'}
                </button>
              </div>

              {isParam2Custom ? (
                <input
                  type="text"
                  value={param2Custom}
                  onChange={(e) => setParam2Custom(e.target.value)}
                  placeholder="Enter custom verification method / trigger..."
                  className="w-full bg-slate-50 border border-blue-300 focus:bg-white rounded-lg px-3 py-2 text-xs text-slate-900 outline-none"
                  required
                />
              ) : (
                <select
                  value={param2Select}
                  onChange={(e) => {
                    if (e.target.value === '__CUSTOM__') {
                      setIsParam2Custom(true);
                    } else {
                      setParam2Select(e.target.value);
                    }
                  }}
                  className="w-full bg-slate-50 border border-slate-300 focus:bg-white rounded-lg px-3 py-2 text-xs text-slate-900 outline-none font-medium"
                >
                  {labels.field2Presets.map((opt, idx) => (
                    <option key={idx} value={opt}>{opt}</option>
                  ))}
                  <option value="__CUSTOM__">+ Enter custom trigger...</option>
                </select>
              )}
            </div>

            {/* Field 3: Bank Specific Institutional Rule Clause */}
            <div>
              <label className="block text-slate-800 font-bold mb-1 text-[11px]">
                Institutional Policy Rule Clause
              </label>
              <textarea
                value={clause}
                onChange={(e) => setClause(e.target.value)}
                rows="2"
                placeholder="Enter institutional operational conditions..."
                className="w-full bg-slate-50 border border-slate-300 focus:bg-white rounded-lg p-2.5 text-xs text-slate-900 outline-none resize-none font-sans"
              />
            </div>

            {/* Field 4: Regulatory Justification (for Change Request) */}
            {!isManager && (
              <div>
                <label className="block text-slate-800 font-bold mb-1 text-[11px]">
                  Business & Regulatory Justification (Required for Review)
                </label>
                <textarea
                  value={justification}
                  onChange={(e) => setJustification(e.target.value)}
                  rows="2"
                  placeholder="Explain customer impact or risk rationale for this change..."
                  className="w-full bg-slate-50 border border-slate-300 focus:bg-white rounded-lg p-2.5 text-xs text-slate-900 outline-none resize-none"
                  required
                />
              </div>
            )}

            {/* Field 5: Authorizing Officer */}
            <div>
              <label className="block text-slate-800 font-bold mb-1 text-[11px]">
                Submitting Officer / Architect
              </label>
              <input
                type="text"
                value={officerName}
                onChange={(e) => setOfficerName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 outline-none"
              />
            </div>

            {/* Footer Buttons */}
            <div className="pt-2 flex justify-between items-center border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                className={`flex items-center gap-2 text-white font-bold px-4 py-2 rounded-lg text-xs shadow-xs transition cursor-pointer ${
                  isManager 
                    ? 'bg-emerald-700 hover:bg-emerald-800' 
                    : 'bg-[#0057B8] hover:bg-[#004EA6]'
                }`}
              >
                {isManager ? (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save & Enforce Rule</span>
                  </>
                ) : (
                  <>
                    <SendHorizontal className="w-4 h-4" />
                    <span>⚡ Submit as Change Request</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
