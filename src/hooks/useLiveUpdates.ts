import { useEffect } from 'react'
import { apiUrl } from '../lib/api'

export function useLiveUpdates(onMessage: () => void) {
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.EventSource === 'undefined') {
      return
    }

    const source = new EventSource(apiUrl('/api/events'))
    source.onmessage = () => {
      onMessage()
    }
    source.onerror = () => {
      // Non-fatal: live updates are optional.
    }
    return () => {
      source.close()
    }
  }, [onMessage])
}
