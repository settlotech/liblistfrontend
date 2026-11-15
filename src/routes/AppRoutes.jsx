import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import { SignupProvider } from '../context/SignupContext';
import { ThemeProvider } from '../context/ThemeContext';
import { NotificationProvider } from '../context/NotificationContext';
import ProtectedRoute from './ProtectedRoute';
import LoginPage from '../pages/auth/LoginPage';
import HomePage from '../pages/home/HomePage';
import Dashboard from '../components/dashboard/dashboard';
import Setting from '../components/setting/Setting';
import TemplatesPage from '../pages/templates/TemplatesPage';
import CreateOperationalPolicyPage from '../pages/documents/CreateOperationalPolicyPage';
import PolicyViewerPage from '../pages/documents/PolicyViewerPage';
import ChangeManagementPage from '../pages/changeManagement/changemanagement';
import Signup from '../components/signup/signup';
import Resetpassword from '../components/common/restpassword/resetpassword';
import ModulePlaceholder from '../components/common/ModulePlaceholder';
import PersonalWorkspaceAnnotations from '../pages/notes/PersonalWorkspaceAnnotations';
import TaskWorkspace from '../pages/taskworkspace/taskworkspace';

const AppRoutes = () => (
  <BrowserRouter>
    <AuthProvider>
      <ThemeProvider>
        <SignupProvider>
          <NotificationProvider>
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/request" element={<Signup />} />
              <Route path="/reset/:id" element={<Resetpassword />} />

              {/* Protected Routes inside App Layout */}
              <Route
                element={
                  <ProtectedRoute>
                    <HomePage />
                  </ProtectedRoute>
                }
              >
                {/* Default Landing & Dashboard */}
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/home" element={<PolicyViewerPage />} />
                {/* NOTE: /documents/create must come BEFORE /documents/:id to avoid :id="create" */}
                <Route path="/documents/create" element={<CreateOperationalPolicyPage />} />
                <Route path="/documents/:id" element={<PolicyViewerPage />} />
                <Route path="/change-management" element={<ChangeManagementPage />} />
                <Route
                  path="/tasks"
                  element={<TaskWorkspace />}
                />
                <Route
                  path="/notes"
                  element={<PersonalWorkspaceAnnotations mode="notes" />}
                />
                <Route
                  path="/annotations"
                  element={<PersonalWorkspaceAnnotations mode="annotations" />}
                />
                <Route path="/templates" element={<TemplatesPage />} />

                {/* Settings Page */}
                <Route path="/settings" element={<Setting />} />
              </Route>

              {/* Fallbacks */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </NotificationProvider>
        </SignupProvider>
      </ThemeProvider>
    </AuthProvider>
  </BrowserRouter>
);

export default AppRoutes;
