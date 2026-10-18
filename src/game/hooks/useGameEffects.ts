import { useEffect, type MutableRefObject } from 'react'
import { gameStore } from '../logic/gameStore.instance'
import { soundForTransition } from '../audio/soundForTransition'
import { playSfx } from '../audio/sfx'
import { spawnSparkles, type Particle } from '../engine/particles'
import { CONFETTI_COLORS } from '../utils/confetti'
import { prefersReducedMotion } from '../utils/prefersReducedMotion'
import type { StageConfig } from '../types'

/**
 * Reacts to game-state changes with sound effects and an on-canvas sparkle
 * burst over the unicorn that was just answered. Pure view-side feedback:
 * it only reads state and never dispatches.
 */
export function useGameEffects(
  stageRef: MutableRefObject<StageConfig>,
  particlesRef: MutableRefObject<Particle[]>
) {
  useEffect(() => {
    return gameStore.subscribe((next, prev) => {
      const sfx = soundForTransition(prev, next)
      // The stage card plays its own whoosh when it appears.
      if (sfx && sfx !== 'stage') playSfx(sfx)

      const newWin =
        next.popup?.id === 'WIN' && next.popup.token !== prev.popup?.token
      if (newWin && prev.activeQuestion && !prefersReducedMotion()) {
        // The store updates before React re-renders, so stageRef still holds
        // the stage the answered unicorn lives in.
        const npc = stageRef.current.npcs?.find(
          (n) => n.id === prev.activeQuestion?.id
        )
        if (npc) {
          particlesRef.current = particlesRef.current.concat(
            spawnSparkles(npc.x, npc.y, CONFETTI_COLORS)
          )
        }
      }
    })
  }, [stageRef, particlesRef])
}
