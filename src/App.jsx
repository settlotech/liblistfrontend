import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Sidebar from './components/common/Sidebar';
import Header from './components/common/header/header';
import Home from './components/home/home';
import Login from './components/login/login';
import Setting from './components/setting/Setting';
import Resetpassword from './components/common/restpassword/resetpassword';
import './App.css';

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

const PublicRoute = ({ children }) => {
    const { isAuthenticated, isLoading } = useAuth();
    if (isLoading) {
        return <div className="loading-container"><span>Checking session...</span></div>;
    }
    return isAuthenticated ? <Navigate to="/home" replace /> : children;
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

            {/* Protected */}
            <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><Setting /></ProtectedRoute>} />
             

            {/* Redirects */}
            <Route path="/" element={<Navigate to="/home" replace />} />
            <Route path="*" element={<Navigate to="/home" replace />} />
        </Routes>
    );
}

export default App;
