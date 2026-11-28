import { llmsTxt, markdownResponse } from "@/lib/docs/developersMarkdown"

export const runtime = "nodejs"

/** GET /llms.txt — agent documentation index (llmstxt.org). */
export async function GET() {
  return markdownResponse(llmsTxt(), {
    cacheControl: "public, max-age=300, s-maxage=86400",
  })
}
