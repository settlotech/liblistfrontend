import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
    getProfileApi,
    updateProfileApi,
    changePasswordApi
} from '../../services/auth.service';
import {
    Mail,
    Shield,
    Edit3,
    Lock,
    Eye,
    EyeOff,
    Check,
    AlertCircle,
    Key,
    X,
    User,
    BadgeCheck
} from 'lucide-react';
import './account.css';

/* ── helpers ── */
const getInitials = (name, email) => {
    if (name?.trim()) {
        return name.trim().split(/\s+/).map((n) => n[0]).join('').slice(0, 2).toUpperCase();
    }
    return email?.[0]?.toUpperCase() || 'U';
};

const normalizeRoles = (rawRoles = []) =>
    rawRoles.map((r) => (typeof r === 'string' ? r : r?.role_name || r?.name || ''));

export default function AccountSetting() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    /* ── profile ── */
    const [profile, setProfile] = useState(null);
    const [profileLoading, setProfileLoading] = useState(true);
    const [profileError, setProfileError] = useState('');

    /* ── edit name ── */
    const [isEditNameOpen, setIsEditNameOpen] = useState(false);
    const [editName, setEditName] = useState('');
    const [editLoading, setEditLoading] = useState(false);
    const [editError, setEditError] = useState('');
    const [editSuccess, setEditSuccess] = useState('');

    /* ── change password ── */
    const [isChangePwOpen, setIsChangePwOpen] = useState(false);
    const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
    const [showPw, setShowPw] = useState({ current: false, new: false, confirm: false });
    const [pwLoading, setPwLoading] = useState(false);
    const [pwError, setPwError] = useState('');
    const [pwSuccess, setPwSuccess] = useState('');
 
    useEffect(() => {
        (async () => {
            setProfileLoading(true);
            try {
                const data = await getProfileApi();
                setProfile(data?.data?.user || data?.user || user);
            } catch {
                setProfile(user);
                setProfileError('Could not refresh profile from server.');
            } finally {
                setProfileLoading(false);
            }
        })();
    }, []);  
    const displayUser = profile || user;
    const initials = getInitials(displayUser?.name, displayUser?.email);
    const roles = normalizeRoles(displayUser?.roles);

 
    const openEditName = () => {
        setEditName(displayUser?.name || '');
        setEditError(''); setEditSuccess('');
        setIsEditNameOpen(true);
    };
    const closeEditName = () => { setIsEditNameOpen(false); setEditError(''); setEditSuccess(''); };

    const handleSaveName = async (e) => {
        e.preventDefault();
        const trimmed = editName.trim();
        if (!trimmed) { setEditError('Name cannot be empty.'); return; }
        setEditLoading(true); setEditError(''); setEditSuccess('');
        try {
            const data = await updateProfileApi({ name: trimmed });
            const updated = data?.data?.user || data?.user;
            setProfile((prev) => ({ ...prev, ...updated, name: trimmed }));
            setEditSuccess('Name updated successfully!');
            setTimeout(closeEditName, 1200);
        } catch (err) {
            setEditError(err.message || 'Failed to update name.');
        } finally { setEditLoading(false); }
    };

    /* ── change password handlers ── */
    const openChangePw = () => {
        setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setPwError(''); setPwSuccess('');
        setShowPw({ current: false, new: false, confirm: false });
        setIsChangePwOpen(true);
    };
    const closeChangePw = () => { setIsChangePwOpen(false); setPwError(''); setPwSuccess(''); };
    const handlePwInput = (e) => setPwForm((p) => ({ ...p, [e.target.name]: e.target.value }));
    const togglePw = (field) => setShowPw((p) => ({ ...p, [field]: !p[field] }));

    const handleChangePw = async (e) => {
        e.preventDefault();
        setPwError(''); setPwSuccess('');
        if (!pwForm.currentPassword) { setPwError('Current password is required.'); return; }
        if (pwForm.newPassword.length < 6) { setPwError('New password must be at least 6 characters.'); return; }
        if (pwForm.newPassword !== pwForm.confirmPassword) { setPwError('Passwords do not match.'); return; }
        setPwLoading(true);
        try {
            await changePasswordApi({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
            setPwSuccess('Password changed! Logging you out…');
            setTimeout(async () => { await logout(); navigate('/login', { replace: true }); }, 1800);
        } catch (err) {
            setPwError(err.message || 'Failed to change password.');
        } finally { setPwLoading(false); }
    };

    if (profileLoading) {
        return <div className="ac-loading">Loading your profile…</div>;
    }

    return (
        <div className="ac-wrapper">

            {profileError && (
                <div className="ac-banner ac-banner--warn">
                    <AlertCircle size={14} /> {profileError}
                </div>
            )}

            
            <div className="ac-grid">
 
                <aside className="ac-identity-panel">
                    <div className="ac-avatar">{initials}</div>
                    <h2 className="ac-name">{displayUser?.name || '—'}</h2>
                    <p className="ac-email">
                        <Mail size={12} /> {displayUser?.email || '—'}
                    </p>
 
                    <span className={`ac-status-pill ${displayUser?.is_active !== false ? 'active' : 'inactive'}`}>
                        {displayUser?.is_active !== false ? 'Active Account' : 'Inactive'}
                    </span>
 
                    {displayUser?.isSuperAdmin && (
                        <span className="ac-superadmin-pill">
                            <BadgeCheck size={12} /> Super Admin
                        </span>
                    )}
 
                    {roles.length > 0 && (
                        <div className="ac-roles-stack">
                            <p className="ac-roles-label">Assigned Roles</p>
                            {roles.map((r) => (
                                <span key={r} className="ac-role-chip">
                                    <Shield size={11} /> {r}
                                </span>
                            ))}
                        </div>
                    )}

                    <button className="btn btn-secondary btn-sm ac-edit-btn" onClick={openEditName}>
                        <Edit3 size={13} /> Edit Profile
                    </button>
                </aside>
 
                <div className="ac-cards-col">
 
                    <div className="ac-card">
                        <div className="ac-card-header">
                            <User size={15} />
                            <span>Personal Details</span>
                        </div>

                        <div className="ac-detail-grid">
                            {/* Full Name */}
                            <div className="ac-detail-cell ac-detail-cell--label">Full Name</div>
                            <div className="ac-detail-cell ac-detail-cell--value">{displayUser?.name || '—'}</div>
                            <div className="ac-detail-cell ac-detail-cell--action">
                                <button className="btn btn-xs" onClick={openEditName}>
                                    <Edit3 size={11} /> Edit
                                </button>
                            </div>
 
                            <div className="ac-detail-cell ac-detail-cell--label">Email Address</div>
                            <div className="ac-detail-cell ac-detail-cell--value">{displayUser?.email || '—'}</div>
                            <div className="ac-detail-cell ac-detail-cell--action">
                                <span className="ac-readonly-badge">Read-only</span>
                            </div>
 
                            <div className="ac-detail-cell ac-detail-cell--label">Account Type</div>
                            <div className="ac-detail-cell ac-detail-cell--value">
                                {displayUser?.isSuperAdmin ? 'Super Admin' : 'Standard User'}
                            </div>
                            <div className="ac-detail-cell" />
                        </div>
                    </div>
 
                    <div className="ac-card">
                        <div className="ac-card-header">
                            <Lock size={15} />
                            <span>Security</span>
                        </div>

                        <div className="ac-security-row">
                            <div className="ac-security-left">
                                <Key size={18} className="ac-key-icon" />
                                <div>
                                    <p className="ac-security-title">Password</p>
                                    <p className="ac-security-hint">
                                        Update your login password. You will be signed out after a successful change.
                                    </p>
                                </div>
                            </div>
                            <button className="btn btn-secondary btn-sm" onClick={openChangePw}>
                                <Lock size={13} /> Change Password
                            </button>
                        </div>
                    </div>

                </div> 
            </div> 

             
            {isEditNameOpen && (
                <div className="modal-overlay" onClick={closeEditName}>
                    <div className="modal-card ac-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <div>
                                <h3 className="modal-title">Edit Profile Name</h3>
                                <p className="modal-subtitle">Update your display name</p>
                            </div>
                            <button className="modal-close-btn" onClick={closeEditName}><X size={18} /></button>
                        </div>
                        <form onSubmit={handleSaveName}>
                            <div className="modal-body">
                                {editError && <div className="setting-alert-error"><AlertCircle size={14} /> {editError}</div>}
                                {editSuccess && <div className="setting-alert-success"><Check size={14} /> {editSuccess}</div>}
                                <div className="form-group">
                                    <label className="form-label">Full Name <span className="ac-required">*</span></label>
                                    <input
                                        type="text" className="form-input" autoFocus
                                        value={editName} onChange={(e) => setEditName(e.target.value)}
                                        placeholder="Enter your full name" disabled={editLoading}
                                    />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={closeEditName} disabled={editLoading}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={editLoading}>
                                    {editLoading ? 'Saving…' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
 
            {isChangePwOpen && (
                <div className="modal-overlay" onClick={closeChangePw}>
                    <div className="modal-card ac-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <div>
                                <h3 className="modal-title">Change Password</h3>
                                <p className="modal-subtitle">You will be signed out after a successful change.</p>
                            </div>
                            <button className="modal-close-btn" onClick={closeChangePw}><X size={18} /></button>
                        </div>
                        <form onSubmit={handleChangePw}>
                            <div className="modal-body">
                                {pwError && <div className="setting-alert-error"><AlertCircle size={14} /> {pwError}</div>}
                                {pwSuccess && <div className="setting-alert-success"><Check size={14} /> {pwSuccess}</div>}

                                {[
                                    { label: 'Current Password', name: 'currentPassword', key: 'current', placeholder: 'Enter current password' },
                                    { label: 'New Password', name: 'newPassword', key: 'new', placeholder: 'Minimum 6 characters' },
                                    { label: 'Confirm New Password', name: 'confirmPassword', key: 'confirm', placeholder: 'Re-enter new password' },
                                ].map(({ label, name, key, placeholder }) => (
                                    <div className="form-group" key={name}>
                                        <label className="form-label">{label} <span className="ac-required">*</span></label>
                                        <div className="ac-pw-wrap">
                                            <input
                                                type={showPw[key] ? 'text' : 'password'}
                                                className="form-input" name={name}
                                                value={pwForm[name]} onChange={handlePwInput}
                                                placeholder={placeholder} disabled={pwLoading}
                                            />
                                            <button type="button" className="ac-pw-eye" onClick={() => togglePw(key)} tabIndex={-1}>
                                                {showPw[key] ? <EyeOff size={15} /> : <Eye size={15} />}
                                            </button>
                                        </div>
                                        {/* Match hint under confirm field */}
                                        {name === 'confirmPassword' && pwForm.confirmPassword && (
                                            <span className={`ac-pw-match ${pwForm.newPassword === pwForm.confirmPassword ? 'ok' : 'err'}`}>
                                                {pwForm.newPassword === pwForm.confirmPassword
                                                    ? <><Check size={11} /> Passwords match</>
                                                    : <><AlertCircle size={11} /> Passwords do not match</>
                                                }
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={closeChangePw} disabled={pwLoading}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={pwLoading}>
                                    {pwLoading ? 'Updating…' : 'Update Password'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
