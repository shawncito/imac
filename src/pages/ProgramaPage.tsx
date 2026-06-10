import { useEffect, useRef } from 'react'
import { motion } from 'motion/react'
import { MapPin, Check, Zap, Clock } from 'lucide-react'
import { useConfig, useNow } from '../lib/config'
import {
  PROGRAMA_KEY, SETTINGS_KEY, defaultPrograma, defaultSettings,
  eventStatus, parseEventTimes, type DayBlock, type Settings,
} from '../lib/appData'

const ACCENT = '#FF5A1F'

function fmtCountdown(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export default function ProgramaPage() {
  const schedule = useConfig<DayBlock[]>(PROGRAMA_KEY, defaultPrograma)
  const settings = useConfig<Settings>(SETTINGS_KEY, defaultSettings)
  const now = useNow(settings.demoTime)
  const nowRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  // On mount, scroll the container so the current/next event is visible.
  useEffect(() => {
    if (!nowRef.current || !scrollRef.current) return
    const container = scrollRef.current
    const target = nowRef.current
    const offset = target.getBoundingClientRect().top - container.getBoundingClientRect().top
    container.scrollTo({ top: container.scrollTop + offset - 120, behavior: 'smooth' })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [/* run once on mount */])

  // Find active event (now) or next upcoming event for the sticky bar
  type BarInfo = { title: string; msLeft: number; mode: 'now' | 'next' }
  let barInfo: BarInfo | null = null
  outer: for (const d of schedule) {
    for (const e of d.events) {
      const status = eventStatus(e, d.isoDate, now)
      if (status === 'now') {
        const times = parseEventTimes(e, d.isoDate)
        barInfo = { title: e.title, msLeft: times.end.getTime() - now.getTime(), mode: 'now' }
        break outer
      }
      if (status === 'next' && !barInfo) {
        const times = parseEventTimes(e, d.isoDate)
        barInfo = { title: e.title, msLeft: times.start.getTime() - now.getTime(), mode: 'next' }
        // don't break — keep scanning in case there's a 'now' event later
      }
    }
  }

  // Track whether we've already placed the nowRef on the first now/next card
  let nowRefPlaced = false
  let row = 0
  return (
    <div className="tab-scroll" ref={scrollRef}>
      {/* Sticky bar: shows active event + countdown, or next event + time until */}
      {barInfo && (
        <div className="prog-now-bar">
          <span className={'prog-now-dot' + (barInfo.mode === 'next' ? ' prog-now-dot--next' : '')} />
          <div className="prog-now-info">
            <span className="prog-now-label" style={barInfo.mode === 'next' ? { color: 'var(--muted)' } : undefined}>
              {barInfo.mode === 'now' ? 'Ahora' : 'Próximo'}
            </span>
            <span className="prog-now-title">{barInfo.title}</span>
          </div>
          {barInfo.msLeft > 0 && (
            <span className="prog-now-mins">
              <Clock size={11} />
              <span style={{ fontVariantNumeric: 'tabular-nums' }}>
                {barInfo.mode === 'now' ? 'Termina en ' : 'Empieza en '}
                {fmtCountdown(barInfo.msLeft)}
              </span>
            </span>
          )}
        </div>
      )}

      <header className="page-head">
        <div className="page-kicker" style={{ color: ACCENT }}>Festival de Misiones 2026</div>
        <h1 className="page-title">Programa</h1>
        <p className="page-sub">Dos días de adoración, formación y servicio.</p>
      </header>

      {schedule.map((d, di) => {
        const pastCount = d.events.filter(e => eventStatus(e, d.isoDate, now) === 'past').length
        const progress = d.events.length > 0 ? pastCount / d.events.length : 0
        const hasActiveDay = d.events.some(e => eventStatus(e, d.isoDate, now) === 'now')
        let shownNextBadge = false

        return (
          <section className="prog-day" key={di}>
            <div className="prog-day-head">
              <span className="prog-day-chip" style={{
                color: ACCENT, borderColor: ACCENT,
                background: hasActiveDay ? `color-mix(in srgb, ${ACCENT} 18%, transparent)` : undefined,
              }}>{d.short}</span>
              <div style={{ flex: 1 }}>
                <div className="prog-day-name">{d.day}</div>
                <div className="prog-day-date">{d.date}</div>
              </div>
              {/* Day progress */}
              {progress > 0 && (
                <span className="prog-day-pct" style={{ color: ACCENT }}>
                  {Math.round(progress * 100)}%
                </span>
              )}
            </div>

            {/* Progress bar under day header */}
            {d.events.length > 0 && (
              <div className="prog-day-progress">
                <motion.div
                  className="prog-day-progress-fill"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress * 100}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                />
              </div>
            )}

            <div className="prog-rail">
              {d.events.map((e, ei) => {
                const i = row++
                const status = eventStatus(e, d.isoDate, now)
                const isNextUp = status === 'next' && !shownNextBadge
                if (isNextUp) shownNextBadge = true

                // Attach scroll target to first now or (if none) first next card
                const isAnchor = (status === 'now' || (status === 'next' && !nowRefPlaced && !schedule.some(
                  dd => dd.events.some(ev => eventStatus(ev, dd.isoDate, now) === 'now')
                ))) && !nowRefPlaced
                if (isAnchor) nowRefPlaced = true

                // How far through the current event (0–1) for the rail gradient split
                let evPct: string | undefined
                if (status === 'now') {
                  const times = parseEventTimes(e, d.isoDate)
                  const total = times.end.getTime() - times.start.getTime()
                  const elapsed = now.getTime() - times.start.getTime()
                  evPct = `${Math.round(Math.min(1, Math.max(0, elapsed / total)) * 100)}%`
                }

                return (
                  <motion.div
                    key={ei}
                    ref={isAnchor ? nowRef : undefined}
                    className={['prog-card', e.featured ? 'featured' : '', status].join(' ')}
                    style={evPct ? { '--ev-pct': evPct } as React.CSSProperties : undefined}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.22, delay: Math.min(i * 0.03, 0.3), ease: 'easeOut' }}
                  >
                    <div className="prog-time">
                      <span className="prog-from">{e.from}</span>
                      <span className="prog-to">{e.to} <i>{e.ampm === 'md' ? 'md' : e.ampm}</i></span>
                    </div>

                    {/* Dot — varies by status */}
                    <div className={'prog-dot prog-dot--' + status} />

                    <div className="prog-content">
                      <h3 className="prog-title">
                        {status === 'past' && (
                          <span className="prog-check"><Check size={12} /></span>
                        )}
                        {status === 'now' && (
                          <Zap size={14} style={{ color: ACCENT, flexShrink: 0 }} />
                        )}
                        <span>{e.title}</span>
                        {status === 'now' && <span className="now-badge" style={{ marginLeft: 'auto' }}>Ahora</span>}
                        {isNextUp && <span className="next-badge">Próximo</span>}
                      </h3>
                      {(e.place || e.tag) && (
                        <div className="prog-tags">
                          {e.place && <span className="prog-place"><MapPin size={12} />{e.place}</span>}
                          {e.tag && <span className="prog-tag" style={{ color: ACCENT, borderColor: ACCENT }}>{e.tag}</span>}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )
              })}

            </div>
          </section>
        )
      })}

      <div className="prog-end">Servicio Voluntario Adventista</div>
    </div>
  )
}
