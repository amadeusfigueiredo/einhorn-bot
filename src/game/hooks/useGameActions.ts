import { useCallback } from 'react'
import type { MutableRefObject } from 'react'
import type { StageConfig, Keys } from '../types'
import type { PopupConfig } from '../config/PopupsConfig'
import { POPUP_CONFIGS } from '../config/PopupsConfig'
import { STAGES } from '../constants/stages' // Assuming STAGES constant file location

type GameActionsHookProps = {
  stage: StageConfig
  stageIndex: number
  keysRef: MutableRefObject<Keys | undefined>
  questionKey: { kind: 'gate' | 'npc'; id: string } | null
  answeredRef: MutableRefObject<Set<string>>
  setQuestionKey: (key: { kind: 'gate' | 'npc'; id: string } | null) => void
  setActivePopupConfig: (config: PopupConfig | null) => void
  setStageIndex: (index: number) => void
}

export function useGameActions({
  stage,
  stageIndex,
  keysRef,
  questionKey,
  answeredRef,
  setQuestionKey,
  setActivePopupConfig,
  setStageIndex,
}: GameActionsHookProps) {
  // 1. Helper for showing timed popups (includes E-key reset fix)
  const showTimedPopup = useCallback(
    (config: PopupConfig) => {
      setActivePopupConfig(config)
      if (config.durationMs !== null) {
        setTimeout(() => {
          setActivePopupConfig(null)
          // KORREKTUR FÜR 'E'-TASTE: Setzt E und Enter zurück, nachdem das Popup geschlossen wurde
          if (keysRef.current) {
            keysRef.current['e'] = false
            keysRef.current['enter'] = false
          }
        }, config.durationMs)
      }
    },
    [setActivePopupConfig, keysRef]
  )

  // 2. Core Question Resolution Logic
  const resolveQuestion = useCallback(
    (pickedIndex: number) => {
      if (!questionKey) return
      let isCorrect = false

      // Determine correctness and update answered set
      const currentStagesList =
        questionKey.kind === 'gate' ? stage.gates ?? [] : stage.npcs ?? []
      const currentItem = currentStagesList.find(
        (x) => x.id === questionKey.id
      )

      if (currentItem && pickedIndex === currentItem.question.correctIndex) {
        answeredRef.current.add(questionKey.id)
        isCorrect = true
      }

      setQuestionKey(null) // Close the Question Overlay

      if (isCorrect) {
        showTimedPopup(POPUP_CONFIGS.WIN)

        const total = (stage.gates ?? []).length + (stage.npcs ?? []).length
        const must = stage.requiredToAdvance ?? total

        const isLastStage = stageIndex === STAGES.length - 1
        const isComplete = answeredRef.current.size >= must

        if (isComplete) {
          if (isLastStage) {
            // Game End: Show GAME_END popup after WIN popup finishes
            setTimeout(() => {
              setActivePopupConfig(POPUP_CONFIGS.GAME_END)
            }, POPUP_CONFIGS.WIN.durationMs ?? 0)
          } else {
            // Stage Advance: Go to next stage
            const nextStageName = stage.nextStage
            if (nextStageName) {
              const idx = STAGES.findIndex((s: any) => s.name === nextStageName)
              if (idx >= 0) setStageIndex(idx)
            }
          }
        }
      } else {
        // Incorrect Answer
        showTimedPopup(POPUP_CONFIGS.TRY_AGAIN)
      }
    },
    [
      questionKey,
      stage,
      answeredRef,
      setQuestionKey,
      showTimedPopup,
      stageIndex,
      setStageIndex,
      setActivePopupConfig,
    ]
  )

  return { resolveQuestion }
}
