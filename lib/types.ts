// ==================== PARAMS ====================
export interface RunParams {
  dimension: number;
  population: number;
  generations: number;
  mutation: number;
  disturbances: number;
  k: number;
}

// ==================== MATRICES ====================
export interface InitialData {
  A: number[][];
  B: number[];
  C: number[];
}

// ==================== SCENARIO ====================
export interface Scenario {
  id?: number;
  name: string;
  description: string;
  m: number;
  alpha: number[];
  beta: number[];
  gamma: number[];
}

// ==================== RUN ====================
export interface Run {
  id: number;
  timestamp: string;
  dimension: number;
  population: number;
  generations: number;
  mutation: number;
  disturbances_t: number;
  k: number;
  best_value: number | null;
  elapsed_time: number | null;
  is_manual: number;
}

// ==================== RUN CONFIG ====================
export interface RunConfig {
  run_id: number;
  dimension: number;
  population: number;
  generations: number;
  mutation: number;
  disturbances: number;
  k: number;
  A: number[][];
  B: number[];
  C: number[];
  u_min: number[];
  u_max: number[];
}

// ==================== EVOLUTION STEP ====================
export interface EvolutionStep {
  t: number;
  fitness: number;
  utility: number;
  A: number[][];
  B: number[];
  C: number[];
  u: number[];
  alpha: number[];
  beta: number[];
  gamma: number[];
  elapsed_time: number;
  effect_percent: number;
}

// ==================== SSE EVENT ====================
export interface SSEEvent {
  type: 'step' | 'done' | 'error' | 'log';
  t?: number;
  fitness?: number;
  utility?: number;
  non_adapted_utility?: number;
  effect_percent?: number;
  u?: number[];
  A?: number[][];
  B?: number[];
  C?: number[];
  alpha?: number[];
  beta?: number[];
  gamma?: number[];
  elapsed?: number;
  run_id?: number;
  message?: string;
}

// ==================== CHART DATA ====================
export interface ChartPoint {
  t: number;
  adapted?: number;
  base?: number;
  fitness?: number;
  [key: string]: number | undefined;
}
