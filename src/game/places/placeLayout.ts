import type { V3 } from '../film/filmModel'
import { exitDoorAt } from '../film/filmData'
import { fitZoom } from '../views/three/coords'
import type { Bounds } from './placeWorld'
import type { PlaceId } from './placeModel'

/** The two places of free play (the classroom is the third place, drawn by the game itself). */
export type RoomId = 'yard' | 'library' | 'hall' | 'sports' | 'pony' | 'pool' | 'dojo' | 'dance' | 'tech' | 'science'

/**
 * How big each room is (half its width and depth, in world units). A classroom is 14.4 by 8.1 and the library is the
 * same size; the schoolyard is twice as wide and deeper, and the camera follows her along it.
 */
export const AREAS: Record<RoomId, { halfW: number; halfD: number }> = {
  yard: { halfW: 14.4, halfD: 6.5 },
  library: { halfW: 7.2, halfD: 4.05 },
  /** The school corridor: 58 long (the camera follows her along it) and narrow, with a back wall of doors. */
  hall: { halfW: 38, halfD: 3.4 },
  /** The sports hall: a wide gym with four archways along the back wall (a pony yard, a pool, a dojo and a dance hall). */
  sports: { halfW: 9, halfD: 5 },
  /** The pony yard: a paddock the size of the library, with Napoleon and the stable. */
  pony: { halfW: 7.2, halfD: 4.05 },
  /** The pool: a wide bright hall with the water in the middle. */
  pool: { halfW: 8.5, halfD: 4.5 },
  /** The dojo: a quiet room with a mat, the size of the library. */
  dojo: { halfW: 7.2, halfD: 4.05 },
  /** The dance hall: a wide floor with mirrors along the back. */
  dance: { halfW: 8.5, halfD: 4.5 },
  /** The technology room: a bright room with a robot floor, desks and screens. */
  tech: { halfW: 8.5, halfD: 4.5 },
  /** The science room: a lab with a long bench, a window on the sky and a globe. */
  science: { halfW: 8.5, halfD: 4.5 },
}

/** Where she can walk: inside the room, a little off its edges and a door's depth off the back wall. */
export function walkBounds(room: RoomId): Bounds {
  const { halfW, halfD } = AREAS[room]
  return { minX: -halfW + 0.7, maxX: halfW - 0.7, minZ: -halfD + 1.4, maxZ: halfD - 0.5 }
}

/** A door's frame is 3.6 wide at full size: the yard door is drawn a little smaller and stands this far from the other door of the classroom, so the frames do not touch and its sign clears the progress dots. */
export const DOOR_SPACING = 3.3

/**
 * Where the classroom's door to the yard stands: at the back, left of the door to the next class, a door's width
 * away. On a phone held upright (where that door is left out under the badge and the buttons, which cover the whole
 * back of the room) it stands in the front right corner, where nothing covers it and the unicorns do not stand.
 */
export function yardDoorAt(halfW: number, halfH: number): V3 {
  const portrait = halfH > halfW * 1.2
  if (portrait) return [halfW * 0.4, 0, halfH * 0.72]
  const exit = exitDoorAt(halfW, halfH)
  return [exit[0] - DOOR_SPACING, 0, exit[2]]
}

/**
 * Where the classroom's door to the school corridor stands: next to the yard door, a door's width further from the
 * door to the next class (so the three doors stand in a row along the back wall). On a phone held upright it stands in the
 * front left corner, across from the yard door.
 */
export function hallDoorAt(halfW: number, halfH: number): V3 {
  const portrait = halfH > halfW * 1.2
  if (portrait) return [-halfW * 0.4, 0, halfH * 0.72]
  const yard = yardDoorAt(halfW, halfH)
  return [yard[0] - DOOR_SPACING, 0, yard[2]]
}

/** How big the yard door is drawn in a classroom: a phone held upright is narrow, so its door is smaller. */
export function yardDoorScale(halfW: number, halfH: number): number {
  return halfH > halfW * 1.2 ? 0.55 : 0.8
}

/** Where she walks to to go through a door: its foot, on the side of it that has room (the camera side, unless that is past the edge). */
export function doorFootZ(doorZ: number, halfH: number): number {
  return doorZ + 1 < halfH - 0.4 ? doorZ + 1 : doorZ - 1
}

/** The doors of the yard and the library, at the back wall: where each leads. */
export const DOOR_SPOTS: Record<RoomId, Partial<Record<PlaceId, V3>>> = {
  yard: { class: [-12.2, 0, -5.1], library: [12.2, 0, -5.1] },
  // The library's door to the corridor stands at the other end of the back wall, between the xylophone and the star lamp.
  library: { yard: [-5.2, 0, -2.8], hall: [4, 0, -2.8] },
  // The corridor has one green door at its start (its class doors are in `hall/hallLayout.ts`).
  hall: { yard: [-AREAS.hall.halfW + 1.2, 0, -AREAS.hall.halfD + 0.15], sports: [AREAS.hall.halfW - 4, 0, -AREAS.hall.halfD + 0.15], tech: [AREAS.hall.halfW - 9.6, 0, -AREAS.hall.halfD + 0.15], science: [AREAS.hall.halfW - 15.2, 0, -AREAS.hall.halfD + 0.15] },
  // The sports hall's door to the corridor stands at the left end of its back wall, left of the four archways.
  sports: { hall: [-7.6, 0, -AREAS.sports.halfD + 0.15], pony: [-3.9, 0, -AREAS.sports.halfD + 0.6], pool: [-1.3, 0, -AREAS.sports.halfD + 0.6], dojo: [1.3, 0, -AREAS.sports.halfD + 0.6], dance: [3.9, 0, -AREAS.sports.halfD + 0.6] },
  pony: { sports: [-5.2, 0, -AREAS.pony.halfD + 0.15] },
  pool: { sports: [-6.4, 0, -AREAS.pool.halfD + 0.15] },
  dojo: { sports: [-5.2, 0, -AREAS.dojo.halfD + 0.15] },
  dance: { sports: [-6.4, 0, -AREAS.dance.halfD + 0.15] },
  tech: { hall: [-6.4, 0, -AREAS.tech.halfD + 0.15] },
  science: { hall: [-6.4, 0, -AREAS.science.halfD + 0.15] },
}

export function doorSpot(place: RoomId, to: PlaceId): V3 {
  const spot = DOOR_SPOTS[place][to]
  if (!spot) throw new Error(`no door from the ${place} to ${to}`)
  return spot
}

/** Where she stands on coming in: in front of the door she came through (`from` is the place she came from). */
export function arrivalAt(place: RoomId, from: PlaceId): { x: number; z: number } {
  const door = DOOR_SPOTS[place][from] ?? DOOR_SPOTS[place].class ?? DOOR_SPOTS[place].yard ?? Object.values(DOOR_SPOTS[place])[0]
  // Far enough in from the room's edge that her unicorn, who follows behind her, is on screen too.
  return { x: door[0] + (door[0] < 0 ? 2.4 : -2.4), z: door[2] + 1.5 }
}

/** The camera looks down on the room from the same angle as in a classroom. */
export const CAM_OFFSET: [number, number, number] = [0, 9, 6.5]
export const SIN_ELEVATION = CAM_OFFSET[1] / Math.hypot(CAM_OFFSET[1], CAM_OFFSET[2])
/** Extra screen height above the floor for the back wall (the camera aims back by half of it). */
export const HEADROOM = 1.2
export const AIM_BACK = -HEADROOM / 2 / SIN_ELEVATION

/** The corridor's wall is tall (the doors, their signs and the subject banners): its picture has much more room above the floor. */
export const HALL_HEADROOM = 3.2

/** The extra screen height above the floor for the back wall, and how far back the camera aims because of it (see `AIM_BACK`). */
export function headroomOf(room: RoomId): number {
  return room === 'hall' ? HALL_HEADROOM : HEADROOM
}

/** The sky of the yard and the warm wall of the library, for the page behind each canvas too. */
export const YARD_SKY: [string, string] = ['#8FD3FF', '#E8F6FF']
export const LIBRARY_SKY: [string, string] = ['#D9B48A', '#F3DEC3']
export const SPORTS_SKY: [string, string] = ['#FFD9A8', '#FFF1DC']
export const PONY_SKY: [string, string] = ['#BFE8FF', '#E6F7E0']
export const POOL_SKY: [string, string] = ['#BFE8FF', '#E3F6FF']
export const DOJO_SKY: [string, string] = ['#E6D9FF', '#F6F0FF']
export const DANCE_SKY: [string, string] = ['#FFD0E6', '#FFF0F7']
export const TECH_SKY: [string, string] = ['#CFE3FF', '#EAF3FF']
export const SCIENCE_SKY: [string, string] = ['#E3D5FF', '#F3EBFF']
/** The sky of each of the sports' new rooms. */
export const SECTOR_SKY: Record<'pool' | 'dojo' | 'dance' | 'tech' | 'science', [string, string]> = { pool: POOL_SKY, dojo: DOJO_SKY, dance: DANCE_SKY, tech: TECH_SKY, science: SCIENCE_SKY }

/** The most depth of a room the picture shows at once (world units); a deeper room is followed along. */
export const SEEN_DEPTH = 9.5

/** How much of the room's width the picture shows, either side of the camera: all of the library, a part of the yard, and less still on a phone held upright. */
export function viewHalfWidth(room: RoomId, viewW: number, viewH: number): number {
  if (viewH > viewW) return 4.6
  return Math.min(AREAS[room].halfW, 7.6)
}

/** How much of the room's depth the picture shows. */
export function seenDepth(room: RoomId): number {
  return Math.min(AREAS[room].halfD * 2, SEEN_DEPTH)
}

/**
 * Where the camera looks (the middle of what it shows) and how much it zooms, for a picture of `viewW` by `viewH`
 * pixels and her at `player`: the part of the room around her, never past the edge of the room. A room that fits in
 * the picture (the library) always shows all of it.
 */
export function placeCamera(opts: { room: RoomId; viewW: number; viewH: number; player: { x: number; z: number } }): { x: number; z: number; zoom: number; aimBack: number } {
  const { room, viewW, viewH, player } = opts
  const { halfW, halfD } = AREAS[room]
  const seen = viewHalfWidth(room, viewW, viewH)
  const depth = seenDepth(room)
  const zoom = fitZoom({ viewW, viewH, groundW: seen * 2, groundH: depth, sinElevation: SIN_ELEVATION, headroom: headroomOf(room) })
  const reachX = Math.max(0, halfW - seen)
  const reachZ = Math.max(0, halfD - depth / 2)
  return { x: Math.min(reachX, Math.max(-reachX, player.x)), z: Math.min(reachZ, Math.max(-reachZ, player.z)), zoom, aimBack: -headroomOf(room) / 2 / SIN_ELEVATION }
}
