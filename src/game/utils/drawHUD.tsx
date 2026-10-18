import { roundRect } from './roundRect'
import { canvasTheme, withAlpha } from '../../styles/canvasTheme'

const PADDING_X = 18
const PADDING_Y = 10
const MARGIN = 16
const SCALE = 2 // sprite resolution multiplier (crisp on retina)

// The HUD text changes only when an answer lands, but the pill needs a shadow
// blur, which is the most expensive thing in the frame. Render it once per
// distinct text and blit it every frame.
const cache = new Map<string, HTMLCanvasElement>()

function render(text: string, ui: number): HTMLCanvasElement | null {
  if (typeof document === 'undefined') return null
  const theme = canvasTheme()
  const probe = document.createElement('canvas').getContext('2d')
  if (!probe) return null
  const font = `600 ${18 * ui}px ${theme.fontDisplay}`
  probe.font = font
  const textW = probe.measureText(text).width
  const w = Math.ceil(textW + PADDING_X * 2 * ui + 24)
  const h = Math.ceil((18 + PADDING_Y * 2) * ui + 24)

  const canvas = document.createElement('canvas')
  canvas.width = w * SCALE
  canvas.height = h * SCALE
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  ctx.scale(SCALE, SCALE)

  const boxW = w - 24
  const boxH = h - 24
  ctx.translate(12, 12)
  ctx.shadowColor = withAlpha(theme.dusk400, 0.7)
  ctx.shadowBlur = 12
  ctx.fillStyle = withAlpha(theme.night800, 0.88)
  roundRect(ctx, 0, 0, boxW, boxH, boxH / 2)
  ctx.fill()
  ctx.shadowBlur = 0
  ctx.font = font
  ctx.textBaseline = 'middle'
  ctx.fillStyle = theme.moon50
  ctx.fillText(text, PADDING_X * ui, boxH / 2 + 1)
  return canvas
}

export function drawHUD(
  ctx: CanvasRenderingContext2D,
  stageName: string,
  answeredCount: number,
  required: number,
  total: number,
  ui = 1
) {
  const theme = canvasTheme()
  // "(total)" only matters when more NPCs exist than are needed to advance.
  const count =
    total === required
      ? `${answeredCount} von ${required}`
      : `${answeredCount} von ${required} (${total})`
  const text = `${stageName}  ·  ${count}`
  const cacheKey = `${ui}|${text}`
  let sprite = cache.get(cacheKey)
  if (!sprite) {
    sprite = render(text, ui) ?? undefined
    if (!sprite) return
    cache.set(cacheKey, sprite)
  }
  ctx.drawImage(
    sprite,
    MARGIN - 12,
    MARGIN - 12,
    sprite.width / SCALE,
    sprite.height / SCALE
  )

  // Progress stars: gold once earned.
  ctx.save()
  const boxH = sprite.height / SCALE - 24
  ctx.font = `600 ${18 * ui}px ${theme.fontDisplay}`
  ctx.textBaseline = 'middle'
  const starsY = MARGIN + boxH + 16 * ui
  for (let i = 0; i < required; i++) {
    ctx.fillStyle = i < answeredCount ? theme.gold400 : withAlpha(theme.moon300, 0.4)
    ctx.fillText('★', MARGIN + 6 + i * 22 * ui, starsY)
  }
  ctx.restore()
}
