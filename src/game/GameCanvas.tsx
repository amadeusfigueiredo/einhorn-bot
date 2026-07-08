import { useEffect, useRef, useState, useCallback, type JSX } from 'react'
import QuestionOverlay from './QuestionOverlay'
import useKeys from './hooks/useKeys'
import useGameLoop from './hooks/useGameLoop'
import useAudioManager from './hooks/useAudio'
import { useGameActions } from './hooks/useGameActions'
import { loadImageAssets, loadAudioAssets } from './utils/loader'
import type { LoaderAudioAssets, LoaderImageAssets } from './types'
import type { StageConfig, Player } from './types'
import { type PopupConfig } from './config/PopupsConfig'
import PopupOverlay from './PopupOverlay'
import { HEIGHT, WIDTH } from './constants/dimensions'
import { getActivePrompt } from './utils/getActivePrompt'
import { SoundButton } from './components/SoundButton'

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
  const [assetsLoaded, setAssetsLoaded] = useState(false)

  useEffect(() => {
    answeredRef.current.clear()
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
    questionKey,
    onTrigger,
    deps: [stageIndex],
  })

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
      <canvas ref={canvasRef} width={WIDTH} height={HEIGHT} />
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
