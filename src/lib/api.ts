import type { FileContentResponse, FileTreeNode, HistoryEntry, SkillRecord } from '../types'

const cache = new Map<string, unknown>()

function getApiBase() {
  if (typeof window === 'undefined') return ''

  const { protocol, hostname, port } = window.location

  if (port === '4173' || port === '5173' || port === '4174') {
    return ''
  }

  return `${protocol}//${hostname}:4174`
}

export function apiUrl(path: string) {
  return `${getApiBase()}${path}`
}

async function requestJson<T>(url: string, force = false): Promise<T> {
  const resolvedUrl = apiUrl(url)
  if (!force && cache.has(resolvedUrl)) {
    return cache.get(resolvedUrl) as T
  }
  const response = await fetch(resolvedUrl)
  if (!response.ok) {
    const text = await response.text()
    throw new Error(text || `Request failed: ${response.status}`)
  }
  const json = (await response.json()) as T
  cache.set(resolvedUrl, json)
  return json
}

export function invalidateApiCache(prefix?: string) {
  if (!prefix) {
    cache.clear()
    return
  }
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) cache.delete(key)
  }
}

export function fetchSkills(force = false) {
  return requestJson<{ skills: SkillRecord[] }>('/api/skills', force)
}

export function fetchSkill(skillId: string, force = false) {
  return requestJson<{ skill: SkillRecord; tree: FileTreeNode[]; defaultFile: string }>(`/api/skills/${encodeURIComponent(skillId)}`, force)
}

export function fetchFile(skillId: string, relativePath: string, force = false) {
  return requestJson<FileContentResponse>(`/api/skills/${encodeURIComponent(skillId)}/file?path=${encodeURIComponent(relativePath)}`, force)
}

export function fetchHistory(skillId: string, relativePath: string, force = false) {
  return requestJson<{ history: HistoryEntry[] }>(`/api/skills/${encodeURIComponent(skillId)}/history?path=${encodeURIComponent(relativePath)}`, force)
}

export function fetchDiff(skillId: string, relativePath: string, fromRef: string, toRef = 'HEAD') {
  return requestJson<{ diff: string }>(`/api/skills/${encodeURIComponent(skillId)}/diff?path=${encodeURIComponent(relativePath)}&from=${encodeURIComponent(fromRef)}&to=${encodeURIComponent(toRef)}`, true)
}
