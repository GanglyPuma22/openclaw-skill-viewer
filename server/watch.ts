import chokidar from 'chokidar'
import { SKILL_ROOTS } from './config.js'

const clients = new Set<import('express').Response>()
let watcherStarted = false

export function registerEventsClient(res: import('express').Response) {
  clients.add(res)
  res.on('close', () => {
    clients.delete(res)
  })
}

export function startWatcher() {
  if (watcherStarted) return
  watcherStarted = true
  const watcher = chokidar.watch(SKILL_ROOTS.map((root) => root.dir), {
    ignoreInitial: true,
    depth: 5,
  })
  const notify = (event: string) => {
    const payload = `data: ${JSON.stringify({ event, at: new Date().toISOString() })}\n\n`
    for (const client of clients) {
      client.write(payload)
    }
  }
  watcher.on('all', notify)
}
