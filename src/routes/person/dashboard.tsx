import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react'
import type { LucideIcon } from 'lucide-react'
import { toast, Toaster } from 'sonner'
import { HomeLogo } from "./../../components/HomeLogo";
import { MugShot } from "./../../components/MugShot";
import {
  BadgeCheck,
  CheckCircle2,
  Circle,
  Clapperboard,
  Film,
  LogOut,
  Mail,
  Megaphone,
  PlaySquare,
  Save,
  Edit3,
  Send,
  Trash2,
  Upload,
  UserCircle,
  UsersRound,
} from 'lucide-react'
import { PersonAuthentication } from './signin'
import { joinMpesaRoom, newSocketKey } from '../../lib/mpesaRoom'

export const Route = createFileRoute('/person/dashboard')({
  beforeLoad: async () => {
    const isLoggedIn = await PersonAuthentication()

    if (!isLoggedIn) {
      throw redirect({
        to: '/person/signin',
      })
    }
  },
  component: PersonDashboard,
})

type PersonSectionId = 'profile' | 'credits' | 'miniSeries' | 'casting' | 'messages'

type PersonSection = {
  id: PersonSectionId
  label: string
  eyebrow: string
  icon: LucideIcon
  description: string
}

type Person = {
  person_id: number
  name?: string
  original_name?: string
  email?: string
  telephone?: string
  biography?: string
  birth_date?: string
  death_date?: string
  gender?: string
  department?: any
  skills?: any
  place_of_birth?: string
  email_verified?: boolean
  telephone_verified?: boolean
  verification?: boolean
  //backblaze key of the head shot, or a seeded tmdb path on rows we never touched
  profile_path?: string | null
}

type Credit = {
  movie_id: number
  id: number
  type: string
  title: string
  overview?: string
  release_date?: string
  eden?: number
  character?: string
  department?: any
}

type Reel = {
  movie_id: number
  id: number
  type: string
  title: string
  character?: string
  mini_series: { key: string; name?: string }[]
  trailors: { key: string; name?: string }[]
}

type Studio = { eden: number; name: string }

type CastingCall = {
  casting_id: number
  eden: number
  studio: string
  title?: string
  department?: string
  skill?: string
  region?: string
  description?: string
  compensation?: string
  deadline?: string
  matched?: boolean
}

type SentMessage = {
  message_id: number
  eden: number
  studio: string
  state: string
  subject?: string
  message?: string
}

const sections: PersonSection[] = [
  { id: 'profile', label: 'Profile', eyebrow: 'Your account', icon: UserCircle, description: 'Your details, verification and followers' },
  { id: 'credits', label: 'Credits', eyebrow: 'Your work', icon: Film, description: 'Every film and episode you have been involved in' },
  { id: 'miniSeries', label: 'Mini Series', eyebrow: 'Studio reels', icon: PlaySquare, description: 'Your reels, grouped by the studio that made them' },
  { id: 'casting', label: 'Casting', eyebrow: 'Studios hiring', icon: Megaphone, description: 'Open roles, the ones matching your department first' },
  { id: 'messages', label: 'Studios', eyebrow: 'Reach out', icon: Mail, description: 'Contact a studio and see what you have sent' },
]

const inputClass =
  'h-10 w-full rounded-md border border-white/10 bg-[#111317] px-3 text-sm text-white outline-none transition placeholder:text-sand-100/25 focus:border-teal-300/50 focus:ring-2 focus:ring-teal-300/10'

const fileClass =
  'w-full rounded-md border border-white/10 bg-[#111317] px-3 py-2 text-sm text-sand-100/70 outline-none file:mr-3 file:rounded file:border-0 file:bg-white/10 file:px-3 file:py-1.5 file:text-sm file:text-white'

const textareaClass =
  'w-full rounded-md border border-white/10 bg-[#111317] px-3 py-2 text-sm text-white outline-none transition placeholder:text-sand-100/25 focus:border-teal-300/50 focus:ring-2 focus:ring-teal-300/10'

const endpoint = (dev: string, live: string) =>
  import.meta.env.VITE_ENVIRONMENT === 'development' ? dev : live

const jsonHeaders = {
  'Content-Type': 'application/json',
  'x-api-key': import.meta.env.VITE_API_KEY,
}

//every call on this dashboard is cookie-authenticated against the person_token session
async function personFetch(url: string, init?: RequestInit) {
  const res = await fetch(url, {
    credentials: 'include',
    headers: jsonHeaders,
    ...init,
  })
  return res.json()
}

function PersonDashboard() {
  const [activeSection, setActiveSection] = useState<PersonSectionId>('profile')
  const [person, setPerson] = useState<Person | null>(null)
  const [followers, setFollowers] = useState<number>(0)
  const [credits, setCredits] = useState<number>(0)
  const [studios, setStudios] = useState<number>(0)
  const navigate = useNavigate()

  const loadProfile = async () => {
    try {
      const { status, data } = await personFetch(
        endpoint(import.meta.env.VITE_PERSON_PROFILE, import.meta.env.VITE_PERSON_PROFILE_LIVE),
        { method: 'GET' },
      )

      if (status) {
        setPerson(data.person)
        setFollowers(data.followers)
        setCredits(data.credits)
        setStudios(data.studios)
      }
    } catch (error) {
      console.log(error, 'error')
    }
  }

  useEffect(() => {
    loadProfile()
  }, [])

  const signOut = async () => {
    try {
      await personFetch(
        endpoint(import.meta.env.VITE_PERSON_SIGN_OUT, import.meta.env.VITE_PERSON_SIGN_OUT_LIVE),
        { method: 'GET' },
      )
    } catch (error) {
      console.log(error, 'error')
    }
    navigate({ to: '/person/signin' })
  }

  const current = useMemo(
    () => sections.find((section) => section.id === activeSection) ?? sections[0],
    [activeSection],
  )

  return (
    <div className="min-h-screen bg-[#0b0d10] text-sand-100">
      <div className="grain-overlay" aria-hidden />
      <div className="flex min-h-screen flex-col lg:flex-row">
        <aside className="border-b border-white/10 bg-[#111317] px-4 py-4 lg:sticky lg:top-0 lg:h-screen lg:w-72 lg:border-b-0 lg:border-r">
          <HomeLogo layout="inline" tone="studio" className="mb-3" />

          <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.04] p-3">
            <span className="grid size-12 place-items-center rounded-md border border-teal-300/20 bg-teal-300/10 text-teal-200">
              <UserCircle className="size-6" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">
                {person?.name || person?.original_name || 'EDEN PERSON'}
              </p>
              <p className="truncate text-xs text-sand-100/45">Cast &amp; crew</p>
            </div>
          </div>

          <nav className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-1">
            {sections.map((section) => {
              const Icon = section.icon
              const isActive = section.id === activeSection

              return (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => setActiveSection(section.id)}
                  className={`flex min-h-14 items-center gap-3 rounded-md border px-3 py-2 text-left transition ${
                    isActive
                      ? 'border-clay-400/45 bg-clay-500/15 text-white'
                      : 'border-transparent text-sand-100/60 hover:border-white/10 hover:bg-white/[0.04] hover:text-white'
                  }`}
                >
                  <Icon className={`size-4 shrink-0 ${isActive ? 'text-clay-300' : 'text-sand-100/35'}`} />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold">{section.label}</span>
                    <span className="hidden truncate text-[11px] text-sand-100/38 lg:block">{section.eyebrow}</span>
                  </span>
                </button>
              )
            })}
          </nav>

          <button
            type="button"
            onClick={signOut}
            className="mt-4 flex w-full items-center gap-3 rounded-md border border-white/10 px-3 py-2 text-left text-sm text-sand-100/60 transition hover:bg-white/[0.06] hover:text-white"
          >
            <LogOut className="size-4 shrink-0" />
            Sign out
          </button>
        </aside>

        <main className="min-w-0 flex-1">
          <header className="sticky top-0 z-30 border-b border-white/10 bg-[#0b0d10]/90 backdrop-blur-xl">
            <div className="flex flex-col gap-4 px-4 py-4 lg:flex-row lg:items-center lg:justify-between lg:px-6">
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-clay-400">{current.eyebrow}</p>
                <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                  {current.label} Person Dashboard
                </h1>
                <p className="mt-1 max-w-3xl text-sm text-sand-100/55">{current.description}</p>
              </div>

              {person?.verification ? (
                <span className="inline-flex h-9 w-fit items-center gap-2 rounded-md border border-teal-300/25 bg-teal-300/10 px-3 text-sm text-teal-200">
                  <BadgeCheck className="size-4" />
                  Verified
                </span>
              ) : (
                <span className="inline-flex h-9 w-fit items-center gap-2 rounded-md border border-white/10 px-3 text-sm text-sand-100/45">
                  <Circle className="size-4" />
                  Not verified
                </span>
              )}
            </div>
          </header>

          <div className="space-y-5 px-4 py-5 lg:px-6">
            <PersonMetrics followers={followers} credits={credits} studios={studios} />

            {activeSection === 'profile' && <ProfilePanel person={person} onSaved={loadProfile} />}
            {activeSection === 'credits' && <CreditsPanel />}
            {activeSection === 'miniSeries' && <MiniSeriesPanel />}
            {activeSection === 'casting' && <CastingPanel />}
            {activeSection === 'messages' && <MessagesPanel />}
          </div>
        </main>
      </div>
      <Toaster richColors position="top-center" />
    </div>
  )
}

function PersonMetrics({ followers, credits, studios }: { followers: number; credits: number; studios: number }) {
  const metrics = [
    { label: 'Followers', value: followers, icon: UsersRound },
    { label: 'Credits', value: credits, icon: Clapperboard },
    { label: 'Studios worked with', value: studios, icon: Film },
  ]

  return (
    <section className="grid gap-3 sm:grid-cols-3">
      {metrics.map((metric, index) => {
        const Icon = metric.icon
        return (
          <article key={index} className="rounded-lg border border-white/10 bg-white/[0.035] p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-sand-100/42">{metric.label}</p>
                <p className="mt-2 text-2xl font-semibold text-white">{metric.value}</p>
              </div>
              <span className="grid size-9 place-items-center rounded-md border border-teal-300/20 bg-teal-300/10 text-teal-200">
                <Icon className="size-4" />
              </span>
            </div>
          </article>
        )
      })}
    </section>
  )
}

//Item 9: the person edits their own profile and finishes their own verification. The e-mail half
//is already proven by signing in, so only the M-PESA half is offered here.
function ProfilePanel({ person, onSaved }: { person: Person | null; onSaved: () => void }) {
  const [form, setForm] = useState({
    name: '',
    original_name: '',
    telephone: '',
    place_of_birth: '',
    birth_date: '',
    gender: '',
    skills: '',
    biography: '',
  })
  const [saving, setSaving] = useState(false)
  const [code, setCode] = useState('')

  useEffect(() => {
    if (!person) return
    setForm({
      name: person.name || '',
      original_name: person.original_name || '',
      telephone: person.telephone || '',
      place_of_birth: person.place_of_birth || '',
      birth_date: person.birth_date || '',
      gender: person.gender || '',
      skills: Array.isArray(person.skills) ? person.skills.join(', ') : person.skills || '',
      biography: person.biography || '',
    })
  }, [person])

  const save = async () => {
    setSaving(true)
    try {
      const { status, message, error } = await personFetch(
        endpoint(import.meta.env.VITE_PERSON_UPDATE, import.meta.env.VITE_PERSON_UPDATE_LIVE),
        {
          method: 'POST',
          body: JSON.stringify({
            ...form,
            //a comma separated list is what casting calls are matched against
            skills: form.skills
              .split(',')
              .map((skill) => skill.trim())
              .filter(Boolean),
          }),
        },
      )
      setSaving(false)

      if (status) {
        toast.success(message)
        onSaved()
        return
      }
      toast.error(error || message)
    } catch (error) {
      setSaving(false)
      console.log(error, 'error')
      toast.error('Could not save the profile')
    }
  }

  const startTelephoneVerification = async () => {
    try {
      const socketKey = newSocketKey()
      const { status, message, merchant, sockets_url } = await personFetch(
        endpoint(import.meta.env.VITE_PERSON_VERIFY_TELEPHONE, import.meta.env.VITE_PERSON_VERIFY_TELEPHONE_LIVE),
        { method: 'POST', body: JSON.stringify({ socket_key: socketKey }) },
      )
      status ? toast.success(message) : toast.error(message)
      if (status) {
        //confirm as soon as the signed callback arrives - the API checks the payment with Safaricom itself
        const leave = joinMpesaRoom(sockets_url, merchant, socketKey, (data) => {
          leave()
          if (data.ResultCode !== 0) return toast.error('M-PESA payment cancelled')
          confirmTelephoneVerification()
        })
      }
    } catch (error) {
      console.log(error, 'error')
      toast.error('Could not start telephone verification')
    }
  }

  const confirmTelephoneVerification = async () => {
    try {
      const { status, message } = await personFetch(
        endpoint(
          import.meta.env.VITE_PERSON_VERIFY_TELEPHONE_CONFIRM,
          import.meta.env.VITE_PERSON_VERIFY_TELEPHONE_CONFIRM_LIVE,
        ),
        { method: 'POST', body: JSON.stringify({ code }) },
      )

      if (status) {
        toast.success(message)
        setCode('')
        onSaved()
        return
      }
      toast.error(message)
    } catch (error) {
      console.log(error, 'error')
      toast.error('Could not confirm the code')
    }
  }

  return (
    <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
      <div className="rounded-lg border border-white/10 bg-white/[0.035] p-5">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-md border border-clay-300/25 bg-clay-500/15 text-clay-200">
            <UserCircle className="size-5" />
          </span>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-clay-400">Person profile</p>
            <h2 className="text-lg font-semibold text-white">Edit your details</h2>
          </div>
        </div>

        <MugShot profilePath={person?.profile_path} onSaved={onSaved} />

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <Field label="Nick name" value={form.name} onChange={(value) => setForm((p) => ({ ...p, name: value }))} />
          <Field
            label="Full name"
            value={form.original_name}
            onChange={(value) => setForm((p) => ({ ...p, original_name: value }))}
          />
          <Field
            label="Telephone"
            value={form.telephone}
            placeholder="254712345678"
            onChange={(value) => setForm((p) => ({ ...p, telephone: value }))}
          />
          <Field
            label="Place of birth"
            value={form.place_of_birth}
            onChange={(value) => setForm((p) => ({ ...p, place_of_birth: value }))}
          />
          <Field
            label="Birth date"
            type="date"
            value={form.birth_date}
            onChange={(value) => setForm((p) => ({ ...p, birth_date: value }))}
          />
          <Field label="Gender" value={form.gender} onChange={(value) => setForm((p) => ({ ...p, gender: value }))} />

          <label className="grid gap-2 md:col-span-2">
            <span className="text-sm font-medium text-sand-100/70">Skills</span>
            <input
              className={inputClass}
              placeholder="Stunt driving, Swahili dialogue, Horse riding"
              value={form.skills}
              onChange={(e) => setForm((p) => ({ ...p, skills: e.target.value }))}
            />
            <span className="text-xs text-sand-100/38">
              Separate with commas. Casting calls matching these sort to the top of your Casting tab.
            </span>
          </label>

          <label className="grid gap-2 md:col-span-2">
            <span className="text-sm font-medium text-sand-100/70">Biography</span>
            <textarea
              rows={5}
              className={textareaClass}
              value={form.biography}
              onChange={(e) => setForm((p) => ({ ...p, biography: e.target.value }))}
            />
          </label>
        </div>

        <button
          type="button"
          disabled={saving}
          onClick={save}
          className="mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-md bg-clay-500 px-4 text-sm font-bold text-white transition hover:bg-clay-400 disabled:opacity-50"
        >
          <Save className="size-4" />
          {saving ? 'Saving...' : 'Save profile'}
        </button>

        <p className="mt-3 text-xs text-sand-100/38">
          Your email and national ID belong to the studio that registered you. Ask them to change those.
        </p>
      </div>

      <div className="rounded-lg border border-white/10 bg-white/[0.035] p-5">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-md border border-teal-300/20 bg-teal-300/10 text-teal-200">
            <BadgeCheck className="size-5" />
          </span>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-clay-400">Verification</p>
            <h2 className="text-lg font-semibold text-white">Account status</h2>
          </div>
        </div>

        <div className="mt-5 space-y-3">
          <StatusRow label="Email verified" complete={Boolean(person?.email_verified)} value={person?.email || ''} />
          <StatusRow
            label="Telephone verified"
            complete={Boolean(person?.telephone_verified)}
            value={person?.telephone || ''}
          />
          <StatusRow label="Account verified" complete={Boolean(person?.verification)} value={person?.verification ? 'done' : 'pending'} />
        </div>

        {person?.telephone_verified ? null : (
          <div className="mt-5 space-y-3 rounded-md border border-white/10 bg-[#111317] p-4">
            <p className="text-sm font-medium text-white">Verify your telephone</p>
            <p className="text-xs text-sand-100/42">
              We send an M-PESA prompt to {person?.telephone || 'your number'}. Approve it on your phone - we
              confirm the payment with M-PESA and verify the number. If it does not update, press Confirm.
            </p>
            <button
              type="button"
              onClick={startTelephoneVerification}
              className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-white/10 px-3 text-sm text-white transition hover:bg-white/[0.06]"
            >
              Send M-PESA prompt
            </button>
            <button
              type="button"
              onClick={confirmTelephoneVerification}
              className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-md bg-clay-500 px-3 text-sm font-bold text-white transition hover:bg-clay-400"
            >
              Confirm payment
            </button>
          </div>
        )}
      </div>
    </section>
  )
}

//Item 9: everything the person has been credited in, whatever studio made it.
function CreditsPanel() {
  const [credits, setCredits] = useState<Credit[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)

  useEffect(() => {
    (async () => {
      try {
        const { status, data, total } = await personFetch(
          endpoint(import.meta.env.VITE_PERSON_MEDIA_LIST, import.meta.env.VITE_PERSON_MEDIA_LIST_LIVE),
          { method: 'POST', body: JSON.stringify({ page }) },
        )
        if (status) {
          setCredits(data)
          setTotal(total)
        }
      } catch (error) {
        console.log(error, 'error')
      }
    })()
  }, [page])

  if (credits.length === 0) {
    return (
      <EmptyPanel
        icon={Film}
        title="No credits yet"
        description="Once a studio adds you to a cast or crew list, every film, season and episode shows up here."
      />
    )
  }

  return (
    <section className="grid gap-3">
      {credits.map((credit) => (
        <article key={`${credit.movie_id}-${credit.character}`} className="rounded-lg border border-white/10 bg-white/[0.035] p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white">{credit.title}</p>
              <p className="mt-1 text-xs text-sand-100/45">
                {[credit.type, credit.character ? `as ${credit.character}` : '', credit.release_date]
                  .filter(Boolean)
                  .join(' / ')}
              </p>
            </div>
            <span className="rounded-md border border-white/10 px-2 py-1 text-[11px] uppercase tracking-[0.14em] text-sand-100/45">
              {credit.type}
            </span>
          </div>
          {credit.overview ? <p className="mt-3 text-sm text-sand-100/70">{credit.overview}</p> : null}
        </article>
      ))}

      <Pagination page={page} total={total} onPage={setPage} />
    </section>
  )
}

//Item 8: pick a studio, then movie or episode, and the person's reels for it come back - the
//studio is the album, each credit a track on it.
function MiniSeriesPanel() {
  const [studios, setStudios] = useState<Studio[]>([])
  const [eden, setEden] = useState<string>('')
  const [type, setType] = useState<string>('movie')
  const [reels, setReels] = useState<Reel[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    (async () => {
      try {
        const { status, data } = await personFetch(
          endpoint(import.meta.env.VITE_PERSON_STUDIOS, import.meta.env.VITE_PERSON_STUDIOS_LIVE),
          { method: 'GET' },
        )
        if (status) {
          setStudios(data)
          if (data.length > 0) setEden(String(data[0].eden))
        }
      } catch (error) {
        console.log(error, 'error')
      }
    })()
  }, [])

  useEffect(() => {
    if (!eden) return
    setLoading(true)
    ;(async () => {
      try {
        const { status, data } = await personFetch(
          endpoint(import.meta.env.VITE_PERSON_MINI_SERIES, import.meta.env.VITE_PERSON_MINI_SERIES_LIVE),
          { method: 'POST', body: JSON.stringify({ eden, type }) },
        )
        setLoading(false)
        if (status) setReels(data)
      } catch (error) {
        setLoading(false)
        console.log(error, 'error')
      }
    })()
  }, [eden, type])

  //an upload can add a studio the person had no credit with, so the browser reloads after one
  const reloadStudios = async () => {
    try {
      const { status, data } = await personFetch(
        endpoint(import.meta.env.VITE_PERSON_STUDIOS, import.meta.env.VITE_PERSON_STUDIOS_LIVE),
        { method: 'GET' },
      )
      if (status) setStudios(data)
    } catch (error) {
      console.log(error, 'error')
    }
  }

  return (
    <section className="grid gap-4">
      {studios.length === 0 ? (
        <EmptyPanel
          icon={PlaySquare}
          title="No credits yet"
          description="Once a studio credits you on a title you can upload your own mini series for it, and browse that studio's reels here."
        />
      ) : (
      <>
      {/* one studio choice for the whole tab - it drives the upload form and the reels below */}
      <div className="rounded-lg border border-white/10 bg-white/[0.035] p-5">
        <label className="grid gap-2 md:max-w-md">
          <span className="text-sm font-medium text-sand-100/70">Studio</span>
          <select className={inputClass} value={eden} onChange={(e) => setEden(e.target.value)}>
            {studios.map((studio) => (
              <option key={studio.eden} value={String(studio.eden)}>
                {studio.name}
              </option>
            ))}
          </select>
          <span className="text-xs text-sand-100/38">
            Studios you are credited with. Everything on this tab follows this choice.
          </span>
        </label>
      </div>

      <MiniSeriesUploadPanel eden={eden} onUploaded={reloadStudios} />

      <div className="rounded-lg border border-white/10 bg-white/[0.035] p-5">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-md border border-teal-300/20 bg-teal-300/10 text-teal-200">
            <PlaySquare className="size-5" />
          </span>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-clay-400">Studio reels</p>
            <h2 className="text-lg font-semibold text-white">Reels on your credits</h2>
          </div>
        </div>

        <label className="mt-5 grid gap-2 md:max-w-md">
          <span className="text-sm font-medium text-sand-100/70">Media</span>
          <select className={inputClass} value={type} onChange={(e) => setType(e.target.value)}>
            <option value="movie">Movie</option>
            <option value="tv">TV</option>
            <option value="season">Season</option>
            <option value="episode">Episode</option>
          </select>
        </label>
      </div>

      {loading ? (
        <EmptyPanel icon={PlaySquare} title="Loading reels" description="Collecting this studio's mini series." />
      ) : reels.length === 0 ? (
        <EmptyPanel
          icon={PlaySquare}
          title="Nothing for this pick"
          description="No credit of that media type with this studio. Try another studio or media type."
        />
      ) : (
        <div className="grid gap-3">
          {reels.map((reel) => (
            <article key={reel.movie_id} className="rounded-lg border border-white/10 bg-white/[0.035] p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white">{reel.title}</p>
                  {reel.character ? <p className="mt-1 text-xs text-sand-100/45">as {reel.character}</p> : null}
                </div>
                <span className="rounded-md border border-white/10 px-2 py-1 text-[11px] uppercase tracking-[0.14em] text-sand-100/45">
                  {reel.mini_series.length} mini series
                </span>
              </div>

              {reel.mini_series.length === 0 && reel.trailors.length === 0 ? (
                <p className="mt-3 text-xs text-sand-100/38">No reel uploaded for this title yet.</p>
              ) : (
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {[...reel.mini_series, ...reel.trailors].map((video, index) => (
                    <a
                      key={`${video.key}-${index}`}
                      href={`https://www.youtube.com/watch?v=${video.key}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-3 rounded-md border border-white/10 bg-[#111317] px-3 py-2 text-sm text-sand-100/70 transition hover:bg-white/[0.06] hover:text-white"
                    >
                      <PlaySquare className="size-4 shrink-0 text-teal-200" />
                      <span className="truncate">{video.name || video.key}</span>
                    </a>
                  ))}
                </div>
              )}
            </article>
          ))}
        </div>
      )}
      </>
      )}
    </section>
  )
}

type Contribution = {
  video_id: number
  studio: string
  eden: number
  type: string
  title?: string
  date?: string
  videos: { key: string; name?: string }[]
}

type StudioCredit = {
  movie_id: number
  id: number
  type: string
  title: string
  character?: string
}

//The person shoots their own reel about a title they worked on. Studio first, then the titles
//they are credited on inside that studio - so a reel can only ever be filed against their own
//work. Once filed it tallies toward that studio's mini series gate.
function MiniSeriesUploadPanel({ eden, onUploaded }: { eden: string; onUploaded: () => void }) {
  const [credits, setCredits] = useState<StudioCredit[]>([])
  const [movieId, setMovieId] = useState('')
  const [title, setTitle] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [loadingCredits, setLoadingCredits] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [contributions, setContributions] = useState<Contribution[]>([])
  const [editing, setEditing] = useState<Contribution | null>(null)

  const loadContributions = async () => {
    try {
      const { status, data } = await personFetch(
        endpoint(
          import.meta.env.VITE_PERSON_MINI_SERIES_UPLOADS,
          import.meta.env.VITE_PERSON_MINI_SERIES_UPLOADS_LIVE,
        ),
        { method: 'GET' },
      )
      if (status) setContributions(data)
    } catch (error) {
      console.log(error, 'error')
    }
  }

  useEffect(() => {
    loadContributions()
  }, [])

  //the title list refills whenever the studio above changes, and the stale title goes with it
  useEffect(() => {
    if (!eden) return
    setMovieId('')
    setLoadingCredits(true)
    ;(async () => {
      try {
        const { status, data } = await personFetch(
          endpoint(import.meta.env.VITE_PERSON_STUDIO_MEDIA, import.meta.env.VITE_PERSON_STUDIO_MEDIA_LIVE),
          { method: 'POST', body: JSON.stringify({ eden }) },
        )
        setLoadingCredits(false)
        if (status) {
          setCredits(data)
          if (data.length > 0) setMovieId(String(data[0].movie_id))
        } else {
          setCredits([])
        }
      } catch (error) {
        setLoadingCredits(false)
        console.log(error, 'error')
      }
    })()
  }, [eden])

  const upload = async () => {
    if (!movieId) {
      toast.error('Pick a title you are credited on')
      return
    }
    if (!file) {
      toast.error('Attach a mini series video')
      return
    }

    //multipart, so no JSON content-type here - the browser sets its own boundary
    const body = new FormData()
    body.append('mini_series', file)
    body.append('movie_id', movieId)
    if (title) body.append('title', title)

    setUploading(true)
    try {
      const res = await fetch(
        endpoint(import.meta.env.VITE_PERSON_MINI_SERIES_UPLOAD, import.meta.env.VITE_PERSON_MINI_SERIES_UPLOAD_LIVE),
        {
          method: 'POST',
          credentials: 'include',
          headers: { 'x-api-key': import.meta.env.VITE_API_KEY },
          body,
        },
      )

      const { status, message, error } = await res.json()
      setUploading(false)

      if (status) {
        toast.success(message)
        setTitle('')
        setFile(null)
        loadContributions()
        onUploaded()
        return
      }
      toast.error(error || message)
    } catch (error) {
      setUploading(false)
      console.log(error, 'error')
      toast.error('Could not upload the mini series')
    }
  }

  return (
    <div className="grid gap-4">
      <div className="rounded-lg border border-white/10 bg-white/[0.035] p-5">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-md border border-clay-300/25 bg-clay-500/15 text-clay-200">
            <Upload className="size-5" />
          </span>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-clay-400">Your reel</p>
            <h2 className="text-lg font-semibold text-white">Upload a mini series</h2>
          </div>
        </div>

        <div className="mt-5 grid gap-4">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-2">
                <span className="text-sm font-medium text-sand-100/70">Title</span>
                <select
                  className={inputClass}
                  value={movieId}
                  disabled={loadingCredits || credits.length === 0}
                  onChange={(e) => setMovieId(e.target.value)}
                >
                  {loadingCredits ? (
                    <option value="">Loading your titles...</option>
                  ) : credits.length === 0 ? (
                    <option value="">No credits with this studio</option>
                  ) : (
                    credits.map((credit) => (
                      <option key={credit.movie_id} value={String(credit.movie_id)}>
                        {credit.title} ({credit.type})
                        {credit.character ? ` - as ${credit.character}` : ''}
                      </option>
                    ))
                  )}
                </select>
                <span className="text-xs text-sand-100/38">Your credits inside the studio above.</span>
              </label>

              <Field label="Reel name (optional)" value={title} onChange={setTitle} placeholder="Behind the scenes" />
            </div>

            <label className="grid gap-2">
              <span className="text-sm font-medium text-sand-100/70">Mini series video</span>
              <input
                type="file"
                accept="video/*"
                className={fileClass}
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </label>

            <button
              type="button"
              onClick={upload}
              disabled={uploading || !movieId}
              className="inline-flex h-10 w-fit items-center justify-center gap-2 rounded-md bg-clay-500 px-4 text-sm font-bold text-white transition hover:bg-clay-400 disabled:opacity-50"
            >
              <Upload className="size-4" />
              {uploading ? 'Uploading...' : 'Upload mini series'}
            </button>

            <p className="text-xs text-sand-100/38">
              Your reel counts toward that studio's mini series total. One reel per title - edit the one you have
              to change it.
            </p>
        </div>
      </div>

      {contributions.length > 0 ? (
        <div className="rounded-lg border border-white/10 bg-white/[0.035] p-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-clay-400">Contributed</p>
          <h2 className="text-lg font-semibold text-white">Mini series you uploaded</h2>

          <div className="mt-4 grid gap-2">
            {contributions.map((item) => (
              <div key={item.video_id} className="rounded-md border border-white/10 bg-[#111317] px-3 py-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-white">
                      {item.videos[0]?.name || `Reel ${item.video_id}`}
                    </p>
                    <p className="mt-1 text-xs text-sand-100/45">
                      {[item.studio, item.title, item.type, item.date].filter(Boolean).join(' / ')}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {item.videos[0]?.key ? (
                      <a
                        href={`https://www.youtube.com/watch?v=${item.videos[0].key}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex h-8 items-center gap-2 rounded-md border border-white/10 px-3 text-xs text-sand-100/70 transition hover:bg-white/[0.06] hover:text-white"
                      >
                        <PlaySquare className="size-3.5" />
                        Watch
                      </a>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => setEditing(editing?.video_id === item.video_id ? null : item)}
                      className="inline-flex h-8 items-center gap-2 rounded-md border border-white/10 px-3 text-xs text-white transition hover:bg-white/[0.06]"
                    >
                      <Edit3 className="size-3.5" />
                      {editing?.video_id === item.video_id ? 'Close' : 'Edit'}
                    </button>
                  </div>
                </div>

                {editing?.video_id === item.video_id ? (
                  <ReelEditPane
                    reel={item}
                    onDone={() => {
                      setEditing(null)
                      loadContributions()
                      onUploaded()
                    }}
                  />
                ) : null}
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}

//Rename a reel, swap the video behind it, or withdraw it. The title a reel is filed against
//does not move - that would re-point the tally at another studio, so it means a fresh upload.
function ReelEditPane({ reel, onDone }: { reel: Contribution; onDone: () => void }) {
  const [name, setName] = useState(reel.videos[0]?.name || '')
  const [file, setFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const [confirmRemove, setConfirmRemove] = useState(false)

  const save = async () => {
    const renamed = name && name !== reel.videos[0]?.name

    if (!renamed && !file) {
      toast.error('Change the name or attach a replacement video')
      return
    }

    const body = new FormData()
    body.append('video_id', String(reel.video_id))
    if (renamed) body.append('title', name)
    if (file) body.append('mini_series', file)

    setSaving(true)
    try {
      const res = await fetch(
        endpoint(import.meta.env.VITE_PERSON_MINI_SERIES_UPDATE, import.meta.env.VITE_PERSON_MINI_SERIES_UPDATE_LIVE),
        {
          method: 'POST',
          credentials: 'include',
          headers: { 'x-api-key': import.meta.env.VITE_API_KEY },
          body,
        },
      )

      const { status, message, error } = await res.json()
      setSaving(false)

      if (status) {
        toast.success(message)
        onDone()
        return
      }
      toast.error(error || message)
    } catch (error) {
      setSaving(false)
      console.log(error, 'error')
      toast.error('Could not save the reel')
    }
  }

  const remove = async () => {
    setSaving(true)
    try {
      const { status, message, error } = await personFetch(
        endpoint(import.meta.env.VITE_PERSON_MINI_SERIES_REMOVE, import.meta.env.VITE_PERSON_MINI_SERIES_REMOVE_LIVE),
        { method: 'POST', body: JSON.stringify({ video_id: reel.video_id }) },
      )
      setSaving(false)

      if (status) {
        toast.success(message)
        onDone()
        return
      }
      toast.error(error || message)
    } catch (error) {
      setSaving(false)
      console.log(error, 'error')
      toast.error('Could not withdraw the reel')
    }
  }

  return (
    <div className="mt-4 grid gap-4 border-t border-white/10 pt-4">
      <p className="text-xs text-sand-100/38">
        Filed against {[reel.studio, reel.title].filter(Boolean).join(' / ')}. To file against another title,
        withdraw this reel and upload again.
      </p>

      <Field label="Reel name" value={name} onChange={setName} placeholder="Behind the scenes" />

      <label className="grid gap-2">
        <span className="text-sm font-medium text-sand-100/70">Replace the video (optional)</span>
        <input
          type="file"
          accept="video/*"
          className={fileClass}
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
        <span className="text-xs text-sand-100/38">
          Leave empty to only rename. A replacement removes the reel it supersedes.
        </span>
      </label>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="inline-flex h-9 items-center gap-2 rounded-md bg-clay-500 px-3 text-sm font-bold text-white transition hover:bg-clay-400 disabled:opacity-50"
        >
          <Save className="size-4" />
          {saving ? 'Saving...' : file ? 'Replace reel' : 'Save name'}
        </button>

        {confirmRemove ? (
          <>
            <button
              type="button"
              onClick={remove}
              disabled={saving}
              className="inline-flex h-9 items-center gap-2 rounded-md border border-red-300/25 bg-red-400/10 px-3 text-sm font-bold text-red-100 transition hover:bg-red-400/15 disabled:opacity-50"
            >
              <Trash2 className="size-4" />
              Withdraw for good
            </button>
            <button
              type="button"
              onClick={() => setConfirmRemove(false)}
              className="inline-flex h-9 items-center rounded-md border border-white/10 px-3 text-sm text-sand-100/60 transition hover:bg-white/[0.06]"
            >
              Cancel
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmRemove(true)}
            className="inline-flex h-9 items-center gap-2 rounded-md border border-white/10 px-3 text-sm text-sand-100/60 transition hover:bg-white/[0.06] hover:text-white"
          >
            <Trash2 className="size-4" />
            Withdraw reel
          </button>
        )}
      </div>

      {confirmRemove ? (
        <p className="text-xs text-red-200/70">
          This deletes the video and takes its tally off {reel.studio}'s mini series total.
        </p>
      ) : null}
    </div>
  )
}

//Item 10: open casting calls. The backend sorts the ones matching this person's department or
//skills to the top, and item 11's contact form is attached to each one.
function CastingPanel() {
  const [calls, setCalls] = useState<CastingCall[]>([])
  const [value, setValue] = useState('')
  const [open, setOpen] = useState<number | null>(null)
  const [message, setMessage] = useState('')

  const load = async (search?: string) => {
    try {
      const { status, data } = await personFetch(
        endpoint(import.meta.env.VITE_PERSON_CASTING, import.meta.env.VITE_PERSON_CASTING_LIVE),
        { method: 'POST', body: JSON.stringify({ value: search ?? '' }) },
      )
      if (status) setCalls(data)
    } catch (error) {
      console.log(error, 'error')
    }
  }

  useEffect(() => {
    load()
  }, [])

  const apply = async (call: CastingCall) => {
    if (!message) {
      toast.error('Write a message first')
      return
    }

    try {
      const { status, message: reply } = await personFetch(
        endpoint(import.meta.env.VITE_PERSON_CONTACT, import.meta.env.VITE_PERSON_CONTACT_LIVE),
        {
          method: 'POST',
          body: JSON.stringify({
            eden: call.eden,
            subject: `Application: ${call.title}`,
            message,
            casting_id: call.casting_id,
          }),
        },
      )

      if (status) {
        toast.success(reply)
        setMessage('')
        setOpen(null)
        return
      }
      toast.error(reply)
    } catch (error) {
      console.log(error, 'error')
      toast.error('Could not send the application')
    }
  }

  return (
    <section className="grid gap-3">
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          className={inputClass}
          placeholder="Search by role, department or skill"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
        <button
          type="button"
          onClick={() => load(value)}
          className="inline-flex h-10 shrink-0 items-center justify-center rounded-md border border-white/10 px-4 text-sm text-white transition hover:bg-white/[0.06]"
        >
          Search
        </button>
      </div>

      {calls.length === 0 ? (
        <EmptyPanel
          icon={Megaphone}
          title="No open casting calls"
          description="When a studio posts a role, it shows here - the ones matching your department or skills first."
        />
      ) : (
        calls.map((call) => (
          <article key={call.casting_id} className="rounded-lg border border-white/10 bg-white/[0.035] p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white">{call.title}</p>
                <p className="mt-1 text-xs text-sand-100/45">
                  {[call.studio, call.department, call.skill, call.region].filter(Boolean).join(' / ')}
                </p>
              </div>
              {call.matched ? (
                <span className="rounded-md border border-teal-300/25 bg-teal-300/10 px-2 py-1 text-[11px] uppercase tracking-[0.14em] text-teal-200">
                  Matches you
                </span>
              ) : null}
            </div>

            {call.description ? <p className="mt-3 text-sm text-sand-100/70">{call.description}</p> : null}
            <p className="mt-3 text-xs text-sand-100/38">
              {[call.compensation, call.deadline ? `apply before ${call.deadline}` : ''].filter(Boolean).join(' / ')}
            </p>

            {open === call.casting_id ? (
              <div className="mt-4 space-y-3">
                <textarea
                  rows={4}
                  className={textareaClass}
                  placeholder="Why you fit the role, and how to reach you"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => apply(call)}
                    className="inline-flex h-9 items-center gap-2 rounded-md bg-clay-500 px-3 text-sm font-bold text-white transition hover:bg-clay-400"
                  >
                    <Send className="size-4" />
                    Send application
                  </button>
                  <button
                    type="button"
                    onClick={() => setOpen(null)}
                    className="inline-flex h-9 items-center rounded-md border border-white/10 px-3 text-sm text-sand-100/60 transition hover:bg-white/[0.06]"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setOpen(call.casting_id)
                  setMessage('')
                }}
                className="mt-4 inline-flex h-9 items-center gap-2 rounded-md border border-white/10 px-3 text-sm text-white transition hover:bg-white/[0.06]"
              >
                <Send className="size-4" />
                Contact this studio
              </button>
            )}
          </article>
        ))
      )}
    </section>
  )
}

//Item 11: contact any studio the person has worked with, plus the log of what was already sent.
function MessagesPanel() {
  const [studios, setStudios] = useState<Studio[]>([])
  const [sent, setSent] = useState<SentMessage[]>([])
  const [form, setForm] = useState({ eden: '', subject: '', message: '' })

  const loadSent = async () => {
    try {
      const { status, data } = await personFetch(
        endpoint(import.meta.env.VITE_PERSON_CONTACT, import.meta.env.VITE_PERSON_CONTACT_LIVE),
        { method: 'GET' },
      )
      if (status) setSent(data)
    } catch (error) {
      console.log(error, 'error')
    }
  }

  useEffect(() => {
    (async () => {
      try {
        const { status, data } = await personFetch(
          endpoint(import.meta.env.VITE_PERSON_STUDIOS, import.meta.env.VITE_PERSON_STUDIOS_LIVE),
          { method: 'GET' },
        )
        if (status) {
          setStudios(data)
          if (data.length > 0) setForm((prev) => ({ ...prev, eden: String(data[0].eden) }))
        }
      } catch (error) {
        console.log(error, 'error')
      }
    })()
    loadSent()
  }, [])

  const send = async () => {
    if (!form.eden || !form.message) {
      toast.error('Pick a studio and write a message')
      return
    }

    try {
      const { status, message } = await personFetch(
        endpoint(import.meta.env.VITE_PERSON_CONTACT, import.meta.env.VITE_PERSON_CONTACT_LIVE),
        { method: 'POST', body: JSON.stringify(form) },
      )

      if (status) {
        toast.success(message)
        setForm((prev) => ({ ...prev, subject: '', message: '' }))
        loadSent()
        return
      }
      toast.error(message)
    } catch (error) {
      console.log(error, 'error')
      toast.error('Could not send the message')
    }
  }

  return (
    <section className="grid gap-4 xl:grid-cols-[1fr_1fr]">
      <div className="rounded-lg border border-white/10 bg-white/[0.035] p-5">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-md border border-clay-300/25 bg-clay-500/15 text-clay-200">
            <Mail className="size-5" />
          </span>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-clay-400">Contact</p>
            <h2 className="text-lg font-semibold text-white">Message a studio</h2>
          </div>
        </div>

        {studios.length === 0 ? (
          <p className="mt-5 text-sm text-sand-100/45">
            You can message a studio once you hold a credit with one, or through a casting call on the Casting tab.
          </p>
        ) : (
          <div className="mt-5 grid gap-4">
            <label className="grid gap-2">
              <span className="text-sm font-medium text-sand-100/70">Studio</span>
              <select
                className={inputClass}
                value={form.eden}
                onChange={(e) => setForm((prev) => ({ ...prev, eden: e.target.value }))}
              >
                {studios.map((studio) => (
                  <option key={studio.eden} value={String(studio.eden)}>
                    {studio.name}
                  </option>
                ))}
              </select>
            </label>

            <Field
              label="Subject"
              value={form.subject}
              placeholder="Availability for the next shoot"
              onChange={(value) => setForm((prev) => ({ ...prev, subject: value }))}
            />

            <label className="grid gap-2">
              <span className="text-sm font-medium text-sand-100/70">Message</span>
              <textarea
                rows={6}
                className={textareaClass}
                value={form.message}
                onChange={(e) => setForm((prev) => ({ ...prev, message: e.target.value }))}
              />
            </label>

            <button
              type="button"
              onClick={send}
              className="inline-flex h-10 w-fit items-center justify-center gap-2 rounded-md bg-clay-500 px-4 text-sm font-bold text-white transition hover:bg-clay-400"
            >
              <Send className="size-4" />
              Send message
            </button>
          </div>
        )}
      </div>

      <div className="grid gap-3">
        {sent.length === 0 ? (
          <EmptyPanel icon={Send} title="Nothing sent yet" description="Messages you send a studio are listed here." />
        ) : (
          sent.map((item) => (
            <article key={item.message_id} className="rounded-lg border border-white/10 bg-white/[0.035] p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white">{item.subject}</p>
                  <p className="mt-1 text-xs text-sand-100/45">{item.studio}</p>
                </div>
                <span className="rounded-md border border-white/10 px-2 py-1 text-[11px] uppercase tracking-[0.14em] text-sand-100/45">
                  {item.state}
                </span>
              </div>
              <p className="mt-3 whitespace-pre-line text-sm text-sand-100/70">{item.message}</p>
            </article>
          ))
        )}
      </div>
    </section>
  )
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  type?: string
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-medium text-sand-100/70">{label}</span>
      <input
        type={type}
        className={inputClass}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  )
}

function StatusRow({ label, complete, value }: { label: string; complete: boolean; value: string }) {
  const Icon = complete ? CheckCircle2 : Circle

  return (
    <div className="flex items-center justify-between gap-3 rounded-md border border-white/10 bg-[#111317] px-3 py-3">
      <div className="flex items-center gap-3">
        <Icon className={`size-4 ${complete ? 'text-teal-200' : 'text-sand-100/35'}`} />
        <span className="text-sm font-medium text-white">{label}</span>
      </div>
      <span className="truncate text-xs text-sand-100/45">{value}</span>
    </div>
  )
}

function Pagination({ page, total, onPage }: { page: number; total: number; onPage: (page: number) => void }) {
  const pages = Math.max(1, Math.ceil(total / 20))

  if (pages < 2) return null

  return (
    <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.035] px-4 py-3">
      <button
        type="button"
        disabled={page <= 1}
        onClick={() => onPage(page - 1)}
        className="inline-flex h-9 items-center rounded-md border border-white/10 px-3 text-sm text-white transition hover:bg-white/[0.06] disabled:opacity-40"
      >
        Previous
      </button>
      <span className="text-xs text-sand-100/45">
        Page {page} of {pages}
      </span>
      <button
        type="button"
        disabled={page >= pages}
        onClick={() => onPage(page + 1)}
        className="inline-flex h-9 items-center rounded-md border border-white/10 px-3 text-sm text-white transition hover:bg-white/[0.06] disabled:opacity-40"
      >
        Next
      </button>
    </div>
  )
}

function EmptyPanel({ icon: Icon, title, description }: { icon: LucideIcon; title: string; description: string }) {
  return (
    <div className="grid place-items-center gap-2 rounded-lg border border-dashed border-white/10 bg-white/[0.02] px-6 py-12 text-center">
      <Icon className="size-6 text-sand-100/30" />
      <p className="text-sm font-semibold text-white">{title}</p>
      <p className="max-w-md text-xs text-sand-100/42">{description}</p>
    </div>
  )
}
