/**
 * Studio v2 (Wave 2 redesign) rollout switch.
 * On for everyone when NEXT_PUBLIC_STUDIO_V2 === "true". Otherwise per browser:
 * visit any Studio with ?studio_v2=1 to turn it on (cookie, 30 days) and
 * ?studio_v2=0 to turn it off again. Default: off.
 */
export const STUDIO_V2_COOKIE = "rs_studio_v2"

export function studioV2Enabled(input: {
  env: string | undefined
  cookie: string
  search: string
}): { enabled: boolean; setCookie: "1" | "0" | null } {
  const param = new URLSearchParams(input.search).get("studio_v2")
  if (param === "1") return { enabled: true, setCookie: "1" }
  if (param === "0") return { enabled: input.env === "true", setCookie: "0" }
  if (input.env === "true") return { enabled: true, setCookie: null }
  const match = input.cookie.match(new RegExp(`(?:^|;\\s*)${STUDIO_V2_COOKIE}=([^;]+)`))
  return { enabled: match?.[1] === "1", setCookie: null }
}
