import { QueryClientProvider, type QueryClient } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import type { ReactNode } from 'react';
import type { Container } from '../di/container';
import { DependenciesProvider } from '../di/DependenciesProvider';

type Props = {
  container: Container;
  queryClient: QueryClient;
  children: ReactNode;
};

export function AppProviders({ container, queryClient, children }: Props) {
  return (
    <DependenciesProvider container={container}>
      <QueryClientProvider client={queryClient}>
        {children}
        {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
      </QueryClientProvider>
    </DependenciesProvider>
  );
}
