/* Shared types + default (seed) content + config keys.
   Defaults mirror the SQL seed so the app renders fully even before
   Supabase responds (or if it never does). */

import { HeartHandshake, Globe, Sparkles, Building2, type LucideIcon } from 'lucide-react'

// ---- Programa ---------------------------------------------------------------
export type ProgramaEvent = {
  from: string   // "8:00"
  to: string     // "9:15"
  ampm: string   // "am" | "pm" | "md"
  title: string
  place?: string
  tag?: string
  featured?: boolean
}

export type DayBlock = {
  day: string      // "Sábado"
  date: string     // "27 de Junio"
  short: string    // "SÁB"
  isoDate: string  // "2026-06-27" — anchors the live timeline
  events: ProgramaEvent[]
}

export const PROGRAMA_KEY = 'programa'
export const SEMINARIOS_KEY = 'seminarios'
export const SETTINGS_KEY = 'settings'

export const defaultPrograma: DayBlock[] = [
  {
    day: 'Viernes', date: '26 de Junio', short: 'VIE', isoDate: '2026-06-26',
    events: [
      { from: '6:30', to: '8:00', ampm: 'pm', title: 'Inauguración Festival de Misiones 2026', place: 'Iglesia UNADECA', featured: true },
    ],
  },
  {
    day: 'Sábado', date: '27 de Junio', short: 'SÁB', isoDate: '2026-06-27',
    events: [
      { from: '8:00',  to: '9:15',  ampm: 'am', title: 'Inscripciones' },
      { from: '9:00',  to: '10:50', ampm: 'am', title: 'Programa de Escuela Sabática' },
      { from: '11:00', to: '12:00', ampm: 'md', title: 'Culto Divino', place: 'Iglesia UNADECA', featured: true },
      { from: '12:00', to: '2:00',  ampm: 'pm', title: 'Almuerzo' },
      { from: '2:00',  to: '3:00',  ampm: 'pm', title: 'Seminario 1', tag: 'Seminarios' },
      { from: '3:00',  to: '4:00',  ampm: 'pm', title: 'Seminario 2', tag: 'Seminarios' },
      { from: '4:15',  to: '6:15',  ampm: 'pm', title: 'Programa de graduación', featured: true },
      { from: '6:30',  to: '9:00',  ampm: 'pm', title: 'Social' },
    ],
  },
]

// ---- Seminarios -------------------------------------------------------------
export type Seminar = {
  icon: string      // key into SEMINAR_ICONS
  title: string
  room: string
  speaker: string
  speakerPhoto: string  // URL to speaker photo
  description: string
  mapUrl: string
}

export const SEMINAR_ICONS: Record<string, LucideIcon> = {
  hands: HeartHandshake,
  globe: Globe,
  spark: Sparkles,
  city: Building2,
}
export const SEMINAR_ICON_KEYS = Object.keys(SEMINAR_ICONS)

export const defaultSeminarios: Seminar[] = [
  { icon: 'hands', title: 'El poder del servicio', room: '', speaker: 'Dra. Fylvia Klane',      speakerPhoto: '/speakers/fylvia_copy.jpg.jpeg',             description: '', mapUrl: '' },
  { icon: 'globe', title: 'Viviendo la misión',    room: '', speaker: 'Pr. Ricardo Marín',      speakerPhoto: '/speakers/ricardo-marin-gcs2025.jpg.jpeg',   description: '', mapUrl: '' },
  { icon: 'spark', title: 'Misión transcultural',  room: '', speaker: 'Pr. Samuel Telemaque',   speakerPhoto: '/speakers/s_telemaque.jpg.jpeg',             description: '', mapUrl: '' },
]

// ---- Settings ---------------------------------------------------------------
export type Settings = {
  demoTime: string | null   // ISO string or null (use real time)
}

export const defaultSettings: Settings = { demoTime: null }

// ---- Live timeline helpers --------------------------------------------------
export type EventStatus = 'past' | 'now' | 'next'

/** Parse an event's start/end into Date objects anchored on isoDate. */
export function parseEventTimes(ev: ProgramaEvent, isoDate: string): { start: Date; end: Date } {
  return { start: parseClock(ev.from, ev.ampm, isoDate), end: parseClock(ev.to, ev.ampm, isoDate) }
}

function parseClock(hhmm: string, ampm: string, isoDate: string): Date {
  if (!hhmm) return new Date(isoDate + 'T00:00:00')
  const [hStr, mStr] = hhmm.split(':')
  let h = parseInt(hStr, 10)
  const m = parseInt(mStr ?? '0', 10)
  const p = ampm.toLowerCase()
  // md = mediodía (noon). pm adds 12 except 12pm. am 12 → 0.
  if (p === 'md') h = 12
  else if (p === 'pm' && h !== 12) h += 12
  else if (p === 'am' && h === 12) h = 0
  const d = new Date(isoDate + 'T00:00:00')
  d.setHours(h, m, 0, 0)
  return d
}

/** Status of an event relative to `now`. */
export function eventStatus(ev: ProgramaEvent, isoDate: string, now: Date): EventStatus {
  if (!ev?.from || !ev?.to) return 'next'
  const { start, end } = parseEventTimes(ev, isoDate)
  if (now >= end) return 'past'
  if (now >= start && now < end) return 'now'
  return 'next'
}
