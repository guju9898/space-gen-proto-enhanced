import { notFound } from "next/navigation"
import { getSharedProjectWithRenders } from "@/lib/projects/get-shared-project"
import { ProjectHeader } from "@/components/share/ProjectHeader"
import { HeaderWithDownload } from "@/components/share/HeaderWithDownload"
import { BeforeAfterHero } from "@/components/share/BeforeAfterHero"
import { ConceptGallery } from "@/components/share/ConceptGallery"
import { ProjectVision } from "@/components/share/ProjectVision"
import { DesignFeatures } from "@/components/share/DesignFeatures"
import { ContractorCard } from "@/components/share/ContractorCard"
import { ShareFooter } from "@/components/share/ShareFooter"

interface ViewProjectPageProps {
  params: Promise<{ slug: string }>
}

export default async function ViewProjectPage({ params }: ViewProjectPageProps) {
  const { slug } = await params
  const data = await getSharedProjectWithRenders(slug)
  if (!data) notFound()

  const { project, renders } = data

  const firstRender = renders[0]
  const hasHero = firstRender != null

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      {hasHero ? (
        <HeaderWithDownload
          project={project}
          firstRenderUrl={firstRender.imageUrl}
        />
      ) : (
        <ProjectHeader project={project} />
      )}

      {hasHero && (
        <BeforeAfterHero
          beforeImageUrl={firstRender.sourceImageUrl}
          afterImageUrl={firstRender.imageUrl}
          beforeAlt="Before"
          afterAlt="Concept Design"
        />
      )}

      {!hasHero && (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <p className="text-white/60">No concept images in this project yet.</p>
        </div>
      )}

      {hasHero && (
        <>
          <ConceptGallery renders={renders} />
          <ProjectVision visionText={project.visionText} />
          <DesignFeatures features={project.designFeatures} />
          <ContractorCard contractor={project.contractor} />
        </>
      )}

      <ShareFooter />
    </div>
  )
}
