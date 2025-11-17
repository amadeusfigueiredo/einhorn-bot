import type { LoaderImageAssets, NPC, StageConfig } from '../types'
import { roundRect } from '../utils/roundRect'

export function drawNPC(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  answeredNpc: boolean,
  stage?: StageConfig,
  assets?: LoaderImageAssets,
  canvasW?: number,
  canvasH?: number,
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

  // Helper function to draw the NPC image with border/clip
  const drawImageWithBorder = (img: HTMLImageElement) => {
    const displayW = Math.min(128, img.width)
    const displayH = Math.round((img.height / img.width) * displayW)
    const drawX = x - displayW / 2
    const drawY = y - displayH / 2

    // --- STEP 1: CLIP IMAGE TO ROUNDED RECTANGLE ---
    ctx.save()
    ctx.beginPath()
    roundRect(ctx, drawX, drawY, displayW, displayH, BORDER_RADIUS)
    ctx.clip()

    ctx.drawImage(img, drawX, drawY, displayW, displayH)
    ctx.restore() // Restore to remove the clipping mask

    // --- STEP 2: DRAW RAINBOW BORDER ---
    ctx.save()
    ctx.lineWidth = BORDER_WIDTH

    // RAINBOW GRADIENT SETUP
    const gradient = ctx.createLinearGradient(drawX, 0, drawX + displayW, 0)
    gradient.addColorStop(0, '#FF00A0')
    gradient.addColorStop(0.25, '#FFD700')
    gradient.addColorStop(0.5, '#00FFFF')
    gradient.addColorStop(0.75, '#5D3FD3')
    gradient.addColorStop(1, '#FF69B4')
    ctx.strokeStyle = gradient

    // Draw the border path
    roundRect(ctx, drawX, drawY, displayW, displayH, BORDER_RADIUS)
    ctx.stroke()
    ctx.restore()

    imgDrawn = true
  }

  // 1) preferred: npc.imageKey -> assets[npc.imageKey]
  if (imageKey) {
    const img = assetFor(imageKey)
    if (img) {
      drawImageWithBorder(img)
      // NOTE: return is handled by imgDrawn flag
    }
  }

  // 2) fallback convenience: id -> specific asset name (Only run if imgDrawn is still false)
  if (!imgDrawn) {
    let img: HTMLImageElement | undefined
    if (id === 'stage1-npc1') img = assetFor('stage1Npc1')
    else if (id === 'stage1-npc2') img = assetFor('stage1Npc2')
    else if (id === 'stage1-npc3') img = assetFor('stage1Npc3')
    else if (id === 'stage1-npc4') img = assetFor('stage1Npc4')
    else if (id === 'stage2-npc1') img = assetFor('stage2Npc1')
    else if (id === 'stage2-npc2') img = assetFor('stage2Npc2')
    else if (id === 'stage2-npc3') img = assetFor('stage2Npc3')
    else if (id === 'stage3-npc1') img = assetFor('stage3Npc1')
    else if (id === 'stage3-npc2') img = assetFor('stage3Npc2')
    else if (id === 'stage3-npc3') img = assetFor('stage3Npc3')
    else if (id === 'stage4-npc1') img = assetFor('stage4Npc1')
    else if (id === 'stage4-npc2') img = assetFor('stage4Npc2')
    else if (id === 'stage4-npc3') img = assetFor('stage4Npc3')
    else if (id === 'stage5-npc1') img = assetFor('stage5Npc1')
    else if (id === 'stage5-npc2') img = assetFor('stage5Npc2')
    else if (id === 'stage5-npc3') img = assetFor('stage5Npc3')
    else if (id === 'stage6-npc1') img = assetFor('stage6Npc1')
    else if (id === 'stage6-npc2') img = assetFor('stage6Npc2')
    else if (id === 'stage6-npc3') img = assetFor('stage6Npc3')
    else if (id === 'stage7-npc1') img = assetFor('stage7Npc1')
    else if (id === 'stage7-npc2') img = assetFor('stage7Npc2')
    else if (id === 'stage7-npc3') img = assetFor('stage7Npc3')

    if (img) {
      drawImageWithBorder(img)
      // NOTE: return is handled by imgDrawn flag
    }
  }

  // 3) final fallback: draw circular placeholder (Only run if imgDrawn is still false)
  if (!imgDrawn) {
    const r = 26
    ctx.save()
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
    ctx.fillStyle = answeredNpc ? '#694ac4ff' : '#e4a8f3ff'
    ctx.fill()
    ctx.restore()
  }
}
