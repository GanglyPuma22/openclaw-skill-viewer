import fs from 'node:fs/promises'
import path from 'node:path'
import matter from 'gray-matter'
import { simpleGit } from 'simple-git'
import { IGNORED_NAMES, SKILL_ROOTS } from './config.js'
import { categoryFromSource, makeSkillId, safeRelative } from './paths.js'
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

async function loadSkillStatuses(): Promise<SkillStatusListEntry[]> {
  const now = Date.now()
  if (cachedStatuses && now - cachedAt < 10_000) return cachedStatuses
  const json = await execJson('openclaw', ['skills', 'list', '--json'])
  const skills = Array.isArray(json.skills) ? json.skills : []
  cachedStatuses = skills
  cachedAt = now
  return skills
}

async function listDirectories(dir: string): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true })
  return entries.filter((entry) => entry.isDirectory() && !IGNORED_NAMES.has(entry.name)).map((entry) => entry.name)
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

async function detectGitTracked(dir: string): Promise<boolean> {
  try {
    const git = simpleGit({ baseDir: dir, binary: 'git' })
    await git.revparse(['--show-toplevel'])
    return true
  } catch {
    return false
  }
}

export async function getSkills(): Promise<SkillRecord[]> {
  const statuses = await loadSkillStatuses()
  const byPath = new Map<string, SkillStatusListEntry>()
  const byName = new Map<string, SkillStatusListEntry>()
  for (const status of statuses) {
    if (status.baseDir) byPath.set(path.resolve(status.baseDir), status)
    byName.set(status.name, status)
  }

  const skills: SkillRecord[] = []
  for (const root of SKILL_ROOTS) {
    const names = await listDirectories(root.dir).catch(() => [])
    for (const name of names) {
      const baseDir = path.join(root.dir, name)
      const stats = await statDirectoryRecursive(baseDir)
      const skillMdPath = path.join(baseDir, 'SKILL.md')
      let description = ''
      try {
        const parsed = matter(await fs.readFile(skillMdPath, 'utf8'))
        description = String(parsed.data.description ?? '').trim()
      } catch {
        // ignore
      }
      const status = byPath.get(path.resolve(baseDir)) ?? byName.get(name)
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
  }

  skills.sort((a, b) => a.name.localeCompare(b.name))
  return skills
}

export async function getSkill(skillId: string): Promise<SkillRecord> {
  const skills = await getSkills()
  const skill = skills.find((entry) => entry.id === skillId)
  if (!skill) throw new Error('Skill not found')
  return skill
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
