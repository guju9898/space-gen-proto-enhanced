import { NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { enforceCredits } from "@/lib/usage/enforceCredits"

export const runtime = "nodejs"

/**
 * Read-only API route to fetch user's credit status
 * Returns credits remaining and monthly limit (may be null for Business plan)
 */
export async function GET(request: Request) {
  try {
    // Initialize Supabase server client (reads auth from cookies)
    const supabase = await createSupabaseServerClient()

    // Authenticate user from cookies
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Get credit status (read-only, no enforcement)
    const creditCheck = await enforceCredits(user.id)

    // Return only the read-only fields
    return NextResponse.json({
      creditsRemaining: creditCheck.creditsRemaining,
      monthlyLimit: creditCheck.monthlyLimit,
    })
  } catch (error) {
    console.error("❌ Error fetching credit status:", error)
    return NextResponse.json(
      { error: "Failed to fetch credit status" },
      { status: 500 }
    )
  }
}


