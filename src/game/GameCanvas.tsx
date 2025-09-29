import React, { useEffect, useRef, useState } from 'react'
import QuestionOverlay from './QuestionOverlay'
import { STAGES } from './stages'
import type { Keys, StageConfig } from './types'

const WIDTH = 960,
  HEIGHT = 540

function useKeys() {
  const keysRef = useRef<Keys>({})
  useEffect(() => {
    const down = (e: KeyboardEvent) =>
      (keysRef.current[e.key.toLowerCase()] = true)
    const up = (e: KeyboardEvent) =>
      (keysRef.current[e.key.toLowerCase()] = false)
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
    }
  }, [])
  return keysRef
}

function clamp(v: number, a: number, b: number) {
  return Math.max(a, Math.min(b, v))
}
function rectsOverlap(
  a: { x: number; y: number; w: number; h: number },
  b: { x: number; y: number; w: number; h: number }
) {
  return (
    a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y
  )
}
function dist(ax: number, ay: number, bx: number, by: number) {
  const dx = ax - bx,
    dy = ay - by
  return Math.hypot(dx, dy)
}

export default function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const keysRef = useKeys()

  const [stageIndex, setStageIndex] = useState(0)
  const stage = STAGES[stageIndex]

  // Track answered by id (works for both gates and npcs)
  const answered = useRef<Set<string>>(new Set())
  const [questionKey, setQuestionKey] = useState<{
    kind: 'gate' | 'npc'
    id: string
  } | null>(null)

  // Player
  const player = useRef({ x: 60, y: 320, w: 56, h: 56, speed: 210 })

  // Reset on stage change
  useEffect(() => {
    answered.current = new Set()
    player.current.x = 40
    player.current.y = 320
    setQuestionKey(null)
  }, [stageIndex])

  // Main loop
  useEffect(() => {
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    let last = performance.now()
    let raf = 0

    function update(dt: number) {
      const k = keysRef.current
      const left = k['arrowleft'] || k['a']
      const right = k['arrowright'] || k['d']
      const up = k['arrowup'] || k['w']
      const down = k['arrowdown'] || k['s']

      const vx = (right ? 1 : 0) - (left ? 1 : 0)
      const vy = (down ? 1 : 0) - (up ? 1 : 0)

      player.current.x = clamp(
        player.current.x + vx * player.current.speed * dt,
        0,
        WIDTH - player.current.w
      )
      player.current.y = clamp(
        player.current.y + vy * player.current.speed * dt,
        0,
        HEIGHT - player.current.h
      )

      if (!questionKey) {
        // 1) Gate triggers on contact
        const gates = stage.gates ?? []
        const p = player.current
        const hitGate = gates.find(
          (g) =>
            !answered.current.has(g.id) &&
            rectsOverlap({ x: p.x, y: p.y, w: p.w, h: p.h }, g.area)
        )
        if (hitGate) {
          setQuestionKey({ kind: 'gate', id: hitGate.id })
          return
        }

        // 2) NPC triggers when close AND 'e' pressed
        const npcs = stage.npcs ?? []
        const nearNpc = npcs.find((n) => {
          if (answered.current.has(n.id)) return false
          const r = n.talkRadius ?? 80
          const cx = player.current.x + player.current.w / 2
          const cy = player.current.y + player.current.h / 2
          return dist(cx, cy, n.x, n.y) <= r
        })
        if (nearNpc && (k['e'] || k['enter'])) {
          setQuestionKey({ kind: 'npc', id: nearNpc.id })
          // consume the key once to avoid double-open
          k['e'] = false
          k['enter'] = false
        }
      }
    }

    function drawBackground(s: StageConfig) {
      if (s.bg === 'park') {
        const g = ctx.createLinearGradient(0, 0, 0, HEIGHT)
        g.addColorStop(0, '#1f8a5a')
        g.addColorStop(1, '#0f5132')
        ctx.fillStyle = g
      } else if (s.bg === 'street') {
        const g = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT)
        g.addColorStop(0, '#1b2a4a')
        g.addColorStop(1, '#0d1323')
        ctx.fillStyle = g
      } else if (s.bg === 'school') {
        const g = ctx.createLinearGradient(0, 0, 0, HEIGHT)
        g.addColorStop(0, '#5c7cfa')
        g.addColorStop(1, '#364fc7')
        ctx.fillStyle = g
      } else {
        ctx.fillStyle = '#111'
      }
      ctx.fillRect(0, 0, WIDTH, HEIGHT)
    }

    function drawNPC(x: number, y: number, answeredNpc: boolean) {
      const r = 26
      ctx.save()
      // body
      ctx.beginPath()
      ctx.arc(x, y, r, 0, Math.PI * 2)
      ctx.fillStyle = answeredNpc ? '#c8cbd1' : '#ffe8ff'
      ctx.fill()
      // horn
      ctx.beginPath()
      ctx.moveTo(x, y - r - 8)
      ctx.lineTo(x + 10, y - r + 8)
      ctx.lineTo(x - 10, y - r + 8)
      ctx.closePath()
      ctx.fillStyle = answeredNpc ? '#b197fc' : '#e07bf8'
      ctx.fill()
      ctx.restore()
    }

    function draw() {
      ctx.clearRect(0, 0, WIDTH, HEIGHT)
      drawBackground(stage)

      // Gates
      for (const g of stage.gates ?? []) {
        ctx.save()
        const isDone = answered.current.has(g.id)
        ctx.globalAlpha = isDone ? 0.15 : 0.3
        ctx.fillStyle = isDone ? '#9aa0a6' : '#00ff99'
        ctx.fillRect(g.area.x, g.area.y, g.area.w, g.area.h)
        ctx.restore()
      }

      // NPCs
      const npcs = stage.npcs ?? []
      for (const n of npcs) {
        drawNPC(n.x, n.y, answered.current.has(n.id))
      }

      // Player (placeholder unicorn)
      const p = player.current
      ctx.save()
      ctx.beginPath()
      ctx.arc(
        p.x + p.w / 2,
        p.y + p.h / 2,
        Math.min(p.w, p.h) / 2,
        0,
        Math.PI * 2
      )
      ctx.fillStyle = '#fff'
      ctx.fill()
      ctx.beginPath()
      ctx.moveTo(p.x + p.w / 2, p.y - 6)
      ctx.lineTo(p.x + p.w / 2 + 10, p.y + 12)
      ctx.lineTo(p.x + p.w / 2 - 10, p.y + 12)
      ctx.closePath()
      ctx.fillStyle = '#e07bf8'
      ctx.fill()
      ctx.beginPath()
      ctx.arc(p.x + p.w * 0.65, p.y + p.h * 0.45, 3, 0, Math.PI * 2)
      ctx.fillStyle = '#111'
      ctx.fill()
      ctx.restore()

      // HUD
      ctx.save()
      ctx.font = '16px system-ui, -apple-system, Segoe UI, Roboto, sans-serif'
      ctx.fillStyle = '#fff'
      ctx.shadowColor = 'rgba(0,0,0,0.7)'
      ctx.shadowBlur = 8
      const gatesTotal = (stage.gates ?? []).length
      const npcsTotal = (stage.npcs ?? []).length
      const total = gatesTotal + npcsTotal
      const req = stage.requiredToAdvance ?? total
      const done = answered.current.size
      ctx.fillText(
        `Stage: ${stage.name} — Answered: ${done}/${req} (total ${total})`,
        16,
        28
      )
      ctx.restore()

      // “Press E to talk” if near an unanswered NPC
      const cx = p.x + p.w / 2,
        cy = p.y + p.h / 2
      const nearNpc = npcs.find(
        (n) =>
          !answered.current.has(n.id) &&
          dist(cx, cy, n.x, n.y) <= (n.talkRadius ?? 80)
      )
      if (nearNpc && !questionKey) {
        ctx.save()
        ctx.font = '14px system-ui, -apple-system, Segoe UI, Roboto, sans-serif'
        ctx.fillStyle = '#fff'
        ctx.shadowColor = 'rgba(0,0,0,0.7)'
        ctx.shadowBlur = 8
        ctx.fillText('Press E to talk', nearNpc.x - 40, nearNpc.y - 48)
        ctx.restore()
      }
    }

    function loop(t: number) {
      const dt = Math.min((t - last) / 1000, 0.05)
      last = t
      update(dt)
      draw()
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [stage, questionKey, keysRef])

  // Resolving questions
  const resolveQuestion = (pickedIndex: number) => {
    if (!questionKey) return

    if (questionKey.kind === 'gate') {
      const gate = (stage.gates ?? []).find((g) => g.id === questionKey.id)!
      if (pickedIndex === gate.question.correctIndex) {
        answered.current.add(gate.id)
      }
    } else {
      // npc
      const npc = (stage.npcs ?? []).find((n) => n.id === questionKey.id)!
      if (pickedIndex === npc.question.correctIndex) {
        answered.current.add(npc.id)
      }
    }

    // Advance if requirement met
    const gatesTotal = (stage.gates ?? []).length
    const npcsTotal = (stage.npcs ?? []).length
    const total = gatesTotal + npcsTotal
    const must = stage.requiredToAdvance ?? total

    if (answered.current.size >= must && stage.nextStage) {
      const idx = STAGES.findIndex((s) => s.name === stage.nextStage)
      if (idx >= 0) setStageIndex(idx)
    }

    setQuestionKey(null)
  }

  // Active question source
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

  return (
    <div
      style={{
        position: 'relative',
        width: WIDTH,
        maxWidth: '98vw',
        margin: '16px auto',
        borderRadius: 16,
        overflow: 'hidden',
        boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
        background: '#000',
      }}
    >
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
