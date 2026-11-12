/** Label for a project's "Presenting on" day, relative to `today` (both YYYY-MM-DD, local). */
export function presentingLabel(day: string | null | undefined, today: string): string | null {
  if (!day || !/^\d{4}-\d{2}-\d{2}$/.test(day)) return null
  const d = Date.UTC(+day.slice(0, 4), +day.slice(5, 7) - 1, +day.slice(8, 10))
  const t = Date.UTC(+today.slice(0, 4), +today.slice(5, 7) - 1, +today.slice(8, 10))
  const diff = Math.round((d - t) / 86_400_000)
  const pretty = new Date(d).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" })
  if (diff === 0) return "Presenting today"
  if (diff === 1) return "Presenting tomorrow"
  if (diff > 1) return `Presenting ${pretty}`
  return `Presented ${pretty}`
}

/** Today's date in the browser's time zone as YYYY-MM-DD. */
export function localToday(now = new Date()): string {
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, "0")
  const d = String(now.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}
