import type { Personality } from '../../data/unicornLooks'

/**
 * Pure animation curves for the 3D unicorns. Each returns offsets that the
 * component applies to its parts; nothing here knows about three.js.
 */
export type Pose = {
  /** Body lift (world units). Negative sinks the body. */
  lift: number
  /** Extra turn around the vertical axis (radians). */
  spin: number
  /** Roll side to side (radians). */
  roll: number
  /** Head nod: negative looks down (radians). */
  headPitch: number
  /** Head turn left/right (radians). */
  headYaw: number
  /** Squash and stretch of the body (1 = none). */
  stretch: number
  /** Tail wag amount (radians). */
  tail: number
  /** Ears: 0 up, 1 flat. */
  earsDown: number
  /** One front leg lifted (radians), the impatient paw. */
  pawLift: number
  /** How open the eyes are (0 closed, 1 open). */
  eyeOpen: number
}

export const REST: Pose = {
  lift: 0, spin: 0, roll: 0, headPitch: 0, headYaw: 0, stretch: 1,
  tail: 0, earsDown: 0, pawLift: 0, eyeOpen: 1,
}

const TAU = Math.PI * 2

/** Blinks every few seconds; `seed` desynchronises a herd. */
export function blink(t: number, seed = 0): number {
  const cycle = (t + seed * 1.37) % 3.6
  if (cycle > 3.4) return Math.max(0, Math.abs(cycle - 3.5) / 0.1) * 0.9 + 0.1
  return 1
}

/** Waiting around: every personality fills the time differently. */
export function idlePose(personality: Personality, t: number): Pose {
  const breath = Math.sin(t * 1.1 * TAU)
  const base: Pose = { ...REST, lift: breath * 0.018, tail: Math.sin(t * 1.6) * 0.35 }
  switch (personality) {
    case 'bouncy': {
      // A little hop every ~1.7 s and an impatient paw in between.
      const k = (t % 1.7) / 1.7
      const hop = k < 0.3 ? Math.sin((k / 0.3) * Math.PI) : 0
      return {
        ...base,
        lift: hop * 0.22,
        stretch: 1 + hop * 0.06,
        pawLift: k > 0.55 && k < 0.85 ? Math.sin(((k - 0.55) / 0.3) * Math.PI) * 0.6 : 0,
        tail: Math.sin(t * 5) * 0.4,
      }
    }
    case 'sleepy': {
      const nod = (Math.sin(t * 0.5 * TAU) + 1) / 2
      return {
        ...base,
        lift: breath * 0.012 - 0.02,
        headPitch: -0.2 - nod * 0.35,
        earsDown: 0.5,
        eyeOpen: 0.25 + 0.25 * (1 - nod),
        stretch: 1 + breath * 0.012,
        tail: Math.sin(t * 0.8) * 0.2,
      }
    }
    case 'curious': {
      // Looks left, right, then tilts its head at whatever it sees.
      const look = Math.sin(t * 0.7 * TAU * 0.5)
      return {
        ...base,
        headYaw: look * 0.7,
        headPitch: Math.max(0, Math.sin(t * 0.7 * TAU * 0.5 + 1)) * 0.18,
        earsDown: Math.max(0, Math.sin(t * 2)) * 0.25,
      }
    }
    case 'proud': {
      const puff = (Math.sin(t * 0.9 * TAU) + 1) / 2
      return {
        ...base,
        headPitch: 0.22,
        stretch: 1 + puff * 0.035,
        lift: 0.03 + puff * 0.025,
        tail: Math.sin(t * 2.4) * 0.5,
      }
    }
  }
}

/** Happy reactions. `variant` 0 double jump, 1 spin, 2 wiggle dance. */
export function happyPose(t: number, variant: number, intensity = 1): Pose {
  const a = intensity
  const tail = Math.sin(t * 16) * 0.7 * a
  switch (variant % 3) {
    case 0: {
      // Two big hops with a squash on landing.
      const k = (t % 0.8) / 0.8
      const hop = Math.sin(k * Math.PI)
      return { ...REST, lift: hop * 0.55 * a, stretch: 1 + (hop - 0.5) * 0.12 * a, headPitch: 0.25 * a, tail, eyeOpen: 1 }
    }
    case 1: {
      // One full twirl with a hop, then bounce on the spot.
      const k = Math.min(t / 0.9, 1)
      const eased = k * k * (3 - 2 * k)
      const hop = Math.sin(Math.min(t / 0.9, 1) * Math.PI)
      const after = t > 0.9 ? Math.abs(Math.sin((t - 0.9) * 7)) * 0.12 * a : 0
      return { ...REST, spin: eased * TAU * (a > 0.6 ? 1 : 0), lift: hop * 0.5 * a + after, headPitch: 0.3 * a, tail }
    }
    default: {
      // Wiggle dance: roll, head bob, bounce.
      const s = Math.sin(t * 9)
      return { ...REST, roll: s * 0.22 * a, lift: Math.abs(Math.sin(t * 9)) * 0.14 * a, headYaw: s * 0.4 * a, headPitch: 0.15 * a, tail }
    }
  }
}

/** Sad reactions, gentle and short. `variant` 0 head down, 1 sag, 2 slow no. */
export function sadPose(t: number, variant: number): Pose {
  const settle = Math.min(t / 0.5, 1)
  switch (variant % 3) {
    case 0:
      return { ...REST, headPitch: -0.75 * settle, earsDown: settle, lift: -0.03 * settle, tail: -0.2, eyeOpen: 0.7 }
    case 1: {
      // Whole body sags and sighs.
      const sigh = Math.sin(t * 2.2) * 0.02
      return { ...REST, lift: -0.09 * settle + sigh, stretch: 1 - 0.07 * settle, headPitch: -0.45 * settle, earsDown: settle, roll: Math.sin(t * 1.4) * 0.05, tail: -0.3, eyeOpen: 0.6 }
    }
    default:
      // Slow shake of the head: "oh, no".
      return { ...REST, headYaw: Math.sin(t * 5) * 0.5 * settle, headPitch: -0.35 * settle, earsDown: 0.8 * settle, tail: -0.1, eyeOpen: 0.75 }
  }
}

/** Thinking it over after a wrong answer: the head tilts to one side, a slow sway. Never sad. */
export function thinkPose(t: number): Pose {
  const settle = Math.min(t / 0.4, 1)
  return {
    ...REST,
    headYaw: 0.4 * settle,
    headPitch: 0.1 * settle,
    roll: 0.05 * settle * Math.sin(t * 1.6),
    tail: Math.sin(t * 2) * 0.25,
    pawLift: t % 2.4 < 0.5 ? Math.sin((t % 2.4) * Math.PI * 2) * 0.25 : 0,
  }
}

/** Teacher cheering the player on after a wrong answer: nod and a wink. */
export function encouragePose(t: number): Pose {
  const nod = Math.sin(t * 6) * 0.2
  return { ...REST, headPitch: nod, lift: Math.abs(Math.sin(t * 3)) * 0.05, tail: Math.sin(t * 8) * 0.5 }
}
