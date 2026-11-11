import React, { useState, useEffect } from 'react';
import {
    FileText,
    CheckCircle2,
    Users,
    UserPlus,
    RefreshCw,
    Clock,
    Check,
    XCircle,
    ArrowRight,
    FileEdit
} from 'lucide-react';
import { apiService } from '../../services/apiService';
import { useNavigate } from 'react-router-dom';
import { DashboardProvider, useDashboard } from '../../context/DashboardContext';
import { DEFAULT_DEPARTMENTS } from '../../data/defaultPolicies';
import './dashboard.css';

function SimpleDashboardContent() {
    const navigate = useNavigate();
    const {
        metrics,
        loading,
        isRefreshing,
        departmentId,
        setDepartmentId,
        refreshDashboard
    } = useDashboard();

    // Change Management tab & local drafts state
    const [cmTab, setCmTab] = useState('drafts');
    const [draftsList, setDraftsList] = useState([]);
    const [pendingList, setPendingList] = useState([]);

    useEffect(() => {
        let isMounted = true;
        apiService.getMakerCheckerItems().then(data => {
            if (!isMounted) return;
            if (data?.drafts) setDraftsList(data.drafts);
            if (data?.pending) setPendingList(data.pending);
        }).catch(() => {});
        return () => { isMounted = false; };
    }, [isRefreshing]);

    const kpis = metrics?.kpis;
    const mc = metrics?.makerChecker;
    const policyLifecycle = metrics?.policyLifecycle;
    const activityTimeline = metrics?.activityTimeline;

    // Filter pending items strictly: show real pending items awaiting review, and never show local drafts
    const allRecent = mc?.recentActivity || [];
    const pendingOnly = allRecent.filter(item => item.status === 'pending');
    const displayApprovals = pendingOnly.length > 0 ? pendingOnly : allRecent.filter(item => item.status !== 'draft');

    return (
        <div className="simple-dashboard">
            {/* Header */}
            <div className="dashboard-topbar">
                <div>
                    <h1 className="dashboard-heading">Dashboard</h1>
                    <p className="dashboard-subheading">Overview of your bank policies, approvals, and compliance.</p>
                </div>

                <div className="dashboard-actions">
                    <select
                        className="simple-select"
                        value={departmentId}
                        onChange={(e) => setDepartmentId(e.target.value)}
                    >
                        <option value="all">All Departments</option>
                        {DEFAULT_DEPARTMENTS.slice(0, 6).map((dept) => (
                            <option key={dept.id} value={dept.id}>
                                {dept.name}
                            </option>
                        ))}
                    </select>

                    <button
                        className="simple-btn"
                        onClick={refreshDashboard}
                        disabled={loading || isRefreshing}
                        title="Refresh"
                    >
                        <RefreshCw size={14} className={isRefreshing ? 'spin' : ''} />
                        <span>{isRefreshing ? 'Updating...' : 'Refresh'}</span>
                    </button>
                </div>
            </div>

            {/* 4 Simple Metric Cards */}
            <div className="simple-cards-row">
                {/* 1. Policies */}
                <div className="simple-card">
                    <div className="card-top">
                        <span className="card-label">Active Policies</span>
                        <div className="card-icon blue"><FileText size={18} /></div>
                    </div>
                    <div className="card-number">{loading ? '...' : kpis?.policies?.active ?? 0}</div>
                    <div className="card-desc">
                        <span>{kpis?.policies?.total ?? 0} total</span> • <span>{kpis?.policies?.draft ?? 0} drafts</span>
                    </div>
                </div>

                {/* 2. Pending Approvals */}
                <div 
                    className="simple-card cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => navigate('/changelogs?tab=in_review')}
                    title="Open In Review Queue in Change Management"
                >
                    <div className="card-top">
                        <span className="card-label">Pending Reviews</span>
                        <div className="card-icon orange"><Clock size={18} /></div>
                    </div>
                    <div className="card-number text-orange">{loading ? '...' : kpis?.makerChecker?.pending ?? 0}</div>
                    <div className="card-desc">
                        <span>{kpis?.makerChecker?.approved ?? 0} approved</span> • <span>{kpis?.makerChecker?.rejected ?? 0} rejected</span>
                    </div>
                </div>

                {/* 3. Compliance */}
                <div className="simple-card">
                    <div className="card-top">
                        <span className="card-label">Compliance Rate</span>
                        <div className="card-icon green"><CheckCircle2 size={18} /></div>
                    </div>
                    <div className="card-number text-green">
                        {loading ? '...' : `${kpis?.compliance?.complianceRate ?? 100}%`}
                    </div>
                    <div className="card-desc">
                        <span>{kpis?.compliance?.completedTasks ?? 0} tasks completed</span>
                    </div>
                </div>

                {/* 4. Active Users */}
                <div className="simple-card">
                    <div className="card-top">
                        <span className="card-label">Active Users</span>
                        <div className="card-icon purple"><Users size={18} /></div>
                    </div>
                    <div className="card-number">{loading ? '...' : kpis?.access?.activeUsers ?? 0}</div>
                    <div className="card-desc">
                        <span>{kpis?.access?.totalUsers ?? 0} accounts in system</span>
                    </div>
                </div>

                {/* 5. New User Requests */}
                <div className="simple-card clickable-card" onClick={() => navigate('/settings')}>
                    <div className="card-top">
                        <span className="card-label">New User Requests</span>
                        <div className="card-icon amber"><UserPlus size={18} /></div>
                    </div>
                    <div className="card-number text-amber">
                        {loading ? '...' : (kpis?.userRequests?.pending ?? kpis?.access?.pendingSignups ?? 0)}
                    </div>
                    <div className="card-desc">
                        <span>{kpis?.userRequests?.total ?? 0} total requests</span> • <span className="view-link">Review &rarr;</span>
                    </div>
                </div>
            </div>

            {/* 2 Main Simple Blocks */}
            <div className="simple-content-grid">
                {/* Block 1: Change Management (Saved Drafts & In Review Approvals) */}
                <div className="simple-panel">
                    <div className="simple-panel-header flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-3">
                            <h2>Change Management</h2>
                            <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-xs">
                                <button
                                    type="button"
                                    onClick={() => setCmTab('drafts')}
                                    className={`px-2.5 py-1 rounded-md font-bold transition cursor-pointer ${
                                        cmTab === 'drafts'
                                            ? 'bg-amber-500 text-white shadow-xs'
                                            : 'text-slate-600 hover:text-slate-900'
                                    }`}
                                >
                                    Saved Drafts ({draftsList.length})
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setCmTab('in_review')}
                                    className={`px-2.5 py-1 rounded-md font-bold transition cursor-pointer ${
                                        cmTab === 'in_review'
                                            ? 'bg-[#0057B8] text-white shadow-xs'
                                            : 'text-slate-600 hover:text-slate-900'
                                    }`}
                                >
                                    In Review ({pendingList.length || displayApprovals.length})
                                </button>
                            </div>
                        </div>
                        <button 
                            className="text-link-btn" 
                            onClick={() => navigate(`/changelogs?tab=${cmTab}`)}
                            title="View all in Change Management"
                        >
                            View all <ArrowRight size={13} />
                        </button>
                    </div>

                    <div className="simple-list">
                        {cmTab === 'drafts' ? (
                            draftsList.length === 0 ? (
                                <div className="empty-message">No saved drafts found. Authored drafts appear here!</div>
                            ) : (
                                draftsList.slice(0, 4).map((draft) => (
                                    <div 
                                        key={draft.id} 
                                        className="simple-list-row cursor-pointer hover:bg-slate-50 transition-colors"
                                        onClick={() => navigate('/changelogs?tab=drafts')}
                                        title="Click to view/edit draft in Change Management"
                                    >
                                        <div className="row-main">
                                            <div className="row-title font-medium text-slate-800">{draft.title}</div>
                                            <div className="row-meta">
                                                {draft.department_name || draft.department_id || 'General'} • v{draft.version || '1.0'} • By {draft.created_by || 'Draft Author'}
                                            </div>
                                        </div>
                                        <span className="simple-badge" style={{ background: '#fef3c7', color: '#b45309' }}>
                                            <FileEdit size={11} />
                                            Draft
                                        </span>
                                    </div>
                                ))
                            )
                        ) : (
                            (!displayApprovals || displayApprovals.length === 0) ? (
                                <div className="empty-message">No pending reviews right now. All caught up!</div>
                            ) : (
                                displayApprovals.slice(0, 4).map((item) => (
                                    <div 
                                        key={item.id} 
                                        className="simple-list-row cursor-pointer hover:bg-slate-50 transition-colors"
                                        onClick={() => navigate(`/changelogs?tab=in_review&item=${item.id}`)}
                                        title="Click to review in Change Management"
                                    >
                                        <div className="row-main">
                                            <div className="row-title font-medium text-slate-800">{item.policy_title}</div>
                                            <div className="row-meta">
                                                {item.department_name || 'General'} • By {item.maker_name || 'Staff'}
                                            </div>
                                        </div>
                                        <span className={`simple-badge ${item.status}`}>
                                            {item.status === 'approved' && <Check size={11} />}
                                            {item.status === 'rejected' && <XCircle size={11} />}
                                            {item.status === 'pending' && <Clock size={11} />}
                                            {item.status}
                                        </span>
                                    </div>
                                ))
                            )
                        )}
                    </div>
                </div>

                {/* Block 2: Department Policy Overview */}
                <div className="simple-panel">
                    <div className="simple-panel-header">
                        <h2>Policies by Department</h2>
                        <button className="text-link-btn" onClick={() => navigate('/home')}>
                            Open Library <ArrowRight size={13} />
                        </button>
                    </div>

                    <div className="simple-dept-list">
                        {(policyLifecycle?.departmentDistribution || []).slice(0, 5).map((dept) => {
                            const pct = Math.min(100, Math.round((dept.active / Math.max(dept.total, 1)) * 100));
                            return (
                                <div key={dept.id} className="dept-item">
                                    <div className="dept-row">
                                        <span className="dept-name">{dept.name}</span>
                                        <span className="dept-count">{dept.active} / {dept.total} policies</span>
                                    </div>
                                    <div className="dept-bar-bg">
                                        <div className="dept-bar-fill" style={{ width: `${pct}%` }} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Simple Recent Activity Footer */}
            <div className="simple-panel">
                <div className="simple-panel-header">
                    <h2>Recent Activity</h2>
                </div>
                <div className="simple-activity-list">
                    {(!activityTimeline?.recentLogs || activityTimeline.recentLogs.length === 0) ? (
                        <div className="empty-message">No recent activity recorded.</div>
                    ) : (
                        activityTimeline.recentLogs.slice(0, 4).map((log) => (
                            <div key={log.id} className="activity-row">
                                <span className={`action-tag ${log.action?.toLowerCase() || 'configured'}`}>
                                    {log.action}
                                </span>
                                <span className="activity-text">
                                    <strong>{log.user_name}</strong> {log.details}
                                </span>
                                <span className="activity-date">
                                    {new Date(log.timestamp).toLocaleDateString()}
                                </span>
                            </div>
                        ))
                    )}
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
