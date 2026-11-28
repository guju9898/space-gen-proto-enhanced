import { test } from "node:test"
import assert from "node:assert/strict"
import { handleMcpMessage, restRequestFor } from "./mcpHttp"

const noCall = async () => ({ ok: true, data: {} })

test("initialize negotiates a supported protocol version", async () => {
  const r = await handleMcpMessage({ jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2025-03-26" } }, noCall)
  assert.equal((r!.result as { protocolVersion: string }).protocolVersion, "2025-03-26")
  const r2 = await handleMcpMessage({ jsonrpc: "2.0", id: 2, method: "initialize", params: { protocolVersion: "1999-01-01" } }, noCall)
  assert.equal((r2!.result as { protocolVersion: string }).protocolVersion, "2025-06-18")
})

test("tools/list returns the four public API tools", async () => {
  const r = await handleMcpMessage({ jsonrpc: "2.0", id: 1, method: "tools/list" }, noCall)
  const names = (r!.result as { tools: { name: string }[] }).tools.map((t) => t.name).sort()
  assert.deepEqual(names, ["create_render", "get_credits", "get_render", "list_renders"])
})

test("notifications get no response; unknown methods get -32601", async () => {
  assert.equal(await handleMcpMessage({ jsonrpc: "2.0", method: "notifications/initialized" }, noCall), null)
  const r = await handleMcpMessage({ jsonrpc: "2.0", id: 5, method: "nope" }, noCall)
  assert.equal(r!.error!.code, -32601)
})

test("tools/call forwards args and flags API errors", async () => {
  let seen: unknown
  const r = await handleMcpMessage(
    { jsonrpc: "2.0", id: 1, method: "tools/call", params: { name: "get_credits", arguments: {} } },
    async (tool, args) => {
      seen = { tool, args }
      return { ok: false, data: { error: "invalid key" } }
    }
  )
  assert.deepEqual(seen, { tool: "get_credits", args: {} })
  assert.equal((r!.result as { isError?: boolean }).isError, true)
  const bad = await handleMcpMessage({ jsonrpc: "2.0", id: 2, method: "tools/call", params: { name: "drop_db" } }, noCall)
  assert.equal(bad!.error!.code, -32602)
})

test("restRequestFor maps tools to /api/v1 routes", () => {
  assert.deepEqual(restRequestFor("get_render", { id: "abc" }, "https://x.test"), {
    url: "https://x.test/api/v1/renders/abc",
    method: "GET",
    body: undefined,
  })
  assert.equal(restRequestFor("list_renders", { limit: 5 }, "https://x.test").url, "https://x.test/api/v1/renders?limit=5")
  const post = restRequestFor("create_render", { space_type: "landscape" }, "https://x.test")
  assert.equal(post.method, "POST")
  assert.equal(post.body, JSON.stringify({ space_type: "landscape" }))
})
