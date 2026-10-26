/** 0 up to 1 over `u` from 0 to 1, with soft ends. */
export const smooth = (u: number) => {
  const c = Math.min(1, Math.max(0, u))
  return c * c * (3 - 2 * c)
}

/** How much of a move shows at `t`: it eases in over its first moments and out over its last, so a figure never snaps into or out of it. */
export const MOVE_FADE = 0.3
export function moveWeight(t: number, duration: number): number {
  if (t <= 0 || t >= duration) return 0
  return Math.min(smooth(t / MOVE_FADE), smooth((duration - t) / MOVE_FADE))
}
