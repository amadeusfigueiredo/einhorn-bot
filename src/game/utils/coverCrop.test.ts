import { describe, expect, it } from 'vitest'
import { coverCrop } from './coverCrop'

describe('coverCrop', () => {
  it('uses the whole image when its shape already matches the box', () => {
    expect(coverCrop({ width: 200, height: 200 }, 100, 100)).toEqual({
      sx: 0,
      sy: 0,
      sw: 200,
      sh: 200,
    })
  })

  it('crops the sides of a wide image, centred', () => {
    const c = coverCrop({ width: 400, height: 200 }, 100, 100)
    expect(c).toEqual({ sx: 100, sy: 0, sw: 200, sh: 200 })
  })

  it('crops a tall image from the top, not the middle', () => {
    const c = coverCrop({ width: 100, height: 400 }, 100, 100, 0.25)
    expect(c.sw).toBe(100)
    expect(c.sh).toBe(100)
    expect(c.sy).toBe(75) // 25% of the 300px that is cut away
  })

  it('always keeps the crop inside the image and in the box aspect', () => {
    for (const [w, h] of [[271, 457], [1600, 1000], [564, 1086], [238, 344]]) {
      const c = coverCrop({ width: w, height: h }, 150, 150)
      expect(c.sx).toBeGreaterThanOrEqual(0)
      expect(c.sy).toBeGreaterThanOrEqual(0)
      expect(c.sx + c.sw).toBeLessThanOrEqual(w + 1e-9)
      expect(c.sy + c.sh).toBeLessThanOrEqual(h + 1e-9)
      expect(c.sw / c.sh).toBeCloseTo(1, 6)
    }
  })
})
