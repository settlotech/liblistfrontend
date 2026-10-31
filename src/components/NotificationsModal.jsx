import React, { useState, useMemo } from 'react';
import { 
  X, 
  Bell, 
  ShieldAlert, 
  CheckCircle2, 
  FileText, 
  AlertTriangle, 
  Search, 
  ExternalLink,
  Filter,
  Copy,
  Check,
  Clock,
  ArrowRight,
  User,
  Sparkles
} from 'lucide-react';

export default function NotificationsModal({ 
  isOpen, 
  onClose, 
  onOpenPolicy,
  currentUser,
  pendingItems = [],
  drafts = [],
  history = [],
  onOpenReviewItem
}) {
  const [filterType, setFilterType] = useState('all');
  const [searchCode, setSearchCode] = useState('');
  const [copiedCode, setCopiedCode] = useState(null);

  const isBankOwner = currentUser?.roleType === 'manager' || currentUser?.roleType === 'admin';
  const isEmployee = currentUser?.roleType === 'employee';

  const userNotifications = useMemo(() => {
    const list = [];

    // 1. Role-specific Maker-Checker tasks
    if (isBankOwner) {
      // Pending sign-offs assigned to Marcus Vance
      pendingItems.forEach((item) => {
        list.push({
          id: `mc-task-${item.id}`,
          code: `CR-#${item.id}`,
          category: 'maker_checker',
          severity: 'high',
          title: `Approval Task Assigned: Review "${item.policy_title || item.title}"`,
          description: `${item.maker_name || 'Staff Submitter'} submitted changes with note: "${item.proposed_changes?.submission_note || item.change_details || 'Proposed policy amendment submitted for dual-control sign-off.'}"`,
          timestamp: item.created_at ? new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently',
          policyId: item.policy_id,
          reviewItem: item,
          status: 'Action Required: Sign-off',
          details: `Dual-control checker assignment for ${currentUser?.name || 'Bank Manager'}`
        });
      });
    } else if (isEmployee) {
      // Submissions made by this employee or assigned drafts
      pendingItems.forEach((item) => {
        list.push({
          id: `mc-emp-pending-${item.id}`,
          code: `CR-#${item.id}`,
          category: 'maker_checker',
          severity: 'medium',
          title: `Submission In-Review: "${item.policy_title || item.title}"`,
          description: `Your amendment proposal is currently in the Maker-Checker queue awaiting Marcus Vance (Bank Approver) sign-off.`,
          timestamp: item.created_at ? new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently',
          policyId: item.policy_id,
          reviewItem: item,
          status: 'Pending Sign-off',
          details: `Assigned Approver: Marcus Vance`
        });
      });

      // Employee's recent adjudicated items (Approved / Rejected)
      history.slice(0, 5).forEach((h) => {
        const isApp = h.status === 'approved';
        list.push({
          id: `mc-emp-hist-${h.id}`,
          code: `AUDIT-#${h.id}`,
          category: 'maker_checker',
          severity: isApp ? 'low' : 'high',
          title: `${isApp ? 'Policy Amendment Approved' : 'Policy Amendment Rejected'}: "${h.policy_title || h.title}"`,
          description: `Checker ${h.checker_name || 'Marcus Vance'} ${isApp ? 'approved and activated' : 'declined'} your submission. Adjudication feedback: "${h.comments || h.adjudication_note || (isApp ? 'Verified and signed off.' : 'Requires adjustment.')}"`,
          timestamp: h.adjudicated_at ? new Date(h.adjudicated_at).toLocaleDateString() : 'Recent',
          policyId: h.policy_id,
          reviewItem: h,
          status: isApp ? 'Approved' : 'Declined',
          details: `Adjudicated by ${h.checker_name || 'Marcus Vance'}`
        });
      });

      // Assigned drafts
      drafts.slice(0, 3).forEach((d) => {
        list.push({
          id: `draft-assigned-${d.id}`,
          code: `DRAFT-${d.id}`,
          category: 'maker_checker',
          severity: 'info',
          title: `Assigned Drafting Task: "${d.title}"`,
          description: `Draft operational document saved under ${d.department_name || 'Retail Banking'}. Open editor to review clauses and submit for sign-off.`,
          timestamp: 'Saved Draft',
          policyId: d.id,
          status: 'Draft In-Progress',
          details: `Author: ${currentUser?.name || 'Staff'}`
        });
      });
    }

    // 2. Regulatory & Security System Compliance Notifications
    list.push(
      {
        id: 'notif-1',
        code: 'APRA-CPS234-2026-P1',
        category: 'regulatory',
        severity: 'high',
        title: 'APRA CPS 234 Mandatory Security Benchmark Refresh',
        description: 'Annual APRA information security compliance directive: All MFA protocols and session timeouts must be audited and verified across Tier 1 digital channels.',
        timestamp: 'Today, 10:45 AM',
        policyId: 'remote-access-security-policy',
        status: 'Action Required',
        details: 'Dual sign-off mandatory before end of quarter.'
      },
      {
        id: 'notif-3',
        code: 'AUSTRAC-AML-CDD-04',
        category: 'regulatory',
        severity: 'high',
        title: 'AUSTRAC Customer Due Diligence (CDD) Circular',
        description: 'Updated guidelines for high-net-worth individual identity verification: Mandatory 100-point physical or biometric DVS cross-referencing.',
        timestamp: 'Yesterday, 3:20 PM',
        policyId: 'customer-onboarding-sop',
        status: 'Acknowledged',
        details: 'Implemented in v1.0 baseline.'
      },
      {
        id: 'notif-4',
        code: 'SEC-RBAC-MASK-91',
        category: 'security',
        severity: 'info',
        title: 'Policy Access Clearance Updated',
        description: 'Confidential policy "VIP & High-Net-Worth Lending Escalation Procedure" access clearance was configured.',
        timestamp: '24 Oct 2026, 9:00 AM',
        policyId: 'vip-executive-escalation-sop',
        status: 'Restricted',
        details: 'Staff without direct clearance cannot view this policy.'
      },
      {
        id: 'notif-5',
        code: 'CBA-GOV-AUDIT-2026',
        category: 'compliance',
        severity: 'info',
        title: 'Central Banking Audit Log Snapshot',
        description: 'Central change log synchronized with banking database. 14 operational parameters recorded with SHA-256 integrity hash.',
        timestamp: '24 Oct 2026, 8:16 AM',
        policyId: null,
        status: 'Synchronized',
        details: 'Connection: TLS 1.3 Active.'
      }
    );

    return list;
  }, [currentUser, isBankOwner, isEmployee, pendingItems, drafts, history]);

  if (!isOpen) return null;

  const handleCopyCode = (code, e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 1500);
  };

  const filtered = userNotifications.filter(n => {
    const matchesFilter = filterType === 'all' || n.category === filterType;
    const matchesSearch = n.code.toLowerCase().includes(searchCode.toLowerCase()) ||
                          n.title.toLowerCase().includes(searchCode.toLowerCase()) ||
                          n.description.toLowerCase().includes(searchCode.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-2xl flex flex-col max-h-[85vh] overflow-hidden">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-[#0057B8]/10 text-[#0057B8] border border-blue-200">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 tracking-tight">
                  System Notifications & Assigned Tasks
                </h2>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                  {currentUser?.name || 'User'} ({currentUser?.roleType === 'employee' ? 'Staff Submitter' : 'Bank Approver'})
                </span>
              </div>
              <p className="text-[12px] text-slate-500">
                {isBankOwner 
                  ? 'Assigned maker-checker adjudication tasks and regulatory compliance directives'
                  : 'Your assigned drafting tasks, maker-checker submissions, and regulatory circulars'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter & Search Bar */}
        <div className="p-3 border-b border-slate-200 bg-white flex flex-col sm:flex-row gap-2 items-center justify-between">
          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 text-[#0057B8] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchCode}
              onChange={(e) => setSearchCode(e.target.value)}
              placeholder="Search notifications or codes..."
              className="w-full text-xs pl-8 pr-3 py-1.5 rounded-xl border-2 border-[#0057B8]/40 hover:border-[#0057B8] bg-white focus:outline-none focus:border-[#0057B8] focus:ring-2 focus:ring-[#0057B8]/20 transition shadow-2xs font-medium"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
            <button
              onClick={() => setFilterType('all')}
              className={`px-2.5 py-1 rounded-md text-[11.5px] font-medium transition cursor-pointer ${
                filterType === 'all'
                  ? 'bg-[#0057B8] text-white shadow-2xs font-semibold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All ({userNotifications.length})
            </button>
            <button
              onClick={() => setFilterType('maker_checker')}
              className={`px-2.5 py-1 rounded-md text-[11.5px] font-medium transition cursor-pointer ${
                filterType === 'maker_checker'
                  ? 'bg-[#0057B8] text-white shadow-2xs font-semibold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Tasks & Approvals
            </button>
            <button
              onClick={() => setFilterType('regulatory')}
              className={`px-2.5 py-1 rounded-md text-[11.5px] font-medium transition cursor-pointer ${
                filterType === 'regulatory'
                  ? 'bg-[#0057B8] text-white shadow-2xs font-semibold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Regulatory
            </button>
            <button
              onClick={() => setFilterType('security')}
              className={`px-2.5 py-1 rounded-md text-[11.5px] font-medium transition cursor-pointer ${
                filterType === 'security'
                  ? 'bg-[#0057B8] text-white shadow-2xs font-semibold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Security
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar bg-slate-50/50">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              No matching notification tasks found.
            </div>
          ) : (
            filtered.map((notif) => (
              <div 
                key={notif.id}
                className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-2 hover:border-slate-300 transition"
              >
                {/* Code badge, Timestamp & Status */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-slate-900 text-amber-300 border border-slate-800 flex items-center gap-1">
                      {notif.code}
                      <button 
                        onClick={(e) => handleCopyCode(notif.code, e)}
                        title="Copy Code"
                        className="hover:text-white p-0.5"
                      >
                        {copiedCode === notif.code ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </span>

                    <span className={`text-[10.5px] font-semibold px-2 py-0.5 rounded ${
                      notif.severity === 'high' 
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : notif.severity === 'medium'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-blue-50 text-blue-700 border border-blue-200'
                    }`}>
                      {notif.status}
                    </span>
                  </div>

                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    {notif.timestamp}
                  </span>
                </div>

                {/* Title & Description */}
                <div>
                  <h4 className="text-[13px] font-bold text-slate-900">
                    {notif.title}
                  </h4>
                  <p className="text-[12px] text-slate-600 mt-0.5 leading-relaxed">
                    {notif.description}
                  </p>
                </div>

                {/* Details bar & Action button */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <span className="truncate">{notif.details}</span>

                  <div className="flex items-center gap-2">
                    {/* Direct Maker-Checker review action */}
                    {notif.reviewItem && onOpenReviewItem && (
                      <button
                        onClick={() => {
                          onOpenReviewItem(notif.reviewItem);
                          onClose();
                        }}
                        className="inline-flex items-center gap-1 font-bold text-xs bg-[#0057B8] hover:bg-[#004EA6] text-white px-2.5 py-1 rounded-lg transition cursor-pointer shadow-2xs"
                      >
                        <span>{isBankOwner ? 'Review & Adjudicate' : 'View Proposal'}</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    )}

                    {notif.policyId && !notif.reviewItem && (
                      <button
                        onClick={() => {
                          if (onOpenPolicy) onOpenPolicy(notif.policyId);
                          onClose();
                        }}
                        className="inline-flex items-center gap-1 font-semibold text-slate-800 hover:text-[#0057B8] underline flex-shrink-0 cursor-pointer"
                      >
                        <span>Open Policy</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-200 bg-white flex items-center justify-between text-xs text-slate-500">
          <span>APRA CPS 234 & Banking Governance audit events securely recorded in database.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-[#0057B8] hover:bg-[#004EA6] text-white transition cursor-pointer shadow-xs"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
