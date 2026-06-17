'use client';
import { useState, useEffect } from 'react';

const MIN_VAL = 0.1;
const MAX_VAL = 2.0;

interface Props {
  dimension: number;
  step: number;
  total: number;
  k: number;
  onApply: (alpha: number[], beta: number[], gamma: number[]) => void;
  onCancel: () => void;
}

function clamp(v: number): number {
  if (isNaN(v)) return 1.0;
  return Math.round(Math.min(MAX_VAL, Math.max(MIN_VAL, v)) * 100) / 100;
}

function clampArray(arr: number[]): number[] {
  return arr.map(clamp);
}

export default function ManualPerturbationPanel({ dimension, step, total, k, onApply, onCancel }: Props) {
  const [alpha, setAlpha] = useState<number[]>(() => Array(dimension).fill(1.0));
  const [beta, setBeta] = useState<number[]>(() => Array(dimension).fill(1.0));
  const [gamma, setGamma] = useState<number[]>(() => Array(dimension).fill(1.0));

  // Reset sliders when step changes
  useEffect(() => {
    setAlpha(Array(dimension).fill(1.0));
    setBeta(Array(dimension).fill(1.0));
    setGamma(Array(dimension).fill(1.0));
  }, [step, dimension]);

  const updateVec = (setter: React.Dispatch<React.SetStateAction<number[]>>, i: number, val: number) => {
    setter(prev => { const n = [...prev]; n[i] = val; return n; });
  };

  const reset = () => {
    setAlpha(Array(dimension).fill(1.0));
    setBeta(Array(dimension).fill(1.0));
    setGamma(Array(dimension).fill(1.0));
  };

  // Clamp all values and then apply
  const handleApply = () => {
    const clampedAlpha = clampArray(alpha);
    const clampedBeta = clampArray(beta);
    const clampedGamma = clampArray(gamma);
    // Update UI to show clamped values before applying
    setAlpha(clampedAlpha);
    setBeta(clampedBeta);
    setGamma(clampedGamma);
    onApply(clampedAlpha, clampedBeta, clampedGamma);
  };

  const renderSliderGroup = (
    label: string,
    symbol: string,
    values: number[],
    setter: React.Dispatch<React.SetStateAction<number[]>>,
    color: string
  ) => (
    <div className="perturbation-group">
      <div className="perturbation-group-label" style={{ color }}>{label} ({symbol})</div>
      <div className="perturbation-sliders">
        {values.map((val, i) => (
          <div key={i} className="perturbation-slider-col">
            <div className="perturbation-spinner">
              <button
                className="spin-btn up"
                onClick={() => updateVec(setter, i, clamp(val + 0.05))}
                title="Збільшити на 0.05"
              >
                ▲
              </button>
              <input
                type="number"
                step="0.05"
                min={MIN_VAL}
                max={MAX_VAL}
                className="spin-input"
                value={val.toFixed(2)}
                onChange={(e) => {
                  const v = parseFloat(e.target.value);
                  if (!isNaN(v)) updateVec(setter, i, v);
                }}
                onBlur={(e) => {
                  const v = parseFloat(e.target.value);
                  updateVec(setter, i, clamp(v));
                }}
                style={{ color: val >= 1 ? '#10b981' : '#f87171' }}
              />
              <button
                className="spin-btn down"
                onClick={() => updateVec(setter, i, clamp(val - 0.05))}
                title="Зменшити на 0.05"
              >
                ▼
              </button>
            </div>
            <span className="perturbation-index">{symbol}<sub>{i + 1}</sub></span>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="perturbation-overlay">
      <div className="perturbation-modal">
        <div className="perturbation-header">
          <h3>🎛️ Ручне керування збуреннями</h3>
          <span className="perturbation-step">Крок {step + 1} → {step + 2} / {total}</span>
        </div>

        <div className="perturbation-range-hint">
          ℹ️ Допустимий діапазон значень: <strong>{MIN_VAL.toFixed(1)}</strong> — <strong>{MAX_VAL.toFixed(1)}</strong>
          <span style={{ marginLeft: 8, color: 'var(--muted)', fontSize: '0.72rem' }}>
            (значення поза діапазоном буде автоматично скориговано)
          </span>
        </div>

        <p className="perturbation-desc">
          Налаштуйте коефіцієнти збурень перед наступною ітерацією ГА.
          Значення <strong>1.0</strong> = без змін. Використовуйте стрілки (крок 0.05) або натисніть на значення для ручного введення.
        </p>

        {renderSliderGroup('Вартість', 'α', alpha, setAlpha, '#f87171')}
        {renderSliderGroup('Виробництво', 'β', beta, setBeta, '#38bdf8')}
        {renderSliderGroup('Технологія', 'γ', gamma, setGamma, '#a78bfa')}

        <div className="perturbation-actions">
          <button className="btn btn-secondary btn-sm" onClick={reset}>
            ↺ Скинути (1.0)
          </button>
          <button className="btn btn-ghost btn-sm" onClick={onCancel}>
            ✕ Зупинити
          </button>
          <button className="btn btn-primary" onClick={handleApply}>
            ▶ Застосувати та продовжити
          </button>
        </div>
      </div>
    </div>
  );
}
