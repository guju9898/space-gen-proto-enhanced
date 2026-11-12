/**
 * Relative label for projects.presenting_on (a plain calendar date, YYYY-MM-DD).
 * Compared by local calendar day so "tomorrow" means tomorrow where the user is.
 */

const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})/

function parseDay(iso: string): Date | null {
  const m = DATE_ONLY.exec(iso)
  if (!m) return null
  const y = Number(m[1])
  const mo = Number(m[2])
  const d = Number(m[3])
  const date = new Date(y, mo - 1, d)
  // Reject overflow like 2026-02-31.
  if (date.getFullYear() !== y || date.getMonth() !== mo - 1 || date.getDate() !== d) return null
  return date
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

export function presentingLabel(isoDate: string | null, now: Date = new Date()): string | null {
  if (!isoDate) return null
  const target = parseDay(isoDate)
  if (!target) return null
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const days = Math.round((target.getTime() - today.getTime()) / 86_400_000)

  if (days === 0) return "Presenting today"
  if (days === 1) return "Presenting tomorrow"
  if (days === -1) return "Presented yesterday"
  if (days < 0) return `Presented ${MONTHS[target.getMonth()]} ${target.getDate()}`
  const base = `Presenting ${MONTHS[target.getMonth()]} ${target.getDate()}`
  return target.getFullYear() !== today.getFullYear() ? `${base}, ${target.getFullYear()}` : base
}

/** Local calendar date as YYYY-MM-DD (for <input type="date"> and the DB date column). */
export function toDateInputValue(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

/** True for a real YYYY-MM-DD calendar date. */
export function isValidDateOnly(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && parseDay(value) !== null
}
