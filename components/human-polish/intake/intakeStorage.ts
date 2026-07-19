/**
 * Human Polish™ intake — localStorage persistence.
 *
 * Persists the active draft session (requestId + plaintext draftToken returned
 * once by the server), the in-progress form, and the list of files already
 * registered server-side. This supports:
 *  - reload survival inside the 15-minute draft window, and
 *  - the "recover draft" path (requestId + draftToken → POST /draft/recover).
 *
 * The draftToken is an unguessable server-issued secret; per the spec (§7.3)
 * the client persists it to enable recovery. No pricing or authority lives here.
 */

import type { DraftSession, IntakeFormData, UploadedFile } from "./intakeTypes"

const STORAGE_KEY = "human-polish:intake:v1"

export interface PersistedIntake {
  session: DraftSession
  form: IntakeFormData
  uploadedFiles: UploadedFile[]
  stepId: string
  savedAt: number
}

function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined"
}

export function loadActiveIntake(): PersistedIntake | null {
  if (!canUseStorage()) return null
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as PersistedIntake
    if (!parsed?.session?.requestId || !parsed.session.draftToken) return null
    return parsed
  } catch {
    return null
  }
}

export function saveActiveIntake(state: PersistedIntake): void {
  if (!canUseStorage()) return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...state, savedAt: Date.now() }))
  } catch {
    // Quota or serialization errors are non-fatal; the flow still works in-memory.
  }
}

export function clearActiveIntake(): void {
  if (!canUseStorage()) return
  try {
    window.localStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
}

/** True when the persisted draft is still within its recovery window. */
export function isSessionFresh(session: Pick<DraftSession, "expiresAt">): boolean {
  const expires = Date.parse(session.expiresAt)
  return Number.isFinite(expires) && expires > Date.now()
}
