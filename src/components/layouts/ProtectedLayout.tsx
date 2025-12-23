import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/stores';

export function ProtectedLayout() {
  const { isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  return <Outlet />;
}
