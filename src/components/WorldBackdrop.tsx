import { useRef } from 'react'
import { motion, useMotionValue, useMotionValueEvent, useSpring } from 'motion/react'
import { flightProgress } from '../lib/flightProgress'

const ACCENT = '#FF5A1F'

// Simplified continent silhouettes on a 1000×600 equirectangular-ish canvas.
// Faint, decorative — reads as a world map without being cartographically exact.
export const CONTINENTS: string[] = [
  // North America
  'M150 95 Q200 70 265 85 Q325 95 330 130 Q333 152 308 160 Q320 182 292 196 L305 226 Q284 262 258 246 Q264 212 242 206 Q232 226 216 214 L227 184 Q196 184 191 158 Q160 162 157 132 Q150 108 150 95 Z',
  // Greenland
  'M372 58 Q408 52 414 84 Q418 116 386 126 Q360 120 360 90 Q358 66 372 58 Z',
  // South America
  'M278 282 Q310 270 326 298 Q342 330 326 372 Q315 418 288 438 Q272 422 278 390 Q262 374 268 342 Q257 310 273 296 Q274 286 278 282 Z',
  // Europe
  'M478 100 Q520 90 552 100 Q573 110 562 132 L573 148 Q552 164 526 158 Q510 174 494 163 Q478 168 476 147 Q463 126 478 100 Z',
  // Africa
  'M492 190 Q540 178 577 196 Q598 207 592 238 Q603 276 576 312 Q560 354 533 364 Q512 358 512 326 Q491 300 499 263 Q480 231 492 190 Z',
  // Asia
  'M578 88 Q668 66 762 82 Q846 92 856 134 Q861 170 824 181 Q793 207 751 196 Q720 222 689 206 Q658 217 642 196 Q606 201 600 170 Q574 154 590 128 Q574 108 578 88 Z',
  // India peninsula
  'M636 200 Q660 205 666 228 Q670 256 650 272 Q636 262 638 238 Q628 218 636 200 Z',
  // SE Asia / Indonesia (island specks)
  'M730 232 Q752 228 760 244 Q762 260 742 264 Q724 258 730 232 Z',
  'M782 250 Q800 248 804 262 Q802 274 786 272 Q774 264 782 250 Z',
  // Australia
  'M778 330 Q830 320 872 336 Q898 352 887 384 Q871 410 834 410 Q797 404 781 378 Q768 352 778 330 Z',
]

// THE flight route — Centroamérica → Rusia oriental.
// Coordinates live in the SAME 1000×600 viewBox as the continents below, so the
// endpoints stay anchored to the actual landmasses on every device width: the SVG
// scales uniformly (preserveAspectRatio="xMidYMid meet"), nothing is decoupled.
// ORIGIN = Central America (North-America tail). DEST = far-east Russia (Asia tip).
const ORIGIN = { x: 278, y: 240 }  // Norteamérica (sobre tierra)
const DEST   = { x: 815, y: 150 }  // Rusia oriental
// Single gentle arc between the two anchors.
export const FLIGHT_PATH = `M${ORIGIN.x} ${ORIGIN.y} C440 130 650 110 ${DEST.x} ${DEST.y}`

// Clean top-view airplane silhouette, nose pointing up (-y).
export function Plane({ size = 16, color = ACCENT, opacity = 1 }: { size?: number; color?: string; opacity?: number }) {
  return (
    <path
      d="M0 -13 C2 -13 3 -9 3 -5 L13 3 L13 7 L3 3 L3 8 L7 12 L7 14 L0 11 L-7 14 L-7 12 L-3 8 L-3 3 L-13 7 L-13 3 L-3 -5 C-3 -9 -2 -13 0 -13 Z"
      fill={color}
      opacity={opacity}
      transform={`scale(${size / 13})`}
    />
  )
}

/**
 * Global decorative backdrop: faint continents + the static flight route.
 * When `showPlane` is true (Misiones tab), a plane flies along the route,
 * driven by `flightProgress`. Leaving the page just unmounts the plane —
 * the route stays.
 */
export default function WorldBackdrop({ showPlane = false }: { showPlane?: boolean }) {
  const pathRef = useRef<SVGPathElement>(null)
  const lastT = useRef(0)
  const dir = useRef(1)
  const x = useMotionValue(ORIGIN.x)
  const y = useMotionValue(ORIGIN.y)
  const rotate = useMotionValue(90)
  const smooth = useSpring(flightProgress, { stiffness: 120, damping: 26, mass: 0.4 })
  const smoothRotate = useSpring(rotate, { stiffness: 200, damping: 24 })

  useMotionValueEvent(smooth, 'change', v => {
    const path = pathRef.current
    if (!path) return
    const len = path.getTotalLength()
    const t = Math.min(1, Math.max(0, v))
    if (Math.abs(t - lastT.current) > 0.0005) {
      dir.current = t > lastT.current ? 1 : -1
      lastT.current = t
    }
    const p = path.getPointAtLength(len * t)
    const p2 = path.getPointAtLength(Math.min(len, len * t + 1))
    x.set(p.x); y.set(p.y)
    const heading = (Math.atan2(p2.y - p.y, p2.x - p.x) * 180) / Math.PI + 90
    rotate.set(dir.current === 1 ? heading : heading + 180)
  })

  return (
    <div className="misionero-bg" aria-hidden="true">
      {/* Single SVG: continents + flight route share one 1000×600 space, so the
          route endpoints stay anchored to the map landmasses at any device width. */}
      <svg className="wb-map" viewBox="200 40 660 360" fill="none" preserveAspectRatio="xMidYMid meet">
        <defs>
          <radialGradient id="wb-fade" cx="50%" cy="22%" r="70%">
            <stop offset="0%" stopColor="#fff" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#fff" stopOpacity="0" />
          </radialGradient>
          <mask id="wb-mask"><rect width="1000" height="600" fill="url(#wb-fade)" /></mask>
        </defs>
        <g mask="url(#wb-mask)" fill="#2c477f" fillOpacity="0.5" stroke="#3a5896" strokeWidth="0.8" strokeOpacity="0.6">
          {CONTINENTS.map((d, i) => <path key={i} d={d} />)}
        </g>

        {/* Static dashed route + endpoints + optional plane */}
        <path ref={pathRef} d={FLIGHT_PATH} stroke={ACCENT} strokeOpacity="0.55"
          strokeWidth="2.5" strokeDasharray="4 9" strokeLinecap="round" />
        <circle cx={ORIGIN.x} cy={ORIGIN.y} r="4.5" fill={ACCENT} fillOpacity="0.55" />
        <circle cx={DEST.x} cy={DEST.y} r="4.5" fill={ACCENT} fillOpacity="0.55" />
        {showPlane && (
          <motion.g style={{ x, y, rotate: smoothRotate }}>
            <Plane size={16} opacity={0.95} />
          </motion.g>
        )}
      </svg>
    </div>
  )
}
