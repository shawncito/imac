import { useState } from 'react'
import { BookOpen, Users, CalendarDays } from 'lucide-react'
import ActivityPage from './pages/ActivityPage'
import SeminarioPage from './pages/SeminarioPage'
import ProgramaPage from './pages/ProgramaPage'

type Tab = 'actividad' | 'seminario' | 'programa'

const tabs = [
  { id: 'actividad' as Tab, label: 'Actividad',  Icon: BookOpen },
  { id: 'seminario' as Tab, label: 'Seminario',  Icon: Users },
  { id: 'programa'  as Tab, label: 'Programa',   Icon: CalendarDays },
]

export default function App() {
  const [tab, setTab] = useState<Tab>('actividad')

  return (
    <div className="min-h-dvh flex flex-col bg-[oklch(96%_0.006_250)]">

      {/* Page content */}
      <div className="flex-1 overflow-y-auto pb-[72px]">
        {tab === 'actividad' && <ActivityPage />}
        {tab === 'seminario' && <SeminarioPage />}
        {tab === 'programa'  && <ProgramaPage />}
      </div>

      {/* Bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 h-[72px] bg-[oklch(11%_0.01_250)] border-t border-white/[0.07] flex items-center justify-around px-2 z-40">
        {tabs.map(({ id, label, Icon }) => {
          const active = tab === id
          return (
            <button
              key={id}
              onClick={() => setTab(id)}
              className="flex flex-col items-center gap-1 py-2 px-6 active:scale-90 transition-transform"
            >
              <Icon
                className={`w-[22px] h-[22px] transition-colors ${
                  active ? 'text-[#F05A24]' : 'text-white/30'
                }`}
              />
              <span
                className={`text-[10px] font-semibold tracking-wide uppercase transition-colors ${
                  active ? 'text-[#F05A24]' : 'text-white/30'
                }`}
              >
                {label}
              </span>
            </button>
          )
        })}
      </nav>
    </div>
  )
}
