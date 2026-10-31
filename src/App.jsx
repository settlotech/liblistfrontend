import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Home from './components/home/home';
import Login from './components/login/login';
import './App.css';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) {
    return <div className="loading-container"><h2>Checking login session...</h2></div>;
  }
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

const PublicRoute = ({ children }) => { 
  const { isAuthenticated, isLoading } = useAuth(); 
  if (isLoading) {
    return <div className="loading-container"><h2>Checking login session...</h2></div>;
  }
  return isAuthenticated ? <Navigate to="/home" replace /> : children;
};

function App() {
  const { isLoading } = useAuth();

  if (isLoading) {
    return <div className="loading-container"><h2>Checking login session...</h2></div>;
  }

  return (
    <Routes>
      <Route path="/login"element={<PublicRoute> <Login /> </PublicRoute>}/>
      <Route path="/home" element={<ProtectedRoute> <Home /> </ProtectedRoute>} />
      <Route path="/" element={<Navigate to="/home" replace />} />
      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  );
}

export default App;
