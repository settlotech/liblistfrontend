import React from 'react';
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
        loading,
        isRefreshing,
        refreshDashboard,
        lastUpdated
    } = useDashboard();

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
                        <div className="simple-card clickable-card" onClick={() => navigate('/home')}>
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
                        <div className="simple-card clickable-card" onClick={() => navigate('/change-management')}>
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
                        <div className="simple-card clickable-card" onClick={() => navigate('/home')}>
                            <div className="card-top">
                                <span className="card-label">Libraries</span>
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
                        <div className="simple-card clickable-card" onClick={() => navigate('/settings')}>
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
                        <div className="simple-card clickable-card" onClick={() => navigate('/tasks')}>
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
                        <div className="simple-card clickable-card" onClick={() => navigate('/home')}>
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
                        <div className="simple-card clickable-card" onClick={() => navigate('/home')}>
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
                        <div className="simple-card clickable-card" onClick={() => navigate('/tasks')}>
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
                        <div className="simple-card clickable-card" onClick={() => navigate('/tasks')}>
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
                        <div className="simple-card clickable-card" onClick={() => navigate('/tasks')}>
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

            {/* ── Content Grid: Recent Policies & Tasks ── */}
            <div className="simple-content-grid">
                {/* Panel 1: Recent Policies */}
                <div className="simple-panel">
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
                </div>

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
