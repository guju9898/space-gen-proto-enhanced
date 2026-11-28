# Renderspace MCP server and CLI

Turn a job-site photo into a photorealistic pool, patio, outdoor kitchen, landscape, exterior or interior concept in about 30 seconds, from any AI agent or your terminal.

Official integration for [Renderspace](https://www.renderspace.ai). Works with Claude, ChatGPT, Cursor, Windsurf, Manus, n8n and any client that speaks the [Model Context Protocol](https://modelcontextprotocol.io).

## Tools

| Tool | What it does | Credits |
| --- | --- | --- |
| `create_render` | Photo URL + plain-language brief → finished concept image (`image_url`) | 2 per render |
| `get_render` | Fetch one render by id | free |
| `list_renders` | Your recent renders, newest first | free |
| `get_credits` | Remaining credits and plan | free |

You need a Renderspace API key (Professional or Business plan). Create one at [renderspace.ai/developers](https://www.renderspace.ai/developers).

## Option 1: hosted server (no install)

Point any MCP client that supports remote servers at:

```
https://www.renderspace.ai/api/mcp
```

with the header `Authorization: Bearer <your API key>`.

## Option 2: local server (stdio)

Claude Desktop, Cursor, Windsurf and most clients:

```json
{
  "mcpServers": {
    "renderspace": {
      "command": "npx",
      "args": ["-y", "renderspace-mcp"],
      "env": { "RENDERSPACE_API_KEY": "rs_live_..." }
    }
  }
}
```

Claude Code:

```bash
claude mcp add renderspace -e RENDERSPACE_API_KEY=rs_live_... -- npx -y renderspace-mcp
```

## CLI

```bash
export RENDERSPACE_API_KEY=rs_live_...
npx -p renderspace-mcp renderspace render --type landscape \
  --image https://example.com/backyard.jpg \
  --instruction "linear pool, travertine deck, warm dusk lighting"
npx -p renderspace-mcp renderspace credits
```

## Example prompts

- "Use Renderspace to show this backyard with a freeform pool and a pergola: <photo URL>"
- "Render three exterior color options for this house photo and give me the image links."
- "How many Renderspace credits do I have left?"

## Links

- Product: https://www.renderspace.ai
- API docs: https://www.renderspace.ai/developers
- OpenAPI: https://www.renderspace.ai/openapi/v1.yaml

Renders are design concepts for presentations, not construction drawings or permit sets.

MIT licensed (this client only; use of the Renderspace service is subject to its terms).
