import { BOOKS } from '../data/hangouts'
import { bookSlot, LIBRARY_SPOTS, STAND_AT } from '../library/libraryLayout'
import { TABLE_TOP } from '../library/libraryDims'
import { YARD_SPOTS } from '../yard/yardLayout'
import { doorFootZ, DOOR_SPOTS, AREAS, type RoomId } from '../placeLayout'
import type { PlaceId } from '../placeModel'
import { CLASS_COUNT, exitDoorSpot, hallDoorSpot, hallFootZ, roomDoorSpot, ROOM_DOORS } from '../../hall/hallLayout'
import { roomsOpen } from '../roomsOpen'
import { depthScale, project, type Frame } from './frame2d'

/** What using a thing does. The doing is in `actions2d.ts`; this is only the name of it, so the list is plain data. */
export type Use =
  | { type: 'go'; to: PlaceId }
  | { type: 'classDoor'; index: number }
  | { type: 'book'; id: number }
  | { type: 'talk'; id: string }
  | { type: 'say'; id: string; animal?: boolean }
  | { type: 'globe' }
  | { type: 'lamp' }
  | { type: 'aquarium' }
  | { type: 'pad' }
  | { type: 'board' }

/** Something in a place she can tap: where it stands, how big its tap area is (in world units, from the lift above the floor up), where she walks to to use it, and what it does. */
export type Thing2D = {
  id: string
  at: { x: number; z: number }
  /** Half the width of the tap area. */
  w: number
  /** How high above the floor the tap area starts, and how tall it is. */
  lift: number
  h: number
  /** Where she stands to use it, or a distance to stand at beside it (on the side she comes from). */
  stand: { x: number; z: number } | { side: number; dz: number }
  use: Use
}

const DOOR = { w: 1.5, lift: 0, h: 3.2 } as const

/** The doors of a place: the library's and the yard's from the layout, the corridor's fifteen class doors and its green one. */
function doorsOf(place: RoomId): Thing2D[] {
  if (place === 'hall') {
    const classes = Array.from({ length: CLASS_COUNT }, (_, index): Thing2D => {
      const [x, , z] = hallDoorSpot(index)
      return { id: `door:class:${index}`, at: { x, z }, ...DOOR, stand: { x, z: hallFootZ() }, use: { type: 'classDoor', index } }
    })
    const [x, , z] = exitDoorSpot()
    const green: Thing2D = { id: 'door:yard', at: { x, z }, ...DOOR, stand: { x, z: hallFootZ() }, use: { type: 'go', to: 'yard' } }
    if (!roomsOpen()) return [...classes, green]
    const rooms = ROOM_DOORS.map((to): Thing2D => {
      const [rx, , rz] = roomDoorSpot(to)
      return { id: `door:${to}`, at: { x: rx, z: rz }, ...DOOR, w: 1.9, stand: { x: rx, z: hallFootZ() }, use: { type: 'go', to } }
    })
    return [...classes, green, ...rooms]
  }
  return (Object.entries(DOOR_SPOTS[place]) as [PlaceId, [number, number, number]][]).map(([to, spot]) => ({
    id: `door:${to}`,
    at: { x: spot[0], z: spot[2] },
    ...DOOR,
    stand: { x: spot[0], z: doorFootZ(spot[2], AREAS[place].halfD) },
    use: { type: 'go', to },
  }))
}

const L = LIBRARY_SPOTS
const Y = YARD_SPOTS

/** Everything she can tap in a place, doors included (the order is no matter: the nearest to the viewer wins a tap). */
export function thingsFor(place: RoomId): Thing2D[] {
  if (place === 'library') {
    const books = BOOKS.map((b, i): Thing2D => {
      const s = bookSlot(i, BOOKS.length)
      return { id: `book:${b.id}`, at: { x: L.table.x + s.x, z: L.table.z + s.z }, w: 0.22, lift: TABLE_TOP, h: 0.5, stand: STAND_AT.table, use: { type: 'book', id: b.id } }
    })
    return [
      ...doorsOf('library'),
      ...books,
      { id: 'owl', at: L.desk, w: 0.7, lift: 0.8, h: 0.9, stand: STAND_AT.desk, use: { type: 'talk', id: 'owl' } },
      { id: 'readingUnicorn', at: L.nook, w: 0.9, lift: 0.2, h: 1.5, stand: STAND_AT.nook, use: { type: 'talk', id: 'readingUnicorn' } },
      { id: 'globe', at: L.globe, w: 0.6, lift: 0, h: 1.7, stand: STAND_AT.globe, use: { type: 'globe' } },
      { id: 'starLamp', at: L.lamp, w: 0.6, lift: 0, h: 3.2, stand: STAND_AT.lamp, use: { type: 'lamp' } },
      { id: 'aquarium', at: L.aquarium, w: 0.9, lift: 0, h: 1.6, stand: STAND_AT.aquarium, use: { type: 'aquarium' } },
      { id: 'xylophone', at: L.music, w: 1.0, lift: 0, h: 1.1, stand: STAND_AT.music, use: { type: 'pad' } },
      { id: 'easel', at: L.easel, w: 0.8, lift: 0, h: 2.2, stand: STAND_AT.easel, use: { type: 'board' } },
    ]
  }
  if (place === 'yard') {
    return [
      ...doorsOf('yard'),
      { id: 'friendDay', at: Y.friendDay, w: 0.9, lift: 0, h: 2, stand: { side: 1.3, dz: 0.5 }, use: { type: 'talk', id: 'friendDay' } },
      { id: 'friendPlay', at: Y.friendPlay, w: 0.9, lift: 0, h: 2, stand: { side: 1.3, dz: 0.5 }, use: { type: 'talk', id: 'friendPlay' } },
      { id: 'koala', at: { x: Y.tree.x, z: Y.tree.z }, w: 0.7, lift: 1.6, h: 1.2, stand: { side: 1.5, dz: 1 }, use: { type: 'say', id: 'koala', animal: true } },
      { id: 'capybara', at: Y.puddle, w: 0.9, lift: 0, h: 1.2, stand: { side: 1.5, dz: 0.5 }, use: { type: 'say', id: 'capybara', animal: true } },
      { id: 'swing', at: Y.swing, w: 1.1, lift: 0, h: 3, stand: { side: 1.8, dz: 0.5 }, use: { type: 'say', id: 'swing' } },
      { id: 'slide', at: Y.slide, w: 1.6, lift: 0, h: 2.6, stand: { side: 2.2, dz: 1 }, use: { type: 'say', id: 'slide' } },
    ]
  }
  return doorsOf(place)
}

/** Where she walks to to use `thing`, given where she stands now. */
export function standFor(thing: Thing2D, fromX: number): { x: number; z: number } {
  const s = thing.stand
  if ('x' in s) return s
  return { x: thing.at.x + (fromX < thing.at.x ? -1 : 1) * s.side, z: thing.at.z + s.dz }
}

/** The thing under a tap at the screen point (sx, sy), nearest to the viewer first, or null. */
export function thingAt(things: readonly Thing2D[], f: Frame, sx: number, sy: number): Thing2D | null {
  let best: Thing2D | null = null
  for (const t of things) {
    const foot = project(f, t.at.x, t.at.z)
    const unit = f.scale * depthScale(f, t.at.z)
    const left = foot.x - t.w * unit
    const right = foot.x + t.w * unit
    const top = foot.y - (t.lift + t.h) * unit
    const bottom = foot.y - t.lift * unit
    if (sx < left || sx > right || sy < top || sy > bottom) continue
    if (!best || t.at.z > best.at.z) best = t
  }
  return best
}

/** How close to the foot of a door she has to be for E or Enter to go through it. */
export const DOOR_NEAR = 1.6

/** The door she is standing at (within reach of where she stands to use it), or null. */
export function doorNear(things: readonly Thing2D[], at: { x: number; z: number }): Thing2D | null {
  for (const t of things) {
    if (t.use.type !== 'go' && t.use.type !== 'classDoor') continue
    const stand = standFor(t, at.x)
    if (Math.hypot(at.x - stand.x, at.z - stand.z) <= DOOR_NEAR) return t
  }
  return null
}
