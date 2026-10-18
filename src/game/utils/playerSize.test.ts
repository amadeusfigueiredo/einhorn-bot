import { describe, expect, it } from 'vitest'
import { computePlayerSize } from './playerSize'
import { getFigureSize } from './npcDisplaySize'

const LANDSCAPE = { width: 1440, height: 810 }
const PORTRAIT = { width: 760, height: 1350 }

describe('computePlayerSize', () => {
  it('is exactly the NPC figure box (landscape)', () => {
    expect(computePlayerSize(LANDSCAPE.width, LANDSCAPE.height)).toEqual(
      getFigureSize(LANDSCAPE.width, LANDSCAPE.height)
    )
  })

  it('is exactly the NPC figure box (portrait)', () => {
    expect(computePlayerSize(PORTRAIT.width, PORTRAIT.height)).toEqual(
      getFigureSize(PORTRAIT.width, PORTRAIT.height)
    )
  })

  it('is bigger on portrait/mobile than landscape', () => {
    const landscape = computePlayerSize(LANDSCAPE.width, LANDSCAPE.height)
    const portrait = computePlayerSize(PORTRAIT.width, PORTRAIT.height)
    expect(portrait.w).toBeGreaterThan(landscape.w)
  })

  it('is whole pixels', () => {
    const { w, h } = computePlayerSize(LANDSCAPE.width, LANDSCAPE.height)
    expect(Number.isInteger(w) && Number.isInteger(h)).toBe(true)
  })
})
