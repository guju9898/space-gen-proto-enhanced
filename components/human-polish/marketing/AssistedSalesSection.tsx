import { ASSISTED_SALES } from "./marketingConfig"

interface AssistedSalesSectionProps {
  onRequestCall: () => void
  onClickWhatsapp: () => void
}

export function AssistedSalesSection({ onRequestCall, onClickWhatsapp }: AssistedSalesSectionProps) {
  return (
    <section className="container mx-auto px-4 py-14" id="assisted-sales">
      <div className="max-w-6xl mx-auto rounded-xl border border-[#343434] bg-[#191f33]/50 p-8">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">Prefer to talk it through?</h2>
        <p className="text-muted-foreground mb-6 max-w-3xl">
          Request a quick call or message us on WhatsApp. WhatsApp is an assisted-sales option in V1 — not an automated
          bot. Use it for volume arrangements, second-property questions, rush capacity checks, or custom Build-Ready
          scopes.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <a
            href={ASSISTED_SALES.callMailto}
            onClick={onRequestCall}
            className="inline-flex items-center justify-center bg-gradient-to-r from-orange-500 to-violet-700 hover:opacity-90 transition-all text-white px-6 py-3 rounded-md font-medium"
          >
            Request a quick call
          </a>
          <a
            href={ASSISTED_SALES.whatsappMailto}
            onClick={onClickWhatsapp}
            className="inline-flex items-center justify-center border border-white/30 hover:bg-white/10 transition-all text-white px-6 py-3 rounded-md font-medium"
          >
            Message us on WhatsApp
          </a>
        </div>
        <p className="mt-4 text-sm text-muted-foreground">
          Or email{" "}
          <a
            href={`mailto:${ASSISTED_SALES.supportEmail}`}
            className="text-white underline-offset-4 hover:underline"
          >
            {ASSISTED_SALES.supportEmail}
          </a>
          . Include your preferred WhatsApp number in the message body when requesting WhatsApp contact.
        </p>
      </div>
    </section>
  )
}
