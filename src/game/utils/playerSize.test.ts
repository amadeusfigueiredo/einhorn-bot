import { describe, expect, it } from 'vitest'
import { computePlayerSize } from './playerSize'
import { getNpcMaxDisplayWidth } from './npcDisplaySize'

const LANDSCAPE = { width: 1440, height: 810 }
const PORTRAIT = { width: 760, height: 1350 }

describe('computePlayerSize', () => {
  it('caps the player at exactly the NPC display size (landscape)', () => {
    const { w } = computePlayerSize(
      { width: 1000, height: 1000 },
      LANDSCAPE.width,
      LANDSCAPE.height
    )
    expect(w).toBe(getNpcMaxDisplayWidth(LANDSCAPE.width, LANDSCAPE.height))
  })

  it('caps the player at exactly the NPC display size (portrait)', () => {
    const { w } = computePlayerSize(
      { width: 1000, height: 1000 },
      PORTRAIT.width,
      PORTRAIT.height
    )
    expect(w).toBe(getNpcMaxDisplayWidth(PORTRAIT.width, PORTRAIT.height))
  })

  it('is bigger on portrait/mobile than landscape, matching the NPCs', () => {
    const image = { width: 1000, height: 1000 }
    const landscape = computePlayerSize(image, LANDSCAPE.width, LANDSCAPE.height)
    const portrait = computePlayerSize(image, PORTRAIT.width, PORTRAIT.height)
    expect(portrait.w).toBeGreaterThan(landscape.w)
  })

  it('never upscales a source image smaller than the cap', () => {
    const { w } = computePlayerSize(
      { width: 80, height: 80 },
      LANDSCAPE.width,
      LANDSCAPE.height
    )
    expect(w).toBe(80)
  })

  it('rounds to whole pixels', () => {
    const { w, h } = computePlayerSize(
      { width: 301, height: 301 },
      LANDSCAPE.width,
      LANDSCAPE.height
    )
    expect(Number.isInteger(w)).toBe(true)
    expect(Number.isInteger(h)).toBe(true)
  })

  it('preserves the image aspect ratio', () => {
    const { w, h } = computePlayerSize(
      { width: 400, height: 200 },
      LANDSCAPE.width,
      LANDSCAPE.height
    )
    expect(w / h).toBeCloseTo(400 / 200, 1)
  })
})
