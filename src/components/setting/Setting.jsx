import { useState } from 'react';
import { Palette, Shield, KeyRound, Users, Settings as SettingsIcon } from 'lucide-react';
import ThemeSetting from './ThemeSetting';
import RoleManagement from './RoleManagement';
import PermissionMatrix from './PermissionMatrix';
import UserManagement from './Usermanagement';
import './Setting.css';

export default function Setting({ initialTab = 'theme' }) {
    const [activeTab, setActiveTab] = useState(initialTab);
    const [matrixRoleId, setMatrixRoleId] = useState(null);

    const handleSelectRoleForPermissions = (roleId) => {
        setMatrixRoleId(roleId);
        setActiveTab('matrix');
    };

    return (
        <div className="setting-main-wrapper">
            <div className="setting-top-bar">
                <div className="setting-title-cluster">
                    <div className="setting-icon-badge">
                        <SettingsIcon size={20} className="setting-badge-icon" />
                    </div>
                    <div>
                        <h2 className="setting-page-heading">System Settings</h2>
                        <p className="setting-page-sub">
                            Manage workspace appearance, role-based access control, and user permissions
                        </p>
                    </div>
                </div>
            </div>

            <div className="setting-tabs-navigation">
                <button
                    className={`setting-tab-pill ${activeTab === 'theme' ? 'active' : ''}`}
                    onClick={() => setActiveTab('theme')}
                >
                    <Palette size={16} />
                    <span>Theme & Appearance</span>
                </button>

                <button
                    className={`setting-tab-pill ${activeTab === 'roles' ? 'active' : ''}`}
                    onClick={() => setActiveTab('roles')}
                >
                    <Shield size={16} />
                    <span>Roles Management</span>
                </button>

                <button
                    className={`setting-tab-pill ${activeTab === 'matrix' ? 'active' : ''}`}
                    onClick={() => setActiveTab('matrix')}
                >
                    <KeyRound size={16} />
                    <span>Permission Matrix</span>
                </button>

                <button
                    className={`setting-tab-pill ${activeTab === 'usermanagement' || activeTab === 'users' ? 'active' : ''}`}
                    onClick={() => setActiveTab('usermanagement')}
                >
                    <Users size={16} />
                    <span>User Management</span>
                </button>
            </div>

            {/* Tab Body View */}
            <div className="setting-content-panel">
                {activeTab === 'theme' && <ThemeSetting />}
                {activeTab === 'roles' && (
                    <RoleManagement onSelectRoleForPermissions={handleSelectRoleForPermissions} />
                )}
                {activeTab === 'matrix' && (
                    <PermissionMatrix initialRoleId={matrixRoleId} />
                )}
                {(activeTab === 'usermanagement' || activeTab === 'users') && (
                    <UserManagement />
                )}
            </div>
        </div>
    );
}
