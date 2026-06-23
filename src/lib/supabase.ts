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
  
  const { error, data } = await supabase.storage
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
