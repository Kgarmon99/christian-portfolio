import { useEffect, useRef, useState } from 'react'

export interface Bot {
  id: string
  key: string
  name: string
  status: 'running' | 'done' | 'idle' | string
  task: string
  model: string
  provider: string
  lastActivity: number
  ageMs: number
  tokens: number | null
  contextTokens: number | null
  kind: string
  channel?: string
  runtime: string
}

interface LiveBotsPayload {
  updatedAt: number
  bots: Bot[]
}

export function useLiveBots(pollMs = 3000) {
  const [bots, setBots] = useState<Bot[]>([])
  const [connected, setConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState<number | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    let mounted = true
    const tick = async () => {
      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller
      try {
        const apiUrl =
          typeof import.meta.env !== 'undefined' && import.meta.env.VITE_LIVE_BOTS_API_URL
            ? import.meta.env.VITE_LIVE_BOTS_API_URL
            : 'https://probability-shirts-berkeley-shelf.trycloudflare.com'
        const res = await fetch(`${apiUrl}/api/bots/live`, {
          signal: controller.signal,
          headers: { Accept: 'application/json' },
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data: LiveBotsPayload = await res.json()
        if (!mounted) return
        setBots(data.bots)
        setLastUpdate(data.updatedAt)
        setConnected(true)
        setError(null)
      } catch (e) {
        if (!mounted) return
        if ((e as Error).name === 'AbortError') return
        setConnected(false)
        setError((e as Error).message)
      }
    }

    tick()
    const interval = setInterval(tick, pollMs)
    return () => {
      mounted = false
      clearInterval(interval)
      abortRef.current?.abort()
    }
  }, [pollMs])

  return { bots, connected, error, lastUpdate }
}
