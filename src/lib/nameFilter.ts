// Client-side mirror of the server `submit_verse` validation. Gives instant
// feedback; the Postgres function is the non-bypassable source of truth.

// Blocklist must stay in sync with the v_block array in the SQL function.
// Stored already-normalized (no accents, lowercase).
const BLOCKLIST = [
  'puta', 'puto', 'mierda', 'verga', 'pendejo', 'cabron', 'culero', 'chinga',
  'cono', 'joder', 'polla', 'marica', 'maricon', 'zorra', 'perra', 'pinche',
  'fuck', 'shit', 'bitch', 'asshole', 'dick', 'pussy', 'cunt', 'whore', 'nigger',
]

const LEET: Record<string, string> = {
  '4': 'a', '0': 'o', '1': 'i', '3': 'e', '5': 's', '7': 't', $: 's', '@': 'a',
}

/** Lowercase, strip accents, de-leet, drop separators, collapse repeats. */
function normalize(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '') // strip diacritics
    .replace(/[40135$@7]/g, c => LEET[c] ?? c)        // leetspeak
    .replace(/[^a-z]/g, '')                            // drop separators/spaces
    .replace(/(.)\1+/g, '$1')                          // collapse repeats
}

export type NameCheck = { ok: true } | { ok: false; reason: string }

/** Layer 1 — format only (letters/accents/spaces/-/'/., 2–40 chars, ≤4 words). */
export function validateNameFormat(name: string): NameCheck {
  const trimmed = name.trim()
  if (trimmed.length < 2) return { ok: false, reason: 'Escribe tu nombre (mínimo 2 letras).' }
  if (name.length > 40) return { ok: false, reason: 'El nombre es muy largo (máx. 40).' }
  if (!/^[A-Za-zÀ-ÿ'.\- ]+$/.test(name)) return { ok: false, reason: 'Usa solo letras y espacios.' }
  if (trimmed.split(/\s+/).length > 4) return { ok: false, reason: 'Usa tu nombre, no una frase.' }
  return { ok: true }
}

/** Layer 2 — blocklist over normalized text (name and/or verse text). */
export function isClean(text: string): boolean {
  const norm = normalize(text)
  return !BLOCKLIST.some(w => norm.includes(w))
}

/** Combined check for a signer name. */
export function checkName(name: string): NameCheck {
  const fmt = validateNameFormat(name)
  if (!fmt.ok) return fmt
  if (!isClean(name)) return { ok: false, reason: 'Ese nombre no está permitido.' }
  return { ok: true }
}
