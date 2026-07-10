import {
  useEffect,
  useRef,
  useState,
  useCallback,
  type JSX,
  type PointerEvent,
} from 'react'
import QuestionOverlay from './QuestionOverlay'
import useKeys from './hooks/useKeys'
import useGameLoop from './hooks/useGameLoop'
import useAudioManager from './hooks/useAudio'
import { useGameActions } from './hooks/useGameActions'
import { loadImageAssets, loadAudioAssets } from './utils/loader'
import type { LoaderAudioAssets, LoaderImageAssets, MoveTarget } from './types'
import type { StageConfig, Player } from './types'
import { type PopupConfig } from './config/PopupsConfig'
import PopupOverlay from './PopupOverlay'
import { HEIGHT, WIDTH } from './constants/dimensions'
import { getActivePrompt } from './utils/getActivePrompt'
import { findNpcAtPoint } from './utils/hitTest'
import { SoundButton } from './components/SoundButton'
import { MoveControls } from './components/MoveControls'

type GameCanvasProps = {
  stage: StageConfig
  stageIndex: number
  setStageIndex: (index: number) => void
}

export default function GameCanvas({
  stage,
  stageIndex,
  setStageIndex,
}: GameCanvasProps): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const keysRef = useKeys()

  const answeredRef = useRef(new Set<string>())
  const [questionKey, setQuestionKey] = useState<{
    kind: 'gate' | 'npc'
    id: string
  } | null>(null)

  const [activePopupConfig, setActivePopupConfig] =
    useState<PopupConfig | null>(null)

  const playerRef = useRef<Player>({ x: 60, y: 320, w: 56, h: 56, speed: 210 })
  const assetsRef = useRef<LoaderImageAssets | null>(null)
  const audioRef = useRef<LoaderAudioAssets | null>(null)
  const moveTargetRef = useRef<MoveTarget | null>(null)
  const [assetsLoaded, setAssetsLoaded] = useState(false)

  useEffect(() => {
    answeredRef.current.clear()
    moveTargetRef.current = null
  }, [stageIndex])

  // load assets
  useEffect(() => {
    let cancelled = false
    loadImageAssets()
      .then((imgs) => {
        if (cancelled) return
        assetsRef.current = imgs
        if (imgs.player1) {
          const img = imgs.player1
          playerRef.current.w = Math.round(img.width / 4)
          playerRef.current.h = Math.round(img.height / 4)
        }
        audioRef.current = loadAudioAssets()
        setAssetsLoaded(true)
      })
      .catch(console.warn)
    return () => {
      cancelled = true
    }
  }, [])

  const { enableAudioNow } = useAudioManager({
    audioRef,
    stage,
    assetsLoaded,
  })

  const onTrigger = useCallback(
    (kind: 'gate' | 'npc', id: string) => {
      setQuestionKey({ kind, id })
      if (keysRef.current) {
        // consume the keys so the same press can't re-trigger the prompt
        keysRef.current['e'] = false
        keysRef.current['enter'] = false
      }
    },
    [keysRef]
  )

  useGameLoop({
    canvasRef,
    keysRef,
    stage,
    playerRef,
    answeredRef,
    assetsRef,
    moveTargetRef,
    questionKey,
    onTrigger,
    deps: [stageIndex],
  })

  // Click/tap on the canvas: walk to an NPC (and auto-open its question on
  // arrival) or just walk to the tapped spot. Keyboard/D-pad input cancels it.
  const handleCanvasPointerDown = useCallback(
    (e: PointerEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current
      if (!canvas || questionKey || activePopupConfig) return

      const rect = canvas.getBoundingClientRect()
      const x = ((e.clientX - rect.left) / rect.width) * WIDTH
      const y = ((e.clientY - rect.top) / rect.height) * HEIGHT

      const npc = findNpcAtPoint(stage.npcs ?? [], x, y, answeredRef.current)

      moveTargetRef.current = npc
        ? {
            x: npc.x,
            y: npc.y,
            radius: npc.talkRadius ?? 80,
            onArrive: () => onTrigger('npc', npc.id),
          }
        : { x, y }
    },
    [stage, questionKey, activePopupConfig, onTrigger]
  )

  const { resolveQuestion } = useGameActions({
    stage,
    stageIndex,
    keysRef,
    questionKey,
    answeredRef,
    setQuestionKey,
    setActivePopupConfig,
    setStageIndex,
  })

  const activePrompt = getActivePrompt(questionKey, stage)

  const assets = assetsRef.current || ({} as LoaderImageAssets)

  return (
    <div
      className="game-frame"
      style={{
        position: 'relative',
        width: WIDTH,
        maxWidth: '98vw',
        margin: '16px auto',
        overflow: 'hidden',
      }}
    >
      <SoundButton onClick={enableAudioNow} />
      <canvas
        ref={canvasRef}
        width={WIDTH}
        height={HEIGHT}
        onPointerDown={handleCanvasPointerDown}
      />
      <MoveControls keysRef={keysRef} moveTargetRef={moveTargetRef} />
      {activePrompt && (
        <QuestionOverlay
          prompt={activePrompt.prompt}
          choices={activePrompt.choices}
          onPick={resolveQuestion}
        />
      )}
      {activePopupConfig && assetsLoaded && (
        <PopupOverlay
          assets={assets}
          config={activePopupConfig}
          onClose={() => setActivePopupConfig(null)}
        />
      )}
    </div>
  )
}
