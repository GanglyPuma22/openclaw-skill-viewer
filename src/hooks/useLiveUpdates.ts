import { useEffect } from 'react'

export function useLiveUpdates(onMessage: () => void) {
  useEffect(() => {
    const source = new EventSource('/api/events')
    source.onmessage = () => {
      onMessage()
    }
    return () => {
      source.close()
    }
  }, [onMessage])
}
