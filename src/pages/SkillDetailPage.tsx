import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { FileTree } from '../components/FileTree'
import { FileViewer } from '../components/FileViewer'
import { Topbar } from '../components/Topbar'
import { useLiveUpdates } from '../hooks/useLiveUpdates'
import { fetchFile, fetchSkill, invalidateApiCache } from '../lib/api'
import { formatBytes, formatDate } from '../lib/format'
import type { FileContentResponse, FileTreeNode, SkillRecord } from '../types'

export function SkillDetailPage() {
  const { skillId = '' } = useParams()
  const [skill, setSkill] = useState<SkillRecord | null>(null)
  const [tree, setTree] = useState<FileTreeNode[]>([])
  const [selectedPath, setSelectedPath] = useState('SKILL.md')
  const [file, setFile] = useState<FileContentResponse | null>(null)
  const [rawMode, setRawMode] = useState(false)
  const selectedPathRef = useRef(selectedPath)
  const fileRequestIdRef = useRef(0)

  useEffect(() => {
    selectedPathRef.current = selectedPath
  }, [selectedPath])

  const loadSkill = useCallback(async (force = false) => {
    const result = await fetchSkill(skillId, force)
    setSkill(result.skill)
    setTree(result.tree)
    setSelectedPath((current) => current || result.defaultFile)
  }, [skillId])

  const loadFile = useCallback(async (path: string, force = false) => {
    const requestId = ++fileRequestIdRef.current
    const fileResult = await fetchFile(skillId, path, force)
    if (requestId !== fileRequestIdRef.current || selectedPathRef.current !== path) {
      return
    }
    setFile(fileResult)
  }, [skillId])

  useEffect(() => {
    void loadSkill()
  }, [loadSkill])

  useEffect(() => {
    if (!selectedPath) return
    void loadFile(selectedPath)
  }, [loadFile, selectedPath])

  const handleLiveUpdate = useCallback(() => {
    const currentPath = selectedPathRef.current
    invalidateApiCache(`/api/skills/${encodeURIComponent(skillId)}`)
    void loadSkill(true)
    if (currentPath) {
      void loadFile(currentPath, true)
    }
  }, [loadFile, loadSkill, skillId])

  useLiveUpdates(handleLiveUpdate)

  const statusText = useMemo(() => {
    if (!skill) return ''
    return skill.ready ? 'Ready' : 'Needs setup'
  }, [skill])

  return (
    <div className="page-shell">
      <Topbar title={skill?.name || 'Skill detail'} subtitle={skill?.description || 'Loading skill metadata…'} />
      {skill ? (
        <>
          <section className="panel stat-grid">
            <div className="stat-card"><div className="stat-label">Status</div><div className="stat-value">{statusText}</div></div>
            <div className="stat-card"><div className="stat-label">Category</div><div className="stat-value">{skill.categoryLabel}</div></div>
            <div className="stat-card"><div className="stat-label">Files</div><div className="stat-value">{skill.fileCount}</div></div>
            <div className="stat-card"><div className="stat-label">Folder size</div><div className="stat-value">{formatBytes(skill.folderSize)}</div></div>
            <div className="stat-card"><div className="stat-label">Updated</div><div className="stat-value">{formatDate(skill.modifiedAt)}</div></div>
          </section>
          <section className="detail-layout">
            <div className="panel tree-panel">
              <div className="panel-title">Repository structure</div>
              <FileTree nodes={tree} selectedPath={selectedPath} onSelect={setSelectedPath} />
            </div>
            <div className="detail-main">
              <FileViewer file={file} rawMode={rawMode} onToggleMode={() => setRawMode((value) => !value)} />
            </div>
          </section>
        </>
      ) : null}
    </div>
  )
}
