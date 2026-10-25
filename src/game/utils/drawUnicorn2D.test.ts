import { describe, expect, it } from 'vitest'
import { drawUnicorn2D } from './drawUnicorn2D'
import { NPC_LOOKS, PLAYER_LOOK, type Accessory, type HornType, type UnicornLook } from '../data/unicornLooks'
import { STAGE_LOOKS } from '../data/stageLooks'
import { count, recorder } from '../../test/canvas'

const BASE: UnicornLook = { coat: '#ffeedd', mane: ['#ff0000', '#00ff00'], horn: '#ffd166', hooves: ['#111111'], accessory: 'none', accessoryColor: '#123456', personality: 'bouncy', build: 1, hornLength: 1 }
const run = (look: UnicornLook, opts: Parameters<typeof drawUnicorn2D>[5] = {}, size = 200) => {
  const r = recorder()
  drawUnicorn2D(r.ctx, look, 100, 300, size, opts)
  return r.calls.join('|')
}

describe('drawUnicorn2D: a unicorn drawn in code from its look', () => {
  it('stands with its hooves where it is told, balanced saves and restores, and a shadow under it', () => {
    const r = recorder()
    drawUnicorn2D(r.ctx, BASE, 100, 300, 200)
    expect(r.calls[0]).toBe('save:')
    expect(r.calls[1]).toBe('translate:100,300')
    expect(count(r.calls, 'save')).toBe(count(r.calls, 'restore'))
    // the shadow is the first ellipse and sits on the ground
    expect(r.calls.find((c) => c.startsWith('ellipse'))).toMatch(/^ellipse:0,0,/)
  })

  it('is as big as it is asked to be', () => {
    const top = (size: number) => {
      const r = recorder()
      drawUnicorn2D(r.ctx, BASE, 0, 0, size)
      return Math.min(...r.calls.filter((c) => c.startsWith('ellipse')).map((c) => Number(c.split(':')[1].split(',')[1])))
    }
    expect(top(400)).toBeCloseTo(top(200) * 2, 1)
  })

  it('wears the colours of its look: the coat on the body, the mane stripes in the tail, the hooves on its feet', () => {
    const out = run(BASE)
    expect(out).toContain('fillStyle=#ffeedd')
    expect(out).toContain('strokeStyle=#ff0000')
    expect(out).toContain('strokeStyle=#00ff00')
    expect(out).toContain('fillStyle=#111111')
  })

  it('a bigger build makes a bigger body, and a different coat a different picture', () => {
    expect(run({ ...BASE, build: 1.2 })).not.toBe(run(BASE))
    expect(run({ ...BASE, coat: '#aabbcc' })).not.toBe(run(BASE))
    expect(run(NPC_LOOKS[0])).not.toBe(run(NPC_LOOKS[1]))
  })

  it('faces right, or left when asked (the picture is mirrored)', () => {
    expect(run(BASE)).not.toContain('scale:-1,1')
    expect(run(BASE, { facingLeft: true })).toContain('scale:-1,1')
  })

  it('breathes and sways with time, and holds still with reduced motion', () => {
    expect(run(BASE, { t: 0.4 })).not.toBe(run(BASE, { t: 1.3 }))
    expect(run(BASE, { t: 0.4, reduceMotion: true })).toBe(run(BASE, { t: 1.3, reduceMotion: true }))
    expect(run(BASE, { t: 0.4, phase: 1 })).not.toBe(run(BASE, { t: 0.4 }))
  })

  it('blinks now and then: the open eye is a pair of ellipses, the closed one a line', () => {
    const open = run(BASE, { t: 1 })
    const shut = run(BASE, { t: 4.1 })
    expect(shut).not.toBe(open)
    expect(count(shut.split('|'), 'lineTo')).toBeGreaterThan(count(open.split('|'), 'lineTo') - 1)
    expect(shut.split('|').filter((c) => c.startsWith('ellipse')).length).toBeLessThan(open.split('|').filter((c) => c.startsWith('ellipse')).length)
  })

  it.each(['straight', 'curly', 'rainbow', 'curved', 'star'] as HornType[])('has a %s horn that looks different from the others', (hornType) => {
    const outs = new Set((['straight', 'curly', 'rainbow', 'curved', 'star'] as HornType[]).map((h) => run({ ...BASE, hornType: h })))
    expect(outs.size).toBe(5)
    expect(run({ ...BASE, hornType })).toContain('rotate:0.38')
  })

  it('a plain cone when the look names no horn, and a longer horn is longer', () => {
    expect(run({ ...BASE, hornType: undefined })).toBe(run({ ...BASE, hornType: 'straight' }))
    expect(run({ ...BASE, hornLength: 1.5 })).not.toBe(run(BASE))
  })

  it.each(['bow', 'glasses', 'flowers', 'crown', 'scarf', 'teacher', 'sunglasses', 'helmet', 'pearls', 'headphones', 'backpack'] as Exclude<Accessory, 'none'>[])('shows the %s it wears', (accessory) => {
    expect(run({ ...BASE, accessory, accessoryColor: '#abcdef' })).not.toBe(run(BASE))
    // and the same thing as an extra, on top of another accessory
    expect(run({ ...BASE, extras: [{ type: accessory, color: '#abcdef' }] })).not.toBe(run(BASE))
  })

  it('a teacher also has round glasses, unless it wears sunglasses', () => {
    const teacher = run({ ...BASE, accessory: 'teacher', accessoryColor: '#222222' })
    const sun = run({ ...BASE, accessory: 'teacher', accessoryColor: '#222222', extras: [{ type: 'sunglasses', color: '#000000' }] })
    expect(count(teacher.split('|'), 'arc')).toBeGreaterThan(count(sun.split('|'), 'arc'))
  })

  it('has stripes, spots, paint dots and glitter when its look says so', () => {
    const plain = run(BASE)
    expect(run({ ...BASE, stripes: ['#ff0000', '#00ff00', '#0000ff'] })).toContain('clip:')
    expect(run({ ...BASE, spots: '#ff00aa' })).toContain('fillStyle=#ff00aa')
    expect(run({ ...BASE, paintSpots: true })).not.toBe(plain)
    expect(run({ ...BASE, glitter: '#fff3a0' })).toContain('fillStyle=#fff3a0')
  })

  it('has a mane even when the look lists no colours, and takes the hoof colours in turn', () => {
    expect(run({ ...BASE, mane: [] })).toContain('strokeStyle=#c9a7ff')
    const hooves = run({ ...BASE, hooves: ['#101010', '#202020', '#303030', '#404040'] })
    for (const c of ['#101010', '#202020', '#303030', '#404040']) expect(hooves).toContain(`fillStyle=${c}`)
  })

  it('draws the rainbow unicorn of the player and every unicorn of every stage without a hitch', () => {
    expect(() => run(PLAYER_LOOK)).not.toThrow()
    for (const set of STAGE_LOOKS) for (const look of [...set.students, set.teacher]) expect(() => run(look, { t: 2 })).not.toThrow()
  })
})
