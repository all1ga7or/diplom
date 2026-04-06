import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const origin = req.headers.get('origin') || new URL(req.url).origin || 'http://localhost:3000';
    const pyRes = await fetch(`${origin}/api/execute_step`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    const result = await pyRes.json();
    if (!pyRes.ok) throw new Error(result.error || 'Step execution failed');

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
