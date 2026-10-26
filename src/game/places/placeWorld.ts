import type { Keys } from '../types'

/** How fast she walks, in world units a second (the same pace as in the classroom: 210 design pixels = 2.1 units). */
export const WALK_SPEED = 2.1

export type Bounds = { minX: number; maxX: number; minZ: number; maxZ: number }

export type WalkTarget = {
  x: number
  z: number
  /** Close enough to have arrived (default a step). */
  radius?: number
  onArrive?: () => void
}

/** Where she is and what she is doing, in a place of free play (world units, no design pixels). */
export type Walker = {
  x: number
  z: number
  facingLeft: boolean
  moving: boolean
  target: WalkTarget | null
}

export function createWalker(x: number, z: number): Walker {
  return { x, z, facingLeft: false, moving: false, target: null }
}

const DEFAULT_ARRIVE = 0.12

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

/**
 * One step of walking: the arrow keys (or WASD) win over a tapped target, as in the classroom; with a target she
 * walks straight to it, and when she is there it is dropped and `onArrive` is called once.
 */
export function stepWalker(w: Walker, { dt, keys, bounds, speed = WALK_SPEED }: { dt: number; keys: Keys; bounds: Bounds; speed?: number }): void {
  const left = keys['arrowleft'] || keys['a']
  const right = keys['arrowright'] || keys['d']
  const up = keys['arrowup'] || keys['w']
  const down = keys['arrowdown'] || keys['s']
  let moving = false
  let vx = 0

  if (left || right || up || down) {
    w.target = null
    vx = (right ? 1 : 0) - (left ? 1 : 0)
    const vz = (down ? 1 : 0) - (up ? 1 : 0)
    const length = Math.hypot(vx, vz) || 1
    // Diagonals are not faster.
    w.x = clamp(w.x + (vx / length) * speed * dt, bounds.minX, bounds.maxX)
    w.z = clamp(w.z + (vz / length) * speed * dt, bounds.minZ, bounds.maxZ)
    moving = vx !== 0 || vz !== 0
  } else if (w.target) {
    const { target } = w
    const dx = target.x - w.x
    const dz = target.z - w.z
    const distance = Math.hypot(dx, dz)
    if (distance <= (target.radius ?? DEFAULT_ARRIVE)) {
      w.target = null
      target.onArrive?.()
    } else {
      const step = Math.min(distance, speed * dt)
      const x = clamp(w.x + (dx / distance) * step, bounds.minX, bounds.maxX)
      const z = clamp(w.z + (dz / distance) * step, bounds.minZ, bounds.maxZ)
      // A tap outside the room brings her to its edge, and she stops there instead of walking on the spot.
      const blocked = x === w.x && z === w.z
      w.x = x
      w.z = z
      vx = dx
      moving = !blocked
      if (blocked) w.target = null
    }
  }

  w.moving = moving
  // Face the way she goes; standing, the way she last went.
  if (Math.abs(vx) > 0.05) w.facingLeft = vx < 0
}
