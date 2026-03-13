"use server"

/**
 * Server actions for projects (future Supabase integration).
 * TODO: Replace with real Supabase calls when projects + project_renders tables exist.
 */

// import { createSupabaseServerClient } from "@/lib/supabase/server"

export async function renameProject(projectId: string, name: string): Promise<void> {
  // await supabase.from("projects").update({ name, updated_at: new Date().toISOString() }).eq("id", projectId).eq("user_id", userId)
  await Promise.resolve({ projectId, name })
}

export async function deleteProject(projectId: string): Promise<void> {
  // await supabase.from("project_renders").delete().eq("project_id", projectId)
  // await supabase.from("projects").delete().eq("id", projectId).eq("user_id", userId)
  await Promise.resolve(projectId)
}
