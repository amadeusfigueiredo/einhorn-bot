import { describe, expect, it } from 'vitest'
import { clamp, rectsOverlap, dist } from './collision'

describe('clamp', () => {
  it('returns the value when inside the range', () => {
    expect(clamp(5, 0, 10)).toBe(5)
  })

  it('clamps to the lower bound', () => {
    expect(clamp(-5, 0, 10)).toBe(0)
  })

  it('clamps to the upper bound', () => {
    expect(clamp(15, 0, 10)).toBe(10)
  })
})

describe('rectsOverlap', () => {
  it('detects overlapping rectangles', () => {
    const a = { x: 0, y: 0, w: 10, h: 10 }
    const b = { x: 5, y: 5, w: 10, h: 10 }
    expect(rectsOverlap(a, b)).toBe(true)
  })

  it('detects non-overlapping rectangles', () => {
    const a = { x: 0, y: 0, w: 10, h: 10 }
    const b = { x: 20, y: 20, w: 10, h: 10 }
    expect(rectsOverlap(a, b)).toBe(false)
  })

  it('treats edge-touching rectangles as non-overlapping', () => {
    const a = { x: 0, y: 0, w: 10, h: 10 }
    const b = { x: 10, y: 0, w: 10, h: 10 }
    expect(rectsOverlap(a, b)).toBe(false)
  })
})

describe('dist', () => {
  it('computes euclidean distance', () => {
    expect(dist(0, 0, 3, 4)).toBe(5)
  })

  it('returns 0 for identical points', () => {
    expect(dist(7, 7, 7, 7)).toBe(0)
  })
})
