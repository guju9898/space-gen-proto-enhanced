#!/usr/bin/env node
// Renderspace MCP server (stdio, JSON-RPC 2.0). Zero dependencies.
// Config: RENDERSPACE_API_KEY (required), RENDERSPACE_API_BASE (optional).

import { realpathSync } from "node:fs"
import { createInterface } from "node:readline"
import { fileURLToPath } from "node:url"
import { TOOLS, VERSION, callApi } from "./lib.mjs"

const PROTOCOL_VERSIONS = ["2025-06-18", "2025-03-26", "2024-11-05"]

function send(msg) {
  process.stdout.write(JSON.stringify(msg) + "\n")
}
const reply = (id, result) => send({ jsonrpc: "2.0", id, result })
const fail = (id, code, message) => send({ jsonrpc: "2.0", id, error: { code, message } })

async function handle(msg) {
  const { id, method, params = {} } = msg
  const isRequest = id !== undefined && id !== null
  switch (method) {
    case "initialize": {
      const asked = params.protocolVersion
      return reply(id, {
        protocolVersion: PROTOCOL_VERSIONS.includes(asked) ? asked : PROTOCOL_VERSIONS[0],
        capabilities: { tools: { listChanged: false } },
        serverInfo: { name: "renderspace", title: "Renderspace", version: VERSION },
        instructions:
          "Renderspace turns a job-site photo into a photorealistic design concept. Call get_credits first if unsure about balance; create_render costs 2 credits.",
      })
    }
    case "ping":
      return isRequest && reply(id, {})
    case "tools/list":
      return reply(id, {
        tools: TOOLS.map(({ name, title, description, inputSchema }) => ({ name, title, description, inputSchema })),
      })
    case "tools/call": {
      const name = params.name
      if (!TOOLS.some((t) => t.name === name)) return fail(id, -32602, `Unknown tool: ${name}`)
      try {
        const data = await callApi(name, params.arguments || {})
        const content = [{ type: "text", text: JSON.stringify(data, null, 2) }]
        return reply(id, { content, structuredContent: data && typeof data === "object" ? data : undefined })
      } catch (e) {
        return reply(id, { isError: true, content: [{ type: "text", text: e instanceof Error ? e.message : String(e) }] })
      }
    }
    default:
      if (method?.startsWith("notifications/")) return
      if (isRequest) return fail(id, -32601, `Method not found: ${method}`)
  }
}

export function startServer() {
  const rl = createInterface({ input: process.stdin })
  rl.on("line", (line) => {
    if (!line.trim()) return
    let msg
    try {
      msg = JSON.parse(line)
    } catch {
      return send({ jsonrpc: "2.0", id: null, error: { code: -32700, message: "Parse error" } })
    }
    const batch = Array.isArray(msg) ? msg : [msg]
    for (const m of batch) handle(m).catch((e) => m.id != null && fail(m.id, -32603, String(e?.message || e)))
  })
}

// Start when run directly (also through an npm bin symlink), not when imported by cli.mjs.
const entry = (() => {
  try {
    return realpathSync(process.argv[1] || "")
  } catch {
    return ""
  }
})()
if (entry && entry === fileURLToPath(import.meta.url)) startServer()
