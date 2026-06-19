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
      { from: '7:30', to: '9:00', ampm: 'pm', title: 'Inauguración Festival de Misiones 2026', place: 'Iglesia UNADECA', featured: true },
    ],
  },
  {
    day: 'Sábado', date: '27 de Junio', short: 'SÁB', isoDate: '2026-06-27',
    events: [
      { from: '8:00',  to: '9:15',  ampm: 'am', title: 'Inscripciones' },
      { from: '9:00',  to: '10:50', ampm: 'am', title: 'Programa de Escuela Sabática' },
      { from: '11:00', to: '12:00', ampm: 'md', title: 'Culto Divino', place: 'Iglesia UNADECA', featured: true },
      { from: '12:00', to: '2:00',  ampm: 'pm', title: 'Almuerzo' },
      { from: '2:00',  to: '4:30',  ampm: 'pm', title: 'Seminarios', place: 'Salón de Actos', tag: 'Seminarios', featured: false },
      { from: '2:00',  to: '4:30',  ampm: 'pm', title: 'Pasaporte 2', place: 'Israel Leito', tag: 'Pasaporte 2' },
      { from: '4:30',  to: '6:15',  ampm: 'pm', title: 'Programa de graduación', featured: true },
      { from: '7:00',  to: '9:00',  ampm: 'pm', title: 'Social' },
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
  {
    icon: 'hands',
    title: 'El poder del servicio',
    room: 'Salón de Actos',
    speaker: 'Dra. Fylvia Fowler Kline',
    speakerPhoto: '/speakers/fylvia_copy.jpg.jpeg',
    description: 'Fylvia Fowler Kline es una líder adventista, estratega de comunicación y promotora de la misión global, reconocida por su labor como administradora y directora de la plataforma VividFaith, el sistema oficial de reclutamiento misionero de la Iglesia Adventista del Séptimo Día a nivel mundial. Kline posee una Maestría en Artes por la Universidad de Pune, India, y cuenta con una amplia trayectoria en administración de organizaciones sin fines de lucro, estrategia empresarial, marketing y comunicación. La experiencia que más ha marcado su vida fue su servicio como misionera en Nepal durante un período de conflicto civil. Como escritora, conferencista y líder misionera, continúa inspirando a miembros de iglesia de todas las edades a involucrarse activamente en la misión global.',
    mapUrl: '',
  },
  {
    icon: 'globe',
    title: 'Viviendo la misión',
    room: 'Salón de Actos',
    speaker: 'Pr. Ricardo Marín',
    speakerPhoto: '/speakers/ricardo-marin-gcs2025.jpg.jpeg',
    description: 'El pastor Ricardo Marín Salas es un destacado líder de la Iglesia Adventista del Séptimo Día en Centroamérica y actualmente se desempeña como presidente de la Unión de Costa Rica. Graduado en Teología por la Universidad Adventista de Nicaragua y poseedor de una maestría en Ministerio Pastoral otorgada por el Seminario Teológico Adventista Interamericano (SETAI), Marín ha dedicado varias décadas al servicio ministerial en distintos países de Centroamérica. A lo largo de su liderazgo ha impulsado iniciativas enfocadas en la misión, incluyendo programas de apoyo a comunidades indígenas, alfabetización basada en la Biblia, ministerios de salud, comunicación y evangelización integral.',
    mapUrl: '',
  },
  {
    icon: 'spark',
    title: 'Misión transcultural',
    room: 'Salón de Actos',
    speaker: 'Pr. Samuel Telemaque',
    speakerPhoto: '/speakers/s_telemaque.jpg.jpeg',
    description: 'El pastor Samuel Telemaque es uno de los principales líderes misioneros de la Iglesia Adventista del Séptimo Día en el territorio de la División Interamericana (DIA). Reconocido por su énfasis en la misión transcultural, la plantación de iglesias y la capacitación de líderes para alcanzar grupos poblacionales no evangelizados. Su formación académica incluye estudios avanzados en teología y un doctorado en Misionología con énfasis en estudios interculturales. Su ministerio ha estado marcado por el llamado constante a que cada creyente participe en la misión de alcanzar a "toda nación, tribu, lengua y pueblo".',
    mapUrl: '',
  },
  {
    icon: 'city',
    title: 'Instituto Mundial de Misiones',
    room: 'Israel Leito · Pasaporte 2',
    speaker: 'Pr. Ronald Kuhn',
    speakerPhoto: '/speakers/ronald-kuhn.jpeg',
    description: 'El pastor Ronald Kuhn es un destacado líder y misionólogo de la Iglesia Adventista del Séptimo Día. Nacido en el sur de Brasil y criado en una familia agrícola, desarrolló desde temprana edad una profunda vocación de servicio cristiano. Mientras cursaba estudios de Teología, decidió interrumpir temporalmente su formación para participar en el programa de Estudiantes Misioneros, realizando un viaje a Ruanda en 1985. Ha servido como director asociado del Instituto Mundial de Misiones (Institute of World Mission), organismo encargado de preparar y orientar a misioneros, familias misioneras y obreros interculturales que sirven en diferentes regiones del mundo.',
    mapUrl: '',
  },
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
