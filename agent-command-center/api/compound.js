import { get, set } from '@vercel/edge-config';

export const config = {
  runtime: 'edge',
};

function jsonResponse(body, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'Access-Control-Allow-Origin': '*',
      ...extraHeaders,
    },
  });
}

export default async function handler(req) {
  const url = new URL(req.url);

  if (req.method === 'POST') {
    const auth = req.headers.get('authorization') || '';
    const expected = process.env.SYNC_SECRET || '';
    if (!expected || auth !== `Bearer ${expected}`) {
      return jsonResponse({ error: 'Unauthorized' }, 401);
    }

    try {
      const payload = await req.json();
      await set('compound', payload);
      return jsonResponse({ ok: true, updatedAt: new Date().toISOString() });
    } catch (err) {
      return jsonResponse({ error: `Write failed: ${err.message}` }, 500);
    }
  }

  const force = url.searchParams.get('refresh') === '1';

  try {
    const data = await get('compound');

    if (!data) {
      return jsonResponse({
        agents: [],
        decisions: [],
        stale: true,
        error: 'No telemetry received yet. The sync script may still be starting.',
        updatedAt: new Date().toISOString(),
      }, 503);
    }

    return jsonResponse({
      ...data,
      _refreshed: force,
    });
  } catch (err) {
    return jsonResponse({
      agents: [],
      decisions: [],
      stale: true,
      error: `Edge Config read failed: ${err.message}`,
      updatedAt: new Date().toISOString(),
    }, 500);
  }
}
