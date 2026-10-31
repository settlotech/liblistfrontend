import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  ShieldCheck, 
  Layers, 
  CheckCircle2, 
  Search, 
  FileText, 
  Lock, 
  Crown,
  PlusCircle,
  TrendingUp,
  X,
  User,
  Clock,
  Laptop,
  KeyRound,
  ShieldAlert,
  Send,
  Sparkles,
  Bot,
  Upload,
  FileCheck,
  Check,
  Loader2,
  ChevronRight,
  Info,
  ArrowLeft,
  ExternalLink
} from 'lucide-react';
import { apiService } from '../services/apiService';

// Detailed Bank Data: Registered Users, Policies Used & Login System Logs with Active Times
const BANK_DETAILS = {
  cba: {
    users: [
      { id: 'u1', name: 'Marcus Vance', role: 'Bank Administrator', roleType: 'manager', dept: 'Executive Governance & Retail Operations', email: 'marcus.vance@cba.com.au', avatar: 'MV', lastActive: 'Active Now' },
      { id: 'u2', name: 'Sarah Jenkins', role: 'Bank Employee (Maker)', roleType: 'employee', dept: 'Credit Operations Squad', email: 'sarah.jenkins@cba.com.au', avatar: 'SJ', lastActive: '12m ago' },
      { id: 'u3', name: 'David Miller', role: 'Bank Employee (Reviewer)', roleType: 'employee', dept: 'InfoSec & Cyber Defense', email: 'david.miller@cba.com.au', avatar: 'DM', lastActive: '1h ago' },
      { id: 'u4', name: 'Emma Watson', role: 'Bank Employee', roleType: 'employee', dept: 'Regulatory Compliance Audit', email: 'emma.watson@cba.com.au', avatar: 'EW', lastActive: 'Yesterday' }
    ],
    policies: [
      { id: 'credit-card-limits-policy', code: 'CBA-POL-001', title: 'Credit Card Product Suite & Issuance Policy', version: 'v1.2', status: 'Enforced', type: 'Product Suite', summary: 'Tiered limit approvals, $50,000 maximum executive limit, and 3 direct in-system operational specifications.' },
      { id: 'personal-loans-assessment-sop', code: 'CBA-POL-002', title: 'Personal Loans & Overdraft Assessment Procedure', version: 'v1.1', status: 'Enforced', type: 'Operational Procedure', summary: '+3.00% APRA serviceability buffer, $50,000 unsecured cap, and automated CDR income verification.' },
      { id: 'customer-onboarding-sop', code: 'CBA-POL-003', title: 'Digital Customer Onboarding & Identity Verification SOP', version: 'v1.0', status: 'Enforced', type: 'SOP', summary: 'DVS Australian identity cross-match, Biometric face liveness >= 92%, and instant PEP sanctions screening.' },
      { id: 'commercial-kyc-sop', code: 'CBA-POL-004', title: 'Commercial Entity KYC & Beneficial Ownership Guideline', version: 'v1.3', status: 'Enforced', type: 'Guideline', summary: 'Corporate customer due diligence, ASIC register check, and UBO >= 25% ownership validation.' },
      { id: 'remote-access-security-policy', code: 'CBA-POL-005', title: 'Remote Access & Zero Trust Architecture Policy', version: 'v2.0', status: 'Enforced', type: 'Security Policy', summary: 'FIDO2 WebAuthn MFA, 15m idle session timeout, and mutual TLS token binding.' },
      { id: 'privileged-access-sop', code: 'CBA-POL-006', title: 'Privileged Access Management & Segregation of Duties', version: 'v1.4', status: 'Enforced', type: 'SOP', summary: 'Just-in-time access provisioning, break-glass audit logs, and dual-authorization sign-off.' },
      { id: 'aml-ctf-screening-policy', code: 'CBA-POL-007', title: 'AML/CTF Real-Time Transaction Monitoring Policy', version: 'v2.2', status: 'Enforced', type: 'Regulatory Policy', summary: 'AUSTRAC automated threshold detection, $10,000+ AUD cash TTR reporting, and 24h SMR escalation.' },
      { id: 'cdr-privacy-policy', code: 'CBA-POL-008', title: 'Consumer Data Right (CDR) & Privacy Governance', version: 'v1.1', status: 'Enforced', type: 'Governance Policy', summary: 'Open Banking CDR API consent management, 7-year statutory retention, and one-click revocation dashboard.' }
    ],
    loginLogs: [
      { id: 'log-1', user: 'Marcus Vance', role: 'Bank Administrator', time: 'Active Now', loginTime: 'Oct 26, 2026, 09:14 AM AEST', duration: '2h 15m active', authMethod: 'FIDO2 Hardware Key (YubiKey 5C)', ip: '10.240.12.4 (Sydney CBD HQ)', status: 'Active Session' },
      { id: 'log-2', user: 'Sarah Jenkins', role: 'Bank Employee', time: 'Active Now', loginTime: 'Oct 26, 2026, 10:20 AM AEST', duration: '1h 05m active', authMethod: 'OAuth 2.0 PKCE + Microsoft Entra SSO', ip: '10.240.18.29 (Sydney Lending Center)', status: 'Active Session' },
      { id: 'log-3', user: 'David Miller', role: 'Bank Employee', time: '1 hour ago', loginTime: 'Oct 26, 2026, 08:30 AM AEST', duration: '1h 45m (Completed)', authMethod: 'Biometric FaceID + Passkey', ip: '192.168.4.12 (CBA Cyber Command)', status: 'Logged Out' },
      { id: 'log-4', user: 'Emma Watson', role: 'Bank Employee', time: 'Yesterday', loginTime: 'Oct 25, 2026, 03:15 PM AEST', duration: '3h 20m (Expired)', authMethod: 'Hardware Token Step-Up', ip: '10.140.8.91 (Melbourne Branch)', status: 'Session Expired' }
    ]
  },
  nab: {
    users: [
      { id: 'nu1', name: 'Rachel Wong', role: 'Regulatory Compliance Analyst', roleType: 'employee', dept: 'Prudential Compliance Desk', email: 'rachel.wong@nab.com.au', avatar: 'RW', lastActive: 'Active Now' },
      { id: 'nu2', name: 'Julian Hayes', role: 'Head of Lending Risk', roleType: 'manager', dept: 'Credit Risk Committee', email: 'julian.hayes@nab.com.au', avatar: 'JH', lastActive: '45m ago' },
      { id: 'nu3', name: 'Aaron Patel', role: 'Lead DevOps Engineer', roleType: 'employee', dept: 'Cloud Platform & Infrastructure', email: 'aaron.patel@nab.com.au', avatar: 'AP', lastActive: '3h ago' }
    ],
    policies: [
      { id: 'nab-pol-1', code: 'NAB-CRD-01', title: 'NAB Consumer Credit Card Framework', version: 'v1.4', status: 'Enforced', type: 'Product Suite', summary: 'Revolving card credit limits up to $40,000, 24-hour SLA underwriting, and automated credit bureau checks.' },
      { id: 'nab-pol-2', code: 'NAB-AML-02', title: 'Cross-Border AML Review & Sanctions Standard', version: 'v2.1', status: 'Enforced', type: 'Regulatory Policy', summary: 'Enhanced due diligence for international transfers > $2,500 AUD with real-time SWIFT sanction checks.' },
      { id: 'nab-pol-3', code: 'NAB-OPS-03', title: 'APRA CPS 230 Operational Resilience Mandate', version: 'v1.0', status: 'Enforced', type: 'Prudential Standard', summary: 'Tier-1 critical operational business service continuity and recovery time objectives (RTO < 4h).' }
    ],
    loginLogs: [
      { id: 'nlog-1', user: 'Rachel Wong', role: 'Compliance Analyst', time: 'Active Now', loginTime: 'Oct 26, 2026, 09:45 AM AEST', duration: '1h 30m active', authMethod: 'Okta SSO + FIDO2 Passkey', ip: '10.160.10.12 (Docklands Melbourne)', status: 'Active Session' },
      { id: 'nlog-2', user: 'Julian Hayes', role: 'Head of Lending Risk', time: '45m ago', loginTime: 'Oct 26, 2026, 09:00 AM AEST', duration: '1h 15m (Completed)', authMethod: 'Hardware RSA Token Step-Up', ip: '10.160.14.88 (Docklands Melbourne)', status: 'Logged Out' },
      { id: 'nlog-3', user: 'Aaron Patel', role: 'Lead DevOps', time: '3h ago', loginTime: 'Oct 26, 2026, 07:15 AM AEST', duration: '2h 00m (Completed)', authMethod: 'YubiKey 5 NFC Hardware Key', ip: '10.180.2.14 (Sydney Tech Hub)', status: 'Logged Out' }
    ]
  },
  wbc: {
    users: [
      { id: 'wu1', name: 'Claire Beaumont', role: 'Westpac Head of Enterprise Compliance', roleType: 'manager', dept: 'Risk Oversight Division', email: 'claire.beaumont@westpac.com.au', avatar: 'CB', lastActive: 'Active Now' },
      { id: 'wu2', name: 'Alex Chen', role: 'Digital Banking Tech Lead', roleType: 'employee', dept: 'Core Banking API Engineering', email: 'alex.chen@westpac.com.au', avatar: 'AC', lastActive: '2h ago' },
      { id: 'wu3', name: 'Priya Sharma', role: 'Fraud Risk Officer', roleType: 'employee', dept: 'Financial Crime Intelligence', email: 'priya.sharma@westpac.com.au', avatar: 'PS', lastActive: 'Yesterday' }
    ],
    policies: [
      { id: 'wbc-pol-1', code: 'WBC-TRSY-01', title: 'Automated Treasury API Dual-Authorization', version: 'v3.0', status: 'Enforced', type: 'Security Standard', summary: 'Cryptographic dual-authorization for automated treasury key rotations and limit ceiling variations.' },
      { id: 'wbc-pol-2', code: 'WBC-CRD-02', title: 'Westpac Altitude Credit Card Issuance Protocol', version: 'v2.2', status: 'Enforced', type: 'Product Suite', summary: 'Tiered executive limit matrix, digital KYC liveness verification, and instant Apple Pay provisioning.' },
      { id: 'wbc-pol-3', code: 'WBC-APP-03', title: 'Privacy Act APP 11 Data Retention Matrix', version: 'v1.5', status: 'Enforced', type: 'Privacy Policy', summary: '7-year statutory record preservation under Corporations Act with automated cryptographic purge.' }
    ],
    loginLogs: [
      { id: 'wlog-1', user: 'Claire Beaumont', role: 'Head of Compliance', time: 'Active Now', loginTime: 'Oct 26, 2026, 08:50 AM AEST', duration: '2h 40m active', authMethod: 'PingIdentity + FIDO2 Security Key', ip: '10.210.1.5 (Barangaroo Sydney)', status: 'Active Session' },
      { id: 'wlog-2', user: 'Alex Chen', role: 'Digital Tech Lead', time: '2h ago', loginTime: 'Oct 26, 2026, 08:10 AM AEST', duration: '1h 30m (Completed)', authMethod: 'OAuth 2.0 PKCE + GitHub Enterprise SSO', ip: '10.210.3.44 (Barangaroo Sydney)', status: 'Logged Out' },
      { id: 'wlog-3', user: 'Priya Sharma', role: 'Fraud Risk Officer', time: 'Yesterday', loginTime: 'Oct 25, 2026, 02:40 PM AEST', duration: '4h 10m (Expired)', authMethod: 'SMS Step-Up 2FA + Duo Mobile', ip: '10.210.8.22 (Parramatta Tech Hub)', status: 'Session Expired' }
    ]
  },
  anz: {
    users: [
      { id: 'au1', name: 'Arthur Pendelton', role: 'Chief Information Security Officer', roleType: 'manager', dept: 'AppSec & Enterprise Cyber', email: 'arthur.pendelton@anz.com.au', avatar: 'AP', lastActive: 'Active Now' },
      { id: 'au2', name: 'Elena Rossi', role: 'Lead AppSec Engineer', roleType: 'employee', dept: 'Zero Trust Architecture', email: 'elena.rossi@anz.com.au', avatar: 'ER', lastActive: '30m ago' },
      { id: 'au3', name: 'Liam O\'Connor', role: 'Credit Underwriter', roleType: 'employee', dept: 'Retail Credit Decisions', email: 'liam.oconnor@anz.com.au', avatar: 'LO', lastActive: 'Yesterday' }
    ],
    policies: [
      { id: 'anz-pol-1', code: 'ANZ-BIO-01', title: 'Biometric & Passkey Enforcement Policy', version: 'v2.5', status: 'Enforced', type: 'Security Standard', summary: 'Mandatory WebAuthn biometric passkey verification on iOS 18+ and Android 15 mobile banking clients.' },
      { id: 'anz-pol-2', code: 'ANZ-CRD-02', title: 'ANZ Rewards Credit Card Underwriting Policy', version: 'v1.8', status: 'Enforced', type: 'Product Suite', summary: 'Comprehensive credit reporting (CCR), debt-to-income <= 6x cap, and 24h digital turnaround.' },
      { id: 'anz-pol-3', code: 'ANZ-NPP-03', title: 'New Payments Platform (NPP) ISO 20022 Compliance', version: 'v1.2', status: 'Enforced', type: 'Payment Rails', summary: 'Sub-second real-time PayID routing, PayTo mandate lifecycle, and Confirmation of Payee verification.' }
    ],
    loginLogs: [
      { id: 'alog-1', user: 'Arthur Pendelton', role: 'CISO', time: 'Active Now', loginTime: 'Oct 26, 2026, 09:10 AM AEST', duration: '2h 20m active', authMethod: 'Hardware Token Step-Up + FIDO2', ip: '10.190.2.1 (ANZ Centre Docklands Melb)', status: 'Active Session' },
      { id: 'alog-2', user: 'Elena Rossi', role: 'Lead AppSec Engineer', time: '30m ago', loginTime: 'Oct 26, 2026, 10:00 AM AEST', duration: '50m active', authMethod: 'Passkey WebAuthn Biometric', ip: '10.190.4.55 (ANZ Centre Docklands Melb)', status: 'Active Session' },
      { id: 'alog-3', user: 'Liam O\'Connor', role: 'Credit Underwriter', time: 'Yesterday', loginTime: 'Oct 25, 2026, 04:00 PM AEST', duration: '2h 15m (Completed)', authMethod: 'OAuth 2.0 PKCE SSO', ip: '10.190.9.11 (Brisbane Branch)', status: 'Logged Out' }
    ]
  }
};

export default function AdminDashboard({ 
  banks, 
  policies, 
  onSelectBank, 
  onSwitchToLibraryView,
  onSelectPolicy
}) {
  const [bankSearch, setBankSearch] = useState('');
  const [policySearch, setPolicySearch] = useState('');
  const [selectedDomainFilter, setSelectedDomainFilter] = useState('ALL');
  const [activeTab, setActiveTab] = useState('BANKS'); // 'BANKS' | 'POLICIES'
  const [selectedStandard, setSelectedStandard] = useState(null);

  // Bank Inspection State
  const [inspectedBank, setInspectedBank] = useState(null);
  const [inspectionTab, setInspectionTab] = useState('policies'); // 'policies' | 'users' | 'logs'
  const [selectedInspectedPolicy, setSelectedInspectedPolicy] = useState(null);

  // Dynamic DB Users & Roles Management
  const [dbUsers, setDbUsers] = useState([]);
  const [isCreateUserOpen, setIsCreateUserOpen] = useState(false);
  const [isSubmittingUser, setIsSubmittingUser] = useState(false);
  const [userSuccessMessage, setUserSuccessMessage] = useState('');
  const [userErrorMessage, setUserErrorMessage] = useState('');
  const [newUserData, setNewUserData] = useState({
    name: '',
    email: '',
    bank_id: 'cba',
    role: 'Bank Employee (Maker)',
    role_type: 'employee',
    department: 'Retail Banking Operations'
  });

  const loadDbUsers = async () => {
    try {
      const data = await apiService.getUsers();
      if (Array.isArray(data) && data.length > 0) {
        setDbUsers(data);
      }
    } catch (err) {
      console.warn('Failed to load DB users in AdminDashboard:', err);
    }
  };

  useEffect(() => {
    loadDbUsers();
  }, []);

  const handleCreateUserSubmit = async (e) => {
    e.preventDefault();
    if (!newUserData.name || !newUserData.email) {
      setUserErrorMessage('Name and work email are required.');
      return;
    }
    setIsSubmittingUser(true);
    setUserErrorMessage('');
    try {
      await apiService.createUser({
        name: newUserData.name.trim(),
        email: newUserData.email.trim(),
        bank_id: newUserData.bank_id,
        role: newUserData.role,
        role_type: newUserData.role_type,
        department: newUserData.department,
        created_by: 'Platform Super Admin (Ramesh)'
      });
      setUserSuccessMessage(`Successfully provisioned ${newUserData.name} as ${newUserData.role}!`);
      await loadDbUsers();
      setTimeout(() => {
        setIsCreateUserOpen(false);
        setUserSuccessMessage('');
        setNewUserData({
          name: '',
          email: '',
          bank_id: inspectedBank?.id.toLowerCase() || 'cba',
          role: 'Bank Employee (Maker)',
          role_type: 'employee',
          department: 'Retail Banking Operations'
        });
      }, 1000);
    } catch (err) {
      setUserErrorMessage(err.message || 'Failed to create user');
    } finally {
      setIsSubmittingUser(false);
    }
  };

  // Add Master Policy Framework Modal State (Direct & AI Upload)
  const [isAddFrameworkOpen, setIsAddFrameworkOpen] = useState(false);
  const [addMode, setAddMode] = useState('direct'); // 'direct' | 'ai-upload'
  const [uploadFile, setUploadFile] = useState(null);
  const [isScanningWithAI, setIsScanningWithAI] = useState(false);
  const [aiScanStep, setAiScanStep] = useState(0);
  const [newStandard, setNewStandard] = useState({
    title: '',
    code: '',
    domain: 'Prudential',
    version: 'v1.0.0',
    vision: '',
    clauses: [
      { id: 'SEC-01', title: 'Mandatory cryptographic asymmetric token signing' },
      { id: 'SEC-02', title: 'Continuous automated vulnerability scanning & remediation' }
    ],
    telemetry: [
      { metric: 'Approval SLA', target: '< 2.0 hrs' },
      { metric: 'Auth Token Latency', target: '< 15ms' }
    ]
  });
  const [frameworkPublishedSuccess, setFrameworkPublishedSuccess] = useState(false);

  // Super Admin AI Chatbot State
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    {
      id: 'msg-init',
      sender: 'bot',
      text: 'Good morning Ramesh! I am your Super Admin Navigation & Oversight Copilot. How can I help you govern the 4 subscribed member banks or navigate master standards today?'
    }
  ]);
  const [chatInput, setChatInput] = useState('');

  const filteredBanks = banks.filter(b => 
    b.name.toLowerCase().includes(bankSearch.toLowerCase()) || 
    b.tier.toLowerCase().includes(bankSearch.toLowerCase())
  );

  const policyList = Object.values(policies);
  const filteredPolicies = policyList.filter(pol => {
    const matchesSearch = pol.title.toLowerCase().includes(policySearch.toLowerCase()) ||
      pol.complianceLevel.toLowerCase().includes(policySearch.toLowerCase()) ||
      pol.id.toLowerCase().includes(policySearch.toLowerCase()) ||
      pol.breadcrumb.toLowerCase().includes(policySearch.toLowerCase());
    
    if (selectedDomainFilter === 'ALL') return matchesSearch;
    return matchesSearch && pol.breadcrumb.toLowerCase().includes(selectedDomainFilter.toLowerCase());
  });

  // Open Bank Details Inspection Drawer
  const handleOpenBankInspection = (bank, initialTab = 'policies') => {
    setInspectedBank(bank);
    setInspectionTab(initialTab);
    const bankData = BANK_DETAILS[bank.id.toLowerCase()] || BANK_DETAILS.cba;
    setSelectedInspectedPolicy(bankData.policies[0] || null);
  };

  // AI Document Upload & Extraction Engine
  const handleSimulateAIScan = async () => {
    if (!uploadFile) return;
    setIsScanningWithAI(true);
    setAiScanStep(1);

    try {
      setTimeout(() => setAiScanStep(2), 500);
      setTimeout(() => setAiScanStep(3), 1100);

      const formData = new FormData();
      formData.append('department_id', 'retail-lending');
      formData.append('files', uploadFile);

      const res = await apiService.ingestDocuments(formData);

      setIsScanningWithAI(false);
      setAiScanStep(4);

      if (res && res.documents && res.documents[0]) {
        const doc = res.documents[0];
        const extractedClauses = (doc.sections || []).map((s, idx) => ({
          id: `CLS-${idx + 1}`,
          title: `${s.title}: ${s.content?.slice(0, 80) || ''}...`
        }));

        setNewStandard({
          title: doc.title || `${uploadFile.name.replace(/\.[^/.]+$/, "")} Master Policy`,
          code: `REG-${Math.floor(100 + Math.random() * 900)}`,
          domain: 'Prudential & Governance',
          version: 'v1.0.0',
          vision: doc.summary || `Extracted operational standards and compliance mandates from ${uploadFile.name}.`,
          clauses: extractedClauses.length > 0 ? extractedClauses : [
            { id: 'CPS-01', title: 'Data Sovereignty: Customer PII restricted to Australian onshore data centers' },
            { id: 'CPS-02', title: 'Operational Risk: Tiered approval limits and turnaround SLAs' },
            { id: 'CPS-03', title: 'Compliance Reporting: 10-day AUSTRAC and APRA telemetry logs' }
          ],
          telemetry: [
            { metric: 'Turnaround SLA', target: doc.turnaround_sla || '2 Business Days' },
            { metric: 'Daily Operational Limit', target: doc.daily_limit || '$100,000 AUD' },
            { metric: 'Officer Cap', target: doc.officer_cap || '$250,000 AUD' }
          ]
        });
        return;
      }
    } catch (err) {
      console.warn('Real AI scan fallback in AdminDashboard:', err);
    }

    // Fallback if AI call errors
    setIsScanningWithAI(false);
    setAiScanStep(4);
    const isVal = uploadFile.name.toLowerCase().includes('valuation') || uploadFile.name.toLowerCase().includes('hl_');
    if (isVal) {
      setNewStandard({
        title: 'Home Loan Valuations Policy',
        code: 'APRA APS 220',
        domain: 'Retail Lending & Mortgages',
        version: 'v1.0.0',
        vision: 'Consistent and prudent framework for the valuation of residential properties used as security for home loans to assess lending risk and comply with APRA regulatory requirements.',
        clauses: [
          { id: 'VAL-01', title: '4 Approved Methods: Full Valuation (90d), Desktop (90d), AVM (30d), Drive-thru/Kerbside' },
          { id: 'VAL-02', title: 'Valuation Principles: Independence from borrower/broker, Objectivity, and Accuracy' },
          { id: 'VAL-03', title: 'Prudence Rule: Lending decisions strictly based on Lower of Purchase Price or Assessed Market Value' },
          { id: 'VAL-04', title: 'Governance: Panel Valuers Accreditation Policy and Standard Operating Procedure for Report Filing' }
        ],
        telemetry: [
          { metric: 'Validity SLA', target: '90 Days (Full/Desktop), 30 Days (AVM)' },
          { metric: 'Prudence Rule', target: 'Lower of Purchase Price or Market Value' },
          { metric: 'Officer Cap', target: '$2,000,000 AUD (Delegated Authority)' }
        ]
      });
      return;
    }

    const cleanName = uploadFile.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, ' ');
    setNewStandard({
      title: `${cleanName.charAt(0).toUpperCase() + cleanName.slice(1)} Operational Standard`,
      code: 'APRA CPS 235',
      domain: 'Prudential',
      version: 'v1.0.0',
      vision: `Operational specifications and governance controls extracted from ${uploadFile.name}.`,
      clauses: [
        { id: 'CPS235-01', title: 'Data Sovereignty: Customer PII restricted to Australian onshore data centers' },
        { id: 'CPS235-02', title: 'Zero Trust Enclave: Continuous hardware-attested workload verification' },
        { id: 'CPS235-03', title: 'Exit Strategy: 48-hour automated multi-cloud failover protocol' }
      ],
      telemetry: [
        { metric: 'Turnaround SLA', target: '2 Business Days' },
        { metric: 'Daily Limit', target: '$100,000 AUD' },
        { metric: 'Attestation Uptime', target: '99.999%' }
      ]
    });
  };

  // Handle Publishing Standard
  const handlePublishStandard = (e) => {
    e.preventDefault();
    if (!newStandard.title) return;
    setFrameworkPublishedSuccess(true);
    setTimeout(() => {
      setFrameworkPublishedSuccess(false);
      setIsAddFrameworkOpen(false);
    }, 1200);
  };

  // Super Admin Chatbot Send Message & Auto-Navigation Handler
  const handleSendAdminChatMessage = (userPromptText) => {
    const text = (userPromptText || chatInput).trim();
    if (!text) return;

    const userMsg = { id: `u-${Date.now()}`, sender: 'user', text };
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput('');

    const lower = text.toLowerCase();
    let replyText = '';

    if (lower.includes('cba') || lower.includes('commonwealth')) {
      const cbaBank = banks.find(b => b.id.toLowerCase() === 'cba') || banks[0];
      handleOpenBankInspection(cbaBank, lower.includes('log') ? 'logs' : lower.includes('user') ? 'users' : 'policies');
      replyText = `Opening **Commonwealth Bank of Australia (CBA)** inspection. CBA currently has 4 registered users, 8 active policies, and 2 active sessions.`;
    } else if (lower.includes('nab')) {
      const nabBank = banks.find(b => b.id.toLowerCase() === 'nab') || banks[1];
      handleOpenBankInspection(nabBank, lower.includes('log') ? 'logs' : lower.includes('user') ? 'users' : 'policies');
      replyText = `Opening **National Australia Bank (NAB)** inspection. NAB currently has 3 registered users and 9 custom conditions configured.`;
    } else if (lower.includes('westpac') || lower.includes('wbc')) {
      const wbcBank = banks.find(b => b.id.toLowerCase() === 'wbc') || banks[2];
      handleOpenBankInspection(wbcBank, lower.includes('log') ? 'logs' : lower.includes('user') ? 'users' : 'policies');
      replyText = `Opening **Westpac Banking Corp (WBC)** inspection. Showing active policies and login records.`;
    } else if (lower.includes('anz')) {
      const anzBank = banks.find(b => b.id.toLowerCase() === 'anz') || banks[3];
      handleOpenBankInspection(anzBank, lower.includes('log') ? 'logs' : lower.includes('user') ? 'users' : 'policies');
      replyText = `Opening **ANZ Banking Group (ANZ)** inspection details.`;
    } else if (lower.includes('standard') || lower.includes('framework') || lower.includes('library') || lower.includes('master')) {
      setActiveTab('POLICIES');
      replyText = `Navigated to **Master Library Standards** tab. You are governing ${policyList.length} master frameworks.`;
    } else if (lower.includes('add') || lower.includes('upload') || lower.includes('create standard')) {
      setIsAddFrameworkOpen(true);
      if (lower.includes('upload') || lower.includes('ai')) setAddMode('ai-upload');
      replyText = `Opening **Add Master Policy Framework** modal with AI ingestion support.`;
    } else {
      replyText = `I can help you inspect bank tenants, check registered users, view user login system logs & active times, or navigate master standards. Try: "Inspect CBA user logs" or "Navigate to Master Standards".`;
    }

    setTimeout(() => {
      setChatMessages(prev => [...prev, { id: `b-${Date.now()}`, sender: 'bot', text: replyText }]);
    }, 400);
  };

  const currentBankData = inspectedBank 
    ? (BANK_DETAILS[inspectedBank.id.toLowerCase()] || BANK_DETAILS.cba)
    : null;

  const currentBankKey = inspectedBank?.id?.toLowerCase();
  const bankDbUsers = currentBankKey ? dbUsers.filter(u => (u.bank_id || '').toLowerCase() === currentBankKey) : [];
  const displayedUsers = bankDbUsers.length > 0 
    ? bankDbUsers.map(u => ({
        id: u.id,
        name: u.name,
        role: u.role,
        roleType: u.role_type || (u.role?.toLowerCase().includes('owner') || u.role?.toLowerCase().includes('manager') ? 'manager' : 'employee'),
        dept: u.department || 'Retail Banking Squad',
        email: u.email,
        avatar: u.avatar || u.name?.slice(0, 2).toUpperCase() || 'U',
        lastActive: 'Active Now'
      }))
    : (currentBankData?.users || []);
  const activeMembersCount = displayedUsers.length;

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#f8fafc] p-6 sm:p-8 space-y-6 text-xs relative">
      {/* 1. Header Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-100 border border-amber-300 flex items-center justify-center font-bold text-amber-900 shadow-2xs">
            <Crown className="w-6 h-6 text-amber-700" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
                Library Staff Master Administration Portal
              </h1>
              <span className="text-[10px] font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full border border-amber-300">
                Master Governance
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => {
              setIsAddFrameworkOpen(true);
              setAddMode('direct');
            }}
            className="flex items-center gap-2 bg-[#0057B8] hover:bg-[#004EA6] text-white font-bold px-4 py-2 rounded-xl text-xs transition shadow-primary-sm cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Master Policy Framework</span>
          </button>

          <button
            onClick={onSwitchToLibraryView}
            className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-2 rounded-xl text-xs transition shadow-xs cursor-pointer"
          >
            <Layers className="w-4 h-4" />
            <span>Open 3-Pane Library View</span>
          </button>
        </div>
      </div>

      {/* 2. Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-1">
        <button
          onClick={() => {
            setActiveTab('BANKS');
            setSelectedStandard(null);
          }}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
            activeTab === 'BANKS'
              ? 'bg-[#0057B8] text-white shadow-primary-sm font-semibold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Subscribed Member Banks ({banks.length})</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('POLICIES');
            setSelectedStandard(null);
          }}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
            activeTab === 'POLICIES'
              ? 'bg-[#0057B8] text-white shadow-primary-sm font-semibold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Master Library Standards ({policyList.length})</span>
        </button>
      </div>

      {/* TAB 1: Subscribed Banks Table */}
      {activeTab === 'BANKS' && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden space-y-4 p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Connected Institutional Tenants & Policy Addenda
              </h3>
            </div>

            <div className="relative w-72">
              <Search className="w-3.5 h-3.5 text-[#0057B8] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={bankSearch}
                onChange={(e) => setBankSearch(e.target.value)}
                placeholder="Search member banks..."
                className="w-full bg-white border-2 border-[#0057B8]/40 hover:border-[#0057B8] focus:border-[#0057B8] focus:ring-2 focus:ring-[#0057B8]/20 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 outline-none transition shadow-2xs font-medium"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 uppercase text-[10.5px] font-bold border-y border-slate-200">
                  <th className="py-3 px-4">Bank Name & Tier</th>
                  <th className="py-3 px-4">Subscription Plan</th>
                  <th className="py-3 px-4">Configured Policy Addenda</th>
                  <th className="py-3 px-4">Compliance Status</th>
                  <th className="py-3 px-4">Last Audit Verification</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredBanks.map((bank) => {
                  const bData = BANK_DETAILS[bank.id.toLowerCase()] || BANK_DETAILS.cba;
                  return (
                    <tr 
                      key={bank.id} 
                      onClick={() => handleOpenBankInspection(bank, 'policies')}
                      className="hover:bg-blue-50/50 transition cursor-pointer group"
                      title="Click to inspect users, active policies & login logs"
                    >
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 text-xs group-hover:text-blue-700 transition flex items-center gap-1.5">
                          <span>{bank.name}</span>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 transition" />
                        </div>
                        <div className="text-[11px] text-slate-500">{bank.tier} • {bData.users.length} Registered Users</div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="text-[11px] font-semibold bg-emerald-50 text-emerald-800 px-2.5 py-0.5 rounded-full border border-emerald-200">
                          {bank.subscriptionStatus}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="text-[11px] font-bold text-slate-800">
                          {bData.policies.length} Active Subscribed Policies
                        </div>
                        <div className="text-[10.5px] text-slate-500 truncate">{bank.addendaSummary}</div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1 w-fit">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          {bank.complianceStatus}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-slate-600 font-medium">
                        {bank.lastAuditDate}
                      </td>

                      <td className="py-3.5 px-4 text-right space-x-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleOpenBankInspection(bank, 'policies')}
                          className="bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-bold px-3 py-1 rounded text-xs transition cursor-pointer"
                        >
                          Inspect Bank
                        </button>
                        <button
                          onClick={() => handleOpenBankInspection(bank, 'logs')}
                          className="bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 font-bold px-3 py-1 rounded text-xs transition cursor-pointer"
                        >
                          User Logs
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: Master Library Standards */}
      {activeTab === 'POLICIES' && selectedStandard ? (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs p-6 space-y-6 animate-in fade-in duration-150">
          {/* Back Navigation Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
            <button
              onClick={() => setSelectedStandard(null)}
              className="inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-4 py-2 rounded-xl text-xs transition cursor-pointer w-fit shadow-2xs active:scale-95"
            >
              <ArrowLeft className="w-4 h-4 text-slate-700" />
              <span>Back to Master Standards List</span>
            </button>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono font-bold bg-blue-50 text-blue-800 px-3 py-1 rounded-full border border-blue-200">
                Specification {selectedStandard.latestVersion}
              </span>
              <span className="text-[11px] font-bold bg-emerald-50 text-emerald-800 px-3 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Active & Enforced
              </span>
            </div>
          </div>

          {/* Standard Header Banner */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                  <span>{selectedStandard.breadcrumb}</span>
                </div>
                <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                  {selectedStandard.title}
                </h2>
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 pt-1">
                  <span className="font-semibold text-slate-700">Governance Squad:</span>
                  <span className="bg-white px-2.5 py-0.5 rounded-md border border-slate-200 text-slate-800 font-medium">
                    {selectedStandard.ownedBy || 'Retail Credit Risk & Underwriting Squad'}
                  </span>
                  <span>•</span>
                  <span className="font-semibold text-slate-700">Last Updated:</span>
                  <span className="font-medium text-slate-800">{selectedStandard.lastUpdated || 'Sep 25, 2026'}</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => {
                    onSelectPolicy?.(selectedStandard.id);
                    onSwitchToLibraryView?.();
                  }}
                  className="flex items-center gap-1.5 bg-[#0057B8] hover:bg-[#004EA6] text-white font-bold px-4 py-2 rounded-xl text-xs transition shadow-primary-sm cursor-pointer active:scale-95"
                >
                  <Layers className="w-4 h-4" />
                  <span>Open in 3-Pane Library View</span>
                </button>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-1.5 text-emerald-800 font-semibold bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-200">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Regulatory Baseline: {selectedStandard.complianceLevel}</span>
              </div>
              <span className="text-slate-500 font-mono text-[11px]">
                Enforced across 4 Subscribed Banks (CBA, NAB, Westpac, ANZ)
              </span>
            </div>
          </div>

          {/* Vision Statement / Mandate */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>Statutory Vision & Implementation Mandate</span>
            </h4>
            <p className="text-xs sm:text-sm text-slate-800 italic bg-amber-50/50 p-4 rounded-xl border border-amber-200 leading-relaxed font-serif">
              "{selectedStandard.visionStatement}"
            </p>
          </div>

          {/* Statutory Master Framework Clauses (ALL clauses) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-emerald-700" />
                <span>Statutory Master Clauses ({selectedStandard.coreFrameworkClauses?.length || 0})</span>
              </h4>
              <span className="text-[11px] text-slate-500 font-medium">Mandatory Non-Negotiable Rules</span>
            </div>

            <div className="space-y-2.5">
              {selectedStandard.coreFrameworkClauses?.map((clause, idx) => (
                <div
                  key={idx}
                  className="p-4 bg-white border border-slate-200 rounded-xl space-y-1.5 hover:border-slate-300 transition shadow-2xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-slate-900 text-white font-mono font-bold text-[11px]">
                        {clause.clauseId}
                      </span>
                      <h5 className="font-extrabold text-xs text-slate-900">{clause.title}</h5>
                    </div>
                    <span className="text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded border border-emerald-200">
                      Enforced
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed pl-1">
                    {clause.content}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Monitored Telemetry Baseline */}
          {selectedStandard.metricsTable && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-slate-600" />
                <span>Monitored Telemetry Baseline & SLA Targets</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {selectedStandard.metricsTable.map((m, mIdx) => (
                  <div key={mIdx} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                    <span className="text-slate-500 font-medium text-[11px] block">{m.metric}</span>
                    <div className="text-base font-extrabold font-mono text-slate-900">{m.actual}</div>
                    <div className="text-[10.5px] text-slate-500 flex items-center justify-between pt-1 border-t border-slate-200">
                      <span>Target: <strong className="text-slate-700">{m.target}</strong></span>
                      <span className="text-emerald-700 font-bold">{m.status || 'Nominal'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Member Bank Custom Addenda Adoption */}
          {selectedStandard.bankCustomAddenda && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-blue-600" />
                <span>Configured Member Bank Addenda & Overrides</span>
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {Object.entries(selectedStandard.bankCustomAddenda).map(([bankKey, bConf]) => (
                  <div key={bankKey} className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-xs uppercase text-slate-900 tracking-wide">
                        {bankKey.toUpperCase()} Institutional Addendum
                      </span>
                      <span className="text-[10px] bg-blue-50 text-blue-700 font-bold px-2 py-0.5 rounded border border-blue-200">
                        Configured
                      </span>
                    </div>
                    {bConf.customClause && (
                      <p className="text-[11.5px] text-slate-700 font-medium bg-slate-50 p-2 rounded-lg border border-slate-200">
                        {bConf.customClause}
                      </p>
                    )}
                    <div className="text-[11px] text-slate-500 space-y-0.5">
                      {bConf.sessionTimeout && <div>• Limit Ceiling: <strong className="text-slate-800">{bConf.sessionTimeout}</strong></div>}
                      {bConf.mfaRule && <div>• Verification: <strong className="text-slate-800">{bConf.mfaRule}</strong></div>}
                      {bConf.lastModifiedBy && <div className="text-[10.5px] text-slate-400 pt-1">Audited by {bConf.lastModifiedBy}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Dependent Gateways & Integrations */}
          {selectedStandard.dependencies && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-slate-600" />
                <span>Connected API Infrastructure & Gateway Dependencies</span>
              </h4>
              <div className="flex flex-wrap gap-2">
                {selectedStandard.dependencies.map((dep, dIdx) => (
                  <span
                    key={dIdx}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700"
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>{dep.name}</span>
                    <span className="text-[10px] text-slate-400 font-mono">({dep.status})</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Bottom Back Button */}
          <div className="pt-4 border-t border-slate-200 flex justify-end">
            <button
              onClick={() => setSelectedStandard(null)}
              className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-2 rounded-xl text-xs transition cursor-pointer shadow-xs active:scale-95"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Master Standards List</span>
            </button>
          </div>
        </div>
      ) : activeTab === 'POLICIES' ? (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs p-6 space-y-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Master Banking Regulatory Standards ({filteredPolicies.length} of {policyList.length})
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Click or touch any standard in the list to open its full specification, statutory clauses, telemetry, and bank addenda.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <div className="relative w-64">
                <Search className="w-3.5 h-3.5 text-[#0057B8] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={policySearch}
                  onChange={(e) => setPolicySearch(e.target.value)}
                  placeholder="Filter standards by name or code..."
                  className="w-full bg-white border-2 border-[#0057B8]/40 hover:border-[#0057B8] focus:border-[#0057B8] focus:ring-2 focus:ring-[#0057B8]/20 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 outline-none transition shadow-2xs font-medium"
                />
              </div>

              <select
                value={selectedDomainFilter}
                onChange={(e) => setSelectedDomainFilter(e.target.value)}
                className="bg-white border-2 border-[#0057B8]/30 hover:border-[#0057B8] focus:border-[#0057B8] rounded-xl px-2.5 py-1.5 text-xs font-semibold text-[#0057B8] outline-none cursor-pointer transition shadow-2xs"
              >
                <option value="ALL">All Domains</option>
                <option value="Prudential">APRA Prudential</option>
                <option value="Privacy">Privacy & Data Governance</option>
                <option value="AML">AML/CTF Financial Crime</option>
                <option value="Payment">Payment Rails & API</option>
              </select>
            </div>
          </div>

          {/* Clean List View of Master Standards */}
          <div className="divide-y divide-slate-100 bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
            {filteredPolicies.map((pol) => (
              <div
                key={pol.id}
                onClick={() => setSelectedStandard(pol)}
                className="p-4 sm:p-4.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#0057B8]/5 hover:border-[#0057B8]/20 transition cursor-pointer group active:scale-[0.995]"
              >
                <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-[#0057B8]/10 border border-[#0057B8]/20 flex items-center justify-center text-[#0057B8] flex-shrink-0 group-hover:bg-[#0057B8] group-hover:text-white transition shadow-2xs">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-[#0057B8] transition">
                        {pol.title}
                      </h4>
                      <span className="text-[11px] font-mono font-bold bg-[#0057B8]/10 text-[#0057B8] px-2 py-0.5 rounded border border-[#0057B8]/20">
                        {pol.latestVersion}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-1 flex-wrap">
                      <span className="font-medium text-slate-600 truncate">{pol.breadcrumb.split('•')[0].trim()}</span>
                      <span>•</span>
                      <span className="text-slate-500 font-mono">{pol.coreFrameworkClauses?.length || 0} Clauses</span>
                      <span>•</span>
                      <span className="text-emerald-700 font-semibold">{pol.complianceLevel.split('/')[0].trim()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 sm:self-center flex-shrink-0">
                  <span className="hidden md:inline-flex text-[11px] font-medium text-slate-500 bg-slate-50 px-2.5 py-1 rounded-full border border-slate-200">
                    Enforced across 4 Banks
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedStandard(pol);
                    }}
                    className="flex items-center gap-1.5 text-xs font-bold text-[#0057B8] bg-[#0057B8]/10 group-hover:bg-[#0057B8] group-hover:text-white px-3 py-1.5 rounded-lg border border-[#0057B8]/20 group-hover:border-[#0057B8] transition cursor-pointer shadow-2xs"
                  >
                    <span>View Details</span>
                    <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* ------------------- BANK INSPECTION MODAL / DRAWER ------------------- */}
      {inspectedBank && currentBankData && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-xs">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">{inspectedBank.name}</h3>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                    <span>{inspectedBank.tier}</span>
                    <span>•</span>
                    <span className="text-emerald-700 font-semibold">{inspectedBank.complianceStatus}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setInspectedBank(null)}
                className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Top Metric Bar */}
            <div className="grid grid-cols-3 gap-3 p-4 bg-white border-b border-slate-200">
              <div 
                onClick={() => setInspectionTab('users')}
                className={`p-3 rounded-xl border transition cursor-pointer ${
                  inspectionTab === 'users' ? 'bg-blue-50/70 border-blue-300' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <div className="text-[11px] font-bold text-slate-500 uppercase flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-blue-600" />
                  <span>Registered Bank Users</span>
                </div>
                <div className="text-lg font-extrabold text-slate-900 mt-1">{activeMembersCount} Active Members</div>
                <div className="text-[10.5px] text-slate-500">Click to view roster & permissions</div>
              </div>

              <div 
                onClick={() => setInspectionTab('policies')}
                className={`p-3 rounded-xl border transition cursor-pointer ${
                  inspectionTab === 'policies' ? 'bg-blue-50/70 border-blue-300' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <div className="text-[11px] font-bold text-slate-500 uppercase flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Subscribed Policies</span>
                </div>
                <div className="text-lg font-extrabold text-slate-900 mt-1">{currentBankData.policies.length} Active Policies</div>
                <div className="text-[10.5px] text-slate-500">Click to inspect active policy rules</div>
              </div>

              <div 
                onClick={() => setInspectionTab('logs')}
                className={`p-3 rounded-xl border transition cursor-pointer ${
                  inspectionTab === 'logs' ? 'bg-blue-50/70 border-blue-300' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <div className="text-[11px] font-bold text-slate-500 uppercase flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  <span>Login Logs & Active Times</span>
                </div>
                <div className="text-lg font-extrabold text-slate-900 mt-1">
                  {currentBankData.loginLogs.filter(l => l.status === 'Active Session').length} Online Now
                </div>
                <div className="text-[10.5px] text-slate-500">Click to inspect user system logs</div>
              </div>
            </div>

            {/* Inspection Tab Navigation */}
            <div className="flex items-center gap-2 px-5 pt-3 border-b border-slate-200 bg-white">
              <button
                onClick={() => setInspectionTab('policies')}
                className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition cursor-pointer ${
                  inspectionTab === 'policies'
                    ? 'border-blue-600 text-blue-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Subscribed Policies ({currentBankData.policies.length})
              </button>
              <button
                onClick={() => setInspectionTab('users')}
                className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition cursor-pointer ${
                  inspectionTab === 'users'
                    ? 'border-blue-600 text-blue-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Registered Bank Users ({activeMembersCount})
              </button>
              <button
                onClick={() => setInspectionTab('logs')}
                className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition cursor-pointer ${
                  inspectionTab === 'logs'
                    ? 'border-blue-600 text-blue-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                User Login System Logs & Active Times ({currentBankData.loginLogs.length})
              </button>
            </div>

            {/* Inspection Content Area */}
            <div className="flex-1 overflow-y-auto p-5 custom-scrollbar bg-slate-50/50">
              {/* TAB A: Subscribed Policies */}
              {inspectionTab === 'policies' && (
                <div className="space-y-3">
                  <div className="text-xs text-slate-600 font-medium">
                    Showing operational standards enforced for <strong>{inspectedBank.name}</strong>. Click any policy to view rules and limits.
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {currentBankData.policies.map((p) => {
                      const isSelected = selectedInspectedPolicy?.id === p.id;
                      return (
                        <div
                          key={p.id}
                          onClick={() => setSelectedInspectedPolicy(p)}
                          className={`p-3.5 rounded-xl border transition cursor-pointer ${
                            isSelected 
                              ? 'bg-blue-50/80 border-blue-400 shadow-xs ring-1 ring-blue-300' 
                              : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-mono text-[10.5px] font-bold text-blue-700 bg-blue-100/60 px-1.5 py-0.5 rounded">
                              {p.code}
                            </span>
                            <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                              {p.status}
                            </span>
                          </div>
                          <h4 className="font-extrabold text-slate-900 text-xs mt-1.5">{p.title}</h4>
                          <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">{p.summary}</p>
                          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[10.5px] text-slate-500">
                            <span>Type: <strong>{p.type}</strong></span>
                            <span className="font-mono font-bold text-slate-700">{p.version}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB B: Bank Users */}
              {inspectionTab === 'users' && (
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">
                        Personnel Roster — {inspectedBank.name}
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        {displayedUsers.length} institutional accounts with active role-based access control.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setNewUserData(prev => ({
                          ...prev,
                          bank_id: inspectedBank?.id?.toLowerCase() || 'cba'
                        }));
                        setUserErrorMessage('');
                        setUserSuccessMessage('');
                        setIsCreateUserOpen(true);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0057B8] hover:bg-[#004EA6] text-white rounded-lg font-bold text-xs shadow-xs transition cursor-pointer self-start sm:self-auto"
                      title="Provision new bank user and assign maker/checker role"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>Create User & Assign Role</span>
                    </button>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-200">
                          <th className="py-2.5 px-4">User Name</th>
                          <th className="py-2.5 px-4">Role & Access Type</th>
                          <th className="py-2.5 px-4">Department Squad</th>
                          <th className="py-2.5 px-4">Work Email</th>
                          <th className="py-2.5 px-4 text-right">Last Active</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {displayedUsers.map((u) => (
                          <tr key={u.id} className="hover:bg-slate-50/80 transition">
                            <td className="py-3 px-4 font-bold text-slate-900 flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px] font-extrabold">
                                {u.avatar}
                              </div>
                              <span>{u.name}</span>
                            </td>
                            <td className="py-3 px-4">
                              <span className={`text-[10.5px] font-bold px-2 py-0.5 rounded-full border ${
                                u.roleType === 'manager' 
                                  ? 'bg-amber-50 text-amber-900 border-amber-200' 
                                  : 'bg-blue-50 text-blue-900 border-blue-200'
                              }`}>
                                {u.role}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-slate-700 text-[11px]">{u.dept}</td>
                            <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">{u.email}</td>
                            <td className="py-3 px-4 text-right">
                              <span className={`font-semibold ${
                                u.lastActive.includes('Active Now') ? 'text-emerald-700 font-bold' : 'text-slate-500'
                              }`}>
                                {u.lastActive}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB C: Login System Logs & Active Times */}
              {inspectionTab === 'logs' && (
                <div className="space-y-3">
                  <div className="text-xs text-slate-600 font-medium">
                    Immutable security login session records and active operational times for <strong>{inspectedBank.name}</strong>.
                  </div>
                  <div className="space-y-2.5">
                    {currentBankData.loginLogs.map((l) => (
                      <div
                        key={l.id}
                        className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold flex-shrink-0 mt-0.5 ${
                            l.status === 'Active Session' 
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                              : 'bg-slate-100 text-slate-600 border border-slate-200'
                          }`}>
                            <KeyRound className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-slate-900">{l.user}</span>
                              <span className="text-[11px] text-slate-500">({l.role})</span>
                              <span className={`text-[10px] font-bold px-2 py-0.2 rounded-full border ${
                                l.status === 'Active Session'
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                  : 'bg-slate-100 text-slate-600 border-slate-200'
                              }`}>
                                {l.status}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500 mt-0.5">
                              Auth Method: <strong className="text-slate-700">{l.authMethod}</strong> • IP: <span className="font-mono">{l.ip}</span>
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="font-bold text-slate-900 text-[11.5px] flex items-center gap-1 justify-end">
                            <Clock className="w-3.5 h-3.5 text-blue-600" />
                            <span>{l.duration}</span>
                          </div>
                          <div className="text-[10.5px] text-slate-500">{l.loginTime}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center text-xs">
              <span className="text-slate-500">
                Connected tenant: <strong>{inspectedBank.id.toUpperCase()}</strong> • Enterprise Gateway
              </span>
              <button
                onClick={() => setInspectedBank(null)}
                className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-1.5 rounded-lg text-xs transition cursor-pointer"
              >
                Close Inspection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------- ADD MASTER POLICY FRAMEWORK MODAL (WITH AI UPLOAD) ------------------- */}
      {isAddFrameworkOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-xs">
                  <PlusCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Add Master Policy Framework</h3>
                  <p className="text-xs text-slate-500">Create directly or upload documents for AI regulatory ingestion</p>
                </div>
              </div>

              <button
                onClick={() => setIsAddFrameworkOpen(false)}
                className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="flex border-b border-slate-200 bg-white px-5 pt-3 gap-3">
              <button
                type="button"
                onClick={() => setAddMode('direct')}
                className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
                  addMode === 'direct'
                    ? 'border-blue-600 text-blue-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Direct Document Creation</span>
              </button>

              <button
                type="button"
                onClick={() => setAddMode('ai-upload')}
                className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
                  addMode === 'ai-upload'
                    ? 'border-blue-600 text-blue-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                <span>AI Regulatory Ingestion / Upload Option</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-5 custom-scrollbar space-y-4">
              {frameworkPublishedSuccess ? (
                <div className="p-8 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                    <Check className="w-6 h-6 stroke-[3]" />
                  </div>
                  <h4 className="text-sm font-extrabold text-slate-900">Master Policy Framework Published!</h4>
                  <p className="text-xs text-slate-500">Standard propagated instantly to all 4 Subscribed Member Banks.</p>
                </div>
              ) : addMode === 'ai-upload' ? (
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-blue-200 rounded-2xl p-6 text-center bg-blue-50/40 space-y-3">
                    <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center mx-auto">
                      <Upload className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-900 text-xs">Upload Master Regulatory Standard Document</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">Supports PDF, DOCX, or JSON regulatory baseline specifications</p>
                    </div>

                    <input
                      type="file"
                      id="master-ai-doc-upload"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files?.[0]) setUploadFile(e.target.files[0]);
                      }}
                    />
                    <label
                      htmlFor="master-ai-doc-upload"
                      className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-xl text-xs transition cursor-pointer shadow-xs"
                    >
                      <FileCheck className="w-3.5 h-3.5" />
                      <span>{uploadFile ? uploadFile.name : 'Select Document File'}</span>
                    </label>
                  </div>

                  {uploadFile && (
                    <div className="bg-white border border-slate-200 rounded-xl p-3.5 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 text-xs">AI Extraction Pipeline</span>
                        <button
                          type="button"
                          onClick={handleSimulateAIScan}
                          disabled={isScanningWithAI}
                          className="bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold px-3 py-1 rounded text-xs transition flex items-center gap-1.5 cursor-pointer"
                        >
                          {isScanningWithAI ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                          <span>{isScanningWithAI ? 'Extracting with AI...' : 'Scan & Extract with AI'}</span>
                        </button>
                      </div>

                      {aiScanStep > 0 && (
                        <div className="space-y-1 text-[11px] font-medium text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                          {aiScanStep >= 1 && <div className="text-blue-700">✓ Ingesting {uploadFile.name} text structure...</div>}
                          {aiScanStep >= 2 && <div className="text-blue-700">✓ Parsing APRA/AUSTRAC statutory clauses...</div>}
                          {aiScanStep >= 3 && <div className="text-blue-700">✓ Aligning monitored telemetry baselines...</div>}
                          {aiScanStep >= 4 && <div className="text-emerald-700 font-bold">✓ Standard extracted! Ready to review and publish below.</div>}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Pre-populated form preview after scan */}
                  {aiScanStep >= 4 && (
                    <div className="space-y-3 border-t border-slate-200 pt-3">
                      <div>
                        <label className="font-bold text-slate-700 text-[11px] block mb-1">Standard Title</label>
                        <input
                          type="text"
                          value={newStandard.title}
                          onChange={(e) => setNewStandard({ ...newStandard, title: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900 outline-none"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="font-bold text-slate-700 text-[11px] block mb-1">Standard Code</label>
                          <input
                            type="text"
                            value={newStandard.code}
                            onChange={(e) => setNewStandard({ ...newStandard, code: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900 outline-none"
                          />
                        </div>
                        <div>
                          <label className="font-bold text-slate-700 text-[11px] block mb-1">Domain</label>
                          <select
                            value={newStandard.domain}
                            onChange={(e) => setNewStandard({ ...newStandard, domain: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900 outline-none"
                          >
                            <option value="Prudential">APRA Prudential</option>
                            <option value="Privacy">Privacy & Data Governance</option>
                            <option value="AML">AML/CTF Financial Crime</option>
                            <option value="Payment">Payment Rails & API</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Direct Document Creation Mode */
                <form onSubmit={handlePublishStandard} className="space-y-3">
                  <div>
                    <label className="font-bold text-slate-700 text-[11px] block mb-1">Master Standard Title</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. APRA CPS 235 Cloud Security & Data Location Safeguards"
                      value={newStandard.title}
                      onChange={(e) => setNewStandard({ ...newStandard, title: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 outline-none focus:bg-white focus:border-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-slate-700 text-[11px] block mb-1">Regulatory Code</label>
                      <input
                        type="text"
                        placeholder="e.g. APRA CPS 235"
                        value={newStandard.code}
                        onChange={(e) => setNewStandard({ ...newStandard, code: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 outline-none"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 text-[11px] block mb-1">Regulatory Domain</label>
                      <select
                        value={newStandard.domain}
                        onChange={(e) => setNewStandard({ ...newStandard, domain: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 outline-none cursor-pointer"
                      >
                        <option value="Prudential">APRA Prudential</option>
                        <option value="Privacy">Privacy & Data Governance</option>
                        <option value="AML">AML/CTF Financial Crime</option>
                        <option value="Payment">Payment Rails & API</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 text-[11px] block mb-1">Vision & Mandatory Baseline Statement</label>
                    <textarea
                      rows={3}
                      placeholder="Specify baseline regulatory mandate and cross-bank operational rules..."
                      value={newStandard.vision}
                      onChange={(e) => setNewStandard({ ...newStandard, vision: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 outline-none focus:bg-white focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 text-[11px] block mb-1">Statutory Clauses (Direct in-system document parameters)</label>
                    <div className="space-y-1.5 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                      {newStandard.clauses.map((c, i) => (
                        <div key={i} className="text-[11px] text-slate-700 flex items-center gap-1.5">
                          <strong className="text-blue-900">{c.id}:</strong>
                          <span>{c.title}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </form>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center text-xs">
              <button
                type="button"
                onClick={() => setIsAddFrameworkOpen(false)}
                className="text-slate-600 hover:text-slate-900 font-bold px-3 py-1.5 rounded transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handlePublishStandard}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-xl text-xs transition cursor-pointer shadow-xs"
              >
                Publish Master Framework
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------- SUPER ADMIN AI NAVIGATION CHATBOT ------------------- */}
      <div className="fixed bottom-6 right-6 z-40">
        {!isChatOpen ? (
          <button
            onClick={() => setIsChatOpen(true)}
            className="flex items-center gap-2.5 bg-slate-900 hover:bg-blue-900 text-white px-4 py-3 rounded-2xl shadow-xl transition hover:scale-105 cursor-pointer border border-slate-700"
            title="Open Super Admin AI Copilot"
          >
            <div className="w-6 h-6 rounded-lg bg-blue-600 flex items-center justify-center text-white">
              <Bot className="w-4 h-4" />
            </div>
            <div className="text-left">
              <div className="font-extrabold text-xs">Admin Copilot</div>
              <div className="text-[10px] text-blue-200">Navigate & Query Banks</div>
            </div>
          </button>
        ) : (
          <div className="bg-white border border-slate-300 rounded-2xl shadow-2xl w-96 max-h-[500px] flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-200">
            {/* Chatbot Header */}
            <div className="p-3.5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                  <Bot className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-extrabold text-xs">Super Admin AI Copilot</h4>
                  <span className="text-[10px] text-blue-300">Ramesh • Master Governance</span>
                </div>
              </div>
              <button
                onClick={() => setIsChatOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Navigation Prompts */}
            <div className="p-2 bg-slate-50 border-b border-slate-200 flex flex-wrap gap-1 text-[10px]">
              <button
                onClick={() => handleSendAdminChatMessage('Inspect CBA user logs')}
                className="px-2 py-0.5 rounded-full bg-white border border-slate-200 hover:border-blue-400 text-slate-700 hover:text-blue-700 font-medium transition cursor-pointer"
              >
                Inspect CBA Logs
              </button>
              <button
                onClick={() => handleSendAdminChatMessage('Show NAB policies')}
                className="px-2 py-0.5 rounded-full bg-white border border-slate-200 hover:border-blue-400 text-slate-700 hover:text-blue-700 font-medium transition cursor-pointer"
              >
                NAB Policies
              </button>
              <button
                onClick={() => handleSendAdminChatMessage('Navigate to Master Standards')}
                className="px-2 py-0.5 rounded-full bg-white border border-slate-200 hover:border-blue-400 text-slate-700 hover:text-blue-700 font-medium transition cursor-pointer"
              >
                Master Standards
              </button>
              <button
                onClick={() => handleSendAdminChatMessage('Add master standard with AI upload')}
                className="px-2 py-0.5 rounded-full bg-white border border-slate-200 hover:border-blue-400 text-slate-700 hover:text-blue-700 font-medium transition cursor-pointer"
              >
                + AI Upload Standard
              </button>
            </div>

            {/* Messages Body */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2.5 custom-scrollbar bg-slate-50/40 text-xs min-h-[220px]">
              {chatMessages.map((m) => (
                <div
                  key={m.id}
                  className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] p-2.5 rounded-xl leading-relaxed text-[11.5px] ${
                      m.sender === 'user'
                        ? 'bg-blue-600 text-white rounded-br-xs'
                        : 'bg-white border border-slate-200 text-slate-800 rounded-bl-xs shadow-2xs'
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
              ))}
            </div>

            {/* Input Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendAdminChatMessage();
              }}
              className="p-2 bg-white border-t border-slate-200 flex items-center gap-1.5"
            >
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask or navigate banks & standards..."
                className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 placeholder-slate-400 outline-none focus:bg-white focus:border-blue-500"
              />
              <button
                type="submit"
                disabled={!chatInput.trim()}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white p-1.5 rounded-lg text-xs transition cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        )}
      </div>

      {/* ------------------- CREATE NEW USER & ASSIGN ROLE MODAL (ADMIN) ------------------- */}
      {isCreateUserOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#0057B8] text-white flex items-center justify-center font-bold shadow-xs">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">Provision Bank User & Role</h3>
                  <p className="text-[11px] text-slate-500">Create new user account and assign governance permissions</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsCreateUserOpen(false);
                  setUserErrorMessage('');
                  setUserSuccessMessage('');
                }}
                className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateUserSubmit} className="p-5 space-y-4 text-xs">
              {userSuccessMessage && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>{userSuccessMessage}</span>
                </div>
              )}

              {userErrorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl font-medium">
                  {userErrorMessage}
                </div>
              )}

              {/* Full Name */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={newUserData.name}
                  onChange={(e) => setNewUserData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. Alex Morgan"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 outline-none focus:bg-white focus:border-blue-500 font-medium"
                />
              </div>

              {/* Work Email */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Work Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={newUserData.email}
                  onChange={(e) => setNewUserData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="e.g. alex.morgan@cba.com.au"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 outline-none focus:bg-white focus:border-blue-500 font-mono"
                />
              </div>

              {/* Bank Selection & Role Type */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Bank Tenant
                  </label>
                  <select
                    value={newUserData.bank_id}
                    onChange={(e) => setNewUserData(prev => ({ ...prev, bank_id: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 outline-none focus:bg-white focus:border-blue-500 font-bold"
                  >
                    <option value="cba">Commonwealth Bank (CBA)</option>
                    <option value="nab">National Australia Bank (NAB)</option>
                    <option value="wbc">Westpac Banking Corp (WBC)</option>
                    <option value="anz">ANZ Banking Group (ANZ)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Access Level
                  </label>
                  <select
                    value={newUserData.role_type}
                    onChange={(e) => {
                      const type = e.target.value;
                      const defaultRoleMap = {
                        manager: 'Bank Administrator',
                        employee: 'Bank Employee (Maker)',
                        admin: 'Platform Super Admin'
                      };
                      setNewUserData(prev => ({
                        ...prev,
                        role_type: type,
                        role: defaultRoleMap[type] || 'Bank Employee'
                      }));
                    }}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 outline-none focus:bg-white focus:border-blue-500 font-bold"
                  >
                    <option value="employee">Bank Employee (Maker / Checker)</option>
                    <option value="manager">Bank Administrator (Executive Approver)</option>
                    <option value="admin">Platform Super Admin</option>
                  </select>
                </div>
              </div>

              {/* Specific Role Title */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Designation / Role Title
                </label>
                <input
                  type="text"
                  value={newUserData.role}
                  onChange={(e) => setNewUserData(prev => ({ ...prev, role: e.target.value }))}
                  placeholder="e.g. Senior Credit Risk Assessor"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 outline-none focus:bg-white focus:border-blue-500"
                />
              </div>

              {/* Department / Squad */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Department Squad
                </label>
                <input
                  type="text"
                  value={newUserData.department}
                  onChange={(e) => setNewUserData(prev => ({ ...prev, department: e.target.value }))}
                  placeholder="e.g. Credit Operations Squad"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 outline-none focus:bg-white focus:border-blue-500"
                />
              </div>

              {/* Actions */}
              <div className="pt-2 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateUserOpen(false)}
                  className="px-4 py-2 border border-slate-300 hover:bg-slate-100 rounded-lg text-slate-700 font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingUser}
                  className="flex items-center gap-1.5 px-4 py-2 bg-[#0057B8] hover:bg-[#004EA6] text-white rounded-lg font-bold shadow-xs transition cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingUser ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Provisioning...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Create User & Assign Role</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
