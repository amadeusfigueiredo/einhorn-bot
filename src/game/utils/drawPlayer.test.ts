import { describe, it, expect } from 'vitest'
import { drawPlayer } from './drawPlayer'
import { image, recorder, count } from '../../test/canvas'
import type { LoaderImageAssets } from '../types'
import { PLAYER_LOOK } from '../data/unicornLooks'

const box = { x: 100, y: 200, w: 80, h: 80 }
const withPlayer = { player1: image(300, 300) } as unknown as LoaderImageAssets

describe('drawPlayer', () => {
  it('draws her picture inside a rounded frame, with a shadow on the ground and a glow', () => {
    const { ctx, calls } = recorder()
    drawPlayer(ctx, box, withPlayer)
    expect(count(calls, 'drawImage')).toBe(1)
    expect(count(calls, 'ellipse')).toBe(1)
    expect(count(calls, 'clip')).toBe(1)
    expect(count(calls, 'stroke:')).toBe(1)
    // every save is matched by a restore: the next thing drawn is not affected
    expect(count(calls, 'save')).toBe(count(calls, 'restore'))
  })

  it('stands on the ground: the shadow is at her feet', () => {
    const { ctx, calls } = recorder()
    drawPlayer(ctx, box, withPlayer)
    const ellipse = calls.find((c) => c.startsWith('ellipse'))!
    const [x, y] = ellipse.slice('ellipse:'.length).split(',').map(Number)
    expect(x).toBe(140)
    expect(y).toBe(278)
  })

  it('turns around when she faces left', () => {
    const right = recorder()
    const left = recorder()
    drawPlayer(right.ctx, box, withPlayer, { t: 0, moving: false, facingLeft: false })
    drawPlayer(left.ctx, box, withPlayer, { t: 0, moving: false, facingLeft: true })
    const scaleX = (calls: string[]) => Number(calls.filter((c) => c.startsWith('scale:'))[0].split(':')[1].split(',')[0])
    expect(scaleX(right.calls)).toBeGreaterThan(0)
    expect(scaleX(left.calls)).toBeLessThan(0)
    expect(Math.abs(scaleX(left.calls))).toBeCloseTo(scaleX(right.calls))
  })

  it('bobs when she walks, but not when she stands still with reduced motion', () => {
    const offsetY = (anim: Parameters<typeof drawPlayer>[3]) => {
      const { ctx, calls } = recorder()
      drawPlayer(ctx, box, withPlayer, anim)
      return Number(calls.find((c) => c.startsWith('translate:'))!.split(',')[1])
    }
    const base = box.y + box.h / 2
    const offsets = [0, 0.2, 0.4, 0.6].map((t) => offsetY({ t, moving: true, facingLeft: false }))
    expect(new Set(offsets).size).toBeGreaterThan(1)
    for (const t of [0, 0.2, 0.4]) expect(offsetY({ t, moving: true, facingLeft: false, reduceMotion: true })).toBe(base)
  })

  it('reduced motion also keeps the glow steady', () => {
    const glow = (t: number) => {
      const { ctx, calls } = recorder()
      drawPlayer(ctx, box, withPlayer, { t, moving: false, facingLeft: false, reduceMotion: true })
      return calls.filter((c) => c.startsWith('globalAlpha='))[1]
    }
    expect(glow(0)).toBe(glow(1.3))
  })

  it('shows a plain frame while her picture is loading, and nothing crashes', () => {
    const { ctx, calls } = recorder()
    drawPlayer(ctx, box, undefined)
    expect(count(calls, 'drawImage')).toBe(0)
    expect(count(calls, 'fill')).toBeGreaterThanOrEqual(3)
    expect(count(calls, 'save')).toBe(count(calls, 'restore'))
  })

  it('uses sensible default animation when none is given', () => {
    const { ctx, calls } = recorder()
    expect(() => drawPlayer(ctx, box, withPlayer)).not.toThrow()
    expect(calls.length).toBeGreaterThan(10)
  })

  describe('with a look (the unicorn drawn in code, as in the 3D view)', () => {
    const look = PLAYER_LOOK
    const stand = (anim: Partial<Parameters<typeof drawPlayer>[3]> = {}, assets: LoaderImageAssets | undefined = withPlayer) => {
      const r = recorder()
      drawPlayer(r.ctx, box, assets, { t: 0, moving: false, facingLeft: false, look, ...anim })
      return r
    }

    it('draws the unicorn with her colours instead of the picture, on the ground in front of her feet, and still has the shadow', () => {
      const { calls } = stand()
      expect(count(calls, 'drawImage')).toBe(0)
      expect(count(calls, 'clip')).toBeGreaterThanOrEqual(1)
      // the unicorn's hooves are at the bottom of her box (y 280), in the middle (x 140)
      expect(calls).toContain('translate:140,280')
      expect(calls.some((c) => c.startsWith('ellipse:140,278'))).toBe(true)
      expect(count(calls, 'save')).toBe(count(calls, 'restore'))
    })

    it('needs no picture to be loaded', () => {
      const { calls } = stand({}, undefined)
      expect(count(calls, 'drawImage')).toBe(0)
      expect(count(calls, 'ellipse')).toBeGreaterThan(10)
    })

    it('faces the way she walks and hops when she walks, and stands calm with reduced motion', () => {
      expect(stand({ facingLeft: true }).calls).toContain('scale:-1,1')
      expect(stand({ facingLeft: false }).calls).not.toContain('scale:-1,1')
      expect(stand({ moving: true, t: 0.1 }).calls.join('|')).not.toBe(stand({ moving: true, t: 0.4 }).calls.join('|'))
      expect(stand({ moving: true, t: 0.1, reduceMotion: true }).calls.join('|')).toBe(stand({ moving: true, t: 0.4, reduceMotion: true }).calls.join('|'))
    })
  })
})
