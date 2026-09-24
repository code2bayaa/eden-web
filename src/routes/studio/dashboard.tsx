import { createFileRoute, redirect, useRouter } from '@tanstack/react-router'
import { useMemo, useState, useEffect, useRef } from 'react'
import type { Dispatch, ReactNode, SetStateAction } from 'react'
import {toast, Toaster} from "sonner"
import Select from 'react-select';
import { joinMpesaRoom, newSocketKey } from "./../../lib/mpesaRoom";
import { HomeLogo } from "./../../components/HomeLogo";
import { WithdrawCard, type Payout } from "./../../components/WithdrawCard";
import {
  BadgeDollarSign,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Circle,
  Clapperboard,
  Copy,
  Edit3,
  Film,
  Image as ImageIcon,
  Layers3,
  Link as LinkIcon,
  ListVideo,
  Mail,
  MailOpen,
  Megaphone,
  PlaySquare,
  Plus,
  Save,
  Search,
  Tags,
  Trash2,
  Tv,
  Upload,
  UserCircle,
  UsersRound,
  Wallet,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { fieldNameFromStoreName } from '@apollo/client/cache';
import { set, string } from 'zod';
import { el } from 'zod/v4/locales';

export const Route = createFileRoute('/studio/dashboard')({
  beforeLoad: async () => {
    const isLoggedIn = await Authentication()

    if (!isLoggedIn) {
      throw redirect({
        to: '/signin',
      })
    }
  },
  component: Dashboard,
})

async function Authentication(): Promise<boolean> {
  try {
    const res = await fetch(
      `${
        import.meta.env.VITE_ENVIRONMENT === 'development'
          ? import.meta.env.VITE_AUTHENTICATION
          : import.meta.env.VITE_AUTHENTICATION_LIVE
      }`,
      {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': import.meta.env.VITE_API_KEY,
        },
      },
    )

    const { status } = await res.json()
    return Boolean(status)
  } catch {
    return false
  }
}

type SectionId =
  | 'profile'
  | 'movies'
  | 'tv'
  | 'seasons'
  | 'episodes'
  | 'genre'
  | 'images'
  | 'person'
  | 'casting'
  | 'miniSeries'
  | 'department'
  | 'language'
  
type GenreFormSchema = {
  name:string
  mode:string
  id?:string
  eden?:string | number
}

type DepartmentFormSchema = {
  label:string
  value?:string
  eden?:string | number
}

type LanguageFormSchema = {
  iso_639_1:string
  english_name:string
  name:string
  id?:string
  eden?:string | number
}

type VerifyFormSchema = {
  otp:string
  code:string
}

type EpisodeFormSchema = {
  name:string|number
  overview:string|number
  date:string|number
  season_number:string|number
  episode_number:string|number
  episode_type:string|number
  runtime:string|number
  seasonID:number|string
  tvID:number|string
}

type SeasonFormSchema = {
  name:string | number
  overview:string | number
  date:string | number
  episode_count:string | number
  season_number:string | number
  tvID: string | number
}

type TvFormSchema = {
  tv_adult: boolean | null
  genre_ids: number[] | string[]
  name: string | number
  overview: string | number
  original_language: string | number
  region: string | number
  original_name:string | number
  date:string | number
}

type FormSchema = {
  adult: boolean | null
  genre_ids: number[] | string[]
  title: string | number
  overview: string | number
  original_language: string | number
  region: string | number
  original_title:string | number
  release_date:string | number
}

type CastFormSchema = {
  original_name:any
  name:any
  email:any
  telephone:any
  national_id:any
  biography:any
  birth_date:any
  death_date:any
  gender:any
  department:any
}

type PersonFormSchema = {
  title:number
  name:number
  person:number
  character:string
  department:string[]
}

type RouteItem = {
  id: string
  label: string
  description: string
  data?:any
}

type SectionConfig = {
  id: SectionId
  label: string
  eyebrow: string
  icon: LucideIcon
  routes: RouteItem[]
}

type FieldKind =
  | 'text'
  | 'number'
  | 'date'
  | 'textarea'
  | 'select'
  | 'multiselect'
  | 'checkbox'
  | 'file'


type SelectConfig = {
  value:string | number
  label: string
}

type FieldConfig = {
  label: string
  kind: FieldKind
  placeholder?: string
  defaultValue?: string | number
  defaultValues?: string[] | number[]
  options?: SelectConfig[]
  note?: string
  title:string
  rows?: number
  checked?: boolean
}

type MediaRow = {
  id: number
  title: string
  image: string
  detail: string
  badge: string
  share: string
  mediaName?: string
  verification?:boolean
  total:number
} 

type WorkspaceProps = {
  routeId: string
  onRouteChange: Dispatch<SetStateAction<string>>
  setSections: Dispatch<SetStateAction<SectionConfig[]>>
  sections: SectionConfig[]
}

type FilteredWorkspaceProps = WorkspaceProps & {
  // selectedTv: string
  // setSelectedTv: Dispatch<SetStateAction<string>>
  // selectedSeason: string
  // setSelectedSeason: Dispatch<SetStateAction<string>>
}

type Options = {
  value:string | number
  label:string
}

// const genreOptions = [
//   '18 - Drama',
//   '10749 - Romance',
//   '80 - Crime',
//   '28 - Action',
//   '10764 - Reality',
//   '35 - Comedy',
//   '99 - Documentary',
//   '9648 - Mystery',
// ]


// const tvOptions = [
//   '135934 - Outlast: The Jungle',
//   '322803 - Riverwood After Dark',
//   '208511 - Nairobi Signal',
// ]

const tvOptions = async() => {
  try{
    const res = await fetch(`${import.meta.env.VITE_ENVIRONMENT === "development" ? import.meta.env.VITE_FETCH_TV_MEDIA : import.meta.env.VITE_FETCH_TV_MEDIA_LIVE}`,{
      method:"POST",
      credentials: "include",
      headers: {
        'Content-Type': 'application/json', // Indicates the body is JSON
        'x-api-key':import.meta.env.VITE_API_KEY
      },
      body:JSON.stringify({
        page:1
      })
    }); 

    const {status, message, data} = await res.json()

    if(status){
      return data.map(({name,tv_id}:{name:string,tv_id:number}) => ({label:name, value:tv_id}))
    }
    return null
  }catch(error){
    console.log(error,"error")
    return null
  }
}

const seasonOptions = async(tvID:number) => {
  try{
    const res = await fetch(`${import.meta.env.VITE_ENVIRONMENT === "development" ? import.meta.env.VITE_FETCH_SEASON_MEDIA : import.meta.env.VITE_FETCH_SEASON_MEDIA_LIVE}`,{
      method:"POST",
      credentials: "include",
      headers: {
        'Content-Type': 'application/json', // Indicates the body is JSON
        'x-api-key':import.meta.env.VITE_API_KEY
      },
      body:JSON.stringify({
        id:tvID,
        page:1
      })
    }); 

    const {status, message, data} = await res.json()

    if(status){
      return data.map(({season_number,season_id}:{season_number:number,season_id:number}) => ({label:season_number, value:season_id}))
    }
    return null
  }catch(error){
    console.log(error,"error")
    return null
  }
}
// const seasonOptions = [
//   '0 - Specials',
//   '1 - Season One',
//   '2 - Season Two',
//   '4 - Season Four',
// ]

// const episodeOptions = [
//   '1 - One Year Later...',
//   '2 - Smoke Signal',
//   '3 - The Debt',
//   '4 - Finale Cut',
// ]

// const uploadedImageOptions = [
//   '/xkkrQraisWEgHbY7FQbOBFqonC2.jpg',
//   '/2NOw7k8OlpPoqtPR8TOpFyWnHEu.png',
//   '/vOQUiJ8sokhHTUzaH8VO0fDsEXk.jpg',
//   '/mkhpV2EgA3S4xFyl7KPOpxORa04.jpg',
//   '/kFVo7aEQpuT2EvBKvs0acfU6xIR.jpg',
//   '/acDJi0yEAMy82wmngFrJ0KjVRm2.jpg',
// ]

const personOptions = [
  '38941 - Jim Sturgess',
  '78201 - Wanjiru K.',
  '81044 - Musa Otieno',
  '115890 - Amina Barasa',
]

// const genderOptions = [
//   {
//     "value":2,
//     "label":"male"
//   },
//   {
//     "value":1,
//     "label":"female"
//   }
// ]

// const departmentOptions = [
//   {
//     "label":'Acting',
//     'value':'Acting'
//   },
//   {
//     "label":'Directing',
//     'value':'Directing'    
//   },
//   {
//     "label":'Writing',
//     'value':'Writing'    
//   },
//   {
//     "label":'Production',
//     'value':'Production'    
//   },
//   {
//     "label":'Crew',
//     'value':'Crew'    
//   },
//   {
//     "label":'Camera',
//     'value':'Camera'       
//   },
//   {
//     "label":'Editing',
//     'value':'Editing'       
//   },
//   {
//     "label":'Sound',
//     'value':'Sound'       
//   },
//   {
//     "label":'Art',
//     'value':'Art'    
//   },
//   {
//     "label":'Costume & Make-Up',
//     'value':'Costume & Make-Up'    
//   },
//   {
//     "label":'Visual Effects',
//     'value':'Visual Effects' 
//   },
//   {
//     "label":'Lighting',
//     'value':'Lighting'     
//   }
// ]
const movieRows = async(page:number) => {
  const res = await fetch(`${import.meta.env.VITE_ENVIRONMENT === "development" ? import.meta.env.VITE_FETCH_MOVIE_MEDIA : import.meta.env.VITE_FETCH_MOVIE_MEDIA_LIVE}`,{
    method:"POST",
    credentials: "include",
    headers: {
      'Content-Type': 'application/json', // Indicates the body is JSON
      'x-api-key':import.meta.env.VITE_API_KEY
    },
    body:JSON.stringify({
      page
    })
  }); 

  const {status, message, data, total} = await res.json()

  // console.log(status,"message",message)

  if(status){
    return data.map((row:any) => ({
      ...row,
      image: row?.poster_path,
      detail: row?.overview,
      badge: "movie",
      share: "https://uko-app.co.ke/movie/eden/" + row?.id,
      mediaName: "",
      total
    }))
  }else{
    return ([
      {
        id: 0,
        title: "",
        image: "",
        detail: "",
        badge: "",
        share: "",
        mediaName: ""
      }
    ])
  }
}
const tvRows = async(page:number) => {
  const res = await fetch(`${import.meta.env.VITE_ENVIRONMENT === "development" ? import.meta.env.VITE_FETCH_TV_MEDIA : import.meta.env.VITE_FETCH_TV_MEDIA_LIVE}`,{
    method:"POST",
    credentials: "include",
    headers: {
      'Content-Type': 'application/json', // Indicates the body is JSON
      'x-api-key':import.meta.env.VITE_API_KEY
    },
    body:JSON.stringify({
      page
    })
  }); 

  const {status, message, data, total} = await res.json()

  if(status){
    return data.map((row:any) => ({
      ...row,
      image: row?.poster_path,
      detail: row?.overview,
      badge: "tv",
      share: "https://uko-app.co.ke/tv/eden/" + row?.id,
      mediaName: "",
      total
    }))
  }else{
    return ([
      {
        id: 0,
        title: "",
        image: "",
        detail: "",
        badge: "",
        share: "",
        mediaName: ""
      }
    ])
  }
}
const seasonRows = async(tvID:number,page:number) => {
  // console.log("changed..")
  const res = await fetch(`${import.meta.env.VITE_ENVIRONMENT === "development" ? import.meta.env.VITE_FETCH_SEASON_MEDIA : import.meta.env.VITE_FETCH_SEASON_MEDIA_LIVE}`,{
    method:"POST",
    credentials: "include",
    headers: {
      'Content-Type': 'application/json', // Indicates the body is JSON
      'x-api-key':import.meta.env.VITE_API_KEY
    },
    body:JSON.stringify({
      id:tvID,
      page
    })
  }); 

  const {status, message, data, total} = await res.json()

  // console.log(status,"status",data,"data")
  if(status){
    return data.map((row:any) => ({
      ...row,
      image: row?.poster_path,
      detail: row?.overview,
      badge: "tv",
      share: "https://uko-app.co.ke/season/eden/" + row?.id,
      mediaName: "",
      total,
      tvID
    }))
  }else{
    return null
  }
}
const episodeRows = async(seasonID:any,page:number) => {
  const res = await fetch(`${import.meta.env.VITE_ENVIRONMENT === "development" ? import.meta.env.VITE_FETCH_EPISODE_MEDIA : import.meta.env.VITE_FETCH_EPISODE_MEDIA_LIVE}`,{
    method:"POST",
    credentials: "include",
    headers: {
      'Content-Type': 'application/json', // Indicates the body is JSON
      'x-api-key':import.meta.env.VITE_API_KEY
    },
    body:JSON.stringify({
      id:seasonID?.value,
      page
    })
  }); 

  const {status, message, data, total} = await res.json()
  // console.log(status,"status",data,"data",message,"message")

  if(status){
    return data.map((row:any) => ({
      ...row,
      image: row?.poster_path,
      detail: row?.overview,
      badge: "tv",
      share: "https://uko-app.co.ke/episode/eden/" + row?.id,
      mediaName: "",
      total,
      seasonID:seasonID?.value
    }))
  }else{
    return null
  }
}
const personRows = async(page:number) => {
  const res = await fetch(`${import.meta.env.VITE_ENVIRONMENT === "development" ? import.meta.env.VITE_FETCH_PEOPLE : import.meta.env.VITE_FETCH_PEOPLE_LIVE}`,{
    method:"POST",
    credentials: "include",
    headers: {
      'Content-Type': 'application/json', // Indicates the body is JSON
      'x-api-key':import.meta.env.VITE_API_KEY
    },
    body:JSON.stringify({
      page
    })
  }); 

  const {status, message, data, total} = await res.json()
  if(status){
    return data.map((row:any) => ({
      ...row,
      image: row?.profile_path,
      detail: row?.biography,
      badge: "person",
      share: "https://uko-app.co.ke/person/eden/" + row?.id,
      mediaName: row?.name,
      name:row?.original_name,
      verification:row?.verification || false,
      total
    }))
  }else{
    return null
  }
}
// const movieRows = createRows(
//   [
//     {
//       id: 152742,
//       title: 'La migliore offerta',
//       image: '/midnight.png',
//       detail: 'Drama, Romance, Crime / IT / 2013-01-01',
//       badge: 'Movie',
//       share: 'https://eden.uko-app.co.ke/watch/movie/152742',
//     },
//     {
//       id: 1290417,
//       title: 'Midnight in Nairobi',
//       image: '/echoes.png',
//       detail: 'Thriller, Mystery / EN / 2026-04-14',
//       badge: 'Video',
//       share: 'https://eden.uko-app.co.ke/watch/movie/1290417',
//     },
//     {
//       id: 778210,
//       title: "The Weaver's Song",
//       image: '/weaver.png',
//       detail: 'Documentary / SW / 2025-11-18',
//       badge: 'Movie',
//       share: 'https://eden.uko-app.co.ke/watch/movie/778210',
//     },
//   ],
//   'movie',
// )

// const tvRows = createRows(
//   [
//     {
//       id: 322803,
//       title: 'Outlast: The Jungle',
//       image: '/home.png',
//       detail: 'Reality / US / first aired 2026-06-10',
//       badge: 'TV',
//       share: 'https://eden.uko-app.co.ke/watch/tv/322803',
//     },
//     {
//       id: 135934,
//       title: 'Nairobi Signal',
//       image: '/midnight.png',
//       detail: 'Drama, Mystery / KE / first aired 2024-09-02',
//       badge: 'TV',
//       share: 'https://eden.uko-app.co.ke/watch/tv/135934',
//     },
//     {
//       id: 208511,
//       title: 'Riverwood After Dark',
//       image: '/echoes.png',
//       detail: 'Crime / KE / first aired 2025-02-20',
//       badge: 'TV',
//       share: 'https://eden.uko-app.co.ke/watch/tv/208511',
//     },
//   ],
//   'tv',
// )

// const seasonRows = createRows(
//   [
//     {
//       id: 242368,
//       title: 'Specials',
//       image: '/home.png',
//       detail: 'Season 0 / 29 episodes / air date 2019-03-26',
//       badge: 'Season',
//       share: 'https://eden.uko-app.co.ke/watch/tv/135934/season/0',
//       mediaName: 'Nairobi Signal',
//     },
//     {
//       id: 242369,
//       title: 'Season One',
//       image: '/midnight.png',
//       detail: 'Season 1 / 10 episodes / air date 2024-09-02',
//       badge: 'Season',
//       share: 'https://eden.uko-app.co.ke/watch/tv/135934/season/1',
//       mediaName: 'Nairobi Signal',
//     },
//     {
//       id: 242370,
//       title: 'Season Four',
//       image: '/echoes.png',
//       detail: 'Season 4 / 8 episodes / air date 2026-06-03',
//       badge: 'Season',
//       share: 'https://eden.uko-app.co.ke/watch/tv/322803/season/4',
//       mediaName: 'Outlast: The Jungle',
//     },
//   ],
//   'season',
// )

// const episodeRows = createRows(
//   [
//     {
//       id: 7003277,
//       title: 'One Year Later...',
//       image: '/weaver.png',
//       detail: 'S4 E1 / standard / 31 min / 2026-06-03',
//       badge: 'Episode',
//       share: 'https://eden.uko-app.co.ke/watch/tv/322803/season/4/episode/1',
//       mediaName: 'Outlast: The Jungle',
//     },
//     {
//       id: 7003278,
//       title: 'Smoke Signal',
//       image: '/midnight.png',
//       detail: 'S4 E2 / standard / 36 min / 2026-06-10',
//       badge: 'Episode',
//       share: 'https://eden.uko-app.co.ke/watch/tv/322803/season/4/episode/2',
//       mediaName: 'Outlast: The Jungle',
//     },
//     {
//       id: 7003279,
//       title: 'Finale Cut',
//       image: '/echoes.png',
//       detail: 'S4 E8 / Finale / 42 min / 2026-07-22',
//       badge: 'Episode',
//       share: 'https://eden.uko-app.co.ke/watch/tv/322803/season/4/episode/8',
//       mediaName: 'Outlast: The Jungle',
//     },
//   ],
//   'episode',
// )

// const miniSeriesRows = createRows(
//   [
//     {
//       id: 91011,
//       title: 'Official Trailer',
//       image: '/midnight.png',
//       detail: 'YouTube key hzyOsNyDkbM / 2026-04-14',
//       badge: 'Trailer',
//       share: 'https://eden.uko-app.co.ke/trailer/hzyOsNyDkbM',
//       mediaName: 'Midnight in Nairobi',
//     },
//     {
//       id: 91012,
//       title: 'Behind the Garden',
//       image: '/home.png',
//       detail: 'YouTube key qh20Studio01 / 2026-06-10',
//       badge: 'Trailer',
//       share: 'https://eden.uko-app.co.ke/trailer/qh20Studio01',
//       mediaName: 'Outlast: The Jungle',
//     },
//     {
//       id: 91013,
//       title: 'Director Teaser',
//       image: '/weaver.png',
//       detail: 'YouTube key rwvTeaser29 / 2025-11-18',
//       badge: 'Trailer',
//       share: 'https://eden.uko-app.co.ke/trailer/rwvTeaser29',
//       mediaName: "The Weaver's Song",
//     },
//   ],
//   'trailer',
// )

const personDataFields: FieldConfig[] = [
  { label: 'Name', kind: 'text', title:"original_name", placeholder: 'Original Name' },
  { label: 'Nick Name', kind: 'text', title:"name", placeholder: 'Nick Name' },
  { label: 'Email', kind: 'text', title:"email", placeholder: 'Email' },
  { label: 'Telephone', kind: 'text', title:"telephone", placeholder: '254712345678' },
  { label: 'National ID', kind: 'text', title:"national_id", placeholder: 'National ID' },
  { label: 'Upload National ID', kind: 'file', title:"identification" },
  { label: 'Biography', kind: 'textarea', title:"biography", placeholder: 'Person biography', rows: 5 },
  { label: 'Birth Date', kind: 'date', title:"birth_date", placeholder: '2023-01-01' },
  { label: 'Death Date', kind: 'date', title:"death_date", placeholder: '2023-01-01' },
  { label: 'Gender', kind: 'select', title:"gender" },
  { label: 'Department', kind: 'select', title:"department" }
]

const personMediaFields: FieldConfig[] = [
  { label: 'Select Person Name', kind: 'select', title:"people", placeholder: 'Jim Sturgess' },
  { label: 'Profile Upload', kind: 'file', title:"profile_path" },
  { label: 'Video Resume', kind: 'file', title:"resume_path" }
]

const personEditMediaFields: FieldConfig[] = [
  { label: 'Profile Upload', kind: 'file', title:"profile_path" },
  { label: 'Video Resume', kind: 'file', title:"resume_path" }
]

const movieDataFields: FieldConfig[] = [
  { label: 'Not Suitable For Children', note:"adult", title:"adult", kind: 'checkbox' },
  // { label: 'Softcore', kind: 'checkbox' },
  // { label: 'Backdrop upload', kind: 'file', note: 'Saved as backdrop_path' },
  // { label: 'Poster upload', kind: 'file', note: 'Saved as poster_path' },
  { label: 'Genres', kind: 'multiselect', title:"genre" },
  { label: 'Original language', kind: 'select', title:"language", placeholder: 'English' },
  { label: 'Region', kind: 'select', title:"region", placeholder: 'Kenya' },
  { label: 'Original title', kind: 'text', title:"original_title", placeholder: 'Young Forces' },
  { label: 'Title', kind: 'text', title:"title", placeholder: 'Yung Forces' },
  { label: 'Release date', kind: 'date', title:"release_date", placeholder: '2013-01-01' },
  // { label: 'Video', kind: 'checkbox', note: 'Removed from edit flow when updating metadata' },
  { label: 'Overview', kind: 'textarea', title:"overview", placeholder: 'Movie description', rows: 5 },
]

const movieMediaFields: FieldConfig[] = [
  { label: 'Select Movie Title', kind: 'select', title:"title", placeholder: 'Yung Forces' },
  { label: 'Backdrop Upload', kind: 'file', title:"backdrop_path" },
  { label: 'Poster Upload', kind: 'file', title:"poster_path" },
  { label: 'Logo Upload(s)', kind: 'file', title:"logo" },
  { label: 'Video Upload', kind: 'file', title:"video" },
  { label: 'Trailor Upload', kind: 'file', title:"trailor" },
  { label: 'Mini Series Upload', kind: 'file', title:"mini_series" }
]

const castCrewFields: FieldConfig[] = [
  { label: 'Select Movie Title', kind: 'select', title:"title", note:"start insert with the leading actor and finish with the least cast in order", placeholder: 'Yung Forces' },
  { label: 'Person', kind: 'select', title:"person" },
  // { label: 'Gender', kind: 'select', title:"gender" },
  // { label: 'Cast ID', kind: 'number', defaultValue: 6 },
  { label: 'Character', kind: 'text', title:"character", placeholder: 'Robert' },
  // { label: 'Order', kind: 'select', defaultValue: 0, title:"order", note: '0 means most important lead. last number least important cast' },
  { label: 'Department', kind: 'multiselect', title:"department", placeholder: 'Acting' },
]

const movieEditMediaFields: FieldConfig[] = [
  // { label: 'Select Movie Title', kind: 'select', title:"title", placeholder: 'Yung Forces' },
  { label: 'Backdrop Upload', kind: 'file', title:"backdrop_path" },
  { label: 'Poster Upload', kind: 'file', title:"poster_path" },
  { label: 'Logo Upload(s)', kind: 'file', title:"logo" },
  { label: 'Video Upload', kind: 'file', title:"video" },
  { label: 'Trailor Upload', kind: 'file', title:"trailor" },
  { label: 'Mini Series Upload', kind: 'file', title:"mini_series" }
]

const tvMediaFields: FieldConfig[] = [
  { label: 'Select Tv Title', kind: 'select', title:"name", placeholder: 'Yung Forces' },
  { label: 'Backdrop Upload', kind: 'file', title:"backdrop_path" },
  { label: 'Poster Upload', kind: 'file', title:"poster_path" },
  { label: 'Logo Upload(s)', kind: 'file', title:"logo" },
  { label: 'Trailor Upload', kind: 'file', title:"trailor" },
  { label: 'Mini Series Upload', kind: 'file', title:"mini_series" }
]

const tvEditImageFields: FieldConfig[] = [
  { label: 'Backdrop Upload', kind: 'file', title:"backdrop_path" },
  { label: 'Poster Upload', kind: 'file', title:"poster_path" },
  { label: 'Logo Upload(s)', kind: 'file', title:"logo" },
  { label: 'Trailor Upload', kind: 'file', title:"trailor" },
  { label: 'Mini Series Upload', kind: 'file', title:"mini_series" }
]

const seasonDataFields: FieldConfig[] = [
  { label: 'Name', kind: 'text', title:"name", placeholder: 'Specials' },
  { label: 'Overview', kind: 'textarea',title:"overview", placeholder: 'Season summary', rows: 5 },
  { label: 'Air date', kind: 'date', title:"date", placeholder: '2019-03-26' },
  { label: 'Episode count', kind: 'number', title:"episode_count", placeholder: "29" },
  { label: 'Season number', kind: 'number', title:"season_number", placeholder: "1" },
  // { label: 'Poster upload', kind: 'file', note: 'Saved as poster_path' },
]

const seasonMediaFields: FieldConfig[] = [
  { label: 'Select Season', kind: 'select', title:"name", placeholder: '1' },
  // { label: 'Select Season', kind: 'select', title:"name", placeholder: '1' },
  { label: 'Backdrop Upload', kind: 'file', title:"backdrop_path" },
  { label: 'Poster Upload', kind: 'file', title:"poster_path" },
  { label: 'Logo Upload(s)', kind: 'file', title:"logo" }
]

const castCrewSeasonFields: FieldConfig[] = [
  { label: 'Select Season', kind: 'select', title:"name", note:"start insert with the leading actor and finish with the least cast in order", placeholder: 'Yung Forces' },
  // { label: 'Select Season', kind: 'select', title:"title", placeholder: '1' },
  { label: 'Person', kind: 'select', title:"person" },
  { label: 'Character', kind: 'text', title:"character", placeholder: 'Robert' },
  { label: 'Department', kind: 'multiselect', title:"department", placeholder: 'Acting' },
]

const episodeDataFields: FieldConfig[] = [
  { label: 'Name', kind: 'text', title:'name', placeholder: 'High School' },
  { label: 'Overview', kind: 'textarea', title:'overview', placeholder: 'Episode description', rows: 5 },
  { label: 'Air date', kind: 'date', title:'date', placeholder: '2026-06-03' },
  { label: 'Episode number', kind: 'number', title:'episode_number', placeholder: '1' },
  { label: 'Episode type', kind: 'select', title:'episode_type', defaultValue: 'standard' },
  { label: 'Runtime', kind: 'number', title:'runtime', placeholder: '31' },
  // { label: 'Season number', kind: 'number', title:'season_number', placeholder: '4' },
  // { label: 'Still upload', kind: 'file', note: 'Saved as still_path after cloud upload' },
]

const episodeMediaFields: FieldConfig[] = [
  { label: 'Select Episode', kind: 'select', title:"name", placeholder: '1' },
  { label: 'Backdrop Upload', kind: 'file', title:"backdrop_path" },
  { label: 'Poster Upload', kind: 'file', title:"poster_path" },
  { label: 'Logo Upload(s)', kind: 'file', title:"logo" },
  { label: 'Video Upload', kind: 'file', title:"video" },
]

const castCrewEpisodeFields: FieldConfig[] = [
  { label: 'Select Episode', kind: 'select', title:"name", note:"start insert with the leading actor and finish with the least cast in order", placeholder: 'Yung Forces' },
  { label: 'Person', kind: 'select', title:"person" },
  { label: 'Character', kind: 'text', title:"character", placeholder: 'Robert' },
  { label: 'Department', kind: 'multiselect', title:"department", placeholder: 'Acting' },
]

const episodeEditMediaFields: FieldConfig[] = [
  { label: 'Backdrop Upload', kind: 'file', title:"backdrop_path" },
  { label: 'Poster Upload', kind: 'file', title:"poster_path" },
  { label: 'Logo Upload(s)', kind: 'file', title:"logo" },
  { label: 'Video Upload', kind: 'file', title:"video" },
]

const tvDataFields: FieldConfig[] = [
  { label: 'Not Suitable For Children', note:"adult", title:"tv_adult", kind: 'checkbox' },
  // { label: 'Softcore', kind: 'checkbox' },
  // { label: 'Backdrop upload', kind: 'file', note: 'Saved as backdrop_path' },
  // { label: 'Poster upload', kind: 'file', note: 'Saved as poster_path' },
  { label: 'Genres', kind: 'multiselect', title:"genre" },
  { label: 'Region', kind: 'select', title:"region", placeholder: 'Kenya' },
  { label: 'Origin country', title:"country", kind: 'text', placeholder: 'Country' },
  { label: 'Original language', title:"language", kind: 'select', placeholder: 'Language' },
  { label: 'Original name', title:"original_name", kind: 'text', placeholder: 'Original Name' },
  { label: 'First air date', title:"date", kind: 'date', placeholder: 'Date' },
  { label: 'Name', kind: 'text', title:"name", placeholder: 'Name' },
  { label: 'Overview', title:"overview", kind: 'textarea', placeholder: 'TV show description', rows: 5 },
]
const castCrewTvFields: FieldConfig[] = [
  { label: 'Select Tv Title', kind: 'select', title:"name", note:"start insert with the leading actor and finish with the least cast in order", placeholder: 'Yung Forces' },
  { label: 'Person', kind: 'select', title:"person" },
  { label: 'Character', kind: 'text', title:"character", placeholder: 'Robert' },
  { label: 'Department', kind: 'multiselect', title:"department", placeholder: 'Acting' },
]

//monetization gate - mirrors MONETIZATION in back-end/js/index.js. mini_series is a "more than"
//rule, the rest are "at least" rules.
const MONETIZATION = {
  media: 20,
  views: 10000,
  followers: 500,
  mini_series: 100,
}

const verifyFields:FieldConfig[] = [
  {label:"Email OTP", note:"click to send otp sent to your email then confirm",title:"otp", kind:"text", placeholder:"OTP"},
  {label:"Telephone Code", note:"click to send mpesa message sent to your phone then confirm code",title:"code", kind:"text", placeholder:"CODE"}
]

function Dashboard() {
  const [activeSection, setActiveSection] = useState<SectionId>('profile')
  const [activeRoute, setActiveRoute] = useState('list')
  // const [selectedTv, setSelectedTv] = useState(null)
  // const [selectedSeason, setSelectedSeason] = useState(seasonOptions[0])
  // console.log(activeRoute,"troute")

  const [media, setMedia] = useState<number>(0)
  const [views, setViews] = useState<number>(0)
  const [followers, setFollowers] = useState<number>(0)
  const [miniSeries, setMiniSeries] = useState<number>(0)
  const [miniSeriesPerson, setMiniSeriesPerson] = useState<number>(0)
  const [wallet, setWallet] = useState<number>(0)
  const [payout, setPayout] = useState<Payout>({ phone: "", min: 100, withdrawals: [], monetized: false })
  const [sections, setSections] = useState<SectionConfig[]>([
    {
      id: 'profile',
      label: 'Profile',
      eyebrow: 'Studio account',
      icon: Wallet,
      routes: [
        { id: 'account', label: 'Studio profile', description: 'Studio image, wallet and withdraw' },
        { id: 'monetization', label: 'Monetization', description: 'Rules, packages and qualification' },
      ],
    },
    {
      id: 'movies',
      label: 'Movies',
      eyebrow: 'Video catalog',
      icon: Film,
      routes: [
        { id: 'list', label: 'Show all movies', description: '20 item pagination with share links' },
        { id: 'upload', label: 'Upload movie', description: 'Movie data, images, cast and crew' },
        // { id: 'edit', label: 'Edit movie', description: 'Update saved movie parameters' },
      ],
    },
    {
      id: 'tv',
      label: 'TV',
      eyebrow: 'Series catalog',
      icon: Tv,
      routes: [
        { id: 'list', label: 'Show all TV', description: '20 item pagination with share links' },
        { id: 'upload', label: 'Upload TV', description: 'TV data, images, cast and crew' },
        // { id: 'edit', label: 'Edit TV', description: 'Update TV parameters' },
      ],
    },
    {
      id: 'seasons',
      label: 'Seasons',
      eyebrow: 'TV structure',
      icon: Layers3,
      routes: [
        { id: 'list', label: 'Show seasons', description: 'Filter by TV and paginate seasons' },
        { id: 'upload', label: 'Upload season', description: 'Season data, poster, cast and crew' },
        // { id: 'edit', label: 'Edit season', description: 'Update season parameters' },
      ],
    },
    {
      id: 'episodes',
      label: 'Episodes',
      eyebrow: 'Episodic library',
      icon: ListVideo,
      routes: [
        { id: 'list', label: 'Show episodes', description: 'Filter by TV and season' },
        { id: 'upload', label: 'Upload episodes', description: 'Episode data, still image, cast and crew' },
        // { id: 'edit', label: 'Edit episode', description: 'Update episode parameters' },
      ],
    },
    {
      id: 'person',
      label: 'Person',
      eyebrow: 'Cast directory',
      icon: UserCircle,
      routes: [
        { id: 'list', label: 'Show all people', description: 'verify contacts for individual persons' },
        { id: 'upload', label: 'Upload person', description: 'Person profile and department' },
      ],
    },
    {
      id: 'casting',
      label: 'Casting',
      eyebrow: 'Looking for people',
      icon: Megaphone,
      routes: [
        { id: 'calls', label: 'Casting calls', description: 'Roles this studio is looking to fill' },
        { id: 'post', label: 'Post a call', description: 'Advertise a department or skill to every person' },
        { id: 'messages', label: 'Messages', description: 'What people have sent this studio' },
      ],
    },
    {
      id: 'genre',
      label: 'Genre',
      eyebrow: 'Taxonomy',
      icon: Tags,
      routes: [{ id: 'manage', label: 'Insert genres', description: 'Identity for movie catalogue' }],
    },
    {
      id: 'department',
      label: 'Department',
      eyebrow: 'Asset uploads',
      icon: Tags,
      routes: [{ id: 'manage', label: 'Insert departments', description: 'Create person departments' }],
    },
    {
      id: 'language',
      label: 'Language',
      eyebrow: 'English',
      icon: Tags,
      routes: [{ id: 'manage', label: 'Insert language', description: 'Local language for audience' }],
    },
    // {
    //   id: 'images',
    //   label: 'Images',
    //   eyebrow: 'Asset uploads',
    //   icon: ImageIcon,
    //   routes: [{ id: 'upload', label: 'Upload images', description: 'Image data and metadata' }],
    // },

    // {
    //   id: 'miniSeries',
    //   label: 'Mini Series',
    //   eyebrow: 'Trailers',
    //   icon: PlaySquare,
    //   routes: [
    //     { id: 'list', label: 'Show all mini series', description: 'Trailer rows with linked media' },
    //     { id: 'upload', label: 'Upload mini series', description: 'Trailer keys and metadata' },
    //     { id: 'edit', label: 'Edit mini series', description: 'Rename or remove trailer video' },
    //   ],
    // }
  ])
  useEffect(() => {
    (async() => {
      const res = await fetch(`${import.meta.env.VITE_ENVIRONMENT === "development" ? import.meta.env.VITE_PROFILE : import.meta.env.VITE_PROFILE_LIVE}`,{
        method:"GET",
        credentials: "include",
        headers: {
          'Content-Type': 'application/json', // Indicates the body is JSON
          'x-api-key':import.meta.env.VITE_API_KEY
        },
      }); 

      const {status, message, data} = await res.json()
      // console.log(message,"message")
      if(status){
        setMedia(data.media)
        setViews(data.views)
        setFollowers(data.followers)
        setMiniSeries(data.mini_series || 0)
        setMiniSeriesPerson(data.mini_series_person || 0)
        const amount = data.wallet.reduce((a: number,b : any) => {
          const sum = a + (b.amount || 0)
          return sum
        },0)
        //balance nets off withdrawals; older APIs only sent the wallet rows
        setWallet(typeof data.balance === "number" ? data.balance : amount)
        setPayout({ phone: data.payout_phone || "", min: data.min_withdrawal || 100, withdrawals: data.withdrawals || [], monetized: !!data.monetized, earnings: data.earnings || {} })
      }

    })()
  },[])


  const currentSection = useMemo(
    () => sections.find((section) => section.id === activeSection) ?? sections[0],
    [activeSection],
  )
  const currentRoute = currentSection.routes.find((route) => route.id === activeRoute) ?? currentSection.routes[0]
  const primaryRoute = currentSection.routes.find((route) => route.id === 'upload') ?? currentSection.routes[0]

  function selectSection(sectionId: SectionId) {
    const nextSection = sections.find((section) => section.id === sectionId) ?? sections[0]
    setActiveSection(sectionId)
    setActiveRoute(nextSection.routes[0].id)
  }

  return (
    <div className="min-h-screen bg-[#0b0d10] text-sand-100">
      <div className="grain-overlay" aria-hidden />
      <div className="flex min-h-screen flex-col lg:flex-row">
        <StudioSidebar activeSection={activeSection} onSelectSection={selectSection} sections={sections} />

        <main className="min-w-0 flex-1">
          <header className="sticky top-0 z-30 border-b border-white/10 bg-[#0b0d10]/90 backdrop-blur-xl">
            <div className="flex flex-col gap-4 px-4 py-4 lg:flex-row lg:items-center lg:justify-between lg:px-6">
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-clay-400">
                  {currentSection.eyebrow}
                </p>
                <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                  {currentSection.label} Studio Dashboard
                </h1>
                <p className="mt-1 max-w-3xl text-sm text-sand-100/55">{currentRoute.description}</p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <label className="relative block min-w-0 sm:w-72">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-sand-100/35" />
                  <input
                    type="search"
                    placeholder="Search catalog"
                    className="h-10 w-full rounded-md border border-white/10 bg-white/[0.04] pl-10 pr-3 text-sm text-white outline-none transition focus:border-teal-300/50 focus:ring-2 focus:ring-teal-300/10"
                  />
                </label>
                <button
                  type="button"
                  onClick={() => setActiveRoute(primaryRoute.id)}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-clay-500 px-4 text-sm font-bold text-white shadow-[0_10px_30px_-15px_rgba(217,125,90,0.9)] transition hover:bg-clay-400"
                >
                  <Plus className="size-4" />
                  {primaryRoute.id === 'upload' ? 'New Entry' : primaryRoute.label}
                </button>
              </div>
            </div>
          </header>

          <div className="space-y-5 px-4 py-5 lg:px-6">
            <MetricStrip media={media} views={views} followers={followers} miniSeries={miniSeries} wallet={wallet} />
            <SectionTabs section={currentSection} activeRoute={activeRoute} onRouteChange={setActiveRoute} />
            {renderWorkspace({
              activeSection,
              activeRoute,
              setActiveRoute,
              // selectedTv,
              // setSelectedTv,
              // selectedSeason,
              // setSelectedSeason,
              wallet,
              setWallet,
              payout,
              setPayout,
              media,
              views,
              followers,
              miniSeries,
              miniSeriesPerson,
              sections,
              setSections
            })}
          </div>
        </main>
      </div>
      <Toaster  richColors position="top-center"/>
    </div>
  )
}

function renderWorkspace(props: {
  activeSection: SectionId
  activeRoute: string
  setActiveRoute: Dispatch<SetStateAction<string>>
  // selectedTv: string
  // setSelectedTv: Dispatch<SetStateAction<string>>
  // selectedSeason: string
  // setSelectedSeason: Dispatch<SetStateAction<string>>,
  wallet:number,
  setWallet: Dispatch<SetStateAction<number>>,
  payout: Payout,
  setPayout: Dispatch<SetStateAction<Payout>>,
  media:number,
  miniSeries:number,
  miniSeriesPerson:number,
  views:number,
  followers:number,
  sections:SectionConfig[],
  setSections: Dispatch<SetStateAction<SectionConfig[]>>
}) {
  const baseProps = {
    routeId: props.activeRoute,
    onRouteChange: props.setActiveRoute,
    setSections: props.setSections,
    sections: props.sections
  }

  switch (props.activeSection) {
    case 'movies':
      return <MoviesWorkspace {...baseProps} />
    case 'seasons':
      return (
        <SeasonsWorkspace
          {...baseProps}
          // selectedTv={props.selectedTv}
          // setSelectedTv={props.setSelectedTv}
          // selectedSeason={props.selectedSeason}
          // setSelectedSeason={props.setSelectedSeason}
        />
      )
    case 'episodes':
      return (
        <EpisodesWorkspace
          {...baseProps}
          // selectedTv={props.selectedTv}
          // setSelectedTv={props.setSelectedTv}
          // selectedSeason={props.selectedSeason}
          // setSelectedSeason={props.setSelectedSeason}
        />
      )
    case 'tv':
      return <TvWorkspace {...baseProps} />
    case 'genre':
      return <GenreWorkspace />
    case 'department':
      return <DepartmentWorkspace />
    case 'language':
      return <LanguageWorkspace />
    case 'person':
      return <PersonWorkspace {...baseProps}/>
    case 'casting':
      return <CastingWorkspace routeId={props.activeRoute} />
    // case 'miniSeries':
    //   return <MiniSeriesWorkspace {...baseProps} />
    case 'profile':
      return <ProfileWorkspace routeId={props.activeRoute} wallet={props.wallet} setWallet={props.setWallet} payout={props.payout} setPayout={props.setPayout} media={props.media} views={props.views} followers={props.followers} miniSeries={props.miniSeries} miniSeriesPerson={props.miniSeriesPerson}  />
    default:
      return null
  }
}

function StudioSidebar({
  activeSection,
  onSelectSection,
  sections
}: {
  activeSection: SectionId
  onSelectSection: (sectionId: SectionId) => void
  sections: SectionConfig[]
}) {
  return (
    <aside className="border-b border-white/10 bg-[#111317] px-4 py-4 lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-72 lg:shrink-0 lg:flex-col lg:border-b-0 lg:border-r lg:px-4">
      <HomeLogo layout="inline" tone="studio" className="mb-3" />

      <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.04] p-3">
        <img src="/home.png" alt="EDEN studio" className="size-12 rounded-md object-cover" />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-white">EDEN STUDIO</p>
          <p className="truncate text-xs text-sand-100/45">Creator operations</p>
        </div>
      </div>

      {/* sidebar is pinned to the viewport on lg, so the tab list scrolls on its own to reach the last button */}
      <nav className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:min-h-0 lg:flex-1 lg:auto-rows-min lg:grid-cols-1 lg:overflow-y-auto lg:pb-4">
        {sections.map((section,index) => {
          const Icon = section.icon
          const isActive = section.id === activeSection

          return (
            <button
              key={index}
              type="button"
              onClick={() => onSelectSection(section.id)}
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
    </aside>
  )
}

function SectionTabs({
  section,
  activeRoute,
  onRouteChange,
}: {
  section: SectionConfig
  activeRoute: string
  onRouteChange: Dispatch<SetStateAction<string>>
}) {
  return (
    <section className="overflow-x-auto rounded-lg border border-white/10 bg-white/[0.035] p-2">
      <div className="flex min-w-max gap-2">
        {section.routes.map((route,index) => {
          const isActive = route.id === activeRoute
          return (
            <button
              key={index}
              type="button"
              onClick={() => onRouteChange(route.id)}
              className={`rounded-md px-3 py-2 text-left transition ${
                isActive ? 'bg-white text-[#111317]' : 'text-sand-100/65 hover:bg-white/[0.06] hover:text-white'
              }`}
            >
              <span className="block text-sm font-bold">{route.label}</span>
              <span className={`block text-[11px] ${isActive ? 'text-[#111317]/60' : 'text-sand-100/38'}`}>
                {route.description}
              </span>
            </button>
          )
        })}
      </div>
    </section>
  )
}

function MetricStrip({
  media,
  views,
  followers,
  miniSeries,
  wallet
}:{
  media:number,
  views:number,
  followers:number,
  miniSeries:number,
  wallet:number
}) {

  //progress is capped at 100 so a studio past a gate does not overflow the bar
  const share = (value:number, target:number) => Math.min(100, Math.ceil((value / target) * 100))

  const metrics = [
    { label: 'Media uploaded', value: media, target: `${MONETIZATION.media} required`, progress: share(media, MONETIZATION.media), icon: Clapperboard },
    { label: 'Total views', value: views, target: `${MONETIZATION.views.toLocaleString()} required`, progress: share(views, MONETIZATION.views), icon: CalendarDays },
    { label: 'Followers', value: followers, target: `${MONETIZATION.followers} required`, progress: share(followers, MONETIZATION.followers), icon: UsersRound },
    { label: 'Mini series', value: miniSeries, target: `more than ${MONETIZATION.mini_series} required`, progress: share(miniSeries, MONETIZATION.mini_series + 1), icon: PlaySquare },
    { label: 'Wallet', value: `KES ${wallet}`, target: 'Maximum account holds 30K', progress: share(wallet, 30000), icon: BadgeDollarSign },
  ]

  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
      {metrics.map((metric,index) => {
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
            <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-teal-300" style={{ width: `${metric.progress}%` }} />
            </div>
            <p className="mt-2 text-xs text-sand-100/42">{metric.target}</p>
          </article>
        )
      })}
    </section>
  )
}

function MoviesWorkspace({ routeId, onRouteChange, setSections, sections }: WorkspaceProps) {

  // const [movieID,setMovieID] = useState<number | null>(null)
  
  if (routeId === 'upload') {
    return (
      <FormDeck>
        <FormSection title="Movie Data" onRouteChange={onRouteChange} eyebrow="movies schema" icon={Film} upload="details" fields={movieDataFields} actionLabel="Insert movie" />
        <FormSection title="Media Uploads" eyebrow="uploaded library" upload = "media" icon={ImageIcon} fields={movieMediaFields} actionLabel="Attach media" />
        <FormSection title="Cast & Crew" eyebrow="persons inserted" upload="person" icon={UsersRound} fields={castCrewFields} actionLabel="Save credits" />
      </FormDeck>
    )
  }

  if (routeId === 'edit') {

    const [movieEditFields,setMovieEditFields] = useState<FieldConfig[] | null>(null) 

    useEffect(() => {
      const editData:FieldConfig[] = [
        { checked: sections[1].routes[2].data.adult, label: 'Not Suitable For Children', note:"adult", title:"adult", kind: 'checkbox' },
        { defaultValues: sections[1].routes[2].data.genre_ids, label: 'Genres', kind: 'multiselect', title:"genre" },
        { defaultValue: sections[1].routes[2].data.original_language, label: 'Original language', kind: 'select', title:"language", placeholder: 'English' },
        { defaultValue: sections[1].routes[2].data.region, label: 'Region', kind: 'select', title:"region", placeholder: 'Kenya' },
        { defaultValue: sections[1].routes[2].data.original_title, label: 'Original title', kind: 'text', title:"original_title", placeholder: 'Young Forces' },
        { defaultValue: sections[1].routes[2].data.title, label: 'Title', kind: 'text', title:"title", placeholder: 'Yung Forces' },
        { defaultValue: sections[1].routes[2].data.release_date, label: 'Release date', kind: 'date', title:"release_date", placeholder: '2013-01-01' },
        { defaultValue:sections[1].routes[2].data.overview, label: 'Overview', kind: 'textarea', title:"overview", placeholder: 'Movie description', rows: 5 },  
      ]

      // console.log("edit fields",editData)
      setMovieEditFields(editData)
    },[])
    return (
      <FormDeck>
        {
          movieEditFields && (
            <FormSection
              title="Edit Movie"
              eyebrow="metadata update"
              icon={Edit3}
              upload="edit-details"
              fields={movieEditFields}
              actionLabel="Edit Movie"
              client={sections[1].routes[2].data.movie_id}
            />
          )
        }
        <FormSection client={sections[1].routes[2].data.movie_id} title="Replace Media" upload="edit-media" eyebrow="backdrop and poster" icon={ImageIcon} fields={movieEditMediaFields} actionLabel="Update media" />
        <ActionPanel
          title="Remove Person"
          icon={Trash2}
          body="Remove cast and crew"
          actionLabel="Remove cast and crew"
          client={sections[1].routes[2].data.movie_id}
        />
      </FormDeck>
    )
  }

  const goToEdit = (data:any) => {
    setSections((prev:any) => {
      prev[1].routes[2] = ({ id: 'edit', label: 'Edit > ' + data?.title, description: 'Update saved movie parameters', data })
      return ([
        ...prev,
      ])
    })
    // console.log(id,"id")

    // setMovieID(id)
    onRouteChange('edit')   
  }

  return (
    <MediaList
      title="All Movies"
      description="Showing 20 movie items with poster, title, share link and edit action."
      rows={() => movieRows(1)}
      onEdit={(data:any) => goToEdit(data)}
    />
  )
}
// let count = 0

function SeasonsWorkspace({
  routeId,
  onRouteChange,
  // selectedTv,
  // setSelectedTv,
  setSections, 
  sections
}: FilteredWorkspaceProps) {

  const [selectedTv, setSelectedTv] = useState<any>(null)
  const [allTv, setAllTv] = useState<any>(null)
  const [seasonEditFields,setSeasonEditFields] = useState<FieldConfig[] | null>(null)

  // console.log(selectedTv, "selected tv")

  useEffect(() => {
    (async() => {
      if(routeId !== 'edit'){
        const options = await tvOptions()
        setAllTv(options)
        // console.log(options,"options")
        options && options.length > 0 && setSelectedTv(options[0])
      }
    })()
  },[routeId])

    useEffect(() => {
      // console.log(routeId,"route")
      if(routeId !== 'edit')
        return;

      const editData:FieldConfig[] = [
        { defaultValue: sections[3].routes[2].data.season_number, label: 'Season Number', kind: 'number', title:"season_number", placeholder: '1' },
        { defaultValue: sections[3].routes[2].data.episode_count, label: 'Episode Count', kind: 'number', title:"episode_count", placeholder: 'Young Forces' },
        { defaultValue: sections[3].routes[2].data.name, label: 'Name', kind: 'text', title:"name", placeholder: 'Yung Forces' },
        { defaultValue: sections[3].routes[2].data.date, label: 'Air date', kind: 'date', title:"air_date", placeholder: '2013-01-01' },
        { defaultValue:sections[3].routes[2].data.overview, label: 'Overview', kind: 'textarea', title:"overview", placeholder: 'Movie description', rows: 5 },  
      ]
      // console.log(editData,"edit data...",sections[3].routes[2].data)
      setSeasonEditFields(editData)
    },[routeId])
  if (routeId === 'upload') {
    return (
      <>
        {/* {
          allTv && (
            <FilterBar selectedTv={selectedTv} setSelectedTv={setSelectedTv} allTv={allTv} setAllTv={setAllTv} />
          )
        } */}
        <FormDeck>
          <FormSection title="Season Data" selectedTv={selectedTv} onRouteChange={onRouteChange} upload="season-details" eyebrow="SEASONS schema" icon={Layers3} fields={seasonDataFields} actionLabel="Insert Season" />
          <FormSection
            title="Upload Media"
            eyebrow="uploaded library"
            icon={ImageIcon}
            upload="season-media"
            fields={seasonMediaFields}
            selectedTv={selectedTv}
            actionLabel="Attach media"
          />
          <FormSection selectedTv={selectedTv} upload="season-person" title="Cast & Crew" eyebrow="persons inserted" icon={UsersRound} fields={castCrewSeasonFields} actionLabel="Save credits" />
        </FormDeck>
      </>
    )
  }
  if (routeId === 'edit') {
     
    // return <p>Hey</p>
    return (
      <>
      {/* {
        allTv && (
          <FilterBar selectedTv={selectedTv} setSelectedTv={setSelectedTv} allTv={allTv} setAllTv={setAllTv} />
        )
      } */}
      {
        seasonEditFields && (
          <FormDeck>
            <FormSection 
              title="Edit Season" 
              eyebrow="Season schema" 
              icon={Edit3} 
              fields={seasonEditFields && seasonEditFields || []} 
              actionLabel="Update Season" 
              selectedTv={selectedTv}
              upload="season-edit-details"
              client={sections[3].routes[2].data.season_id}
            />
            <FormSection 
              title="Replace Media" 
              eyebrow="backdrop and poster" 
              icon={ImageIcon} 
              fields={tvEditImageFields} 
              actionLabel="Update Media"
              selectedTv={selectedTv}
              upload="season-edit-media"
              client={sections[3].routes[2].data.season_id}
            />
            <ActionPanel
              title="Remove Person"
              icon={Trash2}
              body="Remove cast and crew"
              actionLabel="Remove cast and crew"
              
              client={sections[3].routes[2].data.season_id}
            />
          </FormDeck>
        )
      }
      </>
    )
  }
  const goToEdit = (data:any) => {
    setSections((prev:any) => {
      prev[3].routes[2] = ({ id: 'edit', label: 'Edit > ' + data?.name, description: 'Update saved season parameters', data })
      return ([
        ...prev,
      ])
    })
    onRouteChange('edit')   
  }
  // console.log("change season rows: " + selectedTv)
  return (
    <>
      {
        allTv && (
          <FilterBar selectedTv={selectedTv} setSelectedTv={setSelectedTv} allTv={allTv} setAllTv={setAllTv} />
        )
      }
      <MediaList
        title="Seasons"
        description="Showing 20 season rows for the selected TV show."
        rows={() => selectedTv && seasonRows(selectedTv?.value,1)}
        onEdit={(data:any) => goToEdit(data)}
      />
    </>
  )
}

function EpisodesWorkspace({
  routeId,
  onRouteChange,
  // selectedTv,
  // setSelectedTv,
  // selectedSeason,
  // setSelectedSeason,
  setSections, 
  sections
}: FilteredWorkspaceProps) {
  const [selectedTv, setSelectedTv] = useState<any>(null)
  const [selectedSeason, setSelectedSeason] = useState<any>(null)
  const [allTv, setAllTv] = useState<any>(null)
  const [episodeEditFields,setEpisodeEditFields] = useState<FieldConfig[] | null>(null)
  const [allSeasons, setAllSeasons] = useState<any>(null)

  useEffect(() => {
    (async() => {
      if(routeId !== 'edit' && routeId !== 'upload'){
        const options = await tvOptions()
        setAllTv(options)
        // console.log(options,"options")
        options && options.length > 0 && setSelectedTv(options[0])
      }
    })()
  },[routeId])

  useEffect(() => {
    (async() => {

      // console.log("selectd tv: ", selectedTv, routeId)
      if(!selectedTv)
        return null
      // console.log("we are...")
      if(routeId !== 'edit' && routeId !== 'upload'){
        const options = await seasonOptions(selectedTv?.value)
        // console.log("options",options)
        setAllSeasons(options)
        options && options.length > 0 && setSelectedSeason(options[0])
      }
    })()
  },[selectedTv])

  useEffect(() => {
    if(routeId !== 'edit')
      return;

    // console.log(sections[4].routes[2].data.runtime,"runtime")
    const editData:FieldConfig[] = [
      { defaultValue: sections[4].routes[2].data.episode_number, label: 'Episode Number', kind: 'number', title:"episode_number", placeholder: '1' },
      { defaultValue: sections[4].routes[2].data.episode_type, label: 'Episode Type', kind: 'select', title:"episode_type" },
      { defaultValue: sections[4].routes[2].data.name, label: 'Name', kind: 'text', title:"name", placeholder: 'Yung Forces' },
      { defaultValue: sections[4].routes[2].data.date, label: 'Air date', kind: 'date', title:"air_date", placeholder: '2013-01-01' },
      { defaultValue: Number(sections[4].routes[2].data.runtime), label: 'Runtime', kind: 'number', title:"runtime" },
      { defaultValue:sections[4].routes[2].data.overview, label: 'Overview', kind: 'textarea', title:"overview", placeholder: 'Episode description', rows: 5 },  
    ]
    setEpisodeEditFields(editData)
  },[routeId])

  if (routeId === 'upload') {
    return (
      <>
        <FormDeck>
          <FormSection title="Episode Data" 
            selectedTv={selectedTv} 
            selectedSeason={selectedSeason}
            onRouteChange={onRouteChange} 
            upload="episode-details" 
            eyebrow="EPISODE schema" 
            icon={Layers3} 
            fields={episodeDataFields} 
            actionLabel="Insert Episode" />
          <FormSection
            title="Upload Media"
            eyebrow="uploaded library"
            icon={ImageIcon}
            upload="episode-media"
            fields={episodeMediaFields}
            selectedTv={selectedTv}
            selectedSeason={selectedSeason}
            actionLabel="Attach media"
          />
          <FormSection selectedTv={selectedTv} selectedSeason={selectedSeason} upload="episode-person" title="Cast & Crew" eyebrow="persons inserted" icon={UsersRound} fields={castCrewEpisodeFields} actionLabel="Save credits" />
        </FormDeck>
      </>
    )
  }
  if (routeId === 'edit') {
     
    // console.log(sections[4].routes[2],"sections")
    return (
      <>
      {
        episodeEditFields && (
          <FormDeck>
            {
              selectedSeason && selectedTv && (
                <FormSection 
                  title="Edit Episode" 
                  eyebrow="Episode schema" 
                  icon={Edit3} 
                  fields={episodeEditFields && episodeEditFields || []} 
                  actionLabel="Update Episode" 
                  selectedTv={selectedTv}
                  selectedSeason={selectedSeason}
                  upload="episode-edit-details"
                  client={sections[4].routes[2]?.data?.episode_id}
                />
              )
            }

            <FormSection 
              title="Replace Media" 
              eyebrow="backdrop and poster" 
              icon={ImageIcon} 
              fields={episodeEditMediaFields} 
              actionLabel="Update Media"
              selectedTv={selectedTv}
              selectedSeason={selectedSeason}
              upload="episode-edit-media"
              client={sections[4].routes[2]?.data?.episode_id}
            />
            <ActionPanel
              title="Remove Person"
              icon={Trash2}
              body="Remove cast and crew"
              actionLabel="Remove cast and crew"
              
              client={sections[4].routes[2]?.data?.episode_id}
            />
          </FormDeck>
        )
      }
      </>
    )
  }
  const goToEdit = (data:any) => {
    setSections((prev:any) => {
      prev[4].routes[2] = ({ id: 'edit', label: 'Edit > ' + data?.name, description: 'Update saved season parameters', data })
      return ([
        ...prev,
      ])
    })
    onRouteChange('edit')   
  }
  return (
    <>
      {
        (allTv || (allSeasons && selectedSeason)) && (
          <FilterBar selectedSeason={selectedSeason} selectedTv={selectedTv} setSelectedTv={setSelectedTv} setSelectedSeason={setSelectedSeason} allTv={allTv} setAllTv={setAllTv} allSeasons={allSeasons} setAllSeasons={setAllSeasons} />
        )
      }
      <MediaList
        title="Episodes"
        description="Showing 20 episodes rows for the selected TV show."
        rows={() => selectedSeason && episodeRows(selectedSeason,1)}
        onEdit={(data:any) => goToEdit(data)}
      />
    </>
  )
}

function TvWorkspace({ routeId, onRouteChange, setSections, sections }: WorkspaceProps) {


  if (routeId === 'upload') {
    return (
      <FormDeck>
        <FormSection title="TV Details" onRouteChange={onRouteChange} eyebrow="TV schema" icon={Tv} upload="tv-details" fields={tvDataFields} actionLabel="Insert TV" />
        <FormSection title="Upload Media" eyebrow="uploaded library" upload="tv-media" icon={ImageIcon} fields={tvMediaFields} actionLabel="Attach media" />
        <FormSection title="Cast & Crew" eyebrow="persons inserted" upload="tv-person" icon={UsersRound} fields={castCrewTvFields} actionLabel="Save credits" />
      </FormDeck>
    )
  }

  if (routeId === 'edit') {
    const [tvEditFields,setTvEditFields] = useState<FieldConfig[] | null>(null) 

    useEffect(() => {
      const editData:FieldConfig[] = [
        { checked: sections[2].routes[2].data.adult, label: 'Not Suitable For Children', note:"adult", title:"adult", kind: 'checkbox' },
        { defaultValues: sections[2].routes[2].data.genre_ids, label: 'Genres', kind: 'multiselect', title:"genre" },
        { defaultValue: sections[2].routes[2].data.original_language, label: 'Original language', kind: 'select', title:"language", placeholder: 'English' },
        { defaultValue: sections[2].routes[2].data.region, label: 'Region', kind: 'select', title:"region", placeholder: 'Kenya' },
        { defaultValue: sections[2].routes[2].data.original_name, label: 'Original Name', kind: 'text', title:"original_name", placeholder: 'Young Forces' },
        { defaultValue: sections[2].routes[2].data.name, label: 'Name', kind: 'text', title:"name", placeholder: 'Yung Forces' },
        { defaultValue: sections[2].routes[2].data.first_air_date, label: 'Release date', kind: 'date', title:"release_date", placeholder: '2013-01-01' },
        { defaultValue:sections[2].routes[2].data.overview, label: 'Overview', kind: 'textarea', title:"overview", placeholder: 'Movie description', rows: 5 },  
      ]

      setTvEditFields(editData)
    },[])
    return (
      <>
      {
        tvEditFields && (
          <FormDeck>
            <FormSection 
              title="Edit TV" 
              eyebrow="TV schema" 
              icon={Edit3} 
              fields={tvEditFields} 
              actionLabel="Save TV" 
              upload="tv-edit-details"
              client={sections[2].routes[2].data.tv_id}
            />
            <FormSection 
              title="Replace Media" 
              eyebrow="backdrop and poster" 
              icon={ImageIcon} 
              fields={tvEditImageFields} 
              actionLabel="Update Media"
              upload="tv-edit-media"
              client={sections[2].routes[2].data.tv_id}
            />
            <ActionPanel
              title="Remove Person"
              icon={Trash2}
              body="Remove cast and crew"
              actionLabel="Remove cast and crew"
              client={sections[2].routes[2].data.tv_id}
            />
          </FormDeck>
        )
      }
      </>
    )
  }
  const goToEdit = (data:any) => {
    setSections((prev:any) => {
      prev[2].routes[2] = ({ id: 'edit', label: 'Edit > ' + data?.name, description: 'Update saved tv parameters', data })
      return ([
        ...prev,
      ])
    })
    onRouteChange('edit')   
  }
  return (
    <MediaList
      title="All TV"
      description="Showing 20 TV items with poster, title, share link and edit action."
      rows={() => tvRows(1)}
      onEdit={(data:any) => goToEdit(data)}
    />
  )
}

function GenreWorkspace() {

  const [genreFields,setGenreFields] = useState<GenreFormSchema[] | null>(null)

  useEffect(() => {
    (async() => {
      const res = await fetch(`${import.meta.env.VITE_ENVIRONMENT === "development" ? import.meta.env.VITE_GENRE: import.meta.env.VITE_GENRE_LIVE}`,{
        method:"GET",
        credentials: "include",
        headers: {
          'Content-Type': 'application/json', // Indicates the body is JSON
          'x-api-key':import.meta.env.VITE_API_KEY
        },
      }); 

      const {status, message, data} = await res.json()
      if(status){
        setGenreFields(data)
      }
    })()
  },[])
  return (
    <FormDeck>
      <FormSection
        title="Insert Genre"
        eyebrow="GENRE schema"
        upload="genre-upload"
        icon={Tags}
        fields={[
          // { label: 'Genre ID', kind: 'number', defaultValue: 28 },
          { label: 'Name', title:'name', kind: 'text', placeholder: 'Action' },
          { label: 'Mode', title:'mode', kind: 'select', placeholder: 'movie' },
        ]}
        actionLabel="Save genre"
        setGenreFields={setGenreFields}
      />
      {
        genreFields && (
          <LibraryPanel title="Genre Preview" icon={Tags} items={genreFields.map((genre: GenreFormSchema) => `${genre.id} | ${genre.name} | ${genre.mode}`)} />

        )
      }
    </FormDeck>
  )
}

function DepartmentWorkspace() {

  const [departmentFields,setDepartmentFields] = useState<DepartmentFormSchema[] | null>(null)

  useEffect(() => {
    (async() => {
      const res = await fetch(`${import.meta.env.VITE_ENVIRONMENT === "development" ? import.meta.env.VITE_FETCH_DEPARTMENT: import.meta.env.VITE_FETCH_DEPARTMENT_LIVE}`,{
        method:"GET",
        credentials: "include",
        headers: {
          'Content-Type': 'application/json', // Indicates the body is JSON
          'x-api-key':import.meta.env.VITE_API_KEY
        },
      }); 

      const {status, message, data} = await res.json()
      // console.log(departmentFields,"department fields")
      if(status){
        setDepartmentFields(data)
      }
    })()
  },[])

  return (
    <FormDeck>
      <FormSection
        title="Insert Department"
        eyebrow="DEPARTMENT schema"
        upload="department-upload"
        icon={Tags}
        fields={[
          // { label: 'Genre ID', kind: 'number', defaultValue: 28 },
          { label: 'Name', title:'label', kind: 'text', placeholder: 'Action' },
          // { label: 'Mode', title:'mode', kind: 'select', placeholder: 'movie' },
        ]}
        actionLabel="Save department"
        setDepartmentFields={setDepartmentFields}
      />
      {
        departmentFields && (
          <LibraryPanel title="Department Preview" icon={Tags} items={departmentFields.map((department: DepartmentFormSchema) => `${department.value}`)} />
        )
      }
    </FormDeck>
  )
}

function LanguageWorkspace(){
   const [languageFields,setLanguageFields] = useState<LanguageFormSchema[] | null>(null)

  useEffect(() => {
    (async() => {
      const res = await fetch(`${import.meta.env.VITE_ENVIRONMENT === "development" ? import.meta.env.VITE_LANGUAGE: import.meta.env.VITE_LANGUAGE_LIVE}`,{
        method:"GET",
        credentials: "include",
        headers: {
          'Content-Type': 'application/json', // Indicates the body is JSON
          'x-api-key':import.meta.env.VITE_API_KEY
        },
      }); 

      const {status, message, data} = await res.json()
      if(status){
        setLanguageFields(data)
      }
    })()
  },[])
  return (
    <FormDeck>
      <FormSection
        title="Insert Language"
        eyebrow="LANGUAGE schema"
        upload="language-upload"
        icon={Tags}
        fields={[
          { label: 'Abbreviation', title:'iso_639_1', kind: 'text', placeholder: 'ka' },
          { label: 'English Name', title:'english_name', kind: 'text', placeholder: 'Georgian' },
          { label: 'Local Name', title:'name', kind: 'text', placeholder: 'ქართული' },
        ]}
        actionLabel="Save Language"
        setLanguageFields={setLanguageFields}
      />
      {
        languageFields && (
          <LibraryPanel title="Languages Preview" icon={Tags} items={languageFields.map((language: LanguageFormSchema) => `${language.english_name} | ${language.name} | ${language.iso_639_1}`)} />

        )
      }
    </FormDeck>
  ) 
}

// function ImagesWorkspace() {
//   return (
//     <FormDeck>
//       <FormSection
//         title="Image Data"
//         eyebrow="data"
//         icon={ImageIcon}
//         fields={[
//           { label: 'Path upload', kind: 'file', note: 'Saved as path' },
//           { label: 'Logo upload', kind: 'file', note: 'Saved as logo' },
//         ]}
//         actionLabel="Upload image"
//       />
//       <FormSection
//         title="Image Metadata"
//         eyebrow="meta data"
//         icon={LinkIcon}
//         fields={[
//           { label: 'Type', kind: 'select', options: ['tv', 'movie'], defaultValue: 'tv' },
//           { label: 'Media ID', kind: 'number', defaultValue: 135934 },
//           { label: 'Season', kind: 'number', defaultValue: -1 },
//           { label: 'Episode', kind: 'number', defaultValue: -1 },
//         ]}
//         actionLabel="Save metadata"
//       />
//       <LibraryPanel title="Uploaded Paths" icon={ImageIcon} items={uploadedImageOptions} />
//     </FormDeck>
//   )
// }

function PersonWorkspace({ routeId, onRouteChange, setSections, sections }: WorkspaceProps) {
  // return (
  //   <FormDeck>
  //     <FormSection
  //       title="Person Data"
  //       eyebrow="PERSON schema"
  //       icon={UserCircle}
  //       fields={[
  //         { label: 'Adult', kind: 'checkbox' },
  //         { label: 'Gender', kind: 'select', options: ['1 - Female', '2 - Male'], defaultValue: '2 - Male' },
  //         { label: 'Known for department', kind: 'select', options: departmentOptions, defaultValue: 'Acting' },
  //         { label: 'Name', kind: 'text', defaultValue: 'Jim Sturgess' },
  //         { label: 'Original name', kind: 'text', defaultValue: 'Jim Sturgess' },
  //         { label: 'Profile path', kind: 'select', defaultValue: '/acDJi0yEAMy82wmngFrJ0KjVRm2.jpg' },
  //       ]}
  //       actionLabel="Save person"
  //     />
  //     {/* <LibraryPanel title="People Ready For Credits" icon={UsersRound} items={personOptions} /> */}
  //   </FormDeck>
  // )
  const [personEditFields,setPersonEditFields] = useState<FieldConfig[] | null>(null) 
  const [index, setIndex] = useState<number>(0)
  // const [code, setCode] = useState<string>("")
  

  useEffect(() => {
    // console.log(sections[5].routes[2].data,routeId)
    if(routeId === "edit"){
      const position = sections[5].routes.findIndex(({id}:{id:string}) => id === "edit")

      if(position < 0){
        toast.error("reload page")
        return
      }
      
      setIndex(position)
      const editData:FieldConfig[] = [
        { defaultValue: sections[5].routes[position].data.mediaName, label: 'Nick Name', note:"commonly known as", title:"name", kind: 'text' },
        // { defaultValue: sections[5].routes[2].data.original_name, label: 'Original Name', kind: 'text', title:"original_name" },
        // { defaultValue: sections[5].routes[2].data.email, label: 'Email', kind: 'text', title:"email", placeholder: 'Email' },
        // { defaultValue: sections[5].routes[2].data.national_id, label: 'National ID', kind: 'text', title:"national_id", placeholder: 'National ID' },
        { defaultValue: sections[5].routes[position].data.biography, label: 'Biography', kind: 'textarea', title:"biography", placeholder: 'Person biography', rows: 5 },
        { defaultValue: sections[5].routes[position].data.birth_date, label: 'Birth Date', kind: 'date', title:"birth_date", placeholder: '2023-01-01' },
        { defaultValue: sections[5].routes[position].data.death_date, label: 'Death Date', kind: 'date', title:"death_date", placeholder: '2023-01-01' },
        // { defaultValue:sections[5].routes[2].data.gender, label: 'Gender', kind: 'select', title:"gender" }, 
        { defaultValues:sections[5].routes[position].data.department, label: 'Department', kind: 'select', title:"department" }  
      ]

      setPersonEditFields(editData)
    }else if(routeId === "verify"){
      (async() => {
        const position = sections[5].routes.findIndex(({id}:{id:string}) => id === "verify")

        if(position < 0){
          toast.error("reload page")
          return
        }
        
        setIndex(position)

        // const res = await fetch(`${import.meta.env.VITE_ENVIRONMENT === "development" ? import.meta.env.VITE_VERIFY : import.meta.env.VITE_VERIFY_LIVE}`,{
        //   method:"POST",
        //   body : JSON.stringify({
        //     id:sections[5].routes[position].data
        //   }),
        //   'credentials':"include",
        //   headers: {
        //     'Content-Type': 'application/json', // Indicates the body is JSON
        //     'x-api-key':import.meta.env.VITE_API_KEY,
        //   },
        // });

        // // console.log(position,"sent")

        // const {status, error, merchant, email} = await res.json()
        // // console.log(status, error, merchant, email)

        // if(status){
        //   toast.info("sending otp and mpesa confirmation...")
        //   //remove return
        //   // return

        // }else if(error){
        //   toast.error(error)
        // }
      })()
    }

  },[routeId])

  if(routeId === 'verify'){
    //send verification code to email
    //send MPESA 50 bob to phone number
    // useEffect(() => {


    // },[])

    return (
      <FormDeck>
        <FormSection 
          title="Verify Person" 
          eyebrow="Person schema" 
          icon={Edit3} 
          fields={verifyFields} 
          actionLabel="Verify" 
          upload="verify-code"
          // code={code}
          client={sections[5].routes[index].data}
        />
      </FormDeck>      
    )
  }

  if (routeId === 'edit') {

    return (
      <>
      {
        personEditFields && (
          <FormDeck>
            <FormSection 
              title="Edit Person" 
              eyebrow="Person schema" 
              icon={Edit3} 
              fields={personEditFields} 
              actionLabel="Edit Person" 
              upload="person-edit-details"
              client={sections[5].routes[index].data.person_id}
            />
            <FormSection 
              title="Replace Media" 
              eyebrow="profile head shot and video resume" 
              icon={ImageIcon} 
              fields={personEditMediaFields} 
              actionLabel="Update Media"
              upload="person-edit-media"
              client={sections[5].routes[index].data.person_id}
            />
          </FormDeck>
        )
      }
      </>
    )
  }
  // console.log(routeId,"route")
  if (routeId === 'upload') {
    return (
      <FormDeck>
        <FormSection title="Person Data" onRouteChange={onRouteChange} eyebrow="person schema" icon={UsersRound} upload="person-details" fields={personDataFields} actionLabel="Insert person" />
        <FormSection title="Media Uploads" eyebrow="uploaded library" upload = "person-media" icon={ImageIcon} fields={personMediaFields} actionLabel="Attach media" />
      </FormDeck>
    )
  }
  const goToEdit = (data:any) => {
    // console.log(data,"data")
    setSections((prev:any) => {
      const position = prev[5].routes.findIndex(({id}:{id:string}) => id === "edit")
      if(position > -1){
        prev[5].routes[position] = ({ id: 'edit', label: 'Edit > ' + data?.name, description: 'Update saved person parameters', data })
      }else{
        prev[5].routes.push({ id: 'edit', label: 'Edit > ' + data?.name, description: 'Update saved person parameters', data })
      }

      return ([
        ...prev,
      ])
    })
    onRouteChange('edit')   
  }

  const verifyPerson = (id:number) => {
    setSections((prev:any) => {
      const position = prev[5].routes.findIndex(({id}:{id:string}) => id === "verify")
      if(position > -1){
        prev[5].routes[position] = ({ id: 'verify', label: 'Verify', description: 'Verify Contacts', data:id })
      }else{
        prev[5].routes.push({ id: 'verify', label: 'Verify', description: 'Verify Contacts', data:id })
      }      
      
      return ([
        ...prev,
      ])
    })
    onRouteChange('verify')      
  }

  return (
    <MediaList
      title="All Persons"
      description="Showing 20 person items with profile image, name, share link and edit action."
      rows={() => personRows(1)}
      onEdit={(data:any) => goToEdit(data)}
      verifyPerson={(id:number) => verifyPerson(id)}
    />
  )
}

// function MiniSeriesWorkspace({ routeId, onRouteChange }: WorkspaceProps) {
//   if (routeId === 'upload') {
//     return (
//       <FormDeck>
//         <FormSection
//           title="Trailer Data"
//           eyebrow="TRAILERS data"
//           icon={PlaySquare}
//           fields={[
//             { label: 'YouTube key', kind: 'text', defaultValue: 'hzyOsNyDkbM' },
//             { label: 'Trailer name', kind: 'text', defaultValue: 'Official Trailer' },
//             { label: 'Additional key', kind: 'text', placeholder: 'Optional second video key' },
//             { label: 'Additional name', kind: 'text', placeholder: 'Optional second video name' },
//           ]}
//           actionLabel="Save trailers"
//         />
//         <FormSection
//           title="Trailer Metadata"
//           eyebrow="meta_Data"
//           icon={LinkIcon}
//           fields={[
//             { label: 'Date', kind: 'date', defaultValue: '2026-04-14' },
//             { label: 'Media ID', kind: 'number', defaultValue: 1290417 },
//             { label: 'Type', kind: 'select', options: ['movie', 'tv'], defaultValue: 'movie' },
//           ]}
//           actionLabel="Attach media"
//         />
//       </FormDeck>
//     )
//   }

//   if (routeId === 'edit') {
//     return (
//       <FormDeck>
//         <FormSection
//           title="Edit Mini Series"
//           eyebrow="rename trailer"
//           icon={Edit3}
//           fields={[
//             { label: 'Trailer', kind: 'select', options: miniSeriesRows.map((row) => `${row.id} - ${row.title}`) },
//             { label: 'Name', kind: 'text', defaultValue: 'Official Trailer' },
//             { label: 'YouTube key', kind: 'text', defaultValue: 'hzyOsNyDkbM' },
//           ]}
//           actionLabel="Save trailer"
//         />
//         <ActionPanel
//           title="Video controls"
//           icon={Trash2}
//           body="Remove one uploaded video key from this mini series without deleting the linked movie or TV media."
//           actionLabel="Remove video"
//         />
//       </FormDeck>
//     )
//   }

//   return (
//     <MediaList
//       title="Mini Series"
//       description="Showing 20 trailer rows with image, trailer name and linked media name."
//       rows={() => movieRows()}
//       onEdit={() => onRouteChange('edit')}
//     />
//   )
// }

function ProfileWorkspace({ routeId, wallet, setWallet, payout, setPayout, media, views, followers, miniSeries, miniSeriesPerson  }: { routeId: string, wallet: number, setWallet: Dispatch<SetStateAction<number>>, payout: Payout, setPayout: Dispatch<SetStateAction<Payout>>, media:number, views:number, followers:number, miniSeries:number, miniSeriesPerson:number }) {
  const [name, setName] = useState(null)
  const [image, setImage] = useState<null | String>(null)

  const imageRef = useRef<any>(null)

  useEffect(() => {
    (async() => {
      const res = await fetch(
        `${
          import.meta.env.VITE_ENVIRONMENT === 'development'
            ? import.meta.env.VITE_DESCRIPTION
            : import.meta.env.VITE_DESCRIPTION_LIVE
        }`,
        {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': import.meta.env.VITE_API_KEY,
          },
        },
      )

      const { status, data, message } = await res.json()
      // console.log(message,"message")

      if(status){
        setName(data?.name)
        const extra = JSON.parse(data.platform)
        if(extra.hasOwnProperty("image")){
          
          const res = await fetch(
            `${
              import.meta.env.VITE_ENVIRONMENT === 'development'
                ? import.meta.env.VITE_IMAGE
                : import.meta.env.VITE_IMAGE_LIVE
            }`,
            {
              method: 'GET',
              credentials: 'include',
              headers: {
                'x-api-key': import.meta.env.VITE_API_KEY,
              },
            },
          )
          const blob = await res.blob()
          setImage(() => URL.createObjectURL(blob))
        }
      }
    })()
  },[])

  const uploadImage = () => {
    imageRef.current.click()
  }

  const handleImage = async(e:any) => {
    // console.log("uploading image")
    // console.log(e,"image")
    const file = e.target.files[0];

    if(!file){
      toast.error("image error. Try again")
      return
    }
    const formData = new FormData();
    formData.append("image", file);

    if(!formData.has("image")){
      toast.error("Image error. Try again")
      return
    }

    try{
      const res = await fetch(
        `${
          import.meta.env.VITE_ENVIRONMENT === 'development'
            ? import.meta.env.VITE_UPLOAD_IMAGE
            : import.meta.env.VITE_UPLOAD_IMAGE_LIVE
        }`,
        {
          method: 'POST',
          credentials: 'include',
          headers: {
            // 'Content-Type': 'application/json',
            'x-api-key': import.meta.env.VITE_API_KEY,
          },
          body:formData
        },

      )

      const {status, message, error} = await res.json()

      if(status){
        toast.success(message)
        return
      }
      toast.error(error)
    }catch(error){
      console.log(error,"error")
      toast.error("error")
    }
  }

  if (routeId === 'monetization') {
    const monetized =
      media >= MONETIZATION.media &&
      views >= MONETIZATION.views &&
      followers >= MONETIZATION.followers &&
      miniSeries > MONETIZATION.mini_series

    return (
      <section className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <div className="rounded-lg border border-white/10 bg-white/[0.035] p-5">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-md border border-teal-300/20 bg-teal-300/10 text-teal-200">
              <BadgeDollarSign className="size-5" />
            </span>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-clay-400">Viewer credit</p>
              <h2 className="text-lg font-semibold text-white">How the studio earns</h2>
            </div>
          </div>
          <div className="mt-5 grid gap-3">
            {/* rates live in movies/back-end/user/credits/earnings.js; earned = this studio's wallet rows by source */}
            {[
              ['paid', 'Subscription views', 'KES 2 per view paid with bought credits'],
              ['ad', 'Google ad credit', 'KES 200 per 1,000 ad views behind a view'],
              ['ukoshop', 'UKOshop ad credit', 'KES 200 per 1,000 ad views behind a view'],
              ['free', 'Free credit', 'KES 0 - signup and monthly credits'],
            ].map(([key, label, value]) => (
              <div key={key} className="flex items-center justify-between gap-3 border-b border-white/10 pb-3 last:border-b-0 last:pb-0">
                <span>
                  <span className="block text-sm font-medium text-sand-100/70">{label}</span>
                  <span className="block text-xs text-sand-100/42">{value}</span>
                </span>
                <span className="text-right text-sm font-semibold text-white">
                  KES {payout.earnings?.[key]?.amount ?? 0}
                  <span className="block text-xs font-normal text-sand-100/42">{payout.earnings?.[key]?.views ?? 0} views</span>
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-white/10 bg-white/[0.035] p-5">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-md border border-clay-300/25 bg-clay-500/15 text-clay-200">
              <CheckCircle2 className="size-5" />
            </span>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-clay-400">Qualification</p>
              <h2 className="text-lg font-semibold text-white">Monetization status</h2>
            </div>
          </div>
          <div className="mt-5 space-y-3">
            <QualificationRow
              label={`${MONETIZATION.media} media uploaded`}
              value={`${media} uploaded`}
              complete={media >= MONETIZATION.media}
            />
            <QualificationRow
              label={`${MONETIZATION.views.toLocaleString()} total views`}
              value={`${views.toLocaleString()} views`}
              complete={views >= MONETIZATION.views}
            />
            <QualificationRow
              label={`${MONETIZATION.followers} followers`}
              value={`${followers} followers`}
              complete={followers >= MONETIZATION.followers}
            />
            <QualificationRow
              label={`More than ${MONETIZATION.mini_series} mini series uploaded`}
              value={`${miniSeries} uploaded`}
              complete={miniSeries > MONETIZATION.mini_series}
            />
          </div>
          {miniSeriesPerson > 0 ? (
            <p className="mt-3 text-xs text-sand-100/42">
              {miniSeries - miniSeriesPerson} uploaded by this studio, {miniSeriesPerson} contributed by people
              who tagged it on their own reel.
            </p>
          ) : null}
          <p className="mt-4 text-xs text-sand-100/42">
            {monetized
              ? 'Monetization is on. Credit accrues on every view and the wallet can be withdrawn to M-PESA.'
              : 'Monetization turns on by itself once every rule above passes - there is no deposit or activation fee. Until then credit does not accrue and the wallet cannot be withdrawn.'}
          </p>
        </div>

        <div className="rounded-lg border border-white/10 bg-white/[0.035] p-5 xl:col-span-2">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-clay-400">Studio packages</p>
              <h2 className="text-lg font-semibold text-white">Available creator plans</h2>
              <p className="mt-1 text-xs text-sand-100/42">Optional promotion. Monetization never needs a package.</p>
            </div>
            {/* <button type="button" className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-white/10 px-3 text-sm text-white hover:bg-white/[0.06]">
              <Plus className="size-4" />
              Add package
            </button> */}
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            {['Starter Upload', 'Premiere Boost', 'Celebrity Shelf'].map((name, index) => (
              <article key={index} className="rounded-lg border border-white/10 bg-[#111317] p-4">
                <p className="text-sm font-semibold text-white">{name}</p>
                <p className="mt-1 text-xs text-sand-100/42">
                  {index === 0 ? 'top 20 media slots in specific region' : index === 1 ? 'Priority trailer placement in specific region' : 'Top 20 Celebrities per Region'}
                </p>
                <p className="mt-4 text-xl font-semibold text-teal-200">KES {index === 0 ? '10/24 hours' : index === 1 ? '5/24 hours' : '30/24 hours'}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    )
  }


  return (
    <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
      <div className="rounded-lg border border-white/10 bg-white/[0.035] p-5">
        <div className="flex flex-col gap-5 sm:flex-row">
          <img src={image ? image as any : "/home.png"} alt="https://uko-app.co.ke" className="h-36 w-full rounded-lg object-cover sm:w-44" />
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-clay-400">Studio profile</p>
            <h2 className="mt-1 text-2xl font-semibold text-white">{name}</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              <input type="file" ref={imageRef} hidden onChange={handleImage} className='hidden'/>
              <button type="button" onClick={uploadImage} className="inline-flex h-9 items-center gap-2 rounded-md bg-clay-500 px-3 text-sm font-bold text-white hover:bg-clay-400">
                <Upload className="size-4"/>
                Edit image
              </button>
              <button type="button" className="inline-flex h-9 items-center gap-2 rounded-md border border-white/10 px-3 text-sm text-white hover:bg-white/[0.06]">
                <Save className="size-4" />
                Save account
              </button>
            </div>
          </div>
        </div>
      </div>

      <WithdrawCard wallet={wallet} setWallet={setWallet} payout={payout} setPayout={setPayout} />
    </section>
  )
}

function FilterBar({
  selectedTv,
  setSelectedTv,
  selectedSeason,
  setSelectedSeason,
  allTv,
  setAllTv,
  allSeasons,
  setAllSeasons
}: {
  selectedTv: any
  setSelectedTv: Dispatch<SetStateAction<string>>
  selectedSeason?: any
  setSelectedSeason?: Dispatch<SetStateAction<string>>
  allTv:any,
  setAllTv:Dispatch<SetStateAction<any>>,
  allSeasons?:any,
  setAllSeasons?:Dispatch<SetStateAction<any>>
}) {
  // console.log(selectedSeason,"selected season",selectedTv,"selected tv",setAllSeasons)
  return (
    <section className="grid gap-3 rounded-lg border border-white/10 bg-white/[0.035] p-4 md:grid-cols-2">
      <SelectControl label="TV show" value={selectedTv} options={allTv} setOptions={setAllTv} onChange={setSelectedTv} />
      {selectedSeason && setSelectedSeason && setAllSeasons && allSeasons ? (
        <SelectControl label="Season" value={selectedSeason} options={allSeasons} setOptions={setAllSeasons} onChange={setSelectedSeason} />
      ) : null}
    </section>
  )
}

const customStyles = {
  control: (provided: any) => ({
    ...provided,
    color: "black",
  }),
  singleValue: (provided: any) => ({
    ...provided,
    color: "black",
  }),
  multiValueLabel: (provided: any) => ({
    ...provided,
    color: "black",
  }),
  option: (provided: any, state: any) => ({
    ...provided,
    color: "black",
    backgroundColor: state.isFocused ? "#eee" : "white",
  }),
  input: (provided: any) => ({
    ...provided,
    color: "black",
  }),
  placeholder: (provided: any) => ({
    ...provided,
    color: "black",
  }),
};

function SelectControl({
  label,
  value,
  options,
  onChange,
  setOptions,
}: {
  label: string
  value: any
  options: string[]
  onChange: Dispatch<SetStateAction<string>>
  setOptions:Dispatch<SetStateAction<any>>
}) {
  // console.log(value,"value")
  const handleInputChange = (search_value:string) => {
    if(!search_value)
      return

    if(label === "TV show"){
      async function runSearch(){
        const res = await fetch(`${import.meta.env.VITE_ENVIRONMENT === "development" ? import.meta.env.VITE_FETCH_TV_SEARCH: import.meta.env.VITE_FETCH_TV_SEARCH_LIVE}`,{
          method:"POST",
          credentials: "include",
          headers: {
            'Content-Type': 'application/json', // Indicates the body is JSON
            'x-api-key':import.meta.env.VITE_API_KEY
          },
          body:JSON.stringify({
            value:search_value
          })
        }); 

        const {status, message, data} = await res.json() 
        // console.log(status,data)
        if(status && data && data.length > 0){
          const movieData = data.map(({data,id}:{data:any,id:number}) => ({tv_id:id,...JSON.parse(data)})).map(({name,tv_id}:{name:string,tv_id:number}) => ({value:tv_id,label:name}))
          setOptions((prev:any) => {
            return [
              ...prev,
              ...movieData
            ]
          })
        }
      }
      
      runSearch()   
    }else if(label === "Season"){
      async function runSearch(){
        const res = await fetch(`${import.meta.env.VITE_ENVIRONMENT === "development" ? import.meta.env.VITE_FETCH_SEASON_SEARCH: import.meta.env.VITE_FETCH_SEASON_SEARCH_LIVE}`,{
          method:"POST",
          credentials: "include",
          headers: {
            'Content-Type': 'application/json', // Indicates the body is JSON
            'x-api-key':import.meta.env.VITE_API_KEY
          },
          body:JSON.stringify({
            value:search_value,
            // tv:value
          })
        }); 

        const {status, message, data} = await res.json() 
        if(status && data && data.length > 0){
          const seasonData = data.map(({data,id}:{data:any,id:number}) => ({season_id:id,...JSON.parse(data)})).map(({name,season_id}:{name:string,season_id:number}) => ({value:season_id,label:name}))
          setOptions((prev:any) => {
            return [
              ...prev,
              ...seasonData
            ]
          })
        }
      }
      
      runSearch()      
    }

  }
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase tracking-[0.14em] text-sand-100/45">{label}</span>
      {/* <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 h-10 w-full rounded-md border border-white/10 bg-[#111317] px-3 text-sm text-white outline-none focus:border-teal-300/50 focus:ring-2 focus:ring-teal-300/10"
      >
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select> */}
      <Select
        isMulti={false}
        styles={customStyles}
        isSearchable ={true}
        defaultValue={value}
        onInputChange={handleInputChange}
        onChange={(value:any) => {
          // if(upload === "details" || upload === "edit-details"){
          //   setForm((prev) => {
          //     if(field.title === "genre")
          //       prev.genre_ids = value.map((item:any) => item.value);
          //     else if(field.title === "language"){
          //       prev.original_language = value.value
          //     }else if(field.title === "region"){
          //       prev.region = value.value
          //     }
          //     return ({...prev})
          //   })
          // }
          // console.log("set id: " + value.value)
          // if(label === "TV show"){
          //   onChange(value.value)
          // }else if(label === "Season"){
            
          // }
          onChange(value)
          

        }}
        options={options as any}
      />
    </label>
  )
}


const POSTER = ({image}:{image:string}) => {
  const [poster, setPoster] = useState<string | null>(null)
  // console.log(image, "poster image")
  useEffect(() => {
    (async() => {
      const res = await fetch(
        `${
          import.meta.env.VITE_ENVIRONMENT === 'development'
            ? import.meta.env.VITE_POSTER
            : import.meta.env.VITE_POSTER_LIVE
        }`,
        {
          method: 'POST',
          credentials: 'include',
          headers: {
            'x-api-key': import.meta.env.VITE_API_KEY,
            'Content-Type': 'application/json',
          },
          body:JSON.stringify({
            image
          })
        },
      )
      const blob = await res.blob()
      setPoster(URL.createObjectURL(blob))
    })()
  },[])

  return (
    <>
    {
      poster && (
        <img src={poster ? poster as any : "/home.png"} alt={"uko-app.co.ke"} className="h-24 w-max rounded-md object-cover ring-1 ring-white/10" />
      )
    }
    </>
  )
}
function MediaList({
  title,
  description,
  rows,
  onEdit,
  verifyPerson
}: {
  title: string
  description: string
  rows: () => Promise<MediaRow[]>
  onEdit: (data:any) => void
  verifyPerson?: (id:number) => void
}) {

  const [newRow, setNewRow] = useState<any>(null)
  const [allRow, setAllRow] = useState<number>(0)
  const [page, setPage] = useState<number>(1)
  
  useEffect(() => {
    (async() => {
      const oldRow = await rows()

      // console.log(oldRow, "old rows")
      if(oldRow && oldRow.length){
        setNewRow(oldRow)
        setAllRow(oldRow[0].total)
        // setNewRow(oldRow.filter((_,index) => index < 21))
      }else{
        // setAllRow(null)
        setNewRow(null)        
      }

    })()
  },[rows])

  const changePage = (page:number) => {
    // console.log(page,"new page")
    setPage(page)
    if(title === "All Movies"){
      setNewRow(() => movieRows(page))
    }else if(title === "All TV"){
      setNewRow(() => tvRows(page))
    }else if(title === "All Persons"){
      setNewRow(() => personRows(page))
    }else if(title === "Seasons"){
      setNewRow(() => seasonRows(newRow[0].tvID,page))
    }else if(title === "Episodes"){
      setNewRow(() => episodeRows(newRow[0].seasonID,page))
    }
    // const first_row = (page * 20) - 20
    // const last_row = (page * 20)

    // setNewRow(allRow.filter((_:null,index:number) => index >= first_row && index < last_row))
  }


  // const verifyPerson = (id:number) => {

  // }

  return (
    <section className="rounded-lg border border-white/10 bg-white/[0.035]">
      <div className="flex flex-col gap-3 border-b border-white/10 p-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-clay-400">20 list pagination</p>
          <h2 className="mt-1 text-lg font-semibold text-white">{title}</h2>
          <p className="mt-1 text-sm text-sand-100/50">{description}</p>
        </div>
        <PaginationBar total_pages={Math.ceil(allRow && allRow/20)} page={page} changePage={changePage} />
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[780px] divide-y divide-white/10">
          {newRow && newRow.map((row:any,index:number) => (
            <article
              key={index}
              className="flex flex-wrap items-center gap-4 px-4 py-3 transition hover:bg-white/[0.035]"
            >
              <div className="w-[100px]">
                <POSTER image={row?.image}/>
              </div>
              
              <div className="w-[100px]">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-md border border-teal-300/20 bg-teal-300/10 px-2 py-1 text-[11px] font-bold uppercase tracking-[0.1em] text-teal-100">
                    {row.badge}
                  </span>
                  <span className="text-xs text-sand-100/38">ID {row.id}</span>
                </div>
                <h3 className="mt-2 truncate text-sm font-semibold text-white">{row?.title || row?.name}</h3>
                {row.mediaName ? <p className="mt-1 truncate text-xs text-clay-300">{row.mediaName}</p> : null}
                <p className="mt-1 truncate text-xs text-sand-100/42">{row.detail}</p>
              </div>
              {
                title === "All Persons" && (
                  <div className="w-[100px] p-0">
                      {
                        row?.verification 
                        ?
                          <span className="rounded-md border border-teal-300/20 bg-teal-300/10 px-2 py-1 text-[11px] font-bold uppercase tracking-[0.1em] text-teal-100">
                            verified
                          </span>
                        :
                        
                        verifyPerson && (
                          <button
                            type="button"
                            onClick={() => verifyPerson(row?.person_id)}
                            className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-white/10 px-3 text-sm font-semibold text-white hover:bg-white/[0.06]"
                          >
                            verify
                          </button>
                        )
                    
                      }
                    
                  </div>
                )
              }
              <label className="w-[300px]">
                <LinkIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-sand-100/35" />
                <input
                  readOnly
                  value={row.share}
                  className="h-10 w-full rounded-md border border-white/10 bg-[#111317] pl-10 pr-11 text-xs text-sand-100/70 outline-none"
                />
                <button
                  type="button"
                  title="Copy share link"
                  className="absolute right-1 top-1 grid size-8 place-items-center rounded-md text-sand-100/55 hover:bg-white/[0.06] hover:text-white"
                >
                  <Copy className="size-4" />
                </button>
              </label>
              {
                <button
                  type="button"
                  onClick={() => title === "All Persons" ? onEdit(row) : onEdit({...row,name:row?.mediaName})}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-white/10 px-3 text-sm font-semibold text-white hover:bg-white/[0.06]"
                >
                  <Edit3 className="size-4" />
                  Edit
                </button>
              
              }

            </article>
          )) || <p>
            {
              title === "Seasons" 
              ?
              "SELECT TV SHOW"
              :
              "No Data"
            }
            </p>
          }
        </div>
      </div>
    </section>
  )
}

function PaginationBar({
  total_pages,
  page,
  changePage
}:{
  total_pages:number,
  page:number,
  changePage: (page:number) => void
}) {

  const setPage = (path:boolean) => {
    if(path){
      if(page < total_pages){
        const new_page = page + 1
        changePage(new_page)        
      }
    }else{
      if(page > 1){
        const new_page = page - 1
        changePage(new_page)
      }
    }
  }
  return (
    <div className="flex items-center gap-2">
      <button type="button"
       onClick={() => setPage(false)}
       title="Previous page" className="grid size-9 place-items-center rounded-md border border-white/10 text-sand-100/60 hover:bg-white/[0.06] hover:text-white">
        <ChevronLeft className="size-4" />
      </button>
      <span className="rounded-md border border-white/10 bg-[#111317] px-3 py-2 text-xs font-semibold text-white">{page} / {total_pages}</span>
      <button type="button"
       onClick={() => setPage(true)}
       title="Next page" className="grid size-9 place-items-center rounded-md border border-white/10 text-sand-100/60 hover:bg-white/[0.06] hover:text-white">
        <ChevronRight className="size-4" />
      </button>
    </div>
  )
}

function FormDeck({ children }: { children: ReactNode }) {
  return <section className="grid gap-4 xl:grid-cols-3">{children}</section>
}

function FormSection({
  title,
  eyebrow,
  onRouteChange,
  icon: Icon,
  fields,
  actionLabel,
  upload,
  client,
  selectedTv,
  selectedSeason,
  setGenreFields,
  setDepartmentFields,
  setLanguageFields
}: {
  title: string
  eyebrow: string
  onRouteChange?:Dispatch<SetStateAction<string>>
  icon: LucideIcon
  fields: FieldConfig[]
  actionLabel: string
  upload: string
  client?:number
  // code?:string
  selectedTv?:any
  selectedSeason?:any
  setGenreFields?:Dispatch<SetStateAction<GenreFormSchema[] | null>>,
  setDepartmentFields?:Dispatch<SetStateAction<DepartmentFormSchema[] | null>>
  setLanguageFields?:Dispatch<SetStateAction<LanguageFormSchema[] | null>>
}) {

  // const router = useRouter();
  const fieldFound = fields.find(field => field.title === "adult" && field.checked)
  const overviewFound = fields.find(field => field.title === "overview" && field.defaultValue)
  const titleFound = fields.find(field => field.title === "title" && field.defaultValue)
  const genreFound = fields.find(field => field.title === "genre" && field.defaultValues)
  const dateFound = fields.find(field => field.title === "release_date" && field.defaultValue)
  const originalTitleFound = fields.find(field => field.title === "original_title" && field.defaultValue)
  const originalLanguageFound = fields.find(field => field.title === "language" && field.defaultValue)
  const regionFound = fields.find(field => field.title === "region" && field.defaultValue)

  const [genreForm, setGenreForm] = useState<GenreFormSchema>({
    name:"",
    mode:""
  })

  const [departmentForm, setDepartmentForm] = useState<DepartmentFormSchema>({
    label:""
  })

  const [languageForm, setLanguageForm] = useState<LanguageFormSchema>({
    name:"",
    english_name:"",
    iso_639_1:""
  })

  
  // console.log(genreForm,"genre form")
  const [form, setForm] = useState<FormSchema>({
    adult:fieldFound && fieldFound.checked || false,
    overview:overviewFound && overviewFound.defaultValue || "",
    title:titleFound && titleFound.defaultValue || "",
    genre_ids:genreFound && genreFound.defaultValues || [],
    release_date:dateFound && dateFound.defaultValue || "",
    original_title:originalTitleFound && originalTitleFound.defaultValue || "",
    original_language:originalLanguageFound && originalLanguageFound.defaultValue || "",
    region:regionFound && regionFound.defaultValue || ""
  })

  const nameFound = fields.find(field => field.title === "name" && field.defaultValue)
  const originalNameFound = fields.find(field => field.title === "original_name" && field.defaultValue)
  const nickNameFound = fields.find(field => field.title === "name" && field.defaultValue)
  const emailFound = fields.find(field => field.title === "email" && field.defaultValue)
  const telephoneFound = fields.find(field => field.title === "telephone" && field.defaultValue)
  const nationalIDFound = fields.find(field => field.title === "national_id" && field.defaultValue)
  const biographyFound = fields.find(field => field.title === "biography" && field.defaultValue)
  const birthDateFound = fields.find(field => field.title === "birth_date" && field.defaultValue)
  const deathDateFound = fields.find(field => field.title === "death_date" && field.defaultValue)
  const genderFound = fields.find(field => field.title === "gender" && field.defaultValue)
  const departmentFound = fields.find(field => field.title === "department" && field.defaultValues)

  // console.log(departmentFound,"found")
  const [castForm, setCastForm] = useState<CastFormSchema>({
    original_name:originalNameFound && originalNameFound.defaultValue || "",
    name:nickNameFound && nickNameFound.defaultValue || "",
    email:emailFound && emailFound.defaultValue || "",
    telephone:telephoneFound && telephoneFound.defaultValue || "",
    national_id:nationalIDFound && nationalIDFound.defaultValue || 0,
    biography:biographyFound && biographyFound.defaultValue || "",
    birth_date:birthDateFound && birthDateFound.defaultValue || "",
    death_date:deathDateFound && deathDateFound.defaultValue || "",
    gender:genderFound && genderFound.defaultValue || 0,
    department:departmentFound && departmentFound.defaultValues || []
  })
  
  const [personForm, setPersonForm] = useState<PersonFormSchema>({
    title:0,
    name:0,
    person:0,
    character:"",
    department:[]
  })
  // const fieldFound = fields.find(field => field.title === "adult" && field.checked)
  // const overviewFound = fields.find(field => field.title === "overview" && field.defaultValue)
  
  // const genreFound = fields.find(field => field.title === "genre" && field.defaultValues)
  const firstDateFound = fields.find(field => field.title === "date" && field.defaultValue)
  // const originalNameFound = fields.find(field => field.title === "original_name" && field.defaultValue)
  // const originalLanguageFound = fields.find(field => field.title === "original_language" && field.defaultValue)
  // const regionFound = fields.find(field => field.title === "region" && field.defaultValue)

  const [tvForm, setTvForm] = useState<TvFormSchema>({
    tv_adult:fieldFound && fieldFound.checked || false,
    overview:overviewFound && overviewFound.defaultValue || "",
    name:nameFound && nameFound.defaultValue || "",
    genre_ids:genreFound && genreFound.defaultValues || [],
    date:firstDateFound && firstDateFound.defaultValue || "",
    original_name:originalNameFound && originalNameFound.defaultValue || "",
    original_language:originalLanguageFound && originalLanguageFound.defaultValue || "",
    region:regionFound && regionFound.defaultValue || ""
  })

  const episodeFound = fields.find(field => field.title === "episode_count" && field.defaultValue)
  const seasonFound = fields.find(field => field.title === "season" && field.defaultValue)

  // console.log("uploading...", selectedTv)
  const [seasonForm, setSeasonForm] = useState<SeasonFormSchema>({
    name:nameFound && nameFound.defaultValue || "",
    overview:overviewFound && overviewFound.defaultValue || "",
    date:firstDateFound && firstDateFound.defaultValue || "",
    episode_count:episodeFound && episodeFound.defaultValue || 0,
    season_number:seasonFound && seasonFound.defaultValue || -1,
    tvID:selectedTv?.value || 0
  })

  const episodeNumberFound = fields.find(field => field.title === "episode_number" && field.defaultValue)
  const episodeTypeFound = fields.find(field => field.title === "episode_type" && field.defaultValue)
  const runtimeFound = fields.find(field => field.title === "runtime" && field.defaultValue)

  // console.log(selectedSeason,"selected season")
  const [episodeForm, setEpisodeForm] = useState<EpisodeFormSchema>({
    name:nameFound && nameFound.defaultValue || "",
    overview:overviewFound && overviewFound.defaultValue || "",
    date:firstDateFound && firstDateFound.defaultValue || "",
    season_number:selectedSeason && selectedSeason?.label > -1 ? selectedSeason?.label : -1,
    episode_number:episodeNumberFound && episodeNumberFound.defaultValue || -1,
    episode_type:episodeTypeFound && episodeTypeFound.defaultValue || "",
    runtime:runtimeFound && runtimeFound.defaultValue || "",
    seasonID:selectedSeason && selectedSeason?.value > 0 && selectedSeason?.value|| 0,
    tvID:selectedTv?.value || 0
  })

  const [disbled,setDisabled] = useState<boolean>(false)

  // const [formData,setFormData] = useState<FormData>(new FormData())
  const formData = new FormData()

  const appendForms = (key:string,value:any) => {
    // console.log(key,value,"key value")
    formData.append(key,value)
    // console.log(formData.get(key),"form data")
  }

  const uploadDetails = async(e:any) => {
    try{
      e.preventDefault()
      setDisabled(true)
      if(upload === "details"){
        if(form.overview === ""){
          toast.error("Overview must be filled")
          setDisabled(false)
          return
        }else if(form.title === ""){
          toast.error("Title must be filled")
          setDisabled(false)
          return
        }else if(form.genre_ids && form.genre_ids.length === 0){
          toast.error("Genre must be filled")
          setDisabled(false)
          return
        }else if(form.release_date === ""){
          toast.error("Select release date")
          setDisabled(false)
          return
        }else if(form.original_title === ""){
          toast.error("Original Title must be filled")
          setDisabled(false)
          return
        }else if(form.original_language === ""){
          toast.error("Select Language")
          setDisabled(false)
          return
        }else if(form.region === ""){
          toast.error("Select Region")
          setDisabled(false)
          return
        }
        const res = await fetch(`${import.meta.env.VITE_ENVIRONMENT === "development" ? import.meta.env.VITE_MOVIE_DETAILS: import.meta.env.VITE_MOVIE_DETAILS_LIVE}`,{
          method:"POST",
          credentials: "include",
          headers: {
            'Content-Type': 'application/json', // Indicates the body is JSON
            'x-api-key':import.meta.env.VITE_API_KEY
          },
          body:JSON.stringify({
            ...form
          })
        }); 

        const {status, message, error} = await res.json()  
        
        // console.log(status,"status")
        setDisabled(false)
        if(status){
          toast.success(message)
          setTimeout(() => {              
            onRouteChange && onRouteChange('list')
          },1000)
        }else if(error){
          toast.error("could not upload. Try again later")
        }else{
          toast.error(message)
        }
      }else if(upload === "media"){
        if(!formData.has("mini_series") || !formData.has("trailor") || !formData.has("video") || !formData.has("backdrop_path") || !formData.has("poster_path") || !formData.has("logo")){
          toast.error("Upload all fields")
          setDisabled(false)
          return
        }
        
        // console.log(formData.entries(),"form data")
        if(!formData.has("id")){
          toast.error("select movie title")
          setDisabled(false)
          return
        }

        const res = await fetch(`${import.meta.env.VITE_ENVIRONMENT === "development" ? import.meta.env.VITE_MOVIE_MEDIA: import.meta.env.VITE_MOVIE_MEDIA_LIVE}`,{
          method:"POST",
          credentials: "include",
          headers: {
            // 'Content-Type': 'application/json', // Indicates the body is JSON
            'x-api-key':import.meta.env.VITE_API_KEY
          },
          body:formData
        });  
        
        const {status, message, error} = await res.json()

        setDisabled(false)
        if(status){
          toast.success(message)
        }else if(error){
          toast.error("could not upload. Try again later")
        }else{
          toast.error(message)
        }
      }else if(upload === "person"){
        // console.log("invlove person...",personForm)
        if(personForm.title === 0){
          toast.error("Title must be selected")
          setDisabled(false)
          return
        }else if(personForm.person === 0){
          toast.error("Person must be selected")
          setDisabled(false)
          return
        }else if(personForm.character === ""){
          toast.error("Character Must Be Filled")
          setDisabled(false)
          return
        }else if(personForm.department && personForm.department.length === 0){
          toast.error("Department must be selected")
          setDisabled(false)
          return
        }

        const res = await fetch(`${import.meta.env.VITE_ENVIRONMENT === "development" ? import.meta.env.VITE_MOVIE_CAST: import.meta.env.VITE_MOVIE_CAST_LIVE}`,{
          method:"POST",
          credentials: "include",
          headers: {
            'Content-Type': 'application/json', // Indicates the body is JSON
            'x-api-key':import.meta.env.VITE_API_KEY
          },
          body:JSON.stringify({
            ...personForm
          })
        }); 

        const {status, message, error} = await res.json()  
        
        // console.log(status,"status")
        setDisabled(false)
        if(status){
          toast.success(message)
        }else if(error){
          toast.error("could not upload. Try again later")
        }else{
          toast.error(message)
        }        
      }else if(upload === "edit-details"){
        // console.log("editing...")
        const res = await fetch(`${import.meta.env.VITE_ENVIRONMENT === "development" ? import.meta.env.VITE_MOVIE_DETAILS_UPDATE: import.meta.env.VITE_MOVIE_DETAILS_UPDATE_LIVE}`,{
          method:"POST",
          credentials: "include",
          headers: {
            'Content-Type': 'application/json', // Indicates the body is JSON
            'x-api-key':import.meta.env.VITE_API_KEY
          },
          body:JSON.stringify({
            ...form,
            movie_id:client
          })
        }); 

        const {status, message, error} = await res.json()  
        
        // console.log(status,"status")
        setDisabled(false)
        if(status){
          toast.success(message)
        }else if(error){
          toast.error("could not edit. Try again later")
        }else{
          toast.error(message)
        }
      }else if(upload === "edit-media"){
        formData.append("id",String(client))

        const res = await fetch(`${import.meta.env.VITE_ENVIRONMENT === "development" ? import.meta.env.VITE_MOVIE_MEDIA_UPDATE: import.meta.env.VITE_MOVIE_MEDIA_UPDATE_LIVE}`,{
          method:"POST",
          credentials: "include",
          headers: {
            // 'Content-Type': 'application/json', // Indicates the body is JSON
            'x-api-key':import.meta.env.VITE_API_KEY
          },
          body:formData
        });  
        
        const {status, message, error} = await res.json()
        setDisabled(false)

        if(status){
          toast.success(message)
        }else if(error){
          toast.error("could not edit. Try again later")
        }else{
          toast.error(message)
        }        
      }else if(upload === "tv-details"){
        if(tvForm.overview === ""){
          toast.error("Overview must be filled")
          setDisabled(false)
          return
        }else if(tvForm.name === ""){
          toast.error("Name must be filled")
          setDisabled(false)
          return
        }else if(tvForm.genre_ids && tvForm.genre_ids.length === 0){
          toast.error("Genre must be filled")
          setDisabled(false)
          return
        }else if(tvForm.date === ""){
          toast.error("Select release date")
          setDisabled(false)
          return
        }else if(tvForm.original_name === ""){
          toast.error("Original Title must be filled")
          setDisabled(false)
          return
        }else if(tvForm.original_language === ""){
          toast.error("Select Language")
          return
        }else if(tvForm.region === ""){
          toast.error("Select Region")
          setDisabled(false)
          return
        }
        const res = await fetch(`${import.meta.env.VITE_ENVIRONMENT === "development" ? import.meta.env.VITE_TV_DETAILS: import.meta.env.VITE_TV_DETAILS_LIVE}`,{
          method:"POST",
          credentials: "include",
          headers: {
            'Content-Type': 'application/json', // Indicates the body is JSON
            'x-api-key':import.meta.env.VITE_API_KEY
          },
          body:JSON.stringify({
            ...tvForm,
            first_air_date:tvForm.date,
            adult:tvForm.tv_adult

          })
        }); 

        const {status, message, error} = await res.json()  
        
        setDisabled(false)
        if(status){
          toast.success(message)
          // console.log("reloading")
          setTimeout(() => {              
            onRouteChange && onRouteChange('list')
            // router.invalidate({ to: '/studio/dashboard' } as any);
          },1000)
        }else if(error){
          toast.error("could not upload. Try again later")
        }else{
          toast.error(message)
        }
      }else if(upload === "tv-person"){
        // console.log(personForm, "form of person")
        if(personForm.title === 0){
          toast.error("Title must be selected")
          setDisabled(false)
          return
        }else if(personForm.person === 0){
          toast.error("Person must be selected")
          setDisabled(false)
          return
        }else if(personForm.character === ""){
          toast.error("Character Must Be Filled")
          setDisabled(false)
          return
        }else if(personForm.department && personForm.department.length === 0){
          toast.error("Department must be selected")
          setDisabled(false)
          return
        }

        const res = await fetch(`${import.meta.env.VITE_ENVIRONMENT === "development" ? import.meta.env.VITE_TV_CAST: import.meta.env.VITE_TV_CAST_LIVE}`,{
          method:"POST",
          credentials: "include",
          headers: {
            'Content-Type': 'application/json', // Indicates the body is JSON
            'x-api-key':import.meta.env.VITE_API_KEY
          },
          body:JSON.stringify({
            ...personForm
          })
        }); 

        const {status, message, error} = await res.json()  
        
        setDisabled(false)
        if(status){
          toast.success(message)
        }else if(error){
          toast.error("could not upload. Try again later")
        }else{
          toast.error(message)
        }            
      }else if(upload === "tv-media"){
        if(!formData.has("trailor") || !formData.has("mini_series") || !formData.has("backdrop_path") || !formData.has("poster_path") || !formData.has("logo")){
          toast.error("Upload all fields")
          setDisabled(false)
          return
        }
        
        if(!formData.has("id")){
          toast.error("select tv title")
          setDisabled(false)
          return
        }

        const res = await fetch(`${import.meta.env.VITE_ENVIRONMENT === "development" ? import.meta.env.VITE_TV_MEDIA: import.meta.env.VITE_TV_MEDIA_LIVE}`,{
          method:"POST",
          credentials: "include",
          headers: {
            // 'Content-Type': 'application/json', // Indicates the body is JSON
            'x-api-key':import.meta.env.VITE_API_KEY
          },
          body:formData
        });  
        
        const {status, message, error} = await res.json()

        setDisabled(false)
        if(status){
          toast.success(message)
        }else if(error){
          toast.error("could not upload. Try again later")
        }else{
          toast.error(message)
        }        
      }else if(upload === "tv-edit-details"){
        // console.log(tvForm,"tvForm")
        const res = await fetch(`${import.meta.env.VITE_ENVIRONMENT === "development" ? import.meta.env.VITE_TV_DETAILS_UPDATE: import.meta.env.VITE_TV_DETAILS_UPDATE_LIVE}`,{
          method:"POST",
          credentials: "include",
          headers: {
            'Content-Type': 'application/json', // Indicates the body is JSON
            'x-api-key':import.meta.env.VITE_API_KEY
          },
          body:JSON.stringify({
            ...tvForm,
            movie_id:client,
            first_air_date:tvForm.date,
            adult:tvForm.tv_adult
          })
        }); 

        const {status, message, error} = await res.json()  
        
        setDisabled(false)
        if(status){
          toast.success(message)
        }else if(error){
          toast.error("could not edit. Try again later")
        }else{
          toast.error(message)
        }        
      }else if(upload === "tv-edit-media"){
        formData.append("id",String(client))

        const res = await fetch(`${import.meta.env.VITE_ENVIRONMENT === "development" ? import.meta.env.VITE_TV_MEDIA_UPDATE: import.meta.env.VITE_TV_MEDIA_UPDATE_LIVE}`,{
          method:"POST",
          credentials: "include",
          headers: {
            // 'Content-Type': 'application/json', // Indicates the body is JSON
            'x-api-key':import.meta.env.VITE_API_KEY
          },
          body:formData
        });  
        
        const {status, message, error} = await res.json()
        setDisabled(false)

        if(status){
          toast.success(message)
        }else if(error){
          toast.error("could not edit. Try again later")
        }else{
          toast.error(message)
        }           
      }else if(upload === "season-details"){
        if(seasonForm.overview === ""){
          toast.error("Overview must be filled")
          setDisabled(false)
          return
        }else if(seasonForm.name === ""){
          toast.error("Name must be filled")
          setDisabled(false)
          return
        }else if(seasonForm.date === ""){
          toast.error("Select release date")
          setDisabled(false)
          return
        }else if(seasonForm.episode_count === 0){
          toast.error("How many episode are available")
          setDisabled(false)
          return
        }else if(seasonForm.season_number === -1){
          toast.error("Select Season")
          setDisabled(false)
          return
        }else if(seasonForm.tvID === 0){
          toast.error("Select TV Title")
          setDisabled(false)
          return
        }
        const res = await fetch(`${import.meta.env.VITE_ENVIRONMENT === "development" ? import.meta.env.VITE_SEASON_DETAILS: import.meta.env.VITE_SEASON_DETAILS_LIVE}`,{
          method:"POST",
          credentials: "include",
          headers: {
            'Content-Type': 'application/json', // Indicates the body is JSON
            'x-api-key':import.meta.env.VITE_API_KEY
          },
          body:JSON.stringify({
            ...seasonForm,
            episode_count:Number(seasonForm.episode_count),
            season_number:Number(seasonForm.season_number)
          })
        }); 

        const {status, message, error} = await res.json()  
        
        setDisabled(false)
        if(status){
          toast.success(message)
          // console.log("reloading")
          setTimeout(() => {              
            onRouteChange && onRouteChange('list')
            // router.invalidate({ to: '/studio/dashboard' } as any);
          },1000)
        }else if(error){
          toast.error("could not upload. Try again later")
        }else{
          toast.error(message)
        }        
      }else if(upload === "season-person"){
        if(personForm.title === 0){
          toast.error("Title must be selected")
          setDisabled(false)
          return
        }else if(personForm.person === 0){
          toast.error("Person must be selected")
          setDisabled(false)
          return
        }else if(personForm.character === ""){
          toast.error("Character Must Be Filled")
          setDisabled(false)
          return
        }else if(personForm.department && personForm.department.length === 0){
          toast.error("Department must be selected")
          setDisabled(false)
          return
        }

        const res = await fetch(`${import.meta.env.VITE_ENVIRONMENT === "development" ? import.meta.env.VITE_SEASON_CAST: import.meta.env.VITE_SEASON_CAST_LIVE}`,{
          method:"POST",
          credentials: "include",
          headers: {
            'Content-Type': 'application/json', // Indicates the body is JSON
            'x-api-key':import.meta.env.VITE_API_KEY
          },
          body:JSON.stringify({
            ...personForm
          })
        }); 

        const {status, message, error} = await res.json()  
        
        setDisabled(false)
        if(status){
          toast.success(message)
        }else if(error){
          toast.error("could not upload. Try again later")
        }else{
          toast.error(message)
        } 
      }else if(upload === "season-media"){
        if(!formData.has("backdrop_path") || !formData.has("poster_path") || !formData.has("logo")){
          toast.error("Upload all fields")
          setDisabled(false)
          return
        }
        
        if(!formData.has("id")){
          toast.error("select season title")
          setDisabled(false)
          return
        }

        const res = await fetch(`${import.meta.env.VITE_ENVIRONMENT === "development" ? import.meta.env.VITE_SEASON_MEDIA: import.meta.env.VITE_SEASON_MEDIA_LIVE}`,{
          method:"POST",
          credentials: "include",
          headers: {
            // 'Content-Type': 'application/json', // Indicates the body is JSON
            'x-api-key':import.meta.env.VITE_API_KEY
          },
          body:formData
        });  
        
        const {status, message, error} = await res.json()

        setDisabled(false)
        if(status){
          toast.success(message)
        }else if(error){
          toast.error("could not upload. Try again later")
        }else{
          toast.error(message)
        }               
      }else if(upload === "season-edit-details"){
        const res = await fetch(`${import.meta.env.VITE_ENVIRONMENT === "development" ? import.meta.env.VITE_SEASON_DETAILS_UPDATE: import.meta.env.VITE_SEASON_DETAILS_UPDATE_LIVE}`,{
          method:"POST",
          credentials: "include",
          headers: {
            'Content-Type': 'application/json', // Indicates the body is JSON
            'x-api-key':import.meta.env.VITE_API_KEY
          },
          body:JSON.stringify({
            ...seasonForm,
            movie_id:client
          })
        }); 

        const {status, message, error} = await res.json()  
        
        setDisabled(false)
        if(status){
          toast.success(message)
        }else if(error){
          toast.error("could not edit. Try again later")
        }else{
          toast.error(message)
        }         
      }else if(upload === "season-edit-media"){
        formData.append("id",String(client))

        const res = await fetch(`${import.meta.env.VITE_ENVIRONMENT === "development" ? import.meta.env.VITE_SEASON_MEDIA_UPDATE: import.meta.env.VITE_SEASON_MEDIA_UPDATE_LIVE}`,{
          method:"POST",
          credentials: "include",
          headers: {
            // 'Content-Type': 'application/json', // Indicates the body is JSON
            'x-api-key':import.meta.env.VITE_API_KEY
          },
          body:formData
        });  
        
        const {status, message, error} = await res.json()
        setDisabled(false)

        if(status){
          toast.success(message)
        }else if(error){
          toast.error("could not edit. Try again later")
        }else{
          toast.error(message)
        }         
      }else if(upload === "episode-details"){
        // console.log(episodeForm,"episodeForm")
        if(episodeForm.overview === ""){
          toast.error("Overview must be filled")
          setDisabled(false)
          return
        }else if(episodeForm.name === ""){
          toast.error("Name must be filled")
          setDisabled(false)
          return
        }else if(episodeForm.date === ""){
          toast.error("Select release date")
          setDisabled(false)
          return
        }else if(episodeForm.episode_number === -1){
          toast.error("Insert Episode Nuber")
          setDisabled(false)
          return
        }else if(episodeForm.season_number === -1 || episodeForm.seasonID === -1){
          toast.error("Select Season")
          setDisabled(false)
          return
        }else if(episodeForm.tvID === 0){
          toast.error("Select Tv")
          setDisabled(false)
          return
        }else if(episodeForm.episode_type === ""){
          toast.error("Select Episode Type")
          setDisabled(false)
          return
        }else if(episodeForm.runtime === ""){
          toast.error("Insert Runtime")
          setDisabled(false)
          return
        }

        const res = await fetch(`${import.meta.env.VITE_ENVIRONMENT === "development" ? import.meta.env.VITE_EPISODE_DETAILS: import.meta.env.VITE_EPISODE_DETAILS_LIVE}`,{
          method:"POST",
          credentials: "include",
          headers: {
            'Content-Type': 'application/json', // Indicates the body is JSON
            'x-api-key':import.meta.env.VITE_API_KEY
          },
          body:JSON.stringify({
            ...episodeForm,
            episode_number:Number(episodeForm.episode_number),
            season_number:Number(episodeForm.season_number)
          })
        }); 

        const {status, message, error} = await res.json()  
        
        setDisabled(false)
        if(status){
          toast.success(message)
          setTimeout(() => {              
            onRouteChange && onRouteChange('list')
          },1000)
        }else if(error){
          toast.error("could not upload. Try again later")
        }else{
          toast.error(message)
        }        
      }else if(upload === "episode-person"){
        if(personForm.title === 0){
          toast.error("Title must be selected")
          setDisabled(false)
          return
        }else if(personForm.person === 0){
          toast.error("Person must be selected")
          setDisabled(false)
          return
        }else if(personForm.character === ""){
          toast.error("Character Must Be Filled")
          setDisabled(false)
          return
        }else if(personForm.department && personForm.department.length === 0){
          toast.error("Department must be selected")
          setDisabled(false)
          return
        }

        const res = await fetch(`${import.meta.env.VITE_ENVIRONMENT === "development" ? import.meta.env.VITE_EPISODE_CAST: import.meta.env.VITE_EPISODE_CAST_LIVE}`,{
          method:"POST",
          credentials: "include",
          headers: {
            'Content-Type': 'application/json', // Indicates the body is JSON
            'x-api-key':import.meta.env.VITE_API_KEY
          },
          body:JSON.stringify({
            ...personForm
          })
        }); 

        const {status, message, error} = await res.json()  
        
        setDisabled(false)
        if(status){
          toast.success(message)
        }else if(error){
          toast.error("could not upload. Try again later")
        }else{
          toast.error(message)
        } 
      }else if(upload === "episode-media"){
        if(!formData.has("video") || !formData.has("backdrop_path") || !formData.has("poster_path") || !formData.has("logo")){
          toast.error("Upload all fields")
          setDisabled(false)
          return
        }
        
        if(!formData.has("id")){
          toast.error("select episode title")
          setDisabled(false)
          return
        }

        const res = await fetch(`${import.meta.env.VITE_ENVIRONMENT === "development" ? import.meta.env.VITE_EPISODE_MEDIA: import.meta.env.VITE_EPISODE_MEDIA_LIVE}`,{
          method:"POST",
          credentials: "include",
          headers: {
            // 'Content-Type': 'application/json', // Indicates the body is JSON
            'x-api-key':import.meta.env.VITE_API_KEY
          },
          body:formData
        });  
        
        const {status, message, error} = await res.json()

        setDisabled(false)
        if(status){
          toast.success(message)
        }else if(error){
          toast.error("could not upload. Try again later")
        }else{
          toast.error(message)
        }               
      }else if(upload === "episode-edit-details"){
        const res = await fetch(`${import.meta.env.VITE_ENVIRONMENT === "development" ? import.meta.env.VITE_EPISODE_DETAILS_UPDATE: import.meta.env.VITE_EPISODE_DETAILS_UPDATE_LIVE}`,{
          method:"POST",
          credentials: "include",
          headers: {
            'Content-Type': 'application/json', // Indicates the body is JSON
            'x-api-key':import.meta.env.VITE_API_KEY
          },
          body:JSON.stringify({
            ...episodeForm,
            episode_id:client
          })
        }); 

        const {status, message, error} = await res.json()  
        
        setDisabled(false)
        if(status){
          toast.success(message)
        }else if(error){
          toast.error("could not edit. Try again later")
        }else{
          toast.error(message)
        }         
      }else if(upload === "episode-edit-media"){
        formData.append("id",String(client))

        const res = await fetch(`${import.meta.env.VITE_ENVIRONMENT === "development" ? import.meta.env.VITE_EPISODE_MEDIA_UPDATE: import.meta.env.VITE_EPISODE_MEDIA_UPDATE_LIVE}`,{
          method:"POST",
          credentials: "include",
          headers: {
            // 'Content-Type': 'application/json', // Indicates the body is JSON
            'x-api-key':import.meta.env.VITE_API_KEY
          },
          body:formData
        });  
        
        const {status, message, error} = await res.json()
        setDisabled(false)

        if(status){
          toast.success(message)
        }else if(error){
          toast.error("could not edit. Try again later")
        }else{
          toast.error(message)
        }         
      }else if(upload === "person-details"){

        if(castForm.original_name === ""){
          toast.error("Name must be filled")
          setDisabled(false)
          return
        }else if(castForm.name === ""){
          toast.error("Nick Name must be filled")
          setDisabled(false)
          return
        }else if(castForm.email === ""){
          toast.error("Email must be filled")
          setDisabled(false)
          return
        }else if(castForm.telephone === ""){
          toast.error("Telephone must be filled")
          setDisabled(false)
          return
        }else if(castForm.national_id === 0){
          toast.error("National ID Must Be Filled")
          setDisabled(false)
          return
        }else if(castForm.biography === ""){
          toast.error("Biography must be filled")
          setDisabled(false)
          return
        }else if(castForm.birth_date === ""){
          toast.error("Select Birth Date")
          setDisabled(false)
          return
        }else if(castForm.gender === 0){
          toast.error("Select Gender")
          setDisabled(false)
          return
        }else if(castForm.department.length === 0){
          toast.error("Select Department")
          setDisabled(false)
          return
        }else if(!formData.has("identification")){
          toast.error("upload valid ID")
          setDisabled(false)
          return
        }

        formData.append("original_name",castForm?.original_name)
        formData.append("name",castForm?.name)
        formData.append("email",castForm?.email)
        formData.append("telephone",castForm?.telephone)
        formData.append("national_id",String(castForm?.national_id))
        formData.append("biography",castForm?.biography)
        formData.append("birth_date",castForm?.birth_date)
        formData.append("death_date","")
        formData.append("gender",castForm.gender)
        formData.append("department",JSON.stringify(castForm.department))

        const res = await fetch(`${import.meta.env.VITE_ENVIRONMENT === "development" ? import.meta.env.VITE_PERSON_DETAILS: import.meta.env.VITE_PERSON_DETAILS_LIVE}`,{
          method:"POST",
          credentials: "include",
          headers: {
            // 'Content-Type': 'application/json', // Indicates the body is JSON
            'x-api-key':import.meta.env.VITE_API_KEY
          },
          body:formData
        }); 

        const {status, message, error} = await res.json()  
        
        setDisabled(false)
        if(status){
          toast.success(message)
          setTimeout(() => {              
            onRouteChange && onRouteChange('list')
          },1000)
        }else if(error){
          toast.error("could not upload. Try again later")
        }else{
          toast.error(message)
        }   
      }else if(upload === "person-media"){
        if(!formData.has("profile_path") || !formData.has("resume_path")){
          toast.error("Upload all fields")
          setDisabled(false)
          return
        }
        
        if(!formData.has("id")){
          toast.error("select Person")
          setDisabled(false)
          return
        }

        const res = await fetch(`${import.meta.env.VITE_ENVIRONMENT === "development" ? import.meta.env.VITE_PERSON_MEDIA: import.meta.env.VITE_PERSON_MEDIA_LIVE}`,{
          method:"POST",
          credentials: "include",
          headers: {
            // 'Content-Type': 'application/json', // Indicates the body is JSON
            'x-api-key':import.meta.env.VITE_API_KEY
          },
          body:formData
        });  
        
        const {status, message, error} = await res.json()

        setDisabled(false)
        if(status){
          toast.success(message)
        }else if(error){
          toast.error("could not upload. Try again later")
        }else{
          toast.error(message)
        }    
      }else if(upload === "person-edit-details"){

        // console.log(castForm,"cast form")
        const res = await fetch(`${import.meta.env.VITE_ENVIRONMENT === "development" ? import.meta.env.VITE_PERSON_DETAILS_UPDATE: import.meta.env.VITE_PERSON_DETAILS_UPDATE_LIVE}`,{
          method:"POST",
          credentials: "include",
          headers: {
            'Content-Type': 'application/json', // Indicates the body is JSON
            'x-api-key':import.meta.env.VITE_API_KEY
          },
          body:JSON.stringify({
            ...castForm,
            person_id:client
          })
        }); 

        const {status, message, error} = await res.json()  
        
        setDisabled(false)
        if(status){
          toast.success(message)
        }else if(error){
          toast.error("could not edit. Try again later")
        }else{
          toast.error(message)
        }             
      }else if(upload === "person-edit-media"){
        formData.append("id",String(client))

        const res = await fetch(`${import.meta.env.VITE_ENVIRONMENT === "development" ? import.meta.env.VITE_PERSON_MEDIA_UPDATE: import.meta.env.VITE_PERSON_MEDIA_UPDATE_LIVE}`,{
          method:"POST",
          credentials: "include",
          headers: {
            // 'Content-Type': 'application/json', // Indicates the body is JSON
            'x-api-key':import.meta.env.VITE_API_KEY
          },
          body:formData
        });  
        
        const {status, message, error} = await res.json()
        setDisabled(false)

        if(status){
          toast.success(message)
        }else if(error){
          toast.error("could not edit. Try again later")
        }else{
          toast.error(message)
        }           
      }else if(upload === "genre-upload"){
        if(genreForm.name === ""){
          toast.error("Name must be filled")
          setDisabled(false)
          return
        }else if(genreForm.mode === ""){
          toast.error("Mode must be selected")
          setDisabled(false)
          return
        }    

        const res = await fetch(`${import.meta.env.VITE_ENVIRONMENT === "development" ? import.meta.env.VITE_GENRE_INSERT: import.meta.env.VITE_GENRE_INSERT_LIVE}`,{
          method:"POST",
          credentials: "include",
          headers: {
            'Content-Type': 'application/json', // Indicates the body is JSON
            'x-api-key':import.meta.env.VITE_API_KEY
          },
          body:JSON.stringify({
            ...genreForm
          })
        }); 

        const {status, message, data, error} = await res.json()  
        
        setDisabled(false)
        if(status){
          toast.success(message)
          setGenreFields && setGenreFields(data)
          
        }else if(error){
          toast.error("could not upload. Try again later")
        }else{
          toast.error(message)
        } 
      }else if(upload === "department-upload"){

        // console.log(departmentForm,"departmentForm")
        if(departmentForm.label === ""){
          toast.error("Name must be filled")
          setDisabled(false)
          return
        }

        const res = await fetch(`${import.meta.env.VITE_ENVIRONMENT === "development" ? import.meta.env.VITE_DEPARTMENT_INSERT: import.meta.env.VITE_DEPARTMENT_INSERT_LIVE}`,{
          method:"POST",
          credentials: "include",
          headers: {
            'Content-Type': 'application/json', // Indicates the body is JSON
            'x-api-key':import.meta.env.VITE_API_KEY
          },
          body:JSON.stringify({
            ...departmentForm
          })
        }); 

        const {status, message, data, error} = await res.json()  
        
        setDisabled(false)
        if(status){
          toast.success(message)
          setDepartmentFields && setDepartmentFields(data)
          
        }else if(error){
          toast.error("could not upload. Try again later")
        }else{
          toast.error(message)
        }         
      }else if(upload === "language-upload"){

        console.log(languageForm,"language form")
        if(languageForm.english_name === ""){
          toast.error("English Name must be filled")
          setDisabled(false)
          return
        }   

        const res = await fetch(`${import.meta.env.VITE_ENVIRONMENT === "development" ? import.meta.env.VITE_LANGUAGE_INSERT: import.meta.env.VITE_LANGUAGE_INSERT_LIVE}`,{
          method:"POST",
          credentials: "include",
          headers: {
            'Content-Type': 'application/json', // Indicates the body is JSON
            'x-api-key':import.meta.env.VITE_API_KEY
          },
          body:JSON.stringify({
            ...languageForm
          })
        }); 

        const {status, message, data, error} = await res.json()  
        
        setDisabled(false)
        if(status){
          toast.success(message)
          setLanguageFields && setLanguageFields(data)
          
        }else if(error){
          toast.error("could not upload. Try again later")
        }else{
          toast.error(message)
        }         
      }
      // else if(upload === "verify-code"){
      //   if(verifyForm.otp === ""){
      //     toast.error("OTP must be filled")
      //     setDisabled(false)
      //     return
      //   }

      //   if(verifyForm.code === ""){
      //     toast.error("Mpesa MerchantID must be filled")
      //     setDisabled(false)
      //     return          
      //   }

      //   const res = await fetch(`${import.meta.env.VITE_ENVIRONMENT === "development" ? import.meta.env.VITE_CONFIRM_VERIFY: import.meta.env.VITE_CONFIRM_VERIFY_LIVE}`,{
      //     method:"POST",
      //     credentials: "include",
      //     headers: {
      //       'Content-Type': 'application/json', // Indicates the body is JSON
      //       'x-api-key':import.meta.env.VITE_API_KEY
      //     },
      //     body:JSON.stringify({
      //       ...verifyForm
      //     })
      //   }); 

      //   const {status, message, error} = await res.json()  
        
      //   setDisabled(false)
      //   if(status){
      //     toast.success(message)
      //     // setDepartmentFields && setDepartmentFields(data)
          
      //   }else if(error){
      //     toast.error("could not verify. Try again later")
      //   }else{
      //     toast.error(message)
      //   }          
      // }
    }catch(error){
      console.log(error,"error")
      toast.error("Kindly retry")
    }
  }

  return (
    <form className="rounded-lg border border-white/10 bg-white/[0.035] p-5">
      <div className="mb-5 flex items-center gap-3">
        <span className="grid size-10 place-items-center rounded-md border border-clay-300/25 bg-clay-500/15 text-clay-200">
          <Icon className="size-5" />
        </span>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-clay-400">{eyebrow}</p>
          <h2 className="text-lg font-semibold text-white">{title}</h2>
        </div>
      </div>

      <div className="grid gap-4">{fields.map((field) => <FieldControl setLanguageForm={setLanguageForm} client={client} setDepartmentForm={setDepartmentForm} setGenreForm={setGenreForm} setEpisodeForm={setEpisodeForm} selectedSeason={selectedSeason ? selectedSeason : ""} selectedTv={selectedTv ? selectedTv:""} setSeasonForm={setSeasonForm} setTvForm={setTvForm} upload={upload} setForm={setForm} setPersonForm={setPersonForm} appendForms={appendForms} key={`${title}-${field.label}`} field={field} setCastForm={setCastForm} />)}</div>
      {
        upload != "verify-code" && (
          <button
            type="button"
            disabled={disbled}
            onClick={(e) => uploadDetails(e)}
            className="mt-5 inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-clay-500 px-4 text-sm font-bold text-white hover:bg-clay-400"
          >
            <Save className="size-4" />
            {disbled ? "loading..." : actionLabel}
          </button>
        )
      }
    </form>
  )
}

function FieldControl({ setLanguageForm, client, setCastForm, setDepartmentForm, setGenreForm, selectedSeason, selectedTv, setSeasonForm, setTvForm, upload, setForm, setPersonForm, appendForms, field, setEpisodeForm }: { setLanguageForm:React.Dispatch<React.SetStateAction<LanguageFormSchema>>, client?: string | number, setCastForm: React.Dispatch<React.SetStateAction<CastFormSchema>>, setDepartmentForm: React.Dispatch<React.SetStateAction<DepartmentFormSchema>>, setGenreForm: React.Dispatch<React.SetStateAction<GenreFormSchema>>, selectedSeason:any , selectedTv: any, setSeasonForm:React.Dispatch<React.SetStateAction<SeasonFormSchema>>, setTvForm:React.Dispatch<React.SetStateAction<TvFormSchema>>, upload: string, setForm: React.Dispatch<React.SetStateAction<FormSchema>>, setPersonForm: React.Dispatch<React.SetStateAction<PersonFormSchema>>, appendForms:(key:string,value:any) => void, field: FieldConfig, setEpisodeForm:React.Dispatch<React.SetStateAction<EpisodeFormSchema>> }) {
  const inputClass =
    'mt-2 h-10 w-full rounded-md border border-white/10 bg-[#111317] px-3 text-sm text-white outline-none transition file:mr-3 file:rounded-md file:border-0 file:bg-white/10 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white focus:border-teal-300/50 focus:ring-2 focus:ring-teal-300/10'
  const textareaClass =
    'mt-2 min-h-28 w-full rounded-md border border-white/10 bg-[#111317] px-3 py-2 text-sm text-white outline-none transition focus:border-teal-300/50 focus:ring-2 focus:ring-teal-300/10'

  if (field.kind === 'checkbox') {
    const changeCheckbox = () => {
      if(field.title === "adult"){
        setForm((prev:FormSchema) => {
          return ({
            ...prev,
            adult:!prev.adult
          })
        })
      }else if(field.title === "tv_adult"){
        setTvForm((prev:TvFormSchema) => {
          return ({
            ...prev,
            tv_adult:!prev.tv_adult
          })
        })
      }
    }

    return (
      <label className="flex min-h-10 items-center justify-between gap-3 rounded-md border border-white/10 bg-[#111317] px-3 py-2">
        <span>
          <span className="block text-sm font-semibold text-white">{field.label}</span>
          {field.note ? <span className="block text-xs text-sand-100/38">{field.note}</span> : null}
        </span>
        <input type="checkbox" onClick={changeCheckbox} defaultChecked={field.checked} className="size-4 accent-clay-400" />
      </label>
    )
  }

  const [disabled, setDisabled] = useState<boolean>(false)
  const [disabledConfirm, setDisabledConfirm] = useState<boolean>(false)
  const [verifyLabel, setVerifyLabel] = useState<string>(field.title === "code" ? "Click To Send Code" : "Click To Send OTP")
  const [confirmLabel, setConfirmLabel] = useState<string>(field.title === "code" ? "Click To Confirm Code" : "Click To Confirm OTP")
  const [verifyForm, setVerifyForm] = useState<VerifyFormSchema>({
    otp:"",
    code:""
  })
  //for mpesa
  const [code, setCode] = useState<string>("")

  const verify = async(e:any) => {
    e.preventDefault()
    try{
      setDisabled(true)

      if(verifyLabel === "Click To Send OTP"){
        setVerifyLabel("sending otp...")
        const res = await fetch(`${import.meta.env.VITE_ENVIRONMENT === "development" ? import.meta.env.VITE_VERIFY_EMAIL : import.meta.env.VITE_VERIFY_EMAIL_LIVE}`,{
          method:"POST",
          body : JSON.stringify({
            id:client
          }),
          'credentials':"include",
          headers: {
            'Content-Type': 'application/json', // Indicates the body is JSON
            'x-api-key':import.meta.env.VITE_API_KEY,
          },
        });

        // console.log(position,"sent")

        const {status, message, error} = await res.json()

        if(status){
          console.log("otp sent")
          setDisabled(false)
          setVerifyLabel("success")
          toast.success(message)
        }else if(error){
          toast.error(error)
          setDisabled(false)
        }else{
          toast.error(message)
          setDisabled(false)
        }
        setVerifyLabel("Click To Send OTP")
        return
      }else if(verifyLabel === "Click To Send Code"){
        setVerifyLabel("sending mpesa code...")
        const socketKey = newSocketKey()
        const res = await fetch(`${import.meta.env.VITE_ENVIRONMENT === "development" ? import.meta.env.VITE_VERIFY_TELEPHONE : import.meta.env.VITE_VERIFY_TELEPHONE_LIVE}`,{
          method:"POST",
          body : JSON.stringify({
            id:client,
            socket_key:socketKey
          }),
          'credentials':"include",
          headers: {
            'Content-Type': 'application/json', // Indicates the body is JSON
            'x-api-key':import.meta.env.VITE_API_KEY,
          },
        });

        const {status, message, error, merchant, email, sockets_url} = await res.json()

        if(status){
          // console.log("code sent")
          toast.success(message)
          try{
            //signed room "<MerchantRequestID>$<key>" - the API still checks the payment with Safaricom on confirm
            const leave = joinMpesaRoom(sockets_url, merchant, socketKey, async(data:any) => {
              //check if payment was cancelled
              if(data.ResultCode !== 0){
                toast.error("transaction canceled")
                leave();
                return null
              }
              leave()
              setCode(data?.MerchantRequestID)
              const res = await fetch(`${import.meta.env.VITE_ENVIRONMENT === "development" ? import.meta.env.VITE_PAYMENT : import.meta.env.VITE_PAYMENT_LIVE}`,{
                method:"POST",
                credentials: "include",
                body : JSON.stringify({
                  data: {...data, purpose:"verify person"},
                  email,
                  type:"mpesa"
                }),
                headers: {
                  'Content-Type': 'application/json', // Indicates the body is JSON
                  'x-api-key':import.meta.env.VITE_API_KEY
                },
              }); 
              const paid = await res.json()
              if(paid.status){
                const res = await fetch(`${import.meta.env.VITE_ENVIRONMENT === "development" ? import.meta.env.VITE_VERIFY_TELEPHONE_CONFIRM : import.meta.env.VITE_VERIFY_TELEPHONE_CONFIRM_LIVE}`,{
                  method:"POST",
                  body : JSON.stringify({
                    code:data?.MerchantRequestID,
                    id:client
                  }),
                  'credentials':"include",
                  headers: {
                    'Content-Type': 'application/json', // Indicates the body is JSON
                    'x-api-key':import.meta.env.VITE_API_KEY,
                  },
                }); 
                
                const confirmedPhone = await res.json()

                if(confirmedPhone?.status){
                  toast.success(paid.message + confirmedPhone.message)
                  toast.success("success!")
                  setDisabled(false)
                  setVerifyLabel("success")
                }else if(confirmedPhone?.error){
                  toast.error(confirmedPhone?.error)
                }
                return 
              }       
            }) 
          }catch(error){
            console.log(error,"error")
          }
         
        }else if(error){
          toast.error(error)
          setDisabled(false)
        }else{
          toast.error(message)
          setDisabled(false)
        }
        setVerifyLabel("Click To Send Code")
        return
      }else if(verifyLabel === "success"){
        toast.success("already verified!")
        setDisabled(false)
        setVerifyLabel(field.title === "code" ? "Click To Send Code" : "Click To Send OTP")
      }
      return
    }catch(error){
      console.log(error,"error")
      toast.error("could not send code")
    }

  }

  const confirm = async(e:any) => {
    e.preventDefault()
    try{
      setDisabledConfirm(true)
      if(confirmLabel === "Click To Confirm OTP"){
        setConfirmLabel("confirming otp...")
        const res = await fetch(`${import.meta.env.VITE_ENVIRONMENT === "development" ? import.meta.env.VITE_VERIFY_EMAIL_CONFIRM : import.meta.env.VITE_VERIFY_EMAIL_CONFIRM_LIVE}`,{
          method:"POST",
          body : JSON.stringify({
            otp:verifyForm.otp,
            id:client
          }),
          'credentials':"include",
          headers: {
            'Content-Type': 'application/json', // Indicates the body is JSON
            'x-api-key':import.meta.env.VITE_API_KEY,
          },
        });

        // console.log(position,"sent")

        const {status, message, error} = await res.json()

        if(status){
          // console.log("otp sent")
          setDisabledConfirm(false)
          setConfirmLabel("success")
          toast.success(message)
        }else if(error){
          toast.error(error)
          setDisabledConfirm(false)
        }else{
          toast.error(message)
          setDisabledConfirm(false)
        }
        setConfirmLabel("Click To Confirm OTP")
        return
      }else if(confirmLabel === "Click To Confirm Code"){
        setConfirmLabel("confirming code...")
        const res = await fetch(`${import.meta.env.VITE_ENVIRONMENT === "development" ? import.meta.env.VITE_VERIFY_TELEPHONE_CONFIRM : import.meta.env.VITE_VERIFY_TELEPHONE_CONFIRM_LIVE}`,{
          method:"POST",
          body : JSON.stringify({
            code:verifyForm.code,
            id:client
          }),
          'credentials':"include",
          headers: {
            'Content-Type': 'application/json', // Indicates the body is JSON
            'x-api-key':import.meta.env.VITE_API_KEY,
          },
        });

        const {status, message, error} = await res.json()

        if(status){
          setDisabledConfirm(false)
          setConfirmLabel("success")
          toast.success(message)
        }else if(error){
          toast.error(error)
          setDisabledConfirm(false)
        }else{
          toast.error(message)
          setDisabledConfirm(false)
        }
        setConfirmLabel("Click To Confirm Code")
        return        
      }else if(confirmLabel === "success"){
        toast.success("already verified!")
        setDisabledConfirm(false)
        setConfirmLabel(field.title === "code" ? "Click To Confirm Code" : "Click To Confirm OTP")
      }
    }catch(error){
      console.log(error,"error")
      toast.error("could not confirm code")
    }
  }

  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase tracking-[0.14em] text-sand-100/45">{field.label}</span>
      {renderFieldInput(setLanguageForm, setVerifyForm, code || "", setDepartmentForm, field, inputClass, textareaClass, setForm, upload, setPersonForm, appendForms, setTvForm, setSeasonForm, selectedTv, selectedSeason, setEpisodeForm, setGenreForm, setCastForm)}
      {field.note ? <span className="mt-1 block text-xs text-sand-100/38">{field.note}</span> : null}
      {
        upload == "verify-code" && (
          <>
            <button
              type="button"
              disabled={disabled}
              onClick={(e) => verify(e)}
              className="mt-5 inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-clay-500 px-4 text-sm font-bold text-white hover:bg-clay-400"
            >
              <Save className="size-4" />
              {verifyLabel}
            </button>
            <button
              type="button"
              disabled={disabledConfirm}
              onClick={(e) => confirm(e)}
              className="mt-5 inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-clay-500 px-4 text-sm font-bold text-white hover:bg-clay-400"
            >
              <Save className="size-4" />
              {confirmLabel}
            </button>          
          </>
        )
      }
    </label>
  )
}

function renderFieldInput(setLanguageForm:React.Dispatch<React.SetStateAction<LanguageFormSchema>>, setVerifyForm:React.Dispatch<React.SetStateAction<VerifyFormSchema>>, code: string, setDepartmentForm: React.Dispatch<React.SetStateAction<DepartmentFormSchema>>, field: FieldConfig, inputClass: string, textareaClass: string, setForm:React.Dispatch<React.SetStateAction<FormSchema>>, upload:string, setPersonForm:React.Dispatch<React.SetStateAction<PersonFormSchema>>,appendForms:(key:string,value:any) => void,setTvForm:React.Dispatch<React.SetStateAction<TvFormSchema>>,setSeasonForm:React.Dispatch<React.SetStateAction<SeasonFormSchema>>, selectedTv:any, selectedSeason:any | number, setEpisodeForm:React.Dispatch<React.SetStateAction<EpisodeFormSchema>>,setGenreForm:React.Dispatch<React.SetStateAction<GenreFormSchema>>,setCastForm:React.Dispatch<React.SetStateAction<CastFormSchema>>) {

  const appendForm = (e:any) => {
    if(upload === "details" || upload === "edit-details"){
      setForm((prev:any) => {
        return ({
          ...prev,
          [e.target.name]:e.target.value
        })
      })
    }else if(upload === "person" || upload === "tv-person" || upload === "season-person" || upload === "episode-person"){
      setPersonForm((prev:any) => {
        return ({
          ...prev,
          [e.target.name]:e.target.value
        })
      })
    }else if(upload === "tv-details" || upload === "tv-edit-details"){
      setTvForm((prev:any) => {
        return ({
          ...prev,
          [e.target.name]:e.target.value
        })
      })
    }else if(upload === "season-details" || upload === "season-edit-details"){
      setSeasonForm((prev:any) => {
        return ({
          ...prev,
          [e.target.name]:e.target.value          
        })
      })
    }else if(upload === "episode-details" || upload === "episode-edit-details"){
      setEpisodeForm((prev:any) => {
        return ({
          ...prev,
          [e.target.name]:e.target.value          
        })
      })
    }else if(upload === "person-details" || upload === "person-edit-details"){
      setCastForm((prev:any) => {
        return ({
          ...prev,
          [e.target.name]:e.target.value          
        })
      })
    }else if(upload === "genre-upload"){
      console.log(e.target.name,"name:")
      setGenreForm((prev:any) => {
        return ({
          ...prev,
          [e.target.name]:e.target.value          
        })
      })
    }else if(upload === "department-upload"){
      setDepartmentForm((prev:any) => {
        return ({
          ...prev,
          [e.target.name]:e.target.value          
        })
      })
    }else if(upload === "language-upload"){
      setLanguageForm((prev:any) => {
        return ({
          ...prev,
          [e.target.name]:e.target.value          
        })
      })      
    }else if(upload === "verify-code"){
      setVerifyForm((prev:any) => {
        return ({
          ...prev,
          [e.target.name]:e.target.value
        })
      })
    }
  }

  const handleMedia = async(e:any) => {
    const file = e.target.files[0];
    // formData.append(e.target.name, file);
    appendForms(e.target.name, file)
  }

  if (field.kind === 'textarea') {
    return (
      <textarea
        onChange={appendForm}
        name={field.title}
        rows={field.rows ?? 4}
        placeholder={field.placeholder}
        defaultValue={field.defaultValue?.toString()}
        className={textareaClass}
      />
    )
  }

  if (field.kind === 'select' || field.kind === 'multiselect') {
    const [options, setOptions] = useState<Options[] | null>(null)
    const [selectDefaultValue, setSelectDefaultValue] = useState<any>(null)

    useEffect(() => {
      (async() => {
        // const oldOptions = await field.options()
        if(field.title === "genre"){
          const res = await fetch(`${import.meta.env.VITE_ENVIRONMENT === "development" ? import.meta.env.VITE_GENRE: import.meta.env.VITE_GENRE_LIVE}`,{
            method:"GET",
            credentials: "include",
            headers: {
              'Content-Type': 'application/json', // Indicates the body is JSON
              'x-api-key':import.meta.env.VITE_API_KEY
            },
          }); 

          const {status, message, data} = await res.json()

          // console.log(status,"message",message)
          if(status){
            const genreData = data.filter(({mode}:{mode:string}) => mode === "movie").map(({id,name}:{id:number,name:string}) => ({value:Number(id),label:name}))
            // console.log(movieData,"movie data")
            const fieldData = field.defaultValues || [0] as any
            const selectData = data.filter(({mode}:{mode:string}) => mode === "movie").map(({id,name}:{id:number,name:string}) => ({value:Number(id),label:name})).filter(({value}:{value:number}) => fieldData && fieldData.length > 0 && fieldData.includes(value)) 
            // console.log(selectData,"select data")
            setOptions(genreData)
            setSelectDefaultValue(selectData)
          }else{
            setOptions(null)
          }
          return

        }else if(field.title === "language"){
          const res = await fetch(`${import.meta.env.VITE_ENVIRONMENT === "development" ? import.meta.env.VITE_LANGUAGE: import.meta.env.VITE_LANGUAGE_LIVE}`,{
            method:"GET",
            credentials: "include",
            headers: {
              'Content-Type': 'application/json', // Indicates the body is JSON
              'x-api-key':import.meta.env.VITE_API_KEY
            },
          }); 

          const {status, message, data} = await res.json()

          if(status){
            const languageData = data.map(({english_name}:{english_name:string}) => ({value:english_name,label:english_name}))
            setOptions(languageData)
          }else{
            setOptions(null)
          }          
        }else if(field.title === "region"){
          const res = await fetch(`${import.meta.env.VITE_ENVIRONMENT === "development" ? import.meta.env.VITE_REGION: import.meta.env.VITE_REGION_LIVE}`,{
            method:"GET",
            credentials: "include",
            headers: {
              'Content-Type': 'application/json', // Indicates the body is JSON
              'x-api-key':import.meta.env.VITE_API_KEY
            },
          }); 

          const {status, message, data} = await res.json()

          if(status){
            const regionData = data.map(({english_name}:{english_name:string}) => ({value:english_name,label:english_name}))
            setOptions(regionData)
          }else{
            setOptions(null)
          }                 
        }else if(field.title === "title"){
          const res = await fetch(`${import.meta.env.VITE_ENVIRONMENT === "development" ? import.meta.env.VITE_FETCH_MOVIE_MEDIA: import.meta.env.VITE_FETCH_MOVIE_MEDIA_LIVE}`,{
            method:"POST",
            credentials: "include",
            headers: {
              'Content-Type': 'application/json', // Indicates the body is JSON
              'x-api-key':import.meta.env.VITE_API_KEY
            },
            body:JSON.stringify({
              page:1
            })
          }); 

          const {status, message, data} = await res.json()

          if(status){
            const titleData = data.map(({title,movie_id}:{title:string,movie_id:number}) => ({value:movie_id,label:title}))
            setOptions(titleData)
          }else{
            setOptions(null)
          }   
        }else if(field.title === "department"){
          const res = await fetch(`${import.meta.env.VITE_ENVIRONMENT === "development" ? import.meta.env.VITE_FETCH_DEPARTMENT: import.meta.env.VITE_FETCH_DEPARTMENT_LIVE}`,{
            method:"GET",
            credentials: "include",
            headers: {
              'Content-Type': 'application/json', // Indicates the body is JSON
              'x-api-key':import.meta.env.VITE_API_KEY
            },
          }); 

          const {status, message, data} = await res.json()
          // console.log(status,"status",message,"message",data)

          if(status){
            // const peopleData = data.map(({data,id}:{data:string,id:number}) => ({person_id:id,...JSON.parse(data)})).map(({person_id,name}:{person_id:number,name:string}) => ({value:person_id,label:name}))
            // console.log(peopleData, "people data")
            setOptions(data)
          }else{
            setOptions(null)
          }     
        }else if((upload === "season-media" && field.title === "name") || (upload === "season-person" && field.title === "name")){
          // console.log("season name",upload,field.title)
          const res = await fetch(`${import.meta.env.VITE_ENVIRONMENT === "development" ? import.meta.env.VITE_FETCH_SEASON_MEDIA: import.meta.env.VITE_FETCH_SEASON_MEDIA_LIVE}`,{
            method:"POST",
            credentials: "include",
            headers: {
              'Content-Type': 'application/json', // Indicates the body is JSON
              'x-api-key':import.meta.env.VITE_API_KEY
            },
            body:JSON.stringify({
              id:selectedTv?.value,
              page:1
            })
          }); 

          const {status, message, data} = await res.json()
          // console.log(status,"status",data)

          if(status){
            const titleData = data.map(({name,season_id}:{name:string,season_id:number}) => ({value:season_id,label:name}))
            setOptions(titleData)
          }else{
            setOptions(null)
          }             
        }else if((upload === "episode-media" && field.title === "name") || (upload === "episode-person" && field.title === "name")){
          const res = await fetch(`${import.meta.env.VITE_ENVIRONMENT === "development" ? import.meta.env.VITE_FETCH_EPISODE_MEDIA: import.meta.env.VITE_FETCH_EPISODE_MEDIA_LIVE}`,{
            method:"POST",
            credentials: "include",
            headers: {
              'Content-Type': 'application/json', // Indicates the body is JSON
              'x-api-key':import.meta.env.VITE_API_KEY
            },
            body:JSON.stringify({
              id:selectedSeason?.value,
              page:1
            })
          }); 

          const {status, message, data} = await res.json()

          if(status){
            const titleData = data.map(({name,episode_id}:{name:string,episode_id:number}) => ({value:episode_id,label:name}))
            setOptions(titleData)
          }else{
            setOptions(null)
          }             
        }else if(field.title === "name"){
          // console.log("tv names",upload)
          const res = await fetch(`${import.meta.env.VITE_ENVIRONMENT === "development" ? import.meta.env.VITE_FETCH_TV_MEDIA: import.meta.env.VITE_FETCH_TV_MEDIA_LIVE}`,{
            method:"POST",
            credentials: "include",
            headers: {
              'Content-Type': 'application/json', // Indicates the body is JSON
              'x-api-key':import.meta.env.VITE_API_KEY
            },
            body:JSON.stringify({
              page:1
            })
          }); 

          const {status, message, data} = await res.json()
          // console.log(status,"status",data)

          if(status){
            const titleData = data.map(({name,tv_id}:{name:string,tv_id:number}) => ({value:tv_id,label:name}))
            setOptions(titleData)
          }else{
            setOptions(null)
          }             
        }else if(field.title === "person"){
          const res = await fetch(`${import.meta.env.VITE_ENVIRONMENT === "development" ? import.meta.env.VITE_FETCH_PEOPLE: import.meta.env.VITE_FETCH_PEOPLE_LIVE}`,{
            method:"POST",
            credentials: "include",
            headers: {
              'Content-Type': 'application/json', // Indicates the body is JSON
              'x-api-key':import.meta.env.VITE_API_KEY
            },
            body:JSON.stringify({
              page:1
            })
          }); 

          const {status, message, data} = await res.json()

          if(status){
            // console.log(data,"follow person data")
            const peopleData = data.map(({data,id}:{data:string,id:number}) => ({person_id:id,...JSON.parse(data)})).map(({person_id,name}:{person_id:number,name:string}) => ({value:person_id,label:name}))
            // console.log(peopleData, "person id")
            setOptions(peopleData)
          }else{
            setOptions(null)
          }             
        }else if(field.title === "episode_type"){
          setOptions([{label:'standard',value:'standard'}, {label:'Premiere',value:'Premiere'}, {label:'Finale',value:'Finale'}])
        }else if(field.title === "mode"){
          setOptions([{label:'movie',value:'movie'}, {label:'tv',value:'tv'}])
        }else if(field.title === "gender"){
          setOptions([{
            label:"female",
            value:1
          },{
            label:"male",
            value:2
          }])
        }else if(field.title === "people"){
          // console.log("hello")
          const res = await fetch(`${import.meta.env.VITE_ENVIRONMENT === "development" ? import.meta.env.VITE_FETCH_PEOPLE: import.meta.env.VITE_FETCH_PEOPLE_LIVE}`,{
            method:"POST",
            credentials: "include",
            headers: {
              'Content-Type': 'application/json', // Indicates the body is JSON
              'x-api-key':import.meta.env.VITE_API_KEY
            },
            body:JSON.stringify({
              page:1
            })
          }); 

          const {status, message, data} = await res.json()
          // console.log(status,"status",data)

          if(status){
            // console.log(data,"follow person data")
            const peopleData = data.map(({person_id,name,original_name}:{person_id:number,name:string,original_name:string}) => ({value:person_id,label:name + " | " + original_name}))
            // console.log(peopleData, "person id")
            setOptions(peopleData)
          }else{
            setOptions(null)
          }               
        }

        if(field.defaultValue){
          const selectDefaultValue = field.defaultValue?.toString()
          // console.log(selectDefaultValue, "thers")

          setSelectDefaultValue([{label:field.title === "gender" && selectDefaultValue && typeof(selectDefaultValue) === "string" ? selectDefaultValue.replace("1","female").replace("2","male") : selectDefaultValue,value:selectDefaultValue}])
        }else if(field.defaultValues){
          if(field.title === "department"){
            const selectDefaultValues = field?.defaultValues.map((data:string | number) => ({label:data,value:data}))
            setSelectDefaultValue(selectDefaultValues)
          }
        }else{
          setSelectDefaultValue("open")
        }

      })()
    },[])

    const handleInputChange = (value:string) => {
      if((upload === "season-media" && field.title === "name") || (upload === "season-person" && field.title === "name")){
        if(!value)
          return

        async function runSearch(){
          const res = await fetch(`${import.meta.env.VITE_ENVIRONMENT === "development" ? import.meta.env.VITE_FETCH_SEASON_SEARCH: import.meta.env.VITE_FETCH_SEASON_SEARCH_LIVE}`,{
            method:"POST",
            credentials: "include",
            headers: {
              'Content-Type': 'application/json', // Indicates the body is JSON
              'x-api-key':import.meta.env.VITE_API_KEY
            },
            body:JSON.stringify({
              value
            })
          }); 

          const {status, message, data} = await res.json() 
          if(status && data && data.length > 0){
            const movieData = data.map(({data,id}:{data:any,id:number}) => ({season_id:id,...JSON.parse(data)})).map(({name,season_id}:{name:string,season_id:number}) => ({value:season_id,label:name}))
            setOptions((prev:any) => {
              return [
                ...prev,
                ...movieData
              ]
            })
          }
        }
        
        runSearch()  
      }else if((upload === "episode-media" && field.title === "name") || (upload === "episode-person" && field.title === "name")){
        if(!value)
          return

        async function runSearch(){
          const res = await fetch(`${import.meta.env.VITE_ENVIRONMENT === "development" ? import.meta.env.VITE_FETCH_EPISODE_SEARCH: import.meta.env.VITE_FETCH_EPISODE_SEARCH_LIVE}`,{
            method:"POST",
            credentials: "include",
            headers: {
              'Content-Type': 'application/json', // Indicates the body is JSON
              'x-api-key':import.meta.env.VITE_API_KEY
            },
            body:JSON.stringify({
              value
            })
          }); 

          const {status, message, data} = await res.json() 
          if(status && data && data.length > 0){
            const movieData = data.map(({data,id}:{data:any,id:number}) => ({episode_id:id,...JSON.parse(data)})).map(({name,episode_id}:{name:string,episode_id:number}) => ({value:episode_id,label:name}))
            setOptions((prev:any) => {
              return [
                ...prev,
                ...movieData
              ]
            })
          }
        }
        
        runSearch()  
      }else if(field.title === "person"){
        if(!value)
          return

        async function runSearch(){
          const res = await fetch(`${import.meta.env.VITE_ENVIRONMENT === "development" ? import.meta.env.VITE_SEARCH_PEOPLE: import.meta.env.VITE_SEARCH_PEOPLE_LIVE}`,{
            method:"POST",
            credentials: "include",
            headers: {
              'Content-Type': 'application/json', // Indicates the body is JSON
              'x-api-key':import.meta.env.VITE_API_KEY
            },
            body:JSON.stringify({
              value
            })
          }); 

          const {status, message, data} = await res.json() 
          // console.log(message,"search message",data)
          if(status && data && data.length > 0){
            // console.log("enteredt")
            const peopleData = data.map(({data}:{data:string}) => JSON.parse(data)).map(({id,name,original_name}:{id:number,name:string,original_name:string}) => ({value:id,label:name + " | " + original_name}))
            // console.log(peopleData, "people data")
            setOptions((prev:any) => {
              return [
                ...prev,
                ...peopleData
              ]
            })
          }
        }
        
        runSearch()
      }else if(field.title === "title"){
        if(!value)
          return

        async function runSearch(){
          const res = await fetch(`${import.meta.env.VITE_ENVIRONMENT === "development" ? import.meta.env.VITE_FETCH_MOVIE_SEARCH: import.meta.env.VITE_FETCH_MOVIE_SEARCH_LIVE}`,{
            method:"POST",
            credentials: "include",
            headers: {
              'Content-Type': 'application/json', // Indicates the body is JSON
              'x-api-key':import.meta.env.VITE_API_KEY
            },
            body:JSON.stringify({
              value
            })
          }); 

          const {status, message, data} = await res.json() 
          if(status && data && data.length > 0){
            const movieData = data.map(({data,id}:{data:any,id:number}) => ({movie_id:id,...JSON.parse(data)})).map(({title,movie_id}:{title:string,movie_id:number}) => ({value:movie_id,label:title}))
            setOptions((prev:any) => {
              return [
                ...prev,
                ...movieData
              ]
            })
          }
        }
        
        runSearch()        
      }else if(field.title === "name"){
        if(!value)
          return

        async function runSearch(){
          const res = await fetch(`${import.meta.env.VITE_ENVIRONMENT === "development" ? import.meta.env.VITE_FETCH_TV_SEARCH: import.meta.env.VITE_FETCH_TV_SEARCH_LIVE}`,{
            method:"POST",
            credentials: "include",
            headers: {
              'Content-Type': 'application/json', // Indicates the body is JSON
              'x-api-key':import.meta.env.VITE_API_KEY
            },
            body:JSON.stringify({
              value
            })
          }); 

          const {status, message, data} = await res.json() 
          // console.log(status,data)
          if(status && data && data.length > 0){
            const movieData = data.map(({data,id}:{data:any,id:number}) => ({tv_id:id,...JSON.parse(data)})).map(({name,tv_id}:{name:string,tv_id:number}) => ({value:tv_id,label:name}))
            setOptions((prev:any) => {
              return [
                ...prev,
                ...movieData
              ]
            })
          }
        }
        
        runSearch()          
      }
    }
    // const [selectedOption, setSelectedOption] = useState<null>(null)

    // console.log(selectDefaultValue, "select default value")
    return (
      // <select
      //   // multiple={field.kind === 'multiselect'}
      //   // defaultValue={selectDefaultValue}
      //   className={`${inputClass} ${field.kind === 'multiselect' ? 'h-28 py-2' : ''}`}
      // >
      //   {options && options.map(({id,name}) => (
      //     <option key={id} value={id}>{name}</option>
      //   ))}
      // </select>
      <>
        {
          selectDefaultValue && options && options.length > 0 && (
            <Select
              isMulti={["mode","language","region","title","name","person","episode_type","people","gender"].includes(field.title) ? false : true}
              styles={customStyles}
              isSearchable ={true}
              defaultValue={selectDefaultValue}
              onInputChange={handleInputChange}
              // onChange={setSelectedOption as any}
              onChange={(value:any) => {
                // console.log(value,"value")
                // setSelectedOption(value);
                if(upload === "details" || upload === "edit-details"){
                  setForm((prev) => {
                    if(field.title === "genre")
                      prev.genre_ids = value.map((item:any) => item.value);
                    else if(field.title === "language"){
                      prev.original_language = value.value
                    }else if(field.title === "region"){
                      prev.region = value.value
                    }
                    return ({...prev})
                  })
                }else if(upload === "media" || upload === "edit-media" || upload === "tv-media" || upload === "tv-edit-media" || upload === "season-media" || upload === "season-edit-media" || upload === "person-media" || upload === "person-edit-media"){
                  // formData.append("id",value.value)
                  appendForms("id",value.value)
                }else if(upload === "person" || upload === "tv-person" || upload === "season-person" || upload === "episode-person"){
                  setPersonForm((prev:any) => {
                    if(field.title === "title")
                      prev.title = value.value
                    else if(field.title === "name"){
                      prev.title = value.value
                    }else if(field.title === "department"){
                      prev.department = value.map((item:any) => item.value);
                    }else if(field.title === "person"){
                      prev.person = value.value
                    }
                    return ({
                      ...prev
                    })
                  })
                }else if(upload === "tv-details" || upload === "tv-edit-details"){
                  setTvForm((prev:any) => {
                    if(field.title === "genre")
                      prev.genre_ids = value.map((item:any) => item.value);
                    else if(field.title === "language"){
                      prev.original_language = value.value
                    }else if(field.title === "region"){
                      prev.region = value.value
                    }
                    return ({...prev})
                  })
                }else if(upload === "episode-details" || upload === "episode-edit-details"){
                  setEpisodeForm((prev:any) => {
                    if(field.title === "episode_type")
                      prev.episode_type = value.value
                    return ({...prev})
                  })
                }else if(upload === "person-details" || upload === "person-edit-details"){
                  setCastForm((prev:any) => {
                    if(field.title === "gender")
                      prev.gender = value.value
                    else if(field.title === "department"){
                      prev.department = value.map((item:any) => item.value);
                    }
                    return ({...prev})
                  })
                }else if(upload === "genre-upload"){
                  setGenreForm((prev:any) => {
                    prev.mode = value.value
                    return ({...prev})
                  })
                }

              }}
              options={options as any}
            />
          )
          ||
          <p style={{color:"red",textDecoration:"underline"}}>
          {
            upload.match(/season/)
            ?
              "Select TV and Upload Season"
            : upload.match(/episode/)
            ?
              "Select TV and Season Upload Episode"
            :
              "Upload Data Options First"
          }
          </p>
        }
      </>

    )
  }

  if (field.kind === 'file') {
    // console.log(field.title,"field title")
    return <input type="file" name={field.title} onChange={handleMedia} className={`${inputClass} py-2`} />
  }

  return (
    <input
      type={field.kind}
      name={field.title}
      onChange={appendForm}
      placeholder={field?.placeholder}
      defaultValue={field.title === "code" ? code : field.defaultValue}
      className={inputClass}
    />
  )
}

function ActionPanel({
  title,
  icon: Icon,
  body,
  actionLabel,
  client
}: {
  title: string
  icon: LucideIcon
  body: string
  actionLabel: string
  client?:number
}) {

  const [people,setPeople] = useState<any>(null)

  useEffect(() => {
    (async() => {
      fetchCast()
    })()
  },[])

  const fetchCast = async() => {
    const res = await fetch(`${import.meta.env.VITE_ENVIRONMENT === "development" ? import.meta.env.VITE_FETCH_PEOPLE_MOVIE: import.meta.env.VITE_FETCH_PEOPLE_MOVIE_LIVE}`,{
      method:"POST",
      credentials: "include",
      headers: {
        'Content-Type': 'application/json', // Indicates the body is JSON
        'x-api-key':import.meta.env.VITE_API_KEY
      },
      body:JSON.stringify({
        id:client
      })
    }); 

    const {status, message, data, error} = await res.json() 
    console.log(status,"status",data)
    if(status){
      setPeople(data)
    }
  }

  const removePerson = async(id:number) => {
    try{
      const res = await fetch(`${import.meta.env.VITE_ENVIRONMENT === "development" ? import.meta.env.VITE_REMOVE_PEOPLE: import.meta.env.VITE_REMOVE_PEOPLE_LIVE}`,{
        method:"POST",
        credentials: "include",
        headers: {
          'Content-Type': 'application/json', // Indicates the body is JSON
          'x-api-key':import.meta.env.VITE_API_KEY
        },
        body:JSON.stringify({
          id
        })
      }); 

      const {status, message, error} = await res.json()  
      
      if(status){
        toast.success(message)
        fetchCast()
      }else if(error){
        toast.error("could not remove. Try again later")
      }else{
        toast.error(message)
      }
    }catch(error){
      console.log(error,"error")
      toast.error("" + error)
    }
  }
  
  return (
    <section className="rounded-lg border border-white/10 bg-white/[0.035] p-5">
      <div className="flex items-center gap-3">
        <span className="grid size-10 place-items-center rounded-md border border-red-300/25 bg-red-400/10 text-red-200">
          <Icon className="size-5" />
        </span>
        <h2 className="text-lg font-semibold text-white">{title}</h2>
      </div>
      {
        people && people.map((person:any,index:number) =>
          <div key={index}>
            <div className="mt-4 flex flex-wrap text-sm leading-6 text-sand-100/55">
              <img src={JSON.parse(person.data)?.image} />
              <div>
                <p>{JSON.parse(person.data).name}</p>
                <p>{person.star_character}</p>
                <p>{JSON.parse(person?.department).join(" | ")}</p>
              </div>
            </div>
            <button type="button" onClick={() => removePerson(person?.star_id)} className="mt-5 inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border border-red-300/25 bg-red-400/10 px-4 text-sm font-bold text-red-100 hover:bg-red-400/15">
              <Trash2 className="size-4" />
              Remove
            </button>
          </div>
        )
      }

    </section>
  )
}

function LibraryPanel({ title, icon: Icon, items }: { title: string; icon: LucideIcon; items: string[] }) {
  return (
    <section className="rounded-lg border border-white/10 bg-white/[0.035] p-5 xl:col-span-2">
      <div className="mb-4 flex items-center gap-3">
        <span className="grid size-10 place-items-center rounded-md border border-teal-300/20 bg-teal-300/10 text-teal-200">
          <Icon className="size-5" />
        </span>
        <h2 className="text-lg font-semibold text-white">{title}</h2>
      </div>
      <div className="grid gap-2 md:grid-cols-2">
        {items.map((item,index) => (
          <div key={index} className="rounded-md border border-white/10 bg-[#111317] px-3 py-2 text-sm text-sand-100/65">
            {item}
          </div>
        ))}
      </div>
    </section>
  )
}

type CastingCall = {
  casting_id: number
  state: string
  date?: string
  title?: string
  department?: string
  skill?: string
  region?: string
  description?: string
  compensation?: string
  deadline?: string
}

type StudioMessage = {
  message_id: number
  person_id: number
  state: string
  date?: string
  subject?: string
  message?: string
  name?: string
  email?: string
  telephone?: string
  casting_id?: number | null
}

const castingInputClass =
  'h-10 w-full rounded-md border border-white/10 bg-[#111317] px-3 text-sm text-white outline-none transition placeholder:text-sand-100/25 focus:border-teal-300/50 focus:ring-2 focus:ring-teal-300/10'

//Casting calls: the studio half of "studios looking for actors". A person sees the open ones on
//their own dashboard and answers through /person/contact, which lands in Messages below.
function CastingWorkspace({ routeId }: { routeId: string }) {
  const [calls, setCalls] = useState<CastingCall[]>([])
  const [messages, setMessages] = useState<StudioMessage[]>([])
  const [departments, setDepartments] = useState<Options[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [form, setForm] = useState({
    title: '',
    department: '',
    skill: '',
    region: '',
    compensation: '',
    deadline: '',
    description: '',
  })

  const endpoint = (dev: string, live: string) =>
    import.meta.env.VITE_ENVIRONMENT === 'development' ? dev : live

  const loadCalls = async () => {
    try {
      const res = await fetch(endpoint(import.meta.env.VITE_CASTING, import.meta.env.VITE_CASTING_LIVE), {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': import.meta.env.VITE_API_KEY,
        },
      })

      const { status, data } = await res.json()
      if (status) setCalls(data)
    } catch (error) {
      console.log(error, 'error')
    }
  }

  const loadMessages = async () => {
    try {
      const res = await fetch(endpoint(import.meta.env.VITE_STUDIO_MESSAGES, import.meta.env.VITE_STUDIO_MESSAGES_LIVE), {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': import.meta.env.VITE_API_KEY,
        },
      })

      const { status, data } = await res.json()
      if (status) setMessages(data)
    } catch (error) {
      console.log(error, 'error')
    }
  }

  useEffect(() => {
    if (routeId === 'calls') loadCalls()
    if (routeId === 'messages') loadMessages()
    if (routeId === 'post') {
      (async () => {
        try {
          const res = await fetch(endpoint(import.meta.env.VITE_FETCH_DEPARTMENT, import.meta.env.VITE_FETCH_DEPARTMENT_LIVE), {
            method: 'GET',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': import.meta.env.VITE_API_KEY,
            },
          })

          const { status, data } = await res.json()
          if (status) setDepartments(data)
        } catch (error) {
          console.log(error, 'error')
        }
      })()
    }
  }, [routeId])

  const postCall = async () => {
    if (!form.title || !form.department) {
      toast.error('A casting call needs a title and a department')
      return
    }

    setLoading(true)
    try {
      const res = await fetch(endpoint(import.meta.env.VITE_CASTING_INSERT, import.meta.env.VITE_CASTING_INSERT_LIVE), {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': import.meta.env.VITE_API_KEY,
        },
        body: JSON.stringify(form),
      })

      const { status, message, error } = await res.json()
      setLoading(false)

      if (status) {
        toast.success(message)
        setForm({ title: '', department: '', skill: '', region: '', compensation: '', deadline: '', description: '' })
        return
      }
      toast.error(error || message)
    } catch (error) {
      setLoading(false)
      console.log(error, 'error')
      toast.error('Could not post the casting call')
    }
  }

  const toggleCall = async (id: number, state: string) => {
    try {
      const res = await fetch(endpoint(import.meta.env.VITE_CASTING_CLOSE, import.meta.env.VITE_CASTING_CLOSE_LIVE), {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': import.meta.env.VITE_API_KEY,
        },
        body: JSON.stringify({ id, state: state === 'open' ? 'closed' : 'open' }),
      })

      const { status, message } = await res.json()
      if (status) {
        toast.success(message)
        loadCalls()
        return
      }
      toast.error(message)
    } catch (error) {
      console.log(error, 'error')
      toast.error('Could not update the casting call')
    }
  }

  const markRead = async (id: number) => {
    try {
      const res = await fetch(endpoint(import.meta.env.VITE_STUDIO_MESSAGES_READ, import.meta.env.VITE_STUDIO_MESSAGES_READ_LIVE), {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': import.meta.env.VITE_API_KEY,
        },
        body: JSON.stringify({ id }),
      })

      const { status } = await res.json()
      if (status) loadMessages()
    } catch (error) {
      console.log(error, 'error')
    }
  }

  if (routeId === 'post') {
    return (
      <section className="rounded-lg border border-white/10 bg-white/[0.035] p-5">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-md border border-clay-300/25 bg-clay-500/15 text-clay-200">
            <Megaphone className="size-5" />
          </span>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-clay-400">Casting</p>
            <h2 className="text-lg font-semibold text-white">Post a casting call</h2>
          </div>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <label className="grid gap-2">
            <span className="text-sm font-medium text-sand-100/70">Role title</span>
            <input
              className={castingInputClass}
              placeholder="Lead actress, Yung Forces"
              value={form.title}
              onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
            />
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-medium text-sand-100/70">Department</span>
            <select
              className={castingInputClass}
              value={form.department}
              onChange={(e) => setForm((prev) => ({ ...prev, department: e.target.value }))}
            >
              <option value="">Select a department</option>
              {departments.map((department, index) => (
                <option key={index} value={String(department.label)}>
                  {department.label}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-medium text-sand-100/70">Skill</span>
            <input
              className={castingInputClass}
              placeholder="Stunt driving, Swahili dialogue"
              value={form.skill}
              onChange={(e) => setForm((prev) => ({ ...prev, skill: e.target.value }))}
            />
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-medium text-sand-100/70">Region</span>
            <input
              className={castingInputClass}
              placeholder="Kenya"
              value={form.region}
              onChange={(e) => setForm((prev) => ({ ...prev, region: e.target.value }))}
            />
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-medium text-sand-100/70">Compensation</span>
            <input
              className={castingInputClass}
              placeholder="KES 40,000 per shoot day"
              value={form.compensation}
              onChange={(e) => setForm((prev) => ({ ...prev, compensation: e.target.value }))}
            />
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-medium text-sand-100/70">Apply before</span>
            <input
              type="date"
              className={castingInputClass}
              value={form.deadline}
              onChange={(e) => setForm((prev) => ({ ...prev, deadline: e.target.value }))}
            />
          </label>

          <label className="grid gap-2 md:col-span-2">
            <span className="text-sm font-medium text-sand-100/70">Description</span>
            <textarea
              rows={5}
              className="w-full rounded-md border border-white/10 bg-[#111317] px-3 py-2 text-sm text-white outline-none transition placeholder:text-sand-100/25 focus:border-teal-300/50 focus:ring-2 focus:ring-teal-300/10"
              placeholder="What the role asks for, shoot dates, location"
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
            />
          </label>
        </div>

        <button
          type="button"
          disabled={loading}
          onClick={postCall}
          className="mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-md bg-clay-500 px-4 text-sm font-bold text-white transition hover:bg-clay-400 disabled:opacity-50"
        >
          <Plus className="size-4" />
          {loading ? 'Posting...' : 'Post casting call'}
        </button>
      </section>
    )
  }

  if (routeId === 'messages') {
    return (
      <section className="grid gap-3">
        {messages.length === 0 ? (
          <EmptyPanel
            icon={Mail}
            title="No messages yet"
            description="People who answer a casting call, or who just want to reach this studio, land here."
          />
        ) : (
          messages.map((message) => (
            <article
              key={message.message_id}
              className="rounded-lg border border-white/10 bg-white/[0.035] p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white">{message.subject}</p>
                  <p className="mt-1 text-xs text-sand-100/45">
                    {message.name || `Person ${message.person_id}`}
                    {message.email ? ` / ${message.email}` : ''}
                    {message.telephone ? ` / ${message.telephone}` : ''}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => markRead(message.message_id)}
                  className={`inline-flex h-8 items-center gap-2 rounded-md border px-3 text-xs transition ${
                    message.state === 'unread'
                      ? 'border-clay-400/45 bg-clay-500/15 text-white hover:bg-clay-500/25'
                      : 'border-white/10 text-sand-100/45'
                  }`}
                >
                  {message.state === 'unread' ? <Mail className="size-3.5" /> : <MailOpen className="size-3.5" />}
                  {message.state === 'unread' ? 'Mark read' : 'Read'}
                </button>
              </div>
              <p className="mt-3 whitespace-pre-line text-sm text-sand-100/70">{message.message}</p>
              {message.casting_id ? (
                <p className="mt-3 text-xs text-sand-100/38">Answering casting call #{message.casting_id}</p>
              ) : null}
            </article>
          ))
        )}
      </section>
    )
  }

  return (
    <section className="grid gap-3">
      {calls.length === 0 ? (
        <EmptyPanel
          icon={Megaphone}
          title="No casting calls yet"
          description="Post a call and every person on Eden sees it on their dashboard, sorted by their own department."
        />
      ) : (
        calls.map((call) => (
          <article key={call.casting_id} className="rounded-lg border border-white/10 bg-white/[0.035] p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white">{call.title}</p>
                <p className="mt-1 text-xs text-sand-100/45">
                  {[call.department, call.skill, call.region].filter(Boolean).join(' / ')}
                </p>
              </div>
              <button
                type="button"
                onClick={() => toggleCall(call.casting_id, call.state)}
                className={`inline-flex h-8 items-center gap-2 rounded-md border px-3 text-xs transition ${
                  call.state === 'open'
                    ? 'border-teal-300/25 bg-teal-300/10 text-teal-200 hover:bg-teal-300/20'
                    : 'border-white/10 text-sand-100/45 hover:bg-white/[0.06]'
                }`}
              >
                {call.state === 'open' ? 'Open - close it' : 'Closed - reopen'}
              </button>
            </div>
            {call.description ? (
              <p className="mt-3 whitespace-pre-line text-sm text-sand-100/70">{call.description}</p>
            ) : null}
            <p className="mt-3 text-xs text-sand-100/38">
              {[call.compensation, call.deadline ? `apply before ${call.deadline}` : ''].filter(Boolean).join(' / ')}
            </p>
          </article>
        ))
      )}
    </section>
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

function QualificationRow({ label, value, complete }: { label: string; value: string; complete: boolean }) {
  const Icon = complete ? CheckCircle2 : Circle

  return (
    <div className="flex items-center justify-between gap-3 rounded-md border border-white/10 bg-[#111317] px-3 py-3">
      <div className="flex items-center gap-3">
        <Icon className={`size-4 ${complete ? 'text-teal-200' : 'text-sand-100/35'}`} />
        <span className="text-sm font-medium text-white">{label}</span>
      </div>
      <span className="text-xs text-sand-100/45">{value}</span>
    </div>
  )
}

function createRows(seedRows: MediaRow[], type: string) {
  return Array.from({ length: 20 }, (_, index) => {
    const seed = seedRows[index % seedRows.length]
    const pageNumber = index + 1
    const suffix = pageNumber <= seedRows.length ? '' : ` ${pageNumber}`

    return {
      ...seed,
      id: seed.id + index,
      title: `${seed.title}${suffix}`,
      share: seed.share.replace(String(seed.id), String(seed.id + index)),
      badge: seed.badge || type,
    }
  })
}
