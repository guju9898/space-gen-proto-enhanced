"use server"

import { revalidatePath } from "next/cache"
import { createSupabaseServerClient } from "@/lib/supabase/server"

function generateShareSlug(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789"
  let slug = ""
  for (let i = 0; i < 12; i++) {
    slug += chars[Math.floor(Math.random() * chars.length)]
  }
  return slug
}

export async function renameProject(projectId: string, name: string): Promise<{ error?: string }> {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) return { error: "Unauthorized" }

  const { error } = await supabase
    .from("projects")
    .update({ name: name.trim(), updated_at: new Date().toISOString() })
    .eq("id", projectId)
    .eq("user_id", user.id)

  if (error) return { error: error.message }
  revalidatePath("/studio/projects")
  return {}
}

export async function deleteProject(projectId: string): Promise<{ error?: string }> {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) return { error: "Unauthorized" }

  const { error: rendersError } = await supabase
    .from("project_renders")
    .delete()
    .eq("project_id", projectId)

  if (rendersError) return { error: rendersError.message }

  const { error: projectError } = await supabase
    .from("projects")
    .delete()
    .eq("id", projectId)
    .eq("user_id", user.id)

  if (projectError) return { error: projectError.message }
  revalidatePath("/studio/projects")
  return {}
}

export async function toggleProjectShare(projectId: string): Promise<{
  error?: string
  shareSlug?: string | null
  isShared?: boolean
}> {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) return { error: "Unauthorized" }

  const { data: project, error: fetchError } = await supabase
    .from("projects")
    .select("is_shared, share_slug")
    .eq("id", projectId)
    .eq("user_id", user.id)
    .single()

  if (fetchError || !project) return { error: fetchError?.message ?? "Project not found" }

  const nextShared = !project.is_shared
  const shareSlug = nextShared
    ? (project.share_slug ?? generateShareSlug())
    : null

  const { error: updateError } = await supabase
    .from("projects")
    .update({
      is_shared: nextShared,
      share_slug: shareSlug,
      updated_at: new Date().toISOString(),
    })
    .eq("id", projectId)
    .eq("user_id", user.id)

  if (updateError) return { error: updateError.message }
  revalidatePath("/studio/projects")
  return { shareSlug, isShared: nextShared }
}
