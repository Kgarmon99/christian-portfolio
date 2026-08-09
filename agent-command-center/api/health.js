export const config = {
  runtime: 'edge',
};

const TUNNEL_URL = 'https://kgbuilds-mac.tailce70ec.ts.net';

export default async function handler(req) {
  const checkAt = new Date().toISOString();
  const checks = {
    tunnelReachable: false,
    compoundReachable: false,
    compoundFresh: false,
    anyAgentWorking: false,
    ageSeconds: null,
    workingAgents: 0,
    totalAgents: 0,
    tunnelUrl: TUNNEL_URL,
    errors: [],
  };

  try {
    const res = await fetch(`${TUNNEL_URL}/api/compound`, { cache: 'no-store' });
    checks.tunnelReachable = true;
    if (res.ok) {
      const data = await res.json();
      checks.compoundReachable = true;
      checks.totalAgents = data.agents?.length || 0;
      checks.workingAgents = data.agents?.filter(a => a.status === 'working').length || 0;
      checks.anyAgentWorking = checks.workingAgents > 0;
      const updatedAt = data.sourceGeneratedAt || data.updatedAt;
      if (updatedAt) {
        const ageMs = Date.now() - new Date(updatedAt).getTime();
        checks.ageSeconds = Math.max(0, Math.floor(ageMs / 1000));
        checks.compoundFresh = ageMs < 120000;
      }
    }
  } catch (err) {
    checks.errors.push(`tunnel: ${err.message}`);
  }

  const healthy = checks.tunnelReachable && checks.compoundReachable && checks.compoundFresh;
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
