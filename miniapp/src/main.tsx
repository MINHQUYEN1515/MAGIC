import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router/dom';
import { createContainer } from './app/di/container';
import { AppProviders } from './app/providers/AppProviders';
import { createQueryClient } from './app/providers/queryClient';
import { router } from './app/router';
import './app/styles.css';

const queryClient = createQueryClient();
const container = createContainer({
  // Token hết hạn/không hợp lệ → xoá cache và về trang đăng nhập.
  onUnauthorized: () => {
    queryClient.clear();
    void router.navigate('/login', { replace: true });
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppProviders container={container} queryClient={queryClient}>
      <RouterProvider router={router} />
    </AppProviders>
  </StrictMode>,
);
