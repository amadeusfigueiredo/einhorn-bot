import {
  useRef,
  useCallback,
  type JSX,
  type PointerEvent,
} from 'react'
import useGameLoop from '../hooks/useGameLoop'
import { gameStore, useGame } from '../logic/gameStore.instance'
import { isWorldPaused } from '../logic/gameMachine'
import { findNpcAtPoint } from '../utils/hitTest'
import { getFigureSize } from '../utils/npcDisplaySize'
import { useGameEffects } from '../hooks/useGameEffects'
import type { Particle } from '../engine/particles'
import type { ViewProps } from './types'
import { useT } from '../i18n/useT'

/** The original canvas 2D renderer. Reads the store and the shared world. */
export default function Canvas2DView({
  stage,
  stageIndex,
  canvasWidth,
  canvasHeight,
  keysRef,
  world,
  assetsRef,
  onTrigger,
}: ViewProps): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const hoveredNpcRef = useRef<string | null>(null)
  const particlesRef = useRef<Particle[]>([])
  const stageRef = useRef(stage)
  stageRef.current = stage

  const { t } = useT()
  const phase = useGame((g) => g.phase)
  const popup = useGame((g) => g.popup)
  const worldPaused = isWorldPaused(phase)

  useGameEffects(stageRef, particlesRef)

  useGameLoop({
    canvasRef,
    keysRef,
    stage,
    world,
    assetsRef,
    hoveredNpcRef,
    particlesRef,
    onTrigger,
    canvasWidth,
    canvasHeight,
    deps: [stageIndex, canvasWidth, canvasHeight],
  })

  const canvasPointToGameSpace = useCallback(
    (e: PointerEvent<HTMLCanvasElement>) => {
      // The canvas that got the event is the one to measure against.
      const rect = e.currentTarget.getBoundingClientRect()
      return {
        x: ((e.clientX - rect.left) / rect.width) * canvasWidth,
        y: ((e.clientY - rect.top) / rect.height) * canvasHeight,
      }
    },
    [canvasWidth, canvasHeight]
  )

  // Tap hitbox needs to track the portrait's actual on-screen size (bigger
  // on portrait/mobile canvases) or taps near the edge of a big icon miss it.
  const npcHitHalfSize = getFigureSize(canvasWidth, canvasHeight).w / 2 + 12

  // Click/tap on the canvas: walk to an NPC (and auto-open its question on
  // arrival) or just walk to the tapped spot. Keyboard/D-pad input cancels it.
  const handleCanvasPointerDown = useCallback(
    (e: PointerEvent<HTMLCanvasElement>) => {
      if (worldPaused || popup) return
      const point = canvasPointToGameSpace(e)

      const npc = findNpcAtPoint(
        stage.npcs ?? [],
        point.x,
        point.y,
        gameStore.getState().answered,
        npcHitHalfSize
      )

      world.moveTargetRef.current = npc
        ? {
            x: npc.x,
            y: npc.y,
            radius: npc.talkRadius ?? 80,
            onArrive: () => onTrigger('npc', npc.id),
          }
        : point
    },
    [stage, worldPaused, popup, onTrigger, canvasPointToGameSpace, npcHitHalfSize, world]
  )

  // Desktop-only hover highlight: touch devices don't have real hover.
  const handleCanvasPointerMove = useCallback(
    (e: PointerEvent<HTMLCanvasElement>) => {
      if (e.pointerType !== 'mouse') return
      const point = canvasPointToGameSpace(e)
      const npc = findNpcAtPoint(stage.npcs ?? [], point.x, point.y, gameStore.getState().answered, npcHitHalfSize)
      hoveredNpcRef.current = npc?.id ?? null
    },
    [stage, canvasPointToGameSpace, npcHitHalfSize]
  )

  const handleCanvasPointerLeave = useCallback(() => {
    hoveredNpcRef.current = null
  }, [])

  return (
    <canvas
      ref={canvasRef}
      width={canvasWidth}
      height={canvasHeight}
      role="img"
      aria-label={t('field.label2d')}
      onPointerDown={handleCanvasPointerDown}
      onPointerMove={handleCanvasPointerMove}
      onPointerLeave={handleCanvasPointerLeave}
    />
  )
}
