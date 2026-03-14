import type { ContractorInfo } from "@/types/share-project"

export interface ContractorCardProps {
  /** Contractor info; if missing, card renders placeholder content */
  contractor?: ContractorInfo | null
}

export function ContractorCard({ contractor }: ContractorCardProps) {
  const name = contractor?.name ?? "Your contractor"
  const company = contractor?.company ?? null
  const phone = contractor?.phone ?? null
  const email = contractor?.email ?? null
  const website = contractor?.website ?? null
  const hasAny = company ?? phone ?? email ?? website

  return (
    <section className="py-12 sm:py-16 border-t border-white/10">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-xl rounded-xl border border-white/10 bg-white/5 p-6 sm:p-8">
          <h2 className="text-lg font-semibold text-white/90 tracking-tight mb-4">
            Get in touch
          </h2>
          <p className="text-white font-medium">{name}</p>
          {company && <p className="text-sm text-white/70 mt-0.5">{company}</p>}
          {hasAny && (
            <div className="mt-4 space-y-2 text-sm text-white/70">
              {phone && (
                <p>
                  <a href={`tel:${phone.replace(/\s/g, "")}`} className="hover:text-white transition-colors">
                    {phone}
                  </a>
                </p>
              )}
              {email && (
                <p>
                  <a href={`mailto:${email}`} className="hover:text-white transition-colors">
                    {email}
                  </a>
                </p>
              )}
              {website && (
                <p>
                  <a
                    href={website.startsWith("http") ? website : `https://${website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-white transition-colors"
                  >
                    {website.replace(/^https?:\/\//, "")}
                  </a>
                </p>
              )}
            </div>
          )}
          {!hasAny && (
            <p className="text-sm text-white/50 mt-2">
              Contact details can be added by the project owner.
            </p>
          )}
        </div>
      </div>
    </section>
  )
}
