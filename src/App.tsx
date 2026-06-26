import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import type { PanInfo } from 'motion/react'
import { CalendarDays, Users, BookOpen, Mic, Home, Play } from 'lucide-react'
import { usePlayer } from './hooks/usePlayer'
import ActivityPage from './pages/ActivityPage'
import SeminarioPage from './pages/SeminarioPage'
import ProgramaPage from './pages/ProgramaPage'
import MisionesPage from './pages/MisionesPage'
import InicioPage from './pages/InicioPage'
import AdminPage from './pages/AdminPage'
import WorldBackdrop from './components/WorldBackdrop'
import logoIM from './assets/logo.webp'

type Tab = 'inicio' | 'misiones' | 'programa' | 'seminario' | 'actividad'

const tabOrder: Tab[] = ['inicio', 'programa', 'seminario', 'actividad']
const tabs = [
  { id: 'inicio'    as Tab, label: 'Inicio',    Icon: Home },
  { id: 'programa'  as Tab, label: 'Programa',  Icon: CalendarDays },
  { id: 'seminario' as Tab, label: 'Seminario', Icon: Users },
  { id: 'actividad' as Tab, label: 'Actividad', Icon: BookOpen },
]


function WaveBars() {
  return (
    <div className="flex items-center gap-[3px] h-[13px]">
      {[0, 1, 2, 3].map(i => (
        <div key={i} className="wave-bar h-full" style={{ animationDelay: `${i * 0.15}s` }} />
      ))}
    </div>
  )
}

export default function App() {
  const [tab, setTab]           = useState<Tab>('inicio')
  const [prev, setPrev]         = useState<Tab>('inicio')
  const [isAdmin, setIsAdmin]   = useState(window.location.hash === '#admin')
  const [openSeminar, setOpenSeminar] = useState<number | null>(null)

  // Global media player — persists across page navigation
  const player = usePlayer()
  const voicePlaying = player.isPlaying && !player.isPaused

  // ----- Scroll Direction: Hide Header (motion.dev) -----
  const pagerRef = useRef<HTMLDivElement>(null)
  const headerRef = useRef<HTMLElement>(null)
  const [hideHeader, setHideHeader] = useState(false)
  const [headerH, setHeaderH] = useState(0)
  const lastScrollY = useRef(0)

  useLayoutEffect(() => {
    if (headerRef.current) setHeaderH(headerRef.current.offsetHeight)
  }, [])

  useEffect(() => {
    const el = pagerRef.current
    if (!el) return
    const onScroll = (e: Event) => {
      const t = e.target as HTMLElement
      if (!(t instanceof HTMLElement) || !t.classList.contains('tab-scroll')) return
      const y = t.scrollTop
      if (y > lastScrollY.current && y > 60) setHideHeader(true)
      else if (y < lastScrollY.current - 4) setHideHeader(false)
      lastScrollY.current = y
    }
    el.addEventListener('scroll', onScroll, true) // captura: scroll no burbujea
    return () => el.removeEventListener('scroll', onScroll, true)
  }, [])

  // reset al cambiar de pestaña (nuevo contenedor de scroll desde 0)
  useEffect(() => { setHideHeader(false); lastScrollY.current = 0 }, [tab])

  useEffect(() => {
    const handler = () => setIsAdmin(window.location.hash === '#admin')
    window.addEventListener('hashchange', handler)
    return () => window.removeEventListener('hashchange', handler)
  }, [])

  function go(id: Tab) {
    if (id === tab) return
    setPrev(tab)
    setTab(id)
  }

  function handleVoz() {
    // Active track → toggle pause/resume in place (don't navigate).
    if (player.isActive) { player.togglePlay(); return }
    // Idle → go to Actividad and start playing.
    go('actividad')
    player.play()
  }

  function handleSwipe(_: unknown, info: PanInfo) {
    const { offset, velocity } = info
    if (Math.abs(offset.x) < Math.abs(offset.y) * 1.2) return
    const cur = tabOrder.indexOf(tab)
    if ((offset.x < -45 || velocity.x < -350) && cur < tabOrder.length - 1) go(tabOrder[cur + 1])
    else if ((offset.x > 45 || velocity.x > 350) && cur > 0) go(tabOrder[cur - 1])
  }

  const direction = tabOrder.indexOf(tab) > tabOrder.indexOf(prev) ? 1 : -1

  if (isAdmin) return <AdminPage />

  return (
    <div className="screen bg-misionero">
      <WorldBackdrop showPlane={tab === 'inicio' || tab === 'misiones'} />

      <motion.header
        ref={headerRef}
        className="appbar"
        initial={false}
        animate={{ y: (hideHeader && !player.isActive) ? -headerH : 0 }}
        transition={{ duration: 0.35, ease: [0.22, 0.61, 0.36, 1] }}
      >
        <div className="appbar-scrim" aria-hidden />
        <img src={logoIM} alt="Instituto Misionero" className="brand-logo im" />
        <button
          className={'voz' + (player.isActive ? ' active' : '')}
          onClick={handleVoz}
          aria-label={voicePlaying ? 'Pausar' : player.isPaused ? 'Reanudar' : 'Escuchar versículo'}
          style={{ marginLeft: 'auto' }}
        >
          {voicePlaying
            ? <WaveBars />
            : player.isPaused
              ? <Play size={17} fill="currentColor" stroke="none" style={{ marginLeft: 1 }} />
              : <Mic size={18} />}
          <span className="vlabel">VOZ</span>
        </button>
      </motion.header>

      {/* Pager */}
      <motion.div ref={pagerRef} className="pager" onPanEnd={handleSwipe}>
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            className="absolute inset-0 flex flex-col"
            initial={{ x: direction * 46, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: direction * -46, opacity: 0 }}
            transition={{ duration: 0.24, ease: [0.22, 0.61, 0.36, 1] }}
          >
            {tab === 'inicio'    && (
              <InicioPage onGoToMisiones={() => go('misiones')} />
            )}
            {tab === 'misiones'  && (
              <MisionesPage />
            )}
            {tab === 'programa'  && <ProgramaPage />}
            {tab === 'seminario' && (
              <SeminarioPage initialOpen={openSeminar} onOpened={() => setOpenSeminar(null)} />
            )}
            {tab === 'actividad' && (
              <ActivityPage player={player} />
            )}
          </motion.div>
        </AnimatePresence>
      </motion.div>

      {/* Bottom tab bar */}
      <nav className="tabbar">
        {tabs.map(({ id, label, Icon }) => {
          const active = tab === id
          return (
            <button
              key={id}
              onClick={() => go(id)}
              className={'tabitem' + (active ? ' active' : '')}
            >
              {active && (
                <motion.span
                  layoutId="tab-ind"
                  className="ti-ind"
                  transition={{ type: 'spring', stiffness: 500, damping: 38 }}
                />
              )}
              <span className="ti-icon"><Icon size={23} strokeWidth={active ? 2 : 1.7} /></span>
              <span className="ti-label">{label}</span>
            </button>
          )
        })}
      </nav>
    </div>
  )
}
