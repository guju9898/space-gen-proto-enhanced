-- Applied to production (space-gen-enhanced) on 2026-10-14 via the Supabase MCP.
-- Committed here so the repo matches the live database.
--
-- These SECURITY DEFINER functions were callable by anon/authenticated via
-- /rest/v1/rpc. grant_demo_access let anyone with the public anon key grant
-- arbitrary demo credits to any user; consume_demo_credits let anyone spend
-- another user's demo credits. The app only calls consume_demo_credits
-- server-side with the service role (lib/usage/enforceCredits.ts), and
-- grant_demo_access is run manually from the SQL editor.

revoke execute on function public.grant_demo_access(uuid, text, numeric, integer, text) from public, anon, authenticated;
revoke execute on function public.consume_demo_credits(uuid, numeric) from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;

grant execute on function public.grant_demo_access(uuid, text, numeric, integer, text) to service_role;
grant execute on function public.consume_demo_credits(uuid, numeric) to service_role;

alter function public.grant_demo_access(uuid, text, numeric, integer, text) set search_path = public;
