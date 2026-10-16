/**
 * Vision quality check + SEO text for a finished content render (server-only).
 * Uses the same OpenRouter key as the studios, with a text+vision model.
 */

const MODEL = "google/gemini-2.5-flash"

export type RenderDescription = {
  qcScore: number
  qcNotes: string
  title: string
  altText: string
  description: string
  tags: string[]
}

export function buildDescribePrompt(input: {
  conceptLabel: string
  region: string | null
  fromPhoto: boolean
  requested?: string[]
}): string {
  const requested = (input.requested ?? []).slice(0, 6)
  return [
    "You are reviewing an AI concept rendering made by Renderspace for a contractor's marketing gallery.",
    `Intended concept: ${input.conceptLabel}.${input.region ? ` Region style: ${input.region}.` : ""}`,
    input.fromPhoto ? "It was generated from a photo of a real space." : "It was generated from a text prompt only.",
    ...(requested.length
      ? [
          "Requested details (custom materials and focal objects):",
          ...requested.map((r) => `- ${r}`),
          "Check each one is visibly represented. Lower qc_score by 1-2 if a requested material or focal object is clearly missing or wrong, and name it in qc_notes. In the title, alt text and description, name the materials and objects you can actually see, not ones that are missing.",
        ]
      : []),
    "Return ONLY a JSON object with these keys:",
    '- "qc_score": integer 1-10. 9-10 = photorealistic, correct scale, clean edges, no warped geometry, no text, no watermark, no people, matches the concept. 6-8 = minor flaws. 1-5 = obvious AI artifacts, melted or impossible structures, garbled text, people, or does not match the concept.',
    '- "qc_notes": one short sentence naming the main flaw, or "clean" if none.',
    '- "title": a descriptive title under 60 characters that names the standout material or feature, e.g. "Formal Courtyard With Slate Paving and Bronze Statues".',
    '- "alt_text": a literal description of what is visible, under 125 characters, no "image of".',
    '- "description": 60-110 words describing the design for a homeowner or contractor: layout, materials, plants, lighting, how the space would be used. Plain and factual. No prices, no claims about Renderspace, no invented locations or clients.',
    '- "tags": 3-6 lowercase keywords people search for, e.g. ["pool deck", "travertine", "backyard pool ideas"].',
  ].join("\n")
}

/** Pull the first JSON object out of a model reply (tolerates code fences). */
export function parseDescription(raw: string): RenderDescription | null {
  const start = raw.indexOf("{")
  const end = raw.lastIndexOf("}")
  if (start === -1 || end <= start) return null
  let data: Record<string, unknown>
  try {
    data = JSON.parse(raw.slice(start, end + 1))
  } catch {
    return null
  }
  const str = (v: unknown, max: number) => (typeof v === "string" ? v.replace(/\s+/g, " ").trim().slice(0, max) : "")
  const score = Math.round(Number(data.qc_score))
  if (!Number.isFinite(score) || score < 1 || score > 10) return null
  const title = str(data.title, 70)
  const altText = str(data.alt_text, 140)
  const description = str(data.description, 900)
  if (!title || !altText || !description) return null
  const tags = Array.isArray(data.tags)
    ? data.tags.filter((t): t is string => typeof t === "string").map((t) => t.toLowerCase().trim().slice(0, 40)).filter(Boolean).slice(0, 6)
    : []
  return { qcScore: score, qcNotes: str(data.qc_notes, 200) || "clean", title, altText, description, tags }
}

export async function describeRender(input: {
  imageUrl: string
  conceptLabel: string
  region: string | null
  fromPhoto: boolean
  requested?: string[]
}): Promise<{ data: RenderDescription | null; error?: string }> {
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) return { data: null, error: "OPENROUTER_API_KEY is not set" }
  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://renderspace.ai",
        "X-Title": "Renderspace AI",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: buildDescribePrompt(input) },
              { type: "image_url", image_url: { url: input.imageUrl } },
            ],
          },
        ],
        temperature: 0.2,
      }),
    })
    if (!res.ok) {
      const body = await res.text().catch(() => "")
      return { data: null, error: `OpenRouter ${res.status}: ${body.slice(0, 160)}` }
    }
    const json = (await res.json()) as { choices?: { message?: { content?: unknown } }[] }
    const content = json.choices?.[0]?.message?.content
    const text = typeof content === "string"
      ? content
      : Array.isArray(content)
        ? content.map((p: { text?: string }) => p?.text ?? "").join("")
        : ""
    const parsed = parseDescription(text)
    return parsed ? { data: parsed } : { data: null, error: `Could not read the model's reply: ${text.slice(0, 120)}` }
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : "request failed" }
  }
}

export function publicSlugFor(job: { id: string; slug: string | null; title: string | null }): string {
  const base = (job.slug || job.title || "concept")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70)
  return `${base}-${job.id.replace(/-/g, "").slice(0, 6)}`
}
