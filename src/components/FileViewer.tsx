import type { FileContentResponse } from '../types'

interface FileViewerProps {
  file: FileContentResponse | null
  rawMode: boolean
  onToggleMode: () => void
}

export function FileViewer({ file, rawMode, onToggleMode }: FileViewerProps) {
  if (!file) {
    return <div className="viewer-empty">Select a file to preview it.</div>
  }

  return (
    <section className="viewer-shell">
      <div className="viewer-toolbar">
        <div>
          <div className="viewer-path">{file.relativePath}</div>
          <div className="viewer-meta">{file.language} · {file.size} bytes</div>
        </div>
        <button className="secondary-button" onClick={onToggleMode}>
          {rawMode ? 'Rendered' : 'Raw source'}
        </button>
      </div>
      {rawMode || !file.markdown ? (
        <pre className="code-view"><code>{file.raw}</code></pre>
      ) : (
        <article className="markdown-view" dangerouslySetInnerHTML={{ __html: file.renderedHtml || '' }} />
      )}
    </section>
  )
}
