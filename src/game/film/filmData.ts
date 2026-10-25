/**
 * The timelines of the three films, in seconds, and the look of the 15 class
 * doors. Pure data (texts are in the locale files under `film.*`); the
 * prototypes in the design package use exactly these numbers.
 */
import type { DecorId } from '../data/classrooms'
import type { V3 } from './filmModel'

/** A second range [from, to]. */
type Span = readonly [number, number]

/** The 14 s walk from one class to the next, between every pair of stages. */
export const CLASS_TRANSITION = {
  duration: 14,
  /** Inside the class just finished: "Bye!", the classmates hop. */
  sayBye: [0, 1.2] as Span,
  walkToDoor: [1.2, 3.0] as Span,
  /** The door opens from inside. */
  doorAOpen: [2.8, 3.3] as Span,
  /** Cut to the corridor: she steps out of the same door. */
  throughDoorA: [3.4, 4.6] as Span,
  /** And closes it behind her. */
  doorAClose: [4.6, 5.2] as Span,
  /** About three seconds along the corridor. */
  corridorWalk: [5.2, 8.6] as Span,
  /** "Knock, knock!" at the door of the next class. */
  knock: [8.6, 9.4] as Span,
  doorBOpen: [9.4, 10.0] as Span,
  /** Cut into the next class: she comes in through its door. */
  enterRoomB: [10.0, 11.4] as Span,
  roomBLook: [11.4, 14.0] as Span,
  titleCard: [11.5, 13.7] as Span,
  /** A short white flash, then play. */
  flash: [13.7, 14.0] as Span,
  /** The next stage is switched on behind the film at this second. */
  swapAt: 10.0,
} as const

export type Shot = { from: number; to: number; name: string }

/** The short walk through a door between the classroom, the yard and the library (4.4 s). */
export const PLACE_TRANSITION = {
  duration: 4.4,
  /** The cut from the room she leaves to the room she comes into. */
  swapAt: 2.2,
  /** The door of the room she leaves opens as she reaches it. */
  doorOpen: [0.9, 1.5] as Span,
  /** The door of the new room opens for her and closes behind her. */
  arriveOpen: [2.2, 2.9] as Span,
  arriveClose: [3.3, 3.9] as Span,
} as const

/** The 60 s intro film. */
export const INTRO_FILM = {
  duration: 60,
  shots: [
    { from: 0, to: 15, name: 'theatre' },
    { from: 15, to: 23, name: 'dream' },
    { from: 23, to: 30, name: 'morning' },
    { from: 30, to: 40, name: 'rainbow' },
    { from: 40, to: 48, name: 'school' },
    { from: 48, to: 55, name: 'classes' },
    { from: 55, to: 61, name: 'gate' },
  ] as readonly Shot[],
  /** The theatre's curtains swing open between these seconds. */
  curtainsOpen: [8.2, 10.5] as Span,
  /** The title is on screen between these seconds (it fades in and out around them). */
  title: [10.2, 15] as Span,
  /** The school bell swings. */
  bell: [43.5, 46] as Span,
  /** The five class doors pop up one per second from here. */
  doorsFrom: 49,
  /** The big gate swings open. */
  gateOpen: [55.2, 56.6] as Span,
} as const

/** The 20 s ending film. */
export const OUTRO_FILM = {
  duration: 20,
  shots: [
    { from: 0, to: 5, name: 'crown' },
    { from: 5, to: 10, name: 'parade' },
    { from: 10, to: 15, name: 'album' },
    { from: 15, to: 21, name: 'night' },
  ] as readonly Shot[],
  /** The crown starts to fall and lands on her head. */
  crownFall: [0.8, 2.2] as Span,
  /** The first sticker flies in; one more every 0.22 s. */
  stickersFrom: 10.4,
  stickerEvery: 0.22,
  /** "Play again" appears. */
  againAt: 17.6,
} as const

export type DoorTheme = {
  /** The door leaf. */
  door: string
  /** Frame and arch. */
  trim: string
  /** The light that shines out when it opens. */
  glow: string
  /** Small decor pieces around the frame (2 to 4), drawn by the room's decor layer. */
  decor: readonly DecorId[]
}

/**
 * Where the free-standing magic door of every class stands in its room: right of the teacher, at the
 * back, the same spot in all 15 worlds (a fixed share of the play area).
 */
export function exitDoorAt(halfW: number, halfH: number): V3 {
  return [(halfW * 7) / 9, 0, -(halfH * 56) / 81]
}

/**
 * Whether the game room shows the door. On a phone held upright the badge, the progress dots and the
 * buttons down the right edge cover the whole top of the room, so a tall door would only hide behind them.
 */
export function exitDoorShown(halfW: number, halfH: number): boolean {
  return halfH <= halfW * 1.2
}

/** The magic door in the landscape room the films draw (7.2 x 4.05 units half-size): x 5.6, z -2.8. */
export const EXIT_DOOR: V3 = exitDoorAt(7.2, 4.05)

/** One themed door per stage (index = stage number - 1). The corridor's second door uses the NEXT stage's theme. */
export const DOOR_THEMES: readonly DoorTheme[] = [
  { door: '#FFB3D4', trim: '#E58FB6', glow: '#FFE3EF', decor: ['lollipop', 'donut', 'starLollipop'] },
  { door: '#7FD1E8', trim: '#F2D49B', glow: '#FFF3C4', decor: ['seaShell', 'clam', 'surfboard'] },
  { door: '#2D2063', trim: '#C9B5FF', glow: '#B79CFF', decor: ['moon', 'comet', 'planetSmall'] },
  { door: '#B07A48', trim: '#7ED37A', glow: '#FFE59A', decor: ['book', 'eucalyptus', 'book'] },
  { door: '#2E7FC0', trim: '#6EE7C8', glow: '#B5F2FF', decor: ['bubble', 'coral', 'bubble'] },
  { door: '#FFF7FB', trim: '#B79CFF', glow: '#FFE9F6', decor: ['cloud', 'rainbowCloud', 'cloud'] },
  { door: '#9A6A42', trim: '#5FBF6A', glow: '#E8FFD6', decor: ['eucalyptus', 'funnyFlower', 'eucalyptus'] },
  { door: '#C79668', trim: '#8EE0D2', glow: '#FFF0DA', decor: ['steam', 'funnyFlower', 'steam'] },
  { door: '#1E3B4F', trim: '#6EF7C0', glow: '#6EF7C0', decor: ['glowMushroom', 'glowPlant', 'glowMushroom'] },
  { door: '#FFD166', trim: '#FF7EB6', glow: '#FFF3A0', decor: ['sunFlower', 'noteFloat', 'funnyFlower'] },
  { door: '#FFC2D9', trim: '#7FD1E8', glow: '#FFE3EF', decor: ['seaShell', 'noteFloat', 'clam'] },
  { door: '#BFE7FF', trim: '#6EF7C0', glow: '#B5FFE8', decor: ['crystal', 'noteFloat', 'comet'] },
  { door: '#FFB3D4', trim: '#9E6B45', glow: '#FFF7FB', decor: ['iceCream', 'donut', 'iceCream'] },
  { door: '#8E6CF0', trim: '#FFB347', glow: '#FFD6F5', decor: ['paintPots', 'easel', 'paintPots'] },
  { door: '#FFD166', trim: '#6B4FD8', glow: '#FFF3A0', decor: ['planetRinged', 'comet', 'planetSmall'] },
]

/** The colour of each school subject (its class door in the intro, its column in the sticker album). */
export const SUBJECT_COLORS = ['#FFB3D4', '#8EC5FF', '#9BE3B0', '#FFD166', '#C9B5FF'] as const

/** The first stage (0-based) of each of the five subjects: it gives the subject's door its look. */
export const SUBJECT_FIRST_STAGE = [0, 3, 6, 9, 12] as const

/** The door theme of a stage, clamped into range. */
export function doorTheme(stageIndex: number): DoorTheme {
  return DOOR_THEMES[Math.min(DOOR_THEMES.length - 1, Math.max(0, stageIndex))]
}
