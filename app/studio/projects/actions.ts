"use server"

import { revalidatePath } from "next/cache"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { generateSlug } from "@/lib/projects/generateSlug"

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

export type EnableProjectShareResult = { slug: string } | { error: string }
export type DisableProjectShareResult = {} | { error: string }

/**
 * Enable public sharing for a project. Fetches project name, generates a slug,
 * updates is_shared and share_slug, then revalidates.
 */
export async function enableProjectShare(projectId: string): Promise<EnableProjectShareResult> {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) return { error: "Unauthorized" }

  const { data: project, error: fetchError } = await supabase
    .from("projects")
    .select("name")
    .eq("id", projectId)
    .eq("user_id", user.id)
    .single()

  if (fetchError || !project) return { error: fetchError?.message ?? "Project not found" }

  const slug = generateSlug(project.name ?? "project")

  const { error: updateError } = await supabase
    .from("projects")
    .update({
      is_shared: true,
      share_slug: slug,
      updated_at: new Date().toISOString(),
    })
    .eq("id", projectId)
    .eq("user_id", user.id)

  if (updateError) return { error: updateError.message }
  revalidatePath("/studio/projects")
  return { slug }
}

/**
 * Disable public sharing. Sets is_shared = false; share_slug is left intact.
 */
export async function disableProjectShare(projectId: string): Promise<DisableProjectShareResult> {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) return { error: "Unauthorized" }

  const { error } = await supabase
    .from("projects")
    .update({
      is_shared: false,
      updated_at: new Date().toISOString(),
    })
    .eq("id", projectId)
    .eq("user_id", user.id)

  if (error) return { error: error.message }
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
    .select("is_shared, share_slug, name")
    .eq("id", projectId)
    .eq("user_id", user.id)
    .single()

  if (fetchError || !project) return { error: fetchError?.message ?? "Project not found" }

  const nextShared = !project.is_shared
  const shareSlug = nextShared
    ? (project.share_slug ?? generateSlug(project.name ?? "project"))
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

/** Generate a unique slug for prospect mockups (no name needed). */
function generateMockupSlug(): string {
  const part = Math.random().toString(36).slice(2, 10)
  return `m-${part}`
}

export type CreateProspectMockupResult = { slug: string } | { error: string }

export interface ProspectMockupFormData {
  prospectName?: string | null
  propertyAddress?: string | null
  message?: string | null
}

/**
 * Create a prospect mockup for an existing project render.
 * Generates slug, inserts prospect_mockups, returns slug for /mockup/[slug].
 */
export async function createProspectMockup(
  renderId: string,
  formData: ProspectMockupFormData
): Promise<CreateProspectMockupResult> {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) return { error: "Unauthorized" }

  const { data: render } = await supabase
    .from("project_renders")
    .select("id, user_id")
    .eq("id", renderId)
    .eq("user_id", user.id)
    .single()

  if (!render) return { error: "Render not found" }

  let slug = generateMockupSlug()
  const { data: existing } = await supabase.from("prospect_mockups").select("id").eq("slug", slug).single()
  if (existing) slug = generateMockupSlug()

  const { error: insertError } = await supabase.from("prospect_mockups").insert({
    user_id: user.id,
    render_id: renderId,
    slug,
    prospect_name: formData.prospectName?.trim() || null,
    property_address: formData.propertyAddress?.trim() || null,
    message: formData.message?.trim() || null,
  })

  if (insertError) return { error: insertError.message }
  return { slug }
}

export type SaveRenderToProjectResult =
  | { projectId: string; renderId: string }
  | { error: string }

/**
 * Create a new project with one render (for "Save to Project" from studio).
 * Does not enable sharing; user can use Share button after.
 */
export async function saveRenderToProject(
  projectName: string,
  projectType: "interior" | "exterior" | "landscape",
  imageUrl: string,
  sourceImageUrl?: string | null
): Promise<SaveRenderToProjectResult> {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) return { error: "Unauthorized" }

  const name = projectName.trim() || "Untitled Project"

  const { data: project, error: projectError } = await supabase
    .from("projects")
    .insert({
      user_id: user.id,
      name,
      project_type: projectType,
      cover_image: imageUrl,
    })
    .select("id")
    .single()

  if (projectError || !project) return { error: projectError?.message ?? "Failed to create project" }

  const { data: render, error: renderError } = await supabase
    .from("project_renders")
    .insert({
      project_id: project.id,
      user_id: user.id,
      studio_type: projectType,
      image_url: imageUrl,
      source_image_url: sourceImageUrl ?? null,
    })
    .select("id")
    .single()

  if (renderError || !render) return { error: renderError?.message ?? "Failed to save render" }

  revalidatePath("/studio/projects")
  return { projectId: project.id, renderId: render.id }
}
