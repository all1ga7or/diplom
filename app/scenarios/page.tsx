'use client';
import { useState, useEffect } from 'react';
import { Scenario } from '@/lib/types';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const COLORS = { alpha: '#38bdf8', beta: '#10b981', gamma: '#fbbf24' };

export default function ScenariosPage() {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Scenario | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  // Form state
  const [name, setName]       = useState('');
  const [desc, setDesc]       = useState('');
  const [m, setM]             = useState(2);
  const [alphaVals, setAlpha] = useState<number[]>([1.0, 1.0]);
  const [betaVals,  setBeta]  = useState<number[]>([1.0, 1.0]);
  const [gammaVals, setGamma] = useState<number[]>([1.0, 1.0]);

  const [activeTab, setActiveTab] = useState<'list'|'create'>('list');

  useEffect(() => {
    fetch('/api/scenarios').then(r => r.json()).then(d => {
      setScenarios(Array.isArray(d) ? d : []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const resizeM = (newM: number) => {
    setM(newM);
    const resize = (arr: number[]) => Array.from({ length: newM }, (_, i) => arr[i] ?? 1.0);
    setAlpha(resize(alphaVals));
    setBeta(resize(betaVals));
    setGamma(resize(gammaVals));
  };

  const updateVec = (setter: React.Dispatch<React.SetStateAction<number[]>>, i: number, val: string) => {
    setter(prev => { const n = [...prev]; n[i] = parseFloat(val) || 1; return n; });
  };

  const chartData = selected
    ? selected.alpha.map((a, i) => ({
        name: `S${i+1}`,
        alpha: a,
        beta: selected.beta[i],
        gamma: selected.gamma[i],
      }))
    : [];

  const previewData = alphaVals.map((a, i) => ({
    name: `S${i+1}`,
    alpha: a,
    beta: betaVals[i],
    gamma: gammaVals[i],
  }));

  const handleSave = async () => {
    if (!name.trim()) { setMsg({ text: 'Введіть назву сценарію', ok: false }); return; }
    setSaving(true);
    try {
      const res = await fetch('/api/scenarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description: desc, m, alpha: alphaVals, beta: betaVals, gamma: gammaVals }),
      });
      if (!res.ok) throw new Error('Помилка збереження');
      const updated = await fetch('/api/scenarios').then(r => r.json());
      setScenarios(Array.isArray(updated) ? updated : []);
      setMsg({ text: `✅ Сценарій "${name}" збережено!`, ok: true });
      setName(''); setDesc('');
      setActiveTab('list');
    } catch {
      setMsg({ text: '❌ Помилка збереження', ok: false });
    }
    setSaving(false);
    setTimeout(() => setMsg(null), 3000);
  };

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1>Менеджер сценаріїв</h1>
        <p style={{ color: 'var(--muted)', fontSize: '0.82rem', marginTop: 4 }}>
          Сценарії збурень alpha (C), beta (B), gamma (A) для кожного часового кроку
        </p>
      </div>

      {msg && (
        <div className={`notification${msg.ok ? ' success' : ' error'}`}>
          {msg.text}
        </div>
      )}

      <div className="tab-bar" style={{ marginBottom: 20 }}>
        <button className={`tab-btn${activeTab === 'list' ? ' active' : ''}`} onClick={() => setActiveTab('list')}>
          📂 Мої сценарії ({scenarios.length})
        </button>
        <button className={`tab-btn${activeTab === 'create' ? ' active' : ''}`} onClick={() => setActiveTab('create')}>
          ➕ Додати новий
        </button>
      </div>

      {/* ======== LIST TAB ======== */}
      {activeTab === 'list' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 20, alignItems: 'start' }}>
          {/* list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {loading && <div style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>Завантаження...</div>}
            {!loading && scenarios.length === 0 && (
              <div className="empty-state" style={{ border: '1px solid var(--border)', borderRadius: 12, paddingTop: 40 }}>
                <div className="empty-state-icon">🎭</div>
                <h3>Немає сценаріїв</h3>
                <p>Створіть перший сценарій у вкладці &quot;Додати новий&quot;</p>
              </div>
            )}
            {scenarios.map(s => (
              <div
                key={s.name}
                className={`scenario-card${selected?.name === s.name ? ' selected' : ''}`}
                onClick={() => setSelected(s)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div className="scenario-card-name">{s.name}</div>
                  <span className="scenario-card-m">m = {s.m}</span>
                </div>
                {s.description && <div className="scenario-card-desc">{s.description}</div>}
                <div style={{ marginTop: 8, display: 'flex', gap: 6 }}>
                  <span className="badge badge-blue">α: [{s.alpha.map(v => v.toFixed(2)).join(', ')}]</span>
                </div>
              </div>
            ))}
          </div>

          {/* chart preview */}
          {selected ? (
            <div className="card">
              <div className="card-title">Візуалізація: {selected.name}</div>
              <p style={{ fontSize: '0.78rem', color: 'var(--muted)', marginBottom: 16 }}>
                {selected.description}
              </p>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={chartData} margin={{ top: 5, right: 16, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} domain={[0.5, 1.5]} />
                  <Tooltip contentStyle={{ backgroundColor: '#131d31', border: '1px solid #1e293b', borderRadius: 8, fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="alpha" name="Alpha (C)" fill={COLORS.alpha} radius={[4,4,0,0]} />
                  <Bar dataKey="beta"  name="Beta (B)"  fill={COLORS.beta}  radius={[4,4,0,0]} />
                  <Bar dataKey="gamma" name="Gamma (A)" fill={COLORS.gamma} radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
              <div style={{ marginTop: 12, padding: '10px 0', borderTop: '1px solid var(--border)', fontSize: '0.8rem', color: 'var(--muted)' }}>
                💡 Щоб застосувати цей сценарій — поверніться на сторінку симуляції та оберіть його там
              </div>
            </div>
          ) : (
            <div className="empty-state" style={{ border: '1px solid var(--border)', borderRadius: 12 }}>
              <div className="empty-state-icon">👆</div>
              <h3>Оберіть сценарій</h3>
              <p>Клікніть на картку для перегляду коефіцієнтів</p>
            </div>
          )}
        </div>
      )}

      {/* ======== CREATE TAB ======== */}
      {activeTab === 'create' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 20, alignItems: 'start' }}>
          <div className="card">
            <div className="card-title">Новий сценарій</div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="form-field">
                <label className="form-label">Назва *</label>
                <input className="form-input" value={name} onChange={e => setName(e.target.value)} placeholder="Наприклад: Енергетична криза 2024" />
              </div>
              <div className="form-field">
                <label className="form-label">Опис</label>
                <input className="form-input" value={desc} onChange={e => setDesc(e.target.value)} placeholder="Короткий опис сценарію" />
              </div>
              <div className="form-field">
                <label className="form-label">Розмірність m</label>
                <select className="form-input" value={m} onChange={e => resizeM(Number(e.target.value))} style={{ width: 80 }}>
                  {Array.from({ length: 9 }, (_, i) => i + 2).map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>

              {/* Table */}
              <div>
                <div style={{ fontSize: '0.78rem', color: 'var(--muted)', marginBottom: 8 }}>
                  Коефіцієнти збурень по секторах (рекомендований діапазон: 0.8 – 1.2)
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                  <thead>
                    <tr>
                      {['Сектор', 'Alpha (C)', 'Beta (B)', 'Gamma (A)'].map(h => (
                        <th key={h} style={{ padding: '6px 8px', color: 'var(--muted)', fontWeight: 600, textAlign: 'center', borderBottom: '1px solid var(--border)' }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from({ length: m }, (_, i) => (
                      <tr key={i}>
                        <td style={{ padding: '6px 8px', textAlign: 'center', color: 'var(--muted)' }}>S{i+1}</td>
                        {([
                          [alphaVals, setAlpha] as [number[], React.Dispatch<React.SetStateAction<number[]>>],
                          [betaVals,  setBeta]  as [number[], React.Dispatch<React.SetStateAction<number[]>>],
                          [gammaVals, setGamma] as [number[], React.Dispatch<React.SetStateAction<number[]>>],
                        ]).map(([vals, setter], j) => (
                          <td key={j} style={{ padding: '4px 6px', textAlign: 'center' }}>
                            <input
                              type="number" step="0.05" min="0.1" max="2.0"
                              value={vals[i]}
                              onChange={e => updateVec(setter, i, e.target.value)}
                              onBlur={e => {
                                let v = parseFloat(e.target.value);
                                if (isNaN(v)) v = 1.0;
                                v = Math.min(2.0, Math.max(0.1, v));
                                updateVec(setter, i, String(v));
                              }}
                              style={{ width: 70, background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: 5, padding: '4px 6px', textAlign: 'center', fontFamily: 'JetBrains Mono', fontSize: '0.8rem' }}
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? <><span className="spinner" style={{ width: 14, height: 14 }} /> Збереження...</> : '💾 Зберегти сценарій'}
              </button>
            </div>
          </div>

          {/* Live preview */}
          <div className="card">
            <div className="card-title">Попередній перегляд</div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={previewData} margin={{ top: 5, right: 16, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} domain={[0.5, 1.5]} />
                <Tooltip contentStyle={{ backgroundColor: '#131d31', border: '1px solid #1e293b', borderRadius: 8, fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="alpha" name="Alpha (C)" fill={COLORS.alpha} radius={[4,4,0,0]} />
                <Bar dataKey="beta"  name="Beta (B)"  fill={COLORS.beta}  radius={[4,4,0,0]} />
                <Bar dataKey="gamma" name="Gamma (A)" fill={COLORS.gamma} radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
            <div style={{ padding: '12px 0 0', fontSize: '0.78rem', color: 'var(--muted)' }}>
              Графік оновлюється в реальному часі при введенні значень
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
