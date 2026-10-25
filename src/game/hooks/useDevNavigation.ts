import { useState, useCallback, useEffect } from 'react'
import { STAGES } from '../constants/stages'
import { clampStageIndex, isWorldPaused } from '../logic/gameMachine'
import { requiredAnswers } from '../logic/classProgress'
import { stepQuestion } from '../logic/devJump'
import { gameStore } from '../logic/gameStore.instance'
import { placeStore } from '../places/placeStore'
import { devToolsEnabled } from '../utils/devTools'

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

  /** Moves inside the class: `delta` questions on (or back), the classes before it finished. */
  const stepInClass = useCallback(
    (delta: number) => {
      const { stageIndex, answered, devJump } = gameStore.getState()
      devJump(stageIndex, stepQuestion(answered.size, requiredAnswers(STAGES[stageIndex]), delta))
    },
    []
  )
  const nextQuestion = useCallback(() => stepInClass(1), [stepInClass])
  const prevQuestion = useCallback(() => stepInClass(-1), [stepInClass])

  const handleJumpSubmit = useCallback(() => {
    const n = parseInt(jumpInput, 10)
    if (Number.isFinite(n)) {
      jumpToStageNumber(n)
    }
    // Clear input after submitting
    setJumpInput('')
  }, [jumpInput, jumpToStageNumber])

  // keyboard shortcuts for dev (1 => next class, 2 => previous class, 3 => next question, 4 => previous question)
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      // The keys skip classes: only for the developers (see devToolsEnabled).
      if (!devToolsEnabled()) return
      const active = document.activeElement
      if (
        active &&
        (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA')
      ) {
        return
      }

      // Don't jump stages while a conversation or question is open.
      if (isWorldPaused(gameStore.getState().phase)) return

      // In the yard and the library the number keys answer a friend (see PlaceTalk), they do not change the stage.
      if (placeStore.getState().place !== 'class') return

      if (e.key === '1') {
        nextStage()
      } else if (e.key === '2') {
        prevStage()
      } else if (e.key === '3') {
        nextQuestion()
      } else if (e.key === '4') {
        prevQuestion()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [nextStage, prevStage, nextQuestion, prevQuestion])

  return {
    jumpInput,
    setJumpInput,
    handleJumpSubmit,
    nextStage,
    prevStage,
    nextQuestion,
    prevQuestion,
    jumpToStageNumber,
    totalStages: STAGES.length,
  }
}
