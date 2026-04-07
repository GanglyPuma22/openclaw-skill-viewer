import path from 'node:path'
import os from 'node:os'

export const API_PORT = 4174
export const CLIENT_PORT = 4173

const home = os.homedir()

export const SKILL_ROOTS = [
  {
    category: 'built-in' as const,
    label: 'Built-in skills',
    dir: path.join(home, '.nvm/versions/node/v24.11.1/lib/node_modules/openclaw/skills'),
  },
  {
    category: 'workspace' as const,
    label: 'Workspace skills',
    dir: path.join(home, '.openclaw/workspace/skills'),
  },
  {
    category: 'other' as const,
    label: 'Other skills',
    dir: path.join(home, '.agents/skills'),
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
