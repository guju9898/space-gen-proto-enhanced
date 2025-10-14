'use client'

import { useSearchParams } from 'next/navigation'
import MagicLinkForm from '../MagicLinkForm'

export default function LoginPage() {
  const searchParams = useSearchParams()
  const redirectTo = searchParams?.get('redirect') || '/studio'

  return (
    <main className="min-h-screen flex items-center justify-center bg-background text-foreground px-4">
      <div className="w-full max-w-md p-6 bg-[#0f1720]/60 rounded-lg">
        <h1 className="text-2xl font-bold mb-6 text-white text-center">Log in</h1>
        
        {/* TODO: Configure SMTP settings in Supabase project Settings → Email */}
        <MagicLinkForm redirectTo={redirectTo} />
        
        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            Don't have an account?{' '}
            <a href="/auth/signup" className="text-primary hover:underline">
              Sign up
            </a>
          </p>
        </div>
      </div>
    </main>
  )
}