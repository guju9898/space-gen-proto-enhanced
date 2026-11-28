import { USAGE_RIGHTS } from "@/lib/seo/facts"
import { API_RENDER_CREDIT_COST } from "@/lib/usage/creditCost"

export const DEVELOPERS_ORIGIN = "https://www.renderspace.ai"
export const DEVELOPERS_PATH = "/developers"
export const DEVELOPERS_MD_PATH = "/developers.md"
export const LLMS_TXT_PATH = "/llms.txt"

/** Prefixed on every Markdown docs response so agents can discover the index. */
export function agentDocsDirective(pageMdUrl: string = `${DEVELOPERS_ORIGIN}${DEVELOPERS_MD_PATH}`): string {
  return [
    `> For clean Markdown of this page, use ${pageMdUrl} or send \`Accept: text/markdown\`.`,
    `> Documentation index: ${DEVELOPERS_ORIGIN}${LLMS_TXT_PATH}`,
  ].join("\n")
}

/**
 * Markdown twin of /developers. Wording and section order match the HTML <main>
 * so AFDocs markdown-content-parity sees the same segments.
 */
export function developersMarkdown(): string {
  const cost = API_RENDER_CREDIT_COST
  return `${agentDocsDirective()}

# Photo in. Concept out.

Public API

Turn a job-site photo into a photorealistic design concept from your own tools. Natural-language instructions are structured on our servers. Professional and Business plans only. Each successful API render uses ${cost} credits.

[Create API key](${DEVELOPERS_ORIGIN}/profile) · [OpenAPI spec](${DEVELOPERS_ORIGIN}/openapi/v1.yaml)

![Job-site exterior photo before redesign](${DEVELOPERS_ORIGIN}/gallery/exterior-before.jpg)

Before

![Photorealistic exterior concept generated in Renderspace](${DEVELOPERS_ORIGIN}/gallery/exterior-after.jpg)

After

## Try a request

Authenticate with a key from your [profile](${DEVELOPERS_ORIGIN}/profile). Pass an image URL or multipart upload plus a natural-language instruction.

\`\`\`bash
curl -X POST ${DEVELOPERS_ORIGIN}/api/v1/renders \\
  -H "Authorization: Bearer rs_live_YOUR_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "space_type": "landscape",
    "image_url": "https://example.com/yard.jpg",
    "instruction": "Modern backyard with a linear pool and warm evening light"
  }'
\`\`\`

## Get a key

1. Use an active Professional or Business subscription.
2. Open [Profile → API Keys](${DEVELOPERS_ORIGIN}/profile).
3. Create a key and store the secret — it is shown once.
4. Send \`Authorization: Bearer rs_live_…\`

[Open profile](${DEVELOPERS_ORIGIN}/profile)

## Endpoints

| Method | Path | Purpose |
| --- | --- | --- |
| GET | /api/v1/credits | Remaining credits |
| POST | /api/v1/renders | Create a render (sync, ${cost} credits) |
| GET | /api/v1/renders | List recent renders |
| GET | /api/v1/renders/{id} | Fetch one render |

Machine-readable contract: [/openapi/v1.yaml](${DEVELOPERS_ORIGIN}/openapi/v1.yaml)

## Webhooks

\`POST /renders\` answers synchronously, so you don't need webhooks. Add one in [Profile → Webhooks](${DEVELOPERS_ORIGIN}/profile) if another tool (n8n, Make, Zapier) should hear about every finished render. Each delivery is a JSON POST with these headers:

- \`X-Renderspace-Event\`: \`render.completed\`, \`render.failed\` or \`webhook.test\`
- \`X-Renderspace-Timestamp\`: Unix seconds
- \`X-Renderspace-Signature\`: \`sha256=\` HMAC of \`timestamp.body\` using your \`whsec_\` secret

\`\`\`js
import { createHmac, timingSafeEqual } from "node:crypto"

// rawBody: the request body exactly as received (string), before JSON.parse
function verifyRenderspace(rawBody, headers, secret) {
  const ts = headers["x-renderspace-timestamp"]
  if (!ts || Math.abs(Date.now() / 1000 - Number(ts)) > 300) return false
  const expected =
    "sha256=" + createHmac("sha256", secret).update(\`\${ts}.\${rawBody}\`).digest("hex")
  const got = headers["x-renderspace-signature"] || ""
  return got.length === expected.length &&
    timingSafeEqual(Buffer.from(got), Buffer.from(expected))
}
\`\`\`

One attempt per event with an 8-second timeout and no retries. If you miss one, fetch \`GET /renders/{id}\`. HTTPS only, up to 5 per account.

## Terms & commercial use

API access requires an active Professional or Business plan. Each successful API render costs ${cost} credits.

API renders inherit your paid-plan commercial license. ${USAGE_RIGHTS}
`
}

/**
 * Distinctive HTML <main> segments that must appear in the Markdown twin.
 * Used by the parity unit test (AFDocs markdown-content-parity).
 */
export function developersHtmlParitySegments(): string[] {
  const cost = String(API_RENDER_CREDIT_COST)
  return [
    "Photo in. Concept out.",
    "Public API",
    "Turn a job-site photo into a photorealistic design concept from your own tools.",
    "Natural-language instructions are structured on our servers.",
    "Professional and Business plans only.",
    `Each successful API render uses ${cost} credits.`,
    "Create API key",
    "OpenAPI spec",
    "Job-site exterior photo before redesign",
    "Before",
    "Photorealistic exterior concept generated in Renderspace",
    "After",
    "Try a request",
    "Authenticate with a key from your",
    "profile",
    "Pass an image URL or multipart upload plus a natural-language instruction.",
    "curl -X POST https://www.renderspace.ai/api/v1/renders",
    "Authorization: Bearer rs_live_YOUR_KEY",
    "space_type",
    "image_url",
    "instruction",
    "Modern backyard with a linear pool and warm evening light",
    "Get a key",
    "Use an active Professional or Business subscription.",
    "Profile → API Keys",
    "Create a key and store the secret — it is shown once.",
    "Authorization: Bearer rs_live_…",
    "Open profile",
    "Endpoints",
    "Method",
    "Path",
    "Purpose",
    "GET",
    "/api/v1/credits",
    "Remaining credits",
    "POST",
    "/api/v1/renders",
    `Create a render (sync, ${cost} credits)`,
    "List recent renders",
    "/api/v1/renders/{id}",
    "Fetch one render",
    "Machine-readable contract:",
    "/openapi/v1.yaml",
    "Webhooks",
    "POST /renders",
    "answers synchronously, so you don't need webhooks.",
    "Profile → Webhooks",
    "n8n, Make, Zapier",
    "Each delivery is a JSON POST with these headers:",
    "X-Renderspace-Event",
    "render.completed",
    "render.failed",
    "webhook.test",
    "X-Renderspace-Timestamp",
    "Unix seconds",
    "X-Renderspace-Signature",
    "sha256=",
    "timestamp.body",
    "whsec_",
    "createHmac",
    "timingSafeEqual",
    "x-renderspace-timestamp",
    "x-renderspace-signature",
    "One attempt per event with an 8-second timeout and no retries.",
    "GET /renders/{id}",
    "HTTPS only, up to 5 per account.",
    "Terms & commercial use",
    "API access requires an active Professional or Business plan.",
    `Each successful API render costs ${cost} credits.`,
    "API renders inherit your paid-plan commercial license.",
    USAGE_RIGHTS,
  ]
}

/** Site-root llms.txt (llmstxt.org format). Links point at Markdown twins. */
export function llmsTxt(): string {
  return `# Renderspace

> Photo-to-concept API for landscape, exterior, and interior design renders. Authenticate with \`Authorization: Bearer rs_live_…\`. Base URL: ${DEVELOPERS_ORIGIN}/api/v1. Each successful API render costs ${API_RENDER_CREDIT_COST} credits (Professional or Business plans).

Important notes:

- Human docs live at ${DEVELOPERS_ORIGIN}/developers; agents should prefer the \`.md\` links below or \`Accept: text/markdown\`.
- Create API keys in Profile → API Keys. Keys are shown once.

## Docs

- [Developers](${DEVELOPERS_ORIGIN}${DEVELOPERS_MD_PATH}): Public REST API overview — auth, create/list/get renders, credits, webhooks, and commercial use.

## Optional

- [OpenAPI v1](${DEVELOPERS_ORIGIN}/openapi/v1.yaml): Machine-readable OpenAPI 3.1 contract for the public API (YAML, not Markdown).
- [HTML developers page](${DEVELOPERS_ORIGIN}${DEVELOPERS_PATH}): Same content as the Markdown docs, for browsers.
`
}

export function markdownResponse(body: string, init?: { status?: number; cacheControl?: string }): Response {
  return new Response(body, {
    status: init?.status ?? 200,
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": init?.cacheControl ?? "public, max-age=300, s-maxage=3600",
      Vary: "Accept",
      Link: `<${LLMS_TXT_PATH}>; rel="describedby", <${DEVELOPERS_MD_PATH}>; rel="alternate"; type="text/markdown"`,
    },
  })
}

/** True when the client explicitly asks for Markdown (Fern / agents). */
export function prefersMarkdown(acceptHeader: string | null): boolean {
  if (!acceptHeader) return false
  return /\btext\/markdown\b/i.test(acceptHeader)
}
