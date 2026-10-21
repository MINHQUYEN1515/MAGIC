import { createBrowserRouter, Navigate } from 'react-router';
import { LoginPage } from '@/features/auth/presentation/LoginPage';
import { RequireAuth } from '@/features/auth/presentation/RequireAuth';
import { ProfilePage } from '@/features/user/presentation/ProfilePage';
import { Layout } from './Layout';

export const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: '/login', element: <LoginPage /> },
      {
        element: <RequireAuth />,
        children: [{ path: '/', element: <ProfilePage /> }],
      },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
]);
