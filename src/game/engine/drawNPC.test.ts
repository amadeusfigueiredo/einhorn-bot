import { describe, it, expect } from 'vitest'
import { drawNPC } from './drawNPC'
import { image, recorder, count } from '../../test/canvas'
import type { LoaderImageAssets, NPC } from '../types'
import { NPC_LOOKS } from '../data/unicornLooks'

const npc = (over: Partial<NPC> = {}) => ({ id: 'stage2-npc1', x: 0, y: 0, imageKey: 'stage2Npc1', question: {} as never, ...over }) as NPC
const assets = (keys: string[]) => Object.fromEntries(keys.map((k) => [k, image(400, 500)])) as unknown as LoaderImageAssets

describe('drawNPC', () => {
  it('draws the unicorn\'s picture in a rounded, outlined square', () => {
    const { ctx, calls } = recorder()
    drawNPC(ctx, 300, 200, false, assets(['stage2Npc1']), npc())
    expect(count(calls, 'drawImage')).toBe(1)
    expect(count(calls, 'clip')).toBe(1)
    expect(count(calls, 'stroke:')).toBe(1)
    expect(count(calls, 'save')).toBe(count(calls, 'restore'))
  })

  it('every picture is the same size, whatever shape it has', () => {
    const sizes = [image(400, 500), image(900, 300), image(100, 100)].map((img) => {
      const { ctx, calls } = recorder()
      drawNPC(ctx, 0, 0, false, { stage2Npc1: img } as unknown as LoaderImageAssets, npc(), { t: 0, isSelected: false, isHovered: false, figureSide: 140 })
      return calls.find((c) => c.startsWith('drawImage'))!.split(',').slice(-2).join(',')
    })
    expect(new Set(sizes)).toEqual(new Set(['140,140']))
  })

  it('finds the picture from the id when the image key is missing', () => {
    const { ctx, calls } = recorder()
    drawNPC(ctx, 0, 0, false, assets(['stage7Npc3']), npc({ id: 'stage7-npc3', imageKey: undefined }))
    expect(count(calls, 'drawImage')).toBe(1)
  })

  it('shows the mark too when the id is no stage-and-number id and there is no image key', () => {
    const { ctx, calls } = recorder()
    drawNPC(ctx, 0, 0, false, assets(['stage7Npc3']), npc({ id: 'someone', imageKey: undefined }))
    expect(count(calls, 'drawImage')).toBe(0)
    expect(count(calls, 'arc')).toBe(1)
  })

  it('shows a simple unicorn mark while the picture is missing', () => {
    const { ctx, calls } = recorder()
    drawNPC(ctx, 10, 20, false, undefined, npc())
    expect(count(calls, 'drawImage')).toBe(0)
    expect(count(calls, 'arc')).toBe(1)
    // the horn
    expect(count(calls, 'closePath')).toBe(1)
    expect(count(calls, 'save')).toBe(count(calls, 'restore'))
  })

  it('the placeholder grows with the figure size', () => {
    const radius = (figureSide: number) => {
      const { ctx, calls } = recorder()
      drawNPC(ctx, 0, 0, false, undefined, npc(), { t: 0, isSelected: false, isHovered: false, figureSide })
      return Number(calls.find((c) => c.startsWith('arc'))!.split(',')[2])
    }
    expect(radius(256)).toBe(radius(128) * 2)
    expect(radius(128)).toBe(26)
  })

  it('a unicorn that has been answered goes quiet: no glow, a fainter outline, a calmer placeholder', () => {
    const open = recorder()
    const done = recorder()
    const anim = { t: 0.5, isSelected: true, isHovered: true }
    drawNPC(open.ctx, 0, 0, false, assets(['stage2Npc1']), npc(), anim)
    drawNPC(done.ctx, 0, 0, true, assets(['stage2Npc1']), npc(), anim)
    expect(count(open.calls, 'shadowBlur=')).toBeGreaterThan(0)
    expect(count(done.calls, 'shadowBlur=')).toBe(0)
    const outline = (c: string[]) => c.find((x) => x.startsWith('strokeStyle='))
    expect(outline(done.calls)).not.toBe(outline(open.calls))
    const a = recorder()
    const b = recorder()
    drawNPC(a.ctx, 0, 0, false, undefined, npc())
    drawNPC(b.ctx, 0, 0, true, undefined, npc())
    expect(a.calls.filter((c) => c.startsWith('fillStyle='))).not.toEqual(b.calls.filter((c) => c.startsWith('fillStyle=')))
  })

  it('glows when chosen or pointed at, not otherwise', () => {
    const glow = (isSelected: boolean, isHovered: boolean) => {
      const { ctx, calls } = recorder()
      drawNPC(ctx, 0, 0, false, assets(['stage2Npc1']), npc(), { t: 0.1, isSelected, isHovered })
      return count(calls, 'shadowBlur=') > 0
    }
    expect(glow(true, false)).toBe(true)
    expect(glow(false, true)).toBe(true)
    expect(glow(false, false)).toBe(false)
  })

  it('with reduced motion it keeps the glow but does not pulse', () => {
    const scaleAt = (t: number, reduceMotion: boolean) => {
      const { ctx, calls } = recorder()
      drawNPC(ctx, 0, 0, false, assets(['stage2Npc1']), npc(), { t, isSelected: true, isHovered: false, reduceMotion })
      return { scale: calls.filter((c) => c.startsWith('scale:')).join('|'), glow: count(calls, 'shadowBlur=') > 0 }
    }
    const a = scaleAt(0.1, true)
    const b = scaleAt(0.9, true)
    expect(a).toEqual(b)
    expect(a.glow).toBe(true)
    expect(a.scale).toBe('scale:1,1')
  })

  it('a teacher gets a badge, the others do not', () => {
    const plain = recorder()
    const teacher = recorder()
    drawNPC(plain.ctx, 0, 0, false, assets(['stage2Npc1']), npc())
    drawNPC(teacher.ctx, 0, 0, false, assets(['stage2Npc1']), npc({ role: 'teacher' }))
    expect(count(teacher.calls, 'arc')).toBe(count(plain.calls, 'arc') + 1)
    expect(count(teacher.calls, 'moveTo')).toBeGreaterThan(count(plain.calls, 'moveTo'))
  })

  describe('with a look (the unicorn drawn in code, as in the 3D view)', () => {
    const anim = { t: 0, isSelected: false, isHovered: false, look: NPC_LOOKS[0] }

    it('stands the drawn unicorn in the same rounded, outlined square, and draws no picture even when it has one', () => {
      const { ctx, calls } = recorder()
      drawNPC(ctx, 300, 200, false, assets(['stage2Npc1']), npc(), anim)
      expect(count(calls, 'drawImage')).toBe(0)
      expect(count(calls, 'clip')).toBe(1)
      expect(count(calls, 'stroke:')).toBeGreaterThanOrEqual(1)
      expect(count(calls, 'ellipse')).toBeGreaterThan(10)
      expect(count(calls, 'save')).toBe(count(calls, 'restore'))
    })

    it('keeps the box the size it was: the same for every unicorn, bigger on a phone', () => {
      const side = (figureSide: number) => {
        const { ctx, calls } = recorder()
        drawNPC(ctx, 0, 0, false, undefined, npc(), { ...anim, figureSide })
        return calls.find((c) => c.startsWith('translate:') && c.includes(`${-figureSide / 2}`))
      }
      expect(side(140)).toBe('translate:-70,-70')
      expect(side(200)).toBe('translate:-100,-100')
    })

    it('marks the teacher, and the backdrop and unicorn follow the look', () => {
      const teacher = recorder()
      drawNPC(teacher.ctx, 0, 0, false, undefined, npc({ role: 'teacher' }), anim)
      const student = recorder()
      drawNPC(student.ctx, 0, 0, false, undefined, npc(), anim)
      expect(count(teacher.calls, 'fillRect')).toBeGreaterThan(count(student.calls, 'fillRect'))
      const other = recorder()
      drawNPC(other.ctx, 0, 0, false, undefined, npc(), { ...anim, look: NPC_LOOKS[1] })
      expect(other.calls.join('|')).not.toBe(student.calls.join('|'))
    })

    it('a look with no mane colours still has a backdrop', () => {
      const { ctx, calls } = recorder()
      drawNPC(ctx, 0, 0, false, undefined, npc(), { ...anim, look: { ...NPC_LOOKS[0], mane: [] } })
      expect(count(calls, 'fillRect')).toBeGreaterThan(0)
    })

    it('still glows when it is the one she stands next to, and rests when answered', () => {
      const glow = recorder()
      drawNPC(glow.ctx, 0, 0, false, undefined, npc(), { ...anim, isSelected: true, t: 1 })
      const calm = recorder()
      drawNPC(calm.ctx, 0, 0, true, undefined, npc(), { ...anim, isSelected: true, t: 1 })
      expect(glow.calls.some((c) => c.startsWith('shadowBlur=26'))).toBe(true)
      expect(calm.calls.some((c) => c.startsWith('shadowBlur=26'))).toBe(false)
    })
  })
})
