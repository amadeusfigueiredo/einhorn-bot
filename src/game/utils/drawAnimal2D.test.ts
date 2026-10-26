import { describe, expect, it } from 'vitest'
import { drawAnimal2D } from './drawAnimal2D'
import { ANIMAL_TYPES } from '../data/animals'
import { count, recorder } from '../../test/canvas'

const draw = (type: Parameters<typeof drawAnimal2D>[1], t = 0, reduceMotion = false) => {
  const r = recorder()
  drawAnimal2D(r.ctx, type, 100, 200, 120, t, reduceMotion)
  return r
}

describe('drawAnimal2D', () => {
  it('stands with its feet where it is told and a shadow under it, with balanced saves and restores', () => {
    const { calls } = draw('koala')
    expect(calls[0]).toBe('save:')
    expect(calls[1]).toBe('translate:100,200')
    expect(calls.find((c) => c.startsWith('ellipse'))).toMatch(/^ellipse:0,0,/)
    expect(count(calls, 'save')).toBe(count(calls, 'restore'))
  })

  it('every kind of animal can be drawn, and the ones with their own look are drawn differently', () => {
    const outs = new Map<string, string>()
    for (const type of ANIMAL_TYPES) {
      const r = draw(type)
      expect(count(r.calls, 'ellipse'), type).toBeGreaterThan(8)
      outs.set(type, r.calls.join('|'))
    }
    for (const a of ['koala', 'capybara', 'owl', 'penguin', 'parrot'] as const) expect(outs.get(a), a).not.toBe(outs.get('seal'))
    expect(new Set(['koala', 'capybara', 'owl', 'penguin', 'parrot'].map((a) => outs.get(a))).size).toBe(5)
  })

  it('breathes with time, and is still with reduced motion', () => {
    expect(draw('capybara', 0.3).calls.join('|')).not.toBe(draw('capybara', 2).calls.join('|'))
    expect(draw('capybara', 0.3, true).calls.join('|')).toBe(draw('capybara', 2, true).calls.join('|'))
  })

  it('has the colours of its kind: a koala is grey, a parrot green with a red crown', () => {
    expect(draw('koala').calls).toContain('fillStyle=#A9A9BC')
    expect(draw('parrot').calls).toContain('fillStyle=#FF6B6B')
  })
})
