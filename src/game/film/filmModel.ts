/**
 * The maths of the scripted films (class change, intro, ending) as pure
 * functions of time, with no React or three.js: keyframe lists become
 * positions, a door angle, a pop-in scale or the opacity of a speech bubble.
 * Tested without a screen; `Film.tsx` only applies the numbers.
 */
export type V3 = readonly [number, number, number]
/** A value at a second of the film. */
export type Key<T> = readonly [time: number, value: T]

export const clamp01 = (x: number): number => Math.min(1, Math.max(0, x))
/** Ease in and out. */
export const smooth = (x: number): number => x * x * (3 - 2 * x)
/** 0 before `a`, 1 after `b`, a straight ramp between. */
export const seg = (t: number, a: number, b: number): number => (b === a ? (t >= b ? 1 : 0) : clamp01((t - a) / (b - a)))

/** Piecewise interpolation over keyframes. The value holds before the first and after the last key. */
export function keys(t: number, list: readonly Key<number>[], ease: (x: number) => number = smooth): number {
  if (list.length === 0) return 0
  if (t <= list[0][0]) return list[0][1]
  for (let i = 1; i < list.length; i++) {
    const [t1, v1] = list[i]
    const [t0, v0] = list[i - 1]
    if (t <= t1) return v0 + (v1 - v0) * ease(seg(t, t0, t1))
  }
  return list[list.length - 1][1]
}

export function keys3(t: number, list: readonly Key<V3>[], ease: (x: number) => number = smooth): V3 {
  return [
    keys(t, list.map(([k, v]) => [k, v[0]] as const), ease),
    keys(t, list.map(([k, v]) => [k, v[1]] as const), ease),
    keys(t, list.map(([k, v]) => [k, v[2]] as const), ease),
  ]
}

/** Opacity of something shown between `a` and `b` seconds, fading in over `fade` seconds and out again after `b`. */
export function vis(t: number, a: number, b: number, fade = 0.3): number {
  if (t < a || t > b + fade) return 0
  return Math.min(seg(t, a, a + fade), 1 - seg(t, b, b + fade))
}

/** Scale of something that pops in at `at`: 0 before, a little overshoot, then 1. Never exactly 0 (a zero scale breaks normals). */
export function popScale(t: number, at: number, dur = 0.5): number {
  const p = seg(t, at, at + dur)
  if (p <= 0) return 0.0001
  if (p >= 1) return 1
  return smooth(p) + 0.15 * Math.sin(p * Math.PI)
}

/** The y rotation that turns a figure drawn facing +x towards the direction (dx, dz). */
export const yawToward = (dx: number, dz: number): number => Math.atan2(-dz, dx)

/** The little bounce of a trot at second `t`. */
export const trotBounce = (t: number, height: number): number => Math.abs(Math.sin(t * 10)) * height

/** True while a figure is walking: it moved by more than a hair since the last frame. */
export function isMoving(a: V3, b: V3): boolean {
  const dx = a[0] - b[0]
  const dy = a[1] - b[1]
  const dz = a[2] - b[2]
  return dx * dx + dy * dy + dz * dz > 1e-6
}

/** How far a hinged door leaf has swung (radians), for an `open` keyframe list that goes 0 (shut) to 1 (wide). */
export function doorAngle(t: number, open: readonly Key<number>[], maxAngle = 1.9): number {
  return -keys(t, open) * maxAngle
}

/** Which of `shots` (by from/to seconds) is on at second `t`: its index, or -1. */
export function shotAt(t: number, shots: readonly { from: number; to: number }[]): number {
  return shots.findIndex((s) => t >= s.from && t < s.to)
}

/** The most a camera steps back for a very tall screen: past this the figures would be specks. */
export const MAX_PULL_BACK = 2.2

/**
 * Moves a camera back along its line of sight so a tall (phone) screen sees more of the sides, but only
 * as far as the square root of how narrow it is (the room is cropped a little rather than shrunk to a speck):
 * at `aspect` at or above `wide` nothing changes.
 */
export function pullBack(pos: V3, look: V3, aspect: number, wide = 1.7): V3 {
  const k = aspect >= wide || aspect <= 0 ? 1 : Math.min(MAX_PULL_BACK, Math.sqrt(wide / aspect))
  return [look[0] + (pos[0] - look[0]) * k, look[1] + (pos[1] - look[1]) * k, look[2] + (pos[2] - look[2]) * k]
}
