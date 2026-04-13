import path from 'node:path'
import os from 'node:os'

export const API_PORT = 4174
export const CLIENT_PORT = 4173

const home = os.homedir()

function expandHome(input: string) {
  if (input === '~') return home
  if (input.startsWith('~/')) return path.join(home, input.slice(2))
  return input
}

function envPath(name: string, fallback: string) {
  const value = process.env[name]?.trim()
  return expandHome(value || fallback)
}

const defaultBuiltInRoot = path.join(home, '.nvm/versions/node', process.version, 'lib/node_modules/openclaw/skills')
const defaultWorkspaceRoot = path.join(home, '.openclaw/workspace/skills')
const defaultOtherRoot = path.join(home, '.agents/skills')

export const SKILL_ROOTS = [
  {
    category: 'built-in' as const,
    label: 'Built-in skills',
    dir: envPath('OPENCLAW_SKILL_VIEWER_BUILTIN_ROOT', defaultBuiltInRoot),
  },
  {
    category: 'workspace' as const,
    label: 'Workspace skills',
    dir: envPath('OPENCLAW_SKILL_VIEWER_WORKSPACE_ROOT', defaultWorkspaceRoot),
  },
  {
    category: 'other' as const,
    label: 'Other skills',
    dir: envPath('OPENCLAW_SKILL_VIEWER_OTHER_ROOT', defaultOtherRoot),
  },
]

export const IGNORED_NAMES = new Set([
  '.git',
  'node_modules',
  'dist',
  'server-dist',
  '.DS_Store',
  '.next',
  '.turbo',
  '.cache',
])

export const MAX_FILE_SIZE = 512 * 1024
export const MAX_SEARCH_FILE_SIZE = 256 * 1024
