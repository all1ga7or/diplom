import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export { sql };

// ==================== INIT ====================
export async function initDb() {
  await sql`
    CREATE TABLE IF NOT EXISTS runs (
      id SERIAL PRIMARY KEY,
      timestamp TIMESTAMPTZ DEFAULT NOW(),
      dimension INTEGER,
      population INTEGER,
      generations INTEGER,
      mutation REAL,
      disturbances_t INTEGER,
      k REAL,
      best_value REAL,
      elapsed_time REAL,
      is_manual INTEGER DEFAULT 0
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS run_config (
      run_id INTEGER PRIMARY KEY REFERENCES runs(id),
      a0 TEXT,
      b0 TEXT,
      c0 TEXT,
      u_min TEXT,
      u_max TEXT
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS evolution (
      run_id INTEGER REFERENCES runs(id),
      t INTEGER,
      fitness REAL,
      utility REAL,
      a TEXT,
      b TEXT,
      c TEXT,
      u TEXT,
      alpha TEXT,
      beta TEXT,
      gamma TEXT,
      elapsed_time REAL,
      effect_percent REAL
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS scenarios (
      id SERIAL PRIMARY KEY,
      name TEXT UNIQUE,
      description TEXT,
      m INTEGER,
      alpha TEXT,
      beta TEXT,
      gamma TEXT
    )
  `;

  // seed default scenario if empty
  const count = await sql`SELECT COUNT(*) as c FROM scenarios`;
  if (Number(count[0].c) === 0) {
    const alpha = JSON.stringify([1.12, 1.05, 1.02, 1.20]);
    const beta  = JSON.stringify([0.95, 1.10, 1.00, 0.80]);
    const gamma = JSON.stringify([1.05, 0.98, 1.03, 1.10]);
    await sql`
      INSERT INTO scenarios (name, description, m, alpha, beta, gamma)
      VALUES (
        'Енерго-трансформація 2024',
        'Модель збурень в енергетиці: ріст цін на паливо, підтримка ВДЕ та еко-податки',
        4,
        ${alpha},
        ${beta},
        ${gamma}
      )
    `;
  }
}

// ==================== RUNS ====================
export async function getAllRuns() {
  return await sql`
    SELECT id, timestamp, dimension, population, generations,
           mutation, disturbances_t, k, best_value, elapsed_time, is_manual
    FROM runs
    ORDER BY id DESC
  `;
}

export async function getRunConfig(runId: number) {
  const runs = await sql`
    SELECT dimension, population, generations, mutation, disturbances_t, k
    FROM runs WHERE id = ${runId}
  `;
  if (!runs.length) return null;

  const cfgs = await sql`
    SELECT a0, b0, c0, u_min, u_max
    FROM run_config WHERE run_id = ${runId}
  `;
  if (!cfgs.length) return null;

  const run = runs[0];
  const cfg = cfgs[0];
  return {
    run_id: runId,
    dimension: run.dimension,
    population: run.population,
    generations: run.generations,
    mutation: run.mutation,
    disturbances: run.disturbances_t,
    k: run.k,
    A: JSON.parse(cfg.a0),
    B: JSON.parse(cfg.b0),
    C: JSON.parse(cfg.c0),
    u_min: JSON.parse(cfg.u_min),
    u_max: JSON.parse(cfg.u_max),
  };
}

export async function getEvolution(runId: number) {
  const rows = await sql`
    SELECT t, fitness, utility, a, b, c, u, alpha, beta, gamma, elapsed_time, effect_percent
    FROM evolution
    WHERE run_id = ${runId}
    ORDER BY t
  `;
  return rows.map(r => ({
    t: r.t,
    fitness: r.fitness,
    utility: r.utility,
    A: JSON.parse(r.a),
    B: JSON.parse(r.b),
    C: JSON.parse(r.c),
    u: JSON.parse(r.u),
    alpha: JSON.parse(r.alpha),
    beta: JSON.parse(r.beta),
    gamma: JSON.parse(r.gamma),
    elapsed_time: r.elapsed_time,
    effect_percent: r.effect_percent,
  }));
}

// ==================== SCENARIOS ====================
export async function getAllScenarios() {
  const rows = await sql`SELECT id, name, description, m, alpha, beta, gamma FROM scenarios`;
  return rows.map(r => ({
    id: r.id,
    name: r.name,
    description: r.description,
    m: r.m,
    alpha: JSON.parse(r.alpha),
    beta: JSON.parse(r.beta),
    gamma: JSON.parse(r.gamma),
  }));
}

export async function saveScenario(name: string, description: string, m: number, alpha: number[], beta: number[], gamma: number[]) {
  await sql`
    INSERT INTO scenarios (name, description, m, alpha, beta, gamma)
    VALUES (${name}, ${description}, ${m}, ${JSON.stringify(alpha)}, ${JSON.stringify(beta)}, ${JSON.stringify(gamma)})
    ON CONFLICT (name) DO UPDATE SET description=EXCLUDED.description, m=EXCLUDED.m,
      alpha=EXCLUDED.alpha, beta=EXCLUDED.beta, gamma=EXCLUDED.gamma
  `;
}
