import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
    fetchUserRequestsApi,
    reviewUserRequestApi,
    createUserApi,
    fetchRolesApi
} from '../../services/userrequest.service';
import './Setting.css';
import './userRequest.css';
import {
    UserCheck,
    UserX,
    CheckCircle,
    XCircle,
    Clock,
    Mail,
    Lock,
    RefreshCw,
    Search,
    X,
    AlertCircle,
    Eye,
    EyeOff,
    Shield,
    Calendar,
    User as UserIcon,
    Sparkles,
    Check,
    CheckSquare
} from 'lucide-react';

export default function Userrequest() {
    // Data states
    const [requests, setRequests] = useState([]);
    const [allRoles, setAllRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [successNotice, setSuccessNotice] = useState(null);

    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');  

    // Approve & Create User Modal
    const [isApproveOpen, setIsApproveOpen] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [approveForm, setApproveForm] = useState({
        name: '',
        email: '',
        password: '',
        is_active: true,
        roleIds: []
    });
    const [showPassword, setShowPassword] = useState(false);
    const [approveLoading, setApproveLoading] = useState(false);
    const [approveError, setApproveError] = useState(null);

    // Reject Modal
    const [isRejectOpen, setIsRejectOpen] = useState(false);
    const [rejectTarget, setRejectTarget] = useState(null);
    const [rejectionReason, setRejectionReason] = useState('');
    const [rejectLoading, setRejectLoading] = useState(false);
    const [rejectError, setRejectError] = useState(null);

    // Details Modal
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [detailsTarget, setDetailsTarget] = useState(null);

    const { hasPermission } = useAuth();
    const canReadRoles = hasPermission('roles', 'read');

    // Fetch requests and roles
    const loadData = async () => {
        setLoading(true);
        setError(null);
        try {
            const [requestsData, rolesData] = await Promise.all([
                fetchUserRequestsApi(),
                canReadRoles ? fetchRolesApi().catch(() => []) : Promise.resolve([])
            ]);
            setRequests(requestsData || []);
            setAllRoles(rolesData || []);
        } catch (err) {
            setError(err.message || 'Failed to load user signup requests');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const showSuccess = (msg) => {
        setSuccessNotice(msg);
        setTimeout(() => setSuccessNotice(null), 5000);
    };
 
    const generatePassword = () => {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
        let pass = '';
        for (let i = 0; i < 10; i++) {
            pass += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        setApproveForm((prev) => ({ ...prev, password: pass }));
        setShowPassword(true);
    }; 
   
    const handleOpenApprove = (req) => {
        setSelectedRequest(req); 
        const defaultUserRole = allRoles.find((r) => r.role_name?.toLowerCase() === 'user');
        setApproveForm({
            name: req.user_name || '',
            email: req.user_email || '',
            password: '',
            is_active: true,
            roleIds: defaultUserRole ? [defaultUserRole.id] : []
        });
        setShowPassword(false);
        setApproveError(null);
        setIsApproveOpen(true);
    };

    const handleToggleRole = (roleId) => {
        setApproveForm((prev) => {
            const exists = prev.roleIds.includes(roleId);
            return {
                ...prev,
                roleIds: exists
                    ? prev.roleIds.filter((id) => id !== roleId)
                    : [...prev.roleIds, roleId]
            };
        });
    };

 
    const handleApproveSubmit = async (e) => {
        e.preventDefault();
        if (!selectedRequest) return;

        if (!approveForm.name.trim()) {
            setApproveError('Full name is required.');
            return;
        }
        if (!approveForm.email.trim()) {
            setApproveError('Email address is required.');
            return;
        }
        if (!approveForm.password || approveForm.password.length < 6) {
            setApproveError('Password must contain at least 6 characters.');
            return;
        }

        setApproveLoading(true);
        setApproveError(null);

        try {
            // 1. Create the user account with the verified requested email
            try {
                await createUserApi({
                    name: approveForm.name.trim(),
                    email: approveForm.email.trim().toLowerCase(),
                    password: approveForm.password,
                    is_active: approveForm.is_active,
                    roleIds: approveForm.roleIds
                });
            } catch (createErr) {
                // If user already exists in users table, allow continuing to approve the request
                if (!createErr.message?.toLowerCase().includes('already exists')) {
                    throw createErr;
                }
            }

            // 2. Mark user request as approved in database & notify applicant with credentials
            await reviewUserRequestApi(selectedRequest.id, {
                status: 'approved',
                password: approveForm.password
            });

            setIsApproveOpen(false);
            showSuccess(`User "${approveForm.name}" created and signup request approved successfully!`);
            loadData();
        } catch (err) {
            setApproveError(err.message || 'Failed to approve request and create user.');
        } finally {
            setApproveLoading(false);
        }
    };

    
    const handleOpenReject = (req) => {
        setRejectTarget(req);
        setRejectionReason('');
        setRejectError(null);
        setIsRejectOpen(true);
    };

    const handleRejectSubmit = async (e) => {
        e.preventDefault();
        if (!rejectTarget) return;

        setRejectLoading(true);
        setRejectError(null);

        try {
            await reviewUserRequestApi(rejectTarget.id, {
                status: 'rejected',
                rejection_reason: rejectionReason.trim() || undefined
            });
            setIsRejectOpen(false);
            showSuccess(`Request for "${rejectTarget.user_email}" has been rejected.`);
            loadData();
        } catch (err) {
            setRejectError(err.message || 'Failed to reject signup request.');
        } finally {
            setRejectLoading(false);
        }
    };

 
    const handleOpenDetails = (req) => {
        setDetailsTarget(req);
        setIsDetailsOpen(true);
    };

    // Count pending requests
    const pendingCount = useMemo(() => {
        return requests.filter((r) => r.status === 'pending').length;
    }, [requests]);

    // Filter requests
    const filteredRequests = useMemo(() => {
        return requests.filter((item) => {
            const matchesStatus =
                statusFilter === 'all' ? true : item.status === statusFilter;
            const q = searchQuery.toLowerCase().trim();
            const matchesSearch =
                !q ||
                (item.user_email && item.user_email.toLowerCase().includes(q)) ||
                (item.user_name && item.user_name.toLowerCase().includes(q));

            return matchesStatus && matchesSearch;
        });
    }, [requests, statusFilter, searchQuery]);

    const formatDate = (dateStr) => {
        if (!dateStr) return '—';
        try {
            return new Date(dateStr).toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch {
            return dateStr;
        }
    };

    return (
        <div className="setting-subtab-container">
            {/* Header / Intro */}
            <div className="setting-section-header">
                <div>
                    <h3 className="setting-section-title">New User Requests</h3>
                    <p className="setting-section-desc">
                        Review incoming signup requests, verify email status, and approve accounts with role assignments
                    </p>
                </div>
                <div className="setting-header-actions">
                    <button
                        className="btn btn-secondary btn-sm"
                        onClick={loadData}
                        disabled={loading}
                        title="Refresh requests list"
                    >
                        <RefreshCw size={14} className={loading ? 'spin' : ''} />
                        <span>Refresh</span>
                    </button>
                </div>
            </div>

            {/* Success Notice */}
            {successNotice && (
                <div className="setting-alert-success mb-3">
                    <CheckCircle size={16} />
                    <span>{successNotice}</span>
                </div>
            )}

            {/* Error Notice */}
            {error && (
                <div className="setting-alert-error mb-3">
                    <AlertCircle size={16} />
                    <span>{error}</span>
                </div>
            )}

            {/* Search & Status Filters */}
            <div className="user-request-filter-bar">
                <div className="user-request-search-box">
                    <Search size={15} style={{ color: 'var(--text-muted, #94a3b8)' }} />
                    <input
                        type="text"
                        placeholder="Search by name or email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="user-request-search-input"
                    />
                    {searchQuery && (
                        <button className="clear-search-btn" onClick={() => setSearchQuery('')}>
                            <X size={13} />
                        </button>
                    )}
                </div>

                <div className="user-request-status-tabs">
                    <button
                        className={`user-request-status-tab-btn ${statusFilter === 'all' ? 'active' : ''}`}
                        onClick={() => setStatusFilter('all')}
                    >
                        <span>All</span>
                        <span className="tab-badge">{requests.length}</span>
                    </button>
                    <button
                        className={`user-request-status-tab-btn ${statusFilter === 'pending' ? 'active' : ''}`}
                        onClick={() => setStatusFilter('pending')}
                    >
                        <span>Pending</span>
                        {pendingCount > 0 && <span className="tab-badge">{pendingCount}</span>}
                    </button>
                    <button
                        className={`user-request-status-tab-btn ${statusFilter === 'approved' ? 'active' : ''}`}
                        onClick={() => setStatusFilter('approved')}
                    >
                        <span>Approved</span>
                    </button>
                    <button
                        className={`user-request-status-tab-btn ${statusFilter === 'rejected' ? 'active' : ''}`}
                        onClick={() => setStatusFilter('rejected')}
                    >
                        <span>Rejected</span>
                    </button>
                </div>
            </div>

            {/* Requests Table */}
            <div className="setting-table-container">
                <table className="setting-data-table">
                    <thead>
                        <tr>
                            <th>Requested User</th>
                            <th>Email Verification</th>
                            <th>Request Status</th>
                            <th>Requested At</th>
                            <th>Review Info</th>
                            <th className="text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={6} className="table-empty-row">
                                    <div className="loading-spinner-row">
                                        <RefreshCw size={18} className="spin" />
                                        <span>Loading user requests from database...</span>
                                    </div>
                                </td>
                            </tr>
                        ) : filteredRequests.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="table-empty-row">
                                    <Clock size={32} className="empty-icon" />
                                    <p>No user requests found matching your filter criteria.</p>
                                </td>
                            </tr>
                        ) : (
                            filteredRequests.map((req) => {
                                const initials = req.user_name
                                    ? req.user_name
                                          .split(' ')
                                          .map((n) => n[0])
                                          .join('')
                                          .slice(0, 2)
                                          .toUpperCase()
                                    : (req.user_email?.[0] || 'U').toUpperCase();

                                const isPending = req.status === 'pending';
                                const isApproved = req.status === 'approved';
                                const isRejected = req.status === 'rejected';

                                return (
                                    <tr key={req.id}>
                                        {/* User Details */}
                                        <td>
                                            <div className="user-profile-cell">
                                                <div className="user-avatar-sm">{initials}</div>
                                                <div>
                                                    <div className="user-name-title">
                                                        {req.user_name || 'No name provided'}
                                                    </div>
                                                    <div className="user-email-sub">{req.user_email}</div>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Email Verification */}
                                        <td>
                                            {req.is_email_verified ? (
                                                <span className="status-pill verified">
                                                    <CheckCircle size={12} /> Verified
                                                </span>
                                            ) : (
                                                <span className="status-pill unverified">
                                                    <Clock size={12} /> Unverified OTP
                                                </span>
                                            )}
                                        </td>

                                        {/* Status */}
                                        <td>
                                            {isPending && (
                                                <span className="status-pill pending">
                                                    <Clock size={12} /> Pending Review
                                                </span>
                                            )}
                                            {isApproved && (
                                                <span className="status-pill approved">
                                                    <CheckCircle size={12} /> Approved
                                                </span>
                                            )}
                                            {isRejected && (
                                                <span className="status-pill rejected">
                                                    <XCircle size={12} /> Rejected
                                                </span>
                                            )}
                                        </td>

                                        {/* Requested Date */}
                                        <td>
                                            <span style={{ fontSize: '12px', color: 'var(--text-secondary, #64748b)' }}>
                                                {formatDate(req.created_at)}
                                            </span>
                                        </td>

                                        {/* Review info */}
                                        <td>
                                            {req.reviewed_by_name ? (
                                                <div style={{ fontSize: '12px', lineHeight: '1.4' }}>
                                                    <div style={{ fontWeight: 600, color: 'var(--text-primary, #0f172a)' }}>
                                                        {req.reviewed_by_name}
                                                    </div>
                                                    <div style={{ fontSize: '11px', color: 'var(--text-secondary, #64748b)' }}>
                                                        {formatDate(req.reviewed_at)}
                                                    </div>
                                                </div>
                                            ) : (
                                                <span style={{ fontSize: '12px', color: 'var(--text-muted, #94a3b8)' }}>
                                                    Not reviewed yet
                                                </span>
                                            )}
                                        </td>

                                        {/* Actions */}
                                        <td>
                                            <div className="table-actions-cell">
                                                {isPending ? (
                                                    <>
                                                        <button
                                                            className="btn btn-xs btn-approve"
                                                            onClick={() => handleOpenApprove(req)}
                                                            disabled={!req.is_email_verified}
                                                            title={
                                                                req.is_email_verified
                                                                    ? 'Approve and create user account'
                                                                    : 'Email verification must be completed first'
                                                            }
                                                            style={{
                                                                opacity: req.is_email_verified ? 1 : 0.5,
                                                                cursor: req.is_email_verified ? 'pointer' : 'not-allowed'
                                                            }}
                                                        >
                                                            <UserCheck size={13} />
                                                            <span>Approve</span>
                                                        </button>
                                                        <button
                                                            className="btn btn-xs btn-reject"
                                                            onClick={() => handleOpenReject(req)}
                                                            disabled={!req.is_email_verified}
                                                            title="Reject this signup request"
                                                            style={{
                                                                opacity: req.is_email_verified ? 1 : 0.5,
                                                                cursor: req.is_email_verified ? 'pointer' : 'not-allowed'
                                                            }}
                                                        >
                                                            <UserX size={13} />
                                                            <span>Reject</span>
                                                        </button>
                                                    </>
                                                ) : (
                                                    <button
                                                        className="btn btn-secondary btn-xs"
                                                        onClick={() => handleOpenDetails(req)}
                                                        title="View complete request and review details"
                                                    >
                                                        <span>View Details</span>
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* ── APPROVE & CREATE USER MODAL (RESPONSIVE GRID PATTERN) ── */}
            {isApproveOpen && selectedRequest && (
                <div className="modal-overlay" onClick={() => setIsApproveOpen(false)}>
                    <div
                        className="modal-card approve-modal-container"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="modal-header">
                            <div>
                                <h4>Approve Request & Create User</h4>
                                <p className="modal-subtitle">
                                    Review applicant identity, assign platform roles, and initialize user credentials
                                </p>
                            </div>
                            <button
                                className="modal-close-btn"
                                onClick={() => setIsApproveOpen(false)}
                                disabled={approveLoading}
                            >
                                <X size={16} />
                            </button>
                        </div>

                        <form onSubmit={handleApproveSubmit}>
                            <div className="modal-body" style={{ maxHeight: '72vh', overflowY: 'auto' }}>
                                {approveError && (
                                    <div className="setting-alert-error mb-3">
                                        <AlertCircle size={14} />
                                        <span>{approveError}</span>
                                    </div>
                                )}

                                {/* Requested User Summary Grid Pattern */}
                                <div className="req-summary-grid-pattern">
                                    <div className="req-summary-tile">
                                        <div className="req-tile-icon">
                                            <UserIcon size={16} />
                                        </div>
                                        <div className="req-tile-content">
                                            <span className="req-tile-label">Applicant Name</span>
                                            <span className="req-tile-val">
                                                {selectedRequest.user_name || 'Not provided'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="req-summary-tile">
                                        <div className="req-tile-icon">
                                            <Mail size={16} />
                                        </div>
                                        <div className="req-tile-content">
                                            <span className="req-tile-label">Requested Email</span>
                                            <span className="req-tile-val" title={selectedRequest.user_email}>
                                                {selectedRequest.user_email}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="req-summary-tile">
                                        <div className="req-tile-icon" style={{ color: '#0369a1', background: '#e0f2fe' }}>
                                            <CheckCircle size={16} />
                                        </div>
                                        <div className="req-tile-content">
                                            <span className="req-tile-label">Verification Status</span>
                                            <span className="req-tile-val" style={{ color: '#0369a1' }}>
                                                OTP Verified
                                            </span>
                                        </div>
                                    </div>

                                    <div className="req-summary-tile">
                                        <div className="req-tile-icon">
                                            <Calendar size={16} />
                                        </div>
                                        <div className="req-tile-content">
                                            <span className="req-tile-label">Submitted On</span>
                                            <span className="req-tile-val">
                                                {formatDate(selectedRequest.created_at)}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Form Grid: 2-Column Responsive Pattern */}
                                <div className="form-grid-pattern">
                                    {/* Email Field (Col 1: Locked to requested email) */}
                                    <div className="form-field-group form-grid-col-1">
                                        <label>
                                            <span>Email Address <strong style={{ color: '#dc2626' }}>*</strong></span>
                                        </label>
                                        <div className="locked-input-container">
                                            <input
                                                type="email"
                                                value={approveForm.email}
                                                readOnly
                                                disabled
                                                required
                                            />
                                            <span className="locked-pill">
                                                <Lock size={10} /> Same Email
                                            </span>
                                        </div>
                                        <small style={{ fontSize: '11px', color: 'var(--text-secondary, #64748b)' }}>
                                            User account is registered with this verified email
                                        </small>
                                    </div>

                                    {/* Full Name Field (Col 2: Editable) */}
                                    <div className="form-field-group form-grid-col-1">
                                        <label>
                                            <span>Full Name <strong style={{ color: '#dc2626' }}>*</strong></span>
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="e.g. John Doe"
                                            value={approveForm.name}
                                            onChange={(e) =>
                                                setApproveForm({ ...approveForm, name: e.target.value })
                                            }
                                            required
                                        />
                                        <small style={{ fontSize: '11px', color: 'var(--text-secondary, #64748b)' }}>
                                            Display name on the platform
                                        </small>
                                    </div>

                                    {/* Initial Password Field (Col 1) */}
                                    <div className="form-field-group form-grid-col-1">
                                        <label>
                                            <span>Password <strong style={{ color: '#dc2626' }}>*</strong></span>
                                            <button
                                                type="button"
                                                className="btn btn-secondary btn-xs"
                                                onClick={generatePassword}
                                                style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '1px 7px', fontSize: '10px' }}
                                                title="Generate strong random password"
                                            >
                                                  Auto-Generate
                                            </button>
                                        </label>
                                        <div className="password-box-relative">
                                            <input
                                                type={showPassword ? 'text' : 'password'}
                                                placeholder="Minimum 6 characters"
                                                value={approveForm.password}
                                                onChange={(e) =>
                                                    setApproveForm({ ...approveForm, password: e.target.value })
                                                }
                                                required
                                            />
                                            <button
                                                type="button"
                                                className="password-eye-toggle"
                                                onClick={() => setShowPassword(!showPassword)}
                                                tabIndex="-1"
                                                title={showPassword ? 'Hide password' : 'Show password'}
                                            >
                                                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                                            </button>
                                        </div>
                                        <small style={{ fontSize: '11px', color: 'var(--text-secondary, #64748b)' }}>
                                            Temporary or initial login credential
                                        </small>
                                    </div>

                                    {/* Account Active Toggle Card (Col 2) */}
                                    <div className="form-field-group form-grid-col-1">
                                        <label>
                                            <span>Account Status</span>
                                            <span style={{ fontSize: '11px', color: approveForm.is_active ? '#16a34a' : 'var(--text-secondary, #64748b)', fontWeight: 600 }}>
                                                {approveForm.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </label>
                                        <div
                                            className="account-status-card"
                                            onClick={() => setApproveForm({ ...approveForm, is_active: !approveForm.is_active })}
                                        >
                                            <div className="account-status-info">
                                                <span className={`status-indicator-dot ${approveForm.is_active ? '' : 'inactive'}`} />
                                                <span>{approveForm.is_active ? 'Active User Account' : 'Inactive User Account'}</span>
                                            </div>
                                            <label className="ios-switch" onClick={(e) => e.stopPropagation()}>
                                                <input
                                                    type="checkbox"
                                                    checked={approveForm.is_active}
                                                    onChange={(e) =>
                                                        setApproveForm({ ...approveForm, is_active: e.target.checked })
                                                    }
                                                />
                                                <span className="ios-slider" />
                                            </label>
                                        </div>
                                        <small style={{ fontSize: '11px', color: 'var(--text-secondary, #64748b)' }}>
                                            {approveForm.is_active
                                                ? 'User will be allowed to log in immediately'
                                                : 'Account is created in a disabled state'}
                                        </small>
                                    </div>

                                    {/* Roles Selection (Full Width 2-Column Grid) */}
                                    <div className="form-field-group form-grid-col-2" style={{ marginTop: '4px' }}>
                                        <label>
                                            <span>Assign Platform Roles</span>
                                            <span style={{ fontSize: '11px', color: 'var(--text-secondary, #64748b)' }}>
                                                {approveForm.roleIds.length} role(s) selected
                                            </span>
                                        </label>
                                        <div className="roles-grid-pattern">
                                            {allRoles.length === 0 ? (
                                                <div style={{ padding: '12px', fontSize: '12px', color: 'var(--text-muted, #94a3b8)', gridColumn: '1 / -1' }}>
                                                    No roles configured in database
                                                </div>
                                            ) : (
                                                allRoles.map((role) => {
                                                    const isChecked = approveForm.roleIds.includes(role.id);
                                                    return (
                                                        <div
                                                            key={role.id}
                                                            className={`role-card-grid-item ${isChecked ? 'selected' : ''}`}
                                                            onClick={() => handleToggleRole(role.id)}
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                checked={isChecked}
                                                                onChange={() => handleToggleRole(role.id)}
                                                                onClick={(e) => e.stopPropagation()}
                                                            />
                                                            <div className="role-grid-info">
                                                                <span className="role-grid-title">
                                                                    <Shield size={12} style={{ color: 'var(--btn-primary-bg, #075bb9)', flexShrink: 0 }} />
                                                                    <span>{role.role_name}</span>
                                                                </span>
                                                                <span className="role-grid-desc">
                                                                    {role.description || 'Standard platform role'}
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

                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => setIsApproveOpen(false)}
                                    disabled={approveLoading}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-approve"
                                    disabled={approveLoading}
                                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                                >
                                    {approveLoading ? (
                                        <>
                                            <RefreshCw size={14} className="spin" />
                                            <span>Creating & Approving...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Check size={14} />
                                            <span>Approve & Create User</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── REJECT MODAL ── */}
            {isRejectOpen && rejectTarget && (
                <div className="modal-overlay" onClick={() => setIsRejectOpen(false)}>
                    <div
                        className="modal-card"
                        onClick={(e) => e.stopPropagation()}
                        style={{ maxWidth: '480px' }}
                    >
                        <div className="modal-header">
                            <div>
                                <h4 style={{ color: '#dc2626' }}>Reject Signup Request</h4>
                                <p className="modal-subtitle">
                                    Reject request for <strong>{rejectTarget.user_email}</strong>
                                </p>
                            </div>
                            <button
                                className="modal-close-btn"
                                onClick={() => setIsRejectOpen(false)}
                                disabled={rejectLoading}
                            >
                                <X size={16} />
                            </button>
                        </div>

                        <form onSubmit={handleRejectSubmit}>
                            <div className="modal-body">
                                {rejectError && (
                                    <div className="setting-alert-error mb-3">
                                        <AlertCircle size={14} />
                                        <span>{rejectError}</span>
                                    </div>
                                )}

                                <p style={{ fontSize: '13px', color: 'var(--text-secondary, #64748b)', marginBottom: '14px' }}>
                                    Are you sure you want to reject this signup request? The applicant will not be granted account access.
                                </p>

                                <div className="form-field-group">
                                    <label>Rejection Reason (Optional)</label>
                                    <textarea
                                        className="form-input"
                                        rows={3}
                                        placeholder="Explain why this request is being rejected..."
                                        value={rejectionReason}
                                        onChange={(e) => setRejectionReason(e.target.value)}
                                        style={{ resize: 'vertical', minHeight: '80px' }}
                                    />
                                </div>
                            </div>

                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => setIsRejectOpen(false)}
                                    disabled={rejectLoading}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-reject"
                                    disabled={rejectLoading}
                                >
                                    {rejectLoading ? 'Rejecting...' : 'Confirm Rejection'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── DETAILS MODAL ── */}
            {isDetailsOpen && detailsTarget && (
                <div className="modal-overlay" onClick={() => setIsDetailsOpen(false)}>
                    <div
                        className="modal-card"
                        onClick={(e) => e.stopPropagation()}
                        style={{ maxWidth: '540px' }}
                    >
                        <div className="modal-header">
                            <div>
                                <h4>Signup Request Details</h4>
                                <p className="modal-subtitle">Full history and review log</p>
                            </div>
                            <button className="modal-close-btn" onClick={() => setIsDetailsOpen(false)}>
                                <X size={16} />
                            </button>
                        </div>

                        <div className="modal-body">
                            <div className="req-summary-grid-pattern" style={{ marginBottom: '14px' }}>
                                <div className="req-summary-tile">
                                    <div className="req-tile-icon">
                                        <UserIcon size={16} />
                                    </div>
                                    <div className="req-tile-content">
                                        <span className="req-tile-label">Applicant Name</span>
                                        <span className="req-tile-val">
                                            {detailsTarget.user_name || 'Not provided'}
                                        </span>
                                    </div>
                                </div>

                                <div className="req-summary-tile">
                                    <div className="req-tile-icon">
                                        <Mail size={16} />
                                    </div>
                                    <div className="req-tile-content">
                                        <span className="req-tile-label">Email Address</span>
                                        <span className="req-tile-val" title={detailsTarget.user_email}>
                                            {detailsTarget.user_email}
                                        </span>
                                    </div>
                                </div>

                                <div className="req-summary-tile">
                                    <div className="req-tile-icon">
                                        <CheckCircle size={16} />
                                    </div>
                                    <div className="req-tile-content">
                                        <span className="req-tile-label">Email Verified</span>
                                        <span className="req-tile-val">
                                            {detailsTarget.is_email_verified ? 'Yes (OTP verified)' : 'No'}
                                        </span>
                                    </div>
                                </div>

                                <div className="req-summary-tile">
                                    <div className="req-tile-icon">
                                        <Clock size={16} />
                                    </div>
                                    <div className="req-tile-content">
                                        <span className="req-tile-label">Current Status</span>
                                        <span className="req-tile-val" style={{ textTransform: 'capitalize' }}>
                                            {detailsTarget.status}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div style={{ marginTop: '12px' }}>
                                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary, #0f172a)', display: 'block', marginBottom: '8px' }}>
                                    Review Audit Information
                                </label>
                                <div className="req-summary-grid-pattern" style={{ padding: '10px' }}>
                                    <div className="req-summary-tile">
                                        <div className="req-tile-content">
                                            <span className="req-tile-label">Reviewed By</span>
                                            <span className="req-tile-val">
                                                {detailsTarget.reviewed_by_name || '—'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="req-summary-tile">
                                        <div className="req-tile-content">
                                            <span className="req-tile-label">Reviewed At</span>
                                            <span className="req-tile-val">
                                                {formatDate(detailsTarget.reviewed_at)}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {detailsTarget.rejection_reason && (
                                    <div style={{ marginTop: '14px' }}>
                                        <span className="req-tile-label" style={{ display: 'block', marginBottom: '4px' }}>
                                            Rejection Reason
                                        </span>
                                        <div
                                            style={{
                                                padding: '10px 12px',
                                                background: 'var(--danger-bg, #fee2e2)',
                                                border: '1px solid var(--danger-text, #991b1b)',
                                                borderRadius: '6px',
                                                fontSize: '13px',
                                                color: 'var(--danger-text, #991b1b)'
                                            }}
                                        >
                                            {detailsTarget.rejection_reason}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={() => setIsDetailsOpen(false)}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
