import { blink } from '../unicornMotion'

/** What Amara is doing: standing around, waving hello, cheering (arms up), thinking (hand on chin), or asleep. */
export type AmaraMood = 'idle' | 'wave' | 'cheer' | 'think' | 'happy' | 'sleep'

/** The numbers that move her: angles in radians, `bounce` in world units at size 1. */
export type AmaraPose = {
  bounce: number
  /** Vertical stretch of the body: breathing. */
  breathe: number
  /** Hip swing: one leg forward, the other back. */
  legSwing: number
  armLX: number
  armLZ: number
  armRX: number
  armRZ: number
  headX: number
  headY: number
  headZ: number
  bunZ: number
  /** 1 open, about 0.1 shut. */
  eyeOpen: number
}

/**
 * The turn that points a figure at something, from where that is in the figure's own frame (x to the right, z toward
 * the viewer when no turn is applied): 0 faces +z, a quarter turn faces +x.
 */
export function facingYaw(dx: number, dz: number): number {
  return dx === 0 && dz === 0 ? 0 : Math.atan2(dx, dz)
}

export const REST_AMARA: AmaraPose = {
  bounce: 0,
  breathe: 1,
  legSwing: 0,
  armLX: 0,
  armLZ: 0.12,
  armRX: 0,
  armRZ: -0.12,
  headX: 0,
  headY: 0,
  headZ: 0,
  bunZ: 0,
  eyeOpen: 1,
}

export type AmaraInput = {
  /** Seconds, plus the figure's own offset. */
  t: number
  walking: boolean
  mood: AmaraMood
  reduceMotion: boolean
  /** Desynchronises blinking between figures. */
  seed?: number
}

/**
 * Where Amara's body should be at time `t`. Very happy, curious, never fully
 * still: she breathes, blinks, looks around, bounces a little. Walking swings
 * her legs and arms; each mood changes her arms and head. With reduced motion
 * she keeps the pose of her mood but nothing sways, bounces or swings.
 */
export function amaraPose({ t, walking, mood, reduceMotion, seed = 0 }: AmaraInput): AmaraPose {
  const k = reduceMotion ? 0 : 1
  const cheering = mood === 'cheer' || mood === 'happy'
  const sleeping = mood === 'sleep'

  const bounce = walking
    ? Math.abs(Math.sin(t * 9)) * 0.06
    : cheering
      ? Math.abs(Math.sin(t * 6)) * 0.18
      : Math.abs(Math.sin(t * 1.6)) * 0.015
  const swing = walking ? Math.sin(t * 9) * 0.6 : 0

  let armLX = -swing * 0.8
  let armRX = swing * 0.8
  let armLZ = 0.12
  let armRZ = -0.12
  if (mood === 'wave') {
    armRZ = -2.6 + Math.sin(t * 8) * 0.35 * k
    armRX = 0
  }
  if (cheering) {
    armLZ = 2.6 + Math.sin(t * 6) * 0.2 * k
    armRZ = -2.6 - Math.sin(t * 6) * 0.2 * k
    armLX = armRX = 0
  }
  if (mood === 'think') {
    // The forearm comes up in front of her, a little inward: a hand at the chin.
    armRX = -1.9
    armRZ = 0.5
  }
  if (sleeping) {
    armLX = armRX = 0
    armLZ = 0.3
    armRZ = -0.3
  }

  return {
    bounce: bounce * k,
    breathe: 1 + Math.sin(t * 2.2) * 0.015 * k,
    legSwing: swing * k,
    armLX: armLX * k,
    armLZ,
    armRX: mood === 'think' ? armRX : armRX * k,
    armRZ,
    headX: Math.sin(t * 1.3) * 0.04 * k,
    headY: walking || sleeping ? 0 : Math.sin(t * 0.7) * 0.25 * k,
    headZ: mood === 'think' ? 0.25 : Math.sin(t * 0.9) * 0.05 * k,
    bunZ: Math.sin(t * 5) * (walking ? 0.2 : 0.05) * k,
    eyeOpen: sleeping ? 0.12 : reduceMotion ? 1 : blink(t, seed),
  }
}
