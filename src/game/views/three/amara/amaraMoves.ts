import type { Localized } from '../../../i18n/languages'
import type { MoveSfx } from '../../../audio/sfx'
import { MOVE_FADE, moveWeight, smooth } from '../../../moves/moveWeight'
import { drawFrom, newBagOf, type MoveBag as BagOf } from '../../../moves/moveBag'
import type { AmaraPose } from './amaraMotion'

/**
 * Amara's moves: twenty little dances and funny things, each with its own sound. Press Space (or click on her)
 * and she does one. Pure data and maths, so a test can play them; `Amara.tsx` blends the move into her pose.
 *
 * Angles are in radians as in `AmaraPose` (a raised arm is a big `armLZ` positive on her left, `armRZ` negative on her
 * right); the extras turn or shift her whole body.
 */
export type MoveExtras = {
  /** A turn about the vertical axis, added to the way she faces. */
  spin: number
  /** A lean to the side (roll) and forward/back (pitch) of the whole body. */
  roll: number
  pitch: number
  /** A step sideways. */
  shiftX: number
  /** Extra hip swing for one leg only, forward when positive (a kick, a stomp). */
  legL: number
  legR: number
}

export type MovePose = Partial<AmaraPose> & Partial<MoveExtras>
export { MOVE_FADE, moveWeight }
export const NO_EXTRAS: MoveExtras = { spin: 0, roll: 0, pitch: 0, shiftX: 0, legL: 0, legR: 0 }

export const MOVE_IDS = [
  'twirl',
  'bigWave',
  'discoPoint',
  'robot',
  'floss',
  'jumpingJacks',
  'bunnyHops',
  'shimmy',
  'clapStomp',
  'curtsy',
  'superhero',
  'chicken',
  'moonwalk',
  'swim',
  'heartHands',
  'giggle',
  'cheerKick',
  'yawnStretch',
  'dizzy',
  'rainbowSweep',
] as const
export type MoveId = (typeof MOVE_IDS)[number]

export type AmaraMove = {
  id: MoveId
  /** What it is called, shown for a moment while she does it. */
  name: Localized
  /** How long it lasts (seconds). */
  duration: number
  sound: MoveSfx | 'whee' | 'boing' | 'yay' | 'squeak' | 'pop'
  /** How she moves `t` seconds into it. */
  pose: (t: number) => MovePose
}

const T = (de: string, pt: string, en: string): Localized => ({ de, pt, en })
const TAU = Math.PI * 2
const pulse = (t: number, period: number) => Math.abs(Math.sin((Math.PI * t) / period))
/** 0 for the first half of each period, 1 for the second: a beat that flips. */
const flip = (t: number, period: number) => Math.floor(t / period) % 2

export const AMARA_MOVES: readonly AmaraMove[] = [
  {
    id: 'twirl',
    name: T('Drehung', 'Pirueta', 'Twirl'),
    duration: 2.6,
    sound: 'whee',
    pose: (t) => ({ spin: 2 * TAU * smooth(t / 2.6), armLZ: 1.7, armRZ: -1.7, bounce: pulse(t, 0.65) * 0.1, legSwing: Math.sin(t * 9) * 0.25, headZ: 0.12 }),
  },
  {
    id: 'bigWave',
    name: T('Großes Winken', 'Tchauzinho', 'Big wave'),
    duration: 2.4,
    sound: 'twinkle',
    pose: (t) => ({ armLZ: 2.6 - Math.sin(t * 9) * 0.4, armRZ: -2.6 + Math.sin(t * 9) * 0.4, headZ: Math.sin(t * 3) * 0.15, bounce: pulse(t, 0.4) * 0.06 }),
  },
  {
    id: 'discoPoint',
    name: T('Disco', 'Disco', 'Disco'),
    duration: 2.8,
    sound: 'disco',
    pose: (t) => {
      const side = flip(t, 0.7) ? 1 : -1
      return { armRZ: side > 0 ? -2.4 : -0.7, armRX: side > 0 ? -0.5 : 0.3, armLZ: side > 0 ? 0.7 : 2.4, armLX: side > 0 ? 0.3 : -0.5, roll: -side * 0.12, legSwing: Math.sin(t * 6) * 0.2, bounce: pulse(t, 0.35) * 0.08, headZ: side * 0.15 }
    },
  },
  {
    id: 'robot',
    name: T('Roboter', 'Robô', 'Robot'),
    duration: 3,
    sound: 'robot',
    pose: (t) => {
      // Stiff, one pose at a time.
      const step = Math.floor(t * 2.5) % 4
      const poses: MovePose[] = [
        { armLX: -1.57, armRX: 0, armLZ: 0.12, armRZ: -0.12, headY: 0.5 },
        { armLX: 0, armRX: -1.57, armLZ: 1.57, armRZ: -0.12, headY: -0.5 },
        { armLX: -1.57, armRX: -1.57, armLZ: 0.12, armRZ: -1.57, headY: 0.5 },
        { armLX: 0, armRX: 0, armLZ: 1.57, armRZ: -1.57, headY: -0.5 },
      ]
      return { ...poses[step], legSwing: 0, bounce: 0, headZ: 0 }
    },
  },
  {
    id: 'floss',
    name: T('Floss', 'Floss', 'Floss'),
    duration: 3,
    sound: 'swish',
    pose: (t) => {
      const s = Math.sin(t * 7)
      return { armLZ: 0.3 + (0.5 + 0.5 * s) * 1.0, armRZ: -(0.3 + (0.5 - 0.5 * s) * 1.0), armLX: -0.5, armRX: -0.5, roll: s * 0.2, shiftX: -s * 0.05, bounce: pulse(t, 0.45) * 0.04 }
    },
  },
  {
    id: 'jumpingJacks',
    name: T('Hampelmann', 'Polichinelo', 'Jumping jacks'),
    duration: 3,
    sound: 'boing',
    pose: (t) => {
      const j = Math.abs(Math.sin(t * 5))
      return { bounce: j * 0.25, armLZ: 0.15 + (1 - j) * 2.45, armRZ: -(0.15 + (1 - j) * 2.45), legSwing: 0, armLX: 0, armRX: 0 }
    },
  },
  {
    id: 'bunnyHops',
    name: T('Hasenhüpfer', 'Pulinhos de coelho', 'Bunny hops'),
    duration: 2.4,
    sound: 'hop',
    pose: (t) => ({ bounce: pulse(t, 0.6) * 0.35, armLX: -0.9, armRX: -0.9, armLZ: 0.3, armRZ: -0.3, headX: 0.1 + pulse(t, 0.6) * 0.2, pitch: 0.1, legSwing: 0.1 }),
  },
  {
    id: 'shimmy',
    name: T('Wackeltanz', 'Remexido', 'Shimmy'),
    duration: 2.4,
    sound: 'shimmy',
    pose: (t) => ({ shiftX: Math.sin(t * 22) * 0.04, roll: Math.sin(t * 22) * 0.1, armLZ: 0.9, armRZ: -0.9, bunZ: Math.sin(t * 22) * 0.4, bounce: Math.abs(Math.sin(t * 11)) * 0.03, headZ: Math.sin(t * 11) * 0.1 }),
  },
  {
    id: 'clapStomp',
    name: T('Klatschen und Stampfen', 'Palmas e pés', 'Clap and stomp'),
    duration: 2.8,
    sound: 'clap',
    pose: (t) => {
      const beat = flip(t, 0.35)
      return { armLX: -1.5, armRX: -1.5, armLZ: beat ? 0.0 : 0.7, armRZ: beat ? 0.0 : -0.7, legL: beat ? 0.6 : 0, legR: beat ? 0 : 0.6, bounce: pulse(t, 0.35) * 0.06, headZ: beat ? 0.1 : -0.1 }
    },
  },
  {
    id: 'curtsy',
    name: T('Knicks', 'Reverência', 'Curtsy'),
    duration: 2.6,
    sound: 'twinkle',
    pose: (t) => {
      const down = Math.sin(smooth(t / 2.6) * Math.PI)
      return { pitch: 0.3 * down, bounce: -0.12 * down, armLZ: 0.5 + 0.5 * down, armRZ: -(0.5 + 0.5 * down), legL: 0.4 * down, legR: -0.2 * down, headX: 0.2 * down, headZ: 0.2 * down }
    },
  },
  {
    id: 'superhero',
    name: T('Superheldin', 'Super-heroína', 'Superhero'),
    duration: 2.6,
    sound: 'tada',
    pose: (t) => ({ armLZ: 0.75, armRZ: -0.75, armLX: 0.2, armRX: 0.2, pitch: -0.1, headX: -0.15, headZ: Math.sin(t * 2) * 0.05, bounce: pulse(t, 1.3) * 0.04, breathe: 1.04 }),
  },
  {
    id: 'chicken',
    name: T('Huhn', 'Galinha', 'Chicken'),
    duration: 2.6,
    sound: 'cluck',
    pose: (t) => ({ armLZ: 0.8 + Math.sin(t * 16) * 0.6, armRZ: -(0.8 - Math.sin(t * 16) * 0.6), armLX: 0.4, armRX: 0.4, headX: Math.sin(t * 8) * 0.25, pitch: 0.2, legSwing: Math.sin(t * 8) * 0.3, bounce: Math.abs(Math.sin(t * 8)) * 0.04 }),
  },
  {
    id: 'moonwalk',
    name: T('Moonwalk', 'Moonwalk', 'Moonwalk'),
    duration: 3,
    sound: 'zip',
    pose: (t) => ({ legSwing: Math.sin(t * 6) * 0.5, shiftX: -0.15 * Math.sin(t * 2), pitch: -0.15, armRZ: -1.4, armLZ: 0.4, headY: 0.4, headZ: -0.1, bounce: Math.abs(Math.sin(t * 6)) * 0.02 }),
  },
  {
    id: 'swim',
    name: T('Schwimmen', 'Nadar', 'Swimming'),
    duration: 3,
    sound: 'bloop',
    pose: (t) => {
      const open = 0.5 + 0.5 * Math.sin(t * 5)
      return { armLX: -1.6, armRX: -1.6, armLZ: 0.4 + open * 1.2, armRZ: -(0.4 + open * 1.2), pitch: 0.25 + Math.sin(t * 5) * 0.05, legSwing: Math.sin(t * 10) * 0.4, bounce: Math.sin(t * 5) * 0.04 }
    },
  },
  {
    id: 'heartHands',
    name: T('Herz', 'Coração', 'Heart'),
    duration: 2.6,
    sound: 'ding',
    pose: (t) => ({ armLZ: 2.9, armRZ: -2.9, headZ: Math.sin(t * 3) * 0.3, bounce: pulse(t, 0.5) * 0.05, breathe: 1 + pulse(t, 0.5) * 0.04 }),
  },
  {
    id: 'giggle',
    name: T('Kichern', 'Risadinha', 'Giggle'),
    duration: 2.2,
    sound: 'giggle',
    pose: (t) => ({ armLX: -1.9, armRX: -1.9, armLZ: -0.5, armRZ: 0.5, headZ: Math.sin(t * 20) * 0.15, shiftX: Math.sin(t * 20) * 0.015, bounce: Math.abs(Math.sin(t * 10)) * 0.05, eyeOpen: 0.3 }),
  },
  {
    id: 'cheerKick',
    name: T('Jubeltritt', 'Chute da alegria', 'Cheer kick'),
    duration: 2.8,
    sound: 'yay',
    pose: (t) => {
      const kick = flip(t, 0.7) ? 1 : -1
      return { armLZ: 2.6, armRZ: -2.6, legL: kick > 0 ? 0.9 : 0, legR: kick > 0 ? 0 : 0.9, bounce: pulse(t, 0.7) * 0.2, headZ: kick * 0.1 }
    },
  },
  {
    id: 'yawnStretch',
    name: T('Strecken', 'Espreguiçar', 'Stretch'),
    duration: 3.2,
    sound: 'yawn',
    pose: (t) => {
      const up = Math.sin(smooth(t / 3.2) * Math.PI)
      return { armLZ: 0.12 + 2.5 * up, armRZ: -(0.12 + 2.5 * up), headX: -0.3 * up, pitch: -0.1 * up, eyeOpen: 1 - 0.75 * up, breathe: 1 + 0.05 * up }
    },
  },
  {
    id: 'dizzy',
    name: T('Schwindelig', 'Tontinha', 'Dizzy'),
    duration: 3,
    sound: 'woo',
    pose: (t) => ({ roll: Math.sin(t * 3.5) * 0.3, pitch: Math.sin(t * 2.5) * 0.15, spin: Math.sin(t * 2) * 0.6, armLZ: 1.2 + Math.sin(t * 4) * 0.5, armRZ: -(1.2 - Math.sin(t * 4) * 0.5), headZ: Math.sin(t * 3.5) * 0.3, eyeOpen: 0.6, legSwing: Math.sin(t * 3.5) * 0.2 }),
  },
  {
    id: 'rainbowSweep',
    name: T('Regenbogen', 'Arco-íris', 'Rainbow'),
    duration: 3.2,
    sound: 'rainbow',
    pose: (t) => {
      const sweep = smooth(t / 1.6)
      const back = smooth((t - 1.6) / 1.6)
      return { armRZ: -(0.2 + 2.4 * sweep * (1 - back)), armLZ: 0.2 + 2.4 * back * sweep, spin: TAU * smooth(t / 3.2), headZ: 0.2 * (sweep - back), bounce: pulse(t, 1.6) * 0.08 }
    },
  },
]

export function moveById(id: MoveId): AmaraMove {
  const move = AMARA_MOVES.find((m) => m.id === id)
  if (!move) throw new Error(`no such move: ${id}`)
  return move
}

/**
 * The move's pose `t` seconds in. With reduced motion she does not spin, lean, step or bounce: she holds a calm
 * version of the move's arms and head (its pose a little way in), still.
 */
export function movePose(move: AmaraMove, t: number, reduceMotion: boolean): MovePose {
  if (!reduceMotion) return move.pose(t)
  const held = move.pose(move.duration * 0.4)
  return { ...held, spin: 0, roll: 0, pitch: 0, shiftX: 0, legL: 0, legR: 0, legSwing: 0, bounce: 0, bunZ: 0 }
}

/** A bag of the moves she has not done yet: she does all twenty before one comes round again. */
export type MoveBag = BagOf<MoveId>

export function newBag(): MoveBag {
  return newBagOf(MOVE_IDS)
}

/** Draws her next move at random from the bag (see `drawFrom`). */
export function drawMove(bag: MoveBag, random: () => number): { id: MoveId; bag: MoveBag } {
  return drawFrom(MOVE_IDS, bag, random)
}

/** A pose she holds for as long as something asks (not one of the twenty moves): sitting on a swing. */
export const HOLD_IDS = ['sit'] as const
export type HoldId = (typeof HOLD_IDS)[number]

/**
 * The pose of a hold `t` seconds in: sitting she holds the ropes (hands forward and out a little) with her legs out
 * in front, and pumps them as the swing goes. With reduced motion the legs stay still.
 */
export function holdPose(id: HoldId, t: number, reduceMotion: boolean): MovePose {
  switch (id) {
    case 'sit': {
      const pump = reduceMotion ? 0 : Math.sin((Math.PI * 2 * t) / 2.6) * 0.3
      return { legL: 1.3 + pump, legR: 1.3 + pump, armLX: -0.55, armRX: -0.55, armLZ: 0.4, armRZ: -0.4, pitch: -0.06, bounce: 0, legSwing: 0, headZ: 0 }
    }
  }
}
