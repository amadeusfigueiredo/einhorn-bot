import type { AnimalSpec, Edge, Place } from '../../../data/animals'
import { ROOM } from '../../../classroom/roomData'
type V3 = readonly [number, number, number]

/** `fixed`: the room's walls are real, so nobody is moved to another edge for a narrow screen (the real classroom). */
export type AnimalArea = { halfW: number; halfH: number; fixed?: boolean }

/** How far past the floor's edge the animals keep to (the floor is `halfW` x `halfH`). */
export const RIM = { side: 0.0, back: 0.35, front: 0.25 } as const

/** Animals are drawn this much bigger than they are modelled, to stand next to the unicorns. */
export const ANIMAL_SCALE = 1.5

/** A room narrower than this (half-width, world units) is a phone held upright. */
export const NARROW = 5

const lerp = (a: number, b: number, t: number) => a + (b - a) * t

const SIDE_INSET = 1.3
const BACK_INSET = 0.1

/**
 * The rim the class's animals keep to in the real classroom (metres x `metre`): the side animals stand in the free strip between the
 * desks and the walls, the front ones behind the last row of chairs, the back (air) ones along the board wall. Nobody among the desks.
 */
export function classroomAnimalArea(metre: number): AnimalArea {
  return { halfW: (ROOM.W / 2 - SIDE_INSET) * metre, halfH: (ROOM.D / 2 - BACK_INSET) * metre - RIM.back, fixed: true }
}
/** A spot on the rim as a point in the room (x right, y up, z toward the camera). */
export function placePoint(place: Place, area: AnimalArea): V3 {
  const { halfW, halfH } = area
  const t = Math.min(1, Math.max(0, place.t))
  const y = place.y ?? 0
  switch (place.edge) {
    case 'left':
      return [-(halfW + RIM.side), y, lerp(-halfH * 0.85, halfH * 0.85, t)]
    case 'right':
      return [halfW + RIM.side, y, lerp(-halfH * 0.85, halfH * 0.85, t)]
    case 'back':
      return [lerp(-halfW * 0.9, halfW * 0.9, t), y, -(halfH + RIM.back)]
    case 'front':
      return [lerp(-halfW * 0.8, halfW * 0.8, t), y, halfH + RIM.front]
  }
}

/** The heading (turn about the vertical axis, models face +x) that looks into the room from `edge`. */
export function yawFacingRoom(edge: Edge): number {
  switch (edge) {
    case 'left':
      return 0
    case 'right':
      return Math.PI
    case 'back':
      return -Math.PI / 2
    case 'front':
      return Math.PI / 2
  }
}

export type PlacedAnimal = {
  spec: AnimalSpec
  from: V3
  to: V3 | null
  /** The heading when standing still. */
  yaw: number
}

/**
 * In a narrow room (a phone held upright) the unicorns reach the side walls,
 * so animals that stand on the ground at the sides move to the back wall,
 * spread out from the corners.
 */
export function relocateForNarrow(specs: readonly AnimalSpec[]): Map<string, Place> {
  const moved = new Map<string, Place>()
  const used = { left: 0, right: 0 }
  for (const s of specs) {
    const { edge, y = 0 } = s.at
    if ((edge === 'left' || edge === 'right') && y < 0.5) {
      const k = used[edge]++
      moved.set(s.id, { edge: 'back', t: edge === 'left' ? 0.12 + k * 0.14 : 0.88 - k * 0.14, y })
    }
  }
  return moved
}

/** Puts every animal of a stage on the rim of a room of this size. */
export function layoutAnimals(specs: readonly AnimalSpec[], area: AnimalArea): PlacedAnimal[] {
  const narrow = !area.fixed && area.halfW < NARROW
  const moved = narrow ? relocateForNarrow(specs) : new Map<string, Place>()
  return specs.map((spec) => {
    const at = moved.get(spec.id) ?? spec.at
    // A walker that was moved keeps its walk on the new edge, a little way along.
    const to = spec.to && moved.has(spec.id) ? { ...at, t: Math.min(1, at.t + 0.2) } : spec.to
    return {
      spec,
      from: placePoint(at, area),
      to: to ? placePoint(to, area) : null,
      yaw: yawFacingRoom(at.edge),
    }
  })
}

/** Is this point on the walkable floor? (Animals on the ground never are.) */
export function onFloor(p: V3, area: AnimalArea): boolean {
  return Math.abs(p[0]) < area.halfW && Math.abs(p[2]) < area.halfH
}
