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

export async function setConfig(key: string, value: unknown): Promise<void> {
  await supabase
    .from('app_config')
    .upsert({ key, value, updated_at: new Date().toISOString() })
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

/** Insert via the validated `submit_verse` RPC (server enforces all rules). */
export async function submitVerse(input: {
  verseReference: string; verseText: string; signerName: string; deviceId: string
}): Promise<SubmitResult> {
  const { data, error } = await supabase.rpc('submit_verse', {
    p_reference: input.verseReference,
    p_text: input.verseText,
    p_name: input.signerName,
    p_device: input.deviceId,
  })
  if (error) {
    const m = error.message || ''
    if (m.includes('RATE_LIMIT')) return { ok: false, reason: 'RATE_LIMIT' }
    if (m.includes('PROFANITY')) return { ok: false, reason: 'PROFANITY' }
    if (m.includes('NAME_FORMAT')) return { ok: false, reason: 'NAME_FORMAT' }
    return { ok: false, reason: 'ERROR' }
  }
  // rpc returns the inserted row (object, or single-element array depending on PostgREST)
  const row = (Array.isArray(data) ? data[0] : data) as VerseSubmission
  return { ok: true, row }
}

/** Admin soft-delete. */
export async function hideSubmission(id: string): Promise<void> {
  await supabase.from('verse_submissions').update({ hidden: true }).eq('id', id)
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
