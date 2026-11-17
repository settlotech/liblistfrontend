import React, { useState } from 'react';
import {
    FileText,
    CheckCircle2,
    Users,
    RefreshCw,
    Clock,
    FileEdit,
    ArrowRight,
    Folder,
    ShieldCheck,
    AlertCircle,
    UserCheck,
    PlusCircle,
    Calendar,
    ChevronRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { DashboardProvider, useDashboard } from '../../context/DashboardContext';
import { useAuth } from '../../context/AuthContext';
import './dashboard.css';

function SimpleDashboardContent() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const {
        metrics,
        changeManagement,
        recentActivity,
        loading,
        isRefreshing,
        refreshDashboard,
        lastUpdated
    } = useDashboard();

    // ── Change Management Widget tab state ──
    const [cmTab, setCmTab] = useState('draft'); // 'draft' | 'in_review'

    // Auto-select tab with active items if drafts are empty
    React.useEffect(() => {
        if (changeManagement) {
            const draftTotal = changeManagement?.draftTotal ?? 0;
            const inRevTotal = changeManagement?.inReviewTotal ?? 0;
            if (draftTotal === 0 && inRevTotal > 0) {
                setCmTab('in_review');
            }
        }
    }, [changeManagement]);

    const isSuperAdmin = metrics?.isSuperAdmin === true ||
        user?.isSuperAdmin === true ||
        (user?.role || '').toLowerCase() === 'super admin' ||
        (user?.role || '').toLowerCase() === 'super_admin';

    const displayName = metrics?.userName || user?.name || 'User';
    const displayRole = metrics?.role || user?.role || (isSuperAdmin ? 'Super Admin' : 'User');

    const recentPolicies = metrics?.recentPolicies || [];
    const recentTasks = metrics?.recentTasks || [];

    const formatDate = (dateStr) => {
        if (!dateStr) return '—';
        try {
            const d = new Date(dateStr);
            return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
        } catch {
            return dateStr;
        }
    };

    const formatTime = (dateObj) => {
        if (!dateObj) return '';
        try {
            return dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } catch {
            return '';
        }
    };

    const formatActivityDetails = (details) => {
        if (typeof details === 'string') return details;
        if (details && typeof details === 'object') {
            if (typeof details.description === 'string') return details.description;
            try { return JSON.stringify(details); } catch { return 'Updated item'; }
        }
        return '';
    };

    return (
        <div className="simple-dashboard">
            {/* ── Top Bar ── */}
            <div className="dashboard-topbar">
                <div>
                    <h1 className="dashboard-heading">
                        Welcome, {displayName}
                    </h1>
                    <p className="dashboard-subheading">
                        {isSuperAdmin
                            ? 'System-wide overview: active operational policies, libraries, users, and tasks.'
                            : 'Personal workspace overview: your operational policies, assigned tasks, and action items.'}
                    </p>
                </div>
                <div className="dashboard-actions">
                    {/* <span className={`role-pill ${isSuperAdmin ? 'super-admin' : 'user-role'}`}>
                        {isSuperAdmin ? <ShieldCheck size={12} /> : <UserCheck size={12} />}
                        {displayRole}
                    </span> */}
                    <button
                        type="button"
                        className="simple-btn"
                        onClick={refreshDashboard}
                        disabled={loading || isRefreshing}
                        title="Refresh metrics"
                    >
                        <RefreshCw size={13} className={isRefreshing || loading ? 'spin' : ''} />
                        <span>{isRefreshing ? 'Refreshing…' : 'Refresh'}</span>
                    </button>
                    {lastUpdated && (
                        <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                            Updated {formatTime(lastUpdated)}
                        </span>
                    )}
                </div>
            </div>

            {/* ── Quick Stats Row ── */}
            <div className="simple-cards-row">
                {isSuperAdmin ? (
                    <>
                        {/* 1. Active Policies */}
                        <div className="simple-card clickable-card" >
                            <div className="card-top">
                                <span className="card-label">Active Policies</span>
                                <div className="card-icon green">
                                    <FileText size={18} />
                                </div>
                            </div>
                            <div className="card-number">
                                {loading ? '…' : (metrics?.active_documents ?? 0)}
                            </div>
                            <div className="card-desc">
                                <span>{metrics?.total_documents ?? 0} total policies registered</span>
                            </div>
                        </div>

                        {/* 2. Drafts & Pending Reviews */}
                        <div className="simple-card clickable-card" >
                            <div className="card-top">
                                <span className="card-label">Drafts / In Review</span>
                                <div className="card-icon amber">
                                    <FileEdit size={18} />
                                </div>
                            </div>
                            <div className="card-number">
                                {loading ? '…' : (metrics?.draft_documents ?? 0)}
                            </div>
                            <div className="card-desc">
                                <span>{metrics?.pending_revisions ?? 0} pending revisions</span>
                            </div>
                        </div>

                        {/* 3. Total Libraries */}
                        <div className="simple-card clickable-card" >
                            <div className="card-top">
                                <span className="card-label">Libraries/Departments</span>
                                <div className="card-icon indigo">
                                    <Folder size={18} />
                                </div>
                            </div>
                            <div className="card-number">
                                {loading ? '…' : (metrics?.total_libraries ?? 0)}
                            </div>
                            <div className="card-desc">
                                <span>{metrics?.total_templates ?? 0} active templates</span>
                            </div>
                        </div>

                        {/* 4. Active Users & Signups */}
                        <div className="simple-card clickable-card"  >
                            <div className="card-top">
                                <span className="card-label">Active Users</span>
                                <div className="card-icon blue">
                                    <Users size={18} />
                                </div>
                            </div>
                            <div className="card-number">
                                {loading ? '…' : (metrics?.active_users ?? 0)}
                            </div>
                            <div className="card-desc">
                                {(metrics?.pending_requests ?? 0) > 0 ? (
                                    <span style={{ color: '#ea580c', fontWeight: 600 }}>
                                        {metrics.pending_requests} pending signups
                                    </span>
                                ) : (
                                    <span>{metrics?.total_users ?? 0} total registered</span>
                                )}
                            </div>
                        </div>

                        {/* 5. Tasks Monitoring */}
                        <div className="simple-card clickable-card" >
                            <div className="card-top">
                                <span className="card-label">Pending Tasks</span>
                                <div className="card-icon purple">
                                    <CheckCircle2 size={18} />
                                </div>
                            </div>
                            <div className="card-number">
                                {loading ? '…' : (metrics?.pending_tasks ?? 0)}
                            </div>
                            <div className="card-desc">
                                {(metrics?.overdue_tasks ?? 0) > 0 ? (
                                    <span style={{ color: '#dc2626', fontWeight: 600 }}>
                                        {metrics.overdue_tasks} overdue tasks
                                    </span>
                                ) : (
                                    <span>{metrics?.completed_tasks ?? 0} completed</span>
                                )}
                            </div>
                        </div>
                    </>
                ) : (
                    <>
                        {/* 1. Total Active Policies */}
                        <div className="simple-card clickable-card"  >
                            <div className="card-top">
                                <span className="card-label">Active Policies</span>
                                <div className="card-icon green">
                                    <ShieldCheck size={18} />
                                </div>
                            </div>
                            <div className="card-number">
                                {loading ? '…' : (metrics?.total_active_policies ?? 0)}
                            </div>
                            <div className="card-desc">
                                <span>Operational policies in effect</span>
                            </div>
                        </div>

                        {/* 2. My Created Policies */}
                        <div className="simple-card clickable-card"  >
                            <div className="card-top">
                                <span className="card-label">My Policies</span>
                                <div className="card-icon blue">
                                    <FileText size={18} />
                                </div>
                            </div>
                            <div className="card-number">
                                {loading ? '…' : (metrics?.my_policies ?? 0)}
                            </div>
                            <div className="card-desc">
                                <span>
                                    {metrics?.my_active_policies ?? 0} active · {metrics?.my_draft_policies ?? 0} draft
                                </span>
                            </div>
                        </div>

                        {/* 3. My Pending Tasks */}
                        <div className="simple-card clickable-card" >
                            <div className="card-top">
                                <span className="card-label">My Pending Tasks</span>
                                <div className="card-icon amber">
                                    <Clock size={18} />
                                </div>
                            </div>
                            <div className="card-number">
                                {loading ? '…' : (metrics?.my_pending_tasks ?? 0)}
                            </div>
                            <div className="card-desc">
                                <span>Assigned tasks to complete</span>
                            </div>
                        </div>

                        {/* 4. Overdue Tasks */}
                        <div className="simple-card clickable-card"  >
                            <div className="card-top">
                                <span className="card-label">Overdue Tasks</span>
                                <div className="card-icon red">
                                    <AlertCircle size={18} />
                                </div>
                            </div>
                            <div className="card-number" style={{ color: (metrics?.my_overdue_tasks ?? 0) > 0 ? '#dc2626' : 'inherit' }}>
                                {loading ? '…' : (metrics?.my_overdue_tasks ?? 0)}
                            </div>
                            <div className="card-desc">
                                {(metrics?.my_overdue_tasks ?? 0) > 0 ? (
                                    <span style={{ color: '#dc2626', fontWeight: 600 }}>Needs immediate attention</span>
                                ) : (
                                    <span>No overdue items</span>
                                )}
                            </div>
                        </div>

                        {/* 5. Completed Tasks */}
                        <div className="simple-card clickable-card" >
                            <div className="card-top">
                                <span className="card-label">Completed Tasks</span>
                                <div className="card-icon green">
                                    <CheckCircle2 size={18} />
                                </div>
                            </div>
                            <div className="card-number">
                                {loading ? '…' : (metrics?.my_completed_tasks ?? 0)}
                            </div>
                            <div className="card-desc">
                                <span>Successfully completed</span>
                            </div>
                        </div>
                    </>
                )}
            </div>

            <div className="dashboard-panels-grid">
            {/* ── Content Grid: Recent Policies & Tasks ── */}
            <div className="simple-content-grid">
                {/* Panel 1: Recent Policies (regular users only) */}
                {!isSuperAdmin && <div className="simple-panel">
                    <div className="simple-panel-header">
                        <h2>{isSuperAdmin ? 'Recent System Policies' : 'Recent Policies'}</h2>
                        <button
                            type="button"
                            className="text-link-btn"
                            onClick={() => navigate('/home')}
                        >
                            View All <ArrowRight size={13} />
                        </button>
                    </div>

                    <div className="simple-list">
                        {loading ? (
                            <div className="empty-message">Loading policies…</div>
                        ) : recentPolicies.length === 0 ? (
                            <div className="empty-message">No recent policies found</div>
                        ) : (
                            recentPolicies.map((doc) => (
                                <div
                                    key={doc.id}
                                    className="simple-list-row clickable-row"
                                    onClick={() => navigate(`/documents/${doc.id}`)}
                                >
                                    <div className="row-main">
                                        <span className="row-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <FileText size={14} style={{ color: '#0057B8', flexShrink: 0 }} />
                                            <span>{doc.document_name || 'Untitled Policy'}</span>
                                        </span>
                                        <span className="row-meta">
                                            {doc.creator_name ? `By ${doc.creator_name} · ` : ''}
                                            {formatDate(doc.created_at)}
                                        </span>
                                    </div>
                                    <span className={`simple-badge ${(doc.status || 'draft').toLowerCase()}`}>
                                        {doc.status || 'Draft'}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </div>}

                {/* Panel 2: Recent Tasks */}
                <div className="simple-panel">
                    <div className="simple-panel-header">
                        <h2>{isSuperAdmin ? 'Recent System Tasks' : 'My Recent Tasks'}</h2>
                        <button
                            type="button"
                            className="text-link-btn"
                            onClick={() => navigate('/tasks')}
                        >
                            Task Workspace <ArrowRight size={13} />
                        </button>
                    </div>

                    <div className="simple-list">
                        {loading ? (
                            <div className="empty-message">Loading tasks…</div>
                        ) : recentTasks.length === 0 ? (
                            <div className="empty-message">No recent tasks found</div>
                        ) : (
                            recentTasks.map((t) => {
                                const isOverdue = t.due_date && new Date(t.due_date) < new Date() && (t.status || '').toLowerCase() !== 'completed';
                                const statusClean = (t.status || 'open').toLowerCase().replace(' ', '_');
                                return (
                                    <div
                                        key={t.id}
                                        className="simple-list-row clickable-row"
                                        onClick={() => navigate('/tasks')}
                                    >
                                        <div className="row-main">
                                            <span className="row-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                {t.task_seq && (
                                                    <span style={{ fontSize: '11px', color: '#0057B8', fontWeight: 700 }}>
                                                        {t.task_seq}:
                                                    </span>
                                                )}
                                                <span>{t.title || 'Untitled Task'}</span>
                                            </span>
                                            <span className="row-meta">
                                                {t.assigned_name ? `Assigned: ${t.assigned_name} · ` : ''}
                                                <Calendar size={11} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '3px' }} />
                                                Due: {formatDate(t.due_date)}
                                            </span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            {isOverdue && (
                                                <span className="simple-badge overdue">
                                                    Overdue
                                                </span>
                                            )}
                                            <span className={`simple-badge ${statusClean}`}>
                                                {t.status || 'Open'}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>

            {isSuperAdmin && Array.isArray(metrics?.policiesByDepartment) && (
                <div className="simple-panel">
                    <div className="simple-panel-header"><h2>Policies by Department</h2><button type="button" className="text-link-btn" onClick={() => navigate('/home')}>Open Library <ArrowRight size={13} /></button></div>
                    <div className="simple-list">
                        {metrics.policiesByDepartment.map((item) => {
                            const max = Math.max(1, ...metrics.policiesByDepartment.map(row => row.policy_count || 0));
                            return <div key={item.department} style={{ padding: '8px 10px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: 5 }}><strong>{item.department}</strong><span>{item.active_count} / {item.policy_count} policies</span></div>
                                <div style={{ height: 4, background: '#eaf0f6', borderRadius: 4 }}><div style={{ width: `${Math.round((item.policy_count / max) * 100)}%`, height: '100%', background: '#0084d6', borderRadius: 4 }} /></div>
                            </div>;
                        })}
                    </div>
                </div>
            )}

            <div className="simple-panel dashboard-activity-panel">
                <div className="simple-panel-header"><h2>My Recent Activity · Last 7 Days</h2></div>
                <div className="simple-list dashboard-activity-list">
                    {loading ? <div className="empty-message">Loading activity…</div> : recentActivity.length === 0 ? <div className="empty-message">No activity in the last 7 days</div> : recentActivity.map((activity) => <div className="simple-list-row" key={activity.id}>
                        <div className="row-main"><span className="row-title">{activity.event_type || 'Activity'} · {formatActivityDetails(activity.details) || activity.entity_type || 'Updated item'}</span><span className="row-meta">{formatDate(activity.created_at)}</span></div>
                    </div>)}
                </div>
            </div>

            {/* ── Change Management Widget ── */}
            {(() => {
                const cmData = changeManagement;
                const savedDrafts  = cmData?.savedDrafts  || [];
                const inReviewList = cmData?.inReview      || [];
                const draftTotal   = cmData?.draftTotal    ?? 0;
                const inRevTotal   = cmData?.inReviewTotal ?? 0;
                const cmItems = cmTab === 'draft' ? savedDrafts : inReviewList;

                return (
                    <div className="simple-panel">
                        {/* Panel Header */}
                        <div className="simple-panel-header">
                            <h2>Change Management</h2>
                            <button
                                type="button"
                                className="text-link-btn"
                                onClick={() => navigate('/change-management')}
                            >
                                View all <ArrowRight size={13} />
                            </button>
                        </div>

                        {/* Tabs */}
                        <div style={{ display: 'flex', gap: '8px', paddingBottom: '12px', borderBottom: '1px solid #f1f5f9', marginBottom: '4px' }}>
                            <button
                                type="button"
                                onClick={() => setCmTab('draft')}
                                style={{
                                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                                    padding: '5px 14px', borderRadius: '20px', border: 'none',
                                    fontWeight: 600, fontSize: '12.5px', cursor: 'pointer',
                                    background: cmTab === 'draft' ? '#f97316' : '#f1f5f9',
                                    color: cmTab === 'draft' ? '#fff' : '#475569',
                                    transition: 'all 0.15s',
                                }}
                            >
                                <FileEdit size={13} />
                                Saved Drafts
                                <span style={{
                                    background: cmTab === 'draft' ? 'rgba(255,255,255,0.3)' : '#e2e8f0',
                                    color: cmTab === 'draft' ? '#fff' : '#64748b',
                                    borderRadius: '10px', padding: '1px 7px', fontSize: '11px', fontWeight: 700,
                                }}>
                                    {loading ? '…' : draftTotal}
                                </span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setCmTab('in_review')}
                                style={{
                                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                                    padding: '5px 14px', borderRadius: '20px', border: 'none',
                                    fontWeight: 600, fontSize: '12.5px', cursor: 'pointer',
                                    background: cmTab === 'in_review' ? '#0057B8' : '#f1f5f9',
                                    color: cmTab === 'in_review' ? '#fff' : '#475569',
                                    transition: 'all 0.15s',
                                }}
                            >
                                <Clock size={13} />
                                In Review
                                <span style={{
                                    background: cmTab === 'in_review' ? 'rgba(255,255,255,0.25)' : (inRevTotal > 0 ? '#fef3c7' : '#e2e8f0'),
                                    color: cmTab === 'in_review' ? '#fff' : (inRevTotal > 0 ? '#b45309' : '#64748b'),
                                    borderRadius: '10px', padding: '1px 7px', fontSize: '11px', fontWeight: 700,
                                }}>
                                    {loading ? '…' : inRevTotal}
                                </span>
                            </button>
                        </div>

                        {/* List */}
                        <div className="simple-list">
                            {loading ? (
                                <div className="empty-message">Loading…</div>
                            ) : cmItems.length === 0 ? (
                                <div className="empty-message">
                                    {cmTab === 'draft' ? 'No saved drafts' : 'No items currently in review'}
                                </div>
                            ) : (
                                cmItems.map((doc) => {
                                    const isRevision = doc.has_pending_revision;
                                    const versionLabel = isRevision
                                        ? `v${doc.current_version_number || 1}.0 → v${doc.pending_revision_version || '?'}`
                                        : `v${doc.current_version_number || 1}.0`;
                                    const dateStr = doc.updated_at
                                        ? new Date(doc.updated_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
                                        : '—';

                                    return (
                                        <div
                                            key={doc.id}
                                            className="simple-list-row clickable-row"
                                            onClick={() => navigate('/change-management')}
                                        >
                                            <div className="row-main">
                                                <span className="row-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    <FileText size={14} style={{ color: '#0057B8', flexShrink: 0 }} />
                                                    <span>{doc.document_name || 'Untitled Policy'}</span>
                                                </span>
                                                <span className="row-meta">
                                                    {doc.library_name ? `${doc.library_name} · ` : ''}
                                                    {versionLabel}
                                                    {doc.author_name ? ` · By ${doc.author_name}` : ''}
                                                </span>
                                            </div>
                                            <span
                                                className={`simple-badge ${cmTab === 'draft' ? 'draft' : 'pending'}`}
                                                style={cmTab === 'in_review' ? { background: '#fef3c7', color: '#b45309' } : {}}
                                            >
                                                {cmTab === 'draft' ? 'Draft' : 'In Review'}
                                            </span>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                );
            })()}
            </div>
        </div>
    );
}

export default function Dashboard() {
    return (
        <DashboardProvider>
            <SimpleDashboardContent />
        </DashboardProvider>
    );
}
