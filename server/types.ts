export type SkillCategory = 'built-in' | 'workspace' | 'other'

export interface SkillStatusInfo {
  eligible: boolean
  disabled: boolean
  blockedByAllowlist: boolean
  requirements?: {
    bins?: string[]
    anyBins?: string[]
    env?: string[]
    config?: string[]
    os?: string[]
  }
  missing?: {
    bins?: string[]
    anyBins?: string[]
    env?: string[]
    config?: string[]
    os?: string[]
  }
  source?: string
  bundled?: boolean
}

export interface SkillRecord {
  id: string
  name: string
  category: SkillCategory
  categoryLabel: string
  source: string
  pathToken: string
  description: string
  filePath: string
  baseDir: string
  eligible: boolean
  disabled: boolean
  blockedByAllowlist: boolean
  ready: boolean
  fileCount: number
  folderSize: number
  modifiedAt: string
  gitTracked: boolean
  missing: SkillStatusInfo['missing']
  requirements: SkillStatusInfo['requirements']
}

export interface FileTreeNode {
  name: string
  path: string
  type: 'file' | 'directory'
  children?: FileTreeNode[]
}

export interface FileContentResponse {
  skillId: string
  relativePath: string
  language: string
  mimeType: string
  markdown: boolean
  raw: string
  renderedHtml?: string
  size: number
  modifiedAt: string
}

export interface HistoryEntry {
  hash: string
  shortHash: string
  date: string
  authorName: string
  subject: string
}
