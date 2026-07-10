import type { StageConfig } from '../game/types'

type StageSelectorProps = {
  stageIndex: number
  stage: StageConfig
  totalStages: number
  jumpInput: string
  setJumpInput: (value: string) => void
  handleJumpSubmit: () => void
  nextStage: () => void
  prevStage: () => void
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
}: StageSelectorProps) {
  return (
    <div className="stage-selector-panel">
      <span className="stage-selector-title">✨ Stufe</span>

      <button
        onClick={prevStage}
        className="stage-selector-btn"
        aria-label="Vorherige Stufe"
      >
        ◀
      </button>

      <span className="stage-selector-current">
        {`${stageIndex + 1} / ${totalStages} — ${stage?.name ?? ''}`}
      </span>

      <button
        onClick={nextStage}
        className="stage-selector-btn"
        aria-label="Nächste Stufe"
      >
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
        placeholder='Stufe #'
        className="stage-selector-input"
      />

      <button onClick={handleJumpSubmit} className="stage-selector-btn">
        Los!
      </button>
    </div>
  )
}
