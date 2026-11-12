/**
 * Keys the prompt builders ignore when another field is set (see lib/api/buildGeminiPrompt.ts):
 * exteriorType wins over buildingType, architecturalStyle/themeStyle replace style,
 * gardenType wins over landscapeType. The summary hides the ignored one so it
 * shows exactly what the render will ask for.
 */
const SUPERSEDED_BY: Record<string, string[]> = {
  buildingType: ["exteriorType"],
  style: ["architecturalStyle", "themeStyle"],
  landscapeType: ["gardenType"],
}

function filled(v: unknown): boolean {
  if (typeof v === "number") return true
  return typeof v === "string" && v.trim() !== "" && v.trim().toLowerCase() !== "none"
}

export function isSupersededKey(key: string, config: Record<string, unknown>): boolean {
  return (SUPERSEDED_BY[key] ?? []).some((k) => filled(config[k]))
}
