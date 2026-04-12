import { useEffect } from 'react'
import { apiUrl } from '../lib/api'

type LiveUpdatePayload = {
  event?: string
  at?: string
}

export function useLiveUpdates(onMessage: (payload: LiveUpdatePayload) => void) {
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.EventSource === 'undefined') {
      return
    }

    const source = new EventSource(apiUrl('/api/events'))
    source.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data) as LiveUpdatePayload
        if (payload.event === 'connected') {
          return
        }
        onMessage(payload)
      } catch {
        // Ignore malformed event payloads.
      }
    }
    source.onerror = () => {
      // Non-fatal: live updates are optional.
    }
    return () => {
      source.close()
    }
  }, [onMessage])
}
