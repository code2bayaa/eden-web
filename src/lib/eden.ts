// shapes and helpers shared by the landing page rails and the full cinema browser.

export type Film = {
  movie_id?: number
  title: string
  meta: string
  overview?: string
  release_date?: string
  // backblaze key of the poster the studio uploaded - fetched as bytes, see <Poster/>
  poster?: string | null
  // static art, only ever set on the landing page's fallback rail
  img?: string
  studio?: {
    eden: number
    name: string
  }
}

export type Studio = {
  eden: number
  name: string
  titles: number
}

export type CinemaResponse = {
  status: boolean
  data: Film[]
  page: number
  limit: number
  total: number
  pages: number
}

export const endpoint = (dev: string, live: string) =>
  import.meta.env.VITE_ENVIRONMENT === "development" ? dev : live

export const edenHeaders = () => ({ "x-api-key": import.meta.env.VITE_API_KEY })

// how many films the /cinema browser pulls per scroll
export const CINEMA_PAGE_SIZE = 20
