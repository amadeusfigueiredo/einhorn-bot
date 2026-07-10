import { describe, expect, it } from 'vitest'
import { computeNpcAnimation } from './npcAnimation'

describe('computeNpcAnimation', () => {
  it('is at rest when neither selected nor hovered', () => {
    expect(computeNpcAnimation({ t: 1.23, isSelected: false, isHovered: false })).toEqual({
      scale: 1,
      glowAlpha: 0,
    })
  })

  it('pulses scale and glow around 1 when selected', () => {
    for (let t = 0; t < 2; t += 0.05) {
      const { scale, glowAlpha } = computeNpcAnimation({
        t,
        isSelected: true,
        isHovered: false,
      })
      expect(scale).toBeGreaterThan(0.9)
      expect(scale).toBeLessThan(1.1)
      expect(glowAlpha).toBeGreaterThanOrEqual(0)
      expect(glowAlpha).toBeLessThanOrEqual(1)
    }
  })

  it('pops to a bigger, brighter state on hover', () => {
    const { scale, glowAlpha } = computeNpcAnimation({
      t: 0,
      isSelected: false,
      isHovered: true,
    })
    expect(scale).toBeGreaterThan(1)
    expect(glowAlpha).toBeGreaterThan(0)
  })

  it('hover never shrinks below the selected pulse', () => {
    for (let t = 0; t < 2; t += 0.05) {
      const selectedOnly = computeNpcAnimation({ t, isSelected: true, isHovered: false })
      const both = computeNpcAnimation({ t, isSelected: true, isHovered: true })
      expect(both.scale).toBeGreaterThanOrEqual(selectedOnly.scale)
      expect(both.glowAlpha).toBeGreaterThanOrEqual(selectedOnly.glowAlpha)
    }
  })

  it('is deterministic for the same inputs', () => {
    const a = computeNpcAnimation({ t: 0.77, isSelected: true, isHovered: false })
    const b = computeNpcAnimation({ t: 0.77, isSelected: true, isHovered: false })
    expect(a).toEqual(b)
  })
})
