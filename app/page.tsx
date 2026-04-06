'use client';
import { useState, useCallback } from 'react';
import SimulationForm from '@/components/SimulationForm';
import ChartPanel from '@/components/ChartPanel';
import LogPanel from '@/components/LogPanel';
import ManualPerturbationPanel from '@/components/ManualPerturbationPanel';
import { RunParams, InitialData, Scenario, ChartPoint } from '@/lib/types';

interface LogLine { text: string; type?: 'info' | 'accent' | 'success' | 'warn' | 'divider'; }

interface Stats {
  fitness: number | null;
  utility: number | null;
  effect: number | null;
  runId: number | null;
  step: number;
  total: number;
}

interface ManualState {
  params: RunParams;
  data: InitialData;
  A_current: number[][];
  B_current: number[];
  C_current: number[];
  lastSolution: number[] | null;
  runId: number | null;
  currentStep: number;
}

export default function Home() {
  const [running, setRunning] = useState(false);
  const [logs, setLogs] = useState<LogLine[]>([]);
  const [activeScenario, setActiveScenario] = useState<Scenario | null>(null);
  const [stats, setStats] = useState<Stats>({ fitness: null, utility: null, effect: null, runId: null, step: 0, total: 0 });
  const [averages, setAverages] = useState({ sumFitness: 0, sumUtility: 0, sumEffect: 0, count: 0 });

  const [fitnessData, setFitnessData]   = useState<ChartPoint[]>([]);
  const [buData,      setBuData]         = useState<ChartPoint[]>([]);
  const [AData,       setAData]          = useState<ChartPoint[]>([]);
  const [BData,       setBData]          = useState<ChartPoint[]>([]);
  const [CData,       setCData]          = useState<ChartPoint[]>([]);
  const [uData,       setUData]          = useState<ChartPoint[]>([]);
  const [dim,         setDim]            = useState(2);

  // Manual mode state
  const [showPerturbPanel, setShowPerturbPanel] = useState(false);
  const [manualState, setManualState] = useState<ManualState | null>(null);

  const addLog = useCallback((text: string, type?: LogLine['type']) => {
    setLogs(prev => [...prev, { text, type }]);
  }, []);

  // ============================================================
  //  Process a single step result (shared between auto & manual)
  // ============================================================
  const processStepResult = useCallback((step: {
    t: number; fitness: number; utility: number;
    non_adapted_utility: number; effect_percent: number;
    u: number[]; A: number[][]; B: number[]; C: number[];
    alpha: number[]; beta: number[]; gamma: number[];
    elapsed: number;
  }, totalSteps: number) => {
    const t = step.t;

    addLog(`──────── t = ${t + 1} ────────`, 'divider');
    addLog(`  f* = ${step.fitness.toFixed(4)}`, 'accent');
    addLog(`  Bu* = ${step.utility.toFixed(3)}  Bu₀ = ${step.non_adapted_utility.toFixed(3)}`, 'info');
    addLog(`  Ефект адаптації: ${step.effect_percent.toFixed(1)}%`, 'success');
    addLog(`  u* = [${step.u.map((v: number) => v.toFixed(3)).join(', ')}]`, 'info');
    addLog(`  Час: ${step.elapsed.toFixed(2)} с`, 'info');

    setStats(prev => ({ ...prev, fitness: step.fitness, utility: step.utility, effect: step.effect_percent, step: t + 1, total: totalSteps }));

    setAverages(prev => ({
      sumFitness: prev.sumFitness + step.fitness,
      sumUtility: prev.sumUtility + step.utility,
      sumEffect: prev.sumEffect + step.effect_percent,
      count: prev.count + 1
    }));

    setFitnessData(prev => [...prev, { t: t + 1, fitness: step.fitness }]);
    setBuData(prev => [...prev, {
      t: t + 1,
      adapted: step.utility,
      base: step.non_adapted_utility,
      effect: step.effect_percent
    }]);

    const aPoint: ChartPoint = { t: t + 1 };
    step.A.forEach((row: number[], i: number) => row.forEach((v: number, j: number) => { aPoint[`a${i+1}${j+1}`] = v; }));
    setAData(prev => [...prev, aPoint]);

    const bPoint: ChartPoint = { t: t + 1 };
    step.B.forEach((v: number, i: number) => { bPoint[`b${i+1}`] = v; });
    setBData(prev => [...prev, bPoint]);

    const cPoint: ChartPoint = { t: t + 1 };
    step.C.forEach((v: number, i: number) => { cPoint[`c${i+1}`] = v; });
    setCData(prev => [...prev, cPoint]);

    const uPoint: ChartPoint = { t: t + 1 };
    step.u.forEach((v: number, i: number) => { uPoint[`u${i+1}`] = v; });
    setUData(prev => [...prev, uPoint]);
  }, [addLog]);

  // ============================================================
  //  Reset charts & logs
  // ============================================================
  const resetAll = useCallback((params: RunParams) => {
    setLogs([]);
    setFitnessData([]); setBuData([]); setAData([]); setBData([]); setCData([]); setUData([]);
    setStats({ fitness: null, utility: null, effect: null, runId: null, step: 0, total: params.disturbances });
    setAverages({ sumFitness: 0, sumUtility: 0, sumEffect: 0, count: 0 });
    setDim(params.dimension);
  }, []);

  // ============================================================
  //  Auto mode (SSE streaming) — existing flow
  // ============================================================
  const runAutoMode = useCallback(async (params: RunParams, data: InitialData, scenario: Scenario | null) => {
    try {
      const res = await fetch('/api/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...params, ...data, scenario }),
      });

      if (!res.ok) {
        const err = await res.json();
        addLog(`❌ Помилка: ${err.error}`, 'warn');
        setRunning(false);
        return;
      }

      if (!res.body) return;

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const block of lines) {
          if (!block.startsWith('data: ')) continue;

          try {
            const payload = JSON.parse(block.substring(6));

            if (payload.error) {
              addLog(`❌ Помилка: ${payload.error}`, 'warn');
              setRunning(false);
              return;
            }

            if (payload.type === 'step') {
              processStepResult(payload.data, params.disturbances);
            } else if (payload.type === 'done') {
              setStats(prev => ({ ...prev, runId: payload.run_id }));
              addLog('■ Симуляцію завершено', 'success');
              addLog(`  Run ID: #${payload.run_id}  |  Збережено в Neon DB`, 'info');
            }
          } catch {
            // Ignore parse errors on incomplete SSE chunks
          }
        }
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Невідома помилка';
      addLog(`❌ ${message}`, 'warn');
    }

    setRunning(false);
  }, [addLog, processStepResult]);

  // ============================================================
  //  Manual mode — step-by-step execution
  // ============================================================
  const executeManualStep = useCallback(async (
    params: RunParams,
    data: InitialData,
    A_current: number[][],
    B_current: number[],
    C_current: number[],
    alpha: number[],
    beta: number[],
    gamma: number[],
    lastSolution: number[] | null,
    runId: number | null,
    t: number
  ) => {
    try {
      addLog(`⏳ Обчислення кроку ${t + 1}...`, 'accent');

      const res = await fetch('/api/run-step', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dimension: params.dimension,
          k: params.k,
          population: params.population,
          generations: params.generations,
          mutation: params.mutation,
          disturbances: params.disturbances,
          t,
          run_id: runId,
          A_current,
          B_current,
          C_current,
          A_input: data.A,
          B_input: data.B,
          C_input: data.C,
          alpha,
          beta,
          gamma,
          last_solution: lastSolution,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        addLog(`❌ Помилка: ${err.error}`, 'warn');
        setRunning(false);
        setShowPerturbPanel(false);
        return;
      }

      const result = await res.json();

      // Process chart/log update
      processStepResult({
        t: result.t,
        fitness: result.fitness,
        utility: result.utility,
        non_adapted_utility: result.non_adapted_utility,
        effect_percent: result.effect_percent,
        u: result.u,
        A: result.A,
        B: result.B,
        C: result.C,
        alpha: result.alpha,
        beta: result.beta,
        gamma: result.gamma,
        elapsed: result.elapsed,
      }, params.disturbances);

      const nextStep = t + 1;

      if (nextStep < params.disturbances) {
        // More steps to go — show perturbation panel
        setManualState({
          params,
          data,
          A_current: A_current,  // Will be updated with perturbation on apply
          B_current: B_current,
          C_current: C_current,
          lastSolution: result.last_solution,
          runId: result.run_id,
          currentStep: nextStep,
        });
        setStats(prev => ({ ...prev, runId: result.run_id }));
        setShowPerturbPanel(true);
      } else {
        // Done!
        setStats(prev => ({ ...prev, runId: result.run_id }));
        addLog('■ Симуляцію завершено (ручний режим)', 'success');
        addLog(`  Run ID: #${result.run_id}  |  Збережено в Neon DB`, 'info');
        setRunning(false);
        setShowPerturbPanel(false);
        setManualState(null);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Невідома помилка';
      addLog(`❌ ${message}`, 'warn');
      setRunning(false);
      setShowPerturbPanel(false);
    }
  }, [addLog, processStepResult]);

  // ============================================================
  //  Handle perturbation apply — compute new matrices, run next step
  // ============================================================
  const handlePerturbationApply = useCallback((alpha: number[], beta: number[], gamma: number[]) => {
    if (!manualState) return;
    setShowPerturbPanel(false);

    const { params, data } = manualState;

    // Apply perturbations to ORIGINAL matrices (not accumulated)
    const A_next = data.A.map(row => row.map((v, j) => v * gamma[j]));
    const B_next = data.B.map((v, i) => v * beta[i]);
    const C_next = data.C.map((v, i) => v * alpha[i]);

    addLog(`🎛️ Збурення застосовано: α=[${alpha.map(v => v.toFixed(2)).join(',')}]  β=[${beta.map(v => v.toFixed(2)).join(',')}]  γ=[${gamma.map(v => v.toFixed(2)).join(',')}]`, 'warn');

    executeManualStep(
      params,
      data,
      A_next,
      B_next,
      C_next,
      alpha,
      beta,
      gamma,
      manualState.lastSolution,
      manualState.runId,
      manualState.currentStep
    );
  }, [manualState, executeManualStep, addLog]);

  // ============================================================
  //  Handle cancel manual mode
  // ============================================================
  const handleManualCancel = useCallback(() => {
    setShowPerturbPanel(false);
    setRunning(false);
    setManualState(null);
    addLog('✕ Ручний режим зупинено користувачем', 'warn');
  }, [addLog]);

  // ============================================================
  //  Main start handler — routes to auto or manual
  // ============================================================
  const handleStart = useCallback(async (params: RunParams, data: InitialData, scenario: Scenario | null, isManual: boolean) => {
    setRunning(true);
    resetAll(params);

    addLog('▶ Адаптивний процес запущено', 'accent');
    addLog(`  m=${params.dimension}  T=${params.disturbances}  pop=${params.population}  gen=${params.generations}`, 'info');
    addLog(`  k=${params.k.toFixed(2)}  mut=${params.mutation.toFixed(3)}`, 'info');

    if (isManual) {
      addLog('🎛️ Режим: ручне керування збуреннями', 'success');
      addLog('─'.repeat(48), 'divider');

      // First step uses original matrices with no perturbation
      const ones = Array(params.dimension).fill(1.0);
      executeManualStep(params, data, data.A, data.B, data.C, ones, ones, ones, null, null, 0);
    } else {
      if (scenario) addLog(`✅ Сценарій: ${scenario.name}`, 'success');
      else addLog('🎲 Режим: випадкові збурення', 'warn');
      addLog('─'.repeat(48), 'divider');

      runAutoMode(params, data, scenario);
    }
  }, [addLog, resetAll, executeManualStep, runAutoMode]);

  const progress = stats.total > 0 ? (stats.step / stats.total) * 100 : 0;

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '4px' }}>
          Еволюційне моделювання
          <span style={{ marginLeft: 10, fontSize: '0.75rem', fontWeight: 400, color: 'var(--muted)', verticalAlign: 'middle' }}>
            слабконелінійних систем
          </span>
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: '0.82rem' }}>
          Адаптивна оптимізація за допомогою генетичного алгоритму
        </p>
      </div>

      <div className="two-col">

        {/* ======== LEFT ======== */}
        <div>
          <SimulationForm
            onStart={handleStart}
            disabled={running}
            activeScenario={activeScenario}
            onScenarioChange={setActiveScenario}
          />
        </div>

        {/* ======== RIGHT ======== */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Stats */}
          <div className="stats-row">
            <div className="stat-badge">
              <div className="stat-label">Цільова ф-я (середнє)</div>
              <div className="stat-value">
                {averages.count > 0 ? (averages.sumFitness / averages.count).toFixed(4) : '—'}
              </div>
            </div>
            <div className="stat-badge">
              <div className="stat-label">Пристосованість Bu* (сер)</div>
              <div className="stat-value" style={{ color: '#10b981' }}>
                {averages.count > 0 ? (averages.sumUtility / averages.count).toFixed(3) : '—'}
              </div>
            </div>
            <div className="stat-badge">
              <div className="stat-label">Еко-ефект (сер)</div>
              {(() => {
                const avgEf = averages.count > 0 ? (averages.sumEffect / averages.count) : null;
                return (
                  <div className="stat-value" style={{ color: avgEf !== null && avgEf >= 0 ? '#10b981' : '#f87171' }}>
                    {avgEf !== null ? `${avgEf >= 0 ? '+' : ''}${avgEf.toFixed(2)}%` : '—'}
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Progress */}
          {running && (
            <div className="card" style={{ padding: '12px 16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="running-dot" /> Виконується...
                </span>
                <span style={{ fontSize: '0.8rem', fontFamily: 'JetBrains Mono', color: 'var(--accent)' }}>
                  {stats.step} / {stats.total}
                </span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}

          {/* Charts */}
          <ChartPanel
            fitnessData={fitnessData}
            buData={buData}
            AData={AData}
            BData={BData}
            CData={CData}
            uData={uData}
            dimension={dim}
          />

          {/* Log */}
          <div className="card">
            <div className="card-title">Журнал виконання</div>
            <LogPanel lines={logs} />
          </div>

          {/* Run info */}
          {stats.runId && (
            <div style={{ fontSize: '0.78rem', color: 'var(--muted)', textAlign: 'right' }}>
              ✅ Збережено як <span style={{ color: 'var(--accent)', fontFamily: 'JetBrains Mono' }}>Run #{stats.runId}</span>
              {' · '}
              <a href="/history" style={{ color: 'var(--accent)', textDecoration: 'none' }}>
                Переглянути в історії →
              </a>
            </div>
          )}
        </div>
      </div>

      {/* ======== Manual Perturbation Modal ======== */}
      {showPerturbPanel && manualState && (
        <ManualPerturbationPanel
          dimension={manualState.params.dimension}
          step={manualState.currentStep - 1}
          total={manualState.params.disturbances}
          k={manualState.params.k}
          onApply={handlePerturbationApply}
          onCancel={handleManualCancel}
        />
      )}
    </div>
  );
}
