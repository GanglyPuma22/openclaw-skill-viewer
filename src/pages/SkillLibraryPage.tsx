import { useCallback, useEffect, useMemo, useState } from 'react'
import { SkillTable } from '../components/SkillTable'
import { Topbar } from '../components/Topbar'
import { useLiveUpdates } from '../hooks/useLiveUpdates'
import { fetchSkills, invalidateApiCache } from '../lib/api'
import type { SkillRecord } from '../types'

export function SkillLibraryPage() {
  const [skills, setSkills] = useState<SkillRecord[]>([])
  const [query, setQuery] = useState('')
  const [readyOnly, setReadyOnly] = useState(true)

  const loadSkills = useCallback(async (force = false) => {
    const result = await fetchSkills(force)
    const sorted = [...result.skills].sort((a, b) => new Date(b.modifiedAt).getTime() - new Date(a.modifiedAt).getTime())
    setSkills(sorted)
  }, [])

  useEffect(() => {
    void loadSkills()
  }, [loadSkills])

  useLiveUpdates(() => {
    invalidateApiCache('/api/skills')
    void loadSkills(true)
  })

  const filtered = useMemo(() => {
    return skills.filter((skill) => {
      const matchesQuery = query.trim().length === 0 || `${skill.name} ${skill.description}`.toLowerCase().includes(query.toLowerCase())
      const matchesReady = readyOnly ? skill.ready : true
      return matchesQuery && matchesReady
    })
  }, [query, readyOnly, skills])

  return (
    <div className="page-shell">
      <Topbar title="Skill Library" subtitle="Live OpenClaw skill discovery with gateway-backed readiness, sorted by most recently updated" />
      <section className="panel filters-panel">
        <input
          className="search-input"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search skills by name or description"
        />
        <div className="toggle-row">
          <label><input type="checkbox" checked={readyOnly} onChange={(event) => setReadyOnly(event.target.checked)} /> Ready only</label>
        </div>
      </section>
      <section className="panel">
        <SkillTable skills={filtered} />
      </section>
    </div>
  )
}
