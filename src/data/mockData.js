export const bankingProducts = [
  { id: 'all', label: 'All Products', shortLabel: 'All' },
  { id: 'credit-cards', label: 'Credit Cards', shortLabel: 'Credit Cards' },
  { id: 'personal-loans', label: 'Personal Loans', shortLabel: 'Personal Loans' },
  { id: 'mortgages', label: 'Mortgages', shortLabel: 'Mortgages' },
  { id: 'deposits', label: 'Deposits', shortLabel: 'Deposits' },
];

export const userRoles = [
  {
    id: 'admin',
    name: 'Ramesh',
    email: 'ramesh.platform@libtrak.gov.au',
    role: 'Platform Owner',
    roleType: 'admin',
    type: 'admin',
    avatar: 'R',
    badge: '👑 Platform Owner',
  },
  // CBA Roles
  {
    id: 'cba_employee',
    bankId: 'cba',
    name: 'Sarah Jenkins',
    email: 'sarah.jenkins@cba.com.au',
    role: 'Bank Employee',
    roleType: 'employee',
    type: 'bank',
    bankName: 'Commonwealth Bank of Australia (CBA)',
    avatar: 'SJ',
    badge: '👨‍💼 Bank Employee',
  },
  {
    id: 'cba_manager',
    bankId: 'cba',
    name: 'Marcus Vance',
    email: 'marcus.vance@cba.com.au',
    role: 'Bank Administrator',
    roleType: 'manager',
    type: 'bank',
    bankName: 'Commonwealth Bank of Australia (CBA)',
    avatar: 'MV',
    badge: '🏦 Bank Administrator',
  },
  // NAB Roles
  {
    id: 'nab_employee',
    bankId: 'nab',
    name: 'Rachel Wong',
    email: 'rachel.wong@nab.com.au',
    role: 'NAB Regulatory Compliance Analyst',
    roleType: 'employee',
    type: 'bank',
    bankName: 'National Australia Bank (NAB)',
    avatar: 'RW',
    badge: '👨‍💼 NAB Submitter (Employee)',
  },
  {
    id: 'nab_manager',
    bankId: 'nab',
    name: 'Julian Hayes',
    email: 'julian.hayes@nab.com.au',
    role: 'NAB GM of Regulatory Governance',
    roleType: 'manager',
    type: 'bank',
    bankName: 'National Australia Bank (NAB)',
    avatar: 'JH',
    badge: '👩‍💼 NAB Approver (Risk Manager)',
  },
  // Westpac Roles
  {
    id: 'wbc_employee',
    bankId: 'wbc',
    name: 'Anthony Clarke',
    email: 'anthony.clarke@westpac.com.au',
    role: 'Westpac Enterprise Risk Analyst',
    roleType: 'employee',
    type: 'bank',
    bankName: 'Westpac Banking Corp (WBC)',
    avatar: 'AC',
    badge: '👨‍💼 WBC Submitter (Employee)',
  },
  {
    id: 'wbc_manager',
    bankId: 'wbc',
    name: 'Claire Beaumont',
    email: 'claire.beaumont@westpac.com.au',
    role: 'Westpac Head of Enterprise Compliance',
    roleType: 'manager',
    type: 'bank',
    bankName: 'Westpac Banking Corp (WBC)',
    avatar: 'CB',
    badge: '👩‍💼 WBC Approver (Risk Manager)',
  },
  // ANZ Roles
  {
    id: 'anz_employee',
    bankId: 'anz',
    name: 'Elena Rossi',
    email: 'elena.rossi@anz.com.au',
    role: 'ANZ Lead AppSec Engineer',
    roleType: 'employee',
    type: 'bank',
    bankName: 'ANZ Banking Group (ANZ)',
    avatar: 'ER',
    badge: '👨‍💼 ANZ Submitter (Employee)',
  },
  {
    id: 'anz_manager',
    bankId: 'anz',
    name: 'Arthur Pendelton',
    email: 'arthur.pendelton@anz.com.au',
    role: 'ANZ Chief Information Security Officer',
    roleType: 'manager',
    type: 'bank',
    bankName: 'ANZ Banking Group (ANZ)',
    avatar: 'AP',
    badge: '👩‍💼 ANZ Approver (Risk Manager)',
  },
];

export const banksList = [
  {
    id: 'cba',
    name: 'Commonwealth Bank of Australia (CBA)',
    tier: 'Tier 1 Regulated Bank',
    subscriptionStatus: 'Active Enterprise',
    joinedDate: 'Jan 15, 2025',
    activeAddendaCount: 11,
    complianceStatus: 'APRA CPS 234 / CPS 230 Verified',
    contactEmail: 'security-governance@cba.com.au',
    lastAuditDate: 'Sep 21, 2026',
    addendaSummary: 'Hardware token step-up for high-net-worth accounts & 15m session timeouts.',
  },
  {
    id: 'nab',
    name: 'National Australia Bank (NAB)',
    tier: 'Tier 1 Regulated Bank',
    subscriptionStatus: 'Active Enterprise',
    joinedDate: 'Mar 02, 2025',
    activeAddendaCount: 9,
    complianceStatus: 'APRA CPS 234 / CPS 230 Verified',
    contactEmail: 'compliance-desk@nab.com.au',
    lastAuditDate: 'Sep 18, 2026',
    addendaSummary: 'Cross-border AML review > $2,500 AUD & blue-green test environment bypass.',
  },
  {
    id: 'wbc',
    name: 'Westpac Banking Corp (WBC)',
    tier: 'Tier 1 Regulated Bank',
    subscriptionStatus: 'Active Enterprise',
    joinedDate: 'Feb 10, 2025',
    activeAddendaCount: 10,
    complianceStatus: 'APRA CPS 234 / CPS 230 Verified',
    contactEmail: 'risk-oversight@westpac.com.au',
    lastAuditDate: 'Sep 14, 2026',
    addendaSummary: 'Dual-authorization for automated treasury API key generations & limit adjustments.',
  },
  {
    id: 'anz',
    name: 'ANZ Banking Group (ANZ)',
    tier: 'Tier 1 Regulated Bank',
    subscriptionStatus: 'Active Enterprise',
    joinedDate: 'Apr 20, 2025',
    activeAddendaCount: 8,
    complianceStatus: 'APRA CPS 234 / CPS 230 Verified',
    contactEmail: 'appsec-core@anz.com.au',
    lastAuditDate: 'Sep 22, 2026',
    addendaSummary: 'Passkey & biometric verification enforcement on iOS 18+ and Android 15.',
  },
];

// Complete Banking Regulatory Hierarchy
export const initialBankingHierarchy = [
  {
    id: 'prudential-standards',
    label: 'APRA PRUDENTIAL STANDARDS',
    children: [
      {
        id: 'cps-234-group',
        label: 'CPS 234: Information Security',
        children: [
          { id: 'oauth-sso', label: 'OAuth 2.0 & SSO Access Security', version: 'v3.1.2' },
          { id: 'privileged-access', label: 'Privileged Access Management (PAM)', version: 'v2.4.0' },
          { id: 'mfa-enforcement', label: 'FIDO2 / MFA Mandatory Controls', version: 'v1.9.0' },
          { id: 'apra-incident-reporting', label: '72-Hour Cyber Incident Notification (APRA)', version: 'v2.2.0' },
        ],
      },
      {
        id: 'aps-220-group',
        label: 'APS 220: Credit Risk & Lending Rules',
        children: [
          { id: 'aps-220-credit-risk', label: 'Responsible Lending & Personal Loan Rules', version: 'v3.4.0' },
        ],
      },
      {
        id: 'cps-230-group',
        label: 'CPS 230: Operational Risk Management',
        children: [
          { id: 'business-continuity', label: 'Critical Service Continuity & SLAs', version: 'v2.1.0' },
          { id: 'third-party-risk', label: 'Third-Party Service Provider Controls', version: 'v1.6.0' },
        ],
      },
    ],
  },
  {
    id: 'privacy-data-governance',
    label: 'PRIVACY & CUSTOMER DATA GOVERNANCE',
    children: [
      {
        id: 'app-privacy-group',
        label: 'Australian Privacy Principles (APP 1-13)',
        children: [
          { id: 'data-retention-privacy', label: 'APP 11: Security & Destruction of PII', version: 'v4.0.1' },
          { id: 'open-banking-cdr', label: 'Open Banking CDR Consent Lifecycle', version: 'v3.2.0' },
        ],
      },
    ],
  },
  {
    id: 'financial-crime-aml',
    label: 'AML/CTF & FINANCIAL CRIME (AUSTRAC)',
    children: [
      {
        id: 'aml-transaction-monitoring',
        label: 'Transaction Monitoring & KYC Rules',
        children: [
          { id: 'aml-threshold-reporting', label: 'Threshold Transaction Reporting (TTR)', version: 'v3.0.0' },
          { id: 'sanctions-screening', label: 'Real-Time Sanctions Screening', version: 'v2.2.4' },
        ],
      },
    ],
  },
  {
    id: 'payment-rails-gateway',
    label: 'PAYMENT RAILS & API INFRASTRUCTURE',
    children: [
      {
        id: 'payment-gateways-group',
        label: 'Payment Gateways & Throttling',
        children: [
          { id: 'npp-payid-rules', label: 'New Payments Platform (NPP) Rails', version: 'v2.5.0' },
          { id: 'rate-limiting-api', label: 'Merchant API Rate Limiting & Throttling', version: 'v2.1.0' },
        ],
      },
    ],
  },
];

// Rich, realistic banking specifications for all submenu options
export const initialPoliciesDatabase = {
  // 0. APRA APS 220 Responsible Lending & Personal Loan Credit Assessment Rules
  'aps-220-credit-risk': {
    id: 'aps-220-credit-risk',
    title: 'Responsible Lending & Personal Loan Credit Assessment Rules',
    breadcrumb: 'APRA Prudential Standards / APS 220 Credit Risk & Lending Rules • Active',
    latestVersion: 'v3.4.0',
    lastUpdated: 'Sep 25, 2026',
    ownedBy: 'Retail Credit Risk & Underwriting Squad',
    complianceLevel: 'APRA APS 220 / National Consumer Credit Protection (NCCP) Act 2009',
    visionStatement:
      'Enforce automated responsible lending verification, 3.00% minimum interest rate buffers, and comprehensive credit reporting (CCR) ingestion to eliminate unserviceable debt exposure across retail loan portfolios.',
    dependencies: [
      { name: 'Equifax / Experian CCR Gateway', status: 'Healthy' },
      { name: 'Open Banking CDR Income Categorizer', status: 'Active' },
      { name: 'Core Decisioning Engine (FICO/Provenir)', status: 'Active' },
    ],
    coreFrameworkClauses: [
      {
        clauseId: 'APS220-CR-01',
        title: 'Mandatory 3.00% Serviceability Interest Rate Buffer',
        content: 'All personal loan and residential mortgage serviceability calculations must incorporate a minimum interest rate assessment buffer of 300 basis points (3.00%) above the active customer loan interest rate.',
      },
      {
        clauseId: 'APS220-CR-02',
        title: 'Debt-to-Income (DTI) Cap & Unhedged Exposure Limits',
        content: 'Unsecured personal loan and credit facility approvals resulting in Debt-to-Income (DTI) exceeding 6.0x are restricted to maximum 5% of total retail origination volume, requiring Level-4 Risk Committee escalation.',
      },
      {
        clauseId: 'APS220-CR-03',
        title: 'Mandatory Comprehensive Credit Reporting (CCR) Ingestion',
        content: 'Prior to unconditional loan approval, underwriting systems must query real-time positive and negative credit data from accredited bureaus and cross-reference with CDR bank statements.',
      },
    ],
    bankCustomAddenda: {
      cba: {
        sessionTimeout: 'Max $50,000 Unsecured Personal Loan Limit',
        mfaRule: 'Income verification via automated CDR Open Banking stream',
        customClause: 'CBA Lending Rule: Tiered risk-based pricing with automated 3.5% buffer for non-salaried applicants.',
        lastModifiedBy: 'David Miller (CBA Principal Security Architect)',
      },
      nab: {
        sessionTimeout: 'Max $50,000 Unsecured Personal Loan Limit',
        mfaRule: 'Fast-track auto-decisioning for credit score > 750',
        customClause: 'NAB Lending Addendum: Mandatory living expense benchmark (HEM) cross-validation with 12 months transaction data.',
        lastModifiedBy: 'Rachel Wong (NAB Compliance)',
      },
      wbc: {
        sessionTimeout: 'Max $60,000 Unsecured Personal Loan Limit',
        mfaRule: 'Dual risk-manager approval required for DTI > 5.5x',
        customClause: 'Westpac Lending Clause: Instant hardship relief pre-screening for vulnerable borrower profiles.',
        lastModifiedBy: 'Anthony Clarke (Westpac Risk)',
      },
      anz: {
        sessionTimeout: 'Max $45,000 Unsecured Personal Loan Limit',
        mfaRule: 'Passkey digital signature required for loan agreement contract',
        customClause: 'ANZ Lending Rule: Automated real-time employer payroll API validation for instant disbursement.',
        lastModifiedBy: 'Elena Rossi (ANZ AppSec)',
      },
    },
    artifacts: [
      { id: 'art-lending1', type: 'Training', tag: 'Underwriting Guide', location: 'Master Library', title: 'NCCP Responsible Lending Assessment SOP', content: 'Step-by-step checklist for verifying borrower requirements and objectives under ASIC RG 209.' },
      { id: 'art-lending2', type: 'Minutes', tag: 'Credit Committee', location: 'Master Library', title: 'Q3 APRA APS 220 Credit Risk Stress Test Review', content: 'Portfolio stress-tested against 400bps rate hike scenario with default rate remaining under 0.65%.' },
    ],
    metricsTable: [
      { metric: 'Avg Approval Turnaround Time', target: '< 4 hours', actual: '1.4 hours', status: 'Optimal' },
      { metric: 'Non-Performing Loan (NPL) Ratio', target: '< 1.0%', actual: '0.48%', status: 'Optimal' },
      { metric: 'CCR Bureau Ingestion Latency', target: '< 2.0s', actual: '0.85s', status: 'Optimal' },
    ],
    applicableProducts: ['personal-loans', 'mortgages', 'all'],
    comments: [
      { 
        id: 'cr-loan-1', 
        type: 'CHANGE_REQUEST',
        category: 'Review', 
        badge: 'Lending Policy Variance', 
        author: 'David Miller', 
        authorRole: 'CBA Principal Security Architect (Employee)',
        avatar: 'DM', 
        bankId: 'cba',
        targetProduct: 'Personal Loans',
        time: '2 hours ago', 
        title: 'Automated CDR income verification threshold increase for digital personal loans',
        content: 'Requesting permission to increase automated instant loan decisioning threshold from $30,000 to $50,000 for CBA salary-credited customers with CDR data sharing active.',
        proposedTimeout: 'Instant Decisioning up to $50,000 AUD',
        proposedMfaRule: 'Biometric passkey signature + CDR 90-day transaction sync',
        status: 'PENDING',
        reviewerName: null,
        reviewNote: null,
        reviewedAt: null,
      },
      { id: 'c-loan1', author: 'Marcus Vance', avatar: 'MV', time: '5 hours ago', category: 'Notes', badge: 'Credit Policy', content: 'APRA APS 220 300bps buffer verified across all personal loan originations.' },
    ],
  },

  // 1. OAuth 2.0 & SSO
  'oauth-sso': {
    id: 'oauth-sso',
    title: 'OAuth 2.0 & Single Sign-On (SSO) Security',
    breadcrumb: 'APRA Prudential Standards / CPS 234 Information Security • Production',
    latestVersion: 'v3.1.2',
    lastUpdated: 'Sep 21, 2026',
    ownedBy: 'Identity & Access Squad',
    complianceLevel: 'APRA CPS 234 / SOC2 Type II / ISO27001',
    visionStatement:
      'Ensure seamless, secure multi-tenant identity verification across banking web and mobile surfaces without compromising token propagation speed or statutory security policies.',
    dependencies: [
      { name: 'Auth0 / Okta Enterprise Gateway', status: 'Healthy' },
      { name: 'Hardware Security Module (HSM) Vault', status: '99.99% Uptime' },
      { name: 'Active Directory / Core LDAP Sync', status: 'Active' },
    ],
    coreFrameworkClauses: [
      {
        clauseId: 'CPS234-SEC-01',
        title: 'Mandatory PKCE & Asymmetric Cryptographic Signing',
        content: 'All confidential and public banking clients authenticating via OAuth 2.0 must enforce Proof Key for Code Exchange (PKCE RFC 7636). Token validation microservices shall reject symmetric HS256 tokens and require RS256/ES256 asymmetric cryptographic keys refreshed every 30 days.',
      },
      {
        clauseId: 'CPS234-SEC-02',
        title: 'Maximum Refresh Token Inactivity Window',
        content: 'In accordance with APRA Prudential Practice Guide CPG 234, token revocation shall occur within < 300ms of suspicious telemetry triggers. Absolute token lifetime cannot exceed statutory limits for tier-1 financial infrastructure.',
      },
      {
        clauseId: 'CPS234-SEC-03',
        title: 'Audit Logging & Non-Repudiation Trail',
        content: 'Authentication events including grant exchanges, refresh operations, and role assignments must be streamed to an append-only immutable security ledger with cryptographic hashing.',
      },
    ],
    bankCustomAddenda: {
      cba: {
        sessionTimeout: '15 Minutes Inactivity / 8h Absolute',
        mfaRule: 'Transfers > $5,000 AUD or Novel Device Geolocation',
        customClause: 'CBA Group Addendum 4.2: Enforce hardware token step-up for high-net-worth customer account impersonation and branch assist sessions.',
        lastModifiedBy: 'David Miller (CBA Principal Security Architect)',
      },
      nab: {
        sessionTimeout: '20 Minutes Inactivity / 10h Absolute',
        mfaRule: 'Cross-border payments > $2,500 AUD or Biometric Mismatch',
        customClause: 'NAB Commercial Addendum 2.1: Internal corporate SSO bypass allowed solely for sandboxed test tenants during designated blue-green releases.',
        lastModifiedBy: 'Rachel Wong (NAB Compliance Manager)',
      },
      wbc: {
        sessionTimeout: '12 Minutes Inactivity / 6h Absolute',
        mfaRule: 'Any Payee Addition or Modification of Daily Limits',
        customClause: 'Westpac Institutional Addendum 8.1: Dual-authorization required for automated treasury API key generations.',
        lastModifiedBy: 'Anthony Clarke (Westpac Enterprise Risk)',
      },
      anz: {
        sessionTimeout: '15 Minutes Inactivity / 8h Absolute',
        mfaRule: 'Transfers > $10,000 AUD or International Routing',
        customClause: 'ANZ Private Addendum 1.4: Strict biometric passkey enforcement on iOS 18+ and Android 15 mobile banking apps.',
        lastModifiedBy: 'Elena Rossi (ANZ Head of AppSec)',
      },
    },
    artifacts: [
      { id: 'art-1', type: 'Training', tag: 'Training Note', location: 'Logged in Spec', title: 'Token Refresh Pattern Hands-on Walkthrough', content: 'Engineers onboarding to this banking module must review the JWT refresh token rotation sequence before submitting PRs.' },
      { id: 'art-2', type: 'Issues', tag: 'Active Issue', location: 'Logged in Spec', title: 'Intermittent 401 on Mobile Safari WebViews', content: 'WebKit third-party cookie restrictions cause auth state loss on cross-domain redirects. Workaround staging in sandbox.' },
      { id: 'art-3', type: 'Minutes', tag: 'Architecture Minutes', location: 'Logged in Spec', title: 'Q3 Auth Review Sync (Sep 14)', content: 'Agreed to migrate from HS256 to RS256 asymmetric signing for internal microservice validation tokens.' },
    ],
    metricsTable: [
      { metric: 'Token Issue Latency', target: '< 20ms', actual: '14.2ms', status: 'Optimal' },
      { metric: 'Session Cache Hit Rate', target: '> 95%', actual: '98.4%', status: 'Optimal' },
      { metric: 'Auth Failures / min', target: '< 0.1%', actual: '0.04%', status: 'Normal' },
    ],
    applicableProducts: ['credit-cards', 'personal-loans', 'mortgages', 'deposits'],
    comments: [
      { 
        id: 'cr-101', 
        type: 'CHANGE_REQUEST',
        category: 'Review', 
        badge: 'Policy Variance Request', 
        author: 'David Miller', 
        authorRole: 'CBA Principal Security Architect (Employee)',
        avatar: 'DM', 
        bankId: 'cba',
        targetProduct: 'Credit Cards',
        time: '1 hour ago', 
        title: 'Request 20-minute session timeout extension for Mobile Credit Card portal',
        content: 'Telemetry data shows a 14% drop-off rate during multi-document income upload for Credit Card balance transfer applications. Requesting a 5-minute extension to the standard 15-minute inactivity timeout for mobile WebView sessions.',
        proposedTimeout: '20 Minutes Inactivity / 8h Absolute',
        proposedMfaRule: 'Step-up MFA on transfers > $5,000 AUD',
        status: 'PENDING',
        reviewerName: null,
        reviewNote: null,
        reviewedAt: null,
      },
      { 
        id: 'c-minutes-1', 
        type: 'COMMENT',
        category: 'Minutes', 
        badge: 'Risk Committee Sign-off', 
        author: 'Marcus Vance', 
        authorRole: 'CBA Chief Risk Officer (Risk Manager)',
        avatar: 'MV', 
        time: '3 hours ago', 
        content: 'Annual OAIC privacy audit readiness confirmed. Master locked clauses align with Australian Privacy Act 1988 & APRA CPS 234 requirements.' 
      },
      { 
        id: 'c-note-1', 
        type: 'COMMENT',
        category: 'Notes', 
        badge: 'Architecture Note', 
        author: 'Sarah Chen', 
        authorRole: 'Lead Cryptographic Engineer',
        avatar: 'SC', 
        time: 'Yesterday', 
        content: 'All engineers implementing this OAuth module must review the RS256 key rotation sequence before deploying to staging.' 
      },
      { 
        id: 'c-issue-1', 
        type: 'COMMENT',
        category: 'Issues', 
        badge: 'Mobile Bug', 
        author: 'Alex Rivera', 
        authorRole: 'iOS SecOps Lead',
        avatar: 'AR', 
        time: '2 days ago', 
        content: 'Safari iOS 18 WebViews intermittently dropping auth tokens during redirects. Workaround patch validated in sandbox.' 
      },
    ],
  },

  // 2. Privileged Access Management (PAM)
  'privileged-access': {
    id: 'privileged-access',
    title: 'Privileged Access Management (PAM) & Segregation of Duties',
    breadcrumb: 'APRA Prudential Standards / CPS 234 Information Security • Production',
    latestVersion: 'v2.4.0',
    lastUpdated: 'Aug 14, 2026',
    ownedBy: 'Enterprise IAM & SecOps Squad',
    complianceLevel: 'APRA CPS 234.33 / ISO27001 Annex A.9',
    visionStatement:
      'Enforce zero standing privileges (ZSP), ephemeral just-in-time credential issuance, and full session video auditing across all core banking database clusters and payment mainframes.',
    dependencies: [
      { name: 'CyberArk / HashiCorp Vault PAM', status: 'Healthy' },
      { name: 'Core Ledger Bastion Cluster', status: 'Active' },
      { name: 'SIEM Audit Recording Pipeline', status: 'Verified' },
    ],
    coreFrameworkClauses: [
      {
        clauseId: 'CPS234-PAM-01',
        title: 'Zero Standing Privileges for Production Infrastructure',
        content: 'No engineer or service account shall maintain permanent root or DBA privileges on core banking transaction engines. Access is granted on a Just-In-Time (JIT) basis with maximum 4-hour lease times.',
      },
      {
        clauseId: 'CPS234-PAM-02',
        title: 'Four-Eyes Principle for Production Discretionary Overrides',
        content: 'Any administrative change affecting interest calculation parameters, limit thresholds, or ledger tables requires simultaneous cryptographic approval by two authorized Level-3 officers.',
      },
    ],
    bankCustomAddenda: {
      cba: {
        sessionTimeout: '2 Hours JIT Lease Max',
        mfaRule: 'Hardware FIDO2 YubiKey mandatory for all Bastion jumps',
        customClause: 'CBA PAM Addendum: Video screen session recording retained for 365 days for all swift terminal interventions.',
        lastModifiedBy: 'David Miller (CBA Principal Security Architect)',
      },
      nab: {
        sessionTimeout: '4 Hours JIT Lease Max',
        mfaRule: 'Biometric passkey + Manager Slack notification',
        customClause: 'NAB Commercial PAM: Dual-signature clearance mandatory for wholesale forex batch runner access.',
        lastModifiedBy: 'Rachel Wong (NAB Compliance)',
      },
      wbc: {
        sessionTimeout: '1 Hour JIT Lease Max',
        mfaRule: 'RSA SecurID hardware token + Geo-IP locking',
        customClause: 'Westpac PAM Rule 3: Database direct queries automatically masked for all tax file numbers (TFNs).',
        lastModifiedBy: 'Anthony Clarke (Westpac Risk)',
      },
      anz: {
        sessionTimeout: '3 Hours JIT Lease Max',
        mfaRule: 'FIDO2 WebAuthn + Peer review ticket link',
        customClause: 'ANZ Private PAM: Automated revocation if session remains idle for more than 5 consecutive minutes.',
        lastModifiedBy: 'Elena Rossi (ANZ AppSec)',
      },
    },
    artifacts: [
      { id: 'art-pam1', type: 'Training', tag: 'Training Note', location: 'Logged in Spec', title: 'JIT Credential Elevation Guide', content: 'Standard operating procedure for requesting emergency break-glass credentials during SEV-1 incidents.' },
      { id: 'art-pam2', type: 'Minutes', tag: 'Architecture Minutes', location: 'Logged in Spec', title: 'Annual APRA PAM Audit Certification', content: 'Zero standing root accounts verified across Sydney AWS and Equinix data centers.' },
    ],
    metricsTable: [
      { metric: 'Standing Root Accounts', target: '0 (Zero)', actual: '0', status: 'Optimal' },
      { metric: 'Avg Elevation Approval Time', target: '< 5 min', actual: '2.1 min', status: 'Optimal' },
      { metric: 'Session Recording Coverage', target: '100%', actual: '100.0%', status: 'Compliant' },
    ],
    applicableProducts: ['credit-cards', 'personal-loans', 'mortgages', 'deposits'],
    comments: [
      { 
        id: 'cr-pam-1', 
        type: 'CHANGE_REQUEST',
        category: 'Review', 
        badge: 'PAM Policy Request', 
        author: 'David Miller', 
        authorRole: 'CBA Security Architect (Employee)',
        avatar: 'DM', 
        bankId: 'cba',
        targetProduct: 'Deposits',
        time: '3 hours ago', 
        title: 'Emergency Bastion Access Window Extension for Core Database Migration',
        content: 'Request temporary 3-hour elevation for Tier-1 DBA team during Saturday overnight ledger partition rebuild.',
        proposedTimeout: '3 Hours JIT Lease Max',
        proposedMfaRule: 'Hardware FIDO2 YubiKey mandatory for all Bastion jumps',
        status: 'PENDING',
        reviewerName: null,
        reviewNote: null,
        reviewedAt: null,
      },
      { id: 'c-pam1', type: 'COMMENT', author: 'Sarah Chen', avatar: 'SC', time: '1 day ago', category: 'Notes', badge: 'Architecture', content: 'Re-certified PAM Bastion keys for Q3 2026. All temporary leases automatically expired on schedule.' },
      { id: 'c-pam2', type: 'COMMENT', author: 'Marcus Vance', avatar: 'MV', time: '2 days ago', category: 'Minutes', badge: 'Audit Minutes', content: 'APRA annual PAM audit passed with zero non-conformances across all Sydney core ledgers.' },
    ],
  },

  // 3. FIDO2 / MFA Mandatory Controls
  'mfa-enforcement': {
    id: 'mfa-enforcement',
    title: 'FIDO2 / Multi-Factor Authentication (MFA) Mandatory Controls',
    breadcrumb: 'APRA Prudential Standards / CPS 234 Information Security • Audited',
    latestVersion: 'v1.9.0',
    lastUpdated: 'Jul 30, 2026',
    ownedBy: 'Customer Security Architecture',
    complianceLevel: 'APRA CPS 234 / NIST SP 800-63B AAL3',
    visionStatement:
      'Eliminate SMS-OTP vulnerabilities by mandating phishing-resistant FIDO2 hardware tokens and device-bound passkeys for all retail and corporate banking transactions.',
    dependencies: [
      { name: 'WebAuthn / FIDO2 Relying Party', status: 'Healthy' },
      { name: 'Apple / Google Passkey Attestation Service', status: 'Active' },
    ],
    coreFrameworkClauses: [
      {
        clauseId: 'CPS234-MFA-01',
        title: 'Phishing-Resistant Authenticator Mandate',
        content: 'SMS and email-delivered one-time passcodes (OTPs) are classified as deprecated for high-risk operations. Critical fund disbursements must mandate cryptographic public-key authenticator credentials.',
      },
    ],
    bankCustomAddenda: {
      cba: {
        sessionTimeout: '30 Days Passkey Remember Device Window',
        mfaRule: 'Step-up for all new payee additions regardless of balance',
        customClause: 'CBA Addendum: NetBank mobile app security enclave cryptographic challenge required for daily limits > $20,000.',
        lastModifiedBy: 'David Miller (CBA)',
      },
      nab: {
        sessionTimeout: '14 Days Remember Device Window',
        mfaRule: 'Step-up for payments > $2,000 AUD',
        customClause: 'NAB Addendum: Fallback to physical voice biometric validation for elderly and accessibility customer cohorts.',
        lastModifiedBy: 'Rachel Wong (NAB)',
      },
      wbc: {
        sessionTimeout: '21 Days Remember Device Window',
        mfaRule: 'Step-up for any profile password or address change',
        customClause: 'Westpac Addendum: Hardware token pairing mandatory for business corporate portal access.',
        lastModifiedBy: 'Anthony Clarke (Westpac)',
      },
      anz: {
        sessionTimeout: '30 Days Remember Device Window',
        mfaRule: 'Biometric passkey enforced on all mobile app logins',
        customClause: 'ANZ Addendum: Zero fallback to SMS OTP for high-net-worth Private Bank accounts.',
        lastModifiedBy: 'Elena Rossi (ANZ)',
      },
    },
    artifacts: [
      { id: 'art-mfa1', type: 'Training', tag: 'Training Note', location: 'Logged in Spec', title: 'Passkey Transition Onboarding Guide', content: 'Step-by-step UX flows for migrating retail mobile banking customers from SMS OTP to biometric passkeys.' },
    ],
    metricsTable: [
      { metric: 'Passkey Adoption Rate', target: '> 85%', actual: '89.2%', status: 'Optimal' },
      { metric: 'SIM-Swap Fraud Incidents', target: '0 (Zero)', actual: '0', status: 'Optimal' },
      { metric: 'MFA Verification Latency', target: '< 500ms', actual: '180ms', status: 'Optimal' },
    ],
    applicableProducts: ['credit-cards', 'personal-loans', 'mortgages', 'deposits'],
    comments: [
      { 
        id: 'cr-mfa-1', 
        type: 'CHANGE_REQUEST',
        category: 'Review', 
        badge: 'Biometric Exemption Request', 
        author: 'Elena Rossi', 
        authorRole: 'ANZ AppSec Lead (Employee)',
        avatar: 'ER', 
        bankId: 'anz',
        targetProduct: 'Personal Loans',
        time: '5 hours ago', 
        title: 'Allow temporary SMS fallback for legacy retail loan applicants',
        content: 'Customer service desk reports 6% of elder borrowers lack biometric devices for instant loan e-signing.',
        proposedTimeout: '15 Minutes Inactivity / 4h Absolute',
        proposedMfaRule: 'Step-up with certified branch phone verification',
        status: 'APPROVED',
        reviewerName: 'Arthur Pendelton (ANZ CISO)',
        reviewNote: 'Approved under APRA CPS 234 Accessibility Clause 12. Valid for 90 days.',
        reviewedAt: '2 hours ago',
      },
      { id: 'c-mfa1', type: 'COMMENT', author: 'Alex Rivera', avatar: 'AR', time: '3 days ago', category: 'Notes', badge: 'Training', content: 'SIM-swap attack resistance confirmed at 100% following nationwide Passkey deployment.' },
    ],
  },

  // 12. APRA CPS 234 72-Hour Material Cyber Incident Notification
  'apra-incident-reporting': {
    id: 'apra-incident-reporting',
    title: '72-Hour Material Cyber Incident Notification (APRA)',
    breadcrumb: 'APRA Prudential Standards / CPS 234 Information Security • Statutory',
    latestVersion: 'v2.2.0',
    lastUpdated: 'Sep 24, 2026',
    ownedBy: 'SecOps & Cyber Incident Response Squad',
    complianceLevel: 'APRA CPS 234.35 / Mandatory Statutory Rule',
    visionStatement:
      'Ensure immediate, standardized 72-hour formal escalation to APRA upon detecting any information security incident that materially impacts financial operations or customer account integrity.',
    dependencies: [
      { name: 'National Cyber Security Centre (NCSC) Link', status: 'Healthy' },
      { name: 'APRA Connect Reporting Gateway', status: 'Active' },
      { name: 'SIEM Incident Triage Workflow', status: 'Active' },
    ],
    coreFrameworkClauses: [
      {
        clauseId: 'CPS234-INC-01',
        title: '72-Hour Statutory APRA Notification Window',
        content: 'An APRA-regulated banking entity must formally notify APRA in writing within 72 hours after becoming aware of an information security incident that has materially affected, or has the potential to materially affect, the entity.',
      },
      {
        clauseId: 'CPS234-INC-02',
        title: '24-Hour Severity-1 Internal Board Escalation',
        content: 'All critical production incidents involving core banking ledgers or data breaches must escalate to the Board Risk Committee and Central SecOps within 24 hours of triage verification.',
      },
    ],
    bankCustomAddenda: {
      cba: {
        sessionTimeout: '24h Fast-Track Automated APRA Connect Integration',
        mfaRule: 'Dual-officer cryptographic signoff required for final APRA submission',
        customClause: 'CBA Group Incident Addendum: Automated forensic disk snapshot triggered within 15 minutes of SEV-1 breach detection.',
        lastModifiedBy: 'David Miller (CBA Principal Security Architect)',
      },
      nab: {
        sessionTimeout: '48h Escalation Window with Legal Counsel Signoff',
        mfaRule: 'Biometric authorization required from Chief Risk Officer',
        customClause: 'NAB Incident Rule: Mandatory customer notification within 24 hours if PII exposure exceeds 100 accounts.',
        lastModifiedBy: 'Rachel Wong (NAB Compliance)',
      },
      wbc: {
        sessionTimeout: '24h Internal Triage / 48h Regulator Notification',
        mfaRule: 'Hardware HSM token key clearance for incident dispatches',
        customClause: 'Westpac Incident Rule: Dedicated APRA liaison team activated for high-severity core payment outages.',
        lastModifiedBy: 'Anthony Clarke (Westpac Risk)',
      },
      anz: {
        sessionTimeout: '36h Accelerated Reporting Protocol',
        mfaRule: 'Multi-party approval required for regulatory disclosures',
        customClause: 'ANZ Incident Clause: Real-time incident telemetry feed linked directly to central threat dashboard.',
        lastModifiedBy: 'Elena Rossi (ANZ AppSec)',
      },
    },
    artifacts: [
      { id: 'art-inc1', type: 'Training', tag: 'SOP Handbook', location: 'Master Library', title: 'APRA 72-Hour Cyber Incident Response Runbook', content: 'Standard operating procedure for classification of Severity-1 incidents and automated dispatch to APRA Connect portal.' },
      { id: 'art-inc2', type: 'Minutes', tag: 'Board Minutes', location: 'Master Library', title: '2026 APRA Cyber Crisis Simulation Drill Sign-off', content: 'Annual board cyber crisis simulation drill completed with 100% SLA compliance.' },
    ],
    metricsTable: [
      { metric: 'Incident Triage Time (P99)', target: '< 15 min', actual: '6.2 min', status: 'Optimal' },
      { metric: 'APRA 72h Notice SLA Compliance', target: '100%', actual: '100.0%', status: 'Compliant' },
      { metric: 'Forensic Snapshot Speed', target: '< 10 min', actual: '4.8 min', status: 'Optimal' },
    ],
    comments: [
      { id: 'c-inc1', author: 'David Miller', avatar: 'DM', time: '1 day ago', category: 'Review', badge: 'Review', content: 'Verified direct webhook integration between SIEM alert manager and APRA Connect test sandbox.' },
    ],
  },

  // 4. Critical Service Continuity & SLAs (CPS 230)
  'business-continuity': {
    id: 'business-continuity',
    title: 'Critical Service Continuity, RPO/RTO & SLAs',
    breadcrumb: 'APRA Prudential Standards / CPS 230 Operational Risk Management • Production',
    latestVersion: 'v2.1.0',
    lastUpdated: 'Sep 10, 2026',
    ownedBy: 'Resilience & Site Reliability Squad',
    complianceLevel: 'APRA CPS 230 / CPG 230 / ISO 22301',
    visionStatement:
      'Guarantee zero tolerance for systemic disruption across core payments and deposit ledger availability with maximum Recovery Time Objective (RTO) < 15 minutes.',
    dependencies: [
      { name: 'Multi-Region Active-Active CockroachDB / Spanner', status: 'Healthy' },
      { name: 'Automated Chaos Engineering Drone', status: 'Active' },
    ],
    coreFrameworkClauses: [
      {
        clauseId: 'CPS230-BCP-01',
        title: 'Tolerance Limits for Material Business Activities',
        content: 'Core deposit processing, card authorization, and real-time payment settlement (NPP) must maintain maximum tolerable downtime of zero for scheduled events and < 15 minutes for disaster failovers.',
      },
      {
        clauseId: 'CPS230-BCP-02',
        title: 'Annual Live Unannounced Failover Simulation',
        content: 'Regulated institutions must execute annual live-traffic datacenter severance simulations without prior engineer notice to validate automated cross-region replication.',
      },
    ],
    bankCustomAddenda: {
      cba: {
        sessionTimeout: 'Live Replication Sync (RPO = 0 Seconds)',
        mfaRule: 'Automated DNS Geo-routing upon 30s heartbeat loss',
        customClause: 'CBA Resilience Clause: Dual data centers in Sydney + cold stand-by in Melbourne AWS Dedicated GovCloud.',
        lastModifiedBy: 'David Miller (CBA)',
      },
      nab: {
        sessionTimeout: 'Live Replication Sync (RPO < 1 Second)',
        mfaRule: 'Automated container failover across Kubernetes availability zones',
        customClause: 'NAB Resilience Clause: Redundant physical optical fiber connectivity between Docklands and Sydney exchange.',
        lastModifiedBy: 'Rachel Wong (NAB)',
      },
      wbc: {
        sessionTimeout: 'RPO = 0 Seconds / RTO < 5 Minutes',
        mfaRule: 'Multi-cloud backup running on Microsoft Azure Australia Central',
        customClause: 'Westpac Addendum: Critical batch payroll jobs auto-prioritized in degraded power event.',
        lastModifiedBy: 'Anthony Clarke (Westpac)',
      },
      anz: {
        sessionTimeout: 'RPO = 0 Seconds / RTO < 10 Minutes',
        mfaRule: 'Continuous automated canary testing against live mock traffic',
        customClause: 'ANZ Addendum: Disaster recovery dashboard broadcast to executive board in real-time.',
        lastModifiedBy: 'Elena Rossi (ANZ)',
      },
    },
    artifacts: [
      { id: 'art-bcp1', type: 'Minutes', tag: 'Architecture Minutes', location: 'Logged in Spec', title: 'Q2 Live Chaos Failover Exercise Report', content: 'Simulated Sydney AZ-1 outage with 0 dropped customer transactions and 4.2s DNS failover.' },
    ],
    metricsTable: [
      { metric: 'Core System Uptime (TTM)', target: '99.999%', actual: '99.998%', status: 'Optimal' },
      { metric: 'Recovery Point Objective (RPO)', target: '0s', actual: '0.0s', status: 'Optimal' },
      { metric: 'Recovery Time Objective (RTO)', target: '< 15 min', actual: '4.2 min', status: 'Optimal' },
    ],
    comments: [
      { id: 'c-bcp1', author: 'Sarah Jenkins', avatar: 'SJ', time: '1 week ago', category: 'Minutes', badge: 'Minutes', content: 'APRA CPS 230 operational readiness certification signed off for all 4 member banks.' },
    ],
  },

  // 5. Third-Party Service Provider Controls (CPS 230)
  'third-party-risk': {
    id: 'third-party-risk',
    title: 'Third-Party Cloud & Material Service Provider Controls',
    breadcrumb: 'APRA Prudential Standards / CPS 230 Operational Risk Management • Production',
    latestVersion: 'v1.6.0',
    lastUpdated: 'Sep 05, 2026',
    ownedBy: 'Vendor Risk & Procurement Squad',
    complianceLevel: 'APRA CPS 230.28 / CPS 234 Third-Party',
    visionStatement:
      'Maintain rigorous auditability and exit strategies for all fourth-party dependencies, SaaS vendors, and material cloud infrastructure providers.',
    dependencies: [
      { name: 'Vendor Security Scorecard API', status: 'Healthy' },
      { name: 'Continuous Threat Intelligence Feeds', status: 'Active' },
    ],
    coreFrameworkClauses: [
      {
        clauseId: 'CPS230-TPR-01',
        title: 'Mandatory Right-to-Audit & Information Security Covenants',
        content: 'Contracts with material cloud and fintech service providers must legally mandate APRA access rights, annual SOC2 Type II attestations, and 24-hour breach notification covenants.',
      },
    ],
    bankCustomAddenda: {
      cba: {
        sessionTimeout: 'Annual vendor re-assessment cycle',
        mfaRule: 'Continuous automated vulnerability scoring < 85 triggers review',
        customClause: 'CBA Vendor Addendum: Critical outsourced software escrow required for all proprietary core components.',
        lastModifiedBy: 'David Miller (CBA)',
      },
      nab: {
        sessionTimeout: 'Bi-annual vendor re-assessment cycle',
        mfaRule: 'Mandatory breach notification within 12 hours of discovery',
        customClause: 'NAB Vendor Addendum: Multi-cloud exit strategy tested annually with active mock repatriation.',
        lastModifiedBy: 'Rachel Wong (NAB)',
      },
      wbc: {
        sessionTimeout: 'Quarterly review for top 20 material service providers',
        mfaRule: 'Strict data residency within Australian borders mandated',
        customClause: 'Westpac Vendor Clause: No sub-contracting without prior written authorization by Chief Risk Officer.',
        lastModifiedBy: 'Anthony Clarke (Westpac)',
      },
      anz: {
        sessionTimeout: 'Continuous API-driven vendor risk monitoring',
        mfaRule: 'SOC2 Type II report required every 12 months',
        customClause: 'ANZ Vendor Addendum: Pre-configured container images with isolated network egress filters.',
        lastModifiedBy: 'Elena Rossi (ANZ)',
      },
    },
    artifacts: [
      { id: 'art-tpr1', type: 'Issues', tag: 'Active Issue', location: 'Logged in Spec', title: 'Vendor SOC2 Expiry Alert Tracking', content: 'Automated notifications dispatched to 3 outsourced cloud vendors for updated annual certifications.' },
    ],
    metricsTable: [
      { metric: 'Material Vendors with Active SOC2', target: '100%', actual: '100.0%', status: 'Optimal' },
      { metric: 'Average Vendor Risk Score', target: '> 90', actual: '94.2', status: 'Optimal' },
      { metric: 'Avg Breach Notification Time', target: '< 24h', actual: '4.8h', status: 'Compliant' },
    ],
    comments: [
      { id: 'c-tpr1', author: 'Marcus Vance', avatar: 'MV', time: '4 days ago', category: 'Review', badge: 'Review', content: 'Fourth-party concentration risk assessment completed for Australian AWS and Azure regions.' },
    ],
  },

  // 6. APP 11: Security & Destruction of PII
  'data-retention-privacy': {
    id: 'data-retention-privacy',
    title: 'APP 11: Security, Retention & Destruction of Customer PII',
    breadcrumb: 'Privacy & Customer Data Governance / Australian Privacy Principles (APP 1-13) • Gov Approved',
    latestVersion: 'v4.0.1',
    lastUpdated: 'Sep 22, 2026',
    ownedBy: 'Data Governance & Regulatory Squad',
    complianceLevel: 'Privacy Act 1988 / APRA CPS 234 / CDR Reg 7.10',
    visionStatement:
      'Mandate strict de-identification, sovereign encryption, and cryptographic erasure of customer identifiable financial information once statutory retention periods expire.',
    dependencies: [
      { name: 'KMS Sovereign Vault (Sydney)', status: 'Healthy' },
      { name: 'Automated Purge Scheduler', status: 'Active (Daily)' },
      { name: 'Regulatory Audit Pipeline', status: 'Verified' },
    ],
    coreFrameworkClauses: [
      {
        clauseId: 'APP11-01',
        title: 'Master Statutory Retention Baseline (7 Years)',
        content: 'Under Corporations Act 2001 & AML/CTF Rules, primary financial transaction ledgers and customer KYC identification records must be retained for exactly 7 years following account closure.',
      },
      {
        clauseId: 'APP11-02',
        title: 'Irrevocable De-identification on Expiry',
        content: 'Upon reaching statutory expiry date + 30 days grace window, all direct identifiers (TFN, passport, residential address) must undergo cryptographic one-way salted hashing or DoD-standard erasure.',
      },
    ],
    bankCustomAddenda: {
      cba: {
        sessionTimeout: '7 Years + 60 Days Internal Audit Freeze',
        mfaRule: 'Tier-3 Compliance Officer Clearance for TFN Lookups',
        customClause: 'CBA Privacy Addendum 3.1: Retention of marketing clickstream data truncated to 90 days post-campaign termination.',
        lastModifiedBy: 'Claire Evans (CBA Data Protection Officer)',
      },
      nab: {
        sessionTimeout: '7 Years + 30 Days Standard Purge',
        mfaRule: 'Double Officer Approval for Customer Data Export',
        customClause: 'NAB Retention Addendum 1.8: Immediate sanitization of temporary customer upload files within 24h of document OCR verification.',
        lastModifiedBy: 'Jonathan Wu (NAB Legal Risk)',
      },
      wbc: {
        sessionTimeout: '7 Years + 45 Days Cold Archive Buffer',
        mfaRule: 'Executive Approval for Cross-Border Cloud Access',
        customClause: 'Westpac Privacy Clause 5: Redundant backups in secondary Sydney data center encrypted with isolated tenant keys.',
        lastModifiedBy: 'Samantha Kelly (Westpac InfoSec)',
      },
      anz: {
        sessionTimeout: '7 Years Exact',
        mfaRule: 'Zero-Trust Biometric Confirmation for PII Access',
        customClause: 'ANZ Customer Trust Addendum: Automated notification sent to customer 30 days prior to final account archive deletion.',
        lastModifiedBy: 'Michael Chang (ANZ Governance)',
      },
    },
    artifacts: [
      { id: 'art-p1', type: 'Training', tag: 'Training Note', location: 'Logged in Spec', title: 'Customer PII Sanitization Batch Pipeline', content: 'Handbook for batch sanitization workers operating against historical loan archival clusters.' },
    ],
    metricsTable: [
      { metric: 'Purge Success Rate', target: '100%', actual: '100.0%', status: 'Optimal' },
      { metric: 'Unencrypted PII Leaks', target: '0', actual: '0 (Zero)', status: 'Optimal' },
      { metric: 'Statutory Retention Drift', target: '< 0.01%', actual: '0.00%', status: 'Compliant' },
    ],
    comments: [
      { id: 'cp-1', author: 'Marcus Vance', avatar: 'MV', time: '3 hours ago', category: 'Minutes', badge: 'Minutes', content: 'Annual OAIC privacy audit readiness confirmed. Master locked clauses align with Australian Privacy Act 1988 amendments.' },
    ],
  },

  // 7. Open Banking CDR Consent Lifecycle
  'open-banking-cdr': {
    id: 'open-banking-cdr',
    title: 'Open Banking CDR Consumer Consent Lifecycle & Sharing',
    breadcrumb: 'Privacy & Customer Data Governance / Australian Privacy Principles (APP 1-13) • Production',
    latestVersion: 'v3.2.0',
    lastUpdated: 'Aug 29, 2026',
    ownedBy: 'Open Banking & API Engineering',
    complianceLevel: 'ACCC CDR Rules / CDR Privacy Safeguards',
    visionStatement:
      'Deliver transparent, consumer-directed financial data sharing with real-time consent dashboards and instant revocation capabilities under the Consumer Data Right regime.',
    dependencies: [
      { name: 'ACCC CDR Register API', status: 'Healthy' },
      { name: 'CDR Dynamic Client Registration (DCR)', status: 'Active' },
    ],
    coreFrameworkClauses: [
      {
        clauseId: 'CDR-CON-01',
        title: 'Explicit Granular Consent & 12-Month Expiry',
        content: 'Consent for Open Banking data sharing must be explicit, unbundled from general terms, and automatically expire after a maximum duration of 12 calendar months.',
      },
      {
        clauseId: 'CDR-CON-02',
        title: 'Instant One-Click Consent Revocation',
        content: 'Consumers must be provided a permanent consent management dashboard in mobile and web banking to revoke third-party accredited data recipient access within < 2 seconds.',
      },
    ],
    bankCustomAddenda: {
      cba: {
        sessionTimeout: '90 Days Inactive ADR Consent Re-confirmation',
        mfaRule: 'Biometric authorization required to establish new CDR sharing arrangement',
        customClause: 'CBA CDR Addendum: Automated push notification summary sent to customer upon quarterly data pull.',
        lastModifiedBy: 'David Miller (CBA)',
      },
      nab: {
        sessionTimeout: '180 Days Inactive ADR Consent Check',
        mfaRule: 'Step-up OTP for sharing transaction history > 2 years',
        customClause: 'NAB CDR Addendum: Real-time fraud detection filters applied against unregistered third-party scraper user-agents.',
        lastModifiedBy: 'Rachel Wong (NAB)',
      },
      wbc: {
        sessionTimeout: '90 Days Inactive Check',
        mfaRule: 'In-app notification confirmation on ADR token generation',
        customClause: 'Westpac CDR Clause: Instant notification to joint account holders when one party establishes CDR sharing.',
        lastModifiedBy: 'Anthony Clarke (Westpac)',
      },
      anz: {
        sessionTimeout: '120 Days Inactive Check',
        mfaRule: 'Passkey authentication required for business CDR consent',
        customClause: 'ANZ CDR Clause: Dedicated corporate dashboard for managing multi-entity sharing authorizations.',
        lastModifiedBy: 'Elena Rossi (ANZ)',
      },
    },
    artifacts: [
      { id: 'art-cdr1', type: 'Training', tag: 'Training Note', location: 'Logged in Spec', title: 'CDR Dynamic Client Registration Onboarding', content: 'Engineering guide for validating accredited data recipient mTLS certificates against ACCC central directory.' },
    ],
    metricsTable: [
      { metric: 'CDR API Availability', target: '> 99.5%', actual: '99.98%', status: 'Optimal' },
      { metric: 'Average Consent Revocation Latency', target: '< 2s', actual: '0.4s', status: 'Optimal' },
      { metric: 'ACCC Conformance Test Pass Rate', target: '100%', actual: '100.0%', status: 'Compliant' },
    ],
    comments: [
      { id: 'c-cdr1', author: 'Sarah Chen', avatar: 'SC', time: '2 days ago', category: 'Review', badge: 'Review', content: 'ACCC CDR Conformance suite v2.4 passed with 100% score across all retail deposit endpoints.' },
    ],
  },

  // 8. Threshold Transaction Reporting (AUSTRAC)
  'aml-threshold-reporting': {
    id: 'aml-threshold-reporting',
    title: 'Threshold Transaction Reporting (TTR & SMR Rules)',
    breadcrumb: 'AML/CTF & Financial Crime (AUSTRAC) / Transaction Monitoring & KYC • Production',
    latestVersion: 'v3.0.0',
    lastUpdated: 'Sep 12, 2026',
    ownedBy: 'Financial Crime & AML Compliance Squad',
    complianceLevel: 'AML/CTF Act 2006 / AUSTRAC Rule 19',
    visionStatement:
      'Automate the detection, queuing, and secure transmission of Significant Cash Transactions ($10,000+ AUD) and Suspicious Matter Reports (SMRs) to AUSTRAC within statutory deadlines.',
    dependencies: [
      { name: 'AUSTRAC Online B2B API Gateway', status: 'Healthy' },
      { name: 'Core Ledger Real-Time Stream Filter', status: 'Active' },
    ],
    coreFrameworkClauses: [
      {
        clauseId: 'AML-TTR-01',
        title: 'Statutory 10-Day Threshold Transaction Submission',
        content: 'All physical cash deposits, withdrawals, or foreign currency exchanges equivalent to $10,000 AUD or more must be automatically logged and reported to AUSTRAC within 10 business days.',
      },
      {
        clauseId: 'AML-SMR-02',
        title: '24-Hour Expedited Suspicious Matter Reporting',
        content: 'Transactions suspected of terrorism financing or immediate criminal proceeds must be filed with AUSTRAC within 24 hours of suspicion formation, with strict tipping-off prevention controls.',
      },
    ],
    bankCustomAddenda: {
      cba: {
        sessionTimeout: 'Automated batch dispatch every 24 hours',
        mfaRule: 'Dual-officer sign-off for SMR narrative filing',
        customClause: 'CBA AML Addendum: Enhanced due diligence triggered automatically for cumulative transactions > $50,000 over 7 days.',
        lastModifiedBy: 'David Miller (CBA)',
      },
      nab: {
        sessionTimeout: 'Real-time TTR message staging queue',
        mfaRule: 'Senior Compliance Officer clearance for filing exceptions',
        customClause: 'NAB AML Addendum: Machine-learning structuring detection algorithm scans rapid serial ATM cash deposits.',
        lastModifiedBy: 'Rachel Wong (NAB)',
      },
      wbc: {
        sessionTimeout: 'Immediate transmission for high-risk corridors',
        mfaRule: 'Executive Risk escalation for sanctions hits',
        customClause: 'Westpac AML Clause: Real-time cross-checking with international PEP databases.',
        lastModifiedBy: 'Anthony Clarke (Westpac)',
      },
      anz: {
        sessionTimeout: 'Automated daily reconciliation against branch ledgers',
        mfaRule: 'Two-tier verification for foreign currency exchanges > $25k',
        customClause: 'ANZ AML Addendum: Automated alert suppression logging for audited institutional accounts.',
        lastModifiedBy: 'Elena Rossi (ANZ)',
      },
    },
    artifacts: [
      { id: 'art-aml1', type: 'Training', tag: 'Training Note', location: 'Logged in Spec', title: 'Tipping-Off Prohibition Guidelines', content: 'Mandatory refresher on Section 123 of AML/CTF Act prohibiting disclosure of SMR filings to customers.' },
    ],
    metricsTable: [
      { metric: 'TTR On-Time Filing Rate', target: '100%', actual: '100.0%', status: 'Optimal' },
      { metric: 'SMR 24h Compliance Rate', target: '100%', actual: '100.0%', status: 'Optimal' },
      { metric: 'AUSTRAC API Batch ACK Time', target: '< 10s', actual: '1.4s', status: 'Optimal' },
    ],
    comments: [
      { id: 'c-aml1', author: 'Marcus Vance', avatar: 'MV', time: '1 day ago', category: 'Minutes', badge: 'Minutes', content: 'Annual AUSTRAC compliance return submitted. Zero late TTR filings recorded for the financial year.' },
    ],
  },

  // 9. Real-Time Sanctions Screening
  'sanctions-screening': {
    id: 'sanctions-screening',
    title: 'Real-Time Sanctions Screening & Asset Freezing',
    breadcrumb: 'AML/CTF & Financial Crime (AUSTRAC) / Transaction Monitoring & KYC • Production',
    latestVersion: 'v2.2.4',
    lastUpdated: 'Sep 18, 2026',
    ownedBy: 'Sanctions & Global Watchlist Squad',
    complianceLevel: 'Autonomous Sanctions Act 2011 / DFAT / UN Sanctions',
    visionStatement:
      'Execute sub-millisecond screening of all incoming and outgoing domestic/cross-border payment instructions against Consolidated Sanctions Lists (DFAT, OFAC, EU, UN).',
    dependencies: [
      { name: 'DFAT Consolidated Sanctions Sync Engine', status: 'Active (Hourly)' },
      { name: 'Fuzzy Matching Scoring Engine (Levenshtein/Jaro)', status: 'Healthy' },
    ],
    coreFrameworkClauses: [
      {
        clauseId: 'SANC-01',
        title: 'Zero Tolerance Real-Time Payment Interception',
        content: 'All payment instructions (NPP, SWIFT, RTGS) must pass through real-time sanctions filtering prior to final ledger settlement. Definite matches must trigger automated transaction freezing.',
      },
    ],
    bankCustomAddenda: {
      cba: {
        sessionTimeout: 'Hourly sanctions delta database sync',
        mfaRule: 'Sanctions officer override requires level-4 clearance',
        customClause: 'CBA Sanctions Rule: Secondary automated phonetics filter applied to transliterated names.',
        lastModifiedBy: 'David Miller (CBA)',
      },
      nab: {
        sessionTimeout: 'Continuous webhook sync from DFAT repository',
        mfaRule: 'Immediate alert broadcast to Global Financial Crime Operations',
        customClause: 'NAB Sanctions Rule: Real-time vessel and aircraft IMO tracking for trade finance transactions.',
        lastModifiedBy: 'Rachel Wong (NAB)',
      },
      wbc: {
        sessionTimeout: 'Real-time fuzzy threshold set to 85% match confidence',
        mfaRule: 'Two-officer sign-off for false-positive release',
        customClause: 'Westpac Sanctions Clause: Automated hold on international wires referencing high-risk jurisdictions.',
        lastModifiedBy: 'Anthony Clarke (Westpac)',
      },
      anz: {
        sessionTimeout: 'Daily comprehensive full-database re-indexing',
        mfaRule: 'Zero manual override allowed on designated terrorist entity matches',
        customClause: 'ANZ Sanctions Clause: Instant freeze notification to Australian Federal Police liaison.',
        lastModifiedBy: 'Elena Rossi (ANZ)',
      },
    },
    artifacts: [
      { id: 'art-sanc1', type: 'Issues', tag: 'Active Issue', location: 'Logged in Spec', title: 'DFAT List Schema Delta Update', content: 'Updated parser to handle new maritime sanction identifiers published by Department of Foreign Affairs.' },
    ],
    metricsTable: [
      { metric: 'Sanctions Screening Latency', target: '< 15ms', actual: '6.4ms', status: 'Optimal' },
      { metric: 'False Positive Match Rate', target: '< 1.5%', actual: '0.62%', status: 'Optimal' },
      { metric: 'Sanctions List Freshness', target: '< 2 hours', actual: '18 min', status: 'Optimal' },
    ],
    comments: [
      { id: 'c-sanc1', author: 'Alex Rivera', avatar: 'AR', time: '5 hours ago', category: 'Notes', badge: 'Training', content: 'Fuzzy matching latency optimized to 6.4ms average on SWIFT wire stream.' },
    ],
  },

  // 10. New Payments Platform (NPP) Rails
  'npp-payid-rules': {
    id: 'npp-payid-rules',
    title: 'New Payments Platform (NPP) & PayID Settlement Rails',
    breadcrumb: 'Payment Rails & API Infrastructure / Payment Gateways & Throttling • Production',
    latestVersion: 'v2.5.0',
    lastUpdated: 'Sep 20, 2026',
    ownedBy: 'Payments Engine Core Squad',
    complianceLevel: 'NPP Australia Operating Rules / ISO 20022 / RBA',
    visionStatement:
      'Enable instant 24/7/365 fund settlement with PayID alias resolution, ISO 20022 rich data remittance, and Confirmation of Payee fraud prevention.',
    dependencies: [
      { name: 'NPP Basic Infrastructure (NPP-BI) Gateway', status: 'Healthy' },
      { name: 'PayID Addressing Service (NPP-AS)', status: 'Active' },
      { name: 'Confirmation of Payee (CoP) Name Matcher', status: 'Healthy' },
    ],
    coreFrameworkClauses: [
      {
        clauseId: 'NPP-OPS-01',
        title: 'Mandatory 60-Second End-to-End Settlement Timeout',
        content: 'NPP fast payment messages must clear between participating financial institutions and credit the beneficiary account within a maximum 60-second operational window.',
      },
      {
        clauseId: 'NPP-COP-02',
        title: 'Confirmation of Payee (CoP) Name Matching Mandate',
        content: 'Prior to fund transfer execution, the sending bank must display the verified account title returned by the receiving institution to prevent authorized push payment (APP) fraud.',
      },
    ],
    bankCustomAddenda: {
      cba: {
        sessionTimeout: 'Default max single payment limit $20,000 AUD',
        mfaRule: 'FIDO2 biometric challenge for first-time PayID payee',
        customClause: 'CBA NPP Addendum: Name-Check algorithm warns customer if payee account name has low similarity.',
        lastModifiedBy: 'David Miller (CBA)',
      },
      nab: {
        sessionTimeout: 'Default max single payment limit $25,000 AUD',
        mfaRule: '24-hour delay for high-risk novel PayID transfers > $5,000',
        customClause: 'NAB NPP Addendum: Real-time scam detection score calculated prior to message dispatch.',
        lastModifiedBy: 'Rachel Wong (NAB)',
      },
      wbc: {
        sessionTimeout: 'Default max single payment limit $20,000 AUD',
        mfaRule: 'Customer phone confirmation for transactions flagged by risk engine',
        customClause: 'Westpac NPP Clause: Instant PayID locking if account flagged for suspicious activity.',
        lastModifiedBy: 'Anthony Clarke (Westpac)',
      },
      anz: {
        sessionTimeout: 'Default max single payment limit $30,000 AUD',
        mfaRule: 'Passkey verification for daily transfer limit adjustments',
        customClause: 'ANZ NPP Clause: ISO 20022 structured remittance data automated invoice matching for business clients.',
        lastModifiedBy: 'Elena Rossi (ANZ)',
      },
    },
    artifacts: [
      { id: 'art-npp1', type: 'Training', tag: 'Training Note', location: 'Logged in Spec', title: 'ISO 20022 Message Schema Reference', content: 'Developer guide for constructing pacs.008 credit transfer and pacs.002 payment status report XML payloads.' },
    ],
    metricsTable: [
      { metric: 'Avg Settlement Round-Trip Time', target: '< 3s', actual: '1.1s', status: 'Optimal' },
      { metric: 'Confirmation of Payee Hit Rate', target: '> 99%', actual: '99.8%', status: 'Optimal' },
      { metric: 'NPP Gateway Availability', target: '99.99%', actual: '99.995%', status: 'Optimal' },
    ],
    comments: [
      { id: 'c-npp1', author: 'Sarah Chen', avatar: 'SC', time: '1 day ago', category: 'Review', badge: 'Review', content: 'Confirmation of Payee protocol integration complete across all retail banking apps.' },
    ],
  },

  // 11. Merchant API Rate Limiting & Throttling
  'rate-limiting-api': {
    id: 'rate-limiting-api',
    title: 'Merchant & Open Banking API Rate Limiting & Throttling',
    breadcrumb: 'Payment Rails & API Infrastructure / Payment Gateways & Throttling • Production',
    latestVersion: 'v2.1.0',
    lastUpdated: 'Sep 18, 2026',
    ownedBy: 'API Platform Engineering Squad',
    complianceLevel: 'APRA CPS 234 / Open Banking API Standards',
    visionStatement:
      'Safeguard core banking APIs against Layer-7 DDoS, credential stuffing, and runaway merchant batch processes using token-bucket rate limiting and adaptive IP throttling.',
    dependencies: [
      { name: 'Kong / Envoy Cloud Gateway Cluster', status: 'Healthy' },
      { name: 'Redis Distributed Rate Counter', status: '99.99% Uptime' },
      { name: 'AWS Shield Advanced / Cloudflare WAF', status: 'Active' },
    ],
    coreFrameworkClauses: [
      {
        clauseId: 'RATE-01',
        title: 'Token Bucket Algorithmic Rate Limiting',
        content: 'Public open banking endpoints must enforce per-client rate quotas of 1,200 requests/minute with exponential backoff HTTP 429 response headers (Retry-After).',
      },
      {
        clauseId: 'RATE-02',
        title: 'Adaptive IP Reputation & DDoS Mitigation',
        content: 'Sudden volumetric spikes exceeding 500% baseline threshold within 10 seconds shall automatically transition client traffic to managed CAPTCHA challenges or drop connections.',
      },
    ],
    bankCustomAddenda: {
      cba: {
        sessionTimeout: '2,500 req/min for DirectConnect Treasury clients',
        mfaRule: 'Mutual TLS (mTLS) certificate mandatory for all high-volume APIs',
        customClause: 'CBA Rate Limit Addendum: Dedicated dedicated IP bandwidth allocation for priority corporate payroll gateways.',
        lastModifiedBy: 'David Miller (CBA)',
      },
      nab: {
        sessionTimeout: '2,000 req/min for Enterprise Merchant clients',
        mfaRule: 'API key rotation every 90 days enforced via automated webhook',
        customClause: 'NAB Rate Limit Addendum: Sandboxed test tenants throttled to 300 req/min to protect staging clusters.',
        lastModifiedBy: 'Rachel Wong (NAB)',
      },
      wbc: {
        sessionTimeout: '3,000 req/min for Institutional FX feeds',
        mfaRule: 'Dual-officer approval required to increase default API quotas',
        customClause: 'Westpac Rate Limit Clause: Automated failover to secondary Australian East availability zone upon 3 consecutive 5xx errors.',
        lastModifiedBy: 'Anthony Clarke (Westpac)',
      },
      anz: {
        sessionTimeout: '2,500 req/min for Commercial Banking clients',
        mfaRule: 'Hardware HSM client certificate binding required',
        customClause: 'ANZ Rate Limit Clause: Real-time telemetry streaming to bank fraud analysis engine.',
        lastModifiedBy: 'Elena Rossi (ANZ)',
      },
    },
    artifacts: [
      { id: 'art-rate1', type: 'Training', tag: 'Training Note', location: 'Logged in Spec', title: 'HTTP 429 Handling Best Practices', content: 'Client integration handbook for implementing exponential backoff jitter in merchant webhook consumers.' },
    ],
    metricsTable: [
      { metric: 'Gateway Ingress Latency (P99)', target: '< 5ms', actual: '1.8ms', status: 'Optimal' },
      { metric: 'DDoS Attack Block Rate', target: '100%', actual: '100.0%', status: 'Optimal' },
      { metric: 'Redis Counter Sync Jitter', target: '< 2ms', actual: '0.4ms', status: 'Optimal' },
    ],
    comments: [
      { id: 'c-rate1', author: 'Alex Rivera', avatar: 'AR', time: '6 hours ago', category: 'Review', badge: 'Review', content: 'Scaled Envoy gateway cluster to handle expected end-of-month commercial payroll traffic surge.' },
    ],
  },
};

export const auditHistoryLogs = [
  {
    id: 'log-1',
    timestamp: 'Today, 2:15 PM',
    actor: 'David Miller (CBA)',
    action: 'Updated Bank Policy Addendum',
    target: 'OAuth 2.0 & Single Sign-On (SSO)',
    detail: 'Hardware token requirement added for HNW branch impersonation sessions.',
  },
  {
    id: 'log-2',
    timestamp: 'Yesterday, 4:30 PM',
    actor: 'Sarah Jenkins (Library Admin)',
    action: 'Published Master Specification v3.1.2',
    target: 'APRA CPS 234 Information Security',
    detail: 'Mandatory PKCE RFC 7636 asymmetric signing baseline updated.',
  },
  {
    id: 'log-3',
    timestamp: 'Sep 22, 2026',
    actor: 'Rachel Wong (NAB)',
    action: 'Updated Step-Up Trigger Condition',
    target: 'APP 11: Security & Destruction of PII',
    detail: 'Double officer approval threshold configured for customer archive downloads.',
  },
  {
    id: 'log-4',
    timestamp: 'Sep 20, 2026',
    actor: 'Anthony Clarke (Westpac)',
    action: 'Configured PayID Fast Settlement Limit',
    target: 'New Payments Platform (NPP) Rails',
    detail: 'Single fast payment limit set to $20,000 AUD with Confirmation of Payee verification.',
  },
];

export const bankingHierarchy = initialBankingHierarchy;
export const policiesDatabase = initialPoliciesDatabase;

