// Edge Function: submit-verse
// Flujo de moderación de DOS CAPAS para el nombre del firmante:
//   Capa 1 — blocklist local (rápida, sin red, sin costo).
//   Capa 2 — Google Perspective API (GRATIS, sin billing; banco multilingüe que
//            atrapa insultos que no están en la lista).
// Si pasa ambas, inserta vía la RPC `submit_verse` usando el service-role key
// (no bypasseable: en producción se revoca el execute de submit_verse a anon — ver 0002_moderation.sql).
//
// Secrets (Supabase → Edge Functions → Secrets):
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (inyectados por defecto),
//   PERSPECTIVE_API_KEY (opcional; sin él, corre solo capa 1 — todo gratis).
//
// API key gratis: console.cloud.google.com → habilitar "Perspective Comment
// Analyzer API" → crear API key. No requiere tarjeta ni billing.
//
// Deploy:  supabase functions deploy submit-verse --no-verify-jwt

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const LEET: Record<string, string> = {
  '4': 'a', '0': 'o', '1': 'i', '3': 'e', '5': 's', '7': 't', $: 's', '@': 'a',
}
const BLOCKLIST = [
  'puta','puto','puton','putona','mierda','mierd','verga','vergon',
  'pendejo','pendeja','cabron','cabrona','culero','culera','culo','culon','culona',
  'chinga','chingo','chingon','cono','joder','polla','marica','maricon',
  'zorra','zorras','perra','perras','pinche','caca','ojete','mamon','mamona',
  'huevon','huevona','hueva','guey','wey','webon','cojon','cojones',
  'idiota','imbecil','estupido','estupida','pedo',
  'fuck','fucker','fucking','shit','bitch','asshole','ass','dick','pussy',
  'cunt','whore','nigger','nigga','bastard','damn','crap',
]

function normalize(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[40135$@7]/g, (c) => LEET[c] ?? c)
    .replace(/[^a-z]/g, '')
    .replace(/(.)\1+/g, '$1')
}
function blocklistHit(text: string): boolean {
  const norm = normalize(text)
  return BLOCKLIST.some((w) => norm.includes(w))
}

// Capa 2 — Google Perspective API (gratis). Fail-open: si falla, se acepta (ya pasó capa 1).
// Marca si TOXICITY / INSULT / PROFANITY supera el umbral.
const TOXICITY_THRESHOLD = 0.8
async function moderationFlags(name: string): Promise<boolean> {
  const key = Deno.env.get('PERSPECTIVE_API_KEY')
  if (!key) return false // sin key → degrada a solo capa 1 (gratis)
  try {
    const res = await fetch(
      `https://commentanalyzer.googleapis.com/v1alpha1/comments:analyze?key=${key}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          comment: { text: name },
          languages: ['es', 'en'],
          requestedAttributes: { TOXICITY: {}, INSULT: {}, PROFANITY: {} },
        }),
        signal: AbortSignal.timeout(4000),
      },
    )
    if (!res.ok) return false
    const data = await res.json()
    const scores = data?.attributeScores ?? {}
    return ['TOXICITY', 'INSULT', 'PROFANITY'].some(
      (a) => (scores[a]?.summaryScore?.value ?? 0) >= TOXICITY_THRESHOLD,
    )
  } catch {
    return false // timeout/caída → fail-open
  }
}

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } })

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json({ ok: false, reason: 'ERROR' }, 405)

  let body: Record<string, unknown>
  try { body = await req.json() } catch { return json({ ok: false, reason: 'ERROR' }, 400) }

  const reference = String(body.verseReference ?? '')
  const text = String(body.verseText ?? '')
  const name = String(body.signerName ?? '')
  const device = String(body.deviceId ?? '')
  const region = body.region == null ? null : String(body.region)

  // Capa 1 — blocklist local sobre el nombre.
  if (blocklistHit(name)) return json({ ok: false, reason: 'PROFANITY' })
  // Capa 2 — API de moderación (solo lo que pasó capa 1).
  if (await moderationFlags(name)) return json({ ok: false, reason: 'PROFANITY' })

  // Insertar vía la RPC validada, con service-role. submit_verse re-valida todo
  // server-side (rate-limit, formato, caps, region, blocklist) — defensa en profundidad.
  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )
  const { data, error } = await admin.rpc('submit_verse', {
    p_reference: reference, p_text: text, p_name: name, p_device: device, p_region: region,
  })
  if (error) {
    const m = error.message || ''
    const reason = m.includes('RATE_LIMIT') ? 'RATE_LIMIT'
      : m.includes('PROFANITY') ? 'PROFANITY'
      : m.includes('NAME_FORMAT') ? 'NAME_FORMAT'
      : 'ERROR'
    return json({ ok: false, reason })
  }
  const row = Array.isArray(data) ? data[0] : data
  return json({ ok: true, row })
})
