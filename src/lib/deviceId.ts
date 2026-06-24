// Stable per-device id used to rate-limit verse submissions (1 per 5h).
// Not security — just a casual-spam gate. The DB function is the real guard.
export function getDeviceId(): string {
  let id = localStorage.getItem('device_id')
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem('device_id', id)
  }
  return id
}

const LAST_KEY = 'last_verse_submit'

/** Remember the moment of the last successful submit (instant client-side gate). */
export function markSubmitted(): void {
  localStorage.setItem(LAST_KEY, String(Date.now()))
}

/** ms remaining until the device may submit again, or 0 if allowed. */
export function cooldownRemaining(windowMs = 5 * 3600_000): number {
  const last = Number(localStorage.getItem(LAST_KEY) || 0)
  if (!last) return 0
  return Math.max(0, last + windowMs - Date.now())
}
