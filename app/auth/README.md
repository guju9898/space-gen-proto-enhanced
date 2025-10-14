# Authentication

## Magic Link Authentication

This app uses Supabase magic link authentication for both login and signup flows.

### Setup Required

**SMTP Configuration**: Magic links require SMTP settings in Supabase project configuration.

1. Go to your Supabase project dashboard
2. Navigate to **Settings → Email**
3. Configure the following:
   - SMTP host
   - SMTP port
   - SMTP username
   - SMTP password

### How It Works

1. User enters email address
2. System sends magic link to email via `supabase.auth.signInWithOtp()`
3. User clicks link in email
4. Supabase redirects to app and sets authentication cookies
5. Middleware and server-side guards validate the session

### Files

- `MagicLinkForm.tsx` - Shared component for magic link flow
- `login/page.tsx` - Login page (redirects to `/studio` or custom redirect)
- `signup/page.tsx` - Signup page (redirects to `/onboarding`)

### Environment Variables

Required in `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
