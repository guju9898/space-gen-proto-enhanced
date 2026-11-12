/**
 * What a Studio field should store for text the user typed.
 * An exact (case-insensitive) match picks that option; anything else is kept as
 * typed. A partial match never replaces the text: typing "deck" must not become
 * "wood deck", and "travertine pavers" must not become "pavers".
 */
export function resolveTypedValue(typed: string, options: readonly string[]): string {
  const text = typed.replace(/\s+/g, " ").trim()
  if (!text) return ""
  const exact = options.find((option) => option.toLowerCase() === text.toLowerCase())
  return exact ?? text
}

/** True when the stored value is not one of the listed options (a custom string). */
export function isCustomValue(value: string | null | undefined, options: readonly string[]): boolean {
  if (!value) return false
  return !options.some((option) => option.toLowerCase() === value.toLowerCase())
}
