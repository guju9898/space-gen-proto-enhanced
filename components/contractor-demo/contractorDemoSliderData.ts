/**
 * Contractor-demo only: each tab maps to its own before/after image pair.
 * Homepage continues to use the default categories in RenderspaceBeforeAfterSlider.
 */
export const contractorDemoSliderData = {
  backyard: {
    before: "/images/before-landscape.webp",
    after: "/images/after-landscape.webp",
  },
  /** Patio / Pergola: contractor-demo-only assets (not used by homepage slider). */
  patio: {
    before: "/images/contractor-demo/patio-pergola-before.png",
    after: "/images/contractor-demo/patio-pergola-after-rustic-backyard.png",
  },
  /** Front Yard: contractor-demo-only assets (not used by homepage slider). */
  frontyard: {
    before: "/images/contractor-demo/front-yard-before.png",
    after: "/images/contractor-demo/front-yard-after-fountain-plum-tree.png",
  },
} as const

export type ContractorDemoSliderKey = keyof typeof contractorDemoSliderData

export const contractorDemoSliderTabOrder: ContractorDemoSliderKey[] = ["backyard", "patio", "frontyard"]

const LABELS: Record<ContractorDemoSliderKey, string> = {
  backyard: "Backyard",
  patio: "Patio / Pergola",
  frontyard: "Front Yard",
}

/** Ready for RenderspaceBeforeAfterSlider `categories` + `categoryOrder` props */
export function getContractorDemoSliderCategories() {
  const categories: Record<
    ContractorDemoSliderKey,
    { label: string; beforeSrc: string; afterSrc: string }
  > = {
    backyard: {
      label: LABELS.backyard,
      beforeSrc: contractorDemoSliderData.backyard.before,
      afterSrc: contractorDemoSliderData.backyard.after,
    },
    patio: {
      label: LABELS.patio,
      beforeSrc: contractorDemoSliderData.patio.before,
      afterSrc: contractorDemoSliderData.patio.after,
    },
    frontyard: {
      label: LABELS.frontyard,
      beforeSrc: contractorDemoSliderData.frontyard.before,
      afterSrc: contractorDemoSliderData.frontyard.after,
    },
  }
  return { categories, categoryOrder: contractorDemoSliderTabOrder as string[] }
}
