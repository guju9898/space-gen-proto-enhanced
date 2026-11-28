---
name: renderspace
description: Turn a job-site photo into a photorealistic design concept (pool, patio, outdoor kitchen, landscape, exterior or interior) with the Renderspace API. Use when someone wants to visualize a backyard, pool, hardscape, facade or room redesign from a real photo, or show a client the finished project before a quote.
---

# Renderspace

Renderspace turns a photo of a real property into a photorealistic concept in about 30 seconds. Each successful render costs 2 credits.

## Setup

1. Get an API key at https://www.renderspace.ai/developers (Professional or Business plan).
2. Export it: `export RENDERSPACE_API_KEY=rs_live_...`

If the Renderspace MCP server is connected (tools `create_render`, `get_render`, `list_renders`, `get_credits`), use those tools. Otherwise call the REST API below.

## Create a render

```bash
curl -s https://www.renderspace.ai/api/v1/renders \
  -H "Authorization: Bearer $RENDERSPACE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "space_type": "landscape",
    "image_url": "https://example.com/backyard.jpg",
    "instruction": "Modern backyard with a linear pool, travertine deck and warm evening lighting"
  }'
```

- `space_type`: `landscape` (yards, pools, patios, outdoor kitchens), `exterior` (facades, curb appeal) or `interior` (rooms).
- `image_url`: a public HTTPS photo URL. To upload a local file, send multipart form data with an `image` field instead.
- `instruction`: the design brief in plain language. Be specific about materials, style and lighting.
- Optional: `realism` (0-100), `idempotency_key` (reusing it returns the earlier render).

The call is synchronous and returns the render with `status` and `image_url`. Show the user `image_url`.

## Other calls

- `GET /api/v1/renders/{id}`: one render.
- `GET /api/v1/renders?limit=20`: recent renders.
- `GET /api/v1/credits`: remaining credits (free).

## Tips

- One change per render keeps the rest of the scene stable; describe what must stay the same ("keep the house and fence exactly as in the photo").
- Shoot the source photo straight on, in daylight, with the whole area in frame.
- Renders are design concepts, not construction drawings or permit sets.

Docs: https://www.renderspace.ai/developers · OpenAPI: https://www.renderspace.ai/openapi/v1.yaml
