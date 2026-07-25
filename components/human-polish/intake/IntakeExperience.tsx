"use client"

/**
 * Human Polish™ intake — top-level client orchestrator.
 *
 * Reads the locked family + package from the URL (spec §3.1/§3.2), drives the
 * guided wizard, and wires each step to the foundation routes:
 *   - draft create/recover  → useIntakeFlow
 *   - private file uploads   → useHumanPolishUpload (sign → PUT → complete)
 *
 * The final "Continue to Secure Checkout" (AI Render Packs) and
 * "Submit for Scope Review" (Build-Ready) actions are the documented handoff
 * seam to the Stripe/checkout + review workstreams (see handleFinalAction).
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { AlertTriangle, ArrowLeft, ArrowRight, CheckCircle2, Loader2 } from "lucide-react"
import {
  isHumanPolishServiceFamily,
  isPackageForFamily,
  type HumanPolishPackage,
  type HumanPolishServiceFamily,
} from "@/lib/human-polish/types"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { trackHumanPolishEvent } from "@/components/human-polish/analytics"
import { IntakeShell } from "./IntakeShell"
import { StartScreen } from "./StartScreen"
import { WizardProgress } from "./WizardProgress"
import { AssistedSalesBar } from "./AssistedSalesBar"
import {
  INTAKE_STEP_IDS,
  INTAKE_STEP_META,
  type IntakeStepId,
} from "./intakeConfig"
import type { IntakeErrors } from "./intakeTypes"
import { validateStep } from "./validation"
import { useIntakeFlow } from "./useIntakeFlow"
import { useHumanPolishUpload } from "./useHumanPolishUpload"
import { ContactStep } from "./steps/ContactStep"
import { ProjectStep } from "./steps/ProjectStep"
import { PropertyScopeStep } from "./steps/PropertyScopeStep"
import { UploadStep } from "./steps/UploadStep"
import { DesignInterviewStep } from "./steps/DesignInterviewStep"
import { DeliveryBrandingStep } from "./steps/DeliveryBrandingStep"
import { AcknowledgmentsStep } from "./steps/AcknowledgmentsStep"
import { OrderSummaryStep } from "./steps/OrderSummaryStep"

type Completion =
  | { kind: "none" }
  | { kind: "checkout_pending"; requestId: string }
  | { kind: "review_submitted"; requestId: string }

function InvalidSelection() {
  return (
    <IntakeShell>
      <Alert variant="destructive" className="border-red-500/40 bg-red-500/5">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Invalid package selection</AlertTitle>
        <AlertDescription>
          This intake link is missing a valid service family and package. Please choose a package
          from the Human Polish page to continue.
        </AlertDescription>
      </Alert>
      <div className="mt-6">
        <Link
          href="/human-polish"
          className="inline-flex items-center gap-2 rounded-md bg-gradient-to-r from-orange-500 to-violet-700 px-5 py-3 text-sm font-medium text-white hover:opacity-90"
        >
          Go to Human Polish™
        </Link>
      </div>
    </IntakeShell>
  )
}

export function IntakeExperience() {
  const searchParams = useSearchParams()
  const familyParam = searchParams?.get("family") ?? null
  const packageParam = searchParams?.get("package") ?? null
  const leadSource = searchParams?.get("source") ?? null

  const validSelection =
    isHumanPolishServiceFamily(familyParam) && isPackageForFamily(familyParam, packageParam)

  const family = (validSelection ? familyParam : "ai-render-pack") as HumanPolishServiceFamily
  const pkg = (validSelection ? packageParam : "25") as HumanPolishPackage

  const flow = useIntakeFlow({ family, pkg, leadSource })
  const {
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
  } = flow

  const upload = useHumanPolishUpload({ session, uploadedFiles, onRegistered: addUploadedFile })

  const [errors, setErrors] = useState<IntakeErrors>({})
  const [maxVisitedIndex, setMaxVisitedIndex] = useState(0)
  const [completion, setCompletion] = useState<Completion>({ kind: "none" })
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const startedRef = useRef(false)
  const draftTrackedRef = useRef(false)
  const uploadTrackedRef = useRef(false)
  const summaryTrackedRef = useRef(false)

  const currentIndex = INTAKE_STEP_IDS.indexOf(stepId)
  const isAiPack = family === "ai-render-pack"
  const isLastStep = stepId === "summary"

  useEffect(() => {
    if (startedRef.current) return
    startedRef.current = true
    trackHumanPolishEvent("started_intake", { family, package: pkg })
  }, [family, pkg])

  useEffect(() => {
    if (session && !draftTrackedRef.current) {
      draftTrackedRef.current = true
      trackHumanPolishEvent("created_intake_draft", { family, package: pkg })
    }
  }, [session, family, pkg])

  useEffect(() => {
    setMaxVisitedIndex((prev) => Math.max(prev, currentIndex))
  }, [currentIndex])

  useEffect(() => {
    if (stepId === "summary" && !summaryTrackedRef.current) {
      summaryTrackedRef.current = true
      trackHumanPolishEvent("viewed_order_summary", { family, package: pkg })
    }
  }, [stepId, family, pkg])

  const goToStep = useCallback(
    (id: IntakeStepId) => {
      setErrors({})
      setStepId(id)
      if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" })
    },
    [setStepId],
  )

  const handleBack = useCallback(() => {
    if (currentIndex <= 0) return
    goToStep(INTAKE_STEP_IDS[currentIndex - 1]!)
  }, [currentIndex, goToStep])

  const buildCheckoutPayload = useCallback(() => {
    // Assembled once and forwarded to the checkout/review workstream. The server
    // there re-derives price, promotion, rush, and tax — none of this is trusted.
    if (!session) return null
    return {
      requestId: session.requestId,
      draftToken: session.draftToken,
      family,
      package: pkg,
      leadSource,
      intake: form,
    }
  }, [session, family, pkg, leadSource, form])

  const handleFinalAction = useCallback(async () => {
    const stepErrors = validateStep("acknowledgments", form, family, uploadedFiles.length)
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors)
      goToStep("acknowledgments")
      return
    }
    if (!session) return

    setSubmitting(true)
    setSubmitError(null)
    const payload = buildCheckoutPayload()

    // 1) Persist the full intake onto the server request (server normalizes the
    //    phone, records acknowledgments, and advances the request out of draft).
    try {
      const submitRes = await fetch("/api/human-polish/draft/submit", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!submitRes.ok) {
        const body = (await submitRes.json().catch(() => ({}))) as { error?: string }
        setSubmitError(body?.error ?? "We couldn't save your request. Please try again.")
        setSubmitting(false)
        return
      }
    } catch {
      setSubmitError("Network error while saving your request. Please try again.")
      setSubmitting(false)
      return
    }

    // 2) AI Render Packs proceed to secure one-time checkout; Build-Ready is
    //    submitted for human scope review (no immediate payment — spec §3.2).
    if (isAiPack && pkg !== "custom") {
      trackHumanPolishEvent("initiated_checkout", { family, package: pkg })
      try {
        const res = await fetch("/api/human-polish/checkout", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ requestId: session.requestId, draftToken: session.draftToken }),
        })
        if (res.ok) {
          const data = (await res.json()) as { url?: string }
          if (data?.url) {
            window.location.href = data.url
            return
          }
        } else {
          const body = (await res.json().catch(() => ({}))) as { error?: string }
          setSubmitError(
            body?.error ?? "Checkout could not be started. Your request has been saved."
          )
        }
      } catch {
        setSubmitError("Network error starting checkout. Your request has been saved.")
      }
      setCompletion({ kind: "checkout_pending", requestId: session.requestId })
    } else {
      trackHumanPolishEvent("completed_intake", { family, package: pkg })
      trackHumanPolishEvent("accepted_scope", { family, package: pkg })
      setCompletion({ kind: "review_submitted", requestId: session.requestId })
    }
    setSubmitting(false)
  }, [
    form,
    family,
    pkg,
    uploadedFiles.length,
    session,
    isAiPack,
    buildCheckoutPayload,
    goToStep,
  ])

  const handleContinue = useCallback(() => {
    const stepErrors = validateStep(stepId, form, family, uploadedFiles.length)
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors)
      return
    }
    setErrors({})

    if (stepId === "upload" && !uploadTrackedRef.current) {
      uploadTrackedRef.current = true
      trackHumanPolishEvent("uploaded_files", {
        family,
        package: pkg,
        count: uploadedFiles.length,
      })
    }

    if (isLastStep) {
      void handleFinalAction()
      return
    }
    goToStep(INTAKE_STEP_IDS[currentIndex + 1]!)
  }, [
    stepId,
    form,
    family,
    pkg,
    uploadedFiles.length,
    isLastStep,
    currentIndex,
    goToStep,
    handleFinalAction,
  ])

  const stepProps = useMemo(
    () => ({ form, update: updateForm, errors, family, pkg, session }),
    [form, updateForm, errors, family, pkg, session],
  )

  if (!validSelection) return <InvalidSelection />

  // Completion / handoff placeholder screens.
  if (completion.kind !== "none") {
    return (
      <IntakeShell>
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-8 w-8 text-emerald-400" />
            <h1 className="text-2xl font-bold text-white md:text-3xl">
              {completion.kind === "review_submitted"
                ? "Request submitted for scope review"
                : "Intake complete"}
            </h1>
          </div>
          <p className="text-muted-foreground">
            Reference:{" "}
            <span className="font-mono text-white">{completion.requestId}</span>
          </p>
          {completion.kind === "checkout_pending" ? (
            <Alert className="border-orange-500/40 bg-orange-500/5 text-orange-100">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Secure checkout is being finalized</AlertTitle>
              <AlertDescription>
                Your intake is saved. Secure payment is handled by the Renderspace checkout
                workstream and will connect here shortly. No card has been charged. Our team can also
                send you a secure payment link — reach out below.
              </AlertDescription>
            </Alert>
          ) : (
            <Alert className="border-[#343434] bg-[#191f33]/50 text-muted-foreground">
              <AlertDescription>
                Thanks — a Build-Ready request goes to human scope review before any payment. Our team
                will review your files and confirm the package or send a custom quote.
              </AlertDescription>
            </Alert>
          )}
          <AssistedSalesBar />
          <div>
            <Link
              href="/human-polish"
              className="text-sm text-muted-foreground transition-colors hover:text-white"
            >
              ← Back to Human Polish™
            </Link>
          </div>
        </div>
      </IntakeShell>
    )
  }

  // Pre-draft start screen.
  if (!session) {
    return (
      <IntakeShell>
        {restorePrompt ? (
          <Alert className="mb-6 border-orange-500/40 bg-orange-500/5 text-orange-100">
            <AlertTitle>Resume your saved draft?</AlertTitle>
            <AlertDescription className="mt-2">
              You have an unfinished{" "}
              <strong>{restorePrompt.package}</strong> draft. You can resume it or start this one.
              <div className="mt-3 flex gap-3">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="border-white/30 text-white hover:bg-white/10"
                  onClick={() => void resumePersisted()}
                >
                  Resume draft
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="text-muted-foreground hover:text-white"
                  onClick={dismissRestore}
                >
                  Dismiss
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        ) : null}
        <StartScreen
          family={family}
          pkg={pkg}
          creating={status === "creating"}
          error={error}
          onBegin={() => void createDraft()}
          onRecover={recoverDraft}
        />
      </IntakeShell>
    )
  }

  const meta = INTAKE_STEP_META[stepId]

  return (
    <IntakeShell>
      {isExpired ? (
        <Alert variant="destructive" className="mb-6 border-red-500/40 bg-red-500/5">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Draft recovery window expired</AlertTitle>
          <AlertDescription className="mt-2">
            The 15-minute recovery window has passed. You can start a fresh request; your uploaded
            files remain on our side and our team can help you continue.
            <div className="mt-3">
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="border-white/30 text-white hover:bg-white/10"
                onClick={resetDraft}
              >
                Start a new request
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      ) : null}

      <WizardProgress
        currentIndex={currentIndex}
        maxVisitedIndex={maxVisitedIndex}
        onStepSelect={goToStep}
        msRemaining={msRemaining}
      />

      <div className="mb-5">
        <h1 className="text-2xl font-bold text-white">{meta.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{meta.description}</p>
      </div>

      <div className="rounded-2xl border border-[#343434] bg-[#0d1119]/60 p-5 sm:p-6">
        {stepId === "contact" ? <ContactStep {...stepProps} /> : null}
        {stepId === "project" ? <ProjectStep {...stepProps} /> : null}
        {stepId === "scope" ? <PropertyScopeStep {...stepProps} /> : null}
        {stepId === "upload" ? (
          <UploadStep
            uploadedFiles={uploadedFiles}
            pending={upload.pending}
            isUploading={upload.isUploading}
            formError={errors.form}
            onUpload={upload.uploadFiles}
            onRemovePending={upload.removePending}
          />
        ) : null}
        {stepId === "interview" ? <DesignInterviewStep {...stepProps} /> : null}
        {stepId === "delivery" ? <DeliveryBrandingStep {...stepProps} /> : null}
        {stepId === "acknowledgments" ? <AcknowledgmentsStep {...stepProps} /> : null}
        {stepId === "summary" ? (
          <OrderSummaryStep
            form={form}
            family={family}
            pkg={pkg}
            session={session}
            uploadedCount={uploadedFiles.length}
          />
        ) : null}
      </div>

      {submitError ? (
        <Alert variant="destructive" className="mt-6 border-red-500/40 bg-red-500/5">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Something went wrong</AlertTitle>
          <AlertDescription>{submitError}</AlertDescription>
        </Alert>
      ) : null}

      <div className="mt-6 flex items-center justify-between gap-3">
        <Button
          type="button"
          variant="ghost"
          onClick={handleBack}
          disabled={currentIndex <= 0 || submitting}
          className="text-muted-foreground hover:text-white disabled:opacity-40"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>

        <Button
          type="button"
          onClick={handleContinue}
          disabled={submitting || upload.isUploading}
          size="lg"
          className="bg-gradient-to-r from-orange-500 to-violet-700 text-white hover:opacity-90"
        >
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {isLastStep
            ? isAiPack && pkg !== "custom"
              ? "Continue to Secure Checkout"
              : "Submit for Scope Review"
            : "Continue"}
          {!isLastStep && !submitting ? <ArrowRight className="h-4 w-4" /> : null}
        </Button>
      </div>

      <div className="mt-6">
        <AssistedSalesBar />
      </div>
    </IntakeShell>
  )
}
