import { NextResponse } from "next/server"
import { corsPreflight, withCors } from "@/lib/api/v1/cors"
import { handleMcpMessage, restRequestFor, type JsonRpcMessage } from "@/lib/api/v1/mcpHttp"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 300

/**
 * POST /api/mcp — hosted Renderspace MCP server (Streamable HTTP, stateless).
 * Auth: the caller's Renderspace API key as `Authorization: Bearer rs_live_…` (or `X-API-Key`).
 * Tool calls are forwarded to /api/v1 with that key, so credits and limits are unchanged.
 */
export async function OPTIONS(request: Request) {
  return corsPreflight(request, ["POST", "GET", "OPTIONS"])
}

export async function GET(request: Request) {
  // No server-initiated stream: stateless server.
  return withCors(request, new NextResponse(null, { status: 405, headers: { Allow: "POST, OPTIONS" } }))
}

export async function POST(request: Request) {
  let payload: unknown
  try {
    payload = await request.json()
  } catch {
    return withCors(
      request,
      NextResponse.json({ jsonrpc: "2.0", id: null, error: { code: -32700, message: "Parse error" } }, { status: 400 })
    )
  }

  const authHeader = request.headers.get("authorization")
  const apiKeyHeader = request.headers.get("x-api-key")
  const origin = new URL(request.url).origin

  const call = async (tool: Parameters<typeof restRequestFor>[0], args: Record<string, unknown>) => {
    if (!authHeader && !apiKeyHeader) {
      return {
        ok: false,
        data: { error: "Missing API key. Create one at https://www.renderspace.ai/developers and send it as a Bearer token." },
      }
    }
    const req = restRequestFor(tool, args, origin)
    const res = await fetch(req.url, {
      method: req.method,
      headers: {
        ...(authHeader ? { Authorization: authHeader } : {}),
        ...(apiKeyHeader ? { "X-API-Key": apiKeyHeader } : {}),
        Accept: "application/json",
        ...(req.body ? { "Content-Type": "application/json" } : {}),
      },
      body: req.body,
      cache: "no-store",
    })
    const text = await res.text()
    let data: unknown
    try {
      data = text ? JSON.parse(text) : {}
    } catch {
      data = { status: res.status, body: text.slice(0, 2000) }
    }
    return { ok: res.ok, data }
  }

  const messages = (Array.isArray(payload) ? payload : [payload]) as JsonRpcMessage[]
  const responses = (await Promise.all(messages.map((m) => handleMcpMessage(m, call)))).filter(Boolean)

  if (responses.length === 0) return withCors(request, new NextResponse(null, { status: 202 }))
  const body = Array.isArray(payload) ? responses : responses[0]
  return withCors(request, NextResponse.json(body))
}
