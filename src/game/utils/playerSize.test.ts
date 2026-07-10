import { describe, expect, it } from 'vitest'
import { computePlayerSize } from './playerSize'

describe('computePlayerSize', () => {
  it('scales the image dimensions down by a fixed divisor', () => {
    expect(computePlayerSize({ width: 300, height: 300 })).toEqual({
      w: 100,
      h: 100,
    })
  })

  it('rounds to whole pixels', () => {
    const { w, h } = computePlayerSize({ width: 301, height: 301 })
    expect(Number.isInteger(w)).toBe(true)
    expect(Number.isInteger(h)).toBe(true)
  })

  it('is bigger than the old /4 sizing', () => {
    const image = { width: 400, height: 200 }
    const oldSize = { w: image.width / 4, h: image.height / 4 }
    const newSize = computePlayerSize(image)
    expect(newSize.w).toBeGreaterThan(oldSize.w)
    expect(newSize.h).toBeGreaterThan(oldSize.h)
  })

  it('preserves the image aspect ratio (within independent rounding)', () => {
    const { w, h } = computePlayerSize({ width: 400, height: 200 })
    expect(w / h).toBeCloseTo(400 / 200, 1)
  })
})
