'use client';
import { useState, useCallback } from 'react';
import SimulationForm from '@/components/SimulationForm';
import ChartPanel from '@/components/ChartPanel';
import LogPanel from '@/components/LogPanel';
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

  const addLog = useCallback((text: string, type?: LogLine['type']) => {
    setLogs(prev => [...prev, { text, type }]);
  }, []);

  const handleStart = useCallback(async (params: RunParams, data: InitialData, scenario: Scenario | null) => {
    setRunning(true);
    setLogs([]);
    setFitnessData([]); setBuData([]); setAData([]); setBData([]); setCData([]); setUData([]);
    setStats({ fitness: null, utility: null, effect: null, runId: null, step: 0, total: params.disturbances });
    setAverages({ sumFitness: 0, sumUtility: 0, sumEffect: 0, count: 0 });
    setDim(params.dimension);

    addLog('▶ Адаптивний процес запущено', 'accent');
    addLog(`  m=${params.dimension}  T=${params.disturbances}  pop=${params.population}  gen=${params.generations}`, 'info');
    addLog(`  k=${params.k.toFixed(2)}  mut=${params.mutation.toFixed(3)}`, 'info');
    if (scenario) addLog(`✅ Сценарій: ${scenario.name}`, 'success');
    else addLog('🎲 Режим: випадкові збурення', 'warn');
    addLog('─'.repeat(48), 'divider');

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
        buffer = lines.pop() || ''; // keep last incomplete chunk

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
              const step = payload.data;
              const t = step.t;

              addLog(`──────── t = ${t + 1} ────────`, 'divider');
              addLog(`  f* = ${step.fitness.toFixed(4)}`, 'accent');
              addLog(`  Bu* = ${step.utility.toFixed(3)}  Bu₀ = ${step.non_adapted_utility.toFixed(3)}`, 'info');
              addLog(`  Ефект адаптації: ${step.effect_percent.toFixed(1)}%`, 'success');
              addLog(`  u* = [${step.u.map((v: number) => v.toFixed(3)).join(', ')}]`, 'info');
              addLog(`  Час: ${step.elapsed.toFixed(2)} с`, 'info');

              setStats(prev => ({ ...prev, fitness: step.fitness, utility: step.utility, effect: step.effect_percent, step: t + 1, total: params.disturbances }));
              
              setAverages(prev => ({
                sumFitness: prev.sumFitness + step.fitness,
                sumUtility: prev.sumUtility + step.utility,
                sumEffect: prev.sumEffect + step.effect_percent,
                count: prev.count + 1
              }));

              // Update charts
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

              let stepCounter = t + 1; // dummy var for step count log
              
              // Artificial delay to ensure smooth simulation animation 
              // even if Python buffers chunks
              await new Promise(r => setTimeout(r, 60));

            } else if (payload.type === 'done') {
              setStats(prev => ({ ...prev, runId: payload.run_id }));
              addLog('■ Симуляцію завершено', 'success');
              addLog(`  Run ID: #${payload.run_id}  |  Збережено в Neon DB`, 'info');
            }
          } catch (e) {
            // Ignore parse errors on incomplete chunks that snuck through
          }
        }
      }

    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Невідома помилка';
      addLog(`❌ ${message}`, 'warn');
    }

    setRunning(false);
  }, [addLog]);

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
    </div>
  );
}
