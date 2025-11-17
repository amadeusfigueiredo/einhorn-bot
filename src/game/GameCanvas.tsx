import { useEffect, useRef, useState, useCallback, type JSX } from 'react'
import QuestionOverlay from './QuestionOverlay'
import { STAGES } from './constants/stages'
import useKeys from './hooks/useKeys'
import useGameLoop from './hooks/useGameLoop'
import useAudioManager from './hooks/useAudio'
import { loadImageAssets, loadAudioAssets } from './utils/loader'
import type { LoaderAudioAssets, LoaderImageAssets } from './types'
import type { StageConfig } from './types'
import { POPUP_CONFIGS, type PopupConfig } from './config/PopupsConfig'
import type { Player } from './types'
import PopupOverlay from './PopupOverlay'
import { HEIGHT, WIDTH } from './constants/dimensions'
import StagesNavigation from '../components/StagesNavigation'
import { useDevNavigation } from './hooks/useDevNavigation'

export default function GameCanvas(): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const keysRef = useKeys()

  const [stageIndex, setStageIndex] = useState(0)
  const stage: StageConfig = STAGES[stageIndex]

  const answeredRef = useRef(new Set<string>())
  const [questionKey, setQuestionKey] = useState<{
    kind: 'gate' | 'npc'
    id: string
  } | null>(null)

  // State für die aktive Popup-Konfiguration (WIN, TRY_AGAIN, GAME_END)
  const [activePopupConfig, setActivePopupConfig] =
    useState<PopupConfig | null>(null)

  const playerRef = useRef<Player>({ x: 60, y: 320, w: 56, h: 56, speed: 210 })
  const assetsRef = useRef<LoaderImageAssets | null>(null)
  const audioRef = useRef<LoaderAudioAssets | null>(null)
  const [assetsLoaded, setAssetsLoaded] = useState(false)

  // --- dev control state ---
  const {
    jumpInput,
    setJumpInput,
    handleJumpSubmit,
    nextStage,
    prevStage,
    totalStages,
  } = useDevNavigation({ setStageIndex, currentStageIndex: stageIndex })

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
        // Konsumiert die Tasten, um keine doppelten Auslöser zu erhalten
        keysRef.current['e'] = false
        keysRef.current['enter'] = false
      }
    },
    [keysRef, setQuestionKey]
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

  // Helper-Funktion zum Anzeigen eines Popups mit automatischem Timeout
  const showTimedPopup = useCallback(
    (config: PopupConfig) => {
      setActivePopupConfig(config)
      if (config.durationMs !== null) {
        setTimeout(() => {
          setActivePopupConfig(null)
          // ✨ KORREKTUR FÜR 'E'-TASTE: Setzt E und Enter zurück, nachdem das Popup geschlossen wurde
          // Dies behebt das Problem der blockierten Eingabe nach einem Popup-Ablauf.
          if (keysRef.current) {
            keysRef.current['e'] = false
            keysRef.current['enter'] = false
          }
        }, config.durationMs)
      }
    },
    [keysRef]
  )

  // Logik für Popups
  const resolveQuestion = (pickedIndex: number) => {
    if (!questionKey) return
    let isCorrect = false

    // Bestimme, ob die Antwort korrekt war
    if (questionKey.kind === 'gate') {
      const g = (stage.gates ?? []).find((x: any) => x.id === questionKey.id)!
      if (pickedIndex === g.question.correctIndex) {
        answeredRef.current.add(g.id)
        isCorrect = true
      }
    } else {
      const n = (stage.npcs ?? []).find((x: any) => x.id === questionKey.id)!
      if (pickedIndex === n.question.correctIndex) {
        answeredRef.current.add(n.id)
        isCorrect = true
      }
    }

    setQuestionKey(null) // Schließt das Fragen-Overlay sofort

    if (isCorrect) {
      // 1. Richtige Antwort: Zeige WIN-Popup
      showTimedPopup(POPUP_CONFIGS.WIN)

      const total = (stage.gates ?? []).length + (stage.npcs ?? []).length
      const must = stage.requiredToAdvance ?? total

      const isLastStage = stageIndex === STAGES.length - 1 // Prüfen, ob es die letzte Stage ist
      const isComplete = answeredRef.current.size >= must

      if (isComplete) {
        if (isLastStage) {
          // 2. Spielende: Zeige GAME_END-Popup nach Ablauf des WIN-Popups
          setTimeout(() => {
            setActivePopupConfig(POPUP_CONFIGS.GAME_END)
          }, POPUP_CONFIGS.WIN.durationMs ?? 0)
        } else {
          // 3. Stage-Wechsel: Gehe zur nächsten Stage
          const nextStageName = stage.nextStage
          if (nextStageName) {
            const idx = STAGES.findIndex((s: any) => s.name === nextStageName)
            if (idx >= 0) setStageIndex(idx)
          }
        }
      }
    } else {
      // 4. Falsche Antwort: Zeige TRY_AGAIN-Popup
      showTimedPopup(POPUP_CONFIGS.TRY_AGAIN)
    }
  }

  // active prompt helper
  const activePrompt = (() => {
    if (!questionKey) return null
    if (questionKey.kind === 'gate') {
      const g = (stage.gates ?? []).find((x: any) => x.id === questionKey.id)!
      return { prompt: g.question.prompt, choices: g.question.choices }
    } else {
      const n = (stage.npcs ?? []).find((x: any) => x.id === questionKey.id)!
      return { prompt: n.question.prompt, choices: n.question.choices }
    }
  })()

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const active = document.activeElement
      if (
        active &&
        (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA')
      ) {
        return
      }

      if (e.key === '1') {
        nextStage()
      } else if (e.key === '2') {
        prevStage()
      } else if (
        /^[0-9]$/.test(e.key) &&
        e.key !== '0' &&
        e.ctrlKey &&
        e.shiftKey
      ) {
        // (optional) example: ctrl+shift+<digit> could be used for other quick ops
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [nextStage, prevStage])

  const assets = assetsRef.current || ({} as LoaderImageAssets)

  return (
    <div
      style={{
        position: 'relative',
        width: WIDTH,
        maxWidth: '98vw',
        margin: '16px auto',
        overflow: 'hidden',
        borderRadius: '16px',
      }}
    >
      <StagesNavigation
        enableAudioNow={enableAudioNow}
        stageIndex={stageIndex}
        stage={stage}
        jumpInput={jumpInput}
        setJumpInput={setJumpInput}
        handleJumpSubmit={handleJumpSubmit}
        nextStage={nextStage}
        prevStage={prevStage}
        totalStages={totalStages}
      />
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
