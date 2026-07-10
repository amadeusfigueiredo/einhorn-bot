import { useMemo, useState } from 'react'
import { STAGES, buildStages } from '../constants/stages'
import { useDevNavigation, clampStageIndex } from './useDevNavigation'
import { useCanvasSize } from './useCanvasSize'
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

  const { width: canvasWidth, height: canvasHeight } = useCanvasSize()

  // NPC positions depend on the actual canvas size (landscape vs portrait),
  // so the live stage list is rebuilt only when that size changes.
  const liveStages = useMemo(
    () => buildStages(canvasWidth, canvasHeight),
    [canvasWidth, canvasHeight]
  )
  const stage: StageConfig = liveStages[stageIndex]

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
    canvasWidth,
    canvasHeight,
    initialAnsweredIds,
    ...nav,
  }
}
