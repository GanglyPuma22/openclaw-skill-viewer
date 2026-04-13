export interface SkillRecord {
  id: string
  name: string
  category: 'built-in' | 'workspace' | 'other'
  categoryLabel: string
  source: string
  pathToken: string
  description: string
  eligible: boolean
  disabled: boolean
  blockedByAllowlist: boolean
  ready: boolean
  fileCount: number
  folderSize: number
  modifiedAt: string
  gitTracked: boolean
  missing?: {
    bins?: string[]
    anyBins?: string[]
    env?: string[]
    config?: string[]
    os?: string[]
  }
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
