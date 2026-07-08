import { describe, expect, it } from 'vitest'
import { getNpcPosition, getNpcPositions } from './npcLayout'

const WIDTH = 1440
const HEIGHT = 810

describe('getNpcPosition', () => {
  it('keeps positions within the canvas bounds, clear of the HUD', () => {
    for (let total = 1; total <= 4; total++) {
      for (let index = 0; index < total; index++) {
        const { x, y } = getNpcPosition({
          index,
          total,
          stageSeed: 0,
          width: WIDTH,
          height: HEIGHT,
        })
        expect(x).toBeGreaterThan(0)
        expect(x).toBeLessThan(WIDTH)
        expect(y).toBeGreaterThan(120) // below the HUD badge
        expect(y).toBeLessThan(HEIGHT)
      }
    }
  })

  it('spreads NPCs across increasing x slots for a given stage', () => {
    const positions = getNpcPositions({
      total: 4,
      stageSeed: 0,
      width: WIDTH,
      height: HEIGHT,
    })
    for (let i = 1; i < positions.length; i++) {
      expect(positions[i].x).toBeGreaterThan(positions[i - 1].x)
    }
  })

  it('is deterministic for the same inputs', () => {
    const a = getNpcPosition({ index: 1, total: 3, stageSeed: 2, width: WIDTH, height: HEIGHT })
    const b = getNpcPosition({ index: 1, total: 3, stageSeed: 2, width: WIDTH, height: HEIGHT })
    expect(a).toEqual(b)
  })

  it('varies the row pattern between consecutive stage seeds', () => {
    const a = getNpcPosition({ index: 0, total: 3, stageSeed: 0, width: WIDTH, height: HEIGHT })
    const b = getNpcPosition({ index: 0, total: 3, stageSeed: 1, width: WIDTH, height: HEIGHT })
    expect(a.y).not.toBe(b.y)
  })
})

describe('getNpcPositions', () => {
  it('returns one position per requested NPC', () => {
    const positions = getNpcPositions({
      total: 3,
      stageSeed: 5,
      width: WIDTH,
      height: HEIGHT,
    })
    expect(positions).toHaveLength(3)
  })
})
