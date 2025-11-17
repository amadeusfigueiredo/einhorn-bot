export function drawHUD(
  ctx: CanvasRenderingContext2D,
  stageName: string,
  answeredCount: number,
  required: number,
  total: number
) {
  ctx.save()
  ctx.font = '16px system-ui, -apple-system, Segoe UI, Roboto, sans-serif'
  ctx.fillStyle = '#fff'
  ctx.shadowColor = 'rgba(163, 38, 77, 0.59)'
  ctx.shadowBlur = 8
  ctx.fillText(
    `Stage: ${stageName} — Answered: ${answeredCount}/${required} (total ${total})`,
    16,
    28
  )
  ctx.restore()
}
