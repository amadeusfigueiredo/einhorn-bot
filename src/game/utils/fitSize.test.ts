import { describe, expect, it } from 'vitest'
import { fitToBox } from './fitSize'

const PORTRAIT = { width: 760, height: 1350 }
const LANDSCAPE = { width: 1440, height: 810 }

describe('fitToBox', () => {
  it('is limited by height on a short, wide box', () => {
    const fit = fitToBox(PORTRAIT, { width: 390, height: 600 })
    expect(fit.height).toBe(600)
    expect(fit.width).toBeLessThan(390)
  })

  it('is limited by width on a tall, narrow box', () => {
    const fit = fitToBox(PORTRAIT, { width: 380, height: 900 })
    expect(fit.width).toBe(380)
    expect(fit.height).toBeLessThan(900)
  })

  it('keeps the canvas aspect ratio', () => {
    for (const box of [
      { width: 375, height: 560 },
      { width: 1366, height: 640 },
      { width: 800, height: 800 },
    ]) {
      for (const canvas of [PORTRAIT, LANDSCAPE]) {
        const fit = fitToBox(canvas, box)
        expect(fit.width / fit.height).toBeCloseTo(
          canvas.width / canvas.height,
          1
        )
      }
    }
  })

  it('never exceeds the box', () => {
    const fit = fitToBox(LANDSCAPE, { width: 1000, height: 500 })
    expect(fit.width).toBeLessThanOrEqual(1000)
    expect(fit.height).toBeLessThanOrEqual(500)
  })

  it('does not enlarge beyond the canvas size by default', () => {
    expect(fitToBox(LANDSCAPE, { width: 3000, height: 2000 })).toEqual(LANDSCAPE)
  })

  it('falls back to the canvas size before the box is measured', () => {
    expect(fitToBox(LANDSCAPE, { width: 0, height: 0 })).toEqual(LANDSCAPE)
  })
})
