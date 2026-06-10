/* Minimal dependency-free service worker.
   Goal: app loads on flaky church wifi after the first visit.
   - navigations: network-first, fall back to cached shell
   - same-origin GET assets: stale-while-revalidate (cache as fetched)
   - Supabase / cross-origin API: never intercepted (always live)
*/
const CACHE = 'mision-biblica-v1'
const SHELL = '/index.html'

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.add(SHELL)).catch(() => {}))
  self.skipWaiting()
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', (e) => {
  const req = e.request
  if (req.method !== 'GET') return

  const url = new URL(req.url)
  // Only handle our own origin; let Supabase + fonts go straight to network.
  if (url.origin !== self.location.origin) return

  // Navigations → network-first, fall back to cached shell.
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then((res) => {
          // Clone synchronously — before any async handoff — or body is already used.
          const clone = res.clone()
          caches.open(CACHE).then((c) => c.put(SHELL, clone))
          return res
        })
        .catch(() => caches.match(SHELL))
    )
    return
  }

  // Static assets → stale-while-revalidate.
  e.respondWith(
    caches.match(req).then((cached) => {
      const live = fetch(req)
        .then((res) => {
          if (res && res.status === 200) {
            const clone = res.clone()
            caches.open(CACHE).then((c) => c.put(req, clone))
          }
          return res
        })
        .catch(() => cached)
      return cached || live
    })
  )
})
