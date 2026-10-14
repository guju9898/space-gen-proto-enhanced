import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getProspectMockupBySlug } from "@/lib/projects/get-prospect-mockup"
import { BeforeAfterHero } from "@/components/share/BeforeAfterHero"
import { ShareFooter } from "@/components/share/ShareFooter"
import { ContractorCard } from "@/components/share/ContractorCard"
import type { ContractorInfo } from "@/types/share-project"

export const metadata: Metadata = {
  title: { absolute: "Concept preview | Renderspace" },
  description: "A private concept preview shared by your contractor.",
  // Private sales asset: never index. Also enforced via X-Robots-Tag in next.config.js.
  // Do NOT add these paths to robots.txt — crawlers must be able to read the noindex.
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
}

interface MockupPageProps {
  params: Promise<{ slug: string }>
}

export default async function MockupPage({ params }: MockupPageProps) {
  const { slug } = await params
  const data = await getProspectMockupBySlug(slug)
  if (!data) notFound()

  const contractor: ContractorInfo | null =
    data.contractorName ||
    data.contractorCompany ||
    data.contractorPhone ||
    data.contractorEmail ||
    data.contractorWebsite
      ? {
          name: data.contractorName ?? undefined,
          company: data.contractorCompany ?? undefined,
          phone: data.contractorPhone ?? undefined,
          email: data.contractorEmail ?? undefined,
          website: data.contractorWebsite ?? undefined,
        }
      : null

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <header className="border-b border-white/10 py-4">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-sm text-white/70">
            {data.prospectName && <span className="font-medium text-white">{data.prospectName}</span>}
            {data.propertyAddress && (
              <span className={data.prospectName ? " ml-2" : ""}>{data.propertyAddress}</span>
            )}
            {!data.prospectName && !data.propertyAddress && "Prospect mockup"}
          </p>
        </div>
      </header>

      <BeforeAfterHero
        beforeImageUrl={data.sourceImageUrl}
        afterImageUrl={data.renderImageUrl}
        beforeAlt="Before"
        afterAlt="Concept"
      />

      {data.message && (
        <section className="py-12 sm:py-16 border-t border-white/10">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-2xl">
            <h2 className="text-lg font-semibold text-white/90 mb-3">Message</h2>
            <p className="text-white/80 whitespace-pre-wrap">{data.message}</p>
          </div>
        </section>
      )}

      {(data.projectName || contractor) && (
        <section className="py-12 sm:py-16 border-t border-white/10">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            {data.projectName && (
              <p className="text-sm text-white/60 mb-4">
                Project: <span className="text-white/80">{data.projectName}</span>
              </p>
            )}
            <ContractorCard contractor={contractor} />
          </div>
        </section>
      )}

      {!data.projectName && !contractor && <ContractorCard contractor={null} />}

      <ShareFooter />
    </div>
  )
}
