import fs from 'node:fs/promises'
import path from 'node:path'
import mime from 'mime-types'
import { MAX_FILE_SIZE } from './config.js'
import { renderMarkdown } from './render.js'
import { resolveSkillDir, safeRelative } from './paths.js'
import type { FileContentResponse } from './types.js'

function languageFromPath(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase()
  if (ext === '.md') return 'markdown'
  if (ext === '.ts' || ext === '.tsx') return 'typescript'
  if (ext === '.js' || ext === '.mjs') return 'javascript'
  if (ext === '.json') return 'json'
  if (ext === '.css') return 'css'
  if (ext === '.html') return 'html'
  if (ext === '.py') return 'python'
  if (ext === '.sh') return 'bash'
  return 'plaintext'
}

export async function getFileContent(skillId: string, relativePath: string): Promise<FileContentResponse> {
  const skillDir = resolveSkillDir(skillId)
  const target = path.join(skillDir, relativePath)
  safeRelative(skillDir, target)
  const stats = await fs.stat(target)
  if (stats.size > MAX_FILE_SIZE) {
    throw new Error('File too large to preview')
  }
  const raw = await fs.readFile(target, 'utf8')
  const markdown = path.extname(target).toLowerCase() === '.md'
  return {
    skillId,
    relativePath,
    language: languageFromPath(target),
    mimeType: mime.lookup(target) || 'text/plain',
    markdown,
    raw,
    renderedHtml: markdown ? renderMarkdown(raw) : undefined,
    size: stats.size,
    modifiedAt: stats.mtime.toISOString(),
  }
}
