import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Sidebar from './components/common/Sidebar';
import Header from './components/common/header/header';
import Home from './components/home/home';
import Login from './components/login/login';
import Setting from './components/setting/Setting';
import Resetpassword from './components/common/restpassword/resetpassword';
import Signup from './components/signup/signup';
import Dashboard from './components/dashboard/dashboard';
import './App.css';
import Task from './components/demotask/task';

/* ── App Shell: Sidebar + Header + Page Body ── */
const AppShell = ({ children }) => (
    <div className="app-shell">
        <Sidebar />
        <div className="main-content-area">
            <div className="main-header-row">
                <Header />
            </div>
            <div className="page-body">
                {children}
            </div>
        </div>
    </div>
);

/* ── Route Guards ── */
const ProtectedRoute = ({ children }) => {
    const { isAuthenticated, isLoading } = useAuth();
    if (isLoading) {
        return <div className="loading-container"><span>Checking session...</span></div>;
    }
    return isAuthenticated
        ? <AppShell>{children}</AppShell>
        : <Navigate to="/login" replace />;
};

const PermissionRoute = ({ children, module }) => {
    const { isAuthenticated, isLoading, hasPermission } = useAuth();
    if (isLoading) {
        return <div className="loading-container"><span>Checking session...</span></div>;
    }
    if (!isAuthenticated) return <Navigate to="/login" replace />;
    if (!hasPermission(module, 'read')) return <Navigate to="/settings" replace />;
    return <AppShell>{children}</AppShell>;
};

const PublicRoute = ({ children }) => {
    const { isAuthenticated, isLoading, hasPermission } = useAuth();
    if (isLoading) {
        return <div className="loading-container"><span>Checking session...</span></div>;
    }
    if (isAuthenticated) {
        const modules = [
            { module: 'dashboard', path: '/dashboard' },
            { module: 'changelogs', path: '/changelogs' },
            { module: 'tasks', path: '/tasks' },
            { module: 'templates', path: '/templates' },
        ];
        const first = modules.find((m) => hasPermission(m.module, 'read'));
        return <Navigate to={first ? first.path : '/settings'} replace />;
    }
    return children;
};

/* ── App ── */
function App() {
    const { isLoading } = useAuth();

    if (isLoading) {
        return <div className="loading-container"><span>Loading Liblist...</span></div>;
    }
    
    return (
        <Routes>
          {/* Public */}
            <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
            <Route path="/reset/:id" element={<PublicRoute><Resetpassword /></PublicRoute>} />
            <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />

            {/* Protected Australian Banking Hub & Modules */}
            <Route path="/dashboard" element={<PermissionRoute module="dashboard"><Dashboard /></PermissionRoute>} />
            <Route path="/home" element={<ProtectedRoute><Home initialView="policy" /></ProtectedRoute>} />
            <Route path="/documents" element={<ProtectedRoute><Home initialView="policy" /></ProtectedRoute>} />
            <Route path="/demotask" element={<ProtectedRoute><Task /></ProtectedRoute>} />
            <Route path="/changelogs" element={<PermissionRoute module="changelogs"><Home initialView="change_management" /></PermissionRoute>} />
            <Route path="/tasks" element={<PermissionRoute module="tasks"><Home initialView="tasks" /></PermissionRoute>} />
            <Route path="/templates" element={<PermissionRoute module="templates"><Home initialView="templates" /></PermissionRoute>} />

            {/* Protected System Settings & RBAC */}
            <Route path="/settings" element={<ProtectedRoute><Setting /></ProtectedRoute>} />

            {/* Redirects */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
    );
}

export default App;
