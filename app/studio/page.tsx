import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { LAST_STUDIO_COOKIE, studioEntryHref } from "@/lib/studio/lastStudio"

/** `/studio` reopens the last Studio used (Landscape for new visitors) and keeps the query string. */
export default async function StudioPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (Array.isArray(value)) value.forEach((v) => query.append(key, v))
    else if (value !== undefined) query.set(key, value)
  }
  const cookieStore = await cookies()
  redirect(studioEntryHref(cookieStore.get(LAST_STUDIO_COOKIE)?.value, query.toString()))
}
