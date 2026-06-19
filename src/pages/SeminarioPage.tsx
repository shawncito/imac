import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { MapPin, Mic } from 'lucide-react'
import { useConfig } from '../lib/config'
import { SEMINARIOS_KEY, defaultSeminarios, SEMINAR_ICONS, type Seminar } from '../lib/appData'

const ACCENT = '#FF5A1F'

export default function SeminarioPage({
  initialOpen = null,
  onOpened,
}: {
  initialOpen?: number | null
  onOpened?: () => void
}) {
  const seminars = useConfig<Seminar[]>(SEMINARIOS_KEY, defaultSeminarios)
  const [open, setOpen] = useState<number | null>(initialOpen ?? null)

  useEffect(() => {
    if (initialOpen !== null && initialOpen !== undefined) {
      setOpen(initialOpen)
      onOpened?.()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialOpen])

  return (
    <div className="tab-scroll">
      <header className="page-head">
        <div className="page-kicker" style={{ color: ACCENT }}>Sábado 27 · 2:00–4:30 pm</div>
        <h1 className="page-title">Seminarios</h1>
        <p className="page-sub">Tres expositores simultáneos en el Salón de Actos. Pasaporte 2 en Israel Leito.</p>
      </header>

      {seminars.length === 0 && (
        <p className="page-sub" style={{ textAlign: 'center', padding: '40px 0' }}>No hay seminarios disponibles.</p>
      )}

      <div className="sem-list">
        {seminars.map((s, i) => {
          const Icon = SEMINAR_ICONS[s.icon] ?? Mic
          const isOpen = open === i
          const tbc = (s.speaker || '').toLowerCase().includes('confirmar') || !s.speaker

          return (
            <motion.div
              key={i}
              className="sem-card"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.28, delay: i * 0.05, ease: 'easeOut' }}
            >
              {/* ── Collapsed header ── */}
              <button
                className="sem-head"
                onClick={() => setOpen(isOpen ? null : i)}
                aria-expanded={isOpen}
              >
                {/* Photo: visible in header only when CLOSED */}
                {s.speakerPhoto && !isOpen && (
                  <motion.img
                    layoutId={`speaker-photo-${i}`}
                    src={s.speakerPhoto}
                    alt={s.speaker}
                    className="sem-head-photo"
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                    transition={{ type: 'spring', stiffness: 340, damping: 32 }}
                  />
                )}


                <div className="sem-body">
                  <h3 className="sem-title">{s.title}</h3>
                  <div className="sem-speaker-row">
                    {!tbc && <span className="sem-speaker-name">{s.speaker}</span>}
                    {s.room && (
                      <>
                        <span className="sem-room-sep">·</span>
                        <span className="sem-room"><MapPin size={11} />{s.room}</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="sem-glyph" style={{ color: ACCENT, opacity: isOpen ? 0.3 : 0.85 }}>
                  <Icon size={24} strokeWidth={1.6} />
                </div>

                <motion.div
                  animate={{ rotate: isOpen ? 180 : 0 }}
                  transition={{ duration: 0.25 }}
                  style={{ color: 'rgba(255,255,255,0.35)', flexShrink: 0, display: 'flex' }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </motion.div>
              </button>

              {/* ── Expanded detail ── */}
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    className="sem-detail"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: [0.22, 0.61, 0.36, 1] }}
                  >
                    <div className="sem-detail-inner">

                      {/* Speaker block — photo slides in from header position */}
                      {s.speakerPhoto && (
                        <div className="sem-detail-speaker">
                          <motion.img
                            layoutId={`speaker-photo-${i}`}
                            src={s.speakerPhoto}
                            alt={s.speaker}
                            className="sem-detail-photo"
                            onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                            transition={{ type: 'spring', stiffness: 340, damping: 32 }}
                          />
                          <div>
                            <div className="sem-detail-name">{s.speaker}</div>
                            <div className="sem-detail-role">Expositor</div>
                          </div>
                        </div>
                      )}

                      {s.description
                        ? <p className="sem-desc">{s.description}</p>
                        : <p className="sem-desc" style={{ color: 'var(--faint)' }}>Descripción próximamente.</p>}

                      {s.room && (
                        <div className="sem-field">
                          <MapPin size={14} />
                          <span className="lbl">Ubicación:</span>
                          <span className="val">{s.room}</span>
                        </div>
                      )}

                      {s.mapUrl
                        ? <div className="sem-map"><img src={s.mapUrl} alt={`Mapa: ${s.room}`} loading="lazy" /></div>
                        : <div className="sem-map-empty"> Mapa del campus próximamente</div>}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )
        })}
      </div>

      <div className="prog-end" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, marginTop: 8 }}>
        <img src="/logo-instituto-misionero.png" alt="Instituto Misionero UNADECA" style={{ height: 44, width: 'auto', opacity: 0.85 }}
          onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
        <span>Servicio Voluntario Adventista · UNADECA</span>
      </div>
      <p className="swipe-hint">Desliza para cambiar de sección</p>
    </div>
  )
}
