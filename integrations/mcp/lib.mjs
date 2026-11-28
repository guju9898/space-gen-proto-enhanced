// Shared Renderspace API client and tool definitions. No dependencies.

export const VERSION = "1.0.0"
export const DEFAULT_BASE = "https://www.renderspace.ai/api/v1"

export function config(env = process.env) {
  return {
    apiKey: (env.RENDERSPACE_API_KEY || "").trim(),
    base: (env.RENDERSPACE_API_BASE || DEFAULT_BASE).replace(/\/+$/, ""),
  }
}

export const TOOLS = [
  {
    name: "create_render",
    title: "Create a render",
    description:
      "Turn a job-site photo into a photorealistic design concept (pool, patio, outdoor kitchen, landscape, exterior or interior) in about 30 seconds. Charges 2 Renderspace credits on success. Returns the render with image_url.",
    inputSchema: {
      type: "object",
      required: ["space_type", "image_url", "instruction"],
      additionalProperties: false,
      properties: {
        space_type: {
          type: "string",
          enum: ["landscape", "exterior", "interior"],
          description: "landscape for yards, pools and patios; exterior for facades; interior for rooms.",
        },
        image_url: { type: "string", format: "uri", description: "Public HTTPS URL of the source photo." },
        instruction: {
          type: "string",
          description: "Plain-language design brief, e.g. 'linear pool, travertine deck, warm dusk lighting'.",
        },
        realism: { type: "number", minimum: 0, maximum: 100, description: "Optional realism level (0-100)." },
        idempotency_key: { type: "string", description: "Optional. Reusing a key returns the earlier render." },
      },
    },
    method: "POST",
    path: "/renders",
  },
  {
    name: "get_render",
    title: "Get a render",
    description: "Fetch one render by its id.",
    inputSchema: {
      type: "object",
      required: ["id"],
      additionalProperties: false,
      properties: { id: { type: "string", description: "Render id returned by create_render." } },
    },
    method: "GET",
    path: "/renders/{id}",
  },
  {
    name: "list_renders",
    title: "List renders",
    description: "List your most recent renders, newest first.",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      properties: { limit: { type: "integer", minimum: 1, maximum: 100, default: 20 } },
    },
    method: "GET",
    path: "/renders",
  },
  {
    name: "get_credits",
    title: "Get credits",
    description: "Show remaining Renderspace credits and plan. Free; does not use credits.",
    inputSchema: { type: "object", additionalProperties: false, properties: {} },
    method: "GET",
    path: "/credits",
  },
]

export async function callApi(toolName, args = {}, cfg = config()) {
  const tool = TOOLS.find((t) => t.name === toolName)
  if (!tool) throw new Error(`Unknown tool: ${toolName}`)
  if (!cfg.apiKey) {
    throw new Error(
      "RENDERSPACE_API_KEY is not set. Create a key at https://www.renderspace.ai/developers (Professional or Business plan)."
    )
  }
  let path = tool.path
  if (path.includes("{id}")) {
    if (!args.id) throw new Error("id is required")
    path = path.replace("{id}", encodeURIComponent(String(args.id)))
  }
  const url = new URL(cfg.base + path)
  if (tool.method === "GET" && args.limit != null) url.searchParams.set("limit", String(args.limit))
  const body = tool.method === "POST" ? JSON.stringify(args) : undefined
  const res = await fetch(url, {
    method: tool.method,
    headers: {
      Authorization: `Bearer ${cfg.apiKey}`,
      Accept: "application/json",
      "User-Agent": `renderspace-mcp/${VERSION}`,
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body,
    signal: AbortSignal.timeout(180_000),
  })
  const text = await res.text()
  let data
  try {
    data = text ? JSON.parse(text) : {}
  } catch {
    data = { raw: text }
  }
  if (!res.ok) {
    const msg = data?.error?.message || data?.message || data?.error || res.statusText
    const err = new Error(`Renderspace API ${res.status}: ${typeof msg === "string" ? msg : JSON.stringify(msg)}`)
    err.status = res.status
    err.data = data
    throw err
  }
  return data
}
