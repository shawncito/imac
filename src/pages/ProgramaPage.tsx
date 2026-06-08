import { MapPin, Clock } from 'lucide-react'
import { SVALogoFull } from '../components/SVALogo'

type Event = {
  time: string
  title: string
  location?: string
  highlight?: boolean
}

type DayBlock = {
  day: string
  date: string
  events: Event[]
}

const schedule: DayBlock[] = [
  {
    day: 'Viernes',
    date: '26 de junio',
    events: [
      {
        time: '6:30 – 8:00 pm',
        title: 'Inauguración Festival de Misiones 2026',
        location: 'Iglesia UNADECA',
        highlight: true,
      },
    ],
  },
  {
    day: 'Sábado',
    date: '27 de junio',
    events: [
      { time: '8:00 – 9:15 am',  title: 'Inscripciones' },
      { time: '9:00 – 10:50 am', title: 'Programa de Escuela Sabática' },
      { time: '11:00 – 12:00 md', title: 'Culto Divino', location: 'Iglesia UNADECA', highlight: true },
      { time: '12:00 – 2:00 pm', title: 'Almuerzo' },
      { time: '2:00 – 3:00 pm',  title: 'Seminario 1', location: '4 salones simultáneos' },
      { time: '3:00 – 4:00 pm',  title: 'Seminario 2', location: '4 salones simultáneos' },
      { time: '4:15 – 6:15 pm',  title: 'Programa de graduación', highlight: true },
      { time: '6:30 – 9:00 pm',  title: 'Social' },
    ],
  },
]

export default function ProgramaPage() {
  return (
    <div className="flex flex-col bg-[oklch(96%_0.006_250)] min-h-[calc(100dvh-72px)]">

      {/* Header */}
      <div className="bg-[oklch(11%_0.01_250)] px-5 pt-12 pb-10 rounded-b-[14px]">
        <SVALogoFull className="mb-5" />
        <h1 className="text-white font-bold text-[22px] leading-tight">Programa</h1>
        <p className="text-white/40 text-[13px] mt-1">Festival de Misiones 2026</p>
      </div>

      {/* Schedule */}
      <div className="px-4 pt-5 pb-6 flex flex-col gap-5">
        {schedule.map((block) => (
          <section key={block.day}>
            {/* Day header */}
            <div className="flex items-baseline gap-2 mb-3 px-1">
              <h2 className="text-[oklch(12%_0.01_250)] font-bold text-[18px]">{block.day}</h2>
              <span className="text-black/35 text-[13px] font-medium">{block.date}</span>
            </div>

            {/* Events */}
            <div className="flex flex-col gap-2">
              {block.events.map((ev, i) => (
                <div
                  key={i}
                  className={[
                    'rounded-[18px] px-4 py-3.5 flex flex-col gap-1.5',
                    ev.highlight
                      ? 'bg-[oklch(11%_0.01_250)] shadow-[0_4px_20px_rgba(0,0,0,0.2)]'
                      : 'bg-white shadow-[0_2px_10px_rgba(0,0,0,0.06)] border border-black/[0.05]',
                  ].join(' ')}
                >
                  <div className="flex items-center gap-1.5">
                    <Clock className={`w-3 h-3 flex-shrink-0 ${ev.highlight ? 'text-[#F05A24]' : 'text-[oklch(55%_0.14_82)]'}`} />
                    <span className={`text-[11px] font-bold tracking-wide ${ev.highlight ? 'text-[#F05A24]' : 'text-[oklch(55%_0.14_82)]'}`}>
                      {ev.time}
                    </span>
                  </div>
                  <p className={`font-semibold text-[15px] leading-snug ${ev.highlight ? 'text-white' : 'text-[oklch(12%_0.01_250)]'}`}>
                    {ev.title}
                  </p>
                  {ev.location && (
                    <div className="flex items-center gap-1.5">
                      <MapPin className={`w-3 h-3 flex-shrink-0 ${ev.highlight ? 'text-white/40' : 'text-black/25'}`} />
                      <span className={`text-[12px] ${ev.highlight ? 'text-white/50' : 'text-black/40'}`}>
                        {ev.location}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
