import { useMemo } from 'react'
import { buildStages } from '../constants/stages'
import { useDevNavigation } from './useDevNavigation'
import { useCanvasSize } from './useCanvasSize'
import { gameStore, useGame } from '../logic/gameStore.instance'
import type { StageConfig } from '../types'

export function useStageController() {
  const stageIndex = useGame((s) => s.stageIndex)

  const { width: canvasWidth, height: canvasHeight } = useCanvasSize()

  // NPC positions depend on the actual canvas size (landscape vs portrait),
  // so the live stage list is rebuilt only when that size changes.
  const liveStages = useMemo(
    () => buildStages(canvasWidth, canvasHeight),
    [canvasWidth, canvasHeight]
  )
  const stage: StageConfig = liveStages[stageIndex]

  const nav = useDevNavigation({
    setStageIndex: gameStore.getState().jumpToStage,
    currentStageIndex: stageIndex,
  })

  return {
    stageIndex,
    stage,
    canvasWidth,
    canvasHeight,
    ...nav,
  }
}
