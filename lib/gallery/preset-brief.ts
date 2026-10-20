/** User-editable design note carried on a gallery preset. Capped and stripped before it can reach a prompt. */

/** Keep what the visitor is typing. The prompt sanitizer runs again at generation time. */
export function editPresetBrief(raw: string): string {
  return raw.replace(/[\u0000-\u001F\u007F<>]/g, "").slice(0, 240)
}

const MAX_BRIEF = 240

export function sanitizePresetBrief(raw: unknown): string | null {
  if (typeof raw !== "string") return null
  const cleaned = raw
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/[<>]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
  if (cleaned.length < 3) return null
  return cleaned.slice(0, MAX_BRIEF)
}
