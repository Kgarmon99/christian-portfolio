export const config = {
  runtime: 'edge',
};

const TUNNEL_URL = 'https://kgbuilds-mac.tailce70ec.ts.net';
const EDGE_CONFIG_ID = 'ecfg_xewteivxfrqvj87ymkikog9zm4hp';
const TEAM_ID = 'team_hFyozVWSOzlq1L9LuWo9U94e';

async function fetchFromTunnel(path, refresh = false) {
  const url = `${TUNNEL_URL}${path}${refresh ? '?refresh=1' : ''}`;
  const res = await fetch(url, { method: 'GET', headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`Tunnel HTTP ${res.status}`);
  return res.json();
}

async function fetchFromEdgeConfig(token) {
  const res = await fetch(
    `https://api.vercel.com/v1/edge-config/${EDGE_CONFIG_ID}/items?teamId=${TEAM_ID}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!res.ok) throw new Error(`Edge Config read failed: ${res.status}`);
  const items = await res.json();
  const compound = Array.isArray(items) ? items.find(i => i.key === 'compound') : null;
  return compound?.value || null;
}

export default async function handler(req) {
  const url = new URL(req.url);
  const refresh = url.searchParams.get('refresh') === '1';
  const headers = {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store, no-cache, must-revalidate',
    'Access-Control-Allow-Origin': '*',
  };

  // Browsers should hit the tunnel directly. This endpoint is used by non-browser clients
  // and as a fallback when the tunnel is unreachable.
  try {
    const data = await fetchFromTunnel('/api/compound', refresh);
    return new Response(JSON.stringify({ ...data, _source: 'tunnel' }, null, 2), { status: 200, headers });
  } catch (err) {
    console.error('Tunnel fetch failed:', err.message);
  }

  const token = process.env.VERCEL_API_TOKEN;
  if (!token) {
    return new Response(JSON.stringify({
      agents: [], decisions: [], decisionCount: 0, stale: true,
      error: 'Tunnel unreachable from Edge Config fallback; VERCEL_API_TOKEN not set.',
      _source: 'fallback-error',
    }, null, 2), { status: 503, headers });
  }

  try {
    const data = await fetchFromEdgeConfig(token);
    if (!data) throw new Error('No compound data in Edge Config');
    return new Response(JSON.stringify({ ...data, _source: 'edge-config-fallback', _stale: true }, null, 2), { status: 200, headers });
  } catch (ecErr) {
    return new Response(JSON.stringify({
      agents: [], decisions: [], decisionCount: 0, stale: true,
      error: `Tunnel unreachable from Edge Config; ${ecErr.message}`,
      _source: 'fallback-error',
    }, null, 2), { status: 503, headers });
  }
}
