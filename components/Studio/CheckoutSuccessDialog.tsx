"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { CheckCircle2 } from "lucide-react"

export function CheckoutSuccessDialog() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isOpen, setIsOpen] = useState(false)
  const [isChecking, setIsChecking] = useState(true)
  const [hasPaidPlan, setHasPaidPlan] = useState(false)

  useEffect(() => {
    const checkSuccess = async () => {
      const billingSuccess = searchParams?.get("billing") === "success"
      
      if (!billingSuccess) {
        setIsChecking(false)
        return
      }

      // Check if we've already shown this (sessionStorage)
      const hasShownSuccess = sessionStorage.getItem("checkout_success_shown")
      if (hasShownSuccess) {
        // Clean up URL param but don't show dialog
        const newSearchParams = new URLSearchParams(searchParams?.toString() ?? "")
        newSearchParams.delete("billing")
        const base = pathname ?? ""
        const cleanUrl = newSearchParams.toString() ? `${base}?${newSearchParams.toString()}` : base
        router.replace(cleanUrl)
        setIsChecking(false)
        return
      }

      // Verify user actually has a paid plan
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          // Not authenticated, fail silently
          setIsChecking(false)
          return
        }

        const { data: profile } = await supabase
          .from("profiles")
          .select("current_plan, subscription_status")
          .eq("id", user.id)
          .single()

        // Only show if user has a paid/trial plan
        const isPaid = profile?.current_plan && 
                      ["professional", "business", "intro"].includes(profile.current_plan) &&
                      (profile.subscription_status === "active" ||
                        profile.subscription_status === "trialing")

        if (isPaid) {
          setHasPaidPlan(true)
          setIsOpen(true)
          // Mark as shown in sessionStorage
          sessionStorage.setItem("checkout_success_shown", "true")
        } else {
          // Webhook may not have processed yet, wait a bit and retry once
          setTimeout(async () => {
            const { data: retryProfile } = await supabase
              .from("profiles")
              .select("current_plan, subscription_status")
              .eq("id", user.id)
              .single()

            const isPaidRetry = retryProfile?.current_plan && 
                              ["professional", "business", "intro"].includes(retryProfile.current_plan) &&
                              (retryProfile.subscription_status === "active" ||
                                retryProfile.subscription_status === "trialing")

            if (isPaidRetry) {
              setHasPaidPlan(true)
              setIsOpen(true)
              sessionStorage.setItem("checkout_success_shown", "true")
            }
            setIsChecking(false)
          }, 2000)
        }
      } catch (error) {
        console.error("Error checking user plan:", error)
        // Fail silently
      } finally {
        setIsChecking(false)
      }
    }

    checkSuccess()
  }, [searchParams, router, pathname])

  const handleDismiss = () => {
    setIsOpen(false)
    // Remove query param from URL
    const newSearchParams = new URLSearchParams(searchParams?.toString() ?? "")
    newSearchParams.delete("billing")
    const base = pathname ?? ""
    const cleanUrl = newSearchParams.toString() ? `${base}?${newSearchParams.toString()}` : base
    router.replace(cleanUrl)
  }

  if (isChecking || !hasPaidPlan) {
    return null
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleDismiss}>
      <DialogContent className="sm:max-w-md bg-[#0a0a0a] border border-[#1a1a1a]">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
              <CheckCircle2 className="h-6 w-6 text-green-500" />
            </div>
            <DialogTitle className="text-2xl font-semibold">
              🎉 You're all set
            </DialogTitle>
          </div>
          <DialogDescription className="text-base text-muted-foreground pt-2">
            Your plan is now active.
            <br />
            You can start generating designs immediately.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <p className="text-sm text-muted-foreground">
            You can manage billing or cancel anytime from your account.
          </p>
        </div>

        <DialogFooter>
          <Button
            onClick={() => handleDismiss()}
            className="w-full bg-gradient-to-r from-orange-500 to-violet-700 hover:opacity-90 transition-opacity"
          >
            Start your first render
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

