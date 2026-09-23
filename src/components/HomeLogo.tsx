import { Link } from "@tanstack/react-router"

// The EDEN wordmark, doubling as the way back to the landing page. The auth screens
// and the dashboards have no site nav, so without this the only way out is the
// browser's back button.
//
// tone picks the palette: the auth shell is built on the theme tokens, the dashboards
// on the sand/clay scale - and --accent resolves to a dark navy in the dark theme, so
// the two cannot share one set of classes.
export function HomeLogo({
  layout = "stacked",
  tone = "auth",
  caption = "Back to the garden",
  className = "",
}: {
  layout?: "stacked" | "inline"
  tone?: "auth" | "studio"
  caption?: string
  className?: string
}) {
  const stacked = layout === "stacked"

  const wordmark =
    tone === "auth"
      ? "text-foreground group-hover:text-accent"
      : "text-white group-hover:text-clay-300"

  const captionTone =
    tone === "auth"
      ? "text-muted-foreground group-hover:text-accent"
      : "text-sand-100/45 group-hover:text-clay-300"

  return (
    <Link
      to="/"
      aria-label="EDEN home"
      className={`group inline-flex no-underline ${
        stacked ? "flex-col items-center gap-1" : "items-baseline gap-2"
      } ${className}`}
    >
      <span
        className={`font-serif font-medium tracking-tight transition-colors ${
          stacked ? "text-3xl" : "text-xl"
        } ${wordmark}`}
      >
        EDEN
      </span>
      <span
        className={`font-semibold uppercase tracking-[0.3em] transition-colors ${
          stacked ? "text-[10px]" : "text-[9px] tracking-[0.2em]"
        } ${captionTone}`}
      >
        &larr; {caption}
      </span>
    </Link>
  )
}
