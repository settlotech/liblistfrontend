// Detailed Bank Data: Registered Users, Policies Used & Login System Logs with Active Times
export const BANK_DETAILS = {
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

