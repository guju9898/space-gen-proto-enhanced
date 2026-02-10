"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { HelpCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface FirstPaidSessionHintProps {
  className?: string
}

export function FirstPaidSessionHint({ className }: FirstPaidSessionHintProps) {
  const [shouldShow, setShouldShow] = useState(false)

  useEffect(() => {
    const checkFirstPaidSession = async () => {
      // Check if we've already shown this hint
      const hasShownHint = sessionStorage.getItem("first_paid_session_hint_shown")
      if (hasShownHint) {
        return
      }

      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          return
        }

        const { data: profile } = await supabase
          .from("profiles")
          .select("current_plan, subscription_status")
          .eq("id", user.id)
          .single()

        // Only show for paid users
        const isPaid = profile?.current_plan && 
                      ["professional", "business"].includes(profile.current_plan) &&
                      profile.subscription_status === "active"

        if (isPaid) {
          setShouldShow(true)
          // Mark as shown
          sessionStorage.setItem("first_paid_session_hint_shown", "true")
        }
      } catch (error) {
        console.error("Error checking user plan for hint:", error)
      }
    }

    checkFirstPaidSession()
  }, [])

  if (!shouldShow) {
    return null
  }

  return (
    <div className={cn("flex items-start gap-2 p-3 rounded-md bg-muted/30 border border-border/50", className)}>
      <HelpCircle className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
      <p className="text-xs text-muted-foreground leading-relaxed">
        <span className="font-medium">Pro tip:</span> Start with the default settings — you can refine after your first render.
      </p>
    </div>
  )
}

