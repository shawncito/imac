/* Minimal dependency-free service worker.
   Goal: app loads on flaky church wifi after the first visit.
   - navigations: network-first, fall back to cached shell
   - same-origin GET assets: stale-while-revalidate (cache as fetched)
   - Supabase / cross-origin API: never intercepted (always live)
*/
const CACHE = 'mision-biblica-v2'
const SHELL = '/index.html'

// En desarrollo (localhost) el SW no debe cachear: rompe HMR y oculta cambios.
const DEV = self.location.hostname === 'localhost' || self.location.hostname === '127.0.0.1'

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.add(SHELL)).catch(() => {}))
  self.skipWaiting()
})

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    // Purga TODA cache vieja (incluye v1 con el bundle anterior).
    const keys = await caches.keys()
    await Promise.all(keys.filter((k) => k !== CACHE || DEV).map((k) => caches.delete(k)))
    // En dev, auto-desregistrar para liberar la página por completo.
    if (DEV) await self.registration.unregister()
    await self.clients.claim()
  })())
})

self.addEventListener('fetch', (e) => {
  const req = e.request
  if (req.method !== 'GET') return
  if (DEV) return // dev: nunca interceptar, todo va a la red (Vite/HMR)

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
