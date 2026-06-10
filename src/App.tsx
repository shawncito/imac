import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import type { PanInfo } from 'motion/react'
import { CalendarDays, Users, BookOpen, Mic, Globe } from 'lucide-react'
import ActivityPage from './pages/ActivityPage'
import SeminarioPage from './pages/SeminarioPage'
import ProgramaPage from './pages/ProgramaPage'
import MisionesPage from './pages/MisionesPage'
import AdminPage from './pages/AdminPage'
import WorldBackdrop from './components/WorldBackdrop'
import logoIM from './assets/logo.webp'

type Tab = 'misiones' | 'programa' | 'seminario' | 'actividad'

const tabOrder: Tab[] = ['misiones', 'programa', 'seminario', 'actividad']
const tabs = [
  { id: 'misiones'  as Tab, label: 'Misiones',  Icon: Globe },
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
  const [tab, setTab]           = useState<Tab>('misiones')
  const [prev, setPrev]         = useState<Tab>('misiones')
  const [isAdmin, setIsAdmin]   = useState(window.location.hash === '#admin')
  const [playSignal, setPlaySignal] = useState(0)
  const [voicePlaying, setVoicePlaying] = useState(false)
  const [openSeminar, setOpenSeminar] = useState<number | null>(null)

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
    go('actividad')
    setPlaySignal(s => s + 1)
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
      <WorldBackdrop showPlane={tab === 'misiones'} />

      <header className="appbar">
        <img src={logoIM} alt="Instituto Misionero" className="brand-logo im" />
        <button className="voz" onClick={handleVoz} aria-label="Escuchar versículo" style={{ marginLeft: 'auto' }}>
          {voicePlaying ? <WaveBars /> : <Mic size={18} />}
          <span className="vlabel">VOZ</span>
        </button>
      </header>

      {/* Pager */}
      <motion.div className="pager" onPanEnd={handleSwipe}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={tab}
            className="absolute inset-0 flex flex-col"
            initial={{ x: direction * 46, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: direction * -46, opacity: 0 }}
            transition={{ duration: 0.24, ease: [0.22, 0.61, 0.36, 1] }}
          >
            {tab === 'misiones'  && (
              <MisionesPage />
            )}
            {tab === 'programa'  && <ProgramaPage />}
            {tab === 'seminario' && (
              <SeminarioPage initialOpen={openSeminar} onOpened={() => setOpenSeminar(null)} />
            )}
            {tab === 'actividad' && (
              <ActivityPage playSignal={playSignal} onPlayingChange={setVoicePlaying} />
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
