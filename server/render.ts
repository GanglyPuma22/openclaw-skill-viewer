import MarkdownIt from 'markdown-it'
import hljs from 'highlight.js'

const markdown = new MarkdownIt({
  html: false,
  linkify: true,
  highlight(code: string, lang: string) {
    const language = lang && hljs.getLanguage(lang) ? lang : 'plaintext'
    const highlighted = hljs.highlight(code, { language }).value
    return `<pre class="hljs"><code>${highlighted}</code></pre>`
  },
})

export function renderMarkdown(raw: string): string {
  return markdown.render(raw)
}
