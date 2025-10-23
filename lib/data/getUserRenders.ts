import type { RenderRow } from "@/lib/types/renders";

// Works with either a browser or server Supabase client.
// Expect caller to pass an authenticated client (session present).
export async function getUserRenders(
  supabase: {
    from: Function;
  },
  userId: string,
  opts?: { limit?: number; offset?: number }
): Promise<{ data: RenderRow[]; error: string | null }> {
  const limit = opts?.limit ?? 20;
  const offset = opts?.offset ?? 0;

  const { data, error } = await supabase
    .from("renders")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    return { data: [], error: error.message ?? "Failed to fetch renders" };
  }
  // Type hinting
  return { data: (data as RenderRow[]) ?? [], error: null };
}
