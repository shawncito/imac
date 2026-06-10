import { motionValue } from 'motion/react'

// Shared 0→1 scroll progress of the Misiones page. The global WorldBackdrop
// reads this to fly the plane along the static route; MisionesPage writes it.
export const flightProgress = motionValue(0)
