import { describe, expect, it } from 'vitest'
import { particleAlpha, spawnSparkles, stepParticles } from './particles'

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
