"use client"

import { useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase/client"

/**
 * Auto-resumes Stripe Checkout after authentication
 * 
 * Watches for auth state changes and automatically resumes checkout
 * if a pending_checkout_plan was stored in sessionStorage.
 */
export function CheckoutResume() {
  const hasResumedRef = useRef(false)
  const wasAuthenticatedRef = useRef(false)

  useEffect(() => {
    const resumeCheckout = async () => {
      // Only resume once per session
      if (hasResumedRef.current) {
        return
      }

      // Check for pending checkout plan
      const pendingPlan = sessionStorage.getItem("pending_checkout_plan")
      if (!pendingPlan) {
        return
      }

      // Validate planId
      if (!["intro", "professional", "business"].includes(pendingPlan)) {
        sessionStorage.removeItem("pending_checkout_plan")
        return
      }

      try {
        const supabase = createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        // Only proceed if user is authenticated
        if (authError || !user) {
          return
        }

        // Safety check: Don't resume if user already has a paid plan
        const { data: profile } = await supabase
          .from("profiles")
          .select("current_plan, subscription_status")
          .eq("id", user.id)
          .single()

        const hasPaidPlan = profile?.current_plan &&
                          ["intro", "professional", "business"].includes(profile.current_plan) &&
                          (profile.subscription_status === "active" ||
                            profile.subscription_status === "trialing")

        if (hasPaidPlan) {
          // User already has a plan, clear pending checkout
          sessionStorage.removeItem("pending_checkout_plan")
          return
        }

        // Mark as resumed immediately to prevent duplicate calls
        hasResumedRef.current = true
        sessionStorage.removeItem("pending_checkout_plan")

        // Create checkout session
        const response = await fetch("/api/stripe/checkout", {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            planId: pendingPlan,
          }),
        })

        if (!response.ok) {
          // Fail silently - user can manually retry
          console.error("Failed to resume checkout after login")
          return
        }

        const { url } = await response.json()

        if (!url) {
          console.error("No checkout URL returned")
          return
        }

        // Redirect to Stripe Checkout
        window.location.href = url
      } catch (error) {
        // Fail silently
        console.error("Error resuming checkout:", error)
      }
    }

    // Check initial auth state on mount
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      wasAuthenticatedRef.current = !!user
    })

    // Listen for auth state changes (only resume on SIGNED_IN event)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session && !wasAuthenticatedRef.current) {
        // User just signed in (was not authenticated before)
        wasAuthenticatedRef.current = true
        // Small delay to ensure profile is accessible
        setTimeout(() => {
          resumeCheckout()
        }, 500)
      } else if (event === "SIGNED_OUT") {
        wasAuthenticatedRef.current = false
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  return null
}

