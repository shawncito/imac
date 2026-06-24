import { useEffect, useRef, useState, useCallback } from 'react'
import { motion } from 'motion/react'
import { BIBLE_BOOKS, fetchVerse, fetchVerseCount, type BibleBook, type FetchedVerse } from '../data/bibleBooks'
import {
  supabase, getVerseSubmissions, submitVerse, getDeviceLastSubmit, likeVerse, unlikeVerse, type VerseSubmission,
} from '../lib/supabase'
import { getDeviceId, markSubmitted, cooldownRemaining } from '../lib/deviceId'
import { checkName, isClean } from '../lib/nameFilter'

const ACCENT = '#FF5A1F'
const WINDOW_MS = 5 * 3600_000


function formatCooldown(ms: number): string {
  const totalMin = Math.ceil(ms / 60000)
  const h = Math.floor(totalMin / 60)
  const m = totalMin % 60
  if (h > 0) return `${h} h ${m} m`
  return `${m} m`
}

export default function VerseBoard() {
  const [subs, setSubs] = useState<VerseSubmission[]>([])
  const [activeIdx, setActiveIdx] = useState(0)
  const [open, setOpen] = useState(false)
  const [cooldown, setCooldown] = useState(0)

  // form state
  const [bookN, setBookN] = useState<number>(43) // Juan
  const [chapter, setChapter] = useState(15)
  const [verse, setVerse] = useState(16)
  const [verseCount, setVerseCount] = useState(21) // Juan 15 tiene 27, default razonable
  const [preview, setPreview] = useState<FetchedVerse | null>(null)
  const [fetching, setFetching] = useState(false)
  const [name, setName] = useState('')
  const [region, setRegion] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const deviceId = useRef('')
  const touchStartX = useRef(0)
  const firstLoad = useRef(true)
  const [likedIds, setLikedIds] = useState<Set<string>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem('liked_verses') ?? '[]')) }
    catch { return new Set() }
  })
  const [likingIds, setLikingIds] = useState<Set<string>>(new Set())
  useEffect(() => { deviceId.current = getDeviceId() }, [])

  const book: BibleBook = BIBLE_BOOKS.find(b => b.n === bookN) ?? BIBLE_BOOKS[42]

  useEffect(() => {
    fetchVerseCount(book, chapter).then(count => {
      setVerseCount(count)
      setVerse(v => Math.min(v, count))
    })
  }, [book.n, chapter])

  const refresh = useCallback(async () => {
    const list = await getVerseSubmissions()
    setSubs(list)
    // Pick random card on first load; keep current on subsequent updates
    if (firstLoad.current && list.length > 0) {
      setActiveIdx(Math.floor(Math.random() * list.length))
      firstLoad.current = false
    }
  }, [])

  // Auto-rotate every 8s
  useEffect(() => {
    if (subs.length <= 1) return
    const id = setInterval(() => setActiveIdx(i => (i + 1) % subs.length), 20000)
    return () => clearInterval(id)
  }, [subs.length])

  // Keep activeIdx in bounds after subs change
  useEffect(() => {
    if (subs.length > 0) setActiveIdx(i => i % subs.length)
  }, [subs.length])

  useEffect(() => {
    refresh()
    const channel = supabase
      .channel('verse-board')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'verse_submissions' }, () => refresh())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
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
    if (!region) { setError('Selecciona tu asociación o unión.'); return }
    if (!isClean(preview.text)) { setError('Ese versículo contiene texto no permitido.'); return }

    setSubmitting(true)
    const result = await submitVerse({
      verseReference: preview.reference,
      verseText: preview.text,
      signerName: name.trim(),
      deviceId: deviceId.current,
      region: region || undefined,
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
    setPreview(null); setName(''); setRegion('')
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

      {/* Card stack */}
      {subs.length === 0 ? (
        <div style={{
          border: '1px dashed rgba(255,255,255,0.15)', borderRadius: 18,
          padding: '28px 20px', textAlign: 'center',
          fontSize: 13, color: 'rgba(244,241,235,0.45)', marginBottom: 14,
        }}>
          Sé el primero en compartir un versículo
        </div>
      ) : (
        <div style={{ marginBottom: 10, position: 'relative', paddingLeft: 30, paddingRight: 30 }}>
          {/* Stack area */}
          <div
            onClick={() => setActiveIdx(i => (i + 1) % subs.length)}
            onTouchStart={e => { touchStartX.current = e.touches[0].clientX }}
            onTouchEnd={e => {
              const diff = touchStartX.current - e.changedTouches[0].clientX
              if (Math.abs(diff) < 40) return
              setActiveIdx(i => diff > 0 ? (i + 1) % subs.length : (i - 1 + subs.length) % subs.length)
            }}
            style={{ position: 'relative', width: '100%', height: 210, cursor: 'pointer', userSelect: 'none', marginBottom: 14 }}
          >
            {subs.map((s, i) => {
              const offset = (i - activeIdx + subs.length) % subs.length
              const visible = offset < 4
              if (!visible) return null
              return (
                <motion.div
                  key={s.id}
                  animate={{
                    zIndex: subs.length - offset,
                    y: offset * 9,
                    x: offset * 3,
                    rotate: (offset % 2 === 0 ? 1 : -1) * offset * 1.5,
                    scale: 1 - offset * 0.04,
                    opacity: offset > 2 ? 0.4 : 1,
                  }}
                  transition={{ type: 'spring', stiffness: 320, damping: 32 }}
                  style={{
                    position: 'absolute', top: 0, left: 0, right: 0,
                    background: 'linear-gradient(180deg,#fbf8f2 0%,#f3ece0 100%)',
                    borderRadius: 20, padding: '18px 18px 14px',
                    border: '1px solid rgba(0,0,0,0.06)',
                    boxShadow: '0 8px 30px rgba(0,0,0,0.45)',
                    display: 'flex', flexDirection: 'column', color: '#14110b',
                  }}
                >
                  <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: 1.6, textTransform: 'uppercase', color: ACCENT, marginBottom: 8 }}>
                    {s.verse_reference}
                  </div>
                  <p style={{ fontFamily: 'var(--serif)', fontSize: 15.5, lineHeight: 1.5, margin: 0, flex: 1,
                    display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {s.verse_text}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <span style={{ fontSize: 12.5, fontWeight: 700, color: '#14110b' }}>— {s.signer_name}</span>
                      {s.region && (
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 3,
                          fontSize: 9.5, fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase',
                          background: `color-mix(in srgb, ${ACCENT} 12%, transparent)`,
                          color: ACCENT, borderRadius: 6, padding: '2px 7px', width: 'fit-content',
                        }}>
                          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/>
                          </svg>
                          {s.region}
                        </span>
                      )}
                    </div>
                    {offset === 0 && (
                      <button
                        onClick={async e => {
                          e.stopPropagation()
                          if (likingIds.has(s.id)) return
                          const alreadyLiked = likedIds.has(s.id)
                          setLikingIds(prev => new Set(prev).add(s.id))
                          if (alreadyLiked) {
                            setSubs(prev => prev.map(x => x.id === s.id ? { ...x, likes: Math.max(0, (x.likes ?? 0) - 1) } : x))
                            setLikedIds(prev => {
                              const next = new Set(prev); next.delete(s.id)
                              localStorage.setItem('liked_verses', JSON.stringify([...next]))
                              return next
                            })
                            await unlikeVerse(s.id)
                          } else {
                            setSubs(prev => prev.map(x => x.id === s.id ? { ...x, likes: (x.likes ?? 0) + 1 } : x))
                            setLikedIds(prev => {
                              const next = new Set(prev).add(s.id)
                              localStorage.setItem('liked_verses', JSON.stringify([...next]))
                              return next
                            })
                            await likeVerse(s.id)
                          }
                          setLikingIds(prev => { const next = new Set(prev); next.delete(s.id); return next })
                        }}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 4, background: 'none',
                          border: 'none', cursor: likingIds.has(s.id) ? 'default' : 'pointer',
                          padding: '4px 6px', borderRadius: 8, opacity: likingIds.has(s.id) ? 0.5 : 1,
                          color: likedIds.has(s.id) ? '#e8354a' : 'rgba(20,17,11,0.3)',
                        }}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill={likedIds.has(s.id) ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                        </svg>
                        {s.likes > 0 && <span style={{ fontSize: 11.5, fontWeight: 700 }}>{s.likes}</span>}
                      </button>
                    )}
                  </div>
                </motion.div>
              )
            })}
            {/* Side buttons — dentro del stack para estar en el mismo stacking context */}
            <button onClick={e => { e.stopPropagation(); setActiveIdx(i => (i - 1 + subs.length) % subs.length) }}
              style={{ position: 'absolute', left: -30, top: '45%', transform: 'translateY(-50%)', zIndex: 9999,
                background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.13)', color: '#F4F1EB',
                width: 34, height: 34, borderRadius: '50%', cursor: 'pointer', fontSize: 15, display: 'grid', placeItems: 'center' }}>←</button>
            <button onClick={e => { e.stopPropagation(); setActiveIdx(i => (i + 1) % subs.length) }}
              style={{ position: 'absolute', right: -30, top: '45%', transform: 'translateY(-50%)', zIndex: 9999,
                background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.13)', color: '#F4F1EB',
                width: 34, height: 34, borderRadius: '50%', cursor: 'pointer', fontSize: 15, display: 'grid', placeItems: 'center' }}>→</button>
          </div>
          <p style={{ textAlign: 'center', fontSize: 11, color: 'rgba(244,241,235,0.28)', letterSpacing: 0.5, marginTop: 8, marginBottom: 0 }}>{activeIdx + 1} / {subs.length}</p>
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
           Compartir mi versículo
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
              style={selStyle} className="vb-select"
            >
              {BIBLE_BOOKS.map(b => <option key={b.n} value={b.n}>{b.name}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <select value={chapter} onChange={e => { setChapter(Number(e.target.value)); setPreview(null) }} style={{ ...selStyle, flex: 1 }} className="vb-select">
              {Array.from({ length: book.chapters }, (_, i) => i + 1).map(c =>
                <option key={c} value={c}>Cap. {c}</option>)}
            </select>
            <select value={verse} onChange={e => { setVerse(Number(e.target.value)); setPreview(null) }} style={{ ...selStyle, flex: 1 }} className="vb-select">
              {Array.from({ length: verseCount }, (_, i) => i + 1).map(v =>
                <option key={v} value={v}>V. {v}</option>)}
            </select>
            <button onClick={handleSearch} disabled={fetching} style={{
              ...selStyle, flex: '0 0 auto', cursor: 'pointer', fontWeight: 700,
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
            <>
              <input
                value={name}
                onChange={e => { setName(e.target.value); setError('') }}
                placeholder="Tu nombre"
                maxLength={40}
                style={{ ...selStyle, width: '100%', marginBottom: 8 }}
              />
              <select
                value={region}
                onChange={e => setRegion(e.target.value)}
                style={{ ...selStyle, width: '100%', marginBottom: 12, color: region ? 'rgba(244,241,235,0.9)' : 'rgba(244,241,235,0.4)' }}
                className="vb-select"
              >
                <option value="">Asociación / Unión *</option>
                <option value="Norte">Asociación Norte</option>
                <option value="Central">Asociación Central</option>
                <option value="Sur">Asociación Sur</option>
                <option value="Caribe">Asociación Caribe</option>
                <option value="UNADECA">UNADECA (Unión CR)</option>
                <option value="Unión Guate">Unión Guatemalteca</option>
                <option value="Otros">Otros</option>
              </select>
            </>
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
  background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 12, padding: '11px 12px', color: 'rgba(244,241,235,0.9)',
  fontFamily: 'var(--ui)', fontSize: 14, minWidth: 0, outline: 'none',
  colorScheme: 'dark',
}
