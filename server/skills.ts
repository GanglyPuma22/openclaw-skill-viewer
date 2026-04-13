import fs from 'node:fs/promises'
import path from 'node:path'
import matter from 'gray-matter'
import { IGNORED_NAMES, SKILL_ROOTS } from './config.js'
import { categoryFromSource, makeSkillId, resolveSkillDir, safeRelative } from './paths.js'
import { execJson } from './process-utils.js'
import type { FileTreeNode, SkillRecord, SkillStatusInfo } from './types.js'

type SkillStatusListEntry = SkillStatusInfo & {
  name: string
  description?: string
  filePath?: string
  baseDir?: string
  source?: string
}

let cachedStatuses: SkillStatusListEntry[] | null = null
let cachedAt = 0
let refreshPromise: Promise<SkillStatusListEntry[]> | null = null
let cachedFsEntries: SkillFsEntry[] | null = null
let cachedNameCounts: Map<string, number> | null = null
let fsEntriesPromise: Promise<SkillFsEntry[]> | null = null

const STATUS_TTL_MS = 5 * 60 * 1000

export function invalidateSkillStatusCache() {
  cachedStatuses = null
  cachedAt = 0
  cachedFsEntries = null
  cachedNameCounts = null
}

async function refreshSkillStatuses(): Promise<SkillStatusListEntry[]> {
  const json = await execJson('openclaw', ['skills', 'list', '--json'])
  const skills = Array.isArray(json.skills) ? json.skills : []
  cachedStatuses = skills
  cachedAt = Date.now()
  return skills
}

function refreshSkillStatusesInBackground() {
  if (!refreshPromise) {
    refreshPromise = refreshSkillStatuses()
      .catch(() => cachedStatuses ?? [])
      .finally(() => {
        refreshPromise = null
      })
  }
  return refreshPromise
}

async function loadSkillStatuses(force = false): Promise<SkillStatusListEntry[]> {
  if (force) {
    if (refreshPromise) {
      return refreshPromise
    }
    return refreshSkillStatusesInBackground()
  }

  const now = Date.now()
  if (cachedStatuses && now - cachedAt < STATUS_TTL_MS) {
    return cachedStatuses
  }

  if (cachedStatuses) {
    void refreshSkillStatusesInBackground()
    return cachedStatuses
  }

  if (refreshPromise) {
    return refreshPromise
  }

  return refreshSkillStatusesInBackground()
}

type SkillFsEntry = {
  root: (typeof SKILL_ROOTS)[number]
  name: string
  baseDir: string
}

async function listDirectories(dir: string): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true })
  return entries.filter((entry) => entry.isDirectory() && !IGNORED_NAMES.has(entry.name)).map((entry) => entry.name)
}

async function refreshSkillFsEntries(): Promise<SkillFsEntry[]> {
  const entries: SkillFsEntry[] = []
  for (const root of SKILL_ROOTS) {
    const names = await listDirectories(root.dir).catch(() => [])
    for (const name of names) {
      entries.push({
        root,
        name,
        baseDir: path.join(root.dir, name),
      })
    }
  }
  cachedFsEntries = entries
  cachedNameCounts = new Map<string, number>()
  for (const entry of entries) {
    cachedNameCounts.set(entry.name, (cachedNameCounts.get(entry.name) ?? 0) + 1)
  }
  return entries
}

async function loadSkillFsEntries(force = false): Promise<SkillFsEntry[]> {
  if (force) {
    cachedFsEntries = null
    cachedNameCounts = null
  }

  if (cachedFsEntries) return cachedFsEntries
  if (fsEntriesPromise) return fsEntriesPromise

  fsEntriesPromise = refreshSkillFsEntries().finally(() => {
    fsEntriesPromise = null
  })
  return fsEntriesPromise
}

function getCachedNameCount(name: string): number {
  return cachedNameCounts?.get(name) ?? 0
}

function canonicalFallbackStatus(
  baseDir: string,
  rootCategory: (typeof SKILL_ROOTS)[number]['category'],
  fallbackStatuses: SkillStatusListEntry[],
  nameCount: number,
): SkillStatusListEntry | undefined {
  if (fallbackStatuses.length !== 1) return undefined
  if (nameCount <= 1) return fallbackStatuses[0]

  const [fallback] = fallbackStatuses
  if (fallback.baseDir) {
    return path.resolve(fallback.baseDir) === path.resolve(baseDir) ? fallback : undefined
  }

  const fallbackSource = typeof fallback.source === 'string' ? fallback.source.trim() : ''
  if (!fallbackSource) {
    const canonicalRootCategory = SKILL_ROOTS[0]?.category
    return canonicalRootCategory === rootCategory ? fallback : undefined
  }

  const fallbackCategory = categoryFromSource(fallbackSource)
  return fallbackCategory === rootCategory ? fallback : undefined
}

async function statDirectoryRecursive(dir: string): Promise<{ fileCount: number; folderSize: number; modifiedAt: number }> {
  let fileCount = 0
  let folderSize = 0
  let modifiedAt = 0
  const entries = await fs.readdir(dir, { withFileTypes: true })
  for (const entry of entries) {
    if (IGNORED_NAMES.has(entry.name)) continue
    const fullPath = path.join(dir, entry.name)
    const stats = await fs.stat(fullPath)
    modifiedAt = Math.max(modifiedAt, stats.mtimeMs)
    if (entry.isDirectory()) {
      const nested = await statDirectoryRecursive(fullPath)
      fileCount += nested.fileCount
      folderSize += nested.folderSize
      modifiedAt = Math.max(modifiedAt, nested.modifiedAt)
    } else {
      fileCount += 1
      folderSize += stats.size
    }
  }
  return { fileCount, folderSize, modifiedAt }
}

const gitTrackedCache = new Map<string, boolean>()

async function pathExists(target: string): Promise<boolean> {
  try {
    await fs.access(target)
    return true
  } catch {
    return false
  }
}

async function detectGitTracked(dir: string): Promise<boolean> {
  const resolved = path.resolve(dir)
  if (gitTrackedCache.has(resolved)) return gitTrackedCache.get(resolved) ?? false

  let current = resolved
  while (true) {
    if (gitTrackedCache.has(current)) {
      const cached = gitTrackedCache.get(current) ?? false
      gitTrackedCache.set(resolved, cached)
      return cached
    }

    const hasGit = await pathExists(path.join(current, '.git'))
    if (hasGit) {
      gitTrackedCache.set(current, true)
      gitTrackedCache.set(resolved, true)
      return true
    }

    const parent = path.dirname(current)
    if (parent === current) break
    current = parent
  }

  gitTrackedCache.set(resolved, false)
  return false
}

export async function getSkills(force = false): Promise<SkillRecord[]> {
  const statuses = await loadSkillStatuses(force)
  const byPath = new Map<string, SkillStatusListEntry>()
  const byName = new Map<string, SkillStatusListEntry[]>()
  for (const status of statuses) {
    if (status.baseDir) byPath.set(path.resolve(status.baseDir), status)
    const existing = byName.get(status.name) ?? []
    existing.push(status)
    byName.set(status.name, existing)
  }

  const fsEntries = await loadSkillFsEntries(force)

  const skills: SkillRecord[] = []
  for (const entry of fsEntries) {
    const { root, name, baseDir } = entry
    const stats = await statDirectoryRecursive(baseDir)
    const skillMdPath = path.join(baseDir, 'SKILL.md')
    let description = ''
    try {
      const parsed = matter(await fs.readFile(skillMdPath, 'utf8'))
      description = String(parsed.data.description ?? '').trim()
    } catch {
      // ignore
    }
    const fallbackStatuses = byName.get(name) ?? []
    const nameCount = getCachedNameCount(name)
    const status = byPath.get(path.resolve(baseDir)) ?? canonicalFallbackStatus(baseDir, root.category, fallbackStatuses, nameCount)
    if (!status && nameCount > 1 && fallbackStatuses.length === 1) {
      continue
    }
    const category = status?.source ? categoryFromSource(status.source) : root.category
    skills.push({
      id: makeSkillId(category, name),
      name,
      category,
      categoryLabel: root.label,
      source: status?.source ?? root.category,
      pathToken: safeRelative(root.dir, baseDir),
      description: status?.description ?? description,
      filePath: skillMdPath,
      baseDir,
      eligible: status?.eligible ?? false,
      disabled: status?.disabled ?? false,
      blockedByAllowlist: status?.blockedByAllowlist ?? false,
      ready: status?.eligible ?? false,
      fileCount: stats.fileCount,
      folderSize: stats.folderSize,
      modifiedAt: new Date(stats.modifiedAt || Date.now()).toISOString(),
      gitTracked: await detectGitTracked(baseDir),
      missing: status?.missing,
      requirements: status?.requirements,
    })
  }

  skills.sort((a, b) => a.name.localeCompare(b.name))
  return skills
}

export async function getSkill(skillId: string, force = false): Promise<SkillRecord> {
  const [category, ...rest] = skillId.split(':')
  const name = rest.join(':')
  const root = SKILL_ROOTS.find((entry) => entry.category === category)
  if (!root || !name) {
    throw new Error('Skill not found')
  }

  const baseDir = resolveSkillDir(skillId)
  const skillMdPath = path.join(baseDir, 'SKILL.md')

  await fs.access(baseDir)

  const statuses = await loadSkillStatuses(force)
  const exactStatus = statuses.find((entry) => path.resolve(entry.baseDir ?? '') === path.resolve(baseDir))
  const fallbackStatuses = statuses.filter((entry) => entry.name === name)
  await loadSkillFsEntries(force)
  const nameCount = getCachedNameCount(name)
  const status = exactStatus ?? canonicalFallbackStatus(baseDir, root.category, fallbackStatuses, nameCount)
  const stats = await statDirectoryRecursive(baseDir)

  let description = ''
  try {
    const parsed = matter(await fs.readFile(skillMdPath, 'utf8'))
    description = String(parsed.data.description ?? '').trim()
  } catch {
    // ignore
  }

  const categoryResolved = status?.source ? categoryFromSource(status.source) : root.category

  return {
    id: makeSkillId(categoryResolved, name),
    name,
    category: categoryResolved,
    categoryLabel: root.label,
    source: status?.source ?? root.category,
    pathToken: safeRelative(root.dir, baseDir),
    description: status?.description ?? description,
    filePath: skillMdPath,
    baseDir,
    eligible: status?.eligible ?? false,
    disabled: status?.disabled ?? false,
    blockedByAllowlist: status?.blockedByAllowlist ?? false,
    ready: status?.eligible ?? false,
    fileCount: stats.fileCount,
    folderSize: stats.folderSize,
    modifiedAt: new Date(stats.modifiedAt || Date.now()).toISOString(),
    gitTracked: await detectGitTracked(baseDir),
    missing: status?.missing,
    requirements: status?.requirements,
  }
}

export async function buildTree(dir: string, root = dir): Promise<FileTreeNode[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true })
  const nodes: FileTreeNode[] = []
  for (const entry of entries) {
    if (IGNORED_NAMES.has(entry.name)) continue
    const fullPath = path.join(dir, entry.name)
    const relativePath = safeRelative(root, fullPath)
    if (entry.isDirectory()) {
      nodes.push({
        name: entry.name,
        path: relativePath,
        type: 'directory',
        children: await buildTree(fullPath, root),
      })
    } else {
      nodes.push({
        name: entry.name,
        path: relativePath,
        type: 'file',
      })
    }
  }
  nodes.sort((a, b) => {
    if (a.type !== b.type) return a.type === 'directory' ? -1 : 1
    return a.name.localeCompare(b.name)
  })
  return nodes
}
