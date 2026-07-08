import { describe, expect, it } from 'vitest'
import { clampStageIndex, oneBasedToStageIndex } from './useDevNavigation'

describe('clampStageIndex', () => {
  it('keeps an in-range index unchanged', () => {
    expect(clampStageIndex(3, 12)).toBe(3)
  })

  it('clamps below zero up to 0', () => {
    expect(clampStageIndex(-1, 12)).toBe(0)
  })

  it('clamps above the last index down to total - 1', () => {
    expect(clampStageIndex(99, 12)).toBe(11)
  })

  it('returns 0 for a non-positive total', () => {
    expect(clampStageIndex(5, 0)).toBe(0)
  })
})

describe('oneBasedToStageIndex', () => {
  it('converts a 1-based stage number to a 0-based index', () => {
    expect(oneBasedToStageIndex(1, 12)).toBe(0)
    expect(oneBasedToStageIndex(12, 12)).toBe(11)
  })

  it('clamps out-of-range input', () => {
    expect(oneBasedToStageIndex(0, 12)).toBe(0)
    expect(oneBasedToStageIndex(999, 12)).toBe(11)
  })
})
