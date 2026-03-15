/**
 * Generate a URL-safe share slug from a project name.
 * Produces a lowercase, hyphenated base plus a short random suffix for uniqueness.
 *
 * @example
 * generateSlug("Backyard Renovation") // => "backyard-renovation-x3k9"
 */

export function generateSlug(name: string): string {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")

  const suffix = Math.random().toString(36).slice(2, 6)

  return base ? `${base}-${suffix}` : suffix
}
