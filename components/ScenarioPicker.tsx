'use client';
import { useState, useEffect, useRef } from 'react';
import { Scenario } from '@/lib/types';

interface Props {
  dimension: number;
  activeScenario: Scenario | null;
  onSelect: (scenario: Scenario | null) => void;
}

export default function ScenarioPicker({ dimension, activeScenario, onSelect }: Props) {
  const [open, setOpen] = useState(false);
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Fetch scenarios when dropdown opens (or refetch when dimension changes)
  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetch('/api/scenarios')
      .then(r => r.json())
      .then(d => {
        setScenarios(Array.isArray(d) ? d : []);
        setFetched(true);
      })
      .catch(() => setScenarios([]))
      .finally(() => setLoading(false));
  }, [open]);

  // Reset if dimension changed and selected scenario doesn't match
  useEffect(() => {
    if (activeScenario && activeScenario.m !== dimension) {
      onSelect(null);
    }
  }, [dimension, activeScenario, onSelect]);

  const filtered = scenarios.filter(s => s.m === dimension);

  const handleToggle = () => {
    setOpen(!open);
  };

  const handleSelect = (s: Scenario) => {
    onSelect(s);
    setOpen(false);
  };

  const handleClear = () => {
    onSelect(null);
    setOpen(false);
  };

  return (
    <div className="scenario-picker" ref={ref}>
      {/* Selected scenario display */}
      {activeScenario ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
          <div className="scenario-card selected">
            <div className="scenario-card-name">✅ {activeScenario.name}</div>
            <div className="scenario-card-desc">{activeScenario.description}</div>
            <div className="scenario-card-m">m = {activeScenario.m}</div>
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button className="btn btn-ghost btn-sm" onClick={handleClear}>
              🎲 Скинути (випадкові)
            </button>
            <button className="btn btn-ghost btn-sm" onClick={handleToggle} style={{ color: 'var(--accent)' }}>
              🔄 Змінити
            </button>
          </div>
        </div>
      ) : (
        <div style={{ color: 'var(--muted)', fontSize: '0.82rem', padding: '10px 0 2px' }}>
          🎲 Режим випадкових збурень
          <br />
          <button
            className="scenario-picker-trigger"
            onClick={handleToggle}
          >
            📂 Обрати сценарій збурень (m = {dimension})
            <span style={{
              transition: 'transform 0.2s',
              transform: open ? 'rotate(180deg)' : 'none',
              fontSize: '0.7rem',
              marginLeft: '4px',
            }}>▼</span>
          </button>
        </div>
      )}

      {/* Dropdown */}
      {open && (
        <div className="scenario-picker-dropdown">
          <div className="scenario-picker-header">
            <span>Сценарії для m = {dimension}</span>
            <button className="scenario-picker-close" onClick={() => setOpen(false)}>✕</button>
          </div>

          {loading ? (
            <div className="scenario-picker-loading">
              <span className="spinner" style={{ width: 14, height: 14 }} /> Завантаження...
            </div>
          ) : filtered.length === 0 ? (
            <div className="scenario-picker-empty">
              <div style={{ fontSize: '1.5rem', marginBottom: '6px' }}>🎭</div>
              <div>Немає сценаріїв для m = {dimension}</div>
              <div style={{ fontSize: '0.72rem', marginTop: '4px', color: 'var(--muted)' }}>
                Створіть їх на сторінці «🎭 Сценарії»
              </div>
              {fetched && scenarios.length > 0 && (
                <div style={{ fontSize: '0.72rem', marginTop: '6px', color: 'var(--muted)' }}>
                  Доступні для інших m: {[...new Set(scenarios.map(s => s.m))].sort((a, b) => a - b).join(', ')}
                </div>
              )}
            </div>
          ) : (
            <div className="scenario-picker-list">
              {filtered.map(s => (
                <button
                  key={s.id ?? s.name}
                  className={`scenario-picker-item${activeScenario?.name === s.name ? ' active' : ''}`}
                  onClick={() => handleSelect(s)}
                >
                  <div className="scenario-picker-item-name">{s.name}</div>
                  {s.description && (
                    <div className="scenario-picker-item-desc">{s.description}</div>
                  )}
                  <div className="scenario-picker-item-coeffs">
                    <span className="badge badge-blue" style={{ fontSize: '0.65rem' }}>
                      α: [{s.alpha.map(v => v.toFixed(2)).join(', ')}]
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}

          <div className="scenario-picker-footer">
            <a href="/scenarios" style={{ color: 'var(--accent)', textDecoration: 'none', fontSize: '0.75rem' }}>
              ➕ Створити новий сценарій →
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
