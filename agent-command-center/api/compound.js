export const config = {
  runtime: 'edge',
};

const EDGE_CONFIG_ID = process.env.EDGE_CONFIG_ID || 'ecfg_xewteivxfrqvj87ymkikog9zm4hp';
const TOKEN = process.env.VERCEL_API_TOKEN;
const TEAM_ID = process.env.VERCEL_TEAM_ID || 'team_hFyozVWSOzlq1L9LuWo9U94e';

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

async function readEdgeConfig() {
  if (!TOKEN) {
    throw new Error('VERCEL_API_TOKEN not set');
  }
  const url = `https://api.vercel.com/v1/edge-config/${EDGE_CONFIG_ID}/items?teamId=${TEAM_ID}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${TOKEN}` },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Edge Config read failed: ${res.status} ${err.message || ''}`);
  }
  const items = await res.json();
  const compoundItem = Array.isArray(items) ? items.find(item => item.key === 'compound') : null;
  return compoundItem?.value || null;
}

export default async function handler(req) {
  const url = new URL(req.url);
  const force = url.searchParams.get('refresh') === '1';

  try {
    const data = await readEdgeConfig();

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
      error: `Read failed: ${err.message}`,
      updatedAt: new Date().toISOString(),
    }, 500);
  }
}
