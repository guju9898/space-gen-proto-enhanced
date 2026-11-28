#!/usr/bin/env node
// Renderspace CLI. Usage: renderspace <command> [options]

import { VERSION, callApi } from "./lib.mjs"

const HELP = `renderspace ${VERSION} - photorealistic design concepts from a job-site photo

Usage:
  renderspace render --type <landscape|exterior|interior> --image <url> --instruction "<brief>" [--realism 0-100]
  renderspace get <render-id>
  renderspace list [--limit 20]
  renderspace credits
  renderspace mcp            Start the MCP server on stdio (for Claude, Cursor and other agents)

Environment:
  RENDERSPACE_API_KEY   required. Create one at https://www.renderspace.ai/developers
  RENDERSPACE_API_BASE  optional, defaults to https://www.renderspace.ai/api/v1

Each successful render costs 2 credits.`

function flags(argv) {
  const out = { _: [] }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a.startsWith("--")) {
      const k = a.slice(2)
      const v = argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[++i] : true
      out[k] = v
    } else out._.push(a)
  }
  return out
}

async function main() {
  const [cmd, ...rest] = process.argv.slice(2)
  const f = flags(rest)
  if (!cmd || cmd === "help" || cmd === "--help" || cmd === "-h") return console.log(HELP)
  if (cmd === "--version" || cmd === "-v") return console.log(VERSION)
  if (cmd === "mcp") {
    const { startServer } = await import("./server.mjs")
    return startServer()
  }
  let data
  if (cmd === "render") {
    if (!f.type || !f.image || !f.instruction) throw new Error("render needs --type, --image and --instruction")
    const args = { space_type: f.type, image_url: f.image, instruction: f.instruction }
    if (f.realism != null) args.realism = Number(f.realism)
    data = await callApi("create_render", args)
  } else if (cmd === "get") {
    data = await callApi("get_render", { id: f._[0] })
  } else if (cmd === "list") {
    data = await callApi("list_renders", f.limit ? { limit: Number(f.limit) } : {})
  } else if (cmd === "credits") {
    data = await callApi("get_credits", {})
  } else {
    throw new Error(`Unknown command: ${cmd}\n\n${HELP}`)
  }
  console.log(JSON.stringify(data, null, 2))
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : String(e))
  process.exit(1)
})
