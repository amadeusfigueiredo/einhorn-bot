import { AREAS, DOOR_SPOTS, walkBounds } from '../placeLayout'

/** Where everything in the library stands (world units, x across, z toward the camera). */
export type Spot = { x: number; z: number }

export const LIBRARY_SPOTS = {
  /** The round table on the rug with the five books standing on it. */
  table: { x: 0, z: 0.7 },
  /** The librarian's desk on the left; the owl sits on it. */
  desk: { x: -4.5, z: 1.2 },
  /** The reading nook on the right: a cushion with the reading unicorn on it. */
  nook: { x: 4.9, z: 0.3 },
  globe: { x: -5.7, z: -0.9 },
  lamp: { x: 5.9, z: -1.9 },
  aquarium: { x: 3.7, z: 2.9 },
  /** The rainbow xylophone on its stand, in front of the shelf. */
  music: { x: 1.9, z: -1.9 },
  /** The easel with the drawing board, between the door and the xylophone. */
  easel: { x: -2.4, z: -1.9 },
} as const satisfies Record<string, Spot>

export const LIBRARY_RADII = {
  table: 1.1,
  desk: 1.0,
  nook: 1.2,
  globe: 0.7,
  lamp: 0.5,
  aquarium: 0.9,
  music: 0.9,
  easel: 0.8,
  door: 1.2,
} as const

/** Where she stands to use each thing: on the camera's side of it, a step away. */
export const STAND_AT = {
  table: { x: 0, z: 2.0 },
  desk: { x: -3.2, z: 1.9 },
  nook: { x: 3.6, z: 1.3 },
  globe: { x: -4.7, z: 0.1 },
  lamp: { x: 5.0, z: -0.8 },
  aquarium: { x: 2.4, z: 3.0 },
  music: { x: 1.9, z: -0.6 },
  easel: { x: -2.4, z: -0.5 },
} as const satisfies Record<keyof typeof LIBRARY_SPOTS, Spot>

/** The five books on the table stand in a fan: where each is (relative to the table's middle, and which way it leans). */
export function bookSlot(i: number, count = 5): { x: number; z: number; yaw: number } {
  const t = count === 1 ? 0 : i / (count - 1) - 0.5
  return { x: t * 1.35, z: -0.18 + Math.abs(t) * 0.35, yaw: -t * 0.5 }
}

export function libraryObstacles(): { id: string; x: number; z: number; r: number }[] {
  const s = LIBRARY_SPOTS
  const doors = Object.entries(DOOR_SPOTS.library).map(([to, d]) => ({ id: `door:${to}`, x: d![0], z: d![2], r: LIBRARY_RADII.door }))
  return [
    { id: 'table', ...s.table, r: LIBRARY_RADII.table },
    { id: 'desk', ...s.desk, r: LIBRARY_RADII.desk },
    { id: 'nook', ...s.nook, r: LIBRARY_RADII.nook },
    { id: 'globe', ...s.globe, r: LIBRARY_RADII.globe },
    { id: 'lamp', ...s.lamp, r: LIBRARY_RADII.lamp },
    { id: 'aquarium', ...s.aquarium, r: LIBRARY_RADII.aquarium },
    { id: 'music', ...s.music, r: LIBRARY_RADII.music },
    { id: 'easel', ...s.easel, r: LIBRARY_RADII.easel },
    ...doors,
  ]
}

export function inLibrary(p: Spot, margin = 0): boolean {
  const b = walkBounds('library')
  return p.x >= b.minX + margin && p.x <= b.maxX - margin && p.z >= b.minZ + margin && p.z <= b.maxZ - margin
}

export const LIBRARY_HALF = AREAS.library
