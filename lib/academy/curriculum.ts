import { resolveGalleryPreset, studioPresetHref, type StudioCategory } from "@/lib/gallery/presets"

export type AcademySetting = "On site" | "Studio" | "Sales"

export type AcademyCta = {
  label: string
  href: string
  destination: "guest_studio" | "studio" | "preset" | "human_polish" | "gallery" | "demo_page"
  presetSlug?: string
  primary?: boolean
}

export type AcademyStep = {
  title: string
  body: string
}

export type AcademyLesson = {
  slug: string
  title: string
  summary: string
  setting: AcademySetting
  image: { src: string; alt: string; caption: string }
  steps: AcademyStep[]
  notes: string[]
  related: { href: string; label: string }[]
  ctas: AcademyCta[]
}

function withLesson(href: string, lesson: string): string {
  const params = new URLSearchParams(href.split("?")[1] ?? "")
  params.set("lesson", lesson)
  return `${href.split("?")[0]}?${params.toString()}`
}

function presetLinks(slug: string, lesson: string): { demo: string; studio: string } {
  const preset = resolveGalleryPreset(slug)
  if (!preset) throw new Error(`Missing gallery preset ${slug}`)
  return {
    demo: withLesson(studioPresetHref(preset, { demo: true }), lesson),
    studio: withLesson(studioPresetHref(preset), lesson),
  }
}

function studioLinks(category: StudioCategory, lesson: string): { demo: string; studio: string } {
  return {
    demo: withLesson(`/studio/${category}?demo=true`, lesson),
    studio: withLesson(`/studio/${category}`, lesson),
  }
}

const photograph = "photographing-a-job-site"
const concept = "creating-a-concept"
const alternatives = "exploring-design-alternatives"
const proposal = "building-a-visual-proposal"
const present = "presenting-to-a-homeowner"
const polish = "when-to-use-human-polish"

const pool = presetLinks("pool-hardscape-transformation", alternatives)
const cedar = presetLinks("cedar-pergola-outdoor-kitchen", concept)
const photoDemo = studioLinks("landscape", photograph)

export const ACADEMY_LESSONS: readonly AcademyLesson[] = [
  {
    slug: photograph,
    title: "Photographing a job site",
    summary:
      "A useful concept starts with a photo that shows the property as it is. Take that photo before you open Studio.",
    setting: "On site",
    image: {
      src: "/gallery/patio-before.jpg",
      alt: "Existing patio before a design concept, used as an example of a job-site reference.",
      caption: "A reference photo should show the space you intend to change, including the edges of the property.",
    },
    steps: [
      {
        title: "Stand where the homeowner will stand",
        body: "Use eye level for a backyard, pool, or patio conversation. A high angle helps when you need to show the whole yard, and the Landscape control Camera angle includes both. Do not shoot only a detail of one plant or one corner.",
      },
      {
        title: "Include the existing structure",
        body: "Keep the house, fence, grade, and main walk in the frame. Those edges tell the concept where the new work has to stop. If a tree, utility, or neighbor's wall will stay, leave it in the photo.",
      },
      {
        title: "Use even daylight",
        body: "Shade across half the yard and bright sun on the other half makes materials harder to read. Overcast daylight or open shade is easier to work from than a sunset shot. Night photos are a poor starting point for a first concept.",
      },
      {
        title: "Move temporary clutter",
        body: "Hoses, bins, and vehicles in the middle of the frame become part of the picture. Move what will not remain. Leave permanent obstructions. A concept that erases a meter, a slope, or a required gate will not match the job.",
      },
      {
        title: "Take two frames, then pick one",
        body: "Take a wide frame and a closer frame from the same spot. Upload the one that shows enough of the property to discuss the project. Landscape Studio accepts a JPG, PNG, or WEBP under 10MB in Reference Image.",
      },
    ],
    notes: [
      "The upload is labeled optional in Studio. For a sales concept of a real property, treat the photo as required.",
      "This photo is a reference for a concept. It is not a survey and it does not record dimensions.",
    ],
    related: [
      { href: "/blog/hardscape-visualization-job-site-photo", label: "Hardscape visualization from a job-site photo" },
      { href: `/academy/${concept}`, label: "Next: Creating a concept in Renderspace" },
    ],
    ctas: [
      {
        label: "Try this on your next project",
        href: photoDemo.demo,
        destination: "guest_studio",
        primary: true,
      },
      {
        label: "Open Landscape Studio",
        href: photoDemo.studio,
        destination: "studio",
      },
    ],
  },
  {
    slug: concept,
    title: "Creating a concept in Renderspace",
    summary:
      "Upload the job-site photo, set the Landscape controls that match the work, and name finishes the dropdown does not list.",
    setting: "Studio",
    image: {
      src: "/gallery/backyard-deck-pergola-hammock-concept.jpg",
      alt: "Renderspace backyard concept with a wood deck and pergola.",
      caption: "A concept shows a possible direction. It is not a measured plan.",
    },
    steps: [
      {
        title: "Open Landscape and upload the photo",
        body: "Go to Landscape Studio. Under Reference Image, click to upload the job-site photo. JPG, PNG, and WEBP under 10MB are the accepted files.",
      },
      {
        title: "Set the controls that exist on the form",
        body: "Project Basics sets garden type. Hardscape & Water sets Hardscaping to gravel, pavers, concrete, stone, or wood deck, and Water Feature to fountain, pond, stream, waterfall, pool, or none. Open Advanced, then Furniture & Structures, to set Structures to pergola, gazebo, arbor, or trellis. Materials sets Wall Materials to stone, brick, wood, concrete, or none.",
      },
      {
        title: "Name a finish that is not in the list",
        body: "Hardscaping and Wall Materials can take a typed value. Open the field, type the finish, and press Enter. Limestone, slate, travertine, and cedar are entered this way. Marble is a Flooring option in Interior Studio, not a Landscape wall material. Exterior Studio has its own Exterior materials list: brick, concrete, wood, stone, metal, glass, and stucco.",
      },
      {
        title: "Use Design notes when you start from a preset",
        body: "Design notes appear when a gallery preset is loaded. The field holds 240 characters and is sent with the concept. The Cedar pergola preset already names cedar, a wood deck, and an outdoor kitchen. Edit that note instead of adding a second brief somewhere else.",
      },
      {
        title: "Generate one direction, then read it against the photo",
        body: "Generate the concept and compare it with the reference. If the house, grade, or access changed in a way the job cannot build, adjust the control or the note and generate again. Do not present the first image as a scope of work.",
      },
    ],
    notes: [
      "Typed finishes are instructions to the concept, not a material specification or a product number.",
      "Design notes are available on a loaded preset. They are not a separate materials catalog.",
    ],
    related: [
      { href: "/gallery/looks/cedar-pergola-outdoor-kitchen", label: "Cedar pergola and outdoor kitchen preset" },
      { href: `/academy/${alternatives}`, label: "Next: Exploring design alternatives" },
    ],
    ctas: [
      {
        label: "Try this on your next project",
        href: cedar.demo,
        destination: "preset",
        presetSlug: "cedar-pergola-outdoor-kitchen",
        primary: true,
      },
      {
        label: "Open this design in Studio",
        href: cedar.studio,
        destination: "studio",
        presetSlug: "cedar-pergola-outdoor-kitchen",
      },
    ],
  },
  {
    slug: alternatives,
    title: "Exploring design alternatives",
    summary:
      "Use the same job-site photo to show two or three directions. Gallery presets are starting points, not finished designs for that property.",
    setting: "Studio",
    image: {
      src: "/gallery/garden-tiered-fountain-hammock-deck-concept.jpg",
      alt: "Renderspace garden concept with a tiered stone fountain, used as a style reference.",
      caption: "A preset carries a style. The homeowner's photo still has to be the reference.",
    },
    steps: [
      {
        title: "Keep the source photo",
        body: "Do not swap the property photo between options. The comparison only helps if each concept starts from the same yard, facade, or pool area.",
      },
      {
        title: "Change one decision at a time",
        body: "For a pool conversation, set Water Feature to pool and change Hardscaping from pavers to stone, or the reverse. Leave the house and the camera position alone so the homeowner can see what changed.",
      },
      {
        title: "Start from a published preset",
        body: "Open a gallery preset to load its Studio controls and Design notes. Texas Hill Country limestone sets stone hardscape, stone walls, and a note for cream limestone. Pool and hardscape transformation sets a pool, pavers, a pergola, and a note for limestone coping, travertine, and cedar. Every setting on the form can still be changed.",
      },
      {
        title: "Stop at a few directions",
        body: "Two or three concepts are enough for an estimate meeting. More images make the choice harder. Name each direction in plain language, such as stone and lawn, or pool and pergola, before you show them.",
      },
    ],
    notes: [
      "Preset photos in the gallery are existing Renderspace concepts. They are style references, not photos of the customer's property.",
    ],
    related: [
      { href: "/gallery", label: "Gallery" },
      { href: "/gallery/looks/texas-hill-country-limestone", label: "Texas Hill Country limestone" },
      { href: "/gallery/looks/pool-hardscape-transformation", label: "Pool and hardscape transformation" },
      { href: `/academy/${proposal}`, label: "Next: Building a visual proposal" },
    ],
    ctas: [
      {
        label: "Try this on your next project",
        href: pool.demo,
        destination: "preset",
        presetSlug: "pool-hardscape-transformation",
        primary: true,
      },
      {
        label: "Open this design in Studio",
        href: pool.studio,
        destination: "studio",
        presetSlug: "pool-hardscape-transformation",
      },
    ],
  },
  {
    slug: proposal,
    title: "Building a visual proposal",
    summary:
      "Pair one chosen concept with the scope you are actually pricing. The image does not replace allowances, exclusions, or assumptions.",
    setting: "Sales",
    image: {
      src: "/gallery/modern-limestone-house-olive-trees-courtyard-concept.jpg",
      alt: "Renderspace exterior concept of a limestone house and courtyard.",
      caption: "Show the concept next to the written scope. The picture is not the contract.",
    },
    steps: [
      {
        title: "Choose the concept you will price",
        body: "Use the direction the homeowner responded to. Do not leave three unrelated images in the proposal without saying which one the price covers.",
      },
      {
        title: "Write the scope beside the image",
        body: "List the work in the picture that you intend to build: pool, coping, paving, pergola, planting, or the exterior materials you named. Add allowances where a finish can still change. Add exclusions for work that is visible in the concept but not in the price, such as lighting, drainage, or a kitchen you have not measured.",
      },
      {
        title: "State the assumptions",
        body: "Say that the image is a concept from a photo, not a measured drawing. Note that grades, easements, utilities, and existing structures in the photo still govern the work. If a typed finish such as travertine or cedar was a direction and not a selected product, say that.",
      },
      {
        title: "Keep concept and build-ready work separate",
        body: "A Renderspace concept is for the sales conversation. It is not a construction drawing, a permit set, or an engineered plan. When the project needs presentation plans or a more finished rendering, that is a different deliverable. Human Polish describes that service. Permits still go through a licensed professional.",
      },
    ],
    notes: [
      "Renderspace does not have a separate proposal editor. The proposal is your scope and price, with the concept attached.",
    ],
    related: [
      { href: "/faq#permits", label: "Can I use Renderspace for permit plans?" },
      { href: "/contractor-demo", label: "Contractor demo" },
      { href: `/academy/${present}`, label: "Next: Presenting the concept to a homeowner" },
    ],
    ctas: [
      {
        label: "Create your first visual proposal",
        href: withLesson("/studio/landscape?demo=true", proposal),
        destination: "guest_studio",
        primary: true,
      },
      {
        label: "See the contractor demo",
        href: "/contractor-demo",
        destination: "demo_page",
      },
    ],
  },
  {
    slug: present,
    title: "Presenting the concept to a homeowner",
    summary:
      "Use the concept in the estimate or the follow-up meeting to confirm what they want, and to name what the picture does not decide.",
    setting: "Sales",
    image: {
      src: "/gallery/single-story-limestone-house-gravel-forecourt-concept.jpg",
      alt: "Renderspace concept of a single-story limestone house and gravel forecourt.",
      caption: "Show the image, then ask which parts they want to keep.",
    },
    steps: [
      {
        title: "Show the image before you explain it",
        body: "Put the concept on a phone or a tablet and let the homeowner look. Then ask what they notice. A long description up front talks over the picture.",
      },
      {
        title: "Confirm preferences in their words",
        body: "Ask which direction they mean: the stone terrace, the pool, the planting, or the house finish. Repeat that choice back. If they are unsure, return to the two alternatives from the same photo instead of adding new options in the meeting.",
      },
      {
        title: "Separate the picture from the build",
        body: "Say what the concept is deciding and what it is not. A coping material can be a preference. A wall height, a drain, or a property line is not settled by the image. If the photo hid a slope or a gate, point at the reference photo and say the work still has to fit that condition.",
      },
      {
        title: "End with one next step",
        body: "Ask for a decision you can price: approve this direction, change one named item, or walk the yard again. Leave the meeting with that step, not with another folder of images.",
      },
    ],
    notes: [
      "Do not tell the homeowner that a concept guarantees an HOA approval, a permit, or a construction cost.",
    ],
    related: [
      { href: "/blog/show-landscape-clients-design-before-construction", label: "Showing landscape clients a design before construction" },
      { href: `/academy/${polish}`, label: "Next: When to use Human Polish" },
    ],
    ctas: [
      {
        label: "Try this on your next project",
        href: withLesson("/studio/exterior?demo=true", present),
        destination: "guest_studio",
        primary: true,
      },
    ],
  },
  {
    slug: polish,
    title: "When to use Human Polish",
    summary:
      "Stay in Studio while you are exploring. Use Human Polish when a person needs to produce the concepts or a presentation package for you.",
    setting: "Sales",
    image: {
      src: "/gallery/brick-house-entry-lanterns-night-concept.jpg",
      alt: "Renderspace exterior concept of a brick house entry at night.",
      caption: "A self-serve concept and a Human Polish package are different kinds of work.",
    },
    steps: [
      {
        title: "Stay in Studio for the first conversation",
        body: "If you can upload the photo, try a preset, and show two directions yourself, Studio is the right tool. It is the fast way to see whether the homeowner wants a pool, a terrace, or a different exterior.",
      },
      {
        title: "Use an AI Render Pack when you want the set produced",
        body: "Human Polish AI Render Packs are done-for-you concept sets. You complete an intake. The team produces the images. You are not buying a permit drawing.",
      },
      {
        title: "Use Build-Ready for a presentation package",
        body: "Build-Ready starts from an approved concept and can include presentation plans and, on the 3D package, human-produced views. It is meant for client and HOA or design-review presentations based on the files you supply. It does not guarantee HOA approval, and it is not a stamped engineering or permit set.",
      },
      {
        title: "Say which deliverable the price includes",
        body: "Tell the homeowner whether they are looking at your Studio concept or at a Human Polish package. Mixing those names makes the proposal sound like construction documents.",
      },
    ],
    notes: [
      "Human Polish packages are for visualization, client presentation, and HOA or design-review support. They do not include architectural or engineering seals.",
    ],
    related: [
      { href: "/human-polish", label: "Human Polish" },
      { href: "/faq#permits", label: "Permit plans are out of scope" },
      { href: "/blog/hoa-landscape-presentation-package", label: "HOA landscape presentation packages" },
    ],
    ctas: [
      {
        label: "Review Human Polish",
        href: "/human-polish",
        destination: "human_polish",
        primary: true,
      },
      {
        label: "Try this on your next project",
        href: withLesson("/studio/landscape?demo=true", polish),
        destination: "guest_studio",
      },
    ],
  },
]

const BY_SLUG = new Map(ACADEMY_LESSONS.map((lesson) => [lesson.slug, lesson]))

export function getAcademyLesson(slug: string): AcademyLesson | null {
  return BY_SLUG.get(slug) ?? null
}

export function lessonReadingMinutes(lesson: AcademyLesson): number {
  const text = [lesson.summary, ...lesson.steps.map((step) => `${step.title} ${step.body}`), ...lesson.notes].join(" ")
  const words = text.split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.round(words / 200))
}

export function lessonNeighbors(slug: string): { previous: AcademyLesson | null; next: AcademyLesson | null } {
  const index = ACADEMY_LESSONS.findIndex((lesson) => lesson.slug === slug)
  if (index < 0) return { previous: null, next: null }
  return {
    previous: ACADEMY_LESSONS[index - 1] ?? null,
    next: ACADEMY_LESSONS[index + 1] ?? null,
  }
}
