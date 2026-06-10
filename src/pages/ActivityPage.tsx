import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Play, Pause, ChevronDown, Mic, Check, Plus } from 'lucide-react'
import { languages } from '../data/verses'
import { useSpeech } from '../hooks/useSpeech'

const ACCENT = '#FF5A1F'

const BADGE: Record<string, string> = {
  es: 'ES', pt: 'PT', en: 'EN', hi: 'हि', fr: 'FR', de: 'DE',
  sw: 'SW', tr: 'TR', pl: 'PL', ar: 'ع', zh: '中', ko: '한',
  ja: 'あ', ru: 'RU', it: 'IT', el: 'Ελ', he: 'עב',
}

type Props = {
  playSignal: number
  onPlayingChange: (playing: boolean) => void
}

function randIdx(n: number, exclude: number) {
  if (n <= 1) return 0
  let i = exclude
  while (i === exclude) i = Math.floor(Math.random() * n)
  return i
}

export default function ActivityPage({ playSignal, onPlayingChange }: Props) {
  const [selectedLang, setSelectedLang] = useState(0)
  const [verseIndex, setVerseIndex]     = useState(0)
  const [showLang, setShowLang]         = useState(false)
  const [showVoice, setShowVoice]       = useState(false)

  const {
    isPlaying, isPaused, charIndex, speak, pause, resume, stop,
    selectedVoice, setSelectedVoice, getVoicesForLang,
  } = useSpeech()

  const lang   = languages[selectedLang]
  const verse  = lang.verses[verseIndex]
  const voices = getVoicesForLang(lang.ttsLang)
  const rtl    = lang.code === 'ar' || lang.code === 'he'

  // Report playing state up so the VOZ button shows wave bars.
  useEffect(() => { onPlayingChange(isPlaying && !isPaused) }, [isPlaying, isPaused, onPlayingChange])

  // VOZ button in the header bumps playSignal → start playback.
  useEffect(() => {
    if (playSignal === 0) return
    if (!isPlaying) speak(verse.text, lang.ttsLang, `${verse.reference}. `)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playSignal])

  // Tokenize verse into words with char ranges for highlight.
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
  const progress = isPlaying && charIndex >= 0 ? Math.min(1, charIndex / verse.text.length) : 0

  function pickLang(idx: number) {
    if (isPlaying) stop()
    setSelectedLang(idx)
    setVerseIndex(randIdx(languages[idx].verses.length, -1))
    setSelectedVoice(null)
    setShowLang(false)
  }

  function togglePlay() {
    if (isPaused) { resume(); return }
    if (isPlaying) { pause(); return }
    speak(verse.text, lang.ttsLang, `${verse.reference}. `)
  }

  return (
    <div className="tab-actividad">
      {/* Language picker */}
      <div style={{ position: 'relative', zIndex: 40 }}>
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
                    <button key={l.code} className={'lang-item' + (active ? ' active' : '')} onClick={() => pickLang(idx)}>
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

      {/* Toolbar: voice + reroll */}
      <div className="verse-toolbar">
        <div style={{ position: 'relative' }}>
          <button className="voice-chip" onClick={() => { setShowVoice(o => !o); setShowLang(false) }}>
            <Mic size={14} />
            <span>{selectedVoice ? selectedVoice.name : 'Voz automática'}</span>
            <ChevronDown size={13} style={{ opacity: 0.5 }} />
          </button>
          <AnimatePresence>
            {showVoice && (
              <>
                <div className="lang-scrim" onClick={() => setShowVoice(false)} />
                <motion.div
                  className="voice-sheet"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ duration: 0.18 }}
                >
                  <div className="voice-sheet-title">Voz · {lang.code.toUpperCase()} · {voices.length}</div>
                  <button className={'voice-opt' + (selectedVoice === null ? ' active' : '')} onClick={() => { setSelectedVoice(null); setShowVoice(false) }}>
                    <Mic size={15} /><span>Automática</span>
                    {selectedVoice === null && <span style={{ marginLeft: 'auto', color: ACCENT, display: 'flex' }}><Check size={15} /></span>}
                  </button>
                  {voices.map(v => {
                    const active = selectedVoice?.name === v.name
                    return (
                      <button key={v.name} className={'voice-opt' + (active ? ' active' : '')} onClick={() => { setSelectedVoice(v); setShowVoice(false) }}>
                        <Mic size={15} /><span>{v.name}</span>
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

      {/* Verse card */}
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
            <div className="verse-foot">
              <button className="play-btn" onClick={togglePlay} style={{ background: ACCENT }} aria-label={isPlaying && !isPaused ? 'Pausar' : 'Reproducir'}>
                {isPlaying && !isPaused
                  ? <Pause size={22} fill="#0a0a0b" stroke="none" />
                  : <Play size={22} fill="#0a0a0b" stroke="none" style={{ marginLeft: 2 }} />}
              </button>
              <div className="play-track">
                <div className="play-track-bar" style={{ width: `${progress * 100}%`, background: ACCENT }} />
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
