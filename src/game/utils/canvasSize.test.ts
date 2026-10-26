import { describe, expect, it } from 'vitest'
import { pickCanvasSize } from './canvasSize'
import { WIDTH, HEIGHT, PORTRAIT_WIDTH, PORTRAIT_HEIGHT, WIDE_WIDTH, WIDE_HEIGHT } from '../constants/dimensions'

describe('pickCanvasSize', () => {
  it('uses the landscape resolution for a wide viewport', () => {
    expect(pickCanvasSize(1440, 900)).toEqual({ width: WIDTH, height: HEIGHT })
  })

  it('uses the portrait resolution for a tall viewport', () => {
    expect(pickCanvasSize(390, 844)).toEqual({
      width: PORTRAIT_WIDTH,
      height: PORTRAIT_HEIGHT,
    })
  })

  it('treats a square viewport as landscape (not taller than wide)', () => {
    expect(pickCanvasSize(800, 800)).toEqual({ width: WIDTH, height: HEIGHT })
  })

  it('uses the extra-wide resolution for a phone held sideways (iPhone 13)', () => {
    expect(pickCanvasSize(844, 390)).toEqual({ width: WIDE_WIDTH, height: WIDE_HEIGHT })
    expect(pickCanvasSize(750, 340)).toEqual({ width: WIDE_WIDTH, height: WIDE_HEIGHT })
  })

  it('keeps 16:9 laptops and tablets on the normal landscape resolution', () => {
    expect(pickCanvasSize(1920, 1080)).toEqual({ width: WIDTH, height: HEIGHT })
    expect(pickCanvasSize(1180, 820)).toEqual({ width: WIDTH, height: HEIGHT })
  })

  it('the portrait resolution is narrower than the landscape one', () => {
    expect(PORTRAIT_WIDTH).toBeLessThan(WIDTH)
  })

  it('the portrait resolution is actually portrait-shaped', () => {
    expect(PORTRAIT_HEIGHT).toBeGreaterThan(PORTRAIT_WIDTH)
  })
})
