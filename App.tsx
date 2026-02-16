import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { PrivateRoute } from './components/PrivateRoute';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage'; // Imported
import { DashboardPage } from './pages/DashboardPage';
import { AdminDashboard } from './pages/AdminDashboard';
import { Loader2 } from 'lucide-react';

// Wrapper to decide which dashboard to show based on Role
const MainRouter: React.FC = () => {
  const { user, isAdmin, loading } = useAuth();

  if (loading) {
    return (
       <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <Loader2 className="animate-spin text-blue-600 mb-4" size={48} />
      </div>
    );
  }

  return isAdmin ? <AdminDashboard /> : <DashboardPage />;
};

const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} /> 

          {/* Protected Routes */}
          <Route element={<PrivateRoute />}>
            <Route path="/" element={<MainRouter />} />
          </Route>

          {/* Catch-all Redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
};

export default App;
