/**
 * Which config keys belong in "This render will ask for".
 * Hides fields the prompt ignores in favour of a preferred key.
 */

function hasValue(value: unknown): boolean {
  if (value == null) return false
  if (typeof value === "string") {
    const t = value.trim().toLowerCase()
    return t !== "" && t !== "none"
  }
  if (typeof value === "number") return true
  return false
}

/**
 * Returns false for duplicate / ignored keys:
 * - buildingType when exteriorType is set (exteriorType wins in the prompt)
 * - style when architecturalStyle or themeStyle is set
 */
export function shouldShowSummaryKey(
  key: string,
  config: Record<string, unknown> | null | undefined
): boolean {
  if (!config) return true
  if (key === "buildingType" && hasValue(config.exteriorType)) return false
  if (key === "style" && (hasValue(config.architecturalStyle) || hasValue(config.themeStyle))) {
    return false
  }
  return true
}
