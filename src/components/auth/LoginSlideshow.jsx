import React, { useState, useEffect, useRef } from 'react';
import {
  Folder,
  Layers,
  ShieldCheck,
  MessageSquare,
  CheckSquare,
  FileText,
  FileEdit,
  GitBranch,
  Users,
  Lock,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  BookOpen,
  ArrowRight
} from 'lucide-react';
import multiLevelAuthImg from '../../assets/multi-level-auth.png';
import policyAccessScreenshot from '../../assets/login-slideshow/policy-access.png';
import policyChatScreenshot from '../../assets/login-slideshow/policy-chat.png';
import taskManagementScreenshot from '../../assets/login-slideshow/task-management.png';
import policyAnnotationsScreenshot from '../../assets/login-slideshow/policy-annotations.png';
import libraryCreationScreenshot from '../../assets/login-slideshow/library-creation.png';
import policyLibraryScreenshot from '../../assets/login-slideshow/policy-library.png';
import './LoginSlideshow.css';

const SLIDES = [
  {
    id: 1,
    tag: 'Multi-Type Libraries',
    title: 'Host every type of libraries',
    description: 'Wide range of libraries can be maintained such as Policies, Procedures, Frameworks, Standards, Checklists, and Audit Reports.',
    renderVisual: () => (
      <div className="grid-4-types">
        <div className="type-card">
          <div className="type-card-title">
            <span style={{ width: 10, height: 10, borderRadius: 2, background: '#0284c7', display: 'inline-block' }} />
            <span>Policy</span>
          </div>
          <div className="type-card-count">8 libraries</div>
          <div className="type-card-bar" style={{ background: '#0284c7' }} />
        </div>

        <div className="type-card">
          <div className="type-card-title">
            <span style={{ width: 10, height: 10, borderRadius: 2, background: '#0d9488', display: 'inline-block' }} />
            <span>Procedure</span>
          </div>
          <div className="type-card-count">6 libraries</div>
          <div className="type-card-bar" style={{ background: '#0d9488' }} />
        </div>

        <div className="type-card">
          <div className="type-card-title">
            <span style={{ width: 10, height: 10, borderRadius: 2, background: '#4f46e5', display: 'inline-block' }} />
            <span>Standard</span>
          </div>
          <div className="type-card-count">2 libraries</div>
          <div className="type-card-bar" style={{ background: '#4f46e5' }} />
        </div>

        <div className="type-card">
          <div className="type-card-title">
            <span style={{ width: 10, height: 10, borderRadius: 2, background: '#9333ea', display: 'inline-block' }} />
            <span>Checklist</span>
          </div>
          <div className="type-card-count">3 libraries</div>
          <div className="type-card-bar" style={{ background: '#9333ea' }} />
        </div>
      </div>
    )
  },
  {
    id: 2,
    tag: 'Enterprise Catalog',
    title: 'Organize Libraries - Enterprise Collection',
    description: 'Bring policies, procedures, and standards from every department into one trusted, version-controlled repository.',
    renderVisual: () => (
      <div className="tree-preview-box">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, paddingBottom: 4, borderBottom: '1px solid #f1f5f9' }}>
          <span style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.72rem' }}>MASTER REPOSITORY</span>
          <span className="badge-pill">16 Libraries · 13 Folders</span>
        </div>
        <div className="tree-row">
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Folder size={12} color="#0057B8" />
            <span>Retail Banking</span>
          </span>
          <span className="badge-pill">6</span>
        </div>
        <div className="tree-row selected tree-sub-row">
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <FileText size={11} color="#0057B8" />
            <span>Personal Loan Credit Policy</span>
          </span>
          <span style={{ fontSize: '0.66rem', color: '#0057B8' }}>LIB-1001</span>
        </div>
        <div className="tree-row tree-sub-row">
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <FileText size={11} color="#64748b" />
            <span>Acceptance Criteria</span>
          </span>
          <span style={{ fontSize: '0.66rem', color: '#94a3b8' }}>LIB-1002</span>
        </div>
        <div className="tree-row">
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Folder size={12} color="#0057B8" />
            <span>Compliance & AML</span>
          </span>
          <span className="badge-pill">4</span>
        </div>
      </div>
    )
  },
  {
    id: 3,
    screenshot: policyAccessScreenshot,
    screenshotAlt: 'LibList policy access permissions list',
    tag: 'Access Governance',
    title: 'Access rights aligned to organizational standard',
    description: 'Give each team the right level of access: Edit or View. Confidential and restricted libraries remain completely hidden.',
    renderVisual: () => (
      <div className="access-matrix-card">
        <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>
          DEPARTMENT PERMISSION MATRIX
        </div>
        <div className="access-row">
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.74rem' }}>Credit Risk Officers</div>
            <div style={{ fontSize: '0.68rem', color: '#64748b' }}>Retail & Wholesale Policies</div>
          </div>
          <div className="access-tags">
            <span className="perm-pill view">Can View</span>
            <span className="perm-pill edit">Can Edit</span>
          </div>
        </div>
        <div className="access-row">
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.74rem' }}>Branch Operators</div>
            <div style={{ fontSize: '0.68rem', color: '#64748b' }}>Front-office Manuals</div>
          </div>
          <div className="access-tags">
            <span className="perm-pill view">Can View</span>
          </div>
        </div>
        <div className="access-row">
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.74rem' }}>Restricted Audit Vault</div>
            <div style={{ fontSize: '0.68rem', color: '#64748b' }}>Confidential Records</div>
          </div>
          <div className="access-tags">
            <span className="perm-pill hidden">🔒 Stays Hidden</span>
          </div>
        </div>
      </div>
    )
  },
  {
    id: 4,
    screenshot: policyChatScreenshot,
    screenshotAlt: 'LibList policy chat with a structured answer',
    tag: 'AI Intelligence',
    title: 'Communicate, Collaborate, Clarify',
    description: 'Query LibList to retrieve instant answers with verified clause citations from entitled policy sets.',
    renderVisual: () => (
      <div className="chat-preview-box">
        <div className="chat-bubble-user">
          What income does a salaried applicant need?
        </div>
        <div className="chat-bubble-bot">
          <div>At least INR 30,000 net a month, or INR 35,000 in metro cities [1], with 6 months at their current employer.</div>
          <div className="citation-chip">
            <BookOpen size={10} color="#0057B8" />
            <span>[1] LIB-1002 Personal Loan Acceptance Criteria · Clause 3.2</span>
          </div>
        </div>
      </div>
    )
  },
  {
    id: 5,
    screenshot: taskManagementScreenshot,
    screenshotAlt: 'LibList task management table with task history',
    tag: 'Workflow Actions',
    title: 'Assign and Track Tasks',
    description: 'Assign tasks to self and team members. Track SLA compliance and governance action items in one place.',
    renderVisual: () => (
      <div className="task-card-box">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span style={{ fontWeight: 700, fontSize: '0.74rem', color: '#0f172a' }}>Task Management (9 Total)</span>
        </div>
        <div className="task-tabs-row">
          <span className="task-tab-pill">Assigned to Me (1)</span>
          <span className="task-tab-pill">Assigned by Me (8)</span>
          <span className="task-tab-pill active">All Tasks (9)</span>
        </div>
        <div style={{ padding: '8px 10px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 6 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
            <span style={{ fontSize: '0.68rem', color: '#0057B8', fontWeight: 600 }}>TASK-000818</span>
            <span style={{ fontSize: '0.65rem', background: '#fef3c7', color: '#b45309', padding: '1px 5px', borderRadius: 4, fontWeight: 700 }}>Pending</span>
          </div>
          <div style={{ fontSize: '0.74rem', fontWeight: 600, color: '#0f172a' }}>Credit Policy Annual Clause Verification</div>
          <div style={{ fontSize: '0.68rem', color: '#64748b', marginTop: 3 }}>Assigned to: Jeeva · Due: 20 Nov 2026</div>
        </div>
      </div>
    )
  },
  {
    id: 6,
    screenshot: policyAnnotationsScreenshot,
    screenshotAlt: 'LibList policy viewer with an inline note annotation',
    tag: 'Inline Annotations',
    title: 'Comment and Feedback in Context',
    description: 'Collaborate directly inside policies. Tag colleagues, leave clause-specific notes, and maintain clear review feedback.',
    renderVisual: () => (
      <div className="clause-comment-box">
        <div className="clause-text">
          <strong>Section 3.1:</strong> Minimum net monthly income of INR 30,000 (INR 35,000 in metro cities).
        </div>
        <div className="comment-thread-item">
          <div className="user-avatar-circle">PN</div>
          <div>
            <div style={{ fontWeight: 600, color: '#0f172a' }}>Priya Nair on Details</div>
            <div style={{ color: '#475569', marginTop: 2 }}>@Karthik should metro cities include Pune?</div>
          </div>
        </div>
        <div style={{ fontSize: '0.66rem', color: '#94a3b8', fontStyle: 'italic', marginTop: 4, paddingLeft: 30 }}>
          ✓ Verified and resolved by Department Admin
        </div>
      </div>
    )
  },
  {
    id: 7,
    screenshot: libraryCreationScreenshot,
    screenshotAlt: 'LibList create library screen with policy sections',
    tag: 'Quick Ingestion',
    title: 'Easy Modes for Library Creation',
    description: 'Start from a standard, not a blank page. Create libraries through AI file upload, approved templates, or direct in-system drafting.',
    renderVisual: () => (
      <div className="modal-modes-card">
        <div className="modal-tabs-header">
          <span className="modal-tab-btn active">1. Direct In-System</span>
          <span className="modal-tab-btn">2. Master Library</span>
          <span className="modal-tab-btn">3. Document Upload</span>
        </div>
        <div className="template-grid-mini">
          <div className="tmpl-tile" style={{ borderLeft: '3px solid #0057B8' }}>
            <div style={{ fontWeight: 600 }}>Policy Document</div>
            <div style={{ fontSize: '0.62rem', color: '#64748b' }}>6 Standard Sections</div>
          </div>
          <div className="tmpl-tile" style={{ borderLeft: '3px solid #0d9488' }}>
            <div style={{ fontWeight: 600 }}>Standard SOP</div>
            <div style={{ fontSize: '0.62rem', color: '#64748b' }}>Operational Workflow</div>
          </div>
          <div className="tmpl-tile" style={{ borderLeft: '3px solid #6366f1' }}>
            <div style={{ fontWeight: 600 }}>Executive Summary</div>
            <div style={{ fontSize: '0.62rem', color: '#64748b' }}>Board & Committee</div>
          </div>
          <div className="tmpl-tile" style={{ borderLeft: '3px solid #f59e0b' }}>
            <div style={{ fontWeight: 600 }}>Statutory Standard</div>
            <div style={{ fontSize: '0.62rem', color: '#64748b' }}>Regulatory Mandates</div>
          </div>
        </div>
      </div>
    )
  },
  {
    id: 8,
    screenshot: policyLibraryScreenshot,
    screenshotAlt: 'LibList policy library list with approval status and actions',
    tag: 'Policy Library',
    title: 'Track policies through their lifecycle',
    description: 'Browse policies by status, version, owner, and library, with review actions available from one central list.',
    renderVisual: () => (
      <div className="cm-table-mini">
        <div style={{ display: 'flex', gap: 6, marginBottom: 8, borderBottom: '1px solid #f1f5f9', paddingBottom: 4 }}>
          <span style={{ color: '#0057B8', fontWeight: 700, fontSize: '0.7rem' }}>Change Management Queue</span>
        </div>
        <div className="cm-row">
          <div>
            <div style={{ fontWeight: 600 }}>Personal Loan Policy (Revision)</div>
            <div style={{ fontSize: '0.65rem', color: '#64748b' }}>Parent: v1.0 · Author: Tamil Mani</div>
          </div>
          <span className="cm-status-chip review">Review Pending</span>
        </div>
        <div className="cm-row">
          <div>
            <div style={{ fontWeight: 600 }}>Credit Authority Thresholds</div>
            <div style={{ fontSize: '0.65rem', color: '#64748b' }}>Initial Policy Draft</div>
          </div>
          <span className="cm-status-chip draft">Saved Draft</span>
        </div>
      </div>
    )
  },
  {
    id: 9,
    tag: 'Relational Graph',
    title: 'Cross-Reference Libraries (X-Ref)',
    description: 'Map relational connections between institutional policies, risk frameworks, and statutory circulars.',
    renderVisual: () => (
      <svg className="node-graph-svg" viewBox="0 0 360 170">
        {/* Connecting Lines */}
        <line x1="180" y1="85" x2="60" y2="40" stroke="#93c5fd" strokeWidth="2" strokeDasharray="3,3" />
        <line x1="180" y1="85" x2="300" y2="40" stroke="#93c5fd" strokeWidth="2" />
        <line x1="180" y1="85" x2="70" y2="135" stroke="#93c5fd" strokeWidth="2" />
        <line x1="180" y1="85" x2="290" y2="135" stroke="#93c5fd" strokeWidth="2" strokeDasharray="3,3" />

        {/* Central Hub */}
        <rect x="125" y="65" width="110" height="40" rx="8" fill="#0057B8" />
        <text x="180" y="82" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="700">LIB-1001</text>
        <text x="180" y="94" textAnchor="middle" fill="#bfdbfe" fontSize="8">Credit Policy</text>

        {/* Satellite Nodes */}
        <rect x="15" y="20" width="90" height="34" rx="6" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1.5" />
        <text x="60" y="35" textAnchor="middle" fill="#0f172a" fontSize="8" fontWeight="600">LIB-1002</text>
        <text x="60" y="46" textAnchor="middle" fill="#64748b" fontSize="7">Acceptance</text>

        <rect x="255" y="20" width="90" height="34" rx="6" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1.5" />
        <text x="300" y="35" textAnchor="middle" fill="#0f172a" fontSize="8" fontWeight="600">LIB-1006</text>
        <text x="300" y="46" textAnchor="middle" fill="#64748b" fontSize="7">Risk Appetite</text>

        <rect x="25" y="115" width="90" height="34" rx="6" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1.5" />
        <text x="70" y="130" textAnchor="middle" fill="#0f172a" fontSize="8" fontWeight="600">LIB-1008</text>
        <text x="70" y="141" textAnchor="middle" fill="#64748b" fontSize="7">Due Diligence</text>

        <rect x="245" y="115" width="90" height="34" rx="6" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1.5" />
        <text x="290" y="130" textAnchor="middle" fill="#0f172a" fontSize="8" fontWeight="600">LIB-1009</text>
        <text x="290" y="141" textAnchor="middle" fill="#64748b" fontSize="7">STR Reporting</text>
      </svg>
    )
  },
  {
    id: 10,
    tag: 'Institutional Hierarchy',
    title: 'Multiple Level of Authorization',
    description: 'Structured institutional governance: Super User, Department Admin, Admin, and User authorization levels.',
    renderVisual: () => (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', padding: '4px' }}>
        <img
          src={multiLevelAuthImg}
          alt="Multiple Level of Authorization"
          style={{ maxWidth: '100%', maxHeight: '240px', objectFit: 'contain' }}
        />
      </div>
    )
  }
];

export default function LoginSlideshow({ autoPlayInterval = 5000 }) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef(null);

  const nextSlide = () => {
    setCurrentIdx((prev) => (prev + 1) % SLIDES.length);
  };

  const prevSlide = () => {
    setCurrentIdx((prev) => (prev - 1 + SLIDES.length) % SLIDES.length);
  };

  useEffect(() => {
    if (isPaused) return;
    timerRef.current = setInterval(nextSlide, autoPlayInterval);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentIdx, isPaused, autoPlayInterval]);

  const slide = SLIDES[currentIdx];
  const progressPercent = ((currentIdx + 1) / SLIDES.length) * 100;

  return (
    <div
      className="slideshow-root"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Top progress indicator bar */}
      <div className="slideshow-progress-bar-wrap">
        <div
          className="slideshow-progress-bar"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Slide Header: Badge, Title & Description */}
      <div className="slide-header">
        <div className="slide-badge-row">
          {/* <span className="slide-tag">
            <Sparkles size={11} />
            <span>{slide.tag}</span>
          </span> */}
          {/* <span className="slide-counter">
            Scroll {slide.id} of {SLIDES.length}
          </span> */}
        </div>
        <h3 className="slide-title">{slide.title}</h3>
        <p className="slide-desc">{slide.description}</p>
      </div>

      {/* Central Interactive Visual Component */}
      <div className="slide-stage">
        {slide.screenshot ? (
          <img
            className="slide-feature-screenshot"
            src={slide.screenshot}
            alt={slide.screenshotAlt}
          />
        ) : (
          slide.renderVisual()
        )}
      </div>

      {/* Bottom Controls: Navigation Arrows & Indicator Dots */}
      <div className="slideshow-controls">
        <button
          type="button"
          className="slideshow-nav-btn"
          onClick={prevSlide}
          title="Previous feature"
        >
          <ChevronLeft size={16} />
        </button>

        <div className="slideshow-dots">
          {SLIDES.map((s, idx) => (
            <button
              key={s.id}
              type="button"
              className={`slideshow-dot ${idx === currentIdx ? 'active' : ''}`}
              onClick={() => setCurrentIdx(idx)}
              title={`Go to Scroll ${s.id}: ${s.title}`}
            />
          ))}
        </div>

        <button
          type="button"
          className="slideshow-nav-btn"
          onClick={nextSlide}
          title="Next feature"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
