# Marketplace & integration artifacts

Practical listing notes for third-party catalogs. These docs do **not** sign you up for marketplaces — they describe how to publish once accounts exist.

## Index

| Artifact | Checklist | Path |
| --- | --- | --- |
| Postman public workspace + RapidAPI import | #9 | [postman-rapidapi.md](./postman-rapidapi.md) |
| n8n / Make.com sample workflow | #10 | [n8n-make.md](./n8n-make.md) |
| MCP tool stub (`create_render`, …) | #11 | [mcp-wrapper.md](./mcp-wrapper.md) · `lib/api/v1/mcp-tools.ts` |

## API references

- Product docs: [https://www.renderspace.ai/developers](https://www.renderspace.ai/developers)
- OpenAPI (live): [https://www.renderspace.ai/openapi/v1.yaml](https://www.renderspace.ai/openapi/v1.yaml)
- OpenAPI (repo): `openapi/v1.yaml` ≡ `public/openapi/v1.yaml`
- Internal status / env: [`docs/public-api-v1.md`](../public-api-v1.md)

## Quick facts

- Base: `https://www.renderspace.ai/api/v1`
- Auth: `Authorization: Bearer rs_live_…`
- **2 credits** per successful `POST /renders`
- **Sync `POST /renders`** plus optional completion **webhooks** (session-registered)
- **CORS** on Bearer routes (`PUBLIC_API_CORS_ORIGINS`); cookie routes stay same-origin
