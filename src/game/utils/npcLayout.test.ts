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

  it('spreads NPCs across increasing x slots for a given stage (total=3)', () => {
    const positions = getNpcPositions({
      total: 3,
      stageSeed: 0,
      width: WIDTH,
      height: HEIGHT,
    })
    for (let i = 1; i < positions.length; i++) {
      expect(positions[i].x).toBeGreaterThan(positions[i - 1].x)
    }
  })

  it('pins all 4 NPCs to the four corners, away from the center art (total=4)', () => {
    const positions = getNpcPositions({
      total: 4,
      stageSeed: 0,
      width: WIDTH,
      height: HEIGHT,
    })
    const centerX = WIDTH / 2
    const centerY = HEIGHT / 2

    // every NPC is clearly on one side, not hovering near the center
    for (const { x, y } of positions) {
      expect(Math.abs(x - centerX)).toBeGreaterThan(WIDTH * 0.25)
      expect(Math.abs(y - centerY)).toBeGreaterThan(HEIGHT * 0.1)
    }

    // exactly two on the left, two on the right
    const leftCount = positions.filter((p) => p.x < centerX).length
    expect(leftCount).toBe(2)

    // exactly two on top, two on bottom
    const topCount = positions.filter((p) => p.y < centerY).length
    expect(topCount).toBe(2)

    // all 4 corner x/y pairs are distinct positions
    const unique = new Set(positions.map((p) => `${p.x},${p.y}`))
    expect(unique.size).toBe(4)
  })

  it('flips which pair of corners is "top" between stages, for variety', () => {
    const a = getNpcPosition({ index: 0, total: 4, stageSeed: 0, width: WIDTH, height: HEIGHT })
    const b = getNpcPosition({ index: 0, total: 4, stageSeed: 1, width: WIDTH, height: HEIGHT })
    expect(a.y).not.toBe(b.y)
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
