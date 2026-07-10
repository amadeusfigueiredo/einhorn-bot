import type { LoaderImageAssets, NPC } from '../types'
import { roundRect } from '../utils/roundRect'
import { computeNpcAnimation } from '../utils/npcAnimation'

export type NpcRenderAnim = {
  t: number
  isSelected: boolean
  isHovered: boolean
}

export function drawNPC(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  answeredNpc: boolean,
  assets: LoaderImageAssets | undefined,
  npc: NPC,
  anim: NpcRenderAnim = { t: 0, isSelected: false, isHovered: false }
) {
  const { id, imageKey } = npc

  const assetFor = (key?: string | null) => {
    if (!key || !assets) return undefined
    return assets[key as keyof LoaderImageAssets] as
      | HTMLImageElement
      | undefined
  }

  const BORDER_RADIUS = 12
  const BORDER_WIDTH = 4
  let imgDrawn = false

  const { scale, glowAlpha } = answeredNpc
    ? { scale: 1, glowAlpha: 0 }
    : computeNpcAnimation({ t: anim.t, isSelected: anim.isSelected, isHovered: anim.isHovered })

  const drawImageWithBorder = (img: HTMLImageElement) => {
    const displayW = Math.min(128, img.width)
    const displayH = Math.round((img.height / img.width) * displayW)

    // Glow ring behind the portrait when selected/hovered
    if (glowAlpha > 0) {
      ctx.save()
      ctx.globalAlpha = 0.55 * glowAlpha
      ctx.shadowColor = '#ffd166'
      ctx.shadowBlur = 22
      ctx.fillStyle = 'rgba(255, 209, 102, 0.9)'
      roundRect(
        ctx,
        x - (displayW / 2) * scale - 6,
        y - (displayH / 2) * scale - 6,
        displayW * scale + 12,
        displayH * scale + 12,
        BORDER_RADIUS + 6
      )
      ctx.fill()
      ctx.restore()
    }

    ctx.save()
    ctx.translate(x, y)
    ctx.scale(scale, scale)
    ctx.translate(-displayW / 2, -displayH / 2)

    ctx.save()
    ctx.beginPath()
    roundRect(ctx, 0, 0, displayW, displayH, BORDER_RADIUS)
    ctx.clip()
    ctx.drawImage(img, 0, 0, displayW, displayH)
    ctx.restore()

    ctx.save()
    ctx.lineWidth = BORDER_WIDTH
    const gradient = ctx.createLinearGradient(0, 0, displayW, 0)
    gradient.addColorStop(0, '#FF00A0')
    gradient.addColorStop(0.25, '#FFD700')
    gradient.addColorStop(0.5, '#00FFFF')
    gradient.addColorStop(0.75, '#5D3FD3')
    gradient.addColorStop(1, '#FF69B4')
    ctx.strokeStyle = gradient

    roundRect(ctx, 0, 0, displayW, displayH, BORDER_RADIUS)
    ctx.stroke()
    ctx.restore()

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
    ctx.translate(x, y)
    ctx.scale(scale, scale)
    ctx.beginPath()
    ctx.arc(0, 0, r, 0, Math.PI * 2)
    ctx.fillStyle = answeredNpc ? '#c8cbd1' : '#ffe8ff'
    ctx.fill()

    ctx.beginPath()
    ctx.moveTo(0, -r - 8)
    ctx.lineTo(10, -r + 8)
    ctx.lineTo(-10, -r + 8)
    ctx.closePath()
    ctx.fillStyle = answeredNpc ? '#694ac4ff' : '#e4a8f3ff'
    ctx.fill()
    ctx.restore()
  }
}
