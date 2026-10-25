import { describe, expect, it, vi } from 'vitest'
import { createWalker, stepWalker, WALK_SPEED, type Bounds } from './placeWorld'

const BOUNDS: Bounds = { minX: -5, maxX: 5, minZ: -3, maxZ: 3 }
const step = (w: ReturnType<typeof createWalker>, keys: Record<string, boolean> = {}, dt = 0.1) => stepWalker(w, { dt, keys, bounds: BOUNDS })

describe('stepWalker with the keys', () => {
  it('stands still with nothing pressed', () => {
    const w = createWalker(1, 1)
    step(w)
    expect(w).toMatchObject({ x: 1, z: 1, moving: false })
  })

  it('walks at her pace, the arrow keys or WASD', () => {
    for (const [key, axis, sign] of [['arrowright', 'x', 1], ['d', 'x', 1], ['arrowleft', 'x', -1], ['a', 'x', -1], ['arrowdown', 'z', 1], ['s', 'z', 1], ['arrowup', 'z', -1], ['w', 'z', -1]] as const) {
      const w = createWalker(0, 0)
      step(w, { [key]: true }, 0.5)
      expect(w[axis], key).toBeCloseTo(sign * WALK_SPEED * 0.5)
      expect(w.moving).toBe(true)
    }
  })

  it('a diagonal is not faster than a straight line', () => {
    const w = createWalker(0, 0)
    step(w, { arrowright: true, arrowdown: true }, 1)
    expect(Math.hypot(w.x, w.z)).toBeCloseTo(WALK_SPEED)
  })

  it('opposite keys cancel', () => {
    const w = createWalker(0, 0)
    step(w, { arrowleft: true, arrowright: true })
    expect(w).toMatchObject({ x: 0, z: 0, moving: false })
  })

  it('stays inside the room', () => {
    const w = createWalker(4.9, 2.9)
    step(w, { arrowright: true, arrowdown: true }, 5)
    expect(w).toMatchObject({ x: 5, z: 3 })
    const v = createWalker(-4.9, -2.9)
    step(v, { arrowleft: true, arrowup: true }, 5)
    expect(v).toMatchObject({ x: -5, z: -3 })
  })

  it('faces the way she goes, and keeps facing that way when she stops', () => {
    const w = createWalker(0, 0)
    step(w, { arrowleft: true })
    expect(w.facingLeft).toBe(true)
    step(w)
    expect(w.facingLeft).toBe(true)
    step(w, { arrowright: true })
    expect(w.facingLeft).toBe(false)
  })

  it('walking up or down does not turn her round', () => {
    const w = createWalker(0, 0)
    step(w, { arrowleft: true })
    step(w, { arrowup: true })
    expect(w.facingLeft).toBe(true)
  })
})

describe('stepWalker to a tapped place', () => {
  it('walks straight there at her pace, and stops', () => {
    const w = createWalker(0, 0)
    w.target = { x: 2.1, z: 0, radius: 0.05 }
    step(w, {}, 0.5)
    expect(w.x).toBeCloseTo(WALK_SPEED * 0.5)
    expect(w.moving).toBe(true)
    for (let i = 0; i < 20; i++) step(w)
    expect(w.x).toBeCloseTo(2.1, 1)
    expect(w.target).toBeNull()
    expect(w.moving).toBe(false)
  })

  it('never goes past it in one step', () => {
    const w = createWalker(0, 0)
    w.target = { x: 0.05, z: 0, radius: 0.01 }
    step(w, {}, 5)
    expect(w.x).toBeCloseTo(0.05)
  })

  it('calls onArrive once when she is there, and then forgets the target', () => {
    const onArrive = vi.fn()
    const w = createWalker(0, 0)
    w.target = { x: 1, z: 1, radius: 0.2, onArrive }
    for (let i = 0; i < 40; i++) step(w)
    expect(onArrive).toHaveBeenCalledTimes(1)
    expect(w.target).toBeNull()
  })

  it('is there already when she is within the radius: arrives at once without moving', () => {
    const onArrive = vi.fn()
    const w = createWalker(1, 1)
    w.target = { x: 1.1, z: 1, radius: 0.3, onArrive }
    step(w)
    expect(onArrive).toHaveBeenCalledTimes(1)
    expect(w.moving).toBe(false)
    expect(w.x).toBe(1)
  })

  it('a key overrides the target (the child changed her mind)', () => {
    const onArrive = vi.fn()
    const w = createWalker(0, 0)
    w.target = { x: 4, z: 0, onArrive }
    step(w, { arrowdown: true })
    expect(w.target).toBeNull()
    for (let i = 0; i < 40; i++) step(w)
    expect(onArrive).not.toHaveBeenCalled()
  })

  it('a target outside the room brings her to its edge, where she stops (she does not walk on the spot)', () => {
    const w = createWalker(0, 0)
    w.target = { x: 50, z: 0, radius: 0.05 }
    for (let i = 0; i < 100; i++) step(w)
    expect(w.x).toBe(5)
    expect(w.moving).toBe(false)
    expect(w.target).toBeNull()
  })

  it('faces the way to the target', () => {
    const w = createWalker(0, 0)
    w.target = { x: -3, z: 0 }
    step(w)
    expect(w.facingLeft).toBe(true)
  })
})
