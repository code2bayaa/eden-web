import { createFileRoute, Link } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { toast, Toaster } from "sonner";

export const Route = createFileRoute('/')({ component: App })

// function App() {
//   return (
//     <main className="page-wrap px-4 pb-8 pt-14">
//       <section className="island-shell rise-in relative overflow-hidden rounded-[2rem] px-6 py-10 sm:px-10 sm:py-14">
//         <div className="pointer-events-none absolute -left-20 -top-24 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(79,184,178,0.32),transparent_66%)]" />
//         <div className="pointer-events-none absolute -bottom-20 -right-20 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(47,106,74,0.18),transparent_66%)]" />
//         <p className="island-kicker mb-3">TanStack Start Base Template</p>
//         <h1 className="display-title mb-5 max-w-3xl text-4xl leading-[1.02] font-bold tracking-tight text-[var(--sea-ink)] sm:text-6xl">
//           Start simple, ship quickly.
//         </h1>
//         <p className="mb-8 max-w-2xl text-base text-[var(--sea-ink-soft)] sm:text-lg">
//           This base starter intentionally keeps things light: two routes, clean
//           structure, and the essentials you need to build from scratch.
//         </p>
//         <div className="flex flex-wrap gap-3">
//           <a
//             href="/about"
//             className="rounded-full border border-[rgba(50,143,151,0.3)] bg-[rgba(79,184,178,0.14)] px-5 py-2.5 text-sm font-semibold text-[var(--lagoon-deep)] no-underline transition hover:-translate-y-0.5 hover:bg-[rgba(79,184,178,0.24)]"
//           >
//             About This Starter
//           </a>
//           <a
//             href="https://tanstack.com/router"
//             target="_blank"
//             rel="noopener noreferrer"
//             className="rounded-full border border-[rgba(23,58,64,0.2)] bg-white/50 px-5 py-2.5 text-sm font-semibold text-[var(--sea-ink)] no-underline transition hover:-translate-y-0.5 hover:border-[rgba(23,58,64,0.35)]"
//           >
//             Router Guide
//           </a>
//         </div>
//       </section>

//       <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
//         {[
//           [
//             'Type-Safe Routing',
//             'Routes and links stay in sync across every page.',
//           ],
//           [
//             'Server Functions',
//             'Call server code from your UI without creating API boilerplate.',
//           ],
//           [
//             'Streaming by Default',
//             'Ship progressively rendered responses for faster experiences.',
//           ],
//           [
//             'Tailwind Native',
//             'Design quickly with utility-first styling and reusable tokens.',
//           ],
//         ].map(([title, desc], index) => (
//           <article
//             key={title}
//             className="island-shell feature-card rise-in rounded-2xl p-5"
//             style={{ animationDelay: `${index * 90 + 80}ms` }}
//           >
//             <h2 className="mb-2 text-base font-semibold text-[var(--sea-ink)]">
//               {title}
//             </h2>
//             <p className="m-0 text-sm text-[var(--sea-ink-soft)]">{desc}</p>
//           </article>
//         ))}
//       </section>

//       <section className="island-shell mt-8 rounded-2xl p-6">
//         <p className="island-kicker mb-2">Quick Start</p>
//         <ul className="m-0 list-disc space-y-2 pl-5 text-sm text-[var(--sea-ink-soft)]">
//           <li>
//             Edit <code>src/routes/index.tsx</code> to customize the home page.
//           </li>
//           <li>
//             Update <code>src/components/Header.tsx</code> and{' '}
//             <code>src/components/Footer.tsx</code> for brand links.
//           </li>
//           <li>
//             Add routes in <code>src/routes</code> and tweak visual tokens in{' '}
//             <code>src/styles.css</code>.
//           </li>
//         </ul>
//       </section>
//     </main>
//   )
// }
// import { createFileRoute, Link } from "@tanstack/react-router";
import { Play } from "lucide-react";
import { SiteNav } from "../components/SiteNav";
import { Poster } from "../components/Poster";
import { endpoint, type Film, type Studio } from "../lib/eden";

// export const Route = createFileRoute("/")({
//   component: () => App,
// });

// what the rails show until the api answers, and what they fall back to if it never
// does - a landing page with empty sections is worse than one with placeholders.
const fallbackFilms: Film[] = [
  { title: "Midnight in Nairobi", meta: "Thriller • 104 Mins", img: '/midnight.png' },
  { title: "The Weaver's Song", meta: "Documentary • 82 Mins", img: '/weaver.png' },
  { title: "Echoes of Lamu", meta: "Romance • 115 Mins", img: '/echoes.png' }
];

const fallbackCreators = [
  "Jim Chuchu",
  "Wanuri Kahiu",
  "Mbithi Masya",
  "Tosh Gitonga",
  "Likarion Wainaina",
  "Judy Kibinge",
  "Hawa Essuman",
];

function App() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [films, setFilms] = useState<Film[]>(fallbackFilms);
  const [studios, setStudios] = useState<Studio[]>([]);

  // the two rails on this page are the only public reads eden does: the latest films
  // studios have uploaded, and every studio on the platform. Both are best effort -
  // a visitor should still get a whole page if the api is down.
  useEffect(() => {
    const headers = { "x-api-key": import.meta.env.VITE_API_KEY }

    ;(async () => {
      try {
        const res = await fetch(`${endpoint(import.meta.env.VITE_CINEMA, import.meta.env.VITE_CINEMA_LIVE)}?page=1&limit=12`, { headers })
        const { status, data } = await res.json()
        if (status && Array.isArray(data) && data.length) setFilms(data)
      } catch (error) {
        // keep fallbackFilms
      }
    })()

    ;(async () => {
      try {
        const res = await fetch(endpoint(import.meta.env.VITE_CINEMA_STUDIOS, import.meta.env.VITE_CINEMA_STUDIOS_LIVE), { headers })
        const { status, data } = await res.json()
        if (status && Array.isArray(data) && data.length) setStudios(data)
      } catch (error) {
        // keep fallbackCreators
      }
    })()
  }, []);

  const creators = studios.length ? studios.map(studio => studio.name) : fallbackCreators;

  const newsletter = async() => {
    setSubscribed(true)
    if(!email){
      toast.error("Email is required")
      setSubscribed(false)
      return
    }
    const res = await fetch(`${import.meta.env.VITE_ENVIRONMENT === "development" ? import.meta.env.VITE_NEWSLETTER : import.meta.env.VITE_NEWSLETTER_LIVE}`,{
      method:"POST",
      // credentials: "include",
      body: JSON.stringify({email}),
      headers: {
        'Content-Type': 'application/json', // Indicates the body is JSON
        'x-api-key':import.meta.env.VITE_API_KEY
      },
    });

    const {status, message} = await res.json()
    setSubscribed(false)
    if(status){
      toast.success(message)
      setEmail("")
      return false
    }
    toast.error(message)
  }
  return (
    <div className="min-h-screen bg-earth-950 text-sand-100">
      <div className="grain-overlay" aria-hidden />
      <SiteNav />

      <main className="pt-16">
        {/* Hero */}
        <section className="py-24 md:py-32">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid lg:grid-cols-[1fr_400px] gap-12 items-end">
              <div className="space-y-8">
                <span className="inline-block border border-clay-500/30 text-clay-400 text-[10px] font-bold tracking-[0.2em] uppercase px-3 py-1 rounded-full">
                  Alkebulan: Mother of Mankind
                </span>
                <h1 className="font-serif text-6xl md:text-8xl font-medium leading-none text-balance max-w-[15ch]">
                  <span className="text-[#fff]">The Garden of</span> <span className="italic text-clay-400">New African</span> <span className="text-[#fff]">Cinema</span>.
                </h1>
                <p className="text-lg md:text-xl text-sand-100/60 max-w-[48ch] text-pretty leading-relaxed">
                  UKOapp presents: EDEN - a sanctuary for Kenyan storytellers. A platform rooted in the ancient spirit of Alkebulan,
                  designed for the modern filmmaker to seed, grow, and harvest their vision.
                </p>
                <div className="flex flex-wrap gap-4 pt-2">
                  <Link
                    to="/signin"
                    className="bg-clay-500 hover:bg-clay-400 text-sand-100 text-sm font-bold tracking-wide px-6 py-3 rounded-full ring-1 ring-clay-500 transition-transform hover:scale-[1.02]"
                  >
                    Launch Your Film
                  </Link>
                  <a
                    href="#cinema"
                    className="border border-sand-100/15 hover:border-sand-100/40 text-sand-100 text-sm font-medium px-6 py-3 rounded-full transition-colors"
                  >
                    Explore the Garden
                  </a>
                </div>
              </div>
              <div className="hidden lg:block pb-4">
                <div className="p-6 rounded-2xl bg-earth-900 ring-1 ring-white/5 space-y-4">
                  <div className="size-10 rounded-full bg-clay-500/20 flex items-center justify-center">
                    <Play className="size-4 text-clay-400 fill-clay-400" />
                  </div>
                  <p className="text-sm text-sand-100/70 italic leading-relaxed">
                    "We aren't just making movies; we're reclaiming the garden. Eden is where our history meets our
                    future screen."
                  </p>
                  <p className="text-xs font-bold uppercase tracking-widest text-clay-500">Wanjiru K. / Director</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Featured Rail */}
        <section id="cinema" className="py-20 bg-earth-900/50">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex justify-between items-end mb-12">
              <div>
                <h2 className="font-serif text-3xl font-medium text-sand-100">Now Screening</h2>
                <p className="text-sm text-sand-100/50 mt-2">Curated selections from Riverwood and beyond.</p>
              </div>
              <Link to="/cinema" className="text-sm font-medium text-clay-400 border-b border-clay-400/20 pb-1 hover:border-clay-400/60 transition-colors">
                View All Cinema
              </Link>
            </div>

            <div className="flex gap-6 overflow-x-auto pb-8 snap-x no-scrollbar">
              {films.map((f, i) => (
                <div key={f.movie_id ?? i} className="flex-shrink-0 w-[300px] snap-start group cursor-pointer">
                  <div className="w-full aspect-[2/3] bg-earth-800 rounded-[12px] outline-1 -outline-offset-1 outline-white/5 overflow-hidden mb-4 relative">
                    <Poster
                      image={f.poster}
                      alt={f.title}
                      fallback={f.img ?? "/home.png"}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-earth-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                      <Play className="size-10 text-sand-100 fill-sand-100" />
                    </div>
                  </div>
                  <h3 className="font-serif text-xl truncate" title={f.title}>{f.title}</h3>
                  <p className="text-xs text-sand-100/40 uppercase tracking-widest mt-1 truncate">{f.meta}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Creator Economy */}
        <section id="garden" className="py-24">
          <div className="max-w-7xl mx-auto px-6">
            <div className="bg-earth-900 rounded-[24px] ring-1 ring-white/5 overflow-hidden">
              <div className="grid md:grid-cols-2">
                <div className="p-12 md:p-20 space-y-8">
                  <h2 className="font-serif text-5xl leading-tight">
                    Cultivating the <br />
                    <span className="italic">Economic Garden</span>
                  </h2>
                  <div className="space-y-6">
                    <div className="flex gap-6">
                      <div className="text-5xl font-serif text-clay-400">30%</div>
                      <p className="text-sm text-sand-100/60 leading-relaxed max-w-[34ch]">
                        Direct revenue share from every credit viewed. Creators keep 30% of monetization on every view —
                        no complex tiers, just honest harvest.
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4 pt-4">
                      <div className="p-4 rounded-xl bg-earth-800 ring-1 ring-white/5">
                        <p className="text-[10px] uppercase tracking-widest text-clay-500 mb-2">Organic</p>
                        <p className="text-sm font-medium">Share & Grow</p>
                        <p className="text-xs text-sand-100/40 mt-1">
                          Share your film with your audience and earn from every credit viewed.
                        </p>
                      </div>
                      <div className="p-4 rounded-xl bg-earth-800 ring-1 ring-white/5">
                        <p className="text-[10px] uppercase tracking-widest text-clay-500 mb-2">Accelerated</p>
                        <p className="text-sm font-medium">Paid Boost</p>
                        <p className="text-xs text-sand-100/40 mt-1">
                          Pay to keep your content in constant rotation across EDEN.
                        </p>
                      </div>
                    </div>
                  </div>
                  <Link
                    to="/signup"
                    className="inline-block bg-sand-100 text-earth-950 px-8 py-3 rounded-full text-sm font-bold tracking-wide transition-transform hover:scale-[1.02]"
                  >
                    Join the Collective
                  </Link>
                </div>
                <div className="relative min-h-[400px] bg-earth-800">
                  <img
                    src={"/home.png"}
                    alt="Creator ecosystem"
                    loading="lazy"
                    width={800}
                    height={992}
                    className="absolute inset-0 w-full h-full object-cover opacity-70"
                  />
                  <div className="absolute inset-0 bg-gradient-to-l from-transparent to-earth-900/50" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Marquee */}
        <section id="creators" className="py-12 border-y border-sand-100/5 overflow-hidden">
          <div className="flex whitespace-nowrap">
            <div className="flex gap-12 items-center animate-marquee shrink-0 pr-12">
              {[...creators, ...creators].map((name, i) => (
                <span key={i} className="font-serif text-2xl italic text-sand-100/30 flex items-center gap-12">
                  {name}
                  <span className="size-2 rounded-full bg-clay-500 inline-block" />
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-20">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex flex-col md:flex-row justify-between items-start gap-12">
              <div className="space-y-4">
                <span className="font-serif text-4xl">EDEN</span>
                <p className="text-sm text-sand-100/40 max-w-[30ch]">
                  A modern archive for the original continent. Designed and built in Nairobi.
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <p className="text-xs font-bold uppercase tracking-widest text-sand-100/20">Newsletter</p>
                <div className="flex gap-2">
                  <input
                    type="email"
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@garden.com"
                    className="bg-earth-900 ring-1 ring-white/10 px-4 py-2 rounded-lg text-sm focus:ring-clay-500 focus:outline-none text-sand-100"
                  />
                  <button 
                    disabled={subscribed}
                    className="px-4 py-2 bg-earth-800 ring-1 ring-white/10 text-xs font-bold uppercase rounded-lg"
                    onClick={() => newsletter()}
                  >
                    {subscribed ? "Joining..." : "Join"}
                  </button>
                </div>
              </div>
            </div>
            <div className="mt-20 pt-8 border-t border-sand-100/5 flex justify-between text-[10px] uppercase tracking-widest text-sand-100/20">
              <span>© 2026 wekesa-apps</span>
              <span>Terms • Privacy • Ethics</span>
            </div>
          </div>
        </footer>
      </main>
      <Toaster richColors position="top-center" />
    </div>
  );
}

