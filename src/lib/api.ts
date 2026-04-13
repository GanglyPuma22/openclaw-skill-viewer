import type { FileContentResponse, FileTreeNode, SkillRecord } from '../types'

const cache = new Map<string, unknown>()

export function apiUrl(path: string) {
  return path
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
  const forceQuery = force ? '?force=1' : ''
  return requestJson<{ skills: SkillRecord[] }>(`/api/skills${forceQuery}`, force)
}

export function fetchSkill(skillId: string, force = false) {
  const forceQuery = force ? '?force=1' : ''
  return requestJson<{ skill: SkillRecord; tree: FileTreeNode[]; defaultFile: string }>(`/api/skills/${encodeURIComponent(skillId)}${forceQuery}`, force)
}

export function fetchFile(skillId: string, relativePath: string, force = false) {
  return requestJson<FileContentResponse>(`/api/skills/${encodeURIComponent(skillId)}/file?path=${encodeURIComponent(relativePath)}`, force)
}
