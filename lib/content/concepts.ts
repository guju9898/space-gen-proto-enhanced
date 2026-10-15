/**
 * Daily content renders: concept library, planner and prompt/SEO text builders.
 *
 * Pure functions only (no I/O) so they can be unit tested. The cron route and
 * admin actions in lib/content/run.ts do the database and storage work.
 *
 * Rules baked in here:
 * - Customer uploads are NEVER a source. Sources are KeSean's own photos
 *   ("own") or free-license stock photos ("stock"); otherwise text-only.
 * - Captions never claim a stock or text-only image is a client's project.
 */

export type RenderType = "landscape" | "exterior" | "interior"

export type Scene =
  | "backyard"
  | "front_yard"
  | "patio"
  | "pool"
  | "house_exterior"
  | "interior"
  | "commercial"
  | "other"

export const SCENES: Scene[] = [
  "backyard",
  "front_yard",
  "patio",
  "pool",
  "house_exterior",
  "interior",
  "commercial",
  "other",
]

export const SCENE_LABELS: Record<Scene, string> = {
  backyard: "backyard",
  front_yard: "front yard",
  patio: "patio",
  pool: "pool area",
  house_exterior: "house exterior",
  interior: "room",
  commercial: "commercial property",
  other: "outdoor space",
}

export type Concept = {
  key: string
  label: string
  renderType: RenderType
  /** Scenes a photo can show for this concept to make sense. */
  scenes: Scene[]
  /** What to change when editing a real photo. */
  edit: string
  /** Full scene description for text-only renders. */
  text: string
  /** Relative weight in the auto plan (outdoor-led). */
  weight: number
}

export const CONCEPTS: Concept[] = [
  {
    key: "pool-paver-patio",
    label: "rectangular pool with paver patio",
    renderType: "landscape",
    scenes: ["backyard", "pool"],
    edit: "Add a rectangular in-ground pool with a light travertine paver deck, a low raised bond-beam wall with a sheer descent, and simple planting beds along the fence",
    text: "suburban backyard with a new rectangular in-ground pool, light travertine paver deck, sheer descent water feature and simple planting beds along a wood privacy fence",
    weight: 3,
  },
  {
    key: "freeform-pool-boulders",
    label: "freeform pool with boulder waterfall",
    renderType: "landscape",
    scenes: ["backyard", "pool"],
    edit: "Add a freeform in-ground pool with a natural boulder waterfall, a flagstone coping edge and native planting around the rocks",
    text: "backyard with a freeform in-ground pool, natural boulder waterfall, flagstone coping and native planting around the rocks",
    weight: 2,
  },
  {
    key: "pool-remodel",
    label: "pool remodel",
    renderType: "landscape",
    scenes: ["pool"],
    edit: "Remodel the existing pool: fresh pebble finish in a blue-gray tone, new waterline tile, new paver coping and deck, keep the pool's shape and position",
    text: "remodeled backyard pool with a blue-gray pebble finish, new waterline tile, new paver coping and a refreshed deck",
    weight: 1,
  },
  {
    key: "outdoor-kitchen-pergola",
    label: "outdoor kitchen under a pergola",
    renderType: "landscape",
    scenes: ["backyard", "patio"],
    edit: "Add an L-shaped outdoor kitchen with a stone veneer base, built-in grill and bar seating, under a cedar pergola on a paver patio",
    text: "backyard patio with an L-shaped outdoor kitchen, stone veneer base, built-in grill, bar seating and a cedar pergola overhead",
    weight: 2,
  },
  {
    key: "fire-pit-seating",
    label: "fire pit seating area",
    renderType: "landscape",
    scenes: ["backyard", "patio"],
    edit: "Add a round paver patio with a stone fire pit at the center, built-in seat walls and string lights overhead",
    text: "backyard with a round paver patio, central stone fire pit, built-in seat walls and string lights",
    weight: 2,
  },
  {
    key: "covered-patio",
    label: "covered patio extension",
    renderType: "exterior",
    scenes: ["backyard", "patio", "house_exterior"],
    edit: "Add a covered patio attached to the back of the house with a gable roof matching the house, a tongue-and-groove ceiling, ceiling fans and a stained concrete floor",
    text: "back of a single-story home with a new attached covered patio, gable roof matching the house, tongue-and-groove ceiling, ceiling fans and outdoor seating",
    weight: 2,
  },
  {
    key: "xeriscape",
    label: "drought-tolerant xeriscape",
    renderType: "landscape",
    scenes: ["backyard", "front_yard"],
    edit: "Replace the lawn with a drought-tolerant xeriscape: decomposed granite paths, native grasses, agave and yucca, limestone boulders and steel edging",
    text: "drought-tolerant xeriscape yard with decomposed granite paths, native grasses, agave, yucca, limestone boulders and steel edging",
    weight: 2,
  },
  {
    key: "front-yard-curb-appeal",
    label: "front yard curb appeal makeover",
    renderType: "landscape",
    scenes: ["front_yard", "house_exterior"],
    edit: "Give the front yard a curb appeal makeover: new curved planting beds with layered shrubs, a wider paver walkway to the door, fresh mulch and low path lights",
    text: "front yard curb appeal makeover with curved planting beds, layered shrubs, a wide paver walkway to the front door and low path lights",
    weight: 2,
  },
  {
    key: "landscape-lighting-dusk",
    label: "landscape lighting at dusk",
    renderType: "landscape",
    scenes: ["backyard", "front_yard", "house_exterior", "pool"],
    edit: "Show the same space at dusk with warm landscape lighting: uplights on trees, path lights along walkways and soft wash lights on the house",
    text: "home at dusk with warm landscape lighting, uplit trees, path lights along the walkway and soft wash lights on the facade",
    weight: 1,
  },
  {
    key: "retaining-wall-terraces",
    label: "terraced retaining walls",
    renderType: "landscape",
    scenes: ["backyard", "front_yard"],
    edit: "Turn the slope into two terraced levels with segmental block retaining walls, a small set of steps between levels and planting on each terrace",
    text: "sloped backyard turned into two terraced levels with segmental block retaining walls, steps between levels and planting on each terrace",
    weight: 1,
  },
  {
    key: "spa-deck",
    label: "hot tub on a composite deck",
    renderType: "landscape",
    scenes: ["backyard", "patio"],
    edit: "Add a low composite deck with a built-in hot tub, a privacy screen on one side and planters at the corners",
    text: "backyard with a low composite deck, built-in hot tub, privacy screen and corner planters",
    weight: 1,
  },
  {
    key: "modern-facade-refresh",
    label: "modern exterior refresh",
    renderType: "exterior",
    scenes: ["house_exterior"],
    edit: "Refresh the house exterior: modern paint scheme in warm white with black window frames, horizontal wood-look accent siding, a new modern garage door and updated light fixtures; keep the roofline and windows in place",
    text: "single-family home with a modern exterior refresh: warm white paint, black window frames, horizontal wood-look accent siding and a modern garage door",
    weight: 2,
  },
  {
    key: "kitchen-remodel",
    label: "kitchen remodel",
    renderType: "interior",
    scenes: ["interior"],
    edit: "Remodel the kitchen: white oak shaker cabinets, quartz countertops, a large island with seating, a zellige tile backsplash and brass fixtures; keep the room's layout, windows and ceiling",
    text: "remodeled kitchen with white oak shaker cabinets, quartz countertops, a large island with seating, zellige tile backsplash and brass fixtures",
    weight: 1,
  },
  {
    key: "living-room-refresh",
    label: "living room refresh",
    renderType: "interior",
    scenes: ["interior"],
    edit: "Refresh the living room: warm neutral paint, a large sofa and lounge chairs, a jute rug, linen curtains and layered lighting; keep the windows, doors and ceiling",
    text: "refreshed living room with warm neutral walls, a large sofa, lounge chairs, jute rug, linen curtains and layered lighting",
    weight: 1,
  },
  {
    key: "commercial-courtyard",
    label: "commercial courtyard",
    renderType: "landscape",
    scenes: ["commercial", "patio"],
    edit: "Turn the space into a commercial courtyard: large-format pavers, raised planters with trees, bench seating and a shade structure",
    text: "commercial office courtyard with large-format pavers, raised planters with trees, bench seating and a shade structure",
    weight: 1,
  },
]

export const REGIONS = [
  "Austin, TX",
  "Dallas, TX",
  "Houston, TX",
  "San Antonio, TX",
  "Phoenix, AZ",
  "Tampa, FL",
  "Orlando, FL",
  "Southern California",
  "Atlanta, GA",
  "Charlotte, NC",
] as const

export type SourceForPlan = {
  id: string
  kind: "own" | "stock"
  scene: Scene
  timesUsed: number
}

export type PlannedJob = {
  conceptKey: string
  renderType: RenderType
  sourceId: string | null
  prompt: string
  title: string
  altText: string
  caption: string
  slug: string
  region: string
}

/** Small deterministic PRNG so a day's plan is stable if re-run. */
export function seededRandom(seed: string): () => number {
  let h = 1779033703 ^ seed.length
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353)
    h = (h << 13) | (h >>> 19)
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507)
    h = Math.imul(h ^ (h >>> 13), 3266489909)
    h ^= h >>> 16
    return (h >>> 0) / 4294967296
  }
}

function weightedPick<T extends { weight: number }>(items: T[], rand: () => number): T {
  const total = items.reduce((sum, item) => sum + item.weight, 0)
  let roll = rand() * total
  for (const item of items) {
    roll -= item.weight
    if (roll <= 0) return item
  }
  return items[items.length - 1]
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
}

const PHOTO_RULES =
  "Keep the camera angle, framing, the house, neighboring structures, fences, property lines, existing trees outside the work area and the direction of sunlight exactly as they are. Only change what is described. Photorealistic, true-to-scale, natural materials, believable construction details. No text, no logos, no watermarks, no people."

const TEXT_RULES =
  "Photorealistic, looks like a real photo taken at eye level on a phone camera in daylight, true-to-scale, believable construction details. No text, no logos, no watermarks, no people."

export function buildPhotoPrompt(concept: Concept, scene: Scene): string {
  return `Edit this photo of a real ${SCENE_LABELS[scene]}. ${concept.edit}. ${PHOTO_RULES}`
}

export function buildTextPrompt(concept: Concept, region: string): string {
  return `A ${concept.text}, at a typical home in ${region}. ${TEXT_RULES}`
}

export function buildSeoText(
  concept: Concept,
  region: string,
  mode: "own" | "stock" | "text",
  scene: Scene | null,
  index: number
): { title: string; altText: string; caption: string; slug: string } {
  const city = region.split(",")[0]
  const title = `${capitalize(concept.label)} concept, ${city}`
  const altText =
    mode === "text"
      ? `AI concept rendering of a ${concept.label} at a ${city}-style home`
      : `AI concept rendering of a ${concept.label} added to a photo of a ${SCENE_LABELS[scene ?? "other"]}`
  const caption =
    mode === "own"
      ? `Job-site photo to ${concept.label} concept in about 30 seconds with Renderspace.`
      : mode === "stock"
        ? `Photo to ${concept.label} concept with Renderspace. Source photo: free-license stock.`
        : `${capitalize(concept.label)} concept rendering made with Renderspace.`
  const slug = slugify(
    `${concept.key}-${city}-${mode === "text" ? "concept" : "photo-to-concept"}-${String(index + 1).padStart(2, "0")}`
  )
  return { title, altText, caption, slug }
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

export type PlanOptions = {
  date: string
  count: number
  sources: SourceForPlan[]
  /** Max share of jobs that use a photo, when photos exist. */
  photoShare?: number
  /** Concept keys to favour or avoid (from the editor's learnings). */
  boostKeys?: string[]
  avoidKeys?: string[]
  /** Index offset so slugs don't collide with jobs already planned today. */
  startIndex?: number
}

/**
 * Build `count` jobs: own photos first (least used), then stock photos, then
 * text-only. No concept is used twice in a day until every eligible concept
 * has been used once.
 */
export function planJobs(options: PlanOptions): PlannedJob[] {
  const { date, count, sources } = options
  const startIndex = options.startIndex ?? 0
  const photoShare = options.photoShare ?? 0.6
  const rand = seededRandom(`${date}:${startIndex}`)
  const avoid = new Set(options.avoidKeys ?? [])
  const boost = new Set(options.boostKeys ?? [])

  const weighted = CONCEPTS.filter((c) => !avoid.has(c.key)).map((c) => ({
    ...c,
    weight: boost.has(c.key) ? c.weight * 3 : c.weight,
  }))
  const pool = weighted.length ? weighted : CONCEPTS

  const ownFirst = [...sources].sort((a, b) => {
    if (a.kind !== b.kind) return a.kind === "own" ? -1 : 1
    return a.timesUsed - b.timesUsed
  })
  const photoSlots = Math.min(ownFirst.length, Math.round(count * photoShare))

  const usedToday = new Set<string>()
  const pickConcept = (scene: Scene | null): Concept => {
    let eligible = pool.filter((c) => scene === null || c.scenes.includes(scene))
    if (eligible.length === 0) eligible = pool
    const fresh = eligible.filter((c) => !usedToday.has(c.key))
    const chosen = weightedPick(fresh.length ? fresh : eligible, rand)
    usedToday.add(chosen.key)
    return chosen
  }

  const jobs: PlannedJob[] = []
  for (let i = 0; i < count; i++) {
    const region = REGIONS[Math.floor(rand() * REGIONS.length)]
    const index = startIndex + i
    if (i < photoSlots) {
      const source = ownFirst[i % ownFirst.length]
      const concept = pickConcept(source.scene)
      jobs.push({
        conceptKey: concept.key,
        renderType: concept.renderType,
        sourceId: source.id,
        prompt: buildPhotoPrompt(concept, source.scene),
        region,
        ...buildSeoText(concept, region, source.kind, source.scene, index),
      })
    } else {
      const concept = pickConcept(null)
      jobs.push({
        conceptKey: concept.key,
        renderType: concept.renderType,
        sourceId: null,
        prompt: buildTextPrompt(concept, region),
        region,
        ...buildSeoText(concept, region, "text", null, index),
      })
    }
  }
  return jobs
}

/** Hosts the ingest step may download stock photos from. */
export const STOCK_HOSTS = ["images.pexels.com", "images.unsplash.com", "cdn.pixabay.com"]

export function isAllowedStockUrl(raw: string): boolean {
  try {
    const url = new URL(raw)
    return url.protocol === "https:" && STOCK_HOSTS.includes(url.hostname)
  } catch {
    return false
  }
}

/** "2026-10-15" in America/Chicago. */
export function chicagoDate(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Chicago",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now)
}
