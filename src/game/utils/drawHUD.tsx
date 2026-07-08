import { roundRect } from './roundRect'

export function drawHUD(
  ctx: CanvasRenderingContext2D,
  stageName: string,
  answeredCount: number,
  required: number,
  total: number
) {
  ctx.save()

  const text = `🦄 ${stageName} — ✨ ${answeredCount}/${required} (${total})`
  ctx.font =
    "600 16px 'Fredoka', 'Baloo 2', system-ui, -apple-system, Segoe UI, Roboto, sans-serif"
  const metrics = ctx.measureText(text)

  const paddingX = 16
  const paddingY = 10
  const boxW = metrics.width + paddingX * 2
  const boxH = 16 + paddingY * 2
  const boxX = 16
  const boxY = 14

  const gradient = ctx.createLinearGradient(boxX, 0, boxX + boxW, 0)
  gradient.addColorStop(0, 'rgba(138, 92, 246, 0.85)')
  gradient.addColorStop(1, 'rgba(255, 79, 184, 0.85)')

  ctx.shadowColor = 'rgba(74, 46, 110, 0.4)'
  ctx.shadowBlur = 10
  ctx.fillStyle = gradient
  roundRect(ctx, boxX, boxY, boxW, boxH, boxH / 2)
  ctx.fill()

  ctx.shadowColor = 'transparent'
  ctx.shadowBlur = 0
  ctx.fillStyle = '#fff'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, boxX + paddingX, boxY + boxH / 2)

  ctx.restore()
}
