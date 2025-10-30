import type { Player } from './update'
import type { LoaderImageAssets, StageConfig } from '../types'
import {
  drawBackground,
  drawGates,
  drawHUD,
  drawNPC,
  drawPlayer,
} from '../renderer'

const WIDTH = 960
const HEIGHT = 540

export function drawScene(
  ctx: CanvasRenderingContext2D,
  stage: StageConfig,
  player: Player,
  answered: Set<string>,
  assets: LoaderImageAssets | undefined
) {
  ctx.clearRect(0, 0, WIDTH, HEIGHT)
  drawBackground(
    ctx,
    stage,
    (assets as LoaderImageAssets) ?? ({} as LoaderImageAssets),
    WIDTH,
    HEIGHT
  )

  drawGates(ctx, stage.gates ?? [], answered)

  for (const n of stage.npcs ?? []) {
    drawNPC(ctx, n.x, n.y, answered.has(n.id), stage, assets, WIDTH, HEIGHT, n)
  }

  drawPlayer(ctx, player, assets as LoaderImageAssets)

  const total = (stage.gates ?? []).length + (stage.npcs ?? []).length
  const req = stage.requiredToAdvance ?? total
  drawHUD(ctx, stage.name, answered.size, req, total)

  const cx = player.x + player.w / 2
  const cy = player.y + player.h / 2
  const nearNpc = (stage.npcs ?? []).find(
    (n) =>
      !answered.has(n.id) &&
      Math.hypot(cx - n.x, cy - n.y) <= (n.talkRadius ?? 80)
  )
  if (nearNpc) {
    ctx.save()
    ctx.font = '14px system-ui, -apple-system, Segoe UI, Roboto, sans-serif'
    ctx.fillStyle = '#d73636ff'
    ctx.shadowColor = 'rgba(0,0,0,0.7)'
    ctx.shadowBlur = 8
    ctx.fillText('Press E to talk', nearNpc.x - 40, nearNpc.y - 48)
    ctx.restore()
  }
}
