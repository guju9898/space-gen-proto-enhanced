import { marked } from "marked"

marked.setOptions({
  gfm: true,
  breaks: false,
})

/** Server-side Markdown → HTML for static blog bodies we author. */
export function markdownToHtml(markdown: string): string {
  return marked.parse(markdown, { async: false }) as string
}
