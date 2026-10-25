import { describe, it, expect } from 'vitest'
import { DONE_MS, REDUCED_MS, shouldTransition, transitionsEnabled } from './transitionModel'

describe('waits', () => {
  it('the "Stage complete!" card waits a few seconds for a tap, and reduced motion is a short still card', () => {
    expect(DONE_MS).toBeGreaterThanOrEqual(3000)
    expect(REDUCED_MS).toBeGreaterThanOrEqual(1000)
    expect(REDUCED_MS).toBeLessThan(DONE_MS)
  })
})

describe('shouldTransition', () => {
  it('the first stage shown has no show, a change of stage does', () => {
    expect(shouldTransition(null, 0)).toBe(false)
    expect(shouldTransition(0, 1)).toBe(true)
    expect(shouldTransition(7, 3)).toBe(true)
    expect(shouldTransition(14, 0)).toBe(true)
  })

  it('no change, no show', () => {
    expect(shouldTransition(4, 4)).toBe(false)
  })
})

describe('transitionsEnabled', () => {
  it('is on unless the URL says transition=0, off or false', () => {
    expect(transitionsEnabled('')).toBe(true)
    expect(transitionsEnabled('?view=3d')).toBe(true)
    expect(transitionsEnabled('?transition=1')).toBe(true)
    for (const v of ['0', 'off', 'false', 'OFF']) expect(transitionsEnabled(`?transition=${v}`)).toBe(false)
    expect(transitionsEnabled('?intro=0&transition=0&lang=de')).toBe(false)
  })
})
