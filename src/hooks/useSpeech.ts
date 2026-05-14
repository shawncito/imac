import { useState, useCallback, useRef, useEffect } from 'react'

export function useSpeech() {
  const [isPlaying, setIsPlaying]   = useState(false)
  const [isPaused, setIsPaused]     = useState(false)
  const [charIndex, setCharIndex]   = useState(-1)
  const [voices, setVoices]         = useState<SpeechSynthesisVoice[]>([])
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null)
  const offsetRef = useRef(0)

  useEffect(() => {
    function load() {
      const v = window.speechSynthesis.getVoices()
      if (v.length) setVoices(v)
    }
    load()
    window.speechSynthesis.onvoiceschanged = load
    return () => { window.speechSynthesis.onvoiceschanged = null }
  }, [])

  const speak = useCallback((text: string, lang: string, prefix = '') => {
    if (!window.speechSynthesis) return
    window.speechSynthesis.cancel()
    setCharIndex(-1)

    // prefix = e.g. "Juan 3:16. " so charIndex accounts for it
    offsetRef.current = prefix.length
    const full = prefix + text
    const utterance = new SpeechSynthesisUtterance(full)
    utterance.lang = lang
    utterance.rate = 0.85

    const preferred = selectedVoice ?? voices.find(v => v.lang.startsWith(lang.split('-')[0]))
    if (preferred) utterance.voice = preferred

    utterance.onboundary = (e) => {
      if (e.name === 'word') setCharIndex(e.charIndex - offsetRef.current)
    }
    utterance.onstart = () => { setIsPlaying(true); setIsPaused(false) }
    utterance.onend   = () => { setIsPlaying(false); setIsPaused(false); setCharIndex(-1) }
    utterance.onerror = () => { setIsPlaying(false); setIsPaused(false); setCharIndex(-1) }

    window.speechSynthesis.speak(utterance)
  }, [voices, selectedVoice])

  const pause = useCallback(() => {
    window.speechSynthesis.pause()
    setIsPaused(true)
  }, [])

  const resume = useCallback(() => {
    window.speechSynthesis.resume()
    setIsPaused(false)
  }, [])

  const stop = useCallback(() => {
    window.speechSynthesis.cancel()
    setIsPlaying(false)
    setIsPaused(false)
    setCharIndex(-1)
  }, [])

  function getVoicesForLang(lang: string) {
    return voices.filter(v => v.lang.startsWith(lang.split('-')[0]))
  }

  return { isPlaying, isPaused, charIndex, speak, pause, resume, stop, voices, selectedVoice, setSelectedVoice, getVoicesForLang }
}
