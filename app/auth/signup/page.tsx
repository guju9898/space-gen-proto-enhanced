'use client'

import MagicLinkForm from '../MagicLinkForm'

export default function SignupPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-background text-foreground px-4">
      <div className="w-full max-w-md p-6 bg-[#0f1720]/60 rounded-lg">
        <h1 className="text-2xl font-bold mb-6 text-white text-center">Sign up</h1>
        
        {/* TODO: Configure SMTP settings in Supabase project Settings → Email */}
        <MagicLinkForm redirectTo="/onboarding" />
        
        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            Already have an account?{' '}
            <a href="/auth/login" className="text-primary hover:underline">
              Log in
            </a>
          </p>
        </div>
      </div>
    </main>
  )
}