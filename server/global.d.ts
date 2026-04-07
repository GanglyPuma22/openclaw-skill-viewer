declare module 'markdown-it' {
  interface MarkdownItOptions {
    html?: boolean
    linkify?: boolean
    highlight?: (code: string, lang: string) => string
  }

  export default class MarkdownIt {
    constructor(options?: MarkdownItOptions)
    render(src: string): string
  }
}
