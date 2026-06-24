import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Analytics } from '@vercel/analytics/react'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    <Analytics />
  </StrictMode>,
)

// PWA: register the service worker (offline app shell on flaky wifi).
// Solo en producción: en dev el SW cachea los módulos de Vite y sirve
// versiones viejas (rompe HMR y oculta cambios recientes).
if ('serviceWorker' in navigator) {
  if (import.meta.env.PROD) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {})
    })
  } else {
    // En dev: matar cualquier SW ya registrado + limpiar su cache.
    navigator.serviceWorker.getRegistrations().then(rs => rs.forEach(r => r.unregister()))
    if (window.caches) caches.keys().then(ks => ks.forEach(k => caches.delete(k)))
  }
}
