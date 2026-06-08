import { MapPin, User } from 'lucide-react'
import { SVALogoFull } from '../components/SVALogo'

const seminars = [
  {
    title: 'El poder del servicio',
    location: 'Salón multimedia',
    speaker: '',
    emoji: '🎬',
  },
  {
    title: 'Misión transcultural',
    location: 'Aula 1 AAA',
    speaker: '',
    emoji: '🌍',
  },
  {
    title: 'Living the mission',
    location: 'Salón de actos',
    speaker: '',
    emoji: '✝️',
  },
  {
    title: 'Misión Urbana',
    location: 'Salón Israel Leito',
    speaker: '',
    emoji: '🏙️',
  },
]

export default function SeminarioPage() {
  return (
    <div className="flex flex-col bg-[oklch(96%_0.006_250)] min-h-[calc(100dvh-72px)]">

      {/* Header */}
      <div className="bg-[oklch(11%_0.01_250)] px-5 pt-12 pb-10 rounded-b-[14px]">
        <SVALogoFull className="mb-5" />
        <h1 className="text-white font-bold text-[22px] leading-tight">Seminarios</h1>
        <p className="text-white/40 text-[13px] mt-1">Sábado 27 de junio · 2:00 – 4:00 pm</p>
      </div>

      {/* Cards */}
      <div className="px-4 pt-5 pb-6 flex flex-col gap-3">
        {seminars.map((s, i) => (
          <article
            key={i}
            className="bg-white rounded-[20px] shadow-[0_4px_20px_rgba(0,0,0,0.08)] border border-black/[0.06] px-5 py-4 flex flex-col gap-3"
          >
            <div className="flex items-start gap-3">
              <span className="text-[32px] leading-none mt-0.5">{s.emoji}</span>
              <div className="flex-1">
                <p className="text-[oklch(55%_0.14_82)] text-[10px] font-bold tracking-[0.18em] uppercase mb-1">
                  Seminario {i + 1}
                </p>
                <h2 className="text-[oklch(12%_0.01_250)] font-bold text-[17px] leading-snug">
                  {s.title}
                </h2>
              </div>
            </div>

            <div className="flex flex-col gap-2 pl-[44px]">
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-[oklch(55%_0.14_82)] flex-shrink-0" />
                <span className="text-[13px] text-black/60 font-medium">{s.location}</span>
              </div>
              <div className="flex items-center gap-2">
                <User className="w-3.5 h-3.5 text-black/25 flex-shrink-0" />
                {s.speaker ? (
                  <span className="text-[13px] text-black/70 font-medium">{s.speaker}</span>
                ) : (
                  <span className="text-[13px] text-black/25 italic">Ponente por confirmar</span>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
