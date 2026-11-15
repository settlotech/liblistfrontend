export const DEFAULT_POLICIES = [
  // 1. Credit Cards Library (2 policies)
  {
    id: 'credit-card-limits-policy',
    department_id: 'credit-cards',
    department_name: 'Credit Cards',
    title: 'Credit Card Issuance & Daily Limit Policy',
    product_category: 'Credit Cards',
    is_product: true,
    summary: 'Master product policy governing tiered approval thresholds, mandatory KYC/credit score verification, and direct in-system operational specifications.',
    version: '1.2',
    status: 'active',
    is_masked: false,
    content: `1. Purpose & Product Scope
This master product policy outlines the mandatory criteria, authorization limits, and direct in-system operational documents for underwriting, approving, and activating consumer credit cards for Commonwealth Bank of Australia (CBA).

2. Operational Rules & Mandatory Verifications
1. **Applicant Eligibility**: Minimum age 18 years, Australian resident, minimum ongoing gross income of $35,000 per annum.
2. **Comprehensive Credit Check**: Credit report verification via Equifax. Applications with credit scores below 620 require supervisory review.
3. **Identity Verification (KYC)**: Biometric digital ID or 100-point physical verification before card issuance.
4. **Approval Threshold Limits**:
   - Tier 1 Standard Card: Maximum single credit limit of $5,000 (automated approval eligible).
   - Tier 2 Gold/Platinum Card: Up to $15,000 (Requires Credit Officer sign-off).
   - Tier 3 Diamond / Executive: Up to $50,000 (Requires Department Manager approval).

3. Turnaround SLA & Compliance Monitoring
All standard consumer applications must be adjudicated within 24 hours of document submission. Escalated applications must resolve within 48 business hours.`,
    parameters: {
      approval_limits: {
        officer_cap: '$5,000',
        manager_cap: '$15,000',
        executive_cap: '$50,000'
      },
      turnaround_sla: '24 Hours',
      verification_steps: [
        'Digital KYC 100-Point Identity Verification',
        'Equifax Comprehensive Credit History Score >= 620',
        '30-Day Pay Slip & Bank Account Income Verification',
        'Serviceability Buffer Calculation (+3.0% over active rate)'
      ]
    },
    direct_documents: [
      {
        id: 'crd-doc-01',
        code: 'CBA-DOC-001',
        title: 'Core Credit Card Issuance & Underwriting Specification',
        type: 'Direct In-System Doc',
        status: 'Active',
        version: 'v1.2',
        summary: 'Mandatory verification thresholds for gross salary verification, HEM living expense benchmarks, and +3.0% interest rate serviceability buffer.'
      },
      {
        id: 'crd-doc-02',
        code: 'CBA-SOP-002',
        title: 'Digital KYC & Instant Card Provisioning Procedure',
        type: 'Standard Operating Procedure',
        status: 'Active',
        version: 'v1.0',
        summary: 'Step-by-step biometric face liveness matching (>=92%), DVS passport/driver licence cross-match, and instant Apple/Google Wallet provisioning.'
      },
      {
        id: 'crd-doc-03',
        code: 'CBA-LMT-003',
        title: 'Daily Spending Limits & Escalation Ceiling Matrix',
        type: 'Operational Limits Schedule',
        status: 'Active',
        version: 'v2.1',
        summary: 'Daily ATM cash advance limits ($1,000 AUD), contactless tap-and-go ceiling ($200 AUD without PIN), and merchant category code (MCC) fraud blocking.'
      }
    ],
    created_by: 'Sarah Jenkins (Maker)',
    updated_at: new Date().toISOString()
  },
  {
    id: 'credit-card-rewards-sop',
    department_id: 'credit-cards',
    department_name: 'Credit Cards',
    title: 'Revolving Credit Line & Card Activation Standard',
    product_category: 'Credit Cards',
    summary: 'Procedures for digital wallet tokenization, revolving balance risk buffers, and instant credit limit adjustments.',
    version: '1.1',
    status: 'active',
    is_masked: false,
    content: `1. Card Activation & Tokenization
Governs instant card provisioning into Apple Wallet, Google Pay, and physical chip card PIN generation.

2. Revolving Credit Facility Guidelines
1. **Automated Risk Monitoring**: Daily review of revolving credit utilization (>85% triggers early warning flags).
2. **Limit Increase Requests**: Require 6 months on-time payment track record before eligibility.
3. **Emergency Limit Blocks**: Suspicious transactions trigger automated SMS confirmation and transient card lock.`,
    parameters: {
      approval_limits: {
        officer_cap: '$10,000',
        manager_cap: '$25,000'
      },
      turnaround_sla: '4 Hours',
      verification_steps: [
        'Automated 3-Factor Digital Device Binding',
        'NPP Real-time PayID Activation Check',
        'SMS One-Time Passcode Authorization'
      ]
    },
    created_by: 'Marcus Vance (Approver)',
    updated_at: new Date().toISOString()
  },

  // 2. Retail Lending Library (2 policies)
  {
    id: 'personal-loans-assessment-sop',
    department_id: 'retail-lending',
    department_name: 'Retail Lending',
    title: 'Personal Loans & Overdraft Assessment Procedure',
    summary: 'Standard underwriting guidelines for unsecured personal loans, car loans, and revolving overdraft lines.',
    version: '1.1',
    status: 'active',
    is_masked: false,
    content: `1. Underwriting Principles
Governs credit assessment for unsecured personal loans up to $75,000 AUD, vehicle loans, and overdraft limits across retail branch networks.

2. Key Criteria
1. **Employment Stability**: Minimum 6 months continuous employment with current employer.
2. **Debt-to-Income (DTI)**: Maximum aggregate DTI of 6.0x across all credit liabilities.
3. **HEM Benchmark**: Living expense verification comparing declared customer expenses against Household Expenditure Measure (HEM).`,
    parameters: {
      approval_limits: {
        officer_cap: '$10,000',
        manager_cap: '$30,000',
        executive_cap: '$75,000'
      },
      turnaround_sla: '48 Hours',
      verification_steps: [
        'Employment & 2-Month Proof of Continuous Income',
        'Comprehensive Credit Report Check (CCR)',
        'Debt-to-Income (DTI) Ratio <= 6x Benchmark',
        'Living Expense Assessment via Transaction Categorization'
      ]
    },
    created_by: 'Marcus Vance (Approver)',
    updated_at: new Date().toISOString()
  },
  {
    id: 'mortgage-underwriting-standard',
    department_id: 'retail-lending',
    department_name: 'Retail Lending',
    title: 'Residential Mortgages & Tier-1 Home Loan Assessment Standard',
    summary: 'Regulatory assessment benchmarks for owner-occupied and investor residential mortgages under APRA APS 220 directives.',
    version: '2.0',
    status: 'active',
    is_masked: false,
    content: `### Phase 1: Scope & Prudential Mandate
Applies to all retail mortgage originations across branch, online, and broker channels adhering to APRA APS 220 credit risk standards.

### Phase 2: Mandatory Underwriting Thresholds
1. **Serviceability Buffer**: Mandatory minimum +3.00% interest rate buffer applied over the standard variable rate.
2. **Loan-to-Value Ratio (LVR)**: LVR exceeding 80% requires Lenders Mortgage Insurance (LMI) validation.
3. **Genuine Savings**: Minimum 5% verified genuine savings held for at least 3 continuous months.`,
    parameters: {
      approval_limits: {
        officer_cap: '$500,000',
        manager_cap: '$1,200,000',
        executive_cap: '$2,500,000'
      },
      turnaround_sla: '72 Hours',
      verification_steps: [
        '3-Month Genuine Savings Bank Statement Verification',
        'Valuation Report via CoreLogic Electronic Valuation (EVR)',
        'HEM Living Expense Cross-Verification',
        'Title Deed & Encumbrance Check via PEXA'
      ],
      compliance_tags: ['APRA APS 220', 'LMI Validation', 'Genuine Savings'],
      phases: [
        {
          id: 'phase-1',
          phase_number: 1,
          title: 'Scope & Prudential Mandate',
          summary: 'APRA APS 220 credit risk standards across all mortgage origination channels.',
          key_rules: ['Branch, online, and broker channels', 'APRA APS 220 compliance'],
          content: 'Applies to all retail mortgage originations across branch, online, and broker channels adhering to APRA APS 220 credit risk standards.'
        },
        {
          id: 'phase-2',
          phase_number: 2,
          title: 'Mandatory Underwriting Thresholds',
          summary: '+3.00% interest rate buffer, LMI validation over 80% LVR, and 3-month genuine savings.',
          key_rules: ['+3.00% buffer over active rate', 'LMI required for LVR > 80%', '5% genuine savings for 3 months'],
          content: '1. Serviceability Buffer: Mandatory minimum +3.00% interest rate buffer applied over the standard variable rate.\n2. Loan-to-Value Ratio (LVR): LVR exceeding 80% requires Lenders Mortgage Insurance (LMI) validation.\n3. Genuine Savings: Minimum 5% verified genuine savings held for at least 3 continuous months.'
        }
      ]
    },
    created_by: 'Sarah Jenkins (Bank Employee)',
    updated_at: new Date().toISOString()
  },

  // Authoritative PDF Template: Home Loan Valuations (from docks/hl_valuation.pdf)
  {
    id: 'hl-valuation-policy',
    department_id: 'retail-lending',
    department_name: 'Retail Lending',
    title: 'Home Loan Valuations Policy',
    summary: 'Establishes a consistent and prudent framework for the valuation of residential properties used as security for home loans to assess lending risk, ensure APRA APS 220 compliance, and protect the interests of both the lender and borrowers.',
    version: '1.0',
    status: 'active',
    is_masked: false,
    content: `### Phase 1: Purpose & Governance Scope
Valuation is a critical step in mortgage lending. Accurate assessment of the collateral value determines the risk coverage. The purpose of this policy is to establish a consistent and prudent framework for the valuation of residential properties used as security for home loans under APRA APS 220 prudential governance.

#### Operational Scope
This policy applies to:
- All residential home loan applications and consumer mortgage originations.
- New property purchases (off-the-plan, existing residential, and vacant land).
- Refinancing transactions from other accredited Authorized Deposit-taking Institutions (ADIs).
- Construction and renovation loans requiring progress draws.
- Loan variations, top-up applications, and equity release facilities.
- Portfolio reviews and ongoing prudential risk monitoring.

### Phase 2: Underwriting Principles & Prudence Rules
All residential properties offered as security for a home loan must be independently valued to ensure that the property's market value adequately supports the proposed lending exposure.

#### 1. Independence Principle
Valuers must be completely independent of the borrower, mortgage broker, loan assessor, and approving credit authority. Borrowers and intermediaries must never influence the valuation outcome or select individual valuers directly.

#### 2. Objectivity & Market Evidence
Valuation assessments must be based strictly on market evidence, verified comparable sales, and professional certified valuer judgment. Unsupported assumptions or subjective personal opinions are strictly prohibited.

#### 3. Prudence Rule (Lowest-Value Standard)
Lending decisions and Loan-to-Value Ratio (LVR) determinations must strictly be based on the lower of:
1. The negotiated Purchase Price; or
2. The Assessed Fair Market Value from the independent valuation.

### Phase 3: Approved Valuation Methods & Thresholds
The bank authorizes four distinct valuation tiers based on property complexity, exposure, and risk profile:

#### 1. Full Valuation (Physical Internal & External Inspection)
Carried out by an approved panel valuer with comprehensive internal and external physical property inspection. Mandatory under the following conditions:
- Loan-to-Value Ratio (LVR) exceeds 80%.
- Construction or development loans requiring staged progress drawdowns.
- Unique, high-end, or specialized properties (acreage, rural residential, heritage).
- High-value properties exceeding delegated officer caps (> $2,000,000 AUD).
- Heightened risk indicators or adverse environmental/zoning flags.

#### 2. Desktop Valuation
Conducted using external mapping, digital imagery, and recent market transactions without physical entry. Permitted subject to Credit Team sign-off for:
- Low-to-medium risk residential lending.
- Established residential properties in metropolitan and high-liquidity suburbs.
- Refinancing applications with LVR <= 80%.

#### 3. Automated Valuation Models (AVM)
Algorithmic statistical assessment via CoreLogic / EVR. Permitted only where:
- Property value is below institution cap ($1,500,000 AUD).
- Property type is standard detached residential or low-density strata.
- LVR does not exceed 75% with zero negative credit marks.

#### 4. Drive-thru / Kerbside Valuation
External roadside inspection used when limited internal inspection is considered acceptable and additional physical assurance is required beyond a desktop valuation.

### Phase 4: Validity Periods & Turnaround SLAs
Credit assessments and loan documentation can only rely on valuations within their statutory validity shelf-life:

| Valuation Type | Validity in Days | Turnaround SLA |
| :--- | :--- | :--- |
| **Full Valuation** | **90 Calendar Days** | 48 Business Hours |
| **Desktop Valuation** | **90 Calendar Days** | 24 Business Hours |
| **Automated Valuation Models (AVM)** | **30 Calendar Days** | Real-time (Instant) |
| **Drive-thru / Kerbside** | **60 Calendar Days** | 24 Business Hours |

#### Mandatory Re-valuation Triggers
A new or updated valuation is automatically triggered and required before settlement if:
1. The statutory validity period (90 days for full/desktop, 30 days for AVM) expires prior to loan settlement.
2. Macroeconomic property market conditions deteriorate significantly (> 5% suburb-level decline).
3. Material physical changes, severe weather damage, or unauthorized alterations occur to the security property.
4. Additional lending or loan variation is requested after initial credit approval.

### Phase 5: Verification Checklist & System Event Telemetry
Standardized reporting format and system workflow event triggers:

#### Standardized Report Requirements
- Standard usage clause with authorized mortgage insurer responsibility extension.
- Main improvement dimensions, site dimensions, and Land Description verified against Title Registry.
- Recommended Replacement Cost calculation for mandatory building insurance coverage.
- Minimum 3 comparable sales within 6 months of valuation date, with at least 2 sales within 10% of subject property's value.
- Capitalization methodology mandatory for blocks of units or multi-dwelling lots.
- General valuer commentary on environmental, zoning, and adverse marketability factors.

#### Operational Workflow Lifecycle Events
1. **Loan Origination Trigger**: Receipt of home loan application initiates security collateral validation.
2. **Valuer Panel Assignment**: System dispatches instruction to independent accredited panel valuer.
3. **Inspection & Report Ingestion**: Standardized EVR report ingested with title check and comparable sales analysis.
4. **Credit Decisioning Event**: Underwriting engine enforces the lowest-value prudence rule (lower of price vs valuation).
5. **Discrepancy Escalation**: Valuation shortfall > 10% automatically escalates to Level 3 Senior Credit Officer.
6. **Expiry Sentinel**: 90-day threshold countdown triggers automated renewal alert and blocks drawdown upon expiration.
7. **APRA CPS 234 Audit Logging**: Cryptographically signed event telemetry recorded to audit logs with valuer accreditation ID.`,
    parameters: {
      approval_limits: {
        officer_cap: '$2,000,000 AUD',
        manager_cap: '$5,000,000 AUD',
        executive_cap: '$10,000,000 AUD'
      },
      turnaround_sla: '90 Days Validity (Full/Desktop), 30 Days (AVM)',
      daily_limit: 'Lower of Purchase Price or Assessed Market Value',
      verification_steps: [
        'Full internal/external inspection mandatory if LVR > 80% or loan > $2M',
        'Panel Valuer API Registration & conflict-of-interest check',
        'Minimum 3 comparable sales within 6 months (at least 2 within 10%)',
        'Recommended Replacement Cost for insurance calculation',
        'Serviceability buffer calculation (+3.0% over active mortgage reference rate)'
      ],
      compliance_tags: ['APRA APS 220', 'Independent Valuers', 'LVR Limits', 'AVM Standard', 'CoreLogic EVR'],
      phases: [
        {
          id: 'phase-1',
          phase_number: 1,
          title: 'Purpose & Governance Scope',
          summary: 'Consistent and prudent framework for residential property security valuations complying with APRA APS 220.',
          key_rules: [
            'Applies to all residential home loans, new purchases, refinances, and construction draws',
            'APRA APS 220 regulatory compliance for credit risk governance'
          ],
          content: 'Valuation is a critical step in mortgage lending. Accurate assessment of the collateral value determines the risk coverage. The purpose of this policy is to establish a consistent and prudent framework for the valuation of residential properties used as security for home loans under APRA APS 220 prudential governance.'
        },
        {
          id: 'phase-2',
          phase_number: 2,
          title: 'Underwriting Principles & Prudence Rules',
          summary: 'Core prudence mandate ensuring lending decisions adopt the lower of purchase price or assessed market value.',
          key_rules: [
            'Independence: Valuers must be independent of borrower, broker, and assessor',
            'Objectivity: Based strictly on verified market evidence and comparable sales',
            'Prudence Rule: Decisions must be based on lower of purchase price or market value'
          ],
          content: 'All residential properties offered as security for a home loan must be independently valued to ensure that the propertys market value adequately supports the proposed lending exposure.'
        },
        {
          id: 'phase-3',
          phase_number: 3,
          title: 'Approved Valuation Methods & Thresholds',
          summary: 'Four distinct valuation tiers: Full Physical Inspection, Desktop Valuation, AVM, and Kerbside.',
          key_rules: [
            'Full Valuation: Mandatory when LVR > 80%, construction loans, or high-value loans > $2M AUD',
            'Desktop: Low-to-medium risk residential lending with LVR <= 80%',
            'AVM: Standard residential below $1.5M with LVR <= 75%',
            'Drive-thru / Kerbside: Roadside inspection when additional physical assurance is needed'
          ],
          content: 'The bank authorizes four distinct valuation tiers based on property complexity, exposure, and risk profile.'
        },
        {
          id: 'phase-4',
          phase_number: 4,
          title: 'Validity Periods & Turnaround SLAs',
          summary: 'Statutory validity shelf-life: Full/Desktop 90 calendar days; AVM 30 calendar days.',
          key_rules: [
            'Full Valuation: 90 calendar days validity, 48-hour SLA',
            'Desktop Valuation: 90 calendar days validity, 24-hour SLA',
            'AVM: 30 calendar days validity, instant SLA',
            'Re-valuation triggers: Expiry, severe market drop (>5%), property damage, top-up request'
          ],
          content: 'Credit assessments and loan documentation can only rely on valuations within their statutory validity shelf-life.'
        },
        {
          id: 'phase-5',
          phase_number: 5,
          title: 'Verification Checklist & Event Telemetry',
          summary: 'Standardized report requirements, comparable sales rules, and end-to-end event triggers.',
          key_rules: [
            'Standardized Report: Min 3 comparable sales within 6 months (2 within 10%)',
            'Insurance replacement cost calculation included in report',
            'Discrepancy > 10% escalates to Level 3 Senior Credit Officer',
            'APRA CPS 234 event telemetry logged with valuer accreditation ID'
          ],
          content: 'Standardized reporting format and system workflow event triggers from origination to settlement and audit logging.'
        }
      ]
    },
    created_by: 'Marcus Vance (Bank Administrator)',
    updated_at: new Date().toISOString()
  },

  // Bank Employee Draft Specification: Maker-Checker draft workflow
  {
    id: 'commercial-equipment-finance-draft',
    department_id: 'retail-lending',
    department_name: 'Retail Lending',
    title: 'Commercial Equipment Finance & Asset Lending SOP',
    summary: 'Draft guidelines authored by Operations Squad for heavy machinery, medical devices, and commercial vehicle chattel mortgages.',
    version: '0.9',
    status: 'draft',
    is_masked: false,
    content: `### Phase 1: Purpose & Product Scope
Draft operational SOP for underwriting commercial chattel mortgages, hire purchase contracts, and equipment lease facilities up to $500,000 AUD.

### Phase 2: Asset Valuation & Depreciation Benchmarks
1. **Asset Classes**: Heavy haulage transport, earthmoving equipment, agricultural machinery, and specialized medical imaging systems.
2. **Depreciation Schedule**: Standard Australian Taxation Office (ATO) diminishing value schedule verified before financing term approval.
3. **PPSR Registration**: Mandatory Personal Property Securities Register (PPSR) charge registration within 24 hours of loan agreement signing.

### Phase 3: Delegated Limits & Turnaround SLAs
- Bank Employee (Maker) Assessment Cap: $50,000 AUD.
- Credit Officer Sign-off Cap: $150,000 AUD.
- Executive Risk Committee: > $500,000 AUD.
- Turnaround SLA: 36 business hours.`,
    parameters: {
      approval_limits: {
        officer_cap: '$50,000 AUD',
        manager_cap: '$150,000 AUD',
        executive_cap: '$500,000 AUD'
      },
      turnaround_sla: '36 Hours',
      daily_limit: '$100,000 AUD',
      verification_steps: [
        'PPSR Security Charge Registration Verification',
        'ATO Asset Depreciation Benchmark Audit',
        '2-Year Audited Business Tax Returns & BAS Statements',
        'Director Personal Guarantee & Comprehensive Credit Check'
      ],
      compliance_tags: ['PPSR Act 2009', 'Commercial Asset Lending', 'ATO Depreciation'],
      phases: [
        {
          id: 'phase-1',
          phase_number: 1,
          title: 'Purpose & Product Scope',
          summary: 'Commercial chattel mortgages, hire purchase contracts, and equipment lease facilities up to $500,000 AUD.',
          key_rules: ['Draft guidelines authored by Operations Squad', 'Covers equipment up to $500,000 AUD'],
          content: 'Draft operational SOP for underwriting commercial chattel mortgages, hire purchase contracts, and equipment lease facilities up to $500,000 AUD.'
        },
        {
          id: 'phase-2',
          phase_number: 2,
          title: 'Asset Valuation & Depreciation Benchmarks',
          summary: 'Asset classes, ATO diminishing value schedules, and mandatory PPSR registration.',
          key_rules: ['ATO diminishing value schedule verified', 'PPSR charge registration within 24 hours'],
          content: 'Asset classes: Heavy haulage transport, earthmoving equipment, agricultural machinery, and specialized medical imaging systems.'
        },
        {
          id: 'phase-3',
          phase_number: 3,
          title: 'Delegated Limits & Turnaround SLAs',
          summary: 'Approval tiers and turnaround SLA of 36 business hours.',
          key_rules: ['Bank Employee (Maker) assessment cap: $50,000 AUD', 'Credit Officer sign-off cap: $150,000 AUD'],
          content: 'Approval thresholds and SLAs for commercial chattel mortgages.'
        }
      ]
    },
    created_by: 'Sarah Jenkins (Bank Employee)',
    updated_at: new Date().toISOString()
  },

  // 2. Onboarding (2 policies)
  {
    id: 'customer-onboarding-sop',
    department_id: 'onboarding',
    department_name: 'Onboarding',
    title: 'Digital Customer Onboarding & Identity Verification SOP',
    summary: 'Standard operating procedure for fast-track mobile and web digital banking customer onboarding.',
    version: '1.0',
    status: 'active',
    is_masked: false,
    content: `1. Overview
Ensures frictionless retail account opening while maintaining strict compliance with AUSTRAC customer identification and AML/CTF standards.

2. Verification Flow
1. **Document Verification**: Real-time cross-match against Australian Document Verification Service (DVS) for Passport or Driver Licence.
2. **Biometric Face Match**: Active liveness detection score >= 92%.
3. **PEP & Sanctions**: Instantaneous screening against DFAT and international sanctions databases.`,
    parameters: {
      approval_limits: {
        initial_funding_cap: '$2,500'
      },
      turnaround_sla: '5 Minutes (Automated Digital)',
      verification_steps: [
        'Document Verification Service (DVS) National Check',
        'Biometric Face Liveness Score >= 92%',
        'Sanctions & Politically Exposed Persons (PEP) Screening',
        'Mobile Number Verification via One-Time Security PIN'
      ]
    },
    created_by: 'Sarah Jenkins (Maker)',
    updated_at: new Date().toISOString()
  },
  {
    id: 'commercial-kyc-sop',
    department_id: 'onboarding',
    department_name: 'Onboarding',
    title: 'Commercial Entity KYC & Beneficial Ownership Guideline',
    summary: 'Verification workflow for corporate accounts, trusts, partnerships, and ultimate beneficial owners (UBO >= 25%).',
    version: '1.3',
    status: 'active',
    is_masked: false,
    content: `1. Corporate Customer Due Diligence
Mandatory verification steps before activating commercial deposit or merchant accounts for Australian registered entities.

2. Governance Requirements
1. **ASIC Validation**: Live extract confirming company status, registered office, and current directors.
2. **Beneficial Ownership (UBO)**: Identification of all natural persons holding 25% or more equity or effective control.
3. **Signatory Mandate**: Formal board resolution authorizing named operators.`,
    parameters: {
      approval_limits: {
        operating_account_ceiling: '$250,000'
      },
      turnaround_sla: '3 Business Days',
      verification_steps: [
        'ASIC Company Extract & Certificate of Registration',
        'Ultimate Beneficial Ownership (UBO >= 25%) Identification',
        'Authorized Signatory ID & Board Resolution Mandate',
        'Industry Risk Categorization & Source of Wealth Review'
      ]
    },
    created_by: 'Marcus Vance (Approver)',
    updated_at: new Date().toISOString()
  },

  // 3. Security & InfoSec (2 policies)
  {
    id: 'remote-access-security-policy',
    department_id: 'security',
    department_name: 'Security & InfoSec',
    title: 'Remote Workplace Access & Multi-Factor Protocol',
    summary: 'Mandatory technical standards for bank employees accessing internal banking systems and customer databases remotely.',
    version: '1.1',
    status: 'active',
    is_masked: false,
    content: `1. Mandatory Controls
1. **VPN & Encryption**: All remote access must route through Commonwealth Bank enterprise VPN with TLS 1.3 encryption.
2. **Multi-Factor Authentication**: Hardware FIDO2 token or enterprise push notification with number matching required on every session.
3. **Session Lock**: Workstations must enforce automatic screen lock after 5 minutes of inactivity.`,
    parameters: {
      approval_limits: {
        access_clearance: 'Standard Clearance'
      },
      turnaround_sla: 'Immediate / Continuous',
      verification_steps: [
        'FIDO2 / Hardware Token Authentication',
        'Device Health & MDM Encryption Check',
        'Geo-location Velocity Anomaly Detection',
        'Automatic Inactivity Screen Lock (5 Minutes)'
      ]
    },
    created_by: 'Marcus Vance (Approver)',
    updated_at: new Date().toISOString()
  },
  {
    id: 'privileged-access-sop',
    department_id: 'security',
    department_name: 'Security & InfoSec',
    title: 'Privileged Access Management & Session Termination Standard',
    summary: 'Governance protocol for administrator access, database root access, cryptographic keys, and automated session auditing.',
    version: '2.0',
    status: 'active',
    is_masked: false,
    content: `1. Scope
Applies to all database administrators, cloud infrastructure operators, and core banking systems engineers.

2. Safeguards
1. **Just-In-Time Elevation**: Elevated rights expire after a maximum 4-hour lease window.
2. **Dual Approval**: Production modifications require secondary approver sign-off.
3. **Audit Logging**: All privileged terminal sessions are keystroke-indexed and cryptographically hashed.`,
    parameters: {
      approval_limits: {
        authorization_mode: 'Dual-Admin Required'
      },
      turnaround_sla: '1 Hour Emergency Escalation',
      verification_steps: [
        'Just-In-Time (JIT) Elevated Credential Provisioning',
        'Keystroke & Session Video Recording for Core DB Access',
        'Mandatory 4-Eye Principle for Production Changes',
        'Maximum 4-Hour Privileged Lease Window'
      ]
    },
    created_by: 'David Miller (Maker)',
    updated_at: new Date().toISOString()
  },

  // 4. Legal & Compliance (2 policies)
  {
    id: 'aml-ctf-screening-policy',
    department_id: 'legal-compliance',
    department_name: 'Legal & Compliance',
    title: 'Anti-Money Laundering & Sanctions Screening Standard',
    summary: 'Operational rules for AUSTRAC transaction reporting, real-time sanctions screening, and suspicious matter reports (SMR).',
    version: '2.1',
    status: 'active',
    is_masked: false,
    content: `1. AUSTRAC Regulatory Reporting
Mandatory compliance standards aligned with the Anti-Money Laundering and Counter-Terrorism Financing Act 2006.

2. Operational Obligations
1. **Threshold Transaction Reports (TTR)**: Cash transfers >= $10,000 AUD reported within 10 business days.
2. **Suspicious Matter Reports (SMR)**: Suspicious activity notifications submitted within 24 hours (terrorism financing) or 3 business days (money laundering).
3. **Automated Sanctions Filtering**: Real-time screening of inbound and outbound SWIFT / NPP payments against DFAT lists.`,
    parameters: {
      approval_limits: {
        reporting_threshold: '$10,000 AUD TTR'
      },
      turnaround_sla: '24 Hours for SMR Submission',
      verification_steps: [
        'Real-time DFAT & UN Sanctions List Cross-matching',
        'Significant Cash Transaction Reporting (SCTR) Thresholds',
        'Automated Transaction Monitoring for Smurfing & Layering',
        '24-Hour Regulatory AUSTRAC Notification Escalation'
      ]
    },
    created_by: 'Marcus Vance (Approver)',
    updated_at: new Date().toISOString()
  },
  {
    id: 'cdr-privacy-policy',
    department_id: 'legal-compliance',
    department_name: 'Legal & Compliance',
    title: 'Consumer Data Right (CDR) & Privacy Disclosures Policy',
    summary: 'Requirements for open banking data sharing, customer consent capture, revocation protocols, and APRA CPS 234 privacy adherence.',
    version: '1.4',
    status: 'active',
    is_masked: false,
    content: `1. Open Banking Framework
Governs secure customer-directed sharing of banking transaction data with Accredited Data Recipients (ADRs) under the Consumer Data Right.

2. Rules & Governance
1. **Consent Management**: Explicit, unbundled, time-limited consumer consents.
2. **Instant Revocation**: Ability for customers to revoke data-sharing access in single click via mobile banking app.
3. **Data Redaction**: Strict masking of joint account non-consenting parties' details.`,
    parameters: {
      approval_limits: {
        scope: 'Accredited Data Recipient (ADR) Scope'
      },
      turnaround_sla: 'Real-time API Consent Sync',
      verification_steps: [
        'Explicit & Unbundled Consumer Consent Verification',
        'End-to-End TLS 1.3 Encryption & MTLS for API Transfers',
        'Instantaneous Consent Revocation & Data Deletion Mechanism',
        'Annual Independent CDR Security Audit Review'
      ]
    },
    created_by: 'Sarah Jenkins (Maker)',
    updated_at: new Date().toISOString()
  }
];

export const DEFAULT_DEPARTMENTS = [
  { id: 'credit-cards', name: 'Credit Cards', icon: 'credit-card', count: 2 },
  { id: 'retail-lending', name: 'Retail Lending', icon: 'landmark', count: 2 },
  { id: 'onboarding', name: 'Onboarding', icon: 'user-check', count: 2 },
  { id: 'security', name: 'Security & InfoSec', icon: 'shield', count: 2 },
  { id: 'legal-compliance', name: 'Legal & Compliance', icon: 'scale', count: 2 },
  { id: 'company-policies', name: 'Company Policies', icon: 'shield', count: 0 },
  { id: 'customer-support', name: 'Customer Support', icon: 'headset', count: 0 },
  { id: 'engineering', name: 'Engineering', icon: 'cpu', count: 0 },
  { id: 'finance-operations', name: 'Finance & Operations', icon: 'piggy-bank', count: 0 },
  { id: 'hr-people', name: 'HR & People', icon: 'users', count: 0 },
  { id: 'it-tech-support', name: 'IT & Tech Support', icon: 'laptop', count: 0 },
  { id: 'marketing-sales', name: 'Marketing & Sales', icon: 'megaphone', count: 0 },
  { id: 'meeting-notes', name: 'Meeting Notes', icon: 'edit', count: 0 },
  { id: 'product-development', name: 'Product & Development', icon: 'tool', count: 0 },
  { id: 'project-management', name: 'Project Management', icon: 'folder-kanban', count: 0 },
  { id: 'announcements', name: 'Announcements', icon: 'megaphone', count: 0 },
  { id: 'templates-documents', name: 'Templates & Documents', icon: 'file-text', count: 0 }
];
