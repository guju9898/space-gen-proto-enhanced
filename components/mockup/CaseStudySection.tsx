const ITEMS = [
  { label: "Project Value", value: "$120k backyard renovation" },
  { label: "Challenge", value: "Client couldn't visualize the design." },
  { label: "Solution", value: "Generated concept render in seconds." },
  { label: "Result", value: "Contract approved." },
]

export function CaseStudySection() {
  return (
    <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-4">
        Example: Backyard Transformation
      </h2>
      <p className="text-lg text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
        How one contractor used the Mock-Up Method to close a high-value project.
      </p>
      <div className="max-w-2xl mx-auto bg-[#191f33]/50 p-6 rounded-xl space-y-4">
        {ITEMS.map(({ label, value }) => (
          <div key={label} className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-6">
            <span className="text-sm font-semibold text-primary whitespace-nowrap sm:w-28">
              {label}
            </span>
            <span className="text-white">{value}</span>
          </div>
        ))}
      </div>
    </section>
  )
}
