"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import {
  adminAcceptFiles,
  adminApproveRush,
  adminAssignTeamMember,
  adminMarkCompleted,
  adminMarkFirstBatchReady,
  adminRecordBriefMatchCorrection,
  adminRecordFinalDelivery,
  adminRecordFirstBatchDelivery,
  adminRejectRush,
  adminRequestFilesNeedInfo,
  adminStartProduction,
  type AdminActionResult,
} from "@/lib/human-polish/admin-actions"
import { isFixedRushApproveAvailable } from "@/lib/human-polish/ops-guards"
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
  family: string
  requestedPackage: string
  rushRequested: boolean
  rushApproved: boolean
  assignedTo: string | null
  revisionCount: number
  lastRevisionNote: string | null
  lastRevisionRequestedAt: string | null
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
        <Button type="button" variant={variant === "destructive" ? "destructive" : "secondary"} disabled={disabled || pending}>
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

export function AdminActionsPanel(props: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [feedback, setFeedback] = useState<{
    kind: "ok" | "error" | "warn"
    text: string
  } | null>(null)
  const [message, setMessage] = useState("")
  const [requestedItems, setRequestedItems] = useState("")
  const [assignee, setAssignee] = useState(props.assignedTo || "")
  const [briefMatchNote, setBriefMatchNote] = useState("")

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

  const paid = props.paymentStatus === "paid"
  const locked =
    props.status === "cancelled" ||
    props.status === "completed" ||
    props.status === "expired"

  const rushApproveAvailable = isFixedRushApproveAvailable({
    paymentStatus: props.paymentStatus,
    requestedPackage: props.requestedPackage,
    rushRequested: props.rushRequested,
    rushApproved: props.rushApproved,
  })

  const showBriefMatch =
    props.family === "ai-render-pack" &&
    props.status === "first_batch_delivered" &&
    props.revisionCount === 0 &&
    paid &&
    !locked

  let rushHint: string | null = null
  if (props.rushRequested && !props.rushApproved) {
    if (props.paymentStatus === "paid") {
      rushHint =
        "Rush approval must occur before payment so the $79 rush fee can be collected. Do not promise rush after payment via this control."
    } else if (props.requestedPackage === "100") {
      rushHint =
        "100-concept expedited delivery requires manual custom review — fixed Approve Rush is disabled."
    }
  }

  return (
    <section className="space-y-4 rounded-xl border border-[#343434] bg-[#0d1119]/60 p-4">
      <div>
        <h3 className="text-lg font-semibold">Operational actions</h3>
        <p className="text-sm text-muted-foreground">
          Explicit workflow buttons only. No free-form status dropdown.
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

      <div className="space-y-3 rounded-lg border border-[#343434] p-3">
        <Label htmlFor="need-info-message">Request additional / replacement files</Label>
        <Textarea
          id="need-info-message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Tell the customer exactly what is missing"
          disabled={pending || locked || !paid}
        />
        <Input
          value={requestedItems}
          onChange={(e) => setRequestedItems(e.target.value)}
          placeholder="Optional items list (comma-separated)"
          disabled={pending || locked || !paid}
          aria-label="Requested items"
        />
        <p className="text-xs text-muted-foreground">
          Issues a 7-day replacement upload link in the customer email payload
          (`recoveryUrl`). Confirm the Loops template includes that variable.
        </p>
        <ConfirmAction
          label="Request files"
          title="Request additional files?"
          description="Sets status to needs_information, rotates the replacement upload token, and emails the customer when a template is configured."
          pending={pending}
          disabled={locked || !paid || !message.trim()}
          onConfirm={() =>
            run(() =>
              adminRequestFilesNeedInfo({
                requestId: props.requestId,
                expectedUpdatedAt: props.expectedUpdatedAt,
                message,
                requestedItems,
              })
            )
          }
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <ConfirmAction
          label="Mark files accepted"
          title="Accept files and start delivery clock?"
          description="Sets files_accepted, starts the delivery clock, and revokes any replacement upload token."
          pending={pending}
          disabled={locked || !paid}
          onConfirm={() =>
            run(() =>
              adminAcceptFiles({
                requestId: props.requestId,
                expectedUpdatedAt: props.expectedUpdatedAt,
              })
            )
          }
        />
        <ConfirmAction
          label="Approve rush"
          title="Approve rush delivery?"
          description="Marks rush_approved before payment and notifies the customer when configured. Blocked after payment and for 100-packs."
          pending={pending}
          disabled={locked || !rushApproveAvailable}
          onConfirm={() =>
            run(() =>
              adminApproveRush({
                requestId: props.requestId,
                expectedUpdatedAt: props.expectedUpdatedAt,
              })
            )
          }
        />
        <ConfirmAction
          label="Reject rush"
          title="Reject rush?"
          description="Keeps standard timing and notifies the customer when configured."
          pending={pending}
          disabled={locked || !props.rushRequested}
          variant="destructive"
          onConfirm={() =>
            run(() =>
              adminRejectRush({
                requestId: props.requestId,
                expectedUpdatedAt: props.expectedUpdatedAt,
              })
            )
          }
        />
      </div>
      {rushHint ? (
        <p className="text-xs text-amber-200/90" role="status">
          {rushHint}
        </p>
      ) : null}

      <div className="space-y-2 rounded-lg border border-[#343434] p-3">
        <Label htmlFor="assignee">Assign team member</Label>
        <div className="flex flex-wrap gap-2">
          <Input
            id="assignee"
            value={assignee}
            onChange={(e) => setAssignee(e.target.value)}
            placeholder="Name or handle"
            disabled={pending || locked || !paid}
            className="max-w-xs"
          />
          <ConfirmAction
            label="Assign"
            title="Assign this request?"
            description="Stores assigned_to and moves files_accepted → assigned when applicable."
            pending={pending}
            disabled={locked || !paid || !assignee.trim()}
            onConfirm={() =>
              run(() =>
                adminAssignTeamMember({
                  requestId: props.requestId,
                  expectedUpdatedAt: props.expectedUpdatedAt,
                  assignedTo: assignee,
                })
              )
            }
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <ConfirmAction
          label="Start production"
          title="Mark in progress?"
          description="Moves files_accepted/assigned → in_progress."
          pending={pending}
          disabled={locked || !paid}
          onConfirm={() =>
            run(() =>
              adminStartProduction({
                requestId: props.requestId,
                expectedUpdatedAt: props.expectedUpdatedAt,
              })
            )
          }
        />
        <ConfirmAction
          label="First batch ready"
          title="Mark first batch ready?"
          description="Moves in_progress → first_batch_ready."
          pending={pending}
          disabled={locked || !paid}
          onConfirm={() =>
            run(() =>
              adminMarkFirstBatchReady({
                requestId: props.requestId,
                expectedUpdatedAt: props.expectedUpdatedAt,
              })
            )
          }
        />
        <ConfirmAction
          label="Record first-batch delivery"
          title="Record first-batch delivery?"
          description="Moves first_batch_ready → first_batch_delivered."
          pending={pending}
          disabled={locked || !paid}
          onConfirm={() =>
            run(() =>
              adminRecordFirstBatchDelivery({
                requestId: props.requestId,
                expectedUpdatedAt: props.expectedUpdatedAt,
              })
            )
          }
        />
        <ConfirmAction
          label="Record final delivery"
          title="Record final delivery?"
          description="Moves to delivered and stamps final_delivered_at."
          pending={pending}
          disabled={locked || !paid}
          onConfirm={() =>
            run(() =>
              adminRecordFinalDelivery({
                requestId: props.requestId,
                expectedUpdatedAt: props.expectedUpdatedAt,
              })
            )
          }
        />
        <ConfirmAction
          label="Mark completed"
          title="Mark request completed?"
          description="Moves delivered → completed only after final delivery."
          pending={pending}
          disabled={locked || !paid}
          onConfirm={() =>
            run(() =>
              adminMarkCompleted({
                requestId: props.requestId,
                expectedUpdatedAt: props.expectedUpdatedAt,
              })
            )
          }
        />
      </div>

      {showBriefMatch ? (
        <div className="space-y-3 rounded-lg border border-[#343434] p-3">
          <Label htmlFor="brief-match-note">Record Brief-Match correction</Label>
          <p className="text-xs text-muted-foreground">
            First-Batch Brief-Match Guarantee only — one included correction for AI Render
            Packs. Returns the request to in_progress. No customer email in this wave.
          </p>
          <Textarea
            id="brief-match-note"
            value={briefMatchNote}
            onChange={(e) => setBriefMatchNote(e.target.value)}
            placeholder="Describe the brief-match issue and correction direction"
            disabled={pending}
          />
          <ConfirmAction
            label="Record Brief-Match correction"
            title="Use the included Brief-Match correction?"
            description="Sets revision_count to 1, stores the note, and returns status to in_progress. This can only be used once."
            pending={pending}
            disabled={!briefMatchNote.trim()}
            onConfirm={() =>
              run(() =>
                adminRecordBriefMatchCorrection({
                  requestId: props.requestId,
                  expectedUpdatedAt: props.expectedUpdatedAt,
                  note: briefMatchNote,
                })
              )
            }
          />
        </div>
      ) : null}

      {props.revisionCount >= 1 ? (
        <div className="rounded-lg border border-[#343434] p-3 text-sm">
          <p className="font-medium">Brief-Match correction used</p>
          <p className="text-muted-foreground">Revision count: {props.revisionCount}</p>
          {props.lastRevisionRequestedAt ? (
            <p className="text-muted-foreground">
              Recorded: {new Date(props.lastRevisionRequestedAt).toLocaleString()}
            </p>
          ) : null}
          {props.lastRevisionNote ? (
            <p className="mt-2 whitespace-pre-wrap break-words">{props.lastRevisionNote}</p>
          ) : null}
        </div>
      ) : null}
    </section>
  )
}
