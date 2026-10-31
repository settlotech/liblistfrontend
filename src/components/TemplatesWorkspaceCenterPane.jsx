import React, { useState, useEffect } from 'react';
import { 
  FileCode, 
  ArrowLeft, 
  Copy, 
  Plus, 
  Search, 
  Layers, 
  Clock, 
  ShieldCheck, 
  Sliders, 
  ChevronDown, 
  ChevronUp, 
  Check, 
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { apiService } from '../services/apiService';

const DEFAULT_STARTER_TEMPLATES = [
  {
    id: 'template-commercial-equipment',
    name: 'commercial_equipment_finance_template',
    title: 'Commercial Equipment Finance & Asset Lending SOP',
    department_id: 'retail-lending',
    summary: 'Standard operating procedure for chattel mortgages, hire purchase contracts, and commercial vehicle leasing facilities.',
    sla: '36 Hours',
    daily: '$100,000 AUD',
    cap: '$50,000 AUD',
    sections: [
      {
        id: 'sec-1',
        title: 'Phase 1: Purpose & Product Scope',
        content: 'Draft operational SOP for underwriting commercial chattel mortgages, hire purchase contracts, and equipment lease facilities up to $500,000 AUD.'
      },
      {
        id: 'sec-2',
        title: 'Phase 2: Asset Valuation & Depreciation Benchmarks',
        content: '1. Asset Classes: Heavy haulage transport, earthmoving equipment, agricultural machinery, medical technology.\n2. Loan-to-Value Ratio (LVR): Maximum 85% for primary machinery; 70% for secondary vehicles.\n3. Mandatory Security: PPSR registration mandatory within 5 business days.'
      },
      {
        id: 'sec-3',
        title: 'Phase 3: Credit Assessment & Cash-Flow Verification',
        content: '1. Two consecutive financial years of certified BAS statements.\n2. Commercial credit check benchmark: Credit score minimum 650.\n3. Debt Service Coverage Ratio (DSCR): 1.35x baseline coverage.'
      }
    ]
  },
  {
    id: 'template-revolving-credit',
    name: 'revolving_credit_card_template',
    title: 'Credit Cards & Revolving Line Facilities Standard',
    department_id: 'credit-cards',
    summary: 'Standard operating specifications for revolving consumer credit limits, automated credit decisioning, and Tier-1 exception governance.',
    sla: '4 Hours',
    daily: '$25,000 AUD',
    cap: '$100,000 AUD',
    sections: [
      {
        id: 'sec-cc-1',
        title: 'Phase 1: Revolving Card Limits Baseline',
        content: 'Establish baseline credit limits for Platinum, Gold, and Everyday revolving credit cards under NCCP Act compliance.'
      },
      {
        id: 'sec-cc-2',
        title: 'Phase 2: DVS Biometric & Turnaround SLA',
        content: 'Automated Tier-1 card verification turnaround SLA lowered from 24h to 4h based on Document Verification Service (DVS) biometric cross-referencing.'
      }
    ]
  },
  {
    id: 'template-apra-cps234',
    name: 'apra_cps234_security_template',
    title: 'APRA CPS 234 Information Security & Dual-Control Charter',
    department_id: 'security-infosec',
    summary: 'Prudential benchmark for institutional cyber defense, multi-factor authentication, cryptographic key management, and dual-control sign-off.',
    sla: '2 Hours',
    daily: '$0 AUD',
    cap: 'Executive Only',
    sections: [
      {
        id: 'sec-apra-1',
        title: 'Directive 1: Cryptographic Authentication & Session Lifecycle',
        content: 'Mandate FIDO2/WebAuthn hardware tokens or biometric MFA for all internal core banking administration consoles. Idle session timeout enforced at 15 minutes.'
      },
      {
        id: 'sec-apra-2',
        title: 'Directive 2: Dual-Control Maker-Checker Enforcement',
        content: 'All policy amendments, delegation threshold increases, and parameter modifications require independent checker review and cryptographic logging.'
      }
    ]
  },
  {
    id: 'template-austrac-aml',
    name: 'austrac_aml_cdd_template',
    title: 'AUSTRAC Customer Due Diligence (CDD) Standard',
    department_id: 'legal-compliance',
    summary: 'Institutional framework for AML/CTF 100-point physical and biometric customer onboarding verification.',
    sla: '12 Hours',
    daily: '$50,000 AUD',
    cap: '$250,000 AUD',
    sections: [
      {
        id: 'sec-aml-1',
        title: 'Clause 1: 100-Point Identity Verification Matrix',
        content: 'Primary Australian passport or drivers license combined with Medicare or utility bill verification verified against national DVS registry.'
      }
    ]
  }
];

export function TemplatesWorkspaceCenterPane({
  currentUser,
  onBackToPolicy,
  onOpenAddPolicyModal,
  onSelectTemplate
}) {
  const [templates, setTemplates] = useState(DEFAULT_STARTER_TEMPLATES);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('all');
  const [expandedTemplateId, setExpandedTemplateId] = useState(null);

  useEffect(() => {
    const loadTemplates = async () => {
      setIsLoading(true);
      try {
        const data = await apiService.getTemplates();
        if (Array.isArray(data) && data.length > 0) {
          // Merge with starter templates to ensure rich options
          const map = new Map();
          DEFAULT_STARTER_TEMPLATES.forEach(t => map.set(t.id, t));
          data.forEach(t => {
            const p = typeof t.sections === 'string' ? JSON.parse(t.sections || '[]') : (t.sections || []);
            map.set(t.id || t.name, {
              ...t,
              sections: p.length > 0 ? p : (DEFAULT_STARTER_TEMPLATES.find(d => d.id === t.id)?.sections || [])
            });
          });
          setTemplates(Array.from(map.values()));
        }
      } catch (err) {
        console.warn('Using client templates:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadTemplates();
  }, []);

  const filtered = templates.filter(t => {
    const matchesDept = selectedDeptFilter === 'all' || t.department_id === selectedDeptFilter;
    const matchesSearch = !searchQuery || 
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.summary && t.summary.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesDept && matchesSearch;
  });

  const handleUseTemplate = (tpl) => {
    if (onSelectTemplate) {
      onSelectTemplate(tpl);
    } else if (onOpenAddPolicyModal) {
      onOpenAddPolicyModal(tpl.department_id);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#f8fafc] overflow-hidden select-text">
      
      {/* Top Header Bar */}
      <div className="px-6 py-3.5 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-3">
          {onBackToPolicy && (
            <button
              onClick={onBackToPolicy}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer flex items-center gap-1 text-xs font-semibold"
              title="Return to Active Policy Workspace"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Back to Policy</span>
            </button>
          )}

          <div>
            <div className="flex items-center gap-2">
              <FileCode className="w-5 h-5 text-purple-600" />
              <h1 className="text-base font-bold text-slate-900 tracking-tight">
                Policy Starter Templates & Standards Blueprints
              </h1>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200">
                {templates.length} Blueprints
              </span>
            </div>
            <p className="text-[11.5px] text-slate-500 mt-0.5">
              Clone pre-certified institutional policy structures with clauses, risk benchmarks, and SLAs
            </p>
          </div>
        </div>

        {onOpenAddPolicyModal && (
          <button
            onClick={() => onOpenAddPolicyModal()}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#0057B8] hover:bg-[#004EA6] text-white shadow-xs transition cursor-pointer active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Custom Policy</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="px-6 py-2.5 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSelectedDeptFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              selectedDeptFilter === 'all'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            All Standards ({templates.length})
          </button>
          <button
            onClick={() => setSelectedDeptFilter('retail-lending')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              selectedDeptFilter === 'retail-lending'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Retail Lending
          </button>
          <button
            onClick={() => setSelectedDeptFilter('credit-cards')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              selectedDeptFilter === 'credit-cards'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Credit Cards
          </button>
          <button
            onClick={() => setSelectedDeptFilter('security-infosec')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              selectedDeptFilter === 'security-infosec'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Security & InfoSec
          </button>
        </div>

        <div className="relative w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search template standards..."
            className="w-full text-xs pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-purple-600 font-medium"
          />
        </div>
      </div>

      {/* Templates Grid */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((tpl) => {
            const isExpanded = expandedTemplateId === tpl.id;
            const sections = tpl.sections || [];

            return (
              <div
                key={tpl.id}
                className="p-5 rounded-2xl border border-slate-200 bg-white shadow-2xs hover:border-purple-300 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-purple-50 text-purple-800 border border-purple-200">
                      {tpl.department_id || 'Institutional'}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
                      APRA CPS Certified
                    </span>
                  </div>

                  <h3 className="text-[14px] font-bold text-slate-900 leading-snug">
                    {tpl.title}
                  </h3>
                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                    {tpl.summary}
                  </p>

                  {/* Benchmark limits */}
                  <div className="grid grid-cols-3 gap-2 mt-3.5 pt-3 border-t border-slate-100 text-center">
                    <div className="p-2 rounded-xl bg-slate-50 border border-slate-200/80">
                      <span className="text-[10px] text-slate-500 font-medium block">SLA Baseline</span>
                      <strong className="text-xs font-bold text-slate-800">{tpl.sla || '4 Hours'}</strong>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-50 border border-slate-200/80">
                      <span className="text-[10px] text-slate-500 font-medium block">Daily Limit</span>
                      <strong className="text-xs font-bold text-slate-800">{tpl.daily || '$25,000 AUD'}</strong>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-50 border border-slate-200/80">
                      <span className="text-[10px] text-slate-500 font-medium block">Officer Cap</span>
                      <strong className="text-xs font-bold text-slate-800">{tpl.cap || '$100,000 AUD'}</strong>
                    </div>
                  </div>

                  {/* Sections Preview */}
                  {isExpanded && (
                    <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 text-xs">
                      <h4 className="font-bold text-slate-700 uppercase tracking-wider text-[10.5px]">
                        Template Clause Specifications ({sections.length})
                      </h4>
                      <div className="space-y-2 max-h-56 overflow-y-auto custom-scrollbar">
                        {sections.map((sec, idx) => (
                          <div key={sec.id || idx} className="p-2.5 rounded-xl bg-purple-50/40 border border-purple-200/70">
                            <strong className="text-xs text-purple-950 font-bold block mb-0.5">
                              {sec.title || `Clause ${idx + 1}`}
                            </strong>
                            <p className="text-[11.5px] text-slate-700 whitespace-pre-wrap leading-relaxed">
                              {sec.content}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setExpandedTemplateId(isExpanded ? null : tpl.id)}
                    className="text-xs text-purple-700 hover:text-purple-900 font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <span>{isExpanded ? 'Hide Clauses' : `View ${sections.length} Clauses`}</span>
                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleUseTemplate(tpl)}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#0057B8] hover:bg-[#004EA6] text-white shadow-xs transition cursor-pointer active:scale-95"
                    title="Clone this template into a new operational policy draft"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Clone to Draft</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}

export default TemplatesWorkspaceCenterPane;

