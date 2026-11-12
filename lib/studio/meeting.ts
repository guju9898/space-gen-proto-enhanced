/** Demo question (spec section 3): when the contractor is showing the client. */
export const MEETING_STORAGE_KEY = "rs_meeting"

export const MEETING_OPTIONS = [
  { id: "today", label: "Today" },
  { id: "this-week", label: "This week" },
  { id: "exploring", label: "Just exploring" },
] as const

export type MeetingId = (typeof MEETING_OPTIONS)[number]["id"]

export function isMeetingId(v: unknown): v is MeetingId {
  return v === "today" || v === "this-week" || v === "exploring"
}

/** The nudge after a demo render. Uses only what the contractor told us; no invented deadline. */
export function meetingNudge(meeting: MeetingId | null): string {
  if (meeting === "today") return "Showing the client today? Send them this design as a link before you meet."
  if (meeting === "this-week") return "Meeting this week? Send this design ahead so the client has seen it before you sit down."
  return "Like it? Send it to the client as a view-only link."
}
