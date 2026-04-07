import path from 'node:path'
import { simpleGit } from 'simple-git'
import { resolveSkillDir } from './paths.js'
import type { HistoryEntry } from './types.js'

async function repoForDir(baseDir: string): Promise<{ git: ReturnType<typeof simpleGit>; root: string }> {
  const git = simpleGit({ baseDir, binary: 'git' })
  const root = (await git.revparse(['--show-toplevel'])).trim()
  return { git, root }
}

function relativeToRepo(root: string, target: string): string {
  return path.relative(root, target)
}

export async function getHistory(skillId: string, relativePath: string): Promise<HistoryEntry[]> {
  const skillDir = resolveSkillDir(skillId)
  const { git, root } = await repoForDir(skillDir)
  const target = path.join(skillDir, relativePath)
  const relToRepo = relativeToRepo(root, target)
  const log = await git.log({ file: relToRepo, maxCount: 50 })
  return log.all.map((entry) => ({
    hash: entry.hash,
    shortHash: entry.hash.slice(0, 7),
    date: entry.date,
    authorName: entry.author_name,
    subject: entry.message,
  }))
}

export async function getDiff(skillId: string, relativePath: string, fromRef: string, toRef = 'HEAD'): Promise<string> {
  const skillDir = resolveSkillDir(skillId)
  const { git, root } = await repoForDir(skillDir)
  const target = path.join(skillDir, relativePath)
  const relToRepo = relativeToRepo(root, target)
  return git.diff([`${fromRef}`, `${toRef}`, '--', relToRepo])
}
