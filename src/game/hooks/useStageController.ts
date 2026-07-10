import { useState } from 'react'
import { STAGES } from '../constants/stages'
import { useDevNavigation, clampStageIndex } from './useDevNavigation'
import { loadProgress } from '../utils/progressStorage'
import type { StageConfig } from '../types'

export function useStageController() {
  // Read once, at mount: the saved stage (and, if it still matches, which
  // NPCs were already answered there) so a reload picks up where you left off.
  const [initialProgress] = useState(() =>
    loadProgress(typeof window === 'undefined' ? null : window.localStorage)
  )

  const [stageIndex, setStageIndex] = useState(() =>
    clampStageIndex(initialProgress?.stageIndex ?? 0, STAGES.length)
  )
  const stage: StageConfig = STAGES[stageIndex]

  const [initialAnsweredIds] = useState<string[]>(() =>
    initialProgress &&
    clampStageIndex(initialProgress.stageIndex, STAGES.length) === stageIndex
      ? initialProgress.answeredIds
      : []
  )

  const nav = useDevNavigation({ setStageIndex, currentStageIndex: stageIndex })

  return {
    stageIndex,
    setStageIndex,
    stage,
    initialAnsweredIds,
    ...nav,
  }
}
