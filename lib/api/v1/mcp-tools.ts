/**
 * MCP tool descriptors for the public REST API.
 * Descriptors only — no MCP server runtime. See docs/marketplace/mcp-wrapper.md.
 */

export type McpToolName = "create_render" | "get_render" | "list_renders" | "get_credits"

export type McpJsonSchema = {
  type: "object"
  required?: string[]
  properties: Record<string, unknown>
  additionalProperties?: boolean
}

export type McpToolDescriptor = {
  name: McpToolName
  description: string
  method: "GET" | "POST"
  /** Path relative to /api/v1 */
  path: string
  inputSchema: McpJsonSchema
}

export const MCP_TOOLS: readonly McpToolDescriptor[] = [
  {
    name: "create_render",
    description:
      "Create a photorealistic landscape, exterior, or interior concept from a job-site photo URL. Synchronous; charges 2 credits on success. Returns image_url when completed.",
    method: "POST",
    path: "/renders",
    inputSchema: {
      type: "object",
      required: ["space_type", "image_url", "instruction"],
      additionalProperties: false,
      properties: {
        space_type: {
          type: "string",
          enum: ["landscape", "exterior", "interior"],
          description: "Studio space type for the render.",
        },
        image_url: {
          type: "string",
          format: "uri",
          description: "Public HTTPS URL of the source photo.",
        },
        instruction: {
          type: "string",
          description: "Natural-language design brief.",
        },
        options: {
          type: "object",
          additionalProperties: true,
          description: "Optional structured Studio-like options.",
        },
        prompt: {
          type: "string",
          description: "Optional full prompt override.",
        },
        realism: {
          type: "number",
          minimum: 0,
          maximum: 100,
        },
        idempotency_key: {
          type: "string",
          description: "If reused, returns the prior render for this key.",
        },
      },
    },
  },
  {
    name: "get_render",
    description: "Fetch a single render by id (UUID).",
    method: "GET",
    path: "/renders/{id}",
    inputSchema: {
      type: "object",
      required: ["id"],
      additionalProperties: false,
      properties: {
        id: {
          type: "string",
          format: "uuid",
          description: "Render id from create_render.",
        },
      },
    },
  },
  {
    name: "list_renders",
    description: "List recent renders for the API key owner (newest first).",
    method: "GET",
    path: "/renders",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      properties: {
        limit: {
          type: "integer",
          minimum: 1,
          maximum: 100,
          default: 20,
          description: "Max rows to return.",
        },
      },
    },
  },
  {
    name: "get_credits",
    description:
      "Return remaining credits and plan for the API key owner. Does not consume credits. API renders cost 2 credits each.",
    method: "GET",
    path: "/credits",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      properties: {},
    },
  },
] as const

export function getMcpTool(name: McpToolName): McpToolDescriptor | undefined {
  return MCP_TOOLS.find((t) => t.name === name)
}
