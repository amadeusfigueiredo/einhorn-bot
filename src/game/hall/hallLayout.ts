import type { Subject } from '../types'
import type { V3 } from '../film/filmModel'
import { AREAS, DOOR_SPOTS } from '../places/placeLayout'
import type { PlaceId } from '../places/placeModel'

/**
 * The school corridor as numbers: one long straight corridor along x with its back wall at the far side, the fifteen
 * class doors in order (three to a subject, a wider gap with a window and a plant between subjects), and a green door
 * at the start to the yard. The corridor is 58 long, centred on x = 0 (the camera follows her along it). Class ids are
 * the 0-based index of the stage (1 to 15 for the children).
 */
export const HALL = {
  halfW: AREAS.hall.halfW,
  halfD: AREAS.hall.halfD,
  /** The back wall and the doors in it. */
  wallZ: -AREAS.hall.halfD,
  doorSpacing: 3.0,
  subjectGap: 1.4,
  /** Where the first class door stands, and the green door to the yard. */
  startX: -AREAS.hall.halfW + 4.2,
  exitDoorX: DOOR_SPOTS.hall.yard![0],
  /** She stands this far in front of the wall at a door (the same for every door). */
  footFromWall: 1.4,
} as const

export const CLASS_COUNT = 15
export const DOORS_PER_SUBJECT = 3

/** x of the class door of class `index` (0 to 14). */
export function hallDoorX(index: number): number {
  return HALL.startX + index * HALL.doorSpacing + Math.floor(index / DOORS_PER_SUBJECT) * HALL.subjectGap
}

/** Where a class door stands (its foot on the floor, in the wall). */
export function hallDoorSpot(index: number): V3 {
  return [hallDoorX(index), 0, HALL.wallZ + 0.15]
}

/** The green door at the start. */
export function exitDoorSpot(): V3 {
  return [HALL.exitDoorX, 0, HALL.wallZ + 0.15]
}

/** The big doors at the right end of the back wall, from the left: the science room, the technology room and the sports hall. */
export const ROOM_DOORS = ['science', 'tech', 'sports'] as const
export type RoomDoor = (typeof ROOM_DOORS)[number]

export function roomDoorSpot(to: RoomDoor): V3 {
  return DOOR_SPOTS.hall[to]!
}

/** Where she walks to to go through a door: the same place in front of it, a step from the wall. */
export function hallFootZ(): number {
  return HALL.wallZ + HALL.footFromWall
}

/** The subject blocks, in the order of the corridor, with the classes (0-based) in each, and a colour. */
export const HALL_SECTIONS: readonly { subject: Subject; color: string; classes: readonly [number, number, number] }[] = [
  { subject: 'Mathematik', color: '#FFB3D4', classes: [0, 1, 2] },
  { subject: 'Deutsch', color: '#8EC5FF', classes: [3, 4, 5] },
  { subject: 'Sachunterricht', color: '#9BE3B0', classes: [6, 7, 8] },
  { subject: 'Musik', color: '#FFD166', classes: [9, 10, 11] },
  { subject: 'Bildende Kunst', color: '#C9B5FF', classes: [12, 13, 14] },
]

/** The middle of each subject block (x), for its banner, and its two ends. */
export function sectionSpan(section: number): { from: number; to: number; middle: number } {
  const { classes } = HALL_SECTIONS[section]
  const from = hallDoorX(classes[0]) - 1.4
  const to = hallDoorX(classes[2]) + 1.4
  return { from, to, middle: (from + to) / 2 }
}

/** The gaps between the subject blocks (x): where a window and a big plant stand. */
export function sectionGaps(): number[] {
  return [2, 5, 8, 11].map((index) => hallDoorX(index) + (HALL.doorSpacing + HALL.subjectGap) / 2)
}

/** Where she stands when she comes into the corridor: from the yard at the green door, from a class in front of its door. */
export function hallArrival(from: PlaceId, classIndex: number): { x: number; z: number } {
  if (from === 'class') return { x: hallDoorX(classIndex), z: hallFootZ() + 1 }
  if (from === 'sports' || from === 'tech' || from === 'science') return { x: roomDoorSpot(from)[0] - 2.4, z: hallFootZ() + 1 }
  return { x: HALL.exitDoorX + 2.4, z: hallFootZ() + 1 }
}

/** The class whose door is nearest to `x` and within `reach` of it, or null. */
export function doorNear(x: number, reach: number): number | null {
  let best: number | null = null
  let bestDistance = reach
  for (let i = 0; i < CLASS_COUNT; i++) {
    const d = Math.abs(hallDoorX(i) - x)
    if (d <= bestDistance) {
      best = i
      bestDistance = d
    }
  }
  return best
}

/** How far the film's picture reaches either side of the door it looks at. */
const FILM_SPAN = 11

/** Is a subject block within the picture of a film that looks at the corridor from `x`? */
export function nearBlock(section: number, x: number): boolean {
  const { from, to } = sectionSpan(section)
  return to > x - FILM_SPAN && from < x + FILM_SPAN
}

/** The bench in front of the first gap between subjects (a koala reads on it): its size, and the height of its seat. */
export const HALL_BENCH = { gap: 0, width: 1.9, depth: 0.5, seat: 0.45, z: -2.3 } as const

/** x of the bench: the middle of its gap. */
export function benchX(): number {
  return sectionGaps()[HALL_BENCH.gap]
}
