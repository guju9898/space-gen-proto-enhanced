import type { RenderRow } from "@/lib/types/renders";

export const TERMINAL_STATUSES = new Set(["succeeded", "failed", "failed_timeout", "canceled"]);

export function hasActiveRenders(rows: RenderRow[]) {
  return rows.some((r) => !TERMINAL_STATUSES.has(r.status));
}

export function indexById(rows: RenderRow[]) {
  const m = new Map<string, RenderRow>();
  for (const r of rows) m.set(r.id, r);
  return m;
}
