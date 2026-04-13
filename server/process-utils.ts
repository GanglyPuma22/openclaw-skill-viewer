import { execFile } from 'node:child_process'

function extractFirstCompleteJsonValue(text: string): string | null {
  let start = -1
  let opening = ''
  let closing = ''

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i]
    if (ch === '{' || ch === '[') {
      start = i
      opening = ch
      closing = ch === '{' ? '}' : ']'
      break
    }
  }

  if (start < 0) return null

  let depth = 0
  let inString = false
  let escaped = false

  for (let i = start; i < text.length; i += 1) {
    const ch = text[i]

    if (inString) {
      if (escaped) {
        escaped = false
        continue
      }
      if (ch === '\\') {
        escaped = true
        continue
      }
      if (ch === '"') {
        inString = false
      }
      continue
    }

    if (ch === '"') {
      inString = true
      continue
    }

    if (ch === opening) {
      depth += 1
      continue
    }

    if (ch === closing) {
      depth -= 1
      if (depth === 0) {
        return text.slice(start, i + 1)
      }
    }
  }

  return null
}

function extractJsonText(...chunks: string[]): string {
  for (const chunk of chunks) {
    if (!chunk) continue
    const candidate = extractFirstCompleteJsonValue(chunk)
    if (candidate) return candidate
  }
  throw new Error('No JSON found in command output')
}

export function execJson(command: string, args: string[], cwd?: string): Promise<any> {
  return new Promise((resolve, reject) => {
    execFile(command, args, { cwd, maxBuffer: 20 * 1024 * 1024 }, (error, stdout, stderr) => {
      const parse = () => {
        const jsonText = extractJsonText(stdout, stderr, `${stdout}\n${stderr}`)
        return JSON.parse(jsonText)
      }

      if (error) {
        try {
          resolve(parse())
          return
        } catch {
          reject(new Error(stderr || stdout || error.message))
          return
        }
      }

      try {
        resolve(parse())
      } catch (parseError) {
        reject(parseError)
      }
    })
  })
}
