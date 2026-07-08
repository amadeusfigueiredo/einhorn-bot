import { useState } from 'react'
import { STAGES } from '../constants/stages'
import { useDevNavigation } from './useDevNavigation'
import type { StageConfig } from '../types'

export function useStageController() {
  const [stageIndex, setStageIndex] = useState(0)
  const stage: StageConfig = STAGES[stageIndex]

  const nav = useDevNavigation({ setStageIndex, currentStageIndex: stageIndex })

  return {
    stageIndex,
    setStageIndex,
    stage,
    ...nav,
  }
}
