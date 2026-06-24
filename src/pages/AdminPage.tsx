import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import {
  Plus, Trash2, ChevronUp, ChevronDown, Save, LogOut, Check,
  Loader2, Lock, Clock, CalendarDays, Users, Settings as SettingsIcon,
  ExternalLink, Info, MapPin, Mic, MessageSquareQuote, EyeOff,
} from 'lucide-react'
import {
  getConfig, setConfig, uploadImage,
  getAllVerseSubmissions, hideSubmission, unhideSubmission, deleteSubmission, type VerseSubmission,
} from '../lib/supabase'
import {
  PROGRAMA_KEY, SEMINARIOS_KEY, SETTINGS_KEY,
  defaultPrograma, defaultSeminarios, defaultSettings,
  SEMINAR_ICON_KEYS, type DayBlock, type ProgramaEvent, type Seminar, type Settings,
} from '../lib/appData'

const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD as string
const ACCENT = '#FF5A1F'

// ─── primitives ──────────────────────────────────────────────────────────────
function Field({ label, value, onChange, placeholder, wide, hint }: {
  label: string; value: string; onChange: (v: string) => void
  placeholder?: string; wide?: boolean; hint?: string
}) {
  return (
    <div className={'flex flex-col gap-1' + (wide ? ' col-span-2' : '')}>
      <label className="text-[10px] font-bold tracking-widest uppercase text-black/35 flex items-center gap-1">
        {label}
        {hint && <span className="text-[9px] font-normal normal-case text-black/25 tracking-normal">· {hint}</span>}
      </label>
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="border border-black/[0.10] rounded-xl px-3 py-2.5 text-[14px] text-[#14110b] bg-white focus:outline-none focus:ring-2 focus:ring-[#FF5A1F]/25 focus:border-[#FF5A1F]/40 placeholder:text-black/20 transition-shadow"
      />
    </div>
  )
}

function DateField({ label, value, onChange }: {
  label: string; value: string; onChange: (v: string) => void
}) {
  return (
    <div className="flex flex-col gap-1 col-span-2">
      <label className="text-[10px] font-bold tracking-widest uppercase text-black/35 flex items-center gap-1">
        {label}
        <span className="text-[9px] font-normal normal-case text-black/25 tracking-normal">· para la línea de tiempo en vivo</span>
      </label>
      <input
        type="date"
        value={value}
        onChange={e => onChange(e.target.value)}
        className="border border-black/[0.10] rounded-xl px-3 py-2.5 text-[14px] text-[#14110b] bg-white focus:outline-none focus:ring-2 focus:ring-[#FF5A1F]/25 focus:border-[#FF5A1F]/40 transition-shadow"
      />
    </div>
  )
}

function AmpmSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[10px] font-bold tracking-widest uppercase text-black/35">Período</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="border border-black/[0.10] rounded-xl px-3 py-2.5 text-[14px] text-[#14110b] bg-white focus:outline-none focus:ring-2 focus:ring-[#FF5A1F]/25 focus:border-[#FF5A1F]/40 transition-shadow"
      >
        <option value="am">am — mañana</option>
        <option value="pm">pm — tarde</option>
        <option value="md">md — mediodía 12:00</option>
      </select>
    </div>
  )
}

function Area({ label, value, onChange, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string
}) {
  return (
    <div className="flex flex-col gap-1 col-span-2">
      <label className="text-[10px] font-bold tracking-widest uppercase text-black/35">{label}</label>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        rows={3}
        className="border border-black/[0.10] rounded-xl px-3 py-2.5 text-[14px] text-[#14110b] bg-white focus:outline-none focus:ring-2 focus:ring-[#FF5A1F]/25 placeholder:text-black/20 resize-y"
      />
    </div>
  )
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-[12px] font-semibold border transition-all duration-150"
      style={value
        ? { background: ACCENT, color: '#fff', borderColor: 'transparent', boxShadow: `0 2px 8px ${ACCENT}40` }
        : { background: 'rgba(0,0,0,0.04)', color: 'rgba(0,0,0,0.4)', borderColor: 'rgba(0,0,0,0.08)' }}
    >
      {value && <Check className="w-3 h-3" />}{label}
    </button>
  )
}

function IconBtn({ onClick, danger, children }: { onClick: () => void; danger?: boolean; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className={['p-1.5 rounded-lg transition-colors', danger ? 'text-red-400 hover:bg-red-50' : 'text-black/30 hover:bg-black/[0.06]'].join(' ')}>
      {children}
    </button>
  )
}

function SectionInfo({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 bg-[#FF5A1F]/[0.06] border border-[#FF5A1F]/[0.14] rounded-2xl px-3.5 py-3 mb-4">
      <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: ACCENT }} />
      <p className="text-[12px] text-black/50 leading-relaxed">{children}</p>
    </div>
  )
}

/** File-picker that uploads to Supabase Storage and returns the public URL via onUrl. */
function ImageUpload({
  label, currentUrl, storagePath, onUrl,
}: {
  label: string
  currentUrl: string
  storagePath: string
  onUrl: (url: string) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [err, setErr] = useState('')

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setErr('')
    try {
      const ext = file.name.split('.').pop() ?? 'jpg'
      const path = `${storagePath}.${ext}`
      const url = await uploadImage(file, path)
      onUrl(url)
    } catch (ex) {
      setErr((ex as Error).message)
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div className="flex flex-col gap-1 col-span-2">
      <label className="text-[10px] font-bold tracking-widest uppercase text-black/35">{label}</label>
      <div className="flex items-center gap-2 flex-wrap">
        {currentUrl && (
          <img
            src={currentUrl}
            alt="preview"
            className="w-14 h-14 rounded-xl object-cover border border-black/[0.08] shrink-0"
          />
        )}
        <label
          className="flex items-center gap-2 px-3 py-2 rounded-xl border border-dashed text-[13px] font-semibold cursor-pointer transition-colors"
          style={{
            color: uploading ? 'rgba(0,0,0,0.3)' : ACCENT,
            borderColor: uploading ? 'rgba(0,0,0,0.1)' : `${ACCENT}50`,
            background: uploading ? 'rgba(0,0,0,0.03)' : `${ACCENT}07`,
          }}
        >
          {uploading
            ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Subiendo…</>
            : <><Plus className="w-3.5 h-3.5" />{currentUrl ? 'Cambiar imagen' : 'Subir imagen'}</>
          }
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            disabled={uploading}
            onChange={handleFile}
          />
        </label>
        {currentUrl && !uploading && (
          <input
            value={currentUrl}
            onChange={e => onUrl(e.target.value)}
            placeholder="URL de imagen"
            className="flex-1 min-w-0 border border-black/[0.10] rounded-xl px-3 py-2 text-[12px] text-[#14110b] bg-white focus:outline-none focus:ring-2 focus:ring-[#FF5A1F]/25 placeholder:text-black/20"
          />
        )}
      </div>
      {err && <p className="text-[11px] text-red-500">{err}</p>}
    </div>
  )
}

function move<T>(arr: T[], i: number, dir: -1 | 1): T[] {
  const j = i + dir
  if (j < 0 || j >= arr.length) return arr
  const next = [...arr]
  ;[next[i], next[j]] = [next[j], next[i]]
  return next
}

// ─── Programa editor ──────────────────────────────────────────────────────────
function ProgramaEditor({ data, onChange }: { data: DayBlock[]; onChange: (d: DayBlock[]) => void }) {
  const setDay = (i: number, patch: Partial<DayBlock>) => onChange(data.map((d, x) => x === i ? { ...d, ...patch } : d))
  const setEv = (di: number, ei: number, patch: Partial<ProgramaEvent>) =>
    onChange(data.map((d, x) => x === di ? { ...d, events: d.events.map((e, y) => y === ei ? { ...e, ...patch } : e) } : d))
  const addDay = () => onChange([...data, { day: 'Nuevo día', date: '', short: 'DÍA', isoDate: '', events: [] }])

  return (
    <div className="flex flex-col gap-4">
      <SectionInfo>
        Edita los días y eventos del programa. La línea de tiempo en vivo usa la fecha ISO para saber qué evento está ocurriendo ahora mismo. Guarda para que los cambios se reflejen al instante en todos los dispositivos.
      </SectionInfo>

      <button onClick={addDay}
        className="flex items-center justify-center gap-2 text-[14px] font-semibold border-2 border-dashed rounded-[20px] py-3"
        style={{ color: ACCENT, borderColor: `${ACCENT}40` }}>
        <Plus className="w-4 h-4" /> Agregar día
      </button>

      {data.map((block, di) => (
        <motion.div key={di} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}
          className="bg-white rounded-[20px] border border-black/[0.07] shadow-sm overflow-hidden">

          {/* Day header */}
          <div className="bg-[#f5f3ef] px-4 py-3 flex items-center gap-3 border-b border-black/[0.06]">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center text-[11px] font-bold shrink-0"
              style={{ background: `${ACCENT}18`, color: ACCENT, border: `1px solid ${ACCENT}40` }}>
              {block.short || di + 1}
            </div>
            <div className="grid grid-cols-2 gap-x-2 flex-1 min-w-0">
              <input value={block.day} onChange={e => setDay(di, { day: e.target.value })}
                placeholder="Día (Viernes)" className="bg-transparent font-bold text-[14px] text-[#14110b] focus:outline-none min-w-0 col-span-2" />
              <input value={block.date} onChange={e => setDay(di, { date: e.target.value })}
                placeholder="26 de Junio" className="bg-transparent text-[12px] text-black/45 focus:outline-none min-w-0" />
              <input value={block.short} onChange={e => setDay(di, { short: e.target.value })}
                placeholder="VIE" className="bg-transparent text-[12px] text-black/45 focus:outline-none min-w-0 uppercase text-right" />
            </div>
            <div className="flex gap-0.5 shrink-0">
              <IconBtn onClick={() => onChange(move(data, di, -1))}><ChevronUp className="w-3.5 h-3.5" /></IconBtn>
              <IconBtn onClick={() => onChange(move(data, di, 1))}><ChevronDown className="w-3.5 h-3.5" /></IconBtn>
              <IconBtn onClick={() => onChange(data.filter((_, x) => x !== di))} danger><Trash2 className="w-3.5 h-3.5" /></IconBtn>
            </div>
          </div>

          {/* ISO Date */}
          <div className="px-4 pt-3 pb-1">
            <DateField label="Fecha del día" value={block.isoDate} onChange={v => setDay(di, { isoDate: v })} />
          </div>

          {/* Events */}
          <div className="px-4 py-3 flex flex-col gap-2.5">
            <p className="text-[10px] font-bold tracking-widest uppercase text-black/25">Eventos · {block.events.length}</p>
            {block.events.map((ev, ei) => (
              <div key={ei} className="border border-black/[0.07] rounded-[14px] overflow-hidden bg-[#faf9f7]">
                {/* Time row */}
                <div className="grid grid-cols-3 gap-2 p-3 pb-2 border-b border-black/[0.05]">
                  <Field label="Desde" value={ev.from} onChange={v => setEv(di, ei, { from: v })} placeholder="8:00" hint="h:mm" />
                  <Field label="Hasta" value={ev.to} onChange={v => setEv(di, ei, { to: v })} placeholder="9:15" hint="h:mm" />
                  <AmpmSelect value={ev.ampm || 'am'} onChange={v => setEv(di, ei, { ampm: v })} />
                </div>
                {/* Details row */}
                <div className="grid grid-cols-2 gap-2 p-3 pt-2">
                  <Field label="Título" value={ev.title} onChange={v => setEv(di, ei, { title: v })} placeholder="Nombre del evento" wide />
                  <Field label="Lugar" value={ev.place ?? ''} onChange={v => setEv(di, ei, { place: v })} placeholder="Ej. Iglesia UNADECA" wide />
                  <Field label="Etiqueta" value={ev.tag ?? ''} onChange={v => setEv(di, ei, { tag: v })} placeholder="Ej. Seminarios" hint="opcional" />
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold tracking-widest uppercase text-black/35">Opciones</label>
                    <div className="flex items-center gap-2 pt-1">
                      <Toggle label="⭐ Destacado" value={!!ev.featured} onChange={v => setEv(di, ei, { featured: v })} />
                    </div>
                  </div>
                  <div className="col-span-2 flex justify-end gap-0.5 pt-1 border-t border-black/[0.05] mt-1">
                    <IconBtn onClick={() => setDay(di, { events: move(block.events, ei, -1) })}><ChevronUp className="w-3.5 h-3.5" /></IconBtn>
                    <IconBtn onClick={() => setDay(di, { events: move(block.events, ei, 1) })}><ChevronDown className="w-3.5 h-3.5" /></IconBtn>
                    <IconBtn onClick={() => setDay(di, { events: block.events.filter((_, y) => y !== ei) })} danger><Trash2 className="w-3.5 h-3.5" /></IconBtn>
                  </div>
                </div>
              </div>
            ))}
            <button onClick={() => setDay(di, { events: [...block.events, { from: '', to: '', ampm: 'am', title: '', place: '', tag: '', featured: false }] })}
              className="flex items-center gap-1.5 text-[13px] font-semibold py-1.5" style={{ color: ACCENT }}>
              <Plus className="w-3.5 h-3.5" /> Agregar evento
            </button>
          </div>
        </motion.div>
      ))}

    </div>
  )
}

// ─── Seminarios editor ────────────────────────────────────────────────────────
function SeminariosEditor({ data, onChange }: { data: Seminar[]; onChange: (d: Seminar[]) => void }) {
  const set = (i: number, patch: Partial<Seminar>) => onChange(data.map((s, x) => x === i ? { ...s, ...patch } : s))
  const addSeminar = () => onChange([...data, { icon: SEMINAR_ICON_KEYS[0], title: '', room: '', speaker: 'Por confirmar', speakerPhoto: '', description: '', mapUrl: '' }])
  return (
    <div className="flex flex-col gap-3">
      <SectionInfo>
        Cada seminario aparece como una tarjeta expandible en la app. El expositor, descripción y URL del mapa son opcionales por ahora — puedes completarlos antes del evento.
      </SectionInfo>

      <button onClick={addSeminar}
        className="flex items-center justify-center gap-2 text-[14px] font-semibold border-2 border-dashed rounded-[20px] py-3"
        style={{ color: ACCENT, borderColor: `${ACCENT}40` }}>
        <Plus className="w-4 h-4" /> Agregar seminario
      </button>

      {data.map((s, i) => (
        <motion.div key={i} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}
          className="bg-white rounded-[20px] border border-black/[0.07] shadow-sm overflow-hidden">

          <div className="bg-[#f5f3ef] px-4 py-3 flex items-center gap-3 border-b border-black/[0.06]">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center text-[13px] font-bold shrink-0"
              style={{ background: `${ACCENT}18`, color: ACCENT, border: `1px solid ${ACCENT}40` }}>
              {i + 1}
            </div>
            <span className="flex-1 font-semibold text-[14px] text-[#14110b] truncate">{s.title || `Seminario ${i + 1}`}</span>
            <div className="flex gap-0.5 shrink-0">
              <IconBtn onClick={() => onChange(move(data, i, -1))}><ChevronUp className="w-3.5 h-3.5" /></IconBtn>
              <IconBtn onClick={() => onChange(move(data, i, 1))}><ChevronDown className="w-3.5 h-3.5" /></IconBtn>
              <IconBtn onClick={() => onChange(data.filter((_, x) => x !== i))} danger><Trash2 className="w-3.5 h-3.5" /></IconBtn>
            </div>
          </div>

          <div className="p-4 grid grid-cols-2 gap-2.5">
            <Field label="Título" value={s.title} onChange={v => set(i, { title: v })} placeholder="Título del seminario" wide />

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold tracking-widest uppercase text-black/35">Ícono</label>
              <select value={s.icon} onChange={e => set(i, { icon: e.target.value })}
                className="border border-black/[0.10] rounded-xl px-3 py-2.5 text-[14px] text-[#14110b] bg-white focus:outline-none focus:ring-2 focus:ring-[#FF5A1F]/25 capitalize">
                <option value="hands">🤝 Manos</option>
                <option value="globe">🌍 Globo</option>
                <option value="spark">✨ Chispa</option>
                <option value="city">🏙️ Ciudad</option>
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold tracking-widest uppercase text-black/35 flex items-center gap-1">
                <MapPin className="w-3 h-3" style={{ color: ACCENT }} /> Salón
              </label>
              <input value={s.room} onChange={e => set(i, { room: e.target.value })} placeholder="Salón multimedia"
                className="border border-black/[0.10] rounded-xl px-3 py-2.5 text-[14px] text-[#14110b] bg-white focus:outline-none focus:ring-2 focus:ring-[#FF5A1F]/25 placeholder:text-black/20" />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold tracking-widest uppercase text-black/35 flex items-center gap-1">
                <Mic className="w-3 h-3" style={{ color: ACCENT }} /> Expositor
              </label>
              <input value={s.speaker} onChange={e => set(i, { speaker: e.target.value })} placeholder="Por confirmar"
                className="border border-black/[0.10] rounded-xl px-3 py-2.5 text-[14px] text-[#14110b] bg-white focus:outline-none focus:ring-2 focus:ring-[#FF5A1F]/25 placeholder:text-black/20" />
            </div>

            <Area label="Descripción" value={s.description} onChange={v => set(i, { description: v })} placeholder="¿De qué trata este seminario? (opcional)" />
            <ImageUpload
              label="Foto del expositor"
              currentUrl={s.speakerPhoto ?? ''}
              storagePath={`speaker-photos/seminario-${i + 1}`}
              onUrl={v => set(i, { speakerPhoto: v })}
            />
            <ImageUpload
              label="Imagen del mapa / salón"
              currentUrl={s.mapUrl}
              storagePath={`seminar-maps/seminario-${i + 1}`}
              onUrl={v => set(i, { mapUrl: v })}
            />
          </div>
        </motion.div>
      ))}

    </div>
  )
}

// ─── Ajustes ──────────────────────────────────────────────────────────────────
function AjustesEditor({ value, onChange }: { value: Settings; onChange: (s: Settings) => void }) {
  const enabled = value.demoTime !== null
  // Convert stored value back to datetime-local format (local time, not UTC).
  // new Date().toLocaleDateString('sv') gives "YYYY-MM-DD" in local tz.
  const toLocal = (iso: string) => {
    const d = new Date(iso)
    const date = d.toLocaleDateString('sv')                              // "2026-06-27"
    const time = d.toLocaleTimeString('sv', { hour: '2-digit', minute: '2-digit' }) // "15:00"
    return `${date}T${time}`
  }
  const localVal = value.demoTime ? toLocal(value.demoTime) : '2026-06-27T15:00'

  return (
    <div className="flex flex-col gap-4">
      <SectionInfo>
        La <strong>hora simulada</strong> fuerza una hora fija en todos los dispositivos. Úsala durante presentaciones para que la línea de tiempo muestre el evento correcto como "Ahora". Apágala para usar la hora real.
      </SectionInfo>

      <div className="bg-white rounded-[20px] border border-black/[0.07] shadow-sm p-5 flex flex-col gap-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: `${ACCENT}18`, color: ACCENT }}>
            <Clock className="w-4.5 h-4.5" />
          </div>
          <div>
            <h3 className="text-[15px] font-bold text-[#14110b]">Hora simulada</h3>
            <p className="text-[12px] text-black/40 mt-1 leading-relaxed">
              Cuando está activa, todos los usuarios de la app ven la línea de tiempo como si fuera esa hora.
              Ideal para demos y presentaciones.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 rounded-2xl bg-black/[0.03] border border-black/[0.05]">
          <div className={`w-2 h-2 rounded-full ${enabled ? 'bg-orange-500' : 'bg-black/20'}`} />
          <span className="text-[13px] font-medium text-[#14110b] flex-1">
            {enabled ? `Activa · ${new Date(value.demoTime!).toLocaleString('es', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}` : 'Usando hora real del dispositivo'}
          </span>
          <Toggle label={enabled ? 'Desactivar' : 'Activar'} value={enabled}
            onChange={on => onChange({ demoTime: on ? new Date(localVal).toISOString() : null })} />

        </div>

        {enabled && (
          <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="flex flex-col gap-1">
            <label className="text-[10px] font-bold tracking-widest uppercase text-black/35">Fecha y hora a simular</label>
            <input type="datetime-local" value={localVal}
              onChange={e => onChange({ demoTime: new Date(e.target.value).toISOString() })}
              className="border border-black/[0.10] rounded-xl px-3 py-2.5 text-[14px] text-[#14110b] bg-white focus:outline-none focus:ring-2 focus:ring-[#FF5A1F]/25" />
            <p className="text-[11px] text-black/30 mt-0.5">
              Ej. pon 27/Jun 15:00 para ver el "Seminario 2" como "Ahora".
            </p>
          </motion.div>
        )}
      </div>
    </div>
  )
}

// ─── Pizarra (moderación) ─────────────────────────────────────────────────────
function PizarraEditor() {
  const [subs, setSubs] = useState<VerseSubmission[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [query, setQuery] = useState('')

  const load = async () => {
    setLoading(true)
    setSubs(await getAllVerseSubmissions())
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  async function toggleHide(id: string, currently: boolean) {
    setBusy(id)
    if (currently) {
      await unhideSubmission(id)
      setSubs(prev => prev.map(s => s.id === id ? { ...s, hidden: false } : s))
    } else {
      await hideSubmission(id)
      setSubs(prev => prev.map(s => s.id === id ? { ...s, hidden: true } : s))
    }
    setBusy(null)
  }

  async function remove(id: string) {
    setBusy(id)
    await deleteSubmission(id)
    setSubs(prev => prev.filter(s => s.id !== id))
    setBusy(null)
    setConfirmDelete(null)
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <Loader2 className="w-5 h-5 animate-spin" style={{ color: ACCENT }} />
        <p className="text-[12px] text-black/35">Cargando pizarra…</p>
      </div>
    )
  }

  const filtered = query.trim()
    ? subs.filter(s =>
        s.signer_name.toLowerCase().includes(query.toLowerCase()) ||
        s.verse_reference.toLowerCase().includes(query.toLowerCase())
      )
    : subs

  return (
    <div className="flex flex-col gap-3">
      <SectionInfo>
        Versículos que la gente comparte en Inicio. Si algo es inapropiado, toca <strong>Ocultar</strong> — desaparece para todos al instante.
      </SectionInfo>

      <div className="relative">
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Buscar por nombre o referencia…"
          className="w-full border border-black/[0.12] rounded-xl px-4 py-2.5 text-[13.5px] text-black/80 bg-white outline-none focus:border-black/25 placeholder:text-black/30"
        />
        {query && (
          <button onClick={() => setQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-black/30 text-lg leading-none">×</button>
        )}
      </div>

      {filtered.length === 0 && (
        <p className="text-[13px] text-black/35 text-center py-10">{query ? 'Sin resultados.' : 'Aún no hay versículos compartidos.'}</p>
      )}

      {filtered.map(s => (
        <div key={s.id}
          className="bg-white rounded-2xl border border-black/[0.07] shadow-sm p-4 flex flex-col gap-2"
          style={{ opacity: s.hidden ? 0.5 : 1 }}>
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold tracking-widest uppercase" style={{ color: ACCENT }}>
              {s.verse_reference}
            </span>
            <span className="text-[11px] text-black/35">
              {new Date(s.created_at).toLocaleString('es', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          <p className="text-[14px] leading-snug text-[#14110b]" style={{ fontFamily: 'var(--serif)' }}>
            {s.verse_text}
          </p>
          <div className="flex items-center justify-between gap-2 pt-1">
            <span className="text-[12.5px] font-semibold text-black/55">— {s.signer_name}</span>
            <div className="flex items-center gap-2">
              <button onClick={() => toggleHide(s.id, s.hidden)} disabled={busy === s.id}
                className={`text-[12px] font-bold flex items-center gap-1.5 px-3 py-1.5 rounded-lg active:scale-95 ${s.hidden ? 'text-black/40 bg-black/5' : 'text-orange-500 bg-orange-500/10'}`}>
                {busy === s.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <EyeOff className="w-3.5 h-3.5" />}
                {s.hidden ? 'Mostrar' : 'Ocultar'}
              </button>
              {confirmDelete === s.id ? (
                <div className="flex items-center gap-1.5">
                  <span className="text-[11.5px] font-semibold text-red-600">¿Borrar?</span>
                  <button onClick={() => remove(s.id)} disabled={busy === s.id}
                    className="text-[12px] font-bold px-3 py-1.5 rounded-lg text-white bg-red-600 active:scale-95">
                    {busy === s.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Sí'}
                  </button>
                  <button onClick={() => setConfirmDelete(null)}
                    className="text-[12px] font-bold px-3 py-1.5 rounded-lg text-black/40 bg-black/5 active:scale-95">
                    No
                  </button>
                </div>
              ) : (
              <button onClick={() => setConfirmDelete(s.id)} disabled={busy === s.id}
                className="text-[12px] font-bold flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-red-600 bg-red-600/10 active:scale-95">
                {busy === s.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                Borrar
              </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Admin tabs config ────────────────────────────────────────────────────────
type AdminTab = 'programa' | 'seminarios' | 'ajustes' | 'pizarra'
const ADMIN_TABS: { id: AdminTab; label: string; Icon: React.ElementType }[] = [
  { id: 'programa',   label: 'Programa',   Icon: CalendarDays },
  { id: 'seminarios', label: 'Seminarios', Icon: Users },
  { id: 'pizarra',    label: 'Pizarra',    Icon: MessageSquareQuote },
  { id: 'ajustes',    label: 'Ajustes',    Icon: SettingsIcon },
]

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function AdminPage() {
  const [authed, setAuthed]     = useState(false)
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [tab, setTab]           = useState<AdminTab>('programa')
  const [prevTab, setPrevTab]   = useState<AdminTab>('programa')
  const [programa, setPrograma]     = useState<DayBlock[]>(defaultPrograma)
  const [seminarios, setSeminarios] = useState<Seminar[]>(defaultSeminarios)
  const [settings, setSettings]     = useState<Settings>(defaultSettings)
  const [loading, setLoading]   = useState(false)
  const [saving, setSaving]     = useState(false)
  const [saved, setSaved]       = useState(false)

  useEffect(() => {
    if (!authed) return
    setLoading(true)
    Promise.all([
      getConfig<DayBlock[]>(PROGRAMA_KEY),
      getConfig<Seminar[]>(SEMINARIOS_KEY),
      getConfig<Settings>(SETTINGS_KEY),
    ]).then(([p, s, set]) => {
      if (p) setPrograma(p)
      if (s) setSeminarios(s)
      if (set) setSettings(set)
      setLoading(false)
    })
  }, [authed])

  function login(e: React.FormEvent) {
    e.preventDefault()
    if (password === ADMIN_PASSWORD) { setAuthed(true); setError('') }
    else setError('Contraseña incorrecta')
  }

  async function save() {
    if (saving) return
    setSaving(true)
    await Promise.all([
      setConfig(PROGRAMA_KEY, programa),
      setConfig(SEMINARIOS_KEY, seminarios),
      setConfig(SETTINGS_KEY, settings),
    ])
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  function goTab(t: AdminTab) { setPrevTab(tab); setTab(t) }
  const dir = ADMIN_TABS.findIndex(x => x.id === tab) > ADMIN_TABS.findIndex(x => x.id === prevTab) ? 1 : -1

  // ── Login screen ──────────────────────────────────────────────────────────
  if (!authed) {
    return (
      <motion.div className="min-h-dvh flex items-center justify-center px-6" style={{ background: '#080e22' }}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
        <motion.div className="w-full max-w-sm" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.35, delay: 0.05 }}>
          <div className="mb-8 text-center">
            <div className="w-14 h-14 rounded-[18px] flex items-center justify-center mx-auto mb-4"
              style={{ background: ACCENT, boxShadow: `0 8px 32px ${ACCENT}50` }}>
              <Lock className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-white font-bold text-[22px]">Panel Admin</h1>
            <p className="text-white/35 text-[13px] mt-1">Festival de Misiones 2026</p>
          </div>
          <form onSubmit={login} className="flex flex-col gap-3">
            <input type="password" value={password} autoFocus placeholder="Contraseña"
              onChange={e => { setPassword(e.target.value); setError('') }}
              className="bg-white/[0.08] border border-white/[0.10] rounded-2xl px-4 py-3.5 text-white placeholder:text-white/20 text-[15px] focus:outline-none"
              style={{ boxShadow: error ? '0 0 0 2px rgba(239,68,68,0.4)' : undefined }} />
            <AnimatePresence>
              {error && <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="text-red-400 text-[13px] text-center">{error}</motion.p>}
            </AnimatePresence>
            <button type="submit" className="font-bold text-[15px] rounded-2xl py-3.5 text-white active:scale-[0.98]"
              style={{ background: ACCENT, boxShadow: `0 4px 20px ${ACCENT}40` }}>
              Entrar
            </button>
          </form>
        </motion.div>
      </motion.div>
    )
  }

  // ── Admin shell ───────────────────────────────────────────────────────────
  return (
    <div className="min-h-dvh flex flex-col" style={{ background: '#f4f1eb' }}>

      {/* Sticky header */}
      <div className="sticky top-0 z-30 px-5 pt-safe pb-0" style={{ background: '#080e22' }}>
        <div className="flex items-center justify-between pt-4 pb-3">
          <div>
            <h1 className="text-white font-bold text-[18px]">Panel Admin</h1>
            <p className="text-white/30 text-[11px]">Festival de Misiones 2026</p>
          </div>
          <div className="flex items-center gap-2">
            <a href="/" className="flex items-center gap-1 text-white/35 hover:text-white/60 text-[12px]"
              onClick={e => { e.preventDefault(); window.location.hash = '' }}>
              <ExternalLink className="w-3.5 h-3.5" /> Ver app
            </a>
            <div className="w-px h-4 bg-white/10" />
            <button onClick={() => { setAuthed(false); window.location.hash = '' }}
              className="flex items-center gap-1.5 text-white/35 hover:text-white/60 text-[12px]">
              <LogOut className="w-3.5 h-3.5" /> Salir
            </button>
          </div>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 bg-white/[0.07] rounded-xl p-1 mb-3">
          {ADMIN_TABS.map(({ id, label, Icon }) => (
            <button key={id} onClick={() => goTab(id)}
              className="flex-1 py-2 rounded-[10px] text-[12px] font-semibold relative flex items-center justify-center gap-1.5">
              {tab === id && (
                <motion.div layoutId="admin-tab-ind" className="absolute inset-0 rounded-[10px] bg-white"
                  transition={{ type: 'spring', stiffness: 500, damping: 38 }} />
              )}
              <Icon className="w-3.5 h-3.5 relative z-10" style={{ color: tab === id ? ACCENT : 'rgba(255,255,255,0.35)' }} />
              <span className="relative z-10" style={{ color: tab === id ? ACCENT : 'rgba(255,255,255,0.4)' }}>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 relative overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-5 h-5 animate-spin" style={{ color: ACCENT }} />
            <p className="text-[12px] text-black/35">Cargando datos desde Supabase…</p>
          </div>
        ) : (
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={tab} className="px-4 py-4 pb-28"
              initial={{ x: dir * 30, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
              exit={{ x: dir * -30, opacity: 0 }} transition={{ duration: 0.2 }}>
              {tab === 'programa'   && <ProgramaEditor data={programa} onChange={setPrograma} />}
              {tab === 'seminarios' && <SeminariosEditor data={seminarios} onChange={setSeminarios} />}
              {tab === 'pizarra'    && <PizarraEditor />}
              {tab === 'ajustes'    && <AjustesEditor value={settings} onChange={setSettings} />}
            </motion.div>
          </AnimatePresence>
        )}
      </div>

      {/* Save bar */}
      <div className="fixed bottom-0 left-0 right-0 p-4 border-t border-black/[0.06]"
        style={{ background: '#f4f1eb', paddingBottom: `max(16px, env(safe-area-inset-bottom) + 8px)` }}>
        <button onClick={save} disabled={saving}
          className="w-full py-4 rounded-2xl font-bold text-[15px] flex items-center justify-center gap-2 text-white active:scale-[0.98] transition-all"
          style={{
            background: saved ? '#10b981' : saving ? '#555' : '#080e22',
            boxShadow: saved ? '0 4px 16px rgba(16,185,129,0.3)' : '0 4px 16px rgba(0,0,0,0.2)',
          }}>
          {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Guardando…</>
            : saved  ? <><Check className="w-4 h-4" /> Guardado — visible en todos</>
            : <><Save className="w-4 h-4" /> Guardar y publicar</>}
        </button>
        {!saving && !saved && (
          <p className="text-[10px] text-black/30 text-center mt-2">
            Los cambios se reflejan en tiempo real en todos los dispositivos
          </p>
        )}
      </div>
    </div>
  )
}
