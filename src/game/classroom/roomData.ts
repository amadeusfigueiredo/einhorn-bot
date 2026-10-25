import { STAGE_AGE, type AgeGroup } from './kidLook'

/**
 * The real German classroom of Classroom V3 (see NEXT_TASK_CLASSROOMS.md): its size, desks, smart board, the walk to the board, all in METRES, plus the look (theme) of each class that has the new room. Pure data, no rendering.
 */
export const ROOM = { W: 15.6, D: 13.0, H: 3.2 } as const
/** The desks stand in pods of two desks pushed together (four kids who see each other): x of the three pod columns, z of the two pod rows. */
export const POD_COLS = [-4.6, 0.0, 4.6] as const
export const POD_ROWS = [-2.2, 1.6] as const
/** A two-seat pupils' desk. */
export const DESK = { w: 1.3, d: 0.6 } as const
export const SEAT_DX = 0.33
export const CHAIR_DZ = 0.5
/** Where a pod's second desk stands behind the first (pushed together). */
export const POD_GAP = DESK.d
/** The display on its lift column, on the front wall (x0..x1, y0..y1). */
export const SMART_BOARD = { x0: -1.0, x1: 1.0, y0: 0.85, y1: 2.05 } as const
/** Amara sits in the near pod of the middle column, at the desk that looks toward the picture, on the aisle side (right). */
export const AMARA_SEAT = { row: 1, col: 1, desk: 0, side: 1 } as const
/** The unicorn teacher stands to the right of the board, and Amara in front of it. */
export const TEACHER_SPOT = { x: 1.9, z: -ROOM.D / 2 + 0.95 } as const
export const BOARD_SPOT = { x: 0.35, z: -ROOM.D / 2 + 0.7 } as const
/** The aisle she walks up (between the middle and right pod columns), and how far forward it goes. */
export const WALK_AISLE_X = (POD_COLS[1] + POD_COLS[2]) / 2
export const WALK_FRONT_Z = -ROOM.D / 2 + 1.25

/** `facing` is the turn about the vertical axis of a kid who sits there (0 looks toward the picture, PI toward the board). */
export type Seat = { index: number; row: number; col: number; desk: number; side: number; x: number; z: number; facing: number }

/** The z of the two desks of a pod: the first looks toward the picture (+z), the second toward the board. */
export const podDeskZ = (row: number): [number, number] => [POD_ROWS[row], POD_ROWS[row] + POD_GAP]

/** The 24 seats, pod by pod, desk by desk, left to right. */
export function seats(): Seat[] {
  const out: Seat[] = []
  POD_ROWS.forEach((_, row) =>
    POD_COLS.forEach((x, col) =>
      podDeskZ(row).forEach((dz, desk) =>
        [-SEAT_DX, SEAT_DX].forEach((dx, side) =>
          out.push({ index: out.length, row, col, desk, side, x: x + dx, z: desk === 0 ? dz - 0.47 : dz + 0.47, facing: desk === 0 ? 0 : Math.PI })
        )
      )
    )
  )
  return out
}
const seatIndex = (row: number, col: number, desk: number, side: number) => ((row * 3 + col) * 2 + desk) * 2 + side
export const AMARA_SEAT_INDEX = seatIndex(AMARA_SEAT.row, AMARA_SEAT.col, AMARA_SEAT.desk, AMARA_SEAT.side)
/** The other seat of her desk: her friend's (the unicorn, Amara, later Napoleon) shares it with her. */
export const FRIEND_SEAT_INDEX = seatIndex(AMARA_SEAT.row, AMARA_SEAT.col, AMARA_SEAT.desk, 1 - AMARA_SEAT.side)

/** How close (metres) she must be to her seat for the offer to sit down, and where she steps out to (the aisle beside her desk) when she stands up. */
export const SEAT_REACH_M = 2.5
export function standUpSpot(): { x: number; z: number } {
  const s = seats()[AMARA_SEAT_INDEX]
  return { x: s.x + 0.95, z: s.z }
}

/** The seats of the 22 classmates (every seat but the two of Amara's desk), in the order of `CLASSMATES`. */
export function classmateSeats(): Seat[] {
  return seats().filter((s) => s.index !== AMARA_SEAT_INDEX && s.index !== FRIEND_SEAT_INDEX)
}

/** Her seat, out into the aisle, forward, the board. Reverse it to walk back. */
export function walkPath(): [number, number][] {
  const s = seats()[AMARA_SEAT_INDEX]
  return [[s.x, s.z], [WALK_AISLE_X, s.z], [WALK_AISLE_X, WALK_FRONT_Z], [BOARD_SPOT.x, BOARD_SPOT.z]]
}

/** Things on the floor outside the pods (x0..x1, z0..z1, metres): the carpet in front of the board, the cubbies along the right wall, the reading corner and the maker table with its stools. Animals and walks keep out of the last three. */
export type Zone = { x0: number; x1: number; z0: number; z1: number }
export const CUBBIES = { x: ROOM.W / 2 - 0.3, w: 0.55, z0: -3.3, step: 1.3, count: 6, len: 1.22 } as const
export const READING = { x: -5.2, z: 4.4, w: 3.0, d: 2.6 } as const
export const MAKER = { x: 4.8, z: 4.4, table: 1.5, stool: 0.35, stoolAt: 1.1 } as const
export const FLOOR_ZONES: readonly Zone[] = [
  { x0: CUBBIES.x - CUBBIES.w / 2, x1: ROOM.W / 2, z0: CUBBIES.z0 - CUBBIES.len / 2, z1: CUBBIES.z0 + (CUBBIES.count - 1) * CUBBIES.step + CUBBIES.len / 2 },
  { x0: READING.x - READING.w / 2, x1: READING.x + READING.w / 2, z0: READING.z - READING.d / 2, z1: READING.z + READING.d / 2 },
  { x0: MAKER.x - MAKER.stoolAt - MAKER.stool / 2, x1: MAKER.x + MAKER.stoolAt + MAKER.stool / 2, z0: MAKER.z - MAKER.stoolAt - MAKER.stool / 2, z1: MAKER.z + MAKER.stoolAt + MAKER.stool / 2 },
]

/** The one door of the classroom, on the front wall to the left of the board: it leads to the school corridor. */
export const DOOR_X = { hall: -5.6 } as const
/** How big a door is drawn in the classroom: its frame is 3.6 units wide at full size, a real door about 1 m. */
export const DOOR_SCALE_M = 0.5

export type ClassroomTheme = {
  age: AgeGroup
  world: string
  wall: string
  band: string
  floor: string
  floor2: string
  ceiling: string
  light: string
  cabinets: string[]
  desk: string
  deskFront: string[]
  seat: string
  metal: string
  sky: string[]
  garland: string[]
  screen: string[]
  screenText: string
  clock: 'donut' | 'shell' | 'moon'
  blinds: boolean
}

/** The look of each class with the new room, by stage number (1 to 15): candy, underwater, cloud castle. */
export const CLASSROOM_THEMES: Readonly<Record<number, ClassroomTheme>> = {
  1: {age:'little',world:'candyClassroom',wall:'#FFE6F1',band:'#FFCFE3',floor:'#F0CFA3',floor2:'#E8C291',ceiling:'#FFF9FC',light:'#FFFFFF',cabinets:['#FFD166','#FFB3D4','#B5F2D9','#C9B5FF'],desk:'#F2C894',deskFront:['#FF9EC4','#8EC5FF','#B5F2D9','#FFD166'],seat:'#FFB3D4',metal:'#5A4A6A',sky:['#BFE6FF','#FFE1F0'],garland:['#FF7EB6','#FFD166','#6EE7C8','#8EC5FF','#B79CFF','#FF9E5E'],screen:['#FFE1F0','#FFF7FB'],screenText:'#E0457F',clock:'donut',blinds:false},
  5: {age:'middle',world:'underwater',wall:'#CFF3F2',band:'#9FE0E2',floor:'#F3DDAA',floor2:'#EBD196',ceiling:'#EAFBFF',light:'#F4FFFF',cabinets:['#8EC5FF','#FFE2A8','#6EE7C8','#FFB3D4'],desk:'#E9C79A',deskFront:['#6EE7C8','#8EC5FF','#FFB3D4','#FFE2A8'],seat:'#8EC5FF',metal:'#2F5D7A',sky:['#4FB8E3','#145C93'],garland:['#3A9AD6','#6EE7C8','#FFD166','#FF7E9E','#FFFFFF'],screen:['#D4F3FF','#F2FCFF'],screenText:'#1C6FA8',clock:'shell',blinds:false},
  6: {age:'older',world:'cloudCastle',wall:'#E7DEFF',band:'#CDBFF2',floor:'#D8CEF3',floor2:'#CEC2EE',ceiling:'#F1ECFF',light:'#FFF4D6',cabinets:['#B79CFF','#FFE59A','#8EC5FF','#FFB3D4'],desk:'#E4C9A0',deskFront:['#6B4FD8','#8EC5FF','#B79CFF','#FFB3D4'],seat:'#8E6CF0',metal:'#2E2A4A',sky:['#2A1D63','#0E0A28'],garland:['#FFD166','#B79CFF','#8EC5FF','#FFFFFF','#FF9EC4'],screen:['#2A1D63','#4A3A9A'],screenText:'#FFE59A',clock:'moon',blinds:true},

}

/** The theme of a class (stage index, zero-based), or null when it keeps the old room. */
export function themeOfStage(stageIndex: number): ClassroomTheme | null {
  return STAGE_AGE[stageIndex + 1] ? CLASSROOM_THEMES[stageIndex + 1] ?? null : null
}
