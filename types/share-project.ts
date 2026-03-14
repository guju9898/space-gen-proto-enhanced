/**
 * Types for the shareable client presentation page (/view/[slug]).
 * Used by components/share and the view page.
 */

export interface SharedProjectRender {
  id: string
  projectId: string
  imageUrl: string
  thumbnailUrl: string | null
  sourceImageUrl: string | null
  promptSummary: string | null
  createdAt: string
}

export interface ContractorInfo {
  name?: string | null
  company?: string | null
  phone?: string | null
  email?: string | null
  website?: string | null
}

export interface SharedProject {
  id: string
  name: string
  /** Optional project address for display */
  address?: string | null
  /** Contractor/owner info for closing the deal */
  contractor?: ContractorInfo | null
  /** Short vision statement (optional) */
  visionText?: string | null
  /** Bullet list of design features (optional) */
  designFeatures?: string[] | null
}

export interface SharedProjectWithRenders {
  project: SharedProject
  renders: SharedProjectRender[]
}
