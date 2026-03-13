/**
 * Mock project data for V1 UI.
 * Replace with getProjectsFromSupabase() when backend is ready.
 */

import type { Project } from "./types"

const placeholderImage = "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400&h=300&fit=crop"
const placeholderLandscape = "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop"
const placeholderExterior = "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400&h=300&fit=crop"

export function getMockProjects(userId: string): Project[] {
  const now = new Date().toISOString()
  return [
    {
      id: "proj-1",
      userId,
      name: "Riverside Drive Backyard",
      projectType: "landscape",
      coverImageUrl: placeholderLandscape,
      renderCount: 4,
      updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      createdAt: new Date(Date.now() - 86400000 * 14).toISOString(),
    },
    {
      id: "proj-2",
      userId,
      name: "Kitchen Remodel - Smith",
      projectType: "interior",
      coverImageUrl: placeholderImage,
      renderCount: 2,
      updatedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
      createdAt: new Date(Date.now() - 86400000 * 21).toISOString(),
    },
    {
      id: "proj-3",
      userId,
      name: "Front Facade Options",
      projectType: "exterior",
      coverImageUrl: placeholderExterior,
      renderCount: 6,
      updatedAt: now,
      createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    },
    {
      id: "proj-4",
      userId,
      name: "Pool & Patio Concept",
      projectType: "landscape",
      coverImageUrl: placeholderLandscape,
      renderCount: 1,
      updatedAt: new Date(Date.now() - 86400000 * 7).toISOString(),
      createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
    },
  ]
}
