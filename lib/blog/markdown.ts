import type { BlogCategory, BlogCtaType, BlogPostMeta } from "./types"

const CATEGORIES: BlogCategory[] = [
  "Visualization",
  "Comparison",
  "Human Polish",
  "Workflow",
  "Use case",
]

const CTA_TYPES: BlogCtaType[] = [
  "self-serve",
  "human-polish",
  "build-ready",
  "fork",
]

function asString(value: unknown, field: string): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`Blog frontmatter missing string field: ${field}`)
  }
  return value.trim()
}

function asOptionalString(value: unknown): string | undefined {
  if (value === undefined || value === null || value === "") return undefined
  if (typeof value !== "string") throw new Error("Expected optional string")
  return value.trim()
}

function asStringArray(value: unknown): string[] {
  if (value === undefined || value === null) return []
  if (!Array.isArray(value)) throw new Error("relatedSlugs must be an array")
  return value.map((v) => {
    if (typeof v !== "string" || !v.trim()) {
      throw new Error("relatedSlugs entries must be non-empty strings")
    }
    return v.trim()
  })
}

function parseYamlScalar(raw: string): unknown {
  const t = raw.trim()
  if (t === "null" || t === "~") return null
  if (
    (t.startsWith('"') && t.endsWith('"')) ||
    (t.startsWith("'") && t.endsWith("'"))
  ) {
    return t.slice(1, -1)
  }
  return t
}

/**
 * Minimal YAML frontmatter parser for our controlled blog fields.
 * Supports flat keys and a simple relatedSlugs list.
 */
export function parseFrontmatter(source: string): {
  data: Record<string, unknown>
  content: string
} {
  const trimmed = source.replace(/^\uFEFF/, "")
  if (!trimmed.startsWith("---")) {
    return { data: {}, content: trimmed }
  }
  const end = trimmed.indexOf("\n---", 3)
  if (end === -1) {
    return { data: {}, content: trimmed }
  }
  const yamlBlock = trimmed.slice(3, end).replace(/^\r?\n/, "").replace(/\r/g, "")
  const content = trimmed.slice(end + 4).replace(/^\r?\n/, "")
  const data: Record<string, unknown> = {}
  const lines = yamlBlock.split(/\n/)
  let i = 0
  while (i < lines.length) {
    const line = lines[i]
    if (!line.trim() || line.trim().startsWith("#")) {
      i += 1
      continue
    }
    const match = line.match(/^([A-Za-z][A-Za-z0-9_]*)\s*:\s*(.*)$/)
    if (!match) {
      i += 1
      continue
    }
    const key = match[1]
    const rest = match[2]
    if (rest === "" || rest === "|" || rest === ">") {
      // list or empty
      const items: string[] = []
      i += 1
      while (i < lines.length) {
        const listMatch = lines[i].match(/^\s*-\s+(.+)$/)
        if (!listMatch) break
        items.push(String(parseYamlScalar(listMatch[1])))
        i += 1
      }
      data[key] = items
      continue
    }
    data[key] = parseYamlScalar(rest)
    i += 1
  }
  return { data, content }
}

export function toBlogPostMeta(
  data: Record<string, unknown>,
  fallbackSlug: string
): BlogPostMeta {
  const slug = asString(data.slug ?? fallbackSlug, "slug")
  const category = asString(data.category, "category") as BlogCategory
  if (!CATEGORIES.includes(category)) {
    throw new Error(`Invalid blog category for ${slug}: ${category}`)
  }
  const ctaType = asString(data.ctaType, "ctaType") as BlogCtaType
  if (!CTA_TYPES.includes(ctaType)) {
    throw new Error(`Invalid ctaType for ${slug}: ${ctaType}`)
  }

  return {
    slug,
    title: asString(data.title, "title"),
    seoTitle: asString(data.seoTitle, "seoTitle"),
    description: asString(data.description, "description"),
    excerpt: asString(data.excerpt, "excerpt"),
    category,
    datePublished: asString(data.datePublished, "datePublished"),
    dateModified: asOptionalString(data.dateModified),
    author: asString(data.author, "author"),
    featuredImage: asOptionalString(data.featuredImage),
    featuredImageAlt: asOptionalString(data.featuredImageAlt),
    primaryIntent: asString(data.primaryIntent, "primaryIntent"),
    ctaType,
    relatedSlugs: asStringArray(data.relatedSlugs),
  }
}
