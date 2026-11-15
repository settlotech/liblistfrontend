import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Palette, Shield, KeyRound, Users, UserPlus, Settings as SettingsIcon, UserRoundCog, Lock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import ThemeSetting from './ThemeSetting';
import RoleManagement from './RoleManagement';
import PermissionMatrix from './PermissionMatrix';
import UserManagement from './Usermanagement';
import Userrequest from './userRequest';
import AccountSetting from './account';
import PolicyAccessControl from './PolicyAccessControl';
import './Setting.css';

export default function Setting({ initialTab = 'theme' }) {
    const { user, hasPermission } = useAuth();
    const [searchParams] = useSearchParams();
    const paramTab = searchParams.get('tab');

    const [activeTab, setActiveTab] = useState(paramTab || initialTab);
    const [matrixRoleId, setMatrixRoleId] = useState(null);

    const isSuperAdmin = user?.isSuperAdmin || (user?.roles || []).some(r => {
        const name = typeof r === 'string' ? r : r.role_name;
        return name?.toLowerCase() === 'super admin';
    });

    const canReadRoles = hasPermission('roles', 'read');
    const canReadPermissions = hasPermission('permissions', 'read');
    const canReadUsers = hasPermission('users', 'read');
    const canReadUserRequest = hasPermission('usersrequest', 'read');
    // Policy Access Control module permissions
    const canReadPolicyAccess   = hasPermission('policy_access', 'read');
    const canUpdatePolicyAccess = hasPermission('policy_access', 'update');
    const canCreatePolicyAccess = hasPermission('policy_access', 'create');

    const availableTabs = useMemo(() => [
        { id: 'theme', label: 'Theme & Appearance', icon: Palette, visible: true },
        { id: 'roles', label: 'Roles Management', icon: Shield, visible: canReadRoles },
        { id: 'matrix', label: 'Permission Matrix', icon: KeyRound, visible: canReadPermissions },
        { id: 'usermanagement', label: 'User Management', icon: Users, visible: canReadUsers },
        { id: 'userrequest', label: 'New User Request', icon: UserPlus, visible: canReadUserRequest },
        { id: 'policyaccess', label: 'Policy Access Control', icon: Lock, visible: canReadPolicyAccess },
        { id: 'accountsetting', label: 'Profile & Security', icon: UserRoundCog, visible: true }
    ].filter(tab => tab.visible), [canReadRoles, canReadPermissions, canReadUsers, canReadUserRequest, canReadPolicyAccess]);

    useEffect(() => {
        if (paramTab) {
            setActiveTab(paramTab);
        }
    }, [paramTab]);

    useEffect(() => {
        const isCurrentTabAvailable = availableTabs.some(tab => tab.id === activeTab);
        if (!isCurrentTabAvailable && availableTabs.length > 0) {
            setActiveTab(availableTabs[0].id);
        }
    }, [availableTabs, activeTab]);

    const handleSelectRoleForPermissions = (roleId) => {
        if (!canReadPermissions) return;
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
                {availableTabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.id}
                            className={`setting-tab-pill ${activeTab === tab.id ? 'active' : ''}`}
                            onClick={() => setActiveTab(tab.id)}
                        >
                            <Icon size={16} />
                            <span>{tab.label}</span>
                        </button>
                    );
                })}
            </div>

           
            <div className="setting-content-panel">
                {activeTab === 'theme' && <ThemeSetting />}
                {activeTab === 'roles' && canReadRoles && (
                    <RoleManagement onSelectRoleForPermissions={handleSelectRoleForPermissions} />
                )}
                {activeTab === 'matrix' && canReadPermissions && (
                    <PermissionMatrix initialRoleId={matrixRoleId} />
                )}
                {activeTab === 'usermanagement' && canReadUsers && (
                    <UserManagement />
                )}
                {activeTab === "userrequest" && canReadUserRequest && (<Userrequest/>)}
                {activeTab === "policyaccess" && canReadPolicyAccess && (
                    <PolicyAccessControl
                        canUpdate={canUpdatePolicyAccess}
                        canCreate={canCreatePolicyAccess}
                        isSuperAdmin={isSuperAdmin}
                    />
                )}
                {activeTab === "accountsetting"  && (<AccountSetting/>)}
            </div>
        </div>
    );
}
