import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types/auth';

export function RoleHomeRedirect() {
  const { user, isInitialized, isAuthenticated } = useAuth();

  if (!isInitialized) {
    return null;
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === UserRole.Clerk) {
    return <Navigate to="/eligibility-check" replace />;
  }

  return <Navigate to="/eligibles" replace />;
}
