"use client"

import Image from "next/image"
import { useState } from "react"
import { contractorDemoSliderData } from "./contractorDemoSliderData"

type ProofItem = {
  title: string
  beforeSrc: string
  afterSrc: string
  beforeAlt: string
  afterAlt: string
}

const PROOF_ITEMS: ProofItem[] = [
  {
    title: "Backyard overhaul concept",
    beforeSrc: "/images/before-landscape.webp",
    afterSrc: "/images/after-landscape.webp",
    beforeAlt: "Before: plain lawn behind a single-story brick home with wood privacy fences",
    afterAlt: "After: concept of the same backyard with a pool, covered patio, lounge chairs and tulip planters",
  },
  {
    title: "Patio and outdoor living concept",
    beforeSrc: contractorDemoSliderData.patio.before,
    afterSrc: contractorDemoSliderData.patio.after,
    beforeAlt: "Before: grass backyard behind a brick home with a patio swing and grill",
    afterAlt: "After: evening concept with a cedar pergola, string lights, outdoor dining, gravel beds and a cornhole court",
  },
]

function MiniBeforeAfter({ item }: { item: ProofItem }) {
  const [position, setPosition] = useState(50)

  return (
    <div className="rounded-xl border border-[#343434] bg-[#191f33]/50 p-4">
      <h3 className="text-white font-semibold mb-3">{item.title}</h3>
      <div className="relative aspect-[16/10] rounded-lg overflow-hidden">
        <Image src={item.afterSrc} alt={item.afterAlt} fill className="object-cover" />
        <div className="absolute inset-0 overflow-hidden" style={{ width: `${position}%` }}>
          <Image src={item.beforeSrc} alt={item.beforeAlt} fill className="object-cover" />
        </div>
        <div
          className="absolute inset-y-0 w-1 bg-white/70"
          style={{
            left: `${position}%`,
            transform: "translateX(-50%)",
          }}
        />
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={position}
        onChange={(e) => setPosition(Number(e.target.value))}
        className="w-full mt-4 accent-white"
        aria-label={`Adjust comparison for ${item.title}`}
      />
      <div className="flex items-center justify-between text-xs text-muted-foreground mt-2">
        <span>Before</span>
        <span>After</span>
      </div>
    </div>
  )
}

export function ProofStackSection() {
  return (
    <section className="container mx-auto px-4 py-14">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold text-white text-center mb-3">Proof Beats Pitch</h2>
        <p className="text-muted-foreground text-center mb-8">
          Show the transformation in seconds so clients can make a decision with confidence.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {PROOF_ITEMS.map((item) => (
            <MiniBeforeAfter key={item.title} item={item} />
          ))}
        </div>
      </div>
    </section>
  )
}

