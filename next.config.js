/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Serve AVIF where the browser supports it (smaller than WebP), WebP otherwise.
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com", pathname: "/**" },
      { protocol: "https", hostname: "**", pathname: "/**" },
    ],
  },
  async headers() {
    // Prospect mockups and client share pages are private sales assets.
    // Keep them out of search and AI indexes. Do NOT disallow them in robots.txt,
    // or crawlers can't see this header.
    const noindex = [{ key: "X-Robots-Tag", value: "noindex, nofollow" }]
    return [
      { source: "/mockup/:path*", headers: noindex },
      { source: "/view/:path*", headers: noindex },
    ]
  },
}

module.exports = nextConfig
