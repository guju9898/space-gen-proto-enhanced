"use client"

/**
 * Human Polish™ intake — draft lifecycle + persistence hook.
 *
 * Owns the client wizard state and wires it to the foundation routes:
 *   - POST /api/human-polish/draft          → create draft, receive requestId + draftToken
 *   - POST /api/human-polish/draft/recover  → recover within the 15-minute window
 *
 * The requestId + draftToken are persisted to localStorage (see intakeStorage)
 * so the flow survives reloads and supports recovery. The server remains the
 * authority for pricing, promotion, delivery target, and first-batch size —
 * those values are only ever read from the server responses, never computed here.
 */

import { useCallback, useEffect, useRef, useState } from "react"
import type {
  HumanPolishCustomerRole,
  HumanPolishPackage,
  HumanPolishPreferredContactMethod,
  HumanPolishProjectType,
  HumanPolishServiceFamily,
} from "@/lib/human-polish/types"
import { EMPTY_INTAKE_FORM, INTAKE_STEP_IDS, type IntakeStepId } from "./intakeConfig"
import type { DraftSession, IntakeFormData, UploadedFile } from "./intakeTypes"
import {
  clearActiveIntake,
  isSessionFresh,
  loadActiveIntake,
  saveActiveIntake,
} from "./intakeStorage"

type FlowStatus = "idle" | "creating" | "ready" | "error"

interface UseIntakeFlowArgs {
  family: HumanPolishServiceFamily
  pkg: HumanPolishPackage
  leadSource: string | null
}

interface DraftCreateResponse {
  requestId: string
  draftToken: string
  expiresAt: string
  family: HumanPolishServiceFamily
  package: HumanPolishPackage
  standardAmountCents: number | null
  currency: string
  deliveryTarget: string | null
  firstBatchSize?: number | null
  promotionType?: string
}

interface DraftRecoverResponse {
  requestId: string
  status: string
  family: HumanPolishServiceFamily
  package: HumanPolishPackage
  expiresAt: string
  standardAmountCents: number | null
  currency: string
  deliveryTarget: string | null
  firstBatchSize: number | null
  promotionType: string
  [key: string]: unknown
}

function str(value: unknown): string {
  return typeof value === "string" ? value : ""
}

function bool(value: unknown): boolean {
  return value === true
}

/** Map the safe recover response onto the client form shape. */
function formFromRecover(data: DraftRecoverResponse): Partial<IntakeFormData> {
  return {
    contactName: str(data.contactName),
    contactEmail: str(data.contactEmail),
    contactPhone: str(data.contactPhone),
    companyName: str(data.companyName),
    customerRole: (str(data.customerRole) as HumanPolishCustomerRole) || "",
    preferredContactMethod:
      (str(data.preferredContactMethod) as HumanPolishPreferredContactMethod) || "",
    projectType: (str(data.projectType) as HumanPolishProjectType) || "",
    projectName: str(data.projectName),
    projectAddress: str(data.projectAddress),
    projectCity: str(data.projectCity),
    projectState: str(data.projectState),
    briefText: str(data.briefText),
    budgetBand: str(data.budgetBand),
    deadlineDate: str(data.deadlineDate),
    hasApprovedConcept: bool(data.hasApprovedConcept),
    secondPropertyRequested: bool(data.secondPropertyRequested),
    hasPropertySurvey: bool(data.hasPropertySurvey),
    designObjectives: str(data.designObjectives),
    mustHaveElements: str(data.mustHaveElements),
    avoidElements: str(data.avoidElements),
    materialPreferences: str(data.materialPreferences),
    clientWords: str(data.clientWords),
    successDefinition: str(data.successDefinition),
    rushRequested: bool(data.rushRequested),
    brandingRequested: bool(data.brandingRequested),
    brandPhone: str(data.brandPhone),
    brandWebsite: str(data.brandWebsite),
    brandNotes: str(data.brandNotes),
    marketingPermission: bool(data.marketingPermission),
  }
}

async function readError(res: Response, fallback: string): Promise<string> {
  try {
    const body = (await res.json()) as { error?: string }
    return body?.error ?? fallback
  } catch {
    return fallback
  }
}

export function useIntakeFlow({ family, pkg, leadSource }: UseIntakeFlowArgs) {
  const [session, setSession] = useState<DraftSession | null>(null)
  const [form, setForm] = useState<IntakeFormData>(EMPTY_INTAKE_FORM)
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [stepId, setStepId] = useState<IntakeStepId>(INTAKE_STEP_IDS[0])
  const [status, setStatus] = useState<FlowStatus>("idle")
  const [error, setError] = useState<string | null>(null)
  const [now, setNow] = useState<number>(() => Date.now())
  const [restorePrompt, setRestorePrompt] = useState<DraftSession | null>(null)

  const hydratedRef = useRef(false)

  // Restore a persisted, still-fresh draft for the same family + package.
  useEffect(() => {
    if (hydratedRef.current) return
    hydratedRef.current = true
    const persisted = loadActiveIntake()
    if (!persisted) return
    if (!isSessionFresh(persisted.session)) {
      clearActiveIntake()
      return
    }
    if (persisted.session.family === family && persisted.session.package === pkg) {
      setSession(persisted.session)
      setForm(persisted.form)
      setUploadedFiles(persisted.uploadedFiles)
      if ((INTAKE_STEP_IDS as readonly string[]).includes(persisted.stepId)) {
        setStepId(persisted.stepId as IntakeStepId)
      }
      setStatus("ready")
    } else {
      // A different draft is in progress; offer to resume it rather than clobber.
      setRestorePrompt(persisted.session)
    }
  }, [family, pkg])

  // Persist whenever meaningful state changes and a draft exists.
  useEffect(() => {
    if (!session) return
    saveActiveIntake({ session, form, uploadedFiles, stepId, savedAt: Date.now() })
  }, [session, form, uploadedFiles, stepId])

  // Tick for the recovery-window countdown.
  useEffect(() => {
    if (!session) return
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [session])

  const createDraft = useCallback(async () => {
    setStatus("creating")
    setError(null)
    try {
      const res = await fetch("/api/human-polish/draft", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ family, package: pkg, leadSource }),
      })
      if (!res.ok) {
        setError(await readError(res, "Could not start your request. Please try again."))
        setStatus("error")
        return
      }
      const data = (await res.json()) as DraftCreateResponse
      const next: DraftSession = {
        requestId: data.requestId,
        draftToken: data.draftToken,
        family: data.family,
        package: data.package,
        expiresAt: data.expiresAt,
        standardAmountCents: data.standardAmountCents,
        currency: data.currency,
        deliveryTarget: data.deliveryTarget ?? null,
        firstBatchSize: data.firstBatchSize ?? null,
        promotionType: data.promotionType ?? "none",
        status: "draft",
      }
      setSession(next)
      setStatus("ready")
    } catch {
      setError("Network error while starting your request. Please try again.")
      setStatus("error")
    }
  }, [family, pkg, leadSource])

  const recoverDraft = useCallback(
    async (requestId: string, draftToken: string): Promise<{ ok: boolean; error?: string }> => {
      setError(null)
      try {
        const res = await fetch("/api/human-polish/draft/recover", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ requestId: requestId.trim(), draftToken: draftToken.trim() }),
        })
        if (!res.ok) {
          const message = await readError(res, "That draft could not be recovered.")
          return { ok: false, error: message }
        }
        const data = (await res.json()) as DraftRecoverResponse
        const next: DraftSession = {
          requestId: data.requestId,
          draftToken: draftToken.trim(),
          family: data.family,
          package: data.package,
          expiresAt: data.expiresAt,
          standardAmountCents: data.standardAmountCents,
          currency: data.currency,
          deliveryTarget: data.deliveryTarget ?? null,
          firstBatchSize: data.firstBatchSize ?? null,
          promotionType: data.promotionType ?? "none",
          status: data.status,
        }
        // Prefer any locally-cached richer state (incl. uploaded file list) for
        // this same requestId; otherwise hydrate from the server's safe fields.
        const persisted = loadActiveIntake()
        if (persisted && persisted.session.requestId === data.requestId) {
          setForm({ ...persisted.form, ...formFromRecover(data) })
          setUploadedFiles(persisted.uploadedFiles)
        } else {
          setForm({ ...EMPTY_INTAKE_FORM, ...formFromRecover(data) })
          setUploadedFiles([])
        }
        setSession(next)
        setStepId(INTAKE_STEP_IDS[0])
        setStatus("ready")
        setRestorePrompt(null)
        return { ok: true }
      } catch {
        return { ok: false, error: "Network error while recovering your draft." }
      }
    },
    [],
  )

  const resumePersisted = useCallback(async () => {
    const persisted = loadActiveIntake()
    if (!persisted) {
      setRestorePrompt(null)
      return
    }
    await recoverDraft(persisted.session.requestId, persisted.session.draftToken)
  }, [recoverDraft])

  const dismissRestore = useCallback(() => setRestorePrompt(null), [])

  const updateForm = useCallback((patch: Partial<IntakeFormData>) => {
    setForm((prev) => ({ ...prev, ...patch }))
  }, [])

  const addUploadedFile = useCallback((file: UploadedFile) => {
    setUploadedFiles((prev) =>
      prev.some((f) => f.objectPath === file.objectPath) ? prev : [...prev, file],
    )
  }, [])

  const resetDraft = useCallback(() => {
    clearActiveIntake()
    setSession(null)
    setForm(EMPTY_INTAKE_FORM)
    setUploadedFiles([])
    setStepId(INTAKE_STEP_IDS[0])
    setStatus("idle")
    setError(null)
    setRestorePrompt(null)
  }, [])

  const msRemaining = session ? Math.max(0, Date.parse(session.expiresAt) - now) : 0
  const isExpired = Boolean(session) && msRemaining <= 0

  return {
    session,
    form,
    uploadedFiles,
    stepId,
    status,
    error,
    msRemaining,
    isExpired,
    restorePrompt,
    createDraft,
    recoverDraft,
    resumePersisted,
    dismissRestore,
    updateForm,
    addUploadedFile,
    setStepId,
    resetDraft,
  }
}
