import { NavLink } from 'react-router-dom'

export function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="brand-block">
        <div className="brand-mark">OC</div>
        <div>
          <div className="brand-title">OpenClaw</div>
          <div className="brand-subtitle">Skill Viewer</div>
        </div>
      </div>
      <nav className="nav-stack">
        <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? 'is-active' : ''}`}>
          Library
        </NavLink>
      </nav>
      <div className="sidebar-footer">
        <div className="status-card">
          <div className="status-label">Local runtime</div>
          <div className="status-value">Live filesystem mode</div>
        </div>
      </div>
    </aside>
  )
}
