import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const origin = req.headers.get('origin') || new URL(req.url).origin || 'http://localhost:3000';
    const pyRes = await fetch(`${origin}/api/execute_ga`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!pyRes.ok) {
      return NextResponse.json({ error: 'Помилка симуляції' }, { status: pyRes.status });
    }

    // Proxy the Server-Sent Events stream from Python
    return new Response(pyRes.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
