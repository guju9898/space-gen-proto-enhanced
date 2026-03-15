/**
 * Fetch a prospect mockup by slug for /mockup/[slug].
 * Joins project_renders for before/after images; optionally project for contractor.
 */

import { createSupabaseServerClient } from "@/lib/supabase/server"

export interface ProspectMockupData {
  id: string
  slug: string
  prospectName: string | null
  propertyAddress: string | null
  message: string | null
  createdAt: string
  renderImageUrl: string
  sourceImageUrl: string | null
  projectName: string | null
  contractorName: string | null
  contractorCompany: string | null
  contractorPhone: string | null
  contractorEmail: string | null
  contractorWebsite: string | null
}

export async function getProspectMockupBySlug(slug: string): Promise<ProspectMockupData | null> {
  const supabase = await createSupabaseServerClient()

  const { data: mockup, error: mockupError } = await supabase
    .from("prospect_mockups")
    .select("id, slug, prospect_name, property_address, message, created_at, render_id")
    .eq("slug", slug)
    .single()

  if (mockupError || !mockup) return null

  const { data: render, error: renderError } = await supabase
    .from("project_renders")
    .select("id, project_id, image_url, source_image_url")
    .eq("id", mockup.render_id)
    .single()

  if (renderError || !render) return null

  let projectName: string | null = null
  let contractorName: string | null = null
  let contractorCompany: string | null = null
  let contractorPhone: string | null = null
  let contractorEmail: string | null = null
  let contractorWebsite: string | null = null

  const { data: project } = await supabase
    .from("projects")
    .select("name")
    .eq("id", render.project_id)
    .single()

  if (project) projectName = project.name ?? null

  return {
    id: String(mockup.id),
    slug: String(mockup.slug),
    prospectName: mockup.prospect_name ?? null,
    propertyAddress: mockup.property_address ?? null,
    message: mockup.message ?? null,
    createdAt: String(mockup.created_at),
    renderImageUrl: String(render.image_url),
    sourceImageUrl: render.source_image_url ?? null,
    projectName,
    contractorName,
    contractorCompany,
    contractorPhone,
    contractorEmail,
    contractorWebsite,
  }
}
