import { useState, useCallback, useEffect } from 'react'
import { STAGES } from '../constants/stages'
import { clampStageIndex, isWorldPaused } from '../logic/gameMachine'
import { gameStore } from '../logic/gameStore.instance'

type NavigationHookProps = {
  setStageIndex: (index: number) => void
  currentStageIndex: number
}

export { clampStageIndex }

/** Converts a 1-based (human-facing) stage number to a clamped zero-based index. */
export function oneBasedToStageIndex(oneBased: number, total: number): number {
  return clampStageIndex(oneBased - 1, total)
}

export function useDevNavigation({
  setStageIndex,
  currentStageIndex,
}: NavigationHookProps) {
  const [jumpInput, setJumpInput] = useState<string>('')

  const nextStage = useCallback(() => {
    setStageIndex(clampStageIndex(currentStageIndex + 1, STAGES.length))
  }, [currentStageIndex, setStageIndex])

  const prevStage = useCallback(() => {
    setStageIndex(clampStageIndex(currentStageIndex - 1, STAGES.length))
  }, [currentStageIndex, setStageIndex])

  const jumpToStageNumber = useCallback(
    (oneBased: number) => {
      setStageIndex(oneBasedToStageIndex(oneBased, STAGES.length))
    },
    [setStageIndex]
  )

  const handleJumpSubmit = useCallback(() => {
    const n = parseInt(jumpInput, 10)
    if (Number.isFinite(n)) {
      jumpToStageNumber(n)
    }
    // Clear input after submitting
    setJumpInput('')
  }, [jumpInput, jumpToStageNumber])

  // keyboard shortcuts for dev (1 => next, 2 => prev)
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const active = document.activeElement
      if (
        active &&
        (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA')
      ) {
        return
      }

      // Don't jump stages while a conversation or question is open.
      if (isWorldPaused(gameStore.getState().phase)) return

      if (e.key === '1') {
        nextStage()
      } else if (e.key === '2') {
        prevStage()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [nextStage, prevStage])

  return {
    jumpInput,
    setJumpInput,
    handleJumpSubmit,
    nextStage,
    prevStage,
    jumpToStageNumber,
    totalStages: STAGES.length,
  }
}
