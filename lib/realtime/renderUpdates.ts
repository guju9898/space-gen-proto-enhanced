import { supabaseBrowser } from "@/lib/supabase/browserClient";
import type { RenderRow } from "@/lib/types/renders";

/**
 * Subscribe to INSERT/UPDATE on public.renders for a single user_id.
 * Returns an unsubscribe function.
 */
export function subscribeToRenderChanges(
  userId: string,
  handlers: {
    onInsert?: (row: RenderRow) => void;
    onUpdate?: (newRow: RenderRow, oldRow?: Partial<RenderRow>) => void;
  }
) {
  const channel = supabaseBrowser
    .channel(`renders:${userId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "renders",
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        handlers.onInsert?.(payload.new as RenderRow);
      }
    )
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "renders",
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        handlers.onUpdate?.(payload.new as RenderRow, payload.old as Partial<RenderRow>);
      }
    )
    .subscribe();

  return () => {
    supabaseBrowser.removeChannel(channel);
  };
}
