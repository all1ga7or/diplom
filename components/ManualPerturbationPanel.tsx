'use client';
import { useState, useEffect } from 'react';

interface Props {
  dimension: number;
  step: number;
  total: number;
  k: number;
  onApply: (alpha: number[], beta: number[], gamma: number[]) => void;
  onCancel: () => void;
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
            <span className="perturbation-value" style={{ color: val >= 1 ? '#10b981' : '#f87171' }}>
              {val.toFixed(2)}
            </span>
            <div className="vertical-slider-track">
              <input
                type="range"
                className="vertical-slider"
                min={0.5}
                max={1.5}
                step={0.01}
                value={val}
                onChange={e => updateVec(setter, i, Number(e.target.value))}
              />
              <div className="slider-midline" />
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
        <p className="perturbation-desc">
          Налаштуйте коефіцієнти збурень перед наступною ітерацією ГА.
          Значення <strong>1.0</strong> = без змін. Перетягніть повзунок <strong>вгору</strong> для збільшення,{' '}
          <strong>вниз</strong> для зменшення.
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
          <button className="btn btn-primary" onClick={() => onApply(alpha, beta, gamma)}>
            ▶ Застосувати та продовжити
          </button>
        </div>
      </div>
    </div>
  );
}
