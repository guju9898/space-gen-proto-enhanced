import { developersMarkdown, markdownResponse } from "@/lib/docs/developersMarkdown"

export const runtime = "nodejs"

/** GET /developers.md — Markdown twin of /developers. */
export async function GET() {
  return markdownResponse(developersMarkdown())
}
