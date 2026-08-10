"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import {
  adminApproveBuildReadyScope,
  adminRevokeBuildReadyPaymentRequest,
  adminSendBuildReadyPaymentRequest,
  type AdminActionResult,
} from "@/lib/human-polish/admin-actions"
import { formatAmountFromCents } from "@/lib/human-polish/email"
import { packageLabel } from "@/lib/human-polish/admin-utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

type Props = {
  requestId: string
  expectedUpdatedAt: string
  status: string
  paymentStatus: string
  requestedPackage: string
  approvedPackage: string | null
  approvedAmount: number | null
  scopeReviewedAt: string | null
  scopeReviewedBy: string | null
  reviewerMessage: string | null
  internalReviewNotes: string | null
  paymentRequestedAt: string | null
  paymentRequestId: string | null
  currency: string
}

function ConfirmAction({
  label,
  title,
  description,
  disabled,
  pending,
  onConfirm,
  variant = "default",
}: {
  label: string
  title: string
  description: string
  disabled?: boolean
  pending: boolean
  onConfirm: () => void
  variant?: "default" | "destructive"
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          type="button"
          variant={variant === "destructive" ? "destructive" : "secondary"}
          disabled={disabled || pending}
        >
          {label}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} disabled={pending}>
            Confirm
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export function AdminBuildReadyPanel(props: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [feedback, setFeedback] = useState<{
    kind: "ok" | "error" | "warn"
    text: string
  } | null>(null)
  const [reviewerMessage, setReviewerMessage] = useState(props.reviewerMessage || "")
  const [internalNotes, setInternalNotes] = useState(props.internalReviewNotes || "")
  const [customDollars, setCustomDollars] = useState("")

  const paid = props.paymentStatus === "paid"
  const locked =
    props.status === "cancelled" ||
    props.status === "completed" ||
    props.status === "expired"

  const canApprove =
    !locked &&
    !paid &&
    ["submitted", "under_review", "needs_information", "ready_for_payment"].includes(
      props.status
    )

  const canSendPayment =
    !locked &&
    !paid &&
    props.status === "ready_for_payment" &&
    Boolean(props.approvedPackage) &&
    typeof props.approvedAmount === "number" &&
    props.approvedAmount > 0 &&
    Boolean(props.scopeReviewedAt)

  const canRevoke =
    !locked &&
    !paid &&
    (Boolean(props.paymentRequestId) ||
      props.status === "awaiting_payment" ||
      props.status === "ready_for_payment")

  function run(action: () => Promise<AdminActionResult>) {
    setFeedback(null)
    startTransition(async () => {
      const result = await action()
      if (!result.ok) {
        setFeedback({ kind: "error", text: result.error || "Action failed." })
        return
      }
      if (result.warning) {
        setFeedback({ kind: "warn", text: result.warning })
      } else {
        setFeedback({ kind: "ok", text: "Updated successfully." })
      }
      router.refresh()
    })
  }

  return (
    <section className="space-y-4 rounded-xl border border-[#343434] bg-[#0d1119]/60 p-4">
      <div>
        <h3 className="text-lg font-semibold">Build-Ready scope review</h3>
        <p className="text-sm text-muted-foreground">
          Approve package and amount, then send a separate secure payment request. Approval
          does not email a payment CTA by itself.
        </p>
      </div>

      {feedback ? (
        <Alert variant={feedback.kind === "error" ? "destructive" : "default"}>
          <AlertTitle>
            {feedback.kind === "ok"
              ? "Success"
              : feedback.kind === "warn"
                ? "Updated with warning"
                : "Action failed"}
          </AlertTitle>
          <AlertDescription>{feedback.text}</AlertDescription>
        </Alert>
      ) : null}

      <dl className="grid gap-3 sm:grid-cols-2 text-sm">
        <div>
          <dt className="text-xs uppercase tracking-wide text-muted-foreground">
            Requested package
          </dt>
          <dd>{packageLabel(props.requestedPackage)}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-muted-foreground">
            Approved package
          </dt>
          <dd>{packageLabel(props.approvedPackage)}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-muted-foreground">
            Approved amount
          </dt>
          <dd>
            {typeof props.approvedAmount === "number"
              ? formatAmountFromCents(props.approvedAmount, props.currency)
              : "—"}
          </dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-muted-foreground">
            Reviewed at
          </dt>
          <dd>
            {props.scopeReviewedAt
              ? new Date(props.scopeReviewedAt).toLocaleString()
              : "—"}
          </dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-muted-foreground">
            Reviewer (auth user id)
          </dt>
          <dd className="font-mono text-xs break-all">{props.scopeReviewedBy || "—"}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-muted-foreground">
            Payment requested at
          </dt>
          <dd>
            {props.paymentRequestedAt
              ? new Date(props.paymentRequestedAt).toLocaleString()
              : "—"}
          </dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-xs uppercase tracking-wide text-muted-foreground">
            Payment request id
          </dt>
          <dd className="font-mono text-xs break-all">{props.paymentRequestId || "—"}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-xs uppercase tracking-wide text-muted-foreground">
            Reviewer message
          </dt>
          <dd className="whitespace-pre-wrap break-words">
            {props.reviewerMessage || "—"}
          </dd>
        </div>
      </dl>

      <div className="space-y-3 rounded-lg border border-[#343434] p-3">
        <Label htmlFor="br-reviewer-message">Customer-facing reviewer message</Label>
        <Textarea
          id="br-reviewer-message"
          value={reviewerMessage}
          onChange={(e) => setReviewerMessage(e.target.value)}
          disabled={pending || locked || paid}
          placeholder="Optional note included with approval / quote email"
        />
        <Label htmlFor="br-internal-notes">Internal review notes</Label>
        <Textarea
          id="br-internal-notes"
          value={internalNotes}
          onChange={(e) => setInternalNotes(e.target.value)}
          disabled={pending || locked || paid}
          placeholder="Internal only — never emailed or shown on the pay page"
        />
        <Label htmlFor="br-custom-amount">Custom / commercial amount (USD)</Label>
        <Input
          id="br-custom-amount"
          value={customDollars}
          onChange={(e) => setCustomDollars(e.target.value)}
          disabled={pending || locked || paid}
          placeholder="e.g. 2400.00"
          inputMode="decimal"
        />
        <p className="text-xs text-muted-foreground">
          Essentials 2D/3D always use server list prices ($599 / $899). Custom requires a
          positive dollar amount; server converts to cents.
        </p>
        <div className="flex flex-wrap gap-2">
          <ConfirmAction
            label="Approve Essentials 2D ($599)"
            title="Approve Essentials 2D?"
            description="Sets approved package/amount to Essentials 2D at $599 and status ready_for_payment. Does not send the payment CTA."
            pending={pending}
            disabled={!canApprove}
            onConfirm={() =>
              run(() =>
                adminApproveBuildReadyScope({
                  requestId: props.requestId,
                  expectedUpdatedAt: props.expectedUpdatedAt,
                  approvedPackage: "essentials-2d",
                  reviewerMessage,
                  internalReviewNotes: internalNotes,
                })
              )
            }
          />
          <ConfirmAction
            label="Approve Essentials 3D ($899)"
            title="Approve Essentials 3D?"
            description="Sets approved package/amount to Essentials 3D at $899 and status ready_for_payment. Does not send the payment CTA."
            pending={pending}
            disabled={!canApprove}
            onConfirm={() =>
              run(() =>
                adminApproveBuildReadyScope({
                  requestId: props.requestId,
                  expectedUpdatedAt: props.expectedUpdatedAt,
                  approvedPackage: "essentials-3d",
                  reviewerMessage,
                  internalReviewNotes: internalNotes,
                })
              )
            }
          />
          <ConfirmAction
            label="Approve custom quote"
            title="Approve custom / commercial quote?"
            description="Sets approved package to custom with the entered amount and status ready_for_payment. Does not send the payment CTA."
            pending={pending}
            disabled={!canApprove || !customDollars.trim()}
            onConfirm={() =>
              run(() =>
                adminApproveBuildReadyScope({
                  requestId: props.requestId,
                  expectedUpdatedAt: props.expectedUpdatedAt,
                  approvedPackage: "custom",
                  customAmountDollars: customDollars,
                  reviewerMessage,
                  internalReviewNotes: internalNotes,
                })
              )
            }
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <ConfirmAction
          label="Send payment request"
          title="Send Build-Ready payment request?"
          description="Mints a 7-day payment token and emails the secure pay link. Status stays ready_for_payment until Checkout starts."
          pending={pending}
          disabled={!canSendPayment}
          onConfirm={() =>
            run(() =>
              adminSendBuildReadyPaymentRequest({
                requestId: props.requestId,
                expectedUpdatedAt: props.expectedUpdatedAt,
              })
            )
          }
        />
        <ConfirmAction
          label="Revoke payment request"
          title="Revoke unpaid payment request?"
          description="Expires any open Stripe Checkout Session, clears the payment token, and returns status to under_review. Approved package/amount are kept until you re-approve."
          pending={pending}
          disabled={!canRevoke}
          variant="destructive"
          onConfirm={() =>
            run(() =>
              adminRevokeBuildReadyPaymentRequest({
                requestId: props.requestId,
                expectedUpdatedAt: props.expectedUpdatedAt,
              })
            )
          }
        />
      </div>
    </section>
  )
}
