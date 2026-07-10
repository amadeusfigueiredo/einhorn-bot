import { describe, expect, it, vi } from 'vitest'
import { updateGame } from './update'
import { WIDTH, HEIGHT } from '../constants/dimensions'
import type { MoveTarget, Player, StageConfig } from '../types'

function makePlayer(overrides: Partial<Player> = {}): Player {
  return { x: 100, y: 100, w: 56, h: 56, speed: 200, ...overrides }
}

const emptyStage: StageConfig = { name: 'stage1', gates: [], npcs: [] }

describe('updateGame movement', () => {
  it('moves the player right at the given speed', () => {
    const player = makePlayer()
    updateGame({
      dt: 1,
      keys: { arrowright: true },
      player,
      stage: emptyStage,
      answered: new Set(),
      onTrigger: vi.fn(),
    })
    expect(player.x).toBe(300)
    expect(player.y).toBe(100)
  })

  it('clamps movement to the full canvas width, not a hardcoded 960', () => {
    const player = makePlayer({ x: WIDTH - 60, speed: 1000 })
    updateGame({
      dt: 1,
      keys: { arrowright: true },
      player,
      stage: emptyStage,
      answered: new Set(),
      onTrigger: vi.fn(),
    })
    expect(player.x).toBe(WIDTH - player.w)
  })

  it('clamps movement to the full canvas height, not a hardcoded 540', () => {
    const player = makePlayer({ y: HEIGHT - 60, speed: 1000 })
    updateGame({
      dt: 1,
      keys: { arrowdown: true },
      player,
      stage: emptyStage,
      answered: new Set(),
      onTrigger: vi.fn(),
    })
    expect(player.y).toBe(HEIGHT - player.h)
  })

  it('never lets the player go below 0,0', () => {
    const player = makePlayer({ x: 0, y: 0, speed: 1000 })
    updateGame({
      dt: 1,
      keys: { arrowleft: true, arrowup: true },
      player,
      stage: emptyStage,
      answered: new Set(),
      onTrigger: vi.fn(),
    })
    expect(player.x).toBe(0)
    expect(player.y).toBe(0)
  })

  it('supports WASD as an alternative to the arrow keys', () => {
    const player = makePlayer()
    updateGame({
      dt: 1,
      keys: { d: true },
      player,
      stage: emptyStage,
      answered: new Set(),
      onTrigger: vi.fn(),
    })
    expect(player.x).toBe(300)
  })
})

describe('updateGame gate triggers', () => {
  const stageWithGate: StageConfig = {
    name: 'stage1',
    gates: [
      {
        id: 'gate1',
        area: { x: 100, y: 100, w: 56, h: 56 },
        question: { id: 'q', prompt: 'p', choices: [], correctIndex: 0 },
      },
    ],
    npcs: [],
  }

  it('triggers immediately on overlap without needing a key press', () => {
    const onTrigger = vi.fn()
    updateGame({
      dt: 0,
      keys: {},
      player: makePlayer({ x: 100, y: 100 }),
      stage: stageWithGate,
      answered: new Set(),
      onTrigger,
    })
    expect(onTrigger).toHaveBeenCalledWith('gate', 'gate1')
  })

  it('does not re-trigger an already-answered gate', () => {
    const onTrigger = vi.fn()
    updateGame({
      dt: 0,
      keys: {},
      player: makePlayer({ x: 100, y: 100 }),
      stage: stageWithGate,
      answered: new Set(['gate1']),
      onTrigger,
    })
    expect(onTrigger).not.toHaveBeenCalled()
  })
})

describe('updateGame npc triggers', () => {
  const stageWithNpc: StageConfig = {
    name: 'stage1',
    gates: [],
    npcs: [
      {
        id: 'npc1',
        x: 200,
        y: 200,
        talkRadius: 80,
        question: { id: 'q', prompt: 'p', choices: [], correctIndex: 0 },
      },
    ],
  }

  it('does not trigger on proximity alone', () => {
    const onTrigger = vi.fn()
    updateGame({
      dt: 0,
      keys: {},
      player: makePlayer({ x: 180, y: 180 }),
      stage: stageWithNpc,
      answered: new Set(),
      onTrigger,
    })
    expect(onTrigger).not.toHaveBeenCalled()
  })

  it('triggers when close and pressing E', () => {
    const onTrigger = vi.fn()
    updateGame({
      dt: 0,
      keys: { e: true },
      player: makePlayer({ x: 180, y: 180 }),
      stage: stageWithNpc,
      answered: new Set(),
      onTrigger,
    })
    expect(onTrigger).toHaveBeenCalledWith('npc', 'npc1')
  })

  it('does not trigger when out of talk radius, even while pressing E', () => {
    const onTrigger = vi.fn()
    updateGame({
      dt: 0,
      keys: { e: true },
      player: makePlayer({ x: 0, y: 0 }),
      stage: stageWithNpc,
      answered: new Set(),
      onTrigger,
    })
    expect(onTrigger).not.toHaveBeenCalled()
  })
})

describe('updateGame click-to-move (moveTargetRef)', () => {
  it('walks the player toward the target', () => {
    const player = makePlayer({ x: 100, y: 100, speed: 200 })
    const moveTargetRef = { current: { x: 300, y: 100 } as MoveTarget | null }
    updateGame({
      dt: 0.5, // covers 100px at speed 200
      keys: {},
      player,
      stage: emptyStage,
      answered: new Set(),
      onTrigger: vi.fn(),
      moveTargetRef,
    })
    // player center starts at 128,128; target at 300,100 -> should move closer
    expect(player.x).toBeGreaterThan(100)
    expect(moveTargetRef.current).not.toBeNull()
  })

  it('arrives, clears the target, and calls onArrive once within the radius', () => {
    const player = makePlayer({ x: 100, y: 100, w: 56, h: 56 })
    const onArrive = vi.fn()
    const moveTargetRef = {
      current: { x: 128, y: 128, radius: 10, onArrive } as MoveTarget | null,
    }
    updateGame({
      dt: 0.016,
      keys: {},
      player,
      stage: emptyStage,
      answered: new Set(),
      onTrigger: vi.fn(),
      moveTargetRef,
    })
    expect(onArrive).toHaveBeenCalledTimes(1)
    expect(moveTargetRef.current).toBeNull()
  })

  it('does not overshoot the target in a single large step', () => {
    const player = makePlayer({ x: 0, y: 100, speed: 1000 })
    const moveTargetRef = { current: { x: 100, y: 128 } as MoveTarget | null }
    updateGame({
      dt: 1, // would normally cover 1000px
      keys: {},
      player,
      stage: emptyStage,
      answered: new Set(),
      onTrigger: vi.fn(),
      moveTargetRef,
    })
    // stops exactly at the target instead of flying past it
    expect(player.x + player.w / 2).toBeCloseTo(100, 0)

    // arrival is then detected at the start of the next frame
    updateGame({
      dt: 0.016,
      keys: {},
      player,
      stage: emptyStage,
      answered: new Set(),
      onTrigger: vi.fn(),
      moveTargetRef,
    })
    expect(moveTargetRef.current).toBeNull()
  })

  it('manual key input cancels an in-progress click-to-move', () => {
    const player = makePlayer({ x: 100, y: 100 })
    const onArrive = vi.fn()
    const moveTargetRef = {
      current: { x: 900, y: 100, onArrive } as MoveTarget | null,
    }
    updateGame({
      dt: 0.1,
      keys: { arrowleft: true },
      player,
      stage: emptyStage,
      answered: new Set(),
      onTrigger: vi.fn(),
      moveTargetRef,
    })
    expect(moveTargetRef.current).toBeNull()
    expect(onArrive).not.toHaveBeenCalled()
    expect(player.x).toBeLessThan(100) // moved left, per the manual key
  })

  it('does nothing when there is no target and no keys', () => {
    const player = makePlayer({ x: 100, y: 100 })
    updateGame({
      dt: 0.5,
      keys: {},
      player,
      stage: emptyStage,
      answered: new Set(),
      onTrigger: vi.fn(),
      moveTargetRef: { current: null },
    })
    expect(player.x).toBe(100)
    expect(player.y).toBe(100)
  })
})
