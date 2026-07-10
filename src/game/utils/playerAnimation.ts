export type PlayerBob = {
  /** Vertical hop offset in px, always <= 0 (sprite lifts up, never sinks). */
  offsetY: number
  scaleX: number
  scaleY: number
}

const IDLE_FREQ_HZ = 1.1
const IDLE_AMPLITUDE = 2.5
const IDLE_SQUASH = 0.02

const WALK_FREQ_HZ = 6
const WALK_AMPLITUDE = 6
const WALK_SQUASH = 0.06

/** Which way the sprite should face; sticky when there's no horizontal input. */
export function computeFacing(vx: number, prevFacingLeft: boolean): boolean {
  if (vx < 0) return true
  if (vx > 0) return false
  return prevFacingLeft
}

/** A little idle-breathing / walk-bounce cycle, driven purely by elapsed time. */
export function computePlayerBob(t: number, moving: boolean): PlayerBob {
  const freq = moving ? WALK_FREQ_HZ : IDLE_FREQ_HZ
  const amplitude = moving ? WALK_AMPLITUDE : IDLE_AMPLITUDE
  const squash = moving ? WALK_SQUASH : IDLE_SQUASH

  // Rectified sine so every step reads as a little hop, not a full swing.
  const hop = Math.abs(Math.sin(t * freq * Math.PI * 2))

  return {
    offsetY: -hop * amplitude,
    scaleY: 1 + hop * squash,
    scaleX: 1 - hop * squash,
  }
}

/** 0..1 pulsing intensity for the rainbow glow behind the player. */
export function computePlayerGlow(t: number): number {
  return 0.5 + 0.5 * Math.sin(t * 2 * Math.PI * 0.8)
}
