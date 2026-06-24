import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL as string,
  import.meta.env.VITE_SUPABASE_ANON_KEY as string,
)

export async function getConfig<T>(key: string): Promise<T | null> {
  const { data, error } = await supabase
    .from('app_config')
    .select('value')
    .eq('key', key)
    .single()
  if (error || !data) return null
  return data.value as T
}

/** Write config via the admin-only `set_config` RPC (server enforces is_admin via JWT). */
export async function setConfig(key: string, value: unknown): Promise<void> {
  const { error } = await supabase.rpc('set_config', { p_key: key, p_value: value })
  if (error) throw new Error(error.message)
}

/** Upload a file to Supabase Storage `images` bucket. Returns the public URL. */
export async function uploadImage(file: File, path: string): Promise<string> {
  // Sanitize path: remove double slashes, trim, and ensure no trailing slashes
  const cleanPath = path.replace(/\/+/g, '/').trim().replace(/\/$/, '')
  
  const { error } = await supabase.storage
    .from('imagenes')
    .upload(cleanPath, file, { 
      upsert: true, 
      contentType: file.type || 'application/octet-stream'
    })
  
  if (error) {
    console.error('Upload error:', {
      message: error.message,
      statusCode: (error as { statusCode?: string }).statusCode,
      cause: (error as { error?: string }).error,
      path: cleanPath,
      file: file.name,
      size: file.size,
    })
    const detail = (error as { error?: string }).error ?? error.message ?? 'error desconocido'
    throw new Error(`Error al subir imagen (${(error as { statusCode?: string }).statusCode ?? '?'}): ${detail}`)
  }
  
  const { data: urlData } = supabase.storage.from('imagenes').getPublicUrl(cleanPath)
  return urlData.publicUrl
}

// ─── Verse board (Pizarra) ─────────────────────────────────────────────────────
export type VerseSubmission = {
  id: string
  verse_reference: string
  verse_text: string
  signer_name: string
  device_id: string
  hidden: boolean
  likes: number
  region: string | null
  created_at: string
}

/** Public feed — newest first, hidden excluded. */
export async function getVerseSubmissions(limit = 40): Promise<VerseSubmission[]> {
  const { data, error } = await supabase
    .from('verse_submissions')
    .select('*')
    .eq('hidden', false)
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error || !data) return []
  return data as VerseSubmission[]
}

/** Admin feed — includes hidden. */
export async function getAllVerseSubmissions(limit = 200): Promise<VerseSubmission[]> {
  const { data, error } = await supabase
    .from('verse_submissions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error || !data) return []
  return data as VerseSubmission[]
}

export type SubmitResult =
  | { ok: true; row: VerseSubmission }
  | { ok: false; reason: 'RATE_LIMIT' | 'PROFANITY' | 'NAME_FORMAT' | 'ERROR' }

/**
 * Submit via the `submit-verse` Edge Function, which runs the two-layer name
 * moderation (local blocklist → OpenAI Moderation API) and then inserts with the
 * service role. The Postgres `submit_verse` re-validates everything (rate-limit,
 * format, length caps, region, blocklist) as defense-in-depth.
 */
export async function submitVerse(input: {
  verseReference: string; verseText: string; signerName: string; deviceId: string; region?: string
}): Promise<SubmitResult> {
  const { data, error } = await supabase.functions.invoke('submit-verse', {
    body: {
      verseReference: input.verseReference,
      verseText: input.verseText,
      signerName: input.signerName,
      deviceId: input.deviceId,
      region: input.region ?? null,
    },
  })
  if (error || !data) return { ok: false, reason: 'ERROR' }
  return data as SubmitResult
}

/** Increment likes on a submission. One like per (verse, device) — server dedupes. */
export async function likeVerse(id: string, deviceId: string): Promise<void> {
  await supabase.rpc('like_verse', { p_id: id, p_device: deviceId })
}

/** Decrement likes on a submission (removes this device's like). */
export async function unlikeVerse(id: string, deviceId: string): Promise<void> {
  await supabase.rpc('unlike_verse', { p_id: id, p_device: deviceId })
}

/** Admin soft-delete via SECURITY DEFINER RPC (bypasses RLS). */
export async function hideSubmission(id: string): Promise<void> {
  const { error } = await supabase.rpc('hide_verse', { p_id: id })
  if (error) throw new Error(error.message)
}

/** Admin un-hide. */
export async function unhideSubmission(id: string): Promise<void> {
  const { error } = await supabase.rpc('unhide_verse', { p_id: id })
  if (error) throw new Error(error.message)
}

/** Admin hard-delete via SECURITY DEFINER RPC (bypasses RLS). */
export async function deleteSubmission(id: string): Promise<void> {
  const { error } = await supabase.rpc('delete_verse', { p_id: id })
  if (error) throw new Error(error.message)
}

/** Timestamp (ms) of this device's last submission, or 0. Used for the UX gate. */
export async function getDeviceLastSubmit(deviceId: string): Promise<number> {
  const { data, error } = await supabase
    .from('verse_submissions')
    .select('created_at')
    .eq('device_id', deviceId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error || !data) return 0
  return new Date((data as { created_at: string }).created_at).getTime()
}
