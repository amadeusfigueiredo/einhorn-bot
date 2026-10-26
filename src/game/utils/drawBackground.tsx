import type { StageConfig, LoaderImageAssets } from '../types'
import { CLASSROOMS } from '../data/classrooms'
import { drawRoomBackground } from './drawRoomBackground'

export function drawBackground(
  ctx: CanvasRenderingContext2D,
  stage: StageConfig,
  assets: LoaderImageAssets,
  width: number,
  height: number
) {
  const key = stage.background as keyof LoaderImageAssets | undefined
  const img = key ? (assets?.[key] as HTMLImageElement | undefined) : undefined

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

  // 2) no picture (stages 13 to 15 have none of their own, or it has not loaded yet): the room drawn in code,
  // from the same description the 3D classroom is built from.
  const room = CLASSROOMS[stage.name]
  if (room) {
    drawRoomBackground(ctx, room, width, height)
    return
  }

  // 3) final fallback: solid color (so canvas isn't blank)
  ctx.save()
  ctx.fillStyle = '#000'
  ctx.fillRect(0, 0, width, height)
  ctx.restore()
}
