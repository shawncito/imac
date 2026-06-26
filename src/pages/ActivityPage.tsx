import { useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Play, Pause, ChevronDown, Mic, Check, Plus, RotateCcw } from 'lucide-react'
import { languages } from '../data/verses'
import type { Player } from '../hooks/usePlayer'

const ACCENT = '#FF5A1F'

const BADGE: Record<string, string> = {
  es: 'ES', pt: 'PT', en: 'EN', hi: 'हि', fr: 'FR', de: 'DE',
  sw: 'SW', tr: 'TR', pl: 'PL', ar: 'ع', zh: '中', ko: '한',
  ja: 'あ', ru: 'RU', it: 'IT', el: 'Ελ', he: 'עב',
}

type Props = { player: Player }

function fmtTime(s: number) {
  if (!isFinite(s) || s < 0) s = 0
  const m = Math.floor(s / 60)
  const ss = String(Math.floor(s % 60)).padStart(2, '0')
  return `${m}:${ss}`
}

export default function ActivityPage({ player }: Props) {
  const [showLang, setShowLang]   = useState(false)
  const [showVoice, setShowVoice] = useState(false)

  const {
    isPlaying, isPaused, charIndex, currentTime, duration,
    togglePlay, restart, seek,
    selectedLang, lang, verse, verseIndex,
    audioVoices, currentAudioVoice, pickLang, pickVoice,
  } = player

  const rtl = lang.code === 'ar' || lang.code === 'he'

  const tokens = useMemo(() => {
    const out: { text: string; start: number; space: boolean }[] = []
    let pos = 0
    for (const chunk of verse.text.split(/(\s+)/)) {
      out.push({ text: chunk, start: pos, space: /^\s+$/.test(chunk) })
      pos += chunk.length
    }
    return out
  }, [verse.text])

  const big = verse.text.length > 150
  const progress = duration > 0 ? Math.min(1, currentTime / duration) : 0

  // ── seek bar drag ──
  const trackRef    = useRef<HTMLDivElement>(null)
  const draggingRef = useRef(false)

  function seekAt(clientX: number) {
    const el = trackRef.current
    if (!el || duration <= 0) return
    const r = el.getBoundingClientRect()
    const frac = Math.min(1, Math.max(0, (clientX - r.left) / r.width))
    seek(frac * duration)
  }
  function onTrackDown(e: React.PointerEvent) {
    if (duration <= 0) return
    draggingRef.current = true
    seekAt(e.clientX)
    const move = (ev: PointerEvent) => { if (draggingRef.current) seekAt(ev.clientX) }
    const up   = () => {
      draggingRef.current = false
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }

  function selectLang(idx: number) { pickLang(idx); setShowLang(false) }

  return (
    <div className="tab-actividad">

      {/* ── Language picker ── */}
      <div style={{ position: 'relative', zIndex: 40, flexShrink: 0 }}>
        <button className="lang-trigger" onClick={() => { setShowLang(o => !o); setShowVoice(false) }}>
          <span className="lang-badge" style={{ color: ACCENT }}>{BADGE[lang.code] ?? lang.code.toUpperCase()}</span>
          <span className="lang-name">{lang.nativeName}</span>
          <span className={'lang-chev' + (showLang ? ' up' : '')}><ChevronDown size={18} /></span>
        </button>
        <AnimatePresence>
          {showLang && (
            <>
              <div className="lang-scrim" onClick={() => setShowLang(false)} />
              <motion.div
                className="lang-sheet"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
              >
                {languages.map((l, idx) => {
                  const active = idx === selectedLang
                  return (
                    <button key={l.code} className={'lang-item' + (active ? ' active' : '')} onClick={() => selectLang(idx)}>
                      <span className="lang-badge sm" style={{ color: active ? ACCENT : undefined }}>{BADGE[l.code] ?? l.code.toUpperCase()}</span>
                      <span style={{ fontWeight: active ? 600 : 450 }}>{l.nativeName}</span>
                      <span className="lang-count">{l.verses.length}</span>
                      {active && <span style={{ color: ACCENT, display: 'flex' }}><Check size={16} /></span>}
                    </button>
                  )
                })}
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      {/* ── Verse card ── */}
      <div className="verse-stage">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={`${selectedLang}-${verseIndex}`}
            className="verse-card"
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.22, ease: [0.22, 0.61, 0.36, 1] }}
          >
            <Plus size={120} strokeWidth={1} style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', opacity: 0.06, pointerEvents: 'none' }} />
            <div className="verse-ref" style={{ color: ACCENT }}>{verse.reference}</div>
            <div className="verse-body">
              <p className={'verse-text' + (big ? ' big' : '')} dir={rtl ? 'rtl' : 'ltr'} lang={lang.code}>
                {tokens.map((tok, i) => {
                  if (tok.space) return tok.text
                  const end = tok.start + tok.text.length
                  const on = charIndex >= 0 && charIndex >= tok.start && charIndex < end
                  const done = charIndex >= 0 && charIndex >= end
                  return (
                    <span key={i} className={'vw' + (on ? ' on' : '') + (done ? ' done' : '')} style={on ? { color: ACCENT } : undefined}>
                      {tok.text}
                    </span>
                  )
                })}
              </p>
            </div>

            {/* ── Player controls ── */}
            <div className="verse-foot">
              <button className="play-btn" onClick={togglePlay} style={{ background: ACCENT }} aria-label={isPlaying && !isPaused ? 'Pausar' : 'Reproducir'}>
                {isPlaying && !isPaused
                  ? <Pause size={22} fill="#0a0a0b" stroke="none" />
                  : <Play size={22} fill="#0a0a0b" stroke="none" style={{ marginLeft: 2 }} />}
              </button>

              <button className="ctrl-btn" onClick={restart} disabled={duration <= 0} aria-label="Reiniciar">
                <RotateCcw size={17} />
              </button>

              <div className="play-seek">
                <span className="ptime">{fmtTime(currentTime)}</span>
                <div className="play-track" ref={trackRef} onPointerDown={onTrackDown}>
                  <div className="play-track-bar" style={{ width: `${progress * 100}%`, background: ACCENT }} />
                  <div className="play-thumb" style={{ left: `${progress * 100}%`, background: ACCENT, opacity: duration > 0 ? 1 : 0 }} />
                </div>
                <span className="ptime">{fmtTime(duration)}</span>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── Voice picker (select) ── */}
      <div className="voice-row">
        <div style={{ position: 'relative' }}>
          <button className="voice-chip" onClick={() => { setShowVoice(o => !o); setShowLang(false) }}>
            <Mic size={14} />
            <span>{currentAudioVoice?.name ?? 'Voz'}</span>
            <ChevronDown size={13} style={{ opacity: 0.5 }} />
          </button>
          <AnimatePresence>
            {showVoice && (
              <>
                <div className="lang-scrim" onClick={() => setShowVoice(false)} />
                <motion.div
                  className="voice-sheet"
                  style={{ bottom: 'calc(100% + 10px)', top: 'auto' }}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ duration: 0.18 }}
                >
                  <div className="voice-sheet-title">Voz · {lang.nativeName}</div>
                  {audioVoices.map(v => {
                    const active = currentAudioVoice?.id === v.id
                    return (
                      <button key={v.id} className={'voice-opt' + (active ? ' active' : '')} onClick={() => { pickVoice(v.id); setShowVoice(false) }}>
                        <Mic size={15} />
                        <span>{v.name}</span>
                        <span style={{ marginLeft: 8, opacity: 0.5, fontSize: 12 }}>{v.gender === 'f' ? 'Mujer' : 'Hombre'}</span>
                        {active && <span style={{ marginLeft: 'auto', color: ACCENT, display: 'flex' }}><Check size={15} /></span>}
                      </button>
                    )
                  })}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>

    </div>
  )
}
