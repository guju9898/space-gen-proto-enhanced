"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, User, CreditCard, Coins, LogOut, CheckCircle2, AlertCircle, XCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

interface ProfileData {
  email: string | undefined
  current_plan: string | null
  subscription_status: string | null
}

interface CreditsData {
  creditsRemaining: number | null
  monthlyLimit: number | null
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
  subscription_inactive: {
    label: "Inactive",
    color: "text-muted-foreground",
    icon: <XCircle className="h-4 w-4" />,
  },
}

export default function ProfilePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [credits, setCredits] = useState<CreditsData | null>(null)
  const [isOpeningPortal, setIsOpeningPortal] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const supabase = createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
          setError("Please log in to view your profile")
          setLoading(false)
          return
        }

        // Fetch profile data
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("current_plan, subscription_status")
          .eq("id", user.id)
          .single()

        if (profileError) {
          console.error("Error fetching profile:", profileError)
          setError("Failed to load profile information")
        } else {
          setProfile({
            email: user.email,
            current_plan: profileData?.current_plan || null,
            subscription_status: profileData?.subscription_status || null,
          })
        }

        // Fetch credits data
        const creditsResponse = await fetch("/api/credits/status")
        if (creditsResponse.ok) {
          const creditsData = await creditsResponse.json()
          setCredits({
            creditsRemaining: creditsData.creditsRemaining,
            monthlyLimit: creditsData.monthlyLimit,
          })
        } else {
          console.error("Error fetching credits:", await creditsResponse.json())
        }
      } catch (err) {
        console.error("Error fetching data:", err)
        setError("Failed to load profile information")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
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

  const handleLogout = async () => {
    setIsLoggingOut(true)
    setError(null)

    try {
      const supabase = createClient()
      const { error: signOutError } = await supabase.auth.signOut()

      if (signOutError) {
        throw new Error(signOutError.message || "Failed to log out")
      }

      // Redirect to home page after logout
      router.push("/")
    } catch (err) {
      console.error("Error logging out:", err)
      setError(err instanceof Error ? err.message : "Failed to log out")
      setIsLoggingOut(false)
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

  const planName = profile?.current_plan ? planNames[profile.current_plan] || profile.current_plan : "No Plan"
  const status = profile?.subscription_status || null
  const statusInfo = status ? statusConfig[status] : null
  const hasActivePlan = profile?.current_plan && 
                       ["professional", "business"].includes(profile.current_plan) &&
                       profile.subscription_status === "active"

  return (
    <div className="container mx-auto px-6 py-12 max-w-2xl space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Profile</h1>
        <p className="text-muted-foreground">
          Manage your account and subscription
        </p>
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md text-sm">
          {error}
        </div>
      )}

      {/* Account Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Account Overview
          </CardTitle>
          <CardDescription>
            Your account information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between py-2 border-b border-border">
            <span className="text-sm text-muted-foreground">Email</span>
            <span className="text-sm font-medium">{profile?.email || "Not available"}</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-muted-foreground">Plan</span>
            <span className={cn(
              "text-sm font-medium px-2 py-1 rounded",
              hasActivePlan ? "bg-green-500/10 text-green-500" : "bg-muted text-muted-foreground"
            )}>
              {planName}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Current Plan */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Current Plan
          </CardTitle>
          <CardDescription>
            Your subscription details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {hasActivePlan || profile?.current_plan ? (
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
                    {statusInfo?.label || status || "Unknown"}
                  </div>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-muted-foreground">Billing</span>
                  <span className="text-sm font-medium">Monthly</span>
                </div>
              </div>

              {profile?.subscription_status === "past_due" && (
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
            </div>
          )}
        </CardContent>
      </Card>

      {/* Credits & Usage */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5" />
            Credits & Usage
          </CardTitle>
          <CardDescription>
            Your monthly credit allocation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between py-2 border-b border-border">
            <span className="text-sm text-muted-foreground">Credits Remaining</span>
            <span className="text-sm font-medium">
              {credits?.creditsRemaining !== null && credits?.creditsRemaining !== undefined
                ? credits.creditsRemaining.toFixed(1)
                : "Unlimited"}
            </span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-muted-foreground">Monthly Allowance</span>
            <span className="text-sm font-medium">
              {credits?.monthlyLimit !== null && credits?.monthlyLimit !== undefined
                ? credits.monthlyLimit.toFixed(0)
                : "Unlimited"}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Session */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LogOut className="h-5 w-5" />
            Session
          </CardTitle>
          <CardDescription>
            Manage your account session
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={() => handleLogout()}
            disabled={isLoggingOut}
            variant="outline"
            className="w-full"
          >
            {isLoggingOut ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Logging out...
              </>
            ) : (
              <>
                <LogOut className="h-4 w-4 mr-2" />
                Log Out
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}


