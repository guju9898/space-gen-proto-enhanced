import { supabaseBrowser } from "@/lib/supabase/browserClient";
import { getUserRenders } from "@/lib/data/getUserRenders";

/**
 * Dev-only helper for console testing.
 * Run in browser console while signed in:
 * import("/src/lib/dev/testRendersClient.ts").then(m => m.devListMyRenders(10))
 */
export async function devListMyRenders(limit = 5) {
  try {
    const { data: userRes, error: userErr } = await supabaseBrowser.auth.getUser();
    if (userErr || !userRes?.user) throw new Error("Not signed in. Log in first.");
    const userId = userRes.user.id;

    const { data, error } = await getUserRenders(supabaseBrowser, userId, { limit });
    if (error) throw new Error(error);

    console.table(
      data.map((r) => ({
        id: r.id,
        status: r.status,
        created_at: r.created_at,
        image_url:
          r.image_url?.slice(0, 60) +
          (r.image_url && r.image_url.length > 60 ? "..." : ""),
        prompt:
          r.prompt?.slice(0, 60) +
          (r.prompt && r.prompt.length > 60 ? "..." : ""),
      }))
    );
    return data;
  } catch (e: any) {
    console.error("[devListMyRenders] Error:", e?.message ?? e);
    throw e;
  }
}
