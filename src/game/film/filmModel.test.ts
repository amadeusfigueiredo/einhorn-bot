import { describe, expect, it } from 'vitest'
import { clamp01, doorAngle, isMoving, keys, MAX_PULL_BACK, pullBack, keys3, popScale, seg, shotAt, smooth, trotBounce, vis, yawToward, type Key } from './filmModel'

describe('seg, smooth, clamp01', () => {
  it('seg ramps 0..1 between a and b and holds outside', () => {
    expect(seg(0, 2, 4)).toBe(0)
    expect(seg(2, 2, 4)).toBe(0)
    expect(seg(3, 2, 4)).toBe(0.5)
    expect(seg(4, 2, 4)).toBe(1)
    expect(seg(9, 2, 4)).toBe(1)
  })

  it('seg with an empty range is a step, not a division by zero', () => {
    expect(seg(1, 2, 2)).toBe(0)
    expect(seg(2, 2, 2)).toBe(1)
  })

  it('smooth is 0, 0.5 and 1 at the ends and the middle, and slower at the ends than a straight line', () => {
    expect(smooth(0)).toBe(0)
    expect(smooth(0.5)).toBe(0.5)
    expect(smooth(1)).toBe(1)
    expect(smooth(0.1)).toBeLessThan(0.1)
  })

  it('clamp01 keeps numbers in range', () => {
    expect(clamp01(-3)).toBe(0)
    expect(clamp01(0.3)).toBe(0.3)
    expect(clamp01(7)).toBe(1)
  })
})

describe('keys', () => {
  const list: Key<number>[] = [[1, 10], [3, 30], [4, 0]]

  it('holds the first value before the first key and the last after the last', () => {
    expect(keys(0, list)).toBe(10)
    expect(keys(1, list)).toBe(10)
    expect(keys(9, list)).toBe(0)
  })

  it('is exactly the key value at a key', () => {
    expect(keys(3, list)).toBe(30)
    expect(keys(4, list)).toBe(0)
  })

  it('goes between keys by the ease (smooth by default, straight when asked)', () => {
    expect(keys(2, list)).toBe(20)
    expect(keys(1.5, list, (x) => x)).toBeCloseTo(15)
    expect(keys(1.5, list)).toBeLessThan(15)
  })

  it('an empty list is 0', () => {
    expect(keys(1, [])).toBe(0)
  })

  it('keys3 moves each axis on its own', () => {
    const p = keys3(2, [[1, [0, 0, 0]], [3, [10, 4, -2]]])
    expect(p).toEqual([5, 2, -1])
  })
})

describe('vis (a bubble fading in and out)', () => {
  it('is 0 before and after, 1 in the middle', () => {
    expect(vis(0, 2, 4)).toBe(0)
    expect(vis(3, 2, 4)).toBe(1)
    expect(vis(5, 2, 4)).toBe(0)
  })

  it('ramps up over the fade and down again after b', () => {
    expect(vis(2.15, 2, 4, 0.3)).toBeCloseTo(0.5)
    expect(vis(4.15, 2, 4, 0.3)).toBeCloseTo(0.5)
  })
})

describe('popScale', () => {
  it('is tiny (never 0) before, 1 after, and overshoots in between', () => {
    expect(popScale(0, 1)).toBeGreaterThan(0)
    expect(popScale(0, 1)).toBeLessThan(0.001)
    expect(popScale(5, 1)).toBe(1)
    const mid = Array.from({ length: 9 }, (_, i) => popScale(1 + (i + 1) * 0.05, 1, 0.5))
    expect(Math.max(...mid)).toBeGreaterThan(1)
  })
})

describe('walking helpers', () => {
  it('yawToward turns a figure facing +x towards (dx, dz)', () => {
    expect(yawToward(1, 0)).toBeCloseTo(0)
    expect(yawToward(0, 1)).toBeCloseTo(-Math.PI / 2)
    expect(yawToward(0, -1)).toBeCloseTo(Math.PI / 2)
    expect(Math.abs(yawToward(-1, 0))).toBeCloseTo(Math.PI)
  })

  it('trotBounce stays between 0 and the height', () => {
    for (let t = 0; t < 3; t += 0.07) {
      const b = trotBounce(t, 0.12)
      expect(b).toBeGreaterThanOrEqual(0)
      expect(b).toBeLessThanOrEqual(0.12)
    }
  })

  it('isMoving ignores tiny movement', () => {
    expect(isMoving([0, 0, 0], [0, 0, 0])).toBe(false)
    expect(isMoving([0.0001, 0, 0], [0, 0, 0])).toBe(false)
    expect(isMoving([0.1, 0, 0], [0, 0, 0])).toBe(true)
    expect(isMoving([0, 0, 0.1], [0, 0, 0])).toBe(true)
  })
})

describe('doorAngle and shotAt', () => {
  const open: Key<number>[] = [[1, 0], [2, 1]]
  it('a shut door is at 0 and a wide one at -maxAngle (swinging away)', () => {
    expect(doorAngle(0, open)).toBeCloseTo(0)
    expect(doorAngle(2, open)).toBeCloseTo(-1.9)
    expect(doorAngle(2, open, 1)).toBeCloseTo(-1)
  })

  it('shotAt finds the shot a second belongs to, or -1', () => {
    const shots = [{ from: 0, to: 5 }, { from: 5, to: 9 }]
    expect(shotAt(0, shots)).toBe(0)
    expect(shotAt(4.99, shots)).toBe(0)
    expect(shotAt(5, shots)).toBe(1)
    expect(shotAt(9, shots)).toBe(-1)
    expect(shotAt(-1, shots)).toBe(-1)
  })
})

describe('pullBack (tall screens step back)', () => {
  it('a wide screen keeps the camera where it is', () => {
    expect(pullBack([0, 3, 10], [0, 1, 0], 1.78)).toEqual([0, 3, 10])
    expect(pullBack([0, 3, 10], [0, 1, 0], 1.7)).toEqual([0, 3, 10])
  })

  it('a phone held upright steps back along the line of sight by the square root of how narrow it is, keeping the target', () => {
    const k = Math.sqrt(1.7 / 0.5)
    const p = pullBack([0, 3, 10], [0, 1, 0], 0.5)
    expect(p[2]).toBeCloseTo(10 * k)
    expect(p[1]).toBeCloseTo(1 + 2 * k)
  })

  it('never further than MAX_PULL_BACK', () => {
    const p = pullBack([0, 0, 10], [0, 0, 0], 0.05)
    expect(p[2]).toBeCloseTo(10 * MAX_PULL_BACK)
  })

  it('the narrower the screen, the further back', () => {
    expect(pullBack([0, 2, 10], [0, 0, 0], 0.4)[2]).toBeGreaterThan(pullBack([0, 2, 10], [0, 0, 0], 0.8)[2])
  })

  it('a nonsense aspect changes nothing', () => {
    expect(pullBack([1, 2, 3], [0, 0, 0], 0)).toEqual([1, 2, 3])
  })
})
