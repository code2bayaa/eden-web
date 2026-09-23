import { useEffect, useState } from 'react'
import { Camera, Upload, UserCircle } from 'lucide-react'
import { toast } from 'sonner'
import { endpoint } from '../lib/eden'

const HEAD_SHOT_LIMIT = 8 * 1024 * 1024

//the head shot sits in a private backblaze bucket, so it is fetched as bytes rather than
//a url - the endpoint reads profile_path off the signed-in person's own row, so there is
//no key to pass and nothing to guess at. A 404 just means they have not added one yet.
export function MugShot({
  profilePath,
  onSaved,
}: {
  profilePath?: string | null
  onSaved: () => void
}) {
  const [current, setCurrent] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  //re-runs after an upload, because saving swaps profile_path on the reloaded profile
  useEffect(() => {
    let mounted = true
    let objectUrl: string | null = null

    ;(async () => {
      try {
        const res = await fetch(
          endpoint(import.meta.env.VITE_PERSON_PROFILE_IMAGE, import.meta.env.VITE_PERSON_PROFILE_IMAGE_LIVE),
          { credentials: 'include', headers: { 'x-api-key': import.meta.env.VITE_API_KEY } },
        )

        if (!res.ok || !mounted) return

        objectUrl = URL.createObjectURL(await res.blob())
        if (mounted) setCurrent(objectUrl)
      } catch (error) {
        // nothing on screen, which is what the placeholder is for
      }
    })()

    return () => {
      mounted = false
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [profilePath])

  const pick = (picked: File | null) => {
    if (preview) URL.revokeObjectURL(preview)

    if (!picked) {
      setFile(null)
      setPreview(null)
      return
    }

    //the same two rules the endpoint enforces, checked here so nobody waits out an
    //upload only to be told the file was never going to be accepted
    if (!picked.type.startsWith('image/')) {
      toast.error('A head shot has to be an image')
      setFile(null)
      setPreview(null)
      return
    }
    if (picked.size > HEAD_SHOT_LIMIT) {
      toast.error('Keep the head shot under 8MB')
      setFile(null)
      setPreview(null)
      return
    }

    setFile(picked)
    setPreview(URL.createObjectURL(picked))
  }

  const upload = async () => {
    if (!file) {
      toast.error('Pick a head shot first')
      return
    }

    //multipart, so no JSON content-type here - the browser sets its own boundary
    const body = new FormData()
    body.append('profile_path', file)

    setUploading(true)
    try {
      const res = await fetch(
        endpoint(import.meta.env.VITE_PERSON_PROFILE_IMAGE, import.meta.env.VITE_PERSON_PROFILE_IMAGE_LIVE),
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
        pick(null)
        onSaved()
        return
      }
      toast.error(error || message)
    } catch (error) {
      setUploading(false)
      console.log(error, 'error')
      toast.error('Could not upload the head shot')
    }
  }

  const shown = preview || current

  return (
    <div className="mt-5 flex flex-wrap items-center gap-4 rounded-md border border-white/10 bg-[#111317] p-4">
      <div className="size-24 shrink-0 overflow-hidden rounded-full border border-white/10 bg-white/[0.04]">
        {shown ? (
          <img src={shown} alt="Your head shot" className="size-full object-cover" />
        ) : (
          <span className="grid size-full place-items-center text-sand-100/25">
            <UserCircle className="size-10" />
          </span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-white">Head shot</p>
        <p className="mt-1 text-xs text-sand-100/38">
          {preview
            ? 'Preview only - upload to keep it.'
            : current
              ? 'Casting directors see this on your profile.'
              : 'Add a photo so casting directors can put a face to your credits.'}
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <label className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-md border border-white/10 px-3 text-sm text-sand-100/70 transition hover:bg-white/[0.06] hover:text-white">
            <Camera className="size-4" />
            {current ? 'Change photo' : 'Choose photo'}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => pick(e.target.files?.[0] ?? null)}
            />
          </label>

          {file && (
            <>
              <button
                type="button"
                disabled={uploading}
                onClick={upload}
                className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-clay-500 px-3 text-sm font-bold text-white transition hover:bg-clay-400 disabled:opacity-50"
              >
                <Upload className="size-4" />
                {uploading ? 'Uploading...' : 'Upload'}
              </button>
              <button
                type="button"
                disabled={uploading}
                onClick={() => pick(null)}
                className="h-9 rounded-md px-2 text-sm text-sand-100/50 transition hover:text-white disabled:opacity-50"
              >
                Cancel
              </button>
            </>
          )}
        </div>

        {file && <p className="mt-2 truncate text-xs text-sand-100/38">{file.name}</p>}
      </div>
    </div>
  )
}
