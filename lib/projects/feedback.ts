/** Reasons offered after a thumbs-down (spec Phase 2). Short ids are stored, labels shown. */
export const FEEDBACK_REASONS = [
  { id: "changed_structure", label: "Changed the house or layout" },
  { id: "ignored_request", label: "Ignored what I asked for" },
  { id: "not_realistic", label: "Doesn't look real" },
  { id: "wrong_style", label: "Wrong style or materials" },
  { id: "low_quality", label: "Blurry or low quality" },
] as const

export type FeedbackReasonId = (typeof FEEDBACK_REASONS)[number]["id"]
