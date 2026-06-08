import { useState } from 'react'
import { Pause, Play, ChevronDown, Mic, X, Check } from 'lucide-react'
import { languages } from '../data/verses'
import { useSpeech } from '../hooks/useSpeech'
import { VerseText } from '../components/VerseText'
import { SVALogoFull } from '../components/SVALogo'

function WaveBars() {
  return (
    <div className="flex items-center gap-[3px] h-[13px]">
      {[0, 1, 2, 3].map(i => (
        <div key={i} className="wave-bar h-full" style={{ animationDelay: `${i * 0.15}s` }} />
      ))}
    </div>
  )
}

function Sheet({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div
        className="absolute inset-0 bg-black/60 animate-fade-in"
        style={{ backdropFilter: 'blur(6px)' }}
        onClick={onClose}
      />
      <div className="relative animate-sheet-up bg-white rounded-t-[28px] border-t border-black/[0.07] max-h-[80dvh] overflow-y-auto overscroll-contain shadow-2xl">
        {children}
      </div>
    </div>
  )
}

export default function ActivityPage() {
  const [selectedLang, setSelectedLang]       = useState(0)
  const [showLangPicker, setShowLangPicker]   = useState(false)
  const [showVoicePicker, setShowVoicePicker] = useState(false)
  const { isPlaying, isPaused, charIndex, speak, pause, resume, stop, selectedVoice, setSelectedVoice, getVoicesForLang } = useSpeech()

  const lang            = languages[selectedLang]
  const verse           = lang.verse
  const availableVoices = getVoicesForLang(lang.ttsLang)

  function handleLangSelect(idx: number) {
    setSelectedLang(idx)
    setShowLangPicker(false)
    if (isPlaying) stop()
    setSelectedVoice(null)
  }

  function handlePlay() {
    if (isPaused)  { resume(); return }
    if (isPlaying) { pause();  return }
    speak(verse.text, lang.ttsLang, `${verse.reference}. `)
  }

  return (
    <div className="flex flex-col bg-[oklch(96%_0.006_250)]">

      {/* Black header */}
      <div className="bg-[oklch(11%_0.01_250)] px-5 pt-12 pb-28 flex flex-col gap-5 rounded-b-[14px]">
        <div className="flex items-center justify-between">
          <SVALogoFull />

          <button
            onClick={() => { setShowVoicePicker(true); setShowLangPicker(false) }}
            aria-label="Cambiar voz de lectura"
            className="flex flex-col items-center gap-0.5 active:scale-90 transition-transform"
          >
            <div className="w-9 h-9 rounded-full bg-[oklch(74%_0.15_82)] flex items-center justify-center shadow-[0_2px_12px_oklch(74%_0.15_82_/_0.4)]">
              {isPlaying ? <WaveBars /> : <Mic className="w-[15px] h-[15px] text-[oklch(11%_0.01_250)]" />}
            </div>
            <span className="text-white/40 text-[9px] font-medium tracking-wide uppercase">Voz</span>
          </button>
        </div>

        <button
          onClick={() => { setShowLangPicker(true); setShowVoicePicker(false) }}
          aria-label={`Idioma: ${lang.nativeName}`}
          className="flex items-center gap-3 bg-white/[0.08] hover:bg-white/[0.13] border border-white/[0.12] rounded-2xl px-4 py-3 transition-colors active:scale-[0.98]"
        >
          <span className="text-[26px] leading-none">{lang.flag}</span>
          <span className="text-white font-semibold text-[15px] flex-1 text-left">{lang.nativeName}</span>
          <ChevronDown className="w-4 h-4 text-white/35 flex-shrink-0" />
        </button>
      </div>

      {/* Verse card */}
      <div className="flex flex-col -mt-20 pb-6 px-4" style={{ minHeight: 'calc(100dvh - 72px)' }}>
        <article className="bg-white rounded-[24px] shadow-[0_12px_48px_rgba(0,0,0,0.14),0_2px_8px_rgba(0,0,0,0.06)] border border-black/[0.06] flex flex-col px-6 pt-6 pb-7 flex-1">

          <div className="flex items-center justify-between mb-4">
            <span className="text-[oklch(55%_0.14_82)] text-[11px] font-bold tracking-[0.18em] uppercase">
              {verse.reference}
            </span>
          </div>

          <div className="relative flex justify-center mb-4">
            <svg width="22" height="28" viewBox="0 0 22 28" fill="none" aria-hidden="true" className="opacity-[0.07]">
              <rect x="8" y="0" width="6" height="28" rx="3" fill="oklch(55% 0.14 82)"/>
              <rect x="0" y="8" width="22" height="6" rx="3" fill="oklch(55% 0.14 82)"/>
            </svg>
          </div>

          <blockquote className="flex-1 flex items-center justify-center">
            <VerseText
              text={verse.text}
              lang={lang.code}
              charIndex={charIndex}
            />
          </blockquote>

          <div className="flex justify-center mt-5 mb-5">
            <span className="text-[oklch(55%_0.14_82)] bg-[oklch(74%_0.15_82)]/[0.09] border border-[oklch(74%_0.15_82)]/[0.18] text-[11px] font-semibold px-3.5 py-1 rounded-full tracking-wide">
              {lang.nativeName}
            </span>
          </div>

          <div className="mb-4 h-1 rounded-full bg-black/[0.06] overflow-hidden">
            <div
              className="h-full bg-[oklch(55%_0.14_82)] rounded-full transition-all duration-300 ease-out"
              style={{ width: isPlaying && charIndex >= 0 ? `${(charIndex / verse.text.length) * 100}%` : '0%' }}
            />
          </div>

          <div className="flex items-center justify-center">
            <button
              onClick={handlePlay}
              aria-label={isPlaying && !isPaused ? 'Pausar' : isPaused ? 'Reanudar' : 'Reproducir'}
              className={[
                'w-[52px] h-[52px] rounded-full flex items-center justify-center transition-all duration-200 active:scale-90',
                isPlaying && !isPaused
                  ? 'bg-[oklch(11%_0.01_250)] text-[oklch(74%_0.15_82)] border-2 border-[oklch(74%_0.15_82)]/20 shadow-[0_4px_20px_rgba(0,0,0,0.25)]'
                  : isPaused
                  ? 'bg-[oklch(74%_0.15_82)] text-[oklch(11%_0.01_250)] border-2 border-[oklch(74%_0.15_82)]/40 shadow-[0_4px_20px_oklch(74%_0.15_82_/_0.3)]'
                  : 'bg-[oklch(11%_0.01_250)] text-[oklch(74%_0.15_82)] border-2 border-[oklch(74%_0.15_82)]/20 shadow-[0_4px_20px_rgba(0,0,0,0.25)]',
              ].join(' ')}
            >
              {isPlaying && !isPaused
                ? <Pause className="w-[17px] h-[17px] fill-current" />
                : <Play  className="w-[17px] h-[17px] fill-current ml-0.5" />
              }
            </button>
          </div>
        </article>
      </div>

      {/* Language Sheet */}
      {showLangPicker && (
        <Sheet onClose={() => setShowLangPicker(false)}>
          <div className="px-5 pt-5 pb-8">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-[oklch(12%_0.01_250)] font-bold text-[17px]">Selecciona idioma</h2>
              <button onClick={() => setShowLangPicker(false)} className="w-8 h-8 rounded-full bg-black/[0.06] flex items-center justify-center text-black/40 hover:bg-black/[0.1] transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {languages.map((l, idx) => {
                const active = selectedLang === idx
                return (
                  <button
                    key={l.code}
                    onClick={() => handleLangSelect(idx)}
                    className={[
                      'flex items-center gap-3 px-4 py-3 rounded-2xl border transition-colors text-left active:scale-[0.98]',
                      active
                        ? 'bg-[oklch(74%_0.15_82)]/[0.1] border-[oklch(55%_0.14_82)]/40'
                        : 'bg-black/[0.03] border-black/[0.07] hover:bg-black/[0.06]',
                    ].join(' ')}
                  >
                    <span className="text-[24px] leading-none flex-shrink-0">{l.flag}</span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-[13px] font-semibold truncate ${active ? 'text-[oklch(45%_0.14_82)]' : 'text-[oklch(15%_0.01_250)]'}`}>{l.nativeName}</p>
                      <p className="text-[11px] text-black/30 truncate">{l.name}</p>
                    </div>
                    {active && <Check className="w-3.5 h-3.5 text-[oklch(55%_0.14_82)] flex-shrink-0" />}
                  </button>
                )
              })}
            </div>
          </div>
        </Sheet>
      )}

      {/* Voice Sheet */}
      {showVoicePicker && (
        <Sheet onClose={() => setShowVoicePicker(false)}>
          <div className="px-5 pt-5 pb-8">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-[oklch(12%_0.01_250)] font-bold text-[17px]">Voz de lectura</h2>
                <p className="text-black/40 text-[12px] mt-0.5">{lang.nativeName} · {availableVoices.length} voces</p>
              </div>
              <button onClick={() => setShowVoicePicker(false)} className="w-8 h-8 rounded-full bg-black/[0.06] flex items-center justify-center text-black/40 hover:bg-black/[0.1] transition-colors mt-0.5">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2">
              <button
                onClick={() => setSelectedVoice(null)}
                className={['w-full flex items-center gap-3 px-4 py-3 rounded-2xl border transition-colors text-left active:scale-[0.98]', selectedVoice === null ? 'bg-[oklch(74%_0.15_82)]/[0.1] border-[oklch(55%_0.14_82)]/40' : 'bg-black/[0.03] border-black/[0.07] hover:bg-black/[0.06]'].join(' ')}
              >
                <Mic className={`w-4 h-4 flex-shrink-0 ${selectedVoice === null ? 'text-[oklch(55%_0.14_82)]' : 'text-black/25'}`} />
                <div className="flex-1">
                  <p className={`text-[13px] font-semibold ${selectedVoice === null ? 'text-[oklch(45%_0.14_82)]' : 'text-[oklch(15%_0.01_250)]'}`}>Automática</p>
                  <p className="text-[11px] text-black/30">Voz predeterminada del sistema</p>
                </div>
                {selectedVoice === null && <Check className="w-3.5 h-3.5 text-[oklch(55%_0.14_82)] flex-shrink-0" />}
              </button>
              {availableVoices.length === 0 && (
                <p className="text-black/35 text-[13px] text-center py-6">No hay voces para {lang.nativeName}.<br /><span className="text-black/20 text-[11px]">Se usará la voz automática.</span></p>
              )}
              {availableVoices.map(v => {
                const active = selectedVoice?.name === v.name
                return (
                  <button
                    key={v.name}
                    onClick={() => { setSelectedVoice(v); setShowVoicePicker(false) }}
                    className={['w-full flex items-center gap-3 px-4 py-3 rounded-2xl border transition-colors text-left active:scale-[0.98]', active ? 'bg-[oklch(74%_0.15_82)]/[0.1] border-[oklch(55%_0.14_82)]/40' : 'bg-black/[0.03] border-black/[0.07] hover:bg-black/[0.06]'].join(' ')}
                  >
                    <Mic className={`w-4 h-4 flex-shrink-0 ${active ? 'text-[oklch(55%_0.14_82)]' : 'text-black/20'}`} />
                    <div className="flex-1 min-w-0">
                      <p className={`text-[13px] font-semibold truncate ${active ? 'text-[oklch(45%_0.14_82)]' : 'text-[oklch(15%_0.01_250)]'}`}>{v.name}</p>
                      <p className="text-[11px] text-black/30">{v.lang}{v.localService ? ' · Local' : ' · Online'}</p>
                    </div>
                    {active && <Check className="w-3.5 h-3.5 text-[oklch(55%_0.14_82)] flex-shrink-0" />}
                  </button>
                )
              })}
            </div>
          </div>
        </Sheet>
      )}
    </div>
  )
}
