# KG Builds Agent Floor — Runbook

## What this is
`kgbuilds.co/agents` shows live status of the MoneyBot agent fleet. The Agent Floor is a static Vercel site that reads from a Vercel Edge Config store. The Edge Config store is updated every 10 seconds by a sync script running on the Mac.

## Architecture
```
Mac (agent-compound on :7331)
  └─ reads OpenClaw agent sessions + SQLite task_runs/flow_runs
  └─ exposes /api/compound

Mac sync script (LaunchAgent)
  └─ every 10s: GET http://127.0.0.1:7331/api/compound
  └─ PATCH to Vercel Edge Config store

Vercel (kgbuilds.co)
  └─ /api/compound reads Edge Config and returns JSON
  └─ /agents renders the Agent Floor UI
  └─ /agents/debug shows raw telemetry side-by-side
  └─ /api/health returns health checks
```

## Status meanings
- `working` — agent has open cron sessions, running sessions, active tasks, or unfinished goals
- `ready` — agent has recent telemetry but no active work right now
- `recent` — agent had a completed session recently but nothing since
- `offline` — no telemetry for > 24 hours

## Common issues and fixes

### All agents show `ready` even though work is running
1. Check local source: `curl http://127.0.0.1:7331/api/compound?refresh=1`
2. If local also shows `ready`, the issue is in `agent-compound/server.js` session/task detection.
3. If local shows `working` but Edge Config doesn't, the sync script failed. Check `/tmp/agent-compound-edge-config-sync.log`.
4. If Edge Config has correct data but `/agents` doesn't, the Vercel function may be cached; redeploy with `npx vercel --prod --yes --force`.

### Telemetry is stale
- Check sync log: `tail -f /tmp/agent-compound-edge-config-sync.log`
- Check if `agent-compound` is running: `lsof -i :7331`
- Restart if needed:
  ```bash
  launchctl unload ~/Library/LaunchAgents/com.moneybot.agent-compound.plist
  launchctl load -w ~/Library/LaunchAgents/com.moneybot.agent-compound.plist
  ```

### Site is down
- Check Vercel status at `https://kgbuilds.co/api/health`
- Force redeploy from `/Users/kahlilgarmon/.openclaw/workspace/agent-command-center`:
  ```bash
  npx vercel --prod --yes --force
  ```

## Useful URLs
- https://kgbuilds.co
- https://kgbuilds.co/agents
- https://kgbuilds.co/agents/debug
- https://kgbuilds.co/api/compound
- https://kgbuilds.co/api/health

## LaunchAgents
- `com.moneybot.agent-compound` — local server on :7331
- `com.moneybot.agent-compound-edge-config-sync` — pushes to Edge Config
- `com.moneybot.agent-compound-health-alert` — checks health every 2 min and alerts on Telegram

## Key files
- `/Users/kahlilgarmon/.openclaw/workspace/agent-compound/server.js`
- `/Users/kahlilgarmon/.openclaw/workspace/agent-command-center/api/compound.js`
- `/Users/kahlilgarmon/.openclaw/workspace/agent-command-center/api/health.js`
- `/Users/kahlilgarmon/.openclaw/workspace/agent-command-center/public/agents/debug.html`
- `/Users/kahlilgarmon/MoneyBotClaw-1/scripts/agent-compound-edge-config-sync.sh`
- `/Users/kahlilgarmon/MoneyBotClaw-1/scripts/agent-compound-health-alert.sh`

## Logs
- `/tmp/agent-compound-edge-config-sync.log`
- `/tmp/agent-compound-health-alert.log`
- `/Users/kahlilgarmon/.openclaw/workspace/agent-compound/server.log`
