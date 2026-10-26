import type { Localized } from '../../i18n/languages'
import type { MoveSfx } from '../../audio/sfx'
import { smooth } from '../../moves/moveWeight'
import { drawFrom, newBagOf, type MoveBag as BagOf } from '../../moves/moveBag'
import type { Pose } from './unicornMotion'

/**
 * The unicorn hero's moves: a dozen little dances and funny things for a four-legged body, each with its own sound.
 * Press Space (or click on her) and it does one. Pure data and maths, so a test can play them; `Unicorn.tsx` blends
 * the move into its pose.
 *
 * The pose is the unicorn's usual one (`unicornMotion.ts`); the extras turn or lift parts the usual pose has no word
 * for. Forward is +X, so a positive `roll` is nose up, and a positive leg angle swings a hoof forward.
 */
export type UnicornExtras = {
  /** A somersault: the whole body turns nose over tail about its middle (negative: forward). */
  flip: number
  /** A lean to one side (about the way it faces). */
  tilt: number
  /** Each hoof swung forward (positive) or back: the two front legs and the two back legs. */
  frontL: number
  frontR: number
  backL: number
  backR: number
  /** The horn glows brighter (added to its glow). */
  glow: number
}

export type UnicornMovePose = Partial<Pose> & Partial<UnicornExtras>
export const NO_UNICORN_EXTRAS: UnicornExtras = { flip: 0, tilt: 0, frontL: 0, frontR: 0, backL: 0, backR: 0, glow: 0 }

export const UNICORN_MOVE_IDS = [
  'twirl',
  'rearUp',
  'gallop',
  'bow',
  'somersault',
  'wiggle',
  'stomp',
  'lookAround',
  'rainbowSpin',
  'stretch',
  'disco',
  'sparkle',
] as const
export type UnicornMoveId = (typeof UNICORN_MOVE_IDS)[number]

export type UnicornMove = {
  id: UnicornMoveId
  /** What it is called, shown for a moment while it does it. */
  name: Localized
  /** How long it lasts (seconds). */
  duration: number
  sound: MoveSfx | 'whee' | 'boing' | 'sparkle' | 'squeak'
  /** How it moves `t` seconds into it. */
  pose: (t: number) => UnicornMovePose
}

const T = (de: string, pt: string, en: string): Localized => ({ de, pt, en })
const TAU = Math.PI * 2
const pulse = (t: number, period: number) => Math.abs(Math.sin((Math.PI * t) / period))
/** 0 up to 1 and back to 0 over `duration`, gently. */
const arc = (t: number, duration: number) => Math.sin(smooth(t / duration) * Math.PI)
const flip = (t: number, period: number) => Math.floor(t / period) % 2

/** Where the body's middle is above its feet, in the unicorn's own units (the legs hang from 0.4, the barrel is a little above). */
export const BODY_MIDDLE = 0.62
/** How far the hips of the back legs are behind the middle, and how high they are. */
const BACK_HIP = { x: 0.34, y: 0.4 }

/**
 * How far the body has to be lifted so that, tipped nose up by `roll` about its middle point on the ground, its back
 * hooves still stand on the floor (the back legs are turned back by the same angle, see `rearUp`).
 */
export function plantedLift(roll: number): number {
  return BACK_HIP.x * Math.sin(roll) + BACK_HIP.y * (1 - Math.cos(roll))
}

/** Turning the body by `angle` about its middle instead of about its feet moves it by this much. */
export function pivotShift(angle: number): { x: number; y: number } {
  return { x: BODY_MIDDLE * Math.sin(angle), y: BODY_MIDDLE * (1 - Math.cos(angle)) }
}

export const UNICORN_MOVES: readonly UnicornMove[] = [
  {
    id: 'twirl',
    name: T('Drehung', 'Pirueta', 'Twirl'),
    duration: 2.4,
    sound: 'whee',
    pose: (t) => ({ spin: 2 * TAU * smooth(t / 2.4), lift: pulse(t, 0.6) * 0.25, headPitch: 0.3, tail: Math.sin(t * 14) * 0.7, stretch: 1 + pulse(t, 0.6) * 0.05 }),
  },
  {
    id: 'rearUp',
    name: T('Aufbäumen', 'Empinar', 'Rear up'),
    duration: 2.6,
    sound: 'neigh',
    pose: (t) => {
      const up = arc(t, 2.6)
      const roll = 0.9 * up
      return { roll, lift: plantedLift(roll), backL: -roll, backR: -roll, frontL: 0.7 * up, frontR: 0.5 * up + Math.sin(t * 9) * 0.15 * up, headPitch: -0.2 * up, tail: 0.4 * up, earsDown: 0.3 * up }
    },
  },
  {
    id: 'gallop',
    name: T('Galopp', 'Galope', 'Gallop'),
    duration: 2.6,
    sound: 'clop',
    pose: (t) => {
      const s = Math.sin(t * 15) * 0.9
      return { frontL: s, frontR: Math.sin(t * 15 + 1) * 0.9, backL: -s, backR: -Math.sin(t * 15 + 1) * 0.9, lift: Math.abs(Math.sin(t * 7.5)) * 0.14, roll: Math.sin(t * 7.5) * 0.06, headPitch: 0.2 + Math.sin(t * 7.5) * 0.1, tail: 0.6 + Math.sin(t * 12) * 0.3 }
    },
  },
  {
    id: 'bow',
    name: T('Verbeugung', 'Reverência', 'Bow'),
    duration: 2.6,
    sound: 'twinkle',
    pose: (t) => {
      const down = arc(t, 2.6)
      return { headPitch: -0.95 * down, stretch: 1 - 0.07 * down, frontL: 0.3 * down, frontR: 0.3 * down, lift: -0.02 * down, tail: Math.sin(t * 5) * 0.3, eyeOpen: 1 - 0.4 * down }
    },
  },
  {
    id: 'somersault',
    name: T('Salto', 'Cambalhota', 'Somersault'),
    duration: 2.2,
    sound: 'boing',
    pose: (t) => {
      const u = smooth((t - 0.35) / 1.1)
      return { flip: -TAU * u, lift: Math.sin(u * Math.PI) * 0.75 + pulse(t, 0.35) * 0.05 * (1 - u), frontL: -0.5 * Math.sin(u * Math.PI), frontR: -0.5 * Math.sin(u * Math.PI), backL: 0.5 * Math.sin(u * Math.PI), backR: 0.5 * Math.sin(u * Math.PI), stretch: 1 - 0.08 * Math.sin(u * Math.PI) }
    },
  },
  {
    id: 'wiggle',
    name: T('Wackeltanz', 'Remexido', 'Wiggle'),
    duration: 2.4,
    sound: 'shimmy',
    pose: (t) => ({ tilt: Math.sin(t * 10) * 0.2, headYaw: Math.sin(t * 10 + 1) * 0.5, lift: Math.abs(Math.sin(t * 10)) * 0.08, tail: Math.sin(t * 20) * 0.8, headPitch: 0.15 }),
  },
  {
    id: 'stomp',
    name: T('Stampfen', 'Patadas', 'Stomp'),
    duration: 2.8,
    sound: 'clap',
    pose: (t) => {
      const beat = flip(t, 0.35)
      const hit = pulse(t, 0.35)
      return { frontL: beat ? 0 : 0.9 * hit, frontR: beat ? 0.9 * hit : 0, backL: beat ? 0.5 * hit : 0, backR: beat ? 0 : 0.5 * hit, headPitch: -0.1 + (beat ? 0.15 : -0.05), lift: hit * 0.05, tail: Math.sin(t * 9) * 0.4, earsDown: 0.15 }
    },
  },
  {
    id: 'lookAround',
    name: T('Umschauen', 'Espiar', 'Look around'),
    duration: 3,
    sound: 'squeak',
    pose: (t) => ({ headYaw: Math.sin(t * 2.2) * 0.9, headPitch: 0.1 + Math.max(0, Math.sin(t * 1.1)) * 0.25, earsDown: Math.max(0, Math.sin(t * 4)) * 0.35, tail: Math.sin(t * 3) * 0.3, roll: 0.05 }),
  },
  {
    id: 'rainbowSpin',
    name: T('Regenbogen', 'Arco-íris', 'Rainbow'),
    duration: 3.2,
    sound: 'rainbow',
    pose: (t) => ({ spin: TAU * smooth(t / 3.2), headPitch: 0.15 + 0.4 * Math.sin(smooth(t / 3.2) * Math.PI), glow: 1.6 * arc(t, 3.2), lift: pulse(t, 1.6) * 0.1, tail: Math.sin(t * 8) * 0.6 }),
  },
  {
    id: 'stretch',
    name: T('Strecken', 'Espreguiçar', 'Stretch'),
    duration: 3.2,
    sound: 'yawn',
    pose: (t) => {
      const u = arc(t, 3.2)
      return { roll: -0.18 * u, headPitch: 0.5 * u, stretch: 1 + 0.12 * u, eyeOpen: 1 - 0.8 * u, earsDown: 0.4 * u, frontL: 0.5 * u, frontR: 0.5 * u, backL: 0.18 * u, backR: 0.18 * u, lift: -0.02 * u, tail: 0.3 * u }
    },
  },
  {
    id: 'disco',
    name: T('Disco', 'Disco', 'Disco'),
    duration: 2.8,
    sound: 'disco',
    pose: (t) => {
      const side = flip(t, 0.7) ? 1 : -1
      return { frontL: side > 0 ? 0 : 1.0, frontR: side > 0 ? 1.0 : 0, tilt: side * 0.14, headYaw: side * 0.5, headPitch: 0.2 + pulse(t, 0.35) * 0.15, lift: pulse(t, 0.35) * 0.08, tail: Math.sin(t * 9) * 0.6 }
    },
  },
  {
    id: 'sparkle',
    name: T('Funkeln', 'Brilhar', 'Sparkle'),
    duration: 2.4,
    sound: 'sparkle',
    pose: (t) => ({ glow: (1.2 + Math.sin(t * 16) * 0.8) * arc(t, 2.4), headPitch: 0.5 * arc(t, 2.4), lift: pulse(t, 0.8) * 0.15, stretch: 1 + pulse(t, 0.8) * 0.04, tail: Math.sin(t * 12) * 0.6, eyeOpen: 1 }),
  },
]

export function unicornMoveById(id: UnicornMoveId): UnicornMove {
  const move = UNICORN_MOVES.find((m) => m.id === id)
  if (!move) throw new Error(`no such unicorn move: ${id}`)
  return move
}

/**
 * The move's pose `t` seconds in. With reduced motion it does not spin, flip, lean, hop or step: it holds a calm
 * version of the move's head, ears and eyes (its pose a little way in), still.
 */
export function unicornMovePose(move: UnicornMove, t: number, reduceMotion: boolean): UnicornMovePose {
  if (!reduceMotion) return move.pose(t)
  const held = move.pose(move.duration * 0.4)
  return { ...held, spin: 0, roll: 0, lift: 0, stretch: 1, tail: 0, flip: 0, tilt: 0, frontL: 0, frontR: 0, backL: 0, backR: 0 }
}

/** A bag of the moves not done yet: it does all of them before one comes round again. */
export type UnicornMoveBag = BagOf<UnicornMoveId>

export function newUnicornBag(): UnicornMoveBag {
  return newBagOf(UNICORN_MOVE_IDS)
}

export function drawUnicornMove(bag: UnicornMoveBag, random: () => number): { id: UnicornMoveId; bag: UnicornMoveBag } {
  return drawFrom(UNICORN_MOVE_IDS, bag, random)
}
