import React, { useState, useEffect, useRef } from 'react';
import {
    BookOpen,
    FileText,
    Folder,
    FolderOpen,
    CheckSquare,
    CheckCircle2,
    Shield,
    ShieldCheck,
    User,
    Users,
    UserCheck,
    Lock,
    Eye,
    Plus,
    Edit3,
    Search,
    MessageSquare,
    Bot,
    Send,
    ListTodo,
    Calendar,
    Clock,
    FileSpreadsheet,
    GitBranch,
    Network,
    Layers,
    FilePlus2,
    Trash2,
    SlidersHorizontal,
    Share2,
    Sparkles,
    Check,
    AlertCircle,
    Info,
    Building2,
    ArrowUpRight
} from 'lucide-react';
import './loginSlideShow.css';

const SLIDES = [
    {
        id: 1,
        scrollLabel: 'Scroll 1',
        category: 'Library Ecosystem',
        title: 'Host every type of libraries',
        description: 'Maintain wide-ranging enterprise repositories including Policies, Templates, Frameworks, Code, User Guides, and Audit Reports.',
        renderVisual: () => (
            <div className="modern-preview-content">
                <div className="cards-2x2-grid">
                    <div className="pro-resource-card pro-card-blue">
                        <div className="pro-card-header">
                            <div className="pro-card-badge bg-blue-subtle">
                                <FileText size={14} className="text-blue" />
                            </div>
                            <span className="pro-card-count">8 libraries</span>
                        </div>
                        <div className="pro-card-title">Policy</div>
                        <div className="pro-card-indicator bar-blue" />
                    </div>

                    <div className="pro-resource-card pro-card-teal">
                        <div className="pro-card-header">
                            <div className="pro-card-badge bg-teal-subtle">
                                <CheckSquare size={14} className="text-teal" />
                            </div>
                            <span className="pro-card-count">6 libraries</span>
                        </div>
                        <div className="pro-card-title">Procedure</div>
                        <div className="pro-card-indicator bar-teal" />
                    </div>

                    <div className="pro-resource-card pro-card-indigo">
                        <div className="pro-card-header">
                            <div className="pro-card-badge bg-indigo-subtle">
                                <Shield size={14} className="text-indigo" />
                            </div>
                            <span className="pro-card-count">2 libraries</span>
                        </div>
                        <div className="pro-card-title">Standard</div>
                        <div className="pro-card-indicator bar-indigo" />
                    </div>

                    <div className="pro-resource-card pro-card-purple">
                        <div className="pro-card-header">
                            <div className="pro-card-badge bg-purple-subtle">
                                <CheckCircle2 size={14} className="text-purple" />
                            </div>
                            <span className="pro-card-count">3 libraries</span>
                        </div>
                        <div className="pro-card-title">Checklist</div>
                        <div className="pro-card-indicator bar-purple" />
                    </div>
                </div>

                <div className="pro-tags-row">
                    <span className="pro-pill-tag">Templates</span>
                    <span className="pro-pill-tag">Frameworks</span>
                    <span className="pro-pill-tag">Code Base</span>
                    <span className="pro-pill-tag">User Guides</span>
                    <span className="pro-pill-tag">Audit Reports</span>
                </div>
            </div>
        )
    },
    {
        id: 2,
        scrollLabel: 'Scroll 2',
        category: 'Repository Architecture',
        title: 'Organize Libraries',
        description: 'Enterprise-wide collections structured with granular versioning, team access controls, and full change logging.',
        renderVisual: () => (
            <div className="modern-preview-content">
                <div className="repo-explorer-split">
                    <div className="repo-tree-panel">
                        <div className="repo-folder-row parent">
                            <Folder size={14} className="text-blue" />
                            <span className="folder-name">Retail Banking</span>
                            <span className="item-counter">6</span>
                        </div>
                        <div className="repo-folder-row nested">
                            <FolderOpen size={14} className="text-teal" />
                            <span className="folder-name">Personal Loans</span>
                            <span className="item-counter">3</span>
                        </div>
                        <div className="repo-file-row active-file">
                            <FileText size={13} className="text-blue" />
                            <span className="file-name">Personal Loan Credit Policy</span>
                            <span className="file-code-tag">LIB-1001</span>
                        </div>
                        <div className="repo-file-row">
                            <FileText size={13} className="text-muted" />
                            <span className="file-name">Acceptance Criteria</span>
                            <span className="file-code-tag">LIB-1002</span>
                        </div>
                        <div className="repo-folder-row nested">
                            <Folder size={14} className="text-blue" />
                            <span className="folder-name">Credit Cards</span>
                            <span className="item-counter">2</span>
                        </div>
                        <div className="repo-folder-row parent">
                            <Folder size={14} className="text-blue" />
                            <span className="folder-name">Compliance</span>
                            <span className="item-counter">3</span>
                        </div>
                    </div>

                    <div className="repo-stat-badge-box">
                        <div className="stat-unit">
                            <span className="stat-val">16</span>
                            <span className="stat-lbl">libraries</span>
                        </div>
                        <div className="stat-divider" />
                        <div className="stat-unit">
                            <span className="stat-val">13</span>
                            <span className="stat-lbl">folders</span>
                        </div>
                    </div>
                </div>

                <div className="repo-banner-callout">
                    <div className="callout-lead">Full repository</div>
                    <div className="callout-title">Every policy, in one trusted library.</div>
                    <div className="callout-desc">Bring policies, procedures, and standards from every department into one organised hub.</div>
                </div>
            </div>
        )
    },
    {
        id: 3,
        scrollLabel: 'Scroll 3',
        category: 'Role Governance',
        title: 'Access rights aligned to organizational standard',
        description: 'Give each team the exact level of access — Edit, View, or Author — while keeping restricted libraries completely confidential.',
        renderVisual: () => (
            <div className="modern-preview-content">
                <div className="access-gov-split">
                    <div className="staff-roster-column">
                        <div className="roster-header">
                            <span className="roster-caption">ACTIVE BANK STAFF (5)</span>
                            <span className="btn-add-ghost"><Plus size={11} /> Add Staff</span>
                        </div>

                        <div className="staff-card active">
                            <div className="staff-primary-line">
                                <span className="staff-person-name">Sarah Jenkins</span>
                                <span className="role-mini-pill">Employee</span>
                            </div>
                            <div className="staff-person-role">Bank Employee</div>
                            <div className="staff-person-entitle">Can Create · 3 Policies</div>
                        </div>

                        <div className="staff-card">
                            <div className="staff-primary-line">
                                <span className="staff-person-name">David Miller</span>
                                <span className="role-mini-pill muted">Employee</span>
                            </div>
                            <div className="staff-person-role">Bank Employee</div>
                            <div className="staff-person-entitle">Read Only · 2 Policies</div>
                        </div>

                        <div className="staff-card">
                            <div className="staff-primary-line">
                                <span className="staff-person-name">Emma Watson</span>
                                <span className="role-mini-pill muted">Employee</span>
                            </div>
                            <div className="staff-person-role">Bank Employee</div>
                            <div className="staff-person-entitle">Can Create · 1 Policies</div>
                        </div>
                    </div>

                    <div className="permissions-column">
                        <div className="perm-profile-header">
                            <div>
                                <span className="perm-profile-name">Sarah Jenkins</span>
                                <span className="squad-badge">Credit Operations Squad</span>
                            </div>
                            <span className="emp-type-pill">Bank Employee</span>
                        </div>

                        <div className="perm-sub-label">DIRECT USER PERMISSIONS</div>
                        <div className="perm-pills-trio">
                            <div className="perm-card">
                                <div className="perm-card-top">
                                    <span className="perm-title"><Eye size={12} /> Can View</span>
                                    <span className="status-tag-green">Allowed</span>
                                </div>
                                <span className="perm-subtext">Read & browse policies</span>
                            </div>

                            <div className="perm-card">
                                <div className="perm-card-top">
                                    <span className="perm-title"><Plus size={12} /> Can Create</span>
                                    <span className="status-tag-green">Allowed</span>
                                </div>
                                <span className="perm-subtext">Author new policies</span>
                            </div>

                            <div className="perm-card">
                                <div className="perm-card-top">
                                    <span className="perm-title"><Edit3 size={12} /> Can Edit</span>
                                    <span className="status-tag-green">Allowed</span>
                                </div>
                                <span className="perm-subtext">Configure clauses</span>
                            </div>
                        </div>

                        <div className="perm-search-footer">
                            <div className="perm-sub-label">
                                <span>POLICY-SPECIFIC ACCESS CONTROLS</span>
                                <span className="count-tag">3 of 8 Viewable</span>
                            </div>
                            <div className="search-mockup-input">
                                <Search size={13} className="text-muted" />
                                <span>Search policies in library...</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    },
    {
        id: 4,
        scrollLabel: 'Scroll 4',
        category: 'Intelligent Query',
        title: 'Communicate, Collaborate, Clarify',
        description: 'Query LibList to retrieve instant, cited answers within entitled policies. Comment, communicate with peers, and assign tasks.',
        renderVisual: () => (
            <div className="modern-preview-content">
                <div className="chat-thread-container">
                    <div className="user-prompt-bubble">
                        <span>What income does a salaried applicant need?</span>
                    </div>

                    <div className="system-answer-card">
                        <div className="answer-header">
                            <div className="ai-chip"><Bot size={13} /> LibList Intelligence</div>
                            <span className="verified-chip"><CheckCircle2 size={11} /> Entitlement Verified</span>
                        </div>
                        <p className="answer-body">
                            At least <strong>INR 30,000</strong> net a month, or <strong>INR 35,000</strong> in metro cities{' '}
                            <span className="citation-pill">1</span>, with 6 months at their current employer{' '}
                            <span className="citation-pill">2</span>.
                        </p>
                    </div>

                    <div className="citation-reference-box">
                        <span className="citation-index-badge">1</span>
                        <div className="citation-meta">
                            <span className="citation-doc-title">Personal Loan Acceptance Criteria</span>
                            <span className="citation-doc-code">LIB-1002 · Clause 4.2 Details</span>
                        </div>
                    </div>

                    <div className="chat-quick-actions">
                        <span className="action-tag"><MessageSquare size={12} /> Comment</span>
                        <span className="action-tag"><ListTodo size={12} /> Assign Task</span>
                        <span className="action-tag"><Share2 size={12} /> Share Reference</span>
                    </div>
                </div>
            </div>
        )
    },
    {
        id: 5,
        scrollLabel: 'Scroll 5',
        category: 'Workflow Execution',
        title: 'Assign and Track Tasks',
        description: 'Follow up, delegate, and monitor policy tasks in a centralized workspace task sheet with real-time status tracking.',
        renderVisual: () => (
            <div className="modern-preview-content">
                <div className="tasks-workspace-box">
                    <div className="tasks-nav-header">
                        <div className="tasks-brand">
                            <ListTodo size={15} className="text-blue" />
                            <span>Library Workspace – Task Management</span>
                        </div>
                        <span className="count-pill-blue">9 Total</span>
                    </div>

                    <div className="tasks-tabs-row">
                        <span className="tab-pill">Assigned to Me (1)</span>
                        <span className="tab-pill">Assigned by Me (8)</span>
                        <span className="tab-pill active">All Tasks (9)</span>
                        <span className="tab-pill">Pinned (0)</span>
                    </div>

                    <div className="tasks-section-label">ASSIGNED WORKFLOW TASKS <span>9</span></div>

                    <div className="task-flow-card">
                        <div className="task-status-row">
                            <div className="task-badges-left">
                                <span className="task-id">TASK-000018</span>
                                <span className="task-category">Common</span>
                            </div>
                            <span className="status-badge-pending">● Pending</span>
                        </div>
                        <div className="task-headline">Retail Risk Policy Acceptance & Audit Alignment</div>
                        <div className="task-subline">Reconcile income eligibility thresholds against latest regulatory guidance</div>
                        <div className="task-footer-bar">
                            <span className="footer-meta-item"><User size={12} /> jeeva</span>
                            <span className="footer-meta-item"><Calendar size={12} /> 12 Nov 2026</span>
                        </div>
                    </div>
                </div>
            </div>
        )
    },
    {
        id: 6,
        scrollLabel: 'Scroll 6',
        category: 'Clause Collaboration',
        title: 'Comment and Feedback',
        description: 'Discuss individual clauses directly in context, gather stakeholder feedback, and keep review audits clean and organized.',
        renderVisual: () => (
            <div className="modern-preview-content">
                <div className="clause-review-container">
                    <div className="clause-document-snippet">
                        <div className="clause-eyebrow">Clause 3.1 · Details</div>
                        <div className="clause-text">
                            Minimum net monthly income of <span className="text-highlight">INR 30,000</span> (INR 35,000 in metro cities).
                        </div>
                    </div>

                    <div className="comment-thread-card">
                        <div className="commenter-avatar">PN</div>
                        <div className="commenter-content">
                            <div className="commenter-title">
                                <span className="author-name">Priya Nair</span>
                                <span className="target-clause">on Details</span>
                            </div>
                            <div className="commenter-message">
                                <span className="mention-text">@Karthik</span> should metro cities include Pune?
                            </div>
                        </div>
                    </div>

                    <div className="admin-moderation-note">
                        <AlertCircle size={13} className="text-muted" />
                        <span>A comment was hidden by an admin as off-topic.</span>
                    </div>
                </div>
            </div>
        )
    },
    {
        id: 7,
        scrollLabel: 'Scroll 7',
        category: 'Authoring Studio',
        title: 'Easy Modes for Library Creation',
        description: 'Create libraries through direct in-system drafting, master template inheritance, or automated document uploads.',
        renderVisual: () => (
            <div className="modern-preview-content">
                <div className="template-studio-wrapper">
                    <div className="studio-top-bar">
                        <span className="studio-title"><Plus size={13} className="text-blue" /> LibList • Create Operational Policy</span>
                        <span className="studio-close">×</span>
                    </div>

                    <div className="studio-tabs-row">
                        <span className="studio-tab active"><Edit3 size={13} /> 1. Direct In-System</span>
                        <span className="studio-tab"><BookOpen size={13} /> 2. Master Library</span>
                        <span className="studio-tab"><FileText size={13} /> 3. Document Upload</span>
                    </div>

                    <div className="studio-section-label">
                        <span>1. CHOOSE STARTING TEMPLATE</span>
                        <span className="dynamic-badge">DB Dynamic (4)</span>
                    </div>

                    <div className="templates-4x-grid">
                        <div className="tmpl-card">
                            <div className="tmpl-card-title">Policy Document <Info size={11} className="text-muted" /></div>
                            <div className="tmpl-card-sub">Credit Card Product Suit...</div>
                        </div>
                        <div className="tmpl-card">
                            <div className="tmpl-card-title">Executive Summary <Info size={11} className="text-muted" /></div>
                            <div className="tmpl-card-sub">Executive Governance &...</div>
                        </div>
                        <div className="tmpl-card">
                            <div className="tmpl-card-title">Operational (SOP) <Info size={11} className="text-muted" /></div>
                            <div className="tmpl-card-sub">Standard Operating Pro...</div>
                        </div>
                        <div className="tmpl-card">
                            <div className="tmpl-card-title">Statutory Standard <Info size={11} className="text-muted" /></div>
                            <div className="tmpl-card-sub">APRA CPS 234 Informati...</div>
                        </div>
                    </div>

                    <div className="templates-footer-callout">
                        <div className="callout-head">Create from templates: Start from a standard, not a blank page.</div>
                        <div className="callout-body">Draft new libraries from approved templates or amend existing ones, with every version kept.</div>
                    </div>
                </div>
            </div>
        )
    },
    {
        id: 8,
        scrollLabel: 'Scroll 8',
        category: 'Maker-Checker Audit',
        title: 'Change Management Control',
        description: 'Track version changes, submit draft proposals through Maker-Checker review queues, and preserve historical audit trails.',
        renderVisual: () => (
            <div className="modern-preview-content">
                <div className="change-mgmt-wrapper">
                    <div className="mgmt-top-header">
                        <div className="mgmt-title-row">
                            <span className="active-dot" />
                            <span className="mgmt-heading">Change Management</span>
                        </div>
                        <span className="btn-new-draft-pill"><Plus size={11} /> New Policy / Draft</span>
                    </div>

                    <div className="mgmt-tabs-nav">
                        <span className="nav-tab-pill active">Saved Drafts <span className="counter-pill orange">9</span></span>
                        <span className="nav-tab-pill">In Review Queue <span className="counter-pill">2</span></span>
                        <span className="nav-tab-pill">Approval History <span className="counter-pill">3</span></span>
                    </div>

                    <div className="draft-entry-card">
                        <div className="draft-entry-main">
                            <div className="draft-header-line">
                                <span className="draft-dot-amber" />
                                <span className="draft-item-title">Policy Manual (Draft Revision)</span>
                                <span className="draft-badge-tag">Draft</span>
                            </div>
                            <div className="draft-snippet">
                                The Policy Manual establishes a consistent approach for defining, communicating, and governing credit lines...
                            </div>
                            <div className="draft-meta-tags">
                                <span className="tag-dept">Credit Cards</span>
                                <span className="tag-date">Draft Revision · 13/11/2026</span>
                            </div>
                        </div>
                        <div className="draft-action-btns">
                            <span className="btn-ghost-edit"><Edit3 size={12} /> Edit</span>
                            <span className="btn-ghost-delete"><Trash2 size={12} /> Delete</span>
                        </div>
                    </div>

                    <div className="mgmt-footer-note">
                        <span className="note-eyebrow">Chat and query</span>
                        <div className="note-title">Talk it through, then assign it.</div>
                        <div className="note-desc">Discuss a library in context and turn a message into a task for the right person.</div>
                    </div>
                </div>
            </div>
        )
    },
    {
        id: 9,
        scrollLabel: 'Scroll 9',
        category: 'Relational Graph',
        title: 'X-Reference Libraries',
        description: 'Visualise multi-library relationships and dependencies to instantly evaluate the downstream impact of policy amendments.',
        renderVisual: () => (
            <div className="modern-preview-content">
                <div className="graph-diagram-wrapper">
                    <svg className="graph-svg-canvas" viewBox="0 0 380 180">
                        <line x1="190" y1="90" x2="80" y2="40" stroke="#bae6fd" strokeWidth="2" />
                        <line x1="190" y1="90" x2="80" y2="140" stroke="#bae6fd" strokeWidth="2" />
                        <line x1="190" y1="90" x2="300" y2="40" stroke="#bae6fd" strokeWidth="2" />
                        <line x1="190" y1="90" x2="300" y2="140" stroke="#bae6fd" strokeWidth="2" />
                        <line x1="300" y1="40" x2="300" y2="140" stroke="#93c5fd" strokeWidth="1.5" strokeDasharray="4 4" />
                    </svg>

                    <div className="diagram-node core-node">
                        <div className="node-id-text">LIB-1001</div>
                        <div className="node-label-text">Credit Policy</div>
                    </div>

                    <div className="diagram-node satellite-node sat-top-left">
                        <div className="node-id-text">LIB-1002</div>
                        <div className="node-label-text">Acceptance</div>
                    </div>

                    <div className="diagram-node satellite-node sat-bottom-left">
                        <div className="node-id-text">LIB-1008</div>
                        <div className="node-label-text">Due Diligence</div>
                    </div>

                    <div className="diagram-node satellite-node sat-top-right">
                        <div className="node-id-text">LIB-1006</div>
                        <div className="node-label-text">Risk Appetite</div>
                    </div>

                    <div className="diagram-node satellite-node sat-bottom-right">
                        <div className="node-id-text">LIB-1009</div>
                        <div className="node-label-text">STR Reporting</div>
                    </div>
                </div>

                <div className="graph-footer-tagline">
                    <span className="tagline-lead">Link references:</span>
                    <span className="tagline-text">Interconnected compliance mapping ensures continuous regulatory alignment.</span>
                </div>
            </div>
        )
    },
    {
        id: 10,
        scrollLabel: 'Scroll 10',
        category: 'RBAC Hierarchy',
        title: 'Multiple Level of Authorization',
        description: 'Multi-tier institutional governance with clearly partitioned duties across Super Users, Admins, and Operations Staff.',
        renderVisual: () => (
            <div className="modern-preview-content">
                <div className="rbac-hierarchy-layout">
                    <div className="tier-strip tier-superadmin">
                        <div className="tier-badge-icon bg-purple-subtle"><ShieldCheck size={14} className="text-purple" /></div>
                        <div className="tier-details">
                            <span className="tier-heading">Super User</span>
                            <span className="tier-caption">Global oversight, multi-bank registries & system master templates</span>
                        </div>
                        <span className="level-badge badge-purple">Tier 1</span>
                    </div>

                    <div className="tier-connector" />

                    <div className="tier-strip tier-admin">
                        <div className="tier-badge-icon bg-blue-subtle"><Shield size={14} className="text-blue" /></div>
                        <div className="tier-details">
                            <span className="tier-heading">Bank Admin</span>
                            <span className="tier-caption">Bank-wide library architecture, user provisioning & approval delegation</span>
                        </div>
                        <span className="level-badge badge-blue">Tier 2</span>
                    </div>

                    <div className="tier-connector" />

                    <div className="tier-strip tier-dept">
                        <div className="tier-badge-icon bg-teal-subtle"><Users size={14} className="text-teal" /></div>
                        <div className="tier-details">
                            <span className="tier-heading">Department Admin</span>
                            <span className="tier-caption">Departmental governance, review queues, and task dispatching</span>
                        </div>
                        <span className="level-badge badge-teal">Tier 3</span>
                    </div>

                    <div className="tier-connector" />

                    <div className="users-triplet-row">
                        <div className="user-triplet-card">
                            <UserCheck size={13} className="text-blue" />
                            <span className="triplet-title">Maker</span>
                            <span className="triplet-desc">Drafts & edits</span>
                        </div>
                        <div className="user-triplet-card">
                            <CheckCircle2 size={13} className="text-teal" />
                            <span className="triplet-title">Checker</span>
                            <span className="triplet-desc">Approves & audits</span>
                        </div>
                        <div className="user-triplet-card">
                            <Eye size={13} className="text-purple" />
                            <span className="triplet-title">Reader</span>
                            <span className="triplet-desc">Read & query</span>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
];

const AUTOPLAY_INTERVAL_MS = 3000;

export default function LoginSlideShow() {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isHovered, setIsHovered] = useState(false);
    const timerRef = useRef(null);

    const activeSlide = SLIDES[currentIndex];

    // Smooth auto-advance
    useEffect(() => {
        if (isHovered) {
            if (timerRef.current) clearInterval(timerRef.current);
            return;
        }

        timerRef.current = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % SLIDES.length);
        }, AUTOPLAY_INTERVAL_MS);

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [currentIndex, isHovered]);

    const handleSelectSlide = (idx) => {
        setCurrentIndex(idx);
    };

    return (
        <div
            className="pro-showcase-root"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Elegant Header Tag */}
            {/* <div className="pro-showcase-header">
                <div className="pro-eyebrow-pill">
                    <span className="eyebrow-scroll">{activeSlide.scrollLabel}</span>
                    <span className="eyebrow-sep">/</span>
                    <span className="eyebrow-cat">{activeSlide.category}</span>
                </div>
            </div> */}

            {/* Typography Intro */}
            <div className="pro-showcase-typography">
                <h2 className="pro-slide-title">{activeSlide.title}</h2>
                <p className="pro-slide-desc">{activeSlide.description}</p>
            </div>

            {/* High-Fidelity Frameless Preview Stage */}
            <div className="pro-preview-stage">
                <div key={activeSlide.id} className="pro-stage-animator">
                    {activeSlide.renderVisual()}
                </div>
            </div>

          
            <div className="pro-indicator-container">
                <div className="pro-dash-track">
                    {SLIDES.map((slide, idx) => (
                        <button
                            key={slide.id}
                            type="button"
                            className={`pro-dash-btn ${idx === currentIndex ? 'active' : ''}`}
                            onClick={() => handleSelectSlide(idx)}
                            aria-label={`Go to ${slide.scrollLabel}`}
                            title={`${slide.scrollLabel}: ${slide.title}`}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
