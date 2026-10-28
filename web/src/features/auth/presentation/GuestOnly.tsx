import { Navigate, Outlet } from 'react-router';
import { useDeps } from '@/app/di/useDeps';

// Ngược với RequireAuth: đã đăng nhập thì không cho vào trang login/register nữa.
export function GuestOnly() {
  const { tokenStore } = useDeps();
  return tokenStore.get() ? <Navigate to="/" replace /> : <Outlet />;
}
