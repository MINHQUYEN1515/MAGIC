import { createContext } from 'react';
import type { Container } from './container';

export const DependenciesContext = createContext<Container | null>(null);
