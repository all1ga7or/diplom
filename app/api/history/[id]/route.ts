import { NextRequest, NextResponse } from 'next/server';
import { getRunConfig, getEvolution } from '@/lib/db';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const runId = parseInt(id);
    const [config, evolution] = await Promise.all([
      getRunConfig(runId),
      getEvolution(runId),
    ]);
    if (!config) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ config, evolution });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'DB error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
