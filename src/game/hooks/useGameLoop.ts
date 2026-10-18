import { useEffect, useRef } from 'react'
import { updateGame } from '../engine/update'
import { drawScene } from '../engine/drawScene'
import type {
  Keys,
  LoaderImageAssets,
  MoveTarget,
  Player,
  PlayerMotion,
} from '../types'
import type { StageConfig } from '../types'
import { gameStore } from '../logic/gameStore.instance'
import { isWorldPaused } from '../logic/gameMachine'
import { stepParticles, type Particle } from '../engine/particles'
import { smoothToward } from '../utils/smooth'
import { prefersReducedMotion } from '../utils/prefersReducedMotion'

type Params = {
  canvasRef: React.RefObject<HTMLCanvasElement | null>
  keysRef: React.RefObject<Keys>
  stage: StageConfig
  playerRef: React.MutableRefObject<Player>
  assetsRef: React.RefObject<LoaderImageAssets | null>
  moveTargetRef: React.MutableRefObject<MoveTarget | null>
  motionRef: React.MutableRefObject<PlayerMotion>
  hoveredNpcRef: React.MutableRefObject<string | null>
  particlesRef: React.MutableRefObject<Particle[]>
  onTrigger: (kind: 'gate' | 'npc', id: string) => void
  canvasWidth: number
  canvasHeight: number
  deps?: unknown[] // extra deps to control effect
}

export default function useGameLoop({
  canvasRef,
  keysRef,
  stage,
  playerRef,
  assetsRef,
  moveTargetRef,
  motionRef,
  hoveredNpcRef,
  particlesRef,
  onTrigger,
  canvasWidth,
  canvasHeight,
  deps = [],
}: Params) {
  // keep last timestamp in ref
  const lastRef = useRef<number | null>(null)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let raf = 0
    const reduceMotion = prefersReducedMotion()
    const display = { x: playerRef.current.x, y: playerRef.current.y }
    const startTime = performance.now()
    lastRef.current = startTime

    function step(t: number) {
      const last = lastRef.current ?? t
      const dt = Math.min((t - last) / 1000, 0.05)
      lastRef.current = t

      // The world freezes while a conversation or question is open.
      const game = gameStore.getState()
      if (!isWorldPaused(game.phase)) {
        updateGame({
          dt,
          keys: keysRef.current ?? {},
          player: playerRef.current,
          stage,
          answered: game.answered,
          onTrigger,
          moveTargetRef,
          motionRef,
          canvasWidth,
          canvasHeight,
        })
      }

      // The sprite eases toward the logical position instead of snapping to it.
      const player = playerRef.current
      display.x = reduceMotion ? player.x : smoothToward(display.x, player.x, dt)
      display.y = reduceMotion ? player.y : smoothToward(display.y, player.y, dt)
      particlesRef.current = stepParticles(particlesRef.current, dt)

      // draw always
      drawScene(
        ctx!,
        stage,
        playerRef.current,
        game.answered,
        assetsRef.current ?? undefined,
        {
          t: (t - startTime) / 1000,
          motion: motionRef.current,
          hoveredNpcId: hoveredNpcRef.current,
          playerDisplay: display,
          particles: particlesRef.current,
          reduceMotion,
          canvasWidth,
          canvasHeight,
        }
      )

      raf = requestAnimationFrame(step)
    }

    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvasRef, stage, canvasWidth, canvasHeight, ...deps])
}
