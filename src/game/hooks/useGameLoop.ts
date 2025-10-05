import { useEffect, useRef } from 'react'
import type { Player } from '../engine/update'
import { updateGame } from '../engine/update'
import { drawScene } from '../engine/draw'
import type { Keys } from '../types'
import type { StageConfig } from '../types'
import type { Assets } from '../utils/loader'

type Params = {
  canvasRef: React.RefObject<HTMLCanvasElement | null>
  keysRef: React.RefObject<Keys>
  stage: StageConfig
  playerRef: React.MutableRefObject<Player>
  answeredRef: React.MutableRefObject<Set<string>>
  assetsRef: React.RefObject<Assets | null>
  questionKey: { kind: 'gate' | 'npc'; id: string } | null
  onTrigger: (kind: 'gate' | 'npc', id: string) => void
  deps?: unknown[] // extra deps to control effect
}

export default function useGameLoop({
  canvasRef,
  keysRef,
  stage,
  playerRef,
  answeredRef,
  assetsRef,
  questionKey,
  onTrigger,
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
    lastRef.current = performance.now()

    function step(t: number) {
      const last = lastRef.current ?? t
      const dt = Math.min((t - last) / 1000, 0.05)
      lastRef.current = t

      // call update only when we don't have an active question overlay
      if (!questionKey) {
        updateGame({
          dt,
          keys: keysRef.current ?? {},
          player: playerRef.current,
          stage,
          answered: answeredRef.current,
          onTrigger,
        })
      }

      // draw always
      drawScene(
        ctx,
        stage,
        playerRef.current,
        answeredRef.current,
        assetsRef.current ?? undefined
      )

      raf = requestAnimationFrame(step)
    }

    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvasRef, stage, questionKey, ...deps])
}
