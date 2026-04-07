import { useMemo, useState } from 'react'
import type { HistoryEntry } from '../../types'

interface HistoryPanelProps {
  history: HistoryEntry[]
  diff: string
  onSelectDiff: (fromRef: string) => void
}

export function HistoryPanel({ history, diff, onSelectDiff }: HistoryPanelProps) {
  const [selected, setSelected] = useState<string>('')
  const items = useMemo(() => history.slice(0, 20), [history])

  return (
    <section className="history-shell">
      <div className="history-header">
        <div className="panel-title">History & diff</div>
      </div>
      <div className="history-layout">
        <div className="history-list">
          {items.length > 0 ? items.map((entry) => (
            <button
              key={entry.hash}
              className={`history-item ${selected === entry.hash ? 'selected' : ''}`}
              onClick={() => {
                setSelected(entry.hash)
                onSelectDiff(entry.hash)
              }}
            >
              <div className="history-subject">{entry.subject}</div>
              <div className="history-meta">{entry.shortHash} · {entry.authorName} · {new Date(entry.date).toLocaleString()}</div>
            </button>
          )) : <div className="history-empty">No git history found for this file yet.</div>}
        </div>
        <pre className="diff-view"><code>{diff || (items.length > 0 ? 'Click a commit on the left to compare it against HEAD.' : 'History unavailable for this file.')}</code></pre>
      </div>
    </section>
  )
}
