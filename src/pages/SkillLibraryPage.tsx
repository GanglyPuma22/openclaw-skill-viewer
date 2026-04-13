import { useCallback, useEffect, useMemo, useState } from 'react'
import { SkillTable } from '../components/SkillTable'
import { Topbar } from '../components/Topbar'
import { useLiveUpdates } from '../hooks/useLiveUpdates'
import { fetchSkills, invalidateApiCache } from '../lib/api'
import type { SkillRecord } from '../types'

type ReadinessFilter = 'all' | 'ready' | 'not-ready'

export function SkillLibraryPage() {
  const [skills, setSkills] = useState<SkillRecord[]>([])
  const [query, setQuery] = useState('')
  const [readinessFilter, setReadinessFilter] = useState<ReadinessFilter>('ready')
  const [error, setError] = useState('')

  const loadSkills = useCallback(async (force = false) => {
    try {
      setError('')
      const result = await fetchSkills(force)
      const sorted = [...result.skills].sort((a, b) => new Date(b.modifiedAt).getTime() - new Date(a.modifiedAt).getTime())
      setSkills(sorted)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load skills'
      setError(message)
      setSkills([])
    }
  }, [])

  useEffect(() => {
    void loadSkills()
  }, [loadSkills])

  const handleLiveUpdate = useCallback(() => {
    invalidateApiCache('/api/skills')
    void loadSkills(true)
  }, [loadSkills])

  useLiveUpdates(handleLiveUpdate)

  const filtered = useMemo(() => {
    return skills.filter((skill) => {
      const matchesQuery = query.trim().length === 0 || `${skill.name} ${skill.description}`.toLowerCase().includes(query.toLowerCase())
      const matchesReadiness = readinessFilter === 'ready'
        ? skill.ready
        : readinessFilter === 'not-ready'
          ? !skill.ready
          : true
      return matchesQuery && matchesReadiness
    })
  }, [query, readinessFilter, skills])

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
        <fieldset className="toggle-row" aria-label="Readiness filter">
          <legend className="sr-only">Readiness filter</legend>
          <label>
            <input
              type="radio"
              name="readiness-filter"
              checked={readinessFilter === 'ready'}
              onChange={() => setReadinessFilter('ready')}
            />
            Ready only
          </label>
          <label>
            <input
              type="radio"
              name="readiness-filter"
              checked={readinessFilter === 'not-ready'}
              onChange={() => setReadinessFilter('not-ready')}
            />
            Not ready only
          </label>
          <label>
            <input
              type="radio"
              name="readiness-filter"
              checked={readinessFilter === 'all'}
              onChange={() => setReadinessFilter('all')}
            />
            All skills
          </label>
        </fieldset>
      </section>
      <section className="panel">
        {error ? <div className="viewer-empty">Failed to load skills: {error}</div> : <SkillTable skills={filtered} />}
      </section>
    </div>
  )
}
