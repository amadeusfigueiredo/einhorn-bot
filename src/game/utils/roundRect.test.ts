import { describe, it, expect } from 'vitest'
import { roundRect } from './roundRect'
import { recorder } from '../../test/canvas'

const run = (w: number, h: number, r: number) => {
  const { ctx, calls } = recorder()
  roundRect(ctx, 10, 20, w, h, r)
  return calls
}

describe('roundRect', () => {
  it('draws one closed outline with four rounded corners', () => {
    const calls = run(100, 50, 8)
    expect(calls[0]).toBe('beginPath:')
    expect(calls[1]).toBe('moveTo:18,20')
    expect(calls.filter((c) => c.startsWith('arcTo'))).toEqual([
      'arcTo:110,20,110,70,8',
      'arcTo:110,70,10,70,8',
      'arcTo:10,70,10,20,8',
      'arcTo:10,20,110,20,8',
    ])
    expect(calls.at(-1)).toBe('closePath:')
  })

  it('does not start a fill or stroke itself: the caller chooses', () => {
    const calls = run(100, 50, 8)
    expect(calls.some((c) => c.startsWith('fill') || c.startsWith('stroke'))).toBe(false)
  })

  it('a radius too big for a narrow box shrinks to half its width', () => {
    const calls = run(20, 100, 50)
    expect(calls[1]).toBe('moveTo:20,20')
    expect(calls.filter((c) => c.startsWith('arcTo'))[0].endsWith(',10')).toBe(true)
  })

  it('a radius too big for a low box shrinks to half its height (a pill)', () => {
    const calls = run(200, 30, 100)
    expect(calls.filter((c) => c.startsWith('arcTo')).every((c) => c.endsWith(',15'))).toBe(true)
  })

  it('a radius of 0 is a square corner', () => {
    const calls = run(40, 40, 0)
    expect(calls[1]).toBe('moveTo:10,20')
    expect(calls.filter((c) => c.startsWith('arcTo')).every((c) => c.endsWith(',0'))).toBe(true)
  })
})
