export const config = {
  runtime: 'edge',
};

const TUNNEL_URL = 'https://kgbuilds-mac.tailce70ec.ts.net';

async function fetchFromTunnel(path, refresh = false) {
  const url = `${TUNNEL_URL}${path}${refresh ? '?refresh=1' : ''}`;
  const res = await fetch(url, {
    method: 'GET',
    headers: { 'Accept': 'application/json' },
  });
  if (!res.ok) throw new Error(`Tunnel HTTP ${res.status}`);
  return res.json();
}

export default async function handler(req) {
  const url = new URL(req.url);
  const refresh = url.searchParams.get('refresh') === '1';
  const headers = {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store, no-cache, must-revalidate',
    'Access-Control-Allow-Origin': '*',
  };

  try {
    const data = await fetchFromTunnel('/api/compound', refresh);
    return new Response(JSON.stringify({ ...data, _source: 'tunnel' }, null, 2), { status: 200, headers });
  } catch (err) {
    console.error('Tunnel fetch failed:', err.message);
    return new Response(JSON.stringify({
      agents: [],
      decisions: [],
      decisionCount: 0,
      stale: true,
      error: `Tunnel unavailable: ${err.message}`,
      _source: 'tunnel-failed',
    }, null, 2), { status: 503, headers });
  }
}
