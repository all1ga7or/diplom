'use client';
import { useState, useCallback, useEffect } from 'react';
import { RunParams, InitialData, Scenario } from '@/lib/types';
import ScenarioPicker from '@/components/ScenarioPicker';

const STORAGE_KEY = 'sim_form_state';

interface Props {
  onStart: (params: RunParams, data: InitialData, scenario: Scenario | null, manualMode: boolean) => void;
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

function loadSaved(): {
  dimension: number; population: number; generations: number;
  mutation: number; disturbances: number; k: number;
  manualMode: boolean; A: number[][]; B: number[]; C: number[];
  scenario: Scenario | null;
} | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch { return null; }
}

export default function SimulationForm({ onStart, disabled, activeScenario, onScenarioChange }: Props) {
  const saved = loadSaved();

  const [dimension, setDimension] = useState(saved?.dimension ?? 2);
  const [population, setPopulation] = useState(saved?.population ?? 50);
  const [generations, setGenerations] = useState(saved?.generations ?? 50);
  const [mutation, setMutation] = useState(saved?.mutation ?? 0.05);
  const [disturbances, setDisturbances] = useState(saved?.disturbances ?? 10);
  const [k, setK] = useState(saved?.k ?? 0.1);
  const [manualMode, setManualMode] = useState(saved?.manualMode ?? false);

  const [A, setA] = useState<number[][]>(saved?.A ?? defaultMatrix(2));
  const [B, setB] = useState<number[]>(saved?.B ?? defaultVector(2));
  const [C, setC] = useState<number[]>(saved?.C ?? defaultVector(2));

  const [autofilling, setAutofilling] = useState(false);

  // Restore scenario from sessionStorage on mount
  useEffect(() => {
    if (saved?.scenario && !activeScenario) {
      onScenarioChange(saved.scenario);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Detect replay request from History page — populate form fields only
  // (the actual replay animation is handled by page.tsx)
  useEffect(() => {
    try {
      const replayRaw = sessionStorage.getItem('sim_replay');
      if (!replayRaw) return;
      // Don't remove — page.tsx will read and remove it

      const replay = JSON.parse(replayRaw);
      if (replay.dimension) {
        setDimension(replay.dimension);
        setPopulation(replay.population);
        setGenerations(replay.generations);
        setMutation(replay.mutation);
        setDisturbances(replay.disturbances);
        setK(replay.k);
        setA(replay.A);
        setB(replay.B);
        setC(replay.C);
        setManualMode(false);
        onScenarioChange(null);
      }
    } catch { /* ignore */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist form state to sessionStorage on every change
  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
        dimension, population, generations, mutation, disturbances, k,
        manualMode, A, B, C, scenario: activeScenario,
      }));
    } catch { /* ignore quota errors */ }
  }, [dimension, population, generations, mutation, disturbances, k, manualMode, A, B, C, activeScenario]);

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
      manualMode ? null : activeScenario,
      manualMode
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* ---- Algorithm params ---- */}
      <div className="card">
        <div className="card-title">Параметри алгоритму</div>

        <div className="field-row">
          <span className="field-label">Розмірність m <span className="help-tip" title="Кількість секторів енергетичної системи (виробництво, транспорт тощо). Визначає розміри матриці A (m×m) та векторів B, C, u.">?</span></span>
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
          <span className="field-label">Популяція <span className="help-tip" title="Кількість кандидатних рішень (особин) у генетичному алгоритмі. Більша популяція → точніший, але повільніший пошук оптимуму.">?</span></span>
          <input type="number" className="field-input" min={10} max={500}
            value={population} onChange={e => setPopulation(Number(e.target.value))} />
        </div>

        <div className="field-row">
          <span className="field-label">Покоління <span className="help-tip" title="Кількість ітерацій еволюції ГА. Більше поколінь → більше часу для конвергенції до оптимуму.">?</span></span>
          <input type="number" className="field-input" min={10} max={500}
            value={generations} onChange={e => setGenerations(Number(e.target.value))} />
        </div>

        <div className="field-row">
          <span className="field-label">Збурень T <span className="help-tip" title="Кількість кроків симуляції. На кожному кроці ГА оптимізує систему, після чого застосовуються збурення α, β, γ.">?</span></span>
          <input type="number" className="field-input" min={1} max={50}
            value={disturbances} onChange={e => setDisturbances(Number(e.target.value))} />
        </div>

        <div className="slider-row">
          <div className="slider-label-row">
            <span>Ймовірність мутації <span className="help-tip" title="Шанс випадкової зміни гена. Баланс між розвідкою нових рішень (висока мутація) та збереженням знайдених (низька мутація).">?</span></span>
            <span>{mutation.toFixed(3)}</span>
          </div>
          <input type="range" min={0.001} max={0.2} step={0.001}
            value={mutation} onChange={e => setMutation(Number(e.target.value))} />
        </div>

        <div className="slider-row">
          <div className="slider-label-row">
            <span>Параметр збурення k <span className="help-tip" title="Визначає діапазон допустимих значень uᵢ: від (1−k) до (1+k). Більше k = ширший діапазон оптимізації.">?</span></span>
            <span>{k.toFixed(2)}</span>
          </div>
          <input type="range" min={0.05} max={0.5} step={0.01}
            value={k} onChange={e => setK(Number(e.target.value))} />
        </div>
      </div>

      {/* ---- Perturbation mode ---- */}
      <div className="card">
        <div className="card-title">Режим збурень</div>

        <div className="toggle-row">
          <span className="toggle-label">🎛️ Ручне керування</span>
          <button
            type="button"
            className={`toggle-switch ${manualMode ? 'active' : ''}`}
            onClick={() => setManualMode(!manualMode)}
          />
        </div>

        {manualMode ? (
          <div style={{ color: 'var(--green)', fontSize: '0.82rem', padding: '10px 0 2px' }}>
            ✋ Ви керуватимете збуреннями вручну на кожному кроці через вертикальні повзунки α, β, γ
          </div>
        ) : (
          <ScenarioPicker
            dimension={dimension}
            activeScenario={activeScenario}
            onSelect={onScenarioChange}
          />
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
