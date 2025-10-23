/**
 * Central list of valid render statuses and TS type guards.
 */
export const RENDER_STATUSES = [
  "queued",
  "starting",
  "processing",
  "succeeded",
  "failed",
  "canceled",
  "failed_timeout",
] as const;

export type RenderStatusTuple = typeof RENDER_STATUSES;
export type RenderStatus = RenderStatusTuple[number];
