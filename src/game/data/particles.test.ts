import { describe, it, expect } from 'vitest'
import { CLASSROOMS } from './classrooms'
import { PARTICLE_KINDS, PARTICLES, particleCount } from './particles'

describe('particles', () => {
  it('there are eight kinds', () => {
    expect(PARTICLE_KINDS.sort()).toEqual(['bubbles', 'confetti', 'fireflies', 'leaves', 'petals', 'snow', 'sparkles', 'stars'])
  })

  it.each(PARTICLE_KINDS)('%s is a sensible cloud: not too many, not too big, a little see-through', (kind) => {
    const p = PARTICLES[kind]
    expect(p.count).toBeGreaterThan(10)
    expect(p.count).toBeLessThanOrEqual(120)
    expect(p.size).toBeGreaterThan(1)
    expect(p.size).toBeLessThanOrEqual(12)
    expect(p.speed).toBeGreaterThan(0)
    expect(p.speed).toBeLessThan(1)
    expect(p.opacity).toBeGreaterThan(0.3)
    expect(p.opacity).toBeLessThanOrEqual(1)
    expect(p.height).toBeGreaterThan(1)
    if (p.color) expect(p.color).toMatch(/^#[0-9a-f]{6}$/i)
  })

  it('a phone draws half as many, at least one', () => {
    for (const k of PARTICLE_KINDS) {
      const p = PARTICLES[k]
      expect(particleCount(p, false)).toBe(p.count)
      expect(particleCount(p, true)).toBe(Math.ceil(p.count / 2))
    }
    expect(particleCount({ ...PARTICLES.sparkles, count: 1 }, true)).toBe(1)
  })

  it('the worlds use many different kinds', () => {
    const used = new Set(Object.values(CLASSROOMS).map((r) => r.particles))
    expect(used.size).toBeGreaterThanOrEqual(7)
    for (const k of used) expect(PARTICLE_KINDS).toContain(k)
  })

  it('snow falls in the ice world, bubbles rise under water, stars come out at night in space', () => {
    expect(CLASSROOMS.stage12.particles).toBe('snow')
    expect(CLASSROOMS.stage5.particles).toBe('bubbles')
    expect(CLASSROOMS.stage3.particles).toBe('stars')
    expect(CLASSROOMS.stage9.particles).toBe('fireflies')
  })
})
