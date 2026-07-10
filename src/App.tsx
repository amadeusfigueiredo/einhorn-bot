import { Header } from './game/components/Header'
import GameCanvas from './game/GameCanvas'
import StageSelector from './components/StageSelector'
import { useStageController } from './game/hooks/useStageController'

export default function App() {
  const {
    stage,
    stageIndex,
    setStageIndex,
    canvasWidth,
    canvasHeight,
    initialAnsweredIds,
    jumpInput,
    setJumpInput,
    handleJumpSubmit,
    nextStage,
    prevStage,
    totalStages,
  } = useStageController()

  return (
    <div className="app-shell">
      <div className="top-bar">
        <Header />
        <StageSelector
          stageIndex={stageIndex}
          stage={stage}
          totalStages={totalStages}
          jumpInput={jumpInput}
          setJumpInput={setJumpInput}
          handleJumpSubmit={handleJumpSubmit}
          nextStage={nextStage}
          prevStage={prevStage}
        />
      </div>
      <GameCanvas
        stage={stage}
        stageIndex={stageIndex}
        setStageIndex={setStageIndex}
        canvasWidth={canvasWidth}
        canvasHeight={canvasHeight}
        initialAnsweredIds={initialAnsweredIds}
      />
    </div>
  )
}
