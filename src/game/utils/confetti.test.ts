import { describe, expect, it } from 'vitest'
import { generateConfetti, CONFETTI_COLORS } from './confetti'

// Deterministic stand-in for Math.random, cycling through a fixed sequence.
function fakeRng(values: number[]): () => number {
  let i = 0
  return () => values[i++ % values.length]
}

describe('generateConfetti', () => {
  it('generates the requested number of pieces', () => {
    expect(generateConfetti(24, fakeRng([0.1, 0.5, 0.9]))).toHaveLength(24)
  })

  it('keeps every piece within its valid ranges', () => {
    const pieces = generateConfetti(50, fakeRng([0, 0.25, 0.5, 0.75, 0.999]))
    for (const p of pieces) {
      expect(p.left).toBeGreaterThanOrEqual(0)
      expect(p.left).toBeLessThan(100)
      expect(CONFETTI_COLORS).toContain(p.color)
      expect(p.delaySeconds).toBeGreaterThanOrEqual(0)
      expect(p.delaySeconds).toBeLessThan(0.4)
      expect(p.durationSeconds).toBeGreaterThanOrEqual(1.6)
      expect(p.durationSeconds).toBeLessThan(2.8)
      expect(p.rotationDeg).toBeGreaterThanOrEqual(0)
      expect(p.rotationDeg).toBeLessThan(360)
      expect(Math.abs(p.driftPx)).toBeLessThanOrEqual(30)
    }
  })

  it('is deterministic for a given rng sequence', () => {
    const rngValues = [0.2, 0.4, 0.6, 0.8]
    expect(generateConfetti(10, fakeRng(rngValues))).toEqual(
      generateConfetti(10, fakeRng(rngValues))
    )
  })

  it('cycles through the rainbow palette', () => {
    const pieces = generateConfetti(CONFETTI_COLORS.length * 2, fakeRng([0.5]))
    expect(pieces[0].color).toBe(pieces[CONFETTI_COLORS.length].color)
  })

  it('returns an empty array for count 0', () => {
    expect(generateConfetti(0, fakeRng([0.5]))).toEqual([])
  })
})
