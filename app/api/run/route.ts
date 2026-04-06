import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Call Python serverless function (on Vercel it runs as /api/execute_ga)
    // For local dev we simulate via a direct import approach
    // On Vercel: the Python function is deployed at the same origin
    const url = process.env.NEXT_PUBLIC_BASE_URL
      ? `${process.env.NEXT_PUBLIC_BASE_URL}/api/execute_ga`
      : 'http://localhost:3000/api/execute_ga';

    const pyRes = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
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
