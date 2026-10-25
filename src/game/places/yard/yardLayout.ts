import { DOOR_SPOTS, walkBounds } from '../placeLayout'

/** Where everything in the yard stands (world units, x across, z toward the camera). One place for the picture, the taps and the tests. */
export type Spot = { x: number; z: number }

/** Where the trampoline and the ball start (the games are in yardGames.ts). */
export const TRAMPOLINE_AT = { x: -4, z: 1 } as const
export const BALL_START = { x: 3, z: 2.5 } as const

export const YARD_SPOTS = {
  /** The big tree on the right; the koala sleeps in it. */
  tree: { x: 11.4, z: -1.2 },
  /** The sandbox on the left, with the mint friend beside it. */
  sandbox: { x: -9.6, z: 3.4 },
  /** The puddle at the front, where the capybara bathes. */
  puddle: { x: -0.2, z: 4.9 },
  swing: { x: 8.6, z: 3.9 },
  slide: { x: 0.8, z: -3.7 },
  cart: { x: -12.2, z: -0.2 },
  friendDay: { x: 6.4, z: -2.4 },
  friendPlay: { x: -7.6, z: 1.9 },
} as const satisfies Record<string, Spot>

/** How much room each thing takes on the ground (a radius), so nothing is built over something else or over a door. */
export const YARD_RADII = {
  tree: 1.6,
  sandbox: 1.9,
  puddle: 1.5,
  swing: 2.0,
  slide: 2.7,
  cart: 1.2,
  trampoline: 1.6,
  ball: 0.5,
  friend: 0.8,
  door: 1.8,
} as const

/** Everything that stands on the ground and takes room, with where and how much. */
export function yardObstacles(): { id: string; x: number; z: number; r: number }[] {
  const s = YARD_SPOTS
  const doors = Object.entries(DOOR_SPOTS.yard).map(([to, d]) => ({ id: `door:${to}`, x: d![0], z: d![2], r: YARD_RADII.door }))
  return [
    { id: 'tree', ...s.tree, r: YARD_RADII.tree },
    { id: 'sandbox', ...s.sandbox, r: YARD_RADII.sandbox },
    { id: 'puddle', ...s.puddle, r: YARD_RADII.puddle },
    { id: 'swing', ...s.swing, r: YARD_RADII.swing },
    { id: 'slide', ...s.slide, r: YARD_RADII.slide },
    { id: 'cart', ...s.cart, r: YARD_RADII.cart },
    { id: 'trampoline', x: TRAMPOLINE_AT.x, z: TRAMPOLINE_AT.z, r: YARD_RADII.trampoline },
    { id: 'ball', x: BALL_START.x, z: BALL_START.z, r: YARD_RADII.ball },
    { id: 'friendDay', ...s.friendDay, r: YARD_RADII.friend },
    { id: 'friendPlay', ...s.friendPlay, r: YARD_RADII.friend },
    ...doors,
  ]
}

/** Is a spot inside what she can walk on? */
export function inYard(p: Spot, margin = 0): boolean {
  const b = walkBounds('yard')
  return p.x >= b.minX + margin && p.x <= b.maxX - margin && p.z >= b.minZ + margin && p.z <= b.maxZ - margin
}
