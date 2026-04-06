import json
import os
import time
import numpy as np
import psycopg2
from http.server import BaseHTTPRequestHandler

DATABASE_URL = os.environ.get("DATABASE_URL", "")


# ==================== DB HELPERS ====================
def get_conn():
    return psycopg2.connect(DATABASE_URL, sslmode="require")


def init_db(cur):
    cur.execute("""
    CREATE TABLE IF NOT EXISTS runs (
        id SERIAL PRIMARY KEY,
        timestamp TIMESTAMPTZ DEFAULT NOW(),
        dimension INTEGER, population INTEGER, generations INTEGER,
        mutation REAL, disturbances_t INTEGER, k REAL,
        best_value REAL, elapsed_time REAL, is_manual INTEGER DEFAULT 0
    )""")
    cur.execute("""
    CREATE TABLE IF NOT EXISTS run_config (
        run_id INTEGER PRIMARY KEY REFERENCES runs(id),
        a0 TEXT, b0 TEXT, c0 TEXT, u_min TEXT, u_max TEXT
    )""")
    cur.execute("""
    CREATE TABLE IF NOT EXISTS evolution (
        run_id INTEGER REFERENCES runs(id),
        t INTEGER, fitness REAL, utility REAL,
        a TEXT, b TEXT, c TEXT, u TEXT,
        alpha TEXT, beta TEXT, gamma TEXT,
        elapsed_time REAL, effect_percent REAL
    )""")
    cur.execute("""
    CREATE TABLE IF NOT EXISTS scenarios (
        id SERIAL PRIMARY KEY,
        name TEXT UNIQUE, description TEXT,
        m INTEGER, alpha TEXT, beta TEXT, gamma TEXT
    )""")


# ==================== MODEL ====================
class PenalizedModel:
    def __init__(self, A, B, C, u_min, u_max, k, penalty=100.0):
        self.A = A
        self.B = B
        self.C = C
        self.k = k
        self.M0 = penalty
        self.m = len(B)
        self.penalty_growth = 0.1
        self.A_min = (1 - k) * A
        self.A_max = (1 + k) * A
        self.u_min = u_min
        self.u_max = u_max
        self.generation = 0

    def set_generation(self, g):
        self.generation = g

    def objective(self, A, u):
        utility = np.dot(self.B, u)
        residual = A @ u - self.C
        M = self.M0 * (1 + self.penalty_growth * self.generation)
        penalty = M * np.sum(residual ** 2)
        return utility - penalty


# ==================== GENETIC ALGORITHM ====================
class GeneticAlgorithm:
    def __init__(self, model, pop_size, generations, mutation_rate):
        self.model = model
        self.pop_size = pop_size
        self.generations = generations
        self.mutation_rate = mutation_rate
        self.m = model.A.shape[0]
        self.num_genes = self.m * self.m + self.m
        self.gene_space = []
        for i in range(self.m):
            for j in range(self.m):
                self.gene_space.append((float(model.A_min[i, j]), float(model.A_max[i, j])))
        for j in range(self.m):
            self.gene_space.append((float(model.u_min[j]), float(model.u_max[j])))
        self.best_solution = None
        self.best_fitness = -np.inf

    def fitness_func(self, solution):
        A_flat = solution[:self.m * self.m]
        u = solution[self.m * self.m:]
        A = A_flat.reshape((self.m, self.m))
        return float(self.model.objective(A, u))

    def initialize_population(self, last_best=None):
        if last_best is not None:
            pop = np.tile(last_best, (self.pop_size, 1))
            pop += np.random.normal(0, 0.02, pop.shape)
        else:
            pop = np.zeros((self.pop_size, self.num_genes))
            for i in range(self.num_genes):
                low, high = self.gene_space[i]
                pop[:, i] = np.random.uniform(low, high, self.pop_size)
        return pop

    def select_parents(self, population, fitness, num_parents):
        ranks = np.argsort(np.argsort(-fitness))
        probs = (len(ranks) - ranks) / np.sum(len(ranks) - ranks)
        indices = np.random.choice(len(population), size=num_parents, p=probs)
        return population[indices]

    def mutate(self, offspring, generation):
        progress = generation / self.generations
        mutation_percent = 10 - 8 * progress
        num_mutations = max(1, int(self.num_genes * mutation_percent / 100))
        for individual in offspring:
            idxs = np.random.choice(self.num_genes, num_mutations, replace=False)
            for idx in idxs:
                low, high = self.gene_space[idx]
                individual[idx] = np.random.uniform(low, high)
        return offspring

    def run(self, last_best=None):
        population = self.initialize_population(last_best)
        for generation in range(self.generations):
            fitness = np.array([self.fitness_func(ind) for ind in population])
            max_idx = np.argmax(fitness)
            if fitness[max_idx] > self.best_fitness:
                self.best_fitness = fitness[max_idx]
                self.best_solution = population[max_idx].copy()
            self.model.set_generation(generation)
            elite_count = 5
            elite_idx = np.argsort(-fitness)[:elite_count]
            elites = population[elite_idx]
            num_needed = self.pop_size - elite_count
            num_parents = max(2, self.pop_size // 4)
            parents = self.select_parents(population, fitness, num_parents)
            offspring = []
            while len(offspring) < num_needed:
                p1 = parents[np.random.randint(len(parents))]
                p2 = parents[np.random.randint(len(parents))]
                mask = np.random.rand(self.num_genes) < 0.5
                child = np.where(mask, p1, p2)
                offspring.append(child)
            offspring = np.array(offspring[:num_needed])
            offspring = self.mutate(offspring, generation)
            population = np.vstack((elites, offspring))
        sol = self.best_solution
        A_flat = sol[:self.m * self.m]
        u = sol[self.m * self.m:]
        A = A_flat.reshape((self.m, self.m))
        return self.best_fitness, (A, u)


# ==================== HANDLER ====================
class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        content_length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(content_length)
        try:
            data = json.loads(body)
            result = run_simulation(data)
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps(result).encode())
        except Exception as e:
            self.send_response(500)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"error": str(e)}).encode())

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()


def run_simulation(data):
    m = data["dimension"]
    T = data["disturbances"]
    k = data["k"]
    pop = data["population"]
    gens = data["generations"]
    mut = data["mutation"]
    A_input = np.array(data["A"])
    B_input = np.array(data["B"])
    C_input = np.array(data["C"])
    scenario = data.get("scenario")

    B_scale = np.sum(B_input)
    C_scale = np.sum(C_input)
    B_norm = B_input / B_scale
    C_norm = C_input / C_scale

    u0 = np.ones(m)
    u_min = np.full(m, 1 - k)
    u_max = np.full(m, 1 + k)

    A = A_input.copy()
    B = B_norm.copy()
    C = C_norm.copy()

    is_manual = 1 if scenario else 0

    conn = get_conn()
    cur = conn.cursor()
    init_db(cur)
    conn.commit()

    # Save run
    cur.execute("""
        INSERT INTO runs (dimension, population, generations, mutation, disturbances_t, k, is_manual)
        VALUES (%s, %s, %s, %s, %s, %s, %s) RETURNING id
    """, (m, pop, gens, mut, T, k, is_manual))
    run_id = cur.fetchone()[0]

    cur.execute("""
        INSERT INTO run_config (run_id, a0, b0, c0, u_min, u_max)
        VALUES (%s, %s, %s, %s, %s, %s)
    """, (run_id,
          json.dumps(A_input.tolist()),
          json.dumps(B_input.tolist()),
          json.dumps(C_input.tolist()),
          json.dumps(u_min.tolist()),
          json.dumps(u_max.tolist())))
    conn.commit()

    steps = []
    last_solution = None
    overall_best = None

    for t in range(T):
        t_start = time.time()
        model = PenalizedModel(A=A, B=B, C=C, u_min=u_min, u_max=u_max, k=k)
        ga = GeneticAlgorithm(model=model, pop_size=pop, generations=gens, mutation_rate=mut)
        best_fitness, (A_opt, u_opt) = ga.run(last_best=last_solution)
        best_fitness = abs(best_fitness)  # store positive

        utility = float(np.dot(B, u_opt)) * B_scale
        non_adapted_utility = float(np.dot(B, u0)) * B_scale
        eco_effect = utility - non_adapted_utility
        eco_effect_pct = (eco_effect / non_adapted_utility * 100) if non_adapted_utility != 0 else 0

        last_solution = np.concatenate([A_opt.flatten(), u_opt])
        elapsed = time.time() - t_start

        if scenario:
            alpha = np.array(scenario["alpha"])
            beta  = np.array(scenario["beta"])
            gamma = np.array(scenario["gamma"])
        else:
            alpha = np.random.uniform(1 - k, 1 + k, size=C.shape)
            beta  = np.random.uniform(1 - k, 1 + k, size=B.shape)
            gamma = np.random.uniform(1 - k, 1 + k, size=A.shape[1])

        A = A * gamma[np.newaxis, :]
        B = B * beta
        C = C * alpha

        # Save to DB
        cur.execute("""
            INSERT INTO evolution (run_id, t, fitness, utility, a, b, c, u, alpha, beta, gamma, elapsed_time, effect_percent)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (run_id, t, best_fitness, utility,
              json.dumps(A.tolist()), json.dumps(B.tolist()), json.dumps(C.tolist()),
              json.dumps(u_opt.tolist()),
              json.dumps(alpha.tolist()), json.dumps(beta.tolist()), json.dumps(gamma.tolist()),
              elapsed, eco_effect_pct))
        conn.commit()

        overall_best = best_fitness

        steps.append({
            "t": t,
            "fitness": best_fitness,
            "utility": utility,
            "non_adapted_utility": non_adapted_utility,
            "effect_percent": eco_effect_pct,
            "u": u_opt.tolist(),
            "A": A.tolist(),
            "B": B.tolist(),
            "C": C.tolist(),
            "alpha": alpha.tolist(),
            "beta": beta.tolist(),
            "gamma": gamma.tolist(),
            "elapsed": elapsed,
        })

    # Update best value
    if overall_best is not None:
        cur.execute("UPDATE runs SET best_value=%s WHERE id=%s", (overall_best, run_id))
        conn.commit()

    cur.close()
    conn.close()

    return {"run_id": run_id, "steps": steps}
