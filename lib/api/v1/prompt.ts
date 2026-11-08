import { buildGeminiPrompt } from "@/lib/api/buildGeminiPrompt"
import { buildPrompt } from "@/lib/api/generateImage"

export type SpaceType = "landscape" | "exterior" | "interior"

export type RenderOptions = Record<string, unknown>

function asObject(value: unknown): RenderOptions {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {}
  return value as RenderOptions
}

/**
 * Turn natural-language instruction into structured Studio-like options via OpenRouter.
 * Explicit `options` always win over extracted fields.
 */
export async function structureInstruction(input: {
  spaceType: SpaceType
  instruction: string
  options?: RenderOptions
}): Promise<RenderOptions> {
  const explicit = asObject(input.options)
  const instruction = input.instruction.trim()
  if (!instruction) return explicit

  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) {
    return {
      ...explicit,
      style: typeof explicit.style === "string" ? explicit.style : "modern",
      notes: instruction.slice(0, 500),
    }
  }

  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://www.renderspace.ai",
        "X-Title": "Renderspace Public API",
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini",
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "You convert contractor design requests into structured rendering options for Renderspace. " +
              "Return ONLY a JSON object with common keys: style, mood, colorPalette, lighting, materials, " +
              "and any other short string fields that help a photorealistic render. Do not invent brand names. " +
              `Space type is ${input.spaceType}.`,
          },
          { role: "user", content: instruction.slice(0, 2000) },
        ],
      }),
    })
    if (!res.ok) {
      console.error("[api/v1] structureInstruction OpenRouter error", res.status)
      return { ...explicit, notes: instruction.slice(0, 500) }
    }
    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>
    }
    const raw = data.choices?.[0]?.message?.content || "{}"
    const parsed = asObject(JSON.parse(raw))
    return { ...parsed, ...explicit }
  } catch (error) {
    console.error("[api/v1] structureInstruction failed", error)
    return { ...explicit, notes: instruction.slice(0, 500) }
  }
}

export async function buildPublicApiPrompt(input: {
  spaceType: SpaceType
  instruction?: string | null
  options?: RenderOptions
  promptOverride?: string | null
}): Promise<{ prompt: string; options: RenderOptions }> {
  if (input.promptOverride?.trim()) {
    return {
      prompt: input.promptOverride.trim(),
      options: asObject(input.options),
    }
  }

  const merged = await structureInstruction({
    spaceType: input.spaceType,
    instruction: input.instruction?.trim() || "",
    options: input.options,
  })

  const config: Record<string, unknown> = {
    ...merged,
    style: merged.style || "modern",
    roomType: merged.roomType || "living room",
    designStyle: merged.designStyle || merged.style || "modern",
    advanced: typeof merged.advanced === "object" && merged.advanced ? merged.advanced : {},
  }

  if (input.instruction?.trim() && !merged.notes) {
    config.notes = input.instruction.trim().slice(0, 500)
  }

  const prompt =
    input.spaceType === "interior"
      ? buildPrompt(config)
      : buildGeminiPrompt({
          ...config,
          renderType: input.spaceType,
        })

  return { prompt, options: merged }
}
