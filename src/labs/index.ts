import { lazy, type ComponentType, type LazyExoticComponent } from 'react';

type Lazy = LazyExoticComponent<ComponentType>;

export const LABS: Record<string, Lazy> = {
  'lab-0': lazy(() => import('./Lab0Decision')),
  'lab-1a': lazy(() => import('./Lab1ATokenizer')),
  'lab-1b': lazy(() => import('./Lab1BEmbeddingMap')),
  'lab-1c': lazy(() => import('./Lab1CNextToken')),
  'lab-2a': lazy(() => import('./Lab2AJsonPlayground')),
  'lab-2b': lazy(() => import('./Lab2BRecommender')),
  'lab-3': lazy(() => import('./Lab3Rag')),
  'lab-4': lazy(() => import('./Lab4Agent')),
  'lab-5a': lazy(() => import('./Lab5AEvalRunner')),
  'lab-5b': lazy(() => import('./Lab5BFinOps')),
  'lab-6a': lazy(() => import('./Lab6APrdBuilder')),
  'lab-6b': lazy(() => import('./Lab6BScenarios')),
};
