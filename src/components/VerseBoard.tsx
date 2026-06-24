import { useEffect, useRef, useState, useCallback } from 'react'
import { BIBLE_BOOKS, fetchVerse, type BibleBook, type FetchedVerse } from '../data/bibleBooks'
import {
  getVerseSubmissions, submitVerse, getDeviceLastSubmit, type VerseSubmission,
} from '../lib/supabase'
import { getDeviceId, markSubmitted, cooldownRemaining } from '../lib/deviceId'
import { checkName, isClean } from '../lib/nameFilter'

const ACCENT = '#FF5A1F'
const WINDOW_MS = 5 * 3600_000

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return 'ahora'
  if (min < 60) return `hace ${min} min`
  const h = Math.floor(min / 60)
  if (h < 24) return `hace ${h} h`
  const d = Math.floor(h / 24)
  return `hace ${d} d`
}

function formatCooldown(ms: number): string {
  const totalMin = Math.ceil(ms / 60000)
  const h = Math.floor(totalMin / 60)
  const m = totalMin % 60
  if (h > 0) return `${h} h ${m} m`
  return `${m} m`
}

export default function VerseBoard() {
  const [subs, setSubs] = useState<VerseSubmission[]>([])
  const [open, setOpen] = useState(false)
  const [cooldown, setCooldown] = useState(0)

  // form state
  const [bookN, setBookN] = useState<number>(43) // Juan
  const [chapter, setChapter] = useState(15)
  const [verse, setVerse] = useState(16)
  const [preview, setPreview] = useState<FetchedVerse | null>(null)
  const [fetching, setFetching] = useState(false)
  const [name, setName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const deviceId = useRef('')
  useEffect(() => { deviceId.current = getDeviceId() }, [])

  const book: BibleBook = BIBLE_BOOKS.find(b => b.n === bookN) ?? BIBLE_BOOKS[42]

  const refresh = useCallback(async () => {
    const list = await getVerseSubmissions()
    setSubs(list)
  }, [])

  useEffect(() => {
    refresh()
    const id = setInterval(refresh, 30_000)
    return () => clearInterval(id)
  }, [refresh])

  // Cooldown: client gate immediately, then confirm against DB.
  useEffect(() => {
    setCooldown(cooldownRemaining(WINDOW_MS))
    if (!deviceId.current) return
    getDeviceLastSubmit(deviceId.current).then(last => {
      if (last) setCooldown(c => Math.max(c, last + WINDOW_MS - Date.now()))
    })
  }, [subs.length])

  // Tick the cooldown down every minute while active.
  useEffect(() => {
    if (cooldown <= 0) return
    const id = setInterval(() => setCooldown(c => Math.max(0, c - 60000)), 60_000)
    return () => clearInterval(id)
  }, [cooldown > 0])

  async function handleSearch() {
    setError(''); setPreview(null); setFetching(true)
    const v = await fetchVerse(book, chapter, verse)
    setFetching(false)
    if (!v) { setError('Versículo no encontrado. Revisa capítulo y verso.'); return }
    setPreview(v)
  }

  async function handleSubmit() {
    if (!preview || submitting) return
    setError('')
    const nameCheck = checkName(name)
    if (!nameCheck.ok) { setError(nameCheck.reason); return }
    if (!isClean(preview.text)) { setError('Ese versículo contiene texto no permitido.'); return }

    setSubmitting(true)
    const result = await submitVerse({
      verseReference: preview.reference,
      verseText: preview.text,
      signerName: name.trim(),
      deviceId: deviceId.current,
    })
    setSubmitting(false)

    if (!result.ok) {
      setError(
        result.reason === 'RATE_LIMIT' ? 'Ya compartiste hace poco. Intenta más tarde.'
        : result.reason === 'PROFANITY' ? 'El contenido no está permitido.'
        : result.reason === 'NAME_FORMAT' ? 'Revisa tu nombre.'
        : 'No se pudo enviar. Intenta de nuevo.'
      )
      if (result.reason === 'RATE_LIMIT') { markSubmitted(); setCooldown(WINDOW_MS); setOpen(false) }
      return
    }

    markSubmitted()
    setCooldown(WINDOW_MS)
    setSubs(prev => [result.row, ...prev])
    setOpen(false)
    setPreview(null); setName('')
  }

  return (
    <div style={{ marginBottom: 14 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.8, textTransform: 'uppercase', color: ACCENT }}>
            Pizarra del Festival
          </div>
          <div style={{ fontSize: 12.5, color: 'rgba(244,241,235,0.5)', marginTop: 3 }}>
            Comparte y firma tu versículo favorito
          </div>
        </div>
        {subs.length > 0 && (
          <div style={{ fontSize: 12, color: 'rgba(244,241,235,0.4)', fontVariantNumeric: 'tabular-nums' }}>
            {subs.length}
          </div>
        )}
      </div>

      {/* Carousel */}
      {subs.length === 0 ? (
        <div style={{
          border: '1px dashed rgba(255,255,255,0.15)', borderRadius: 18,
          padding: '28px 20px', textAlign: 'center',
          fontSize: 13, color: 'rgba(244,241,235,0.45)', marginBottom: 14,
        }}>
          Sé el primero en compartir un versículo ✦
        </div>
      ) : (
        <div style={{
          display: 'flex', gap: 12, overflowX: 'auto', scrollSnapType: 'x mandatory',
          paddingBottom: 10, marginBottom: 4, scrollbarWidth: 'none',
          WebkitOverflowScrolling: 'touch',
        }} className="vb-carousel">
          {subs.map(s => (
            <div key={s.id} style={{
              flex: '0 0 78%', maxWidth: 300, scrollSnapAlign: 'start',
              background: 'linear-gradient(180deg,#fbf8f2 0%,#f3ece0 100%)', color: '#14110b',
              borderRadius: 18, padding: '18px 18px 16px',
              border: '1px solid rgba(0,0,0,0.05)',
              boxShadow: '0 18px 40px -24px rgba(0,0,0,0.7)',
              display: 'flex', flexDirection: 'column',
            }}>
              <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: 1.6, textTransform: 'uppercase', color: ACCENT, marginBottom: 8 }}>
                {s.verse_reference}
              </div>
              <p style={{ fontFamily: 'var(--serif)', fontSize: 15.5, lineHeight: 1.5, letterSpacing: -0.1, margin: 0, flex: 1 }}>
                {s.verse_text}
              </p>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 14, gap: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#14110b' }}>— {s.signer_name}</span>
                <span style={{ fontSize: 10.5, color: 'rgba(20,17,11,0.45)', flexShrink: 0 }}>{relativeTime(s.created_at)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CTA / form */}
      {cooldown > 0 && !open ? (
        <div style={{
          background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 14, padding: '12px 16px', textAlign: 'center',
          fontSize: 12.5, color: 'rgba(244,241,235,0.5)',
        }}>
          Podrás compartir de nuevo en {formatCooldown(cooldown)}
        </div>
      ) : !open ? (
        <button
          onClick={() => { setOpen(true); setError('') }}
          style={{
            width: '100%', padding: '13px 16px', borderRadius: 14, cursor: 'pointer',
            background: `color-mix(in srgb, ${ACCENT} 14%, transparent)`,
            border: `1px solid color-mix(in srgb, ${ACCENT} 40%, transparent)`,
            color: ACCENT, fontFamily: 'var(--ui)', fontSize: 14, fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}
        >
          ✦ Compartir mi versículo
        </button>
      ) : (
        <div style={{
          background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 18, padding: 18,
        }}>
          {/* Step 1 — selectors */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
            <select
              value={bookN}
              onChange={e => { setBookN(Number(e.target.value)); setChapter(1); setVerse(1); setPreview(null) }}
              style={selStyle}
            >
              {BIBLE_BOOKS.map(b => <option key={b.n} value={b.n}>{b.name}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <select value={chapter} onChange={e => { setChapter(Number(e.target.value)); setPreview(null) }} style={{ ...selStyle, flex: 1 }}>
              {Array.from({ length: book.chapters }, (_, i) => i + 1).map(c =>
                <option key={c} value={c}>Cap. {c}</option>)}
            </select>
            <input
              type="number" min={1} value={verse}
              onChange={e => { setVerse(Math.max(1, Number(e.target.value))); setPreview(null) }}
              placeholder="Verso"
              style={{ ...selStyle, flex: 1, appearance: 'textfield' }}
            />
            <button onClick={handleSearch} disabled={fetching} style={{
              ...selStyle, flex: '0 0 auto', cursor: 'pointer', fontWeight: 700,
              color: ACCENT, borderColor: `color-mix(in srgb, ${ACCENT} 40%, transparent)`,
            }}>
              {fetching ? '…' : 'Buscar'}
            </button>
          </div>

          {/* Step 2 — preview */}
          {preview && (
            <div style={{
              background: 'linear-gradient(180deg,#fbf8f2 0%,#f3ece0 100%)', color: '#14110b',
              borderRadius: 14, padding: 16, marginBottom: 12,
            }}>
              <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: 1.6, textTransform: 'uppercase', color: ACCENT, marginBottom: 6 }}>
                {preview.reference}
              </div>
              <p style={{ fontFamily: 'var(--serif)', fontSize: 16, lineHeight: 1.5, margin: 0 }}>{preview.text}</p>
            </div>
          )}

          {/* Step 3 — sign */}
          {preview && (
            <input
              value={name}
              onChange={e => { setName(e.target.value); setError('') }}
              placeholder="Tu nombre"
              maxLength={40}
              style={{ ...selStyle, width: '100%', marginBottom: 12 }}
            />
          )}

          {error && (
            <div style={{ fontSize: 12.5, color: '#ff8a6b', marginBottom: 12 }}>{error}</div>
          )}

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => { setOpen(false); setError(''); setPreview(null) }}
              style={{ ...selStyle, flex: 1, cursor: 'pointer', color: 'rgba(244,241,235,0.6)' }}
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={!preview || submitting}
              style={{
                flex: 2, padding: '11px 16px', borderRadius: 12, cursor: preview ? 'pointer' : 'not-allowed',
                background: preview ? ACCENT : 'rgba(255,255,255,0.1)',
                border: 'none', color: preview ? '#fff7f2' : 'rgba(244,241,235,0.4)',
                fontFamily: 'var(--ui)', fontSize: 14, fontWeight: 700,
              }}
            >
              {submitting ? 'Enviando…' : 'Firmar y compartir'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

const selStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.14)',
  borderRadius: 12, padding: '11px 12px', color: '#F4F1EB',
  fontFamily: 'var(--ui)', fontSize: 14, minWidth: 0, outline: 'none',
}
