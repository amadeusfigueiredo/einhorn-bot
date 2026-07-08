import type { LoaderImageAssets, NPC, StageConfig } from '../types'
import { roundRect } from '../utils/roundRect'

export function drawNPC(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  answeredNpc: boolean,
  _stage?: StageConfig,
  assets?: LoaderImageAssets,
  _canvasW?: number,
  _canvasH?: number,
  npc?: NPC | any
) {
  const id = npc?.id ?? null
  const imageKey = npc?.imageKey ?? null

  const assetFor = (key?: string | null) => {
    if (!key || !assets) return undefined
    return (assets as any)[key] as HTMLImageElement | undefined
  }

  const BORDER_RADIUS = 12
  const BORDER_WIDTH = 4
  let imgDrawn = false

  const drawImageWithBorder = (img: HTMLImageElement) => {
    // optional safety if images might not be loaded yet:
    // if (!img.complete || img.naturalWidth === 0) return

    const displayW = Math.min(128, img.width)
    const displayH = Math.round((img.height / img.width) * displayW)
    const drawX = x - displayW / 2
    const drawY = y - displayH / 2

    ctx.save()
    ctx.beginPath()
    roundRect(ctx, drawX, drawY, displayW, displayH, BORDER_RADIUS)
    ctx.clip()
    ctx.drawImage(img, drawX, drawY, displayW, displayH)
    ctx.restore()

    ctx.save()
    ctx.lineWidth = BORDER_WIDTH
    const gradient = ctx.createLinearGradient(drawX, 0, drawX + displayW, 0)
    gradient.addColorStop(0, '#FF00A0')
    gradient.addColorStop(0.25, '#FFD700')
    gradient.addColorStop(0.5, '#00FFFF')
    gradient.addColorStop(0.75, '#5D3FD3')
    gradient.addColorStop(1, '#FF69B4')
    ctx.strokeStyle = gradient

    roundRect(ctx, drawX, drawY, displayW, displayH, BORDER_RADIUS)
    ctx.stroke()
    ctx.restore()

    imgDrawn = true
  }

  // 1) preferred: npc.imageKey -> assets[npc.imageKey]
  if (imageKey) {
    const img = assetFor(imageKey)
    if (img) drawImageWithBorder(img)
  }

  // 2) fallback: id like "stage7-npc3" -> "stage7Npc3"
  if (!imgDrawn && id) {
    const m = /^stage(\d+)-npc(\d+)$/i.exec(id)
    if (m) {
      const img = assetFor(`stage${m[1]}Npc${m[2]}`)
      if (img) drawImageWithBorder(img)
    }
  }

  // 3) final fallback: placeholder
  if (!imgDrawn) {
    const r = 26
    ctx.save()
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fillStyle = answeredNpc ? '#c8cbd1' : '#ffe8ff'
    ctx.fill()

    ctx.beginPath()
    ctx.moveTo(x, y - r - 8)
    ctx.lineTo(x + 10, y - r + 8)
    ctx.lineTo(x - 10, y - r + 8)
    ctx.closePath()
    ctx.fillStyle = answeredNpc ? '#694ac4ff' : '#e4a8f3ff'
    ctx.fill()
    ctx.restore()
  }
}
