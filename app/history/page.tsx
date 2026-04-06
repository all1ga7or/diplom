'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import ChartPanel from '@/components/ChartPanel';
import LogPanel from '@/components/LogPanel';
import { Run, EvolutionStep, ChartPoint } from '@/lib/types';

interface LogLine { text: string; type?: 'info' | 'accent' | 'success' | 'warn' | 'divider'; }

export default function HistoryPage() {
  const router = useRouter();
  const [runs, setRuns] = useState<Run[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Run | null>(null);
  const [detail, setDetail] = useState<{ config: unknown; evolution: EvolutionStep[] } | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const [fitnessData, setFitnessData] = useState<ChartPoint[]>([]);
  const [buData,      setBuData]       = useState<ChartPoint[]>([]);
  const [AData,       setAData]        = useState<ChartPoint[]>([]);
  const [BData,       setBData]        = useState<ChartPoint[]>([]);
  const [CData,       setCData]        = useState<ChartPoint[]>([]);
  const [uData,       setUData]        = useState<ChartPoint[]>([]);
  const [dim,         setDim]          = useState(2);
  const [replayLogs,  setReplayLogs]   = useState<LogLine[]>([]);

  useEffect(() => {
    fetch('/api/history')
      .then(r => r.json())
      .then(d => { setRuns(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const loadDetail = useCallback(async (run: Run) => {
    setSelected(run);
    setLoadingDetail(true);
    setFitnessData([]); setBuData([]); setAData([]); setBData([]); setCData([]); setUData([]);
    setReplayLogs([]);

    try {
      const res = await fetch(`/api/history/${run.id}`);
      const data = await res.json();
      setDetail(data);
      setDim(run.dimension);

      const logs: LogLine[] = [
        { text: `▶ Відтворення Run #${run.id}`, type: 'accent' },
        { text: `  m=${run.dimension}  T=${run.disturbances_t}  pop=${run.population}  gen=${run.generations}`, type: 'info' },
      ];

      const steps: EvolutionStep[] = data.evolution;

      const fd: ChartPoint[] = [];
      const bd: ChartPoint[] = [];
      const ad: ChartPoint[] = [];
      const bbd: ChartPoint[] = [];
      const cd: ChartPoint[] = [];
      const ud: ChartPoint[] = [];

      steps.forEach(step => {
        const t = step.t + 1;
        fd.push({ t, fitness: step.fitness });
        bd.push({ t, adapted: step.utility, base: step.utility - (step.effect_percent / 100 * step.utility) });

        const aP: ChartPoint = { t };
        step.A.forEach((row: number[], i: number) => row.forEach((v: number, j: number) => { aP[`a${i+1}${j+1}`] = v; }));
        ad.push(aP);

        const bP: ChartPoint = { t };
        step.B.forEach((v: number, i: number) => { bP[`b${i+1}`] = v; });
        bbd.push(bP);

        const cP: ChartPoint = { t };
        step.C.forEach((v: number, i: number) => { cP[`c${i+1}`] = v; });
        cd.push(cP);

        const uP: ChartPoint = { t };
        step.u.forEach((v: number, i: number) => { uP[`u${i+1}`] = v; });
        ud.push(uP);

        logs.push({ text: `  t=${t}  f*=${step.fitness.toFixed(4)}  Bu*=${step.utility.toFixed(3)}  ефект=${step.effect_percent.toFixed(1)}%`, type: 'info' });
      });

      setFitnessData(fd); setBuData(bd); setAData(ad); setBData(bbd); setCData(cd); setUData(ud);
      logs.push({ text: '■ Дані завантажено', type: 'success' });
      setReplayLogs(logs);

    } catch {
      setReplayLogs([{ text: '❌ Помилка завантаження деталей', type: 'warn' }]);
    }

    setLoadingDetail(false);
  }, []);

  const loadRunAndNavigate = () => {
    if (selected) router.push(`/?run=${selected.id}`);
  };

  if (loading) return (
    <div className="empty-state">
      <div className="spinner" style={{ margin: '0 auto 16px' }} />
      <p>Завантаження...</p>
    </div>
  );

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1>Історія запусків</h1>
        <p style={{ color: 'var(--muted)', fontSize: '0.82rem', marginTop: 4 }}>
          Клікніть на рядок для перегляду деталей та графіків
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 20, alignItems: 'start' }}>

        {/* Table */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            {runs.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">📋</div>
                <h3>Немає запусків</h3>
                <p>Запустіть симуляцію на головній сторінці</p>
              </div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Дата</th>
                    <th>m</th>
                    <th>T</th>
                    <th>Pop</th>
                    <th>Gen</th>
                    <th>k</th>
                    <th>Оптимум</th>
                    <th>Час</th>
                    <th>Тип</th>
                  </tr>
                </thead>
                <tbody>
                  {runs.map(run => (
                    <tr
                      key={run.id}
                      className={selected?.id === run.id ? 'selected' : ''}
                      onClick={() => loadDetail(run)}
                    >
                      <td><span className="badge badge-blue">#{run.id}</span></td>
                      <td style={{ color: 'var(--muted)', fontSize: '0.75rem', minWidth: 130 }}>
                        {new Date(run.timestamp).toLocaleString('uk-UA')}
                      </td>
                      <td style={{ textAlign: 'center' }}>{run.dimension}</td>
                      <td style={{ textAlign: 'center' }}>{run.disturbances_t}</td>
                      <td>{run.population}</td>
                      <td>{run.generations}</td>
                      <td>{Number(run.k).toFixed(2)}</td>
                      <td style={{ color: 'var(--accent)' }}>
                        {run.best_value !== null ? Number(run.best_value).toFixed(4) : '—'}
                      </td>
                      <td style={{ color: 'var(--muted)' }}>
                        {run.elapsed_time !== null ? `${Number(run.elapsed_time).toFixed(1)}с` : '—'}
                      </td>
                      <td>
                        <span className={`badge ${run.is_manual ? 'badge-purple' : 'badge-green'}`}>
                          {run.is_manual ? 'Сценарій' : 'Авто'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Detail */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {selected ? (
            <>
              <div className="card">
                <div className="card-title">Run #{selected.id} · Деталі</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 16px', fontSize: '0.82rem' }}>
                  {[
                    ['Розмірність', selected.dimension],
                    ['Збурення T', selected.disturbances_t],
                    ['Популяція', selected.population],
                    ['Покоління', selected.generations],
                    ['Мутація', Number(selected.mutation).toFixed(3)],
                    ['k', Number(selected.k).toFixed(2)],
                    ['Оптимум f*', selected.best_value !== null ? Number(selected.best_value).toFixed(4) : '—'],
                    ['Час виконання', selected.elapsed_time !== null ? `${Number(selected.elapsed_time).toFixed(2)} с` : '—'],
                  ].map(([label, value]) => (
                    <div key={label as string} style={{ borderBottom: '1px solid #1e293b', padding: '5px 0', display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--muted)' }}>{label}</span>
                      <span style={{ fontFamily: 'JetBrains Mono', color: 'var(--accent)' }}>{value as string}</span>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 12 }}>
                  <button className="btn btn-secondary btn-sm" onClick={loadRunAndNavigate}>
                    ↩ Повторити запуск
                  </button>
                </div>
              </div>

              {loadingDetail ? (
                <div className="card" style={{ textAlign: 'center', padding: 40 }}>
                  <div className="spinner" style={{ margin: '0 auto 12px' }} />
                  <div style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>Завантаження даних...</div>
                </div>
              ) : detail && (
                <>
                  <ChartPanel
                    fitnessData={fitnessData}
                    buData={buData}
                    AData={AData}
                    BData={BData}
                    CData={CData}
                    uData={uData}
                    dimension={dim}
                  />
                  <div className="card">
                    <div className="card-title">Журнал відтворення</div>
                    <LogPanel lines={replayLogs} />
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="empty-state" style={{ border: '1px solid var(--border)', borderRadius: 12 }}>
              <div className="empty-state-icon">👆</div>
              <h3>Оберіть запуск</h3>
              <p>Клікніть на рядок у таблиці, щоб переглянути графіки та деталі</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
