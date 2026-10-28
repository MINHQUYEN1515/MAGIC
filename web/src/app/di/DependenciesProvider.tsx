import type { ReactNode } from 'react';
import type { Container } from './container';
import { DependenciesContext } from './context';

export function DependenciesProvider({ container, children }: { container: Container; children: ReactNode }) {
  return <DependenciesContext.Provider value={container}>{children}</DependenciesContext.Provider>;
}
