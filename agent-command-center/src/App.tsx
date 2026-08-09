import { useLiveBots } from './useLiveBots'
import './App.css'

function formatAge(ms: number): string {
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  if (hours > 0) return `${hours}h ${minutes % 60}m ago`
  if (minutes > 0) return `${minutes}m ${seconds % 60}s ago`
  return `${seconds}s ago`
}

function formatTokens(n: number | null): string {
  if (n === null || n === undefined) return '—'
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`
  return `${n}`
}

function statusColor(status: string): string {
  switch (status) {
    case 'running':
      return '#22c55e'
    case 'done':
      return '#3b82f6'
    default:
      return '#9ca3af'
  }
}

function App() {
  const { bots, connected, error, lastUpdate } = useLiveBots(3000)
  const activeCount = bots.filter((b) => b.status === 'running').length

  return (
    <>
      <section id="center">
        <div className="status-bar">
          <span
            className="connection-dot"
            style={{ backgroundColor: connected ? '#22c55e' : '#ef4444' }}
          />
          <span className="connection-text">
            {connected ? 'Live' : 'Disconnected'}
          </span>
          {lastUpdate && (
            <span className="last-update">
              updated {formatAge(Date.now() - lastUpdate)}
            </span>
          )}
          {error && <span className="error-badge">{error}</span>}
        </div>

        <h1>MoneyBot Towers</h1>
        <p className="subtitle">
          {activeCount} active / {bots.length} total bot
          {bots.length === 1 ? '' : 's'}
        </p>
      </section>

      <section id="bot-grid">
        {bots.length === 0 && (
          <div className="empty-state">No bots currently visible.</div>
        )}
        {bots.map((bot) => (
          <div key={bot.id} className="bot-card">
            <div className="bot-header">
              <div
                className="status-pulse"
                style={{ backgroundColor: statusColor(bot.status) }}
              />
              <div className="bot-title">
                <h3>{bot.name}</h3>
                <span className="bot-kind">{bot.kind}</span>
              </div>
            </div>
            <div className="bot-task" title={bot.task}>
              {bot.task}
            </div>
            <div className="bot-meta">
              <div>
                <span className="label">status</span>
                <span className="value" style={{ color: statusColor(bot.status) }}>
                  {bot.status}
                </span>
              </div>
              <div>
                <span className="label">model</span>
                <span className="value">{bot.model}</span>
              </div>
              <div>
                <span className="label">runtime</span>
                <span className="value">{bot.runtime}</span>
              </div>
              <div>
                <span className="label">last activity</span>
                <span className="value">{formatAge(bot.ageMs)}</span>
              </div>
              <div>
                <span className="label">tokens</span>
                <span className="value">
                  {formatTokens(bot.tokens)} / {formatTokens(bot.contextTokens)}
                </span>
              </div>
              {bot.channel && (
                <div>
                  <span className="label">channel</span>
                  <span className="value">{bot.channel}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </section>

      <section id="spacer" />
    </>
  )
}

export default App
