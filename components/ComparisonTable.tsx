export default function ComparisonTable() {
  const rows: { feature: string; values: string[] }[] = [
    {
      feature: "Target User",
      values: ["✔", "✔", "⚠", "✔", "✔"],
    },
    {
      feature: "Real Photo Input",
      values: ["✔", "✔", "⚠", "✔", "✔"],
    },
    {
      feature: "Geometry Preservation",
      values: ["✔", "✔", "⚠", "⚠", "✔"],
    },
    {
      feature: "Works During Client Meeting",
      values: ["✔", "⚠", "✘", "⚠", "⚠"],
    },
    {
      feature: "Rendering Speed",
      values: ["20–40 sec", "3–7 days", "10–30 sec", "30–60 sec", "1–3 min"],
    },
    {
      feature: "Cost Per Render",
      values: ["< $0.20", "$250–$1200", "< $0.05", "< $0.10", "< $0.30"],
    },
    {
      feature: "CAD Required",
      values: ["✘", "✔", "✘", "✘", "✔"],
    },
    {
      feature: "Professional Licensing",
      values: ["✔", "✔", "✘", "⚠", "✔"],
    },
    {
      feature: "Iteration Volume",
      values: ["6000 / month", "1–3 renders", "Unlimited", "Limited", "Limited"],
    },
    {
      feature: "Client-Ready Concept Time",
      values: ["< 1 minute", "3–7 days", "⚠ Not reliable", "⚠ Moderate", "⚠ Moderate"],
    },
    {
      feature: "Sales Visualization Workflow",
      values: ["✔", "⚠", "✘", "⚠", "⚠"],
    },
  ]

  const headers = ["Renderspace", "Traditional Rendering", "Midjourney", "MyArchitectAI", "Veras"]

  return (
    <section className="container mx-auto px-4 py-16">
      <div className="max-w-3xl mx-auto text-center mb-10">
        <p className="text-lg md:text-xl text-muted-foreground">
          Traditional renderings cost $300–$1200 and take days.
          <br className="hidden md:block" />
          <span className="block mt-2 text-white text-lg md:text-2xl font-semibold">
            ⚡ Renderspace generates concepts in seconds.
          </span>
        </p>
      </div>

      <div className="relative max-w-6xl mx-auto">
        <div className="pointer-events-none absolute -inset-px rounded-2xl bg-gradient-to-r from-orange-500/40 via-violet-700/40 to-sky-500/40 opacity-40 blur-xl" />
        <div className="relative rounded-2xl bg-[#050816]/80 border border-[#343434] p-4 md:p-6">
          <div className="overflow-x-auto">
            <table className="min-w-[720px] w-full text-sm md:text-base border-collapse">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">
                    Feature
                  </th>
                  {headers.map((header, index) => {
                    const isRenderspace = index === 0
                    return (
                      <th
                        key={header}
                        className={
                          "px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide align-top " +
                          (isRenderspace
                            ? "text-white bg-gradient-to-b from-orange-500/20 via-violet-700/15 to-transparent border border-orange-500/40 rounded-lg shadow-[0_0_25px_rgba(168,85,247,0.25)] min-w-[130px] md:min-w-[150px]"
                            : "text-white")
                        }
                      >
                        {isRenderspace ? (
                          <div className="flex flex-col items-center gap-1">
                            <span className="inline-flex items-center rounded-full bg-gradient-to-r from-orange-500 to-violet-700 px-2 py-0.5 text-[10px] font-semibold text-white uppercase tracking-wide">
                              Most Popular
                            </span>
                            <span>{header}</span>
                          </div>
                        ) : (
                          header
                        )}
                      </th>
                    )
                  })}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.feature} className="border-t border-white/5">
                    <td className="px-4 py-3 text-left text-sm font-medium text-white whitespace-nowrap">
                      {row.feature}
                    </td>
                    {row.values.map((value, idx) => {
                      const isRenderspace = idx === 0
                      const isSymbol = value === "✔" || value === "⚠" || value === "✘"
                      const colorClass = isSymbol
                        ? value === "✔"
                          ? "text-emerald-400"
                          : value === "⚠"
                            ? "text-amber-300"
                            : "text-rose-400"
                        : "text-white"

                      return (
                        <td
                          key={idx}
                          className={
                            "px-4 py-3 text-center text-base md:text-lg font-semibold " +
                            colorClass +
                            (isRenderspace
                              ? " bg-gradient-to-b from-orange-500/10 via-violet-700/10 to-transparent rounded-md shadow-[0_0_25px_rgba(168,85,247,0.25)] min-w-[130px] md:min-w-[150px]"
                              : "")
                          }
                        >
                          {value}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-xs text-gray-500">
            ✔ Strong fit &nbsp;&nbsp; ⚠ Moderate fit &nbsp;&nbsp; ✘ Not optimized
          </p>
        </div>
      </div>
    </section>
  )
}

