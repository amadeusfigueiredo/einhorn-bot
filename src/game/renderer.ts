import type { Gate } from './types'

export function drawGates(
  ctx: CanvasRenderingContext2D,
  gates: Gate[],
  answered: Set<string>
) {
  for (const g of gates ?? []) {
    ctx.save()
    const isDone = answered.has(g.id)
    ctx.globalAlpha = isDone ? 0.15 : 0.35
    ctx.fillStyle = isDone ? '#8a5cf6' : '#ff8ad4'
    ctx.fillRect(g.area.x, g.area.y, g.area.w, g.area.h)
    ctx.restore()
  }
}

// draw NPC
