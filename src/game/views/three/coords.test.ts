import { describe, it, expect } from 'vitest'
import { gameToWorld, worldToGame, fitZoom, seeded } from './coords'

describe('coords', () => {
  it('maps the canvas centre to the origin and round-trips', () => {
    expect(gameToWorld(720, 405, 1440, 810)).toEqual({ x: 0, z: 0 })
    const w = gameToWorld(130, 300, 1440, 810)
    const g = worldToGame(w.x, w.z, 1440, 810)
    expect(g.x).toBeCloseTo(130)
    expect(g.y).toBeCloseTo(300)
  })
  it('seeded rng is deterministic', () => {
    expect(seeded(5)()).toBe(seeded(5)())
  })
  it('fits the ground inside the view', () => {
    const z = fitZoom({ viewW: 1000, viewH: 600, groundW: 14.4, groundH: 8.1, sinElevation: 0.8 })
    expect(z * (14.4 + 1.0)).toBeLessThanOrEqual(1000.001)
  })
  it('headroom makes room above the ground when height is the limit', () => {
    const base = { viewW: 1440, viewH: 810, groundW: 14.4, groundH: 8.1, sinElevation: 0.81 }
    const plain = fitZoom(base)
    const roomy = fitZoom({ ...base, headroom: 1.2 })
    expect(roomy).toBeLessThan(plain)
    expect(roomy * (8.1 * 0.81 + 1.0 + 1.4 + 1.2)).toBeCloseTo(810, 3)
  })
  it('headroom costs nothing when width is the limit (phones held upright)', () => {
    const base = { viewW: 760, viewH: 1350, groundW: 7.6, groundH: 13.5, sinElevation: 0.81 }
    expect(fitZoom({ ...base, headroom: 1.2 })).toBe(fitZoom(base))
  })
})
