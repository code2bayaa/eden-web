import { useEffect, useState } from "react"
import { endpoint } from "../lib/eden"

// a studio's poster sits in a private backblaze bucket, so it comes back from the api
// as bytes rather than a url - the same trick the studio dashboard uses. Until it
// lands (or if it never does) the card keeps the placeholder art.
export function Poster({
  image,
  alt,
  fallback,
  className = "w-full h-full object-cover transition-transform duration-700 group-hover:scale-105",
}: {
  image?: string | null
  alt: string
  fallback: string
  className?: string
}) {
  const [src, setSrc] = useState(fallback)

  useEffect(() => {
    if (!image) return

    let mounted = true
    let objectUrl: string | null = null

    ;(async () => {
      try {
        const res = await fetch(
          endpoint(import.meta.env.VITE_CINEMA_POSTER, import.meta.env.VITE_CINEMA_POSTER_LIVE),
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-api-key": import.meta.env.VITE_API_KEY,
            },
            body: JSON.stringify({ image }),
          },
        )

        if (!res.ok || !mounted) return

        objectUrl = URL.createObjectURL(await res.blob())
        if (mounted) setSrc(objectUrl)
      } catch (error) {
        // leave the fallback art in place
      }
    })()

    return () => {
      mounted = false
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [image])

  return <img src={src} alt={alt} loading="lazy" width={600} height={900} className={className} />
}
