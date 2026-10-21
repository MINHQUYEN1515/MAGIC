import { useContext } from 'react';
import type { Container } from './container';
import { DependenciesContext } from './context';

export function useDeps(): Container {
  const deps = useContext(DependenciesContext);
  if (!deps) throw new Error('useDeps phải dùng bên trong <DependenciesProvider>');
  return deps;
}
