# MCP wrapper (stub)

Minimal mapping for an MCP (Model Context Protocol) server that fronts the Renderspace REST API. This repo ships **tool descriptors** only — not a full MCP server process. Wire them in Cursor Directory, Composio, or a thin Node MCP host when ready.

## Auth

Pass the user’s API key into the MCP server config (env recommended):

```bash
RENDERSPACE_API_KEY=rs_live_…
RENDERSPACE_API_BASE=https://www.renderspace.ai/api/v1
```

Every tool call should send `Authorization: Bearer $RENDERSPACE_API_KEY`.

## Tools → REST

| MCP tool | HTTP | Path | Notes |
| --- | --- | --- | --- |
| `create_render` | `POST` | `/renders` | Body: `space_type`, `image_url`, `instruction` (and optional `options` / `prompt` / `realism` / `idempotency_key`). Returns render JSON; on success `image_url` is set and **2 credits** are charged. |
| `get_render` | `GET` | `/renders/{id}` | Path param `id` (UUID). |
| `list_renders` | `GET` | `/renders` | Query `limit` (1–100, default 20). Response `{ data: Render[] }`. |
| `get_credits` | `GET` | `/credits` | Balance / plan; does not charge. |

Descriptors live in `lib/api/v1/mcp-tools.ts` (`MCP_TOOLS` export).

## Suggested tool shapes

### `create_render`

```json
{
  "name": "create_render",
  "description": "Create a photorealistic design concept from a job-site photo (2 credits on success).",
  "inputSchema": {
    "type": "object",
    "required": ["space_type", "image_url", "instruction"],
    "properties": {
      "space_type": { "type": "string", "enum": ["landscape", "exterior", "interior"] },
      "image_url": { "type": "string", "format": "uri" },
      "instruction": { "type": "string" },
      "idempotency_key": { "type": "string" }
    }
  }
}
```

Handler: `POST {base}/renders` with JSON body → return response body (including `image_url`).

### `get_render` / `list_renders` / `get_credits`

Thin GET wrappers. Prefer `create_render` for new work; `get_render` is for ids you already stored.

## Out of scope for the stub

- Session cookie `/keys` management (dashboard only)
- Webhooks (not in API v1)
- Multipart file upload (MCP can pass `image_url` after the host uploads elsewhere)
- Full MCP SDK server binary — add later if listings require a runnable package

## Quick host sketch (optional)

```ts
import { MCP_TOOLS, type McpToolName } from "@/lib/api/v1/mcp-tools"

async function callTool(name: McpToolName, args: Record<string, unknown>) {
  const tool = MCP_TOOLS.find((t) => t.name === name)!
  const url = new URL(tool.path.replace("{id}", String(args.id ?? "")), process.env.RENDERSPACE_API_BASE)
  if (tool.method === "GET" && args.limit != null) url.searchParams.set("limit", String(args.limit))
  const res = await fetch(url, {
    method: tool.method,
    headers: {
      Authorization: `Bearer ${process.env.RENDERSPACE_API_KEY}`,
      ...(tool.method === "POST" ? { "Content-Type": "application/json" } : {}),
    },
    body: tool.method === "POST" ? JSON.stringify(args) : undefined,
  })
  return res.json()
}
```

Timeouts should allow ~120s for `create_render`.
