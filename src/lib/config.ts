import { useEffect, useState, useRef } from 'react'
import { supabase, getConfig } from './supabase'

/* ============================================================
   Resilient config layer — built for hundreds of concurrent
   phones on flaky church wifi.

   - cache-first (localStorage) → instant render, never blank
   - background revalidate (stale-while-revalidate)
   - ONE shared Realtime channel per client (admin edits live)
   - automatic degrade to polling if Realtime can't connect
   ============================================================ */

const CACHE_PREFIX = 'cfg:'
const POLL_MS = 45_000
const REALTIME_TIMEOUT_MS = 8_000

type Listener = () => void

// Module-level singletons so all screens share one channel + one cache.
const listeners = new Map<string, Set<Listener>>()
const store = new Map<string, unknown>()
let channelStarted = false
let polling = false

function readCache<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

function writeCache(key: string, value: unknown) {
  try {
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(value))
  } catch {
    /* quota / private mode — ignore, app still works in-memory */
  }
}

function emit(key: string) {
  listeners.get(key)?.forEach(fn => fn())
}

async function refresh(key: string) {
  const data = await getConfig<unknown>(key)
  if (data !== null && data !== undefined) {
    store.set(key, data)
    writeCache(key, data)
    emit(key)
  }
}

function refreshAll() {
  for (const key of listeners.keys()) refresh(key)
}

function startPolling() {
  if (polling) return
  polling = true
  setInterval(refreshAll, POLL_MS)
}

function startRealtime() {
  if (channelStarted) return
  channelStarted = true

  let connected = false
  const channel = supabase
    .channel('app_config_changes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'app_config' },
      payload => {
        const row = (payload.new ?? payload.old) as { key?: string } | null
        if (row?.key) refresh(row.key)
        else refreshAll()
      },
    )
    .subscribe(status => {
      if (status === 'SUBSCRIBED') connected = true
    })

  // If Realtime never connects (free-tier limit, blocked ws), degrade to polling.
  setTimeout(() => {
    if (!connected) startPolling()
  }, REALTIME_TIMEOUT_MS)

  // Belt-and-suspenders: a slow heartbeat poll even when Realtime is up,
  // so a missed event self-heals within a minute.
  setInterval(refreshAll, POLL_MS * 2)

  return channel
}

/**
 * Cache-first config hook. Renders instantly from localStorage or the
 * provided default, revalidates in the background, and updates live via
 * the shared Realtime channel (with polling fallback).
 */
export function useConfig<T>(key: string, fallback: T): T {
  const [value, setValue] = useState<T>(() => {
    if (store.has(key)) return store.get(key) as T
    const cached = readCache<T>(key)
    return cached ?? fallback
  })
  const fallbackRef = useRef(fallback)
  fallbackRef.current = fallback

  useEffect(() => {
    const sync = () => {
      if (store.has(key)) setValue(store.get(key) as T)
    }
    let set = listeners.get(key)
    if (!set) {
      set = new Set()
      listeners.set(key, set)
    }
    set.add(sync)

    startRealtime()
    refresh(key) // initial revalidate

    return () => {
      set?.delete(sync)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  return value
}

/**
 * Current time. If `demoTime` (ISO string) is set, returns that fixed
 * instant (used by admin to preview the live timeline mid-event).
 * Otherwise ticks real time every 30s.
 */
export function useNow(demoTime?: string | null): Date {
  const [now, setNow] = useState<Date>(() =>
    demoTime ? new Date(demoTime) : new Date(),
  )

  useEffect(() => {
    if (demoTime) {
      // Run the clock forward from the demo start point using real elapsed time.
      const demoStart = new Date(demoTime).getTime()
      const realStart = Date.now()
      const tick = () => setNow(new Date(demoStart + (Date.now() - realStart)))
      tick()
      const id = setInterval(tick, 1_000)   // 1s tick in demo — smooth transitions
      return () => clearInterval(id)
    }
    setNow(new Date())
    const id = setInterval(() => setNow(new Date()), 1_000) // 1s — countdown shows seconds
    return () => clearInterval(id)
  }, [demoTime])

  return now
}
