import { AREAS, walkBounds, type RoomId } from '../placeLayout'

/**
 * Where things are on the screen in the 2D view of a place. A place is a floor (x across, z toward the viewer) under a
 * back wall; the screen shows it from the front and a little above: the back wall at the top, the front of the floor at
 * the bottom, things further back a little smaller. The corridor and the yard are longer than the screen, so the view
 * follows her along; the library is shown whole. Pure numbers.
 */
export type Frame = {
  W: number
  H: number
  place: RoomId
  /** The x of the middle of the screen. */
  camX: number
  /** Pixels in a world unit at the middle of the floor. */
  scale: number
  /** The screen's y where the wall meets the floor. */
  horizon: number
  /** The screen's y of the front edge of the floor. */
  bottom: number
}

/** How many world units wide the screen shows: the whole room for the library, a stretch of it for the yard and the corridor (less on a phone held upright). */
export function spanOf(place: RoomId, W: number, H: number): number {
  const whole = AREAS[place].halfW * 2
  const portrait = H > W
  const wanted = place === 'library' ? whole : place === 'sports' ? (portrait ? 9 : whole) : place === 'yard' ? (portrait ? 11 : 18) : portrait ? 9 : 15
  return Math.min(whole, wanted)
}

/** The x the middle of the screen looks at when she stands at `x`: she is in the middle, but the view stops at the ends of the room. */
export function followX(place: RoomId, W: number, H: number, x: number): number {
  const reach = AREAS[place].halfW - spanOf(place, W, H) / 2
  return Math.min(reach, Math.max(-reach, x))
}

export function frameFor(place: RoomId, W: number, H: number, camX: number): Frame {
  return { W, H, place, camX, scale: W / spanOf(place, W, H), horizon: H * (place === 'hall' ? 0.5 : 0.42), bottom: H * 0.97 }
}

/** How big things are at depth `z` compared with the middle of the floor: a little smaller at the back, a little bigger at the front. */
export function depthScale(f: Frame, z: number): number {
  return 0.8 + 0.4 * depthFraction(f, z)
}

/** 0 at the back wall, 1 at the front edge. */
function depthFraction(f: Frame, z: number): number {
  const d = AREAS[f.place].halfD
  return Math.min(1, Math.max(0, (z + d) / (2 * d)))
}

/** Where the foot of a thing at the world position (x, z) is on the screen, and how big it is there (`k`, 1 in the middle). */
export function project(f: Frame, x: number, z: number): { x: number; y: number; k: number } {
  const k = depthScale(f, z)
  return { x: f.W / 2 + (x - f.camX) * f.scale * k, y: f.horizon + depthFraction(f, z) * (f.bottom - f.horizon), k }
}

/** The world position of a point on the floor of the screen (the opposite of `project`), kept inside where she can walk. */
export function unproject(f: Frame, sx: number, sy: number): { x: number; z: number } {
  const d = AREAS[f.place].halfD
  const t = Math.min(1, Math.max(0, (sy - f.horizon) / (f.bottom - f.horizon)))
  const z = -d + t * 2 * d
  const k = depthScale(f, z)
  const b = walkBounds(f.place)
  return { x: Math.min(b.maxX, Math.max(b.minX, f.camX + (sx - f.W / 2) / (f.scale * k))), z: Math.min(b.maxZ, Math.max(b.minZ, z)) }
}

/** How big a unicorn is drawn (its body length in pixels) at the world position `z`: about two world units, never tiny, never taller than a third of the screen. */
export function figureSize(f: Frame, z: number, units = 2): number {
  return Math.min(f.H * 0.34, Math.max(f.H * 0.12, units * f.scale * depthScale(f, z)))
}
