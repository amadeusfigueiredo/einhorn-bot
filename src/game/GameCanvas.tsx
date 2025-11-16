import { useEffect, useRef, useState, useCallback, type JSX } from 'react'
import QuestionOverlay from './QuestionOverlay'
import { STAGES } from './stages'
import useKeys from './hooks/useKeys'
import useGameLoop from './hooks/useGameLoop'
import useAudioManager from './hooks/useAudio'
import { loadImageAssets, loadAudioAssets } from './utils/loader'
import type { LoaderAudioAssets, LoaderImageAssets } from './types'

const WIDTH = 960
const HEIGHT = 540

export default function GameCanvas(): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const keysRef = useKeys()

  const [stageIndex, setStageIndex] = useState(0)
  const stage = STAGES[stageIndex]

  const answeredRef = useRef(new Set<string>())
  const [questionKey, setQuestionKey] = useState<{
    kind: 'gate' | 'npc'
    id: string
  } | null>(null)
  const playerRef = useRef({ x: 60, y: 320, w: 56, h: 56, speed: 210 })
  const assetsRef = useRef<LoaderImageAssets | null>(null)
  const audioRef = useRef<LoaderAudioAssets | null>(null)
  const [assetsLoaded, setAssetsLoaded] = useState(false)

  // --- dev control state ---
  const [jumpInput, setJumpInput] = useState<string>('') // 1-based input

  // *** ADDED FIX ***
  // Clear the set of answered questions whenever the stage changes.
  // This prevents the count from carrying over between stages.
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

  function onTrigger(kind: 'gate' | 'npc', id: string) {
    setQuestionKey({ kind, id })
    if (keysRef.current) {
      keysRef.current['e'] = false
      keysRef.current['enter'] = false
    }
  }

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

  const resolveQuestion = (pickedIndex: number) => {
    if (!questionKey) return
    if (questionKey.kind === 'gate') {
      const g = (stage.gates ?? []).find((x) => x.id === questionKey.id)!
      if (pickedIndex === g.question.correctIndex) answeredRef.current.add(g.id)
    } else {
      const n = (stage.npcs ?? []).find((x) => x.id === questionKey.id)!
      if (pickedIndex === n.question.correctIndex) answeredRef.current.add(n.id)
    }

    // progression
    const total = (stage.gates ?? []).length + (stage.npcs ?? []).length
    const must = stage.requiredToAdvance ?? total
    if (answeredRef.current.size >= must && stage.nextStage) {
      const idx = STAGES.findIndex((s) => s.name === stage.nextStage)
      if (idx >= 0) setStageIndex(idx)
    }

    setQuestionKey(null)
  }

  // active prompt helper
  const activePrompt = (() => {
    if (!questionKey) return null
    if (questionKey.kind === 'gate') {
      const g = (stage.gates ?? []).find((x) => x.id === questionKey.id)!
      return { prompt: g.question.prompt, choices: g.question.choices }
    } else {
      const n = (stage.npcs ?? []).find((x) => x.id === questionKey.id)!
      return { prompt: n.question.prompt, choices: n.question.choices }
    }
  })()

  // --- stage navigation helpers (stable) ---
  const nextStage = useCallback(() => {
    setStageIndex((i) => Math.min(i + 1, STAGES.length - 1))
  }, [])

  const prevStage = useCallback(() => {
    setStageIndex((i) => Math.max(i - 1, 0))
  }, [])

  const jumpToStageNumber = useCallback((oneBased: number) => {
    const idx = Math.max(0, Math.min(oneBased - 1, STAGES.length - 1))
    setStageIndex(idx)
  }, [])

  // --- keyboard shortcuts for dev (1 => next, 2 => prev) ---
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      // ignore if typing into an input
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

  // --- helpers for Jump input ---
  function handleJumpSubmit() {
    const n = parseInt(jumpInput, 10)
    if (Number.isFinite(n)) {
      jumpToStageNumber(n)
    }
  }

  return (
    <div
      style={{
        position: 'relative',
        width: WIDTH,
        maxWidth: '98vw',
        margin: '16px auto',
        // --- ADD THIS LINE ---
        overflow: 'hidden',
        borderRadius: '16px',
      }}
    >
      <div style={{ position: 'absolute', right: 12, top: 12, zIndex: 999 }}>
        <button
          onClick={enableAudioNow}
          style={{
            padding: '12px 14px',
            borderRadius: 8,
            cursor: 'pointer',
            display: 'block',
          }}
        >
          Enable sound
        </button>

        {/* Dev navigation panel */}
        <div
          style={{
            marginTop: 8,
            padding: 8,
            borderRadius: 8,
            background: 'rgba(255,255,255,0.9)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
            minWidth: 180,
            textAlign: 'center',
          }}
        >
          <div style={{ marginBottom: 6, fontSize: 12, color: '#333' }}>
            <strong>Dev Stage Nav</strong>
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
              style={{ padding: '6px 8px', borderRadius: 6 }}
            >
              Prev
            </button>
            <button
              onClick={nextStage}
              style={{ padding: '6px 8px', borderRadius: 6 }}
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
              max={STAGES.length}
              value={jumpInput}
              onChange={(e) => setJumpInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleJumpSubmit()
              }}
              placeholder='stage # (1-based)'
              style={{ padding: '6px', width: 90, borderRadius: 6 }}
            />
            <button
              onClick={handleJumpSubmit}
              style={{ padding: '6px 8px', borderRadius: 6 }}
            >
              Jump
            </button>
          </div>

          <div style={{ fontSize: 12, color: '#444' }}>
            {`Current: ${stageIndex + 1} / ${STAGES.length} — ${
              stage?.name ?? ''
            }`}
          </div>

          <div style={{ marginTop: 6, fontSize: 11, color: '#666' }}>
            Press <kbd>1</kbd> next, <kbd>2</kbd> prev
          </div>
        </div>
      </div>

      <canvas ref={canvasRef} width={WIDTH} height={HEIGHT} />

      {activePrompt && (
        <QuestionOverlay
          prompt={activePrompt.prompt}
          choices={activePrompt.choices}
          onPick={resolveQuestion}
        />
      )}
    </div>
  )
}
