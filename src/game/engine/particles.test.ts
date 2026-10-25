import { describe, expect, it } from 'vitest'
import { drawParticles, particleAlpha, spawnSparkles, stepParticles, type Particle } from './particles'
import { count, recorder } from '../../test/canvas'

const rng = (() => {
  let i = 0
  const seq = [0.1, 0.4, 0.7, 0.9]
  return () => seq[i++ % seq.length]
})()

describe('sparkles', () => {
  it('spawns the requested count at the origin, cycling colours', () => {
    const list = spawnSparkles(50, 80, ['a', 'b'], 6, rng)
    expect(list).toHaveLength(6)
    expect(list.every((p) => p.x === 50 && p.y === 80)).toBe(true)
    expect(list.map((p) => p.color)).toEqual(['a', 'b', 'a', 'b', 'a', 'b'])
  })

  it('drifts upward as it slows down, and dies after its lifetime', () => {
    const [p] = spawnSparkles(0, 0, ['a'], 1, () => 0.5)
    const startY = p.y
    let list = [p]
    for (let i = 0; i < 20; i++) list = stepParticles(list, 1 / 60)
    expect(list).toHaveLength(1)
    expect(list[0].y).toBeLessThan(startY)

    list = stepParticles(list, 5)
    expect(list).toHaveLength(0)
  })

  it('fades in quickly and out slowly', () => {
    const [p] = spawnSparkles(0, 0, ['a'], 1, () => 0.5)
    p.age = 0
    expect(particleAlpha(p)).toBe(0)
    p.age = p.life * 0.1
    expect(particleAlpha(p)).toBeCloseTo(1)
    p.age = p.life * 0.55
    expect(particleAlpha(p)).toBeCloseTo(0.5)
  })
})

describe('drawParticles', () => {
  const star = (over: Partial<Particle> = {}): Particle => ({ x: 10, y: 20, vx: 0, vy: 0, size: 4, life: 1, age: 0.5, color: '#ff0000', ...over })

  it('draws nothing, and does not even touch the canvas, for no particles', () => {
    const { ctx, calls } = recorder()
    drawParticles(ctx, [])
    expect(calls).toEqual([])
  })

  it('draws each particle as a four-point star in its colour and its own opacity, and puts the canvas back', () => {
    const { ctx, calls } = recorder()
    const a = star({ color: '#111111', age: 0.05 })
    const b = star({ color: '#222222', age: 0.55 })
    drawParticles(ctx, [a, b])
    expect(count(calls, 'save')).toBe(1)
    expect(count(calls, 'restore')).toBe(1)
    expect(count(calls, 'beginPath')).toBe(2)
    expect(count(calls, 'quadraticCurveTo')).toBe(8)
    expect(count(calls, 'fill:')).toBe(2)
    expect(calls).toContain('fillStyle=#111111')
    expect(calls).toContain('fillStyle=#222222')
    expect(calls).toContain(`globalAlpha=${Math.round(particleAlpha(a) * 100) / 100}`)
    expect(calls).toContain(`globalAlpha=${Math.round(particleAlpha(b) * 100) / 100}`)
  })

  it('the points of the star are one size away from its centre', () => {
    const { ctx, calls } = recorder()
    drawParticles(ctx, [star({ x: 10, y: 20, size: 4 })])
    expect(calls).toContain('moveTo:10,16')
    expect(calls).toContain('quadraticCurveTo:10,20,14,20')
    expect(calls).toContain('quadraticCurveTo:10,20,10,24')
    expect(calls).toContain('quadraticCurveTo:10,20,6,20')
  })
})
