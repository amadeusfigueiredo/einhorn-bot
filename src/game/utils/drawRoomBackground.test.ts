import { describe, expect, it } from 'vitest'
import { drawRoomBackground } from './drawRoomBackground'
import { CLASSROOMS, type FloorKind, type RoomSpec, type WindowView } from '../data/classrooms'
import { recorder, count } from '../../test/canvas'

const room = (over: Partial<RoomSpec> = {}, windows: WindowView = 'meadow', floor: FloorKind = 'checker'): RoomSpec => ({
  ...CLASSROOMS.stage13,
  ...over,
  floor,
  walls: { back: true, left: true, right: true, windows },
})

describe('drawRoomBackground: the 2D room of a stage, drawn in code', () => {
  it('paints the wall, the floor and the trim at the horizon in the colours of the room', () => {
    const { ctx, calls } = recorder()
    drawRoomBackground(ctx, CLASSROOMS.stage13, 1000, 600)
    // the wall covers everything above the horizon (46% down), the trim is the accent colour
    expect(calls).toContain('fillRect:0,0,1000,276')
    expect(calls).toContain('fillRect:0,272,1000,8')
    expect(calls.filter((c) => c.startsWith('fillStyle=#ff7eb6')).length).toBeGreaterThan(0)
  })

  it('draws the same thing every time (nothing is random), and a different thing for another world', () => {
    const run = (r: RoomSpec) => {
      const { ctx, calls } = recorder()
      drawRoomBackground(ctx, r, 800, 450)
      return calls.join('|')
    }
    expect(run(CLASSROOMS.stage14)).toBe(run(CLASSROOMS.stage14))
    expect(run(CLASSROOMS.stage14)).not.toBe(run(CLASSROOMS.stage15))
  })

  it('every one of the 15 worlds can be drawn, at a wide and at a tall screen, and puts something on the screen', () => {
    for (const [name, spec] of Object.entries(CLASSROOMS)) {
      for (const [w, h] of [[1280, 720], [390, 700]]) {
        const { ctx, calls } = recorder()
        expect(() => drawRoomBackground(ctx, spec, w, h), name).not.toThrow()
        expect(count(calls, 'fill'), name).toBeGreaterThan(20)
      }
    }
  })

  it.each(['storm', 'stars', 'clouds', 'waterfall', 'meadow', 'rainbow', 'sea', 'moon', 'underwater', 'aurora', 'canyon', 'forest'] as const)('shows the %s through the windows', (view) => {
    const { ctx, calls } = recorder()
    drawRoomBackground(ctx, room({}, view), 1000, 600)
    // two windows: each is clipped to its round top
    expect(count(calls, 'clip')).toBe(2)
  })

  it('a piece of decor the 2D room has no shape for is drawn as a soft ball, not left out', () => {
    const plain = recorder()
    drawRoomBackground(plain.ctx, room({ decor: [] }), 1000, 600)
    const odd = recorder()
    drawRoomBackground(odd.ctx, room({ decor: [{ kind: 'noSuchPiece' as never, zone: 'backWall' }] }), 1000, 600)
    expect(count(odd.calls, 'ellipse')).toBeGreaterThan(count(plain.calls, 'ellipse'))
  })

  it('draws no windows for a room without any', () => {
    const { ctx, calls } = recorder()
    drawRoomBackground(ctx, room({}, 'none'), 1000, 600)
    expect(count(calls, 'clip')).toBe(0)
  })

  it.each(['checker', 'tiles', 'stone', 'ice', 'wood', 'carpet', 'water', 'sand', 'grass', 'moon', 'cloud'] as const)('the %s floor is drawn', (kind) => {
    const { ctx, calls } = recorder()
    drawRoomBackground(ctx, room({}, 'none', kind), 1000, 600)
    expect(count(calls, 'fillRect:0,276,1000,324')).toBe(1)
    expect(calls.length).toBeGreaterThan(60)
  })

  it('an open-air world (no back wall) paints the sky down to the floor', () => {
    const { ctx, calls } = recorder()
    drawRoomBackground(ctx, { ...CLASSROOMS.stage13, walls: { back: false, left: false, right: false, windows: 'none' } }, 1000, 600)
    expect(calls).toContain(`fillStyle=${CLASSROOMS.stage13.palette.sky}`)
    const walled = recorder()
    drawRoomBackground(walled.ctx, CLASSROOMS.stage13, 1000, 600)
    expect(walled.calls).not.toContain(`fillStyle=${CLASSROOMS.stage13.palette.sky}`)
  })
})
