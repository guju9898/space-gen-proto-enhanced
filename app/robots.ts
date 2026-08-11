import type { MetadataRoute } from "next"
import { getBlogSiteOrigin } from "@/lib/blog/site"

export default function robots(): MetadataRoute.Robots {
  const origin = getBlogSiteOrigin()
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin/", "/api/", "/human-polish/intake", "/human-polish/pay/", "/human-polish/reupload/", "/human-polish/rights/", "/studio/"],
    },
    sitemap: `${origin}/sitemap.xml`,
  }
}
