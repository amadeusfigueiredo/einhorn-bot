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
      <div className="stage-selector-title">✨ Stufe wählen</div>

      <div className="stage-selector-row">
        <button onClick={prevStage} className="stage-selector-btn">
          ◀ Prev
        </button>

        <button onClick={nextStage} className="stage-selector-btn">
          Next ▶
        </button>
      </div>

      <div className="stage-selector-row">
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

      <div className="stage-selector-current">
        {`${stageIndex + 1} / ${totalStages} — ${stage?.name ?? ''}`}
      </div>
    </div>
  )
}
