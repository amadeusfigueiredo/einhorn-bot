import { describe, expect, it } from 'vitest'
import { smoothToward } from './smooth'

describe('smoothToward', () => {
  it('moves toward the target without overshooting', () => {
    const next = smoothToward(0, 100, 1 / 60)
    expect(next).toBeGreaterThan(0)
    expect(next).toBeLessThan(100)
  })

  it('converges over time', () => {
    let x = 0
    for (let i = 0; i < 60; i++) x = smoothToward(x, 100, 1 / 60)
    expect(x).toBeCloseTo(100, 0)
  })

  it('is frame-rate independent', () => {
    let fast = 0
    for (let i = 0; i < 30; i++) fast = smoothToward(fast, 100, 1 / 60)
    let slow = 0
    for (let i = 0; i < 15; i++) slow = smoothToward(slow, 100, 1 / 30)
    expect(fast).toBeCloseTo(slow, 5)
  })

  it('snaps on a teleport and when already there', () => {
    expect(smoothToward(0, 1000, 1 / 60)).toBe(1000)
    expect(smoothToward(99.99, 100, 1 / 60)).toBe(100)
  })
})
