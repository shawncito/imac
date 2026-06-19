import { useRef, useState } from 'react'
import { motion, useScroll, useTransform, useMotionValueEvent } from 'motion/react'
import { ChevronRight, ExternalLink, ArrowRight } from 'lucide-react'
import { flightProgress } from '../lib/flightProgress'

const ACCENT = '#FF5A1F'

// ─── 2026 gallery images ─────────────────────────────────────────────────────
const GALLERY_2026: string[] = Array.from({ length: 14 }, (_, i) =>
  `/2026/foto-${String(i + 1).padStart(2, '0')}.jpg`
)

const INSTAGRAM_URL = 'https://www.instagram.com/sva_unadeca?igsh=MW9pNTNuOTA4eWFmMg=='

// ─── Mission text paragraphs ─────────────────────────────────────────────────
const PARAGRAPHS = [
  'Misión Amanecer es un proyecto que nace el 2023 en el Instituto Misionero de la UNADECA. Su propósito es crear instancias de misión para los jóvenes en la universidad.',
  'Dentro de estos proyectos se realizan actividades como trabajos comunitarios, visitas a hogar de ancianos, apoyo a las iglesias locales, ferias de salud, impacto esperanza, entre otros, con el fin de que todos los dones y servicios se pongan al servicio de Dios y de la humanidad.',
]

const REGISTRATION_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSfIXm-e4Q37_ojAakDkegu3oXziN1NKLMB0QrPMqaubgKyv8g/viewform?usp=preview'

// ─── Card Stack ───────────────────────────────────────────────────────────────
function CardStack({ images }: { images: string[] }) {
  const [top, setTop] = useState(0)
  const count = images.length

  function next() { setTop(i => (i + 1) % count) }
  function prev() { setTop(i => (i - 1 + count) % count) }

  return (
    <div className="mis-stack-wrap">
      <div className="mis-stack" onClick={next} role="button" tabIndex={0}
        onKeyDown={e => e.key === 'Enter' && next()} aria-label="Siguiente foto">
        {images.map((src, i) => {
          const offset = (i - top + count) % count
          const visible = offset < 4
          return (
            <motion.div
              key={src}
              className="mis-stack-card"
              animate={{
                zIndex: count - offset,
                y: offset * 10,
                x: offset * 4,
                rotate: (offset % 2 === 0 ? 1 : -1) * offset * 1.2,
                scale: 1 - offset * 0.04,
                opacity: offset > 3 ? 0 : 1,
              }}
              transition={{ type: 'spring', stiffness: 320, damping: 32 }}
              style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
            >
              {visible && (
                <img src={src} alt={`Misión 2026 · foto ${i + 1}`}
                  className="mis-stack-img"
                  onError={e => { (e.target as HTMLImageElement).src = '/hero.png' }} />
              )}
            </motion.div>
          )
        })}
      </div>
      <div className="mis-stack-controls">
        <button onClick={prev} className="mis-stack-btn">←</button>
        <span className="mis-stack-count">{top + 1} / {count}</span>
        <button onClick={next} className="mis-stack-btn">→</button>
      </div>
      <p className="mis-stack-hint">Toca para ver más fotos</p>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function MisionesPage({ onSpeakerTap }: { onSpeakerTap?: (i: number) => void }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const heroRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })
  const { scrollYProgress: pageProgress } = useScroll({ container: containerRef })

  // Feed page scroll to the global backdrop, which flies the plane along the route.
  useMotionValueEvent(pageProgress, 'change', v => flightProgress.set(v))

  const imgScale   = useTransform(scrollYProgress, [0, 1], [1, 1.22])
  const imgY       = useTransform(scrollYProgress, [0, 1], ['0%', '18%'])
  const heroOpacity = useTransform(scrollYProgress, [0, 0.65], [1, 0])
  const heroY      = useTransform(scrollYProgress, [0, 1], ['0%', '-14%'])

  return (
    <div className="tab-scroll mis-page" ref={containerRef}>


      {/* ── 1. Scroll Zoom Hero ─────────────────────────────────────────── */}
      <div ref={heroRef} className="mis-hero">
        <motion.div className="mis-hero-img-wrap" style={{ scale: imgScale, y: imgY }}>
          <img
            src="/2026/hero-misiones.jpg"
            alt="Misión Amanecer"
            className="mis-hero-img"
            onError={e => { (e.target as HTMLImageElement).src = '/hero.png' }}
          />
          <div className="mis-hero-vignette" />
        </motion.div>

        {/* Floating title — fades out as you scroll down */}
        <motion.div className="mis-hero-content" style={{ opacity: heroOpacity, y: heroY }}>
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
          >
            <span className="mis-hero-kicker">Servicio Voluntario Adventista</span>
            <h1 className="mis-hero-title">Misión<br />Amanecer</h1>
          </motion.div>
          <motion.div className="mis-hero-scroll-hint"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }}>
            <motion.div
              animate={{ y: [0, 6, 0] }}
              transition={{ repeat: Infinity, duration: 1.6, ease: 'easeInOut' }}>
              <ChevronRight size={20} style={{ transform: 'rotate(90deg)', color: ACCENT }} />
            </motion.div>
            <span>Desliza para descubrir</span>
          </motion.div>
        </motion.div>
      </div>

      {/* ── 2. Reveal text ──────────────────────────────────────────────── */}
      <div className="mis-body">
        <motion.div
          className="page-kicker"
          style={{ color: ACCENT }}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5 }}
        >
          ¿Qué es?
        </motion.div>

        {PARAGRAPHS.map((p, i) => (
          <motion.p
            key={i}
            className="mis-para"
            initial={{ opacity: 0, y: 36 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.55, delay: i * 0.08, ease: [0.22, 0.61, 0.36, 1] }}
          >
            {p}
          </motion.p>
        ))}

        {/* Stats row */}
        <div className="mis-stats">
          {[
            { n: '50+', label: 'Voluntarios' },
            { n: '7',   label: 'Días de misión' },
            { n: '∞',   label: 'Vidas impactadas' },
          ].map((s, i) => (
            <motion.div key={i} className="mis-stat"
              initial={{ opacity: 0, scale: 0.88 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}>
              <span className="mis-stat-n" style={{ color: ACCENT }}>{s.n}</span>
              <span className="mis-stat-lbl">{s.label}</span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ── 3. Card Stack — 2026 gallery ────────────────────────────────── */}
      <div className="mis-section">
        <motion.div
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.5 }}>
          <span className="page-kicker" style={{ color: ACCENT }}>Galería</span>
          <h2 className="mis-section-title">Misión Amanecer 2026</h2>
          <p className="page-sub mis-section-sub">El Salvador · Junio 2026</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.15 }}>
          <CardStack images={GALLERY_2026} />
        </motion.div>
      </div>

      {/* ── 5. CTA Misión Amanecer 2027 ─────────────────────────────────── */}
      <motion.div className="mis-cta"
        initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }} transition={{ duration: 0.6 }}>
        <span className="page-kicker" style={{ color: ACCENT }}>Próxima edición</span>
        <h2 className="mis-cta-title">Misión Amanecer 2027</h2>
        <p className="mis-cta-sub">
          Si te gusta hacer misión mediante este tipo de actividades y estás interesado
          en participar en el próximo Misión Amanecer, regístrate en el siguiente link.
        </p>
        <a
          href={REGISTRATION_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="mis-btn-primary"
          style={{ background: ACCENT }}
        >
          Inscribirme <ArrowRight size={16} />
        </a>
      </motion.div>

      {/* ── 6. VividFaith ────────────────────────────────────────────────── */}
      <motion.div className="mis-vivid"
        initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }} transition={{ duration: 0.5 }}>
        <div className="mis-vivid-inner">
          <img src="/vivid-faith.png" alt="VividFaith" className="mis-vivid-logo"
            onError={e => { (e.target as HTMLImageElement).style.opacity = '0' }} />
          <div>
            <h3 className="mis-vivid-title">¿Dejarías tu zona de confort?</h3>
            <p className="mis-vivid-sub">
              La plataforma de Vivid Faith vincula a cada misionero con diferentes oportunidades
              de proyectos misioneros y voluntariados en distintas partes del mundo.
              Busca las diferentes opciones que existen y deja que Dios cumpla sus planes en ti.
            </p>
            <a href="https://vividfaith.com/" target="_blank" rel="noopener noreferrer"
              className="mis-vivid-link">
              Ver oportunidades <ExternalLink size={13} />
            </a>
          </div>
        </div>
      </motion.div>

      {/* ── 7. Instagram ─────────────────────────────────────────────────── */}
      <motion.div className="mis-vivid"
        initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }} transition={{ duration: 0.5 }}>
        <div className="mis-vivid-inner">
          <div style={{ width: 44, height: 44, borderRadius: 14, background: 'linear-gradient(135deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
              <circle cx="12" cy="12" r="4"/>
              <circle cx="17.5" cy="6.5" r="1" fill="#fff" stroke="none"/>
            </svg>
          </div>
          <div>
            <h3 className="mis-vivid-title">Síguenos en Instagram</h3>
            <p className="mis-vivid-sub">
              Mantente al día con todas las novedades del Servicio Voluntario Adventista UNADECA.
            </p>
            <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer"
              className="mis-vivid-link">
              @sva_unadeca <ExternalLink size={13} />
            </a>
          </div>
        </div>
      </motion.div>

      <div className="prog-end" style={{ marginTop: 8, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
        <img src="/logo-icon.webp" alt="UNADECA Instituto Misionero" style={{ height: 36, width: 'auto', opacity: 0.6 }}
          onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
        <span>Servicio Voluntario Adventista · UNADECA</span>
      </div>
    </div>
  )
}
