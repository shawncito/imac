/**
 * Pre-generate Kokoro TTS audio for Bible verses.
 * Run once: node scripts/generate-tts.mjs
 * Output: public/audio/{lang}-{gender}.wav
 *
 * MULTILINGUAL SUPPORT:
 *   The free public ONNX model only has English voices.
 *   For es/pt/fr/hi/zh/ja/it you need a HuggingFace token:
 *   1. Create free account at huggingface.co
 *   2. Request access to onnx-community/Kokoro-82M-v1.0
 *   3. Create token at huggingface.co/settings/tokens
 *   4. Run: HF_TOKEN=hf_xxx node scripts/generate-tts.mjs
 */

import { KokoroTTS } from 'kokoro-js'
import { writeFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT_DIR = join(__dirname, '..', 'public', 'audio')

mkdirSync(OUT_DIR, { recursive: true })

const HAS_TOKEN = !!process.env.HF_TOKEN

// With token: multilingual model. Without: English only.
const MODEL_ID = HAS_TOKEN
  ? 'onnx-community/Kokoro-82M-v1.0'
  : 'onnx-community/Kokoro-82M-v1.0-ONNX'

// English voices (public model) — best quality picks
const EN_VOICES = { f: 'af_heart', m: 'am_fenrir' }

// Multilingual voices (requires HF token)
const VOICE_MAP = {
  en: EN_VOICES,
  ...(HAS_TOKEN ? {
    es: { f: 'ef_dora',    m: 'em_alex'    },
    pt: { f: 'pf_dora',    m: 'pm_alex'    },
    hi: { f: 'hf_alpha',   m: 'hm_omega'   },
    fr: { f: 'ff_siwis',   m: null         },
    zh: { f: 'zf_xiaobei', m: 'zm_yunyang' },
    ja: { f: 'jf_alpha',   m: 'jm_kumo'    },
    it: { f: 'if_sara',    m: 'im_nicola'  },
  } : {}),
}

// Verses data (mirrors src/data/verses.ts)
const VERSES = [
  { code: 'en', text: 'You did not choose me, but I chose you and appointed you so that you might go and bear fruit—fruit that will last—and so that whatever you ask in my name the Father will give you.' },
  { code: 'es', text: 'No me escogieron ustedes a mí, sino que yo los escogí a ustedes y los comisioné para que vayan y den fruto, un fruto que perdure. Así el Padre les dará todo lo que pidan en mi nombre.' },
  { code: 'pt', text: 'Não fui vocês que me escolheram, mas fui eu que os escolhi e os designei para que vão e deem fruto, fruto que permaneça. Assim o Pai lhes dará tudo o que pedirem em meu nome.' },
  { code: 'hi', text: 'तुम ने मुझे नहीं चुना, परन्तु मैं ने तुम्हें चुना और ठहराया कि तुम जाकर फल लाओ, और तुम्हारा फल बना रहे; कि तुम मेरे नाम से जो कुछ पिता से मांगो, वह तुम्हें दे।' },
  { code: 'fr', text: "Ce n'est pas vous qui m'avez choisi, c'est moi qui vous ai choisis, et je vous ai établis pour que vous alliez, que vous portiez du fruit, et que votre fruit demeure, afin que tout ce que vous demanderez au Père en mon nom, il vous l'accorde." },
  { code: 'zh', text: '不是你们拣选了我，是我拣选了你们，并且分派你们去结果子，叫你们的果子常存，使你们奉我的名，无论向父求什么，他就赐给你们。' },
  { code: 'ja', text: 'あなたがたがわたしを選んだのではなく、わたしがあなたがたを選んだのです。そして、あなたがたが行って実を結び、その実が残るように、また、わたしの名によって父に求めるものは何でも与えられるように、わたしはあなたがたを任命したのです。' },
  { code: 'it', text: 'Non siete voi che avete scelto me, ma sono io che ho scelto voi, e vi ho costituiti perché andiate e portiate frutto, e il vostro frutto rimanga; affinché tutto quello che chiederete al Padre nel mio nome, Egli ve lo dia.' },
]

function encodeWAV(float32Array, sampleRate) {
  const numSamples = float32Array.length
  const buffer = new ArrayBuffer(44 + numSamples * 2)
  const view = new DataView(buffer)

  const write = (offset, str) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i))
  }

  write(0, 'RIFF')
  view.setUint32(4, 36 + numSamples * 2, true)
  write(8, 'WAVE')
  write(12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)   // PCM
  view.setUint16(22, 1, true)   // mono
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * 2, true)
  view.setUint16(32, 2, true)
  view.setUint16(34, 16, true)
  write(36, 'data')
  view.setUint32(40, numSamples * 2, true)

  let offset = 44
  for (let i = 0; i < numSamples; i++) {
    const s = Math.max(-1, Math.min(1, float32Array[i]))
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true)
    offset += 2
  }

  return Buffer.from(buffer)
}

async function main() {
  console.log(`Loading Kokoro model: ${MODEL_ID}${HAS_TOKEN ? '' : ' (English only — set HF_TOKEN for multilingual)'}`)
  const opts = HAS_TOKEN
    ? { dtype: 'q8', device: 'cpu', token: process.env.HF_TOKEN }
    : { dtype: 'q8', device: 'cpu' }
  const tts = await KokoroTTS.from_pretrained(MODEL_ID, opts)
  console.log('Model loaded.\n')

  let generated = 0
  let skipped = 0

  for (const { code, text } of VERSES) {
    const voices = VOICE_MAP[code]
    if (!voices) { skipped++; continue }

    for (const [gender, voiceId] of Object.entries(voices)) {
      if (!voiceId) {
        console.log(`  [${code}] ${gender}: no voice available, skipping`)
        continue
      }

      const filename = `${code}-${gender}.wav`
      const outPath = join(OUT_DIR, filename)

      try {
        process.stdout.write(`  Generating ${filename} (${voiceId})... `)
        const audio = await tts.generate(text, { voice: voiceId, speed: 0.9 })
        const wav = encodeWAV(audio.audio, audio.sampling_rate)
        writeFileSync(outPath, wav)
        console.log(`done (${(wav.length / 1024).toFixed(0)} KB)`)
        generated++
      } catch (err) {
        console.error(`FAILED: ${err.message}`)
      }
    }
  }

  console.log(`\nDone: ${generated} files generated in public/audio/`)
  if (skipped) console.log(`${skipped} languages skipped (not supported by Kokoro)`)
}

main().catch(console.error)
