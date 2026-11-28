/**
 * Hosted MCP endpoint (Streamable HTTP, stateless, JSON responses) for /api/mcp.
 * Each tool call is proxied to the public REST API with the caller's own API key,
 * so auth, credits and rate limits are exactly the same as /api/v1.
 */

import { MCP_TOOLS, getMcpTool, type McpToolName } from "@/lib/api/v1/mcp-tools"

export const MCP_SERVER_INFO = { name: "renderspace", title: "Renderspace", version: "1.0.0" }
export const MCP_PROTOCOL_VERSIONS = ["2025-06-18", "2025-03-26", "2024-11-05"] as const

export type JsonRpcMessage = {
  jsonrpc?: string
  id?: string | number | null
  method?: string
  params?: Record<string, unknown>
}

export type JsonRpcResponse = {
  jsonrpc: "2.0"
  id: string | number | null
  result?: unknown
  error?: { code: number; message: string }
}

export type ToolCaller = (tool: McpToolName, args: Record<string, unknown>) => Promise<{ ok: boolean; data: unknown }>

const ok = (id: JsonRpcMessage["id"], result: unknown): JsonRpcResponse => ({ jsonrpc: "2.0", id: id ?? null, result })
const err = (id: JsonRpcMessage["id"], code: number, message: string): JsonRpcResponse => ({
  jsonrpc: "2.0",
  id: id ?? null,
  error: { code, message },
})

/** Returns null for notifications (no response body). */
export async function handleMcpMessage(msg: JsonRpcMessage, call: ToolCaller): Promise<JsonRpcResponse | null> {
  const { id, method } = msg
  const params = (msg.params ?? {}) as Record<string, unknown>
  const isRequest = id !== undefined && id !== null

  if (!method) return isRequest ? err(id, -32600, "Invalid request") : null
  if (method.startsWith("notifications/")) return null

  switch (method) {
    case "initialize": {
      const asked = String(params.protocolVersion ?? "")
      const version = (MCP_PROTOCOL_VERSIONS as readonly string[]).includes(asked) ? asked : MCP_PROTOCOL_VERSIONS[0]
      return ok(id, {
        protocolVersion: version,
        capabilities: { tools: { listChanged: false } },
        serverInfo: MCP_SERVER_INFO,
        instructions:
          "Renderspace turns a job-site photo into a photorealistic design concept. create_render costs 2 credits; get_credits is free.",
      })
    }
    case "ping":
      return ok(id, {})
    case "tools/list":
      return ok(id, {
        tools: MCP_TOOLS.map((t) => ({ name: t.name, description: t.description, inputSchema: t.inputSchema })),
      })
    case "tools/call": {
      const name = String(params.name ?? "") as McpToolName
      if (!getMcpTool(name)) return err(id, -32602, `Unknown tool: ${name}`)
      const args = (params.arguments ?? {}) as Record<string, unknown>
      try {
        const { ok: success, data } = await call(name, args)
        const text = JSON.stringify(data, null, 2)
        return ok(id, success ? { content: [{ type: "text", text }] } : { isError: true, content: [{ type: "text", text }] })
      } catch (e) {
        return ok(id, { isError: true, content: [{ type: "text", text: e instanceof Error ? e.message : "Tool call failed" }] })
      }
    }
    default:
      return isRequest ? err(id, -32601, `Method not found: ${method}`) : null
  }
}

/** Build the REST request for a tool call. */
export function restRequestFor(
  tool: McpToolName,
  args: Record<string, unknown>,
  origin: string
): { url: string; method: "GET" | "POST"; body?: string } {
  const d = getMcpTool(tool)!
  let path = d.path
  if (path.includes("{id}")) path = path.replace("{id}", encodeURIComponent(String(args.id ?? "")))
  const url = new URL(`/api/v1${path}`, origin)
  if (d.method === "GET" && args.limit != null) url.searchParams.set("limit", String(args.limit))
  return { url: url.toString(), method: d.method, body: d.method === "POST" ? JSON.stringify(args) : undefined }
}
