import { useState, useCallback, useEffect } from 'react'
import { STAGES } from '../constants/stages'

type NavigationHookProps = {
  setStageIndex: (index: number) => void
  currentStageIndex: number
}

export function useDevNavigation({
  setStageIndex,
  currentStageIndex,
}: NavigationHookProps) {
  const [jumpInput, setJumpInput] = useState<string>('')

  const nextStage = useCallback(() => {
    setStageIndex(Math.min(currentStageIndex + 1, STAGES.length - 1))
  }, [currentStageIndex, setStageIndex])

  const prevStage = useCallback(() => {
    setStageIndex(Math.max(currentStageIndex - 1, 0))
  }, [currentStageIndex, setStageIndex])

  const jumpToStageNumber = useCallback(
    (oneBased: number) => {
      const idx = Math.max(0, Math.min(oneBased - 1, STAGES.length - 1))
      setStageIndex(idx)
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
