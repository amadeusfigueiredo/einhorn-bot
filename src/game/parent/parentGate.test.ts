import { describe, expect, it } from 'vitest'
import { isRight, makeGate } from './parentGate'

describe('the gate to the grown-ups\' corner', () => {
  it('is a multiplication of 13..19 by 4..9, the same for the same dice', () => {
    expect(makeGate(() => 0)).toEqual({ a: 13, b: 4, answer: 52 })
    expect(makeGate(() => 0.999999)).toEqual({ a: 19, b: 9, answer: 171 })
    for (let i = 0; i < 200; i++) {
      const g = makeGate(Math.random)
      expect(g.a).toBeGreaterThanOrEqual(13)
      expect(g.a).toBeLessThanOrEqual(19)
      expect(g.b).toBeGreaterThanOrEqual(4)
      expect(g.b).toBeLessThanOrEqual(9)
      expect(g.answer).toBe(g.a * g.b)
    }
  })

  it('takes the right number, with spaces round it, and nothing else', () => {
    const g = makeGate(() => 0)
    expect(isRight(g, '52')).toBe(true)
    expect(isRight(g, ' 52 ')).toBe(true)
    for (const bad of ['', '5', '53', '052a', '52.0', '5 2', 'fifty-two', '-52', '0052', '00052']) expect(isRight(g, bad), bad).toBe(bad === '0052')
  })
})
