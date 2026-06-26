import { useState, useCallback } from 'react'
import { languages } from '../data/verses'
import { useAudioTTS, getAudioVoices } from './useAudioTTS'

function randIdx(n: number, exclude: number) {
  if (n <= 1) return 0
  let i = exclude
  while (i === exclude) i = Math.floor(Math.random() * n)
  return i
}

/**
 * Global media-player state. Lives at App level so audio persists across page
 * navigation and the header can act as a mini-player (play/pause/indicator)
 * no matter which tab is open.
 */
export function usePlayer() {
  const tts = useAudioTTS()
  const [selectedLang, setSelectedLang] = useState(0)
  const [verseIndex, setVerseIndex]     = useState(0)

  const lang    = languages[selectedLang]
  const verse   = lang.verses[verseIndex]
  const audioVoices       = getAudioVoices(lang.code)
  const currentAudioVoice = audioVoices.find(v => v.id === tts.voiceId) ?? audioVoices[0]

  const play = useCallback(() => {
    tts.speak(verse.text, lang.ttsLang)
  }, [tts, verse, lang])

  const togglePlay = useCallback(() => {
    if (tts.isPaused)  { tts.resume(); return }
    if (tts.isPlaying) { tts.pause();  return }
    play()
  }, [tts, play])

  const pickLang = useCallback((idx: number) => {
    tts.stop()
    setSelectedLang(idx)
    setVerseIndex(randIdx(languages[idx].verses.length, -1))
    tts.setVoiceId(null)
  }, [tts])

  // Change voice → stop + reset; user presses play to hear the new voice.
  const pickVoice = useCallback((id: string) => {
    tts.stop()
    tts.setVoiceId(id)
  }, [tts])

  // Restart = replay from the beginning (works mid-play, paused, or after end).
  const restart = useCallback(() => { play() }, [play])

  const isActive = tts.isPlaying || tts.isPaused

  return {
    ...tts,
    selectedLang, verseIndex, setVerseIndex,
    lang, verse, audioVoices, currentAudioVoice,
    play, togglePlay, pickLang, pickVoice, restart, isActive,
  }
}

export type Player = ReturnType<typeof usePlayer>
