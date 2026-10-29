import { createBrowserRouter, Navigate } from 'react-router';
import { GuestOnly } from '@/features/auth/presentation/GuestOnly';
import { LoginPage } from '@/features/auth/presentation/LoginPage';
import { RegisterPage } from '@/features/auth/presentation/RegisterPage';
import { RequireAuth } from '@/features/auth/presentation/RequireAuth';
import { HomePage } from '@/features/home/presentation/HomePage';
import { ProfilePage } from '@/features/user/presentation/ProfilePage';
import { FormShell } from './FormShell';
import { Layout } from './Layout';

export const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: '/', element: <HomePage /> },
      {
        element: <FormShell />,
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
            children: [{ path: '/profile', element: <ProfilePage /> }],
          },
        ],
      },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
]);
