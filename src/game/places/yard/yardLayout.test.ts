import { describe, expect, it } from 'vitest'
import { AREAS, arrivalAt } from '../placeLayout'
import { YARD_SPOTS, inYard, yardObstacles } from './yardLayout'

describe('the yard layout', () => {
  it('has every thing inside the yard, where she can walk up to it', () => {
    for (const { id, x, z, r } of yardObstacles()) {
      expect(Math.abs(x) + r * 0.5, id).toBeLessThan(AREAS.yard.halfW)
      expect(Math.abs(z) - r * 0.5, id).toBeLessThan(AREAS.yard.halfD)
    }
    for (const [id, spot] of Object.entries(YARD_SPOTS)) expect(Math.abs(spot.x), id).toBeLessThan(AREAS.yard.halfW)
  })

  it('does not build anything over something else: every two things are further apart than their radii together', () => {
    const things = yardObstacles()
    for (let i = 0; i < things.length; i++) {
      for (let j = i + 1; j < things.length; j++) {
        const a = things[i]
        const b = things[j]
        // the two doors at the back and nothing else may share the back wall, so only the real objects are compared
        const d = Math.hypot(a.x - b.x, a.z - b.z)
        expect(d, `${a.id} and ${b.id}`).toBeGreaterThanOrEqual(a.r + b.r - 0.35)
      }
    }
  })

  it('leaves the arrival spots free: she does not come in on top of something', () => {
    for (const from of ['class', 'library'] as const) {
      const a = arrivalAt('yard', from)
      for (const o of yardObstacles()) expect(Math.hypot(a.x - o.x, a.z - o.z), `${from} arrival vs ${o.id}`).toBeGreaterThan(o.r * 0.6)
    }
  })

  it('knows what is inside the walking area', () => {
    expect(inYard({ x: 0, z: 0 })).toBe(true)
    expect(inYard({ x: 20, z: 0 })).toBe(false)
    expect(inYard({ x: 0, z: -6 })).toBe(false)
    expect(inYard({ x: 13.6, z: 0 }, 0.5)).toBe(false)
    expect(inYard({ x: 13.6, z: 0 })).toBe(true)
  })
})
