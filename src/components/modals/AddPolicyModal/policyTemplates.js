// 4 Institutional Banking Policy Templates (Clean & Concise)
export const POLICY_TEMPLATES = [
  {
    id: 'template-01-pdf',
    name: 'Template 1',
    title: 'Policy Document',
    dept: 'company-policies',
    sla: '4 Hours',
    daily: '$25,000 AUD',
    cap: '$100,000 AUD',
    summary: 'Standard banking policy framework covering applicability, detailed description, controls, dependencies, and reports.',
    sections: [
      {
        id: 'sec-summary',
        title: '1. Summary',
        content: 'Summary section provides a gist of the policy. It covers what is this policy about, applicability. Prefer to limit this into maximum three paragraphs. It is ok to introduce key bullet points.',
        type: 'section'
      },
      {
        id: 'sec-details',
        title: '2. Details',
        content: 'Detailed section expand the summary comments. It can have multiple sub sections. It contains text, table, images. It would remain a long section. Contains underwriting rules, credit score benchmarks, and authorization limits.',
        type: 'section'
      },
      {
        id: 'sec-scope',
        title: '3. Scope',
        content: 'Scope describes applicability of the policy. It will list the functional areas where this policy is applied across retail branches, corporate governance, and consumer credit operations.',
        type: 'section'
      },
      {
        id: 'sec-controls',
        title: '4. Controls',
        content: 'Key control monitoring steps for proper implementation is to be defined. If no control activities are available, this section would show as "No control steps defined".',
        type: 'section'
      },
      {
        id: 'sec-dependencies',
        title: '5. Dependencies',
        content: 'This section covers any pre-requisite requirements, x-references to other policies, any regulatory references (APRA APS 220, CPS 234). Usually this is presented in a table or cross-reference list.',
        type: 'section'
      },
      {
        id: 'sec-reports',
        title: '6. Reports',
        content: 'Any predefined reports are shown in this section. User needs to map explicitly the report contents for this section to be display. Otherwise, user can only list the report id associated with this product (e.g. CBA-RPT-2026-01).',
        type: 'section'
      }
    ]
  },
  {
    id: 'template-02-exec',
    name: 'Template 2',
    title: 'Executive Summary',
    dept: 'company-policies',
    sla: '24 Hours',
    daily: '$100,000 AUD',
    cap: '$500,000 AUD',
    summary: 'Executive governance charter setting forth board-level mandates, strategic risk tolerances, and delegated executive authority caps across business units.',
    sections: [
      {
        id: 'sec-exec-purpose',
        title: '1. Executive Summary & Statutory Purpose',
        content: 'Outlines the overarching statutory intent, board governance expectations, and strategic compliance objectives under APRA CPS 230 and ASIC regulatory guidance.',
        type: 'section'
      },
      {
        id: 'sec-exec-delegations',
        title: '2. Governance Framework & Delegated Authorities',
        content: '1. Level 1 Credit Assessor: Discretionary sign-off authority up to $50,000 AUD.\n2. Level 2 Operations Manager: Dual-sign approval up to $250,000 AUD.\n3. Level 3 Executive General Manager: Discretionary authority up to $1,000,000 AUD.\n4. Board Risk Committee: All aggregate exposures exceeding $5,000,000 AUD.',
        type: 'section'
      },
      {
        id: 'sec-exec-risk',
        title: '3. Prudential Compliance & Risk Appetite',
        content: 'Defines the quantitative risk tolerance metrics, maximum portfolio concentration limits, and automated circuit-breaker thresholds for retail exposures.',
        type: 'section'
      },
      {
        id: 'sec-exec-telemetry',
        title: '4. Operational Controls & Audit Telemetry',
        content: 'Quarterly board reporting schedule, mandatory executive attestations, and immutable APRA compliance event logging.',
        type: 'section'
      }
    ]
  },
  {
    id: 'template-03-sop',
    name: 'Template 3',
    title: 'Operational Procedure',
    dept: 'retail-lending',
    sla: '4 Hours',
    daily: '$25,000 AUD',
    cap: '$100,000 AUD',
    summary: 'Detailed step-by-step operating procedure for customer onboarding, loan origination, threshold checks, and event-driven lifecycle telemetry.',
    sections: [
      {
        id: 'sec-sop-summary',
        title: '1. Operational Summary & Eligibility Criteria',
        content: 'Mandatory frontline procedure for validating applicant identity, income serviceability, and credit risk thresholds for retail consumer accounts.',
        type: 'section'
      },
      {
        id: 'sec-sop-kyc',
        title: '2. Mandatory Verification & KYC Workflow',
        content: '1. Applicant Eligibility: Australian resident, age 18+, minimum annual gross income of $35,000 AUD.\n2. Verification Steps: Real-time DVS national identity match, Biometric face liveness score >= 92%, and Equifax comprehensive credit report >= 620.\n3. Income Proof: 2 consecutive pay slips and 90-day bank transaction history analysis.',
        type: 'section'
      },
      {
        id: 'sec-sop-limits',
        title: '3. Limit Thresholds & Turnaround SLAs',
        content: 'Automated Tier 1 approvals up to $5,000 AUD; Credit Officer sign-off for Tier 2 up to $15,000 AUD; Department Manager approval for Tier 3 up to $50,000 AUD. Adjudication SLA: 4 Hours.',
        type: 'section'
      },
      {
        id: 'sec-sop-events',
        title: '4. Operational Events & Lifecycle Triggers',
        content: '1. Event: Customer Application Ingestion - Digital channel lodges customer application; real-time DVS verification invoked.\n2. Event: Escalation Threshold Trigger - Credit request > $15,000 AUD triggers Credit Officer assignment; > $25,000 AUD triggers Manager sign-off.\n3. Event: Limit Cap Verification - System checks daily limit ($25,000 AUD) and officer cap ($100,000 AUD) before decision execution.\n4. Event: Compliance Audit Logging - Immutable APRA CPS 234 event telemetry recorded with AUSTRAC filing if TTR threshold met.',
        type: 'section'
      }
    ]
  },
  {
    id: 'template-04-h1',
    name: 'Template 4',
    title: 'Statutory Standard',
    dept: 'legal-compliance',
    sla: '72 Hours',
    daily: '$50,000 AUD',
    cap: '$250,000 AUD',
    summary: 'Comprehensive statutory compliance standard organized with formal H1 legal headings governing statutory mandates, risk resilience, and 72-hour breach notices.',
    sections: [
      {
        id: 'sec-h1-statutory',
        title: '1. Statutory Scope & Legal Mandate',
        content: 'Governed by the Banking Act 1959, APRA Prudential Standard CPS 230 (Operational Risk), and the Privacy Act 1988. Establishes legal compliance across all banking products and operations.',
        type: 'section'
      },
      {
        id: 'sec-h1-resilience',
        title: '2. Operational Resilience & Control Matrix',
        content: 'Banks must identify all critical business operations and establish formal tolerance limits for operational disruptions, ensuring core settlement systems maintain recovery time objectives (RTO) under 2 hours.',
        type: 'section'
      },
      {
        id: 'sec-h1-vendors',
        title: '3. Third-Party & Service Provider Due Diligence',
        content: 'Formal assessment and ongoing monitoring of material service providers. Annual fourth-party supply chain audits and security posture evaluations mandatory for all Tier 1 vendors.',
        type: 'section'
      },
      {
        id: 'sec-h1-notification',
        title: '4. Incident Response & 72-Hour Regulatory Notification',
        content: 'Mandatory notification to APRA and AUSTRAC within 72 hours of becoming aware of an operational disruption or information security incident that materially impacts banking operations.',
        type: 'section'
      }
    ]
  }
];

