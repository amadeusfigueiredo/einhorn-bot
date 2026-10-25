// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { cleanup, renderHook } from '@testing-library/react'

const mocks = vi.hoisted(() => ({
  stepWorld: vi.fn(),
  drawScene: vi.fn(),
  game: { phase: 'idle', answered: new Set<string>() } as { phase: string; answered: Set<string> },
  modalOpen: false,
  transitioning: false,
  reduceMotion: false,
}))

vi.mock('../logic/world', () => ({ stepWorld: mocks.stepWorld }))
vi.mock('../engine/drawScene', () => ({ drawScene: mocks.drawScene }))
vi.mock('../logic/gameStore.instance', () => ({ gameStore: { getState: () => mocks.game } }))
vi.mock('../player/playerName', () => ({ profileStore: { getState: () => ({ modalOpen: mocks.modalOpen }) } }))
vi.mock('../transition/transitionStore', () => ({ isTransitioning: () => mocks.transitioning }))
vi.mock('../utils/prefersReducedMotion', () => ({ prefersReducedMotion: () => mocks.reduceMotion }))

import useGameLoop from './useGameLoop'
import { pauseStore } from '../pause/pauseStore'
import { startStore } from '../start/startStore'
import { STAGES } from '../constants/stages'
import type { World } from '../logic/world'
import type { Particle } from '../engine/particles'
import type { Keys, LoaderImageAssets } from '../types'

// A frame clock the test turns by hand.
let frames: { id: number; cb: (t: number) => void }[] = []
let nextId = 1
let now = 1000
function frame(ms = 16) {
  now += ms
  const due = frames
  frames = []
  for (const f of due) f.cb(now)
}

const world = {
  player: { x: 100, y: 200, w: 60, h: 60, speed: 200 },
  moveTargetRef: { current: null },
  motionRef: { current: { moving: false, facingLeft: false } },
} as unknown as World

function setup(over: Record<string, unknown> = {}) {
  const canvas = document.createElement('canvas')
  const ctx = {} as CanvasRenderingContext2D
  canvas.getContext = (() => ctx) as never
  const keys: Keys = { arrowup: true }
  const onTrigger = vi.fn()
  const props = {
    canvasRef: { current: canvas },
    keysRef: { current: keys },
    stage: STAGES[0],
    world,
    assetsRef: { current: null as LoaderImageAssets | null },
    hoveredNpcRef: { current: null as string | null },
    particlesRef: { current: [] as Particle[] },
    onTrigger,
    canvasWidth: 1440,
    canvasHeight: 810,
    ...over,
  }
  const hook = renderHook((p: typeof props) => useGameLoop(p), { initialProps: props })
  return { ...hook, props, ctx, keys, onTrigger }
}

beforeEach(() => {
  frames = []
  nextId = 1
  now = 1000
  mocks.stepWorld.mockClear()
  mocks.drawScene.mockClear()
  mocks.game = { phase: 'idle', answered: new Set() }
  mocks.modalOpen = false
  mocks.transitioning = false
  mocks.reduceMotion = false
  vi.stubGlobal('performance', { now: () => now })
  vi.stubGlobal('requestAnimationFrame', (cb: (t: number) => void) => {
    const id = nextId++
    frames.push({ id, cb })
    return id
  })
  vi.stubGlobal('cancelAnimationFrame', (id: number) => {
    frames = frames.filter((f) => f.id !== id)
  })
})
afterEach(() => {
  startStore.getState().close()
  pauseStore.getState().resume()
  cleanup()
  vi.unstubAllGlobals()
})

describe('useGameLoop behind the start menu', () => {
  it('moves nothing while the menu is open, and goes on when it is closed', () => {
    setup()
    startStore.getState().open()
    frame()
    frame()
    expect(mocks.stepWorld).not.toHaveBeenCalled()
    startStore.getState().close()
    frame()
    expect(mocks.stepWorld).toHaveBeenCalledTimes(1)
  })
})

describe('useGameLoop while paused', () => {
  it('moves nothing and draws nothing, but keeps asking for frames so it can go on', () => {
    const { keys } = setup()
    keys.arrowup = true
    frame()
    mocks.stepWorld.mockClear()
    mocks.drawScene.mockClear()
    pauseStore.getState().pause()
    frame()
    frame()
    expect(mocks.stepWorld).not.toHaveBeenCalled()
    expect(mocks.drawScene).not.toHaveBeenCalled()
    expect(frames).toHaveLength(1)
  })

  it('goes on at once when the pause is over, without a jump (the time of the pause is not counted)', () => {
    setup()
    frame()
    pauseStore.getState().pause()
    frame(10_000)
    pauseStore.getState().resume()
    frame(16)
    expect(mocks.stepWorld).toHaveBeenCalled()
    const { dt } = mocks.stepWorld.mock.calls.at(-1)![1] as { dt: number }
    expect(dt).toBeLessThanOrEqual(0.05)
  })
})

describe('useGameLoop', () => {
  it('draws on every frame, with the stage and the player', () => {
    const { props, ctx } = setup()
    frame()
    frame()
    frame()
    expect(mocks.drawScene).toHaveBeenCalledTimes(3)
    const [c, stage, player] = mocks.drawScene.mock.calls[0]
    expect(c).toBe(ctx)
    expect(stage).toBe(props.stage)
    expect(player).toBe(world.player)
  })

  it('walks the world forward by the time since the last frame, with the keys that are held', () => {
    const { keys, onTrigger } = setup()
    frame(20)
    const input = mocks.stepWorld.mock.calls[0][1]
    expect(input.dt).toBeCloseTo(0.02)
    expect(input.keys).toBe(keys)
    expect(input.onTrigger).toBe(onTrigger)
    expect(input.canvasWidth).toBe(1440)
    expect(input.canvasHeight).toBe(810)
  })

  it('never takes a huge step after the tab was away (time is capped)', () => {
    setup()
    frame(5000)
    expect(mocks.stepWorld.mock.calls[0][1].dt).toBe(0.05)
  })

  it.each(['talking', 'asking'])('the world stands still while the game is %s, but is still drawn', (phase) => {
    mocks.game.phase = phase
    setup()
    frame()
    expect(mocks.stepWorld).not.toHaveBeenCalled()
    expect(mocks.drawScene).toHaveBeenCalledTimes(1)
  })

  it('the world stands still while the name card is open', () => {
    mocks.modalOpen = true
    setup()
    frame()
    expect(mocks.stepWorld).not.toHaveBeenCalled()
    expect(mocks.drawScene).toHaveBeenCalledTimes(1)
  })

  it('the world stands still while a new stage is arriving', () => {
    mocks.transitioning = true
    setup()
    frame()
    expect(mocks.stepWorld).not.toHaveBeenCalled()
    expect(mocks.drawScene).toHaveBeenCalledTimes(1)
  })

  it('the world walks again when the pause ends', () => {
    mocks.game.phase = 'talking'
    setup()
    frame()
    mocks.game.phase = 'idle'
    frame()
    expect(mocks.stepWorld).toHaveBeenCalledTimes(1)
  })

  it('tells the drawing who has been answered, who is under the mouse, and the time', () => {
    mocks.game.answered = new Set(['stage1-npc1'])
    const { props } = setup()
    props.hoveredNpcRef.current = 'stage1-npc2'
    frame(500)
    frame(500)
    const [, , , answered, , opts] = mocks.drawScene.mock.calls[1]
    expect(answered).toBe(mocks.game.answered)
    expect(opts.hoveredNpcId).toBe('stage1-npc2')
    expect(opts.t).toBeCloseTo(1, 5)
    expect(opts.canvasWidth).toBe(1440)
    expect(opts.reduceMotion).toBe(false)
    expect(opts.lang).toMatch(/^(de|pt|en)$/)
  })

  it('hands over pictures once they have loaded', () => {
    const { props } = setup()
    frame()
    expect(mocks.drawScene.mock.calls[0][4]).toBeUndefined()
    const loaded = { player1: {} } as unknown as LoaderImageAssets
    props.assetsRef.current = loaded
    frame()
    expect(mocks.drawScene.mock.calls[1][4]).toBe(loaded)
  })

  it('the picture of the player glides toward her place', () => {
    const w = { ...world, player: { ...world.player, x: 100, y: 200 } } as World
    setup({ world: w })
    ;w.player.x = 200
    frame(16)
    const shown = mocks.drawScene.mock.calls[0][5].playerDisplay.x
    expect(shown).toBeGreaterThan(100)
    expect(shown).toBeLessThan(200)
  })

  it('a long jump (a new stage) is not a glide: the picture is there at once', () => {
    const w = { ...world, player: { ...world.player, x: 100, y: 200 } } as World
    setup({ world: w })
    ;w.player.x = 900
    frame(16)
    expect(mocks.drawScene.mock.calls[0][5].playerDisplay.x).toBe(900)
  })

  it('with reduced motion the picture is exactly where she is', () => {
    mocks.reduceMotion = true
    const w = { ...world, player: { ...world.player, x: 100, y: 200 } } as World
    setup({ world: w })
    ;w.player.x = 200
    frame(16)
    expect(mocks.drawScene.mock.calls[0][5].playerDisplay.x).toBe(200)
    expect(mocks.drawScene.mock.calls[0][5].reduceMotion).toBe(true)
  })

  it('keeps the sparkles moving and hands them to the drawing', () => {
    const particles: Particle[] = [{ x: 0, y: 0, vx: 10, vy: 0, age: 0, life: 1, size: 3, color: '#fff' }]
    const { props } = setup({ particlesRef: { current: particles } })
    frame(100)
    expect(props.particlesRef.current[0].age).toBeGreaterThan(0)
    expect(mocks.drawScene.mock.calls[0][5].particles).toBe(props.particlesRef.current)
  })

  it('stops when the screen goes away: no more frames, no more drawing', () => {
    const { unmount } = setup()
    frame()
    unmount()
    expect(frames).toHaveLength(0)
    frame()
    expect(mocks.drawScene).toHaveBeenCalledTimes(1)
  })

  it('starts over when the stage changes, with the new stage', () => {
    const { rerender, props } = setup()
    frame()
    rerender({ ...props, stage: STAGES[3] })
    frame()
    expect(mocks.drawScene.mock.calls.at(-1)![1]).toBe(STAGES[3])
    // only one loop is running
    expect(frames).toHaveLength(1)
  })

  it('starts over when the canvas changes size', () => {
    const { rerender, props } = setup()
    frame()
    rerender({ ...props, canvasWidth: 760, canvasHeight: 1350 })
    frame()
    expect(mocks.stepWorld.mock.calls.at(-1)![1].canvasWidth).toBe(760)
    expect(frames).toHaveLength(1)
  })

  it('does nothing when there is no canvas or it cannot draw', () => {
    setup({ canvasRef: { current: null } })
    expect(frames).toHaveLength(0)
    const canvas = document.createElement('canvas')
    canvas.getContext = (() => null) as never
    setup({ canvasRef: { current: canvas } })
    expect(frames).toHaveLength(0)
    expect(mocks.drawScene).not.toHaveBeenCalled()
  })
})
