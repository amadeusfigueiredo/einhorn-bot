export function drawGates(
  ctx: CanvasRenderingContext2D,
  gates: unknown[],
  answered: Set<string>
) {
  for (const g of gates ?? []) {
    ctx.save()
    const isDone = answered.has(g.id)
    ctx.globalAlpha = isDone ? 0.15 : 0.3
    ctx.fillStyle = isDone ? '#02264bff' : '#00c8ffff'
    ctx.fillRect(g.area.x, g.area.y, g.area.w, g.area.h)
    ctx.restore()
  }
}

// draw NPC
