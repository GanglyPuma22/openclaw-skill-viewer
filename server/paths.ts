import path from 'node:path'
import { SKILL_ROOTS } from './config.js'
import type { SkillCategory } from './types.js'

export function categoryFromSource(source: string | undefined): SkillCategory {
  if (source?.includes('workspace')) return 'workspace'
  if (source?.includes('bundled') || source?.includes('openclaw-bundled')) return 'built-in'
  return 'other'
}

export function rootForCategory(category: SkillCategory) {
  return SKILL_ROOTS.find((root) => root.category === category)
}

export function makeSkillId(category: SkillCategory, name: string): string {
  return `${category}:${name}`
}

export function parseSkillId(skillId: string): { category: SkillCategory; name: string } {
  const [category, ...rest] = skillId.split(':')
  if (!category || rest.length === 0) {
    throw new Error('Invalid skill id')
  }
  return { category: category as SkillCategory, name: rest.join(':') }
}

export function resolveSkillDir(skillId: string): string {
  const parsed = parseSkillId(skillId)
  const root = rootForCategory(parsed.category)
  if (!root) {
    throw new Error('Unknown skill category')
  }
  return path.join(root.dir, parsed.name)
}

export function safeRelative(root: string, target: string): string {
  const rel = path.relative(root, target)
  if (rel.startsWith('..') || path.isAbsolute(rel)) {
    throw new Error('Path escapes root')
  }
  return rel || '.'
}
