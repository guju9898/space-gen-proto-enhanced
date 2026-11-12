import { uploadBase64ToSupabase } from "@/lib/api/uploadBase64ToSupabase"

/** True for URLs already in this project's public storage (they never expire). */
export function isOwnStorageUrl(url: string, supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || ""): boolean {
  if (!supabaseUrl) return false
  try {
    const host = new URL(supabaseUrl).host
    const u = new URL(url)
    return u.host === host && u.pathname.startsWith("/storage/v1/object/public/")
  } catch {
    return false
  }
}

const MAX_BYTES = 20 * 1024 * 1024

/**
 * Returns a permanent URL for a render: our own storage URLs pass through; data: URLs
 * and provider URLs (Replicate's expire after about an hour) are copied into the
 * renders bucket at `path`. Returns null if the image can't be kept.
 */
export async function keepImage(imageUrl: string, path: string): Promise<string | null> {
  if (isOwnStorageUrl(imageUrl)) return imageUrl
  if (imageUrl.startsWith("data:image")) {
    return uploadBase64ToSupabase({ base64DataUrl: imageUrl, filePath: path })
  }
  if (!/^https:\/\//.test(imageUrl)) return null
  try {
    const res = await fetch(imageUrl)
    if (!res.ok) return null
    const bytes = Buffer.from(await res.arrayBuffer())
    if (bytes.length === 0 || bytes.length > MAX_BYTES) return null
    return uploadBase64ToSupabase({ base64DataUrl: `data:image/png;base64,${bytes.toString("base64")}`, filePath: path })
  } catch {
    return null
  }
}
