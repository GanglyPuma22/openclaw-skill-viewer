import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import express from 'express'
import { API_PORT } from './config.js'
import { getFileContent } from './files.js'
import { getDiff, getHistory } from './history.js'
import { getSkill, getSkills, buildTree } from './skills.js'
import type { SkillRecord } from './types.js'
import { registerEventsClient, startWatcher } from './watch.js'

const app = express()
const serverDir = path.dirname(fileURLToPath(import.meta.url))
const distDir = [
  path.resolve(serverDir, '../dist'),
  path.resolve(serverDir, '../../dist'),
].find((candidate) => fs.existsSync(path.join(candidate, 'index.html')))

function toPublicSkillRecord(skill: SkillRecord) {
  const { filePath, baseDir, ...publicSkill } = skill
  void filePath
  void baseDir
  return publicSkill
}

app.use(express.json())
startWatcher()

app.get('/api/health', (_req, res) => {
  res.json({ ok: true })
})

app.get('/api/skills', async (_req, res, next) => {
  try {
    const skills = await getSkills()
    res.json({ skills: skills.map(toPublicSkillRecord) })
  } catch (error) {
    next(error)
  }
})

app.get('/api/skills/:skillId', async (req, res, next) => {
  try {
    const skill = await getSkill(req.params.skillId)
    const tree = await buildTree(skill.baseDir)
    const defaultFile = tree.flatMap((node) => node.type === 'file' ? [node.path] : (node.children ?? []).filter((child) => child.type === 'file').map((child) => child.path)).find((item) => item.endsWith('SKILL.md')) ?? 'SKILL.md'
    res.json({ skill: toPublicSkillRecord(skill), tree, defaultFile })
  } catch (error) {
    next(error)
  }
})

app.get('/api/skills/:skillId/file', async (req, res, next) => {
  try {
    const relativePath = String(req.query.path || 'SKILL.md')
    const file = await getFileContent(req.params.skillId, relativePath)
    res.json(file)
  } catch (error) {
    next(error)
  }
})

app.get('/api/skills/:skillId/history', async (req, res, next) => {
  try {
    const relativePath = String(req.query.path || 'SKILL.md')
    const history = await getHistory(req.params.skillId, relativePath)
    res.json({ history })
  } catch (error) {
    next(error)
  }
})

app.get('/api/skills/:skillId/diff', async (req, res, next) => {
  try {
    const relativePath = String(req.query.path || 'SKILL.md')
    const fromRef = String(req.query.from || 'HEAD~1')
    const toRef = String(req.query.to || 'HEAD')
    const diff = await getDiff(req.params.skillId, relativePath, fromRef, toRef)
    res.json({ diff })
  } catch (error) {
    next(error)
  }
})

app.get('/api/events', (_req, res) => {
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.flushHeaders()
  res.write(`data: ${JSON.stringify({ event: 'connected', at: new Date().toISOString() })}\n\n`)
  registerEventsClient(res)
})

if (distDir) {
  app.use(express.static(distDir))
  app.get(/^\/(?!api(?:\/|$)).*/, (_req, res) => {
    res.sendFile(path.join(distDir, 'index.html'))
  })
}

app.use((error: unknown, _req: express.Request, res: express.Response, next: express.NextFunction) => {
  void next
  const message = error instanceof Error ? error.message : 'Unknown error'
  res.status(500).json({ error: message })
})

app.listen(API_PORT, '127.0.0.1', () => {
  console.log(`Skill viewer listening on http://127.0.0.1:${API_PORT}`)
})
