import { describe, it, expect } from 'vitest'
import { STAGES } from '../constants/stages'
import { drawScene } from './drawScene'
import { drawGates } from '../renderer'
import { createWorld } from '../logic/world'
import type { LoaderImageAssets, Player, StageConfig } from '../types'

/** A drawing surface that remembers what was drawn, and answers the few questions the code asks it. */
function recorder() {
  const calls: string[] = []
  const state: Record<string, unknown> = {}
  const ctx = new Proxy(state, {
    get: (t, name: string) => {
      if (name in t) return t[name]
      if (name === 'measureText') return (text: string) => ({ width: String(text).length * 9 })
      if (name === 'createLinearGradient' || name === 'createRadialGradient') return () => ({ addColorStop: () => calls.push('stop') })
      return (...args: unknown[]) => void calls.push(`${name}:${args.map((a) => (typeof a === 'number' ? Math.round(a) : typeof a === 'object' ? 'obj' : a)).join(',')}`)
    },
    set: (t, name: string, value: unknown) => {
      t[name] = value
      // Settings count as drawing too: colours, transparency, line widths.
      calls.push(`${name}=${typeof value === 'object' ? 'obj' : typeof value === 'number' ? Math.round(value * 100) / 100 : value}`)
      return true
    },
  }) as unknown as CanvasRenderingContext2D
  return { ctx, calls }
}

const image = (w = 600, h = 400) => ({ width: w, height: h, naturalWidth: w, naturalHeight: h }) as unknown as HTMLImageElement

function assetsFor(stage: StageConfig): LoaderImageAssets {
  const a: Record<string, HTMLImageElement> = { player1: image(300, 300), [stage.background as string]: image(1200, 800) }
  for (const n of stage.npcs ?? []) if (n.imageKey) a[n.imageKey] = image(400, 500)
  return a as LoaderImageAssets
}

const player = (): Player => createWorld(1440, 810).player

describe('drawScene (the 2D view)', () => {
  it.each(STAGES.map((s, i) => [i + 1, s] as const))('stage %i draws without a hitch: a background, every unicorn and the player', (_n, stage) => {
    const { ctx, calls } = recorder()
    drawScene(ctx, stage, player(), new Set(), assetsFor(stage), { t: 1.2 })
    expect(calls[0]).toMatch(/^clearRect:0,0,1440,810/)
    // Only the background (stages 1 to 12) is a picture; the unicorns and the player are drawn in code, each with its own horn, eye and mane.
    const pictures = calls.filter((c) => c.startsWith('drawImage')).length
    expect(pictures).toBe(stage.background ? 1 : 0)
    expect(calls.filter((c) => c.startsWith('ellipse')).length).toBeGreaterThanOrEqual(((stage.npcs ?? []).length + 1) * 10)
  })

  it('a stage that is not one of the 15 (no known number) keeps its unicorns as pictures', () => {
    const { ctx, calls } = recorder()
    const stage = { ...STAGES[0], name: 'bonus' } as unknown as StageConfig
    drawScene(ctx, stage, player(), new Set(), assetsFor(stage), { t: 0 })
    expect(calls.filter((c) => c.startsWith('drawImage')).length).toBeGreaterThanOrEqual(1 + (stage.npcs ?? []).length)
  })

  it('a stage with no name at all draws too', () => {
    const { ctx, calls } = recorder()
    const stage = { ...STAGES[0], name: undefined } as unknown as StageConfig
    expect(() => drawScene(ctx, stage, player(), new Set(), undefined, { t: 0 })).not.toThrow()
    expect(calls.some((c) => c.startsWith('fillRect'))).toBe(true)
  })

  it('works with no pictures at all (still loading): falls back to a flat colour and placeholders', () => {
    const { ctx, calls } = recorder()
    expect(() => drawScene(ctx, STAGES[0], player(), new Set(), undefined, { t: 0 })).not.toThrow()
    expect(calls.some((c) => c.startsWith('fillRect'))).toBe(true)
  })

  it('works on a portrait phone canvas and on the extra wide one', () => {
    for (const [w, h] of [[760, 1350], [1600, 720]] as const) {
      const { ctx, calls } = recorder()
      const p = createWorld(w, h).player
      drawScene(ctx, STAGES[3], p, new Set(), assetsFor(STAGES[3]), { t: 0.5, canvasWidth: w, canvasHeight: h })
      expect(calls[0]).toBe(`clearRect:0,0,${w},${h}`)
    }
  })

  it('shows the "talk to me" chip only next to an unanswered unicorn', () => {
    const stage = STAGES[0]
    const npc = stage.npcs![0]
    const nextTo: Player = { ...player(), x: npc.x - player().w / 2, y: npc.y - player().h / 2 }
    const near = recorder()
    drawScene(near.ctx, stage, nextTo, new Set(), assetsFor(stage), { t: 0 })
    const far = recorder()
    drawScene(far.ctx, stage, { ...player(), x: 5, y: 5 }, new Set(), assetsFor(stage), { t: 0 })
    const chipText = (calls: string[]) => calls.filter((c) => c.startsWith('fillText') && /E|tippen|tap|Enter/i.test(c)).length
    expect(chipText(near.calls)).toBeGreaterThan(chipText(far.calls))
    // Once it has been answered the chip is gone again.
    const answered = recorder()
    drawScene(answered.ctx, stage, nextTo, new Set([npc.id]), assetsFor(stage), { t: 0 })
    expect(chipText(answered.calls)).toBeLessThanOrEqual(chipText(far.calls))
  })

  it('draws the answered state differently from the unanswered one', () => {
    const stage = STAGES[0]
    const fresh = recorder()
    drawScene(fresh.ctx, stage, player(), new Set(), assetsFor(stage), { t: 2 })
    const done = recorder()
    drawScene(done.ctx, stage, player(), new Set(stage.npcs!.map((n) => n.id)), assetsFor(stage), { t: 2 })
    expect(done.calls.join('|')).not.toBe(fresh.calls.join('|'))
  })

  it('with reduced motion nothing depends on the time', () => {
    const stage = STAGES[0]
    const a = recorder()
    drawScene(a.ctx, stage, player(), new Set(), assetsFor(stage), { t: 0, reduceMotion: true })
    const b = recorder()
    drawScene(b.ctx, stage, player(), new Set(), assetsFor(stage), { t: 7.3, reduceMotion: true })
    expect(a.calls.join('|')).toBe(b.calls.join('|'))
  })

  it('without reduced motion the unicorns move with the time', () => {
    const stage = STAGES[0]
    const a = recorder()
    drawScene(a.ctx, stage, player(), new Set(), assetsFor(stage), { t: 0 })
    const b = recorder()
    drawScene(b.ctx, stage, player(), new Set(), assetsFor(stage), { t: 0.37 })
    expect(a.calls.join('|')).not.toBe(b.calls.join('|'))
  })

  it('is always the same for the same moment (no hidden randomness)', () => {
    const stage = STAGES[5]
    const a = recorder()
    drawScene(a.ctx, stage, player(), new Set(), assetsFor(stage), { t: 3.3 })
    const b = recorder()
    drawScene(b.ctx, stage, player(), new Set(), assetsFor(stage), { t: 3.3 })
    expect(a.calls).toEqual(b.calls)
  })

  it('draws the player where she is eased to, not where the game says she is', () => {
    const stage = STAGES[0]
    const base = recorder()
    drawScene(base.ctx, stage, player(), new Set(), assetsFor(stage), { t: 0 })
    const eased = recorder()
    drawScene(eased.ctx, stage, player(), new Set(), assetsFor(stage), { t: 0, playerDisplay: { x: 50, y: 60 } })
    expect(eased.calls.join('|')).not.toBe(base.calls.join('|'))
  })
})

describe('drawGates', () => {
  const gate = { id: 'g', area: { x: 10, y: 20, w: 30, h: 40 } } as never

  it('draws each gate as a pale box, fainter once it is open', () => {
    const open = recorder()
    drawGates(open.ctx, [gate], new Set(['g']))
    const shut = recorder()
    drawGates(shut.ctx, [gate], new Set())
    expect(open.calls).toContain('fillRect:10,20,30,40')
    expect(shut.calls).toContain('fillRect:10,20,30,40')
    expect(open.calls).toContain('globalAlpha=0.15')
    expect(shut.calls).toContain('globalAlpha=0.35')
    expect(open.calls.join()).not.toBe(shut.calls.join())
  })

  it('copes with no gates', () => {
    const { ctx, calls } = recorder()
    drawGates(ctx, [], new Set())
    expect(calls).toEqual([])
    expect(() => drawGates(ctx, undefined as never, new Set())).not.toThrow()
  })

  it('a stage without gates or unicorns still draws: the room, Amara and the badge', () => {
    const bare = { name: 'stage1', subject: 'Mathematik', difficulty: 'leicht', background: 'stage1Background' } as StageConfig
    const { ctx, calls } = recorder()
    expect(() => drawScene(ctx, bare, player(), new Set(), assetsFor(bare), { t: 0 })).not.toThrow()
    expect(calls.filter((c) => c.startsWith('drawImage')).length).toBe(1)
    expect(calls.filter((c) => c.startsWith('ellipse')).length).toBeGreaterThanOrEqual(10)
  })
})
