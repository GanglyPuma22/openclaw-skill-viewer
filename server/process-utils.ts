import { execFile } from 'node:child_process'

function extractJsonText(...chunks: string[]): string {
  const text = chunks.filter(Boolean).join('\n').trim()
  const objectStart = text.indexOf('{')
  if (objectStart >= 0) {
    return text.slice(objectStart)
  }
  const arrayStart = text.indexOf('[')
  if (arrayStart >= 0) {
    return text.slice(arrayStart)
  }
  throw new Error('No JSON found in command output')
}

export function execJson(command: string, args: string[], cwd?: string): Promise<any> {
  return new Promise((resolve, reject) => {
    execFile(command, args, { cwd, maxBuffer: 20 * 1024 * 1024 }, (error, stdout, stderr) => {
      const parse = () => {
        const jsonText = extractJsonText(stdout, stderr)
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
