/**
 * Frame-rate independent exponential smoothing: moves `current` toward
 * `target`, closing most of the gap in about `3 / rate` seconds. Snaps when
 * already close, or when the jump is so large it must be a teleport (a
 * stage change) rather than a walk.
 */
export function smoothToward(
  current: number,
  target: number,
  dt: number,
  rate = 18,
  snapDistance = 240
): number {
  const gap = target - current
  if (Math.abs(gap) > snapDistance || Math.abs(gap) < 0.05) return target
  return current + gap * (1 - Math.exp(-rate * dt))
}
