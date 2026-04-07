interface TopbarProps {
  title: string
  subtitle?: string
}

export function Topbar({ title, subtitle }: TopbarProps) {
  return (
    <header className="topbar">
      <div>
        <div className="topbar-title">{title}</div>
        {subtitle ? <div className="topbar-subtitle">{subtitle}</div> : null}
      </div>
      <div className="topbar-actions">
        <div className="pill">Local app</div>
      </div>
    </header>
  )
}
