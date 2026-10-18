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
import { loadImageAssets, loadAudioAssets } from './utils/loader'
import type {
  LoaderAudioAssets,
  LoaderImageAssets,
  MoveTarget,
  PlayerMotion,
} from './types'
import type { StageConfig, Player } from './types'
import { POPUPS } from './data/popups'
import { gameStore, useGame } from './logic/gameStore.instance'
import { isWorldPaused } from './logic/gameMachine'
import PopupOverlay from './PopupOverlay'
import { getActivePrompt } from './utils/getActivePrompt'
import { findNpcAtPoint } from './utils/hitTest'
import { getNpcMaxDisplayWidth } from './utils/npcDisplaySize'
import { computePlayerSize } from './utils/playerSize'
import { SoundButton } from './components/SoundButton'
import { MoveControls } from './components/MoveControls'

type GameCanvasProps = {
  stage: StageConfig
  stageIndex: number
  canvasWidth: number
  canvasHeight: number
}

export default function GameCanvas({
  stage,
  stageIndex,
  canvasWidth,
  canvasHeight,
}: GameCanvasProps): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const keysRef = useKeys()

  const phase = useGame((g) => g.phase)
  const activeQuestion = useGame((g) => g.activeQuestion)
  const popup = useGame((g) => g.popup)
  const worldPaused = isWorldPaused(phase)

  const playerRef = useRef<Player>({ x: 60, y: 320, w: 56, h: 56, speed: 210 })
  const assetsRef = useRef<LoaderImageAssets | null>(null)
  const audioRef = useRef<LoaderAudioAssets | null>(null)
  const moveTargetRef = useRef<MoveTarget | null>(null)
  const motionRef = useRef<PlayerMotion>({ moving: false, facingLeft: false })
  const hoveredNpcRef = useRef<string | null>(null)
  const [assetsLoaded, setAssetsLoaded] = useState(false)

  // A new stage cancels any click-to-move target from the previous one.
  useEffect(() => {
    moveTargetRef.current = null
  }, [stageIndex])

  // Once a popup closes, drop any E/Enter press that was held behind it so
  // it can't instantly re-trigger a conversation.
  useEffect(() => {
    if (popup) return
    const keys = keysRef.current
    keys['e'] = false
    keys['enter'] = false
  }, [popup, keysRef])

  // load assets
  useEffect(() => {
    let cancelled = false
    loadImageAssets()
      .then((imgs) => {
        if (cancelled) return
        assetsRef.current = imgs
        audioRef.current = loadAudioAssets()
        setAssetsLoaded(true)
      })
      .catch(console.warn)
    return () => {
      cancelled = true
    }
  }, [])

  // Keep the player capped at the same size as the NPCs - recomputed
  // whenever the canvas size changes (e.g. rotating the phone), not just once
  // on load.
  useEffect(() => {
    const img = assetsRef.current?.player1
    if (!img) return
    const { w, h } = computePlayerSize(img, canvasWidth, canvasHeight)
    playerRef.current.w = w
    playerRef.current.h = h
  }, [assetsLoaded, canvasWidth, canvasHeight])

  const { enableAudioNow } = useAudioManager({
    audioRef,
    stage,
    stageIndex,
    assetsLoaded,
  })

  const onTrigger = useCallback(
    (kind: 'gate' | 'npc', id: string) => {
      gameStore.getState().interact({ kind, id })
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
    assetsRef,
    moveTargetRef,
    motionRef,
    hoveredNpcRef,
    onTrigger,
    canvasWidth,
    canvasHeight,
    deps: [stageIndex, canvasWidth, canvasHeight],
  })

  const canvasPointToGameSpace = useCallback(
    (e: PointerEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current
      if (!canvas) return null
      const rect = canvas.getBoundingClientRect()
      return {
        x: ((e.clientX - rect.left) / rect.width) * canvasWidth,
        y: ((e.clientY - rect.top) / rect.height) * canvasHeight,
      }
    },
    [canvasWidth, canvasHeight]
  )

  // Tap hitbox needs to track the portrait's actual on-screen size (bigger
  // on portrait/mobile canvases) or taps near the edge of a big icon miss it.
  const npcHitHalfSize =
    getNpcMaxDisplayWidth(canvasWidth, canvasHeight) / 2 + 12

  // Click/tap on the canvas: walk to an NPC (and auto-open its question on
  // arrival) or just walk to the tapped spot. Keyboard/D-pad input cancels it.
  const handleCanvasPointerDown = useCallback(
    (e: PointerEvent<HTMLCanvasElement>) => {
      if (worldPaused || popup) return
      const point = canvasPointToGameSpace(e)
      if (!point) return

      const npc = findNpcAtPoint(
        stage.npcs ?? [],
        point.x,
        point.y,
        gameStore.getState().answered,
        npcHitHalfSize
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
    [
      stage,
      worldPaused,
      popup,
      onTrigger,
      canvasPointToGameSpace,
      npcHitHalfSize,
    ]
  )

  // Desktop-only hover highlight: touch devices don't have real hover, so we
  // only track it for mouse pointers.
  const handleCanvasPointerMove = useCallback(
    (e: PointerEvent<HTMLCanvasElement>) => {
      if (e.pointerType !== 'mouse') return
      const point = canvasPointToGameSpace(e)
      const npc = point
        ? findNpcAtPoint(
            stage.npcs ?? [],
            point.x,
            point.y,
            gameStore.getState().answered,
            npcHitHalfSize
          )
        : undefined
      hoveredNpcRef.current = npc?.id ?? null
    },
    [stage, canvasPointToGameSpace, npcHitHalfSize]
  )

  const handleCanvasPointerLeave = useCallback(() => {
    hoveredNpcRef.current = null
  }, [])

  const activePrompt =
    phase === 'asking' ? getActivePrompt(activeQuestion, stage) : null

  const assets = assetsRef.current || ({} as LoaderImageAssets)

  return (
    <div
      className="game-frame"
      style={{
        position: 'relative',
        width: canvasWidth,
        maxWidth: '98vw',
        margin: '16px auto',
        overflow: 'hidden',
      }}
    >
      <SoundButton onClick={enableAudioNow} />
      <canvas
        ref={canvasRef}
        width={canvasWidth}
        height={canvasHeight}
        onPointerDown={handleCanvasPointerDown}
        onPointerMove={handleCanvasPointerMove}
        onPointerLeave={handleCanvasPointerLeave}
      />
      <MoveControls keysRef={keysRef} moveTargetRef={moveTargetRef} />
      {activePrompt && (
        <QuestionOverlay
          prompt={activePrompt.prompt}
          choices={activePrompt.choices}
          onPick={gameStore.getState().answer}
        />
      )}
      {popup && assetsLoaded && (
        <PopupOverlay
          assets={assets}
          config={POPUPS[popup.id]}
          onClose={gameStore.getState().restart}
        />
      )}
    </div>
  )
}
