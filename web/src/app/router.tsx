import { createBrowserRouter, Navigate } from 'react-router';
import { GuestOnly } from '@/features/auth/presentation/GuestOnly';
import { LoginPage } from '@/features/auth/presentation/LoginPage';
import { RegisterPage } from '@/features/auth/presentation/RegisterPage';
import { RequireAuth } from '@/features/auth/presentation/RequireAuth';
import { ProfilePage } from '@/features/user/presentation/ProfilePage';
import { Layout } from './Layout';

export const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      {
        element: <GuestOnly />,
        children: [
          { path: '/login', element: <LoginPage /> },
          { path: '/register', element: <RegisterPage /> },
        ],
      },
      {
        element: <RequireAuth />,
        children: [{ path: '/', element: <ProfilePage /> }],
      },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
]);
