interface PainSectionProps {
  cityLabel: string | null
}

const punch = "text-lg md:text-xl font-semibold text-white mb-7 leading-snug"
const narrative = "text-base md:text-lg text-muted-foreground leading-relaxed mb-7"

export function PainSection({ cityLabel: _cityLabel }: PainSectionProps) {
  return (
    <section className="container mx-auto px-4 py-14">
      <div className="max-w-6xl mx-auto rounded-xl border border-[#343434] border-l-4 border-l-orange-500 bg-[#191f33]/60 p-10 md:p-12">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-10 md:mb-12 leading-tight">
          Here&apos;s What Actually Happening When They Say &quot;Let Me Think About It.&quot;
        </h2>
        <p className={punch}>They&apos;re not thinking about price.</p>
        <p className={punch}>They&apos;re not comparing you to another contractor.</p>
        <p className={narrative}>
          They&apos;re staring at a blank yard trying to build a $35,000 project in their head — and they can&apos;t do it.
        </p>
        <p className={punch}>So they hesitate.</p>
        <p className={narrative}>
          They tell their spouse. Their spouse has questions. Another week passes. You follow up. They&apos;re
          &quot;still deciding.&quot;
        </p>
        <p className={narrative}>Meanwhile, the other guy shows up with a visual.</p>
        <p className={narrative}>
          He didn&apos;t do better work than you. He didn&apos;t underbid you. He just showed them what you couldn&apos;t.
        </p>
        <p className={punch}>He got the signature. You got a voicemail.</p>
        <p className={punch}>This happens every week. You know it does.</p>
        <p className="mt-10 border-l-4 border-orange-500 pl-5 md:pl-6 text-lg md:text-xl font-semibold text-white leading-relaxed">
          The problem isn&apos;t your craftsmanship.
          <br />
          The problem isn&apos;t your price.
          <br />
          The problem is that you&apos;re asking people to spend $15,000 on something they cannot see.
        </p>
      </div>
    </section>
  )
}
