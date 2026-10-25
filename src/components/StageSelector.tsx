import type { StageConfig } from '../game/types'
import { useT } from '../game/i18n/useT'
import { useGame } from '../game/logic/gameStore.instance'
import { requiredAnswers } from '../game/logic/classProgress'
import { difficultyText, subjectText } from '../game/i18n/phrases'

type StageSelectorProps = {
  stageIndex: number
  stage: StageConfig
  totalStages: number
  jumpInput: string
  setJumpInput: (value: string) => void
  handleJumpSubmit: () => void
  nextStage: () => void
  prevStage: () => void
  nextQuestion: () => void
  prevQuestion: () => void
}

export default function StageSelector({
  stageIndex,
  stage,
  totalStages,
  jumpInput,
  setJumpInput,
  handleJumpSubmit,
  nextStage,
  prevStage,
  nextQuestion,
  prevQuestion,
}: StageSelectorProps) {
  const { t } = useT()
  const answered = useGame((g) => g.answered.size)
  const required = stage ? requiredAnswers(stage) : 0
  return (
    <div className="stage-selector-panel">
      <span className="stage-selector-title">{t('selector.title')}</span>

      <button
        onClick={prevStage}
        className="stage-selector-btn"
        aria-label={t('selector.prev')}
      >
        ◀
      </button>

      <span className="stage-selector-current">
        {`${stageIndex + 1} / ${totalStages} — ${stage ? subjectText(t, stage.subject) : ''} (${stage ? difficultyText(t, stage.difficulty) : ''})`}
      </span>

      <button
        onClick={nextStage}
        className="stage-selector-btn"
        aria-label={t('selector.next')}
      >
        ▶
      </button>

      <button onClick={prevQuestion} className="stage-selector-btn" aria-label={t('selector.prevQuestion')}>
        ◀
      </button>

      <span className="stage-selector-current stage-selector-question">
        {`${t('selector.question')} ${Math.min(answered + 1, required)} / ${required}`}
      </span>

      <button onClick={nextQuestion} className="stage-selector-btn" aria-label={t('selector.nextQuestion')}>
        ▶
      </button>

      <input
        type='number'
        min={1}
        max={totalStages}
        value={jumpInput}
        onChange={(e) => setJumpInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleJumpSubmit()
        }}
        placeholder={t('selector.placeholder')}
        className="stage-selector-input"
      />

      <button onClick={handleJumpSubmit} className="stage-selector-btn">
        {t('selector.go')}
      </button>
    </div>
  )
}
