import { useState } from 'react'
import { StartMenu } from './game/start/StartMenu'
import { startStore, useStartActive } from './game/start/startStore'
import { Header } from './game/components/Header'
import GameShell from './game/GameShell'
import StageSelector from './components/StageSelector'
import { useStageController } from './game/hooks/useStageController'
import { introStore } from './game/intro/introStore'
import { devToolsEnabled } from './game/utils/devTools'
import { useDevJump } from './game/hooks/useDevJump'

export default function App() {
  const {
    stage,
    stageIndex,
    canvasWidth,
    canvasHeight,
    jumpInput,
    setJumpInput,
    handleJumpSubmit,
    nextStage,
    prevStage,
    nextQuestion,
    prevQuestion,
    totalStages,
  } = useStageController()

  // `?stage=5&left=1` in the address (developers only): into class 5 with one question left.
  useDevJump()

  const startActive = useStartActive()
  // The buttons around the game are drawn by GameShell, into this slot of the top bar.
  const [controlsSlot, setControlsSlot] = useState<HTMLElement | null>(null)

  return (
    <div className="app-shell">
      <div className="top-bar">
        <Header />
        <div className="top-controls" ref={setControlsSlot} />
      </div>
      <GameShell
        stage={stage}
        stageIndex={stageIndex}
        canvasWidth={canvasWidth}
        canvasHeight={canvasHeight}
        controlsSlot={controlsSlot}
        stageMenu={
          <>
            {devToolsEnabled() && (
              <StageSelector
                stageIndex={stageIndex}
                stage={stage}
                totalStages={totalStages}
                jumpInput={jumpInput}
                setJumpInput={setJumpInput}
                handleJumpSubmit={handleJumpSubmit}
                nextStage={nextStage}
                prevStage={prevStage}
                nextQuestion={nextQuestion}
                prevQuestion={prevQuestion}
              />
            )}
          </>
        }
      />
      {/* The menu is first, every time. The intro (first visit, or asked for) comes after it. */}
      {startActive && (
        <StartMenu
          onStart={() => {
            startStore.getState().close()
            // The 2D game has no intro film: the welcome card follows the menu.
            introStore.getState().finish()
          }}
        />
      )}
    </div>
  )
}
