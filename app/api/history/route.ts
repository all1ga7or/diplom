import { NextRequest, NextResponse } from 'next/server';
import { getAllRuns } from '@/lib/db';

export async function GET(_req: NextRequest) {
  try {
    const runs = await getAllRuns();
    return NextResponse.json(runs);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'DB error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
