import { describe, expect, it } from 'vitest'
import { getNpcMaxDisplayWidth } from './npcDisplaySize'

describe('getNpcMaxDisplayWidth', () => {
  it('is bigger on a portrait canvas than a landscape one', () => {
    const portrait = getNpcMaxDisplayWidth(760, 1350)
    const landscape = getNpcMaxDisplayWidth(1440, 810)
    expect(portrait).toBeGreaterThan(landscape)
  })

  it('is bigger than the old fixed 128px cap in both orientations', () => {
    expect(getNpcMaxDisplayWidth(1440, 810)).toBeGreaterThan(128)
    expect(getNpcMaxDisplayWidth(760, 1350)).toBeGreaterThan(128)
  })

  it('treats a square canvas as landscape (not taller than wide)', () => {
    expect(getNpcMaxDisplayWidth(800, 800)).toBe(
      getNpcMaxDisplayWidth(1440, 810)
    )
  })
})
