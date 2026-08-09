import http from 'node:http'
import { execSync } from 'node:child_process'
import { readFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PORT = process.env.PORT ?? 3001

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.ts': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
}

function deriveName(entry) {
  if (entry.label) return entry.label
  if (entry.key) {
    const parts = entry.key.split(':')
    const tail = parts[parts.length - 1] ?? entry.key
    if (tail.startsWith('subagent:')) return tail.slice('subagent:'.length)
    return tail
  }
  return entry.sessionId ?? 'unknown'
}

function deriveChannel(entry) {
  if (entry.channel) return entry.channel
  const key = entry.key ?? ''
  if (key.includes(':telegram:')) return 'telegram'
  if (key.includes(':bluebubbles:')) return 'bluebubbles'
  if (key.includes(':imessage:')) return 'imessage'
  if (key.includes(':cron:')) return 'cron'
  if (entry.runtimePolicySessionKey?.includes(':telegram:')) return 'telegram'
  if (entry.spawnedBy?.includes(':telegram:')) return 'telegram'
  return undefined
}

function deriveRuntime(entry) {
  return entry.agentRuntime?.id ?? 'auto'
}

function mapSession(entry) {
  const now = Date.now()
  const ageMs = entry.ageMs ?? (entry.updatedAt ? now - entry.updatedAt : 0)
  const lastActivity = entry.lastInteractionAt ?? entry.updatedAt ?? now
  return {
    id: entry.sessionId ?? entry.key ?? `${now}-${Math.random()}`,
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
  }
}

function sendJson(res, status, data) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  })
  res.end(JSON.stringify(data))
}

function serveStatic(req, res) {
  let url = new URL(req.url, `http://${req.headers.host}`).pathname
  if (url === '/') url = '/index.html'
  const filePath = join(__dirname, 'dist', url)
  if (!existsSync(filePath) || !filePath.startsWith(join(__dirname, 'dist'))) {
    res.writeHead(404, { 'Content-Type': 'text/plain' })
    res.end('Not found')
    return
  }
  const ext = filePath.slice(filePath.lastIndexOf('.'))
  const content = readFileSync(filePath)
  res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] ?? 'application/octet-stream' })
  res.end(content)
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`).pathname

  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    })
    res.end()
    return
  }

  if (url === '/api/bots/live') {
    try {
      const raw = execSync('openclaw sessions list --json --active 1440 --limit 200', {
        encoding: 'utf-8',
        timeout: 10_000,
        env: { ...process.env, FORCE_COLOR: '0', NO_COLOR: '1' },
      })
      const parsed = JSON.parse(raw)
      const sessions = Array.isArray(parsed.sessions) ? parsed.sessions : []
      const bots = sessions.map(mapSession)
      sendJson(res, 200, { updatedAt: Date.now(), bots })
    } catch (err) {
      sendJson(res, 500, { error: 'Failed to read session state', details: err.message })
    }
    return
  }

  serveStatic(req, res)
})

server.listen(PORT, () => {
  console.log(`Agent Command Center server listening on http://127.0.0.1:${PORT}`)
})
