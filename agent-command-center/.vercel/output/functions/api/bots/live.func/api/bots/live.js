import { execSync } from 'node:child_process';
function hasOpenclaw() {
    try {
        execSync('command -v openclaw', { encoding: 'utf-8', timeout: 5_000 });
        return true;
    }
    catch {
        return false;
    }
}
function deriveName(entry) {
    if (entry.label)
        return entry.label;
    if (entry.key) {
        const parts = entry.key.split(':');
        const tail = parts[parts.length - 1] ?? entry.key;
        if (tail.startsWith('subagent:')) {
            return tail.slice('subagent:'.length);
        }
        return tail;
    }
    return entry.sessionId ?? 'unknown';
}
function deriveChannel(entry) {
    if (entry.channel)
        return entry.channel;
    const key = entry.key ?? '';
    if (key.includes(':telegram:'))
        return 'telegram';
    if (key.includes(':bluebubbles:'))
        return 'bluebubbles';
    if (key.includes(':imessage:'))
        return 'imessage';
    if (key.includes(':cron:'))
        return 'cron';
    if (entry.runtimePolicySessionKey?.includes(':telegram:'))
        return 'telegram';
    if (entry.spawnedBy?.includes(':telegram:'))
        return 'telegram';
    return undefined;
}
function deriveRuntime(entry) {
    return entry.agentRuntime?.id ?? 'auto';
}
function mapSession(entry) {
    const now = Date.now();
    const ageMs = entry.ageMs ?? (entry.updatedAt ? now - entry.updatedAt : 0);
    const lastActivity = entry.lastInteractionAt ?? entry.updatedAt ?? now;
    return {
        id: entry.sessionId ?? entry.key ?? crypto.randomUUID(),
        key: entry.key ?? entry.sessionId ?? '',
        name: deriveName(entry),
        status: entry.status ?? 'idle',
        task: entry.label ?? '—',
        model: entry.model ?? 'unknown',
        provider: entry.modelProvider ?? 'unknown',
        lastActivity,
        ageMs,
        tokens: typeof entry.totalTokens === 'number' ? entry.totalTokens : null,
        contextTokens: typeof entry.contextTokens === 'number' ? entry.contextTokens : null,
        kind: entry.kind ?? 'unknown',
        channel: deriveChannel(entry),
        runtime: deriveRuntime(entry),
    };
}
export default function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') {
        res.status(204).end();
        return;
    }
    try {
        if (!hasOpenclaw()) {
            res.status(200).json({
                updatedAt: Date.now(),
                bots: [],
                warning: 'openclaw CLI is not available in this serverless environment. Live bot data requires a host with openclaw installed.',
            });
            return;
        }
        const raw = execSync('openclaw sessions list --json --active 1440 --limit 200', {
            encoding: 'utf-8',
            timeout: 10_000,
            env: { ...process.env, FORCE_COLOR: '0', NO_COLOR: '1' },
        });
        const parsed = JSON.parse(raw);
        const sessions = Array.isArray(parsed.sessions)
            ? parsed.sessions
            : [];
        const bots = sessions.map(mapSession);
        res.status(200).json({ updatedAt: Date.now(), bots });
    }
    catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        res.status(500).json({ error: 'Failed to read session state', details: message });
    }
}
//# sourceMappingURL=live.js.map