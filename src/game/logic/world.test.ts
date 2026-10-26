import { describe, it, expect } from 'vitest'
import { createWorld, stepWorld, playerCenter } from './world'
import { buildStages } from '../constants/stages'
import { WIDTH, HEIGHT, PORTRAIT_WIDTH, PORTRAIT_HEIGHT, WIDE_WIDTH, WIDE_HEIGHT } from '../constants/dimensions'

const stage = buildStages(WIDTH, HEIGHT)[0]

describe('world', () => {
  it('moves right with the right key and faces right', () => {
    const w = createWorld(WIDTH, HEIGHT)
    const x0 = w.player.x
    stepWorld(w, { dt: 0.1, keys: { d: true }, stage, answered: new Set(), onTrigger: () => {}, canvasWidth: WIDTH, canvasHeight: HEIGHT })
    expect(w.player.x).toBeGreaterThan(x0)
    expect(w.motionRef.current).toEqual({ moving: true, facingLeft: false })
  })

  it('triggers an NPC with E when close', () => {
    const w = createWorld(WIDTH, HEIGHT)
    const npc = stage.npcs![0]
    w.player.x = npc.x - w.player.w / 2
    w.player.y = npc.y - w.player.h / 2
    const hits: string[] = []
    stepWorld(w, { dt: 0.016, keys: { e: true }, stage, answered: new Set(), onTrigger: (_, id) => hits.push(id), canvasWidth: WIDTH, canvasHeight: HEIGHT })
    expect(hits).toEqual([npc.id])
  })
})

describe('start spot', () => {
  const sizes = [
    [WIDTH, HEIGHT],
    [PORTRAIT_WIDTH, PORTRAIT_HEIGHT],
    [WIDE_WIDTH, WIDE_HEIGHT],
  ] as const

  it.each(sizes)('at %ix%i the player starts clear of every unicorn in every stage', (w, h) => {
    const world = createWorld(w, h)
    const p = world.player
    const c = playerCenter(p)
    for (const s of buildStages(w, h)) {
      for (const npc of s.npcs ?? []) {
        // Not within talking distance, and the two figures do not touch.
        expect(Math.hypot(npc.x - c.x, npc.y - c.y)).toBeGreaterThan(npc.talkRadius ?? 80)
        const apart = Math.abs(npc.x - c.x) >= p.w || Math.abs(npc.y - c.y) >= p.h
        expect(apart, `${s.name} ${npc.id}`).toBe(true)
      }
    }
  })

  it.each(sizes)('at %ix%i the player starts inside the play area', (w, h) => {
    const { player: p } = createWorld(w, h)
    expect(p.x).toBeGreaterThanOrEqual(0)
    expect(p.y).toBeGreaterThanOrEqual(0)
    expect(p.x + p.w).toBeLessThanOrEqual(w)
    expect(p.y + p.h).toBeLessThanOrEqual(h)
  })
})
