import { Navigate, Outlet } from 'react-router';
import { useDeps } from '@/app/di/useDeps';

export function RequireAuth() {
  const { tokenStore } = useDeps();
  return tokenStore.get() ? <Outlet /> : <Navigate to="/login" replace />;
}
