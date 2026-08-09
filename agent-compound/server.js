const express = require('express');
const { execFile } = require('child_process');
const fs = require('fs');
const fsp = fs.promises;
const os = require('os');
const path = require('path');
const { promisify } = require('util');

const execFileAsync = promisify(execFile);
const app = express();
const PORT = process.env.PORT || 7331;
const HOST = process.env.HOST || '127.0.0.1';
const PUBLIC_DIR = path.join(__dirname, 'public');
const OPENCLAW_DIR = path.join(os.homedir(), '.openclaw');
const AGENTS_DIR = path.join(OPENCLAW_DIR, 'agents');
const STATE_DIR = path.join(OPENCLAW_DIR, 'state');
const DB_PATH = path.join(STATE_DIR, 'openclaw.sqlite');
const COMMAND_CENTER = '/Users/kahlilgarmon/MoneyBotClaw-1/scripts/agent-command-center.sh';
const RECONCILE_MS = 30000;
const DEBOUNCE_MS = 150;
const HEARTBEAT_MS = 15000;
const RECENT_MS = 60 * 60 * 1000;
const OFFLINE_MS = 24 * 60 * 60 * 1000;
const MANUAL_REFRESH_MS = 10000;
const RUNNING_STALE_MS = 2 * 60 * 60 * 1000;

app.use(express.static(PUBLIC_DIR));

const AGENT_META = {
  main: { label: 'Clawdia', role: 'Chief of Staff', telegramUrl: 'https://t.me/KGatomicbot' },
  'moneybot-code': { label: 'CodeBot', role: 'Engineering', telegramUrl: 'https://t.me/MBGameDesignbot' },
  'moneybot-media': { label: 'MediaBot', role: 'Creative & Media', telegramUrl: 'https://t.me/LaborPeoplebot' },
  'ultimate-code-bot': { label: 'Ultimate', role: 'Architecture', telegramUrl: 'https://t.me/Kgcoderbot' },
  'moneybot-codex-studio': { label: 'Codex Studio', role: 'Code Generation', telegramUrl: 'https://t.me/SuperCoderKGbot' },
  'moneybot-fundraising': { label: 'FundBot', role: 'Fundraising', telegramUrl: 'https://t.me/FundMBBot' },
  'cfo-bot': { label: 'CFO-Bot', role: 'Finance', telegramUrl: 'https://t.me/MoneyBotCapitalbot' },
  'moneybot-capital': { label: 'CapitalBot', role: 'Capital Strategy', telegramUrl: null },
  'moneybot-labor': { label: 'LaborBot', role: 'Communications', telegramUrl: null },
};

let commandCenterData = null;
let payload = null;
let lastError = null;
let lastRegistries = null;
let lastActiveWork = null;
let registriesSuccessAt = 0;
let tasksSuccessAt = 0;
let healthSuccessAt = 0;
let registryError = null;
let taskError = null;
let healthError = null;
let lastBroadcastSignature = null;
let lastManualRefreshAt = 0;
let reconcileRunning = false;
let reconcileAgain = false;
let reconcileAgainFull = false;
let debounceTimer = null;
let sequence = 0;
const clients = new Set();
const watchers = [];

function sourceDataAgeMs(snapshot, now = Date.now()) {
  const freshness = snapshot?.sourceFreshness || {};
  const sourceTimes = [freshness.registriesAt, freshness.tasksAt, freshness.healthAt]
    .map(value => Date.parse(value))
    .filter(Number.isFinite);
  if (sourceTimes.length) return Math.max(0, now - Math.min(...sourceTimes));
  return null;
}

function safeJson(text, fallback) {
  try { return JSON.parse(text); } catch (_) { return fallback; }
}

function agentIdFromKey(key) {
  const match = String(key || '').match(/^agent:([^:]+)/);
  return match ? match[1] : null;
}

function timestampOf(session) {
  return Number(session?.lastActivityAt || session?.lastInteractionAt || session?.updatedAt || session?.endedAt || 0);
}

async function readRegistries() {
  const dirs = await fsp.readdir(AGENTS_DIR, { withFileTypes: true });
  const result = new Map();
  const failures = [];
  await Promise.all(dirs.filter(d => d.isDirectory()).map(async dir => {
    const file = path.join(AGENTS_DIR, dir.name, 'sessions', 'sessions.json');
    try {
      const parsed = JSON.parse(await fsp.readFile(file, 'utf8'));
      result.set(dir.name, Object.entries(parsed || {}).map(([key, value]) => ({ key, ...(value || {}) })));
    } catch (err) {
      if (err.code === 'ENOENT') result.set(dir.name, []);
      else failures.push(`${dir.name}: ${err.message}`);
    }
  }));
  if (failures.length) throw new Error(`registry read failed (${failures.length} source${failures.length === 1 ? '' : 's'})`);
  return result;
}

async function readActiveWork() {
  const sql = `
    SELECT 'task' AS kind, task_id AS id, COALESCE(agent_id, '') AS agent_id,
      owner_key, status, COALESCE(child_session_key, '') AS child_session_key,
      COALESCE(label, '') AS label, COALESCE(run_id, source_id, task_id) AS work_id,
      COALESCE(started_at, created_at) AS started_at, last_event_at AS updated_at
    FROM task_runs WHERE status IN ('queued','running')
    UNION ALL
    SELECT 'goal' AS kind, flow_id AS id, '' AS agent_id, owner_key, status,
      '' AS child_session_key, COALESCE(current_step, '') AS label, flow_id AS work_id,
      created_at AS started_at, updated_at
    FROM flow_runs WHERE ended_at IS NULL AND status NOT IN ('completed','failed','cancelled','canceled');`;
  const { stdout } = await execFileAsync('/usr/bin/sqlite3', ['-readonly', '-json', DB_PATH, sql], { timeout: 5000, maxBuffer: 4 * 1024 * 1024 });
  const parsed = JSON.parse(stdout || '[]');
  if (!Array.isArray(parsed)) throw new Error('active work result was not an array');
  return parsed;
}

// Only explicit task labels/current-step names are exposed. Raw task prompts, goal text,
// errors, delivery metadata, paths, URLs, and credentials never enter the UI payload.
function publicWorkTitle(value) {
  const text = String(value || '').replace(/\s+/g, ' ').trim();
  if (!text || text.length < 3) return null;
  const sensitive = /(?:https?:\/\/|\b(?:password|passwd|secret|api[-_ ]?key|access[-_ ]?token|bearer|credential)\b|(?:^|\s)[/~][\w./-]+|[A-Za-z0-9_-]{36,})/i;
  if (sensitive.test(text)) return null;
  return text.slice(0, 96);
}

async function refreshCommandCenter() {
  try {
    const { stdout } = await execFileAsync('bash', [COMMAND_CENTER, '--json'], { timeout: 15000, maxBuffer: 4 * 1024 * 1024 });
    const data = safeJson(stdout, null);
    if (!data) throw new Error('invalid command-center JSON');
    const fleet = data.sources?.fleet;
    if (fleet?.stdout) data.fleetParsed = safeJson(fleet.stdout, null);
    commandCenterData = data;
    healthSuccessAt = Date.now();
    healthError = null;
  } catch (err) {
    healthError = 'health source unavailable';
    console.error('Command-center refresh failed:', err.message);
  }
}

function cleanModel(fleetAgent, session) {
  if (session?.model) return String(session.model).replace(/^openai\s+/, 'openai/').replace(/^moonshot\s+/, 'moonshot/');
  return String(fleetAgent?.model || 'unknown').split(' fallback=')[0];
}

function workForAgent(agentId, sessions, activeWork) {
  const reasons = [];
  const now = Date.now();
  const runningSessions = sessions.filter(s => s.status === 'running' && now - timestampOf(s) <= RUNNING_STALE_MS && s.hasActiveRun !== false);
  const liveChildren = runningSessions.filter(s => s.key.includes(':subagent:') || Number(s.spawnDepth || 0) > 0 || s.hasActiveSubagentRun === true);
  const rawTasks = activeWork.filter(w => w.kind === 'task' && (w.agent_id === agentId || agentIdFromKey(w.owner_key) === agentId));
  const tasks = [...new Map(rawTasks.map(t => [t.work_id || t.id, t])).values()];
  const goals = activeWork.filter(w => w.kind === 'goal' && agentIdFromKey(w.owner_key) === agentId);
  if (runningSessions.length) reasons.push(`${runningSessions.length} running session${runningSessions.length === 1 ? '' : 's'}`);
  if (tasks.length) reasons.push(`${tasks.length} queued/running background task${tasks.length === 1 ? '' : 's'}`);
  if (liveChildren.length) reasons.push(`${liveChildren.length} live child session${liveChildren.length === 1 ? '' : 's'}`);
  if (goals.length) reasons.push(`${goals.length} unfinished assigned goal${goals.length === 1 ? '' : 's'}`);
  const items = [
    ...tasks.map(item => ({ kind: 'task', status: item.status, title: publicWorkTitle(item.label), startedAt: Number(item.started_at || 0) || null })),
    ...goals.map(item => ({ kind: 'goal', status: item.status, title: publicWorkTitle(item.label), startedAt: Number(item.started_at || 0) || null })),
    ...runningSessions.map(session => ({ kind: 'session', status: 'running', title: publicWorkTitle(session.label || session.displayName), startedAt: Number(session.startedAt || session.sessionStartedAt || 0) || null })),
  ];
  return { reasons, runningSessions, liveChildren, tasks, goals, items };
}

function buildPayload(registries, activeWork, trigger) {
  const fleet = commandCenterData?.fleetParsed || {};
  const fleetById = new Map((fleet.agents || []).map(a => [a.id, a]));
  const configured = new Set([...Object.keys(AGENT_META), ...fleetById.keys()].filter(id => AGENT_META[id]));
  const now = Date.now();
  const agents = [...configured].sort().map(id => {
    const sessions = registries.get(id) || [];
    const latest = sessions.reduce((best, s) => timestampOf(s) > timestampOf(best) ? s : best, null);
    const work = workForAgent(id, sessions, activeWork);
    const latestAt = timestampOf(latest);
    const ageMs = latestAt ? now - latestAt : Infinity;
    const completed = Boolean(latest?.endedAt || ['done', 'completed'].includes(String(latest?.status || '').toLowerCase()));
    let status = 'offline';
    if (work.reasons.length) status = 'working';
    else if (latestAt && ageMs <= RECENT_MS) status = 'ready';
    else if (latestAt && ageMs <= OFFLINE_MS && completed) status = 'recent';
    const fleetAgent = fleetById.get(id) || {};
    const meta = AGENT_META[id] || { label: id, role: 'Agent' };
    const activeSince = work.items.reduce((earliest, item) => item.startedAt && (!earliest || item.startedAt < earliest) ? item.startedAt : earliest, null);
    return {
      id, label: meta.label, role: meta.role, telegramUrl: meta.telegramUrl || null, status,
      sessionState: latest?.status || (sessions.length ? 'unknown' : 'none'),
      model: cleanModel(fleetAgent, latest),
      tokens: Number(latest?.totalTokens || 0),
      capacity: Number(latest?.contextCapacity || latest?.contextTokens || 0),
      nearLimit: Boolean(latest?.nearLimit),
      ageMin: latestAt ? Math.max(0, Math.floor((now - latestAt) / 60000)) : null,
      sessionId: latest?.sessionId || null,
      workReasons: work.reasons,
      activeCounts: { runningSessions: work.runningSessions.length, backgroundTasks: work.tasks.length, liveChildren: work.liveChildren.length, unfinishedGoals: work.goals.length },
      activeSince,
      activeWorkItems: work.items.map(item => ({ ...item, elapsedMs: item.startedAt ? Math.max(0, now - item.startedAt) : null })),
    };
  });
  const decisions = (commandCenterData?.pendingDecisions || []).map(d => ({ id: d.id, headline: d.headline, owner: d.owner || null, urgency: d.urgency || 'unknown', impact: d.impact || null }));
  const sourceGeneratedAt = commandCenterData?.generatedAt || fleet.generatedAt || null;
  const sourceErrors = [registryError, taskError, healthError].filter(Boolean);
  const hasAuthoritativeSnapshot = Boolean(registriesSuccessAt || tasksSuccessAt || healthSuccessAt);
  const next = {
    agents, decisions, decisionCount: decisions.length,
    gatewayOk: commandCenterData?.status?.gatewayOk ?? fleet.gatewayOk ?? null,
    watchdogOk: commandCenterData?.status?.watchdogLoaded ?? fleet.watchdog?.loaded ?? null,
    sourceGeneratedAt,
    sourceFreshness: {
      registriesAt: registriesSuccessAt ? new Date(registriesSuccessAt).toISOString() : null,
      tasksAt: tasksSuccessAt ? new Date(tasksSuccessAt).toISOString() : null,
      healthAt: healthSuccessAt ? new Date(healthSuccessAt).toISOString() : (sourceGeneratedAt || null), trigger,
    },
    updatedAt: new Date(now).toISOString(), dataAgeMs: 0,
    stale: sourceErrors.length > 0,
    error: sourceErrors.length
      ? (hasAuthoritativeSnapshot
        ? `Telemetry source unavailable: ${sourceErrors.join('; ')}. Showing last known values.`
        : `Telemetry sources unavailable: ${sourceErrors.join('; ')}. No authoritative snapshot is available yet.`)
      : null,
  };
  next.dataAgeMs = sourceDataAgeMs(next, now);
  return next;
}

function sendEvent(res, event, data) {
  res.write(`id: ${++sequence}\nevent: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

function broadcast(next) {
  for (const res of clients) {
    try { sendEvent(res, 'compound', next); } catch (_) { clients.delete(res); }
  }
}

function broadcastSignature(next) {
  return JSON.stringify({
    agents: next.agents.map(a => ({
      id: a.id, status: a.status, sessionState: a.sessionState, model: a.model,
      tokens: a.tokens, capacity: a.capacity, nearLimit: a.nearLimit, ageMin: a.ageMin, workReasons: a.workReasons,
      activeCounts: a.activeCounts, activeSince: a.activeSince,
      activeWorkItems: a.activeWorkItems.map(item => ({ kind: item.kind, status: item.status, title: item.title, startedAt: item.startedAt })),
    })),
    decisions: next.decisions.map(({ headline, owner, urgency, impact }) => ({ headline, owner, urgency, impact })),
    gatewayOk: next.gatewayOk, watchdogOk: next.watchdogOk, stale: next.stale, error: next.error,
  });
}

async function reconcile({ full = false, trigger = 'watch' } = {}) {
  if (reconcileRunning) {
    reconcileAgain = true;
    reconcileAgainFull = reconcileAgainFull || full;
    return false;
  }
  reconcileRunning = true;
  try {
    if (full || !commandCenterData) await refreshCommandCenter();
    const [registriesResult, tasksResult] = await Promise.allSettled([readRegistries(), readActiveWork()]);
    if (registriesResult.status === 'fulfilled') {
      lastRegistries = registriesResult.value;
      registriesSuccessAt = Date.now();
      registryError = null;
    } else {
      registryError = 'session registry unavailable';
      console.error('Registry refresh failed:', registriesResult.reason?.message || registriesResult.reason);
    }
    if (tasksResult.status === 'fulfilled') {
      lastActiveWork = tasksResult.value;
      tasksSuccessAt = Date.now();
      taskError = null;
    } else {
      taskError = 'active work source unavailable';
      console.error('Active work refresh failed:', tasksResult.reason?.message || tasksResult.reason);
    }
    lastError = [registryError, taskError, healthError].filter(Boolean).join('; ') || null;
    const next = buildPayload(lastRegistries || new Map(), lastActiveWork || [], trigger);
    const signature = broadcastSignature(next);
    payload = next;
    if (signature !== lastBroadcastSignature) {
      lastBroadcastSignature = signature;
      broadcast(payload);
    }
  } catch (err) {
    lastError = 'telemetry reconciliation failed';
    console.error('Reconcile failed:', err);
    if (payload) {
      const next = { ...payload, stale: true, error: 'Telemetry reconciliation failed. Showing last known values.' };
      const signature = broadcastSignature(next);
      payload = next;
      if (signature !== lastBroadcastSignature) { lastBroadcastSignature = signature; broadcast(payload); }
    }
  } finally {
    reconcileRunning = false;
    if (reconcileAgain) {
      const queuedFull = reconcileAgainFull;
      reconcileAgain = false;
      reconcileAgainFull = false;
      setImmediate(() => reconcile({ full: queuedFull, trigger: queuedFull ? 'coalesced-full' : 'coalesced' }));
    }
  }
  return true;
}

function scheduleReconcile(trigger) {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => reconcile({ full: false, trigger }), DEBOUNCE_MS);
}

function addWatch(target, trigger, filter) {
  try {
    const watcher = fs.watch(target, { persistent: false }, (_event, filename) => {
      if (!filter || filter(String(filename || ''))) scheduleReconcile(trigger);
    });
    watcher.on('error', err => console.warn(`Watch error (${target}):`, err.message));
    watchers.push(watcher);
  } catch (err) { console.warn(`Could not watch ${target}:`, err.message); }
}

function installWatches() {
  addWatch(AGENTS_DIR, 'session-registry-discovery');
  fsp.readdir(AGENTS_DIR, { withFileTypes: true }).then(dirs => {
    for (const dir of dirs.filter(d => d.isDirectory())) {
      const sessionDir = path.join(AGENTS_DIR, dir.name, 'sessions');
      addWatch(sessionDir, 'session-registry', name => name === 'sessions.json');
    }
  }).catch(err => console.warn('Agent watch discovery failed:', err.message));
  addWatch(STATE_DIR, 'task-state', name => ['openclaw.sqlite', 'openclaw.sqlite-wal', 'openclaw.sqlite-shm'].includes(name));
}

function publicSnapshot() {
  return payload
    ? { ...payload, dataAgeMs: sourceDataAgeMs(payload) }
    : { agents: [], decisions: [], stale: true, error: 'Initializing live telemetry.' };
}

// Backward-compatible route, now constrained to the same sanitized payload as /api/compound.
app.get('/api/agents', (_req, res) => {
  res.set('Cache-Control', 'no-store');
  res.json(publicSnapshot());
});
app.get('/api/compound', async (req, res) => {
  if (req.query.refresh === '1') {
    const now = Date.now();
    if (now - lastManualRefreshAt >= MANUAL_REFRESH_MS) {
      lastManualRefreshAt = now;
      const completed = await reconcile({ full: true, trigger: 'manual' });
      if (!completed) res.set('X-Refresh-Queued', '1');
    } else {
      res.set('X-Refresh-Throttled', '1');
    }
  }
  res.set('Cache-Control', 'no-store');
  res.json(publicSnapshot());
});
app.get('/api/events', (req, res) => {
  res.set({ 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache, no-transform', Connection: 'keep-alive', 'X-Accel-Buffering': 'no' });
  res.flushHeaders?.();
  res.write('retry: 2000\n\n');
  clients.add(res);
  if (payload) sendEvent(res, 'compound', { ...payload, dataAgeMs: sourceDataAgeMs(payload) });
  req.on('close', () => clients.delete(res));
});
app.get('/', (_req, res) => res.sendFile(path.join(PUBLIC_DIR, 'index.html')));

reconcile({ full: true, trigger: 'startup' });
installWatches();
setInterval(() => reconcile({ full: true, trigger: 'safety-poll' }), RECONCILE_MS).unref();
setInterval(() => {
  const heartbeat = {
    at: new Date().toISOString(),
    dataAgeMs: payload ? sourceDataAgeMs(payload) : null,
    sourceFreshness: payload?.sourceFreshness || null,
    stale: payload?.stale ?? true,
  };
  for (const res of clients) { try { sendEvent(res, 'heartbeat', heartbeat); } catch (_) { clients.delete(res); } }
}, HEARTBEAT_MS).unref();

app.listen(PORT, HOST, () => console.log(`Agent Compound running on http://${HOST}:${PORT}`));
