import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { ToastProvider } from '@/contexts/ToastContext';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { RoleHomeRedirect } from '@/components/auth/RoleHomeRedirect';
import { LoginPage } from '@/pages/LoginPage';
import { UsersPage } from '@/pages/UsersPage';
import { EligiblesListPage } from '@/pages/EligiblesListPage';
import { EligibilityCheckPage } from '@/pages/EligibilityCheckPage';
import { UserRole } from '@/types/auth';

function LoginRoute() {
  const { isAuthenticated, isInitialized } = useAuth();
  const location = useLocation();

  if (!isInitialized) return null;
  if (isAuthenticated) {
    const from = (location.state as { from?: string } | null)?.from;
    return <Navigate to={from || '/'} replace />;
  }
  return <LoginPage />;
}

function AppRoutes() {
  const location = useLocation();
  const isLoginRoute = location.pathname === '/login';

  if (isLoginRoute) {
    return (
      <Routes>
        <Route path="/login" element={<LoginRoute />} />
      </Routes>
    );
  }

  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<RoleHomeRedirect />} />
        <Route
          path="/eligibility-check"
          element={
            <ProtectedRoute>
              <EligibilityCheckPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/eligibles"
          element={
            <ProtectedRoute allowedRoles={[UserRole.Admin, UserRole.BranchManager]}>
              <EligiblesListPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/users"
          element={
            <ProtectedRoute allowedRoles={[UserRole.Admin, UserRole.BranchManager]}>
              <UsersPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppLayout>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <AppRoutes />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
