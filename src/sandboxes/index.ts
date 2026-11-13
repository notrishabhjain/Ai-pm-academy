import { lazy, type ComponentType, type LazyExoticComponent } from 'react';

type Lazy = LazyExoticComponent<ComponentType>;

// Each level's sandboxes live in one chunk that loads on first use.
const l0 = () => import('./level0');
const l1 = () => import('./level1');
const l2 = () => import('./level2');
const l3 = () => import('./level3');
const l4 = () => import('./level4');
const l5 = () => import('./level5');
const l6 = () => import('./level6');

function pick<M extends Record<string, unknown>>(loader: () => Promise<M>, name: keyof M): Lazy {
  return lazy(() => loader().then((m) => ({ default: m[name] as ComponentType })));
}

export const SANDBOXES: Record<string, Lazy> = {
  'ai-landscape': pick(l0, 'ApproachSandbox'),
  'learning-types': pick(l0, 'LearningTypesSandbox'),
  'training-vs-inference': pick(l0, 'TrainingInferenceSandbox'),
  'deterministic-vs-probabilistic': pick(l0, 'DeterminismSandbox'),

  tokenization: pick(l1, 'TokenSplitSandbox'),
  embeddings: pick(l1, 'VectorArithmeticSandbox'),
  'context-attention': pick(l1, 'LostInMiddleSandbox'),
  'next-token-hallucination': pick(l1, 'ConfidenceSandbox'),

  'prompt-roles': pick(l2, 'PromptRolesSandbox'),
  'temperature-top-p': pick(l2, 'SamplingSandbox'),
  'structured-outputs': pick(l2, 'SchemaValidatorSandbox'),
  'model-selection': pick(l2, 'BuildBuySandbox'),

  'private-data-gap': pick(l3, 'PrivateDataSandbox'),
  'rag-stages': pick(l3, 'RagStagesSandbox'),
  'search-modes': pick(l3, 'SearchModesSandbox'),
  'rag-vs-finetune': pick(l3, 'StrategyPickerSandbox'),

  'chatbot-vs-agent': pick(l4, 'AgentLoopSandbox'),
  'tool-calling-mcp': pick(l4, 'ToolCallingSandbox'),
  'multi-agent-patterns': pick(l4, 'PatternsSandbox'),
  'hitl-design': pick(l4, 'ThresholdSandbox'),

  'why-uat-fails': pick(l5, 'BinaryVsRubricSandbox'),
  'golden-dataset': pick(l5, 'DatasetCompositionSandbox'),
  'code-evals-vs-judge': pick(l5, 'EvalMethodSandbox'),
  'rag-triad': pick(l5, 'TriadGraderSandbox'),
  'token-finops': pick(l5, 'RequestAnatomySandbox'),

  'ai-sprints': pick(l6, 'SprintPlanSandbox'),
  'ai-prd': pick(l6, 'PrdReadinessSandbox'),
  'security-governance': pick(l6, 'GuardrailSandbox'),
  'spec-driven-dev': pick(l6, 'SpecQualitySandbox'),
};
