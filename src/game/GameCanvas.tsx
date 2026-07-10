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
import type {
  LoaderAudioAssets,
  LoaderImageAssets,
  MoveTarget,
  PlayerMotion,
} from './types'
import type { StageConfig, Player } from './types'
import { type PopupConfig } from './config/PopupsConfig'
import PopupOverlay from './PopupOverlay'
import { HEIGHT, WIDTH } from './constants/dimensions'
import { getActivePrompt } from './utils/getActivePrompt'
import { findNpcAtPoint } from './utils/hitTest'
import { computePlayerSize } from './utils/playerSize'
import { saveProgress } from './utils/progressStorage'
import { SoundButton } from './components/SoundButton'
import { MoveControls } from './components/MoveControls'

type GameCanvasProps = {
  stage: StageConfig
  stageIndex: number
  setStageIndex: (index: number) => void
  /** NPCs already answered in this stage, restored from a previous session. */
  initialAnsweredIds: string[]
}

export default function GameCanvas({
  stage,
  stageIndex,
  setStageIndex,
  initialAnsweredIds,
}: GameCanvasProps): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const keysRef = useKeys()

  const answeredRef = useRef(new Set<string>(initialAnsweredIds))
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
  const motionRef = useRef<PlayerMotion>({ moving: false, facingLeft: false })
  const hoveredNpcRef = useRef<string | null>(null)
  const [assetsLoaded, setAssetsLoaded] = useState(false)

  // Only react to a *real* stageIndex change, not the initial mount: on
  // mount, stageIndex/answeredRef already hold whatever we just restored
  // from storage, and clearing them here would wipe out that progress.
  // (A plain "have we mounted yet" boolean isn't enough - React's dev
  // StrictMode intentionally re-runs the mount effect once, which would
  // flip that boolean and wipe the restored progress on the replay.)
  const lastHandledStageIndexRef = useRef(stageIndex)
  useEffect(() => {
    if (lastHandledStageIndexRef.current === stageIndex) return
    lastHandledStageIndexRef.current = stageIndex

    answeredRef.current.clear()
    moveTargetRef.current = null
    saveProgress(window.localStorage, { stageIndex, answeredIds: [] })
  }, [stageIndex])

  // load assets
  useEffect(() => {
    let cancelled = false
    loadImageAssets()
      .then((imgs) => {
        if (cancelled) return
        assetsRef.current = imgs
        if (imgs.player1) {
          const { w, h } = computePlayerSize(imgs.player1)
          playerRef.current.w = w
          playerRef.current.h = h
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
    motionRef,
    hoveredNpcRef,
    questionKey,
    onTrigger,
    deps: [stageIndex],
  })

  const canvasPointToGameSpace = useCallback((e: PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return null
    const rect = canvas.getBoundingClientRect()
    return {
      x: ((e.clientX - rect.left) / rect.width) * WIDTH,
      y: ((e.clientY - rect.top) / rect.height) * HEIGHT,
    }
  }, [])

  // Click/tap on the canvas: walk to an NPC (and auto-open its question on
  // arrival) or just walk to the tapped spot. Keyboard/D-pad input cancels it.
  const handleCanvasPointerDown = useCallback(
    (e: PointerEvent<HTMLCanvasElement>) => {
      if (questionKey || activePopupConfig) return
      const point = canvasPointToGameSpace(e)
      if (!point) return

      const npc = findNpcAtPoint(
        stage.npcs ?? [],
        point.x,
        point.y,
        answeredRef.current
      )

      moveTargetRef.current = npc
        ? {
            x: npc.x,
            y: npc.y,
            radius: npc.talkRadius ?? 80,
            onArrive: () => onTrigger('npc', npc.id),
          }
        : point
    },
    [stage, questionKey, activePopupConfig, onTrigger, canvasPointToGameSpace]
  )

  // Desktop-only hover highlight: touch devices don't have real hover, so we
  // only track it for mouse pointers.
  const handleCanvasPointerMove = useCallback(
    (e: PointerEvent<HTMLCanvasElement>) => {
      if (e.pointerType !== 'mouse') return
      const point = canvasPointToGameSpace(e)
      const npc = point
        ? findNpcAtPoint(stage.npcs ?? [], point.x, point.y, answeredRef.current)
        : undefined
      hoveredNpcRef.current = npc?.id ?? null
    },
    [stage, canvasPointToGameSpace]
  )

  const handleCanvasPointerLeave = useCallback(() => {
    hoveredNpcRef.current = null
  }, [])

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
        onPointerMove={handleCanvasPointerMove}
        onPointerLeave={handleCanvasPointerLeave}
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
