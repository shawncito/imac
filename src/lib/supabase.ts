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
  const { error } = await supabase.storage
    .from('images')
    .upload(path, file, { upsert: true, contentType: file.type })
  if (error) throw new Error(error.message)
  const { data } = supabase.storage.from('images').getPublicUrl(path)
  return data.publicUrl
}
