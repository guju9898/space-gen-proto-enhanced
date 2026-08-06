"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import {
  adminAcceptFiles,
  adminApproveRush,
  adminAssignTeamMember,
  adminMarkCompleted,
  adminMarkFirstBatchReady,
  adminRecordFinalDelivery,
  adminRecordFirstBatchDelivery,
  adminRejectRush,
  adminRequestFilesNeedInfo,
  adminStartProduction,
  type AdminActionResult,
} from "@/lib/human-polish/admin-actions"
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
  rushRequested: boolean
  rushApproved: boolean
  assignedTo: string | null
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
        <ConfirmAction
          label="Request files"
          title="Request additional files?"
          description="Sets status to needs_information and emails the customer when a template is configured."
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
          description="Sets files_accepted and starts the delivery clock."
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
          description="Marks rush_approved and notifies the customer when configured."
          pending={pending}
          disabled={locked || !props.rushRequested || props.rushApproved}
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
          description="Moves delivered/first_batch_delivered → completed."
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
    </section>
  )
}
