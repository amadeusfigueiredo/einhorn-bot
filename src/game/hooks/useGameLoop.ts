import { useEffect, useRef } from 'react'
import { stepWorld, type World } from '../logic/world'
import { drawScene } from '../engine/drawScene'
import type { Keys, LoaderImageAssets } from '../types'
import type { StageConfig } from '../types'
import { gameStore } from '../logic/gameStore.instance'
import { isWorldPaused } from '../logic/gameMachine'
import { stepParticles, type Particle } from '../engine/particles'
import { smoothToward } from '../utils/smooth'
import { prefersReducedMotion } from '../utils/prefersReducedMotion'
import { languageSettings } from '../i18n/language'
import { profileStore } from '../player/playerName'
import { isTransitioning } from '../transition/transitionStore'
import { isIntroPlaying } from '../intro/introStore'
import { isStartMenuOpen } from '../start/startStore'
import { isPaused } from '../pause/pauseStore'
import { outfitSettings } from '../player/outfitSettings'

type Params = {
  canvasRef: React.RefObject<HTMLCanvasElement | null>
  keysRef: React.RefObject<Keys>
  stage: StageConfig
  world: World
  assetsRef: React.RefObject<LoaderImageAssets | null>
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
  world,
  assetsRef,
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
    const display = { x: world.player.x, y: world.player.y }
    const startTime = performance.now()
    lastRef.current = startTime

    function step(t: number) {
      const last = lastRef.current ?? t
      const dt = Math.min((t - last) / 1000, 0.05)
      lastRef.current = t

      // Paused: nothing moves and nothing is drawn again, until the child goes on.
      if (isPaused()) {
        raf = requestAnimationFrame(step)
        return
      }

      // The world freezes while a conversation or question is open.
      const game = gameStore.getState()
      if (!isWorldPaused(game.phase) && !profileStore.getState().modalOpen && !isTransitioning() && !isIntroPlaying() && !isStartMenuOpen()) {
        stepWorld(world, {
          dt,
          keys: keysRef.current ?? {},
          stage,
          answered: game.answered,
          onTrigger,
          canvasWidth,
          canvasHeight,
        })
      }

      // The sprite eases toward the logical position instead of snapping to it.
      const player = world.player
      display.x = reduceMotion ? player.x : smoothToward(display.x, player.x, dt)
      display.y = reduceMotion ? player.y : smoothToward(display.y, player.y, dt)
      particlesRef.current = stepParticles(particlesRef.current, dt)

      // draw always
      drawScene(
        ctx!,
        stage,
        world.player,
        game.answered,
        assetsRef.current ?? undefined,
        {
          t: (t - startTime) / 1000,
          motion: world.motionRef.current,
          hoveredNpcId: hoveredNpcRef.current,
          playerDisplay: display,
          particles: particlesRef.current,
          reduceMotion,
          lang: languageSettings.getState().lang,
          outfit: outfitSettings.getState(),
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
