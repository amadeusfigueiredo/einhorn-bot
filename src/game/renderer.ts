import type { LoaderImageAssets, NPC, StageConfig } from './types'

export function drawBackground(
  ctx: CanvasRenderingContext2D,
  stage: StageConfig,
  assets: LoaderImageAssets,
  width: number,
  height: number
) {
  if (stage.background === 'stage1Background' && assets.stage1Background) {
    const img = assets.stage1Background
    // cover-style center-crop
    const scale = Math.max(width / img.width, height / img.height)
    const sw = width / scale
    const sh = height / scale
    const sx = Math.max(0, (img.width - sw) / 2)
    const sy = Math.max(0, (img.height - sh) / 2)
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, width, height)
    return
  }

  // fallback gradients
  if (stage.background === 'stage2Background' && assets.stage2Background) {
    const img = assets.stage2Background
    // cover-style center-crop
    const scale = Math.max(width / img.width, height / img.height)
    const sw = width / scale
    const sh = height / scale
    const sx = Math.max(0, (img.width - sw) / 2)
    const sy = Math.max(0, (img.height - sh) / 2)
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, width, height)
    return
  } else if (
    stage.background === 'stage3Background' &&
    assets.stage3Background
  ) {
    const img = assets.stage3Background
    // cover-style center-crop
    const scale = Math.max(width / img.width, height / img.height)
    const sw = width / scale
    const sh = height / scale
    const sx = Math.max(0, (img.width - sw) / 2)
    const sy = Math.max(0, (img.height - sh) / 2)
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, width, height)
    return
  } else if (
    stage.background === 'stage4Background' &&
    assets.stage4Background
  ) {
    const img = assets.stage4Background
    const scale = Math.max(width / img.width, height / img.height)
    const sw = width / scale
    const sh = height / scale
    const sx = Math.max(0, (img.width - sw) / 2)
    const sy = Math.max(0, (img.height - sh) / 2)
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, width, height)
    return
  } else if (
    stage.background === 'stage5Background' &&
    assets.stage5Background
  ) {
    const img = assets.stage5Background
    const scale = Math.max(width / img.width, height / img.height)
    const sw = width / scale
    const sh = height / scale
    const sx = Math.max(0, (img.width - sw) / 2)
    const sy = Math.max(0, (img.height - sh) / 2)
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, width, height)
    return
  } else if (
    stage.background === 'stage6Background' &&
    assets.stage6Background
  ) {
    const img = assets.stage6Background
    const scale = Math.max(width / img.width, height / img.height)
    const sw = width / scale
    const sh = height / scale
    const sx = Math.max(0, (img.width - sw) / 2)
    const sy = Math.max(0, (img.height - sh) / 2)
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, width, height)
    return
  }
  {
    const img = assets.stage7Background
    const scale = Math.max(width / img.width, height / img.height)
    const sw = width / scale
    const sh = height / scale
    const sx = Math.max(0, (img.width - sw) / 2)
    const sy = Math.max(0, (img.height - sh) / 2)
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, width, height)
    return
  }
}

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
  // npc may be undefined if caller didn't pass it
  const id = npc?.id ?? null
  const imageKey = npc?.imageKey ?? null

  // helper: return an asset image for a given asset key
  const assetFor = (key?: string | null) => {
    if (!key || !assets) return undefined
    return (assets as any)[key] as HTMLImageElement | undefined
  }

  // 1) preferred: npc.imageKey -> assets[npc.imageKey]
  if (imageKey) {
    const img = assetFor(imageKey)
    if (img) {
      const displayW = Math.min(128, img.width)
      const displayH = Math.round((img.height / img.width) * displayW)
      ctx.drawImage(img, x - displayW / 2, y - displayH / 2, displayW, displayH)
      return
    }
  }

  // 2) fallback convenience: id -> specific asset name
  if (id === 'stage1-npc1') {
    const img = assetFor('stage1Npc1')
    if (img) {
      const displayW = Math.min(128, img.width)
      const displayH = Math.round((img.height / img.width) * displayW)
      ctx.drawImage(img, x - displayW / 2, y - displayH / 2, displayW, displayH)
      return
    }
  }
  if (id === 'stage1-npc2') {
    const img = assetFor('stage1Npc2')
    if (img) {
      const displayW = Math.min(128, img.width)
      const displayH = Math.round((img.height / img.width) * displayW)
      ctx.drawImage(img, x - displayW / 2, y - displayH / 2, displayW, displayH)
      return
    }
  }
  if (id === 'stage1-npc3') {
    const img = assetFor('stage1Npc3')
    if (img) {
      const displayW = Math.min(128, img.width)
      const displayH = Math.round((img.height / img.width) * displayW)
      ctx.drawImage(img, x - displayW / 2, y - displayH / 2, displayW, displayH)
      return
    }
  }
  if (id === 'stage1-npc4') {
    const img = assetFor('stage1Npc4')
    if (img) {
      const displayW = Math.min(128, img.width)
      const displayH = Math.round((img.height / img.width) * displayW)
      ctx.drawImage(img, x - displayW / 2, y - displayH / 2, displayW, displayH)
      return
    }
  }

  if (id === 'stage2-npc1') {
    const img = assetFor('stage2Npc1')
    if (img) {
      const displayW = Math.min(128, img.width)
      const displayH = Math.round((img.height / img.width) * displayW)
      ctx.drawImage(img, x - displayW / 2, y - displayH / 2, displayW, displayH)
      return
    }
  }

  // 3) final fallback: draw circular placeholder
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

// draw player (placeholder)
export function drawPlayer(
  ctx: CanvasRenderingContext2D,
  p: { x: number; y: number; w: number; h: number },
  assets?: Assets
) {
  // if we have an image, draw it stretched into the player's box
  if (assets?.player1) {
    // Option A: drawImage stretched to player's rectangle (keeps top-left anchor)
    ctx.drawImage(assets.player1, p.x, p.y, p.w, p.h)
    return
  }
}

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
