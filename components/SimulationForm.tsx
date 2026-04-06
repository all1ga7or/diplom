'use client';
import { useState, useCallback } from 'react';
import { RunParams, InitialData, Scenario } from '@/lib/types';

interface Props {
  onStart: (params: RunParams, data: InitialData, scenario: Scenario | null) => void;
  onLoadConfig?: (cfg: RunParams & InitialData & { run_id: number }) => void;
  disabled: boolean;
  activeScenario: Scenario | null;
  onScenarioChange: (s: Scenario | null) => void;
}

function defaultMatrix(m: number): number[][] {
  return Array.from({ length: m }, () => Array(m).fill(0.25));
}
function defaultVector(m: number): number[] {
  return Array(m).fill(0.25);
}

export default function SimulationForm({ onStart, disabled, activeScenario, onScenarioChange }: Props) {
  const [dimension, setDimension] = useState(2);
  const [population, setPopulation] = useState(50);
  const [generations, setGenerations] = useState(50);
  const [mutation, setMutation] = useState(0.05);
  const [disturbances, setDisturbances] = useState(10);
  const [k, setK] = useState(0.1);

  const [A, setA] = useState<number[][]>(defaultMatrix(2));
  const [B, setB] = useState<number[]>(defaultVector(2));
  const [C, setC] = useState<number[]>(defaultVector(2));

  const [autofilling, setAutofilling] = useState(false);

  const resizeDimension = useCallback((newM: number) => {
    setDimension(newM);
    setA(prev => {
      const next = Array.from({ length: newM }, (_, i) =>
        Array.from({ length: newM }, (_, j) => prev[i]?.[j] ?? 0.25)
      );
      return next;
    });
    setB(prev => Array.from({ length: newM }, (_, i) => prev[i] ?? 0.25));
    setC(prev => Array.from({ length: newM }, (_, i) => prev[i] ?? 0.25));
  }, []);

  const updateA = (i: number, j: number, val: string) => {
    setA(prev => {
      const next = prev.map(r => [...r]);
      next[i][j] = parseFloat(val) || 0;
      return next;
    });
  };

  const updateVec = (setter: React.Dispatch<React.SetStateAction<number[]>>, i: number, val: string) => {
    setter(prev => { const n = [...prev]; n[i] = parseFloat(val) || 0; return n; });
  };

  const autofill = async () => {
    setAutofilling(true);
    try {
      const res = await fetch('/api/autofill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ m: dimension }),
      });
      const data = await res.json();
      setA(data.A);
      setB(data.B);
      setC(data.C);
    } catch (_) { /* ignore */ }
    setAutofilling(false);
  };

  const handleStart = () => {
    onStart(
      { dimension, population, generations, mutation, disturbances, k },
      { A, B, C },
      activeScenario
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* ---- Algorithm params ---- */}
      <div className="card">
        <div className="card-title">Параметри алгоритму</div>

        <div className="field-row">
          <span className="field-label">Розмірність m</span>
          <select
            className="field-input"
            value={dimension}
            onChange={e => {
              const newM = Number(e.target.value);
              resizeDimension(newM);
              if (activeScenario && activeScenario.m !== newM) {
                onScenarioChange(null);
              }
            }}
          >
            {[2,3,4,5,6,7,8,9,10].map(v => <option key={v} value={v}>{v}</option>)}
          </select>
        </div>

        <div className="field-row">
          <span className="field-label">Популяція</span>
          <input type="number" className="field-input" min={10} max={500}
            value={population} onChange={e => setPopulation(Number(e.target.value))} />
        </div>

        <div className="field-row">
          <span className="field-label">Покоління</span>
          <input type="number" className="field-input" min={10} max={500}
            value={generations} onChange={e => setGenerations(Number(e.target.value))} />
        </div>

        <div className="field-row">
          <span className="field-label">Збурень T</span>
          <input type="number" className="field-input" min={1} max={50}
            value={disturbances} onChange={e => setDisturbances(Number(e.target.value))} />
        </div>

        <div className="slider-row">
          <div className="slider-label-row">
            <span>Ймовірність мутації</span>
            <span>{mutation.toFixed(3)}</span>
          </div>
          <input type="range" min={0.001} max={0.2} step={0.001}
            value={mutation} onChange={e => setMutation(Number(e.target.value))} />
        </div>

        <div className="slider-row">
          <div className="slider-label-row">
            <span>Параметр збурення k</span>
            <span>{k.toFixed(2)}</span>
          </div>
          <input type="range" min={0.05} max={0.5} step={0.01}
            value={k} onChange={e => setK(Number(e.target.value))} />
        </div>
      </div>

      {/* ---- Active scenario ---- */}
      <div className="card">
        <div className="card-title">Сценарій збурень</div>
        {activeScenario ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div className="scenario-card selected">
              <div className="scenario-card-name">✅ {activeScenario.name}</div>
              <div className="scenario-card-desc">{activeScenario.description}</div>
              <div className="scenario-card-m">m = {activeScenario.m}</div>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => onScenarioChange(null)}>
              🎲 Скинути (випадкові збурення)
            </button>
          </div>
        ) : (
          <div style={{ color: 'var(--muted)', fontSize: '0.82rem', padding: '8px 0' }}>
            🎲 Режим випадкових збурень<br />
            <a href="/scenarios" style={{ color: 'var(--accent)', textDecoration: 'none', fontSize: '0.78rem' }}>
              → Перейти до менеджера сценаріїв
            </a>
          </div>
        )}
      </div>

      {/* ---- Matrices ---- */}
      <div className="card">
        <div className="card-title">Вхідні дані</div>
        <div className="matrix-container" style={{ display: 'flex', gap: '20px' }}>
          {/* A */}
          <div style={{ paddingRight: '4px' }}>
            <div className="matrix-label">Матриця <span>A</span></div>
            <div className="matrix-a-wrapper" style={{ width: '295px', overflowX: 'auto', paddingBottom: '8px' }}>
              <div className="matrix-grid">
                {A.map((row, i) => (
                  <div key={i} className="matrix-row">
                    {row.map((val, j) => (
                      <input key={j} className="matrix-cell"
                        type="number" step="0.001"
                        style={{ minWidth: '55px' }}
                        value={val}
                        onChange={e => updateA(i, j, e.target.value)} />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* B */}
          <div style={{ width: '60px' }}>
            <div className="matrix-label">Вектор <span>B</span></div>
            <div className="vector-col">
              {B.map((val, i) => (
                <input key={i} className="matrix-cell"
                  type="number" step="0.001"
                  style={{ minWidth: '55px', maxWidth: '55px' }}
                  value={val}
                  onChange={e => updateVec(setB, i, e.target.value)} />
              ))}
            </div>
          </div>

          {/* C */}
          <div style={{ width: '60px' }}>
            <div className="matrix-label">Вектор <span>C</span></div>
            <div className="vector-col">
              {C.map((val, i) => (
                <input key={i} className="matrix-cell"
                  type="number" step="0.001"
                  style={{ minWidth: '55px', maxWidth: '55px' }}
                  value={val}
                  onChange={e => updateVec(setC, i, e.target.value)} />
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
          <button className="btn btn-secondary btn-sm" onClick={autofill} disabled={autofilling}>
            {autofilling ? <><span className="spinner" style={{ width: 12, height: 12 }} /> Генерація...</> : '🎲 Автозаповнення'}
          </button>
        </div>
      </div>

      {/* ---- Start ---- */}
      <button
        className="btn btn-primary btn-full"
        onClick={handleStart}
        disabled={disabled}
        style={{ padding: '13px' }}
      >
        {disabled
          ? <><span className="spinner" /> Виконується...</>
          : '▶ Запустити симуляцію'}
      </button>
    </div>
  );
}
