/**
 * Shidney AI Copilot Service
 * Powered by Groq LLM API (openai/gpt-oss-120b)
 * Real-time natural conversational AI assistant for Australian banking regulations,
 * loan assessment rules, platform navigation, and onboarding.
 */

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY || '';
const GROQ_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';
const PRIMARY_MODEL = 'openai/gpt-oss-120b';
const FALLBACK_MODEL = 'openai/gpt-oss-20b';

/**
 * Builds a natural conversation system prompt giving Shidney full context
 */
function buildSystemPrompt(context = {}) {
  const {
    currentUser,
    selectedBank,
    activePolicy,
    selectedProduct,
  } = context;

  const bankRules = activePolicy?.bankCustomAddenda?.[selectedBank?.id] || {};
  const isPolicyActive = bankRules.status !== 'INACTIVE';
  const userName = currentUser?.name?.split(' ')[0] || 'David';
  const userRole = currentUser?.role || 'Security Architect';

  return `You are "Shidney", the intelligent, friendly, and helpful Australian Banking AI Co-pilot for LibTrak OmniSpec Hub.

### CRITICAL CONVERSATION & NAVIGATION RULES:
1. **KEEP RESPONSES CONCISE, NATURAL, AND CONVERSATIONAL.**
   - NEVER dump massive unrequested tables, whole manuals, or walls of text.
   - Answer ONLY what the user asked directly.
2. **CLICKABLE ACTION LINKS (VERY IMPORTANT):**
   - Whenever you refer to policies, products, configuring rules, change requests, or navigating to any feature, include clickable action links in your text using this exact markdown syntax:
     - To open Credit Card Product Suite: [Open Credit Cards](action:policy:credit-card-limits-policy)
     - To open Personal Loans: [Open Personal Loans](action:policy:personal-loans-assessment-sop)
     - To open Configure modal: [Configure](action:modal:edit-spec)
     - To open Export Certificate modal: [Export Certificate](action:modal:export-cert)
     - To open Submit Change Request form: [Submit Change Request](action:feed:request-change)
     - To switch user role: [Switch Role](action:role:toggle)
     - To open CPS 234 Authentication: [Open CPS 234 Auth Policy](action:policy:remote-access-security-policy)
     - To open CDR & Privacy Policy: [Open Privacy & CDR Governance](action:policy:cdr-privacy-policy)
     - To open AUSTRAC Financial Crime: [Open AUSTRAC AML & Sanctions](action:policy:aml-ctf-screening-policy)
   - When the user clicks these links, the application immediately opens and navigates to that exact screen!
3. **GREETING & NEW EMPLOYEE INTRODUCTIONS:**
   - If the user says "hi", "hello", "hey": reply naturally:
     "Hi ${userName}! How can I help you today?"
   - If the user says "I am a new employee", "I'm new here", or introduces themselves: reply warmly and concisely:
     "That's great, ${userName}! Welcome to the team. Hope you fit well with your role as ${userRole}. Would you like me to guide you around here, or is there anything specific you'd like to check out first?"
4. **EXPLAINING STANDARDS & QUESTIONS:**
   - Give a clear, concise summary in 2 to 4 bullet points or short sentences first.
   - Conclude by asking if they would like you to elaborate: "Would you like me to elaborate on any specific part?"
   - If the user asks to elaborate, provide the deeper technical details for that specific topic.
5. **NO JARGON "ADDENDA":** Use "Institutional Rules", "Policy Settings", "Loan Limits", or "Change Requests".

### CURRENT LIVE CONTEXT:
- User: ${userName} (${userRole})
- Active Bank: ${selectedBank?.name || 'Commonwealth Bank of Australia (CBA)'} (${selectedBank?.id?.toUpperCase()})
- Active Product: ${selectedProduct || 'personal-loans'}
- Active Policy: ${activePolicy?.title || 'Responsible Lending & Personal Loan Credit Assessment Rules'} (${activePolicy?.latestVersion || 'v3.4.0'})
- Policy Status: ${isPolicyActive ? 'Active & Enforced' : 'Inactive'}
- Active Bank Limit: ${bankRules.sessionTimeout || 'Max $50,000 Unsecured Personal Loan Limit'}
- Active Bank Verification: ${bankRules.mfaRule || 'Income verification via automated CDR Open Banking stream'}

### KEY REGULATORY KNOWLEDGE (USE CONCISELY WHEN ASKED):
- **APRA APS 220 & NCCP (Lending):** +3.00% serviceability interest buffer above customer rate; Debt-to-Income (DTI) > 6.0x capped at < 5% of portfolio; Comprehensive Credit Reporting (CCR) bureau check & CDR income verification.
- **APRA CPS 234 (Security):** OAuth 2.0 PKCE mandatory, RS256/ES256 asymmetric keys rotated every 30 days, 72-hour APRA material cyber incident notification.
- **APRA CPS 230 (Operational Risk):** Critical business service continuity, RPO/RTO SLAs, third-party vendor controls.
- **Privacy Act APP 11:** 7-year statutory retention baseline under Corporations Act with cryptographic erasure upon expiry.
- **Open Banking CDR:** Explicit unbundled consent, 12-month max duration, 1-click < 2s revocation dashboard.
- **AUSTRAC:** 10-day TTR reporting for $10k+ AUD cash, 24h SMR reporting.`;
}

/**
 * Call Groq Chat Completions API with openai/gpt-oss-120b
 */
export async function askShidneyAI({ prompt, conversationHistory = [], context = {} }) {
  if (!prompt || !prompt.trim()) {
    return { text: "Hi! How can I help you today?" };
  }

  const cleanPrompt = prompt.trim();
  const lower = cleanPrompt.toLowerCase();
  const userName = context.currentUser?.name?.split(' ')[0] || 'David';
  const userRole = context.currentUser?.role || 'Security Architect';

  // Instant natural greeting handler for standalone greetings
  if (/^(hi|hello|hey|gday|g'day|good morning|good afternoon|good evening|hi shidney|hello shidney)[!.]*$/i.test(lower)) {
    return {
      text: `Hi ${userName}! How can I help you today?`,
    };
  }

  // Instant natural new employee introduction handler
  if (/^(i am a new employee|i'm a new employee|i am new here|i'm new here|i just joined|new employee here)[!.]*$/i.test(lower)) {
    return {
      text: `That's great, ${userName}! Welcome to the team. Hope you fit well with your role as ${userRole}.

Would you like me to guide you around here, or is there anything specific you'd like to check out first?`,
    };
  }

  const systemPrompt = buildSystemPrompt(context);

  const messages = [
    { role: 'system', content: systemPrompt },
    ...conversationHistory.slice(-6).map(m => ({
      role: m.sender === 'user' ? 'user' : 'assistant',
      content: m.text,
    })),
    { role: 'user', content: cleanPrompt }
  ];

  try {
    const response = await fetch(GROQ_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: PRIMARY_MODEL,
        messages: messages,
        temperature: 0.4,
        max_tokens: 450,
        top_p: 0.9,
      }),
    });

    if (!response.ok) {
      console.warn(`Groq API primary model failed with status ${response.status}, trying fallback model...`);
      const fallbackResponse = await fetch(GROQ_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: FALLBACK_MODEL,
          messages: messages,
          temperature: 0.4,
          max_tokens: 450,
        }),
      });

      if (fallbackResponse.ok) {
        const data = await fallbackResponse.json();
        const text = data.choices?.[0]?.message?.content || "How can I help you today?";
        return { text: cleanResponseText(text) };
      }
      throw new Error(`Groq API error: ${response.statusText}`);
    }

    const data = await response.json();
    const replyText = data.choices?.[0]?.message?.content || "How can I help you today?";
    return { text: cleanResponseText(replyText) };
  } catch (err) {
    console.error('Shidney AI API call failed, using intelligent local engine:', err);
    return getLocalNaturalResponse(cleanPrompt, context);
  }
}

/**
 * Clean any leftover formatting artifacts
 */
function cleanResponseText(rawText) {
  if (!rawText) return "How can I help you today?";
  return rawText
    .replace(/\[ACTION:.*?\]/g, '')
    .trim();
}

/**
 * Natural offline response engine with rich clickable action links
 */
function getLocalNaturalResponse(prompt, context = {}) {
  const q = prompt.toLowerCase();
  const bankName = context.selectedBank?.name || 'Commonwealth Bank of Australia (CBA)';
  const bankId = context.selectedBank?.id?.toUpperCase() || 'CBA';
  const userName = context.currentUser?.name?.split(' ')[0] || 'David';
  const userRole = context.currentUser?.role || 'Security Architect';

  if (/^(hi|hello|hey|gday)[!.]*$/i.test(q)) {
    return {
      text: `Hi ${userName}! How can I help you today?`,
    };
  }

  if (q.includes('new employee') || q.includes('new here') || q.includes('just joined')) {
    return {
      text: `That's great, ${userName}! Welcome to the team. Hope you fit well with your role as ${userRole}.

Would you like me to guide you around here, or is there anything specific you'd like to check out first?`,
    };
  }

  if (q.includes('what') && (q.includes('can you do') || q.includes('things you can do') || q.includes('capabilities') || q.includes('help me with'))) {
    return {
      text: `I'm **Shidney**, your banking co-pilot. Here is what I can help you with:

- **1. Credit Card Product Suite & Direct Docs:** [Open Credit Cards](action:policy:credit-card-limits-policy) (Tiered limits & in-system operational specifications).
- **2. Lending & Credit Rules:** [Open Personal Loans](action:policy:personal-loans-assessment-sop) (APRA APS 220 + NCCP rules).
- **3. Security & Auth Standards:** [Open CPS 234 Auth Policy](action:policy:remote-access-security-policy) (OAuth 2.0 PKCE, session timeouts).
- **4. Configure Bank Settings:** [Configure](action:modal:edit-spec) to adjust loan limits or verification streams.
- **5. Change Requests:** [Submit Change Request](action:feed:request-change) for Risk Committee review.
- **6. Compliance Certification:** [Export Certificate](action:modal:export-cert) to generate signed audit artifacts.

Would you like me to elaborate on any of these?`,
    };
  }

  if (q.includes('credit card') || q.includes('credit-card') || q.includes('card') || (q.includes('product') && !q.includes('loan'))) {
    return {
      text: `Navigated to **Credit Card Product Suite & Issuance Policy** (Master Product Policy).

This master product container governs consumer credit issuance and holds 3 direct in-system operational documents:
1. **CBA-DOC-001:** Core Credit Card Issuance & Underwriting Specification (+3.0% serviceability buffer, HEM baseline).
2. **CBA-SOP-002:** Digital KYC & Instant Card Provisioning Procedure (Biometric face liveness >= 92%, DVS verification).
3. **CBA-LMT-003:** Daily Spending Limits & Escalation Ceiling Matrix (Daily ATM $1,000 AUD, tap-and-go $200).

The center workspace has re-rendered to show this product policy and all active direct documents.

Quick Actions:
- [Open Credit Card Product Suite](action:policy:credit-card-limits-policy)
- [Configure Credit Card Limits](action:modal:edit-spec)
- [Export Compliance Audit Certificate](action:modal:export-cert)

Would you like me to elaborate on any of the direct documents or approval tiers?`,
    };
  }

  if (q.includes('loan') || q.includes('lending') || q.includes('aps 220') || q.includes('overdraft') || q.includes('50,000') || q.includes('50000')) {
    return {
      text: `Navigated to **Personal Loans & Overdraft Assessment Procedure** (APRA APS 220).

Under **APRA APS 220** and the National Consumer Credit Protection (NCCP) Act, personal loan assessment enforces three key safeguards:

1. **3.00% Serviceability Buffer:** All loan interest rate assessments incorporate a +3.00% buffer above the customer rate.
2. **Debt-to-Income (DTI) Cap:** Approvals exceeding 6.0x DTI are capped at < 5% of portfolio volume.
3. **CDR Automated Verification:** Direct income verification via Open Banking streams and CDR statements.

For **${bankId}**, the current configured maximum limit is **$50,000 AUD**.

Quick Actions:
- [Open Personal Loans Policy](action:policy:personal-loans-assessment-sop)
- [Configure Personal Loans](action:modal:edit-spec)
- [Submit a Loan Policy Change Request](action:feed:request-change)

Would you like me to elaborate on any specific calculation?`,
    };
  }

  if (q.includes('where') || q.includes('option') || q.includes('button') || q.includes('edit') || q.includes('export') || q.includes('how to')) {
    return {
      text: `Here is where key options are located in the workspace:

- **Credit Card Product Suite:** Click [Open Credit Cards](action:policy:credit-card-limits-policy).
- **Personal Loans:** Click [Open Personal Loans](action:policy:personal-loans-assessment-sop).
- **Configure:** Click the blue [Configure](action:modal:edit-spec) button at the top right of the center pane.
- **Export Certificate:** Click [Export Certificate](action:modal:export-cert) at the top right of the center workspace.
- **Submit Change Request:** Click [Submit Change Request](action:feed:request-change) or switch to the **Review** tab in this feed.
- **Switch Role:** Click [Switch Role](action:role:toggle) in the top header to toggle between Submitter and Approver.
- **CPS 234 Information Security:** Click [Open CPS 234 Auth Policy](action:policy:remote-access-security-policy).
- **Data Privacy & CDR:** Click [Open Privacy & CDR Governance](action:policy:cdr-privacy-policy).
- **AUSTRAC AML:** Click [Open AUSTRAC AML & Sanctions](action:policy:aml-ctf-screening-policy).

Click any link above to jump directly there!`,
    };
  }

  return {
    text: `I'm here to help with any questions about our banking standards, personal loan rules, or navigating the platform for **${bankName}**.

You can explore:
- [Open Personal Loans (APRA APS 220)](action:policy:aps-220-credit-risk)
- [Configure Rules](action:modal:edit-spec)
- [Submit Change Request](action:feed:request-change)

What would you like to know?`,
  };
}
