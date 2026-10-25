import { describe, expect, it } from 'vitest'
import { MOVE_FADE, moveWeight, smooth } from './moveWeight'

describe('smooth', () => {
  it('goes from 0 to 1 with soft ends, and stays inside', () => {
    expect(smooth(-1)).toBe(0)
    expect(smooth(0)).toBe(0)
    expect(smooth(0.5)).toBe(0.5)
    expect(smooth(1)).toBe(1)
    expect(smooth(7)).toBe(1)
    expect(smooth(0.1)).toBeLessThan(0.1)
  })
})

describe('moveWeight', () => {
  it('shows none of a move before it starts or after it ends', () => {
    expect(moveWeight(0, 2)).toBe(0)
    expect(moveWeight(-1, 2)).toBe(0)
    expect(moveWeight(2, 2)).toBe(0)
    expect(moveWeight(3, 2)).toBe(0)
  })

  it('eases in, holds all of it in the middle and eases out', () => {
    expect(moveWeight(MOVE_FADE / 2, 3)).toBeGreaterThan(0)
    expect(moveWeight(MOVE_FADE / 2, 3)).toBeLessThan(1)
    expect(moveWeight(1.5, 3)).toBe(1)
    expect(moveWeight(3 - MOVE_FADE / 2, 3)).toBeGreaterThan(0)
    expect(moveWeight(3 - MOVE_FADE / 2, 3)).toBeLessThan(1)
  })
})
