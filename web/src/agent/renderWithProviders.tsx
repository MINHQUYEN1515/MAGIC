import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, renderHook } from '@testing-library/react';
import type { ReactElement, ReactNode } from 'react';
import { MemoryRouter } from 'react-router';
import type { Container } from '@/app/di/container';
import { DependenciesProvider } from '@/app/di/DependenciesProvider';

// Container giả: test chỉ cần truyền phần nó dùng.
export function createTestWrapper(deps: Partial<Container>) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <DependenciesProvider container={deps as Container}>
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>{children}</MemoryRouter>
      </QueryClientProvider>
    </DependenciesProvider>
  );
  return { wrapper, queryClient };
}

export function renderWithProviders(ui: ReactElement, deps: Partial<Container>) {
  const { wrapper, queryClient } = createTestWrapper(deps);
  return { ...render(ui, { wrapper }), queryClient };
}

export function renderHookWithProviders<T>(hook: () => T, deps: Partial<Container>) {
  const { wrapper, queryClient } = createTestWrapper(deps);
  return { ...renderHook(hook, { wrapper }), queryClient };
}
