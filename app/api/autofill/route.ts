import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { m } = await req.json();
  const dim = Math.max(2, Math.min(6, Number(m) || 2));

  // Generate random A, B, C consistent with the model
  const A: number[][] = Array.from({ length: dim }, () =>
    Array.from({ length: dim }, () => parseFloat((Math.random()).toFixed(4)))
  );
  const u0 = Array(dim).fill(1);
  // B = q @ A  (dirichlet-like)
  const q = dirichlet(dim);
  const B = matVec(matT(A), q).map(v => parseFloat(v.toFixed(4)));
  // C = A @ u0
  const C = matVec(A, u0).map(v => parseFloat(v.toFixed(4)));

  return NextResponse.json({ A, B, C });
}

function dirichlet(n: number): number[] {
  const samples = Array.from({ length: n }, () => -Math.log(Math.random()));
  const sum = samples.reduce((a, b) => a + b, 0);
  return samples.map(s => s / sum);
}

function matT(M: number[][]): number[][] {
  return M[0].map((_, j) => M.map(row => row[j]));
}

function matVec(M: number[][], v: number[]): number[] {
  return M.map(row => row.reduce((s, val, j) => s + val * v[j], 0));
}
