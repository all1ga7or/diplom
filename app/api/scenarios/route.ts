import { NextRequest, NextResponse } from 'next/server';
import { getAllScenarios, saveScenario } from '@/lib/db';

export async function GET(_req: NextRequest) {
  try {
    const scenarios = await getAllScenarios();
    return NextResponse.json(scenarios);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'DB error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { name, description, m, alpha, beta, gamma } = await req.json();
    if (!name || !m || !alpha || !beta || !gamma) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }
    await saveScenario(name, description || '', m, alpha, beta, gamma);
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'DB error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
