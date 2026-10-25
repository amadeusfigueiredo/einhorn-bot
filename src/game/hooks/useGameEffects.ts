import { useCallback, useEffect, type MutableRefObject } from 'react'
import { gameStore } from '../logic/gameStore.instance'
import { soundForTransition, voiceForTransition } from '../audio/soundForTransition'
import { playSfx } from '../audio/sfx'
import { playVoice } from '../audio/voice'
import { spawnSparkles, type Particle } from '../engine/particles'
import { CONFETTI_COLORS } from '../utils/confetti'
import { prefersReducedMotion } from '../utils/prefersReducedMotion'
import type { StageConfig } from '../types'

/** Sound effects for state transitions. Shared by every view. */
export function useSfx() {
  useEffect(() => {
    return gameStore.subscribe((next, prev) => {
      const sfx = soundForTransition(prev, next)
      // The stage card plays its own whoosh when it appears.
      if (sfx && sfx !== 'stage') playSfx(sfx)
      const voice = voiceForTransition(prev, next)
      if (voice) playVoice(voice.name, voice.pitch)
    })
  }, [])
}

/**
 * Calls `onBurst` with the unicorn that was just answered correctly. The
 * store updates before React re-renders, so `stageRef` still holds the stage
 * that unicorn lives in. Pure view-side feedback: never dispatches.
 */
export function useCorrectAnswerBurst(
  stageRef: MutableRefObject<StageConfig>,
  onBurst: (npc: { x: number; y: number }) => void
) {
  useEffect(() => {
    return gameStore.subscribe((next, prev) => {
      const newWin =
        next.popup?.id === 'WIN' && next.popup.token !== prev.popup?.token
      if (newWin && prev.activeQuestion && !prefersReducedMotion()) {
        const npc = stageRef.current.npcs?.find(
          (n) => n.id === prev.activeQuestion?.id
        )
        if (npc) onBurst(npc)
      }
    })
  }, [stageRef, onBurst])
}

/** Canvas sparkles for the 2D view. */
export function useGameEffects(
  stageRef: MutableRefObject<StageConfig>,
  particlesRef: MutableRefObject<Particle[]>
) {
  const onBurst = useCallback(
    (npc: { x: number; y: number }) => {
      particlesRef.current = particlesRef.current.concat(
        spawnSparkles(npc.x, npc.y, CONFETTI_COLORS)
      )
    },
    [particlesRef]
  )
  useCorrectAnswerBurst(stageRef, onBurst)
}
