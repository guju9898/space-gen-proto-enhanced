"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, CreditCard, AlertCircle, CheckCircle2, XCircle } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface BillingProfile {
  current_plan: string | null
  subscription_status: string | null
}

const planNames: Record<string, string> = {
  professional: "Professional",
  business: "Business",
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  active: {
    label: "Active",
    color: "text-green-500",
    icon: <CheckCircle2 className="h-4 w-4" />,
  },
  past_due: {
    label: "Past Due",
    color: "text-amber-500",
    icon: <AlertCircle className="h-4 w-4" />,
  },
  canceled: {
    label: "Canceled",
    color: "text-muted-foreground",
    icon: <XCircle className="h-4 w-4" />,
  },
}

export default function SubscriptionPage() {
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<BillingProfile | null>(null)
  const [isOpeningPortal, setIsOpeningPortal] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
          setError("Please log in to view your subscription")
          setLoading(false)
          return
        }

        const { data, error: profileError } = await supabase
          .from("profiles")
          .select("current_plan, subscription_status")
          .eq("id", user.id)
          .single()

        if (profileError) {
          console.error("Error fetching profile:", profileError)
          setError("Failed to load subscription information")
        } else {
          setProfile(data)
        }
      } catch (err) {
        console.error("Error fetching profile:", err)
        setError("Failed to load subscription information")
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [])

  const handleManageBilling = async () => {
    setIsOpeningPortal(true)
    setError(null)

    try {
      const response = await fetch("/api/stripe/portal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to open billing portal")
      }

      const { url } = await response.json()

      if (!url) {
        throw new Error("No portal URL returned")
      }

      // Redirect to Stripe Customer Portal
      window.location.href = url
    } catch (err) {
      console.error("Error opening billing portal:", err)
      setError(err instanceof Error ? err.message : "Failed to open billing portal")
      setIsOpeningPortal(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-6 py-12 max-w-2xl">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  const hasActivePlan = profile?.current_plan && 
                       ["professional", "business"].includes(profile.current_plan) &&
                       profile.subscription_status === "active"

  const isPastDue = profile?.subscription_status === "past_due"
  const planName = profile?.current_plan ? planNames[profile.current_plan] || profile.current_plan : null
  const status = profile?.subscription_status || null
  const statusInfo = status ? statusConfig[status] : null

  return (
    <div className="container mx-auto px-6 py-12 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Billing</h1>
        <p className="text-muted-foreground">
          Manage your subscription and billing information
        </p>
      </div>

      {error && (
        <div className="mb-6 bg-destructive/10 text-destructive px-4 py-3 rounded-md text-sm">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Subscription
          </CardTitle>
          <CardDescription>
            Your current plan and billing status
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {hasActivePlan ? (
            <>
              <div className="space-y-4">
                <div className="flex items-center justify-between py-2 border-b border-border">
                  <span className="text-sm text-muted-foreground">Plan</span>
                  <span className="text-sm font-medium">{planName}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-border">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <div className={cn(
                    "flex items-center gap-2 text-sm font-medium",
                    statusInfo?.color
                  )}>
                    {statusInfo?.icon}
                    {statusInfo?.label || status}
                  </div>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-muted-foreground">Billing</span>
                  <span className="text-sm font-medium">Monthly</span>
                </div>
              </div>

              {isPastDue && (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-md p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-amber-500 mb-1">
                        Payment Required
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Your subscription needs attention. Please update your payment method to continue using Renderspace.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <Button
                onClick={() => handleManageBilling()}
                disabled={isOpeningPortal}
                className="w-full bg-gradient-to-r from-orange-500 to-violet-700 hover:opacity-90 transition-opacity"
              >
                {isOpeningPortal ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Opening...
                  </>
                ) : (
                  "Manage Billing"
                )}
              </Button>
            </>
          ) : (
            <div className="text-center py-8 space-y-4">
              <div className="text-muted-foreground">
                <p className="mb-2">You don't have an active subscription.</p>
                <p className="text-sm">Choose a plan to start generating designs.</p>
              </div>
              <Link href="/onboarding">
                <Button className="bg-gradient-to-r from-orange-500 to-violet-700 hover:opacity-90 transition-opacity">
                  View Plans
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}


