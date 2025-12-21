import type { StageConfig, LoaderImageAssets } from '../types'

export function drawBackground(
  ctx: CanvasRenderingContext2D,
  stage: StageConfig,
  assets: LoaderImageAssets,
  width: number,
  height: number
) {
  const key = stage.background as keyof LoaderImageAssets
  const img = assets?.[key] as HTMLImageElement | undefined

  // helper: cover-style center crop
  const drawCover = (image: HTMLImageElement) => {
    const scale = Math.max(width / image.width, height / image.height)
    const sw = width / scale
    const sh = height / scale
    const sx = Math.max(0, (image.width - sw) / 2)
    const sy = Math.max(0, (image.height - sh) / 2)
    ctx.drawImage(image, sx, sy, sw, sh, 0, 0, width, height)
  }

  // 1) preferred: draw stage.background if it exists
  if (img) {
    drawCover(img)
    return
  }

  // 2) fallback: try stage1Background..stage12Background automatically
  // (useful if stage.background is missing/wrong)
  for (let s = 1; s <= 12; s++) {
    const fallbackKey = `stage${s}Background` as keyof LoaderImageAssets
    const fallbackImg = assets?.[fallbackKey] as HTMLImageElement | undefined
    if (fallbackImg) {
      drawCover(fallbackImg)
      return
    }
  }

  // 3) final fallback: solid color (so canvas isn't blank)
  ctx.save()
  ctx.fillStyle = '#000'
  ctx.fillRect(0, 0, width, height)
  ctx.restore()
}
