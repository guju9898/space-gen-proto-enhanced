import { createClient } from "@supabase/supabase-js"

/**
 * SERVER-ONLY SUPABASE STORAGE UPLOAD
 * 
 * This function uses Supabase Service Role key for server-side uploads.
 * It bypasses RLS policies to allow direct storage access from API routes.
 * 
 * IMPORTANT: This function is ONLY called from server-side code:
 * - /api/generate-openrouter/route.ts (server API route)
 * - generateImageFromOpenRouter.ts (server-side function)
 * 
 * The SUPABASE_SERVICE_ROLE_KEY is never exposed to client bundles.
 */
export async function uploadBase64ToSupabase({
  base64DataUrl,
  filePath
}: {
  base64DataUrl: string
  filePath: string
}): Promise<string | null> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      console.error("❌ Supabase environment variables missing", {
        hasUrl: !!supabaseUrl,
        hasServiceRoleKey: !!supabaseServiceRoleKey
      })
      return null
    }

    // Use service role key for server-side uploads (bypasses RLS)
    console.log("🔐 Using Supabase service role for storage upload")
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Extract base64 string (remove data:image/png;base64, prefix if present)
    const base64 = base64DataUrl.includes(",")
      ? base64DataUrl.split(",")[1]
      : base64DataUrl.replace(/^data:image\/\w+;base64,/, "")

    // Convert base64 to Uint8Array buffer
    const binary = Uint8Array.from(atob(base64), (char) => char.charCodeAt(0))

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from("renders")
      .upload(filePath, binary, {
        contentType: "image/png",
        upsert: true
      })

    if (error) {
      console.error("❌ Supabase upload error:", error)
      return null
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from("renders")
      .getPublicUrl(filePath)

    if (!publicUrlData?.publicUrl) {
      console.error("❌ Failed to get public URL from Supabase")
      return null
    }

    console.log("✅ Image uploaded to Supabase:", publicUrlData.publicUrl)
    return publicUrlData.publicUrl
  } catch (e) {
    console.error("❌ Unexpected error in Supabase upload", e)
    return null
  }
}

