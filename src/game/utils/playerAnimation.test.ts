import { describe, expect, it } from 'vitest'
import {
  computeFacing,
  computePlayerBob,
  computePlayerGlow,
} from './playerAnimation'

describe('computeFacing', () => {
  it('faces left when moving left', () => {
    expect(computeFacing(-1, false)).toBe(true)
  })

  it('faces right when moving right', () => {
    expect(computeFacing(1, true)).toBe(false)
  })

  it('keeps the previous facing when idle', () => {
    expect(computeFacing(0, true)).toBe(true)
    expect(computeFacing(0, false)).toBe(false)
  })
})

describe('computePlayerBob', () => {
  it('never lifts the sprite below its resting position', () => {
    for (let t = 0; t < 2; t += 0.05) {
      expect(computePlayerBob(t, true).offsetY).toBeLessThanOrEqual(0)
      expect(computePlayerBob(t, false).offsetY).toBeLessThanOrEqual(0)
    }
  })

  it('bounces noticeably more while walking than idle', () => {
    // sample the peak (sin = 1) for both frequencies to compare amplitudes
    const walkPeak = Math.min(...Array.from({ length: 200 }, (_, i) => computePlayerBob(i / 100, true).offsetY))
    const idlePeak = Math.min(...Array.from({ length: 200 }, (_, i) => computePlayerBob(i / 100, false).offsetY))
    expect(Math.abs(walkPeak)).toBeGreaterThan(Math.abs(idlePeak))
  })

  it('squash and stretch stay close to 1 (subtle, not cartoonish)', () => {
    for (let t = 0; t < 2; t += 0.05) {
      const { scaleX, scaleY } = computePlayerBob(t, true)
      expect(scaleX).toBeGreaterThan(0.85)
      expect(scaleX).toBeLessThan(1.15)
      expect(scaleY).toBeGreaterThan(0.85)
      expect(scaleY).toBeLessThan(1.15)
    }
  })

  it('is deterministic for the same time and state', () => {
    expect(computePlayerBob(0.42, true)).toEqual(computePlayerBob(0.42, true))
  })
})

describe('computePlayerGlow', () => {
  it('stays within the 0..1 range', () => {
    for (let t = 0; t < 3; t += 0.05) {
      const g = computePlayerGlow(t)
      expect(g).toBeGreaterThanOrEqual(0)
      expect(g).toBeLessThanOrEqual(1)
    }
  })
})
