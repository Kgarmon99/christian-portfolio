export const config = {
  runtime: 'edge',
};

const EDGE_CONFIG_ID = process.env.EDGE_CONFIG_ID || 'ecfg_xewteivxfrqvj87ymkikog9zm4hp';
const TOKEN = process.env.VERCEL_API_TOKEN;
const TEAM_ID = process.env.VERCEL_TEAM_ID || 'team_hFyozVWSOzlq1L9LuWo9U94e';

async function readEdgeConfig() {
  if (!TOKEN) throw new Error('VERCEL_API_TOKEN not set');
  const url = `https://api.vercel.com/v1/edge-config/${EDGE_CONFIG_ID}/items?teamId=${TEAM_ID}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${TOKEN}` } });
  if (!res.ok) throw new Error(`Edge Config read failed: ${res.status}`);
  const items = await res.json();
  const compoundItem = Array.isArray(items) ? items.find(item => item.key === 'compound') : null;
  return compoundItem?.value || null;
}

export default async function handler(req) {
  const checkAt = new Date().toISOString();
  const checks = {
    edgeConfigReachable: false,
    compoundPresent: false,
    compoundFresh: false,
    anyAgentWorking: false,
    agentCompoundReachable: false,
    ageSeconds: null,
    workingAgents: 0,
    totalAgents: 0,
    errors: [],
  };

  try {
    const data = await readEdgeConfig();
    checks.edgeConfigReachable = true;
    if (data) {
      checks.compoundPresent = true;
      checks.totalAgents = data.agents?.length || 0;
      checks.workingAgents = data.agents?.filter(a => a.status === 'working').length || 0;
      checks.anyAgentWorking = checks.workingAgents > 0;
      const updatedAt = data.sourceGeneratedAt || data.updatedAt;
      if (updatedAt) {
        const ageMs = Date.now() - new Date(updatedAt).getTime();
        checks.ageSeconds = Math.max(0, Math.floor(ageMs / 1000));
        checks.compoundFresh = ageMs < 120000; // 2 minutes
      }
    }
  } catch (err) {
    checks.errors.push(`edge-config: ${err.message}`);
  }

  try {
    const acRes = await fetch('http://127.0.0.1:7331/api/compound?refresh=1', { cache: 'no-store' });
    checks.agentCompoundReachable = acRes.ok;
  } catch (err) {
    checks.errors.push(`agent-compound: ${err.message}`);
  }

  const healthy = checks.edgeConfigReachable && checks.compoundPresent && checks.compoundFresh;
  const status = healthy ? 200 : 503;

  return new Response(JSON.stringify({ checkAt, healthy, ...checks }, null, 2), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
