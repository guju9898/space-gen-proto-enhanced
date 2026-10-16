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
 *
 * Prompts follow the Renderspace Studio guide: presets set the direction
 * (concept basics), custom strings define the details (materials, focal
 * objects, planting, lighting), and compare pairs change one variable at a time.
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

/**
 * Detail slots mirror the Studio's control groups (Renderspace Studio guide):
 *   materials + finishes -> "Style & materials"
 *   structure + features -> "Features"
 *   planting             -> "Planting"
 *   lighting             -> "Lighting & mood"
 *
 * Every option is written like a good Studio custom string:
 *   [feature] + [material / finish] + [form or color] + [location] + [lighting or mood]
 * e.g. "two patinated bronze figurative statues positioned between sculpted
 * boxwood hedges, softly lit from below" instead of "garden sculptures".
 */
export type Slot = "materials" | "finishes" | "structure" | "features" | "planting" | "lighting"

export const SLOTS: Slot[] = ["materials", "finishes", "structure", "features", "planting", "lighting"]

/** One custom-string option. `short` names it in titles and slugs. */
export type DetailDef = { short: string; text: string; photoOk?: boolean }

/** A chosen detail, stored on the job so QC, SEO text and the editor can see it. */
export type DetailPick = { slot: Slot; id: string; short: string; text: string }

export type Concept = {
  key: string
  label: string
  renderType: RenderType
  /** Scenes a photo can show for this concept to make sense. */
  scenes: Scene[]
  /** Project basics when editing a real photo: what gets built. */
  edit: string
  /** Project basics for text-only renders: the space and design direction. */
  basics: string
  /** Optional composition note (Advanced refinements) for text-only renders. */
  composition?: string
  /** Composition note for photo edits, which keep the photo's viewpoint. */
  photoComposition?: string
  /** Custom-string options per slot. Lighting falls back to the shared list. */
  slots: Partial<Record<Slot, DetailDef[]>>
  /** Where the text-only scene sits; defaults to "a typical home". */
  setting?: string
  /** Regions where this design makes sense; defaults to all. */
  regions?: string[]
  /** Relative weight in the auto plan (outdoor-led). */
  weight: number
}

const d = (short: string, text: string, photoOk?: boolean): DetailDef => ({ short, text, ...(photoOk ? { photoOk } : {}) })

/** Shared outdoor lighting. photoOk options are safe when editing a real photo. */
export const OUTDOOR_LIGHTING: DetailDef[] = [
  d("bright midday sun", "bright midday sun with crisp, clean shadows and true material colors"),
  d("soft overcast light", "soft overcast daylight with even, gentle shadows that show stone texture"),
  d("golden hour", "warm golden-hour light low from the side with long soft shadows", true),
  d("dusk lighting", "blue-hour dusk with warm path lights, uplit trees and softly glowing windows", true),
  d("early morning light", "clear early-morning light with a fresh, slightly cool tone"),
]

/** The default for photo edits: keep the photo's own light. */
export const KEEP_PHOTO_LIGHT: DetailDef = d(
  "natural daylight",
  "keep the photo's own daylight, sun direction and shadows",
  true
)

const INTERIOR_LIGHTING: DetailDef[] = [
  d("natural daylight", "bright natural daylight from the windows with soft bounce light", true),
  d("warm evening light", "warm evening ambience with soft indirect cove lighting and glowing pendants", true),
  d("soft morning light", "soft morning light raking across the surfaces to show texture", true),
]

const FIRE_LIGHTING: DetailDef[] = [
  d("dusk with the fire lit", "dusk with the fire lit and warm string lights overhead", true),
  d("golden hour", "warm golden-hour light with the fire just lit", true),
  d("blue hour", "blue hour with low path lights, glowing seat-wall lights and the fire lit", true),
]

const NIGHT_LIGHTING: DetailDef[] = [
  d("blue hour", "blue-hour dusk sky with warm 2700K landscape lighting", true),
  d("full night", "full night with a dark sky so every light fixture reads clearly", true),
]

export const CONCEPTS: Concept[] = [
  {
    key: "pool-paver-patio",
    label: "rectangular pool and patio",
    renderType: "landscape",
    scenes: ["backyard", "pool"],
    edit: "Add a rectangular in-ground pool with a full patio deck around it and planting beds along the fence",
    basics: "suburban backyard with a new rectangular in-ground pool and a full patio deck, clean contemporary lines",
    slots: {
      materials: [
        d("travertine deck", "light ivory travertine pavers in a French pattern for the deck, with matching bullnose travertine coping"),
        d("charcoal slate deck", "large-format charcoal slate pavers in a staggered pattern with narrow light-gray joints, and honed slate coping"),
        d("white marble coping", "honed white marble coping with subtle gray veining around the pool, set into a warm sand-colored paver deck"),
        d("bluestone deck", "thermal-finish bluestone coping and a bluestone deck in a running bond"),
        d("wood-look porcelain deck", "wood-look porcelain plank deck in warm oak tones with a thin dark-gray coping edge"),
      ],
      finishes: [
        d("midnight pebble finish", "a midnight-blue pebble interior so the water reads deep blue"),
        d("white plaster finish", "a bright white plaster interior for clear turquoise water"),
        d("blue glass tile", "deep blue glass mosaic waterline tile with a light gray plaster interior"),
        d("charcoal waterline tile", "matte charcoal waterline tile with a sand-gray plaster interior"),
      ],
      features: [
        d("sheer descent wall", "a sheer descent spilling from a raised back wall clad in stacked charcoal slate"),
        d("bronze scuppers", "three bronze scuppers pouring into the pool from a raised wall capped in honed white marble"),
        d("sun shelf", "a shallow sun shelf at one end with two white in-water loungers and a bubbler"),
        d("spillover spa", "a raised square spa at the corner spilling into the pool over a thin stone edge"),
        d("fire bowls", "two round cast-concrete fire bowls on pedestals flanking the back wall"),
      ],
      planting: [
        d("italian cypress", "a row of evenly spaced Italian cypress along the back fence with low clipped boxwood in front"),
        d("tropical palms", "two queen palms, bird of paradise and lush tropical groundcover in raised beds"),
        d("lavender and grasses", "soft ornamental grasses, lavender and white roses in long rectangular beds"),
        d("olive trees", "a pair of multi-trunk olive trees with rosemary and silver groundcover beneath"),
      ],
    },
    weight: 3,
  },
  {
    key: "freeform-pool-boulders",
    label: "freeform lagoon pool",
    renderType: "landscape",
    scenes: ["backyard", "pool"],
    edit: "Add a freeform in-ground pool designed like a natural lagoon, with natural stone around its edge",
    basics: "backyard with a freeform in-ground pool designed like a natural lagoon",
    slots: {
      materials: [
        d("flagstone coping", "Oklahoma-style flagstone coping in warm buff and rust tones with a matching flagstone patio"),
        d("river rock beach entry", "a smooth river-rock beach entry blending into tan flagstone coping"),
        d("limestone slab coping", "rough-cut limestone slab coping with a cool-gray textured concrete deck"),
      ],
      features: [
        d("boulder waterfall", "a natural moss-rock boulder waterfall at the back of the pool, about five feet tall"),
        d("rock grotto", "a rock grotto with a shaded cave seat under a boulder waterfall"),
        d("boulder slide", "a boulder slide winding down into the deep end"),
        d("jumping rock", "a large flat jumping rock beside a cascading boulder spillway"),
      ],
      finishes: [
        d("aqua pebble finish", "an aqua-green pebble interior for a natural lagoon color"),
        d("dark pebble finish", "a dark blue-black pebble interior that reflects like a pond"),
      ],
      planting: [
        d("ferns and maples", "ferns, mondo grass and Japanese maples tucked between the boulders"),
        d("native plants", "native Texas sage, yucca and ornamental grasses around the rocks"),
        d("tropical planting", "banana plants, elephant ears and palms framing the waterfall"),
      ],
    },
    weight: 2,
  },
  {
    key: "pool-remodel",
    label: "pool remodel",
    renderType: "landscape",
    scenes: ["pool"],
    edit: "Remodel the existing pool with a new interior finish, new waterline tile, new coping and a new deck. Keep the pool's shape, size and position",
    basics: "remodeled backyard pool with a new interior finish, waterline tile, coping and deck",
    slots: {
      finishes: [
        d("blue-gray pebble finish", "a blue-gray pebble interior with matching blue-gray porcelain waterline tile"),
        d("white plaster and glass tile", "a bright white plaster interior with a band of cobalt glass mosaic waterline tile"),
        d("sand quartz finish", "a sandy beige quartz interior with stone-look waterline tile for soft lagoon-green water"),
      ],
      materials: [
        d("travertine deck", "light ivory travertine coping and deck pavers in a French pattern"),
        d("charcoal slate deck", "honed charcoal slate coping with a large-format slate deck and narrow light-gray joints"),
        d("white marble coping", "honed white marble coping with subtle gray veining and a light porcelain paver deck"),
        d("bluestone deck", "thermal-finish bluestone coping and deck"),
      ],
      features: [
        d("deck jets", "two arcing deck jets along the long side of the pool"),
        d("new tanning ledge", "a new tanning ledge with bubblers at the shallow end"),
        d("lit planter wall", "a low raised planter wall behind the pool with soft step lights"),
      ],
    },
    weight: 1,
  },
  {
    key: "formal-courtyard",
    label: "formal courtyard garden",
    renderType: "landscape",
    scenes: ["backyard", "front_yard", "patio", "commercial"],
    edit: "Turn the space into a formal, symmetrical courtyard garden with a central focal point and sculpted hedges",
    basics: "formal, symmetrical courtyard garden with a central focal point and sculpted hedges",
    composition: "symmetrical view straight down the central axis",
    photoComposition: "lay the design out symmetrically along a central axis where the space allows",
    slots: {
      materials: [
        d("charcoal slate paving", "large-format charcoal slate pavers in a staggered pattern with narrow light-gray joints"),
        d("travertine paving", "honed ivory travertine paving with crisp limestone banding"),
        d("gravel and limestone paths", "pale crushed-gravel paths edged in cut limestone"),
        d("slate with marble inlay", "dark slate paving with an inset border of honed white marble"),
      ],
      features: [
        d("bronze statues", "two patinated bronze figurative statues positioned between sculpted boxwood hedges"),
        d("marble statues", "a pair of white marble statues on honed marble plinths at the far end of the axis"),
        d("marble fountain", "a tiered white marble fountain at the center of the courtyard"),
        d("reflecting pool", "a round reflecting pool with a single bronze jet at the center"),
        d("bronze urns", "large aged-bronze urns on limestone pedestals marking each corner"),
      ],
      planting: [
        d("boxwood parterre", "a sculpted boxwood parterre in low geometric knots"),
        d("hedges and cypress", "low clipped boxwood hedges, evenly spaced Italian cypress and lavender edging along the path"),
        d("yew hedge walls", "tall clipped yew hedges as green walls, with standard bay trees in square planters"),
        d("boxwood spheres", "boxwood spheres in a regular grid with white hydrangeas behind"),
      ],
    },
    weight: 2,
  },
  {
    key: "mediterranean-terrace",
    label: "Mediterranean dining terrace",
    renderType: "landscape",
    scenes: ["backyard", "patio"],
    edit: "Turn the space into a Mediterranean-style terrace for outdoor dining",
    basics: "Mediterranean-style garden terrace set for outdoor dining",
    regions: ["Southern California", "Phoenix, AZ", "Austin, TX", "San Antonio, TX", "Dallas, TX", "Tampa, FL", "Orlando, FL"],
    slots: {
      materials: [
        d("tumbled travertine", "tumbled travertine pavers in a Versailles pattern"),
        d("terracotta tile", "handmade terracotta tiles with wide sand-colored grout joints"),
        d("weathered limestone", "warm limestone slabs with a weathered, softened finish"),
      ],
      structure: [
        d("wisteria pergola", "a timber pergola covered in flowering wisteria over a long dining table"),
        d("stucco loggia", "a whitewashed stucco loggia with arched openings along one side"),
        d("grapevine pergola", "a rustic chestnut pergola with grapevines and festoon lights over the table"),
      ],
      features: [
        d("lemon tree urns", "oversized terracotta urns planted with lemon trees at the terrace corners"),
        d("limestone wall fountain", "a carved limestone wall fountain with a small basin on the back wall"),
        d("mosaic bench", "a built-in bench clad in blue and white mosaic tile along the wall"),
      ],
      planting: [
        d("olive and lavender", "olive trees, lavender drifts and rosemary hedges"),
        d("cypress and bougainvillea", "pairs of Italian cypress, bougainvillea on the walls and potted geraniums"),
        d("myrtle and agapanthus", "clipped myrtle, blue agapanthus and silver-leaved santolina"),
      ],
    },
    weight: 1,
  },
  {
    key: "outdoor-kitchen-pergola",
    label: "outdoor kitchen",
    renderType: "landscape",
    scenes: ["backyard", "patio"],
    edit: "Add an L-shaped outdoor kitchen with a built-in grill and bar seating, covered overhead, on a new patio",
    basics: "backyard patio with an L-shaped outdoor kitchen, built-in grill and bar seating, covered overhead",
    slots: {
      finishes: [
        d("black granite counters", "honed black granite countertops on a stacked limestone veneer base"),
        d("white quartzite counters", "white quartzite countertops with a board-formed concrete base"),
        d("soapstone counters", "leathered soapstone countertops on a charcoal ledgestone base"),
        d("concrete counters", "polished concrete countertops on a base clad in warm oak-look porcelain"),
      ],
      structure: [
        d("cedar pergola", "a cedar pergola with exposed rafter tails stained a warm honey tone"),
        d("louvered pergola", "a black aluminum louvered pergola with the louvers half open"),
        d("canvas shade pergola", "a steel-frame pergola with a retractable sand-colored canvas shade"),
        d("cedar pavilion", "a gabled pavilion with a tongue-and-groove cedar ceiling and a ceiling fan"),
      ],
      materials: [
        d("porcelain pavers", "large-format warm-gray porcelain pavers"),
        d("travertine pavers", "light travertine pavers in a French pattern"),
        d("charcoal slate paving", "charcoal slate pavers with narrow light-gray joints"),
        d("brick herringbone", "reclaimed red brick pavers in a herringbone pattern"),
      ],
      features: [
        d("pizza oven", "a built-in dome pizza oven finished in matching stone at the end of the counter"),
        d("bar stools and pendants", "four woven-leather bar stools under black outdoor pendant lights"),
        d("outdoor tv", "a wall-mounted outdoor TV above a stone console beside the kitchen"),
      ],
    },
    weight: 2,
  },
  {
    key: "fire-pit-seating",
    label: "fire pit lounge",
    renderType: "landscape",
    scenes: ["backyard", "patio"],
    edit: "Add a fire pit lounge with built-in seating on a new patio",
    basics: "backyard fire pit lounge with built-in seating",
    slots: {
      features: [
        d("granite fire pit", "a round fire pit built from rough-cut granite blocks at the center"),
        d("steel fire table", "a long linear gas fire table in blackened steel"),
        d("sunken fire pit", "a sunken conversation pit with a curved built-in bench around a gas fire bowl"),
        d("concrete fire pit", "a square board-formed concrete fire pit with a low glass wind guard"),
      ],
      materials: [
        d("flagstone in gravel", "irregular flagstone set in golden decomposed granite"),
        d("charcoal slate paving", "charcoal slate pavers with narrow light-gray joints"),
        d("travertine pavers", "light travertine pavers in a French pattern"),
        d("brick herringbone", "reclaimed red brick in a herringbone pattern"),
      ],
      structure: [
        d("limestone seat walls", "curved seat walls capped in honed limestone"),
        d("slate seat walls", "built-in seat walls clad in stacked charcoal slate with sand-colored cushions"),
        d("teak lounge chairs", "four low teak lounge chairs with oatmeal cushions"),
      ],
      lighting: FIRE_LIGHTING,
    },
    weight: 2,
  },
  {
    key: "covered-patio",
    label: "covered patio",
    renderType: "exterior",
    scenes: ["backyard", "patio", "house_exterior"],
    edit: "Add a covered patio attached to the back of the house, roofed to match the house",
    basics: "back of a single-story home with a new attached covered patio",
    slots: {
      structure: [
        d("cedar ceiling", "a gable roof matching the house with a stained tongue-and-groove cedar ceiling and exposed beams"),
        d("flat roof", "a flat roof with a smooth white ceiling, slim black fascia and recessed lights"),
        d("stone columns", "a hip roof on square columns clad in stacked limestone"),
      ],
      materials: [
        d("porcelain tile floor", "large-format warm-gray porcelain tile floor"),
        d("stained concrete floor", "soft charcoal stained concrete floor with saw-cut joints"),
        d("travertine floor", "light travertine floor in a French pattern"),
      ],
      features: [
        d("limestone fireplace", "an outdoor fireplace in stacked limestone at one end"),
        d("ceiling fans and sofa", "two black ceiling fans over a deep sectional sofa and a teak coffee table"),
        d("outdoor tv", "a wall-mounted outdoor TV over a built-in stone console"),
        d("solar screens", "drop-down solar screens half lowered on the sunny side"),
      ],
    },
    weight: 2,
  },
  {
    key: "xeriscape",
    label: "desert xeriscape",
    renderType: "landscape",
    scenes: ["backyard", "front_yard"],
    edit: "Replace the lawn with a drought-tolerant desert-modern xeriscape",
    basics: "drought-tolerant desert-modern xeriscape yard",
    regions: ["Phoenix, AZ", "Austin, TX", "San Antonio, TX", "Dallas, TX", "Southern California"],
    slots: {
      materials: [
        d("decomposed granite", "golden decomposed granite paths with crisp black steel edging"),
        d("concrete pads and pebbles", "large-format concrete stepping pads set in black Mexican beach pebbles"),
        d("corten and crushed stone", "rust-toned crushed stone with corten steel edging"),
      ],
      features: [
        d("limestone boulders", "a cluster of three weathered limestone boulders as the focal point"),
        d("corten water bowl", "a corten steel water bowl overflowing onto river rock"),
        d("gabion wall", "a low gabion wall filled with local stone along one side"),
      ],
      planting: [
        d("agave and barrel cactus", "blue agave, golden barrel cactus and soft Mexican feather grass"),
        d("yucca and red yucca", "yucca rostrata, red yucca and silver ponyfoot"),
        d("palo verde", "a palo verde tree with desert spoon, lantana and pink muhly grass"),
      ],
    },
    weight: 2,
  },
  {
    key: "front-yard-curb-appeal",
    label: "front yard curb appeal",
    renderType: "landscape",
    scenes: ["front_yard", "house_exterior"],
    edit: "Give the front yard a curb appeal makeover with a new walkway to the front door, new planting beds and fresh mulch",
    basics: "front yard curb appeal makeover leading to the front door",
    slots: {
      materials: [
        d("charcoal slate walkway", "a wide walkway of charcoal slate pavers with narrow light-gray joints"),
        d("bluestone walkway", "a bluestone walkway with a red brick soldier-course border"),
        d("concrete pads and turf", "large-format concrete pads with ribbons of turf between them"),
        d("travertine walkway", "a tumbled travertine walkway in a French pattern"),
      ],
      features: [
        d("boxwood spheres in planters", "a pair of clipped boxwood spheres in zinc planters flanking the front steps"),
        d("bronze lanterns", "a pair of bronze lanterns on limestone piers at the start of the walkway"),
        d("stone seat wall", "a low stone seat wall curving along the front bed"),
        d("crape myrtle focal tree", "a single multi-trunk crape myrtle as the focal tree in the main bed"),
      ],
      planting: [
        d("boxwood and hydrangea", "layered beds of boxwood, white hydrangea and liriope"),
        d("maple and ferns", "a Japanese maple with ferns and hostas in curved beds"),
        d("holly and lavender", "dwarf yaupon holly, lavender and ornamental grasses"),
        d("shrub roses", "white shrub roses with a low clipped boxwood border"),
      ],
    },
    weight: 2,
  },
  {
    key: "landscape-lighting-dusk",
    label: "landscape lighting",
    renderType: "landscape",
    scenes: ["backyard", "front_yard", "house_exterior", "pool"],
    edit: "Show this same space at dusk with a full landscape lighting design",
    basics: "home at dusk with a full landscape lighting design",
    slots: {
      features: [
        d("tree uplighting", "warm uplights on the tree canopies and soft wash lights on the facade"),
        d("brass path lights", "low brass path lights about every six feet along the walkway"),
        d("step and wall lights", "step lights in every riser and softly lit garden walls"),
        d("moonlighting", "moonlighting from high in the trees casting soft leaf shadows on the lawn"),
        d("uplit cypress", "uplit columns of Italian cypress and a glowing water feature"),
      ],
      lighting: NIGHT_LIGHTING,
    },
    weight: 1,
  },
  {
    key: "retaining-wall-terraces",
    label: "terraced retaining walls",
    renderType: "landscape",
    scenes: ["backyard", "front_yard"],
    edit: "Turn the slope into two terraced levels with retaining walls and steps between them",
    basics: "sloped backyard turned into two terraced levels with retaining walls and steps between them",
    slots: {
      materials: [
        d("fieldstone walls", "dry-stacked fieldstone walls in warm tan and gray"),
        d("board-formed concrete walls", "board-formed concrete walls with an ipe wood bench cap"),
        d("limestone block walls", "split-face limestone block walls with a smooth limestone cap"),
        d("corten walls", "corten steel retaining walls with a rich rust patina"),
      ],
      features: [
        d("wide stone steps", "wide stone steps with a landing between the levels"),
        d("built-in bench", "a built-in bench along the upper wall facing the view"),
        d("water runnel", "a narrow stone runnel of water stepping down beside the stairs"),
      ],
      planting: [
        d("cascading rosemary", "trailing rosemary and creeping jenny spilling over the walls"),
        d("grasses and coneflowers", "ornamental grasses and coneflowers on each terrace"),
        d("boxwood and lawn", "boxwood hedges with a small lawn panel on the upper level"),
      ],
    },
    weight: 1,
  },
  {
    key: "spa-deck",
    label: "hot tub deck",
    renderType: "landscape",
    scenes: ["backyard", "patio"],
    edit: "Add a low deck with a built-in hot tub and some privacy on one side",
    basics: "backyard with a low deck and a built-in hot tub",
    slots: {
      materials: [
        d("walnut composite deck", "a low composite deck in warm walnut tones"),
        d("thermally modified ash deck", "a thermally modified ash deck with hidden fasteners"),
        d("ipe deck", "an ipe hardwood deck with a rich oiled finish"),
      ],
      features: [
        d("stone-surround hot tub", "a built-in square hot tub with a honed stone surround"),
        d("cedar soaking tub", "a round cedar soaking tub sunk into the deck"),
        d("slate spa", "an in-ground spa with a stacked charcoal slate surround and a small fire bowl beside it"),
      ],
      structure: [
        d("cedar slat screen", "a horizontal cedar slat privacy screen on one side"),
        d("steel pergola with jasmine", "a black steel pergola overhead with climbing star jasmine"),
      ],
      planting: [
        d("bamboo planters", "clumping bamboo in tall black planters"),
        d("forest grass and ferns", "Japanese forest grass and ferns in corner planters"),
      ],
    },
    weight: 1,
  },
  {
    key: "modern-facade-refresh",
    label: "exterior refresh",
    renderType: "exterior",
    scenes: ["house_exterior"],
    edit: "Refresh the house exterior with new cladding, colors, entry and fixtures. Keep the roofline, windows and overall shape in place",
    basics: "single-family home with a refreshed exterior",
    slots: {
      materials: [
        d("limewashed brick", "a limewashed brick facade in soft chalky white"),
        d("limestone cladding", "warm limestone cladding across the main facade"),
        d("dark timber siding", "dark vertical timber siding with a low stone base"),
        d("stucco and board-and-batten", "smooth white stucco with board-and-batten accents on the gables"),
        d("fiber cement and cedar", "charcoal fiber-cement panels with warm cedar soffits"),
      ],
      finishes: [
        d("standing-seam roof", "a charcoal standing-seam metal roof and deep bronze window frames"),
        d("black frames", "black window frames, black gutters and a matte black front door"),
        d("warm white trim", "warm white trim with a deep green front door"),
      ],
      features: [
        d("fluted stone entry", "a fluted stone entry surround around the front door"),
        d("oak pivot door", "an oversized white oak pivot front door"),
        d("bronze wall lanterns", "a pair of tall bronze wall lanterns beside the door"),
        d("steel entry canopy", "a slim black steel canopy over the entry"),
      ],
      planting: [
        d("boxwood and grasses", "clean foundation planting of boxwood and ornamental grasses"),
        d("maples and gravel", "a pair of Japanese maples in a crisp gravel border"),
      ],
    },
    weight: 2,
  },
  {
    key: "kitchen-remodel",
    label: "kitchen remodel",
    renderType: "interior",
    scenes: ["interior"],
    edit: "Remodel the kitchen with new cabinetry, counters, backsplash and fixtures. Keep the room's layout, windows and ceiling",
    basics: "remodeled kitchen with a large island",
    slots: {
      finishes: [
        d("walnut and bronze", "warm walnut cabinetry with brushed bronze hardware"),
        d("white oak cabinets", "white oak flat-panel cabinets with slim black pulls"),
        d("green shaker cabinets", "deep green shaker cabinets with unlacquered brass hardware"),
        d("white inset cabinets", "painted white inset cabinets with polished nickel knobs"),
      ],
      materials: [
        d("marble island", "a creamy marble island with soft gray veining"),
        d("quartzite counters", "white quartzite counters with dramatic gray movement"),
        d("soapstone counters", "honed black soapstone counters"),
      ],
      features: [
        d("zellige backsplash", "a handmade zellige tile backsplash in soft white"),
        d("marble slab backsplash", "a full-height marble slab backsplash behind the range"),
        d("plaster range hood", "a smooth plaster range hood"),
      ],
      lighting: INTERIOR_LIGHTING,
    },
    weight: 1,
  },
  {
    key: "living-room-refresh",
    label: "living room refresh",
    renderType: "interior",
    scenes: ["interior"],
    edit: "Refresh the living room with new finishes, furniture and lighting. Keep the windows, doors and ceiling",
    basics: "refreshed living room",
    slots: {
      finishes: [
        d("limewash walls", "warm limewash walls in a soft clay tone"),
        d("white oak paneling", "white oak wall paneling on the fireplace wall"),
        d("warm white walls", "warm white walls with a pale oak floor"),
      ],
      features: [
        d("fluted plaster fireplace", "a fluted plaster fireplace surround"),
        d("travertine coffee table", "a chunky travertine coffee table on a wool rug"),
        d("oak built-ins", "built-in white oak shelving on both sides of the fireplace"),
      ],
      structure: [
        d("boucle sofa", "a deep cream boucle sofa and two cognac leather lounge chairs"),
        d("linen sectional", "an oatmeal linen sectional with a jute rug"),
      ],
      lighting: INTERIOR_LIGHTING,
    },
    weight: 1,
  },
  {
    key: "commercial-courtyard",
    label: "commercial courtyard",
    renderType: "landscape",
    scenes: ["commercial", "patio"],
    edit: "Turn the space into a commercial courtyard with seating, shade and planting",
    basics: "commercial office courtyard with seating, shade and planting",
    setting: "a mid-size office building",
    slots: {
      materials: [
        d("light porcelain pavers", "large-format light-gray porcelain pavers"),
        d("granite setts", "granite setts laid in a fan pattern"),
        d("concrete and turf bands", "smooth concrete with bands of turf and dark granite"),
      ],
      features: [
        d("granite water wall", "a long linear water wall in honed black granite"),
        d("bronze sculptures", "a pair of abstract bronze sculptures on low limestone plinths"),
        d("corten planter benches", "corten steel raised planters with built-in timber benches"),
      ],
      structure: [
        d("steel canopy", "a white steel shade canopy over part of the seating"),
        d("shade sails", "overlapping sand-colored tensile shade sails"),
      ],
      planting: [
        d("live oaks", "live oaks in raised planters with liriope beneath"),
        d("crape myrtle grove", "a grove of multi-trunk crape myrtles with ornamental grasses"),
      ],
    },
    weight: 1,
  },
  {
    key: "zen-garden",
    label: "Japanese-style garden",
    renderType: "landscape",
    scenes: ["backyard", "patio"],
    edit: "Turn the space into a calm Japanese-style garden",
    basics: "calm Japanese-style garden",
    slots: {
      materials: [
        d("raked gravel and basalt", "raked white granite gravel with charcoal basalt stepping stones"),
        d("moss and bluestone", "a moss lawn with large irregular bluestone stepping stones"),
        d("river pebbles and granite path", "dark river pebbles with a cut granite path"),
      ],
      features: [
        d("stone lantern", "a carved granite stone lantern beside a small pond"),
        d("bamboo water spout", "a bamboo water spout dripping into a stone basin"),
        d("boulder group", "three large weathered boulders set in the raked gravel"),
        d("cedar bridge", "a simple cedar bridge over a narrow stream"),
      ],
      planting: [
        d("red japanese maple", "a red Japanese maple with mondo grass and moss"),
        d("cloud-pruned pines", "cloud-pruned pines and low clipped azaleas"),
        d("black bamboo", "a black bamboo screen with ferns at its base"),
      ],
    },
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
  details: DetailPick[]
  /** Set on both renders of a compare pair (same design, one detail swapped). */
  compareGroup: string | null
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

/** Stable id for a detail, shared across concepts: "materials.charcoal-slate-paving". */
export function detailId(slot: Slot, short: string): string {
  return `${slot}.${slugify(short)}`
}

// ---------- Editor-supplied custom strings ----------

/** A custom string the editor bot adds through content_render_guidance.extra_details. */
export type ExtraDetail = { concept: string; slot: Slot; short: string; text: string }

/**
 * Validate extra_details from the database. The editor bot writes these, so they
 * are treated as data: known concepts and slots only, plain text, length-capped,
 * no instructions-looking content, at most 40.
 */
export function sanitizeExtraDetails(raw: unknown): ExtraDetail[] {
  if (!Array.isArray(raw)) return []
  const keys = new Set(CONCEPTS.map((c) => c.key))
  const out: ExtraDetail[] = []
  const clean = (v: unknown, max: number) =>
    typeof v === "string" ? v.replace(/[\r\n\t]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max) : ""
  for (const item of raw) {
    if (!item || typeof item !== "object") continue
    const r = item as Record<string, unknown>
    const concept = clean(r.concept, 60)
    const slot = clean(r.slot, 20) as Slot
    const short = clean(r.short, 40)
    const text = clean(r.text, 200)
    if (!keys.has(concept) || !SLOTS.includes(slot)) continue
    if (short.length < 3 || text.length < 12) continue
    if (/https?:|www\.|ignore|instruction|prompt|logo|watermark|text that says|lettering/i.test(`${short} ${text}`)) continue
    if (/[<>{}`]/.test(`${short} ${text}`)) continue
    out.push({ concept, slot, short, text })
    if (out.length >= 40) break
  }
  return out
}

// ---------- Prompt building ----------

const PHOTO_RULES =
  "Keep the camera angle, framing, the house, neighboring structures, fences, property lines and existing trees outside the work area exactly as they are. Only change what is described. Photorealistic, true-to-scale, believable construction details, natural material textures. No text, no logos, no watermarks, no people (statues are fine)."

const TEXT_RULES =
  "Photorealistic, like a real photo taken at eye level, true-to-scale, believable construction details, natural material textures. No text, no logos, no watermarks, no people (statues are fine)."

const VISIBLE_RULE = "Show every named material and focal object clearly, in a believable place and at a realistic scale."

function sentence(parts: string[]): string {
  const joined = parts.filter(Boolean).join("; ")
  return joined ? joined.charAt(0).toUpperCase() + joined.slice(1) + "." : ""
}

/** Studio-style sections from the chosen details. */
export function detailSections(details: DetailPick[]): string[] {
  const of = (...slots: Slot[]) => details.filter((x) => slots.includes(x.slot)).map((x) => x.text)
  const sections: string[] = []
  const mats = sentence(of("materials", "finishes"))
  if (mats) sections.push(`Style & materials: ${mats}`)
  const feats = sentence(of("structure", "features"))
  if (feats) sections.push(`Features: ${feats}`)
  const plants = sentence(of("planting"))
  if (plants) sections.push(`Planting: ${plants}`)
  const light = sentence(of("lighting"))
  if (light) sections.push(`Lighting & mood: ${light}`)
  return sections
}

export function buildPhotoPrompt(concept: Concept, scene: Scene, details: DetailPick[] = []): string {
  return [
    `Edit this photo of a real ${SCENE_LABELS[scene]}. ${concept.edit}.`,
    ...detailSections(details),
    concept.photoComposition ? `Composition: keep the photo's viewpoint; ${concept.photoComposition}.` : "",
    details.length ? VISIBLE_RULE : "",
    PHOTO_RULES,
  ]
    .filter(Boolean)
    .join(" ")
}

export function buildTextPrompt(concept: Concept, region: string, details: DetailPick[] = []): string {
  return [
    `Create a photorealistic concept rendering of a ${concept.basics}, at ${concept.setting ?? "a typical home"} in ${region}.`,
    ...detailSections(details),
    `Composition: ${concept.composition ?? "eye-level view with the whole design in frame"}.`,
    details.length ? VISIBLE_RULE : "",
    TEXT_RULES,
  ]
    .filter(Boolean)
    .join(" ")
}

export type DetailPrefs = {
  prefer?: string[]
  avoid?: string[]
  extra?: ExtraDetail[]
}

/** All options for one slot of a concept, including editor extras, minus avoided ones. */
export function slotOptions(concept: Concept, slot: Slot, photo: boolean, prefs: DetailPrefs = {}): DetailDef[] {
  let base: DetailDef[]
  if (slot === "lighting") {
    const own = concept.slots.lighting
    base = own ?? (photo ? [KEEP_PHOTO_LIGHT, ...OUTDOOR_LIGHTING.filter((o) => o.photoOk)] : OUTDOOR_LIGHTING)
    if (photo) base = base.filter((o) => o.photoOk)
  } else {
    base = concept.slots[slot] ?? []
  }
  const extras = (prefs.extra ?? [])
    .filter((x) => x.concept === concept.key && x.slot === slot)
    .map((x) => d(x.short, x.text, slot === "lighting" ? true : undefined))
  // Extras only extend slots the concept already uses (or lighting).
  const all = base.length || slot === "lighting" ? [...base, ...extras] : []
  const avoid = new Set(prefs.avoid ?? [])
  const kept = all.filter((o) => !avoid.has(detailId(slot, o.short)))
  return kept.length ? kept : all
}

function pickDetail(options: DetailDef[], slot: Slot, rand: () => number, prefs: DetailPrefs, photo: boolean): DetailDef {
  const prefer = new Set(prefs.prefer ?? [])
  const weighted = options.map((o) => ({
    o,
    weight:
      (prefer.has(detailId(slot, o.short)) ? 3 : 1) *
      // Photo edits mostly keep the photo's own light.
      (photo && slot === "lighting" && o === KEEP_PHOTO_LIGHT ? 3 : 1),
  }))
  return weightedPick(weighted, rand).o
}

const SLOT_ORDER: Slot[] = ["materials", "finishes", "structure", "features", "planting", "lighting"]

export function pickDetails(concept: Concept, photo: boolean, rand: () => number, prefs: DetailPrefs = {}): DetailPick[] {
  const picks: DetailPick[] = []
  for (const slot of SLOT_ORDER) {
    const options = slotOptions(concept, slot, photo, prefs)
    if (!options.length) continue
    const o = pickDetail(options, slot, rand, prefs, photo)
    picks.push({ slot, id: detailId(slot, o.short), short: o.short, text: o.text })
  }
  return picks
}

/** The detail a title leads with: the focal feature, else the main material. */
export function headlineDetail(details: DetailPick[], prefer?: Slot): DetailPick | null {
  if (prefer) {
    const p = details.find((x) => x.slot === prefer)
    if (p && prefer !== "lighting") return p
  }
  for (const slot of ["features", "materials", "structure", "finishes", "planting"] as Slot[]) {
    const hit = details.find((x) => x.slot === slot)
    if (hit) return hit
  }
  return null
}

export function buildSeoText(
  concept: Concept,
  region: string,
  mode: "own" | "stock" | "text",
  scene: Scene | null,
  index: number,
  headline: DetailPick | null = null
): { title: string; altText: string; caption: string; slug: string } {
  const city = region.split(",")[0]
  const withDetail = headline ? ` with ${headline.short}` : ""
  const title = `${capitalize(concept.label)}${withDetail}, ${city}`
  const altText =
    mode === "text"
      ? `AI concept rendering of a ${concept.label}${withDetail}${concept.setting ? "" : ` at a ${city}-style home`}`
      : `AI concept rendering of a ${concept.label}${withDetail} added to a photo of a ${SCENE_LABELS[scene ?? "other"]}`
  const caption =
    mode === "own"
      ? `Job-site photo to ${concept.label} concept in about 30 seconds with Renderspace.`
      : mode === "stock"
        ? `Photo to ${concept.label} concept with Renderspace. Source photo: free-license stock.`
        : `${capitalize(concept.label)} concept rendering made with Renderspace.`
  const slug = slugify(
    `${concept.key}-${headline ? `${slugify(headline.short)}-` : ""}${city}-${mode === "text" ? "concept" : "photo-to-concept"}-${String(index + 1).padStart(2, "0")}`
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
  /** Detail ids to favour or avoid, and editor-written custom strings. */
  preferDetails?: string[]
  avoidDetails?: string[]
  extraDetails?: ExtraDetail[]
  /**
   * Compare pairs: the same design rendered twice with one detail swapped
   * (slate vs travertine, bronze vs marble statues). Each pair uses 2 of `count`.
   */
  comparePairs?: number
  /** Index offset so slugs don't collide with jobs already planned today. */
  startIndex?: number
}

/**
 * Build `count` jobs: own photos first (least used), then stock photos, then
 * text-only, then compare pairs at the end. No concept is used twice in a day
 * until every eligible concept has been used once. Each job gets specific
 * custom-string details per slot instead of a generic description.
 */
export function planJobs(options: PlanOptions): PlannedJob[] {
  const { date, count, sources } = options
  const startIndex = options.startIndex ?? 0
  const photoShare = options.photoShare ?? 0.6
  const rand = seededRandom(`${date}:${startIndex}`)
  const avoid = new Set(options.avoidKeys ?? [])
  const boost = new Set(options.boostKeys ?? [])
  const prefs: DetailPrefs = {
    prefer: options.preferDetails ?? [],
    avoid: options.avoidDetails ?? [],
    extra: options.extraDetails ?? [],
  }
  const pairs = Math.max(0, Math.min(Math.floor(options.comparePairs ?? 0), Math.floor(count / 2), 4))
  const normalCount = count - pairs * 2

  const weighted = CONCEPTS.filter((c) => !avoid.has(c.key)).map((c) => ({
    ...c,
    weight: boost.has(c.key) ? c.weight * 3 : c.weight,
  }))
  const pool = weighted.length ? weighted : CONCEPTS

  const ownFirst = [...sources].sort((a, b) => {
    if (a.kind !== b.kind) return a.kind === "own" ? -1 : 1
    return a.timesUsed - b.timesUsed
  })
  const photoSlots = Math.min(ownFirst.length, Math.round(normalCount * photoShare))

  const usedToday = new Set<string>()
  const pickConcept = (scene: Scene | null, filter?: (c: Concept) => boolean): Concept => {
    let eligible = pool.filter((c) => (scene === null || c.scenes.includes(scene)) && (!filter || filter(c)))
    if (eligible.length === 0) eligible = pool.filter((c) => !filter || filter(c))
    if (eligible.length === 0) eligible = pool
    const fresh = eligible.filter((c) => !usedToday.has(c.key))
    const chosen = weightedPick(fresh.length ? fresh : eligible, rand)
    usedToday.add(chosen.key)
    return chosen
  }

  const makeJob = (
    concept: Concept,
    source: SourceForPlan | null,
    region: string,
    index: number,
    details: DetailPick[],
    compareGroup: string | null,
    headlineSlot?: Slot
  ): PlannedJob => {
    const headline = headlineDetail(details, headlineSlot)
    return {
      conceptKey: concept.key,
      renderType: concept.renderType,
      sourceId: source?.id ?? null,
      prompt: source ? buildPhotoPrompt(concept, source.scene, details) : buildTextPrompt(concept, region, details),
      region,
      details,
      compareGroup,
      ...buildSeoText(concept, region, source ? source.kind : "text", source?.scene ?? null, index, headline),
    }
  }

  const regionFor = (c: Concept): string => {
    const list = c.regions?.length ? c.regions : (REGIONS as readonly string[])
    return list[Math.floor(rand() * list.length)]
  }

  const jobs: PlannedJob[] = []
  for (let i = 0; i < normalCount; i++) {
    const source = i < photoSlots ? ownFirst[i % ownFirst.length] : null
    const concept = pickConcept(source ? source.scene : null)
    const region = regionFor(concept)
    jobs.push(makeJob(concept, source, region, startIndex + i, pickDetails(concept, Boolean(source), rand, prefs), null))
  }

  // Compare pairs: same concept, photo, region and details; one slot swapped.
  const swappable = (c: Concept, photo: boolean) =>
    (["materials", "features", "finishes", "structure", "planting"] as Slot[]).some(
      (s) => slotOptions(c, s, photo, prefs).length >= 2
    )
  for (let p = 0; p < pairs; p++) {
    const source = ownFirst.length ? ownFirst[(photoSlots + p) % ownFirst.length] : null
    const photo = Boolean(source)
    const concept = pickConcept(source ? source.scene : null, (c) => swappable(c, photo))
    const region = regionFor(concept)
    const base = pickDetails(concept, photo, rand, prefs)
    // Prefer swapping the slots clients ask about most: materials, then the focal feature.
    const slots = (["materials", "features", "finishes", "structure", "planting"] as Slot[]).filter(
      (s) => base.some((x) => x.slot === s) && slotOptions(concept, s, photo, prefs).length >= 2
    )
    if (!slots.length) continue
    const slot = rand() < 0.6 ? slots[0] : slots[Math.floor(rand() * slots.length)]
    const current = base.find((x) => x.slot === slot)!
    const others = slotOptions(concept, slot, photo, prefs).filter((o) => detailId(slot, o.short) !== current.id)
    const alt = others[Math.floor(rand() * others.length)]
    const swapped = base.map((x) =>
      x.slot === slot ? { slot, id: detailId(slot, alt.short), short: alt.short, text: alt.text } : x
    )
    const group = `${date}-${startIndex}-p${p + 1}`
    const index = startIndex + normalCount + p * 2
    jobs.push(makeJob(concept, source, region, index, base, group, slot))
    jobs.push(makeJob(concept, source, region, index + 1, swapped, group, slot))
  }

  // Pairs that couldn't be built are topped up with normal jobs.
  for (let i = jobs.length; i < count; i++) {
    const concept = pickConcept(null)
    const region = regionFor(concept)
    jobs.push(makeJob(concept, null, region, startIndex + i, pickDetails(concept, false, rand, prefs), null))
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
