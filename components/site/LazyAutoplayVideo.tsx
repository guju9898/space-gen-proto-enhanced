"use client"

import { useEffect, useRef } from "react"

type LazyAutoplayVideoProps = {
  src: string
  poster: string
  title: string
  className?: string
  width: number
  height: number
}

/**
 * Muted, looping demo video that downloads nothing until it scrolls near the viewport.
 * A plain `<video autoPlay>` starts fetching on page load, which steals mobile bandwidth from the
 * hero image and pushes out Largest Contentful Paint (LCP).
 */
export function LazyAutoplayVideo({ src, poster, title, className, width, height }: LazyAutoplayVideoProps) {
  const ref = useRef<HTMLVideoElement | null>(null)

  useEffect(() => {
    const video = ref.current
    if (!video) return

    const start = () => {
      if (!video.getAttribute("src")) {
        video.setAttribute("src", src)
        video.load()
      }
      video.play().catch(() => undefined)
    }

    if (typeof IntersectionObserver === "undefined") {
      start()
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          observer.disconnect()
          start()
        }
      },
      { rootMargin: "200px 0px" }
    )
    observer.observe(video)
    return () => observer.disconnect()
  }, [src])

  return (
    <video
      ref={ref}
      muted
      loop
      playsInline
      controls
      preload="none"
      poster={poster}
      width={width}
      height={height}
      className={className}
      title={title}
    >
      Your browser does not support the video tag.
    </video>
  )
}
