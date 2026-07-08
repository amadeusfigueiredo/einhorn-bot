import type { StageConfig } from '../game/types'

type StagesNavigationProps = {
  enableAudioNow: () => void
  stageIndex: number
  stage: StageConfig
  totalStages: number
  jumpInput: string
  setJumpInput: (value: string) => void
  handleJumpSubmit: () => void
  nextStage: () => void
  prevStage: () => void
}

export default function StagesNavigation({
  enableAudioNow,
  stageIndex,
  stage,
  totalStages,
  jumpInput,
  setJumpInput,
  handleJumpSubmit,
  nextStage,
  prevStage,
}: StagesNavigationProps) {
  return (
    <div
      style={{
        display: 'flex',
        position: 'absolute',
        right: 12,
        top: 12,
        zIndex: 999,
      }}
    >
      <button
        onClick={enableAudioNow}
        className="sparkle-btn"
        style={{
          padding: '6px 10px',
          borderRadius: 10,
          cursor: 'pointer',
          display: 'block',
          border: 'none',
          background: 'linear-gradient(135deg, #ff8ad4, #ffd166)',
          color: '#5a3a86',
          fontWeight: 600,
          fontFamily: "'Fredoka', system-ui, sans-serif",
          boxShadow: '0 2px 8px rgba(138, 92, 246, 0.3)',
          transition: 'transform 0.12s ease',
        }}
      >
        🔊 sound
      </button>

      <div
        className="dev-nav-panel"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          marginTop: 8,
          padding: 10,
          borderRadius: 14,
          boxShadow: '0 4px 14px rgba(138, 92, 246, 0.25)',
          minWidth: 180,
          textAlign: 'center',
        }}
      >
        <div style={{ marginBottom: 6, fontSize: 12, color: '#6d3fc9' }}>
          <strong>✨ Dev Stage Nav</strong>
        </div>

        <div
          style={{
            display: 'flex',
            gap: 6,
            justifyContent: 'center',
            marginBottom: 6,
          }}
        >
          <button
            onClick={prevStage}
            style={{ padding: '6px 10px', borderRadius: 8, cursor: 'pointer' }}
          >
            Prev
          </button>

          <button
            onClick={nextStage}
            style={{ padding: '6px 10px', borderRadius: 8, cursor: 'pointer' }}
          >
            Next
          </button>
        </div>

        <div
          style={{
            display: 'flex',
            gap: 6,
            justifyContent: 'center',
            marginBottom: 6,
          }}
        >
          <input
            type='number'
            min={1}
            max={totalStages}
            value={jumpInput}
            onChange={(e) => setJumpInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleJumpSubmit()
            }}
            placeholder='stage # (1-based)'
            style={{
              padding: '6px',
              width: 90,
              borderRadius: 8,
              border: '1px solid rgba(138, 92, 246, 0.35)',
              fontFamily: 'inherit',
            }}
          />

          <button
            onClick={handleJumpSubmit}
            style={{ padding: '6px 10px', borderRadius: 8, cursor: 'pointer' }}
          >
            Jump
          </button>
        </div>
        <div
          style={{ display: 'flex', flexDirection: 'column', color: '#6d3fc9' }}
        >
          <div style={{ fontSize: 12 }}>
            {`Current: ${stageIndex + 1} / ${totalStages} — ${
              stage?.name ?? ''
            }`}
          </div>

          <div style={{ marginTop: 6, fontSize: 11, opacity: 0.75 }}>
            Press <kbd>1</kbd> next, <kbd>2</kbd> prev
          </div>
        </div>
      </div>
    </div>
  )
}
