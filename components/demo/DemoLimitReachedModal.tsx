"use client"

import Link from "next/link"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

export interface DemoLimitReachedModalProps {
  open: boolean
  onClose: () => void
}

export function DemoLimitReachedModal({ open, onClose }: DemoLimitReachedModalProps) {
  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>You&apos;ve reached the demo limit</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Start the Intro Plan to continue generating renders.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 mt-4">
          <Button asChild className="flex-1 bg-gradient-to-r from-orange-500 to-violet-700 hover:opacity-90 text-white">
            <Link href="/onboarding">Start Intro Plan</Link>
          </Button>
          <Button asChild variant="outline" className="flex-1">
            <Link href="/pricing">View Pricing</Link>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
