import { useCallback, useState } from 'react'

export interface ControlState {
  loading: boolean
  error: string | null
  lastAction: string | null
}

export function useBotControls(botId: string) {
  const [state, setState] = useState<ControlState>({
    loading: false,
    error: null,
    lastAction: null,
  })

  const call = useCallback(
    async (action: 'pause' | 'resume' | 'kill' | 'task', task?: string) => {
      setState((s) => ({ ...s, loading: true, error: null }))
      try {
        const apiBase =
          typeof import.meta.env !== 'undefined' && import.meta.env.VITE_LIVE_BOTS_API_URL
            ? import.meta.env.VITE_LIVE_BOTS_API_URL.replace(/\/$/, '')
            : ''
        const res = await fetch(`${apiBase}/api/bots/${botId}/${action}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: action === 'task' ? JSON.stringify({ task }) : undefined,
        })
        const data = await res.json()
        if (!res.ok || !data.ok) {
          throw new Error(data.error || `HTTP ${res.status}`)
        }
        setState({
          loading: false,
          error: null,
          lastAction: `${action}${task ? `: ${task.slice(0, 40)}${task.length > 40 ? '…' : ''}` : ''}`,
        })
        return data
      } catch (e) {
        setState({
          loading: false,
          error: (e as Error).message,
          lastAction: null,
        })
        throw e
      }
    },
    [botId]
  )

  const reset = useCallback(() => {
    setState({ loading: false, error: null, lastAction: null })
  }, [])

  return { ...state, call, reset }
}
