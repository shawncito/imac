import { useMemo } from 'react'

interface Word {
  text: string
  start: number
  isSpace: boolean
}

interface Props {
  text: string
  lang: string
  charIndex: number
}

export function VerseText({ text, lang, charIndex }: Props) {
  const tokens = useMemo<Word[]>(() => {
    const result: Word[] = []
    let pos = 0
    // Split keeping spaces as tokens
    for (const chunk of text.split(/(\s+)/)) {
      result.push({ text: chunk, start: pos, isSpace: /^\s+$/.test(chunk) })
      pos += chunk.length
    }
    return result
  }, [text])

  return (
    <p
      className="font-serif text-[oklch(13%_0.01_250)] text-[18px] leading-[1.85] text-center"
      dir={lang === 'ar' ? 'rtl' : 'ltr'}
      lang={lang}
    >
      &ldquo;
      {tokens.map((tok, i) => {
        if (tok.isSpace) return tok.text

        const wordEnd = tok.start + tok.text.length
        const highlighted = charIndex >= 0 && charIndex >= tok.start && charIndex < wordEnd

        return (
          <span
            key={i}
            className={[
              'rounded-[3px] transition-all duration-150',
              highlighted
                ? 'bg-[oklch(74%_0.15_82)] text-[oklch(11%_0.01_250)] px-[2px] -mx-[2px]'
                : '',
            ].join(' ')}
          >
            {tok.text}
          </span>
        )
      })}
      &rdquo;
    </p>
  )
}
