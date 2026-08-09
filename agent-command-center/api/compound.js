import { get } from '@vercel/edge-config';

export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  const url = new URL(req.url);
  const force = url.searchParams.get('refresh') === '1';

  try {
    const data = await get('compound');

    if (!data) {
      return new Response(JSON.stringify({
        agents: [],
        decisions: [],
        stale: true,
        error: 'No telemetry received yet. The sync script may still be starting.',
        updatedAt: new Date().toISOString(),
      }), {
        status: 503,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    return new Response(JSON.stringify({
      ...data,
      _refreshed: force,
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({
      agents: [],
      decisions: [],
      stale: true,
      error: `Edge Config read failed: ${err.message}`,
      updatedAt: new Date().toISOString(),
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}
