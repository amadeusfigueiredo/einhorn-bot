import type { StageConfig, LoaderImageAssets } from '../types'

export function drawBackground(
  ctx: CanvasRenderingContext2D,
  stage: StageConfig,
  assets: LoaderImageAssets,
  width: number,
  height: number
) {
  if (stage.background === 'stage1Background' && assets.stage1Background) {
    const img = assets.stage1Background
    const scale = Math.max(width / img.width, height / img.height)
    const sw = width / scale
    const sh = height / scale
    const sx = Math.max(0, (img.width - sw) / 2)
    const sy = Math.max(0, (img.height - sh) / 2)
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, width, height)
    return
  }

  if (stage.background === 'stage2Background' && assets.stage2Background) {
    const img = assets.stage2Background
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
  } else {
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
