import { getUserRenders } from "@/lib/data/getUserRenders";
import type { RenderRow } from "@/lib/types/renders";
import { hasActiveRenders, indexById } from "./statusHelpers";
import { supabaseBrowser } from "@/lib/supabase/browserClient";

export type Diff = {
  inserted: RenderRow[];
  updated: Array<{ before: RenderRow; after: RenderRow }>;
};

export function diffRenders(prev: RenderRow[], next: RenderRow[]): Diff {
  const a = indexById(prev);
  const b = indexById(next);
  const inserted: RenderRow[] = [];
  const updated: Array<{ before: RenderRow; after: RenderRow }> = [];

  for (const [id, row] of b) {
    const old = a.get(id);
    if (!old) inserted.push(row);
    else if (
      old.status !== row.status ||
      old.image_url !== row.image_url ||
      old.prompt !== row.prompt
    ) {
      updated.push({ before: old, after: row });
    }
  }
  return { inserted, updated };
}

/**
 * Start adaptive polling:
 * - Polls frequently (2–3s) while there are active renders.
 * - Backs off to 10s when everything is terminal.
 * Returns a stop() function.
 */
export function startRenderPolling(
  userId: string,
  opts: {
    pageSize?: number;
    onSnapshot: (rows: RenderRow[], diff?: Diff) => void;
    getPrev?: () => RenderRow[];
  }
) {
  let stopped = false;
  let timer: any = null;

  const loop = async () => {
    if (stopped) return;
    try {
      const { data, error } = await getUserRenders(supabaseBrowser, userId, { limit: opts.pageSize ?? 18, offset: 0 });
      if (error) throw new Error(error);
      const prev = opts.getPrev?.() ?? [];
      const d = diffRenders(prev, data);
      opts.onSnapshot(data, d);

      const active = hasActiveRenders(data);
      const nextDelay = active ? 2500 : 10000; // 2.5s while active, 10s otherwise
      timer = setTimeout(loop, nextDelay);
    } catch (_e) {
      // on error, slow backoff
      timer = setTimeout(loop, 12000);
    }
  };

  loop();

  return () => {
    stopped = true;
    if (timer) clearTimeout(timer);
  };
}
