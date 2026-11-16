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
import DocumentManagementView from './components/documents/DocumentManagementView';
import NotesWorkspace from './components/notes/NotesWorkspace';
import './App.css';
import Task from './components/demotask/task';
import PdfComparisonPage from './components/policy/PdfComparisonPage';
import CreateOperationalPolicyPage from './pages/documents/CreateOperationalPolicyPage';
import PolicyViewerPage from './pages/documents/PolicyViewerPage';

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
    const { isAuthenticated, isLoading } = useAuth();
    if (isLoading) {
        return <div className="loading-container"><span>Checking session...</span></div>;
    }
    if (isAuthenticated) {
        return <Navigate to="/dashboard" replace />;
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

            {/* Protected Australian Banking Hub & Modules (Common to all users) */}
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/home" element={<ProtectedRoute><Home initialView="policy" /></ProtectedRoute>} />
            {/* Document Management System (DMS) & Notes */}
            <Route path="/notes" element={<ProtectedRoute><NotesWorkspace /></ProtectedRoute>} />
            <Route path="/notes/:id" element={<ProtectedRoute><NotesWorkspace /></ProtectedRoute>} />
            <Route path="/documents" element={<ProtectedRoute><DocumentManagementView /></ProtectedRoute>} />
            <Route path="/documents/:id" element={<ProtectedRoute><DocumentManagementView /></ProtectedRoute>} />
            <Route path="/demotask" element={<ProtectedRoute><Task /></ProtectedRoute>} />
            <Route path="/changelogs" element={<ProtectedRoute><Home initialView="change_management" /></ProtectedRoute>} />
            <Route path="/tasks" element={<ProtectedRoute><Home initialView="tasks" /></ProtectedRoute>} />
            <Route path="/templates" element={<ProtectedRoute><Home initialView="templates" /></ProtectedRoute>} />

            {/* Document Comparison System (Tamilmani side-by-side view) */}
            <Route path="/compare-policy" element={<ProtectedRoute><PdfComparisonPage /></ProtectedRoute>} />

            {/* Page Architecture & TipTap Paginated Word-like Editor */}
            <Route path="/create-policy" element={<ProtectedRoute><CreateOperationalPolicyPage /></ProtectedRoute>} />
            <Route path="/policy-viewer" element={<ProtectedRoute><PolicyViewerPage /></ProtectedRoute>} />
            <Route path="/policy-viewer/:id" element={<ProtectedRoute><PolicyViewerPage /></ProtectedRoute>} />

            {/* Protected System Settings & RBAC */}
            <Route path="/settings" element={<ProtectedRoute><Setting /></ProtectedRoute>} />

            {/* Redirects */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
    );
}

export default App;
