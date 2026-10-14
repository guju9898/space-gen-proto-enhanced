/**
 * Renders a JSON-LD <script>. Escapes "<" so a string value can never close
 * the script tag (recommended by the Next.js JSON-LD guide).
 */
export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  )
}
