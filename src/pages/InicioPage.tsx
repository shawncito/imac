import { useEffect, useRef, useState } from 'react'
import { useScroll, useMotionValueEvent } from 'motion/react'
import { flightProgress } from '../lib/flightProgress'
import { useSpeech } from '../hooks/useSpeech'
import VerseBoard from '../components/VerseBoard'
import logoHand from '../assets/logo-hand.png'
import vividFaithLogo from '../assets/vividfaith-logo.svg'
import misiones2026 from '../assets/misiones2026.jpeg'

const ACCENT = '#FF5A1F'
const TARGET = new Date('2026-06-26T19:30:00')


type Props = {
  onGoToMisiones: () => void
  onSpeakChange?: (playing: boolean) => void
}

export default function InicioPage({ onGoToMisiones, onSpeakChange }: Props) {
  const [remaining, setRemaining] = useState(() => Math.max(0, TARGET.getTime() - Date.now()))
  const containerRef = useRef<HTMLDivElement>(null)
  const { isPlaying } = useSpeech()

  const { scrollYProgress } = useScroll({ container: containerRef })
  useMotionValueEvent(scrollYProgress, 'change', v => flightProgress.set(v))

  useEffect(() => {
    if (onSpeakChange) onSpeakChange(isPlaying)
  }, [isPlaying, onSpeakChange])

  useEffect(() => {
    function tick() { setRemaining(Math.max(0, TARGET.getTime() - Date.now())) }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  const d = Math.floor(remaining / 86400000)
  const h = String(Math.floor((remaining % 86400000) / 3600000)).padStart(2, '0')
  const m = String(Math.floor((remaining % 3600000) / 60000)).padStart(2, '0')
  const s = String(Math.floor((remaining % 60000) / 1000)).padStart(2, '0')

  return (
    <div ref={containerRef} className="tab-scroll" style={{ paddingLeft: 0, paddingRight: 0, paddingTop: 0 }}>

      {/* Hero + countdown — imagen pendiente */}
      <div style={{ position: 'relative', width: '100%', height: 296 }}>
        {/* placeholder: imagen/logo irá aquí */}

        <div style={{
          position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'flex-end', textAlign: 'center',
          padding: '0 24px 4px',
          background: 'linear-gradient(to bottom, transparent 40%, rgba(8,14,34,0.85) 85%, #080e22 100%)',
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: ACCENT }}>
            El viaje hacia la misión
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 4 }}>
            <span style={{ fontFamily: 'var(--serif)', fontSize: 76, fontWeight: 400, lineHeight: 0.95, fontVariantNumeric: 'tabular-nums' }}>
              {d}
            </span>
            <span style={{ fontFamily: 'var(--serif)', fontSize: 30, fontWeight: 400, color: '#8d8c93' }}>días</span>
          </div>
          <div style={{ fontSize: 12, color: '#8d8c93', fontVariantNumeric: 'tabular-nums', letterSpacing: 0.5, marginTop: 2 }}>
            {h} h · {m} m · {s} s — para la inauguración
          </div>
        </div>
      </div>

      <div style={{ padding: '14px 20px 28px' }}>

        {/* Date + place pill */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16,
          background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.11)',
          borderRadius: 100, padding: '11px 18px', marginBottom: 26,
        }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 600 }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect width="18" height="18" x="3" y="4" rx="2" /><path d="M3 10h18M8 2v4M16 2v4" />
            </svg>
            26–27 Junio
          </span>
          <span style={{ width: 1, height: 14, background: 'rgba(255,255,255,0.15)', display: 'inline-block' }} />
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 600 }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z" /><circle cx="12" cy="10" r="3" />
            </svg>
            Iglesia UNADECA
          </span>
        </div>

        {/* Pizarra compartida de versículos */}
        <VerseBoard />

        {/* Section label */}
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.8, textTransform: 'uppercase', color: ACCENT, marginBottom: 13 }}>
          Escalas del festival
        </div>

        {/* SVA — display card con logo + descripción */}
        <div style={{
          background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.11)',
          borderRadius: 24, padding: '20px 20px 18px', marginBottom: 12, textAlign: 'left',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.8, textTransform: 'uppercase', color: ACCENT, marginBottom: 4 }}>SVA</div>
              <div style={{ fontFamily: 'var(--serif)', fontSize: 22, fontWeight: 500, lineHeight: 1.15, color: '#F4F1EB' }}>
                Servicio Voluntario<br />Adventista
              </div>
            </div>
            <img src={logoHand} alt="Maranatha" style={{ height: 50, width: 'auto', objectFit: 'contain', flexShrink: 0, marginLeft: 12 }} />
          </div>
          <div style={{ fontSize: 13.5, lineHeight: 1.65, color: 'rgba(244,241,235,0.68)', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <p style={{ margin: 0 }}>El Servicio Voluntario Adventista (SVA), es un programa oficial de la Iglesia Adventista que brinda oportunidades para que personas de diferentes edades sirvan voluntariamente en proyectos misioneros, educativos, de salud, comunitarios y humanitarios alrededor del mundo, a corto, mediano o largo plazo.</p>
            <p style={{ margin: 0 }}>El programa busca demostrar el evangelio a través de acciones concretas de amor, solidaridad y compromiso con el bienestar integral de las personas.</p>
          </div>
        </div>

        {/* Compact rows */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 26 }}>

          {/* Misión Amanecer — imagen grande original */}
          <button
            onClick={onGoToMisiones}
            className="ini-mision-card"
            style={{
              display: 'block', position: 'relative', width: '100%', height: 156,
              borderRadius: 20, overflow: 'hidden',
              border: `1px solid color-mix(in srgb, ${ACCENT} 28%, rgba(255,255,255,0.1))`,
              cursor: 'pointer', padding: 0, background: 'none',
              boxShadow: `0 0 0 0 color-mix(in srgb, ${ACCENT} 20%, transparent), 0 12px 32px -12px rgba(0,0,0,0.6)`,
            }}
          >
            <img
              src={misiones2026} alt="Misión Amanecer"
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 60%', display: 'block' }}
            />
            {/* Fuerte gradiente izquierda + abajo para máximo contraste */}
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(120deg,rgba(4,10,28,0.92) 0%,rgba(4,10,28,0.65) 55%,rgba(4,10,28,0.25) 100%)' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top,rgba(4,10,28,0.7) 0%,transparent 45%)' }} />
            <div style={{ position: 'absolute', inset: 0, padding: '18px 20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', textAlign: 'left' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,90,31,0.22)', border: '1px solid rgba(255,90,31,0.45)', borderRadius: 100, padding: '4px 10px', width: 'fit-content' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" /><path d="M2 12h20" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                </svg>
                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', color: ACCENT }}>Misión Amanecer</span>
              </div>
              <div>
                <div style={{ fontFamily: 'var(--serif)', fontSize: 24, fontWeight: 500, color: '#F4F1EB', lineHeight: 1.1, marginBottom: 5, textShadow: '0 1px 8px rgba(0,0,0,0.6)' }}>La historia y el llamado</div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11.5, fontWeight: 700, color: ACCENT }}>
                  Ver más
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
                </div>
              </div>
            </div>
          </button>

          {/* Vivid Faith — card estilo SVA */}
          <div style={{
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.11)',
            borderRadius: 20, padding: '20px 20px 18px', textAlign: 'left',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.8, textTransform: 'uppercase', color: 'rgba(244,241,235,0.45)', marginBottom: 4 }}>Plataforma</div>
                <div style={{ fontFamily: 'var(--serif)', fontSize: 22, fontWeight: 500, lineHeight: 1.15, color: '#F4F1EB' }}>
                  ¿Dejarías tu zona<br />de confort?
                </div>
              </div>
              <div style={{
                width: 68, height: 68, borderRadius: 16, flexShrink: 0, marginLeft: 12,
                background: '#fff', display: 'grid', placeItems: 'center', padding: 7,
              }}>
                <img src={vividFaithLogo} alt="Vivid Faith" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              </div>
            </div>
            <p style={{ fontSize: 13.5, lineHeight: 1.65, color: 'rgba(244,241,235,0.68)', margin: '0 0 14px' }}>
              La plataforma de Vivid Faith vincula a cada misionero con diferentes oportunidades de proyectos misioneros y voluntariados en distintas partes del mundo. Busca las opciones que existen y deja que Dios cumpla sus planes en ti.
            </p>
            <a
              href="https://vividfaith.com/"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                color: ACCENT, fontSize: 13, fontWeight: 700, textDecoration: 'none',
                letterSpacing: 0.3,
                borderBottom: `1px solid color-mix(in srgb, ${ACCENT} 35%, transparent)`,
                paddingBottom: 1,
              }}
            >
              Ver oportunidades
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
            </a>
          </div>

        </div>

        {/* Instagram */}
        <a
          href="https://www.instagram.com/sva_unadeca?igsh=MW9pNTNuOTA4eWFmMg=="
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'flex', alignItems: 'center', gap: 14, textDecoration: 'none',
            color: '#F4F1EB', padding: '14px 16px', borderRadius: 16,
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.10)',
          }}
        >
          <div style={{
            width: 42, height: 42, borderRadius: 12, flexShrink: 0,
            background: 'linear-gradient(135deg,#f09433 0%,#e6683c 25%,#dc2743 50%,#cc2366 75%,#bc1888 100%)',
            display: 'grid', placeItems: 'center',
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
              <circle cx="12" cy="12" r="4" />
              <circle cx="17.5" cy="6.5" r="1" fill="white" stroke="none" />
            </svg>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13.5, fontWeight: 700, marginBottom: 3 }}>@sva_unadeca</div>
            <p style={{ fontSize: 12.5, lineHeight: 1.55, color: 'rgba(244,241,235,0.55)', margin: 0 }}>
              Novedades del SVA UNADECA.
            </p>
          </div>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.3, flexShrink: 0 }}><path d="m9 6 6 6-6 6" /></svg>
        </a>

        {/* Footer */}
        <div className="prog-end" style={{ marginTop: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
          <img src="/logo-instituto-misionero.png" alt="Instituto Misionero UNADECA" style={{ height: 44, width: 'auto', opacity: 0.85 }}
            onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
          <span>Servicio Voluntario Adventista · UNADECA</span>
        </div>

      </div>
    </div>
  )
}
