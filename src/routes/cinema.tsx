import { createFileRoute, Link } from "@tanstack/react-router"
import { useCallback, useEffect, useRef, useState } from "react"
import { Play } from "lucide-react"
import { SiteNav } from "../components/SiteNav"
import { Poster } from "../components/Poster"
import { CINEMA_PAGE_SIZE, edenHeaders, endpoint, type CinemaResponse, type Film } from "../lib/eden"

export const Route = createFileRoute("/cinema")({ component: AllCinema })

type Page = {
  page: number
  films: Film[]
}

function AllCinema() {
  const [pages, setPages] = useState<Page[]>([])
  const [total, setTotal] = useState<number | null>(null)
  const [active, setActive] = useState(1)
  const [loading, setLoading] = useState(true)
  const [done, setDone] = useState(false)
  const [failed, setFailed] = useState(false)

  // the sentinel fires while a request is still in flight and effects run twice in
  // dev, so the page we are on next is a ref, not state - a render behind here means
  // fetching the same page twice.
  const nextPage = useRef(1)
  const inFlight = useRef(false)
  const finished = useRef(false)
  const sentinel = useRef<HTMLDivElement | null>(null)

  const loadNext = useCallback(async () => {
    if (inFlight.current || finished.current) return

    const page = nextPage.current
    inFlight.current = true
    setLoading(true)

    try {
      const url = `${endpoint(import.meta.env.VITE_CINEMA, import.meta.env.VITE_CINEMA_LIVE)}?page=${page}&limit=${CINEMA_PAGE_SIZE}`
      const res = await fetch(url, { headers: edenHeaders() })
      const body = (await res.json()) as CinemaResponse

      setFailed(false)
      if (typeof body?.total === "number") setTotal(body.total)

      const films = Array.isArray(body?.data) ? body.data : []

      if (films.length) {
        setPages(current => (current.some(p => p.page === page) ? current : [...current, { page, films }]))
        nextPage.current = page + 1
      }

      // out of films, or the api says this was the last page
      if (!films.length || (body?.pages && page >= body.pages)) {
        finished.current = true
        setDone(true)
      }
    } catch (error) {
      // leave the sentinel armed - the next scroll retries the same page
      setFailed(true)
    } finally {
      inFlight.current = false
      setLoading(false)
    }
  }, [])

  // page one is fetched outright rather than left to the sentinel: the observer only
  // reports once the page paints, so a tab that never gets a frame would sit on
  // "harvesting" forever.
  useEffect(() => {
    loadNext()
  }, [loadNext])

  // infinite scroll for every page after the first. The sentinel sits under the last
  // page loaded, so reaching it asks for more.
  useEffect(() => {
    const node = sentinel.current
    if (!node) return

    const observer = new IntersectionObserver(
      entries => {
        if (entries.some(entry => entry.isIntersecting)) loadNext()
      },
      { rootMargin: "500px" },
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [loadNext])

  // which page the reader is actually looking at, for the rail on the right. The
  // margins narrow the observer to a band across the middle of the viewport so the
  // highlight flips over when a page's films take the screen, not when they peek in.
  useEffect(() => {
    const sections = Array.from(document.querySelectorAll<HTMLElement>("[data-cinema-page]"))
    if (!sections.length) return

    const observer = new IntersectionObserver(
      entries => {
        const visible = entries
          .filter(entry => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0]

        if (visible) setActive(Number((visible.target as HTMLElement).dataset.cinemaPage))
      },
      { rootMargin: "-20% 0px -55% 0px" },
    )

    sections.forEach(section => observer.observe(section))
    return () => observer.disconnect()
  }, [pages.length])

  const goToPage = (page: number) => {
    document
      .querySelector(`[data-cinema-page="${page}"]`)
      ?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  const counted = pages.reduce((sum, page) => sum + page.films.length, 0)

  return (
    <div className="min-h-screen bg-earth-950 text-sand-100">
      <div className="grain-overlay" aria-hidden />
      <SiteNav />

      <main className="pt-16">
        <section className="pt-16 pb-10">
          <div className="max-w-7xl mx-auto px-6">
            <Link to="/" className="text-xs font-bold uppercase tracking-widest text-clay-500 hover:text-clay-400">
              &larr; The Garden
            </Link>
            <h1 className="font-serif text-5xl md:text-6xl font-medium mt-6">All Cinema</h1>
            <p className="text-sm text-sand-100/50 mt-3 max-w-[52ch]">
              Every film the studios have planted in EDEN, newest first.
              {total !== null && ` ${total} ${total === 1 ? "title" : "titles"} so far.`}
            </p>
          </div>
        </section>

        {/* the page rail - one marker per page loaded, click to jump to its films */}
        {pages.length > 0 && (
          <nav
            aria-label="Pages"
            className="fixed right-3 md:right-6 top-1/2 -translate-y-1/2 z-30 flex flex-col items-center gap-2 rounded-full bg-earth-900/80 ring-1 ring-white/5 backdrop-blur-md px-2 py-4"
          >
            <span className="text-[9px] font-bold uppercase tracking-widest text-sand-100/25 mb-1">Pg</span>
            {pages.map(page => (
              <button
                key={page.page}
                onClick={() => goToPage(page.page)}
                aria-current={active === page.page}
                className={`size-8 rounded-full text-[11px] font-bold tabular-nums transition-colors ${
                  active === page.page
                    ? "bg-clay-500 text-sand-100 ring-1 ring-clay-400"
                    : "text-sand-100/40 hover:text-sand-100 hover:bg-earth-800"
                }`}
              >
                {String(page.page).padStart(2, "0")}
              </button>
            ))}
            {!done && <span className="size-1.5 rounded-full bg-clay-500/60 animate-pulse mt-1" />}
          </nav>
        )}

        {pages.map(page => (
          <section key={page.page} data-cinema-page={page.page} className="scroll-mt-24 pb-4">
            <div className="max-w-7xl mx-auto px-6">
              <div className="flex items-center gap-4 mb-6">
                <span className="text-[10px] font-bold uppercase tracking-widest text-sand-100/25 tabular-nums">
                  Page {String(page.page).padStart(2, "0")}
                </span>
                <span className="h-px flex-1 bg-sand-100/5" />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 pb-10">
                {page.films.map((film, index) => (
                  <article key={film.movie_id ?? `${page.page}-${index}`} className="group cursor-pointer">
                    <div className="w-full aspect-[2/3] bg-earth-800 rounded-[12px] outline-1 -outline-offset-1 outline-white/5 overflow-hidden mb-3 relative">
                      <Poster image={film.poster} alt={film.title} fallback="/home.png" />
                      <div className="absolute inset-0 bg-gradient-to-t from-earth-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                        <Play className="size-8 text-sand-100 fill-sand-100" />
                      </div>
                    </div>
                    <h2 className="font-serif text-lg truncate" title={film.title}>
                      {film.title}
                    </h2>
                    <p className="text-[10px] text-sand-100/40 uppercase tracking-widest mt-1 truncate">{film.meta}</p>
                    {film.studio?.name && (
                      <p className="text-[10px] text-clay-500 uppercase tracking-widest mt-1 truncate">
                        {film.studio.name}
                      </p>
                    )}
                  </article>
                ))}
              </div>
            </div>
          </section>
        ))}

        {/* what the infinite scroll watches for */}
        <div ref={sentinel} className="h-px" aria-hidden />

        <div className="max-w-7xl mx-auto px-6 pb-24 text-center text-xs uppercase tracking-widest text-sand-100/30">
          {loading && <span>Harvesting&hellip;</span>}
          {!loading && failed && (
            <button onClick={() => loadNext()} className="text-clay-400 hover:text-clay-300">
              Could not reach the garden &mdash; retry
            </button>
          )}
          {!loading && !failed && done && counted > 0 && <span>That is the whole garden &mdash; {counted} films</span>}
          {!loading && !failed && done && counted === 0 && <span>No films have been planted yet</span>}
        </div>
      </main>
    </div>
  )
}
