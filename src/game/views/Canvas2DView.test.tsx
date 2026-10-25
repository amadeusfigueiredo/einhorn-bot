// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { act, cleanupAfterEach, fireEvent, renderUI, screen } from '../../test/ui'
import { STAGES } from '../constants/stages'
import { gameStore } from '../logic/gameStore.instance'
import type { World } from '../logic/world'

// The loop and the sparkles have their own tests; here only the tapping and the pointing matter.
const loop = vi.hoisted(() => ({ props: [] as unknown[] }))
vi.mock('../hooks/useGameLoop', () => ({ default: (p: unknown) => void loop.props.push(p) }))
vi.mock('../hooks/useGameEffects', () => ({ useGameEffects: () => {} }))

import Canvas2DView from './Canvas2DView'

cleanupAfterEach()

const W = 1440
const H = 810
const stage = STAGES[0]
const npc = stage.npcs![0]

function setup(over: { stage?: typeof stage; width?: number; height?: number } = {}) {
  const world = { moveTargetRef: { current: null } } as unknown as World
  const onTrigger = vi.fn()
  const width = over.width ?? W
  const height = over.height ?? H
  const view = renderUI(
    <Canvas2DView
      stage={over.stage ?? stage}
      stageIndex={0}
      canvasWidth={width}
      canvasHeight={height}
      keysRef={{ current: {} }}
      world={world}
      assetsRef={{ current: null }}
      onTrigger={onTrigger}
    />,
    'en'
  )
  const canvas = view.container.querySelector('canvas')!
  // The canvas is shown at half its size, 100 px from the left and 50 from the top of the window.
  canvas.getBoundingClientRect = () => ({ left: 100, top: 50, width: width / 2, height: height / 2, right: 0, bottom: 0, x: 100, y: 50, toJSON: () => {} })
  return { world, onTrigger, canvas, ...view }
}

/** Presses at a place in the game's own coordinates. */
const at = (x: number, y: number) => ({ clientX: 100 + x / 2, clientY: 50 + y / 2 })

beforeEach(() => {
  loop.props.length = 0
  act(() => gameStore.getState().jumpToStage(0))
  gameStore.setState({ phase: 'idle', popup: null, answered: new Set() } as never)
})

describe('Canvas2DView', () => {
  it('is one canvas with the design size, described for screen readers', () => {
    const { canvas } = setup()
    expect(canvas.width).toBe(W)
    expect(canvas.height).toBe(H)
    expect(screen.getByRole('img', { name: /Playing field/ })).toBe(canvas)
  })

  it('follows a phone-shaped canvas', () => {
    const { canvas } = setup({ width: 760, height: 1350 })
    expect(canvas.width).toBe(760)
    expect(canvas.height).toBe(1350)
  })

  it('runs the game loop on its canvas with the stage and size', () => {
    const { canvas, onTrigger } = setup()
    const p = loop.props.at(-1) as Record<string, unknown>
    expect((p.canvasRef as { current: unknown }).current).toBe(canvas)
    expect(p.stage).toBe(stage)
    expect(p.canvasWidth).toBe(W)
    expect(p.canvasHeight).toBe(H)
    expect(p.onTrigger).toBe(onTrigger)
  })

  describe('tapping', () => {
    it('on an empty spot sends the unicorn walking there (the tap is turned into game coordinates)', () => {
      const { canvas, world } = setup()
      fireEvent.pointerDown(canvas, at(37, 61))
      expect(world.moveTargetRef.current!.x).toBeCloseTo(37)
      expect(world.moveTargetRef.current!.y).toBeCloseTo(61)
    })

    it('on a unicorn walks to it and talks when she arrives', () => {
      const { canvas, world, onTrigger } = setup()
      fireEvent.pointerDown(canvas, at(npc.x + 10, npc.y - 20))
      const target = world.moveTargetRef.current!
      expect(target).toMatchObject({ x: npc.x, y: npc.y, radius: npc.talkRadius ?? 80 })
      expect(onTrigger).not.toHaveBeenCalled()
      target.onArrive!()
      expect(onTrigger).toHaveBeenCalledWith('npc', npc.id)
    })

    it('a bit outside the picture is just a spot on the floor', () => {
      const { canvas, world } = setup()
      fireEvent.pointerDown(canvas, at(npc.x + 150 + 40, npc.y))
      expect(world.moveTargetRef.current).not.toHaveProperty('onArrive')
    })

    it('the tap area grows with the bigger pictures of a phone screen', () => {
      const phone = STAGES[0]
      const { canvas, world } = setup({ stage: phone, width: 760, height: 1350 })
      const n = phone.npcs![0]
      // 210 px figures: 105 + 12 around the middle
      fireEvent.pointerDown(canvas, at(n.x + 110, n.y))
      expect(world.moveTargetRef.current).toMatchObject({ x: n.x, y: n.y })
    })

    it('a unicorn that was answered is no longer tapped: it is only floor', () => {
      gameStore.setState({ answered: new Set([npc.id]) } as never)
      const { canvas, world } = setup()
      fireEvent.pointerDown(canvas, at(npc.x, npc.y))
      expect(world.moveTargetRef.current!.x).toBeCloseTo(npc.x)
      expect(world.moveTargetRef.current!.y).toBeCloseTo(npc.y)
      expect(world.moveTargetRef.current).not.toHaveProperty('onArrive')
    })

    it.each(['talking', 'asking'])('does nothing while the game is %s', (phase) => {
      gameStore.setState({ phase } as never)
      const { canvas, world } = setup()
      fireEvent.pointerDown(canvas, at(50, 50))
      expect(world.moveTargetRef.current).toBeNull()
    })

    it('does nothing while a popup is up', () => {
      gameStore.setState({ popup: { id: 'WIN', token: 1 } } as never)
      const { canvas, world } = setup()
      fireEvent.pointerDown(canvas, at(50, 50))
      expect(world.moveTargetRef.current).toBeNull()
    })
  })

  describe('pointing (a mouse only)', () => {
    const hovered = () => (loop.props.at(-1) as { hoveredNpcRef: { current: string | null } }).hoveredNpcRef

    it('remembers which unicorn is under the mouse', () => {
      const { canvas } = setup()
      fireEvent.pointerMove(canvas, { ...at(npc.x, npc.y), pointerType: 'mouse' })
      expect(hovered().current).toBe(npc.id)
    })

    it('forgets it when the mouse moves away or leaves the picture', () => {
      const { canvas } = setup()
      fireEvent.pointerMove(canvas, { ...at(npc.x, npc.y), pointerType: 'mouse' })
      fireEvent.pointerMove(canvas, { ...at(1, 1), pointerType: 'mouse' })
      expect(hovered().current).toBeNull()
      fireEvent.pointerMove(canvas, { ...at(npc.x, npc.y), pointerType: 'mouse' })
      fireEvent.pointerLeave(canvas)
      expect(hovered().current).toBeNull()
    })

    it('a finger does not "hover"', () => {
      const { canvas } = setup()
      fireEvent.pointerMove(canvas, { ...at(npc.x, npc.y), pointerType: 'touch' })
      expect(hovered().current).toBeNull()
    })

    it('does not point at a unicorn that has been answered', () => {
      gameStore.setState({ answered: new Set([npc.id]) } as never)
      const { canvas } = setup()
      fireEvent.pointerMove(canvas, { ...at(npc.x, npc.y), pointerType: 'mouse' })
      expect(hovered().current).toBeNull()
    })
  })
})
